import { describe, it, expect } from 'vitest';
import {
  PCBI_CONTROLLED_12_CATEGORIES,
  PCBI_ANALYTICAL_PREVIEW_DISCLAIMER,
  PCBI_NEGATIVE_TEST_CODES,
  PCBI_CALCULATION_GATES,
  PCBI_BASE_PERIOD_INDEX,
  PCBI_VALIDATION_SAFETY_LOCK
} from '../../src/constants/pcbiControlledValidation';

describe('PCBI Controlled Validation Constants (Frontend)', () => {
  it('should define all 12 controlled series categories', () => {
    expect(PCBI_CONTROLLED_12_CATEGORIES).toHaveLength(12);
    expect(PCBI_CONTROLLED_12_CATEGORIES).toContain('VERIFIED_FREE_DIRECT');
    expect(PCBI_CONTROLLED_12_CATEGORIES).toContain('OFFICIAL_INDEX');
    expect(PCBI_CONTROLLED_12_CATEGORIES).toContain('FORTNIGHTLY_SOURCE');
  });

  it('should define analytical preview disclaimer and test codes', () => {
    expect(PCBI_ANALYTICAL_PREVIEW_DISCLAIMER).toBe('ANALYTICAL PREVIEW — NOT SAVINGS');
    expect(PCBI_NEGATIVE_TEST_CODES).toHaveLength(10);
    expect(PCBI_CALCULATION_GATES).toContain('CALCULATION_VALIDATED_WITH_GAPS');
    expect(PCBI_BASE_PERIOD_INDEX).toBe(100.0);
  });

  it('should enforce strict safety lock constraints', () => {
    expect(PCBI_VALIDATION_SAFETY_LOCK.MODULE_1).toBe('FROZEN');
    expect(PCBI_VALIDATION_SAFETY_LOCK.MODULE_2).toBe('FROZEN');
    expect(PCBI_VALIDATION_SAFETY_LOCK.SAVINGS_CALCULATED).toBe(0);
  });
});
