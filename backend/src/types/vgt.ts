import type { ValidatedTransactionLedgerRecord } from './module1Forensic';
import type { FxNormalizedTransaction } from './fxReference';

export interface VgtForeignTransactionForensicBridge {
  transactionId: string;
  documentDate: string;
  currency: string;
  originalValue: number;
  profileRate: number;
  profileInrValue: number;
  historicalRate: number;
  historicalRateDate: string;
  historicalInrValue: number;
  fxImpactInr: number;
  fxImpactPct: number;
}

export interface VgtCurrencyForensicBridge {
  currency: string;
  profileRate: number;
  validTxCount: number;
  originalValue: number;
  profileInrValue: number;
  profileInrCr: number;
  historicalInrValue: number;
  historicalInrCr: number;
  fxImpactInr: number;
  fxImpactCr: number;
  fxImpactPct: number;
}

export interface VgtProcessingResult {
  file: {
    filename: string;
    sha256: string;
    sourceRowCount: number;
    sheetNames: string[];
    columnsFound: string[];
  };
  data: {
    sourceRowCount: number;
    ingestedRowCount: number;
    validRowCount: number;
    excludedRowCount: number;
    anomalyRowCount: number;
    duplicateRowCount: number;
  };
  currency: {
    currenciesDetected: string[];
    transactionCountByCurrency: Record<string, number>;
    originalSpendByCurrency: Record<string, number>;
    convertedSpendInrByCurrency: Record<string, number>;
    customerProfileSpendByCurrency: Record<string, number>;
    fxImpactByCurrency: Record<string, number>;
    allRowTransactionCountByCurrency: Record<string, number>;
    fxCoveragePct: number;
    fxValidationStatus: 'PASS' | 'PARTIAL' | 'BLOCKED';
  };
  module1: {
    totalUploadedSpend: number;
    totalConvertedInrSpend: number;
    totalConvertedInrSpendCr: number;
    customerProfileSpendInr: number;
    customerProfileSpendCr: number;
    fxMethodologyImpactInr: number;
    fxMethodologyImpactCr: number;
    rawAllRowSpendInr: number;
    rawAllRowSpendCr: number;
    excludedSpendInr: number;
    excludedSpendCr: number;
    anomalySpendInr: number;
    anomalySpendCr: number;
    pendingSpend: number;
    reconciliationVariance: number;
    duplicateCount: number;
    validCount: number;
    excludedCount: number;
    anomalyCount: number;
    populationVariance: number;
    reconciliationPassed: boolean;
  };
  rootCauseAnalysis: {
    primaryCause: string;
    fieldLevelEvidence: Array<{ field: string; expectedInSap: string; vgtHeader: string; impact: string }>;
    fxConversionEvidence: {
      erpStaticRatesUsed: Record<string, number>;
      authoritativeDailyRatesRange: Record<string, string>;
      erpStaticTotalInrCr: number;
      authoritativeConvertedInrCr: number;
      deltaInrCr: number;
    };
    conclusion: string;
  };
  forensicBridge: {
    profileFxValidSpendCr: number;
    historicalFxValidSpendCr: number;
    fxMethodologyImpactCr: number;
    fxImpactPct: number;
    reconciliationVariance: number;
    profileRates: Record<string, number>;
    rawAllRowHistoricalSpendCr: number;
    excludedSpendCr: number;
    anomalySpendCr: number;
    currencyBridges: VgtCurrencyForensicBridge[];
  };
  evidence: {
    workbookPath: string;
    workbookSha256: string;
    sheetsCount: number;
    sheets: string[];
  };
  dataVersion: {
    dataVersionId: string;
    jobId: string;
    createdAt: string;
  };
  validRows?: ValidatedTransactionLedgerRecord[];
  validNormalizedTransactions?: FxNormalizedTransaction[];
}

export interface VgtEvidenceInput {
  analysisJobId: string;
  dataVersionId: string;
  nowIso: string;
  ingestedRowCount: number;
  sourceRowCount: number;
  fileSha256: string;
  validRowsCount: number;
  excludedRowsCount: number;
  anomalyRowsCount: number;
  rawErpNetValueInrSum: number;
  fxSummary: {
    totalUploadedSpend: number;
    convertedSpendInr: number;
    fxCoveragePct: number;
    fxMasterVersion: string;
    fxMasterChecksum: string;
  };
  validatedLedger: ValidatedTransactionLedgerRecord[];
  normalizedTransactions: FxNormalizedTransaction[];
  validRows: ValidatedTransactionLedgerRecord[];
  validNormalizedTransactions: FxNormalizedTransaction[];
  excludedRows: ValidatedTransactionLedgerRecord[];
  anomalyRows: ValidatedTransactionLedgerRecord[];
  totalNormalizedInr: number;
  reconciliationVariance: number;
  txCountByCurrency: Record<string, number>;
  originalSpendByCurr: Record<string, number>;
  convertedSpendByCurr: Record<string, number>;
  customerProfileSpendByCurr: Record<string, number>;
  fxImpactByCurr: Record<string, number>;
  allRowTxCountByCurr: Record<string, number>;
  customerProfileValidSpendInr: number;
  customerProfileValidSpendCr: number;
  validConvertedSpendInr: number;
  validConvertedSpendCr: number;
  fxMethodologyImpactInr: number;
  fxMethodologyImpactCr: number;
  rawAllRowSpendInr: number;
  rawAllRowSpendCr: number;
  excludedSpendInr: number;
  excludedSpendCr: number;
  anomalySpendInr: number;
  anomalySpendCr: number;
  foreignTransactionsBridge: VgtForeignTransactionForensicBridge[];
  currencyBridges: VgtCurrencyForensicBridge[];
}
