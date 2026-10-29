/**
 * Module 2 — Lever 3: Vendor Base Consolidation Data Types (Frontend)
 * Strict separation of interfaces per Rule 9
 */

import type { StrategicInputTransaction } from './strategicSourcing';
import type {
  ActionableOpportunityStatus,
  MappingReviewStatus,
  ClassificationCoverageSummary,
  MaterialMappingEntry
} from './module2MaterialMapping';

export type ConsolidationOpportunityStatus =
  | 'Opportunity Identified'
  | 'Potential Opportunity — Further Validation Required'
  | 'Insufficient Data'
  | 'No Clear Opportunity Identified';

export type SpendFragmentationLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface SupplierSpendProfile {
  vendorCode: string;
  vendorName: string;
  spendInr: number;
  spendCr: number;
  spendSharePct: number;
  distinctMaterialsCount: number;
  materialsSupplied: string[];
  distinctPlantsCount: number;
  plantsServed: string[];
  poCount: number;
  isTailSupplier: boolean;
}

export interface SupplierMaterialParticipation {
  vendorCode: string;
  vendorName: string;
  quantity: number;
  spendInr: number;
  spendCr: number;
  weightedAvgPrice: number;
  poCount: number;
  plants: string[];
}

export interface SameMaterialOpportunity {
  materialCode: string;
  materialDesc: string;
  spendCategory: string;
  unspscCode: string;
  unspscCategory: string;
  uom: string;
  currency: string;
  totalSpendInr: number;
  totalSpendCr: number;
  totalQuantity: number;
  supplierCount: number;
  plantCount: number;
  suppliers: SupplierMaterialParticipation[];
  lowestUnitPrice: number;
  highestUnitPrice: number;
  weightedAvgPrice: number;
  priceDispersionPct: number;
  isComparableUomAndCurrency: boolean;
  status: ConsolidationOpportunityStatus;
  opportunityReason: string;
  actionableStatus?: ActionableOpportunityStatus;
  qualificationCriteria?: string;
  nextRecommendedAction?: string;
  classificationReviewStatus?: MappingReviewStatus;
  addressableSpendInr: number;
  addressableSpendCr: number;
  transactions?: StrategicInputTransaction[];
}

export interface ComparableMaterialItem {
  materialCode: string;
  materialDesc: string;
  spendInr: number;
  spendCr: number;
  vendorCount: number;
  vendors: string[];
}

export interface ComparableMaterialOpportunity {
  groupId: string;
  categoryCode: string;
  categoryName: string;
  materials: ComparableMaterialItem[];
  relationshipLabel: 'Potential Comparable — Validation Required';
  similarityBasis: string;
  status: ConsolidationOpportunityStatus;
  opportunityReason: string;
  addressableSpendInr: number;
  addressableSpendCr: number;
}

export interface CrossPlantOpportunity {
  code: string;
  description: string;
  level: 'MATERIAL' | 'CATEGORY';
  spendCategory: string;
  distinctPlantsCount: number;
  plants: string[];
  distinctSuppliersCount: number;
  suppliers: string[];
  totalSpendInr: number;
  totalSpendCr: number;
  status: ConsolidationOpportunityStatus;
  coordinationPotential: string;
  governanceDisclosure: string;
}

export type CategoryClassificationType =
  | 'VERIFIED_UNSPSC'
  | 'PROVISIONAL_UNSPSC'
  | 'SOURCE_SPEND_CATEGORY'
  | 'UNMAPPED';

export interface CategoryConsolidationProfile {
  unspscCode: string;
  unspscCategory: string;
  spendCategory: string;
  sourceCategories?: string[];
  classificationType: CategoryClassificationType;
  classificationLabel: string;
  totalSpendInr: number;
  totalSpendCr: number;
  sameMaterialMultiSourcingSpendInr: number;
  sameMaterialMultiSourcingSpendCr: number;
  addressableSpendInr: number;
  addressableSpendCr: number;
  categoryConsolidationCandidateSpendInr: number | null;
  categoryConsolidationCandidateSpendCr: number | null;
  categoryConsolidationCandidateStatus: 'IDENTIFIED' | 'POTENTIAL' | 'NOT_APPLICABLE';
  categoryConsolidationCandidateReason: string;
  distinctSuppliersCount: number;
  distinctMaterialsCount: number;
  distinctPlantsCount: number;
  plantsServed: string[];
  suppliers: SupplierSpendProfile[];
  top1SharePct: number;
  top3SharePct: number;
  hhiIndex: number;
  fragmentationLevel: SpendFragmentationLevel;
  multiSourcedMaterialsCount: number;
  sameMaterialOpportunitiesCount: number;
  comparableMaterialOpportunitiesCount: number;
  crossPlantOpportunitiesCount: number;
  categoryOpportunityStatus: ConsolidationOpportunityStatus;
  categoryOpportunityReason: string;
  estimatedSavingsInr: number | null;
  estimatedSavingsCr: number | null;
  actualSavingsCr: number;
  validatedSavingsCr: number;
  savingsStatus: 'NOT_YET_QUANTIFIABLE';
  dataQualityWarnings: string[];
}

export interface DataQualityExclusionSummary {
  rule: string;
  affectedCount: number;
  affectedSpendInr: number;
  actionTaken: string;
}

export interface VendorConsolidationResult {
  assessmentId: string;
  customerName?: string;
  reportDate: string;
  leverId: number;
  leverCode: string;
  leverName: string;
  totalAssessmentSpendInr: number;
  totalAssessmentSpendCr: number;
  sameMaterialMultiSourcingSpendInr: number;
  sameMaterialMultiSourcingSpendCr: number;
  addressableSpendInr: number;
  addressableSpendCr: number;
  categoryConsolidationOpportunitiesCount: number;
  categoryConsolidationCandidateSpendCr: number | null;
  categoryConsolidationCandidateSpendStatus: 'NOT_YET_QUANTIFIABLE';
  categoryConsolidationDisclosure: string;
  estimatedSavingsInr: number | null;
  estimatedSavingsCr: number | null;
  actualSavingsCr: number;
  validatedSavingsCr: number;
  savingsStatus: 'NOT_YET_QUANTIFIABLE';
  savingsDisclosure: string;
  transactionAuditTrailNotice: string;
  categoriesAnalysedCount: number;
  distinctSuppliersCount: number;
  distinctMaterialsCount: number;
  distinctPlantsCount: number;
  multiSourcedMaterialsCount: number;
  categories: CategoryConsolidationProfile[];
  sourceGroupCategories?: CategoryConsolidationProfile[];
  sameMaterialOpportunities: SameMaterialOpportunity[];
  comparableMaterialOpportunities: ComparableMaterialOpportunity[];
  crossPlantOpportunities: CrossPlantOpportunity[];
  coverageSummary?: ClassificationCoverageSummary;
  mappingRegister?: MaterialMappingEntry[];
  mappingExceptions?: MaterialMappingEntry[];
  allTransactionsCount?: number;
  allTransactionsSpendInr?: number;
  transactionsSample?: StrategicInputTransaction[];
  methodologyDisclosures: string[];
  dataQualityExclusions?: DataQualityExclusionSummary[];
}

/* Component prop and UI state types (moved out of the .tsx files per AGENTS.md section 9) */

export interface VendorConsolidationKpiCardsProps {
  result: VendorConsolidationResult;
}

export interface VendorConsolidationCategoryTableProps {
  categories: CategoryConsolidationProfile[];
  onSelectCategory: (category: CategoryConsolidationProfile) => void;
}

export interface VendorConsolidationSupplierTableProps {
  category: CategoryConsolidationProfile;
  onBackToCategories: () => void;
  onSelectSupplierMaterials: (supplier?: SupplierSpendProfile) => void;
}

export interface VendorConsolidationMaterialTableProps {
  categoryName: string;
  sameMaterialOpportunities: SameMaterialOpportunity[];
  comparableOpportunities: ComparableMaterialOpportunity[];
  crossPlantOpportunities: CrossPlantOpportunity[];
  onBackToSuppliers: () => void;
  onSelectMaterialTransactions: (opportunity: SameMaterialOpportunity) => void;
}

export interface VendorConsolidationTransactionTableProps {
  opportunity: SameMaterialOpportunity;
  onBackToMaterials: () => void;
}

export interface VendorConsolidationMappingQueueTableProps {
  exceptions: MaterialMappingEntry[];
  onMappingUpdated?: () => void;
}

export interface VendorConsolidationViewProps {
  assessmentId: string;
  onBackToOverview?: () => void;
}

export type VendorConsolidationDimensionType = 'UNSPSC' | 'SOURCE_GROUP' | 'MATERIALS' | 'MAPPING_QUEUE';

export type VendorConsolidationDrillDownLevel = 'CATEGORIES' | 'SUPPLIERS' | 'MATERIALS' | 'TRANSACTIONS';

export type VendorConsolidationSubTab = 'sameMaterial' | 'comparable' | 'crossPlant';
