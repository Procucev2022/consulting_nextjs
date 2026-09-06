/**
 * GraphQL Types and Interfaces (Frontend)
 * 
 * Centralized TypeScript types for GraphQL client requests, responses, and composite payloads.
 */

import type {
  TenantMaster,
  RawDocumentIngestion,
  ValidationPreCheckRecord,
  SpendCategorySummary,
  SavingsOpportunity,
  ConversionFunnelPhase
} from './models';

export interface GraphQLErrorItem {
  message: string;
  locations?: Array<{ line: number; column: number }>;
  path?: Array<string | number>;
}

export interface GraphQLResponse<T> {
  data?: T;
  errors?: GraphQLErrorItem[];
}

export interface QueryMetricsData {
  totalQueries: number;
  slowQueries: number;
  cacheHitRatio: number;
  averageDurationMs: number;
  recentAudits?: Array<{
    queryId: string;
    operation: string;
    model: string;
    durationMs: number;
    cached: boolean;
    timestamp: string;
  }>;
}

export interface DashboardOverviewData {
  tenant: TenantMaster;
  categories: SpendCategorySummary[];
  opportunities: SavingsOpportunity[];
  funnelStages: ConversionFunnelPhase[];
  ingestionQueue: RawDocumentIngestion[];
  validationRecords: ValidationPreCheckRecord[];
  queryMetrics: QueryMetricsData;
}

export interface GraphQLClientOptions {
  endpoint?: string;
  headers?: Record<string, string>;
}
