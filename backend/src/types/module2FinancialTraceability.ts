/**
 * Module 2 Final Transaction-Level Financial Traceability Types
 * Defines data structures for full lineage auditing from VGT transactions to financial outputs.
 * Version: MODULE_2_TRACEABILITY_V1.0
 */

export interface TransactionLineageRow {
  transactionId: string;
  poNumber: string;
  poDate: string;
  vendorCode: string;
  vendorName: string;
  materialCode: string;
  materialDesc: string;
  category: string;
  plant: string;
  quantity: number;
  uom: string;
  historicalUnitPrice: number;
  benchmarkUnitPrice: number;
  priceVarianceUnitPrice: number;
  lineSpendInr: number;
  lineSpendCr: number;
  applicableDenominator: string;
  opportunityId: string;
  primaryLever: string;
  potentialOpportunityInr: number;
  potentialOpportunityCr: number;
  confidence: string;
  formula: string;
}

export interface OpportunityLineageRow {
  opportunityId: string;
  category: string;
  primaryLever: string;
  applicableDenominator: string;
  denominatorSpendCr: number;
  sourceSpendCr: number;
  eligibleSpendCr: number;
  sourceTransactionCount: number;
  sourceTransactionIds: string[];
  grossOpportunityCr: number;
  overlapGroupId: string;
  overlapDeductionCr: number;
  netOpportunityCr: number;
  provenOpportunityCr: number;
  confidence: string;
  formula: string;
  classification: 'PROVEN' | 'EVIDENCE_BACKED' | 'ASSUMPTION_BASED' | 'THEORETICAL' | 'EXCLUDED';
}

export interface DenominatorReconciliationRow {
  denominatorType: string;
  description: string;
  reportedSpendCr: number;
  transactionSpendCr: number;
  transactionCount: number;
  varianceCr: number;
  reconciliationStatus: 'RECONCILED' | 'VARIANCE_DETECTED';
  overlapNotes: string;
}

export interface CategoryReconciliationRow {
  metric: string;
  count: number;
  notes: string;
}

export interface OverlapTraceRow {
  overlapId: string;
  opportunityId: string;
  category: string;
  leverA: string;
  leverB: string;
  grossACr: number;
  grossBCr: number;
  selectedOpportunityCr: number;
  deductionCr: number;
  deductionReason: string;
  sourceTransactionCount: number;
  sampleTransactionIds: string;
}

export interface ProvenOpportunityTraceRow {
  opportunityId: string;
  transactionId: string;
  supplier: string;
  category: string;
  materialDesc: string;
  historicalUnitPrice: number;
  benchmarkUnitPrice: number;
  quantity: number;
  historicalSpendCr: number;
  priceVarianceCr: number;
  provenOpportunityCr: number;
  formula: string;
  confidence: string;
  classification: 'PROVEN';
}

export interface FinancialTraceabilityTestResult {
  testId: string;
  name: string;
  description: string;
  expected: string;
  actual: string;
  passed: boolean;
  details: string;
}

export interface TraceabilityAuditSummary {
  totalEvaluatedSpendCr: number;
  addressableSpendCr: number;
  nonAddressableSpendCr: number;
  grossMultiLeverPoolCr: number;
  overlapDeductionCr: number;
  netDefensibleOpportunityCr: number;
  provenOpportunityCr: number;
  indicativeDeliveryMinCr: number;
  indicativeDeliveryMaxCr: number;
  opportunityCount: number;
  totalCategoriesCount: number;
  strategicCategoriesCount: number;
  monetaryCategoriesCount: number;
  zeroOpportunityCategoriesCount: number;
  transactionLineageCount: number;
  provenTransactionCount: number;
  assumptionBasedAmountCr: number;
  theoreticalAmountCr: number;
  excludedAmountCr: number;
  independentCalculationVarianceCr: number;
  uiApiReportParityVarianceCr: number;
  module1RegressionStatus: 'ZERO_REGRESSION';
  vgtSha256: string;
  fxMasterSha256: string;
  workbookFilename: string;
  workbookSha256: string;
  totalTests: number;
  testsPassed: number;
  finalVerdict: 'FINANCIALLY CERTIFIED' | 'FINANCIALLY NOT CERTIFIED';
}
