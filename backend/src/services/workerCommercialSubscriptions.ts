import { D1_TABLES, TENANT_DATA_CLASSIFICATION } from '../constants/d1';
import { COMMERCIAL_WORKFLOW } from '../constants/commercialWorkflow';
import { AUTH_ROLES, AUTH_STATUS } from '../constants/auth';
import {
  commercialOtpRequestSchema, subscriptionProvisionSchema, subscriptionStatusSchema
} from '../constants/commercialValidation';
import type {
  AuthRouteResult, CloudflareD1Database, CloudflareD1PreparedStatement, CloudflareEnvironment
} from '../types/cloudflare';
import type { CommercialActor, SubscriptionProvisionPreflight, SubscriptionRecordD1Row } from '../types/commercialWorkflow';
import logger from '../utils/logger';
import {
  authorizeCommercialAdmin, commercialResult, createOtp,
  readCommercialBody, sendCommercialEmail, sha256Hex, toPublicSubscription
} from './workerCommercialShared';
import {
  hasActiveOrPendingSubscription, validateProvisioningCustomer, validateProvisioningOtp,
  validateProvisioningTenant
} from './workerCommercialProvisioningValidation';

const requireAtomicProvisioningBatch = (
  db: CloudflareEnvironment['DB'], request: Request, actor: CommercialActor
): NonNullable<CloudflareD1Database['batch']> | AuthRouteResult => {
  if (db?.batch) return db.batch.bind(db);
  logger.warn('Subscription provisioning rejected because atomic D1 batching is unavailable', {
    requestId: request.headers.get('x-request-id') || undefined,
    actorId: actor.id
  });
  return commercialResult({
    success: false,
    message: COMMERCIAL_WORKFLOW.provisionMessages.atomicBatchUnavailable
  }, 503);
};

const validateSubscriptionProvisioning = async (
  db: NonNullable<CloudflareEnvironment['DB']>, request: Request
): Promise<SubscriptionProvisionPreflight> => {
  const parsed = subscriptionProvisionSchema.safeParse(await readCommercialBody(request));
  if (!parsed.success) return {
    ok: false,
    result: commercialResult({ success: false, message: 'Validation failed', errors: parsed.error.issues }, 400)
  };
  const customer = await db.prepare('SELECT id, email, name, company_name, role, status, tenant_id FROM User WHERE id = ?')
    .bind(parsed.data.customer_id).first<Record<string, unknown>>();
  if (!customer || String(customer.email).toLowerCase() !== parsed.data.customer_email.toLowerCase()) return {
    ok: false,
    result: commercialResult({
      success: false,
      message: 'Customer ID and registered email must identify the same active account.'
    }, 404)
  };
  const customerError = validateProvisioningCustomer(customer, parsed.data);
  if (customerError) return { ok: false, result: customerError };
  const otpError = await validateProvisioningOtp(db, parsed.data);
  if (otpError) return { ok: false, result: otpError };
  const tenantError = await validateProvisioningTenant(db, parsed.data.tenant_id);
  if (tenantError) return { ok: false, result: tenantError };
  if (await hasActiveOrPendingSubscription(db, parsed.data.customer_email)) return {
    ok: false,
    result: commercialResult({
      success: false,
      message: 'This customer already has an active or pending paid subscription.'
    }, 409)
  };
  return { ok: true, input: parsed.data, customer };
};

const buildSubscriptionProvisioningStatements = (
  db: NonNullable<CloudflareEnvironment['DB']>,
  subscription: SubscriptionRecordD1Row,
  customerId: unknown,
  actor: CommercialActor,
  now: string
): CloudflareD1PreparedStatement[] => [
  db.prepare('INSERT INTO TenantMaster (tenant_id, enterprise_name) VALUES (?, ?) ON CONFLICT(tenant_id) DO NOTHING')
    .bind(subscription.tenant_id, subscription.company_name),
  db.prepare(`
    INSERT INTO TenantDataProvenance (tenant_id, classification, source_label, updated_at)
    VALUES (?, ?, 'SUBSCRIPTION_PROVISION', ?)
    ON CONFLICT(tenant_id) DO NOTHING
  `).bind(subscription.tenant_id, TENANT_DATA_CLASSIFICATION.customer, now),
  db.prepare(`UPDATE User SET tenant_id = ?, status = ?, subscription_tier = ?, updated_at = ?
    WHERE id = ? AND role = ? AND (tenant_id IS NULL OR tenant_id = ?) AND status IN (?, ?)`)
    .bind(subscription.tenant_id, AUTH_STATUS.ACTIVE, subscription.tier, now, customerId,
      AUTH_ROLES.USER, subscription.tenant_id, AUTH_STATUS.ACTIVE, AUTH_STATUS.PENDING),
  db.prepare(`
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
  ),
  db.prepare(`
    INSERT INTO ${D1_TABLES.subscriptionAuditEvents}
      (id, timestamp, subscription_id, tenant_id, actor, actor_role, action, result, details_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    `audit-${crypto.randomUUID()}`, now, subscription.id, subscription.tenant_id, actor.email,
    'ADMIN', 'SUBSCRIPTION_PROVISIONED', 'SUCCESS', JSON.stringify({
      tier: subscription.tier, payment_reference: subscription.payment_reference
    })
  )
];

const commitSubscriptionProvisioning = async (
  batch: NonNullable<CloudflareD1Database['batch']>,
  statements: ReturnType<typeof buildSubscriptionProvisioningStatements>,
  context: { requestId?: string; subscriptionId: string; customerId: unknown; tenantId: string; actorId: string }
): Promise<AuthRouteResult | null> => {
  try {
    await batch(statements);
    return null;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes(COMMERCIAL_WORKFLOW.subscriptionCustomerInvariantMarker)) throw error;
    logger.warn('Subscription provisioning rolled back after a concurrent customer or tenant change', context, error);
    return commercialResult({ success: false, message: COMMERCIAL_WORKFLOW.provisionMessages.concurrentChange }, 409);
  }
};

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
  const batchResult = requireAtomicProvisioningBatch(db, request, actor);
  if (typeof batchResult !== 'function') return batchResult;
  const preflight = await validateSubscriptionProvisioning(db, request);
  if (!preflight.ok) return preflight.result;
  const { input, customer } = preflight;
  const nowDate = new Date();
  const now = nowDate.toISOString();
  const endDate = new Date(
    nowDate.getTime() + COMMERCIAL_WORKFLOW.subscriptionTermDays * COMMERCIAL_WORKFLOW.millisecondsPerDay
  ).toISOString();
  const subscription: SubscriptionRecordD1Row = {
    id: `sub-${crypto.randomUUID()}`,
    tenant_id: input.tenant_id,
    customer_id: input.customer_id,
    customer_email: input.customer_email.toLowerCase(),
    customer_name: input.customer_name,
    company_name: input.company_name,
    tier: input.tier,
    status: COMMERCIAL_WORKFLOW.subscriptionStatus.ACTIVE,
    commercial_status: COMMERCIAL_WORKFLOW.commercialStatus.COMPLETED,
    payment_reference: input.payment_reference,
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
  const provisioningStatements = buildSubscriptionProvisioningStatements(db, subscription, customer.id, actor, now);
  const provisioningError = await commitSubscriptionProvisioning(batchResult, provisioningStatements, {
    requestId: request.headers.get('x-request-id') || undefined,
    subscriptionId: subscription.id,
    customerId: customer.id,
    tenantId: subscription.tenant_id,
    actorId: actor.id
  });
  if (provisioningError) return provisioningError;
  logger.info('Paid subscription provisioned', {
    subscriptionId: subscription.id, customerId: customer.id, tenantId: subscription.tenant_id,
    previousTenantId: customer.tenant_id || null, tier: subscription.tier, actorId: actor.id
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
