import {
  D1_RUNTIME_RECENT_AUDIT_LIMIT,
  D1_QUERY_LOG_MESSAGES,
  SLOW_QUERY_ROWS_READ_THRESHOLD,
  SLOW_QUERY_THRESHOLD_MS
} from '../constants/db';
import type {
  CloudflareD1Database,
  CloudflareD1PreparedStatement,
  CloudflareD1QueryMeta
} from '../types/cloudflare';
import type { D1RequestMetrics, D1RuntimeMetrics, D1RuntimeMetricsState } from '../types/d1';
import type { D1ReferenceCacheStatus, QueryAuditLog } from '../types/db';
import logger from '../utils/logger';

interface PreparedStatementMetadata {
  statement: CloudflareD1PreparedStatement;
  sql: string;
  requestId: string;
  metrics: D1RequestMetrics;
  cacheIdentity: CloudflareD1Database;
}

const preparedStatements = new WeakMap<object, PreparedStatementMetadata>();
const instrumentedDatabases = new WeakSet<object>();
const cacheIdentityByDatabase = new WeakMap<CloudflareD1Database, CloudflareD1Database>();
const requestMetricsByDatabase = new WeakMap<CloudflareD1Database, D1RequestMetrics>();
const runtimeMetricsByDatabase = new WeakMap<CloudflareD1Database, D1RuntimeMetricsState>();

const emptyMetrics = (): D1RequestMetrics => ({
  totalQueries: 0,
  failedQueries: 0,
  slowQueries: 0,
  cacheHits: 0,
  cacheMisses: 0,
  totalDurationMs: 0,
  totalRowsRead: 0,
  totalRowsWritten: 0
});

const getRuntimeState = (database: CloudflareD1Database): D1RuntimeMetricsState => {
  const cacheIdentity = getD1DatabaseCacheIdentity(database);
  let state = runtimeMetricsByDatabase.get(cacheIdentity);
  if (!state) {
    state = { ...emptyMetrics(), recentAudits: [] };
    runtimeMetricsByDatabase.set(cacheIdentity, state);
  }
  return state;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const readQueryMeta = (result: unknown): CloudflareD1QueryMeta | undefined => {
  if (!isObject(result) || !isObject(result.meta)) return undefined;
  return result.meta as CloudflareD1QueryMeta;
};

const affectedRows = (result: unknown, meta: CloudflareD1QueryMeta | undefined): number => {
  if (typeof meta?.changes === 'number') return meta.changes;
  if (isObject(result) && Array.isArray(result.results)) return result.results.length;
  return result === null || result === undefined ? 0 : 1;
};

const operationFor = (sql: string): string => sql.trim().match(/^[A-Za-z]+/)?.[0].toUpperCase() || 'UNKNOWN';

const modelFor = (sql: string): string | undefined =>
  sql.match(/\b(?:FROM|JOIN|INTO|UPDATE|TABLE)\s+[`"']?([\w.]+)/i)?.[1];

const isSlowQuery = (
  durationMs: number,
  databaseDurationMs: number | undefined,
  rowsRead: number
): boolean => durationMs > SLOW_QUERY_THRESHOLD_MS
  || (databaseDurationMs !== undefined && databaseDurationMs > SLOW_QUERY_THRESHOLD_MS)
  || rowsRead > SLOW_QUERY_ROWS_READ_THRESHOLD;

const addQueryToTotals = (
  metrics: D1RequestMetrics,
  durationMs: number,
  rowsRead: number,
  rowsWritten: number,
  failed: boolean,
  slow: boolean
): void => {
  metrics.totalQueries += 1;
  metrics.totalDurationMs += durationMs;
  metrics.totalRowsRead += rowsRead;
  metrics.totalRowsWritten += rowsWritten;
  if (failed) metrics.failedQueries += 1;
  if (slow) metrics.slowQueries += 1;
};

const appendRecentAudit = (
  runtime: D1RuntimeMetricsState,
  metadata: PreparedStatementMetadata,
  durationMs: number,
  result: unknown,
  meta: CloudflareD1QueryMeta | undefined
): void => {
  const audit: QueryAuditLog = {
    queryId: `${metadata.requestId}:${metadata.metrics.totalQueries}`,
    requestId: metadata.requestId,
    operation: operationFor(metadata.sql),
    model: modelFor(metadata.sql) || 'UNKNOWN',
    durationMs,
    cached: false,
    rowsAffected: affectedRows(result, meta),
    timestamp: new Date().toISOString()
  };
  runtime.recentAudits.unshift(audit);
  if (runtime.recentAudits.length > D1_RUNTIME_RECENT_AUDIT_LIMIT) {
    runtime.recentAudits.length = D1_RUNTIME_RECENT_AUDIT_LIMIT;
  }
};

const recordQuery = (
  metadata: PreparedStatementMetadata,
  startedAt: number,
  result?: unknown,
  failure?: unknown,
  failed = false
): void => {
  const durationMs = Date.now() - startedAt;
  const meta = readQueryMeta(result);
  const rowsRead = meta?.rows_read || 0;
  const rowsWritten = meta?.rows_written || 0;
  const slow = isSlowQuery(durationMs, meta?.duration, rowsRead);
  addQueryToTotals(metadata.metrics, durationMs, rowsRead, rowsWritten, failed, slow);
  const runtime = getRuntimeState(metadata.cacheIdentity);
  addQueryToTotals(runtime, durationMs, rowsRead, rowsWritten, failed, slow);
  appendRecentAudit(runtime, metadata, durationMs, result, meta);

  const context = {
    requestId: metadata.requestId,
    operation: operationFor(metadata.sql),
    model: modelFor(metadata.sql),
    durationMs,
    databaseDurationMs: meta?.duration,
    rowsRead: meta?.rows_read,
    rowsWritten: meta?.rows_written,
    affectedRows: affectedRows(result, meta),
    cacheStatus: 'miss'
  };
  if (failed) logger.error(D1_QUERY_LOG_MESSAGES.failed, context, failure);
  else if (slow) logger.warn(D1_QUERY_LOG_MESSAGES.slow, context);
  else logger.debug(D1_QUERY_LOG_MESSAGES.completed, context);
};

const wrapStatement = (
  statement: CloudflareD1PreparedStatement,
  sql: string,
  requestId: string,
  metrics: D1RequestMetrics,
  cacheIdentity: CloudflareD1Database
): CloudflareD1PreparedStatement => {
  const metadata = { statement, sql, requestId, metrics, cacheIdentity };
  const wrapped = new Proxy(statement, {
    get(target, property) {
      if (property === 'bind') {
        return (...values: unknown[]) => {
          try {
            return wrapStatement(target.bind(...values), sql, requestId, metrics, cacheIdentity);
          } catch (error) {
            recordQuery(metadata, Date.now(), undefined, error, true);
            throw error;
          }
        };
      }
      if (property === 'first' || property === 'all' || property === 'run') {
        return async (...args: unknown[]) => {
          const startedAt = Date.now();
          try {
            const result = await Reflect.apply(Reflect.get(target, property, target), target, args);
            recordQuery(metadata, startedAt, result);
            return result;
          } catch (error) {
            recordQuery(metadata, startedAt, undefined, error, true);
            throw error;
          }
        };
      }
      const value = Reflect.get(target, property, target);
      return typeof value === 'function' ? value.bind(target) : value;
    }
  });
  preparedStatements.set(wrapped, metadata);
  return wrapped;
};

export const createD1RequestMetrics = (): D1RequestMetrics => emptyMetrics();

export const recordD1CacheAccess = (
  database: CloudflareD1Database,
  cacheStatus: D1ReferenceCacheStatus
): void => {
  const requestMetrics = requestMetricsByDatabase.get(database);
  const runtimeMetrics = getRuntimeState(database);
  if (cacheStatus === 'miss') {
    if (requestMetrics) requestMetrics.cacheMisses += 1;
    runtimeMetrics.cacheMisses += 1;
    return;
  }
  if (requestMetrics) requestMetrics.cacheHits += 1;
  runtimeMetrics.cacheHits += 1;
};

export const getD1RuntimeMetrics = (database?: CloudflareD1Database): D1RuntimeMetrics => {
  const state = database
    ? runtimeMetricsByDatabase.get(getD1DatabaseCacheIdentity(database))
    : undefined;
  const metrics = state || { ...emptyMetrics(), recentAudits: [] };
  const cacheLookups = metrics.cacheHits + metrics.cacheMisses;
  return {
    ...metrics,
    cacheHitRatio: cacheLookups > 0 ? metrics.cacheHits / cacheLookups : 0,
    averageDurationMs: metrics.totalQueries > 0 ? metrics.totalDurationMs / metrics.totalQueries : 0,
    recentAudits: [...metrics.recentAudits]
  };
};

export const instrumentD1Database = (
  database: CloudflareD1Database,
  requestId: string,
  metrics: D1RequestMetrics
): CloudflareD1Database => {
  const cacheIdentity = getD1DatabaseCacheIdentity(database);
  const wrapped = new Proxy(database, {
    get(target, property) {
      if (property === 'prepare') {
        return (sql: string) => {
          const startedAt = Date.now();
          try {
            return wrapStatement(target.prepare(sql), sql, requestId, metrics, cacheIdentity);
          } catch (error) {
            recordQuery(
              { statement: {} as CloudflareD1PreparedStatement, sql, requestId, metrics, cacheIdentity },
              startedAt,
              undefined,
              error,
              true
            );
            throw error;
          }
        };
      }
      if (property === 'batch' && target.batch) {
        return async (statements: CloudflareD1PreparedStatement[]) => {
          const startedAt = Date.now();
          const metadata = statements.map((statement) => preparedStatements.get(statement));
          const nativeStatements = statements.map((statement, index) => metadata[index]?.statement || statement);
          try {
            const results = await target.batch?.call(target, nativeStatements) || [];
            metadata.forEach((query, index) => {
              if (query) recordQuery(query, startedAt, results[index]);
            });
            return results;
          } catch (error) {
            metadata.forEach((query) => {
              if (query) recordQuery(query, startedAt, undefined, error, true);
            });
            throw error;
          }
        };
      }
      const value = Reflect.get(target, property, target);
      return typeof value === 'function' ? value.bind(target) : value;
    }
  });
  instrumentedDatabases.add(wrapped);
  cacheIdentityByDatabase.set(wrapped, cacheIdentity);
  requestMetricsByDatabase.set(wrapped, metrics);
  return wrapped;
};

export const getD1DatabaseCacheIdentity = (
  database: CloudflareD1Database
): CloudflareD1Database => cacheIdentityByDatabase.get(database) || database;

export const isD1DatabaseInstrumented = (database: CloudflareD1Database): boolean =>
  instrumentedDatabases.has(database);
