import { D1_TABLES } from '../constants/d1';
import { COMMERCIAL_WORKFLOW } from '../constants/commercialWorkflow';
import {
  commercialOtpRequestSchema, commercialOtpVerifySchema, upgradeCodeLoginSchema,
  upgradeRequestQuerySchema, upgradeRequestSchema
} from '../constants/commercialValidation';
import { AUTH_TOKEN_EXPIRY_SECONDS } from '../constants/auth';
import type { AuthRouteResult, CloudflareEnvironment } from '../types/cloudflare';
import type { UpgradeRequestD1Row } from '../types/commercialWorkflow';
import { createWorkerAuthToken } from '../workerAuth';
import logger from '../utils/logger';
import {
  authorizeCommercialAdmin, commercialResult, createOneTimeCode, createOtp, d1ChangedRows,
  readCommercialBody, secureEquals, sendCommercialEmail, sha256Hex, verifyCommercialOtp
} from './workerCommercialShared';

const publicUpgradeColumns = `id, customer_user_id, customer_name, customer_email, customer_phone, company_name,
  company_details, current_tier, requested_tier, requirements_note, status, code_generated_at,
  code_expires_at, code_redeemed_at, created_at, updated_at`;

const issueUpgradeOtp = async (
  request: Request, environment: CloudflareEnvironment, requestId: string
): Promise<AuthRouteResult> => {
  const authorized = await authorizeCommercialAdmin(request, environment);
  if (authorized.result) return authorized.result;
  const { actor, db } = authorized;
  const record = await db.prepare(`SELECT id, status, customer_email FROM ${D1_TABLES.upgradeRequests} WHERE id = ?`)
    .bind(requestId).first<Pick<UpgradeRequestD1Row, 'id' | 'status' | 'customer_email'>>();
  if (!record) return commercialResult({ success: false, message: 'Upgrade request was not found.' }, 404);
  if (record.status !== COMMERCIAL_WORKFLOW.upgradeStatus.PENDING) {
    return commercialResult({ success: false, message: 'Only pending upgrade requests can be approved.' }, 409);
  }
  const otp = createOtp();
  const sessionId = `otp-${crypto.randomUUID()}`;
  const delivery = await sendCommercialEmail(
    environment,
    actor.email,
    'Upgrade approval verification code',
    `Use this one-time code to approve the upgrade request. It expires in five minutes: ${otp}`,
    otp
  );
  if (!delivery.sent && !delivery.developmentHint) {
    return commercialResult({ success: false, message: delivery.message || 'Unable to deliver the admin verification code.' }, 503);
  }
  const now = new Date().toISOString();
  await db.prepare(`
    INSERT INTO ${D1_TABLES.adminOtpSessions}
      (id, purpose, request_id, requested_by, otp_hash, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    sessionId, COMMERCIAL_WORKFLOW.otpPurpose.UPGRADE, requestId, actor.id,
    await sha256Hex(otp), Date.now() + COMMERCIAL_WORKFLOW.otpTtlSeconds * 1000, now
  ).run();
  logger.info('Upgrade approval OTP session created', { requestId, actorId: actor.id, deliverySent: delivery.sent });
  return commercialResult({
    success: true,
    request_id: requestId,
    session_id: sessionId,
    ...(delivery.developmentHint ? { otp_hint: delivery.developmentHint } : {})
  }, 200);
};

const listUpgradeRequests = async (
  request: Request, environment: CloudflareEnvironment, url: URL
): Promise<AuthRouteResult> => {
  const authorized = await authorizeCommercialAdmin(request, environment);
  if (authorized.result) return authorized.result;
  const { db } = authorized;
  const parsed = upgradeRequestQuerySchema.safeParse({ status: url.searchParams.get('status') || undefined });
  if (!parsed.success) return commercialResult({ success: false, message: 'Invalid upgrade request status filter.', errors: parsed.error.issues }, 400);
  const status = parsed.data.status;
  const rows = await db.prepare(`
    SELECT ${publicUpgradeColumns} FROM ${D1_TABLES.upgradeRequests}
    ${status && status !== 'ALL' ? 'WHERE status = ?' : ''} ORDER BY created_at DESC LIMIT 500
  `).bind(...(status && status !== 'ALL' ? [status] : [])).all<UpgradeRequestD1Row>();
  return commercialResult({ success: true, requests: rows?.results || [] }, 200);
};

const resolveUpgradeSessionId = async (
  db: NonNullable<CloudflareEnvironment['DB']>, requestId: string, sessionId: string | undefined
): Promise<string> => {
  if (sessionId) return sessionId;
  const row = await db.prepare(`
    SELECT id FROM ${D1_TABLES.adminOtpSessions}
    WHERE request_id = ? AND purpose = ? ORDER BY created_at DESC LIMIT 1
  `).bind(requestId, COMMERCIAL_WORKFLOW.otpPurpose.UPGRADE).first<{ id: string }>();
  return row?.id || '';
};

const findUpgradeForSession = async (
  db: NonNullable<CloudflareEnvironment['DB']>, requestId: string, sessionId: string
): Promise<UpgradeRequestD1Row | null> => {
  const sessionRequestId = requestId ? null : (await db.prepare(`SELECT request_id FROM ${D1_TABLES.adminOtpSessions} WHERE id = ?`)
    .bind(sessionId).first<{ request_id: string | null }>())?.request_id;
  const id = requestId || sessionRequestId || '';
  if (!id) return null;
  return db.prepare(`SELECT * FROM ${D1_TABLES.upgradeRequests} WHERE id = ?`)
    .bind(id).first<UpgradeRequestD1Row>();
};

const issueCustomerUpgradeCode = async (
  environment: CloudflareEnvironment, db: NonNullable<CloudflareEnvironment['DB']>, actorId: string, record: UpgradeRequestD1Row
): Promise<AuthRouteResult> => {
  const code = createOneTimeCode();
  const expiresAt = Date.now() + COMMERCIAL_WORKFLOW.upgradeCodeTtlSeconds * 1000;
  const delivery = await sendCommercialEmail(
    environment,
    record.customer_email,
    'Your subscription upgrade access code',
    `Use this one-time access code to sign in and activate your ${record.requested_tier} tier. The code expires in 24 hours: ${code}`,
    code
  );
  if (!delivery.sent && !delivery.developmentHint) {
    return commercialResult({ success: false, message: delivery.message || 'Unable to deliver the customer upgrade code.' }, 503);
  }
  const now = new Date().toISOString();
  const updated = await db.prepare(`
    UPDATE ${D1_TABLES.upgradeRequests}
    SET status = ?, generated_unique_code_hash = ?, code_generated_at = ?, code_expires_at = ?, updated_at = ?
    WHERE id = ? AND status = ?
  `).bind(
    COMMERCIAL_WORKFLOW.upgradeStatus.CODE_SENT, await sha256Hex(code), now, expiresAt, now,
    record.id, COMMERCIAL_WORKFLOW.upgradeStatus.PENDING
  ).run();
  if (d1ChangedRows(updated) !== 1) return commercialResult({ success: false, message: 'The upgrade request changed while approval was being completed.' }, 409);
  logger.info('Upgrade access code issued to customer', { requestId: record.id, actorId });
  return commercialResult({
    success: true,
    request_id: record.id,
    status: COMMERCIAL_WORKFLOW.upgradeStatus.CODE_SENT,
    ...(delivery.developmentHint ? { development_code: delivery.developmentHint } : {})
  }, 200);
};

const verifyUpgradeOtp = async (
  request: Request, db: NonNullable<CloudflareEnvironment['DB']>
): Promise<AuthRouteResult | UpgradeRequestD1Row> => {
  const parsed = commercialOtpVerifySchema.safeParse(await readCommercialBody(request));
  if (!parsed.success) return commercialResult({ success: false, message: 'Validation failed', errors: parsed.error.issues }, 400);
  const requestId = parsed.data.request_id || parsed.data.requestId || '';
  const sessionId = await resolveUpgradeSessionId(db, requestId, parsed.data.otp_session_id);
  const otp = parsed.data.otp || parsed.data.otp_code || '';
  const verified = sessionId && await verifyCommercialOtp(db, sessionId, COMMERCIAL_WORKFLOW.otpPurpose.UPGRADE, otp);
  if (!verified) return commercialResult({ success: false, message: 'The admin verification code is invalid, expired, or already used.' }, 401);
  const record = await findUpgradeForSession(db, requestId, sessionId);
  if (!record || record.status !== COMMERCIAL_WORKFLOW.upgradeStatus.PENDING) {
    return commercialResult({ success: false, message: 'The upgrade request is no longer awaiting approval.' }, 409);
  }
  if (record.requested_tier === 'ENTERPRISE') {
    return commercialResult({ success: false, message: 'Enterprise upgrades require manual subscription provisioning.' }, 409);
  }
  return record;
};

const verifyUpgradeOtpAndSendCode = async (
  request: Request, environment: CloudflareEnvironment
): Promise<AuthRouteResult> => {
  const authorized = await authorizeCommercialAdmin(request, environment);
  if (authorized.result) return authorized.result;
  const { actor, db } = authorized;
  const verified = await verifyUpgradeOtp(request, db);
  if ('body' in verified) return verified;
  return issueCustomerUpgradeCode(environment, db, actor.id, verified);
};

const findValidUpgradeCode = async (
  db: NonNullable<CloudflareEnvironment['DB']>, email: string, codeHash: string
): Promise<UpgradeRequestD1Row | null> => {
  const record = await db.prepare(`
    SELECT * FROM ${D1_TABLES.upgradeRequests}
    WHERE lower(customer_email) = lower(?) AND status = ?
    ORDER BY created_at DESC LIMIT 1
  `).bind(email, COMMERCIAL_WORKFLOW.upgradeStatus.CODE_SENT).first<UpgradeRequestD1Row>();
  if (!record?.generated_unique_code_hash || !secureEquals(record.generated_unique_code_hash, codeHash) ||
      !record.code_expires_at || record.code_expires_at <= Date.now()) return null;
  return record;
};

const redeemUpgradeCode = async (
  db: NonNullable<CloudflareEnvironment['DB']>, record: UpgradeRequestD1Row, userId: string, codeHash: string
): Promise<boolean> => {
  const now = new Date().toISOString();
  const updated = await db.prepare(`
    UPDATE ${D1_TABLES.upgradeRequests} SET status = ?, code_redeemed_at = ?, updated_at = ?
    WHERE id = ? AND generated_unique_code_hash = ? AND status = ? AND code_expires_at > ?
  `).bind(
    COMMERCIAL_WORKFLOW.upgradeStatus.COMPLETED, now, now, record.id, codeHash,
    COMMERCIAL_WORKFLOW.upgradeStatus.CODE_SENT, Date.now()
  ).run();
  if (d1ChangedRows(updated) !== 1) return false;
  await db.prepare('UPDATE User SET subscription_tier = ?, updated_at = ? WHERE id = ?')
    .bind(record.requested_tier, now, userId).run();
  return true;
};

const loginWithUpgradeCode = async (
  request: Request, environment: CloudflareEnvironment
): Promise<AuthRouteResult> => {
  if (!environment.DB || !environment.AUTH_SECRET) return commercialResult({ success: false, message: 'D1 and authentication configuration are required.' }, 503);
  const parsed = upgradeCodeLoginSchema.safeParse(await readCommercialBody(request));
  if (!parsed.success) return commercialResult({ success: false, message: 'Validation failed', errors: parsed.error.issues }, 400);
  const codeHash = await sha256Hex(parsed.data.code);
  const record = await findValidUpgradeCode(environment.DB, parsed.data.email, codeHash);
  if (!record) return commercialResult({ success: false, message: 'The upgrade code is invalid or expired. Ask the commercial administrator to issue a new code.' }, 401);
  const user = await environment.DB.prepare(
    'SELECT id, name, email, role, status, subscription_tier FROM User WHERE lower(email) = lower(?)'
  ).bind(parsed.data.email).first<Record<string, unknown>>();
  if (!user?.id || user.status !== 'ACTIVE') {
    return commercialResult({ success: false, message: 'Register an active account with this email before redeeming the upgrade code.' }, 404);
  }
  if (!await redeemUpgradeCode(environment.DB, record, String(user.id), codeHash)) {
    return commercialResult({ success: false, message: 'The upgrade code was already redeemed or expired.' }, 409);
  }
  const upgradedUser = { ...user, subscription_tier: record.requested_tier };
  logger.info('Customer redeemed subscription upgrade code', { requestId: record.id, customerId: user.id });
  return commercialResult({
    success: true,
    request_id: record.id,
    user: upgradedUser,
    token: await createWorkerAuthToken(upgradedUser, environment.AUTH_SECRET),
    expires_in_seconds: AUTH_TOKEN_EXPIRY_SECONDS
  }, 200);
};

const createUpgradeRequest = async (
  request: Request, environment: CloudflareEnvironment
): Promise<AuthRouteResult> => {
  if (!environment.DB) return commercialResult({ success: false, message: 'Cloudflare D1 is not configured.' }, 503);
  const parsed = upgradeRequestSchema.safeParse(await readCommercialBody(request));
  if (!parsed.success) return commercialResult({ success: false, message: 'Validation failed', errors: parsed.error.issues }, 400);
  const duplicate = await environment.DB.prepare(`
    SELECT id FROM ${D1_TABLES.upgradeRequests} WHERE lower(customer_email) = lower(?)
    AND status IN (?, ?) ORDER BY created_at DESC LIMIT 1
  `).bind(parsed.data.customer_email, COMMERCIAL_WORKFLOW.upgradeStatus.PENDING,
    COMMERCIAL_WORKFLOW.upgradeStatus.CODE_SENT).first<{ id: string }>();
  if (duplicate) return commercialResult({ success: false, message: 'An upgrade request is already awaiting action for this email.', request_id: duplicate.id }, 409);
  const id = `upgrade-${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  await environment.DB.prepare(`
    INSERT INTO ${D1_TABLES.upgradeRequests}
      (id, customer_name, customer_email, customer_phone, company_name, company_details,
       current_tier, requested_tier, requirements_note, created_at, updated_at)
    VALUES (?, ?, lower(?), ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, parsed.data.customer_name, parsed.data.customer_email, parsed.data.customer_phone,
    parsed.data.company_name, parsed.data.company_details || null, parsed.data.current_tier,
    parsed.data.requested_tier, parsed.data.requirements_note || null, now, now
  ).run();
  logger.info('Customer submitted subscription upgrade request', { requestId: id, requestedTier: parsed.data.requested_tier });
  return commercialResult({ success: true, request_id: id, status: COMMERCIAL_WORKFLOW.upgradeStatus.PENDING }, 201);
};

export const handleUpgradeRoute = async (
  request: Request, environment: CloudflareEnvironment, url: URL
): Promise<AuthRouteResult | null> => {
  switch (`${request.method} ${url.pathname}`) {
    case 'POST /api/upgrade/request':
      return createUpgradeRequest(request, environment);
    case 'POST /api/upgrade/login-with-code':
      return loginWithUpgradeCode(request, environment);
    case 'GET /api/upgrade/requests':
      return listUpgradeRequests(request, environment, url);
    case 'POST /api/upgrade/generate-otp':
    case 'POST /api/upgrade/admin/request-otp': {
    const parsed = commercialOtpRequestSchema.safeParse(await readCommercialBody(request));
    if (!parsed.success) return commercialResult({ success: false, message: 'Validation failed', errors: parsed.error.issues }, 400);
    const requestId = parsed.data.request_id || parsed.data.requestId;
    if (!requestId) return commercialResult({ success: false, message: 'An upgrade request ID is required.' }, 400);
    return issueUpgradeOtp(request, environment, requestId);
    }
    case 'POST /api/upgrade/admin/verify-otp-and-generate-code':
      return verifyUpgradeOtpAndSendCode(request, environment);
    default:
      return null;
  }
};
