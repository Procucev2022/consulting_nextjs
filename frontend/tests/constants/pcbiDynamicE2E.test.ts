import { describe, it, expect } from 'vitest';
import {
  PCBI_SUPPORTED_EXTRACTION_FORMATS,
  PCBI_INGESTION_PIPELINE_STEPS,
  PCBI_ADMIN_CONFIRMATION_OPTIONS,
  PCBI_CATALOG_OPERATION_TYPES,
  PCBI_MISMATCH_DIMENSIONS,
  PCBI_FINAL_GATES,
  PCBI_METHODOLOGY_STATUS_MESSAGES,
  PCBI_E2E_SAFETY_LOCK
} from '../../src/constants/pcbiDynamicE2E';

describe('PCBI Dynamic E2E Constants (Frontend)', () => {
  it('should define all 6 supported extraction formats', () => {
    expect(PCBI_SUPPORTED_EXTRACTION_FORMATS).toEqual(['XLSX', 'XLS', 'CSV', 'PDF', 'JSON', 'TXT']);
  });

  it('should define all 13 ingestion pipeline steps', () => {
    expect(PCBI_INGESTION_PIPELINE_STEPS).toContain('UPLOAD');
    expect(PCBI_INGESTION_PIPELINE_STEPS).toContain('STANDARDIZATION_PREVIEW');
    expect(PCBI_INGESTION_PIPELINE_STEPS.length).toBe(13);
  });

  it('should define admin confirmation options', () => {
    expect(PCBI_ADMIN_CONFIRMATION_OPTIONS.REJECT).toBe('REJECT');
    expect(PCBI_ADMIN_CONFIRMATION_OPTIONS.APPROVE_AND_ADD).toBe('APPROVE & ADD TO PCBI CATALOG');
  });

  it('should define catalog operations and mismatch dimensions', () => {
    expect(PCBI_CATALOG_OPERATION_TYPES).toHaveLength(7);
    expect(PCBI_MISMATCH_DIMENSIONS).toHaveLength(7);
    expect(PCBI_FINAL_GATES).toContain('E2E_VALIDATED_WITH_GAPS');
    expect(PCBI_METHODOLOGY_STATUS_MESSAGES.APPROVAL_REQUIRED).toBe('METHODOLOGY_APPROVAL_REQUIRED');
  });

  it('should enforce safety lock constraints', () => {
    expect(PCBI_E2E_SAFETY_LOCK.MODULE_1).toBe('FROZEN');
    expect(PCBI_E2E_SAFETY_LOCK.MODULE_2).toBe('FROZEN_SOLE_CLASSIFICATION_AUTHORITY');
    expect(PCBI_E2E_SAFETY_LOCK.PRODUCTION_BENCHMARK_VALUES).toBe(0);
    expect(PCBI_E2E_SAFETY_LOCK.SAVINGS_CALCULATED).toBe(0);
  });
});
