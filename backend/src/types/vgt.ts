import type { ValidatedTransactionLedgerRecord } from './module1Forensic';
import type { FxNormalizedTransaction } from './fxReference';

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
    fxCoveragePct: number;
    fxValidationStatus: 'PASS' | 'PARTIAL' | 'BLOCKED';
  };
  module1: {
    totalUploadedSpend: number;
    totalConvertedInrSpend: number;
    totalConvertedInrSpendCr: number;
    pendingSpend: number;
    reconciliationVariance: number;
    duplicateCount: number;
    excludedCount: number;
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
  totalNormalizedInr: number;
  reconciliationVariance: number;
  txCountByCurrency: Record<string, number>;
  originalSpendByCurr: Record<string, number>;
  convertedSpendByCurr: Record<string, number>;
}
