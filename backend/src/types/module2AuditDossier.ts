/**
 * Module 2 — Final E2E Certification & Audit Dossier Types
 * Version: MODULE_2_EVALUATION_V1.0
 */

export interface CFOChallengeResponse {
  opportunityId: string;
  categoryId: string;
  categoryName: string;
  opportunityAmountInr: number;
  q1_whyExists: string;
  q2_provingTransactions: string[];
  q3_opportunitySuppliers: string[];
  q4_referencePrice: number;
  q5_whyReferenceCredible: string;
  q6_assumptionsMade: string[];
  q7_assumptionsNotMade: string[];
  q8_addressableSpendInr: number;
  q9_demonstratedHistoricalPortionInr: number;
  q10_requiresFutureValidationPortionInr: number;
  q11_doubleCountingProtection: string;
  q12_requiredOperationalAction: string;
  q13_realizationRisks: string[];
  q14_evidenceThatWouldChangeConclusion: string[];
}

export interface WaterfallTransactionAllocation {
  transactionId: string;
  poNumber: string;
  supplierName: string;
  categoryName: string;
  totalSpendInr: number;
  waterfallStage:
    | 'TOTAL_HISTORICAL_SPEND'
    | 'SPECIFICATION_HARMONIZATION'
    | 'PRICE_ARBITRAGE'
    | 'VOLUME_BUNDLING'
    | 'E_AUCTION'
    | 'VENDOR_CONSOLIDATION'
    | 'NET_DEFENSIBLE_OPPORTUNITY';
  opportunityPool: string;
  allocatedValueInr: number;
}

export interface CustomerDataIntegrityAudit {
  totalInputTransactions: number;
  totalAnalyzedTransactions: number;
  totalExcludedTransactions: number;
  totalSpendInr: number;
  totalSuppliersCount: number;
  totalCategoriesCount: number;
  totalItemsCount: number;
  integrityChecks: {
    extendedValueConsistencyPassed: boolean;
    duplicateTransactionsFound: number;
    missingValuesFound: number;
    invalidPricesFound: number;
    zeroQuantitiesFound: number;
    negativeValuesFound: number;
    inconsistentUomFound: number;
    inconsistentCurrenciesFound: number;
    abnormalDatesFound: number;
    duplicatePoInvoiceFound: number;
  };
  exclusionReasonByTransaction: Record<string, {
    transactionId: string;
    exclusionCode: string;
    reason: string;
  }>;
}

export interface VendorConsolidationScenarioAudit {
  categoryId: string;
  categoryName: string;
  totalCategorySpendInr: number;
  currentSupplierCount: number;
  hhiScore: number;
  tailSpendInr: number;
  scenarios: Array<{
    scenarioName: 'CURRENT_STATE' | 'SCENARIO_A' | 'SCENARIO_B' | 'SCENARIO_C';
    targetSupplierCount: number;
    spendAffectedInr: number;
    volumeAffected: number;
    suppliersAffected: string[];
    historicalPriceBasis: string;
    opportunityRangeInr: { min: number; base: number; max: number };
    operationalRisks: string[];
    confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT';
  }>;
}

export interface EAuctionAuditDossierItem {
  categoryId: string;
  categoryName: string;
  auctionSuitability: 'AUCTION_ELIGIBLE' | 'AUCTION_NOT_ELIGIBLE' | 'AUCTION_POTENTIAL_REQUIRES_VALIDATION';
  currentBaselineSpendInr: number;
  eligibleSpendInr: number;
  eligibleVolume: number;
  supplierCount: number;
  priceDispersionPct: number;
  referencePrice: number;
  targetRangeInr: { min: number; base: number; max: number };
  reserveRangeInr: { min: number; max: number };
  expectedCompetitiveResponse: string;
  exclusionOrQualificationReason: string;
}

export interface NoFabricationScenarioAuditItem {
  scenarioCode: string;
  scenarioDescription: string;
  inputConditions: Record<string, string | number | boolean>;
  expectedStatus: string;
  actualStatus: string;
  fabricatedSavingsDetected: boolean;
  savingsClaimedInr: number;
  diagnosticReason: string;
  pass: boolean;
}

export interface DoubleCountingDossierItem {
  categoryId: string;
  categoryName: string;
  grossIdentifiedOpportunityInr: number;
  leverBreakdown: {
    priceArbitrageInr: number;
    eauctionInr: number;
    vendorConsolidationInr: number;
    volumeBundlingInr: number;
    categorySpecialistInr: number;
  };
  overlappingOpportunityInr: number;
  netDefensibleOpportunityInr: number;
  deduplicationMethod: string;
  reconciled: boolean;
}

export type Module2FinalCertificationStatus =
  | 'PRODUCTION_VALIDATED'
  | 'PRODUCTION_VALIDATED_WITH_MINOR_DEFECTS'
  | 'REQUIRES_DEFECT_FIX'
  | 'REQUIRES_LOGIC_FIX'
  | 'BLOCKED';
