/**
 * D1 access for the Analysis Orchestration API. Reads return typed rows. Writes are either
 * compare-and-set updates (checked by changed-row count) or statements that run as one atomic batch.
 */
import type { CloudflareD1PreparedStatement } from './types/cloudflare';
import type {
  AcknowledgementRow,
  AssessmentJobRow,
  AuditEventInput,
  AuditRow,
  ChecklistRow,
  CorrectionRow,
  CountRow,
  DataVersionRow,
  NotificationInput,
  NotificationRow,
  OrchestrationDatabase,
  OrchestrationRuntime,
  ProcurementStatsRow,
  ReportRow,
  SequenceRow,
  UserRow
} from './types/orchestrationD1';
import type { PCBIGapSourceRow, PCBISeriesRow } from './types/orchestrationPcbi';
import { ORCHESTRATION_ID_PREFIX } from './constants/orchestration';
import {
  SQL_ACKNOWLEDGEMENT_FOR_REPORT,
  SQL_CAS_ACKNOWLEDGE_REPORT,
  SQL_CAS_SUBMIT_REPORT,
  SQL_CAS_SUPERSEDE_REPORT,
  SQL_CAS_VIEW_REPORT,
  SQL_CORRECTIONS_FOR_JOB,
  SQL_INSERT_ACKNOWLEDGEMENT,
  SQL_INSERT_AUDIT_EVENT,
  SQL_INSERT_CHECKLIST,
  SQL_INSERT_CORRECTION,
  SQL_INSERT_NOTIFICATION,
  SQL_UPDATE_NOTIFICATION_EMAIL,
  SQL_INSERT_REPORT,
  SQL_JOB_BY_ID,
  SQL_JOBS_ALL,
  SQL_JOBS_FOR_CUSTOMER,
  SQL_LATEST_CHECKLIST_FOR_REPORT,
  SQL_NEXT_REPORT_SEQUENCE,
  SQL_OPEN_CORRECTIONS_ALL,
  SQL_OPEN_CORRECTIONS_FOR_JOB,
  SQL_PROCUREMENT_STATS_FOR_JOB,
  SQL_PCBI_GAPS_FOR_JOB,
  SQL_ACTIVE_PCBI_SERIES,
  SQL_RECENT_AUDIT_EVENTS,
  SQL_RECENT_NOTIFICATIONS,
  SQL_REPORT_BY_ID,
  SQL_REPORTS_FOR_JOB,
  SQL_USER_BY_ID,
  SQL_UPSERT_PCBI_GAP_RESOLUTION,
  SQL_VERSIONS_FOR_JOB
} from './constants/orchestrationSql';

const allRows = async <TRow>(statement: CloudflareD1PreparedStatement): Promise<TRow[]> => {
  const result = await statement.all<TRow>();
  return result.results;
};

/** Job rows for every assessment, or only those owned by one customer. */
export const listJobRows = (db: OrchestrationDatabase, customerId: string | null): Promise<AssessmentJobRow[]> =>
  customerId === null
    ? allRows<AssessmentJobRow>(db.prepare(SQL_JOBS_ALL))
    : allRows<AssessmentJobRow>(db.prepare(SQL_JOBS_FOR_CUSTOMER).bind(customerId));

export const findJobRow = (db: OrchestrationDatabase, assessmentId: string): Promise<AssessmentJobRow | null> =>
  db.prepare(SQL_JOB_BY_ID).bind(assessmentId).first<AssessmentJobRow>();

export const listVersionRows = (db: OrchestrationDatabase, assessmentId: string): Promise<DataVersionRow[]> =>
  allRows<DataVersionRow>(db.prepare(SQL_VERSIONS_FOR_JOB).bind(assessmentId));

export const listProcurementStats = (db: OrchestrationDatabase, assessmentId: string): Promise<ProcurementStatsRow[]> =>
  allRows<ProcurementStatsRow>(db.prepare(SQL_PROCUREMENT_STATS_FOR_JOB).bind(assessmentId));

export const listPcbiGapRows = (
  db: OrchestrationDatabase,
  assessmentId: string,
  dataVersionId: string | null
): Promise<PCBIGapSourceRow[]> => dataVersionId === null
  ? Promise.resolve([])
  : allRows<PCBIGapSourceRow>(db.prepare(SQL_PCBI_GAPS_FOR_JOB)
    .bind(assessmentId, dataVersionId, `${assessmentId}:${dataVersionId}`));

export const findActivePcbiSeries = (db: OrchestrationDatabase, seriesId: string): Promise<PCBISeriesRow | null> =>
  db.prepare(SQL_ACTIVE_PCBI_SERIES).bind(seriesId).first<PCBISeriesRow>();

export const upsertPcbiGapResolutionStatement = (
  db: OrchestrationDatabase,
  values: readonly [string, string, string, string, string | null, string | null, string | null, string | null, string, string]
): CloudflareD1PreparedStatement => db.prepare(SQL_UPSERT_PCBI_GAP_RESOLUTION).bind(...values);

export const listReportRows = (db: OrchestrationDatabase, assessmentId: string): Promise<ReportRow[]> =>
  allRows<ReportRow>(db.prepare(SQL_REPORTS_FOR_JOB).bind(assessmentId));

export const findReportRow = (db: OrchestrationDatabase, reportVersionId: string): Promise<ReportRow | null> =>
  db.prepare(SQL_REPORT_BY_ID).bind(reportVersionId).first<ReportRow>();

export const findLatestChecklistRow = (
  db: OrchestrationDatabase,
  reportVersionId: string
): Promise<ChecklistRow | null> =>
  db.prepare(SQL_LATEST_CHECKLIST_FOR_REPORT).bind(reportVersionId).first<ChecklistRow>();

export const findAcknowledgementRow = (
  db: OrchestrationDatabase,
  reportVersionId: string
): Promise<AcknowledgementRow | null> =>
  db.prepare(SQL_ACKNOWLEDGEMENT_FOR_REPORT).bind(reportVersionId).first<AcknowledgementRow>();

export const listCorrectionRows = (db: OrchestrationDatabase, assessmentId: string): Promise<CorrectionRow[]> =>
  allRows<CorrectionRow>(db.prepare(SQL_CORRECTIONS_FOR_JOB).bind(assessmentId));

/** Open correction requests for one job, or across all jobs when assessmentId is null. */
export const countOpenCorrections = async (db: OrchestrationDatabase, assessmentId: string | null): Promise<number> => {
  const statement = assessmentId === null
    ? db.prepare(SQL_OPEN_CORRECTIONS_ALL)
    : db.prepare(SQL_OPEN_CORRECTIONS_FOR_JOB).bind(assessmentId);
  const row = await statement.first<CountRow>();
  return row?.open_count ?? 0;
};

export const listRecentNotificationRows = (db: OrchestrationDatabase, limit: number): Promise<NotificationRow[]> =>
  allRows<NotificationRow>(db.prepare(SQL_RECENT_NOTIFICATIONS).bind(limit));

export const listRecentAuditRows = (db: OrchestrationDatabase, limit: number): Promise<AuditRow[]> =>
  allRows<AuditRow>(db.prepare(SQL_RECENT_AUDIT_EVENTS).bind(limit));

export const findUserRow = (db: OrchestrationDatabase, userId: string): Promise<UserRow | null> =>
  db.prepare(SQL_USER_BY_ID).bind(userId).first<UserRow>();

export const nextReportSequence = async (db: OrchestrationDatabase, assessmentId: string): Promise<number> => {
  const row = await db.prepare(SQL_NEXT_REPORT_SEQUENCE).bind(assessmentId).first<SequenceRow>();
  return row?.next_sequence ?? 1;
};

/** Changed-row count from a D1 run result. Missing metadata counts as zero changes. */
export const changedRowCount = (result: unknown): number => {
  if (typeof result !== 'object' || result === null || !('meta' in result)) return 0;
  const meta = result.meta;
  if (typeof meta !== 'object' || meta === null || !('changes' in meta)) return 0;
  return typeof meta.changes === 'number' ? meta.changes : 0;
};

/** Runs a compare-and-set update. Returns true only when exactly one row changed. */
export const compareAndSet = async (statement: CloudflareD1PreparedStatement): Promise<boolean> =>
  changedRowCount(await statement.run()) === 1;

/** Runs statements as one transaction when the binding supports batch (Cloudflare D1 does). */
export const runAtomically = async (
  db: OrchestrationDatabase,
  statements: CloudflareD1PreparedStatement[]
): Promise<void> => {
  if (db.batch) {
    await db.batch(statements);
    return;
  }
  for (const statement of statements) {
    await statement.run();
  }
};

export const insertReportStatement = (db: OrchestrationDatabase, row: ReportRow): CloudflareD1PreparedStatement =>
  db.prepare(SQL_INSERT_REPORT).bind(
    row.report_version_id,
    row.assessment_id,
    row.sequence_number,
    row.analysis_run_id,
    row.data_version_id,
    row.generated_by,
    row.generated_at
  );

export const submitReportStatement = (
  db: OrchestrationDatabase,
  reportVersionId: string,
  submittedBy: string,
  submittedAt: string
): CloudflareD1PreparedStatement =>
  db.prepare(SQL_CAS_SUBMIT_REPORT).bind(submittedBy, submittedAt, reportVersionId);

export const viewReportStatement = (
  db: OrchestrationDatabase,
  reportVersionId: string,
  viewedAt: string
): CloudflareD1PreparedStatement => db.prepare(SQL_CAS_VIEW_REPORT).bind(viewedAt, reportVersionId);

export const acknowledgeReportStatement = (
  db: OrchestrationDatabase,
  reportVersionId: string,
  acknowledgedAt: string
): CloudflareD1PreparedStatement => db.prepare(SQL_CAS_ACKNOWLEDGE_REPORT).bind(acknowledgedAt, reportVersionId);

export const supersedeReportStatement = (
  db: OrchestrationDatabase,
  reportVersionId: string,
  supersededBy: string,
  supersededAt: string,
  reason: string
): CloudflareD1PreparedStatement =>
  db.prepare(SQL_CAS_SUPERSEDE_REPORT).bind(supersededBy, supersededAt, reason, reportVersionId);

export const insertChecklistStatement = (db: OrchestrationDatabase, row: ChecklistRow): CloudflareD1PreparedStatement =>
  db.prepare(SQL_INSERT_CHECKLIST).bind(
    row.checklist_id,
    row.assessment_id,
    row.report_version_id,
    row.checklist_json,
    row.is_complete,
    row.unconfirmed_count,
    row.confirmed_by,
    row.confirmed_at,
    row.created_at
  );

export const insertAcknowledgementStatement = (
  db: OrchestrationDatabase,
  row: AcknowledgementRow
): CloudflareD1PreparedStatement =>
  db.prepare(SQL_INSERT_ACKNOWLEDGEMENT).bind(
    row.acknowledgement_id,
    row.report_version_id,
    row.assessment_id,
    row.tenant_id,
    row.user_id,
    row.user_name,
    row.notes,
    row.acknowledged_at
  );

export const insertCorrectionStatement = (
  db: OrchestrationDatabase,
  row: CorrectionRow
): CloudflareD1PreparedStatement =>
  db.prepare(SQL_INSERT_CORRECTION).bind(
    row.request_id,
    row.assessment_id,
    row.tenant_id,
    row.user_id,
    row.category,
    row.description,
    row.supporting_file_name,
    row.created_at
  );

export const buildNotificationRow = (input: NotificationInput): NotificationRow => ({
  notification_id: input.notificationId,
  recipient_type: input.recipientType,
  tenant_id: input.tenantId,
  assessment_id: input.assessmentId,
  report_version_id: input.reportVersionId,
  title: input.title,
  message: input.message,
  severity: input.severity,
  read_flag: 0,
  email_status: input.emailStatus,
  email_last_error: input.emailLastError,
  email_retry_count: 0,
  created_at: input.createdAt
});

export const insertNotificationStatement = (
  db: OrchestrationDatabase,
  row: NotificationRow
): CloudflareD1PreparedStatement =>
  db.prepare(SQL_INSERT_NOTIFICATION).bind(
    row.notification_id,
    row.recipient_type,
    row.tenant_id,
    row.assessment_id,
    row.report_version_id,
    row.title,
    row.message,
    row.severity,
    row.email_status,
    row.email_last_error,
    row.created_at
  );

export const updateNotificationEmailStatement = (
  db: OrchestrationDatabase,
  notificationId: string,
  status: string,
  lastError: string | null,
  incrementRetry: boolean
): CloudflareD1PreparedStatement => db.prepare(SQL_UPDATE_NOTIFICATION_EMAIL).bind(
  status,
  lastError,
  incrementRetry ? 1 : 0,
  notificationId
);

/** Adds the event id and timestamp to an audit draft. */
export const buildAuditEvent = (
  runtime: OrchestrationRuntime,
  draft: Omit<AuditEventInput, 'eventId' | 'createdAt'>
): AuditEventInput => ({
  ...draft,
  eventId: runtime.createId(ORCHESTRATION_ID_PREFIX.AUDIT),
  createdAt: runtime.now()
});

/** Adds the notification id and timestamp to a notification draft. */
export const buildNotificationInput = (
  runtime: OrchestrationRuntime,
  draft: Omit<NotificationInput, 'notificationId' | 'createdAt'>
): NotificationInput => ({
  ...draft,
  notificationId: runtime.createId(ORCHESTRATION_ID_PREFIX.NOTIFICATION),
  createdAt: runtime.now()
});

export const insertAuditStatement = (
  db: OrchestrationDatabase,
  event: AuditEventInput
): CloudflareD1PreparedStatement =>
  db.prepare(SQL_INSERT_AUDIT_EVENT).bind(
    event.eventId,
    event.tenantId,
    event.assessmentId,
    event.actorId,
    event.actorRole,
    event.eventType,
    event.entityType,
    event.entityId,
    event.previousState,
    event.newState,
    event.metadata === null ? null : JSON.stringify(event.metadata),
    event.createdAt
  );
