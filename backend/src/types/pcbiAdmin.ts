/**
 * PCBI Master Upload, Validation, Versioning & Publishing Backend Data Types
 */

export type PCBIWorksheetType =
  | 'PCBI_MASTER'
  | 'WEEKLY_INDEX'
  | 'CONSTITUENTS'
  | 'SOURCES'
  | 'UNSPSC_MAPPING'
  | 'OTHER'
  | 'IGNORE';

export interface PCBIWorksheetDetection {
  sheetName: string;
  detectedType: PCBIWorksheetType;
  purposeLabel: string;
  rowCount: number;
  columnCount: number;
  headers: string[];
  confidence: number;
  userOverride?: PCBIWorksheetType;
}

export type PCBIColumnMappingStatus = 'MAPPED' | 'UNMAPPED' | 'OPTIONAL';

export interface PCBIColumnMapping {
  excelColumn: string;
  mappedField: string;
  fieldLabel: string;
  isRequired: boolean;
  confidence: number;
  status: PCBIColumnMappingStatus;
  sampleValues: string[];
}

export type PCBIValidationSeverity = 'BLOCKING_ERROR' | 'WARNING' | 'INFORMATION';

export interface PCBIValidationIssue {
  id: string;
  sheetName: string;
  rowNumber: number;
  column: string;
  rawValue: string;
  severity: PCBIValidationSeverity;
  rule: string;
  message: string;
  resolution: string;
}

export interface PCBIConstituentTotalSummary {
  pcbiId: string;
  benchmarkName?: string;
  totalWeight: number;
  differenceFrom100: number;
  status: 'PASS' | 'WARNING';
}

export interface PCBIValidationSummary {
  totalRecords: number;
  validRecords: number;
  warningRecords: number;
  errorRecords: number;
  blockingErrorCount: number;
  warningCount: number;
  informationCount?: number;
  // Dataset breakdown
  masterRecordsCount?: number;
  weeklyRecordsCount?: number;
  constituentRecordsCount?: number;
  sourceRecordsCount?: number;
  unspscRecordsCount?: number;
  // Detailed audit metrics
  uniquePcbiIdsCount?: number;
  duplicateTechnicalIdsCount?: number;
  missingQualityCount?: number;
  missingBenchmarkabilityCount?: number;
  missingSourceCount?: number;
  missingUnspscCount?: number;
  invalidIndexValuesCount?: number;
  duplicateWeeklyRecordsCount?: number;
  constituentWeightIssuesCount?: number;
  sourcePendingCount?: number;
  // Quality distribution
  aQualityCount: number;
  bQualityCount: number;
  cQualityCount: number;
  unassignedQualityCount?: number;
  avgBenchmarkability: number;
  dateStart: string | null;
  dateEnd: string | null;
  issues: PCBIValidationIssue[];
  constituentTotals?: PCBIConstituentTotalSummary[];
}

export type PCBIVersionStatus = 'DRAFT' | 'VALIDATED' | 'PUBLISHED' | 'ARCHIVED';

export interface PCBIVersionMetrics {
  benchmark_count: number;
  weekly_records_count: number;
  constituent_count: number;
  unspsc_mappings_count: number;
  a_quality_count: number;
  b_quality_count: number;
  c_quality_count: number;
  total_benchmarkable_pct: number;
  date_start: string | null;
  date_end: string | null;
  warnings_count: number;
  errors_count: number;
}

export interface PCBIVersionRecord {
  id: string;
  version: string;
  upload_id: string;
  file_name: string;
  file_size_mb: number;
  upload_date: string;
  uploaded_by: string;
  effective_date: string;
  status: PCBIVersionStatus;
  metrics: PCBIVersionMetrics;
  validation_report_json?: string;
  error_records_json?: string;
  published_at?: string | null;
  published_by?: string | null;
}

export interface PCBIImportPayload {
  version: string;
  file_name: string;
  file_size_mb: number;
  uploaded_by: string;
  worksheets: PCBIWorksheetDetection[];
  mappings: Record<string, PCBIColumnMapping[]>;
  benchmarks: Record<string, unknown>[];
  weeklyIndices: Record<string, unknown>[];
  constituents: Record<string, unknown>[];
  sources: Record<string, unknown>[];
  unspscMappings: Record<string, unknown>[];
  validationSummary: PCBIValidationSummary;
}

export interface PCBIImportResult {
  success: boolean;
  version: string;
  upload_id: string;
  status: PCBIVersionStatus;
  import_date: string;
  successful_records: number;
  warning_records: number;
  error_records: number;
  records_excluded: number;
  pcbi_records: number;
  weekly_index_records: number;
  constituent_records: number;
  source_records: number;
  unspsc_mapping_records: number;
  validation_report_url?: string;
  error_records_url?: string;
}

// ==========================================
// PCBI V1.3.1 ARCHITECTURE QA & GAP GOVERNANCE TYPES
// ==========================================

export type PCBIDefinitionStatus =
  | 'DEFINED'
  | 'MISSING'
  | 'UNDER_REVIEW'
  | 'NOT_BENCHMARKABLE';

export type PCBIDataStatus =
  | 'COMPLETE'
  | 'PARTIAL_HISTORY'
  | 'NO_HISTORY'
  | 'FREQUENCY_MISMATCH'
  | 'SPECIFICATION_MISMATCH'
  | 'SOURCE_UNVERIFIED';

export type PCBISourceStatus =
  | 'CANDIDATE'
  | 'UNDER_VALIDATION'
  | 'VALIDATED'
  | 'REJECTED';

export type PCBIMethodologyStatus =
  | 'APPROVED'
  | 'METHODOLOGY_PENDING'
  | 'REJECTED'
  | 'NONE_REQUIRED';

export type PCBIReadinessStatus =
  | 'PRODUCTION_READY'
  | 'VALIDATED_CANDIDATE'
  | 'DATA_GAP_PARTIAL_HISTORY'
  | 'DATA_GAP_NO_HISTORY'
  | 'METHODOLOGY_PENDING'
  | 'SOURCE_UNVERIFIED'
  | 'CLASSIFICATION_CONFLICT'
  | 'NOT_BENCHMARKABLE'
  | 'READY_FOR_VALIDATION'
  | 'SOURCE_REQUIRED'
  | 'HISTORY_REQUIRED'
  | 'METHODOLOGY_REQUIRED'
  | 'SPECIFICATION_REVIEW'
  | 'PCBI_MISSING';

export type PCBIMatchEvaluation = 'MATCH' | 'MISMATCH' | 'UNDER_REVIEW';

export interface PCBIClassificationInput {
  materialCode: string;
  shortText?: string;
  module2Commodity?: string;
  module2SubCommodity?: string;
  module2Unspsc?: string;
  module2MaterialGroup?: string;
  module2Grade?: string;
  module2Specification?: string;
  module3Commodity?: string;
  module3Category?: string;
}

export interface PCBIClassificationValidationResult {
  isValid: boolean;
  status: 'VALIDATED' | 'CLASSIFICATION_CONFLICT';
  action: 'ALLOW' | 'BLOCK';
  conflictDetails?: string;
  classificationAuthority: 'MODULE_2_ONLY';
}

export interface PCBIMethodologyRecord {
  methodId: string;
  name: string;
  commodity: string;
  materialType: string;
  mathematicalRule: string;
  adjustmentPercentage?: number;
  status: 'APPROVED' | 'METHODOLOGY_PENDING' | 'REJECTED';
  sourceProvenance: string;
  approvedBy?: string;
  approvedDate?: string;
}

export interface PCBIMethodologyValidationResult {
  isApproved: boolean;
  status: 'APPROVED' | 'METHODOLOGY_PENDING' | 'REJECTED';
  action: 'APPLY' | 'ADMIN_ACTION_REQUIRED';
  methodId: string | null;
  mathematicalRule: string | null;
  adjustmentPercentage: number | null;
  reason?: string;
}

export interface PCBISourceValidationRecord {
  sourceId: string;
  sourceName: string;
  commodity: string;
  grade: string;
  specification: string;
  unit: string;
  geography: string;
  frequency: string;
  historicalCoverageYears: number;
  priceBasis: string;
  marketBasis: string;
  status: PCBISourceStatus;
  equivalenceProven: boolean;
  notes: string;
}

export interface PCBISourceValidationResult {
  sourceId: string;
  status: PCBISourceStatus;
  isValidated: boolean;
  validatedFields: {
    commodity: boolean;
    grade: boolean;
    specification: boolean;
    unit: boolean;
    geography: boolean;
    frequency: boolean;
    historicalCoverage: boolean;
    priceBasis: boolean;
    marketBasis: boolean;
  };
  equivalenceProven: boolean;
  rejectionReason?: string;
}

export interface PCBIProvenanceChain {
  observationId: string;
  sourceId: string;
  sourceDocument: string;
  pageTableRow: string;
  originalValue: number;
  originalUnit: string;
  originalFrequency: string;
  transformationRuleId: string | null;
  standardizedValue: number;
  approvalRecordId: string | null;
  isValid: boolean;
  validationStatus: 'VALIDATED' | 'BLOCKED';
  missingLinks: string[];
}

export interface PCBIPreviewSafetyRecord {
  executionId: string;
  mode: 'SIMULATION_ONLY';
  productionStatus: 'NOT_PRODUCTION';
  approvalStatus: 'NOT_APPROVED';
  pcbiObservationsWritten: 0;
  pcbiMasterCatalogWritten: 0;
  savingsEngineWritten: 0;
  module4Connected: false;
  sandboxIsolated: true;
  timestamp: string;
}

export interface PCBIGapMatrixRow {
  material: string;
  module2Commodity: string;
  unspsc: string;
  spend: number;
  transactions: number;
  pcbiId: string | null;
  definitionStatus: PCBIDefinitionStatus;
  dataStatus: PCBIDataStatus;
  sourceStatus: PCBISourceStatus;
  methodologyStatus: PCBIMethodologyStatus;
  historicalStartRequired: string;
  historicalEndRequired: string;
  historicalStartAvailable: string | null;
  historicalEndAvailable: string | null;
  frequencyRequired: string;
  frequencyAvailable: string | null;
  specificationMatch: PCBIMatchEvaluation;
  geographyMatch: PCBIMatchEvaluation;
  unitMatch: PCBIMatchEvaluation;
  actionRequired: string;
  readinessStatus: PCBIReadinessStatus;
}

export interface PCBISyntheticTestCase {
  testId: string;
  description: string;
  expected: string;
  actual: string;
  passed: boolean;
  details?: Record<string, unknown>;
}


