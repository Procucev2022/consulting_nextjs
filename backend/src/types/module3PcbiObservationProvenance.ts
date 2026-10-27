/**
 * Module 3 PCBI Phase 3 / 3A — Observation Provenance & Validation Types
 * Conforms to strict rule 9 (no inline types), rule 8, and max 300 lines.
 */

export type ObservationValidationStatus =
  | 'VALIDATED'
  | 'QUARANTINED_UNPROVENANCED'
  | 'QUARANTINED_GRADE_INCOMPATIBLE'
  | 'QUARANTINED_STALE'
  | 'QUARANTINED_UNAUTHORIZED_SOURCE'
  | 'UNVERIFIED_SOURCE'
  | 'REJECTED_UNTRACEABLE';

export type ObservationVerificationClassification =
  | 'VERIFIED_SOURCE_DOCUMENT'
  | 'VERIFIED_PUBLIC_WEBPAGE'
  | 'USER_SUPPLIED_UNVERIFIED'
  | 'SOURCE_IDENTIFIED_NOT_ACQUIRED'
  | 'UNVERIFIED_UNSUPPORTED';

export type ObservationStorageImplementationType =
  | 'RETRIEVED_FROM_SOURCE_DOCUMENT'
  | 'IMPORTED_FROM_SOURCE_FILE'
  | 'MANUALLY_ENTERED_CANDIDATE'
  | 'HARDCODED_FIXTURE'
  | 'GENERATED_PLACEHOLDER';

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
  verificationClassification?: ObservationVerificationClassification;
  storageImplementationType?: ObservationStorageImplementationType;
  sourceArtifactAvailable?: boolean;
  hashVerified?: boolean;
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

export interface CrossPhaseMaterialReconciliationItem {
  commodityFamily: string;
  phase2CatalogSpendCr: number;
  phase2Transactions: number;
  phase3Partition: string;
  phase3PartitionSpendCr: number;
  phase3PartitionTransactions: number;
  materialCodes: string[];
  inclusionRationale: string;
  varianceExplanation: string;
}

export interface Phase3CrossReconciliationRegister {
  assessmentId: string;
  authoritativeBaselineSpendCr: number;
  authoritativeBaselineTransactions: number;
  reconciledSpendCr: number;
  reconciledTransactions: number;
  items: CrossPhaseMaterialReconciliationItem[];
  isFullyReconciled: boolean;
}
