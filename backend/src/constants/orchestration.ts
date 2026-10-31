/**
 * Analysis Orchestration constants (Worker API, Prompt 302).
 * Status vocabularies, report workflow rules, limits, patterns and HTTP codes.
 */
import type { AnalysisJobStatus, ReanalysisReason, ReportVersion, ReportWorkflowState } from '../types/analysisOrchestration';
import type { ActiveReportState } from '../types/orchestrationD1';

export const ORCHESTRATION_PATH_PREFIX = '/api/orchestration';
export const ORCHESTRATION_REQUEST_ID_HEADER = 'X-Request-Id';

export const DEFAULT_SLA_HOURS = 48;

export const ANALYSIS_JOB_STATUS_VALUES = [
  'UPLOADED',
  'MODULE_1_READY',
  'ANALYSIS_QUEUED',
  'PCBI_REVIEW_REQUIRED',
  'PCBI_REVIEW_IN_PROGRESS',
  'READY_FOR_GENERATION',
  'REPORT_GENERATED',
  'ADMIN_REVIEW',
  'ADMIN_APPROVED',
  'SUBMITTED_TO_CUSTOMER',
  'CUSTOMER_VIEWED',
  'CUSTOMER_ACKNOWLEDGED',
  'ANALYSIS_BLOCKED'
] as const satisfies readonly AnalysisJobStatus[];

export const REPORT_WORKFLOW_STATE_VALUES = [
  'ADMIN_REVIEW',
  'SUBMITTED_TO_CUSTOMER',
  'CUSTOMER_VIEWED',
  'CUSTOMER_ACKNOWLEDGED',
  'SUPERSEDED'
] as const satisfies readonly ReportWorkflowState[];

/** Report states in which the report is the job's current (non-superseded) report. */
export const ACTIVE_REPORT_STATES = [
  'ADMIN_REVIEW',
  'SUBMITTED_TO_CUSTOMER',
  'CUSTOMER_VIEWED',
  'CUSTOMER_ACKNOWLEDGED'
] as const satisfies readonly ActiveReportState[];

/** Report states the customer may see. Admin review drafts stay hidden. */
export const CUSTOMER_VISIBLE_REPORT_STATES = [
  'SUBMITTED_TO_CUSTOMER',
  'CUSTOMER_VIEWED',
  'CUSTOMER_ACKNOWLEDGED'
] as const satisfies readonly ActiveReportState[];

/** Report states meaning the customer has already opened the report. */
export const VIEWED_REPORT_STATES = [
  'CUSTOMER_VIEWED',
  'CUSTOMER_ACKNOWLEDGED'
] as const satisfies readonly ActiveReportState[];

export const REPORT_API_STATUS: Readonly<Record<ReportWorkflowState, ReportVersion['status']>> = {
  ADMIN_REVIEW: 'GENERATED_PENDING_ADMIN_REVIEW',
  SUBMITTED_TO_CUSTOMER: 'SUBMITTED',
  CUSTOMER_VIEWED: 'SUBMITTED',
  CUSTOMER_ACKNOWLEDGED: 'SUBMITTED',
  SUPERSEDED: 'SUPERSEDED'
};

export const CORRECTION_REQUEST_STATUS_VALUES = ['OPEN', 'REVIEWED', 'ACCEPTED_REANALYSIS', 'REJECTED'] as const;

export const NOTIFICATION_SEVERITY_VALUES = ['INFO', 'ACTION_REQUIRED', 'WARNING', 'SUCCESS'] as const;

export const NOTIFICATION_RECIPIENT_VALUES = ['ADMIN', 'CUSTOMER'] as const;

export const EMAIL_STATUS_VALUES = ['NOT_SENT', 'QUEUED', 'SENT', 'DELIVERED', 'FAILED'] as const;

export const REANALYSIS_REASON_VALUES = [
  'INCORRECT_CATEGORY_MAPPING',
  'MISSING_TRANSACTIONS',
  'DUPLICATE_TRANSACTIONS',
  'INCORRECT_SUPPLIER_MAPPING',
  'INCORRECT_PLANT_MAPPING',
  'INCORRECT_QUANTITY_VALUE',
  'INCORRECT_MATERIAL_DESCRIPTION',
  'CUSTOMER_CLARIFICATION',
  'PCBI_MAPPING_CORRECTION',
  'OTHER'
] as const satisfies readonly ReanalysisReason[];

export const PCBI_GAP_ACTION_VALUES = [
  'ADD_MAP_PCBI', 'MAP_EXISTING', 'EXCLUDE', 'MARK_NOT_BENCHMARKABLE', 'MARK_SERVICE', 'REQUEST_RESEARCH'
] as const;

export const PCBI_GAP_EXCLUSION_REASON_VALUES = [
  'NOT_BENCHMARKABLE', 'CUSTOM_ENGINEERED_ITEM', 'SERVICE', 'NO_RELIABLE_MARKET_BENCHMARK',
  'INSUFFICIENT_MARKET_DATA', 'CUSTOMER_SPECIFIC_SPECIFICATION', 'BELOW_MATERIALITY_THRESHOLD', 'OTHER'
] as const;

export const AUDIT_ACTOR_ROLE_VALUES = ['CUSTOMER', 'ADMIN', 'SYSTEM'] as const;

/** Job statuses grouped into the admin KPI buckets (matches the Express KPI definitions). */
export const KPI_JOB_STATUS_GROUPS = {
  newAnalyses: ['UPLOADED', 'MODULE_1_READY', 'ANALYSIS_QUEUED'],
  pcbiReviewsPending: ['PCBI_REVIEW_REQUIRED', 'PCBI_REVIEW_IN_PROGRESS'],
  reportsPendingReview: ['ADMIN_REVIEW', 'REPORT_GENERATED'],
  customerAcknowledgementsPending: ['SUBMITTED_TO_CUSTOMER', 'CUSTOMER_VIEWED'],
  blockedAnalyses: ['ANALYSIS_BLOCKED']
} as const satisfies Readonly<Record<string, readonly AnalysisJobStatus[]>>;

export const ORCHESTRATION_LIMITS = {
  reportIdMaxLength: 128,
  searchMaxLength: 100,
  notesMaxLength: 2000,
  supersedeReasonMinLength: 5,
  supersedeReasonMaxLength: 2000,
  correctionCategoryMaxLength: 200,
  correctionDescriptionMinLength: 5,
  correctionDescriptionMaxLength: 4000,
  supportingFileNameMaxLength: 255,
  notificationListLimit: 200,
  auditTrailLimit: 500
} as const;

export const ORCHESTRATION_NUMERIC = {
  percentScale: 100,
  percentDecimals: 1,
  spendCrDecimals: 4,
  bytesPerMegabyte: 1024 * 1024,
  fileSizeDecimals: 2,
  minSpendCoveragePct: 85,
  pcbiGapIdHashLength: 64
} as const;

export const ORCHESTRATION_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
export const ORCHESTRATION_REQUEST_ID_PATTERN = /^[A-Za-z0-9._-]{1,128}$/;
export const AUTH_BEARER_PATTERN = /^Bearer\s+(\S+)$/i;

export const ORCHESTRATION_HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  SERVICE_UNAVAILABLE: 503
} as const;

export const ORCHESTRATION_ERROR_CATEGORY = {
  VALIDATION: 'VALIDATION_ERROR',
  AUTH: 'AUTH_ERROR',
  NOT_FOUND: 'NOT_FOUND_ERROR',
  CONFLICT: 'CONFLICT_ERROR',
  SERVER: 'SERVER_ERROR'
} as const;

export const ORCHESTRATION_ID_PREFIX = {
  REQUEST: 'req',
  CHECKLIST: 'chk',
  ACKNOWLEDGEMENT: 'ack',
  CORRECTION: 'corr',
  NOTIFICATION: 'notif',
  AUDIT: 'aud',
  PCBI_GAP: 'PCBI-GAP-'
} as const;

export const ORCHESTRATION_EVENT_TYPES = {
  QUALITY_GATE_SAVED: 'QUALITY_GATE_SAVED',
  REPORT_GENERATED: 'REPORT_GENERATED',
  REPORT_SUBMITTED: 'REPORT_SUBMITTED',
  REPORT_VIEWED: 'REPORT_VIEWED',
  REPORT_ACKNOWLEDGED: 'REPORT_ACKNOWLEDGED',
  REPORT_SUPERSEDED: 'REPORT_SUPERSEDED',
  NOTIFICATION_RESEND_ATTEMPTED: 'NOTIFICATION_RESEND_ATTEMPTED',
  CORRECTION_REQUESTED: 'CORRECTION_REQUESTED',
  DATASET_CORRECTED: 'DATASET_CORRECTED',
  PCBI_GAP_RESOLVED: 'PCBI_GAP_RESOLVED'
} as const;

export const ORCHESTRATION_ENTITY_TYPES = {
  ANALYSIS_JOB: 'AnalysisJob',
  REPORT_VERSION: 'ReportVersion',
  QUALITY_CHECKLIST: 'AdminQualityGateChecklist',
  ACKNOWLEDGEMENT: 'ReportAcknowledgement',
  CORRECTION_REQUEST: 'CustomerCorrectionRequest',
  NOTIFICATION: 'OrchestrationNotification',
  DATASET_VERSION: 'AssessmentDataVersion',
  PCBI_GAP_RESOLUTION: 'OrchestrationPCBIGapResolution'
} as const;

export const ORCHESTRATION_EMAIL_STATUS = {
  NOT_SENT: 'NOT_SENT',
  SENT: 'SENT',
  FAILED: 'FAILED'
} as const;

export const ORCHESTRATION_NOTIFICATION_SEVERITY = {
  SUCCESS: 'SUCCESS',
  WARNING: 'WARNING'
} as const;

export const ORCHESTRATION_DEFAULTS = {
  pcbiStateVersionUnavailable: 'NOT_RECORDED',
  datasetUploaderRole: 'ADMIN',
  originalVersionSource: 'CUSTOMER_ORIGINAL',
  correctionVersionSource: 'ADMIN_CORRECTION',
  processedStatus: 'PROCESSED',
  pendingStatus: 'PENDING',
  validStatus: 'VALID',
  warningsStatus: 'WARNINGS',
  errorsStatus: 'ERRORS',
  unknownFileType: 'UNKNOWN',
  periodFallback: 'Period not specified',
  moduleOneVersionPrefix: 'm1-',
  periodSeparator: ' - ',
  reportIdPrefix: 'RPT-',
  reportVersionInfix: '-v'
} as const;

export const EMPTY_PCBI_GAP_COVERAGE = {
  hasEvidence: false,
  totalCategories: 0,
  resolvedCategories: 0,
  totalItems: 0,
  resolvedItems: 0,
  excludedItems: 0
} as const;
