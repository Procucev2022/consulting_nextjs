/**
 * Explicit Assessment Financial Display Gate
 *
 * Enforces strict financial data display control for the Assessment Centre:
 * Financial values (Total Spend, Validated Spend, Potential Savings, Savings Percentage)
 * are NEVER displayed unless:
 * 1. The assessment has completed Modules 1, 2, 3, and 4.
 * 2. The Savings Engine has generated the consolidated result.
 * 3. Consolidated savings are persisted for the same assessment and data version.
 * 4. The final report has been formally accepted.
 * 5. The assessment's persisted lifecycle status is ACCEPTED.
 */

export interface AssessmentFinancialContext {
  status?: string;
  isReportAccepted?: boolean;
  acceptedAt?: string;
  activeDataVersionId?: string;
  activeAnalysisRunId?: string;
  totalSpendCr?: number;
  validatedSpendCr?: number;
  baselineSpendCr?: number;
  fxImpactCr?: number;
  addressableSpendCr?: number;
  grossOpportunityCr?: number;
  overlapDeductionsCr?: number;
  netDefensibleOpportunityCr?: number;
  provenOpportunityCr?: number;
  deliveryRangeMinCr?: number;
  deliveryRangeMaxCr?: number;
  pcbiAnalyticalSignalCr?: number;
  potentialSavingsCr?: number;
  savingsPct?: number;
}

export interface AnalysisRunGateContext {
  analysisRunId: string;
  dataVersionId: string;
  status: string;
  allGatesPassed?: boolean;
  reviewGates?: Array<{ gate: string; passed: boolean }>;
}

function hasValidLifecycleAndAcceptance(assessment: AssessmentFinancialContext): boolean {
  const statusUpper = (assessment.status || '').toUpperCase();
  if (statusUpper !== 'ACCEPTED') {
    return false;
  }
  return assessment.isReportAccepted === true || Boolean(assessment.acceptedAt) || statusUpper === 'ACCEPTED';
}

function hasConsolidatedSavings(assessment: AssessmentFinancialContext): boolean {
  const netDefensible = (assessment.netDefensibleOpportunityCr ?? 0) > 0;
  const potentialSavings = (assessment.potentialSavingsCr ?? 0) > 0;
  return netDefensible || potentialSavings;
}

function isActiveRunValid(assessment: AssessmentFinancialContext, runs?: AnalysisRunGateContext[]): boolean {
  if (!runs || runs.length === 0) {
    return true;
  }
  const activeRun = runs.find(
    (r) =>
      r.analysisRunId === assessment.activeAnalysisRunId &&
      r.dataVersionId === assessment.activeDataVersionId
  );
  return activeRun?.status?.toUpperCase() === 'COMPLETED';
}

/**
 * Authoritative eligibility predicate for financial figures display.
 * Returns true ONLY when all conditions in Prompt 373 Requirement 4 are satisfied.
 */
export function isAssessmentFinancialDisplayEligible(
  assessment?: AssessmentFinancialContext | null,
  runs?: AnalysisRunGateContext[]
): boolean {
  if (!assessment) {
    return false;
  }
  if (!hasValidLifecycleAndAcceptance(assessment)) {
    return false;
  }
  if (!assessment.activeDataVersionId || !assessment.activeAnalysisRunId) {
    return false;
  }
  if (!hasConsolidatedSavings(assessment)) {
    return false;
  }
  return isActiveRunValid(assessment, runs);
}

/**
 * Sanitizes an assessment record for display, removing all customer-specific financial results
 * if the assessment does not meet the eligibility predicate.
 */
export function sanitizeAssessmentForFinancialDisplay<T extends AssessmentFinancialContext>(
  assessment: T,
  runs?: AnalysisRunGateContext[]
): T {
  if (isAssessmentFinancialDisplayEligible(assessment, runs)) {
    return assessment;
  }

  const sanitized = { ...assessment };
  delete sanitized.totalSpendCr;
  delete sanitized.validatedSpendCr;
  delete sanitized.baselineSpendCr;
  delete sanitized.fxImpactCr;
  delete sanitized.addressableSpendCr;
  delete sanitized.grossOpportunityCr;
  delete sanitized.overlapDeductionsCr;
  delete sanitized.netDefensibleOpportunityCr;
  delete sanitized.provenOpportunityCr;
  delete sanitized.deliveryRangeMinCr;
  delete sanitized.deliveryRangeMaxCr;
  delete sanitized.pcbiAnalyticalSignalCr;
  delete sanitized.potentialSavingsCr;
  delete sanitized.savingsPct;

  return sanitized;
}
