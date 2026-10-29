/**
 * Parity evaluation. For each KPI the check compares the UI value (AssessmentRecord), the evidence
 * value (recomputed from the ledger or the bridge components), and the source value (the approved
 * AssessmentAnalysisRun). A check passes when the largest pairwise difference is within tolerance.
 * A missing input fails the check, so an unverifiable KPI never reports as verified.
 */

import { EVIDENCE_MESSAGES } from '../constants/evidenceMessages';
import {
  EVIDENCE_MISSING_VALUE_LABEL,
  EVIDENCE_PARITY_CHECKS,
  EVIDENCE_PARITY_INPUT_LABELS,
  EVIDENCE_PERCENT_SCALE,
  EVIDENCE_TOLERANCE
} from '../constants/evidenceParity';
import type {
  EvidenceJobAccessRecord,
  EvidenceParityCheckDefinition,
  EvidenceParityInputs,
  EvidenceParityKey,
  EvidenceSnapshot,
  EvidenceWorkbookType,
  ParityCheckResult,
  ParityDiscrepancy,
  ParityValidationSummary
} from '../types/evidenceWorkbook';

const roundVariance = (value: number): number => Number(value.toFixed(EVIDENCE_TOLERANCE.VARIANCE_DECIMALS));

const displayValue = (value: number | null): number | string => value ?? EVIDENCE_MISSING_VALUE_LABEL;

const describeMissingInputs = (inputs: EvidenceParityInputs): string => {
  const missing: string[] = [];
  if (inputs.uiValue === null) missing.push(EVIDENCE_PARITY_INPUT_LABELS.UI);
  if (inputs.evidenceValue === null) missing.push(EVIDENCE_PARITY_INPUT_LABELS.EVIDENCE);
  if (inputs.sourceValue === null) missing.push(EVIDENCE_PARITY_INPUT_LABELS.SOURCE);
  return missing.join(', ');
};

const buildMissingInputResult = (
  definition: EvidenceParityCheckDefinition,
  inputs: EvidenceParityInputs
): ParityCheckResult => ({
  kpi: definition.kpi,
  uiValue: displayValue(inputs.uiValue),
  evidenceValue: displayValue(inputs.evidenceValue),
  sourceValue: displayValue(inputs.sourceValue),
  unit: definition.unit,
  variance: 0,
  status: 'FAIL',
  tolerance: definition.tolerance,
  supportingSheet: definition.supportingSheet,
  notes: EVIDENCE_MESSAGES.missingInputs(describeMissingInputs(inputs))
});

export const evaluateParityCheck = (
  definition: EvidenceParityCheckDefinition,
  inputs: EvidenceParityInputs
): ParityCheckResult => {
  const { uiValue, evidenceValue, sourceValue } = inputs;
  if (uiValue === null || evidenceValue === null || sourceValue === null) {
    return buildMissingInputResult(definition, inputs);
  }
  const variance = roundVariance(Math.max(Math.abs(uiValue - evidenceValue), Math.abs(evidenceValue - sourceValue)));
  const passed = variance <= definition.tolerance;
  return {
    kpi: definition.kpi,
    uiValue,
    evidenceValue,
    sourceValue,
    unit: definition.unit,
    variance,
    status: passed ? 'PASS' : 'FAIL',
    tolerance: definition.tolerance,
    supportingSheet: definition.supportingSheet,
    notes: passed
      ? EVIDENCE_MESSAGES.withinTolerance(definition.tolerance)
      : EVIDENCE_MESSAGES.outsideTolerance(variance, definition.tolerance)
  };
};

const ledgerSpend = (snapshot: EvidenceSnapshot): number | null =>
  snapshot.ledger.rowCount > 0 ? snapshot.ledger.totalCr : null;

const bridgeNetDefensible = (job: EvidenceJobAccessRecord): number | null =>
  job.grossOpportunityCr !== null && job.overlapDeductionsCr !== null
    ? job.grossOpportunityCr - job.overlapDeductionsCr
    : null;

const savingsPercent = (netCr: number | null, totalCr: number | null): number | null =>
  netCr !== null && totalCr !== null && totalCr > 0 ? (netCr / totalCr) * EVIDENCE_PERCENT_SCALE : null;

const resolveInputs = (key: EvidenceParityKey, snapshot: EvidenceSnapshot): EvidenceParityInputs => {
  const job = snapshot.assessment;
  const run = snapshot.activeRun;
  switch (key) {
    case 'TOTAL_SPEND':
      return {
        uiValue: job.totalSpendCr,
        evidenceValue: ledgerSpend(snapshot),
        sourceValue: run?.totalSpendCr ?? null
      };
    case 'VALIDATED_SPEND':
      return {
        uiValue: job.validatedSpendCr,
        evidenceValue: ledgerSpend(snapshot),
        sourceValue: run?.validatedSpendCr ?? null
      };
    case 'NET_DEFENSIBLE_OPPORTUNITY':
      return {
        uiValue: job.netDefensibleOpportunityCr,
        evidenceValue: bridgeNetDefensible(job),
        sourceValue: run?.netDefensibleOpportunityCr ?? null
      };
    case 'SAVINGS_PERCENT':
      return {
        uiValue: job.savingsPct,
        evidenceValue: savingsPercent(job.netDefensibleOpportunityCr, ledgerSpend(snapshot)),
        sourceValue: run?.savingsPct ?? null
      };
  }
};

export const buildParityChecks = (
  snapshot: EvidenceSnapshot,
  workbookType: EvidenceWorkbookType | null
): ParityCheckResult[] => {
  const definitions = workbookType === null
    ? EVIDENCE_PARITY_CHECKS
    : EVIDENCE_PARITY_CHECKS.filter((definition) => definition.workbookTypes.includes(workbookType));
  return definitions.map((definition) => evaluateParityCheck(definition, resolveInputs(definition.key, snapshot)));
};

const toDiscrepancy = (check: ParityCheckResult): ParityDiscrepancy => ({
  kpi: check.kpi,
  expectedValue: check.sourceValue,
  actualValue: check.evidenceValue,
  variance: check.variance,
  reason: EVIDENCE_MESSAGES.discrepancyReason(
    String(check.uiValue),
    String(check.evidenceValue),
    String(check.sourceValue)
  )
});

export const buildParitySummary = (
  snapshot: EvidenceSnapshot,
  workbookType: EvidenceWorkbookType | null,
  evaluatedAt: string
): ParityValidationSummary => {
  const checks = buildParityChecks(snapshot, workbookType);
  const discrepancies = checks.filter((check) => check.status === 'FAIL').map(toDiscrepancy);
  const totalChecks = checks.length;
  const failedChecks = discrepancies.length;
  return {
    jobId: snapshot.jobId,
    dataVersionId:
      snapshot.activeVersion?.dataVersionId ?? snapshot.activeRun?.dataVersionId ?? EVIDENCE_MISSING_VALUE_LABEL,
    totalChecks,
    passedChecks: totalChecks - failedChecks,
    failedChecks,
    overallStatus: totalChecks > 0 && failedChecks === 0 ? 'PASS' : 'FAIL',
    evaluatedAt,
    discrepancies,
    checks
  };
};
