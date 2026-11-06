import { D1_QUERY_LOG_MESSAGES, SLOW_QUERY_ROWS_READ_THRESHOLD, SLOW_QUERY_THRESHOLD_MS } from '../constants/db';
import type { CloudflareD1Database, CloudflareD1PreparedStatement, CloudflareD1QueryMeta } from '../types/cloudflare';
import type { D1BatchQueryMeasurement, D1PreparedStatementTelemetryMetadata } from '../types/d1';
import logger from '../utils/logger';

type RecordD1Query = (
  metadata: D1PreparedStatementTelemetryMetadata,
  startedAt: number,
  result?: unknown,
  failure?: unknown,
  failed?: boolean,
  batchMeasurement?: D1BatchQueryMeasurement
) => void;

type D1BatchEnabledDatabase = CloudflareD1Database & {
  batch: NonNullable<CloudflareD1Database['batch']>;
};

const readQueryMeta = (result: unknown): CloudflareD1QueryMeta | undefined => {
  if (typeof result !== 'object' || result === null || !('meta' in result)) return undefined;
  const meta = result.meta;
  return typeof meta === 'object' && meta !== null ? meta as CloudflareD1QueryMeta : undefined;
};

const getQueryDuration = (
  meta: CloudflareD1QueryMeta | undefined,
  batchSize: number,
  batchDurationMs: number
): Pick<D1BatchQueryMeasurement, 'queryDurationMs' | 'durationSource'> => {
  if (typeof meta?.duration === 'number' && Number.isFinite(meta.duration)) {
    return { queryDurationMs: meta.duration, durationSource: 'database' };
  }
  return {
    queryDurationMs: batchDurationMs / batchSize,
    durationSource: 'batch-allocation'
  };
};

const isSlowQuery = (durationMs: number, meta: CloudflareD1QueryMeta | undefined): boolean =>
  durationMs > SLOW_QUERY_THRESHOLD_MS
  || (typeof meta?.duration === 'number' && meta.duration > SLOW_QUERY_THRESHOLD_MS)
  || (meta?.rows_read || 0) > SLOW_QUERY_ROWS_READ_THRESHOLD;

export const runInstrumentedD1Batch = async (
  database: D1BatchEnabledDatabase,
  statements: CloudflareD1PreparedStatement[],
  preparedStatements: WeakMap<object, D1PreparedStatementTelemetryMetadata>,
  recordQuery: RecordD1Query
): Promise<unknown[]> => {
  const startedAt = Date.now();
  const metadata = statements.map((statement) => preparedStatements.get(statement));
  const nativeStatements = statements.map((statement, index) => metadata[index]?.statement || statement);
  const batchSize = statements.length;

  try {
    const results = await database.batch.call(database, nativeStatements);
    const batchDurationMs = Date.now() - startedAt;
    metadata.forEach((query, index) => {
      if (!query) return;
      const resultMeta = readQueryMeta(results[index]);
      recordQuery(query, startedAt, results[index], undefined, false, {
        ...getQueryDuration(resultMeta, batchSize, batchDurationMs),
        batchDurationMs,
        batchSize,
        batchStatementIndex: index + 1
      });
    });
    const hasSlowStatement = metadata.some((query, index) => {
      if (!query) return false;
      const resultMeta = readQueryMeta(results[index]);
      const { queryDurationMs } = getQueryDuration(resultMeta, batchSize, batchDurationMs);
      return isSlowQuery(queryDurationMs, resultMeta);
    });
    if (batchDurationMs > SLOW_QUERY_THRESHOLD_MS && !hasSlowStatement) {
      logger.warn(D1_QUERY_LOG_MESSAGES.slowBatch, {
        requestId: metadata.find(Boolean)?.requestId,
        operation: 'BATCH',
        model: 'D1',
        durationMs: batchDurationMs,
        batchSize
      });
    }
    return results;
  } catch (error) {
    const batchDurationMs = Date.now() - startedAt;
    metadata.forEach((query, index) => {
      if (!query) return;
      recordQuery(query, startedAt, undefined, error, true, {
        queryDurationMs: batchDurationMs / batchSize,
        durationSource: 'batch-allocation',
        batchDurationMs,
        batchSize,
        batchStatementIndex: index + 1
      });
    });
    throw error;
  }
};
