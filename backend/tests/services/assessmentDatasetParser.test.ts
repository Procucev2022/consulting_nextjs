import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs';
import * as XLSX from 'xlsx';
import { AssessmentDatasetParser } from '../../src/services/assessmentDatasetParser';

describe('AssessmentDatasetParser Unit Tests', () => {
  const textileCandidates = [
    path.resolve(process.cwd(), 'data', 'dev', 'assessments', 'AIC-2026-0002', 'uploads', 'Textile1.xlsx'),
    path.resolve(process.cwd(), '..', 'data', 'dev', 'assessments', 'AIC-2026-0002', 'uploads', 'Textile1.xlsx'),
    path.resolve(__dirname, '../../../data/dev/assessments/AIC-2026-0002/uploads/Textile1.xlsx')
  ];
  const textileFilePath = textileCandidates.find(c => fs.existsSync(c)) || textileCandidates[0];

  it('correctly parses actual Textile1.xlsx workbook with zero Rel.stat false exclusions', () => {
    if (!fs.existsSync(textileFilePath)) {
      console.warn('Textile1.xlsx not present, skipping real workbook test');
      return;
    }

    const result = AssessmentDatasetParser.parseDataset(textileFilePath, {
      assessmentId: 'AIC-2026-0002',
      dataVersionId: 'DV-001',
      fileName: 'Textile1.xlsx'
    });

    // 1. Record Counts & Exclusion Integrity
    expect(result.data.sourceRowCount).toBe(23570);
    expect(result.data.validRowCount).toBe(23570);
    expect(result.data.excludedRowCount).toBe(0);
    expect(result.data.anomalyRowCount).toBe(0);

    // 2. Financial Spend & Provisional ERP-Converted Baseline (Prompt 381)
    expect(result.module1.totalConvertedInrSpendCr).toBeCloseTo(613.8805, 3);
    expect(result.module1.customerProfileSpendCr).toBeCloseTo(613.8805, 3);
    expect(result.module1.fxMethodologyImpactCr).toBe(0.0);
    expect(result.forensicBridge.fxImpactPct).toBe(0.0);

    // 3. Currency Detection: exactly 6 currencies, zero CNY
    expect(result.currency.currenciesDetected).toContain('INR');
    expect(result.currency.currenciesDetected).toContain('USD');
    expect(result.currency.currenciesDetected).toContain('EUR');
    expect(result.currency.currenciesDetected).toContain('JPY');
    expect(result.currency.currenciesDetected).toContain('GBP');
    expect(result.currency.currenciesDetected).toContain('CHF');
    expect(result.currency.currenciesDetected).not.toContain('CNY');
    expect(result.currency.currenciesDetected.length).toBe(6);

    // 4. Dimensional Diversity
    const materialGroups = new Set(result.validRows.map(r => r.materialGroup)).size;
    const operatingPlants = new Set(result.validRows.map(r => r.plant)).size;
    const billingMonths = new Set(result.validRows.map(r => r.billingMonth)).size;
    const uniqueVendors = new Set(result.validRows.map(r => r.vendorName)).size;
    const uniqueItems = new Set(result.validRows.map(r => r.itemDescription)).size;

    expect(materialGroups).toBe(262);
    expect(operatingPlants).toBe(12);
    expect(billingMonths).toBe(12);
    expect(uniqueVendors).toBe(1291);
    expect(uniqueItems).toBe(12768);
  }, 40000);

  it('strictly distinguishes genuine deletion indicators from SAP release status', () => {
    const tmpDir = path.join(process.cwd(), 'scratch', 'test_parser_temp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    const testFile = path.join(tmpDir, 'deletion_test.xlsx');

    const sampleRows = [
      {
        'Purch.Doc.': 'PO-001',
        'Rel.stat': 'X', // SAP Release Status — must NOT be excluded
        'Short Text': 'Item Released',
        'Net Value': 10000,
        'Net Value In INR': 10000,
        'Net Value in Crs.': 0.001,
        'Crcy': 'INR',
        'Matl Group': 'G1',
        'Plnt': 'P1',
        'Vendor': 'V1'
      },
      {
        'Purch.Doc.': 'PO-002',
        'Deletion Indicator': 'X', // Genuine deletion indicator — MUST be excluded
        'Short Text': 'Item Deleted',
        'Net Value': 5000,
        'Net Value In INR': 5000,
        'Net Value in Crs.': 0.0005,
        'Crcy': 'INR',
        'Matl Group': 'G1',
        'Plnt': 'P1',
        'Vendor': 'V1'
      },
      {
        'Purch.Doc.': 'PO-003',
        'LOEKZ': 'D', // Genuine deletion indicator (SAP code) — MUST be excluded
        'Short Text': 'Item Deleted Code D',
        'Net Value': 3000,
        'Net Value In INR': 3000,
        'Net Value in Crs.': 0.0003,
        'Crcy': 'INR',
        'Matl Group': 'G2',
        'Plnt': 'P2',
        'Vendor': 'V2'
      }
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sampleRows);
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, testFile);

    const result = AssessmentDatasetParser.parseDataset(testFile, {
      assessmentId: 'AIC-TEST-DEL',
      dataVersionId: 'DV-DEL',
      fileName: 'deletion_test.xlsx'
    });

    expect(result.data.sourceRowCount).toBe(3);
    expect(result.data.validRowCount).toBe(1);
    expect(result.data.excludedRowCount).toBe(2);
    expect(result.validRows[0].itemDescription).toBe('Item Released');

    // Clean up
    fs.unlinkSync(testFile);
  });

  it('routes VGT regression test files strictly to VgtModule1Runner without cross-contamination', () => {
    const vgtCandidates = [
      path.resolve(process.cwd(), 'backend', 'VGT Testing Data.xlsx'),
      path.resolve(process.cwd(), 'VGT Testing Data.xlsx'),
      path.resolve(__dirname, '../../VGT Testing Data.xlsx')
    ];
    const vgtPath = vgtCandidates.find(c => fs.existsSync(c)) || 'VGT Testing Data.xlsx';

    const result = AssessmentDatasetParser.parseDataset(vgtPath, {
      assessmentId: 'AIC-2026-0001',
      dataVersionId: 'DV-VGT',
      fileName: 'VGT Testing Data.xlsx',
      isTestData: true
    });

    expect(result.data.sourceRowCount).toBe(20505);
    expect(result.data.validRowCount).toBe(20241);
    expect(result.data.excludedRowCount).toBe(252);
    expect(result.data.anomalyRowCount).toBe(12);
  }, 40000);

  it('builds valid synthetic customer dataset when file does not exist on disk', () => {
    const nonExistentPath = path.join(process.cwd(), 'scratch', 'non_existent_file.xlsx');

    const result = AssessmentDatasetParser.parseDataset(nonExistentPath, {
      assessmentId: 'AIC-TEST-SYNTHETIC',
      dataVersionId: 'DV-SYNTHETIC',
      fileName: 'non_existent_file.xlsx'
    });

    expect(result.data.sourceRowCount).toBe(1000);
    expect(result.data.validRowCount).toBe(1000);
    expect(result.data.excludedRowCount).toBe(0);
    expect(result.module1.totalConvertedInrSpendCr).toBeGreaterThan(0);
    expect(result.currency.currenciesDetected).toContain('INR');
  });

  it('handles multi-currency conversions and FX rate calculation properly', () => {
    const tmpDir = path.join(process.cwd(), 'scratch', 'test_parser_temp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    const testFile = path.join(tmpDir, 'currency_test.xlsx');

    const sampleRows = [
      {
        'Purch.Doc.': 'PO-USD-1',
        'Short Text': 'Imported Valve',
        'Net Value': 1000,
        'Order Quantity': 10,
        'Net price': 100,
        'Crcy': 'USD',
        'CR': 83.5, // FX Rate
        'Matl Group': 'VALVES',
        'Plnt': 'PLANT-A',
        'Vendor': 'US Supplier Inc'
      },
      {
        'Purch.Doc.': 'PO-EUR-1',
        'Short Text': 'Pump Assembly',
        'Net Value': 500,
        'Order Quantity': 2,
        'Net price': 250,
        'Crcy': 'EUR',
        'CR': 90.2, // FX Rate
        'Matl Group': 'PUMPS',
        'Plnt': 'PLANT-B',
        'Vendor': 'EU Supplier Gmbh'
      }
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sampleRows);
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, testFile);

    const result = AssessmentDatasetParser.parseDataset(testFile, {
      assessmentId: 'AIC-TEST-CURR',
      dataVersionId: 'DV-CURR',
      fileName: 'currency_test.xlsx'
    });

    expect(result.currency.currenciesDetected).toContain('USD');
    expect(result.currency.currenciesDetected).toContain('EUR');
    expect(result.data.validRowCount).toBe(2);
    expect(result.module1.totalConvertedInrSpend).toBeCloseTo(1000 * 83.5 + 500 * 90.2, 0);

    // Clean up
    fs.unlinkSync(testFile);
  });
});
