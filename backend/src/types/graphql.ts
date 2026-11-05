/**
 * GraphQL Types and Interfaces (Backend)
 * 
 * Centralized TypeScript types for GraphQL requests, contexts, resolver arguments, and payloads.
 */

import type { RawDocumentIngestion, TenantMaster, ValidationPreCheckRecord } from './models';
import type { CloudflareD1Database } from './cloudflare';

export interface GraphQLIngestionCursor {
  version: 1;
  kind: 'ingestionQueue' | 'validationRecords';
  tenantId: string;
  timestamp: string;
  id: string;
}

export interface GraphQLIngestionPageRequest {
  first: number;
  cursor?: GraphQLIngestionCursor;
}

export interface GraphQLPageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

export interface GraphQLConnection<T> {
  items: T[];
  pageInfo: GraphQLPageInfo;
}

export type IngestionQueueConnection = GraphQLConnection<RawDocumentIngestion>;

export type ValidationRecordsConnection = GraphQLConnection<ValidationPreCheckRecord>;

export interface GraphQLContext {
  requestId: string;
  tenantId?: string;
  userId?: string;
  role?: string;
  timestamp: string;
}

export interface D1GraphQLContext extends GraphQLContext {
  db: CloudflareD1Database;
}

export interface GraphQLRequestPayload {
  query: string;
  variables?: Record<string, unknown> | null;
  operationName?: string | null;
}

export interface CategoryDetailsArgs {
  id?: string;
}

export interface UpdateTenantArgs {
  input: Partial<TenantMaster>;
}

export interface IngestionInputArgs {
  input: {
    file_name: string;
    file_type: string;
    file_size_mb: number;
    records_count?: number;
  };
}

export interface ValidationRecordArgs {
  input: {
    record_id: string;
    issue_flag?: string;
    action_status?: string;
    resolved?: boolean;
  };
}

export interface MergeVendorArgs {
  input: {
    targetName: string;
    masterId: string;
    canonicalName: string;
  };
}

export interface DeployOpportunityArgs {
  id: string;
  targetModule: 'proCPX' | 'DPS NXT';
}

export interface MergeVendorResult {
  success: boolean;
  affected: number;
}
