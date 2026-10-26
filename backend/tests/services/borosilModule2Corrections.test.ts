import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs';
import * as XLSX from 'xlsx';
import { Module2CanonicalService } from '../../src/services/module2CanonicalService';
import { OFFICIAL_UNSPSC_TAXONOMY_RULES } from '../../src/constants/module2MaterialMappingTaxonomy';

describe('Borosil Module 2 Corrections & Financial Quality Standards (Prompt 525)', () => {
  const rootDir = path.resolve(__dirname, '../../../');
  const filePath = path.join(
    rootDir, 'data/dev/assessments/AIC-2026-0002/uploads/Borosil_PO_Consol_Excluding_BSL_Pune.xlsx'
  );
  const workbookExportPath = path.join(
    rootDir, 'artifacts/excel_exports/Borosil_Module2_Strategic_Sourcing_Opportunities.xlsx'
  );
  const jsonPath = path.join(rootDir, 'data/dev/assessments.json');

  let summary: any;

  it('initializes canonical sourcing analysis for Borosil AIC-2026-0002', () => {
    const analysis = Module2CanonicalService.getSourcingAnalysis('AIC-2026-0002');
    summary = analysis.summary;
    expect(summary).toBeDefined();
  }, 120000);

  it('CORR-1: validates dashboard financial metrics, net baseline ₹556.5347 Cr, and separate gross spend', () => {
    // Primary spend KPI must be the validated net baseline
    expect(summary.totalSpendAnalyzedInrCr).toBeCloseTo(556.5347, 2);
    expect(summary.netBaselineSpendInrCr).toBeCloseTo(556.5347, 2);

    // Gross uploaded spend displayed separately
    expect(summary.grossUploadedSpendInrCr).toBeCloseTo(585.3049, 2);

    // Cancelled / blocked lines excluded
    expect(summary.excludedDeletedBlockedSpendInrCr).toBeCloseTo(28.7702, 2);
    expect(summary.excludedDeletedBlockedRowCount).toBe(755);
    expect(summary.excludedStoRowCount).toBe(2208);
    expect(summary.netBaselineRowCount).toBe(27777);

    // Mathematical reconciliation check
    const grossVal = summary.grossUploadedSpendInrCr ?? 0;
    const exclVal = summary.excludedDeletedBlockedSpendInrCr ?? 0;
    const reconciledDiff = Number((grossVal - exclVal).toFixed(4));
    expect(reconciledDiff).toBeCloseTo(556.5347, 2);
    expect(summary.spendExclusionExplanation).toContain('28.7702');
  });

  it('CORR-2: verifies supplier count standardization (1,561 raw strings and 1,537 normalized entities)', () => {
    expect(summary.rawSupplierCount).toBe(1561);
    expect(summary.normalizedSupplierCount).toBe(1537);
    expect(summary.supplierCountRationale).toContain('1561 distinct raw SAP supplier strings');
    expect(summary.supplierCountRationale).toContain('1537 unique legal supplier entities');

    // Confirm that the Excel workbook exports consistent supplier counts
    const wb = XLSX.readFile(workbookExportPath);
    const execSheet = wb.Sheets['Executive_Summary'];
    const execRows = XLSX.utils.sheet_to_json<any[]>(execSheet, { header: 1 });
    const fullText = JSON.stringify(execRows);

    expect(fullText).toContain('1,561');
    expect(fullText).toContain('1,537');
  });

  it('CORR-3: verifies UNSPSC mapping granularity for top direct chemical items', () => {
    // 1. Soda Ash -> 12141501 (Sodium carbonate)
    const sodaAshRule = OFFICIAL_UNSPSC_TAXONOMY_RULES.find(
      (r) => r.unspscCode === '12141501' && r.pattern.test('soda ash dense')
    );
    expect(sodaAshRule).toBeDefined();
    expect(sodaAshRule?.confidenceScore).toBe(95);
    expect(sodaAshRule?.unspscCode).toBe('12141501');

    // 2. Sodium Antimonate -> 12141544 (Antimony compounds)
    const antimonateRule = OFFICIAL_UNSPSC_TAXONOMY_RULES.find(r => r.unspscCode === '12141544');
    expect(antimonateRule).toBeDefined();
    expect(antimonateRule?.confidenceScore).toBe(95);
    expect(antimonateRule?.pattern.test('sodium antimonate')).toBe(true);

    // 3. Silica Sand -> 11111701 (Silica sand)
    const sandRule = OFFICIAL_UNSPSC_TAXONOMY_RULES.find(r => r.unspscCode === '11111701');
    expect(sandRule).toBeDefined();
    expect(sandRule?.confidenceScore).toBe(95);

    // 4. Dolomite Powder -> 11111611 (Dolomite)
    const dolomiteRule = OFFICIAL_UNSPSC_TAXONOMY_RULES.find(r => r.unspscCode === '11111611');
    expect(dolomiteRule).toBeDefined();
    expect(dolomiteRule?.confidenceScore).toBe(95);

    // 5. AR Coating SK-11 (ARC Liquid) -> Retained at family level 12180000 with review flag
    const arcRule = OFFICIAL_UNSPSC_TAXONOMY_RULES.find(r => r.unspscCode === '12180000');
    expect(arcRule).toBeDefined();
    expect(arcRule?.confidenceScore).toBe(75);
    expect(arcRule?.evidence).toContain('pending specification review');

    // Check Excel workbook UNSPSC sheet contains the granular items
    const wb = XLSX.readFile(workbookExportPath);
    const unspscSheet = wb.Sheets['UNSPSC_Mapping_Register'];
    const unspscRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(unspscSheet);
    const codes = unspscRows.map(r => String(r['UNSPSC Code Assigned'] || ''));

    expect(codes).toContain('12141501');
    expect(codes).toContain('12141544');
    expect(codes).toContain('11111701');
    expect(codes).toContain('11111611');
    expect(codes.some(c => c.includes('12180000'))).toBe(true);
  });

  it('FINANCIAL CONTROL: reconciles all 6 spend families to exactly ₹556.5347 Cr', () => {
    const wb = XLSX.readFile(workbookExportPath);
    const familySheet = wb.Sheets['Spend_Family_Summary'];
    const familyRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(familySheet);

    expect(familyRows.length).toBe(6);

    let totalNetSpendCr = 0;
    let totalGrossSpendCr = 0;
    let totalReturnsCr = 0;
    let totalRowsCount = 0;

    familyRows.forEach(row => {
      const netCr = Number(row['Net Spend (₹ Cr)'] ?? 0);
      const grossCr = Number(row['Gross Spend (₹ Cr)'] ?? 0);
      const retCr = Number(row['Return Credits (₹ Cr)'] ?? 0);
      const rows = Number(row['Total Rows'] ?? 0);

      totalNetSpendCr += netCr;
      totalGrossSpendCr += grossCr;
      totalReturnsCr += retCr;
      totalRowsCount += rows;
    });

    // Total rows must be 27,777
    expect(totalRowsCount).toBe(27777);

    // Reconciles exactly to ₹556.5347 Cr subject only to 4-decimal rounding
    expect(totalNetSpendCr).toBeCloseTo(556.5347, 2);
    expect(totalGrossSpendCr + totalReturnsCr).toBeCloseTo(totalNetSpendCr, 2);

    // Confirm that the static-rate audit calculation (₹557.0669 Cr) vs historical rate (₹556.5347 Cr)
    // variance of ₹0.5322 Cr is documented in the Executive Summary
    const execSheet = wb.Sheets['Executive_Summary'];
    const execRows = XLSX.utils.sheet_to_json<any[]>(execSheet, { header: 1 });
    const fullText = JSON.stringify(execRows);
    expect(fullText).toContain('0.5322');
  });

  it('CRITICAL BOUNDARY: verifies strict isolation of Module 2 from Modules 3 and 4', () => {
    const rawData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const borosilRun = (rawData.analysisRuns['AIC-2026-0002'] || [])[0];

    expect(borosilRun).toBeDefined();
    expect(borosilRun.module2Metrics).toBeDefined();
    expect(borosilRun.module2Metrics.categorizedSpendCr).toBeCloseTo(556.5347, 2);

    // Module 3 & 4 must remain unexecuted with 0 savings published
    expect(borosilRun.pcbiMetrics).toBeUndefined();
    expect(borosilRun.module4Metrics).toBeUndefined();
    expect(borosilRun.potentialSavingsCr).toBe(0);
    expect(borosilRun.savingsPct).toBe(0);
  });
});
