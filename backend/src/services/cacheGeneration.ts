import { CACHE_GENERATION_SQL } from '../constants/db';
import type { CloudflareD1Database } from '../types/cloudflare';
import type { D1ReferenceCacheResult } from '../types/db';
import logger from '../utils/logger';
import { getOrLoadD1ReferenceData } from './d1ReferenceDataCache';

/** Reads the generation of a cache scope from D1. A scope that has never changed is generation 0. */
export const readCacheGeneration = async (database: CloudflareD1Database, scopeKey: string): Promise<number> => {
  const row = await database.prepare(CACHE_GENERATION_SQL.read).bind(scopeKey).first<{ generation: number }>();
  return Number(row?.generation ?? 0);
};

/** Advances a cache scope in D1. Every isolate that reads the scope afterwards sees the new generation. */
export const bumpCacheGeneration = async (database: CloudflareD1Database, scopeKey: string): Promise<void> => {
  await database.prepare(CACHE_GENERATION_SQL.bump).bind(scopeKey).run();
  logger.info('Cache generation advanced', { scopeKey });
};

/**
 * Returns the cached value for `cacheKey` under the current generation of `scopeKey`. The generation is part of the
 * key, so after a bump every isolate misses and loads again.
 */
export const getGenerationalReferenceData = async <T>(
  database: CloudflareD1Database,
  scopeKey: string,
  cacheKey: string,
  load: () => Promise<T>,
  shouldCache?: (value: T) => boolean
): Promise<D1ReferenceCacheResult<T>> => {
  const generation = await readCacheGeneration(database, scopeKey);
  return getOrLoadD1ReferenceData<T>(database, `${cacheKey}#${generation}`, load, undefined, shouldCache);
};
