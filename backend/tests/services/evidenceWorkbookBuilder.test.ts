/**
 * Unit Tests for EvidenceWorkbookBuilder (Prompt 305)
 * Inspects generated XLSX workbooks for sheets, rows, formulas, and absence of formula errors.
 */

import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { EvidenceWorkbookBuilder } from '../../src/services/evidenceWorkbookBuilder';
import {
  EVIDENCE_WORKBOOK_FILENAMES,
  EVIDENCE_README_MANDATORY_NOTICE,
  EVIDENCE_CERTIFIED_BENCHMARKS
} from '../../src/constants/evidenceWorkbook';
import type { EvidenceWorkbookType, WorkbookReadmeMeta } from '../../src/types/evidenceWorkbook';

describe('EvidenceWorkbookBuilder Unit Tests', () => {
  const sampleMeta: WorkbookReadmeMeta = {
    customerName: 'UltraTech Cement Limited',
    analysisRunId: 'job-init-default-001',
    dataVersionId: 'v1',
    reportVersionId: 'RPT-TNT-GLOBAL-8902-v1',
    moduleName: 'Test Module',
    workbookType: 'MODULE_1_EVIDENCE',
    generatedAt: '2026-10-04T12:00:00Z',
    generatedBy: 'admin@procucev.com',
    calculationVersion: 'aiCEV-Engine-v2.4-Certified',
    sourceRecordCount: EVIDENCE_CERTIFIED_BENCHMARKS.TOTAL_TRANSACTIONS,
    totalSourceSpendCr: EVIDENCE_CERTIFIED_BENCHMARKS.TOTAL_SPEND_CR,
    purpose: 'Test Purpose',
    validationInstructions: 'Test instructions',
    importantDefinitions: {
      'Gross Opportunity': '173.12 Cr',
      'Net Direct': '78.72 Cr'
    },
    disclaimer: 'Generated from backend single source of truth.'
  };

  const workbookTypes = Object.keys(EVIDENCE_WORKBOOK_FILENAMES) as EvidenceWorkbookType[];

  it.each(workbookTypes)('should successfully build valid XLSX buffer for %s', (type) => {
    const meta = { ...sampleMeta, workbookType: type };
    const buffer = EvidenceWorkbookBuilder.buildWorkbook(type, meta);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);

    // Read workbook with xlsx parser
    const wb = XLSX.read(buffer, { type: 'buffer' });
    expect(wb.SheetNames).toBeDefined();
    expect(wb.SheetNames.length).toBeGreaterThanOrEqual(5);

    // Standard 01_README check
    expect(wb.SheetNames).toContain('01_README');
    const readmeSheet = wb.Sheets['01_README'];
    const readmeJson = XLSX.utils.sheet_to_json(readmeSheet);
    expect(readmeJson.length).toBeGreaterThan(5);

    // Check that mandatory notice is present in Readme sheet
    const noticePresent = readmeJson.some((row: any) =>
      row.Detail?.includes('This workbook provides the calculation and evidence trail')
    );
    expect(noticePresent).toBe(true);

    // Inspect all sheets for broken formulas (#REF!, #VALUE!, #DIV/0!, #N/A)
    for (const sheetName of wb.SheetNames) {
      const sheet = wb.Sheets[sheetName];
      for (const cellKey of Object.keys(sheet)) {
        if (cellKey.startsWith('!')) continue;
        const cell = sheet[cellKey];
        if (typeof cell.v === 'string') {
          expect(cell.v).not.toContain('#REF!');
          expect(cell.v).not.toContain('#VALUE!');
          expect(cell.v).not.toContain('#DIV/0!');
          expect(cell.v).not.toContain('#N/A');
        }
      }
    }
  });

  it('should verify specific sheets in MODULE_1_EVIDENCE', () => {
    const buffer = EvidenceWorkbookBuilder.buildWorkbook('MODULE_1_EVIDENCE', sampleMeta);
    const wb = XLSX.read(buffer, { type: 'buffer' });

    expect(wb.SheetNames).toEqual([
      '01_README',
      '02_EXECUTIVE_SUMMARY',
      '03_CALCULATION_BRIDGE',
      '04_SUPPLIER_ANALYSIS',
      '05_CATEGORY_ANALYSIS',
      '06_PLANT_ANALYSIS',
      '07_SOURCE_RECORDS',
      '08_RECONCILIATION',
      '09_FX_SUMMARY',
      '10_FX_TRANSACTIONS'
    ]);
  });

  it('should verify specific sheets in PCBI_EVIDENCE', () => {
    const buffer = EvidenceWorkbookBuilder.buildWorkbook('PCBI_EVIDENCE', sampleMeta);
    const wb = XLSX.read(buffer, { type: 'buffer' });

    expect(wb.SheetNames).toContain('03_PCBI_SUMMARY');
    expect(wb.SheetNames).toContain('04_PCBI_ID_CALCULATION');
    expect(wb.SheetNames).toContain('05_BENCHMARK_MAPPING');
    expect(wb.SheetNames).toContain('06_BENCHMARK_SOURCES');
    expect(wb.SheetNames).toContain('07_COVERED');
    expect(wb.SheetNames).toContain('08_MISSING_REQUIRED');
    expect(wb.SheetNames).toContain('09_NOT_BENCHMARKABLE');
    expect(wb.SheetNames).toContain('10_SERVICE_NON_COMMODITY');
    expect(wb.SheetNames).toContain('11_EXCLUDED_MANUAL_REVIEW');
  });

  it('should verify specific sheets in FINANCIAL_VALIDATION', () => {
    const buffer = EvidenceWorkbookBuilder.buildWorkbook('FINANCIAL_VALIDATION', sampleMeta);
    const wb = XLSX.read(buffer, { type: 'buffer' });

    expect(wb.SheetNames).toContain('03_CALCULATION_BRIDGE');
    expect(wb.SheetNames).toContain('04_MANDATORY_9_CHECKS');
    expect(wb.SheetNames).toContain('05_ISOLATION_CHECKS');
    expect(wb.SheetNames).toContain('06_RECONCILIATION');
  });
});
