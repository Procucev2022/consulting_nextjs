/**
 * Backend Performance Optimization Types & Interfaces
 */

export interface SystemLatencyMetric {
  operation: string;
  durationMs: number;
  thresholdMs: number;
  isSlow: boolean;
  timestamp: string;
}

export interface MemoryUsageProfile {
  heapUsedMb: number;
  heapTotalMb: number;
  rssMb: number;
  isHigh: boolean;
  timestamp: string;
}

export interface PerformanceAuditReport {
  status: 'OPTIMAL' | 'DEGRADED' | 'CRITICAL';
  slowQueriesCount: number;
  slowRequestsCount: number;
  averageLatencyMs: number;
  evaluatedAt: string;
}
