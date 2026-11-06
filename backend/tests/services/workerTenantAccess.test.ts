import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTH_MESSAGES } from '../../src/constants/auth';
import { WORKER_JSON_BODY_MAX_BYTES } from '../../src/constants/validation';
import { authorizeTenantRequest } from '../../src/services/workerTenantAccess';
import type { CloudflareEnvironment } from '../../src/types/cloudflare';
import { createWorkerAuthToken } from '../../src/workerAuth';
import logger from '../../src/utils/logger';
import { createWorkerDatabase, insertRows, WORKER_CORE_SECRET, type WorkerDatabaseFixture } from '../helpers/workerCoreFixtures';

let fixture: WorkerDatabaseFixture;

beforeEach(() => {
  fixture = createWorkerDatabase();
  insertRows(fixture.db, 'INSERT INTO TenantMaster (tenant_id, enterprise_name, status) VALUES (?, ?, ?)', [
    ['tenant-a', 'Alpha Industries', 'ACTIVE'],
    ['tenant-b', 'Beta Industries', 'ACTIVE'],
    ['tenant-off', 'Inactive Industries', 'SUSPENDED']
  ]);
  insertRows(fixture.db, `INSERT INTO User
    (id, name, mobile_number, email, company_name, company_address, password_hash, role, status, subscription_tier, tenant_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    ['user-a', 'Asha', '+910000000001', 'asha@alpha.example', 'Alpha', 'Pune', 'test-hash', 'USER', 'ACTIVE', 'BRONZE', 'tenant-a'],
    ['user-unassigned', 'Ravi', '+910000000002', 'ravi@none.example', 'No tenant', 'Delhi', 'test-hash', 'USER', 'ACTIVE', 'BRONZE', 'tenant-a'],
    ['user-suspended', 'Meera', '+910000000003', 'meera@alpha.example', 'Alpha', 'Pune', 'test-hash', 'USER', 'SUSPENDED', 'BRONZE', 'tenant-a'],
    ['admin-a', 'Admin', '+910000000004', 'admin@example.test', 'Alpha', 'Pune', 'test-hash', 'ADMIN', 'ACTIVE', 'GOLD', 'tenant-a']
  ]);
});

afterEach(() => {
  fixture.close();
  vi.restoreAllMocks();
});

const environment = (overrides: CloudflareEnvironment = {}): CloudflareEnvironment => ({
  DB: fixture.d1,
  AUTH_SECRET: WORKER_CORE_SECRET,
  ...overrides
});

const authHeaders = async (userId: string): Promise<Record<string, string>> => {
  const user = await fixture.d1.prepare('SELECT * FROM User WHERE id = ?').bind(userId).first<Record<string, unknown>>();
  return { Authorization: `Bearer ${await createWorkerAuthToken(user || {}, WORKER_CORE_SECRET)}` };
};

const requestFor = async (
  path: string,
  userId?: string,
  init: RequestInit = {}
): Promise<Request> => new Request(`https://edge.example.test${path}`, {
  ...init,
  headers: { ...(userId ? await authHeaders(userId) : {}), ...(init.headers as Record<string, string> || {}) }
});

describe('authorizeTenantRequest', () => {
  it('leaves non-API, public, and internally guarded routes for their existing handlers', async () => {
    const env = environment();
    const requests = [
      new Request('https://edge.example.test/'),
      new Request('https://edge.example.test/api/health'),
      new Request('https://edge.example.test/api/auth/login', { method: 'POST' }),
      new Request('https://edge.example.test/api/admin/users'),
      new Request('https://edge.example.test/api/upgrade/request', { method: 'POST' })
    ];

    for (const request of requests) {
      await expect(authorizeTenantRequest(request, env)).resolves.toMatchObject({ request, environment: env });
    }
  });

  it('requires a current active database identity for tenant data routes', async () => {
    await expect(authorizeTenantRequest(
      new Request('https://edge.example.test/api/report'), environment()
    )).resolves.toMatchObject({ status: 401, message: AUTH_MESSAGES.UNAUTHORIZED });

    await expect(authorizeTenantRequest(
      new Request('https://edge.example.test/api/report'), environment({ DB: undefined })
    )).resolves.toMatchObject({ status: 503 });
  });

  it('requires a tenant assignment and an active tenant for user data access', async () => {
    fixture.db.exec('DROP TRIGGER trg_user_requires_tenant_on_active_update');
    fixture.db.prepare("UPDATE User SET tenant_id = NULL WHERE id = 'user-unassigned'").run();
    await expect(authorizeTenantRequest(
      await requestFor('/api/report', 'user-unassigned'), environment()
    )).resolves.toMatchObject({ status: 403, message: AUTH_MESSAGES.TENANT_ASSIGNMENT_PENDING });

    fixture.db.prepare("UPDATE User SET tenant_id = 'tenant-off' WHERE id = 'user-a'").run();
    await expect(authorizeTenantRequest(
      await requestFor('/api/report', 'user-a'), environment()
    )).resolves.toMatchObject({ status: 403, message: AUTH_MESSAGES.TENANT_UNAVAILABLE });
  });

  it('checks the user assignment and tenant status in one D1 read', async () => {
    const request = await requestFor('/api/report', 'user-a');
    const prepare = vi.spyOn(fixture.d1, 'prepare');

    const decision = await authorizeTenantRequest(request, environment());

    expect(decision.status).toBeUndefined();
    expect(prepare).toHaveBeenCalledTimes(1);
    expect(prepare.mock.calls[0]?.[0]).toContain('LEFT JOIN TenantMaster');
  });

  it('rejects inactive users and enforces administrator-only database routes', async () => {
    await expect(authorizeTenantRequest(
      await requestFor('/api/report', 'user-suspended'), environment()
    )).resolves.toMatchObject({ status: 401 });

    await expect(authorizeTenantRequest(
      await requestFor('/api/db/schema', 'user-a'), environment()
    )).resolves.toMatchObject({ status: 403, message: AUTH_MESSAGES.FORBIDDEN_ADMIN_ONLY });

    const adminDecision = await authorizeTenantRequest(
      await requestFor('/api/db/schema', 'admin-a'), environment()
    );
    expect(adminDecision.status).toBeUndefined();
    expect(adminDecision.environment?.REQUEST_TENANT_ID).toBe('tenant-a');
  });

  it('binds authenticated users to their assigned tenant and replaces client scope headers', async () => {
    const request = await requestFor('/api/report', 'user-a', {
      headers: { 'x-tenant-id': 'tenant-a', 'x-buyer-id': 'tenant-a', 'x-resolved-tenant-id': 'tenant-b' }
    });
    const decision = await authorizeTenantRequest(request, environment());

    expect(decision.status).toBeUndefined();
    expect(decision.environment?.REQUEST_TENANT_ID).toBe('tenant-a');
    expect(decision.environment).toMatchObject({ REQUEST_USER_ID: 'user-a', REQUEST_USER_ROLE: 'USER' });
    expect(decision.request?.headers.get('x-tenant-id')).toBe('tenant-a');
    expect(decision.request?.headers.get('x-buyer-id')).toBe('tenant-a');
    expect(decision.request?.headers.get('x-resolved-tenant-id')).toBe('tenant-a');
  });

  it.each([
    ['/api/report?tenantId=tenant-b', {}],
    ['/api/report?buyerId=tenant-b', {}],
    ['/api/report', { headers: { 'x-tenant-id': 'tenant-b' } }],
    ['/api/report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tenant_id: 'tenant-b' }) }]
  ])('rejects client-selected tenant outside the account assignment (%s)', async (path, init) => {
    const log = vi.spyOn(logger, 'warn');
    const decision = await authorizeTenantRequest(await requestFor(path, 'user-a', init), environment());

    expect(decision).toMatchObject({ status: 403, message: AUTH_MESSAGES.TENANT_SCOPE_FORBIDDEN });
    expect(log).toHaveBeenCalledWith('Rejected a tenant scope that does not match the authenticated user assignment', expect.objectContaining({ userId: 'user-a' }));
  });

  it('rejects invalid or conflicting tenant selectors before routing', async () => {
    const invalid = await authorizeTenantRequest(
      await requestFor('/api/report?tenantId=%20', 'user-a'), environment()
    );
    const conflict = await authorizeTenantRequest(
      await requestFor('/api/report?tenantId=tenant-a&buyerId=tenant-b', 'user-a'), environment()
    );

    expect(invalid).toMatchObject({ status: 400, message: AUTH_MESSAGES.TENANT_SCOPE_INVALID });
    expect(conflict).toMatchObject({ status: 400, message: AUTH_MESSAGES.TENANT_SCOPE_INVALID });
  });

  it('keeps administrators inside their assigned tenant for scoped reporting', async () => {
    const decision = await authorizeTenantRequest(
      await requestFor('/api/report?tenantId=tenant-a', 'admin-a'), environment()
    );

    expect(decision.status).toBeUndefined();
    expect(decision.environment?.REQUEST_TENANT_ID).toBe('tenant-a');
    expect(decision.environment).toMatchObject({ REQUEST_USER_ID: 'admin-a', REQUEST_USER_ROLE: 'ADMIN' });
    expect(decision.request?.headers.get('x-resolved-tenant-id')).toBe('tenant-a');
  });

  it('rejects administrator-selected tenant overrides', async () => {
    await expect(authorizeTenantRequest(
      await requestFor('/api/report?tenantId=tenant-b', 'admin-a'), environment()
    )).resolves.toMatchObject({ status: 403, message: AUTH_MESSAGES.TENANT_SCOPE_FORBIDDEN });
  });

  it('requires tenant assignment for administrators on tenant data routes while retaining control-plane access', async () => {
    fixture.db.prepare('UPDATE User SET tenant_id = NULL WHERE id = ?').run('admin-a');
    await expect(authorizeTenantRequest(
      await requestFor('/api/report?tenantId=tenant-b', 'admin-a'), environment()
    )).resolves.toMatchObject({ status: 403, message: AUTH_MESSAGES.TENANT_ASSIGNMENT_PENDING });
    const controlPlane = await authorizeTenantRequest(
      await requestFor('/api/db/schema', 'admin-a'), environment()
    );
    expect(controlPlane.status).toBeUndefined();
  });

  it('lets malformed JSON reach the route parser and rejects unknown tenant IDs', async () => {
    const malformed = await authorizeTenantRequest(await requestFor('/api/report', 'user-a', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{'
    }), environment());
    const missing = await authorizeTenantRequest(
      await requestFor('/api/report?tenantId=missing', 'admin-a'), environment()
    );

    expect(malformed.status).toBeUndefined();
    expect(missing.status).toBe(403);
  });

  it('bounds tenant-selector inspection while retaining the authenticated tenant for large requests', async () => {
    const oversized = await requestFor('/api/report', 'user-a', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenant_id: 'tenant-b', payload: 'x'.repeat(WORKER_JSON_BODY_MAX_BYTES) })
    });
    const decision = await authorizeTenantRequest(oversized, environment());

    expect(decision.status).toBeUndefined();
    expect(decision.environment?.REQUEST_TENANT_ID).toBe('tenant-a');
    expect(decision.request?.headers.get('x-resolved-tenant-id')).toBe('tenant-a');
  });
});
