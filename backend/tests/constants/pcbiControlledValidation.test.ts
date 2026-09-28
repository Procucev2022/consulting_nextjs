import { describe, it, expect } from 'vitest';
import {
  PCBI_CONTROLLED_12_CATEGORIES,
  PCBI_ANALYTICAL_PREVIEW_DISCLAIMER,
  PCBI_NEGATIVE_TEST_CODES,
  PCBI_CALCULATION_GATES,
  PCBI_BASE_PERIOD_INDEX,
  PCBI_VALIDATION_SAFETY_LOCK
} from '../../src/constants/pcbiControlledValidation';

describe('PCBI Controlled Validation Constants (Backend)', () => {
  it('should define all 12 controlled series categories', () => {
    expect(PCBI_CONTROLLED_12_CATEGORIES).toHaveLength(12);
    expect(PCBI_CONTROLLED_12_CATEGORIES).toContain('VERIFIED_FREE_DIRECT');
    expect(PCBI_CONTROLLED_12_CATEGORIES).toContain('OFFICIAL_INDEX');
    expect(PCBI_CONTROLLED_12_CATEGORIES).toContain('MONTHLY_OFFICIAL_INDEX');
    expect(PCBI_CONTROLLED_12_CATEGORIES).toContain('WEEKLY_SOURCE');
    expect(PCBI_CONTROLLED_12_CATEGORIES).toContain('FORTNIGHTLY_SOURCE');
    expect(PCBI_CONTROLLED_12_CATEGORIES).toContain('METAL_CONSTITUENT');
    expect(PCBI_CONTROLLED_12_CATEGORIES).toContain('STAINLESS_STEEL_GRADE');
    expect(PCBI_CONTROLLED_12_CATEGORIES).toContain('FERROALLOY');
    expect(PCBI_CONTROLLED_12_CATEGORIES).toContain('SCRAP');
    expect(PCBI_CONTROLLED_12_CATEGORIES).toContain('PARTIAL_HISTORY');
    expect(PCBI_CONTROLLED_12_CATEGORIES).toContain('NO_HISTORY');
    expect(PCBI_CONTROLLED_12_CATEGORIES).toContain('SPECIFICATION_MISMATCH');
  });

  it('should define safe analytical preview disclaimer', () => {
    expect(PCBI_ANALYTICAL_PREVIEW_DISCLAIMER).toBe('ANALYTICAL PREVIEW — NOT SAVINGS');
  });

  it('should define 10 negative test codes and calculation gates', () => {
    expect(PCBI_NEGATIVE_TEST_CODES).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']);
    expect(PCBI_CALCULATION_GATES).toEqual([
      'CALCULATION_VALIDATED',
      'CALCULATION_VALIDATED_WITH_GAPS',
      'CALCULATION_BLOCKED'
    ]);
    expect(PCBI_BASE_PERIOD_INDEX).toBe(100.0);
  });

  it('should enforce safety lock constants', () => {
    expect(PCBI_VALIDATION_SAFETY_LOCK.MODULE_1).toBe('FROZEN');
    expect(PCBI_VALIDATION_SAFETY_LOCK.MODULE_2).toBe('FROZEN');
    expect(PCBI_VALIDATION_SAFETY_LOCK.PCBI_MASTER_V1_0).toBe('IMMUTABLE');
    expect(PCBI_VALIDATION_SAFETY_LOCK.MODULE_4).toBe('DISCONNECTED');
    expect(PCBI_VALIDATION_SAFETY_LOCK.SAVINGS_CALCULATED).toBe(0);
    expect(PCBI_VALIDATION_SAFETY_LOCK.PROCUREMENT_OPPORTUNITIES_CALCULATED).toBe(0);
  });
});
