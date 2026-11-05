import type { D1_TENANT_DATA_CACHE_KEYS } from '../constants/db';

/**
 * Database Optimization & Query Audit Types (Backend)
 */

export type D1TenantDataCacheKey = typeof D1_TENANT_DATA_CACHE_KEYS[keyof typeof D1_TENANT_DATA_CACHE_KEYS];

export interface QueryAuditLog {
  queryId: string;
  requestId: string;
  operation: string;
  model: string;
  durationMs: number;
  cached: boolean;
  rowsAffected?: number;
  timestamp: string;
}

export interface QueryMetrics {
  totalQueries: number;
  cacheHits: number;
  cacheMisses: number;
  cacheHitRatioPct: number;
  slowQueriesCount: number;
  avgDurationMs: number;
}

export interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export type D1ReferenceCacheStatus = 'hit' | 'miss' | 'coalesced';

export interface D1ReferenceCacheResult<T> {
  value: T;
  cacheStatus: D1ReferenceCacheStatus;
}

export type D1ReferenceCacheEntries = Map<string, CacheEntry<unknown>>;
export type D1ReferenceCacheLoads = Map<string, Promise<unknown>>;

export interface D1ReferenceCacheState {
  entries: D1ReferenceCacheEntries;
  loads: D1ReferenceCacheLoads;
}
