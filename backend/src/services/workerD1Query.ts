import { SLOW_QUERY_ROWS_READ_THRESHOLD, SLOW_QUERY_THRESHOLD_MS } from '../constants/db';
import { D1_LOG_ACTIONS, D1_LOG_MESSAGES, D1_ROUTE_MESSAGES } from '../constants/d1';
import type { CloudflareD1Database, CloudflareD1PreparedStatement } from '../types/cloudflare';
import type { D1Record } from '../types/d1';
import type { D1AtomicWriteContext } from '../types/d1AtomicWrite';
import logger from '../utils/logger';
import { isD1DatabaseInstrumented } from './d1QueryTelemetry';

export const requireWorkerDb = (db?: CloudflareD1Database): CloudflareD1Database => {
  if (!db) throw new Error(D1_ROUTE_MESSAGES.missingBinding);
  return db;
};

export const requireD1AtomicBatch: (
  db: CloudflareD1Database,
  context: D1AtomicWriteContext,
  statementCount?: number
  ) => asserts db is CloudflareD1Database & { batch: NonNullable<CloudflareD1Database['batch']> } = (
  db,
  context,
  statementCount
) => {
  if (db.batch) return;
  const error = new Error(D1_ROUTE_MESSAGES.atomicBatchUnavailable);
  const operation = context.operation ?? context.action ?? D1_LOG_ACTIONS.atomicBatchUnavailable;
  logger.error(D1_LOG_MESSAGES.atomicBatchUnavailable, {
    ...context,
    operation,
    action: operation,
    statementCount,
    fallback: 'none'
  }, error);
  throw error;
};

export const runD1Statements = async (
  db: CloudflareD1Database,
  statements: CloudflareD1PreparedStatement[],
  context: D1AtomicWriteContext = { operation: D1_LOG_ACTIONS.atomicBatchUnavailable }
): Promise<void> => {
  if (statements.length === 0) return;
  const operation = context.operation ?? context.action ?? D1_LOG_ACTIONS.atomicBatchUnavailable;
  const logContext = { ...context, operation, action: operation };
  if (statements.length === 1) {
    try {
      if (db.batch) await db.batch(statements);
      else await statements[0].run();
    } catch (error: unknown) {
      logger.error(D1_LOG_MESSAGES.atomicWriteFailed, { ...logContext, statementCount: statements.length }, error);
      throw error;
    }
    return;
  }

  // Multi-statement writes fail before execution unless one atomic batch is available.
  requireD1AtomicBatch(db, context, statements.length);
  try {
    await db.batch(statements);
  } catch (error: unknown) {
    logger.error(D1_LOG_MESSAGES.atomicWriteFailed, { ...logContext, statementCount: statements.length }, error);
    throw error;
  }
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
