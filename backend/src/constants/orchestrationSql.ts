/**
 * SQL for the Analysis Orchestration API. Parameters use numbered placeholders (?1, ?2, ...)
 * so that the same statements run on Cloudflare D1 and on the local SQLite used by tests.
 */

const JOB_SELECT = `
SELECT
  a.assessment_id, a.customer_id, a.customer_name, a.assessment_owner,
  a.assessment_period_start, a.assessment_period_end, a.total_spend_cr AS record_spend_cr,
  a.created_at, a.updated_at,
  cur.data_version_id AS current_version_id, cur.uploaded_by AS current_uploaded_by,
  cur.record_count AS current_record_count, orig.data_version_id AS original_version_id,
  ar.analysis_run_id AS run_id, ar.data_version_id AS run_version_id,
  ar.total_spend_cr AS run_spend_cr, ar.addressable_spend_cr AS run_addressable_spend_cr,
  ar.is_approved AS run_is_approved, ar.all_gates_passed AS run_gates_passed,
  rpt.report_version_id AS report_id, rpt.workflow_state AS report_state,
  rpt.generated_at AS report_generated_at, rpt.submitted_at AS report_submitted_at,
  rpt.customer_viewed_at AS report_viewed_at, rpt.acknowledged_at AS report_acknowledged_at,
  rpt.updated_at AS report_updated_at,
  (SELECT qc.is_complete FROM OrchestrationQualityChecklist qc
    WHERE qc.report_version_id = rpt.report_version_id
    ORDER BY qc.created_at DESC, qc.checklist_id DESC LIMIT 1) AS checklist_complete
FROM AssessmentRecord a
LEFT JOIN AssessmentDataVersion cur ON cur.data_version_id = (
  SELECT d.data_version_id FROM AssessmentDataVersion d WHERE d.assessment_id = a.assessment_id
  ORDER BY d.version_number DESC, d.uploaded_at DESC, d.data_version_id DESC LIMIT 1)
LEFT JOIN AssessmentDataVersion orig ON orig.data_version_id = (
  SELECT d.data_version_id FROM AssessmentDataVersion d WHERE d.assessment_id = a.assessment_id
  ORDER BY d.version_number ASC, d.uploaded_at ASC, d.data_version_id ASC LIMIT 1)
LEFT JOIN AssessmentAnalysisRun ar ON ar.analysis_run_id = (
  SELECT r.analysis_run_id FROM AssessmentAnalysisRun r
  WHERE r.assessment_id = a.assessment_id AND r.is_superseded = 0
  ORDER BY r.created_at DESC, r.analysis_run_id DESC LIMIT 1)
LEFT JOIN OrchestrationReportVersion rpt ON rpt.report_version_id = (
  SELECT o.report_version_id FROM OrchestrationReportVersion o
  WHERE o.assessment_id = a.assessment_id AND o.workflow_state <> 'SUPERSEDED' LIMIT 1)
`;

const REPORT_COLUMNS = `
  report_version_id, assessment_id, sequence_number, analysis_run_id, data_version_id, workflow_state,
  generated_by, generated_at, submitted_by, submitted_at, customer_viewed_at, acknowledged_at,
  superseded_by, superseded_at, supersede_reason, created_at, updated_at`;

const CHECKLIST_COLUMNS = `
  checklist_id, assessment_id, report_version_id, checklist_json, is_complete, unconfirmed_count,
  confirmed_by, confirmed_at, created_at`;

const NOTIFICATION_COLUMNS = `
  notification_id, recipient_type, tenant_id, assessment_id, report_version_id, title, message, severity,
  read_flag, email_status, email_last_error, email_retry_count, created_at`;

const AUDIT_COLUMNS = `
  event_id, tenant_id, assessment_id, actor_id, actor_role, event_type, entity_type, entity_id,
  previous_state, new_state, metadata_json, created_at`;

export const SQL_JOBS_ALL = `${JOB_SELECT} ORDER BY a.created_at DESC, a.assessment_id ASC`;
export const SQL_JOBS_FOR_CUSTOMER = `${JOB_SELECT}
WHERE a.customer_id = ?1
ORDER BY a.created_at DESC, a.assessment_id ASC`;
export const SQL_JOB_BY_ID = `${JOB_SELECT} WHERE a.assessment_id = ?1`;

export const SQL_VERSIONS_FOR_JOB = `
SELECT data_version_id, assessment_id, version_number, file_name, file_size, checksum, uploaded_by,
  uploaded_at, record_count, notes
FROM AssessmentDataVersion WHERE assessment_id = ?1
ORDER BY version_number ASC, uploaded_at ASC, data_version_id ASC`;

/** Per-version procurement statistics. Scans ProcurementTransaction by assessment_id (no index yet). */
export const SQL_PROCUREMENT_STATS_FOR_JOB = `
SELECT source_document_id,
  COUNT(DISTINCT supplier_name) AS supplier_count,
  COUNT(DISTINCT plant) AS plant_count,
  COUNT(DISTINCT material_group) AS category_count,
  COALESCE(SUM(total_in_cr_raw), 0) AS spend_cr
FROM ProcurementTransaction WHERE assessment_id = ?1
GROUP BY source_document_id`;

export const SQL_REPORTS_FOR_JOB = `
SELECT ${REPORT_COLUMNS} FROM OrchestrationReportVersion WHERE assessment_id = ?1 ORDER BY sequence_number ASC`;

export const SQL_REPORT_BY_ID = `SELECT ${REPORT_COLUMNS} FROM OrchestrationReportVersion WHERE report_version_id = ?1`;

export const SQL_NEXT_REPORT_SEQUENCE = `
SELECT COALESCE(MAX(sequence_number), 0) + 1 AS next_sequence FROM OrchestrationReportVersion WHERE assessment_id = ?1`;

export const SQL_LATEST_CHECKLIST_FOR_REPORT = `
SELECT ${CHECKLIST_COLUMNS} FROM OrchestrationQualityChecklist
WHERE report_version_id = ?1
ORDER BY created_at DESC, checklist_id DESC LIMIT 1`;

export const SQL_ACKNOWLEDGEMENT_FOR_REPORT = `
SELECT acknowledgement_id, report_version_id, assessment_id, tenant_id, user_id, user_name, notes, acknowledged_at
FROM OrchestrationAcknowledgement WHERE report_version_id = ?1 LIMIT 1`;

export const SQL_CORRECTIONS_FOR_JOB = `
SELECT request_id, assessment_id, tenant_id, user_id, category, description, supporting_file_name, status,
  reviewed_by, admin_response, created_at
FROM OrchestrationCorrectionRequest WHERE assessment_id = ?1
ORDER BY created_at DESC, request_id DESC`;

export const SQL_OPEN_CORRECTIONS_FOR_JOB = `
SELECT COUNT(*) AS open_count FROM OrchestrationCorrectionRequest WHERE assessment_id = ?1 AND status = 'OPEN'`;

export const SQL_OPEN_CORRECTIONS_ALL = `
SELECT COUNT(*) AS open_count FROM OrchestrationCorrectionRequest WHERE status = 'OPEN'`;

export const SQL_RECENT_NOTIFICATIONS = `
SELECT ${NOTIFICATION_COLUMNS} FROM OrchestrationNotification
ORDER BY created_at DESC, notification_id DESC LIMIT ?1`;

export const SQL_RECENT_AUDIT_EVENTS = `
SELECT ${AUDIT_COLUMNS} FROM OrchestrationAuditEvent
ORDER BY created_at DESC, event_id DESC LIMIT ?1`;

export const SQL_USER_BY_ID = 'SELECT id, name, role, status FROM User WHERE id = ?1';

export const SQL_INSERT_REPORT = `
INSERT INTO OrchestrationReportVersion (
  report_version_id, assessment_id, sequence_number, analysis_run_id, data_version_id,
  workflow_state, generated_by, generated_at, created_at, updated_at
) VALUES (?1, ?2, ?3, ?4, ?5, 'ADMIN_REVIEW', ?6, ?7, ?7, ?7)`;

/* Compare-and-set transitions: each succeeds only from the expected state, so concurrent requests cannot
 * apply the same transition twice. Callers check the number of changed rows. */
export const SQL_CAS_SUBMIT_REPORT = `
UPDATE OrchestrationReportVersion
SET workflow_state = 'SUBMITTED_TO_CUSTOMER', submitted_by = ?1, submitted_at = ?2, updated_at = ?2
WHERE report_version_id = ?3 AND workflow_state = 'ADMIN_REVIEW'`;

export const SQL_CAS_VIEW_REPORT = `
UPDATE OrchestrationReportVersion
SET workflow_state = 'CUSTOMER_VIEWED', customer_viewed_at = ?1, updated_at = ?1
WHERE report_version_id = ?2 AND workflow_state = 'SUBMITTED_TO_CUSTOMER'`;

export const SQL_CAS_ACKNOWLEDGE_REPORT = `
UPDATE OrchestrationReportVersion
SET workflow_state = 'CUSTOMER_ACKNOWLEDGED', acknowledged_at = ?1, updated_at = ?1
WHERE report_version_id = ?2 AND workflow_state = 'CUSTOMER_VIEWED'`;

export const SQL_CAS_SUPERSEDE_REPORT = `
UPDATE OrchestrationReportVersion
SET workflow_state = 'SUPERSEDED', superseded_by = ?1, superseded_at = ?2, supersede_reason = ?3, updated_at = ?2
WHERE report_version_id = ?4 AND workflow_state <> 'SUPERSEDED'`;

export const SQL_INSERT_CHECKLIST = `
INSERT INTO OrchestrationQualityChecklist (
  checklist_id, assessment_id, report_version_id, checklist_json, is_complete, unconfirmed_count,
  confirmed_by, confirmed_at, created_at
) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`;

export const SQL_INSERT_ACKNOWLEDGEMENT = `
INSERT INTO OrchestrationAcknowledgement (
  acknowledgement_id, report_version_id, assessment_id, tenant_id, user_id, user_name, notes, acknowledged_at
) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`;

export const SQL_INSERT_CORRECTION = `
INSERT INTO OrchestrationCorrectionRequest (
  request_id, assessment_id, tenant_id, user_id, category, description, supporting_file_name, status, created_at
) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 'OPEN', ?8)`;

export const SQL_INSERT_NOTIFICATION = `
INSERT INTO OrchestrationNotification (
  notification_id, recipient_type, tenant_id, assessment_id, report_version_id, title, message, severity,
  read_flag, email_status, email_last_error, email_retry_count, created_at
) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 0, ?9, ?10, 0, ?11)`;

export const SQL_INSERT_AUDIT_EVENT = `
INSERT INTO OrchestrationAuditEvent (
  event_id, tenant_id, assessment_id, actor_id, actor_role, event_type, entity_type, entity_id,
  previous_state, new_state, metadata_json, created_at
) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)`;
