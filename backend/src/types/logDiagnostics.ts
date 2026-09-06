/**
 * Backend Log Diagnostics & Error Resolution Types
 */

export interface DiagnosticLogEntry {
  timestamp: string;
  level: string;
  service: string;
  message: string;
  requestId?: string;
  context?: Record<string, unknown>;
  error?: {
    name?: string;
    message?: string;
    stack?: string;
  };
}

export interface ErrorCluster {
  category: string;
  fingerprint: string;
  count: number;
  sampleMessage: string;
  affectedEndpoints: string[];
  firstSeen: string;
  lastSeen: string;
}

export interface AutoResolveRecommendation {
  category: string;
  fingerprint: string;
  action: string;
  recommendation: string;
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface LogDiagnosticReport {
  totalLinesParsed: number;
  errorCount: number;
  warnCount: number;
  clusters: ErrorCluster[];
  recommendations: AutoResolveRecommendation[];
  generatedAt: string;
}
