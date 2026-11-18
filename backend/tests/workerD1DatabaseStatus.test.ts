import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { D1_DATABASE_STATUS_CACHE_TTL_MS } from '../src/constants/db';
import { fetch as workerFetch } from '../src/worker';
import type { CloudflareEnvironment, CloudflareExecutionContext } from '../src/types/cloudflare';
import { createWorkerAuthToken } from '../src/workerAuth';
import {
  createWorkerDatabase, runtimeEnvironment, WORKER_CORE_SECRET, type WorkerDatabaseFixture
} from './helpers/workerCoreFixtures';

const ADMIN_USER_ID = 'usr-status-admin';
const ADMIN_EMAIL = 'status-admin@example.test';
const ADMIN_TENANT_ID = 'TNT-GLOBAL-8902';
const FROZEN_NOW = '2026-11-17T10:00:00.000Z';

describe('database status counts', () => {
  let fixture: WorkerDatabaseFixture;
  let execution: CloudflareExecutionContext;

  beforeEach(() => {
    fixture = createWorkerDatabase();
    fixture.db.prepare(
      "INSERT OR IGNORE INTO TenantMaster (tenant_id, enterprise_name, status) VALUES ('TNT-GLOBAL-8902', 'Demo tenant', 'ACTIVE')"
    ).run();
    fixture.db.prepare(
      `INSERT INTO User (id, name, mobile_number, email, company_name, company_address, password_hash, role, status, subscription_tier, tenant_id)
       VALUES (?, 'Status Admin', '0000000000', ?, 'Demo company', 'Demo address', 'unused', 'ADMIN', 'ACTIVE', 'PLATINUM', ?)`
    ).run(ADMIN_USER_ID, ADMIN_EMAIL, ADMIN_TENANT_ID);
    execution = { waitUntil: vi.fn(), passThroughOnException: vi.fn() };
  });

  afterEach(() => {
    fixture.close();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const adminToken = (): Promise<string> => createWorkerAuthToken({
    id: ADMIN_USER_ID, email: ADMIN_EMAIL, role: 'ADMIN', subscription_tier: 'PLATINUM', tenant_id: ADMIN_TENANT_ID
  }, WORKER_CORE_SECRET);

  const pollStatus = async (environment: CloudflareEnvironment, token: string): Promise<Record<string, unknown>> => {
    const response = await workerFetch(
      new Request('https://edge.example.com/api/db/status', { headers: { Authorization: `Bearer ${token}` } }),
      environment,
      execution
    );
    expect(response.status).toBe(200);
    return (await response.json()) as Record<string, unknown>;
  };

  it('reuses the ledger counts for repeated polls and reports which polls reused them', async () => {
    const environment = runtimeEnvironment({ DB: fixture.d1, D1_DATABASE_NAME: 'consulting-dev' });
    const token = await adminToken();
    const prepare = vi.spyOn(fixture.d1, 'prepare');
    const countQueries = (): number => prepare.mock.calls.filter(([sql]) => String(sql).includes('COUNT(*)')).length;

    const first = await pollStatus(environment, token);
    const countsAfterFirstPoll = countQueries();
    const second = await pollStatus(environment, token);

    expect(countsAfterFirstPoll).toBeGreaterThan(0);
    expect(countQueries()).toBe(countsAfterFirstPoll);
    expect(first.data).toMatchObject({ statusCacheStatus: 'miss', databaseName: 'consulting-dev' });
    expect(second.data).toMatchObject({
      statusCacheStatus: 'hit',
      totalRecords: (first.data as { totalRecords: number }).totalRecords
    });
  });

  it('recounts the ledger once the reuse window has passed', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(FROZEN_NOW));
    const environment = runtimeEnvironment({ DB: fixture.d1 });
    const token = await adminToken();
    const frozenMs = Date.parse(FROZEN_NOW);

    expect((await pollStatus(environment, token)).data).toMatchObject({ statusCacheStatus: 'miss' });
    vi.setSystemTime(frozenMs + D1_DATABASE_STATUS_CACHE_TTL_MS - 1);
    expect((await pollStatus(environment, token)).data).toMatchObject({ statusCacheStatus: 'hit' });
    vi.setSystemTime(frozenMs + D1_DATABASE_STATUS_CACHE_TTL_MS);
    expect((await pollStatus(environment, token)).data).toMatchObject({ statusCacheStatus: 'miss' });
  });
});
