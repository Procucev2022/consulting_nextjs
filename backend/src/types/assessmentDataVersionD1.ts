import type { CloudflareD1Database, CloudflareEnvironment } from './cloudflare';
import type { WorkerD1Result } from './d1';
import type { CloudflareD1PreparedStatement } from './cloudflare';
import type { AssessmentRecord, AssessmentAnalysisRun } from './assessment';
import type { D1Record } from './d1';

export interface AssessmentRow extends D1Record {
  assessment_id: string;
  tenant_id: string;
  customer_id: string;
  assessment_owner?: string;
  data_status?: string;
}

export type AssessmentLifecycleLoadedResult =
  | { ok: false; result: WorkerD1Result }
  | { ok: true; row: AssessmentRow; snapshot: D1Record; assessment: AssessmentRecord };

export type AssessmentRunLoadedResult =
  | { ok: false; result: WorkerD1Result }
  | { ok: true; row: D1Record; run: AssessmentAnalysisRun };

export type AssessmentAuditStatement = CloudflareD1PreparedStatement;

export interface AssessmentDatasetActionContext {
  db: CloudflareD1Database;
  environment: CloudflareEnvironment;
  assessmentId: string;
  body: unknown;
  requestId?: string;
  uploadedBy?: string;
}

export interface AssessmentSnapshotReadContext {
  assessmentId?: string;
  requestId?: string;
  tenantId?: string;
}

export interface AssessmentValidationSummary {
  sourceRowCount: number;
  validRowCount: number;
  excludedRowCount: number;
  anomalyRowCount: number;
  cleanSpendYieldPct: number;
}

export interface AssessmentUploadPayload {
  fileName: string;
  fileSize: number;
  checksum: string;
  expectedChecksum?: string;
  notes?: string;
  fileBase64: string;
}

export interface AssessmentLifecycleActionContext {
  db: CloudflareD1Database;
  environment: CloudflareEnvironment;
  assessmentId: string;
  action: 'approve' | 'delivery-package' | 'deliver' | 'accept' | 'close';
  body: unknown;
  actorEmail: string;
  actorRole: string;
  requestId?: string;
}

export type AssessmentDatasetActionResult = WorkerD1Result;
