import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handleDatabaseRoute } from '../src/workerD1Database';
import type { CloudflareEnvironment } from '../src/types/cloudflare';
import { createWorkerDatabase, runtimeEnvironment, type WorkerDatabaseFixture } from './helpers/workerCoreFixtures';

let fixture: WorkerDatabaseFixture;

beforeEach(() => {
  fixture = createWorkerDatabase();
});

afterEach(() => {
  fixture.close();
  vi.restoreAllMocks();
});

const requestFor = (path: string): Request => new Request(`https://edge.example.test/api/db/${path}`);

const environment = (overrides: CloudflareEnvironment = {}): CloudflareEnvironment =>
  runtimeEnvironment({ DB: fixture.d1, ...overrides });

describe('handleDatabaseRoute', () => {
  it('builds the D1 schema catalog with one table-valued pragma query', async () => {
    const prepare = vi.spyOn(fixture.d1, 'prepare');
    const response = await handleDatabaseRoute(requestFor('schema'), environment());
    const body = await response.json() as { data: Array<{ entity_name: string; primary_attributes: string }> };
    const tenant = body.data.find(({ entity_name }) => entity_name === 'TenantMaster');

    expect(response.status).toBe(200);
    expect(prepare).toHaveBeenCalledTimes(1);
    expect(prepare.mock.calls[0]?.[0]).toContain('pragma_table_info');
    expect(tenant?.primary_attributes).toContain('tenant_id');
  });

  it.each(['init', 'seed'])('keeps /%s as a deployment-only operation', async (operation) => {
    const response = await handleDatabaseRoute(requestFor(operation), environment());

    expect(response.status).toBe(405);
    await expect(response.json()).resolves.toMatchObject({ success: false });
  });

  it('reports live D1 table and record totals for status', async () => {
    const response = await handleDatabaseRoute(requestFor('status'), environment({ D1_DATABASE_NAME: 'consulting_dev' }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: {
        isConnected: true, provider: 'Cloudflare D1', databaseName: 'consulting_dev',
        tablesCount: expect.any(Number), totalRecords: expect.any(Number)
      }
    });
  });

  it('returns 503 when status has no D1 binding', async () => {
    const response = await handleDatabaseRoute(requestFor('status'), environment({ DB: undefined }));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({ success: false });
  });

  it('reports connection configuration with and without a binding', async () => {
    const connected = await handleDatabaseRoute(requestFor('test-connection'), environment());
    const disconnected = await handleDatabaseRoute(requestFor('test-connection'), environment({ DB: undefined }));

    await expect(connected.json()).resolves.toMatchObject({ data: { success: true, provider: 'Cloudflare D1' } });
    await expect(disconnected.json()).resolves.toMatchObject({ data: { success: false, provider: 'Cloudflare D1' } });
  });

  it('returns runtime query metrics and cache size for the admin metrics route', async () => {
    const response = await handleDatabaseRoute(requestFor('metrics'), environment());
    const body = await response.json() as { data: { metrics: Record<string, unknown>; cacheSize: number } };

    expect(response.status).toBe(200);
    expect(body.data.metrics).toHaveProperty('totalQueries');
    expect(body.data.metrics).toHaveProperty('slowQueries');
    expect(body.data.cacheSize).toBeGreaterThanOrEqual(0);
  });
});
