import { SLOW_QUERY_ROWS_READ_THRESHOLD, SLOW_QUERY_THRESHOLD_MS } from '../constants/db';
import { D1_ROUTE_MESSAGES } from '../constants/d1';
import type { CloudflareD1Database, CloudflareD1PreparedStatement } from '../types/cloudflare';
import type { D1Record } from '../types/d1';
import logger from '../utils/logger';
import { isD1DatabaseInstrumented } from './d1QueryTelemetry';

export const requireWorkerDb = (db?: CloudflareD1Database): CloudflareD1Database => {
  if (!db) throw new Error(D1_ROUTE_MESSAGES.missingBinding);
  return db;
};

export const runD1Statements = async (
  db: CloudflareD1Database,
  statements: CloudflareD1PreparedStatement[]
): Promise<void> => {
  if (db.batch) {
    await db.batch(statements);
    return;
  }
  for (const statement of statements) await statement.run();
};

export const queryD1Rows = async <T = D1Record>(
  db: CloudflareD1Database,
  sql: string,
  values: unknown[] = [],
  requestId?: string
): Promise<T[]> => {
  const startedAt = Date.now();
  const instrumented = isD1DatabaseInstrumented(db);
  try {
    const statement = db.prepare(sql);
    const result = await (values.length ? statement.bind(...values) : statement).all<T>();
    const rows = result.results || [];
    const durationMs = Date.now() - startedAt;
    const rowsRead = result.meta?.rows_read;
    const databaseDurationMs = result.meta?.duration;
    const context = {
      operation: 'SELECT', model: sql.match(/\bFROM\s+(\w+)/i)?.[1],
      durationMs, databaseDurationMs, rowsRead, rowsWritten: result.meta?.rows_written,
      cacheStatus: 'miss', affectedRows: rows.length, requestId
    };
    if (!instrumented && (
      durationMs > SLOW_QUERY_THRESHOLD_MS ||
      (databaseDurationMs !== undefined && databaseDurationMs > SLOW_QUERY_THRESHOLD_MS) ||
      (rowsRead !== undefined && rowsRead > SLOW_QUERY_ROWS_READ_THRESHOLD)
    )) logger.warn('Slow D1 dataset query', context);
    else if (!instrumented) logger.debug('D1 dataset query completed', context);
    return rows;
  } catch (error) {
    if (!instrumented) logger.error('D1 dataset query failed', { durationMs: Date.now() - startedAt, requestId }, error);
    throw error;
  }
};
