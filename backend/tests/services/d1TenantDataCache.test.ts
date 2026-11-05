import { afterEach, describe, expect, it, vi } from 'vitest';
import { D1_TENANT_DATA_CACHE_KEYS, D1_TENANT_DATA_CACHE_MAX_ROWS } from '../../src/constants/db';
import type { CloudflareD1Database } from '../../src/types/cloudflare';
import { clearD1ReferenceDataCache } from '../../src/services/d1ReferenceDataCache';
import { getTenantD1Data, invalidateTenantD1Data } from '../../src/services/d1TenantDataCache';
import { getD1RuntimeMetrics } from '../../src/services/d1QueryTelemetry';

describe('tenant-scoped D1 dataset cache', () => {
  afterEach(() => {
    clearD1ReferenceDataCache();
    vi.restoreAllMocks();
  });

  it('isolates tenants, serves cached data, and refreshes an invalidated dataset', async () => {
    const database = { prepare: vi.fn() } as unknown as CloudflareD1Database;
    const load = vi.fn(async (tenantId: string) => [{ tenantId }]);

    const firstTenantLoad = await getTenantD1Data(
      database, 'TNT-1', D1_TENANT_DATA_CACHE_KEYS.CATEGORIES_SUMMARY, () => load('TNT-1')
    );
    const firstTenantHit = await getTenantD1Data(
      database, 'TNT-1', D1_TENANT_DATA_CACHE_KEYS.CATEGORIES_SUMMARY, () => load('stale-TNT-1')
    );
    const secondTenantLoad = await getTenantD1Data(
      database, 'TNT-2', D1_TENANT_DATA_CACHE_KEYS.CATEGORIES_SUMMARY, () => load('TNT-2')
    );

    expect(firstTenantLoad).toEqual([{ tenantId: 'TNT-1' }]);
    expect(firstTenantHit).toEqual([{ tenantId: 'TNT-1' }]);
    expect(secondTenantLoad).toEqual([{ tenantId: 'TNT-2' }]);
    expect(load).toHaveBeenCalledTimes(2);

    invalidateTenantD1Data(database, 'TNT-1', D1_TENANT_DATA_CACHE_KEYS.CATEGORIES_SUMMARY);
    await expect(getTenantD1Data(
      database, 'TNT-1', D1_TENANT_DATA_CACHE_KEYS.CATEGORIES_SUMMARY, () => load('fresh-TNT-1')
    )).resolves.toEqual([{ tenantId: 'fresh-TNT-1' }]);
    expect(load).toHaveBeenCalledTimes(3);
    expect(getD1RuntimeMetrics(database)).toMatchObject({ cacheHits: 1, cacheMisses: 3 });
  });

  it('returns oversized tenant datasets without retaining them in the cache', async () => {
    const database = { prepare: vi.fn() } as unknown as CloudflareD1Database;
    const largeDataset = Array.from({ length: D1_TENANT_DATA_CACHE_MAX_ROWS + 1 }, (_value, index) => ({ index }));
    const load = vi.fn(async () => largeDataset);

    await expect(getTenantD1Data(
      database, 'TNT-LARGE', D1_TENANT_DATA_CACHE_KEYS.VENDOR_DETAILS, load
    )).resolves.toBe(largeDataset);
    await getTenantD1Data(database, 'TNT-LARGE', D1_TENANT_DATA_CACHE_KEYS.VENDOR_DETAILS, load);

    expect(load).toHaveBeenCalledTimes(2);
    expect(getD1RuntimeMetrics(database)).toMatchObject({ cacheHits: 0, cacheMisses: 2 });
  });
});
