import { describe, it, expect } from 'vitest';
import {
  FINAL_MODULE_3_STATUS,
  PCBI_PRODUCTION_READY_BASE_PERIOD,
  PCBI_PRODUCTION_READY_BASE_INDEX,
  PCBI_V16_DEFAULT_MATERIALITY_THRESHOLD_INR,
  PCBI_V16_MATERIALITY_THRESHOLD_CR,
  PCBI_UNIVERSAL_FILE_FORMATS,
  PCBI_NATIVE_FREQUENCIES_V16,
  PCBI_PROVENANCE_10_LINKS,
  PCBI_ACCEPTANCE_TESTS_A_TO_T_DEFINITIONS,
  REUSABLE_PCBI_SCALE_LIBRARIES
} from '../../src/constants/pcbiProductionReady';

describe('PCBI Production Ready Constants (backend/src/constants/pcbiProductionReady.ts)', () => {
  it('should define core module status and calculation base', () => {
    expect(FINAL_MODULE_3_STATUS).toBe('PRODUCTION_READY_DYNAMIC_PCBI');
    expect(PCBI_PRODUCTION_READY_BASE_PERIOD).toBe('2020-04');
    expect(PCBI_PRODUCTION_READY_BASE_INDEX).toBe(100.0);
    expect(PCBI_V16_DEFAULT_MATERIALITY_THRESHOLD_INR).toBe(10000000);
    expect(PCBI_V16_MATERIALITY_THRESHOLD_CR).toBe('₹1.00 Cr');
  });

  it('should define universal formats and native frequencies', () => {
    expect(PCBI_UNIVERSAL_FILE_FORMATS).toContain('XLSX');
    expect(PCBI_UNIVERSAL_FILE_FORMATS).toContain('PDF');
    expect(PCBI_UNIVERSAL_FILE_FORMATS).toContain('CSV');
    expect(PCBI_NATIVE_FREQUENCIES_V16).toEqual([
      'DAILY',
      'WEEKLY',
      'FORTNIGHTLY',
      'MONTHLY',
      'QUARTERLY',
      'ANNUAL'
    ]);
  });

  it('should define all 10 mandatory provenance links', () => {
    expect(PCBI_PROVENANCE_10_LINKS.length).toBe(10);
    expect(PCBI_PROVENANCE_10_LINKS[0]).toBe('LINK_01_RAW_DOWNLOAD');
    expect(PCBI_PROVENANCE_10_LINKS[9]).toBe('LINK_10_MODULE3_BENCHMARK_INPUT');
  });

  it('should define 20 product acceptance tests A through T and scale libraries', () => {
    expect(PCBI_ACCEPTANCE_TESTS_A_TO_T_DEFINITIONS.length).toBe(20);
    expect(PCBI_ACCEPTANCE_TESTS_A_TO_T_DEFINITIONS[0].testKey).toBe('A');
    expect(PCBI_ACCEPTANCE_TESTS_A_TO_T_DEFINITIONS[19].testKey).toBe('T');

    expect(REUSABLE_PCBI_SCALE_LIBRARIES.commodities.length).toBeGreaterThanOrEqual(8);
    expect(REUSABLE_PCBI_SCALE_LIBRARIES.methodologies.length).toBeGreaterThanOrEqual(3);
  });
});
