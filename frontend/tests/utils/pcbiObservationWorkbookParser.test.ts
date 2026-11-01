import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import {
  parseObservationWorkbook,
  parseObservationWorkbookSync,
  extractSyncBuffer
} from '../../src/utils/pcbiObservationWorkbookParser';

describe('Commodity PCBI Observation Workbook Parser', () => {
  const candidateFixturePath = path.resolve(
    __dirname,
    '../fixtures/Borosil_Soda_Ash_Dense_Existing_Series_Upload_Candidate.xlsx'
  );

  it('correctly extracts all 43 weekly observations from Borosil Soda Ash Dense workbook', async () => {
    const fileBuffer = fs.readFileSync(candidateFixturePath);
    const result = await parseObservationWorkbook(
      fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength),
      'Borosil_Soda_Ash_Dense_Existing_Series_Upload_Candidate.xlsx'
    );

    expect(result.status).toBe('EXTRACTED');
    expect(result.sheetName).toBe('Weekly_Index_Upload');
    expect(result.totalRowsRead).toBe(43);
    expect(result.extractedCount).toBe(43);
    expect(result.validObservations).toHaveLength(43);
    expect(result.confidenceScore).toBe(100.0);

    // Detected columns
    expect(result.detectedDateColumn).toBe('Observation Date');
    expect(result.detectedPriceColumn).toBe('Index Value');
    expect(result.detectedSeriesId).toBe('PCBI-IND-CHM-SDA-001');

    // Observation 1: Week of 2026-01-05, Index 100
    const first = result.validObservations[0];
    expect(first.date).toBe('2026-01-05');
    expect(first.value).toBe(100);
    expect(first.unit).toBe('INDEX_POINTS');
    expect(first.underlyingPriceUnit).toBe('INR/MT');

    // Observation 43: Week of 2026-10-26, Index 105.7692
    const last = result.validObservations[42];
    expect(last.date).toBe('2026-10-26');
    expect(last.value).toBe(105.7692);
    expect(last.unit).toBe('INDEX_POINTS');
    expect(last.underlyingPriceUnit).toBe('INR/MT');

    // Quality Report validation
    expect(result.qualityReport).toBeDefined();
    expect(result.qualityReport?.detectedFrequency).toBe('WEEKLY');
    expect(result.qualityReport?.missingPeriodsCount).toBe(0);
    expect(result.qualityReport?.duplicateDatesCount).toBe(0);
    expect(result.qualityReport?.unitConsistency).toBe('Uniform (INDEX_POINTS)');
    expect(result.qualityReport?.isUnitUniform).toBe(true);
    expect(result.qualityReport?.detectedMetricType).toBe('INDEX_POINTS');
    expect(result.qualityReport?.dateRange.startDate).toBe('2026-01-05');
    expect(result.qualityReport?.dateRange.endDate).toBe('2026-10-26');
  });

  it('correctly parses CSV file and detects date and price columns', async () => {
    const csvContent = 'obs_date,raw_value,currency\n2025-01-01,31000,INR\n2025-02-01,31500,INR\n2025-03-01,32000,INR';
    const wb = XLSX.read(Buffer.from(csvContent), { type: 'buffer' });
    const u8 = XLSX.write(wb, { type: 'array', bookType: 'csv' });

    const result = await parseObservationWorkbook(u8, 'custom_series.csv');
    expect(result.status).toBe('EXTRACTED');
    expect(result.totalRowsRead).toBe(3);
    expect(result.extractedCount).toBe(3);
    expect(result.detectedDateColumn).toBe('obs_date');
    expect(result.detectedPriceColumn).toBe('raw_value');
    expect(result.confidenceScore).toBe(100.0);
    expect(result.validObservations[0].value).toBe(31000);
  });

  it('handles empty files or filenames with "empty" gracefully', async () => {
    const result = await parseObservationWorkbook(new ArrayBuffer(0), 'empty_test.xlsx');
    expect(result.status).toBe('EMPTY');
    expect(result.extractedCount).toBe(0);
    expect(result.confidenceScore).toBe(0);
  });

  it('handles corrupt binary buffers gracefully', async () => {
    const corruptBuffer = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]).buffer;
    const result = await parseObservationWorkbook(corruptBuffer, 'corrupt.xlsx');
    expect(result.status).toBe('INVALID_FORMAT');
    expect(result.extractedCount).toBe(0);
    expect(result.errorMessage).toBeDefined();
  });

  it('filters out invalid rows and calculates confidence accordingly', async () => {
    const badData = [
      { Date: '2025-01-01', Value: 100 },
      { Date: '', Value: 110 }, // Invalid date
      { Date: null, Value: 115 }, // Non-string/non-number date
      { Date: '2025-03-01', Value: 'not_a_number' }, // Invalid price
      { Date: '2025-04-01', Value: 120 },
      { Date: '2025-05-01', Value: null },
      { Date: '2025-06-01', Value: true },
      { Date: '2025-07-01', Value: NaN }
    ];
    const ws = XLSX.utils.json_to_sheet(badData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    const u8 = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

    const result = await parseObservationWorkbook(u8, 'partial_data.xlsx');
    expect(result.status).toBe('EXTRACTED');
    expect(result.totalRowsRead).toBe(8);
    expect(result.extractedCount).toBe(2);
    expect(result.confidenceScore).toBe(25.0);
  });

  it('handles workbook with completely invalid observation rows', async () => {
    const invalidRows = [
      { ColA: 'invalid_date', ColB: 'not_number' }
    ];
    const ws = XLSX.utils.json_to_sheet(invalidRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Invalid');
    const u8 = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

    const result = await parseObservationWorkbook(u8, 'all_invalid.xlsx');
    expect(result.status).toBe('INVALID_FORMAT');
    expect(result.extractedCount).toBe(0);
    expect(result.errorMessage).toBe('No valid observation rows matching Date and Price schema');
  });

  it('handles File object with arrayBuffer and extracts source URL and metadata', async () => {
    const rows = [
      {
        'Observation Date': 45292, // Excel date serial number
        'Index Value': '₹ 32,500.50',
        Unit: 'INR/MT',
        'PCBI ID': 'PCBI-TEST-001',
        Source: 'ICIS Pricing Portal https://icis.com/reports/soda-ash-weekly',
        'Quality Rating': 'Q1_OFFICIAL_PRIMARY',
        Note: 'Preliminary release'
      }
    ];
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Weekly_Index_Upload');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

    const mockFile = {
      name: 'test_stream.xlsx',
      arrayBuffer: async () => ab
    } as unknown as File;

    const result = await parseObservationWorkbook(mockFile);
    expect(result.status).toBe('EXTRACTED');
    expect(result.extractedCount).toBe(1);
    expect(result.detectedSourceUrl).toBe('https://icis.com/reports/soda-ash-weekly');
    expect(result.validObservations[0].value).toBe(32500.5);
    expect(result.validObservations[0].qualityRating).toBe('Q1_OFFICIAL_PRIMARY');
    expect(result.validObservations[0].note).toBe('Preliminary release');
  });

  it('returns INVALID_FORMAT when input is completely unsupported', async () => {
    const result = await parseObservationWorkbook({} as any, 'invalid.bin');
    expect(result.status).toBe('INVALID_FORMAT');
    expect(result.errorMessage).toBe('Unsupported binary input');
  });

  it('handles XLSX.read throwing exception gracefully on corrupted zip archive', () => {
    // PK\x03\x04 zip magic header with corrupted archive payload
    const corruptZip = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00, 0x00, 0x00]);
    const result = parseObservationWorkbookSync(corruptZip, 'broken.xlsx');
    expect(result.status).toBe('INVALID_FORMAT');
    expect(result.errorMessage).toBeDefined();
  });

  it('exercises extractSyncBuffer across various input formats', () => {
    expect(extractSyncBuffer(null)).toBeNull();
    expect(extractSyncBuffer(undefined)).toBeNull();

    const u8 = new Uint8Array([1, 2, 3]);
    expect(extractSyncBuffer(u8)).toBe(u8);

    const buf = Buffer.from([4, 5, 6]);
    const extractedBuf = extractSyncBuffer(buf);
    expect(extractedBuf).toBeInstanceOf(Uint8Array);
    expect(Array.from(extractedBuf || [])).toEqual([4, 5, 6]);

    const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    const extractedAb = extractSyncBuffer(ab);
    expect(extractedAb).toBeInstanceOf(Uint8Array);

    const objWithBuffer = { _buffer: Buffer.from([7, 8]) };
    const extractedObj = extractSyncBuffer(objWithBuffer);
    expect(extractedObj).toBeInstanceOf(Uint8Array);
    expect(Array.from(extractedObj || [])).toEqual([7, 8]);

    const sym = Symbol('bufferSym');
    const objWithSym = { [sym]: { _buffer: Buffer.from([9, 10]) } };
    expect(extractSyncBuffer(objWithSym)).toBeInstanceOf(Uint8Array);
  });

  it('handles empty sheet, date instance, and file instance default filename', async () => {
    // Empty sheet
    const wb = XLSX.utils.book_new();
    const emptyWs = XLSX.utils.aoa_to_sheet([]);
    XLSX.utils.book_append_sheet(wb, emptyWs, 'EmptySheet');
    const emptyBuf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const emptyResult = parseObservationWorkbookSync(emptyBuf, 'empty_sheet.xlsx');
    expect(emptyResult.status).toBe('EMPTY');

    // Date object in row
    const wbDate = XLSX.utils.book_new();
    const dateWs = XLSX.utils.json_to_sheet([
      { Date: new Date('2026-01-05T00:00:00.000Z'), Price: 25000 }
    ]);
    XLSX.utils.book_append_sheet(wbDate, dateWs, 'DateSheet');
    const dateBuf = XLSX.write(wbDate, { type: 'buffer', bookType: 'xlsx' });
    const dateResult = parseObservationWorkbookSync(dateBuf, 'dates.xlsx');
    expect(dateResult.status).toBe('EXTRACTED');
    expect(dateResult.validObservations[0].date).toBe('2026-01-05');

    // Sheet named without 'upload' or 'index' keywords, with Currency and lowercase unit
    const wbGeneral = XLSX.utils.book_new();
    const genWs = XLSX.utils.json_to_sheet([
      { Date: '2026-01-05', Price: 25000, unit: 'USD/MT' },
      { Date: '2026-01-12', Price: 26000, Currency: 'EUR' }
    ]);
    XLSX.utils.book_append_sheet(wbGeneral, genWs, 'GeneralData');
    const genBuf = XLSX.write(wbGeneral, { type: 'buffer', bookType: 'xlsx' });
    const genResult = parseObservationWorkbookSync(genBuf, 'general.xlsx');
    expect(genResult.sheetName).toBe('GeneralData');
    expect(genResult.status).toBe('EXTRACTED');
    expect(genResult.validObservations[0].underlyingPriceUnit).toBe('USD/MT');
    expect(genResult.validObservations[1].underlyingPriceUnit).toBe('EUR/MT');
  });

  it('parses actual Borosil candidate workbook with Monday weekly dates and separate circular effective dates', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const fixturePath = path.resolve(__dirname, '../fixtures/Borosil_Soda_Ash_Dense_Existing_Series_Upload_Candidate.xlsx');
    const fileBuf = fs.readFileSync(fixturePath);

    const result = parseObservationWorkbookSync(new Uint8Array(fileBuf), 'Borosil_Candidate.xlsx', 'WEEKLY');
    expect(result.status).toBe('EXTRACTED');
    expect(result.extractedCount).toBe(43);
    expect(result.validObservations).toHaveLength(43);

    // Verify all 43 dates are Monday start
    for (const obs of result.validObservations) {
      const dayOfWeek = new Date(obs.date + 'T00:00:00Z').getUTCDay();
      expect(dayOfWeek).toBe(1); // 1 = Monday
    }

    // First and last observation dates
    expect(result.validObservations[0].date).toBe('2026-01-05');
    expect(result.validObservations[42].date).toBe('2026-10-26');

    // April step change (Row 13, index value 103.8462)
    const aprObs = result.validObservations.find((o) => Math.abs(o.value - 103.8462) < 0.001);
    expect(aprObs).toBeDefined();
    expect(aprObs?.date).toBe('2026-04-06');
    expect(aprObs?.effectiveDate).toBe('2026-04-01');

    // June step change (Row 21, index value 105.7692)
    const junObs = result.validObservations.find((o) => Math.abs(o.value - 105.7692) < 0.001);
    expect(junObs).toBeDefined();
    expect(junObs?.date).toBe('2026-06-01');
    expect(junObs?.effectiveDate).toBe('2026-06-01');

    // Quality report step changes
    expect(result.qualityReport.stepChanges).toHaveLength(2);
    expect(result.qualityReport.stepChanges[0].date).toBe('2026-04-06');
    expect(result.qualityReport.stepChanges[0].effectiveDate).toBe('2026-04-01');
    expect(result.qualityReport.stepChanges[1].date).toBe('2026-06-01');
    expect(result.qualityReport.stepChanges[1].effectiveDate).toBe('2026-06-01');
  });

  it('exercises explicit Effective Date column and effective price date note extraction', () => {
    const rows = [
      {
        Date: '2026-01-05',
        Price: 100,
        'Effective Date': '2026-01-01'
      },
      {
        Date: '2026-01-12',
        Price: 102,
        Note: 'effective price date: 15 Jan 2026'
      }
    ];
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'EffectiveSheet');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const result = parseObservationWorkbookSync(buf, 'eff.xlsx');
    expect(result.validObservations[0].effectiveDate).toBe('2026-01-01');
    expect(result.validObservations[1].effectiveDate).toBe('2026-01-15');
  });
});

