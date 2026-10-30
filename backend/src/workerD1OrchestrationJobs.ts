/**
 * Builds the job detail payload for the Analysis Orchestration API. Admins see every report and the
 * quality gate checklist. Customers see only reports they may view and never the internal checklist.
 */
import type {
  AdminQualityGateChecklist,
  AnalysisJobDetailPayload,
  CustomerReportAcknowledgement
} from './types/analysisOrchestration';
import type {
  AssessmentJobRow,
  OrchestrationActor,
  OrchestrationDatabase,
  ReportRow
} from './types/orchestrationD1';
import { ORCHESTRATION_MESSAGES } from './constants/orchestrationMessages';
import { notFoundError } from './workerD1OrchestrationHttp';
import {
  countOpenCorrections,
  findAcknowledgementRow,
  findLatestChecklistRow,
  findReportRow,
  listCorrectionRows,
  listProcurementStats,
  listReportRows,
  listVersionRows
} from './workerD1OrchestrationStore';
import {
  buildStatsByDocument,
  mapAcknowledgement,
  mapAnalysisJob,
  mapChecklist,
  mapCorrectionRequest,
  mapDatasetVersions,
  mapReport,
  parseStoredChecklist
} from './workerD1OrchestrationMapper';
import {
  buildReadiness,
  deriveJobStatus,
  isActiveReportState,
  isCustomerVisibleState,
  readinessInputFromRow
} from './workerD1OrchestrationDerive';

const loadChecklist = async (
  database: OrchestrationDatabase,
  report: ReportRow | null
): Promise<AdminQualityGateChecklist | undefined> => {
  if (report === null) return undefined;
  const row = await findLatestChecklistRow(database, report.report_version_id);
  if (row === null) return undefined;
  const checklist = parseStoredChecklist(row.checklist_json);
  return checklist === null ? undefined : mapChecklist(row, checklist);
};

const loadAcknowledgement = async (
  database: OrchestrationDatabase,
  report: ReportRow | null
): Promise<CustomerReportAcknowledgement | undefined> => {
  if (report === null || report.workflow_state !== 'CUSTOMER_ACKNOWLEDGED') return undefined;
  const row = await findAcknowledgementRow(database, report.report_version_id);
  return row === null ? undefined : mapAcknowledgement(row);
};

/** Loads a report that belongs to the job. Reports of other jobs are reported as not found. */
export const loadReportForJob = async (
  database: OrchestrationDatabase,
  job: AssessmentJobRow,
  reportVersionId: string
): Promise<ReportRow> => {
  const report = await findReportRow(database, reportVersionId);
  if (!report || report.assessment_id !== job.assessment_id) {
    throw notFoundError(ORCHESTRATION_MESSAGES.reportNotFound(reportVersionId));
  }
  return report;
};

export const buildJobDetail = async (
  database: OrchestrationDatabase,
  row: AssessmentJobRow,
  actor: OrchestrationActor
): Promise<AnalysisJobDetailPayload> => {
  const assessmentId = row.assessment_id;
  const [versionRows, statsRows, reportRows, correctionRows, openCount] = await Promise.all([
    listVersionRows(database, assessmentId),
    listProcurementStats(database, assessmentId),
    listReportRows(database, assessmentId),
    listCorrectionRows(database, assessmentId),
    countOpenCorrections(database, assessmentId)
  ]);
  const isAdmin = actor.role === 'ADMIN';
  const activeReport = reportRows.find((report) => isActiveReportState(report.workflow_state)) ?? null;
  const activeVisible = activeReport !== null && isCustomerVisibleState(activeReport.workflow_state);
  const [checklist, acknowledgement] = await Promise.all([
    loadChecklist(database, isAdmin ? activeReport : null),
    loadAcknowledgement(database, activeReport)
  ]);
  return {
    job: mapAnalysisJob(row, deriveJobStatus(row), isAdmin || activeVisible),
    versions: mapDatasetVersions(versionRows, {
      assessmentId,
      customerId: row.customer_id,
      latestRunVersionId: row.run_version_id,
      latestRunGatesPassed: row.run_gates_passed === 1,
      statsByDocument: buildStatsByDocument(statsRows)
    }),
    pcbiGaps: [],
    readiness: buildReadiness(readinessInputFromRow(row, openCount)),
    reports: reportRows
      .filter((report) => isAdmin || isCustomerVisibleState(report.workflow_state))
      .map(mapReport),
    checklist,
    acknowledgement,
    correctionRequests: correctionRows.map(mapCorrectionRequest)
  };
};
