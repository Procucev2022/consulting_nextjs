import { describe, it, expect, beforeAll } from 'vitest';
import * as XLSX from 'xlsx';
import path from 'path';
import { WorksheetDiscoveryService } from '../../src/services/worksheetDiscoveryService';
import { GenericSchemaMatcher } from '../../src/services/genericSchemaMatcher';
import { AssessmentDatasetParser } from '../../src/services/assessmentDatasetParser';
import { Module1CanonicalService } from '../../src/services/module1CanonicalService';
import type { VgtProcessingResult } from '../../src/types/vgt';
import type { WorkbookDiscoveryResult } from '../../src/types/worksheetDiscovery';

describe('ABC Textile Stage 2 Regression Reference Test', () => {
  const filePath = path.resolve('..', 'data/dev/assessments/AIC-2026-0002/uploads/Textile1.xlsx');
  let wb: XLSX.WorkBook;
  let discovery: WorkbookDiscoveryResult;
  let headers: string[];
  let rows: Record<string, unknown>[];
  let parseResult: VgtProcessingResult;

  beforeAll(() => {
    wb = XLSX.readFile(filePath);
    discovery = WorksheetDiscoveryService.discoverWorksheets(wb);
    const sheet = wb.Sheets[discovery.selectedSheetName!];
    const extracted = WorksheetDiscoveryService.extractRowsFromSheet(sheet, 0);
    headers = extracted.headers;
    rows = extracted.rows;
    parseResult = AssessmentDatasetParser.parseDataset(filePath, {
      assessmentId: 'AIC-2026-0002',
      dataVersionId: 'v1'
    });
  }, 60000);

  it('verifies dynamic worksheet discovery on Textile1.xlsx', () => {
    expect(wb.SheetNames.length).toBeGreaterThan(0);
    expect(discovery.selectionStatus).toBe('AUTO_SELECTED');
    expect(discovery.selectedSheetName).toBeTruthy();
    expect(discovery.candidateSheets.length).toBe(1);

    // Source rows: 23,570 excluding header
    expect(rows.length).toBe(23570);
    expect(headers.length).toBeGreaterThanOrEqual(15);

    // Verify Generic Schema Matching
    const schemaMatch = GenericSchemaMatcher.matchSchema(headers, rows.slice(0, 10));
    expect(schemaMatch.isValid).toBe(true);
    expect(schemaMatch.status).toBe('VALID');
    expect(schemaMatch.mappedFieldNames).toContain('vendorName');
    expect(schemaMatch.mappedFieldNames).toContain('documentDate');
    expect(schemaMatch.mappedFieldNames).toContain('netSpendAmount');
  });

  it('verifies financial and row-level parity for ABC Textile dataset', () => {
    // 1. Source and Valid Row counts
    expect(parseResult.data.sourceRowCount).toBe(23570);
    expect(parseResult.data.validRowCount).toBe(23570);
    expect(parseResult.data.excludedRowCount).toBe(0);
    expect(parseResult.data.anomalyRowCount).toBe(0);

    // 2. Provisional ERP-converted spend: ₹613.8805 Cr
    expect(parseResult.module1.totalConvertedInrSpendCr).toBeCloseTo(613.8805, 3);
    expect(parseResult.module1.customerProfileSpendCr).toBeCloseTo(613.8805, 3);

    // 3. FX status: NOT_CALCULATED
    expect(parseResult.module1.fxMethodologyImpactCr).toBe(0.0);
    expect(parseResult.forensicBridge.fxImpactPct).toBe(0.0);

    // 4. Canonical View Model verification
    const canonical = Module1CanonicalService.buildCanonicalViewModel(parseResult, filePath);
    expect(canonical.sourceRowCount).toBe(23570);
    expect(canonical.validFxNormalizedSpendCr).toBeCloseTo(613.8805, 3);
    expect(canonical.profileFxBaselineSpendCr).toBeCloseTo(613.8805, 3);
    expect(canonical.fxNormalizationImpactStatus).toBe('NOT_CALCULATED');
    expect(canonical.isTestData).toBe(false);

    // 5. Authoritative Currency set: INR, USD, EUR, GBP, JPY, CHF (SGD does NOT exist in workbook)
    expect(canonical.detectedCurrencies).toHaveLength(6);
    expect(new Set(canonical.detectedCurrencies)).toEqual(new Set(['INR', 'JPY', 'USD', 'EUR', 'GBP', 'CHF']));
    expect(canonical.detectedCurrencies).toContain('CHF');
    expect(canonical.detectedCurrencies).not.toContain('SGD');
  });

  it('verifies exact currency counts and non-substitution of CHF vs SGD in source workbook', () => {
    const counts = parseResult.currency.transactionCountByCurrency;

    // Verify authoritative row counts per currency in Textile1.xlsx
    expect(counts['INR']).toBe(23319);
    expect(counts['EUR']).toBe(111);
    expect(counts['USD']).toBe(105);
    expect(counts['JPY']).toBe(26);
    expect(counts['GBP']).toBe(5);
    expect(counts['CHF']).toBe(4);
    expect(counts['SGD']).toBeUndefined();

    // Verify sum of per-currency transaction counts equals total source rows
    const totalTransactions = Object.values(counts).reduce((acc, c) => acc + c, 0);
    expect(totalTransactions).toBe(23570);

    // Verify CHF has positive non-zero transaction volume and conversion rate
    const chfBridge = parseResult.forensicBridge.currencyBridges.find((b) => b.currency === 'CHF');
    expect(chfBridge).toBeDefined();
    expect(chfBridge?.validTxCount).toBe(4);
    expect(chfBridge?.profileRate).toBe(98.49);
    expect(chfBridge?.originalValue).toBeGreaterThan(0);

    // Verify SGD bridge does not exist in dataset
    const sgdBridge = parseResult.forensicBridge.currencyBridges.find((b) => b.currency === 'SGD');
    expect(sgdBridge).toBeUndefined();
  });

  it('verifies converted spend columns reconcile and NOT_CALCULATED FX status is provisional', () => {
    // 1. Reconcile converted spend columns from source rows
    let sumNetValueInINR = 0;
    let sumNetValueInCrs = 0;
    for (const r of rows) {
      sumNetValueInINR += Number(r['Net Value In INR']) || 0;
      sumNetValueInCrs += Number(r['Net Value in Crs.']) || 0;
    }

    expect(sumNetValueInINR).toBeCloseTo(6138805185.48, 2);
    expect(sumNetValueInCrs).toBeCloseTo(613.880519, 4);
    expect(Math.abs(sumNetValueInINR - sumNetValueInCrs * 10000000)).toBeLessThan(1.0);

    // 2. FX Status semantics
    const canonical = Module1CanonicalService.buildCanonicalViewModel(parseResult, filePath);
    expect(canonical.fxNormalizationImpactStatus).toBe('NOT_CALCULATED');
    expect(canonical.isTestData).toBe(false);

    // Numeric zero in fxNormalizationImpactCr must be interpreted as uncalculated historical baseline
    expect(canonical.fxNormalizationImpactCr).toBe(0.0);
    expect(canonical.fxNormalizationImpactPct).toBe(0.0);
    expect(canonical.validFxNormalizedSpendCr).toBe(canonical.profileFxBaselineSpendCr);
  });
});
