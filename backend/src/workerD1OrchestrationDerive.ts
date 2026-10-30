/**
 * Pure business rules for the Analysis Orchestration API: job status derivation, report visibility,
 * the generation readiness gate, admin KPIs and small formatting helpers. No I/O happens here.
 */
import type {
  AdminOrchestrationKPIs,
  AdminQualityGateChecklist,
  AnalysisJobStatus,
  AnalysisReadinessSummary,
  ReportWorkflowState
} from './types/analysisOrchestration';
import type {
  ActiveReportState,
  AssessmentJobRow,
  KpiJobInput,
  ReadinessInput,
  RunReadinessInput
} from './types/orchestrationD1';
import {
  ACTIVE_REPORT_STATES,
  CUSTOMER_VISIBLE_REPORT_STATES,
  KPI_JOB_STATUS_GROUPS,
  ORCHESTRATION_DEFAULTS,
  ORCHESTRATION_NUMERIC,
  REPORT_WORKFLOW_STATE_VALUES
} from './constants/orchestration';
import { ORCHESTRATION_MESSAGES } from './constants/orchestrationMessages';

/** Type guard for membership in a readonly list of literal values. */
export const isOneOf = <T extends string>(values: readonly T[], value: string | null): value is T =>
  value !== null && values.some((candidate) => candidate === value);

/** Returns the value when it is a member of the list, otherwise fails loudly (the database should never hold it). */
export const requireOneOf = <T extends string>(values: readonly T[], value: string, label: string): T => {
  if (isOneOf(values, value)) return value;
  throw new Error(`Unexpected ${label} value "${value}" in analysis orchestration data`);
};

export const requireReportWorkflowState = (value: string): ReportWorkflowState =>
  requireOneOf(REPORT_WORKFLOW_STATE_VALUES, value, 'report workflow state');

export const isActiveReportState = (value: string | null): value is ActiveReportState =>
  isOneOf(ACTIVE_REPORT_STATES, value);

export const isCustomerVisibleState = (value: string | null): boolean => isOneOf(CUSTOMER_VISIBLE_REPORT_STATES, value);

const isRunApproved = (row: AssessmentJobRow): boolean => row.run_is_approved === 1 && row.run_gates_passed === 1;

/**
 * Job status shown to admins and customers. The active report decides once one exists. Before that, the
 * data version and the latest analysis run decide: no data, no run, a run on an older version, or a run that
 * is not approved or failed its gates.
 */
export const deriveJobStatus = (row: AssessmentJobRow): AnalysisJobStatus => {
  if (isActiveReportState(row.report_state)) return row.report_state;
  if (row.current_version_id === null) return 'UPLOADED';
  if (row.run_id === null || row.run_version_id !== row.current_version_id) return 'ANALYSIS_QUEUED';
  return isRunApproved(row) ? 'READY_FOR_GENERATION' : 'ANALYSIS_BLOCKED';
};

export const roundTo = (value: number, decimals: number): number => Number(value.toFixed(decimals));

const spendCoveragePercent = (run: RunReadinessInput): number | null => {
  if (run.addressableSpendCr === null || run.spendCr <= 0) return null;
  const share = (run.addressableSpendCr / run.spendCr) * ORCHESTRATION_NUMERIC.percentScale;
  return roundTo(share, ORCHESTRATION_NUMERIC.percentDecimals);
};

const runBlockingReasons = (
  run: RunReadinessInput,
  latestVersionId: string | null,
  coveragePct: number | null
): string[] => {
  const reasons: string[] = [];
  if (run.versionId !== latestVersionId) reasons.push(ORCHESTRATION_MESSAGES.readinessStaleRun(run.runId));
  if (!run.approved) reasons.push(ORCHESTRATION_MESSAGES.readinessNotApproved(run.runId));
  if (!run.gatesPassed) reasons.push(ORCHESTRATION_MESSAGES.readinessGatesFailed(run.runId));
  if (coveragePct === null) {
    reasons.push(ORCHESTRATION_MESSAGES.readinessSpendUnavailable(run.runId));
  } else if (coveragePct < ORCHESTRATION_NUMERIC.minSpendCoveragePct) {
      reasons.push(
      ORCHESTRATION_MESSAGES.readinessBelowThreshold(coveragePct, ORCHESTRATION_NUMERIC.minSpendCoveragePct)
    );
  }
  return reasons;
};

/**
 * Readiness gate for report generation. Spend coverage is the analysis run's addressable spend share.
 * PCBI gap rows are not stored in D1 yet, so category and item coverage read 100 once a run exists
 * (no gaps are recorded) and 0 without a run.
 */
export const buildReadiness = (input: ReadinessInput): AnalysisReadinessSummary => {
  const run = input.run;
  const coveragePct = run === null ? null : spendCoveragePercent(run);
  const blockingReasons = run === null
    ? [ORCHESTRATION_MESSAGES.readinessNoRun]
    : runBlockingReasons(run, input.latestVersionId, coveragePct);
  const gapCoveragePct = run === null ? 0 : ORCHESTRATION_NUMERIC.coveragePctWithoutRecordedGaps;
  return {
    categoryCoveragePct: gapCoveragePct,
    spendCoveragePct: coveragePct ?? 0,
    itemCoveragePct: gapCoveragePct,
    categoriesRequiringReview: 0,
    itemsExcluded: 0,
    dataCorrectionsPending: input.openCorrectionCount,
    overallReadiness: blockingReasons.length === 0 ? 'READY_TO_GENERATE' : 'ACTION_REQUIRED',
    blockingReasons
  };
};

export const readinessInputFromRow = (row: AssessmentJobRow, openCorrectionCount: number): ReadinessInput => ({
  run: toRunReadiness(row),
  latestVersionId: row.current_version_id,
  openCorrectionCount
});

const toRunReadiness = (row: AssessmentJobRow): RunReadinessInput | null => {
  if (row.run_id === null || row.run_version_id === null) return null;
  return {
    runId: row.run_id,
    versionId: row.run_version_id,
    spendCr: row.run_spend_cr ?? 0,
    addressableSpendCr: row.run_addressable_spend_cr,
    approved: row.run_is_approved === 1,
    gatesPassed: row.run_gates_passed === 1
  };
};

const countInStatuses = (jobs: readonly KpiJobInput[], statuses: readonly AnalysisJobStatus[]): number =>
  jobs.filter((job) => statuses.includes(job.status)).length;

export const computeKpis = (jobs: readonly KpiJobInput[], openCorrectionCount: number): AdminOrchestrationKPIs => ({
  newAnalyses: countInStatuses(jobs, KPI_JOB_STATUS_GROUPS.newAnalyses),
  pcbiReviewsPending: countInStatuses(jobs, KPI_JOB_STATUS_GROUPS.pcbiReviewsPending),
  dataCorrectionsPending: openCorrectionCount,
  reportsPendingReview: countInStatuses(jobs, KPI_JOB_STATUS_GROUPS.reportsPendingReview),
  reportsReadyToSubmit: jobs.filter((job) => job.status === 'ADMIN_REVIEW' && job.checklistComplete).length,
  customerAcknowledgementsPending: countInStatuses(jobs, KPI_JOB_STATUS_GROUPS.customerAcknowledgementsPending),
  blockedAnalyses: countInStatuses(jobs, KPI_JOB_STATUS_GROUPS.blockedAnalyses),
  totalAnalyses: jobs.length
});

/** File type from the extension, upper-cased. Files without an extension are UNKNOWN. */
export const toFileType = (fileName: string): string => {
  const dotIndex = fileName.lastIndexOf('.');
  if (dotIndex < 0 || dotIndex === fileName.length - 1) return ORCHESTRATION_DEFAULTS.unknownFileType;
  return fileName.slice(dotIndex + 1).toUpperCase();
};

export const formatAnalysisPeriod = (start: string | null, end: string | null): string => {
  const parts = [start, end].filter((part): part is string => typeof part === 'string' && part.length > 0);
  return parts.length > 0 ? parts.join(ORCHESTRATION_DEFAULTS.periodSeparator) : ORCHESTRATION_DEFAULTS.periodFallback;
};

/** Number of checklist items that are not ticked. The checklist is complete when this is zero. */
export const countUnconfirmedItems = (
  checklist: Pick<AdminQualityGateChecklist, 'dataQuality' | 'pcbi' | 'financial' | 'report'>
): number => {
  const flags = [
    ...Object.values(checklist.dataQuality),
    ...Object.values(checklist.pcbi),
    ...Object.values(checklist.financial),
    ...Object.values(checklist.report)
  ];
  return flags.filter((flag) => !flag).length;
};
