import { CACHE_GENERATION_SQL } from '../constants/db';
import type { CloudflareD1Database } from '../types/cloudflare';
import logger from '../utils/logger';

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
