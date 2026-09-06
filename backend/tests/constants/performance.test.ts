import { describe, it, expect } from 'vitest';
import {
  BACKEND_PERFORMANCE_BENCHMARKS,
  PERFORMANCE_AUDIT_STATUS,
} from '../../src/constants/performance';

describe('Backend Performance Constants', () => {
  it('should define benchmark thresholds accurately', () => {
    expect(BACKEND_PERFORMANCE_BENCHMARKS.SLOW_QUERY_THRESHOLD_MS).toBe(100);
    expect(BACKEND_PERFORMANCE_BENCHMARKS.SLOW_HTTP_THRESHOLD_MS).toBe(250);
    expect(BACKEND_PERFORMANCE_BENCHMARKS.HIGH_MEMORY_USAGE_MB).toBe(512);
    expect(BACKEND_PERFORMANCE_BENCHMARKS.MAX_CACHE_ENTRIES).toBe(1000);
    expect(BACKEND_PERFORMANCE_BENCHMARKS.DEFAULT_CACHE_TTL_MS).toBe(60000);
  });

  it('should define performance audit statuses', () => {
    expect(PERFORMANCE_AUDIT_STATUS.OPTIMAL).toBe('OPTIMAL');
    expect(PERFORMANCE_AUDIT_STATUS.DEGRADED).toBe('DEGRADED');
    expect(PERFORMANCE_AUDIT_STATUS.CRITICAL).toBe('CRITICAL');
  });
});
