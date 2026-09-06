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

export interface PerformanceBudgetLimits {
  maxJsBundleKb: number;
  maxCriticalCssKb: number;
  maxSharedJsChunkKb: number;
  maxTotalPageJsKb: number;
}

export interface AssetSizeMetric {
  filePath: string;
  rawBytes: number;
  gzipBytes: number;
  rawKb: number;
  gzipKb: number;
}

export interface PerformanceBudgetCheckResult {
  success: boolean;
  totalSharedJsGzipKb: number;
  criticalCssGzipKb: number;
  totalPageJsGzipKb: number;
  violations: string[];
  summary: string;
  assetMetrics: AssetSizeMetric[];
}

