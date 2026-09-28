import { describe, it, expect } from 'vitest';
import {
  MODULE3_STATUS,
  PCBI_PILOT_BASE_PERIOD,
  PCBI_PILOT_BASE_INDEX,
  PCBI_PILOT_SUPPORTED_FORMATS,
  PCBI_HISTORY_THRESHOLDS,
  PCBI_FREQUENCY_GOVERNANCE_RULES,
  ANALYTICAL_PREVIEW_DISCLAIMER,
  PILOT_GOVERNANCE_LOCKS,
  PRODUCT_ACCEPTANCE_TEST_DEFINITIONS
} from '../../src/constants/pcbiPilotExpansion';

describe('PCBI Pilot Expansion Constants (Backend)', () => {
  it('should define module 3 status as PRODUCTION_READY_FOR_CONTROLLED_PILOT', () => {
    expect(MODULE3_STATUS).toBe('PRODUCTION_READY_FOR_CONTROLLED_PILOT');
    expect(PCBI_PILOT_BASE_PERIOD).toBe('2020-04');
    expect(PCBI_PILOT_BASE_INDEX).toBe(100.0);
  });

  it('should define supported upload formats', () => {
    expect(PCBI_PILOT_SUPPORTED_FORMATS).toEqual(['XLSX', 'XLS', 'CSV', 'PDF', 'JSON', 'TXT']);
  });

  it('should define history depth thresholds', () => {
    expect(PCBI_HISTORY_THRESHOLDS.COMPLETE_MIN_MONTHS).toBe(75);
    expect(PCBI_HISTORY_THRESHOLDS.PARTIAL_MIN_MONTHS).toBe(24);
    expect(PCBI_HISTORY_THRESHOLDS.NO_HISTORY_MAX_MONTHS).toBe(0);
  });

  it('should define frequency governance rules with strict blocking on unapproved conversions', () => {
    expect(PCBI_FREQUENCY_GOVERNANCE_RULES.WEEKLY_TO_WEEKLY.allowed).toBe(true);
    expect(PCBI_FREQUENCY_GOVERNANCE_RULES.MONTHLY_TO_MONTHLY.allowed).toBe(true);
    expect(PCBI_FREQUENCY_GOVERNANCE_RULES.FORTNIGHTLY_TO_WEEKLY.allowed).toBe(false);
    expect(PCBI_FREQUENCY_GOVERNANCE_RULES.MONTHLY_TO_WEEKLY.allowed).toBe(false);
    expect(PCBI_FREQUENCY_GOVERNANCE_RULES.QUARTERLY_TO_MONTHLY.allowed).toBe(false);
  });

  it('should enforce analytical preview disclaimer and governance locks', () => {
    expect(ANALYTICAL_PREVIEW_DISCLAIMER).toBe('ANALYTICAL PREVIEW — NOT SAVINGS');
    expect(PILOT_GOVERNANCE_LOCKS.MODULE1_FROZEN).toBe(true);
    expect(PILOT_GOVERNANCE_LOCKS.MODULE2_FROZEN).toBe(true);
    expect(PILOT_GOVERNANCE_LOCKS.PCBI_MASTER_IMMUTABLE).toBe(true);
    expect(PILOT_GOVERNANCE_LOCKS.MODULE4_DISCONNECTED).toBe(true);
    expect(PILOT_GOVERNANCE_LOCKS.SAVINGS_CALCULATED).toBe(0);
    expect(PILOT_GOVERNANCE_LOCKS.COMMERCIAL_PURCHASES).toBe(0);
  });

  it('should define all 20 product acceptance test definitions', () => {
    expect(PRODUCT_ACCEPTANCE_TEST_DEFINITIONS).toHaveLength(20);
    expect(PRODUCT_ACCEPTANCE_TEST_DEFINITIONS[0].testId).toBe('TEST_01');
    expect(PRODUCT_ACCEPTANCE_TEST_DEFINITIONS[19].testId).toBe('TEST_20');
  });
});
