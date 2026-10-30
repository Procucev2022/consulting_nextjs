/**
 * Worker-side types for the Analysis Orchestration API (D1 rows, routing, request context).
 * Shared API payload types live in ./analysisOrchestration.ts.
 */
import type { CloudflareD1Database, CloudflareD1PreparedStatement, CloudflareR2Bucket } from './cloudflare';
import type { AnalysisJobStatus, ReportWorkflowState } from './analysisOrchestration';

export type ActiveReportState = Exclude<ReportWorkflowState, 'SUPERSEDED'>;

export type OrchestrationActorRole = 'ADMIN' | 'USER';

export type OrchestrationRouteAccess = 'ADMIN' | 'CUSTOMER' | 'ANY';

export type OrchestrationHttpMethod = 'GET' | 'POST';

export type OrchestrationRouteName =
  | 'LIST_JOBS'
  | 'GET_JOB'
  | 'GET_READINESS'
  | 'RESOLVE_PCBI_GAP'
  | 'DOWNLOAD_DATASET'
  | 'UPLOAD_CORRECTED_DATASET'
  | 'GENERATE_REPORT'
  | 'QUALITY_GATE'
  | 'APPROVE_AND_SUBMIT'
  | 'RESEND_NOTIFICATION'
  | 'SUPERSEDE_REPORT'
  | 'RECORD_VIEW'
  | 'ACKNOWLEDGE'
  | 'REQUEST_CORRECTION'
  | 'ADMIN_KPIS'
  | 'NOTIFICATIONS'
  | 'AUDIT_TRAIL';

export type OrchestrationErrorCategory =
  | 'VALIDATION_ERROR'
  | 'AUTH_ERROR'
  | 'NOT_FOUND_ERROR'
  | 'CONFLICT_ERROR'
  | 'SERVER_ERROR';

export interface OrchestrationRouteSpec {
  name: OrchestrationRouteName;
  method: OrchestrationHttpMethod;
  /** Path segments after the API prefix. Segments starting with ":" are parameters. */
  segments: readonly string[];
  access: OrchestrationRouteAccess;
}

export type OrchestrationRouteMatch =
  | { kind: 'FOUND'; spec: OrchestrationRouteSpec; params: Readonly<Record<string, string>> }
  | { kind: 'METHOD_NOT_ALLOWED' }
  | { kind: 'NOT_FOUND' };

export type FoundOrchestrationRoute = Extract<OrchestrationRouteMatch, { kind: 'FOUND' }>;

export interface OrchestrationActor {
  userId: string;
  userName: string;
  role: OrchestrationActorRole;
}

export interface OrchestrationRuntime {
  now(): string;
  createId(prefix: string): string;
}

/** D1 binding plus the optional transactional batch API available on Cloudflare D1 bindings. */
export interface OrchestrationDatabase extends CloudflareD1Database {
  batch?(statements: CloudflareD1PreparedStatement[]): Promise<unknown[]>;
}

export interface OrchestrationRequestContext {
  request: Request;
  url: URL;
  database: OrchestrationDatabase;
  objects?: CloudflareR2Bucket;
  actor: OrchestrationActor;
  params: Readonly<Record<string, string>>;
  runtime: OrchestrationRuntime;
  requestId: string;
}

export interface DatasetDownloadRow {
  data_version_id: string;
  assessment_id: string;
  file_name: string;
  file_path: string | null;
  object_key: string | null;
  object_filename: string | null;
  content_type: string | null;
  size_bytes: number | null;
  object_status: string | null;
}

export type OrchestrationHandler = (context: OrchestrationRequestContext) => Promise<Response>;

export interface AssessmentJobRow {
  assessment_id: string;
  customer_id: string;
  customer_name: string;
  assessment_owner: string;
  assessment_period_start: string | null;
  assessment_period_end: string | null;
  record_spend_cr: number | null;
  created_at: string;
  updated_at: string;
  current_version_id: string | null;
  current_uploaded_by: string | null;
  current_record_count: number | null;
  original_version_id: string | null;
  run_id: string | null;
  run_version_id: string | null;
  run_spend_cr: number | null;
  run_addressable_spend_cr: number | null;
  run_is_approved: number | null;
  run_gates_passed: number | null;
  report_id: string | null;
  report_state: string | null;
  report_generated_at: string | null;
  report_submitted_at: string | null;
  report_viewed_at: string | null;
  report_acknowledged_at: string | null;
  report_updated_at: string | null;
  checklist_complete: number | null;
}

export interface DataVersionRow {
  data_version_id: string;
  assessment_id: string;
  version_number: number;
  file_name: string;
  file_size: number;
  checksum: string;
  uploaded_by: string;
  uploaded_at: string;
  record_count: number;
  notes: string | null;
}

export interface ProcurementStatsRow {
  source_document_id: string;
  supplier_count: number;
  plant_count: number;
  category_count: number;
  spend_cr: number;
}

export interface ReportRow {
  report_version_id: string;
  assessment_id: string;
  sequence_number: number;
  analysis_run_id: string;
  data_version_id: string;
  workflow_state: string;
  generated_by: string;
  generated_at: string;
  submitted_by: string | null;
  submitted_at: string | null;
  customer_viewed_at: string | null;
  acknowledged_at: string | null;
  superseded_by: string | null;
  superseded_at: string | null;
  supersede_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChecklistRow {
  checklist_id: string;
  assessment_id: string;
  report_version_id: string | null;
  checklist_json: string;
  is_complete: number;
  unconfirmed_count: number;
  confirmed_by: string;
  confirmed_at: string | null;
  created_at: string;
}

export interface AcknowledgementRow {
  acknowledgement_id: string;
  report_version_id: string;
  assessment_id: string;
  tenant_id: string;
  user_id: string;
  user_name: string;
  notes: string | null;
  acknowledged_at: string;
}

export interface CorrectionRow {
  request_id: string;
  assessment_id: string;
  tenant_id: string;
  user_id: string;
  category: string;
  description: string;
  supporting_file_name: string | null;
  status: string;
  reviewed_by: string | null;
  admin_response: string | null;
  created_at: string;
}

export interface NotificationRow {
  notification_id: string;
  recipient_type: string;
  tenant_id: string;
  assessment_id: string | null;
  report_version_id: string | null;
  title: string;
  message: string;
  severity: string;
  read_flag: number;
  email_status: string | null;
  email_last_error: string | null;
  email_retry_count: number;
  created_at: string;
}

export interface AuditRow {
  event_id: string;
  tenant_id: string;
  assessment_id: string | null;
  actor_id: string;
  actor_role: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  previous_state: string | null;
  new_state: string | null;
  metadata_json: string | null;
  created_at: string;
}

export interface UserRow {
  id: string;
  name: string;
  role: string;
  status: string;
}

export interface CountRow {
  open_count: number;
}

export interface SequenceRow {
  next_sequence: number;
}

export interface AuditEventInput {
  eventId: string;
  tenantId: string;
  assessmentId: string | null;
  actorId: string;
  actorRole: 'CUSTOMER' | 'ADMIN' | 'SYSTEM';
  eventType: string;
  entityType: string;
  entityId: string;
  previousState: string | null;
  newState: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface NotificationInput {
  notificationId: string;
  recipientType: 'ADMIN' | 'CUSTOMER';
  tenantId: string;
  assessmentId: string | null;
  reportVersionId: string | null;
  title: string;
  message: string;
  severity: 'INFO' | 'ACTION_REQUIRED' | 'WARNING' | 'SUCCESS';
  emailStatus: 'NOT_SENT' | null;
  emailLastError: string | null;
  createdAt: string;
}

export interface RunReadinessInput {
  runId: string;
  versionId: string;
  spendCr: number;
  addressableSpendCr: number | null;
  approved: boolean;
  gatesPassed: boolean;
}

export interface ReadinessInput {
  run: RunReadinessInput | null;
  latestVersionId: string | null;
  openCorrectionCount: number;
}

export interface KpiJobInput {
  status: AnalysisJobStatus;
  checklistComplete: boolean;
}

/** Procurement statistics for one data version, keyed by source_document_id ("<assessment>:<version>"). */
export interface VersionMappingContext {
  assessmentId: string;
  customerId: string;
  latestRunVersionId: string | null;
  latestRunGatesPassed: boolean;
  statsByDocument: ReadonlyMap<string, ProcurementStatsRow>;
}

export interface OrchestrationRequestSummary {
  requestId: string;
  action: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
}
