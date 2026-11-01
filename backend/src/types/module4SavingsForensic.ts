/**
 * Module 4 Savings Engine Forensic Certification Types
 * Authoritative types for transaction-level opportunity ledger, classification, reconciliation, and audit.
 */

import type { ConfidenceLevel } from './savingsOpportunityRegister';

export type Module4LeverClassification =
  | 'DIRECT_SAVINGS'
  | 'COST_AVOIDANCE'
  | 'RISK_VALUE'
  | 'PROCESS_PRODUCTIVITY'
  | 'REALIZED_SAVINGS'
  | 'ANALYTICAL_SIGNAL'
  | 'OPPORTUNITY_POOL';

export interface Module4CanonicalOpportunityItem {
  opportunityId: string;
  sourceTransactionIds: string[];
  supplierIds: string[];
  materialGroup: string;
  itemShortText?: string;
  plant?: string;
  lever: string;
  subLever: string;
  eligibleSpend: number;
  eligibleSpendCr: number;
  denominator?: string | number;
  denominatorType: string;
  formula?: string;
  calculationFormula: string;
  grossOpportunity: number;
  grossOpportunityCr: number;
  overlapAmount: number;
  overlapAmountCr: number;
  excludedAmount: number;
  excludedAmountCr: number;
  netOpportunity: number;
  netOpportunityCr: number;
  provenOpportunity: number;
  provenOpportunityCr: number;
  deliveryLow: number;
  deliveryLowCr: number;
  deliveryHigh: number;
  deliveryHighCr: number;
  ratePercentage?: number;
  evidenceType: string;
  evidenceReference: string;
  confidence: ConfidenceLevel;
  status: 'IDENTIFIED' | 'QUALIFIED' | 'PROVEN' | 'IN_EXECUTION';
  classification: Module4LeverClassification;
  overlapGroupId: string;
  sourceTransactionCount: number;
}

export interface Module4CompleteTransactionLineageRow {
  opportunityId: string;
  lever: string;
  subLever: string;
  transactionId: string;
  supplier: string;
  materialGroup: string;
  plant: string;
  transactionDate: string;
  transactionAmount: number;
  eligibleAmount: number;
  denominatorType: string;
  grossContribution: number;
  overlapContribution: number;
  exclusionAmount: number;
  netContribution: number;
  provenContribution: number;
  evidenceType: string;
  evidenceReference: string;
  lineageStatus: string;
  assignmentType: string;
  multiLeverFlag: boolean;
}

export interface Module4TransactionLineageTestItem {
  testId: string;
  name: string;
  category: string;
  expectedBehavior: string;
  actualBehavior: string;
  status: 'PASSED' | 'FAILED';
  evidence: string;
}

export interface Module4LineageCoverageMetrics {
  totalOpportunities: number;
  opportunitiesWithCompleteLineage: number;
  opportunitiesMissingLineage: number;
  opportunityCoveragePct: number;
  totalGrossOpportunityCr: number;
  grossBackedByLineageCr: number;
  grossCoveragePct: number;
  totalNetOpportunityCr: number;
  netBackedByLineageCr: number;
  netCoveragePct: number;
  totalProvenOpportunityCr: number;
  provenBackedByLineageCr: number;
  provenCoveragePct: number;
  orphanTransactionsCount: number;
  duplicateTransactionsCount: number;
  missingEvidenceReferencesCount: number;
}

export interface Module4TransactionTraceRow {
  transactionId: string;
  poNumber: string;
  poDate: string;
  vendorName: string;
  materialGroup: string;
  itemCode: string;
  itemDescription: string;
  plant: string;
  quantity: number;
  uom: string;
  unitPriceInr: number;
  lineSpendInr: number;
  lineSpendCr: number;
  opportunityId: string;
  lever: string;
  eligibilityRule: string;
  denominatorType: string;
  formula: string;
  grossOpportunityInr: number;
  overlapDeductionInr: number;
  netOpportunityInr: number;
  netOpportunityCr: number;
  provenOpportunityInr: number;
  deliveryLowInr: number;
  deliveryHighInr: number;
  classification: Module4LeverClassification;
}

export interface Module4LeverGovernanceRecord {
  leverCode: string;
  leverName: string;
  economicThesis: string;
  classification: Module4LeverClassification;
  eligibleSpendCr: number;
  exactDenominator: string;
  eligibilityRule: string;
  rateFormula: string;
  grossOpportunityCr: number;
  exclusionsCr: number;
  overlapLogic: string;
  netOpportunityCr: number;
  evidenceRequirement: string;
  provenOpportunityCr: number;
  deliveryRange: string;
  sourceTransactionCount: number;
  monetizedStatus: 'MONETIZED_DIRECT' | 'NON_MONETIZED' | 'ANALYTICAL_SIGNAL' | 'SEPARATE_GOVERNANCE';
}

export interface Module4DenominatorRegisterRow {
  denominatorType: string;
  description: string;
  numeratorInr: number;
  numeratorCr: number;
  denominatorInr: number;
  denominatorCr: number;
  ratePercentage: number;
  transactionCount: number;
  isCustomerFacingCeilingCompliant: boolean;
  notes: string;
}

export interface Module4OverlapRelationship {
  overlapId: string;
  opportunityIdA: string;
  opportunityIdB: string;
  sourceTransactionIds: string[];
  overlapAmountInr: number;
  overlapAmountCr: number;
  overlapReason: string;
  deduplicationRule: string;
  category: string;
}

export interface Module4ExclusionRecord {
  transactionId: string;
  poNumber: string;
  vendorName: string;
  materialGroup: string;
  amountInr: number;
  amountCr: number;
  reason: string;
  moduleLever: string;
  ruleReference: string;
  evidenceReference: string;
}

export interface Module4FinancialBridge {
  totalValidatedSpendCr: number;
  module2AddressableSourcingSpendCr: number;
  module2CertifiedNetOpportunityCr: number;
  module2ProvenOpportunityCr: number;
  module3BenchmarkPriceGapCr: number;
  module4GrossOpportunityCr: number;
  module4OverlapCr: number;
  module4ExclusionsCr: number;
  module4NetOpportunityCr: number;
  module4ProvenOpportunityCr: number;
  approvedOpportunityCr?: number;
  negotiatedOpportunityCr?: number;
  implementedOpportunityCr?: number;
  realizedSavingsCr?: number;
  module4DeliveryLowCr: number;
  module4DeliveryHighCr: number;
  realizedSavingsStatus: string;
  costAvoidanceStatus: string;
  processProductivityStatus: string;
  varianceVsModule2NetCr: number;
  varianceExplanation: string;
}

export interface Module4IndependentRecalculation {
  productionEligibleSpendCr: number;
  independentEligibleSpendCr: number;
  eligibleSpendVarianceCr: number;
  productionGrossOpportunityCr: number;
  independentGrossOpportunityCr: number;
  grossOpportunityVarianceCr: number;
  productionOverlapCr: number;
  independentOverlapCr: number;
  overlapVarianceCr: number;
  productionExclusionsCr: number;
  independentExclusionsCr: number;
  exclusionsVarianceCr: number;
  productionNetOpportunityCr: number;
  independentNetOpportunityCr: number;
  netOpportunityVarianceCr: number;
  productionProvenOpportunityCr: number;
  independentProvenOpportunityCr: number;
  provenOpportunityVarianceCr: number;
  productionDeliveryLowCr: number;
  independentDeliveryLowCr: number;
  deliveryLowVarianceCr: number;
  productionDeliveryHighCr: number;
  independentDeliveryHighCr: number;
  deliveryHighVarianceCr: number;
  isZeroVariance: boolean;
}

export interface Module4TestMatrixItem {
  testId: string;
  name: string;
  category: string;
  expectedBehavior: string;
  actualBehavior: string;
  status: 'PASSED' | 'FAILED';
  evidence: string;
}

export interface Module4FinalCertificationRegister {
  version: string;
  sourceDatasetChecksum: string;
  canonicalOpportunityLedgerChecksum: string;
  opportunitiesCount: number;
  sourceTransactionsCount: number;
  eligibleSpendCr: number;
  grossOpportunityCr: number;
  overlapCr: number;
  exclusionsCr: number;
  netOpportunityCr: number;
  provenOpportunityCr: number;
  deliveryLowCr: number;
  deliveryHighCr: number;
  benchmarkPriceGapContribution: string;
  realizedSavingsSeparate: string;
  costAvoidanceSeparate: string;
  processProductivitySeparate: string;
  independentCalculatorVarianceCr: number;
  uiApiVarianceCr: number;
  evidenceVarianceCr: number;
  module1Regression: string;
  module2Regression: string;
  module3Regression: string;
  testsCount: {
    total: number;
    passed: number;
    failed: number;
  };
  browserValidation: string;
  p0Defects: number;
  p1Defects: number;
  p2Defects: number;
  finalVerdict: 'SAVINGS ENGINE CERTIFIED' | 'NOT CERTIFIED';
}
