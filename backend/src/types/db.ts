/**
 * Database Optimization & Query Audit Types (Backend)
 */

export interface QueryAuditLog {
  queryId: string;
  operation: string;
  model: string;
  durationMs: number;
  cached: boolean;
  rowsAffected?: number;
  timestamp: string;
}

export interface QueryMetrics {
  totalQueries: number;
  cacheHits: number;
  cacheMisses: number;
  cacheHitRatioPct: number;
  slowQueriesCount: number;
  avgDurationMs: number;
}

export interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}
