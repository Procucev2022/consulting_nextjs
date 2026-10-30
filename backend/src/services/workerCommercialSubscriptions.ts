import { D1_TABLES } from '../constants/d1';
import { COMMERCIAL_WORKFLOW } from '../constants/commercialWorkflow';
import {
  commercialOtpRequestSchema, subscriptionProvisionSchema, subscriptionStatusSchema
} from '../constants/commercialValidation';
import type { AuthRouteResult, CloudflareEnvironment } from '../types/cloudflare';
import type { AdminOtpSessionD1Row, SubscriptionRecordD1Row } from '../types/commercialWorkflow';
import logger from '../utils/logger';
import {
  authorizeCommercialAdmin, commercialResult, createOtp,
  readCommercialBody, sendCommercialEmail, sha256Hex, toPublicSubscription, verifyCommercialOtp
} from './workerCommercialShared';

const issueProvisionOtp = async (
  request: Request, environment: CloudflareEnvironment
): Promise<AuthRouteResult> => {
  const authorized = await authorizeCommercialAdmin(request, environment);
  if (authorized.result) return authorized.result;
  const { actor, db } = authorized;
  const parsed = commercialOtpRequestSchema.safeParse(await readCommercialBody(request));
  if (!parsed.success || !parsed.data.customer_id) {
    return commercialResult({ success: false, message: 'A registered customer ID is required for subscription provisioning authorization.', errors: parsed.success ? [] : parsed.error.issues }, 400);
  }
  const customer = await db.prepare('SELECT id FROM User WHERE id = ?').bind(parsed.data.customer_id).first<{ id: string }>();
  if (!customer) return commercialResult({ success: false, message: 'Register the customer account before requesting provisioning authorization.' }, 404);
  const otp = createOtp();
  const sessionId = `otp-${crypto.randomUUID()}`;
  const delivery = await sendCommercialEmail(
    environment,
    actor.email,
    'Subscription provisioning authorization code',
    `Use this one-time code to authorize payment-confirmed subscription provisioning. It expires in five minutes: ${otp}`,
    otp
  );
  if (!delivery.sent && !delivery.developmentHint) {
    return commercialResult({ success: false, message: delivery.message || 'Unable to deliver the admin verification code.' }, 503);
  }
  const createdAt = new Date().toISOString();
  await db.prepare(`
    INSERT INTO ${D1_TABLES.adminOtpSessions}
      (id, purpose, customer_id, requested_by, otp_hash, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    sessionId, COMMERCIAL_WORKFLOW.otpPurpose.PROVISION, customer.id, actor.id,
    await sha256Hex(otp), Date.now() + COMMERCIAL_WORKFLOW.otpTtlSeconds * 1000, createdAt
  ).run();
  logger.info('Subscription provisioning OTP session created', { customerId: customer.id, actorId: actor.id, deliverySent: delivery.sent });
  return commercialResult({
    success: true,
    session_id: sessionId,
    ...(delivery.developmentHint ? { otp_hint: delivery.developmentHint } : {})
  }, 200);
};

const provisionSubscription = async (
  request: Request, environment: CloudflareEnvironment
): Promise<AuthRouteResult> => {
  const authorized = await authorizeCommercialAdmin(request, environment);
  if (authorized.result) return authorized.result;
  const { actor, db } = authorized;
  const parsed = subscriptionProvisionSchema.safeParse(await readCommercialBody(request));
  if (!parsed.success) return commercialResult({ success: false, message: 'Validation failed', errors: parsed.error.issues }, 400);
  const customer = await db.prepare('SELECT id, email, name, company_name FROM User WHERE id = ?')
    .bind(parsed.data.customer_id).first<Record<string, unknown>>();
  if (!customer || String(customer.email).toLowerCase() !== parsed.data.customer_email.toLowerCase()) {
    return commercialResult({ success: false, message: 'Customer ID and registered email must identify the same active account.' }, 404);
  }
  const otpSession = await db.prepare(`
    SELECT id FROM ${D1_TABLES.adminOtpSessions}
    WHERE id = ? AND customer_id = ? AND purpose = ?
  `).bind(
    parsed.data.otp_session_id, parsed.data.customer_id, COMMERCIAL_WORKFLOW.otpPurpose.PROVISION
  ).first<Pick<AdminOtpSessionD1Row, 'id'>>();
  if (!otpSession || !await verifyCommercialOtp(
    db, otpSession.id, COMMERCIAL_WORKFLOW.otpPurpose.PROVISION, parsed.data.otp_code
  )) return commercialResult({ success: false, message: 'The provisioning authorization code is invalid, expired, or already used.' }, 401);
  const nowDate = new Date();
  const now = nowDate.toISOString();
  const endDate = new Date(
    nowDate.getTime() + COMMERCIAL_WORKFLOW.subscriptionTermDays * COMMERCIAL_WORKFLOW.millisecondsPerDay
  ).toISOString();
  const subscriptionId = `sub-${crypto.randomUUID()}`;
  await db.prepare('INSERT INTO TenantMaster (tenant_id, enterprise_name) VALUES (?, ?) ON CONFLICT(tenant_id) DO NOTHING')
    .bind(parsed.data.tenant_id, parsed.data.company_name).run();
  const subscription = {
    id: subscriptionId,
    tenant_id: parsed.data.tenant_id,
    customer_id: parsed.data.customer_id,
    customer_email: parsed.data.customer_email.toLowerCase(),
    customer_name: parsed.data.customer_name,
    company_name: parsed.data.company_name,
    tier: parsed.data.tier,
    status: COMMERCIAL_WORKFLOW.subscriptionStatus.ACTIVE,
    commercial_status: COMMERCIAL_WORKFLOW.commercialStatus.COMPLETED,
    payment_reference: parsed.data.payment_reference,
    payment_confirmed: 1,
    start_date: now,
    end_date: endDate,
    provisioned_by: actor.id,
    provisioned_at: now,
    activated_by: actor.id,
    activated_at: now,
    created_at: now,
    updated_at: now
  };
  const existing = await db.prepare(`
    SELECT id FROM ${D1_TABLES.subscriptionRecords}
    WHERE lower(customer_email) = lower(?) AND status IN (?, ?) LIMIT 1
  `).bind(
    parsed.data.customer_email,
    COMMERCIAL_WORKFLOW.subscriptionStatus.ACTIVE,
    COMMERCIAL_WORKFLOW.subscriptionStatus.PENDING
  ).first<{ id: string }>();
  if (existing) return commercialResult({ success: false, message: 'This customer already has an active or pending paid subscription.' }, 409);
  await db.prepare(`
    INSERT INTO ${D1_TABLES.subscriptionRecords}
      (id, tenant_id, customer_id, customer_email, customer_name, company_name, tier, status,
       commercial_status, payment_reference, payment_confirmed, start_date, end_date,
       provisioned_by, provisioned_at, activated_by, activated_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    subscription.id, subscription.tenant_id, subscription.customer_id, subscription.customer_email,
    subscription.customer_name, subscription.company_name, subscription.tier, subscription.status,
    subscription.commercial_status, subscription.payment_reference, subscription.payment_confirmed,
    subscription.start_date, subscription.end_date, subscription.provisioned_by, subscription.provisioned_at,
    subscription.activated_by, subscription.activated_at, subscription.created_at, subscription.updated_at
  ).run();
  await db.prepare('UPDATE User SET subscription_tier = ?, updated_at = ? WHERE id = ?')
    .bind(subscription.tier, now, customer.id).run();
  await db.prepare(`
    INSERT INTO ${D1_TABLES.subscriptionAuditEvents}
      (id, timestamp, subscription_id, tenant_id, actor, actor_role, action, result, details_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    `audit-${crypto.randomUUID()}`, now, subscription.id, subscription.tenant_id, actor.email,
    'ADMIN', 'SUBSCRIPTION_PROVISIONED', 'SUCCESS', JSON.stringify({ tier: subscription.tier, payment_reference: subscription.payment_reference })
  ).run();
  logger.info('Paid subscription provisioned', {
    subscriptionId, customerId: customer.id, tier: subscription.tier, actorId: actor.id
  });
  return commercialResult({ success: true, subscription: toPublicSubscription(subscription) }, 201);
};

const listSubscriptions = async (
  request: Request, environment: CloudflareEnvironment
): Promise<AuthRouteResult> => {
  const authorized = await authorizeCommercialAdmin(request, environment);
  if (authorized.result) return authorized.result;
  const { db } = authorized;
  const rows = await db.prepare(`
    SELECT * FROM ${D1_TABLES.subscriptionRecords} ORDER BY created_at DESC LIMIT 500
  `).all<SubscriptionRecordD1Row>();
  return commercialResult({ success: true, subscriptions: (rows?.results || []).map(toPublicSubscription) }, 200);
};

const listSubscriptionAudit = async (
  request: Request, environment: CloudflareEnvironment, url: URL
): Promise<AuthRouteResult> => {
  const authorized = await authorizeCommercialAdmin(request, environment);
  if (authorized.result) return authorized.result;
  const { db } = authorized;
  const subscriptionId = url.searchParams.get('subscription_id')?.trim();
  const rows = await db.prepare(`
    SELECT * FROM ${D1_TABLES.subscriptionAuditEvents}
    ${subscriptionId ? 'WHERE subscription_id = ?' : ''} ORDER BY timestamp DESC LIMIT 500
  `).bind(...(subscriptionId ? [subscriptionId] : [])).all<Record<string, unknown>>();
  const events = (rows?.results || []).map((row) => ({
    ...row,
    details: typeof row.details_json === 'string' ? JSON.parse(row.details_json) : undefined
  }));
  return commercialResult({ success: true, audit_events: events }, 200);
};

const updateSubscriptionStatus = async (
  request: Request, environment: CloudflareEnvironment, subscriptionId: string
): Promise<AuthRouteResult> => {
  const authorized = await authorizeCommercialAdmin(request, environment);
  if (authorized.result) return authorized.result;
  const { actor, db } = authorized;
  const parsed = subscriptionStatusSchema.safeParse(await readCommercialBody(request));
  if (!parsed.success) return commercialResult({ success: false, message: 'Validation failed', errors: parsed.error.issues }, 400);
  const current = await db.prepare(`SELECT * FROM ${D1_TABLES.subscriptionRecords} WHERE id = ?`)
    .bind(subscriptionId).first<SubscriptionRecordD1Row>();
  if (!current) return commercialResult({ success: false, message: 'Subscription record was not found.' }, 404);
  const now = new Date().toISOString();
  await db.prepare(`UPDATE ${D1_TABLES.subscriptionRecords} SET status = ?, updated_at = ? WHERE id = ?`)
    .bind(parsed.data.status, now, subscriptionId).run();
  await db.prepare(`
    INSERT INTO ${D1_TABLES.subscriptionAuditEvents}
      (id, timestamp, subscription_id, tenant_id, actor, actor_role, action, result, details_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    `audit-${crypto.randomUUID()}`, now, subscriptionId, current.tenant_id, actor.email,
    'ADMIN', 'SUBSCRIPTION_STATUS_CHANGED', 'SUCCESS', JSON.stringify({ previous_status: current.status, status: parsed.data.status })
  ).run();
  logger.info('Subscription status changed', { subscriptionId, status: parsed.data.status, actorId: actor.id });
  return commercialResult({ success: true, message: 'Subscription status updated.', status: parsed.data.status }, 200);
};

const handleStaticSubscriptionRoute = async (
  request: Request, environment: CloudflareEnvironment, url: URL
): Promise<AuthRouteResult | null> => {
  if (url.pathname === '/api/subscription/admin/list' && request.method === 'GET') return listSubscriptions(request, environment);
  if (url.pathname === '/api/subscription/admin/audit-trail' && request.method === 'GET') {
    return listSubscriptionAudit(request, environment, url);
  }
  if (url.pathname === '/api/subscription/admin/request-otp' && request.method === 'POST') {
    return issueProvisionOtp(request, environment);
  }
  if (url.pathname === '/api/subscription/admin/provision' && request.method === 'POST') {
    return provisionSubscription(request, environment);
  }
  return null;
};

export const handleSubscriptionRoute = async (
  request: Request, environment: CloudflareEnvironment, url: URL
): Promise<AuthRouteResult | null> => {
  if (!url.pathname.startsWith('/api/subscription/admin/')) return null;
  if (!environment.DB) return commercialResult({ success: false, message: 'Cloudflare D1 is not configured.' }, 503);
  const staticRoute = await handleStaticSubscriptionRoute(request, environment, url);
  if (staticRoute) return staticRoute;
  const statusMatch = url.pathname.match(/^\/api\/subscription\/admin\/([^/]+)\/status$/);
  if (statusMatch && request.method === 'PATCH') return updateSubscriptionStatus(request, environment, decodeURIComponent(statusMatch[1]));
  return commercialResult({ success: false, message: 'Subscription administration route was not found.' }, 404);
};
