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
  currencyProvenance?: string;
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

export interface FxReferenceRateD1Row {
  currency: string;
  rate_date: string;
  inr_per_unit: number;
  raw_rate: number | null;
  raw_unit: number | null;
  raw_quote_convention: string | null;
  source_id: string | null;
  source_name: string | null;
  rate_type: string | null;
  conversion_method: string | null;
  rate_status: string | null;
  fx_master_version: string;
}

export interface FxCurrencyMasterD1Row {
  currency: string;
  currency_name: string;
  coverage_status: string;
  approved_source: string | null;
}

export interface FxRateRuleD1Row {
  rule_id: string;
  rule: string;
  implementation_requirement: string;
  control_type: string;
}

export interface FxMasterVersionD1Row {
  version_id: string;
  workbook_name: string;
  created_date: string | null;
  coverage_start: string | null;
  coverage_end: string | null;
  currencies: number | null;
  total_records: number | null;
  source_mix: string | null;
  created_by: string | null;
  sha256_checksum: string;
  validation_status: string;
}

export interface LoadedFxMasterData {
  verifiedChecksum: string;
  filePathUsed: string;
  dailyRatesMap: Map<string, FxReferenceRecord>;
  datesByCurrency: Map<string, string[]>;
  currenciesMetadata: Map<string, FxCurrencyMasterMetadata>;
  rateRules: FxRateRuleMetadata[];
  versionMetadata: FxMasterVersionMetadata | null;
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
