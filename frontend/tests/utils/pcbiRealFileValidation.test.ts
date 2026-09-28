import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as XLSX from 'xlsx';
import { detectWorksheets, autoMapColumns } from '../../src/utils/pcbiParser';
import { validatePCBIUpload } from '../../src/utils/pcbiValidator';
import type { PCBIColumnMapping } from '../../src/types/pcbiAdmin';

const REAL_FILE_PATH =
  'C:/Users/srini/Desktop/Consulting Testing Datas/Sector wise Benchmark Analysis Data/Final File for Upload/PCBI_GLOBAL_MASTER_V1_2020_2026.xlsx';

describe('Real PCBI Master File Validation (PCBI_GLOBAL_MASTER_V1_2020_2026.xlsx)', () => {
  it(
    'should validate the real PCBI master file with ZERO blocking errors',
    () => {
    if (!fs.existsSync(REAL_FILE_PATH)) {
      console.warn('Real test file not found at:', REAL_FILE_PATH);
      return;
    }

    const buffer = fs.readFileSync(REAL_FILE_PATH);
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    const sheetDataMap: Record<string, Record<string, unknown>[]> = {};
    workbook.SheetNames.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      sheetDataMap[sheetName] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    });

    const detected = detectWorksheets(workbook.SheetNames, sheetDataMap);
    expect(detected).toHaveLength(8);

    const datasets: Record<string, Record<string, unknown>[]> = {};
    const mappings: Record<string, PCBIColumnMapping[]> = {};

    detected.forEach((ws) => {
      const rows = sheetDataMap[ws.sheetName] || [];
      datasets[ws.detectedType] = rows;
      if (ws.detectedType !== 'OTHER' && ws.detectedType !== 'IGNORE') {
        mappings[ws.detectedType] = autoMapColumns(
          ws.detectedType,
          ws.headers,
          rows.slice(0, 10)
        );
      }
    });

    // Run the corrected validator
    const summary = validatePCBIUpload(datasets, mappings);

    console.log('=== REAL FILE VALIDATION SUMMARY ===');
    console.log('Total Records:', summary.totalRecords);
    console.log('Valid Records:', summary.validRecords);
    console.log('Blocking Errors:', summary.blockingErrorCount);
    console.log('Warnings:', summary.warningCount);
    console.log('Information Count:', summary.informationCount);
    console.log('Source Pending Count:', summary.sourcePendingCount);
    console.log('Unique PCBI IDs:', summary.uniquePcbiIdsCount);
    console.log('Duplicate Technical IDs:', summary.duplicateTechnicalIdsCount);
    console.log('A Quality:', summary.aQualityCount);
    console.log('B Quality:', summary.bQualityCount);
    console.log('C Quality:', summary.cQualityCount);
    console.log('Average Benchmarkability %:', summary.avgBenchmarkability);
    console.log('Date Start:', summary.dateStart);
    console.log('Date End:', summary.dateEnd);

    // Verify 0 blocking errors
    expect(summary.blockingErrorCount).toBe(0);
    expect(summary.duplicateTechnicalIdsCount).toBe(0);
    expect(summary.masterRecordsCount).toBe(290);
    expect(summary.weeklyRecordsCount).toBe(95700);
    expect(summary.constituentRecordsCount).toBe(290);
    expect(summary.sourcePendingCount).toBe(95700);
  }, 35000);
});
