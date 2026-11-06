import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { COMMERCIAL_WORKFLOW } from '../../src/constants/commercialWorkflow';
import { TENANT_DATA_CLASSIFICATION } from '../../src/constants/d1';
import { handleSubscriptionRoute } from '../../src/services/workerCommercialSubscriptions';
import { handleUpgradeRoute } from '../../src/services/workerCommercialUpgrade';
import * as commercialShared from '../../src/services/workerCommercialShared';
import logger from '../../src/utils/logger';
import { verifyToken } from '../../src/workerAuth';
import type { AuthRouteResult, CloudflareD1Database, CloudflareEnvironment } from '../../src/types/cloudflare';
import {
  createWorkerDatabase, insertRows, WORKER_CORE_SECRET, type WorkerDatabaseFixture
} from '../helpers/workerCoreFixtures';
import { issueEvidenceToken } from '../helpers/evidenceSqlite';

let fixture: WorkerDatabaseFixture;
let adminToken: string;
const upgradePayload = {
  customer_name: 'Asha Rao',
  customer_email: 'buyer@example.test',
  customer_phone: '+919876543210',
  company_name: 'Rao Textiles',
  current_tier: 'BRONZE',
  requested_tier: 'SILVER'
};
const provisionPayload = {
  tenant_id: 'tenant-rao',
  customer_id: 'buyer-1',
  customer_email: 'buyer@example.test',
  customer_name: 'Asha Rao',
  company_name: 'Rao Textiles',
  tier: 'SILVER',
  commercial_status: 'PAYMENT_RECEIVED',
  payment_reference: 'INV-2026-100',
  payment_confirmed: true,
  otp_session_id: '',
  otp_code: ''
};

beforeEach(async () => {
  fixture = createWorkerDatabase();
  fixture.d1.batch = async (statements) => {
    fixture.db.exec('BEGIN IMMEDIATE');
    try {
      const results: unknown[] = [];
      for (const statement of statements) results.push(await statement.run());
      fixture.db.exec('COMMIT');
      return results;
    } catch (error) {
      fixture.db.exec('ROLLBACK');
      throw error;
    }
  };
  fixture.db.prepare('INSERT INTO TenantMaster (tenant_id, enterprise_name, status) VALUES (?, ?, ?)')
    .run('tenant-rao', 'Rao Textiles', 'ACTIVE');
  insertRows(fixture.db, `INSERT INTO User (id, name, mobile_number, email, company_name, company_address,
    password_hash, role, status, subscription_tier, tenant_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    ['admin-1', 'Administrator', '+910000000001', 'admin@example.test', 'Platform', 'Bengaluru', 'hash', 'ADMIN', 'ACTIVE', 'GOLD', null],
    ['buyer-1', 'Asha Rao', '+919876543210', 'buyer@example.test', 'Rao Textiles', 'Pune', 'hash', 'USER', 'ACTIVE', 'BRONZE', 'tenant-rao']
  ]);
  adminToken = await issueEvidenceToken({ userId: 'admin-1', role: 'ADMIN' }, WORKER_CORE_SECRET);
});

afterEach(() => {
  fixture.close();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const environment = (overrides: CloudflareEnvironment = {}): CloudflareEnvironment => ({
  DB: fixture.d1,
  AUTH_SECRET: WORKER_CORE_SECRET,
  APP_OPERATING_MODE: 'INTERNAL_ASSESSMENT',
  ...overrides
});

const call = async (
  handler: (request: Request, env: CloudflareEnvironment, url: URL) => Promise<AuthRouteResult | null>,
  path: string,
  method = 'GET',
  body?: unknown,
  token?: string,
  envOverrides: CloudflareEnvironment = {}
): Promise<AuthRouteResult | null> => {
  const request = new Request(`https://edge.example.test${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
  return handler(request, environment(envOverrides), new URL(request.url));
};

const postUpgrade = async (overrides: Record<string, unknown> = {}): Promise<AuthRouteResult> => {
  const result = await call(handleUpgradeRoute, '/api/upgrade/request', 'POST', { ...upgradePayload, ...overrides });
  return result as AuthRouteResult;
};

const issueUpgradeOtp = async (requestId: string): Promise<AuthRouteResult> =>
  await call(handleUpgradeRoute, '/api/upgrade/admin/request-otp', 'POST', { request_id: requestId }, adminToken) as Promise<AuthRouteResult>;

const issueApprovedUpgradeCode = async (requestId: string): Promise<string> => {
  const otp = await issueUpgradeOtp(requestId);
  const verified = await call(handleUpgradeRoute, '/api/upgrade/admin/verify-otp-and-generate-code', 'POST', {
    request_id: requestId, otp: otp.body.otp_hint
  }, adminToken) as AuthRouteResult;
  return String(verified.body.development_code);
};

const createCommercialD1Adapter = (options: {
  returnUndefinedForAll?: boolean;
  forceZeroChangesForSql?: (sql: string) => boolean;
  forcedBatchResults?: unknown[];
} = {}): CloudflareD1Database => ({
  prepare(sql: string) {
    const statement = fixture.d1.prepare(sql);
    return {
      bind(...values: unknown[]) {
        const bound = statement.bind(...values);
        return {
          first: <T>() => bound.first<T>(),
          all: async <T>() => options.returnUndefinedForAll ? undefined : bound.all<T>(),
          run: async () => options.forceZeroChangesForSql?.(sql)
            ? { meta: { changes: 0 } }
            : bound.run()
        };
      }
    } as unknown as ReturnType<CloudflareD1Database['prepare']>;
  },
  batch: async (statements) => options.forcedBatchResults ?? Promise.all(statements.map((statement) => statement.run()))
});

describe('D1 commercial upgrade endpoints', () => {
  it('stores public upgrade enquiries, blocks duplicates, and exposes filtered admin listings only to admins', async () => {
    const created = await postUpgrade();
    const requestId = String(created.body.request_id);
    const duplicate = await postUpgrade({ company_name: 'Rao Industries' });
    const unauthenticated = await call(handleUpgradeRoute, '/api/upgrade/requests');
    const invalidFilter = await call(handleUpgradeRoute, '/api/upgrade/requests?status=OPEN', 'GET', undefined, adminToken);
    const listed = await call(handleUpgradeRoute, '/api/upgrade/requests?status=PENDING_ADMIN_ACTION', 'GET', undefined, adminToken);
    const invalidBody = await postUpgrade({ customer_email: 'bad-email' });
    const unknown = await call(handleUpgradeRoute, '/api/upgrade/unknown');

    expect(created).toMatchObject({ status: 201, body: { success: true, status: 'PENDING_ADMIN_ACTION' } });
    expect(duplicate).toMatchObject({ status: 409, body: { request_id: requestId } });
    expect(unauthenticated?.status).toBe(401);
    expect(invalidFilter?.status).toBe(400);
    expect(listed?.body.requests).toMatchObject([expect.objectContaining({ id: requestId, customer_email: 'buyer@example.test' })]);
    expect(invalidBody.status).toBe(400);
    expect(unknown).toBeNull();
  });

  it('verifies administrator OTP, issues a single-use customer code, and upgrades a registered user', async () => {
    const request = await postUpgrade();
    const requestId = String(request.body.request_id);
    const otpResponse = await call(handleUpgradeRoute, '/api/upgrade/generate-otp', 'POST', {
      requestId, adminUserId: 'ignored-legacy-field'
    }, adminToken) as AuthRouteResult;
    const otp = String(otpResponse.body.otp_hint);
    const wrongOtp = await call(handleUpgradeRoute, '/api/upgrade/admin/verify-otp-and-generate-code', 'POST', {
      requestId, otp: '000000'
    }, adminToken);
    const codeResponse = await call(handleUpgradeRoute, '/api/upgrade/admin/verify-otp-and-generate-code', 'POST', {
      request_id: requestId, otp
    }, adminToken) as AuthRouteResult;
    const code = String(codeResponse.body.development_code);
    const login = await call(handleUpgradeRoute, '/api/upgrade/login-with-code', 'POST', {
      email: upgradePayload.customer_email, code
    }) as AuthRouteResult;
    const claims = await verifyToken(String(login.body.token), WORKER_CORE_SECRET);
    const replay = await call(handleUpgradeRoute, '/api/upgrade/login-with-code', 'POST', {
      email: upgradePayload.customer_email, code
    });
    const saved = await fixture.d1.prepare('SELECT subscription_tier FROM User WHERE id = ?')
      .bind('buyer-1').first<{ subscription_tier: string }>();

    expect(otpResponse.body.session_id).toBeTruthy();
    expect(wrongOtp?.status).toBe(401);
    expect(codeResponse).toMatchObject({ status: 200, body: { status: 'OTP_VERIFIED_CODE_SENT' } });
    expect(claims).toMatchObject({ userId: 'buyer-1', tier: 'SILVER', tenantId: 'tenant-rao' });
    expect(login.status).toBe(200);
    expect(login.body.user).toMatchObject({ id: 'buyer-1', tenant_id: 'tenant-rao', subscription_tier: 'SILVER' });
    expect(replay?.status).toBe(401);
    expect(saved?.subscription_tier).toBe('SILVER');
  });

  it('rejects unauthorized approvals, incomplete requests, enterprise code redemption, and production without mail delivery', async () => {
    const request = await postUpgrade();
    const requestId = String(request.body.request_id);
    const unauthenticated = await call(handleUpgradeRoute, '/api/upgrade/admin/request-otp', 'POST', { request_id: requestId });
    const unauthenticatedVerification = await call(handleUpgradeRoute, '/api/upgrade/admin/verify-otp-and-generate-code', 'POST', {
      request_id: requestId, otp: '123456'
    });
    const invalidOtpBody = await call(handleUpgradeRoute, '/api/upgrade/admin/verify-otp-and-generate-code', 'POST', {}, adminToken);
    const production = await call(handleUpgradeRoute, '/api/upgrade/admin/request-otp', 'POST', { request_id: requestId }, adminToken, {
      APP_OPERATING_MODE: 'PRODUCTION'
    });
    expect(unauthenticated?.status).toBe(401);
    expect(unauthenticatedVerification?.status).toBe(401);
    expect(invalidOtpBody?.status).toBe(400);
    expect(production?.status).toBe(503);

    const enterprise = await postUpgrade({
      customer_email: 'enterprise@example.test', requested_tier: 'ENTERPRISE'
    });
    const enterpriseId = String(enterprise.body.request_id);
    const otp = await issueUpgradeOtp(enterpriseId);
    const denied = await call(handleUpgradeRoute, '/api/upgrade/admin/verify-otp-and-generate-code', 'POST', {
      request_id: enterpriseId, otp: String(otp?.body.otp_hint)
    }, adminToken);
    expect(denied?.status).toBe(409);
  });

  it('covers missing and changed approval requests plus OTP delivery fallbacks', async () => {
    const missingRequest = await call(handleUpgradeRoute, '/api/upgrade/admin/request-otp', 'POST', {
      request_id: 'upgrade-does-not-exist'
    }, adminToken);
    const changed = await postUpgrade({ customer_email: 'changed@example.test' });
    await fixture.d1.prepare('UPDATE UpgradeRequest SET status = ? WHERE id = ?')
      .bind(COMMERCIAL_WORKFLOW.upgradeStatus.REJECTED, changed.body.request_id).run();
    const noLongerPending = await call(handleUpgradeRoute, '/api/upgrade/admin/request-otp', 'POST', {
      request_id: changed.body.request_id
    }, adminToken);
    vi.spyOn(commercialShared, 'sendCommercialEmail').mockResolvedValueOnce({ sent: false });
    const deliveryFailure = await call(handleUpgradeRoute, '/api/upgrade/admin/request-otp', 'POST', {
      request_id: String((await postUpgrade({ customer_email: 'mail-failure@example.test' })).body.request_id)
    }, adminToken);
    vi.spyOn(commercialShared, 'sendCommercialEmail').mockResolvedValueOnce({ sent: true });
    const delivered = await call(handleUpgradeRoute, '/api/upgrade/admin/request-otp', 'POST', {
      request_id: String((await postUpgrade({ customer_email: 'mail-success@example.test' })).body.request_id)
    }, adminToken) as AuthRouteResult;
    expect(missingRequest?.status).toBe(404);
    expect(noLongerPending?.status).toBe(409);
    expect(deliveryFailure?.status).toBe(503);
    expect(delivered.status).toBe(200);
    expect(delivered.body.otp_hint).toBeUndefined();
  });

  it('supports OTP-session-only verification, all-status admin listings, and rejects inactive customers', async () => {
    const request = await postUpgrade({ customer_email: 'inactive@example.test' });
    const requestId = String(request.body.request_id);
    const otp = await issueUpgradeOtp(requestId);
    const verified = await call(handleUpgradeRoute, '/api/upgrade/admin/verify-otp-and-generate-code', 'POST', {
      otp_session_id: otp.body.session_id, otp_code: otp.body.otp_hint
    }, adminToken) as AuthRouteResult;
    const code = String(verified.body.development_code);
    insertRows(fixture.db, `INSERT INTO User (id, name, mobile_number, email, company_name, company_address,
      password_hash, role, status, subscription_tier) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      ['buyer-inactive', 'Inactive Buyer', '+910000000002', 'inactive@example.test', 'Rao Textiles', 'Pune', 'hash', 'USER', 'INACTIVE', 'BRONZE']
    ]);
    const inactive = await call(handleUpgradeRoute, '/api/upgrade/login-with-code', 'POST', {
      email: 'inactive@example.test', code
    });
    const all = await call(handleUpgradeRoute, '/api/upgrade/requests?status=ALL', 'GET', undefined, adminToken);
    expect(verified.status).toBe(200);
    expect(inactive?.status).toBe(404);
    expect((all?.body.requests as unknown[]).length).toBeGreaterThan(0);
  });

  it('handles missing D1 and invalid upgrade-code login payloads', async () => {
    const noDatabase = await call(handleUpgradeRoute, '/api/upgrade/request', 'POST', upgradePayload, undefined, { DB: undefined });
    const invalidLogin = await call(handleUpgradeRoute, '/api/upgrade/login-with-code', 'POST', { email: 'bad', code: 'short' });
    expect(noDatabase?.status).toBe(503);
    expect(invalidLogin?.status).toBe(400);
  });

  it('keeps upgrade codes unused when the atomic user update fails', async () => {
    const request = await postUpgrade();
    const requestId = String(request.body.request_id);
    const code = await issueApprovedUpgradeCode(requestId);
    fixture.db.exec(`CREATE TRIGGER reject_upgrade_tier BEFORE UPDATE OF subscription_tier ON User
      WHEN NEW.id = 'buyer-1' AND NEW.subscription_tier = 'SILVER'
      BEGIN SELECT RAISE(ABORT, 'simulated customer update failure'); END;`);
    const errorLog = vi.spyOn(logger, 'error');

    const result = await call(handleUpgradeRoute, '/api/upgrade/login-with-code', 'POST', {
      email: upgradePayload.customer_email, code
    });
    const savedRequest = await fixture.d1.prepare('SELECT status FROM UpgradeRequest WHERE id = ?')
      .bind(requestId).first<{ status: string }>();
    const savedUser = await fixture.d1.prepare('SELECT subscription_tier FROM User WHERE id = ?')
      .bind('buyer-1').first<{ subscription_tier: string }>();

    expect(result).toMatchObject({
      status: 503, body: { message: COMMERCIAL_WORKFLOW.upgradeMessages.atomicBatchUnavailable }
    });
    expect(savedRequest?.status).toBe(COMMERCIAL_WORKFLOW.upgradeStatus.CODE_SENT);
    expect(savedUser?.subscription_tier).toBe('BRONZE');
    expect(errorLog).toHaveBeenCalledWith(
      'Atomic upgrade code redemption failed',
      expect.objectContaining({ upgradeRequestId: requestId, userId: 'buyer-1', tenantId: 'tenant-rao' }),
      expect.any(Error)
    );
  });

  it('refuses code redemption for administrators and customers without an active tenant', async () => {
    const adminRequest = await postUpgrade({ customer_email: 'admin@example.test' });
    const adminCode = await issueApprovedUpgradeCode(String(adminRequest.body.request_id));
    const administrator = await call(handleUpgradeRoute, '/api/upgrade/login-with-code', 'POST', {
      email: 'admin@example.test', code: adminCode
    });
    expect(administrator).toMatchObject({
      status: 403, body: { message: COMMERCIAL_WORKFLOW.upgradeMessages.activeTenantRequired }
    });

    const buyerRequest = await postUpgrade();
    const buyerCode = await issueApprovedUpgradeCode(String(buyerRequest.body.request_id));
    fixture.db.prepare("UPDATE TenantMaster SET status = 'SUSPENDED' WHERE tenant_id = 'tenant-rao'").run();
    const suspendedTenant = await call(handleUpgradeRoute, '/api/upgrade/login-with-code', 'POST', {
      email: upgradePayload.customer_email, code: buyerCode
    });
    const savedRequest = await fixture.d1.prepare('SELECT status FROM UpgradeRequest WHERE id = ?')
      .bind(buyerRequest.body.request_id).first<{ status: string }>();

    expect(suspendedTenant).toMatchObject({
      status: 403, body: { message: COMMERCIAL_WORKFLOW.upgradeMessages.activeTenantRequired }
    });
    expect(savedRequest?.status).toBe(COMMERCIAL_WORKFLOW.upgradeStatus.CODE_SENT);
  });

  it('fails closed without D1 batch support and preserves the single-use code', async () => {
    const request = await postUpgrade();
    const requestId = String(request.body.request_id);
    const code = await issueApprovedUpgradeCode(requestId);
    fixture.d1.batch = undefined;

    const result = await call(handleUpgradeRoute, '/api/upgrade/login-with-code', 'POST', {
      email: upgradePayload.customer_email, code
    });

    expect(result).toMatchObject({
      status: 503, body: { message: COMMERCIAL_WORKFLOW.upgradeMessages.atomicBatchUnavailable }
    });
    await expect(fixture.d1.prepare('SELECT status FROM UpgradeRequest WHERE id = ?')
      .bind(requestId).first()).resolves.toEqual({ status: COMMERCIAL_WORKFLOW.upgradeStatus.CODE_SENT });
  });

  it('logs inconsistent batch row counts and rejects the upgrade result', async () => {
    const request = await postUpgrade();
    const requestId = String(request.body.request_id);
    const code = await issueApprovedUpgradeCode(requestId);
    const errorLog = vi.spyOn(logger, 'error');

    const result = await call(handleUpgradeRoute, '/api/upgrade/login-with-code', 'POST', {
      email: upgradePayload.customer_email, code
    }, undefined, {
      DB: createCommercialD1Adapter({ forcedBatchResults: [{ meta: { changes: 1 } }, { meta: { changes: 0 } }] })
    });

    expect(result).toMatchObject({
      status: 500, body: { message: COMMERCIAL_WORKFLOW.upgradeMessages.atomicInvariantFailed }
    });
    expect(errorLog).toHaveBeenCalledWith(
      'Atomic upgrade redemption returned an inconsistent row-change result',
      expect.objectContaining({ upgradeRequestId: requestId, userId: 'buyer-1', requestChanges: 1, userChanges: 0 }),
      expect.any(Error)
    );
  });

  it('returns empty lists for an absent D1 result and rejects detached OTP sessions', async () => {
    const emptyList = await call(handleUpgradeRoute, '/api/upgrade/requests', 'GET', undefined, adminToken, {
      DB: createCommercialD1Adapter({ returnUndefinedForAll: true })
    });
    const orphanSessionId = 'otp-orphan-upgrade';
    await fixture.d1.prepare(`INSERT INTO AdminOtpSession
      (id, purpose, request_id, requested_by, otp_hash, expires_at, created_at)
      VALUES (?, ?, NULL, ?, ?, ?, ?)`)
      .bind(orphanSessionId, COMMERCIAL_WORKFLOW.otpPurpose.UPGRADE, 'admin-1',
        await commercialShared.sha256Hex('123456'), Date.now() + 300000, new Date().toISOString()).run();
    const orphan = await call(handleUpgradeRoute, '/api/upgrade/admin/verify-otp-and-generate-code', 'POST', {
      otp_session_id: orphanSessionId, otp: '123456'
    }, adminToken);
    expect(emptyList?.body.requests).toEqual([]);
    expect(orphan?.status).toBe(409);
  });

  it('handles concurrent upgrade approval and redemption changes safely', async () => {
    const requestId = String((await postUpgrade({ customer_email: 'approval-race@example.test' })).body.request_id);
    const approvalOtp = await issueUpgradeOtp(requestId);
    const approvalRace = await call(handleUpgradeRoute, '/api/upgrade/admin/verify-otp-and-generate-code', 'POST', {
      request_id: requestId, otp: approvalOtp.body.otp_hint
    }, adminToken, {
      DB: createCommercialD1Adapter({ forceZeroChangesForSql: (sql) => sql.includes('generated_unique_code_hash') })
    });

    const redemptionRequestId = String((await postUpgrade()).body.request_id);
    const redemptionOtp = await issueUpgradeOtp(redemptionRequestId);
    const code = await call(handleUpgradeRoute, '/api/upgrade/admin/verify-otp-and-generate-code', 'POST', {
      request_id: redemptionRequestId, otp: redemptionOtp.body.otp_hint
    }, adminToken) as AuthRouteResult;
    const redemptionRace = await call(handleUpgradeRoute, '/api/upgrade/login-with-code', 'POST', {
      email: upgradePayload.customer_email, code: code.body.development_code
    }, undefined, { DB: createCommercialD1Adapter({ forceZeroChangesForSql: (sql) => sql.includes('code_redeemed_at') }) });

    expect(approvalRace?.status).toBe(409);
    expect(redemptionRace?.status).toBe(409);
  });

  it('rejects expired codes and requires a registered active customer', async () => {
    const request = await postUpgrade({ customer_email: 'unregistered@example.test' });
    const requestId = String(request.body.request_id);
    const otp = await issueUpgradeOtp(requestId);
    const codeResult = await call(handleUpgradeRoute, '/api/upgrade/admin/verify-otp-and-generate-code', 'POST', {
      request_id: requestId, otp: String(otp?.body.otp_hint)
    }, adminToken) as AuthRouteResult;
    const code = String(codeResult.body.development_code);
    const noUser = await call(handleUpgradeRoute, '/api/upgrade/login-with-code', 'POST', {
      email: 'unregistered@example.test', code
    });
    expect(noUser?.status).toBe(404);
    await fixture.d1.prepare('UPDATE UpgradeRequest SET code_expires_at = ? WHERE id = ?')
      .bind(Date.now() - 1, requestId).run();
    const expired = await call(handleUpgradeRoute, '/api/upgrade/login-with-code', 'POST', {
      email: 'unregistered@example.test', code
    });
    expect(expired?.status).toBe(401);
  });
});

describe('D1 admin subscription endpoints', () => {
  const issueProvisionOtp = async (): Promise<AuthRouteResult> =>
    await call(handleSubscriptionRoute, '/api/subscription/admin/request-otp', 'POST', {
      customer_id: 'buyer-1', action: 'PROVISION'
    }, adminToken) as Promise<AuthRouteResult>;

  it('requires admin authorization, serves audit/list routes, and records provisioned subscriptions', async () => {
    const unauthorized = await call(handleSubscriptionRoute, '/api/subscription/admin/list');
    const unauthorizedAudit = await call(handleSubscriptionRoute, '/api/subscription/admin/audit-trail');
    const unauthorizedOtp = await call(handleSubscriptionRoute, '/api/subscription/admin/request-otp', 'POST', {});
    const unauthorizedProvision = await call(handleSubscriptionRoute, '/api/subscription/admin/provision', 'POST', {});
    const unauthorizedStatus = await call(handleSubscriptionRoute, '/api/subscription/admin/sub-missing/status', 'PATCH', {});
    const missingCustomer = await call(handleSubscriptionRoute, '/api/subscription/admin/request-otp', 'POST', {
      customer_id: 'not-registered', action: 'PROVISION'
    }, adminToken);
    const missingCustomerId = await call(handleSubscriptionRoute, '/api/subscription/admin/request-otp', 'POST', {
      request_id: 'not-a-provision-customer'
    }, adminToken);
    const otp = await issueProvisionOtp();
    const wrongCode = await call(handleSubscriptionRoute, '/api/subscription/admin/provision', 'POST', {
      ...provisionPayload, otp_session_id: otp.body.session_id, otp_code: '000000'
    }, adminToken);
    const provisioned = await call(handleSubscriptionRoute, '/api/subscription/admin/provision', 'POST', {
      ...provisionPayload, otp_session_id: otp.body.session_id, otp_code: otp.body.otp_hint
    }, adminToken) as AuthRouteResult;
    const subscription = provisioned.body.subscription as Record<string, unknown>;
    const list = await call(handleSubscriptionRoute, '/api/subscription/admin/list', 'GET', undefined, adminToken);
    const audit = await call(handleSubscriptionRoute, '/api/subscription/admin/audit-trail', 'GET', undefined, adminToken);
    const auditOne = await call(handleSubscriptionRoute,
      `/api/subscription/admin/audit-trail?subscription_id=${subscription.id}`, 'GET', undefined, adminToken);
    const status = await call(handleSubscriptionRoute, `/api/subscription/admin/${subscription.id}/status`, 'PATCH', {
      status: 'SUSPENDED'
    }, adminToken);
    const invalidStatus = await call(handleSubscriptionRoute, `/api/subscription/admin/${subscription.id}/status`, 'PATCH', {
      status: 'EXPIRED'
    }, adminToken);
    const wrongCustomerEmail = await call(handleSubscriptionRoute, '/api/subscription/admin/provision', 'POST', {
      ...provisionPayload, customer_email: 'another@example.test', otp_session_id: otp.body.session_id,
      otp_code: otp.body.otp_hint
    }, adminToken);

    expect(unauthorized?.status).toBe(401);
    expect(unauthorizedAudit?.status).toBe(401);
    expect(unauthorizedOtp?.status).toBe(401);
    expect(unauthorizedProvision?.status).toBe(401);
    expect(unauthorizedStatus?.status).toBe(401);
    expect(missingCustomer?.status).toBe(404);
    expect(missingCustomerId?.status).toBe(400);
    expect(wrongCode?.status).toBe(401);
    expect(provisioned).toMatchObject({ status: 201, body: { success: true, subscription: { tier: 'SILVER', payment_confirmed: true } } });
    expect(await fixture.d1.prepare('SELECT tenant_id, status, subscription_tier FROM User WHERE id = ?')
      .bind('buyer-1').first()).toEqual({ tenant_id: 'tenant-rao', status: 'ACTIVE', subscription_tier: 'SILVER' });
    expect(await fixture.d1.prepare('SELECT classification, source_label FROM TenantDataProvenance WHERE tenant_id = ?')
      .bind('tenant-rao').first()).toEqual({ classification: TENANT_DATA_CLASSIFICATION.customer, source_label: 'SUBSCRIPTION_PROVISION' });
    fixture.db.prepare('INSERT OR IGNORE INTO TenantMaster (tenant_id, enterprise_name, status) VALUES (?, ?, ?)')
      .run('tenant-other', 'Other Organization', 'ACTIVE');
    expect(() => fixture.db.prepare('UPDATE SubscriptionRecord SET tenant_id = ? WHERE id = ?')
      .run('tenant-other', String(subscription.id)))
      .toThrow(COMMERCIAL_WORKFLOW.subscriptionCustomerInvariantMarker);
    expect((list?.body.subscriptions as unknown[])).toHaveLength(1);
    expect((audit?.body.audit_events as unknown[])).toHaveLength(1);
    expect((auditOne?.body.audit_events as unknown[])).toHaveLength(1);
    expect(status?.status).toBe(200);
    expect(invalidStatus?.status).toBe(400);
    expect(wrongCustomerEmail?.status).toBe(404);
  });

  it('rejects invalid and duplicate provisioning, handles status not found, and reports missing D1', async () => {
    const invalid = await call(handleSubscriptionRoute, '/api/subscription/admin/provision', 'POST', {}, adminToken);
    const otp = await issueProvisionOtp();
    const created = await call(handleSubscriptionRoute, '/api/subscription/admin/provision', 'POST', {
      ...provisionPayload, otp_session_id: otp.body.session_id, otp_code: otp.body.otp_hint
    }, adminToken) as AuthRouteResult;
    const secondOtp = await issueProvisionOtp();
    const duplicate = await call(handleSubscriptionRoute, '/api/subscription/admin/provision', 'POST', {
      ...provisionPayload, otp_session_id: secondOtp.body.session_id, otp_code: secondOtp.body.otp_hint
    }, adminToken);
    const missing = await call(handleSubscriptionRoute, '/api/subscription/admin/sub-missing/status', 'PATCH', {
      status: 'CANCELLED'
    }, adminToken);
    const noDatabase = await call(handleSubscriptionRoute, '/api/subscription/admin/list', 'GET', undefined, adminToken, { DB: undefined });
    const notRoute = await call(handleSubscriptionRoute, '/api/subscription/other');
    const wrongMethod = await call(handleSubscriptionRoute, '/api/subscription/admin/sub-missing/status', 'GET', undefined, adminToken);

    expect(invalid?.status).toBe(400);
    expect(created.status).toBe(201);
    expect(duplicate?.status).toBe(409);
    expect(missing?.status).toBe(404);
    expect(noDatabase?.status).toBe(503);
    expect(notRoute).toBeNull();
    expect(wrongMethod?.status).toBe(404);
  });

  it('rejects subscription provisioning that would cross tenant ownership or reactivate a suspended customer', async () => {
    await fixture.d1.prepare('INSERT INTO TenantMaster (tenant_id, enterprise_name) VALUES (?, ?)')
      .bind('tenant-existing', 'Existing Organization').run();
    await fixture.d1.prepare('UPDATE User SET tenant_id = ? WHERE id = ?').bind('tenant-existing', 'buyer-1').run();
    const tenantConflict = await issueProvisionOtp();
    const conflict = await call(handleSubscriptionRoute, '/api/subscription/admin/provision', 'POST', {
      ...provisionPayload, otp_session_id: tenantConflict.body.session_id, otp_code: tenantConflict.body.otp_hint
    }, adminToken);
    await fixture.d1.prepare('UPDATE User SET tenant_id = NULL, status = ? WHERE id = ?').bind('SUSPENDED', 'buyer-1').run();
    const inactiveOtp = await issueProvisionOtp();
    const inactive = await call(handleSubscriptionRoute, '/api/subscription/admin/provision', 'POST', {
      ...provisionPayload, otp_session_id: inactiveOtp.body.session_id, otp_code: inactiveOtp.body.otp_hint
    }, adminToken);

    expect(conflict?.status).toBe(409);
    expect(inactive?.status).toBe(409);
    expect(await fixture.d1.prepare('SELECT COUNT(*) AS count FROM SubscriptionRecord').first()).toEqual({ count: 0 });
  });

  it('allows the existing tenant assignment and rejects an unknown provisioning OTP session', async () => {
    await fixture.d1.prepare('INSERT OR IGNORE INTO TenantMaster (tenant_id, enterprise_name, status) VALUES (?, ?, ?)')
      .bind('tenant-rao', 'Rao Textiles', 'ACTIVE').run();
    await fixture.d1.prepare('UPDATE User SET tenant_id = ? WHERE id = ?').bind('tenant-rao', 'buyer-1').run();

    const missingSession = await call(handleSubscriptionRoute, '/api/subscription/admin/provision', 'POST', {
      ...provisionPayload, otp_session_id: 'otp-not-found', otp_code: '123456'
    }, adminToken);
    const otp = await issueProvisionOtp();
    const provisioned = await call(handleSubscriptionRoute, '/api/subscription/admin/provision', 'POST', {
      ...provisionPayload, otp_session_id: otp.body.session_id, otp_code: otp.body.otp_hint
    }, adminToken);

    expect(missingSession?.status).toBe(401);
    expect(provisioned?.status).toBe(201);
  });

  it('rolls back provisioning if customer tenant ownership changes before the atomic batch', async () => {
    fixture.db.prepare('INSERT INTO TenantMaster (tenant_id, enterprise_name, status) VALUES (?, ?, ?)')
      .run('tenant-other', 'Other Organization', 'ACTIVE');
    const otp = await issueProvisionOtp();
    const atomicBatch = fixture.d1.batch;
    fixture.d1.batch = async (statements) => {
      fixture.db.prepare('UPDATE User SET tenant_id = ? WHERE id = ?').run('tenant-other', 'buyer-1');
      if (!atomicBatch) throw new Error('Atomic SQLite D1 fixture batch is unavailable');
      return atomicBatch(statements);
    };
    const warning = vi.spyOn(logger, 'warn');
    const result = await call(handleSubscriptionRoute, '/api/subscription/admin/provision', 'POST', {
      ...provisionPayload, otp_session_id: otp.body.session_id, otp_code: otp.body.otp_hint
    }, adminToken);

    expect(result?.status).toBe(409);
    expect(result?.body.message).toBe(COMMERCIAL_WORKFLOW.provisionMessages.concurrentChange);
    expect(await fixture.d1.prepare('SELECT tenant_id FROM User WHERE id = ?').bind('buyer-1').first())
      .toEqual({ tenant_id: 'tenant-other' });
    expect(await fixture.d1.prepare('SELECT COUNT(*) AS count FROM SubscriptionRecord').first()).toEqual({ count: 0 });
    expect(await fixture.d1.prepare('SELECT COUNT(*) AS count FROM TenantDataProvenance WHERE tenant_id = ?')
      .bind('tenant-rao').first()).toEqual({ count: 0 });
    expect(warning).toHaveBeenCalledWith(
      'Subscription provisioning rolled back after a concurrent customer or tenant change',
      expect.objectContaining({ customerId: 'buyer-1', tenantId: 'tenant-rao' }),
      expect.any(Error)
    );
  });

  it('requires atomic D1 batching for paid subscription provisioning', async () => {
    const otp = await issueProvisionOtp();
    const warning = vi.spyOn(logger, 'warn');
    const result = await call(handleSubscriptionRoute, '/api/subscription/admin/provision', 'POST', {
      ...provisionPayload, otp_session_id: otp.body.session_id, otp_code: otp.body.otp_hint
    }, adminToken, { DB: { ...fixture.d1, batch: undefined } });

    expect(result).toMatchObject({ status: 503, body: { message: COMMERCIAL_WORKFLOW.provisionMessages.atomicBatchUnavailable } });
    expect(warning).toHaveBeenCalledWith(
      'Subscription provisioning rejected because atomic D1 batching is unavailable', expect.objectContaining({ actorId: 'admin-1' })
    );
    expect(await fixture.d1.prepare('SELECT COUNT(*) AS count FROM SubscriptionRecord').first()).toEqual({ count: 0 });
  });

  it('propagates unexpected database batch failures for centralized error logging', async () => {
    const otp = await issueProvisionOtp();
    fixture.d1.batch = async () => { throw new Error('unexpected D1 batch failure'); };

    await expect(call(handleSubscriptionRoute, '/api/subscription/admin/provision', 'POST', {
      ...provisionPayload, otp_session_id: otp.body.session_id, otp_code: otp.body.otp_hint
    }, adminToken)).rejects.toThrow('unexpected D1 batch failure');
  });

  it('rejects paid provisioning for administrators and demo-only tenants', async () => {
    await fixture.d1.prepare('INSERT INTO TenantMaster (tenant_id, enterprise_name) VALUES (?, ?)')
      .bind('tenant-demo', 'Demo Organization').run();
    await fixture.d1.prepare('INSERT INTO TenantDataProvenance (tenant_id, classification, source_label) VALUES (?, ?, ?)')
      .bind('tenant-demo', TENANT_DATA_CLASSIFICATION.demo, 'TEST_DEMO').run();
    await fixture.d1.prepare('UPDATE User SET role = ? WHERE id = ?').bind('ADMIN', 'buyer-1').run();
    const adminTarget = await issueProvisionOtp();
    const adminResult = await call(handleSubscriptionRoute, '/api/subscription/admin/provision', 'POST', {
      ...provisionPayload, otp_session_id: adminTarget.body.session_id, otp_code: adminTarget.body.otp_hint
    }, adminToken);
    await fixture.d1.prepare('UPDATE User SET role = ? WHERE id = ?').bind('USER', 'buyer-1').run();
    const demoOtp = await issueProvisionOtp();
    const demoResult = await call(handleSubscriptionRoute, '/api/subscription/admin/provision', 'POST', {
      ...provisionPayload, tenant_id: 'tenant-demo', otp_session_id: demoOtp.body.session_id, otp_code: demoOtp.body.otp_hint
    }, adminToken);

    expect(adminResult?.status).toBe(409);
    expect(demoResult?.status).toBe(409);
    expect(await fixture.d1.prepare('SELECT COUNT(*) AS count FROM SubscriptionRecord').first()).toEqual({ count: 0 });
  });

  it('fails closed if production email credentials are unavailable', async () => {
    const result = await call(handleSubscriptionRoute, '/api/subscription/admin/request-otp', 'POST', {
      customer_id: 'buyer-1', action: 'PROVISION'
    }, adminToken, { APP_OPERATING_MODE: 'PRODUCTION' });
    expect(result?.status).toBe(503);
    const count = await fixture.d1.prepare('SELECT COUNT(*) AS count FROM AdminOtpSession').first<{ count: number }>();
    expect(count?.count).toBe(0);
  });

  it('omits development-only OTP hints when mail is delivered and uses a fallback delivery error', async () => {
    vi.spyOn(commercialShared, 'sendCommercialEmail').mockResolvedValueOnce({ sent: true })
      .mockResolvedValueOnce({ sent: false });
    const delivered = await call(handleSubscriptionRoute, '/api/subscription/admin/request-otp', 'POST', {
      customer_id: 'buyer-1', action: 'PROVISION'
    }, adminToken) as AuthRouteResult;
    const deliveryFailure = await call(handleSubscriptionRoute, '/api/subscription/admin/request-otp', 'POST', {
      customer_id: 'buyer-1', action: 'PROVISION'
    }, adminToken) as AuthRouteResult;
    expect(delivered.status).toBe(200);
    expect(delivered.body.otp_hint).toBeUndefined();
    expect(deliveryFailure).toMatchObject({ status: 503, body: { message: 'Unable to deliver the admin verification code.' } });
  });

  it('normalizes absent subscription and audit result arrays and nullable event details', async () => {
    const resultlessDatabase = {
      prepare(sql: string) {
        const statement = fixture.d1.prepare(sql);
        return {
          bind(...values: unknown[]) {
            const bound = statement.bind(...values);
            return {
              first: <T>() => bound.first<T>(),
              all: async () => undefined,
              run: () => bound.run()
            };
          },
          first: <T>() => statement.first<T>(),
          all: async () => undefined,
          run: () => statement.run()
        };
      }
    } as unknown as CloudflareD1Database;
    const emptyList = await call(handleSubscriptionRoute, '/api/subscription/admin/list', 'GET', undefined, adminToken, {
      DB: resultlessDatabase
    });
    const emptyAudit = await call(handleSubscriptionRoute, '/api/subscription/admin/audit-trail', 'GET', undefined, adminToken, {
      DB: resultlessDatabase
    });
    insertRows(fixture.db, `INSERT INTO SubscriptionAuditEvent
      (id, timestamp, subscription_id, tenant_id, actor, actor_role, action, result, details_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      ['audit-null-details', new Date().toISOString(), 'sub-unknown', 'tenant-rao', 'admin@example.test', 'ADMIN', 'TEST', 'SUCCESS', null]
    ]);
    const nullDetails = await call(handleSubscriptionRoute, '/api/subscription/admin/audit-trail', 'GET', undefined, adminToken);
    expect(emptyList?.body.subscriptions).toEqual([]);
    expect(emptyAudit?.body.audit_events).toEqual([]);
    expect(nullDetails?.body.audit_events).toMatchObject([{ id: 'audit-null-details' }]);
    expect((nullDetails?.body.audit_events as Array<Record<string, unknown>>)[0]?.details).toBeUndefined();
  });
});
