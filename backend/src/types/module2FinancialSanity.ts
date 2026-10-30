/**
 * Module 2 Financial Formula & Savings Sanity Certification Types
 * Version: MODULE_2_FINANCIAL_SANITY_V1.0
 */

export interface AddressableSpendReconciliationRow {
  category: string;
  sourceTransactionCount: number;
  comparableTransactionCount: number;
  validatedSpendInr: number;
  validatedSpendCr: number;
  eligibleSpendInr: number;
  eligibleSpendCr: number;
  eligibilityRule: string;
  excludedSpendInr: number;
  excludedSpendCr: number;
  reasonExcluded: string;
}

export interface OpportunityLedgerAuditRow {
  opportunityId: string;
  category: string;
  sourceSpendInr: number;
  sourceSpendCr: number;
  lever: string;
  savingsRatePct: number;
  savingsFormula: string;
  grossOpportunityInr: number;
  grossOpportunityCr: number;
  sourceTransactionIdsCount: number;
  sourceTransactionIdsSample: string;
}

export interface SavingsRateAuditRow {
  category: string;
  eligibleSpendCr: number;
  totalCategorySpendCr: number;
  grossOpportunityCr: number;
  netOpportunityCr: number;
  impliedSavingsRateOnAddressablePct: number;
  impliedSavingsRateOnTotalSpendPct: number;
  lever: string;
  methodology: string;
  flagLevel: 'NORMAL' | 'OVER_25' | 'OVER_50' | 'OVER_100';
  economicRationale: string;
}

export interface LeverBridgeItem {
  leverName: string;
  eligibleSpendInr: number;
  eligibleSpendCr: number;
  assumedSavingsPct: number;
  grossSavingsInr: number;
  grossSavingsCr: number;
  overlapGroup: string;
  overlapInr: number;
  overlapCr: number;
  netSavingsInr: number;
  netSavingsCr: number;
  shareOfGrossPct: number;
}

export interface TransactionOverlapAuditRow {
  poNumber: string;
  category: string;
  convertedSpendInr: number;
  leversAttachedCount: number;
  attachedLevers: string[];
  grossOpportunityInr: number;
  overlapDeductionInr: number;
  netOpportunityInr: number;
  doubleCountingPrevented: boolean;
}

export interface CategoryIndependentAuditResult {
  category: string;
  totalSpendInr: number;
  totalSpendCr: number;
  eligibleSpendInr: number;
  eligibleSpendCr: number;
  eauctionInr: number;
  consolidationInr: number;
  volumeBundlingInr: number;
  specialistInr: number;
  grossOpportunityInr: number;
  grossOpportunityCr: number;
  overlapInr: number;
  overlapCr: number;
  netOpportunityInr: number;
  netOpportunityCr: number;
  provenOpportunityInr: number;
  provenOpportunityCr: number;
  rangeMinInr: number;
  rangeMinCr: number;
  rangeMaxInr: number;
  rangeMaxCr: number;
  evidenceState: string;
}

export interface FinancialDenominatorObject {
  opportunityId: string;
  category: string;
  lever: string;
  denominatorType:
    | 'PRICE_VARIANCE_ELIGIBLE_SPEND'
    | 'VOLUME_BUNDLING_ELIGIBLE_SPEND'
    | 'VENDOR_CONSOLIDATION_ELIGIBLE_SPEND'
    | 'E_AUCTION_ELIGIBLE_SPEND'
    | 'HISTORICAL_PRICE_VARIANCE_SPEND'
    | 'OTHER_APPROVED_DENOMINATOR';
  denominatorAmountInr: number;
  denominatorAmountCr: number;
  denominatorTransactionCount: number;
  numeratorAmountInr: number;
  numeratorAmountCr: number;
  ratePct: number;
  formula: string;
  evidenceType: string;
  confidence: string;
  overlapGroupId: string;
  sourceTransactionIds: string[];
}

export interface OpportunityOverlapLedgerRow {
  opportunityId: string;
  category: string;
  lever: string;
  grossOpportunityInr: number;
  grossOpportunityCr: number;
  overlapGroupId: string;
  selectedOpportunityInr: number;
  selectedOpportunityCr: number;
  deductedOpportunityInr: number;
  deductedOpportunityCr: number;
  deductionReason: string;
}

export interface FinancialGovernanceTestResult {
  testId: string;
  ruleName: string;
  expected: string;
  actual: string;
  passed: boolean;
  details: string;
}

export interface FinancialSanityAuditSummary {
  totalValidatedSpendInr: number;
  totalValidatedSpendCr: number;
  totalAddressableSpendInr: number;
  totalAddressableSpendCr: number;
  nonAddressableSpendInr: number;
  nonAddressableSpendCr: number;
  volumeBundlingEligibleSpendInr: number;
  volumeBundlingEligibleSpendCr: number;
  grossQuantifiableBenefitInr: number;
  grossQuantifiableBenefitCr: number;
  grossMultiLeverOpportunityPoolCr: number;
  grossAsPercentOfAddressablePct: number;
  grossOpportunityToAddressableSpendRatioPct: number;
  grossAsPercentOfTotalSpendPct: number;
  ratioDescription: string;
  totalOverlappingOpportunityInr: number;
  totalOverlappingOpportunityCr: number;
  netQuantifiableOpportunityInr: number;
  netQuantifiableOpportunityCr: number;
  netAsPercentOfTotalSpendPct: number;
  provenOpportunityInr: number;
  provenOpportunityCr: number;
  quantifiableRangeMinCr: number;
  quantifiableRangeMaxCr: number;
  indicativeDeliveryMinCr: number;
  indicativeDeliveryMaxCr: number;
  maxCustomerFacingSavingsRatePct: number;
  maxSavingsRateOnAddressablePct: number;
  countRatesOver25Pct: number;
  countRatesOver50Pct: number;
  countRatesOver100Pct: number;
  zeroSavingsRateOver100Pct: boolean;
  noUnsupportedBenchmarkClaims: boolean;
  doubleCountingStatus: string;
  independentRecalculationVarianceCr: number;
  uiApiVarianceCr: number;
  evidenceVarianceCr: number;
  governanceTestsCount: number;
  governanceTestsPassedCount: number;
  finalVerdict: 'FINANCIALLY CERTIFIED' | 'FINANCIALLY NOT CERTIFIED';
}
