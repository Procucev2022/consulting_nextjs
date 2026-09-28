/**
 * PCBI Module 3 Controlled Benchmark Engine Validation Types
 */

export type PCBIControlledSeriesCategory =
  | 'VERIFIED_FREE_DIRECT'
  | 'OFFICIAL_INDEX'
  | 'MONTHLY_OFFICIAL_INDEX'
  | 'WEEKLY_SOURCE'
  | 'FORTNIGHTLY_SOURCE'
  | 'METAL_CONSTITUENT'
  | 'STAINLESS_STEEL_GRADE'
  | 'FERROALLOY'
  | 'SCRAP'
  | 'PARTIAL_HISTORY'
  | 'NO_HISTORY'
  | 'SPECIFICATION_MISMATCH';

export type PCBICalculationFinalGate =
  | 'CALCULATION_VALIDATED'
  | 'CALCULATION_VALIDATED_WITH_GAPS'
  | 'CALCULATION_BLOCKED';

export interface PCBIControlledSeriesItem {
  pcbiId: string;
  category: PCBIControlledSeriesCategory;
  commodity: string;
  module2Commodity: string;
  unspsc: string;
  customerSpend: number;
  customerSpendCr: string;
  customerTxnCount: number;
  source: string;
  sourceStatus: 'CANDIDATE' | 'UNDER_VALIDATION' | 'VALIDATED' | 'REJECTED';
  sourceFrequency: string;
  requiredFrequency: string;
  historicalPeriod: string;
  availableHistory: string;
  unit: string;
  currency: string;
  geography: string;
  methodologyId: string;
  methodologyApprovalStatus: 'APPROVED' | 'METHODOLOGY_APPROVAL_REQUIRED' | 'METHODOLOGY_PENDING' | 'NONE_REQUIRED';
  isEligible: boolean;
  blockReason?: string;
}

export interface PCBIRawSourceObservation {
  sourceDate: string;
  effectiveDate: string;
  rawValue: number;
  rawUnit: string;
  rawCurrency: string;
  sourceFrequency: string;
  sourceDocument: string;
  sourceUrl: string;
  checksum: string;
  ingestionBatchId: string;
}

export interface PCBITransformationValidation {
  rawValue: number;
  transformation: string;
  standardValue: number;
  methodologyId: string;
  approvalStatus: 'APPROVED' | 'METHODOLOGY_APPROVAL_REQUIRED' | 'METHODOLOGY_PENDING';
  isValid: boolean;
  blockReason?: string;
}

export interface PCBICalculationChain {
  pcbiId: string;
  commodity: string;
  rawSourceObservation: number;
  standardizedObservation: number;
  effectiveObservation: number;
  basePeriodValue: number;
  currentPeriodValue: number;
  indexCalculation: number;
  pcbiOutput: number;
  basePeriodVerified: boolean;
}

export interface PCBIBasePeriodValidation {
  pcbiId: string;
  commodity: string;
  baseDate: string;
  baseValue: number;
  currentDate: string;
  currentValue: number;
  indexBase: 100;
  calculationFormula: string;
  methodologyId: string;
  basePeriodVerified: boolean;
}

export interface PCBINegativeTestCase {
  testId: string;
  code: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J';
  scenario: string;
  testedCondition: string;
  pcbiGenerated: boolean;
  status: string;
  adminActionRequired: string;
  passed: boolean;
}

export interface PCBICustomerPriceComparison {
  commodity: string;
  customerPurchasePrice: number;
  customerUnit: string;
  customerCurrency: string;
  pcbiBaseValue?: number;
  pcbiCurrentValue?: number;
  pcbiCurrency?: string;
  pcbiUnit?: string;
  pcbiIndex: number;
  pcbiImpliedMovementPct: number;
  disclaimer: 'ANALYTICAL PREVIEW — NOT SAVINGS';
}

export interface PCBIControlledValidationReportSummary {
  fullDatasetConfirmed: boolean;
  totalCustomerSpend: number;
  totalCustomerSpendCr: string;
  totalTransactions: number;
  totalModule2Families: number;
  totalPcbiSeries: number;
  pcbiDefined: number;
  pcbiMissing: number;
  completeHistory: number;
  partialHistory: number;
  noHistory: number;
  frequencyMismatch: number;
  specificationMismatch: number;
  sourceUnverified: number;
  methodologyPending: number;
  notBenchmarkable: number;
  seriesTested: number;
  eligibleSeries: number;
  blockedSeries: number;
  pcbiCalculationsCompleted: number;
  pcbiCalculationsBlocked: number;
  provenanceFailures: number;
  methodologyFailures: number;
  specificationFailures: number;
  frequencyFailures: number;
  unitCurrencyFailures: number;
  module1Modified: boolean;
  module2Modified: boolean;
  pcbiMasterModified: boolean;
  module4Connected: boolean;
  savingsCalculated: number;
  finalGate: PCBICalculationFinalGate;
}
