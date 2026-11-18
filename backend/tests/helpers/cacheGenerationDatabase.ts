import { vi } from 'vitest';
import { CACHE_GENERATION_SQL } from '../../src/constants/db';
import type { CloudflareD1Database } from '../../src/types/cloudflare';

/** Generation counters by scope key. Databases that share one store behave like isolates that share one D1 database. */
export type CacheGenerationStore = Map<string, number>;

export interface CacheGenerationStatement {
  bind: (...values: unknown[]) => CacheGenerationStatement;
  first: () => Promise<{ generation: number } | null>;
  run: () => Promise<{ success: boolean }>;
}

export const createCacheGenerationStore = (): CacheGenerationStore => new Map();

/** Answers the CacheGeneration read and bump statements the way D1 does. Any other SQL returns undefined. */
export const cacheGenerationStatement = (
  sql: string,
  store: CacheGenerationStore
): CacheGenerationStatement | undefined => {
  if (sql !== CACHE_GENERATION_SQL.read && sql !== CACHE_GENERATION_SQL.bump) return undefined;
  let scopeKey = '';
  const statement: CacheGenerationStatement = {
    bind: (...values: unknown[]) => {
      scopeKey = String(values[0]);
      return statement;
    },
    first: async () => (store.has(scopeKey) ? { generation: store.get(scopeKey) ?? 0 } : null),
    run: async () => {
      store.set(scopeKey, (store.get(scopeKey) ?? 0) + 1);
      return { success: true };
    }
  };
  return statement;
};

/** A database double that answers only the generation statements. */
export const createCacheGenerationDatabase = (
  store: CacheGenerationStore = createCacheGenerationStore()
): CloudflareD1Database => ({
  prepare: vi.fn((sql: string) => cacheGenerationStatement(sql, store))
}) as unknown as CloudflareD1Database;
