/**
 * Independent Calculation Engine Data Types & Interfaces
 * STRICT COMPLIANCE: Zero dependencies on production services.
 */

export interface IndependentParsedRow {
  rowNumber: number;
  poNumber: string;
  poLine: string;
  documentDate: string;
  postingDate: string;
  supplierCode: string;
  supplierName: string;
  materialCode: string;
  shortText: string;
  materialGroup: string;
  plant: string;
  quantity: number;
  uom: string;
  unitPrice: number;
  priceUnit: number;
  currency: string;
  rawSpendInr: number;
  deletionIndicator?: string;
  classificationNote?: string;
  
  // Evaluated status
  isValid: boolean;
  isExcluded: boolean;
  isAnomaly: boolean;
  exclusionReason?: string;
  anomalyReason?: string;
  
  // Normalized financials
  fxRateUsed: number;
  normalizedInrSpend: number;
}

export interface IndependentSupplierSummary {
  supplierCode: string;
  supplierName: string;
  validLineCount: number;
  totalSpendInr: number;
  totalSpendCr: number;
  materialGroupsSupplied: string[];
  plantsSupplied: string[];
}

export interface IndependentMaterialGroupSummary {
  materialGroup: string;
  description: string;
  validLineCount: number;
  totalSpendInr: number;
  totalSpendCr: number;
  supplierCount: number;
}

export interface IndependentPlantSummary {
  plant: string;
  validLineCount: number;
  totalSpendInr: number;
  totalSpendCr: number;
}

export interface IndependentMonthlySummary {
  yearMonth: string;
  financialYear: string;
  validLineCount: number;
  totalSpendInr: number;
  totalSpendCr: number;
}

export interface IndependentFinancialBridge {
  sourceSpendInr: number;
  excludedSpendInr: number;
  anomalySpendInr: number;
  validSpendInr: number;
  validSpendCr: number;
  addressableSpendInr: number;
  addressableSpendCr: number;
  nonAddressableSpendInr: number;
  
  // Savings Levers
  vendorConsolidationGrossInr: number;
  benchmarkPriceGapGrossInr: number;
  strategicSourcingGrossInr: number;
  strategicMarketValueInr: number;
  processProductivityInr: number;
  costAvoidanceRiskInr: number;
  
  // Deduplication & Net
  grossOpportunityInr: number;
  overlapDeductionInr: number;
  exclusionsDeductionInr: number;
  netDefensibleOpportunityInr: number;
  netDirectSavingsInr: number;
  netDefensibleOpportunityCr: number;
  netDirectSavingsCr: number;
  savingsPercentage: number;
}

export interface IndependentExpectedResultItem {
  testId: string;
  module: 'MODULE_1' | 'MODULE_2' | 'MODULE_3' | 'MODULE_4' | 'REPORT_EVIDENCE';
  metric: string;
  expectedValue: string | number;
  unit: string;
  calculationRule: string;
  sourcePopulation: string;
  notes: string;
}
