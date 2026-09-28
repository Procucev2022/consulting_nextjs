import { describe, it, expect } from 'vitest';
import {
  createValidationContext,
  extractFieldValue,
  validateMasterRow,
  validateWeeklyRow,
  validateConstituentsRow
} from '../../src/utils/pcbiRowValidators';

describe('PCBI Row Validators Unit Tests (frontend/src/utils/pcbiRowValidators.ts)', () => {
  it('createValidationContext should initialize empty state', () => {
    const ctx = createValidationContext();
    expect(ctx.issues).toHaveLength(0);
    expect(ctx.pcbiIdsSeen.size).toBe(0);
    expect(ctx.uniquePcbiIds.size).toBe(0);
    expect(ctx.weeklyKeySeen.size).toBe(0);
    expect(ctx.qualityCounts).toEqual({ A: 0, B: 0, C: 0 });
    expect(ctx.totalBenchmarkabilitySum).toBe(0);
    expect(ctx.missingQualityCount).toBe(0);
    expect(ctx.missingBenchmarkabilityCount).toBe(0);
  });

  it('extractFieldValue should look up via column mapping or direct key', () => {
    const row = { 'Excel Col': 'Value1', DirectKey: 'Value2' };
    const mapping = new Map([['Excel Col', 'target_field']]);

    expect(extractFieldValue(row, mapping, 'target_field')).toBe('Value1');
    expect(extractFieldValue(row, mapping, 'DirectKey')).toBe('Value2');
  });

  it('validateMasterRow should detect valid row and increment metrics', () => {
    const ctx = createValidationContext();
    const row = {
      pcbi_id: 'PCBI-100',
      benchmark_name: 'Aluminium Ingot',
      benchmark_type: 'DIRECT',
      category: 'Metals',
      quality_rating: 'A',
      benchmarkability_percent: 85
    };
    validateMasterRow(row, 0, new Map(), ctx);

    expect(ctx.issues).toHaveLength(0);
    expect(ctx.qualityCounts.A).toBe(1);
    expect(ctx.totalBenchmarkabilitySum).toBe(85);
    expect(ctx.uniquePcbiIds.has('PCBI-100')).toBe(true);
  });

  it('validateMasterRow should handle invalid percentage and non-standard quality', () => {
    const ctx = createValidationContext();
    const row = {
      pcbi_id: 'PCBI-101',
      benchmark_name: 'Copper Cathode',
      benchmark_type: 'DIRECT',
      category: 'Metals',
      quality_rating: 'X',
      benchmarkability_percent: 150
    };
    validateMasterRow(row, 0, new Map(), ctx);

    expect(ctx.issues.some((i) => i.rule === 'UNKNOWN_QUALITY_RATING')).toBe(true);
    expect(ctx.issues.some((i) => i.rule === 'INVALID_PERCENTAGE')).toBe(true);
  });

  it('validateMasterRow should handle missing benchmarkability and missing quality as null without defaulting', () => {
    const ctx = createValidationContext();
    const row = {
      pcbi_id: 'PCBI-102',
      benchmark_name: 'Custom Fabricated Pipe',
      benchmark_type: 'COMPOSITE_PROXY',
      category: 'Piping',
      quality_rating: '',
      benchmarkability_percent: ''
    };
    validateMasterRow(row, 0, new Map(), ctx);

    expect(ctx.missingQualityCount).toBe(1);
    expect(ctx.missingBenchmarkabilityCount).toBe(1);
    expect(ctx.qualityCounts.B).toBe(0); // MUST NOT default to B!
    expect(ctx.issues.some((i) => i.rule === 'MISSING_DATA' && i.column === 'Quality Rating')).toBe(true);
    expect(ctx.issues.some((i) => i.rule === 'MISSING_DATA' && i.column === 'Benchmarkability %')).toBe(true);
  });

  it('validateMasterRow should disambiguate technical IDs for distinct benchmark definitions and flag true duplicates', () => {
    const ctx = createValidationContext();
    const row1 = {
      pcbi_id: 'ALUMINIUM',
      benchmark_name: 'Aluminium Grade A',
      benchmark_type: 'DIRECT',
      category: 'Metals',
      geography: 'GLOBAL',
      currency: 'USD',
      benchmark_unit: 'MT'
    };
    const row2 = {
      pcbi_id: 'ALUMINIUM',
      benchmark_name: 'Aluminium Billet',
      benchmark_type: 'COMPOSITE',
      category: 'Metals',
      geography: 'US',
      currency: 'USD',
      benchmark_unit: 'LBS'
    };
    const row3Dup = {
      pcbi_id: 'ALUMINIUM',
      benchmark_name: 'Aluminium Grade A',
      benchmark_type: 'DIRECT',
      category: 'Metals',
      geography: 'GLOBAL',
      currency: 'USD',
      benchmark_unit: 'MT'
    };

    validateMasterRow(row1, 0, new Map(), ctx);
    validateMasterRow(row2, 1, new Map(), ctx);
    validateMasterRow(row3Dup, 2, new Map(), ctx);

    expect(ctx.technicalIdsGenerated.has('ALUMINIUM_2')).toBe(true);
    expect(ctx.issues.some((i) => i.rule === 'TECHNICAL_ID_DISAMBIGUATED')).toBe(true);
    expect(ctx.issues.some((i) => i.rule === 'DUPLICATE_PCBI_ID')).toBe(true);
  });

  it('validateWeeklyRow should validate valid week date and index value', () => {
    const ctx = createValidationContext();
    const row = {
      pcbi_id: 'PCBI-100',
      week_start: '2022-01-01',
      index_value: 105.5
    };
    validateWeeklyRow(row, 0, new Map(), ctx);

    expect(ctx.issues).toHaveLength(0);
    expect(ctx.dateMin).toBe('2022-01-01');
    expect(ctx.dateMax).toBe('2022-01-01');
  });

  it('validateWeeklyRow should record warning for dates outside initial period', () => {
    const ctx = createValidationContext();
    const oldRow = { pcbi_id: 'PCBI-100', week_start: '2019-12-01', index_value: 100 };
    const futureRow = { pcbi_id: 'PCBI-100', week_start: '2027-01-01', index_value: 100 };

    validateWeeklyRow(oldRow, 0, new Map(), ctx);
    validateWeeklyRow(futureRow, 1, new Map(), ctx);

    expect(ctx.issues.some((i) => i.rule === 'OUTSIDE_INITIAL_PERIOD')).toBe(true);
    expect(ctx.issues.some((i) => i.rule === 'FUTURE_OR_EXTENDED_PERIOD')).toBe(true);
  });

  it('validateWeeklyRow should record INFORMATION for SOURCE_PENDING index', () => {
    const ctx = createValidationContext();
    const row = {
      pcbi_id: 'PCBI-100',
      week_start: '2022-01-01',
      index_value: '',
      note: 'SOURCE_PENDING'
    };
    validateWeeklyRow(row, 0, new Map(), ctx);

    expect(ctx.sourcePendingCount).toBe(1);
    expect(ctx.issues.some((i) => i.rule === 'SOURCE_PENDING_INDEX' && i.severity === 'INFORMATION')).toBe(true);
  });

  it('validateConstituentsRow should accumulate valid weights', () => {
    const ctx = createValidationContext();
    const row = {
      pcbi_id: 'PCBI-100',
      constituent_name: 'Iron Ore',
      weight_percent: 45
    };
    validateConstituentsRow(row, 0, new Map(), ctx);

    expect(ctx.issues).toHaveLength(0);
    expect(ctx.constituentWeightsByPcbi.get('PCBI-100')?.total).toBe(45);
  });

  it('validateConstituentsRow should flag missing name and negative weight', () => {
    const ctx = createValidationContext();
    const row = {
      pcbi_id: 'PCBI-100',
      constituent_name: '',
      weight_percent: -10
    };
    validateConstituentsRow(row, 0, new Map(), ctx);

    expect(ctx.issues.some((i) => i.rule === 'REQUIRED_FIELD_MISSING')).toBe(true);
    expect(ctx.issues.some((i) => i.rule === 'INVALID_WEIGHT_PERCENT')).toBe(true);
  });

  it('validateWeeklyRow should recognize SOURCE_PENDING from Data Status column', () => {
    const ctx = createValidationContext();
    const row = {
      pcbi_id: 'PCBI-100',
      week_start: '2022-01-01',
      index_value: '',
      'Data Status': 'SOURCE_PENDING_REVIEW'
    };
    validateWeeklyRow(row, 0, new Map(), ctx);
    expect(ctx.issues.some((i) => i.rule === 'SOURCE_PENDING_INDEX')).toBe(true);
  });
});
