import { SLOW_QUERY_THRESHOLD_MS } from '../constants/db';
import { D1_ROUTE_MESSAGES } from '../constants/d1';
import type { CloudflareD1Database } from '../types/cloudflare';
import type { D1Record } from '../types/d1';
import logger from '../utils/logger';

export const requireWorkerDb = (db?: CloudflareD1Database): CloudflareD1Database => {
  if (!db) throw new Error(D1_ROUTE_MESSAGES.missingBinding);
  return db;
};

export const queryD1Rows = async <T = D1Record>(
  db: CloudflareD1Database,
  sql: string,
  values: unknown[] = [],
  requestId?: string
): Promise<T[]> => {
  const startedAt = Date.now();
  try {
    const statement = db.prepare(sql);
    const result = await (values.length ? statement.bind(...values) : statement).all<T>();
    const rows = result.results || [];
    const durationMs = Date.now() - startedAt;
    const context = {
      operation: 'SELECT', model: sql.match(/\bFROM\s+(\w+)/i)?.[1],
      durationMs, cacheStatus: 'miss', affectedRows: rows.length, requestId
    };
    if (durationMs > SLOW_QUERY_THRESHOLD_MS) logger.warn('Slow D1 dataset query', context);
    else logger.debug('D1 dataset query completed', context);
    return rows;
  } catch (error) {
    logger.error('D1 dataset query failed', { durationMs: Date.now() - startedAt, requestId }, error);
    throw error;
  }
};
