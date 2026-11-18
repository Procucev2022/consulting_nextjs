import { beforeAll, afterAll, describe, expect, it, vi } from 'vitest';
import { API_ERROR_CODE } from '../src/constants/errors';
import type { CloudflareEnvironment, CloudflareExecutionContext, CloudflareRateLimiter } from '../src/types/cloudflare';
import { fetch as workerFetch } from '../src/worker';
import { createWorkerAuthToken } from '../src/workerAuth';
import {
  createWorkerDatabase, runtimeEnvironment, WORKER_CORE_SECRET, type WorkerDatabaseFixture
} from './helpers/workerCoreFixtures';

interface FrontendApiCall {
  method: 'GET' | 'POST';
  path: string;
}

const ADMIN_USER_ID = 'usr-route-contract-admin';
const ADMIN_EMAIL = 'route-contract-admin@example.test';
const ADMIN_TENANT_ID = 'TNT-GLOBAL-8902';
// The deployed bindings are declared in wrangler.jsonc. This stub stands in for them and admits every request, so a
// route answers with its handler's own status instead of the fail-closed 503 used when a binding is missing.
const ADMITTING_RATE_LIMITER: CloudflareRateLimiter = { limit: async () => ({ success: true }) };

/**
 * Backend routes that the frontend calls without path parameters. Each call must reach a handler when an
 * administrator makes it. An unknown path, or a known path with the wrong method, answers with the Worker's
 * ROUTE_NOT_FOUND code, and this suite rejects that answer. Add a row here whenever a frontend call is added or renamed.
 */
const FRONTEND_API_CALLS: readonly FrontendApiCall[] = [
  { method: 'GET', path: '/api/ai/config' },
  { method: 'POST', path: '/api/ai/extract' },
  { method: 'POST', path: '/api/ai/categorize' },
  { method: 'POST', path: '/api/ai/executive-summary' },
  { method: 'POST', path: '/api/ai/analyze-anomalies' },
  { method: 'POST', path: '/api/auth/login' },
  { method: 'POST', path: '/api/auth/register' },
  { method: 'GET', path: '/api/auth/me' },
  { method: 'POST', path: '/api/auth/change-password' },
  { method: 'GET', path: '/api/admin/users' },
  { method: 'GET', path: '/api/admin/tenants' },
  { method: 'GET', path: '/api/categories' },
  { method: 'GET', path: '/api/categories?details=true' },
  { method: 'GET', path: '/api/vendors' },
  { method: 'GET', path: '/api/vendors?details=true' },
  { method: 'GET', path: '/api/savings' },
  { method: 'GET', path: '/api/taxonomy?limit=10&offset=0' },
  { method: 'GET', path: '/api/procurement/category-mappings' },
  { method: 'GET', path: '/api/pcbi/historical-observations' },
  { method: 'POST', path: '/api/graphql' },
  { method: 'POST', path: '/api/telemetry/client-error' },
  { method: 'GET', path: '/api/reports/executive-brief/opportunity-brief/report' },
  { method: 'POST', path: '/api/reports/executive-brief/email' },
  { method: 'GET', path: '/api/reports/executive-brief/download/opportunity-brief/pdf' },
  { method: 'GET', path: '/api/reports/executive-brief/download/opportunity-brief/pptx' },
  { method: 'GET', path: '/api/subscription/admin/list' },
  { method: 'GET', path: '/api/subscription/admin/audit-trail' },
  { method: 'GET', path: '/api/module2/sourcing/alternate-sourcing' },
  { method: 'GET', path: '/api/module2/sourcing/category-specialisation' },
  { method: 'GET', path: '/api/module2/sourcing/category-specialisation/export-excel' },
  { method: 'GET', path: '/api/module2/sourcing/consolidated-savings' },
  { method: 'GET', path: '/api/module2/sourcing/payment-terms' },
  { method: 'GET', path: '/api/module2/sourcing/payment-terms/export-excel' },
  { method: 'GET', path: '/api/module2/sourcing/procurement-compliance' },
  { method: 'GET', path: '/api/module2/sourcing/procurement-compliance/export-excel' },
  { method: 'POST', path: '/api/module2/sourcing/procurement-compliance/review' },
  { method: 'GET', path: '/api/module2/sourcing/specification-rationalisation' },
  { method: 'GET', path: '/api/module2/sourcing/specification-rationalisation/export-excel' },
  { method: 'POST', path: '/api/module2/sourcing/specification-rationalisation/review' },
  { method: 'POST', path: '/api/module2/sourcing/vendor-consolidation/mappings/update' },
  { method: 'POST', path: '/api/module2/sourcing/vendor-consolidation/mappings/bulk-update' },
  { method: 'GET', path: '/api/module2/sourcing/volume-aggregation' },
  { method: 'GET', path: '/api/module2/sourcing/volume-aggregation/export-excel' }
];

describe('frontend API route contract', () => {
  let fixture: WorkerDatabaseFixture;
  let execution: CloudflareExecutionContext;
  let environment: CloudflareEnvironment;
  let adminToken: string;

  beforeAll(async () => {
    fixture = createWorkerDatabase();
    fixture.db.prepare(
      "INSERT OR IGNORE INTO TenantMaster (tenant_id, enterprise_name, status) VALUES ('TNT-GLOBAL-8902', 'Demo tenant', 'ACTIVE')"
    ).run();
    fixture.db.prepare(
      `INSERT INTO User (id, name, mobile_number, email, company_name, company_address, password_hash, role, status, subscription_tier, tenant_id)
       VALUES (?, 'Route Contract Admin', '0000000000', ?, 'Demo company', 'Demo address', 'unused', 'ADMIN', 'ACTIVE', 'PLATINUM', ?)`
    ).run(ADMIN_USER_ID, ADMIN_EMAIL, ADMIN_TENANT_ID);
    adminToken = await createWorkerAuthToken({
      id: ADMIN_USER_ID, email: ADMIN_EMAIL, role: 'ADMIN', subscription_tier: 'PLATINUM', tenant_id: ADMIN_TENANT_ID
    }, WORKER_CORE_SECRET);
    execution = { waitUntil: vi.fn(), passThroughOnException: vi.fn() };
    environment = runtimeEnvironment({
      DB: fixture.d1,
      D1_DATABASE_NAME: 'consulting-dev',
      AUTH_RATE_LIMITER: ADMITTING_RATE_LIMITER,
      CLIENT_ERROR_RATE_LIMITER: ADMITTING_RATE_LIMITER
    });
  });

  afterAll(() => {
    fixture.close();
  });

  it.each(FRONTEND_API_CALLS)('serves $method $path', async ({ method, path }) => {
    const response = await workerFetch(
      new Request(`https://edge.example.com${path}`, {
        method,
        headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
        body: method === 'GET' ? undefined : '{}'
      }),
      environment,
      execution
    );
    const body = await response.text();

    expect(body).not.toContain(API_ERROR_CODE.ROUTE_NOT_FOUND);
    expect(response.status).toBeLessThan(500);
  });

  it('reports an unregistered path with the route-not-found code, so a missing route cannot pass the contract', async () => {
    const response = await workerFetch(
      new Request('https://edge.example.com/api/contract-probe-unregistered', {
        headers: { Authorization: `Bearer ${adminToken}` }
      }),
      environment,
      execution
    );

    expect(response.status).toBe(404);
    expect(await response.text()).toContain(API_ERROR_CODE.ROUTE_NOT_FOUND);
  });
});
