/**
 * Types & Interfaces for Commodity PCBI Observation Workbook Parser & Quality Engine
 */

export interface ExtractedObservationRecord {
  date: string;
  value: number;
  unit: string;
  seriesId?: string;
  sourceText?: string;
  qualityRating?: string;
  note?: string;
  underlyingPriceUnit?: string;
  underlyingCurrency?: string;
  effectiveDate?: string;
}

export interface ObservationStepChange {
  date: string;
  value: number;
  delta: number;
  effectiveDate?: string;
}

export interface ObservationQualityReport {
  totalObservations: number;
  detectedFrequency: 'WEEKLY' | 'MONTHLY' | 'DAILY' | 'ANNUAL' | 'NONE';
  requiredFrequency?: string;
  frequencyStatus: 'VALIDATED' | 'MISMATCH' | 'INSUFFICIENT_DATA';
  frequencyLabel: string;
  missingPeriodsCount: number;
  duplicateDatesCount: number;
  unitConsistency: string;
  isUnitUniform: boolean;
  detectedMetricType: 'INDEX_POINTS' | 'PRICE' | 'OTHER';
  underlyingPriceUnit: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  hasFrequencyConflict: boolean;
  conflictMessage?: string;
  provenanceHash?: string;
  specificationStatus?: 'CONFIRMED' | 'PENDING_VERIFICATION';
  specificationRationale?: string;
  stepChanges?: ObservationStepChange[];
}

export interface WorkbookExtractionResult {
  sheetName: string;
  totalRowsRead: number;
  validObservations: ExtractedObservationRecord[];
  extractedCount: number;
  confidenceScore: number;
  detectedDateColumn: string;
  detectedPriceColumn: string;
  detectedSeriesId?: string;
  detectedSourceName?: string;
  detectedSourceUrl?: string;
  detectedPublisher?: string;
  detectedMetricType?: 'INDEX_POINTS' | 'PRICE' | 'OTHER';
  underlyingPriceUnit?: string;
  qualityReport?: ObservationQualityReport;
  provenanceHash?: string;
  status: 'EXTRACTED' | 'EMPTY' | 'INVALID_FORMAT';
  errorMessage?: string;
}
