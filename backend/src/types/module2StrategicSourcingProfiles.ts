/**
 * Module 2 — Strategic Sourcing Intelligence Category Profiles & Dashboard Types
 * Version: MODULE_2_SOURCING_LOGIC_V1.0
 */

import type {
  ConsolidationSuitability,
  EAuctionSuitability,
  ExcludedTransactionRecord,
  OpportunityScenarioRange,
  OpportunityWaterfallStage,
  PriceDispersionMetrics,
  CrediblePriceReferenceResult,
  OperationalConsolidationIndicators,
  SourcingDataConfidence,
  SourcingLeverRecommendation,
  SourcingOpportunityStatus,
  StrategicSourcingLeverKey,
  StrategicSourcingScorecard,
  SupplierFragmentationLevel
} from './module2StrategicSourcing';
import type {
  CategoryFiscalYearSpendDenominator,
  ItemLevelSourcingAnalysis,
  MultiCategoryVendorAnalysisItem,
  PrimarySourcingLever
} from './module2ItemAnalysis';
import type {
  ActionRecommendationOutput,
  CategoryCommercialExcellenceProfile,
  MarketDiscoveryAssessment,
  OpportunityEvidenceState,
  OpportunityWaterfallV2Stage,
  ProcurementMaturityScorecardResult,
  TwoDimensionalOpportunityAssessment
} from './module2OpportunityIntelligence';
import type {
  OpportunityEvidenceChain,
  OpportunityExclusionLedgerEntry,
  EvidenceStatisticPopulation,
  SupplierPairPriceComparisonProof,
  CompleteCalculationTrace,
  CategorySpecialistAlignment,
  TransactionEvidenceRecord
} from './module2EvidenceChain';

export interface CategorySupplierStructureItem {
  supplierId: string;
  supplierName: string;
  totalSpendInr: number;
  totalSpendInrCr: number;
  spendSharePct: number;
  transactionCount: number;
  transactionSharePct: number;
  totalQuantity: number;
  weightedAveragePrice: number;
  minPrice: number;
  maxPrice: number;
  rank: number;
  isTopSupplier: boolean;
  isTailSupplier: boolean;
  pricePositionVsComparable: 'BELOW_AVERAGE' | 'AT_AVERAGE' | 'ABOVE_AVERAGE' | 'NON_COMPARABLE';
  potentialConsolidationRelevance: string;
}

export interface CategoryStrategicSourcingProfile {
  // A. Category Overview
  categoryId: string;
  categoryName: string;
  module2Classification: string;
  unspscCode: string;
  unspscFamily: string;
  totalSpendInr: number;
  totalSpendInrCr: number;
  transactionCount: number;
  activeSuppliersCount: number;
  activeMonthsCount: number;
  averageMonthlySpendInr: number;
  averageTransactionValueInr: number;
  spendTrend: 'GROWING' | 'STABLE' | 'DECLINING';
  isRecurringSpend: boolean;
  recurringRationale: string;
  categoryMateriality: 'HIGH' | 'MEDIUM' | 'LOW';

  // B. Purchase Behaviour
  monthlySpendBreakdown: Array<{
    month: string;
    spendInr: number;
    quantity: number;
    transactionCount: number;
    weightedPrice: number;
  }>;
  orderSizeDistribution: {
    smallOrdersCount: number;
    mediumOrdersCount: number;
    largeOrdersCount: number;
    orderCountRatio: number;
  };

  // C. Supplier Structure & Concentration
  suppliers: CategorySupplierStructureItem[];
  topSupplierSharePct: number;
  top3SupplierSharePct: number;
  top5SupplierSharePct: number;
  longTailSupplierSharePct: number;
  hhiScore: number;
  hhiInterpretation: string;

  // D. Supplier Fragmentation
  fragmentationLevel: SupplierFragmentationLevel;
  fragmentationRationale: string;

  // E. Comparability & Price Normalization
  comparableTransactionCount: number;
  excludedTransactionCount: number;
  comparableSpendInr: number;
  comparableQuantity: number;
  addressableSpendInr: number;
  addressableSpendInrCr: number;
  addressableQuantity: number;
  priceDispersion: PriceDispersionMetrics | null;
  credibleReference: CrediblePriceReferenceResult;
  exclusions: ExcludedTransactionRecord[];

  // F. Opportunity Levers & Deduplication
  status: SourcingOpportunityStatus;
  statusLabel: string;
  dataConfidence: SourcingDataConfidence;
  confidenceRationale: string;

  // E-Auction Levers
  eauctionSuitability: EAuctionSuitability;
  eauctionSuitabilityRationale: string;
  potentialEAuctionOpportunityInr: number | null;
  potentialEAuctionOpportunityInrCr: number | null;
  potentialEAuctionOpportunityPct: number | null;

  // Vendor Consolidation Levers
  consolidationSuitability: ConsolidationSuitability;
  consolidationSuitabilityRationale: string;
  potentialVendorConsolidationOpportunityInr: number | null;
  potentialVendorConsolidationOpportunityInrCr: number | null;
  potentialVendorConsolidationOpportunityPct: number | null;
  operationalConsolidation: OperationalConsolidationIndicators;
  proposedTargetSupplierRange?: string;
  consolidationFeasibility?: 'HIGH' | 'MEDIUM' | 'LOW' | 'NOT_QUANTIFIABLE';

  // Overlap & Net Quantifiable Opportunity
  overlappingOpportunityInr: number;
  overlappingOpportunityInrCr: number;
  netQuantifiableOpportunityInr: number | null;
  netQuantifiableOpportunityInrCr: number | null;
  netQuantifiableOpportunityPct: number | null;
  isQuantifiable: boolean;
  quantifiableDisplayText: string;

  // V2 Opportunity Fields
  primarySourcingLever?: PrimarySourcingLever;
  primarySourcingLeverRationale?: string;
  volumeBundlingOpportunityInr?: number;
  volumeBundlingOpportunityInrCr?: number;
  categorySpecialistOpportunityInr?: number;
  categorySpecialistOpportunityInrCr?: number;
  grossQuantifiableBenefitInr?: number;
  grossQuantifiableBenefitInrCr?: number;
  benefitNotYetQuantifiable?: boolean;
  notQuantifiableReason?: string;
  fiscalYearSpend?: CategoryFiscalYearSpendDenominator;
  items?: ItemLevelSourcingAnalysis[];
  multiCategoryVendors?: MultiCategoryVendorAnalysisItem[];

  // Scenarios & Waterfall
  scenarios: OpportunityScenarioRange;
  waterfall: OpportunityWaterfallStage[];
  waterfallV2?: OpportunityWaterfallV2Stage[];

  // Opportunity Intelligence V2.0
  evidenceState?: OpportunityEvidenceState;
  evidenceStateLabel?: string;
  twoDimensionalAssessments?: TwoDimensionalOpportunityAssessment[];
  marketDiscovery?: MarketDiscoveryAssessment;
  commercialExcellence?: CategoryCommercialExcellenceProfile;
  procurementMaturity?: ProcurementMaturityScorecardResult;
  actionRecommendation?: ActionRecommendationOutput;
  opportunityRangeMinInr?: number | null;
  opportunityRangeMaxInr?: number | null;
  opportunityRangeMethodology?: string;

  // Sourcing Levers & Scorecard
  levers: SourcingLeverRecommendation[];
  scorecard: StrategicSourcingScorecard;

  // Evidence Chain & Traceability (MODULE_2_EVIDENCE_LOGIC_V1.0)
  evidenceChain?: OpportunityEvidenceChain;
  exclusionLedger?: OpportunityExclusionLedgerEntry[];
  evidenceBackedStatistics?: EvidenceStatisticPopulation[];
  pairwisePriceProofs?: SupplierPairPriceComparisonProof[];
  completeCalculationTrace?: CompleteCalculationTrace;
  specialistAlignments?: CategorySpecialistAlignment[];
  transactionEvidenceRecords?: TransactionEvidenceRecord[];

  // Audit & Handoff
  calculationId: string;
  calculationTimestamp: string;
  calculationVersion: string;
  evidenceTransactionIds: string[];
  missingInformation: string[];
  risksAndConstraints: string[];
  nextStrategicAction: string;
}

export interface Module2StrategicSourcingDashboardSummary {
  // Card 1: Total Addressable Spend
  totalAddressableSpendInr: number;
  totalAddressableSpendInrCr: number;

  // Card 2: E-Auction Addressable Spend
  eauctionAddressableSpendInr?: number;
  eauctionAddressableSpendInrCr?: number;

  // Card 3: E-Auction Quantifiable Benefit
  totalPotentialEAuctionOpportunityInr: number;
  totalPotentialEAuctionOpportunityInrCr: number;

  // Card 4: Vendor Consolidation Addressable Spend
  vendorConsolidationAddressableSpendInr?: number;
  vendorConsolidationAddressableSpendInrCr?: number;

  // Card 5: Vendor Consolidation Quantifiable Benefit
  totalPotentialConsolidationOpportunityInr: number;
  totalPotentialConsolidationOpportunityInrCr: number;

  // Card 6: Volume Bundling Addressable Spend & Benefit
  volumeBundlingAddressableSpendInr?: number;
  volumeBundlingAddressableSpendInrCr?: number;
  volumeBundlingQuantifiableBenefitInr?: number;
  volumeBundlingQuantifiableBenefitInrCr?: number;

  // Card 7: Category Specialist Opportunity
  categorySpecialistOpportunityInr?: number;
  categorySpecialistOpportunityInrCr?: number;

  // Card 8: Gross Quantifiable Benefit
  grossQuantifiableBenefitInr?: number;
  grossQuantifiableBenefitInrCr?: number;

  // Card 9: Overlapping Benefit (Removed)
  totalOverlappingOpportunityInr: number;
  totalOverlappingOpportunityInrCr: number;

  // Card 10: Net Defensible Sourcing Opportunity
  netQuantifiableOpportunityInr: number;
  netQuantifiableOpportunityInrCr: number;

  // Card 11: Benefit Not Yet Quantifiable
  benefitNotYetQuantifiableInr?: number;
  benefitNotYetQuantifiableInrCr?: number;

  // Card 12: Overall Data Confidence
  overallDataConfidence: SourcingDataConfidence;

  // Opportunity Intelligence V2.0 Summary Metrics
  provenOpportunityInr?: number;
  provenOpportunityInrCr?: number;
  quantifiableRangeMinInr?: number;
  quantifiableRangeMinInrCr?: number;
  quantifiableRangeMaxInr?: number;
  quantifiableRangeMaxInrCr?: number;
  marketDiscoveryCandidatesCount?: number;
  identifiedNotQuantifiableCount?: number;
  lowEvidencedCount?: number;
  insufficientDataCount?: number;
  overallNetDefensibleOpportunityMinInr?: number;
  overallNetDefensibleOpportunityMinInrCr?: number;
  overallNetDefensibleOpportunityMaxInr?: number;
  overallNetDefensibleOpportunityMaxInrCr?: number;

  // Counts & Denominators
  categoriesReadyForSourcingCount: number;
  eauctionCandidatesCount: number;
  consolidationCandidatesCount: number;
  opportunitiesNotYetQuantifiableCount: number;
  categoriesAnalyzedCount: number;
  totalSpendAnalyzedInr: number;
  totalSpendAnalyzedInrCr: number;
  calculationTimestamp: string;
}

export interface Module2ToModule4HandoffPackage {
  handoffId: string;
  opportunityId: string;
  categoryId: string;
  categoryName: string;
  opportunityType: 'E_AUCTION' | 'VENDOR_CONSOLIDATION' | 'COMBINED_STRATEGIC';
  addressableSpendInr: number;
  addressableQuantity: number;
  baselineWeightedPrice: number;
  referencePrice: number;
  potentialOpportunityInr: number;
  overlapAmountInr: number;
  netOpportunityInr: number;
  supplierCount: number;
  recommendedLever: StrategicSourcingLeverKey;
  confidence: SourcingDataConfidence;
  evidenceTransactionIds: string[];
  calculationVersion: string;
  timestamp: string;
  auditSignature: string;
}
