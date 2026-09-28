/**
 * PCBI Module 3 End-to-End Dynamic Ingestion, Gap Alerting & Catalog Governance Types
 */

import type {
  PCBIDefinitionStatus,
  PCBIDataStatus,
  PCBIReadinessStatus,
  PCBISourceStatus
} from './pcbiAdmin';

export type PCBIExtractionFormat = 'XLSX' | 'XLS' | 'CSV' | 'PDF' | 'JSON' | 'TXT';

export type PCBIFinalGate = 'E2E_VALIDATED' | 'E2E_VALIDATED_WITH_GAPS' | 'E2E_BLOCKED';

export type PCBIMismatchDimension =
  | 'grade'
  | 'specification'
  | 'unit'
  | 'currency'
  | 'geography'
  | 'date_coverage'
  | 'frequency';

export interface PCBIE2EAlert {
  id: string;
  commodity: string;
  module2Material: string;
  unspscMapping: string;
  customerSpendInr: number;
  customerSpendCr: string;
  transactionCount: number;
  pcbiStatus: PCBIDefinitionStatus | PCBIDataStatus | PCBIReadinessStatus;
  dataGap: string;
  requiredData: string;
  requiredFrequency: string;
  requiredUnit: string;
  requiredCurrency: string;
  requiredHistoricalPeriod: string;
  requiredAction: string;
}

export interface PCBINormalizedPreviewRow {
  pcbiId: string;
  commodityId: string;
  seriesId: string;
  sourceName: string;
  sourceUrl: string;
  sourceDocument: string;
  observationDate: string;
  effectiveDate: string;
  rawValue: number;
  rawUnit: string;
  rawCurrency: string;
  standardValue: number;
  standardUnit: string;
  standardCurrency: string;
  sourceFrequency: string;
  standardFrequency: string;
  transformationMethod: string;
  transformationVersion: string;
  dataGapFlag: boolean;
  sourceStatus: PCBISourceStatus;
  methodologyId: string;
  ingestionBatchId: string;
  checksum: string;
  validationStatus: string;
}

export interface PCBIExtractionPipelineResult {
  upload: {
    fileName: string;
    format: PCBIExtractionFormat;
    sizeBytes: number;
    uploadedAt: string;
  };
  fileValidation: {
    valid: boolean;
    checksum: string;
    mimeType: string;
  };
  dataExtraction: {
    extractedRowsCount: number;
    rawSample: Record<string, unknown>[];
  };
  columnDetection: {
    detectedColumns: string[];
    confidencePct: number;
  };
  dateDetection: {
    dateColumn: string;
    detectedFormat: string;
    minDate: string;
    maxDate: string;
  };
  priceValueDetection: {
    valueColumn: string;
    numericValidPct: number;
    sampleValues: number[];
  };
  unitDetection: {
    detectedUnit: string;
    rawUnit: string;
    matchConfidencePct: number;
  };
  currencyDetection: {
    detectedCurrency: string;
    rawCurrency: string;
    matchConfidencePct: number;
  };
  frequencyDetection: {
    detectedFrequency: string;
    regularityPct: number;
  };
  sourceIdentification: {
    identifiedSource: string;
    domainMatch: string;
  };
  seriesIdentification: {
    proposedSeriesId: string;
    commodityMatch: string;
  };
  dataQualityCheck: {
    nullCount: number;
    outlierCount: number;
    continuityScorePct: number;
    qualityGrade: string;
  };
  standardizationPreview: PCBINormalizedPreviewRow[];
}

export interface PCBIFrequencyNormalizationTestResult {
  caseId: string;
  sourceFrequency: string;
  targetFrequency: string;
  proposedTransformation: string;
  methodologyStatus: 'APPROVED' | 'METHODOLOGY_APPROVAL_REQUIRED';
  adminApprovalRequired: boolean;
  blocked: boolean;
  lineagePreserved: boolean;
  message: string;
}

export interface PCBIAdminApprovalRecord {
  adminUser: string;
  approvalTimestamp: string;
  approvalId: string;
  sourceChecksum: string;
  methodologyId: string;
  version: string;
  changeReason: string;
  status: 'APPROVED' | 'REJECTED';
  productionWritesCount: number;
}

export interface PCBICatalogOperation {
  operationType:
    | 'ADD_COMMODITY'
    | 'ADD_SERIES'
    | 'ADD_SOURCE'
    | 'ADD_HISTORY'
    | 'UPDATE_SERIES'
    | 'VERSION_HISTORY'
    | 'DEPRECATE_SERIES';
  commodityId: string;
  seriesId?: string;
  performedBy: string;
  timestamp: string;
  version: string;
  immutableCheckPassed: boolean;
  message: string;
}

export interface PCBIMismatchDetectionTestResult {
  testCase: string;
  dimension: PCBIMismatchDimension;
  customerExpectation: string;
  uploadedPCBIValue: string;
  detectedStatus: 'CLASSIFICATION_CONFLICT' | 'SPECIFICATION_MISMATCH' | 'CONVERSION_PENDING' | 'METHODOLOGY_PENDING';
  adminActionRequired: string;
  benchmarkBlocked: boolean;
  passed: boolean;
}

export interface PCBIE2ETestSuiteResult {
  totalCommoditiesTested: number;
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
  highImpactGaps: number;
  uploadTestsPassed: boolean;
  normalizationTestsPassed: boolean;
  adminApprovalTestsPassed: boolean;
  catalogVersioningTestsPassed: boolean;
  productionWritesBeforeApproval: number;
  productionWritesAfterApproval: number;
  module1Modified: boolean;
  module2Modified: boolean;
  module4Connected: boolean;
  finalGate: PCBIFinalGate;
}
