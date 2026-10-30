/**
 * Governance and reconciliation sheets: savings bridge, validation checks, data version history and
 * diff, KPI reconciliation, and analysis run control. Values come from the assessment record, the
 * approved run, and the ledger totals in the snapshot.
 */

import { EVIDENCE_TOLERANCE } from '../constants/evidenceParity';
import {
  EVIDENCE_CHECK_LABELS,
  EVIDENCE_SHEET_HEADERS,
  EVIDENCE_SHEET_LABELS,
  EVIDENCE_SHEET_NAMES
} from '../constants/evidenceWorkbook';
import type {
  EvidenceCell,
  EvidenceSheet,
  EvidenceSnapshot,
  EvidenceVersionRecord,
  ParityValidationSummary
} from '../types/evidenceWorkbook';
import { orBlank, parityCheckRow, yesNo } from './evidenceSheetCommon';

const statusFor = (passed: boolean): string => (passed ? EVIDENCE_CHECK_LABELS.PASS : EVIDENCE_CHECK_LABELS.FAIL);

const withinTolerance = (uiValue: number | null, sourceValue: number | null, tolerance: number): string =>
  statusFor(uiValue !== null && sourceValue !== null && Math.abs(uiValue - sourceValue) <= tolerance);

const bridgeRow = (
  step: number,
  component: string,
  uiValue: number | null,
  sourceValue: number | null,
  tolerance: number,
  formula: string
): EvidenceCell[] => [
  step,
  component,
  orBlank(uiValue),
  orBlank(sourceValue),
  withinTolerance(uiValue, sourceValue, tolerance),
  formula
];

export const buildBridgeSheet = (snapshot: EvidenceSnapshot): EvidenceSheet => {
  const job = snapshot.assessment;
  const run = snapshot.activeRun;
  const crTolerance = EVIDENCE_TOLERANCE.FINANCIAL_CR;
  const pctTolerance = EVIDENCE_TOLERANCE.PERCENT_POINTS;
  const rows: EvidenceCell[][] = [
    [...EVIDENCE_SHEET_HEADERS.BRIDGE],
    bridgeRow(1, EVIDENCE_CHECK_LABELS.BRIDGE_GROSS, job.grossOpportunityCr, run?.grossOpportunityCr ?? null,
      crTolerance, EVIDENCE_CHECK_LABELS.BRIDGE_GROSS_FORMULA),
    bridgeRow(2, EVIDENCE_CHECK_LABELS.BRIDGE_OVERLAP, job.overlapDeductionsCr, run?.overlapDeductionsCr ?? null,
      crTolerance, EVIDENCE_CHECK_LABELS.BRIDGE_OVERLAP_FORMULA),
    bridgeRow(3, EVIDENCE_CHECK_LABELS.BRIDGE_NET, job.netDefensibleOpportunityCr,
      run?.netDefensibleOpportunityCr ?? null, crTolerance, EVIDENCE_CHECK_LABELS.BRIDGE_NET_FORMULA),
    bridgeRow(4, EVIDENCE_CHECK_LABELS.BRIDGE_POTENTIAL, job.potentialSavingsCr, run?.potentialSavingsCr ?? null,
      crTolerance, EVIDENCE_CHECK_LABELS.BRIDGE_POTENTIAL_FORMULA),
    bridgeRow(5, EVIDENCE_CHECK_LABELS.BRIDGE_PERCENT, job.savingsPct, run?.savingsPct ?? null,
      pctTolerance, EVIDENCE_CHECK_LABELS.BRIDGE_PERCENT_FORMULA)
  ];
  return { name: EVIDENCE_SHEET_NAMES.CALCULATION_BRIDGE, rows };
};

export const buildValidationSheet = (snapshot: EvidenceSnapshot, parity: ParityValidationSummary): EvidenceSheet => {
  const rowCountPasses = snapshot.ledger.rowCount > 0;
  const rows: EvidenceCell[][] = [
    [...EVIDENCE_SHEET_HEADERS.VALIDATION],
    [
      EVIDENCE_CHECK_LABELS.LEDGER_ROWS_CHECK,
      EVIDENCE_CHECK_LABELS.LEDGER_ROWS_EXPECTED,
      snapshot.ledger.rowCount,
      0,
      statusFor(rowCountPasses),
      EVIDENCE_CHECK_LABELS.LEDGER_ROWS_SOURCE
    ]
  ];
  for (const check of parity.checks) {
    rows.push([check.kpi, check.sourceValue, check.evidenceValue, check.variance, check.status, check.notes]);
  }
  return { name: EVIDENCE_SHEET_NAMES.VALIDATION_CHECKS, rows };
};

const versionRow = (version: EvidenceVersionRecord): EvidenceCell[] => [
  version.versionNumber,
  version.dataVersionId,
  version.fileName,
  orBlank(version.recordCount),
  orBlank(version.fileSize),
  orBlank(version.checksum),
  orBlank(version.uploadedBy),
  orBlank(version.uploadedAt),
  yesNo(version.isSuperseded)
];

export const buildDataVersionSheet = (snapshot: EvidenceSnapshot): EvidenceSheet => {
  const rows: EvidenceCell[][] = [[...EVIDENCE_SHEET_HEADERS.DATA_VERSION]];
  for (const version of snapshot.versions) {
    rows.push(versionRow(version));
  }
  return { name: EVIDENCE_SHEET_NAMES.DATA_VERSIONS, rows };
};

const recordDelta = (from: EvidenceVersionRecord, to: EvidenceVersionRecord): EvidenceCell => {
  if (from.recordCount === null || to.recordCount === null) return '';
  return to.recordCount - from.recordCount;
};

const diffRow = (from: EvidenceVersionRecord, to: EvidenceVersionRecord): EvidenceCell[] => [
  from.dataVersionId,
  to.dataVersionId,
  orBlank(from.recordCount),
  orBlank(to.recordCount),
  recordDelta(from, to),
  yesNo(from.fileName !== to.fileName),
  yesNo(from.checksum !== to.checksum)
];

export const buildVersionDiffSheet = (snapshot: EvidenceSnapshot): EvidenceSheet => {
  const ordered = [...snapshot.versions].sort((left, right) => left.versionNumber - right.versionNumber);
  const rows: EvidenceCell[][] = [[...EVIDENCE_SHEET_HEADERS.VERSION_DIFF]];
  if (ordered.length < 2) {
    rows.push([EVIDENCE_SHEET_LABELS.noPriorVersion]);
  }
  for (let index = 1; index < ordered.length; index += 1) {
    rows.push(diffRow(ordered[index - 1], ordered[index]));
  }
  return { name: EVIDENCE_SHEET_NAMES.VERSION_DIFF, rows };
};

export const buildKpiReconciliationSheet = (parity: ParityValidationSummary): EvidenceSheet => {
  const rows: EvidenceCell[][] = [[...EVIDENCE_SHEET_HEADERS.KPI]];
  for (const check of parity.checks) {
    rows.push(parityCheckRow(check));
  }
  return { name: EVIDENCE_SHEET_NAMES.KPI_RECONCILIATION, rows };
};

export const buildRunsSheet = (snapshot: EvidenceSnapshot): EvidenceSheet => {
  const rows: EvidenceCell[][] = [[...EVIDENCE_SHEET_HEADERS.RUN]];
  for (const run of snapshot.runs) {
    rows.push([
      run.analysisRunId,
      run.dataVersionId,
      run.status,
      orBlank(run.totalSpendCr),
      orBlank(run.validatedSpendCr),
      orBlank(run.grossOpportunityCr),
      orBlank(run.overlapDeductionsCr),
      orBlank(run.netDefensibleOpportunityCr),
      orBlank(run.potentialSavingsCr),
      orBlank(run.savingsPct),
      yesNo(run.allGatesPassed),
      yesNo(run.isApproved),
      yesNo(run.isSuperseded),
      run.createdAt
    ]);
  }
  return { name: EVIDENCE_SHEET_NAMES.ANALYSIS_RUNS, rows };
};
