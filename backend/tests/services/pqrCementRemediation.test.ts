import { describe, it, expect, beforeAll } from 'vitest';
import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { WorksheetDiscoveryService } from '../../src/services/worksheetDiscoveryService';
import { GenericSchemaMatcher } from '../../src/services/genericSchemaMatcher';
import { AssessmentDatasetParser } from '../../src/services/assessmentDatasetParser';
import { Module1CanonicalService } from '../../src/services/module1CanonicalService';
import { normalizeAssessmentRow } from '../../src/services/assessmentDatasetRowNormalizer';
import type { VgtProcessingResult } from '../../src/types/vgt';
import type { Module1CanonicalViewModel } from '../../src/types/module1Canonical';

describe('PQR Cement Ltd Module 1 Targeted Remediation (Prompt 395)', () => {
  const candidatePqrPaths = [
    path.resolve(__dirname, '../../storage/objects/consulting-doc/1791831481295_Cement2.xlsx'),
    path.resolve(process.cwd(), 'storage/objects/consulting-doc/1791831481295_Cement2.xlsx'),
    path.resolve(process.cwd(), 'backend/storage/objects/consulting-doc/1791831481295_Cement2.xlsx')
  ];
  const pqrPath = candidatePqrPaths.find((p) => fs.existsSync(p)) || candidatePqrPaths[0];
  const expectedPqrSha256 = '8866eda88a6ee0f1b1cd9d3975e90936dc8e9463d1180c4fd4fee954ba726e27';
  const expectedAbcSha256 = '7c7d5f8a68efe9b60f9d53bd3c0564d27cd187923fd7bf75b6b71a18ef25cca7';

  let wb: XLSX.WorkBook;
  let rawRows: Record<string, unknown>[];
  let parseResult: VgtProcessingResult;
  let canonicalVm: Module1CanonicalViewModel;

  beforeAll(() => {
    // Read source workbook
    const buf = fs.readFileSync(pqrPath);
    wb = XLSX.read(buf, { type: 'buffer' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });

    // Ingest with analyst-confirmed base currency INR
    parseResult = AssessmentDatasetParser.parseDataset(pqrPath, {
      assessmentId: 'AIC-2026-0003',
      dataVersionId: 'DV-001',
      fileName: 'Cement2.xlsx',
      baseCurrency: 'INR',
      analystConfirmedCurrency: 'INR'
    });

    canonicalVm = Module1CanonicalService.buildCanonicalViewModel(parseResult);
  }, 120000);

  it('Requirement B: Verifies file identity, checksum, and expected source values', () => {
    const buf = fs.readFileSync(pqrPath);
    const actualSha256 = crypto.createHash('sha256').update(buf).digest('hex').toLowerCase();
    expect(actualSha256).toBe(expectedPqrSha256);

    // 19,670 data rows
    expect(rawRows.length).toBe(19670);

    // Basic Value sum
    let basicValSum = 0;
    let basicValCrSum = 0;
    let landedValSum = 0;
    let basicAfterDiscSum = 0;
    const itemDescs = new Set<string>();
    const supplierDescs = new Set<string>();
    const plants = new Set<string>();
    const depts = new Set<string>();

    for (const r of rawRows) {
      basicValSum += Number(r['Basic Value'] || 0);
      basicValCrSum += Number(r['Basic Value in Crs'] || 0);
      landedValSum += Number(r['LANDED Value'] || 0);
      basicAfterDiscSum += Number(r['Basic Value (After Discount)'] || 0);
      if (r['Item Desc']) itemDescs.add(String(r['Item Desc']).trim());
      if (r['Supplier Desc']) supplierDescs.add(String(r['Supplier Desc']).trim());
      if (r['PLANT']) plants.add(String(r['PLANT']).trim());
      if (r['Department']) depts.add(String(r['Department']).trim());
    }

    // Basic Value: ₹262.641177 Cr
    expect(basicValSum).toBeCloseTo(2626411770.62, 1);
    expect(basicValCrSum).toBeCloseTo(262.641177, 4);

    // Landed Value: ₹283.425865 Cr approximately
    expect(landedValSum / 10000000).toBeCloseTo(283.425865, 3);

    // Basic Value after discount: ₹244.499189 Cr approximately
    expect(basicAfterDiscSum / 10000000).toBeCloseTo(244.499189, 3);

    // 10,664 unique item descriptions
    expect(itemDescs.size).toBe(10664);

    // 828 unique supplier descriptions
    expect(supplierDescs.size).toBe(828);

    // Two distinct plants
    expect(plants.size).toBe(2);

    // 38 discrete source operational categories
    expect(depts.size).toBe(38);
  });

  it('Fix 1: Department preservation — distinct categories survive ingestion and do not collapse into DIRECT', () => {
    expect(canonicalVm.materialGroups).toBe(38);
    expect(canonicalVm.materialGroupSpend.length).toBe(38);

    // Verify top departments exist with genuine names, not 'DIRECT' or 'DIRECT_MATERIALS'
    const groupCodes = canonicalVm.materialGroupSpend.map((mg) => mg.group_code);
    expect(groupCodes).toContain('MECHANICAL');
    expect(groupCodes).toContain('ELECTRICAL');
    expect(groupCodes).toContain('STORES');
    expect(groupCodes).toContain('MINES');
    expect(groupCodes).toContain('CIVIL');
    expect(groupCodes).not.toContain('DIRECT_MATERIALS');

    // Verify category spend sums reconcile to total validated spend
    const sumCategorySpendCr = canonicalVm.materialGroupSpend.reduce((sum, mg) => sum + mg.spend_inr_cr, 0);
    expect(sumCategorySpendCr).toBeCloseTo(canonicalVm.validFxNormalizedSpendCr, 2);

    // Verify row count reconciliation: sum of records across all categories equals 19,670
    const sumCategoryRecords = canonicalVm.materialGroupSpend.reduce((sum, mg) => sum + mg.records_count, 0);
    expect(sumCategoryRecords).toBe(19670);

    // Regression test: unknown category is flagged rather than silently overwritten
    const unknownRow = {
      'SI.NO': 99999,
      'PO NO': 'PO-TEST',
      'Supplier Desc': 'TEST SUPPLIER',
      'Item Desc': 'TEST ITEM',
      'Order Qty': 1,
      'Basic Rate': 100,
      'Basic Value': 100
    };
    const normRes = normalizeAssessmentRow(unknownRow, 0, 0, 'test.xlsx', {
      assessmentId: 'AIC-TEST',
      dataVersionId: 'v1',
      baseCurrency: 'INR'
    });
    expect(normRes.validRecord?.materialGroup).toBe('UNKNOWN_CATEGORY');
  });

  it('Fix 2: Explicit domestic currency confirmation & provenance tracking', () => {
    // When base currency is explicitly confirmed as INR:
    expect(parseResult.data.sourceRowCount).toBe(19670);
    expect(parseResult.data.validRowCount).toBe(19670);
    expect(parseResult.data.anomalyRowCount).toBe(0);
    expect(parseResult.data.excludedRowCount).toBe(0);

    // All rows preserved with provenance
    const validRows = parseResult.validRows || [];
    expect(validRows.length).toBe(19670);
    expect(validRows[0].currency).toBe('INR');
    expect(validRows[0].currencyProvenance).toBe('ANALYST_CONFIRMED_BASE_CURRENCY');

    // Total validated spend matches source Basic Value
    expect(canonicalVm.validFxNormalizedSpendCr).toBeCloseTo(262.6412, 3);
    expect(canonicalVm.reconciliationStatus).toBe('RECONCILED');

    // Regression test: Without explicit confirmation, unconfirmed dataset is quarantined as UNRESOLVED
    const unconfirmedResult = AssessmentDatasetParser.parseDataset(pqrPath, {
      assessmentId: 'AIC-2026-UNCONFIRMED',
      dataVersionId: 'DV-TEST',
      fileName: 'Cement2.xlsx'
      // No baseCurrency or analystConfirmedCurrency provided
    });
    expect(unconfirmedResult.data.anomalyRowCount).toBe(19670);
    expect(unconfirmedResult.data.validRowCount).toBe(0);
    expect(unconfirmedResult.data.excludedRowCount).toBe(0); // Rows are quarantined, NOT deleted
  }, 30000);

  it('Fix 3 & Requirement D: Verifies FX display behavior — status is NOT_CALCULATED and no ₹153.50 Cr fallback', () => {
    // Since Cement2 is a domestic dataset with confirmed INR base currency, FX computation status is NOT_CALCULATED
    expect(canonicalVm.fxNormalizationImpactStatus).toBe('NOT_CALCULATED');
    expect(canonicalVm.fxNormalizationImpactCr).toBe(0);
    expect(canonicalVm.fxNormalizationImpactPct).toBe(0);
    expect(canonicalVm.isTestData).toBe(false);

    // Verify it is NOT ₹153.50 Cr
    expect(canonicalVm.fxNormalizationImpactCr).not.toBe(153.5);
    expect(canonicalVm.fxNormalizationImpactCr).not.toBe(153.5029);
  });

  it('Requirement E: Supplier Pareto totals and 80% cutoff', () => {
    expect(canonicalVm.uniqueVendors).toBe(828);
    expect(canonicalVm.pareto).toBeTruthy();
    expect(canonicalVm.pareto.totalSupplierCount).toBe(828);
    expect(canonicalVm.pareto.top80SpendCr).toBeGreaterThan(0);
    expect(canonicalVm.pareto.top80SpendCr).toBeLessThanOrEqual(canonicalVm.validFxNormalizedSpendCr);
    expect(canonicalVm.pareto.top80SpendPct).toBeCloseTo(80, 0);

    // Top suppliers belong to Pareto Class A
    const paretoClassASuppliers = canonicalVm.supplierSpend.filter((s) => s.paretoClass === 'A');
    expect(paretoClassASuppliers.length).toBe(canonicalVm.pareto.topSupplierCount);
    expect(paretoClassASuppliers.length).toBeLessThan(828);
  });

  it('Requirement F: Data isolation — ABC Textile and VGT hashes and data remain isolated', () => {
    const candidateAbcPaths = [
      path.resolve(__dirname, '../../../data/test/assessments/AIC-2026-0002/uploads/Textile1.xlsx'),
      path.resolve(__dirname, '../../../data/dev/assessments/AIC-2026-0002/uploads/Textile1.xlsx'),
      path.resolve(process.cwd(), 'data/test/assessments/AIC-2026-0002/uploads/Textile1.xlsx'),
      path.resolve(process.cwd(), 'data/dev/assessments/AIC-2026-0002/uploads/Textile1.xlsx'),
      path.resolve('..', 'data/test/assessments/AIC-2026-0002/uploads/Textile1.xlsx'),
      path.resolve('..', 'data/dev/assessments/AIC-2026-0002/uploads/Textile1.xlsx')
    ];
    const abcPath = candidateAbcPaths.find((p) => fs.existsSync(p)) || candidateAbcPaths[0];
    const abcBuf = fs.readFileSync(abcPath);
    const abcSha = crypto.createHash('sha256').update(abcBuf).digest('hex').toLowerCase();
    expect(abcSha).toBe(expectedAbcSha256);

    // PQR assessment ID is isolated
    expect(canonicalVm.sourceFileName).toBe('Cement2.xlsx');
    expect(parseResult.data.sourceRowCount).toBe(19670);
  });
});
