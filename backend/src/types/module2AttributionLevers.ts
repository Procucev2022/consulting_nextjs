/**
 * Module 2 Ten Strategic Sourcing Levers Evaluation Types
 * Phase 3B: Controlled Implementation
 * Version: MODULE_2_ATTRIBUTION_LEDGER_V1.0
 */

export type StrategicSourcingLeverType =
  | 'DIRECT_PRICE_IMPROVEMENT'
  | 'E_AUCTION'
  | 'VENDOR_CONSOLIDATION'
  | 'VOLUME_AGGREGATION'
  | 'PAYMENT_TERMS_OPTIMISATION'
  | 'CATEGORY_SPECIALISATION'
  | 'LOGISTICS_PACKAGING'
  | 'SPECIFICATION_RATIONALISATION'
  | 'CONTRACT_COMPLIANCE_AUDIT'
  | 'NEW_VENDOR_DEVELOPMENT';

export type LeverEvidenceStatus =
  | 'CANDIDATE_IDENTIFIED'
  | 'OBSERVED_PRICE_VARIANCE'
  | 'OPPORTUNITY_CALCULATED'
  | 'COMMERCIALLY_VALIDATED'
  | 'APPROVED_SAVINGS';

export interface LeverEvaluationModelConfig {
  lever: StrategicSourcingLeverType;
  leverCode: string;
  leverName: string;
  requiredTransactionFields: string[];
  requiredSupplierFields: string[];
  evidenceRequiredForQuantification: string[];
  preconditionsForCommercialValidation: string[];
}

export interface LeverReconciliationSummary {
  lever: string;
  leverName: string;
  candidateTransactionCount: number;
  candidateSpendInr: number;
  candidateSpendCr: number;
  eligibleTransactionCount: number;
  eligibleSpendInr: number;
  eligibleSpendCr: number;
  quantifiedTransactionCount: number;
  quantifiedOpportunityInr: number;
  quantifiedOpportunityCr: number;
  unquantifiedTransactionCount: number;
  unquantifiedSpendInr: number;
  unquantifiedSpendCr: number;
  unquantifiedReasonsBreakdown: Record<string, number>;
  primaryTransactionCount: number;
  primaryAttributedOpportunityInr: number;
  primaryAttributedOpportunityCr: number;
  alternativeScenarioOpportunityInr: number;
  alternativeScenarioOpportunityCr: number;
  overlapDeductionInr: number;
  overlapDeductionCr: number;
  netAttributedOpportunityInr: number;
  netAttributedOpportunityCr: number;
  unresolvedCommercialConditions: string[];
}
