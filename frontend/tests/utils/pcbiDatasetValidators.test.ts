import { describe, it, expect } from 'vitest';
import {
  validateConstituentsRow,
  checkConstituentTotals,
  validateSourcesRow,
  validateUnspscRow
} from '../../src/utils/pcbiDatasetValidators';
import { createValidationContext } from '../../src/utils/pcbiRowValidators';

describe('pcbiDatasetValidators Unit Tests', () => {
  it('validates constituent rows with missing pcbiId, missing name, and invalid weight', () => {
    const ctx = createValidationContext();
    const map = new Map<string, string>([
      ['PCBI ID', 'pcbi_id'],
      ['Constituent', 'constituent_name'],
      ['Weight', 'weight_percent']
    ]);

    // Missing PCBI ID & missing name
    validateConstituentsRow({}, 0, map, ctx);
    expect(ctx.issues.some((i) => i.rule === 'REQUIRED_FIELD_MISSING' && i.column === 'PCBI ID')).toBe(true);
    expect(ctx.issues.some((i) => i.rule === 'REQUIRED_FIELD_MISSING' && i.column === 'Constituent Name')).toBe(true);

    // Invalid weights: negative and > 100 and non-numeric
    validateConstituentsRow({ 'PCBI ID': 'BRG-1', Constituent: 'Steel', Weight: -5 }, 1, map, ctx);
    validateConstituentsRow({ 'PCBI ID': 'BRG-1', Constituent: 'Steel', Weight: 150 }, 2, map, ctx);
    validateConstituentsRow({ 'PCBI ID': 'BRG-1', Constituent: 'Steel', Weight: 'invalid' }, 3, map, ctx);

    const weightErrors = ctx.issues.filter((i) => i.rule === 'INVALID_WEIGHT_PERCENT');
    expect(weightErrors.length).toBe(3);

    // Valid row with raw_material and residual_percent / benchmarkability_percent mappings
    const mapAlt = new Map<string, string>([
      ['Id', 'pcbi_id'],
      ['Material', 'raw_material'],
      ['Residual', 'residual_percent']
    ]);
    validateConstituentsRow({ Id: 'ALU-1', Material: 'Bauxite', Residual: 60 }, 4, mapAlt, ctx);
    expect(ctx.constituentWeightsByPcbi.get('ALU-1')?.total).toBe(60);

    const mapBench = new Map<string, string>([
      ['Id', 'pcbi_id'],
      ['Material', 'constituent_name'],
      ['BenchPct', 'benchmarkability_percent']
    ]);
    validateConstituentsRow({ Id: 'ALU-1', Material: 'Alumina', BenchPct: 40 }, 5, mapBench, ctx);
    expect(ctx.constituentWeightsByPcbi.get('ALU-1')?.total).toBe(100);
  });

  it('checks constituent totals and returns PASS for 100% and WARNING for non-100%', () => {
    const ctx = createValidationContext();
    const map = new Map<string, { total: number; name?: string }>();
    map.set('PCBI-PASS', { total: 100, name: 'Pass Index' });
    map.set('PCBI-UNDER', { total: 70, name: 'Under Index' });
    map.set('PCBI-OVER', { total: 105.5, name: 'Over Index' });

    const summaries = checkConstituentTotals(map, ctx);
    expect(summaries).toHaveLength(3);

    const passItem = summaries.find((s) => s.pcbiId === 'PCBI-PASS');
    expect(passItem?.status).toBe('PASS');
    expect(passItem?.differenceFrom100).toBe(0);

    const underItem = summaries.find((s) => s.pcbiId === 'PCBI-UNDER');
    expect(underItem?.status).toBe('WARNING');
    expect(underItem?.differenceFrom100).toBe(-30);

    const overItem = summaries.find((s) => s.pcbiId === 'PCBI-OVER');
    expect(overItem?.status).toBe('WARNING');
    expect(overItem?.differenceFrom100).toBe(5.5);

    expect(ctx.constituentWeightIssuesCount).toBe(2);
  });

  it('validates sources rows for source_name and fallback source', () => {
    const ctx = createValidationContext();
    const map = new Map<string, string>([['Source Family', 'source_name']]);

    validateSourcesRow({ 'Source Family': 'Platts S&P' }, 0, map, ctx);
    expect(ctx.missingSourceCount).toBe(0);

    const mapAlt = new Map<string, string>([['Source Provider', 'source']]);
    validateSourcesRow({ 'Source Provider': 'Argus Media' }, 1, mapAlt, ctx);
    expect(ctx.missingSourceCount).toBe(0);

    // Missing source name
    validateSourcesRow({}, 2, map, ctx);
    expect(ctx.missingSourceCount).toBe(1);
    expect(ctx.issues.some((i) => i.sheetName === 'SOURCES' && i.rule === 'REQUIRED_FIELD_MISSING')).toBe(true);
  });

  it('validates unspsc rows for unspsc_code and fallback canonical_key', () => {
    const ctx = createValidationContext();
    const map = new Map<string, string>([['UNSPSC Code', 'unspsc_code']]);

    validateUnspscRow({ 'UNSPSC Code': '30111601' }, 0, map, ctx);
    expect(ctx.missingUnspscCount).toBe(0);

    const mapAlt = new Map<string, string>([['Key', 'canonical_key']]);
    validateUnspscRow({ Key: 'COMMODITY_STEEL' }, 1, mapAlt, ctx);
    expect(ctx.missingUnspscCount).toBe(0);

    // Missing UNSPSC identifier
    validateUnspscRow({}, 2, map, ctx);
    expect(ctx.missingUnspscCount).toBe(1);
    expect(ctx.issues.some((i) => i.sheetName === 'UNSPSC_MAPPING' && i.rule === 'REQUIRED_FIELD_MISSING')).toBe(true);
  });
});
