import { describe, it, expect, beforeEach, vi } from 'vitest';
import { queryAuditor } from '../../src/utils/queryAuditor';
import logger from '../../src/utils/logger';

describe('QueryAuditor Utility', () => {
  beforeEach(() => {
    queryAuditor.resetQueryMetrics();
    vi.clearAllMocks();
  });

  it('should return initial zero metrics', () => {
    const metrics = queryAuditor.getQueryMetrics();
    expect(metrics.totalQueries).toBe(0);
    expect(metrics.cacheHits).toBe(0);
    expect(metrics.cacheMisses).toBe(0);
    expect(metrics.cacheHitRatioPct).toBe(0);
    expect(metrics.slowQueriesCount).toBe(0);
    expect(metrics.avgDurationMs).toBe(0);
  });

  it('should record fast cached and uncached queries', () => {
    queryAuditor.recordQueryAudit({
      queryId: 'q-1',
      operation: 'getTenant',
      model: 'TenantMaster',
      durationMs: 5,
      cached: false,
      timestamp: new Date().toISOString()
    });

    queryAuditor.recordQueryAudit({
      queryId: 'q-2',
      operation: 'getTenant',
      model: 'TenantMaster',
      durationMs: 1,
      cached: true,
      timestamp: new Date().toISOString()
    });

    const metrics = queryAuditor.getQueryMetrics();
    expect(metrics.totalQueries).toBe(2);
    expect(metrics.cacheHits).toBe(1);
    expect(metrics.cacheMisses).toBe(1);
    expect(metrics.cacheHitRatioPct).toBe(50);
    expect(metrics.slowQueriesCount).toBe(0);
    expect(metrics.avgDurationMs).toBe(3);
  });

  it('should detect slow queries and emit a warning log', () => {
    const warnSpy = vi.spyOn(logger, 'warn');

    queryAuditor.recordQueryAudit({
      queryId: 'q-slow',
      operation: 'getCategoryDetails',
      model: 'CategoryYearDetail',
      durationMs: 150,
      cached: false,
      timestamp: new Date().toISOString(),
      rowsAffected: 42
    });

    const metrics = queryAuditor.getQueryMetrics();
    expect(metrics.slowQueriesCount).toBe(1);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Slow database query detected'),
      expect.objectContaining({
        queryId: 'q-slow',
        durationMs: 150,
        rowsAffected: 42
      })
    );
  });

  it('should reset metrics properly', () => {
    queryAuditor.recordQueryAudit({
      queryId: 'q-1',
      operation: 'getTenant',
      model: 'TenantMaster',
      durationMs: 10,
      cached: false,
      timestamp: new Date().toISOString()
    });

    expect(queryAuditor.getQueryMetrics().totalQueries).toBe(1);
    queryAuditor.resetQueryMetrics();
    expect(queryAuditor.getQueryMetrics().totalQueries).toBe(0);
  });
});
