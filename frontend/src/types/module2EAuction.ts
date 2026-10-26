/**
 * Module 2 — Lever 2: E-Auction / Dynamic Bidding Candidate Identification Data Types (Frontend)
 * Strict separation of interfaces per Rule 9
 */

export type AuctionSuitabilityClassification =
  | 'Candidate for Review'
  | 'Further Data Required'
  | 'Not Currently Suitable'
  | 'Not Assessed';

export type SavingsRangeStatus = 'ESTIMATED' | 'NOT_YET_QUANTIFIABLE';
export type AssumptionApprovalStatus =
  | 'Proposed Planning Assumption — Approval Required'
  | 'APPROVED'
  | 'PENDING_APPROVAL'
  | 'UNQUANTIFIABLE';
export type AssumptionConfidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'NOT_ESTABLISHED';

export interface AuctionPlanningAssumption {
  id: string;
  categoryOrMaterial: string;
  minSavingsRate: number;
  expectedSavingsRate: number;
  maxSavingsRate: number;
  rateSource: string;
  referencePeriod: string;
  applicability: string;
  approvalStatus: AssumptionApprovalStatus;
  approvedBy?: string;
  approvedDate?: string;
  confidence: AssumptionConfidence;
  isPlanningAssumptionOnly: boolean;
  notes?: string;
}

export interface EAuctionSavingsRange {
  savingsRangeStatus: SavingsRangeStatus;
  addressableSpendInr: number;
  addressableSpendCr: number;
  minSavingsRate?: number;
  expectedSavingsRate?: number;
  maxSavingsRate?: number;
  minEstimatedSavingsInr?: number;
  minEstimatedSavingsCr?: number;
  expectedEstimatedSavingsInr?: number;
  expectedEstimatedSavingsCr?: number;
  maxEstimatedSavingsInr?: number;
  maxEstimatedSavingsCr?: number;
  rateSource?: string;
  referencePeriod?: string;
  applicability?: string;
  approvalStatus?: AssumptionApprovalStatus;
  approvedBy?: string;
  approvedDate?: string;
  confidence?: AssumptionConfidence;
  isPlanningAssumptionOnly?: boolean;
  notes?: string;
}

export interface EAuctionMaterialCandidate {
  materialCode: string;
  materialDesc: string;
  spendCategory: string;
  unspscCode: string;
  unspscCategory: string;
  financialYear: string;
  totalSpendInr: number;
  totalSpendCr: number;
  addressableSpendInr: number;
  addressableSpendCr: number;
  totalQuantity: number;
  uom: string;
  poCount: number;
  supplierCount: number;
  plantCount: number;
  lowestUnitPrice: number;
  highestUnitPrice: number;
  priceRangeStr: string;
  weightedAveragePrice: number;
  priceDispersionPct: number;
  suitability: AuctionSuitabilityClassification;
  evidenceRationale: string;
  missingInfoLimitations: string;
  procurementReviewRequirements: string[];
  savingsRange: EAuctionSavingsRange;
}

export interface EAuctionCategoryCandidate {
  unspscCode: string;
  unspscCategory: string;
  spendCategory: string;
  totalSpendInr: number;
  totalSpendCr: number;
  addressableSpendInr: number;
  addressableSpendCr: number;
  purchaseQuantity: number;
  uom: string;
  distinctMaterialCount: number;
  poCount: number;
  supplierCount: number;
  plantCount: number;
  priceVariationIndicator: string;
  auctionSuitability: AuctionSuitabilityClassification;
  evidenceBasedRationale: string;
  dataLimitations: string;
  savingsRange: EAuctionSavingsRange;
  materials: EAuctionMaterialCandidate[];
}

export interface EAuctionFySummary {
  financialYear: string;
  totalSpendInr: number;
  totalSpendCr: number;
  addressableSpendInr: number;
  addressableSpendCr: number;
  totalQuantity: number;
  poCount: number;
  candidateMaterialsCount: number;
  candidateCategoriesCount: number;
  minEstimatedSavingsCr: number;
  expectedEstimatedSavingsCr: number;
  maxEstimatedSavingsCr: number;
}

export interface EAuctionResult {
  assessmentId: string;
  customerName: string;
  totalSpendReviewedInr: number;
  totalSpendReviewedCr: number;
  totalAddressableSpendInr: number;
  totalAddressableSpendCr: number;
  categoriesReviewedCount: number;
  candidateCategoriesCount: number;
  candidateMaterialsCount: number;
  recordsRequiringDataReviewCount: number;
  commerciallyValidatedSavingsInr: number;
  commerciallyValidatedSavingsCr: number;
  availableFinancialYears: string[];
  selectedFinancialYear: string;
  certificationNotice: string;
  importantLimitations: string[];
  fySummaries: EAuctionFySummary[];
  summarySavingsRange: EAuctionSavingsRange;
  planningAssumptions: AuctionPlanningAssumption[];
  categories: EAuctionCategoryCandidate[];
}

export interface EAuctionQueryOptions {
  financialYear?: string;
  category?: string;
  suitability?: AuctionSuitabilityClassification;
  materialCode?: string;
  configuredAssumptions?: AuctionPlanningAssumption[];
}

export interface EAuctionDynamicBiddingViewProps {
  assessmentId: string;
  onCustomerChange?: (assessmentId: string) => void;
  onBackToOverview?: () => void;
}
