import type {
  OpportunityHeadAssumption,
  CategoryOpportunityBenefit
} from '../types/module2CategorySpecialisation';
import {
  LEVER6_TENANT_IDS,
  LEVER6_VALIDATION_STATUSES,
  LEVER6_BENEFIT_DISCLAIMER
} from '../constants/module2CategorySpecialisation';

export interface CategoryMetrics {
  categoryName: string;
  totalSpendInr: number;
  transactionCount: number;
  distinctSuppliersCount: number;
  distinctMaterialsCount: number;
  distinctPlantsCount: number;
  topSupplierSpendInr: number;
  topSupplierSharePct: number;
  herfindahlIndex: number;
  priceVariationCoefficient: number;
  contractCoveragePct: number;
}

export function roundToTwoDecimals(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function inrToCrore(amountInr: number): number {
  return roundToTwoDecimals(amountInr / 10000000);
}

export function calculateBenefitForHead(
  assumption: OpportunityHeadAssumption,
  categoryName: string,
  eligibleSpendInr: number,
  isEligibleEstablished: boolean,
  rationale: string,
  evidenceStatus: string,
  validationRequirements: string,
  commercialMechanism = '',
  eligibilityRule = '',
  hasDistinctScopeFromLever2 = false,
  distinctScopeEvidence?: string
): CategoryOpportunityBenefit {
  if (!isEligibleEstablished || eligibleSpendInr <= 0) {
    const isUnquantified = evidenceStatus === LEVER6_VALIDATION_STATUSES.IDENTIFIED_NOT_QUANTIFIED ||
      rationale.includes('Not Yet Quantifiable');
    const status = isUnquantified
      ? LEVER6_VALIDATION_STATUSES.IDENTIFIED_NOT_QUANTIFIED
      : LEVER6_VALIDATION_STATUSES.DATA_UNAVAILABLE;

    return {
      headKey: assumption.key,
      headCode: assumption.code,
      headTitle: assumption.title,
      categoryName,
      eligibleAnnualSpendInr: 0,
      eligibleAnnualSpendCr: 0,
      isEligibleEstablished: false,
      lowAssumptionPct: assumption.lowPct,
      baseAssumptionPct: assumption.basePct,
      highAssumptionPct: assumption.highPct,
      lowEstimateInr: 0,
      lowEstimateCr: 0,
      baseEstimateInr: 0,
      baseEstimateCr: 0,
      highEstimateInr: 0,
      highEstimateCr: 0,
      calculationRationale: rationale,
      dataAndEvidenceStatus: status,
      validationRequirements,
      disclaimer: LEVER6_BENEFIT_DISCLAIMER,
      commercialMechanism,
      eligibilityRule,
      opportunityStatus: status,
      hasDistinctScopeFromLever2,
      distinctScopeEvidence,
      relatedLever: assumption.relatedLever,
      appliesToOperatingCost: assumption.appliesToOperatingCost
    };
  }

  const lowInr = roundToTwoDecimals((eligibleSpendInr * assumption.lowPct) / 100);
  const baseInr = roundToTwoDecimals((eligibleSpendInr * assumption.basePct) / 100);
  const highInr = roundToTwoDecimals((eligibleSpendInr * assumption.highPct) / 100);

  return {
    headKey: assumption.key,
    headCode: assumption.code,
    headTitle: assumption.title,
    categoryName,
    eligibleAnnualSpendInr: eligibleSpendInr,
    eligibleAnnualSpendCr: inrToCrore(eligibleSpendInr),
    isEligibleEstablished: true,
    lowAssumptionPct: assumption.lowPct,
    baseAssumptionPct: assumption.basePct,
    highAssumptionPct: assumption.highPct,
    lowEstimateInr: lowInr,
    lowEstimateCr: inrToCrore(lowInr),
    baseEstimateInr: baseInr,
    baseEstimateCr: inrToCrore(baseInr),
    highEstimateInr: highInr,
    highEstimateCr: inrToCrore(highInr),
    calculationRationale: rationale,
    dataAndEvidenceStatus: evidenceStatus,
    validationRequirements,
    disclaimer: LEVER6_BENEFIT_DISCLAIMER,
    commercialMechanism,
    eligibilityRule,
    opportunityStatus: LEVER6_VALIDATION_STATUSES.TENTATIVE_PENDING,
    hasDistinctScopeFromLever2,
    distinctScopeEvidence,
    relatedLever: assumption.relatedLever,
    appliesToOperatingCost: assumption.appliesToOperatingCost
  };
}

export function computeHerfindahlIndex(supplierSpends: number[], totalSpend: number): number {
  if (totalSpend <= 0 || supplierSpends.length === 0) {
    return 0;
  }
  let sumSquaredShares = 0;
  for (const spend of supplierSpends) {
    const sharePct = (spend / totalSpend) * 100;
    sumSquaredShares += sharePct * sharePct;
  }
  return roundToTwoDecimals(sumSquaredShares);
}

export function isKnownCustomerAssessment(tenantId: string): boolean {
  return (
    tenantId === LEVER6_TENANT_IDS.ABC_TEXTILE ||
    tenantId === LEVER6_TENANT_IDS.PQR_CEMENT
  );
}
