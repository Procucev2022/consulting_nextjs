/**
 * Authoritative FX Reference Master & Module 1 Currency Normalization Types
 */

export type FxCoverageStatus =
  | 'FULL_DIRECT'
  | 'HIGH_COVERAGE_DERIVED'
  | 'PARTIAL'
  | 'PENDING_SOURCE'
  | 'BLOCKED';

export type FxConversionStatus = 'CONVERTED' | 'PENDING' | 'BLOCKED';

export type FxConversionMethod =
  | 'BASE_CURRENCY'
  | 'DIRECT_REFERENCE'
  | 'DERIVED_CROSS_RATE'
  | 'PRIOR_BUSINESS_DAY'
  | 'UNRESOLVED';

export type FxValidationStatus = 'PASS' | 'PARTIAL' | 'BLOCKED';

export interface FxRateResolutionResult {
  currency: string;
  rate: number | null;
  rateDateUsed: string | null;
  sourceId: string | null;
  sourceName: string | null;
  rateType: string | null;
  conversionMethod: FxConversionMethod;
  coverageStatus: FxCoverageStatus;
  fxMasterVersion: string;
  status: FxConversionStatus;
  notes?: string;
}

export interface FxTransactionInput {
  transactionId: string;
  originalValue: number;
  originalCurrency: string;
  transactionDate: string;
  poNumber?: string;
  lineItem?: number | string;
  supplierName?: string;
  materialDescription?: string;
}

export interface FxNormalizedTransaction {
  transactionId: string;
  originalValue: number;
  originalCurrency: string;
  transactionDate: string;
  fxRate: number | null;
  fxRateDate: string | null;
  fxSource: string | null;
  fxSourceId: string | null;
  fxRateType: string | null;
  fxConversionMethod: FxConversionMethod;
  fxConversionStatus: FxConversionStatus;
  inrNormalizedValue: number | null;
  fxMasterVersion: string;
}

export interface FxSpendSummary {
  totalUploadedSpend: number;
  originalSpendByCurrency: Record<string, number>;
  convertedSpendInr: number;
  pendingFxSpendByCurrency: Record<string, number>;
  pendingFxSpendCount: number;
  blockedFxSpendCount: number;
  fxCoveragePct: number;
  currenciesDetected: string[];
  currenciesConverted: string[];
  currenciesPending: string[];
  fxValidationStatus: FxValidationStatus;
  reconciliationVariance: number;
  fxMasterVersion: string;
  fxMasterFileName: string;
  fxMasterChecksum: string;
  fxMasterAsOfDate: string;
}

export interface FxReferenceRecord {
  currency: string;
  rateDate: string;
  rawRate: number | null;
  rawUnit: number | null;
  rawQuoteConvention: string | null;
  inrPerUnit: number;
  sourceId: string;
  sourceName: string;
  rateType: string;
  conversionMethod: string;
  rateStatus: string;
  fxMasterVersion: string;
}

export interface FxCurrencyMasterMetadata {
  currency: string;
  currencyName: string;
  approvedSource: string;
  coverageStatus: FxCoverageStatus;
}

export interface FxRateRuleMetadata {
  ruleId: string;
  rule: string;
  implementationRequirement: string;
  controlType: string;
}

export interface FxMasterVersionMetadata {
  versionId: string;
  workbookName: string;
  createdDate: string;
  coverageStart: string;
  coverageEnd: string;
  currencies: number;
  totalRecords: number;
  sourceMix: string;
  createdBy: string;
  sha256Checksum: string;
  validationStatus: string;
}

export interface FxEvidenceSummaryRow {
  'Metric': string;
  'Value': string | number;
  'Audit Notes': string;
}

export interface FxEvidenceTransactionRow {
  'Transaction ID': string;
  'Original Value': number;
  'Original Currency': string;
  'Transaction Date': string;
  'FX Rate': number | string;
  'FX Rate Date': string;
  'FX Source': string;
  'FX Method': string;
  'FX Status': string;
  'INR Normalized Value': number | string;
  'FX Master Version': string;
}
