import { describe, it, expect } from 'vitest';
import {
  normalizeHeader,
  parseExcelDate,
  detectSheetType,
  detectWorksheets,
  autoMapColumns
} from '../../src/utils/pcbiParser';

describe('PCBI Parser & Worksheet Detection (frontend/src/utils/pcbiParser.ts)', () => {
  it('normalizeHeader should lowercase and clean punctuation and extra spaces', () => {
    expect(normalizeHeader('  PCBI_ID / Key  ')).toBe('pcbi id key');
    expect(normalizeHeader('Benchmarkability %')).toBe('benchmarkability');
    expect(normalizeHeader('Canonical Benchmark Key')).toBe('canonical benchmark key');
  });

  it('parseExcelDate should parse numeric Excel serial dates', () => {
    // 43927 in Excel is 2020-04-05
    const parsed = parseExcelDate(43927);
    expect(parsed).toMatch(/^2020-04-0[456]$/);
  });

  it('parseExcelDate should parse standard date strings', () => {
    expect(parseExcelDate('2020-04-01')).toBe('2020-04-01');
    expect(parseExcelDate('2026-07-31T00:00:00.000Z')).toBe('2026-07-31');
  });

  it('parseExcelDate should return null for invalid inputs', () => {
    expect(parseExcelDate(null)).toBeNull();
    expect(parseExcelDate(undefined)).toBeNull();
    expect(parseExcelDate('')).toBeNull();
    expect(parseExcelDate('invalid-date')).toBeNull();
    expect(parseExcelDate(-5)).toBeNull();
  });

  it('detectSheetType should identify sheet by name keywords', () => {
    expect(detectSheetType('PCBI_Benchmark_Master', []).type).toBe('PCBI_MASTER');
    expect(detectSheetType('Weekly_Index', []).type).toBe('WEEKLY_INDEX');
    expect(detectSheetType('PCBI_Constituents', []).type).toBe('CONSTITUENTS');
    expect(detectSheetType('Source_Registry', []).type).toBe('SOURCES');
    expect(detectSheetType('UNSPSC_Mapping', []).type).toBe('UNSPSC_MAPPING');
    expect(detectSheetType('README', []).type).toBe('OTHER');
  });

  it('detectSheetType should identify sheet by headers heuristic when name is generic', () => {
    const weeklyHeaders = ['Date', 'Index Value', 'Source'];
    expect(detectSheetType('Sheet1', weeklyHeaders).type).toBe('WEEKLY_INDEX');

    const constHeaders = ['Component', 'Cost Driver', 'Methodology'];
    expect(detectSheetType('Data_Sheet', constHeaders).type).toBe('CONSTITUENTS');

    const masterHeaders = ['PCBI ID', 'Category', 'Benchmark'];
    expect(detectSheetType('Table1', masterHeaders).type).toBe('PCBI_MASTER');

    const unknownHeaders = ['Foo', 'Bar', 'Baz'];
    expect(detectSheetType('Unknown_Sheet', unknownHeaders).type).toBe('OTHER');
  });

  it('detectWorksheets should return metadata for all sheets in workbook', () => {
    const sheetNames = ['PCBI_Benchmark_Master', 'Weekly_Index', 'README'];
    const dataMap = {
      PCBI_Benchmark_Master: [{ 'PCBI ID': 'PCBI-001', Category: 'Steel' }],
      Weekly_Index: [{ 'Week Start': '2020-04-01', 'Index Value': 100 }],
      README: [{ Field: 'Version', Value: '1.0' }]
    };

    const detected = detectWorksheets(sheetNames, dataMap);
    expect(detected).toHaveLength(3);
    expect(detected[0].detectedType).toBe('PCBI_MASTER');
    expect(detected[0].rowCount).toBe(1);
    expect(detected[1].detectedType).toBe('WEEKLY_INDEX');
    expect(detected[2].detectedType).toBe('OTHER');
  });

  it('autoMapColumns should match Excel headers to target database schema fields', () => {
    const masterColumns = [
      'PCBI ID',
      'Canonical Benchmark Key',
      'PCBI Category',
      'Benchmark',
      'Quality Rating',
      'Benchmarkability %',
      'Residual %',
      'Unknown Column'
    ];
    const sampleRows = [
      {
        'PCBI ID': 'PCBI-0001',
        'Canonical Benchmark Key': 'ALUMINIUM',
        'PCBI Category': 'Metals',
        Benchmark: 'Aluminium Primary',
        'Quality Rating': 'A',
        'Benchmarkability %': 85,
        'Residual %': 15,
        'Unknown Column': 'extra'
      }
    ];

    const mappings = autoMapColumns('PCBI_MASTER', masterColumns, sampleRows);
    expect(mappings).toHaveLength(8);

    const pcbiIdMap = mappings.find((m) => m.excelColumn === 'PCBI ID');
    expect(pcbiIdMap?.mappedField).toBe('pcbi_id');
    expect(pcbiIdMap?.status).toBe('MAPPED');
    expect(pcbiIdMap?.confidence).toBeGreaterThanOrEqual(80);

    const canonMap = mappings.find((m) => m.excelColumn === 'Canonical Benchmark Key');
    expect(canonMap?.mappedField).toBe('canonical_key');
    expect(canonMap?.status).toBe('MAPPED');

    const unknownMap = mappings.find((m) => m.excelColumn === 'Unknown Column');
    expect(unknownMap?.mappedField).toBe('');
    expect(unknownMap?.status).toBe('OPTIONAL');
  });

  it('autoMapColumns should return empty array for OTHER or IGNORE sheet types', () => {
    expect(autoMapColumns('OTHER', ['Col1'], [])).toEqual([]);
    expect(autoMapColumns('IGNORE', ['Col1'], [])).toEqual([]);
  });
});
