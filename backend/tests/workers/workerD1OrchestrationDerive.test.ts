import { describe, expect, it } from 'vitest';
import { ORCHESTRATION_MESSAGES } from '../../src/constants/orchestrationMessages';
import {
  buildReadiness,
  computeKpis,
  countUnconfirmedItems,
  deriveJobStatus,
  formatAnalysisPeriod,
  isActiveReportState,
  isCustomerVisibleState,
  isOneOf,
  readinessInputFromRow,
  requireOneOf,
  requireReportWorkflowState,
  roundTo,
  toFileType
} from '../../src/workerD1OrchestrationDerive';
import type { AdminQualityGateChecklist } from '../../src/types/analysisOrchestration';
import type { AssessmentJobRow, ReadinessInput } from '../../src/types/orchestrationD1';

const jobRow = (overrides: Partial<AssessmentJobRow> = {}): AssessmentJobRow => ({
  assessment_id: 'AIC-1',
  customer_id: 'cust-1',
  customer_name: 'Customer One',
  assessment_owner: 'owner@example.test',
  assessment_period_start: 'Jan 2023',
  assessment_period_end: 'Dec 2023',
  record_spend_cr: 100,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-02T00:00:00.000Z',
  current_version_id: 'DV-1',
  current_uploaded_by: 'analyst@example.test',
  current_record_count: 10,
  original_version_id: 'DV-1',
  run_id: 'RUN-1',
  run_version_id: 'DV-1',
  run_spend_cr: 100,
  run_addressable_spend_cr: 90,
  run_is_approved: 1,
  run_gates_passed: 1,
  report_id: null,
  report_state: null,
  report_generated_at: null,
  report_submitted_at: null,
  report_viewed_at: null,
  report_acknowledged_at: null,
  report_updated_at: null,
  checklist_complete: null,
  ...overrides
});

const readyInput = (overrides: Partial<ReadinessInput> = {}): ReadinessInput => ({
  run: {
    runId: 'RUN-1',
    versionId: 'DV-1',
    spendCr: 100,
    addressableSpendCr: 90,
    approved: true,
    gatesPassed: true
  },
  latestVersionId: 'DV-1',
  openCorrectionCount: 0,
  ...overrides
});

describe('value guards', () => {
  it('matches only members of the list and null never matches', () => {
    expect(isOneOf(['A', 'B'], 'A')).toBe(true);
    expect(isOneOf(['A', 'B'], 'C')).toBe(false);
    expect(isOneOf(['A', 'B'], null)).toBe(false);
  });

  it('returns members and throws for values outside the vocabulary', () => {
    expect(requireOneOf(['A', 'B'], 'B', 'letter')).toBe('B');
    expect(() => requireOneOf(['A', 'B'], 'Z', 'letter')).toThrow('Unexpected letter value "Z"');
  });

  it('recognises active and customer-visible report states', () => {
    expect(isActiveReportState('ADMIN_REVIEW')).toBe(true);
    expect(isActiveReportState('SUPERSEDED')).toBe(false);
    expect(isActiveReportState(null)).toBe(false);
    expect(isCustomerVisibleState('ADMIN_REVIEW')).toBe(false);
    expect(isCustomerVisibleState('CUSTOMER_VIEWED')).toBe(true);
    expect(requireReportWorkflowState('SUPERSEDED')).toBe('SUPERSEDED');
  });
});

describe('deriveJobStatus', () => {
  it('uses the active report state once a report exists', () => {
    expect(deriveJobStatus(jobRow({ report_id: 'RPT-1', report_state: 'SUBMITTED_TO_CUSTOMER' })))
      .toBe('SUBMITTED_TO_CUSTOMER');
  });

  it('reports UPLOADED when no data version exists', () => {
    expect(deriveJobStatus(jobRow({ current_version_id: null }))).toBe('UPLOADED');
  });

  it('reports ANALYSIS_QUEUED when there is no run or the run is for an older version', () => {
    expect(deriveJobStatus(jobRow({ run_id: null, run_version_id: null }))).toBe('ANALYSIS_QUEUED');
    expect(deriveJobStatus(jobRow({ run_version_id: 'DV-0' }))).toBe('ANALYSIS_QUEUED');
  });

  it('reports ANALYSIS_BLOCKED when the run is unapproved or failed its gates', () => {
    expect(deriveJobStatus(jobRow({ run_is_approved: 0 }))).toBe('ANALYSIS_BLOCKED');
    expect(deriveJobStatus(jobRow({ run_gates_passed: 0 }))).toBe('ANALYSIS_BLOCKED');
  });

  it('reports READY_FOR_GENERATION for an approved, passing run on the latest version', () => {
    expect(deriveJobStatus(jobRow())).toBe('READY_FOR_GENERATION');
  });
});

describe('buildReadiness', () => {
  it('is ready when the run covers at least 85% of spend and passes every check', () => {
    const readiness = buildReadiness(readyInput());
    expect(readiness).toEqual({
      categoryCoveragePct: 100,
      spendCoveragePct: 90,
      itemCoveragePct: 100,
      categoriesRequiringReview: 0,
      itemsExcluded: 0,
      dataCorrectionsPending: 0,
      overallReadiness: 'READY_TO_GENERATE',
      blockingReasons: []
    });
  });

  it('blocks with a no-run reason and zero coverage when there is no run', () => {
    const readiness = buildReadiness(readyInput({ run: null, openCorrectionCount: 3 }));
    expect(readiness).toMatchObject({
      categoryCoveragePct: 0,
      itemCoveragePct: 0,
      spendCoveragePct: 0,
      dataCorrectionsPending: 3,
      overallReadiness: 'ACTION_REQUIRED',
      blockingReasons: [ORCHESTRATION_MESSAGES.readinessNoRun]
    });
  });

  it('lists every blocking reason for a stale, unapproved and failed run with missing addressable spend', () => {
    const readiness = buildReadiness(readyInput({
      latestVersionId: 'DV-2',
      run: {
        runId: 'RUN-9', versionId: 'DV-1', spendCr: 100, addressableSpendCr: null, approved: false, gatesPassed: false
      }
    }));
    expect(readiness.blockingReasons).toEqual([
      ORCHESTRATION_MESSAGES.readinessStaleRun('RUN-9'),
      ORCHESTRATION_MESSAGES.readinessNotApproved('RUN-9'),
      ORCHESTRATION_MESSAGES.readinessGatesFailed('RUN-9'),
      ORCHESTRATION_MESSAGES.readinessSpendUnavailable('RUN-9')
    ]);
    expect(readiness.spendCoveragePct).toBe(0);
  });

  it('treats a run with no spend as unavailable coverage', () => {
    const readiness = buildReadiness(readyInput({
      run: { runId: 'RUN-0', versionId: 'DV-1', spendCr: 0, addressableSpendCr: 10, approved: true, gatesPassed: true }
    }));
    expect(readiness.blockingReasons).toEqual([ORCHESTRATION_MESSAGES.readinessSpendUnavailable('RUN-0')]);
  });

  it('blocks when spend coverage is below the threshold and reports the rounded percentage', () => {
    const readiness = buildReadiness(readyInput({
      run: { runId: 'RUN-2', versionId: 'DV-1', spendCr: 300, addressableSpendCr: 200, approved: true, gatesPassed: true }
    }));
    expect(readiness.spendCoveragePct).toBe(66.7);
    expect(readiness.blockingReasons).toEqual([ORCHESTRATION_MESSAGES.readinessBelowThreshold(66.7, 85)]);
  });

  it('derives readiness input from a job row', () => {
    expect(readinessInputFromRow(jobRow(), 2)).toEqual({
      run: {
        runId: 'RUN-1',
        versionId: 'DV-1',
        spendCr: 100,
        addressableSpendCr: 90,
        approved: true,
        gatesPassed: true
      },
      latestVersionId: 'DV-1',
      openCorrectionCount: 2
    });
    expect(readinessInputFromRow(jobRow({ run_id: null, run_version_id: null }), 0).run).toBeNull();
    expect(readinessInputFromRow(jobRow({ run_spend_cr: null }), 0).run?.spendCr).toBe(0);
  });
});

describe('computeKpis', () => {
  it('counts each bucket from job status and reports ready-to-submit only with a complete checklist', () => {
    const kpis = computeKpis([
      { status: 'UPLOADED', checklistComplete: false },
      { status: 'ANALYSIS_QUEUED', checklistComplete: false },
      { status: 'ADMIN_REVIEW', checklistComplete: true },
      { status: 'ADMIN_REVIEW', checklistComplete: false },
      { status: 'CUSTOMER_VIEWED', checklistComplete: false },
      { status: 'SUBMITTED_TO_CUSTOMER', checklistComplete: false },
      { status: 'PCBI_REVIEW_REQUIRED', checklistComplete: false },
      { status: 'ANALYSIS_BLOCKED', checklistComplete: false }
    ], 4);
    expect(kpis).toEqual({
      newAnalyses: 2,
      pcbiReviewsPending: 1,
      dataCorrectionsPending: 4,
      reportsPendingReview: 2,
      reportsReadyToSubmit: 1,
      customerAcknowledgementsPending: 2,
      blockedAnalyses: 1,
      totalAnalyses: 8
    });
  });
});

describe('formatting helpers', () => {
  it('derives the file type from the extension', () => {
    expect(toFileType('Spend.xlsx')).toBe('XLSX');
    expect(toFileType('archive.tar.csv')).toBe('CSV');
    expect(toFileType('no-extension')).toBe('UNKNOWN');
    expect(toFileType('ends-with-dot.')).toBe('UNKNOWN');
  });

  it('joins available period bounds and falls back when both are missing', () => {
    expect(formatAnalysisPeriod('Jan 2023', 'Dec 2023')).toBe('Jan 2023 - Dec 2023');
    expect(formatAnalysisPeriod('Jan 2023', null)).toBe('Jan 2023');
    expect(formatAnalysisPeriod(null, 'Dec 2023')).toBe('Dec 2023');
    expect(formatAnalysisPeriod('', null)).toBe('Period not specified');
  });

  it('rounds to the requested number of decimals', () => {
    expect(roundTo(2.34567, 2)).toBe(2.35);
  });

  it('counts unticked checklist items across every group', () => {
    const checklist: Pick<AdminQualityGateChecklist, 'dataQuality' | 'pcbi' | 'financial' | 'report'> = {
      dataQuality: { sourceDataValidated: true, spendReconciles: false, duplicateChecksCompleted: true, classificationReviewed: true },
      pcbi: { requiredPcbiCategoriesResolved: false, benchmarkSourcesValidated: false, exclusionsDocumented: true, pcbiCoverageAcceptable: true },
      financial: {
        savingsCalculationsValidated: true, noDoubleCounting: true, overlapsHandled: true, exclusionsApplied: true, totalsReconcile: true
      },
      report: {
        module1Reviewed: true, module2Reviewed: true, module3Reviewed: true, module4Reviewed: true, executiveSummaryReviewed: true
      }
    };
    expect(countUnconfirmedItems(checklist)).toBe(3);
  });
});
