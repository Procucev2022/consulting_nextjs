/**
 * Frontend Performance Optimization Constants & Benchmarks
 * 
 * Standardized thresholds for bundle budgets, critical paths, and caching policies.
 */

export const PERFORMANCE_BENCHMARKS = {
  MAX_SHARED_BUNDLE_KB: 120,
  MAX_INITIAL_ROUTE_JS_KB: 350,
  TARGET_API_LATENCY_MS: 200,
  SLOW_RENDER_THRESHOLD_MS: 50,
  DEFAULT_CLIENT_CACHE_TTL_MS: 60000,
} as const;

export const RESOURCE_CACHE_STRATEGIES = {
  MEMORY_FIRST: 'MEMORY_FIRST',
  NETWORK_ONLY: 'NETWORK_ONLY',
  CACHE_THEN_NETWORK: 'CACHE_THEN_NETWORK',
} as const;
