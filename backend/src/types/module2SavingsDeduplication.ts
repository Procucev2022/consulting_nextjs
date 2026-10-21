/**
 * Module 2 — Cross-Lever Savings Deduplication Control Types
 * Version: MODULE_2_SAVINGS_DEDUPLICATION_V1.0
 * Compliant with Rule 8, 9: Isolated types and interfaces
 */

export type DeduplicationStatus =
  | 'INDEPENDENT'
  | 'MUTUALLY_EXCLUSIVE_ALTERNATIVE_RETAINED'
  | 'DEDUPLICATED_OVERLAP'
  | 'INCREMENTAL_VALIDATED'
  | 'UNRESOLVED_EXCLUDED'
  | 'NOT_APPLICABLE';

export type EvidenceValidationStatus =
  | 'VALIDATED_COMMERCIAL'
  | 'UNVERIFIED_ESTIMATE'
  | 'PLANNING_ASSUMPTION'
  | 'DISCOVERY_ONLY'
  | 'NOT_YET_QUANTIFIABLE';

export type OpportunityApprovalStatus =
  | 'APPROVED'
  | 'PENDING_REVIEW'
  | 'EXCLUDED_FROM_NET';

export interface Module2CanonicalSavingsOpportunity {
  assessmentId: string;
  opportunityId: string;
  leverId: number;
  leverCode: string;
  leverName: string;
  categoryOrMaterialId: string;
  categoryOrMaterialName: string;
  eligibleSpendInr: number;
  eligibleSpendCr: number;
  transactionScopeCount: number;
  calculationBasis: string;
  estimatedGrossSavingsInr: number;
  estimatedGrossSavingsCr: number;
  overlappingOpportunityRefs: string[];
  overlapAmountInr: number;
  overlapAmountCr: number;
  netEstimatedSavingsInr: number;
  netEstimatedSavingsCr: number;
  deduplicationStatus: DeduplicationStatus;
  evidenceValidationStatus: EvidenceValidationStatus;
  approvalStatus: OpportunityApprovalStatus;
  commerciallyValidatedSavingsInr: number;
  commerciallyValidatedSavingsCr: number;
  isIncrementalBenefit: boolean;
  isFinancingBenefitOnly?: boolean;
  workingCapitalReleasedInr?: number;
  workingCapitalReleasedCr?: number;
  unresolvedExclusionReason?: string;
  auditEvidenceSummary: string;
}

export interface Module2LeverSavingsSummaryItem {
  leverId: number;
  leverCode: string;
  leverName: string;
  implementationStatus: string;
  statusLabel: string;
  grossSavingsInr: number;
  grossSavingsCr: number;
  netSavingsInr: number;
  netSavingsCr: number;
  commerciallyValidatedSavingsInr: number;
  commerciallyValidatedSavingsCr: number;
  overlapDeductionsInr: number;
  overlapDeductionsCr: number;
  unresolvedExcludedInr: number;
  unresolvedExcludedCr: number;
  opportunitiesCount: number;
  methodologyBasis: string;
  safeguardRule: string;
  isPurchasePriceSavings: boolean;
  annualFinancingBenefitInr?: number;
  annualFinancingBenefitCr?: number;
  workingCapitalReleasedInr?: number;
  workingCapitalReleasedCr?: number;
}

export interface Module2ConsolidatedSavingsSummary {
  assessmentId: string;
  customerName: string;
  calculatedAt: string;
  grossEstimatedSavingsInr: number;
  grossEstimatedSavingsCr: number;
  netEstimatedSavingsInr: number;
  netEstimatedSavingsCr: number;
  commerciallyValidatedSavingsInr: number;
  commerciallyValidatedSavingsCr: number;
  totalOverlappingDeductionsInr: number;
  totalOverlappingDeductionsCr: number;
  unresolvedOverlapsExcludedInr: number;
  unresolvedOverlapsExcludedCr: number;
  unquantifiedOpportunitiesCount: number;
  quantifiedOpportunitiesCount: number;
  totalEvaluatedOpportunitiesCount: number;
  lever5AnnualFinancingBenefitInr: number;
  lever5AnnualFinancingBenefitCr: number;
  lever5WorkingCapitalReleasedInr: number;
  lever5WorkingCapitalReleasedCr: number;
  reconciliationBalanceInr: number;
  isArithmeticallyBalanced: boolean;
  leverSummaries: Module2LeverSavingsSummaryItem[];
  opportunities: Module2CanonicalSavingsOpportunity[];
  certificationNotice: string;
  disclosures: string[];
}

export interface SavingsDeduplicationOptions {
  allowUnverifiedIncremental?: boolean;
  includePlanningAssumptionsInValidated?: boolean;
  distinctScopeOverrides?: Record<string, boolean>;
  commercialApprovals?: Record<string, boolean>;
}
