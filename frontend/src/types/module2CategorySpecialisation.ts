/**
 * Module 2 — Lever 6: Category Specialisation Frontend Data Types & Interfaces
 * Compliant with Rule 8, 9, max 300 lines, line length <= 120 chars
 */

export type CategoryPriority = 'PRIORITY_A' | 'PRIORITY_B' | 'PRIORITY_C';

export type CategoryManagementApproach =
  | 'DEDICATED_CATEGORY_MANAGER'
  | 'SHARED_CATEGORY_MANAGER'
  | 'CENTRALISED_CATEGORY_MGMT'
  | 'STANDARD_AUTOMATED';

export type CategorySpecialisationValidationStatus =
  | 'TENTATIVE — PENDING VALIDATION'
  | 'DATA PARTIALLY AVAILABLE'
  | 'DATA UNAVAILABLE'
  | 'AWAITING VALIDATION'
  | 'OVERLAP REVIEW REQUIRED'
  | 'OPPORTUNITY IDENTIFIED — NOT YET QUANTIFIABLE'
  | 'APPROVED'
  | 'REALISED';

export type OpportunityHeadKey =
  | 'HEAD-A'
  | 'HEAD-B'
  | 'HEAD-C'
  | 'HEAD-D'
  | 'HEAD-E'
  | 'HEAD-F'
  | 'HEAD-G'
  | 'HEAD-H'
  | 'HEAD-I'
  | 'HEAD-J';

export interface OpportunityHeadAssumption {
  key: OpportunityHeadKey;
  code: string;
  title: string;
  lowPct: number;
  basePct: number;
  highPct: number;
  description: string;
  relatedLever?: string;
  appliesToOperatingCost?: boolean;
}

export interface CategoryOpportunityBenefit {
  headKey: OpportunityHeadKey;
  headCode: string;
  headTitle: string;
  categoryName: string;
  eligibleAnnualSpendInr: number;
  eligibleAnnualSpendCr: number;
  isEligibleEstablished: boolean;
  lowAssumptionPct: number;
  baseAssumptionPct: number;
  highAssumptionPct: number;
  lowEstimateInr: number;
  lowEstimateCr: number;
  baseEstimateInr: number;
  baseEstimateCr: number;
  highEstimateInr: number;
  highEstimateCr: number;
  calculationRationale: string;
  dataAndEvidenceStatus: string;
  validationRequirements: string;
  disclaimer: string;
  commercialMechanism: string;
  eligibilityRule: string;
  opportunityStatus: string;
  hasDistinctScopeFromLever2?: boolean;
  distinctScopeEvidence?: string;
  hasVerifiedAlternativeSupplier?: boolean;
  alternativeSupplierEvidence?: string;
  concentrationRiskMetrics?: {
    topSupplierSharePct: number;
    herfindahlIndex: number;
    distinctSuppliersCount: number;
  };
  relatedLever?: string;
  appliesToOperatingCost?: boolean;
}

export interface CategorySpecialisationProfile {
  categoryName: string;
  priority: CategoryPriority;
  priorityRationale: string;
  recommendedApproach: CategoryManagementApproach;
  approachRationale: string;
  annualSpendInr: number;
  annualSpendCr: number;
  spendSharePct: number;
  transactionCount: number;
  distinctSuppliersCount: number;
  distinctMaterialsCount: number;
  distinctPlantsCount: number;
  topSupplierConcentrationPct: number;
  herfindahlIndex: number;
  priceVariationCoefficient: number;
  contractCoveragePct: number;
  dataLimitations: string;
  validationStatus: string;
  requiresSpecialisedManagement: boolean;
  opportunities: CategoryOpportunityBenefit[];
}

export interface CrossLeverOverlapItem {
  headKey: OpportunityHeadKey;
  headTitle: string;
  categoryName: string;
  eligibleSpendInr: number;
  eligibleSpendCr: number;
  grossPotentialBenefitInr: number;
  grossPotentialBenefitCr: number;
  relatedLever?: string;
  overlapStatus: 'NO_OVERLAP' | 'OVERLAP_DEDUPLICATED' | 'OVERLAP_REVIEW_REQUIRED';
  deduplicationTreatment: string;
  evidenceAndApprovalStatus: string;
  netIndicativeBenefitInr: number;
  netIndicativeBenefitCr: number;
  amountExcludedInr: number;
  amountExcludedCr: number;
  exclusionReason: string;
}

export interface CategorySpecialisationSummary {
  tenantId: string;
  totalProcurementSpendInr: number;
  totalProcurementSpendCr: number;
  categoriesAssessedCount: number;
  priorityACount: number;
  priorityBCount: number;
  priorityCCount: number;
  grossTentativeOpportunityLowInr: number;
  grossTentativeOpportunityLowCr: number;
  grossTentativeOpportunityBaseInr: number;
  grossTentativeOpportunityBaseCr: number;
  grossTentativeOpportunityHighInr: number;
  grossTentativeOpportunityHighCr: number;
  netIndicativeOpportunityLowInr: number;
  netIndicativeOpportunityLowCr: number;
  netIndicativeOpportunityBaseInr: number;
  netIndicativeOpportunityBaseCr: number;
  netIndicativeOpportunityHighInr: number;
  netIndicativeOpportunityHighCr: number;
  opportunitiesRequiringOverlapReviewCount: number;
  overlapReviewAmountInr: number;
  overlapReviewAmountCr: number;
  unquantifiedOpportunitiesCount: number;
  categoriesRequiringSpecialisedInterventionCount: number;
  dedicatedManagerCount: number;
  sharedManagerCount: number;
  centralisedManagementCount: number;
  automatedProcurementCount: number;
}

export interface CategorySpecialisationResult {
  assessmentId: string;
  customerName: string;
  calculatedAt: string;
  summary: CategorySpecialisationSummary;
  categories: CategorySpecialisationProfile[];
  overlapItems: CrossLeverOverlapItem[];
  opportunityHeadAssumptions: OpportunityHeadAssumption[];
  methodologyDisclosures: string[];
  generalDisclaimer: string;
}

export interface Lever6ThresholdConfig {
  STRATEGIC_SPEND_SHARE_PCT?: number;
  OPTIMISATION_SPEND_SHARE_PCT?: number;
  COMPLEX_SUPPLIER_COUNT?: number;
  MODERATE_SUPPLIER_COUNT?: number;
  COMPLEX_MATERIAL_COUNT?: number;
  PRICE_VARIATION_SIGNIFICANT?: number;
  HIGH_HERFINDAHL_INDEX?: number;
  HIGH_TOP_SUPPLIER_SHARE_PCT?: number;
}

export interface CategorySpecialisationCalculationOptions {
  customThresholds?: Lever6ThresholdConfig;
  includeLever2Overlap?: boolean;
  verifiedAlternativeSuppliers?: Record<string, { hasVerifiedAlternativeSupplier: boolean; evidence: string }>;
  distinctScopeFromLever2Categories?: Record<string, { hasDistinctScope: boolean; evidence: string }>;
}
