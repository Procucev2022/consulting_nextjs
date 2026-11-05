import { AUTH_ROLES, AUTH_STATUS } from '../constants/auth';
import { COMMERCIAL_WORKFLOW } from '../constants/commercialWorkflow';
import { D1_TABLES, TENANT_DATA_CLASSIFICATION } from '../constants/d1';
import type { AuthRouteResult, CloudflareD1Database } from '../types/cloudflare';
import type { AdminOtpSessionD1Row } from '../types/commercialWorkflow';
import type { SubscriptionProvisionInput } from '../types/validation';
import { commercialResult, verifyCommercialOtp } from './workerCommercialShared';

export const validateProvisioningCustomer = (
  customer: Record<string, unknown>,
  payload: SubscriptionProvisionInput
): AuthRouteResult | null => {
  if (customer.role !== AUTH_ROLES.USER) {
    return commercialResult({ success: false, message: COMMERCIAL_WORKFLOW.provisionMessages.userOnly }, 409);
  }
  if (![AUTH_STATUS.ACTIVE, AUTH_STATUS.PENDING].includes(String(customer.status) as 'ACTIVE' | 'PENDING')) {
    return commercialResult({ success: false, message: COMMERCIAL_WORKFLOW.provisionMessages.inactiveUser }, 409);
  }
  if (customer.tenant_id && customer.tenant_id !== payload.tenant_id) {
    return commercialResult({ success: false, message: COMMERCIAL_WORKFLOW.provisionMessages.tenantConflict }, 409);
  }
  return null;
};

export const validateProvisioningOtp = async (
  db: CloudflareD1Database,
  payload: SubscriptionProvisionInput
): Promise<AuthRouteResult | null> => {
  const session = await db.prepare(`
    SELECT id FROM ${D1_TABLES.adminOtpSessions}
    WHERE id = ? AND customer_id = ? AND purpose = ?
  `).bind(
    payload.otp_session_id, payload.customer_id, COMMERCIAL_WORKFLOW.otpPurpose.PROVISION
  ).first<Pick<AdminOtpSessionD1Row, 'id'>>();
  if (!session) {
    return commercialResult({ success: false, message: 'The provisioning authorization code is invalid, expired, or already used.' }, 401);
  }
  const verified = await verifyCommercialOtp(
    db, session.id, COMMERCIAL_WORKFLOW.otpPurpose.PROVISION, payload.otp_code
  );
  return verified ? null : commercialResult({
    success: false,
    message: 'The provisioning authorization code is invalid, expired, or already used.'
  }, 401);
};

export const validateProvisioningTenant = async (
  db: CloudflareD1Database,
  tenantId: string
): Promise<AuthRouteResult | null> => {
  const tenant = await db.prepare('SELECT tenant_id, status FROM TenantMaster WHERE tenant_id = ?')
    .bind(tenantId).first<{ tenant_id: string; status: string }>();
  if (tenant && tenant.status !== AUTH_STATUS.ACTIVE) {
    return commercialResult({ success: false, message: COMMERCIAL_WORKFLOW.provisionMessages.tenantUnavailable }, 409);
  }
  if (!tenant) return null;
  const provenance = await db.prepare(
    'SELECT classification FROM TenantDataProvenance WHERE tenant_id = ?'
  ).bind(tenant.tenant_id).first<{ classification: string }>();
  if (provenance?.classification === TENANT_DATA_CLASSIFICATION.demo) {
    return commercialResult({
      success: false,
      message: COMMERCIAL_WORKFLOW.provisionMessages.demoTenantForbidden
    }, 409);
  }
  return null;
};

export const hasActiveOrPendingSubscription = async (
  db: CloudflareD1Database,
  customerEmail: string
): Promise<boolean> => {
  const existing = await db.prepare(`
    SELECT id FROM ${D1_TABLES.subscriptionRecords}
    WHERE lower(customer_email) = lower(?) AND status IN (?, ?) LIMIT 1
  `).bind(
    customerEmail,
    COMMERCIAL_WORKFLOW.subscriptionStatus.ACTIVE,
    COMMERCIAL_WORKFLOW.subscriptionStatus.PENDING
  ).first<{ id: string }>();
  return Boolean(existing);
};
