import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { VgtModule1Runner, type VgtProcessingResult } from '../../src/services/vgtModule1Runner';
import { fxReferenceService } from '../../src/services/fxReferenceService';

describe('VGT Module 1 Runner & Forensic Validation (Prompt 324)', () => {
  let result: VgtProcessingResult;

  beforeAll(() => {
    fxReferenceService.initialize();
    result = VgtModule1Runner.processVgtDataset();
  }, 120000);

  it('1. should process authoritative VGT customer dataset and return valid result', () => {
    expect(result).toBeDefined();
    expect(result.file.filename).toBe('VGT Testing Data.xlsx');
    expect(result.file.sha256).toBe('59625f2f91c303ef492b679511077a0882dab2d9760bce8b3f7edaca82d81def');
    expect(result.file.sourceRowCount).toBe(20505);
    expect(result.file.sheetNames).toEqual(['Sheet1']);
  });

  it('2. should verify data ingestion and validation counts', () => {
    expect(result.data.sourceRowCount).toBe(20505);
    expect(result.data.ingestedRowCount).toBe(20505);
    expect(result.data.validRowCount).toBe(20241);
    expect(result.data.excludedRowCount).toBe(252);
    expect(result.data.anomalyRowCount).toBe(12);
    expect(result.data.duplicateRowCount).toBe(0);
  });

  it('3. should verify currency breakdown and 100% FX coverage', () => {
    expect(result.currency.currenciesDetected).toContain('INR');
    expect(result.currency.currenciesDetected).toContain('USD');
    expect(result.currency.currenciesDetected).toContain('EUR');
    expect(result.currency.currenciesDetected).toContain('CNY');
    expect(result.currency.transactionCountByCurrency['INR']).toBe(19830);
    expect(result.currency.transactionCountByCurrency['USD']).toBe(481);
    expect(result.currency.transactionCountByCurrency['CNY']).toBe(188);
    expect(result.currency.transactionCountByCurrency['EUR']).toBe(6);
    expect(result.currency.fxCoveragePct).toBe(100.0);
    expect(result.currency.fxValidationStatus).toBe('PASS');
  });

  it('4. should verify converted INR spend and zero reconciliation variance', () => {
    expect(result.module1.totalConvertedInrSpend).toBeGreaterThan(40000000000);
    expect(result.module1.reconciliationVariance).toBe(0);
    expect(result.module1.reconciliationPassed).toBe(true);
    expect(result.module1.pendingSpend).toBe(0);
  });

  it('5. should verify root cause analysis details', () => {
    expect(result.rootCauseAnalysis.primaryCause).toContain('Header Mismatch');
    expect(result.rootCauseAnalysis.fieldLevelEvidence.length).toBeGreaterThan(0);
    expect(result.rootCauseAnalysis.fxConversionEvidence.erpStaticRatesUsed['USD']).toBe(75.0);
    expect(result.rootCauseAnalysis.fxConversionEvidence.erpStaticRatesUsed['CNY']).toBe(6.5);
    expect(result.rootCauseAnalysis.conclusion).toContain('20,505');
  });

  it('6. should verify evidence workbook generation and file existence', () => {
    expect(fs.existsSync(result.evidence.workbookPath)).toBe(true);
    expect(result.evidence.workbookSha256).toBeDefined();
    expect(result.evidence.sheetsCount).toBe(10);
    expect(result.evidence.sheets).toContain('01_README');
    expect(result.evidence.sheets).toContain('02_EXECUTIVE_SUMMARY');
    expect(result.evidence.sheets).toContain('08_RECONCILIATION');
    expect(result.evidence.sheets).toContain('09_FX_SUMMARY');
    expect(result.evidence.sheets).toContain('10_FX_TRANSACTIONS');
  });

  it('7. should throw error when VGT file does not exist', () => {
    expect(() => VgtModule1Runner.processVgtDataset('C:\\non_existent_vgt_file.xlsx')).toThrow('VGT FILE NOT FOUND');
  });

  it('8. should exercise helper branch logic for parseNum, parseStr, and mapRawRow', () => {
    // parseNum
    expect((VgtModule1Runner as any).parseNum('invalid')).toBe(0);
    expect((VgtModule1Runner as any).parseNum(null)).toBe(0);
    expect((VgtModule1Runner as any).parseNum(123.45)).toBe(123.45);

    // parseStr
    expect((VgtModule1Runner as any).parseStr(null, 'default_val')).toBe('default_val');
    expect((VgtModule1Runner as any).parseStr(undefined, 'default_val')).toBe('default_val');
    expect((VgtModule1Runner as any).parseStr('hello', 'default_val')).toBe('hello');

    // mapRawRow with fallback header combinations
    const row1 = (VgtModule1Runner as any).mapRawRow({
      'Deletion Indicator': 'X',
      'Net Price': 50,
      'Net Value in INR': 500,
      'Name of Supplier': 'SUPPLIER_ALT',
      'Posting Date': '2023-05-15',
      'Short Text': 'SHORT_DESC',
      'Vendor': 'V-100',
      'Item': null,
      'Order Quantity': null
    }, 0);
    expect(row1.deletionIndicator).toBe('X');
    expect(row1.netPrice).toBe(50);
    expect(row1.supplierName).toBe('SUPPLIER_ALT');
    expect(row1.shortText).toBe('SHORT_DESC');

    // mapRawRow with empty deletion indicator and NaN values
    const row2 = (VgtModule1Runner as any).mapRawRow({
      'Deletion indicator': ' ',
      'Net price': null,
      'Net Order Value': null,
      'Vendor Name': null,
      'Document Date': null
    }, 1);
    expect(row2.deletionIndicator).toBeUndefined();
    expect(row2.netPrice).toBe(0);
    expect(row2.supplierName).toBe('UNKNOWN_VENDOR');
  });
});
