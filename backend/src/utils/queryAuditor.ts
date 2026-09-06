/**
 * Database Query Performance Auditor (Backend)
 *
 * Tracks query execution times, row counts, and cache utilization.
 * Issues structured warnings for queries exceeding SLOW_QUERY_THRESHOLD_MS.
 */

import { SLOW_QUERY_THRESHOLD_MS } from '../constants/db';
import type { QueryAuditLog, QueryMetrics } from '../types/db';
import logger from './logger';

class QueryAuditor {
  private totalQueries = 0;
  private cacheHits = 0;
  private cacheMisses = 0;
  private slowQueriesCount = 0;
  private totalDurationMs = 0;

  public recordQueryAudit(audit: QueryAuditLog): void {
    this.totalQueries += 1;
    this.totalDurationMs += audit.durationMs;

    if (audit.cached) {
      this.cacheHits += 1;
    } else {
      this.cacheMisses += 1;
    }

    if (audit.durationMs >= SLOW_QUERY_THRESHOLD_MS) {
      this.slowQueriesCount += 1;
      logger.warn(
        `Slow database query detected: ${audit.operation} on ${audit.model} took ${audit.durationMs}ms`,
        {
          source: 'QueryAuditor',
          queryId: audit.queryId,
          operation: audit.operation,
          model: audit.model,
          durationMs: audit.durationMs,
          thresholdMs: SLOW_QUERY_THRESHOLD_MS,
          rowsAffected: audit.rowsAffected
        }
      );
    }
  }

  public getQueryMetrics(): QueryMetrics {
    const avgDuration = this.totalQueries > 0
      ? Number((this.totalDurationMs / this.totalQueries).toFixed(2))
      : 0;

    const hitRatio = this.totalQueries > 0
      ? Number(((this.cacheHits / this.totalQueries) * 100).toFixed(2))
      : 0;

    return {
      totalQueries: this.totalQueries,
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      cacheHitRatioPct: hitRatio,
      slowQueriesCount: this.slowQueriesCount,
      avgDurationMs: avgDuration
    };
  }

  public resetQueryMetrics(): void {
    this.totalQueries = 0;
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.slowQueriesCount = 0;
    this.totalDurationMs = 0;
  }
}

export const queryAuditor = new QueryAuditor();
export default queryAuditor;
