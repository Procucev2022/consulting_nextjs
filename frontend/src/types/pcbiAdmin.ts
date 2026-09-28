/**
 * PCBI Master Upload, Validation, Versioning & Publishing Data Types
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
