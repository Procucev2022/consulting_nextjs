import { AUTH_TOKEN_EXPIRY_SECONDS } from '../constants/auth';
import { COMMERCIAL_WORKFLOW } from '../constants/commercialWorkflow';
import { D1_TABLES } from '../constants/d1';
import { upgradeCodeLoginSchema } from '../constants/commercialValidation';
import type { AuthRouteResult, CloudflareEnvironment } from '../types/cloudflare';
import type {
  UpgradeCodeLoginPreflight, UpgradeCodeLoginUser, UpgradeRedemptionOutcome, UpgradeRequestD1Row
} from '../types/commercialWorkflow';
import { createWorkerAuthToken } from '../workerAuth';
import logger from '../utils/logger';
import { commercialResult, readCommercialBody, secureEquals, sha256Hex } from './workerCommercialShared';
import { redeemUpgradeCode } from './workerCommercialUpgradeRedemption';

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

const validateUpgradeCustomer = (
  request: Request, record: UpgradeRequestD1Row, user: Record<string, unknown> | null
): AuthRouteResult | null => {
  if (!user?.id || user.status !== 'ACTIVE') {
    return commercialResult({
      success: false,
      message: 'Register an active account with this email before redeeming the upgrade code.'
    }, 404);
  }
  if (user.role !== 'USER' || typeof user.tenant_id !== 'string' || !user.tenant_id || user.tenant_status !== 'ACTIVE') {
    logger.warn('Upgrade code redemption rejected for an account without an active customer tenant', {
      requestId: request.headers.get('x-request-id') || undefined,
      upgradeRequestId: record.id,
      userId: user.id,
      role: user.role,
      tenantAssigned: Boolean(user.tenant_id),
      tenantStatus: user.tenant_status
    });
    return commercialResult({
      success: false,
      message: COMMERCIAL_WORKFLOW.upgradeMessages.activeTenantRequired
    }, 403);
  }
  return null;
};

const getUpgradeCodeLoginPreflight = async (
  request: Request, environment: CloudflareEnvironment
): Promise<UpgradeCodeLoginPreflight> => {
  if (!environment.DB || !environment.AUTH_SECRET) return {
    ok: false,
    result: commercialResult({ success: false, message: 'D1 and authentication configuration are required.' }, 503)
  };
  const parsed = upgradeCodeLoginSchema.safeParse(await readCommercialBody(request));
  if (!parsed.success) return {
    ok: false,
    result: commercialResult({ success: false, message: 'Validation failed', errors: parsed.error.issues }, 400)
  };
  const codeHash = await sha256Hex(parsed.data.code);
  const record = await findValidUpgradeCode(environment.DB, parsed.data.email, codeHash);
  if (!record) return {
    ok: false,
    result: commercialResult({
      success: false,
      message: 'The upgrade code is invalid or expired. Ask the commercial administrator to issue a new code.'
    }, 401)
  };
  const user = await environment.DB.prepare(`
    SELECT User.id, User.name, User.email, User.role, User.status, User.subscription_tier,
      User.tenant_id, TenantMaster.status AS tenant_status
    FROM User LEFT JOIN TenantMaster ON TenantMaster.tenant_id = User.tenant_id
    WHERE lower(User.email) = lower(?)
  `).bind(parsed.data.email).first<Record<string, unknown>>();
  const customerFailure = validateUpgradeCustomer(request, record, user);
  if (customerFailure) return { ok: false, result: customerFailure };
  return { ok: true, record, user: user as UpgradeCodeLoginUser, codeHash };
};

const getUpgradeRedemptionFailure = (outcome: UpgradeRedemptionOutcome): AuthRouteResult | null => {
  switch (outcome) {
    case COMMERCIAL_WORKFLOW.upgradeRedemption.UNAVAILABLE:
      return commercialResult({
        success: false,
        message: COMMERCIAL_WORKFLOW.upgradeMessages.atomicBatchUnavailable
      }, 503);
    case COMMERCIAL_WORKFLOW.upgradeRedemption.CONFLICT:
      return commercialResult({
        success: false,
        message: COMMERCIAL_WORKFLOW.upgradeMessages.concurrentChange
      }, 409);
    case COMMERCIAL_WORKFLOW.upgradeRedemption.INVARIANT_FAILURE:
      return commercialResult({
        success: false,
        message: COMMERCIAL_WORKFLOW.upgradeMessages.atomicInvariantFailed
      }, 500);
    case COMMERCIAL_WORKFLOW.upgradeRedemption.REDEEMED:
      return null;
  }
};

export const handleUpgradeCodeLogin = async (
  request: Request, environment: CloudflareEnvironment
): Promise<AuthRouteResult> => {
  const preflight = await getUpgradeCodeLoginPreflight(request, environment);
  if (!preflight.ok) return preflight.result;
  const { record, user, codeHash } = preflight;
  const redemption = await redeemUpgradeCode(
    environment.DB as NonNullable<CloudflareEnvironment['DB']>, record, user.id,
    user.tenant_id, codeHash, request.headers.get('x-request-id') || undefined
  );
  const failure = getUpgradeRedemptionFailure(redemption);
  if (failure) return failure;
  const upgradedUser = { ...user, subscription_tier: record.requested_tier };
  logger.info('Customer redeemed subscription upgrade code', {
    requestId: request.headers.get('x-request-id') || undefined,
    upgradeRequestId: record.id,
    customerId: user.id,
    tenantId: user.tenant_id
  });
  return commercialResult({
    success: true,
    request_id: record.id,
    user: upgradedUser,
    token: await createWorkerAuthToken(upgradedUser, environment.AUTH_SECRET as string),
    expires_in_seconds: AUTH_TOKEN_EXPIRY_SECONDS
  }, 200);
};
