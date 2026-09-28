/**
 * PCBI Module 3 End-to-End Dynamic Ingestion, Gap Alerting & Catalog Governance Constants
 */

import type {
  PCBIExtractionFormat,
  PCBIFinalGate,
  PCBIMismatchDimension
} from '../types/pcbiDynamicE2E';

export const PCBI_SUPPORTED_EXTRACTION_FORMATS: readonly PCBIExtractionFormat[] = [
  'XLSX',
  'XLS',
  'CSV',
  'PDF',
  'JSON',
  'TXT'
] as const;

export const PCBI_INGESTION_PIPELINE_STEPS: readonly string[] = [
  'UPLOAD',
  'FILE_VALIDATION',
  'DATA_EXTRACTION',
  'COLUMN_DETECTION',
  'DATE_DETECTION',
  'PRICE_VALUE_DETECTION',
  'UNIT_DETECTION',
  'CURRENCY_DETECTION',
  'FREQUENCY_DETECTION',
  'SOURCE_IDENTIFICATION',
  'SERIES_IDENTIFICATION',
  'DATA_QUALITY_CHECK',
  'STANDARDIZATION_PREVIEW'
] as const;

export const PCBI_ADMIN_CONFIRMATION_OPTIONS = {
  REJECT: 'REJECT',
  APPROVE_AND_ADD: 'APPROVE & ADD TO PCBI CATALOG'
} as const;

export const PCBI_CATALOG_OPERATION_TYPES = [
  'ADD_COMMODITY',
  'ADD_SERIES',
  'ADD_SOURCE',
  'ADD_HISTORY',
  'UPDATE_SERIES',
  'VERSION_HISTORY',
  'DEPRECATE_SERIES'
] as const;

export const PCBI_MISMATCH_DIMENSIONS: readonly PCBIMismatchDimension[] = [
  'grade',
  'specification',
  'unit',
  'currency',
  'geography',
  'date_coverage',
  'frequency'
] as const;

export const PCBI_FINAL_GATES: readonly PCBIFinalGate[] = [
  'E2E_VALIDATED',
  'E2E_VALIDATED_WITH_GAPS',
  'E2E_BLOCKED'
] as const;

export const PCBI_METHODOLOGY_STATUS_MESSAGES = {
  APPROVAL_REQUIRED: 'METHODOLOGY_APPROVAL_REQUIRED',
  APPROVED: 'APPROVED',
  PENDING: 'METHODOLOGY_PENDING'
} as const;

export const PCBI_E2E_SAFETY_LOCK = {
  MODULE_1: 'FROZEN',
  MODULE_2: 'FROZEN_SOLE_CLASSIFICATION_AUTHORITY',
  PCBI_MASTER_V1_0: 'IMMUTABLE',
  MODULE_3: 'PRE_PRODUCTION',
  MODULE_4: 'DISCONNECTED',
  PRODUCTION_BENCHMARK_VALUES: 0,
  SAVINGS_CALCULATED: 0
} as const;
