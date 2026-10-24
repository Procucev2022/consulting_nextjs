/**
 * Module 2 — Strategic Sourcing Intelligence, E-Auction & Vendor Consolidation Engine Types
 * Version: MODULE_2_SOURCING_LOGIC_V2.0
 */

export type SourcingOpportunityStatus =
  | 'OPPORTUNITY_IDENTIFIED'
  | 'QUANTIFIABLE'
  | 'IDENTIFIED_NOT_QUANTIFIABLE'
  | 'NOT_ELIGIBLE'
  | 'DATA_ENRICHMENT_REQUIRED'
  | 'CONSTRAINED'
  | 'E_AUCTION_CANDIDATE'
  | 'CONSOLIDATION_CANDIDATE'
  | 'E_AUCTION_AND_CONSOLIDATION'
  | 'NOT_QUANTIFIABLE'
  | 'NOT_COMPARABLE'
  | 'INSUFFICIENT_DATA'
  | 'READY_FOR_SOURCING';

export type SourcingDataConfidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT';

export type ComparabilityStatus = 'COMPARABLE' | 'PARTIALLY_COMPARABLE' | 'NOT_COMPARABLE';

export type ExclusionReason =
  | 'SPECIFICATION_MISMATCH'
  | 'GRADE_MISMATCH'
  | 'UNIT_MISMATCH'
  | 'CURRENCY_MISMATCH'
  | 'NON_COMPARABLE_GEOGRAPHY'
  | 'ONE_OFF_ABNORMAL_QUANTITY'
  | 'OBVIOUS_OUTLIER'
  | 'INSUFFICIENT_QUANTITY'
  | 'NON_RECURRING_PURCHASE'
  | 'CONTRACTUALLY_LOCKED'
  | 'INCOMPLETE_DATA'
  | 'INVALID_PRICE'
  | 'MISSING_QUANTITY';

export type ReferencePriceMethod =
  | 'LOWEST_CREDIBLE_PRICE'
  | 'P25_COMPARABLE_PRICE'
  | 'MEDIAN_COMPARABLE_PRICE'
  | 'NO_VALID_REFERENCE';

export type EAuctionSuitability = 'HIGH' | 'MEDIUM' | 'LOW' | 'NOT_SUITABLE' | 'INSUFFICIENT_DATA';

export type ConsolidationSuitability = 'HIGH' | 'MEDIUM' | 'LOW' | 'NOT_SUITABLE' | 'INSUFFICIENT_DATA';

export type SupplierFragmentationLevel =
  | 'LOW_FRAGMENTATION'
  | 'MODERATE_FRAGMENTATION'
  | 'HIGH_FRAGMENTATION'
  | 'EXTREME_FRAGMENTATION';

export type SourcingStrategyRecommendation =
  | 'E_AUCTION_RECOMMENDED'
  | 'COMPETITIVE_RFQ_RECOMMENDED'
  | 'VENDOR_CONSOLIDATION_REVIEW'
  | 'E_AUCTION_PLUS_CONSOLIDATION'
  | 'SPECIFICATION_STANDARDIZATION_REVIEW'
  | 'DATA_DEEP_DIVE_REQUIRED'
  | 'NO_IMMEDIATE_SOURCING_ACTION';

export type StrategicSourcingLeverKey =
  | 'E_AUCTION'
  | 'RFQ_COMPETITION'
  | 'VENDOR_CONSOLIDATION'
  | 'VOLUME_CONSOLIDATION'
  | 'CONTRACT_CONSOLIDATION'
  | 'ORDER_FREQUENCY_OPTIMIZATION'
  | 'MOQ_LOT_SIZE_OPTIMIZATION'
  | 'SPECIFICATION_STANDARDIZATION'
  | 'SUPPLIER_TAIL_REDUCTION'
  | 'PAYMENT_TERM_REVIEW'
  | 'DELIVERY_TERM_REVIEW'
  | 'FREIGHT_LOGISTICS_REVIEW'
  | 'LOCALIZATION_GEOGRAPHIC'
  | 'MAKE_BUY_REVIEW'
  | 'DEMAND_CONSOLIDATION';

export interface ExcludedTransactionRecord {
  transactionId: string;
  poNumber: string;
  supplierName: string;
  materialDesc: string;
  unitPrice: number;
  quantity: number;
  totalSpendInr: number;
  reasons: ExclusionReason[];
  explanation: string;
}

export interface PriceDispersionMetrics {
  totalQuantity: number;
  totalSpendInr: number;
  weightedAveragePrice: number;
  simpleAveragePrice?: number;
  medianPrice: number;
  minPrice: number;
  maxPrice: number;
  p10Price: number;
  p25Price: number;
  p50Price?: number;
  p75Price: number;
  p90Price: number;
  priceDispersionInr?: number;
  priceDispersionPct: number;
  priceSpreadPct?: number;
  iqr?: number;
  volumeAboveP25Pct: number;
  dispersionInterpretation: string;
}

export interface CrediblePriceReferenceResult {
  referencePrice: number | null;
  methodology: ReferencePriceMethod;
  qualifyingTransactionCount: number;
  isCredible: boolean;
  qualificationCriteria: {
    comparableSpec: boolean;
    comparableUom: boolean;
    comparableCurrency: boolean;
    sufficientVolume: boolean;
    nonOutlier: boolean;
    withinHistoricalWindow: boolean;
  };
  explanation: string;
}

export interface SourcingLeverRecommendation {
  lever: StrategicSourcingLeverKey;
  leverLabel: string;
  rationale: string;
  evidence?: string;
  addressableSpendInr?: number;
  addressableSpendInrCr?: number;
  potentialBenefitLabel?: string;
  potentialBenefitInr?: number | null;
  dataConfidence?: SourcingDataConfidence;
  risks?: string[];
  nextAction?: string;
  isApplicable: boolean;
  applicability?: 'HIGH' | 'MEDIUM' | 'LOW' | 'NOT_APPLICABLE';
  applicabilityRationale?: string;
  estimatedEffort?: 'LOW' | 'MEDIUM' | 'HIGH';
  timeToImplementWeeks?: number;
  governancePrerequisites?: string[];
}

export interface SourcingScorecardDimension {
  dimension: string;
  score: number;
  weightPct: number;
  assessment?: 'FAVORABLE' | 'NEUTRAL' | 'UNFAVORABLE' | 'DATA_DEFICIENT';
  rationale: string;
  maxScore?: number;
  weightedScore?: number;
}

export interface StrategicSourcingScorecard {
  overallScore: number;
  compositeScore?: number;
  readinessLevel?: 'SOURCING_READY' | 'CONDITIONAL_READINESS' | 'NEEDS_DATA_ENRICHMENT';
  recommendation: SourcingStrategyRecommendation;
  recommendationLabel: string;
  dimensions: SourcingScorecardDimension[];
  justificationNotes: string[];
}

export interface OpportunityScenarioRange {
  isAvailable: boolean;
  conservativeOpportunityInr: number | null;
  conservativeOpportunityInrCr: number | null;
  conservativeReferencePrice: number | null;
  conservativeMethodology: string;

  baseOpportunityInr: number | null;
  baseOpportunityInrCr: number | null;
  baseReferencePrice: number | null;
  baseMethodology: string;

  stretchOpportunityInr: number | null;
  stretchOpportunityInrCr: number | null;
  stretchReferencePrice: number | null;
  stretchMethodology: string;

  explanation: string;
}

export interface OperationalConsolidationIndicators {
  suppliersPotentiallyAffected: number;
  poCountAffected: number;
  transactionsAffected: number;
  activeMonthsAffected: number;
  smallOrderCount: number;
  estimatedTouchpointReductionCount: number;
  explanation: string;
}

export interface OpportunityWaterfallStage {
  stage:
    | 'TOTAL_HISTORICAL_SPEND'
    | 'TOTAL_CATEGORY_SPEND'
    | 'ADDRESSABLE_SPEND'
    | 'COMPARABLE_SPEND'
    | 'CONTRACTUALLY_ADDRESSABLE_SPEND'
    | 'NON_ADDRESSABLE_SPEND'
    | 'PRICE_DISPERSION_OPPORTUNITY'
    | 'VOLUME_AGGREGATION_OPPORTUNITY'
    | 'E_AUCTION_OPPORTUNITY'
    | 'VENDOR_CONSOLIDATION_OPPORTUNITY'
    | 'CATEGORY_SPECIALIST_REALIGNMENT'
    | 'OVERLAP_REMOVAL'
    | 'OVERLAP_REMOVED'
    | 'CONSTRAINTS_ADJUSTMENT'
    | 'NET_QUANTIFIABLE_OPPORTUNITY';
  label: string;
  amountInr: number;
  amountInrCr: number;
  percentageOfTotal: number;
  calculationBasis: string;
}

export type {
  PrimarySourcingLever,
  ItemSupplierPosition,
  ItemLevelSourcingAnalysis,
  MultiCategoryVendorCategoryItem,
  MultiCategoryVendorAnalysisItem,
  CategoryFiscalYearSpendDenominator
} from './module2ItemAnalysis';

export type {
  CategorySupplierStructureItem,
  CategoryStrategicSourcingProfile,
  Module2StrategicSourcingDashboardSummary,
  Module2ToModule4HandoffPackage
} from './module2StrategicSourcingProfiles';

export type {
  OpportunityEvidenceState,
  OpportunityPotentialValue,
  TwoDimensionalOpportunityAssessment,
  CommercialDimensionKey,
  CommercialDimensionStatus,
  CommercialDimensionAssessment,
  CategoryCommercialExcellenceProfile,
  MarketDiscoveryTrigger,
  MarketDiscoveryAssessment,
  ProcurementMaturityDimensionKey,
  ProcurementMaturityLevel,
  ProcurementMaturityDimensionAssessment,
  ProcurementMaturityScorecardResult,
  SourcingNextAction,
  ActionRecommendationOutput,
  OverlapReconciliationRecord,
  OpportunityWaterfallV2Stage
} from './module2OpportunityIntelligence';

export * from './module2EvidenceChain';

