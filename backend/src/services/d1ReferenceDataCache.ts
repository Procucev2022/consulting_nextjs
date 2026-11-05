import { DEFAULT_CACHE_TTL_MS, D1_REFERENCE_CACHE_MAX_ENTRIES } from '../constants/db';
import type { CloudflareD1Database } from '../types/cloudflare';
import type { D1ReferenceCacheResult, D1ReferenceCacheState } from '../types/db';
import { getD1DatabaseCacheIdentity, recordD1CacheAccess } from './d1QueryTelemetry';

let cacheByDatabase = new WeakMap<CloudflareD1Database, D1ReferenceCacheState>();

const getState = (database: CloudflareD1Database): D1ReferenceCacheState => {
  const cacheIdentity = getD1DatabaseCacheIdentity(database);
  let state = cacheByDatabase.get(cacheIdentity);
  if (!state) {
    state = { entries: new Map(), loads: new Map() };
    cacheByDatabase.set(cacheIdentity, state);
  }
  return state;
};

const removeExpiredEntries = (state: D1ReferenceCacheState, now: number): void => {
  for (const [key, entry] of state.entries) {
    if (entry.expiresAt <= now) state.entries.delete(key);
  }
};

export const clearD1ReferenceDataCache = (
  database?: CloudflareD1Database,
  cacheKey?: string
): void => {
  if (!database) {
    cacheByDatabase = new WeakMap<CloudflareD1Database, D1ReferenceCacheState>();
    return;
  }
  if (cacheKey) {
    const state = cacheByDatabase.get(getD1DatabaseCacheIdentity(database));
    state?.entries.delete(cacheKey);
    state?.loads.delete(cacheKey);
    return;
  }
  cacheByDatabase.delete(getD1DatabaseCacheIdentity(database));
};

export const getOrLoadD1ReferenceData = async <T>(
  database: CloudflareD1Database,
  cacheKey: string,
  load: () => Promise<T>,
  ttlMs = DEFAULT_CACHE_TTL_MS
): Promise<D1ReferenceCacheResult<T>> => {
  const state = getState(database);
  const now = Date.now();
  const cached = state.entries.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    state.entries.delete(cacheKey);
    state.entries.set(cacheKey, cached);
    recordD1CacheAccess(database, 'hit');
    return { value: cached.data as T, cacheStatus: 'hit' };
  }
  if (cached) state.entries.delete(cacheKey);

  const inFlight = state.loads.get(cacheKey);
  if (inFlight) {
    recordD1CacheAccess(database, 'coalesced');
    return { value: await inFlight as T, cacheStatus: 'coalesced' };
  }

  recordD1CacheAccess(database, 'miss');
  const pending = Promise.resolve().then(load);
  state.loads.set(cacheKey, pending);
  try {
    const value = await pending;
    if (state.loads.get(cacheKey) === pending) {
      const loadedAt = Date.now();
      removeExpiredEntries(state, loadedAt);
      while (state.entries.size >= D1_REFERENCE_CACHE_MAX_ENTRIES) {
        const oldestKey = state.entries.keys().next().value as string;
        state.entries.delete(oldestKey);
      }
      state.entries.set(cacheKey, { data: value, expiresAt: loadedAt + ttlMs });
    }
    return { value, cacheStatus: 'miss' };
  } finally {
    if (state.loads.get(cacheKey) === pending) state.loads.delete(cacheKey);
  }
};

export const getD1ReferenceDataCacheSize = (database?: CloudflareD1Database): number => {
  if (!database) return 0;
  const state = cacheByDatabase.get(getD1DatabaseCacheIdentity(database));
  if (!state) return 0;
  removeExpiredEntries(state, Date.now());
  return state.entries.size;
};
