import type { CloudflareD1PreparedStatement } from './cloudflare';

export interface R2ObjectCleanupJob {
  cleanup_id: string;
  tenant_id: string;
  object_key: string;
  reason: string;
  attempt_count: number;
}

export interface R2ObjectCleanupInput {
  tenantId: string;
  objectKey: string;
  reason: string;
}

export interface R2ObjectCleanupOptions {
  requestId?: string;
  tenantId?: string;
  objectKey?: string;
  limit?: number;
}

export interface R2ObjectCleanupResult {
  selected: number;
  deleted: number;
  failed: number;
  skipped: boolean;
}

export interface R2ObjectCleanupJobOutcome {
  statements: CloudflareD1PreparedStatement[];
  deleted: number;
  failed: number;
}

export interface R2ObjectCleanupAggregate {
  statements: CloudflareD1PreparedStatement[];
  deleted: number;
  failed: number;
}
