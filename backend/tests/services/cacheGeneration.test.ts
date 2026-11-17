import { describe, expect, it, vi } from 'vitest';
import { bumpCacheGeneration, readCacheGeneration } from '../../src/services/cacheGeneration';
import { getTenantD1Data, invalidateTenantD1Data } from '../../src/services/d1TenantDataCache';
import { D1_TENANT_DATA_CACHE_KEYS } from '../../src/constants/db';
import { createWorkerDatabase } from '../helpers/workerCoreFixtures';

describe('cache generations', () => {
  it('reads zero for a scope that never changed and counts each bump', async () => {
    const fixture = createWorkerDatabase();
    try {
      await expect(readCacheGeneration(fixture.d1, 'scope-a')).resolves.toBe(0);
      await bumpCacheGeneration(fixture.d1, 'scope-a');
      await bumpCacheGeneration(fixture.d1, 'scope-a');
      await expect(readCacheGeneration(fixture.d1, 'scope-a')).resolves.toBe(2);
      await expect(readCacheGeneration(fixture.d1, 'scope-b')).resolves.toBe(0);
    } finally {
      fixture.close();
    }
  });

  it('serves the cached copy until the generation advances in D1', async () => {
    const fixture = createWorkerDatabase();
    const dataset = D1_TENANT_DATA_CACHE_KEYS.SAVINGS_OPPORTUNITIES;
    const load = vi.fn(async () => [{ rank: 1 }]);
    try {
      await getTenantD1Data(fixture.d1, 'TNT-1', dataset, load);
      await getTenantD1Data(fixture.d1, 'TNT-1', dataset, load);
      expect(load).toHaveBeenCalledTimes(1);

      // A write made through another isolate advances the generation in D1. This isolate has no local invalidation.
      await bumpCacheGeneration(fixture.d1, `${dataset}:TNT-1`);
      load.mockResolvedValueOnce([{ rank: 2 }]);
      await expect(getTenantD1Data(fixture.d1, 'TNT-1', dataset, load)).resolves.toEqual([{ rank: 2 }]);
      expect(load).toHaveBeenCalledTimes(2);
    } finally {
      fixture.close();
    }
  });

  it('reloads the invalidated tenant and keeps other tenants cached', async () => {
    const fixture = createWorkerDatabase();
    const dataset = D1_TENANT_DATA_CACHE_KEYS.VENDOR_RANKINGS;
    const load = vi.fn(async () => [{ vendor: 'A' }]);
    try {
      await getTenantD1Data(fixture.d1, 'TNT-1', dataset, load);
      await getTenantD1Data(fixture.d1, 'TNT-2', dataset, load);
      await invalidateTenantD1Data(fixture.d1, 'TNT-1', dataset);
      await getTenantD1Data(fixture.d1, 'TNT-1', dataset, load);
      await getTenantD1Data(fixture.d1, 'TNT-2', dataset, load);
      expect(load).toHaveBeenCalledTimes(3);
    } finally {
      fixture.close();
    }
  });
});
