/**
 * Module 2 — Transaction-Level Evidence, Savings Proof & Opportunity Traceability Types (Frontend)
 * Version: MODULE_2_EVIDENCE_LOGIC_V1.0
 */

export type ExclusionReasonCode =
  | 'EXCLUDED_SPEC_MISMATCH'
  | 'EXCLUDED_UOM_MISMATCH'
  | 'EXCLUDED_CURRENCY_MISMATCH'
  | 'EXCLUDED_GEOGRAPHY'
  | 'EXCLUDED_SINGLE_SOURCE_OUTLIER'
  | 'EXCLUDED_LOW_VOLUME'
  | 'EXCLUDED_CONTRACT_LOCK'
  | 'EXCLUDED_NON_RECURRING'
  | 'EXCLUDED_INVALID_TRANSACTION'
  | 'EXCLUDED_INSUFFICIENT_DATA'
  | 'EXCLUDED_PRICE_NOT_COMPARABLE';

export interface TransactionEvidenceRecord {
  transactionId: string;
  poNumber: string;
  poDate: string;
  supplierId: string;
  supplierName: string;
  category: string;
  subCategory: string;
  itemId: string;
  itemDescription: string;
  specification: string;
  grade: string;
  uom: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  totalValue: number;
  deliveryLocation: string;
  contractStatus: 'ACTIVE_CONTRACT' | 'EXPIRED' | 'SPOT_PURCHASE' | 'NO_CONTRACT';
  contractReference: string;
  paymentTerms: string;
  incoterm?: string;
  sourceDocument: string;
  sourceRow: number | string;
  dataQualityStatus: 'VERIFIED' | 'SUSPECT' | 'INCOMPLETE';
  comparabilityStatus: 'COMPARABLE' | 'PARTIALLY_COMPARABLE' | 'EXCLUDED';
  isEligible: boolean;
  exclusionReason?: ExclusionReasonCode;
  exclusionExplanation?: string;
}

export interface SupplierPairPriceComparisonProof {
  supplierA: {
    supplierId: string;
    supplierName: string;
    quantity: number;
    uom: string;
    unitPrice: number;
    date: string;
    specification: string;
    transactionIds: string[];
    totalSpendInr: number;
  };
  supplierB: {
    supplierId: string;
    supplierName: string;
    quantity: number;
    uom: string;
    unitPrice: number;
    date: string;
    specification: string;
    transactionIds: string[];
    totalSpendInr: number;
  };
  priceDifference: number;
  priceDifferencePct: number;
  comparabilityChecklist: {
    specificationMatch: boolean;
    uomMatch: boolean;
    currencyMatch: boolean;
    geographyMatch: boolean | 'NOT_AVAILABLE';
    timeWindowMatch: boolean;
    isValidComparison: boolean;
  };
}

export interface EvidenceStatisticPopulation {
  statisticName: 'MIN' | 'MAX' | 'P25' | 'MEDIAN' | 'WAP' | 'P75' | 'IQR' | 'CV' | 'LOWEST_CREDIBLE';
  label: string;
  value: number;
  uom: string;
  transactionCount: number;
  supplierCount: number;
  totalQuantity: number;
  totalSpendInr: number;
  eligibleTransactionCount: number;
  excludedTransactionCount: number;
  exclusionReasonsBreakdown: Record<string, number>;
  contributingTransactionIds: string[];
}

export interface OpportunityExclusionLedgerEntry {
  transactionId: string;
  poNumber: string;
  supplierName: string;
  itemDescription: string;
  spendInr: number;
  quantity: number;
  unitPrice: number;
  uom: string;
  exclusionCode: ExclusionReasonCode;
  exclusionDetail: string;
}

export interface SpendAddressabilityHierarchy {
  totalHistoricalSpendInr: number;
  comparableSpendInr: number;
  priceAddressableSpendInr: number;
  contractuallyAddressableSpendInr: number;
  executableSpendInr: number;
  realizableSavingsInr: null;
  disclaimer: string;
}

export interface OpportunityEvidenceChain {
  chainId: string;
  categoryId: string;
  categoryName: string;
  addressability: SpendAddressabilityHierarchy;
  comparableTransactionSet: {
    totalTransactions: number;
    eligibleTransactions: number;
    excludedTransactions: number;
    supplierCount: number;
    totalQuantity: number;
    excludedSpendInr: number;
  };
  referencePriceAudit: {
    lowestObservedPrice: number;
    lowestCrediblePrice: number;
    p25Price: number;
    medianPrice: number;
    weightedAveragePrice: number;
    currentRecentPrice: number;
    selectedReferencePrice: number;
    selectedMethodology: string;
    selectionRationale: string;
    supportingTransactionIds: string[];
  };
  priceDifference: number;
  addressableVolume: number;
  grossOpportunityInr: number;
  addressabilityConstraints: {
    contractLockedSpendInr: number;
    unharmonizedSpecSpendInr: number;
    nonRecurringSpendInr: number;
    operationalConstraintSpendInr: number;
  };
  realisticOpportunityRange: {
    conservativeOpportunityInr: number;
    conservativeRefPrice: number;
    baseOpportunityInr: number;
    baseRefPrice: number;
    upsideOpportunityInr: number;
    upsideRefPrice: number;
    label: string;
  };
  executionMechanisms: Array<{
    mechanism: 'E_AUCTION' | 'VENDOR_CONSOLIDATION' | 'VOLUME_LEVERAGE' | 'COMMERCIAL_NEGOTIATION' | 'MARKET_DISCOVERY';
    sharePct: number;
    amountInr: number;
    traceabilityNote: string;
  }>;
  evidenceConfidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT';
  evidenceConfidenceReasons: string[];
  evidenceStatus:
    | 'PROVEN_OPPORTUNITY'
    | 'QUANTIFIABLE_OPPORTUNITY_RANGE'
    | 'MARKET_DISCOVERY_REQUIRED'
    | 'NO_QUANTIFIED_PRICE_OPPORTUNITY_IDENTIFIED'
    | 'NOT_QUANTIFIABLE';
  diagnosticReasonsIfZero?: string[];
  untestedOpportunityAreas?: string[];
}

export interface CompleteCalculationTrace {
  traceId: string;
  categoryName: string;
  questionPrompt: string;
  opportunityAmountInr: number;
  totalTransactionsInput: number;
  totalSpendInputInr: number;
  filtersApplied: string[];
  eligibleTransactionsCount: number;
  excludedTransactionsCount: number;
  excludedSpendInr: number;
  referencePriceSelected: number;
  referenceMethod: string;
  referencePriceRationale: string;
  addressableVolume: number;
  priceDifferential: number;
  grossOpportunityInr: number;
  constraintsDeductedInr: number;
  analyticalRangeMinInr: number;
  analyticalRangeMaxInr: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT';
  recommendedAction: string;
}

export interface CategorySpecialistAlignment {
  supplierId: string;
  supplierName: string;
  suppliedCategories: Array<{
    category: string;
    spendInr: number;
    isPrimaryCategory: boolean;
  }>;
  currentStructureSpendInr: number;
  specialistScenarioBenefitInr: number | null;
  multiSupplierCompetitionBenefitInr: number | null;
  consolidatedVolumeBenefitInr: number | null;
  recommendedAlignment: 'CATEGORY_SPECIALIST' | 'STRATEGIC_CONSOLIDATION' | 'COMPETITIVE_TENSION';
  rationale: string;
}

export interface OpportunityEvidencePackExport {
  exportTimestamp: string;
  version: string;
  opportunitySummary: {
    categoryId: string;
    categoryName: string;
    netDefensibleOpportunityInr: number;
    evidenceStatus: string;
    confidence: string;
  };
  calculationMethodology: string;
  eligibleTransactions: TransactionEvidenceRecord[];
  excludedTransactions: OpportunityExclusionLedgerEntry[];
  supplierComparisons: SupplierPairPriceComparisonProof[];
  priceStatistics: EvidenceStatisticPopulation[];
  referencePriceSelection: {
    selectedPrice: number;
    methodology: string;
    supportingTransactionsCount: number;
    rationale: string;
  };
  addressabilityCalculation: SpendAddressabilityHierarchy;
  opportunityRange: {
    conservative: number;
    base: number;
    upside: number;
  };
  confidenceAssessment: {
    rating: string;
    reasons: string[];
  };
  assumptions: string[];
  sourceTransactionReferences: string[];
  logicVersionIdentifier: string;
}
