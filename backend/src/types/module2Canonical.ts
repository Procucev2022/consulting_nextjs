/**
 * Module 2 Canonical Input Contract, Forensic Lineage & Opportunity Ledger Types
 * Version: MODULE_2_CANONICAL_V1.0
 */

import type { StrategicInputTransaction } from './strategicSourcing';
import type { CategoryStrategicSourcingProfile, Module2StrategicSourcingDashboardSummary } from './module2StrategicSourcing';

export interface Module2PeriodMetadata {
  startDate: string;
  endDate: string;
  actualBillingMonths: number;
  fiscalYear: string;
  fiscalMonthCoverage: string;
  isFullFiscalYear: boolean;
  missingMonthsNotice: string;
}

export interface Module2CanonicalInput {
  datasetId: string;
  dataVersionId: string;
  sourceFileName: string;
  sourceRowCount: number;
  validRowCount: number;
  excludedRowCount: number;
  anomalyRowCount: number;
  totalValidatedSpendInr: number;
  totalValidatedSpendCr: number;
  transactions: StrategicInputTransaction[];
  suppliersCount: number;
  materialGroupsCount: number;
  plantsCount: number;
  billingMonthsCount: number;
  period: Module2PeriodMetadata;
  currencyCoverage: {
    currenciesDetected: string[];
    normalizedSpendInr: number;
  };
  fxNormalization: {
    masterVersion: string;
    checksum: string;
  };
}

export type OpportunityLeverType =
  | 'E_AUCTION'
  | 'VENDOR_CONSOLIDATION'
  | 'VOLUME_BUNDLING'
  | 'CATEGORY_SPECIALIST_REALIGNMENT'
  | 'PO_CONSOLIDATION'
  | 'COMBINED_STRATEGIC';

export interface Module2OpportunityLedgerItem {
  opportunityId: string;
  sourceTransactionIds: string[];
  category: string;
  supplierIds: string[];
  materialIds: string[];
  opportunityType: OpportunityLeverType;
  eligibleSpendInr: number;
  eligibleSpendCr: number;
  grossOpportunityInr: number;
  grossOpportunityCr: number;
  overlapGroup: string;
  overlapAmountInr: number;
  overlapAmountCr: number;
  netOpportunityInr: number;
  netOpportunityCr: number;
  methodology: string;
  formula: string;
  assumption: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'QUALIFIED' | 'PROVEN' | 'OPPORTUNITY_IDENTIFIED';
}

export interface Module2MathematicalBridge {
  totalValidatedSpendInr: number;
  totalValidatedSpendCr: number;
  module2AnalyzedSpendInr: number;
  module2AnalyzedSpendCr: number;
  addressableSpendInr: number;
  addressableSpendCr: number;
  grossOpportunityInr: number;
  grossOpportunityCr: number;
  overlapDeductionsInr: number;
  overlapDeductionsCr: number;
  netDefensibleOpportunityInr: number;
  netDefensibleOpportunityCr: number;
  provenOpportunityInr: number;
  provenOpportunityCr: number;
  quantifiableRangeMinInr: number;
  quantifiableRangeMinCr: number;
  quantifiableRangeMaxInr: number;
  quantifiableRangeMaxCr: number;
  categoriesReadyCount: number;
  eauctionCandidatesCount: number;
  consolidationCandidatesCount: number;
  categoriesAnalyzedCount: number;
}

export interface Module2Top50VendorItem {
  rank: number;
  vendorCode: string;
  vendorName: string;
  totalSpendInr: number;
  totalSpendCr: number;
  spendSharePct: number;
  cumulativeSharePct: number;
  paretoClass: 'A' | 'B' | 'C';
  categoriesSuppliedCount: number;
  categoriesList: string[];
  transactionCount: number;
  vendorType: 'MULTI_CATEGORY_PARTNER' | 'SINGLE_CATEGORY_SPECIALIST';
}

export interface Module2SupplierRiskItem {
  materialGroup: string;
  totalSpendInr: number;
  totalSpendCr: number;
  totalSuppliersCount: number;
  primarySupplierName: string;
  primarySupplierSpendCr: number;
  primarySupplierSharePct: number;
  riskClassification: 'SINGLE_SOURCE_DOMINANT' | 'MODERATE_CONCENTRATION' | 'FRAGMENTED_COMPETITIVE';
  hhiScore: number;
}

export interface Module2PoConsolidationItem {
  pairId: string;
  vendorName: string;
  materialDesc: string;
  category: string;
  poCount: number;
  totalSpendInr: number;
  totalSpendCr: number;
  avgPoValueInr: number;
  frequency: string;
  consolidationSuitability: string;
}

export interface Module2RecurringSpendItem {
  category: string;
  activeMonthsCount: number;
  totalSpendInr: number;
  totalSpendCr: number;
  transactionCount: number;
  supplierCount: number;
  isRecurring: boolean;
  classification: string;
}

export interface Module2ForensicSummary {
  canonicalInput: Module2CanonicalInput;
  bridge: Module2MathematicalBridge;
  ledger: Module2OpportunityLedgerItem[];
  dashboardSummary: Module2StrategicSourcingDashboardSummary;
  profiles: CategoryStrategicSourcingProfile[];
  top50Vendors: Module2Top50VendorItem[];
  supplierRisk: Module2SupplierRiskItem[];
  poConsolidation: Module2PoConsolidationItem[];
  recurringSpend: Module2RecurringSpendItem[];
}
