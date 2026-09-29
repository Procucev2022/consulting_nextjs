/**
 * Module 2 — Strategic Sourcing Item-Level & Multi-Category Analysis Types
 * Version: MODULE_2_SOURCING_LOGIC_V2.0
 */

import type { SourcingDataConfidence, SourcingOpportunityStatus } from './module2StrategicSourcing';

export type PrimarySourcingLever =
  | 'E_AUCTION'
  | 'VENDOR_CONSOLIDATION'
  | 'CATEGORY_SPECIALIST_REALIGNMENT'
  | 'VOLUME_BUNDLING'
  | 'PO_CONSOLIDATION'
  | 'RATE_CONTRACT'
  | 'NO_QUANTIFIABLE_BENEFIT';

export interface ItemSupplierPosition {
  supplierId: string;
  supplierName: string;
  spendInr: number;
  quantity: number;
  weightedPrice: number;
  spendSharePct: number;
  isSpecialist: boolean;
  isMultiCategory: boolean;
  historicalPricePosition: 'BELOW_AVERAGE' | 'AT_AVERAGE' | 'ABOVE_AVERAGE' | 'NON_COMPARABLE';
}

export interface ItemLevelSourcingAnalysis {
  itemCode: string;
  itemDescription: string;
  category: string;
  subCategory: string;
  specification: string;
  uom: string;
  annualSpendInr: number;
  annualQuantity: number;
  transactionCount: number;
  supplierCount: number;
  suppliers: ItemSupplierPosition[];
  weightedAveragePrice: number;
  minPrice: number;
  p25Price: number;
  medianPrice: number;
  p75Price: number;
  maxPrice: number;
  lowestCrediblePrice: number | null;
  priceDispersionPct: number;
  hasVolumeTierEvidence: boolean;
  volumeTierSlopePct?: number;
  primaryLever: PrimarySourcingLever;
  status: SourcingOpportunityStatus;
  confidence: SourcingDataConfidence;
  eAuctionBenefitInr: number;
  vendorConsolidationBenefitInr: number;
  specialistRealignmentBenefitInr: number;
  volumeBundlingBenefitInr: number;
  netDefensibleBenefitInr: number;
  explanation: string;
}

export interface MultiCategoryVendorCategoryItem {
  categoryName: string;
  spendInr: number;
  itemCount: number;
  quantity: number;
  supplierSharePct: number;
  pricePosition: 'BELOW_AVERAGE' | 'AT_AVERAGE' | 'ABOVE_AVERAGE';
  hasSpecialistAlternative: boolean;
  specialistDemonstratedSavingsInr: number;
  recommendedAction: string;
}

export interface MultiCategoryVendorAnalysisItem {
  vendorName: string;
  total3YearSpendInr: number;
  annualSpendInr: number;
  categoriesSuppliedCount: number;
  itemsSuppliedCount: number;
  categories: MultiCategoryVendorCategoryItem[];
  classification:
    | 'CATEGORY_SPECIALIST'
    | 'MULTI_CATEGORY_SUPPLIER'
    | 'DOMINANT_MULTI_CATEGORY_SUPPLIER'
    | 'STRATEGIC_SINGLE_SOURCE';
  primaryCategory: string;
  pricePosition: string;
  yoySpendPct: number;
  yoyQuantityPct: number;
  yoyPricePct: number;
  riskIndicators: string[];
  categoryDependencyMap?: Array<{
    categoryName: string;
    spendInr: number;
    spendInrCr: number;
    currentSupplier: string;
    otherSuppliersCount: number;
    priceDispersionPct: number;
    specialistAvailable: boolean;
    opportunityClassification: 'QUANTIFIABLE' | 'NOT_QUANTIFIABLE';
    demonstratedSpecialistBenefitInr: number;
    recommendedAction: string;
  }>;
}

export interface CategoryFiscalYearSpendDenominator {
  fy24Inr: number;
  fy25Inr: number;
  fy26Inr: number;
  threeYearSpendInr: number;
  annualizedSpendInr: number;
  itemCount: number;
  supplierCount: number;
  recurringSpendInr: number;
  contractedSpendInr: number;
}
