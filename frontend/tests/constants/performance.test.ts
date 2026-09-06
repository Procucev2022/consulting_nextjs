import { describe, it, expect } from 'vitest';
import {
  PERFORMANCE_BENCHMARKS,
  RESOURCE_CACHE_STRATEGIES
} from '../../src/constants/performance';

describe('Frontend Performance Constants', () => {
  it('should define realistic performance benchmark thresholds', () => {
    expect(PERFORMANCE_BENCHMARKS.MAX_SHARED_BUNDLE_KB).toBeGreaterThan(0);
    expect(PERFORMANCE_BENCHMARKS.MAX_INITIAL_ROUTE_JS_KB).toBeGreaterThan(
      PERFORMANCE_BENCHMARKS.MAX_SHARED_BUNDLE_KB
    );
    expect(PERFORMANCE_BENCHMARKS.TARGET_API_LATENCY_MS).toBe(200);
    expect(PERFORMANCE_BENCHMARKS.SLOW_RENDER_THRESHOLD_MS).toBe(50);
    expect(PERFORMANCE_BENCHMARKS.DEFAULT_CLIENT_CACHE_TTL_MS).toBe(60000);
  });

  it('should expose standardized resource cache strategy identifiers', () => {
    expect(RESOURCE_CACHE_STRATEGIES.MEMORY_FIRST).toBe('MEMORY_FIRST');
    expect(RESOURCE_CACHE_STRATEGIES.NETWORK_ONLY).toBe('NETWORK_ONLY');
    expect(RESOURCE_CACHE_STRATEGIES.CACHE_THEN_NETWORK).toBe('CACHE_THEN_NETWORK');
  });
});
