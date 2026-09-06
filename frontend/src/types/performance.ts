/**
 * Frontend Performance Optimization Types & Interfaces
 */

export interface PerformanceMetric {
  name: string;
  durationMs: number;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface PerformanceBenchmarkConfig {
  maxSharedBundleKb: number;
  maxInitialRouteJsKb: number;
  targetApiLatencyMs: number;
  slowRenderThresholdMs: number;
  defaultClientCacheTtlMs: number;
}

export interface ClientCacheEntry<T> {
  key: string;
  data: T;
  cachedAt: number;
  ttlMs: number;
}

export interface ComponentRenderMetric {
  componentName: string;
  renderDurationMs: number;
  isSlow: boolean;
  timestamp: string;
}
