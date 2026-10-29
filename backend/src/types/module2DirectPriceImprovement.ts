/**
 * Module 2 — Lever 1: Direct Price Improvement Data Types
 * Strict separation of interfaces per Rule 9
 */

export type ItemQualificationStatus =
  | 'QUALIFIED'
  | 'VOLATILE_COMMODITY'
  | 'SPEC_MISMATCH'
  | 'SINGLE_SUPPLIER'
  | 'UNIFORM_PRICING';

export interface DirectPriceTransactionRecord {
  id: string;
  poNumber: string;
  poDate: string;
  financialYear: string;
  supplierName: string;
  supplierCode: string;
  plantCode: string;
  quantity: number;
  unitPrice: number;
  totalSpendInr: number;
  benchmarkUnitPrice: number;
  benchmarkCostInr: number;
  historicalLostOpportunityInr: number;
  isBenchmarkTransaction: boolean;
  qualificationStatus: ItemQualificationStatus;
  warning?: string;
}

export interface SupplierPriceComparison {
  supplierCode: string;
  supplierName: string;
  transactionCount: number;
  totalQuantity: number;
  totalSpendInr: number;
  weightedAveragePrice: number;
  lowestUnitPrice: number;
  highestUnitPrice: number;
  historicalLostOpportunityInr: number;
  isLowestPriceSupplier: boolean;
}

export interface PlantPriceComparison {
  plantCode: string;
  transactionCount: number;
  totalQuantity: number;
  totalSpendInr: number;
  weightedAveragePrice: number;
  lowestUnitPrice: number;
  historicalLostOpportunityInr: number;
}

export interface DirectPriceItemOpportunity {
  itemKey: string;
  materialCode: string;
  materialDesc: string;
  spendCategory: string;
  uom: string;
  currency: string;
  unspscCode?: string;
  unspscCategory?: string;
  financialYear: string;
  transactionCount: number;
  totalEligibleQuantity: number;
  lowestUnitPrice: number;
  weightedAveragePrice: number;
  highestUnitPrice: number;
  actualPurchaseCostInr: number;
  actualPurchaseCostCr: number;
  benchmarkCostInr: number;
  benchmarkCostCr: number;
  historicalLostOpportunityInr: number;
  historicalLostOpportunityCr: number;
  priceDispersionPct: number;
  benchmarkSupplierName: string;
  benchmarkSupplierCode: string;
  benchmarkPoNumber: string;
  benchmarkPoDate: string;
  benchmarkPlantCode: string;
  supplierCount: number;
  plantCount: number;
  qualificationStatus: ItemQualificationStatus;
  warnings: string[];
  suppliers: SupplierPriceComparison[];
  plants: PlantPriceComparison[];
  transactions: DirectPriceTransactionRecord[];
}

export interface DirectPriceFySummary {
  financialYear: string;
  transactionCount: number;
  totalQuantity: number;
  actualSpendInr: number;
  actualSpendCr: number;
  benchmarkCostInr: number;
  benchmarkCostCr: number;
  historicalLostOpportunityInr: number;
  historicalLostOpportunityCr: number;
  itemsEvaluatedCount: number;
  itemsWithOpportunityCount: number;
}

export interface DirectPriceCategorySummary {
  unspscCode: string;
  unspscCategory: string;
  spendCategory: string;
  distinctMaterialCount: number;
  eligibleTransactionCount: number;
  eligibleQuantity: number;
  uom: string;
  eligibleSpendInr: number;
  eligibleSpendCr: number;
  actualPurchaseCostInr: number;
  actualPurchaseCostCr: number;
  benchmarkCostInr: number;
  benchmarkCostCr: number;
  historicalLostOpportunityInr: number;
  historicalLostOpportunityCr: number;
  opportunityPct: number;
  dataQualityStatus: string;
  materials: DirectPriceItemOpportunity[];
}

export interface DirectPriceImprovementResult {
  assessmentId: string;
  customerName: string;
  availableFinancialYears: string[];
  selectedFinancialYear: string;
  totalEligibleTransactions: number;
  totalIneligibleTransactions: number;
  totalEligibleSpendInr: number;
  totalEligibleSpendCr: number;
  totalIneligibleSpendInr: number;
  totalIneligibleSpendCr: number;
  actualSpendInr: number;
  actualSpendCr: number;
  benchmarkCostInr: number;
  benchmarkCostCr: number;
  historicalLostOpportunityInr: number;
  historicalLostOpportunityCr: number;
  commerciallyValidatedSavingsInr: number;
  commerciallyValidatedSavingsCr: number;
  itemsEvaluatedCount: number;
  itemsWithOpportunityCount: number;
  disqualifiedItemsCount: number;
  categoriesAnalysedCount: number;
  categoriesRequiringReviewCount: number;
  certificationNotice: string;
  fySummaries: DirectPriceFySummary[];
  categorySummaries: DirectPriceCategorySummary[];
  items: DirectPriceItemOpportunity[];
}

export interface DirectPriceQueryOptions {
  financialYear?: string;
  materialCode?: string;
  category?: string;
}
