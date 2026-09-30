/**
 * Module 1 Forensic Deliverables and Invariants Types
 */

export interface GoldenDatasetHash {
  sourceFileName: string;
  fileSizeBytes: number;
  sha256Hash: string;
  sheetNames: string[];
  totalRowCount: number;
  totalColumnCount: number;
  sourceDataFingerprint: string;
  generatedAt: string;
}

export interface AggregationReconciliationMatrixEntry {
  dimension: string;
  parent: string;
  childCount: number;
  parentTotalInr: number;
  childTotalInr: number;
  varianceInr: number;
  status: 'PASS' | 'FAIL';
}

export interface MetamorphicTestResult {
  propertyCode: string;
  propertyName: string;
  transformationDescription: string;
  expectedInvariant: string;
  observedResult: string;
  varianceInr: number;
  status: 'PASS' | 'FAIL';
}

export interface GoldenTransactionProofEntry {
  archetype: string;
  recordId: string;
  sourceRow: number;
  rawQuantity: number;
  rawPrice: number;
  rawCurrency: string;
  normalizedQuantity: number;
  normalizedPrice: number;
  approvedFxRate: number;
  exactBaseValueInr: number;
  exactCalculatedSpendInr: number;
  uiDisplayedSpendCr: number;
  reconstructedFromUiInr: number;
  varianceInr: number;
  status: 'PASS' | 'FAIL';
}

export interface ReconciliationWaterfallStep {
  stepNumber: number;
  stageName: string;
  recordCount: number;
  stageSpendInr: number;
  stageSpendCr: number;
  varianceFromRawInr: number;
  status: 'PASS' | 'FAIL';
}

export interface UiBackendReconciliationResult {
  metricName: string;
  uiValueExact: number | string;
  backendValueExact: number | string;
  variance: number;
  status: 'PASS' | 'FAIL';
  lineageProof: string;
}

export interface PartitionInvarianceResult {
  partitionCount: number;
  partitions: Array<{ partitionIndex: number; recordCount: number; partitionSpendInr: number }>;
  aggregatedSpendInr: number;
  fullLedgerSpendInr: number;
  varianceInr: number;
  status: 'PASS' | 'FAIL';
}

export interface RowOrderInvarianceResult {
  permutationsExecuted: number;
  permutationsPassed: number;
  maxAbsoluteVarianceInr: number;
  status: 'PASS' | 'FAIL';
}

export interface DatasetManifest {
  filename: string;
  fileType: string;
  fileSizeBytes: number;
  uploadTimestamp: string;
  sheetNames: string[];
  headerRow: number;
  totalPhysicalRows: number;
  totalDataRows: number;
  excludedHeaderRows: number;
  detectedColumns: string[];
  detectedCurrencies: string[];
  detectedDateRange: { minDate: string; maxDate: string };
  sourceFileSha256: string;
  datasetVersion: string;
}

export interface CalculationProofEntry {
  kpiName: string;
  source: string;
  formula: string;
  inputs: Record<string, unknown>;
  output: number | string;
  precision: string;
  reconciliationStatus: 'PASS' | 'FAIL';
}

export interface UomAuditSummary {
  totalRecordsAudited: number;
  validUomRecords: number;
  incompatibleUomRecords: number;
  distinctUoms: string[];
  status: 'PASS' | 'FAIL';
}
