import { D1_TENANT_DATA_CACHE_MAX_ROWS } from '../constants/db';
import type { CloudflareD1Database } from '../types/cloudflare';
import type { D1TenantDataCacheKey } from '../types/db';
import { bumpCacheGeneration, readCacheGeneration } from './cacheGeneration';
import { getOrLoadD1ReferenceData } from './d1ReferenceDataCache';

// One generation per dataset of each tenant. A write advances it in D1, so the next request on any isolate reads the
// new generation and uses a different cache key. Copies under older generations age out of the reference cache.
const scopeKeyForTenant = (dataset: D1TenantDataCacheKey, tenantId: string): string => `${dataset}:${tenantId}`;

const shouldCacheTenantData = (value: unknown): boolean =>
  !Array.isArray(value) || value.length <= D1_TENANT_DATA_CACHE_MAX_ROWS;

export const getTenantD1Data = async <T>(
  database: CloudflareD1Database,
  tenantId: string,
  dataset: D1TenantDataCacheKey,
  load: () => Promise<T>
): Promise<T> => {
  const scopeKey = scopeKeyForTenant(dataset, tenantId);
  const generation = await readCacheGeneration(database, scopeKey);
  const cached = await getOrLoadD1ReferenceData(
    database, `${scopeKey}#${generation}`, load, undefined, shouldCacheTenantData
  );
  return cached.value;
};

/** Advances the dataset generation in D1 after a write. Other isolates stop using their copy on the next request. */
export const invalidateTenantD1Data = async (
  database: CloudflareD1Database,
  tenantId: string,
  dataset: D1TenantDataCacheKey
): Promise<void> => {
  await bumpCacheGeneration(database, scopeKeyForTenant(dataset, tenantId));
};
