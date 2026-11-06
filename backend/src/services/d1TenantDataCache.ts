import { D1_TENANT_DATA_CACHE_MAX_ROWS } from '../constants/db';
import type { CloudflareD1Database } from '../types/cloudflare';
import type { D1TenantDataCacheKey } from '../types/db';
import { clearD1ReferenceDataCache, getOrLoadD1ReferenceData } from './d1ReferenceDataCache';

const cacheKeyForTenant = (dataset: D1TenantDataCacheKey, tenantId: string): string => `${dataset}:${tenantId}`;

const shouldCacheTenantData = (value: unknown): boolean =>
  !Array.isArray(value) || value.length <= D1_TENANT_DATA_CACHE_MAX_ROWS;

export const getTenantD1Data = async <T>(
  database: CloudflareD1Database,
  tenantId: string,
  dataset: D1TenantDataCacheKey,
  load: () => Promise<T>
): Promise<T> => {
  const cached = await getOrLoadD1ReferenceData(
    database, cacheKeyForTenant(dataset, tenantId), load, undefined, shouldCacheTenantData
  );
  return cached.value;
};

export const invalidateTenantD1Data = (
  database: CloudflareD1Database,
  tenantId: string,
  dataset: D1TenantDataCacheKey
): void => {
  clearD1ReferenceDataCache(database, cacheKeyForTenant(dataset, tenantId));
};
