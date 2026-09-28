/**
 * PCBI Module 3 Controlled Benchmark Engine Validation Constants
 */

import type {
  PCBIControlledSeriesCategory,
  PCBICalculationFinalGate
} from '../types/pcbiControlledValidation';

export const PCBI_CONTROLLED_12_CATEGORIES: readonly PCBIControlledSeriesCategory[] = [
  'VERIFIED_FREE_DIRECT',
  'OFFICIAL_INDEX',
  'MONTHLY_OFFICIAL_INDEX',
  'WEEKLY_SOURCE',
  'FORTNIGHTLY_SOURCE',
  'METAL_CONSTITUENT',
  'STAINLESS_STEEL_GRADE',
  'FERROALLOY',
  'SCRAP',
  'PARTIAL_HISTORY',
  'NO_HISTORY',
  'SPECIFICATION_MISMATCH'
] as const;

export const PCBI_ANALYTICAL_PREVIEW_DISCLAIMER = 'ANALYTICAL PREVIEW — NOT SAVINGS' as const;

export const PCBI_NEGATIVE_TEST_CODES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'] as const;

export const PCBI_CALCULATION_GATES: readonly PCBICalculationFinalGate[] = [
  'CALCULATION_VALIDATED',
  'CALCULATION_VALIDATED_WITH_GAPS',
  'CALCULATION_BLOCKED'
] as const;

export const PCBI_BASE_PERIOD_INDEX = 100.0;

export const PCBI_VALIDATION_SAFETY_LOCK = {
  MODULE_1: 'FROZEN',
  MODULE_2: 'FROZEN',
  PCBI_MASTER_V1_0: 'IMMUTABLE',
  MODULE_4: 'DISCONNECTED',
  SAVINGS_CALCULATED: 0,
  PROCUREMENT_OPPORTUNITIES_CALCULATED: 0
} as const;
