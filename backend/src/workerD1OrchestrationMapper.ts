/**
 * Maps Analysis Orchestration D1 rows to the API payload shapes in types/analysisOrchestration.ts.
 */
import type {
  AdminQualityGateChecklist,
  AnalysisAuditEvent,
  AnalysisJob,
  AnalysisJobStatus,
  CustomerCorrectionRequest,
  CustomerReportAcknowledgement,
  DatasetVersion,
  OrchestrationEmailDelivery,
  OrchestrationNotification,
  PCBIGapCategory,
  ReportVersion
} from './types/analysisOrchestration';
import type {
  AcknowledgementRow,
  AssessmentJobRow,
  AuditRow,
  ChecklistRow,
  CorrectionRow,
  DataVersionRow,
  NotificationRow,
  ProcurementStatsRow,
  ReportRow,
  VersionMappingContext
} from './types/orchestrationD1';
import type { PCBIGapSourceRow } from './types/orchestrationPcbi';
import type { QualityGateChecklistBody } from './types/orchestrationValidation';
import {
  CORRECTION_REQUEST_STATUS_VALUES,
  DEFAULT_SLA_HOURS,
  EMAIL_STATUS_VALUES,
  NOTIFICATION_RECIPIENT_VALUES,
  NOTIFICATION_SEVERITY_VALUES,
  ORCHESTRATION_DEFAULTS,
  ORCHESTRATION_ID_PREFIX,
  ORCHESTRATION_NUMERIC,
  AUDIT_ACTOR_ROLE_VALUES,
  REPORT_API_STATUS
} from './constants/orchestration';
import { ORCHESTRATION_MESSAGES } from './constants/orchestrationMessages';
import { qualityGateChecklistSchema } from './constants/orchestrationValidation';
import {
  formatAnalysisPeriod,
  isCustomerVisibleState,
  requireOneOf,
  requireReportWorkflowState,
  roundTo,
  toFileType
} from './workerD1OrchestrationDerive';

const reportTimeline = (
  row: AssessmentJobRow
): Pick<
  AnalysisJob,
  'reportVersionId' | 'reportGeneratedAt' | 'submittedAt' | 'customerViewedAt' | 'acknowledgedAt'
> => ({
  reportVersionId: row.report_id ?? undefined,
  reportGeneratedAt: row.report_generated_at ?? undefined,
  submittedAt: row.report_submitted_at ?? undefined,
  customerViewedAt: row.report_viewed_at ?? undefined,
  acknowledgedAt: row.report_acknowledged_at ?? undefined
});

const latestTimestamp = (row: AssessmentJobRow, includeReport: boolean): string => {
  const reportUpdatedAt = includeReport ? row.report_updated_at : null;
  return reportUpdatedAt !== null && reportUpdatedAt > row.updated_at ? reportUpdatedAt : row.updated_at;
};

/**
 * Job summary for the list and detail views. Report fields are only included when the viewer may see the
 * report, so a customer never learns about an admin-review draft.
 */
export const mapAnalysisJob = (
  row: AssessmentJobRow,
  status: AnalysisJobStatus,
  includeReport: boolean
): AnalysisJob => ({
  analysisJobId: row.assessment_id,
  tenantId: row.tenant_id,
  customerName: row.customer_name,
  uploadedBy: row.current_uploaded_by ?? row.assessment_owner,
  originalUploadId: row.original_version_id ?? '',
  currentDataVersionId: row.current_version_id ?? '',
  module1VersionId: row.current_version_id === null
    ? ''
    : `${ORCHESTRATION_DEFAULTS.moduleOneVersionPrefix}${row.current_version_id}`,
  status,
  createdAt: row.created_at,
  lastUpdatedAt: latestTimestamp(row, includeReport),
  totalSpendCr: row.run_spend_cr ?? row.record_spend_cr ?? 0,
  totalTransactions: row.current_record_count ?? 0,
  analysisPeriod: formatAnalysisPeriod(row.assessment_period_start, row.assessment_period_end),
  slaHoursTarget: DEFAULT_SLA_HOURS,
  ...(includeReport ? reportTimeline(row) : {})
});

const validationStatusFor = (analysed: boolean, gatesPassed: boolean): DatasetVersion['validationStatus'] => {
  if (!analysed) return ORCHESTRATION_DEFAULTS.warningsStatus;
  return gatesPassed ? ORCHESTRATION_DEFAULTS.validStatus : ORCHESTRATION_DEFAULTS.errorsStatus;
};

const mapDatasetVersion = (
  row: DataVersionRow,
  parentVersionId: string | undefined,
  context: VersionMappingContext
): DatasetVersion => {
  const stats = context.statsByDocument.get(`${context.assessmentId}:${row.data_version_id}`);
  const analysed = context.latestRunVersionId === row.data_version_id;
  return {
    versionId: row.data_version_id,
    parentVersionId: row.parent_data_version_id ?? parentVersionId,
    tenantId: context.customerId,
    uploadedBy: row.uploaded_by,
    uploaderRole: ORCHESTRATION_DEFAULTS.datasetUploaderRole,
    uploadedAt: row.uploaded_at,
    fileName: row.file_name,
    fileType: toFileType(row.file_name),
    fileSizeMb: roundTo(row.file_size / ORCHESTRATION_NUMERIC.bytesPerMegabyte, ORCHESTRATION_NUMERIC.fileSizeDecimals),
    checksum: row.checksum,
    source: row.version_number <= 1
      ? ORCHESTRATION_DEFAULTS.originalVersionSource
      : ORCHESTRATION_DEFAULTS.correctionVersionSource,
    notes: row.notes ?? undefined,
    correctionReason: row.correction_reason as DatasetVersion['correctionReason'],
    processingStatus: analysed ? ORCHESTRATION_DEFAULTS.processedStatus : ORCHESTRATION_DEFAULTS.pendingStatus,
    validationStatus: validationStatusFor(analysed, context.latestRunGatesPassed),
    // Transaction count is the count recorded at upload. The other counts come from ProcurementTransaction rows.
    transactionCount: row.record_count,
    supplierCount: stats?.supplier_count ?? 0,
    spendInrCr: roundTo(stats?.spend_cr ?? 0, ORCHESTRATION_NUMERIC.spendCrDecimals),
    categoryCount: stats?.category_count ?? 0,
    plantCount: stats?.plant_count ?? 0
  };
};

/** Maps data versions in version order, setting each version's parent to the previous version. */
export const mapDatasetVersions = (rows: readonly DataVersionRow[], context: VersionMappingContext): DatasetVersion[] =>
  rows.map((row, index) =>
    mapDatasetVersion(row, index === 0 ? undefined : rows[index - 1].data_version_id, context)
  );

const pcbiGapState = (row: PCBIGapSourceRow): Pick<
  PCBIGapCategory,
  'status' | 'resolutionStatus' | 'reasonForReview'
> => {
  if (row.action === 'MAP_EXISTING' || row.action === 'ADD_MAP_PCBI') {
    if (!row.benchmark_source?.trim()) {
      return {
        status: 'PCBI_REQUIRED', resolutionStatus: 'PENDING',
        reasonForReview: ORCHESTRATION_MESSAGES.pcbiSeriesBecameUnavailable(row.target_pcbi_series ?? '')
      };
    }
    return {
      status: 'PCBI_COVERED', resolutionStatus: 'MAPPED',
      reasonForReview: ORCHESTRATION_MESSAGES.pcbiMapped(row.target_pcbi_series ?? '')
    };
  }
  if (row.action === 'EXCLUDE') {
    return {
      status: 'EXCLUDED_MANUAL_REVIEW', resolutionStatus: 'EXCLUDED',
      reasonForReview: ORCHESTRATION_MESSAGES.pcbiExcluded(row.exclusion_reason ?? 'OTHER')
    };
  }
  if (row.action === 'MARK_NOT_BENCHMARKABLE') {
    return {
      status: 'NOT_BENCHMARKABLE', resolutionStatus: 'EXCLUDED',
      reasonForReview: ORCHESTRATION_MESSAGES.pcbiExcluded(row.exclusion_notes ?? 'Not benchmarkable')
    };
  }
  if (row.action === 'MARK_SERVICE') {
    return {
      status: 'SERVICE_NON_COMMODITY', resolutionStatus: 'EXCLUDED',
      reasonForReview: ORCHESTRATION_MESSAGES.pcbiExcluded(row.exclusion_notes ?? 'Service or non-commodity')
    };
  }
  if (row.action === 'REQUEST_RESEARCH') {
    return {
      status: 'PCBI_REQUIRED', resolutionStatus: 'RESEARCH_REQUESTED',
      reasonForReview: row.research_notes || ORCHESTRATION_MESSAGES.pcbiResearchRequested
    };
  }
  return {
    status: 'PCBI_REQUIRED', resolutionStatus: 'PENDING',
    reasonForReview: ORCHESTRATION_MESSAGES.pcbiNeedsReview
  };
};

export const mapPcbiGap = async (row: PCBIGapSourceRow, tenantId: string): Promise<PCBIGapCategory> => {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(row.category_key));
  const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
    .slice(0, ORCHESTRATION_NUMERIC.pcbiGapIdHashLength);
  const state = pcbiGapState(row);
  return {
    gapId: `${ORCHESTRATION_ID_PREFIX.PCBI_GAP}${hash}`,
    tenantId,
    itemCategory: row.item_category,
    relevantClassification: row.relevant_classification,
    customerSpendInrCr: roundTo(Number(row.spend_cr) || 0, ORCHESTRATION_NUMERIC.spendCrDecimals),
    transactionCount: Number(row.transaction_count) || 0,
    supplierCount: Number(row.supplier_count) || 0,
    plantCount: Number(row.plant_count) || 0,
    existingPcbiMapping: row.target_pcbi_series ?? undefined,
    benchmarkSource: row.benchmark_source ?? undefined,
    pcbiQualityRating: row.quality_rating ?? undefined,
    status: state.status,
    reasonForReview: state.reasonForReview,
    estimatedSpendImpactCr: roundTo(Number(row.spend_cr) || 0, ORCHESTRATION_NUMERIC.spendCrDecimals),
    resolutionStatus: state.resolutionStatus,
    exclusionReason: row.exclusion_reason ?? undefined,
    exclusionNotes: row.exclusion_notes ?? undefined,
    resolvedBy: row.resolved_by ?? undefined,
    resolvedAt: row.resolved_at ?? undefined
  };
};

export const buildStatsByDocument = (rows: readonly ProcurementStatsRow[]): ReadonlyMap<string, ProcurementStatsRow> =>
  new Map(rows.map((row) => [row.source_document_id, row] as const));

export const mapReport = (row: ReportRow): ReportVersion => {
  const state = requireReportWorkflowState(row.workflow_state);
  return {
    reportVersionId: row.report_version_id,
    analysisJobId: row.assessment_id,
    datasetVersionId: row.data_version_id,
    pcbiStateVersion: ORCHESTRATION_DEFAULTS.pcbiStateVersionUnavailable,
    generatedAt: row.generated_at,
    status: REPORT_API_STATUS[state],
    isCustomerVisible: isCustomerVisibleState(state),
    generatedBy: row.generated_by,
    approvedBy: row.submitted_by ?? undefined,
    approvedAt: row.submitted_at ?? undefined,
    submittedAt: row.submitted_at ?? undefined,
    workflowState: state
  };
};

/** Parses the stored checklist JSON. Returns null when the stored value is not a valid checklist. */
export const parseStoredChecklist = (json: string): QualityGateChecklistBody | null => {
  try {
    const parsed = qualityGateChecklistSchema.safeParse(JSON.parse(json) as unknown);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
};

export const mapChecklist = (row: ChecklistRow, checklist: QualityGateChecklistBody): AdminQualityGateChecklist => ({
  ...checklist,
  confirmedByAdminId: row.confirmed_by,
  confirmedAt: row.confirmed_at ?? undefined
});

export const mapAcknowledgement = (row: AcknowledgementRow): CustomerReportAcknowledgement => ({
  acknowledgementId: row.acknowledgement_id,
  reportVersionId: row.report_version_id,
  tenantId: row.tenant_id,
  userId: row.user_id,
  userName: row.user_name,
  acknowledgedAt: row.acknowledged_at,
  status: 'ACKNOWLEDGED',
  notes: row.notes ?? undefined
});

export const mapCorrectionRequest = (row: CorrectionRow): CustomerCorrectionRequest => ({
  requestId: row.request_id,
  analysisJobId: row.assessment_id,
  tenantId: row.tenant_id,
  userId: row.user_id,
  category: row.category,
  description: row.description,
  supportingFileName: row.supporting_file_name ?? undefined,
  status: requireOneOf(CORRECTION_REQUEST_STATUS_VALUES, row.status, 'correction request status'),
  createdAt: row.created_at,
  reviewedBy: row.reviewed_by ?? undefined,
  adminResponse: row.admin_response ?? undefined
});

const mapEmailDelivery = (row: NotificationRow): OrchestrationEmailDelivery | undefined => {
  if (row.email_status === null) return undefined;
  return {
    status: requireOneOf(EMAIL_STATUS_VALUES, row.email_status, 'email delivery status'),
    lastError: row.email_last_error ?? undefined,
    retryCount: row.email_retry_count
  };
};

export const mapNotification = (row: NotificationRow): OrchestrationNotification => ({
  notificationId: row.notification_id,
  recipientType: requireOneOf(NOTIFICATION_RECIPIENT_VALUES, row.recipient_type, 'notification recipient'),
  tenantId: row.tenant_id,
  title: row.title,
  message: row.message,
  severity: requireOneOf(NOTIFICATION_SEVERITY_VALUES, row.severity, 'notification severity'),
  createdAt: row.created_at,
  read: row.read_flag === 1,
  emailDelivery: mapEmailDelivery(row)
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Parses audit metadata JSON. Anything that is not a JSON object is dropped. */
export const parseMetadata = (json: string | null): Record<string, unknown> | undefined => {
  if (json === null) return undefined;
  try {
    const parsed = JSON.parse(json) as unknown;
    return isRecord(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
};

export const mapAuditEvent = (row: AuditRow): AnalysisAuditEvent => ({
  eventId: row.event_id,
  tenantId: row.tenant_id,
  actorId: row.actor_id,
  actorRole: requireOneOf(AUDIT_ACTOR_ROLE_VALUES, row.actor_role, 'audit actor role'),
  timestamp: row.created_at,
  eventType: row.event_type,
  entityType: row.entity_type,
  entityId: row.entity_id,
  previousState: row.previous_state ?? undefined,
  newState: row.new_state ?? undefined,
  metadata: parseMetadata(row.metadata_json)
});
