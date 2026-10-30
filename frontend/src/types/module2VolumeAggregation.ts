/**
 * Module 2 — Lever 4: Volume Aggregation Frontend Types
 * Compliant with Rule 8, 9, max 300 lines, line length <= 120 chars
 */

export type VolumeAggregationOpportunityTier = 'TIER_1_IDENTICAL' | 'TIER_2_COMPARABLE' | 'TIER_3_CATEGORY';

export type VolumeAggregationDemandClassification =
  | 'RECURRING'
  | 'PERIODIC_SEASONAL'
  | 'ONE_TIME_PROJECT'
  | 'INSUFFICIENT_HISTORY';

export type VolumeAggregationOpportunityStatus =
  | 'Candidate Identified'
  | 'Further Data Required'
  | 'Technical Validation Required'
  | 'Commercial Evaluation Required'
  | 'Ready for Sourcing Review'
  | 'Approved for Execution'
  | 'Completed — Benefit Pending Validation'
  | 'Savings Validated'
  | 'Not Suitable';

export interface VerifiedDensityConversionRecord {
  applied: boolean;
  densityFactor: number;
  sourceUom: string;
  targetUom: string;
  standardSource: string;
  effectiveDate: string;
  formula: string;
  applicableGrade?: string;
  supportingEvidenceAvailable?: boolean;
  assumptionsAndLimitations?: string;
  validationStatus?: string;
}

export interface ApprovedAuthoritativeUomMapping {
  uom: string;
  dimension: string;
  targetBaseUom: string;
  toBaseFactor: number;
  approvedSource: string;
  provenanceDocument: string;
  approvalDate: string;
  validationStatus: 'APPROVED' | 'PENDING_VALIDATION' | 'UNVERIFIED';
}

export interface UomConversionAuditRecord {
  originalUom: string;
  convertedUom: string;
  conversionFactor: number;
  conversionSource: string;
  conversionFormula: string;
  dimension: string;
  isCompatible: boolean;
  exclusionReason?: string;
  suggestedInterpretation?: string;
  validationStatus?: string;
  provenanceDocument?: string;
}

export type VolumeAggregationEligibilityType =
  | 'MULTI_FACILITY_POOLING'
  | 'MULTI_VENDOR_ALLOCATION'
  | 'TEMPORAL_LOT_CONSOLIDATION'
  | 'LIMITED_HISTORY_NO_HISTORICAL_PATTERN'
  | 'SINGLE_PURCHASE_NON_AGGREGATABLE'
  | 'INCOMPATIBLE_UOM';

export interface DemandRecurrenceResult {
  classification: VolumeAggregationDemandClassification;
  evidence: string;
  sourceTransactionDates: string[];
}

export interface VolumeAggregationOpportunity {
  opportunityId: string;
  tier: VolumeAggregationOpportunityTier;
  tierLabel: string;
  materialCode: string;
  materialDesc: string;
  category: string;
  unspscCode: string;
  baseUom: string;
  totalHistoricalSpendInr: number;
  totalHistoricalSpendCr: number;
  potentiallyAggregatableSpendInr: number;
  potentiallyAggregatableSpendCr: number;
  aggregatableQuantity: number;
  excludedQuantity: number;
  unmatchedAdjustmentsInr: number;
  transactionCount: number;
  plantCount: number;
  plants: string[];
  supplierCount: number;
  primarySupplier: string;
  suppliers: string[];
  demandClassification: VolumeAggregationDemandClassification;
  demandClassificationLabel: string;
  demandClassificationEvidence?: string;
  sourceTransactionDates?: string[];
  opportunityStatus: VolumeAggregationOpportunityStatus;
  statusReason: string;
  nextRecommendedAction: string;
  technicalValidationRequired: boolean;
  densityConversion?: VerifiedDensityConversionRecord;
  conversionAuditTrail?: UomConversionAuditRecord[];
  wavgUnitPriceInr: number;
  eligibilityType: VolumeAggregationEligibilityType;
  isGenuineOpportunity: boolean;
}

export interface PlantVolumeBreakdown {
  plantCode: string;
  plantName: string;
  region: string;
  state: string;
  hubDistanceKm: number;
  totalSpendInr: number;
  totalSpendCr: number;
  transactionCount: number;
  distinctMaterialsCount: number;
  supplierCount: number;
  volumeSharePct: number;
}

export interface MaterialVolumeProfile {
  materialId: string;
  materialCode: string;
  materialDesc: string;
  category: string;
  unspscCode: string;
  baseUom: string;
  totalQuantity: number;
  totalSpendInr: number;
  totalSpendCr: number;
  wavgPriceInr: number;
  demandClassification: VolumeAggregationDemandClassification;
  demandClassificationEvidence?: string;
  sourceTransactionDates?: string[];
  orderCount: number;
  plantCount: number;
  supplierCount: number;
  plantVolumeDispersionIndex: number;
  hasIncompatibleUom: boolean;
  excludedQuantity: number;
}

export interface UnmatchedAdjustmentItem {
  transactionId: string;
  poNumber: string;
  poLine: string;
  poDate: string;
  vendorName: string;
  materialDesc: string;
  quantity: number;
  uom: string;
  spendInr: number;
  reason: string;
}

export interface VolumeAggregationCoverageSummary {
  assessmentId: string;
  totalTransactionsCount: number;
  totalMaterialRecordsCount: number;
  genuineTier1OpportunitiesCount: number;
  singleIsolatedPurchaseCount: number;
  singleIsolatedPurchaseSpendCr: number;
  limitedHistoryCount?: number;
  uomIncompatibleCount: number;
  uomIncompatibleSpendCr: number;
  excludedUnresolvedUomCount?: number;
  genuineOpportunitiesCount?: number;
  grossMaterialSpendInr?: number;
  grossMaterialSpendCr?: number;
  netIncurredSpendInr?: number;
  netIncurredSpendCr?: number;
  uomCompatibleSpendInr?: number;
  uomCompatibleSpendCr?: number;
  genuineOpportunitySpendInr?: number;
  genuineOpportunitySpendCr?: number;
  limitedHistorySpendInr?: number;
  limitedHistorySpendCr?: number;
  eligiblePhysicalAggregationSpendInr?: number;
  eligiblePhysicalAggregationSpendCr?: number;
  excludedPhysicalAggregationSpendInr?: number;
  excludedPhysicalAggregationSpendCr?: number;
  totalIncurredSpendInr: number;
  totalIncurredSpendCr: number;
  potentiallyAggregatableSpendInr: number;
  potentiallyAggregatableSpendCr: number;
  tier1IdenticalCount: number;
  tier1SpendCr: number;
  tier2ComparableCount: number;
  tier2SpendCr: number;
  tier3CategoryCount: number;
  tier3SpendCr: number;
  unmatchedAdjustmentsCount: number;
  unmatchedAdjustmentsSpendInr: number;
  reconciliationDeltaInr: number;
}

export interface VolumeAggregationTransactionItem {
  id?: string;
  po_number?: string;
  po_line?: string;
  po_date?: string;
  vendor_code?: string;
  vendor_name: string;
  material_code?: string;
  material_desc: string;
  quantity: number;
  uom?: string;
  unit_price: number;
  total_spend_inr: number;
  currency?: string;
  plant?: string;
  business_unit?: string;
  department?: string;
  spend_category?: string;
  unspsc_code?: string;
}

export interface VolumeAggregationResult {
  assessmentId: string;
  coverageSummary: VolumeAggregationCoverageSummary;
  tier1Opportunities: VolumeAggregationOpportunity[];
  tier2Opportunities: VolumeAggregationOpportunity[];
  tier3Opportunities: VolumeAggregationOpportunity[];
  plantProfiles: PlantVolumeBreakdown[];
  materialProfiles: MaterialVolumeProfile[];
  unmatchedAdjustments: UnmatchedAdjustmentItem[];
  methodologyDisclosures: string[];
  transactions: VolumeAggregationTransactionItem[];
}
