import {
  DEFAULT_CACHE_TTL_MS, D1_MODULE2_ANALYSIS_CACHE_MAX_ENTRIES, D1_MODULE2_ANALYSIS_CACHE_MAX_ROWS
} from '../constants/db';
import type { CloudflareD1Database } from '../types/cloudflare';
import type { ScopedModule2Analysis, ScopedModule2CacheEntry } from '../types/module2D1Scoped';
import type { ProcurementTransactionScope } from '../types/procurementTransactionD1';
import logger from '../utils/logger';
import { getD1DatabaseCacheIdentity, recordD1CacheAccess } from './d1QueryTelemetry';

type ScopedModule2Cache = Map<string, ScopedModule2CacheEntry>;

let caches = new WeakMap<CloudflareD1Database, ScopedModule2Cache>();

const getScopeCacheKey = (tenantId?: string, assessmentId?: string): string =>
  JSON.stringify([tenantId || '', assessmentId || null]);

export const getScopedModule2Cache = (database: CloudflareD1Database): ScopedModule2Cache => {
  const identity = getD1DatabaseCacheIdentity(database);
  let cache = caches.get(identity);
  if (!cache) {
    cache = new Map();
    caches.set(identity, cache);
  }
  return cache;
};

const readCachedAnalysis = (
  database: CloudflareD1Database,
  cache: ScopedModule2Cache,
  key: string,
  refresh: boolean
): ScopedModule2CacheEntry | undefined => {
  const now = Date.now();
  for (const [cachedKey, entry] of cache) {
    if (entry.expiresAt <= now) cache.delete(cachedKey);
  }
  const entry = cache.get(key);
  if (!refresh && entry && entry.expiresAt > now) {
    cache.delete(key);
    cache.set(key, entry);
    recordD1CacheAccess(database, 'hit');
    return entry;
  }
  if (entry) cache.delete(key);
  return undefined;
};

const evictOldestAnalysis = (cache: ScopedModule2Cache): void => {
  const oldestKey = cache.keys().next().value as string;
  cache.delete(oldestKey);
};

const cacheLoadedAnalysis = (
  cache: ScopedModule2Cache,
  key: string,
  entry: ScopedModule2CacheEntry,
  result: ScopedModule2Analysis
): void => {
  if (cache.get(key) !== entry) return;
  entry.rowCount = result.transactions.length;
  if (entry.rowCount > D1_MODULE2_ANALYSIS_CACHE_MAX_ROWS) {
    cache.delete(key);
    return;
  }
  while ([...cache.values()].reduce((total, cachedEntry) => total + cachedEntry.rowCount, 0) >
    D1_MODULE2_ANALYSIS_CACHE_MAX_ROWS) evictOldestAnalysis(cache);
};

export const getOrLoadScopedModule2Analysis = async (
  database: CloudflareD1Database,
  scope: ProcurementTransactionScope,
  refresh: boolean,
  requestId: string,
  load: () => Promise<ScopedModule2Analysis>
): Promise<ScopedModule2Analysis> => {
  const cache = getScopedModule2Cache(database);
  const key = getScopeCacheKey(scope.tenantId, scope.assessmentId);
  const cached = readCachedAnalysis(database, cache, key, refresh);
  if (cached) return cached.value;
  recordD1CacheAccess(database, 'miss');
  while (cache.size >= D1_MODULE2_ANALYSIS_CACHE_MAX_ENTRIES) evictOldestAnalysis(cache);
  const entry: ScopedModule2CacheEntry = {
    expiresAt: Date.now() + DEFAULT_CACHE_TTL_MS,
    rowCount: 0,
    value: Promise.resolve().then(load)
  };
  cache.set(key, entry);
  try {
    const result = await entry.value;
    cacheLoadedAnalysis(cache, key, entry, result);
    return result;
  } catch (error) {
    if (cache.get(key) === entry) cache.delete(key);
    logger.error('Could not calculate assessment-scoped sourcing results', { ...scope, requestId }, error);
    throw error;
  }
};

export const clearScopedModule2Cache = (
  database?: CloudflareD1Database,
  tenantId?: string,
  assessmentId?: string
): void => {
  if (!database) {
    caches = new WeakMap();
    return;
  }
  const cache = caches.get(getD1DatabaseCacheIdentity(database));
  if (!cache) return;
  if (!tenantId) {
    cache.clear();
    return;
  }
  if (assessmentId !== undefined) {
    cache.delete(getScopeCacheKey(tenantId, assessmentId));
    return;
  }
  for (const key of cache.keys()) {
    const [cachedTenantId] = JSON.parse(key) as [string];
    if (cachedTenantId === tenantId) cache.delete(key);
  }
};
