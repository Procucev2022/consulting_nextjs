/**
 * Module 3 PCBI Phase 3 — Observation Provenance & Validation Types
 * Conforms to strict rule 9 (no inline types), rule 8, and max 300 lines.
 */

export type ObservationValidationStatus =
  | 'VALIDATED'
  | 'QUARANTINED_UNPROVENANCED'
  | 'QUARANTINED_GRADE_INCOMPATIBLE'
  | 'QUARANTINED_STALE'
  | 'QUARANTINED_UNAUTHORIZED_SOURCE'
  | 'REJECTED_UNTRACEABLE';

export interface ObservationProvenanceRecord {
  id: string;
  benchmarkSeriesId: string;
  benchmarkSeriesName: string;
  observationDate: string;
  effectivePeriodStart: string;
  effectivePeriodEnd: string;
  originalValue: number;
  originalUnit: string;
  originalCurrency: string;
  geographyMarketBasis: string;
  publisherSource: string;
  sourceDocumentRef: string;
  acquisitionTimestamp: string;
  convertedValue: number;
  convertedUnit: string;
  convertedCurrency: string;
  conversionFormula: string;
  validationStatus: ObservationValidationStatus;
  quarantineReason?: string;
  licenseAccessRestrictions: string;
  isFresh: boolean;
  traceabilityHash: string;
}

export interface ReconciledCoverageRegisterItem {
  bucketKey: string;
  bucketName: string;
  spendInr: number;
  spendCr: number;
  spendPct: number;
  transactionCount: number;
  uniqueMaterialsCount: number;
  explanation: string;
  materialExamples: string[];
}

export interface ReconciledCoverageRegister {
  assessmentId: string;
  customerName: string;
  authoritativeBaselineSpendCr: number;
  authoritativeBaselineSpendInr: number;
  authoritativeBaselineTransactions: number;
  reconciledSpendCr: number;
  reconciledSpendInr: number;
  reconciledTransactions: number;
  reconciliationVarianceCr: number;
  reconciliationVarianceInr: number;
  isFullyReconciled: boolean;
  buckets: ReconciledCoverageRegisterItem[];
  certifiedSavingsCr: number;
  realizedSavingsCr: number;
  marketVarianceValueCr: number;
  module4Executed: boolean;
}
