/**
 * Module 1 & Module 2 Certification Types & Interfaces
 */

export type Module1CoreCategory =
  | 'Direct Materials'
  | 'MRO'
  | 'Packing Materials'
  | 'Indirect Materials'
  | 'Service'
  | 'Other / Unmapped';

export type MaterialDisposition = 'MAPPED' | 'SERVICE' | 'UNMAPPED — REVIEW REQUIRED';

export type MappingLevel = 'COMMODITY' | 'CLASS' | 'FAMILY' | 'SEGMENT' | 'UNMAPPED';

export type MappingMethod = 'EXACT_COMMODITY' | 'CLASS_FALLBACK' | 'AI_SEMANTIC' | 'KEYWORD_RULE' | 'HUMAN_OVERRIDE';

export type StrategicOpportunityType =
  | 'Vendor Consolidation'
  | 'PO Consolidation'
  | 'Competitive Bidding'
  | 'E-Auction Candidate'
  | 'Specification Rationalization'
  | 'Strategic Sourcing';

export interface SourceLineage {
  sourceFile: string;
  worksheet: string;
  originalRowNumber: number;
  transactionId: string;
}

export interface NormalizedSpendRecord {
  transactionId: string;
  sourceFile: string;
  worksheet: string;
  originalRowNumber: number;
  poNumber: string;
  invoiceNumber: string;
  transactionDate: string;
  year: number;
  month: string;
  plant: string;
  materialGroup: string;

  // Vendor attributes
  originalVendor: string;
  normalizedVendor: string;
  vendorMasterId: string;
  duplicateVendorFlag: boolean;

  // Material attributes
  originalShortText: string;
  normalizedDescription: string;
  materialMasterId: string;

  // Financial & Spend attributes
  quantity: number | null;
  unitOfMeasure: string;
  unitPrice: number | null;
  originalSpend: number;
  originalCurrency: string;
  fxRate: number;
  fxSource: string;
  fxDate: string;
  normalizedSpendInr: number;

  // Duplicate checks
  exactDuplicateFlag: boolean;
  potentialDuplicateFlag: boolean;
  duplicateGroupKey: string;

  // Module 1 Classification
  coreCategory: Module1CoreCategory;
  isExcluded: boolean;
  exclusionReason?: string;

  // Module 2 UNSPSC & Taxonomy
  disposition: MaterialDisposition;
  unspscCode: string;
  unspscSegment: string;
  unspscFamily: string;
  unspscClass: string;
  unspscCommodity: string;
  mappingLevel: MappingLevel;
  mappingConfidence: number;
  mappingMethod: MappingMethod;

  // AI vs Human Override
  aiClassification: string;
  aiUnspsc: string;
  aiConfidence: number;
  finalClassification: string;
  finalUnspsc: string;
  overrideFlag: boolean;
  overrideReason?: string;
  reviewedBy?: string;
  reviewDate?: string;

  // PCBI Category Mapping (Validation Only)
  pcbiCategory: string;
  pcbiSubcategory: string;

  // Item Decomposition
  constituentItem?: string;
  constituentCostDriver?: string;
  constituentWeightPct?: number;
  benchmarkableConstituent?: string;
  decompositionStatus: string;
}

export interface GoldenTestCase {
  id: number;
  name: string;
  input: Record<string, unknown>;
  expectedResult: Record<string, unknown>;
  actualResult: Record<string, unknown>;
  passed: boolean;
  notes?: string;
}

export interface Module1DashboardMetrics {
  totalTransactions: number;
  totalSpendInr: number;
  uniqueVendorsCount: number;
  uniqueItemsCount: number;
  plantsCount: number;
  materialGroupsCount: number;
  spendByYear: Record<number, number>;
  spendByMonth: Record<string, number>;
  spendByPlant: Record<string, number>;
  spendByMaterialGroup: Record<string, number>;
  spendByCategory: Record<Module1CoreCategory, { count: number; spendInr: number; spendPct: number }>;
  topVendorsPareto: Array<{ vendor: string; spendInr: number; cumulativeSpendInr: number; cumulativePct: number }>;
  topItemsPareto: Array<{ item: string; spendInr: number; cumulativeSpendInr: number; cumulativePct: number }>;
  topCategoriesPareto: Array<{ category: string; spendInr: number; cumulativeSpendInr: number; cumulativePct: number }>;
}

export interface Module1ReconciliationMetrics {
  rawInputSpendInr: number;
  processedSpendInr: number;
  categorizedSpendInr: number;
  serviceSpendInr: number;
  unmappedSpendInr: number;
  excludedSpendInr: number;
  spendVarianceInr: number;
  isFullyReconciled: boolean;
  explanation: string;
}

export interface StrategicSourcingOpportunity {
  opportunityType: StrategicOpportunityType;
  category: string;
  spendInr: number;
  supportingEvidence: string;
  numberOfVendors: number;
  transactionFrequency: number;
  potentialReason: string;
}

export interface Module2ReconciliationMetrics {
  totalMaterialSpendInr: number;
  mappedSpendInr: number;
  serviceSpendInr: number;
  unmappedReviewSpendInr: number;
  unspscCoveragePct: number;
  pcbiCategoryMappingPct: number;
  mappedSpendPct: number;
  unmappedSpendPct: number;
  isFullyReconciled: boolean;
  explanation: string;
}

export interface CertificationGate {
  gateName: string;
  passed: boolean;
  notes: string;
}

export interface FullCertificationReport {
  timestamp: string;
  goldenTestResults: GoldenTestCase[];
  allGoldenTestsPassed: boolean;
  module1Dashboard: Module1DashboardMetrics;
  module1Reconciliation: Module1ReconciliationMetrics;
  module2Reconciliation: Module2ReconciliationMetrics;
  strategicOpportunities: StrategicSourcingOpportunity[];
  module1Gates: CertificationGate[];
  module2Gates: CertificationGate[];
  module1Certified: boolean;
  module2Certified: boolean;
  overallGoDecision: boolean;
  auditTrail: {
    noSourceRowsDeleted: boolean;
    noSourceValuesModified: boolean;
    noDuplicatesSilentlyDeleted: boolean;
    noCurrencySilentlyConverted: boolean;
    noUnspscInvented: boolean;
    noConstituentPercentageInvented: boolean;
    noServiceBenchmarked: boolean;
    noUnmappedItemHidden: boolean;
  };
}
