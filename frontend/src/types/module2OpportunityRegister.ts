/**
 * Module 2 — Stage 2: Material-Level Opportunity Register & Executive Dashboard Types
 * Compliant with Repository Rules: Section 9 (Types Isolation), max 300 lines, 120 chars
 */

export type OpportunityLeverClassification =
  | 'DIRECT_PRICE_IMPROVEMENT'
  | 'SUPPLIER_CONSOLIDATION'
  | 'VOLUME_DEMAND_CONSOLIDATION'
  | 'SPECIFICATION_PROCESS_REVIEW';

export type OpportunityLifecycleStatus =
  | 'IDENTIFIED'
  | 'UNDER_REVIEW'
  | 'VALIDATED'
  | 'NEGOTIATION'
  | 'AWARDED'
  | 'REJECTED';

export type OpportunityConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface MaterialOpportunityItem {
  opportunityId: string;
  opportunityType: OpportunityLeverClassification;
  category: string;
  materialCode: string;
  materialDescription: string;
  uom: string;
  supportingTransactionCount: number;
  supportingTransactionIds: string[];
  historicalSpendInr: number;
  historicalSpendCr: number;
  suppliersInvolved: string[];
  plantsInvolved: string[];
  rationale: string;
  calculationMethodology: string;
  sourceFields: string[];
  dataQualityChecks: string[];
  comparabilityChecks: string[];
  confidenceLevel: OpportunityConfidenceLevel;
  reviewFlags: string[];
  requiredProcurementAction: string;
  responsibleValidationTeam: string;
  status: OpportunityLifecycleStatus;
  defensibleOpportunityValueInr: number | null;
  defensibleOpportunityValueCr: number | null;
  unitPriceVariancePct?: number;
  referenceUnitPriceInr?: number;
  weightedAverageUnitPriceInr?: number;
  lowestCrediblePriceInr?: number;
  classificationReviewStatus?: string;
  overlapGroupId?: string;
}

export interface OpportunityTypeMetrics {
  count: number;
  spendCr: number;
  defensibleValueCr: number;
  materialsCount: number;
}

export interface OpportunityRegisterSummary {
  authoritativeBaselineSpendCr: number;
  authoritativeBaselineTransactions: number;
  directPriceEligibleSpendCr: number;
  directPriceEligibleTransactions: number;
  supplierConsolidationEligibleSpendCr: number;
  volumeConsolidationCandidateSpendCr: number;
  spendRequiringReviewCr: number;
  totalOpportunitiesCount: number;
  byType: Record<OpportunityLeverClassification, OpportunityTypeMetrics>;
  byStatus: Record<OpportunityLifecycleStatus, number>;
  byConfidence: Record<OpportunityConfidenceLevel, number>;
  certifiedSavingsCr: number;
  realizedSavingsCr: number;
  overlapDeductionNotice: string;
  dataLimitations: string[];
  validationRequirements: string[];
}

export interface OpportunityRegisterResult {
  assessmentId: string;
  customerName: string;
  generatedAt: string;
  summary: OpportunityRegisterSummary;
  opportunities: MaterialOpportunityItem[];
  exclusionsSummary: Record<string, number>;
}

export interface OpportunityRegisterQueryOptions {
  assessmentId: string;
  type?: OpportunityLeverClassification;
  status?: OpportunityLifecycleStatus;
  category?: string;
  search?: string;
}
