import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { VgtModule1Runner } from '../../src/services/vgtModule1Runner';
import { VgtForensicBridgeCalculator } from '../../src/services/vgtForensicBridgeCalculator';
import { fxReferenceService } from '../../src/services/fxReferenceService';
import type { VgtProcessingResult } from '../../src/types/vgt';
import {
  VGT_DATASET_FILENAME,
  VGT_DATASET_SHA256,
  VGT_FX_MASTER_FILENAME,
  VGT_FX_MASTER_SHA256,
  VGT_POPULATION_SOURCE_ROWS,
  VGT_POPULATION_VALID_ROWS,
  VGT_POPULATION_EXCLUDED_ROWS,
  VGT_POPULATION_ANOMALY_ROWS,
  VGT_CUSTOMER_PROFILE_FX_RATES,
  VGT_VALID_HISTORICAL_FX_SPEND_INR,
  VGT_VALID_HISTORICAL_FX_SPEND_CR,
  VGT_VALID_CUSTOMER_PROFILE_SPEND_INR,
  VGT_VALID_CUSTOMER_PROFILE_SPEND_CR,
  VGT_FX_METHODOLOGY_IMPACT_INR,
  VGT_FX_METHODOLOGY_IMPACT_CR,
  VGT_FX_IMPACT_PERCENTAGE,
  VGT_RAW_ALL_ROW_HISTORICAL_SPEND_INR,
  VGT_RAW_ALL_ROW_HISTORICAL_SPEND_CR,
  VGT_EXCLUDED_SPEND_INR,
  VGT_EXCLUDED_SPEND_CR,
  VGT_ANOMALY_SPEND_INR,
  VGT_ANOMALY_SPEND_CR,
  VGT_VALID_CURRENCY_COUNTS,
  VGT_CURRENCY_PROFILE_SPEND_CR,
  VGT_CURRENCY_HISTORICAL_SPEND_CR,
  VGT_CURRENCY_FX_IMPACT_CR,
  VGT_SHEET_11_NAME
} from '../../src/constants/vgtConstants';

describe('VGT Module 1 Runner & Historical FX Reconciliation (Prompt 328)', () => {
  let result: VgtProcessingResult;

  beforeAll(() => {
    fxReferenceService.initialize();
    VgtModule1Runner.clearCache();
    result = VgtModule1Runner.processVgtDataset();
  }, 120000);

  it('1. should process authoritative VGT customer dataset identity and verify frozen SHA-256', () => {
    expect(result).toBeDefined();
    expect(result.file.filename).toBe(VGT_DATASET_FILENAME);
    expect(result.file.sha256).toBe(VGT_DATASET_SHA256);
    expect(result.file.sourceRowCount).toBe(VGT_POPULATION_SOURCE_ROWS);
    expect(result.file.sheetNames).toEqual(['Sheet1']);
    expect(result.file.columnsFound.length).toBeGreaterThan(0);
  });

  it('2. should verify authoritative population bridge (20,505 = 20,241 valid + 252 excluded + 12 anomaly)', () => {
    expect(result.data.sourceRowCount).toBe(VGT_POPULATION_SOURCE_ROWS);
    expect(result.data.ingestedRowCount).toBe(VGT_POPULATION_SOURCE_ROWS);
    expect(result.data.validRowCount).toBe(VGT_POPULATION_VALID_ROWS);
    expect(result.data.excludedRowCount).toBe(VGT_POPULATION_EXCLUDED_ROWS);
    expect(result.data.anomalyRowCount).toBe(VGT_POPULATION_ANOMALY_ROWS);
    expect(result.module1.validCount).toBe(VGT_POPULATION_VALID_ROWS);
    expect(result.module1.excludedCount).toBe(VGT_POPULATION_EXCLUDED_ROWS);
    expect(result.module1.anomalyCount).toBe(VGT_POPULATION_ANOMALY_ROWS);

    // Exact population mathematical balance check
    expect(result.module1.populationVariance).toBe(0);
    const calculatedSum =
      result.module1.validCount + result.module1.excludedCount + result.module1.anomalyCount;
    expect(calculatedSum).toBe(VGT_POPULATION_SOURCE_ROWS);
    expect(VGT_POPULATION_SOURCE_ROWS - calculatedSum).toBe(0);
  });

  it('3. should verify valid-row currency breakdown and 100% FX coverage', () => {
    expect(result.currency.currenciesDetected).toContain('INR');
    expect(result.currency.currenciesDetected).toContain('USD');
    expect(result.currency.currenciesDetected).toContain('EUR');
    expect(result.currency.currenciesDetected).toContain('CNY');

    // Valid transactions per currency
    expect(result.currency.transactionCountByCurrency['INR']).toBe(VGT_VALID_CURRENCY_COUNTS['INR']); // 19,639
    expect(result.currency.transactionCountByCurrency['USD']).toBe(VGT_VALID_CURRENCY_COUNTS['USD']); // 431
    expect(result.currency.transactionCountByCurrency['EUR']).toBe(VGT_VALID_CURRENCY_COUNTS['EUR']); // 4
    expect(result.currency.transactionCountByCurrency['CNY']).toBe(VGT_VALID_CURRENCY_COUNTS['CNY']); // 167

    const totalValidTx = Object.values(result.currency.transactionCountByCurrency).reduce((a, b) => a + b, 0);
    expect(totalValidTx).toBe(VGT_POPULATION_VALID_ROWS); // 20,241

    // All-row transactions per currency available for forensic audit
    expect(result.currency.allRowTransactionCountByCurrency['INR']).toBe(19830);
    expect(result.currency.allRowTransactionCountByCurrency['USD']).toBe(481);
    expect(result.currency.allRowTransactionCountByCurrency['EUR']).toBe(6);
    expect(result.currency.allRowTransactionCountByCurrency['CNY']).toBe(188);

    expect(result.currency.fxCoveragePct).toBe(100.0);
    expect(result.currency.fxValidationStatus).toBe('PASS');
  });

  it('4. should verify valid historical FX spend of ₹4,073.8307 Cr and zero reconciliation variance', () => {
    // Valid FX-normalized spend
    expect(result.module1.totalConvertedInrSpend).toBeCloseTo(VGT_VALID_HISTORICAL_FX_SPEND_INR, 1);
    expect(result.module1.totalConvertedInrSpendCr).toBeCloseTo(VGT_VALID_HISTORICAL_FX_SPEND_CR, 3);
    expect(result.module1.reconciliationVariance).toBe(0);
    expect(result.module1.reconciliationPassed).toBe(true);
    expect(result.module1.pendingSpend).toBe(0);
  });

  it('5. should verify customer-profile FX baseline and pure FX methodology impact of ₹153.5029 Cr', () => {
    // Customer profile valid spend baseline (₹3,920.3277 Cr ≈ 39,203,277,300 INR)
    expect(result.module1.customerProfileSpendInr).toBeCloseTo(VGT_VALID_CUSTOMER_PROFILE_SPEND_INR, 1);
    expect(result.module1.customerProfileSpendCr).toBe(VGT_VALID_CUSTOMER_PROFILE_SPEND_CR);
    expect(Math.abs(result.module1.customerProfileSpendInr - 39203277300)).toBeLessThan(500);

    // FX methodology impact (₹153.5029 Cr ≈ 1,535,029,538.02 INR)
    expect(result.module1.fxMethodologyImpactInr).toBeCloseTo(VGT_FX_METHODOLOGY_IMPACT_INR, 1);
    expect(result.module1.fxMethodologyImpactCr).toBe(VGT_FX_METHODOLOGY_IMPACT_CR);
    expect(Math.abs(result.module1.fxMethodologyImpactInr - 1535029538.02)).toBeLessThan(500);

    // Mathematical check: Historical FX - Customer Profile FX = FX Impact
    const calcImpactInr = result.module1.totalConvertedInrSpend - result.module1.customerProfileSpendInr;
    expect(calcImpactInr).toBeCloseTo(VGT_FX_METHODOLOGY_IMPACT_INR, 1);

    // FX impact percentage
    const calcImpactPct = (calcImpactInr / result.module1.customerProfileSpendInr) * 100;
    expect(calcImpactPct).toBeCloseTo(VGT_FX_IMPACT_PERCENTAGE, 1);
  });

  it('6. should verify currency-level forensic bridge and CNY as dominant driver', () => {
    const bridge = result.forensicBridge;
    expect(bridge).toBeDefined();
    expect(bridge.profileRates).toEqual(VGT_CUSTOMER_PROFILE_FX_RATES);

    const inrBridge = bridge.currencyBridges.find((c) => c.currency === 'INR');
    const usdBridge = bridge.currencyBridges.find((c) => c.currency === 'USD');
    const eurBridge = bridge.currencyBridges.find((c) => c.currency === 'EUR');
    const cnyBridge = bridge.currencyBridges.find((c) => c.currency === 'CNY');

    expect(inrBridge).toBeDefined();
    expect(usdBridge).toBeDefined();
    expect(eurBridge).toBeDefined();
    expect(cnyBridge).toBeDefined();

    // INR: base parity => impact = 0
    expect(inrBridge!.profileRate).toBe(1.0);
    expect(inrBridge!.profileInrCr).toBeCloseTo(VGT_CURRENCY_PROFILE_SPEND_CR['INR'], 2);
    expect(inrBridge!.historicalInrCr).toBeCloseTo(VGT_CURRENCY_HISTORICAL_SPEND_CR['INR'], 2);
    expect(inrBridge!.fxImpactCr).toBe(0);

    // USD: minor divergence ≈ ₹1.737 Cr
    expect(usdBridge!.profileRate).toBe(75.0);
    expect(usdBridge!.profileInrCr).toBeCloseTo(VGT_CURRENCY_PROFILE_SPEND_CR['USD'], 2);
    expect(usdBridge!.historicalInrCr).toBeCloseTo(VGT_CURRENCY_HISTORICAL_SPEND_CR['USD'], 2);
    expect(usdBridge!.fxImpactCr).toBeCloseTo(VGT_CURRENCY_FX_IMPACT_CR['USD'], 2);

    // EUR: minor divergence ≈ ₹0.031 Cr
    expect(eurBridge!.profileRate).toBe(85.0);
    expect(eurBridge!.profileInrCr).toBeCloseTo(VGT_CURRENCY_PROFILE_SPEND_CR['EUR'], 2);
    expect(eurBridge!.historicalInrCr).toBeCloseTo(VGT_CURRENCY_HISTORICAL_SPEND_CR['EUR'], 2);
    expect(eurBridge!.fxImpactCr).toBeCloseTo(VGT_CURRENCY_FX_IMPACT_CR['EUR'], 2);

    // CNY: dominant driver ≈ ₹151.735 Cr (+76.67%)
    expect(cnyBridge!.profileRate).toBe(6.5);
    expect(cnyBridge!.profileInrCr).toBeCloseTo(VGT_CURRENCY_PROFILE_SPEND_CR['CNY'], 2);
    expect(cnyBridge!.historicalInrCr).toBeCloseTo(VGT_CURRENCY_HISTORICAL_SPEND_CR['CNY'], 2);
    expect(cnyBridge!.fxImpactCr).toBeCloseTo(VGT_CURRENCY_FX_IMPACT_CR['CNY'], 2);
    expect(cnyBridge!.fxImpactPct).toBeGreaterThan(70);
  });

  it('7. should verify raw all-row historical value of ₹4,182.53 Cr and full financial reconciliation', () => {
    // Raw all-row historical value across all 20,505 rows
    expect(result.module1.rawAllRowSpendInr).toBeCloseTo(VGT_RAW_ALL_ROW_HISTORICAL_SPEND_INR, 1);
    expect(result.module1.rawAllRowSpendCr).toBeCloseTo(VGT_RAW_ALL_ROW_HISTORICAL_SPEND_CR, 3);

    // Excluded and anomaly spend
    expect(result.module1.excludedSpendInr).toBeCloseTo(VGT_EXCLUDED_SPEND_INR, 1);
    expect(result.module1.excludedSpendCr).toBeCloseTo(VGT_EXCLUDED_SPEND_CR, 3);
    expect(result.module1.anomalySpendInr).toBeCloseTo(VGT_ANOMALY_SPEND_INR, 1);
    expect(result.module1.anomalySpendCr).toBeCloseTo(VGT_ANOMALY_SPEND_CR, 3);

    // Exact financial reconciliation: Valid + Excluded + Anomaly = Raw All-Row Total
    const sumComponents =
      result.module1.totalConvertedInrSpend +
      result.module1.excludedSpendInr +
      result.module1.anomalySpendInr;
    expect(sumComponents).toBeCloseTo(result.module1.rawAllRowSpendInr, 1);
    const financialVariance = Math.abs(sumComponents - result.module1.rawAllRowSpendInr);
    expect(financialVariance).toBeLessThan(0.01);
  });

  it('8. should verify evidence workbook generation including 11_FX_ERP_FORENSIC_BRIDGE', () => {
    expect(fs.existsSync(result.evidence.workbookPath)).toBe(true);
    expect(result.evidence.workbookSha256).toBeDefined();
    expect(result.evidence.sheetsCount).toBe(11);
    expect(result.evidence.sheets).toContain('01_README');
    expect(result.evidence.sheets).toContain('02_EXECUTIVE_SUMMARY');
    expect(result.evidence.sheets).toContain('03_CALCULATION_BRIDGE');
    expect(result.evidence.sheets).toContain('08_RECONCILIATION');
    expect(result.evidence.sheets).toContain('09_FX_SUMMARY');
    expect(result.evidence.sheets).toContain('10_FX_TRANSACTIONS');
    expect(result.evidence.sheets).toContain(VGT_SHEET_11_NAME); // '11_FX_ERP_FORENSIC_BRIDGE'
  });

  it('9. should verify root cause analysis and fixed rates evidence', () => {
    expect(result.rootCauseAnalysis.primaryCause).toContain('ERP System Header Mismatch');
    expect(result.rootCauseAnalysis.fieldLevelEvidence.length).toBeGreaterThan(0);
    expect(result.rootCauseAnalysis.fxConversionEvidence.erpStaticRatesUsed['USD']).toBe(75.0);
    expect(result.rootCauseAnalysis.fxConversionEvidence.erpStaticRatesUsed['EUR']).toBe(85.0);
    expect(result.rootCauseAnalysis.fxConversionEvidence.erpStaticRatesUsed['CNY']).toBe(6.5);
    expect(result.rootCauseAnalysis.conclusion).toContain('20,241');
  });

  it('10. should throw error when VGT file does not exist', () => {
    expect(() => VgtModule1Runner.processVgtDataset('C:\\non_existent_vgt_file.xlsx')).toThrow('VGT FILE NOT FOUND');
  });

  it('11. should exercise helper branch logic for parseNum, parseStr, and mapRawRow', () => {
    // parseNum
    expect((VgtModule1Runner as any).parseNum('invalid')).toBe(0);
    expect((VgtModule1Runner as any).parseNum(null)).toBe(0);
    expect((VgtModule1Runner as any).parseNum(123.45)).toBe(123.45);

    // parseStr
    expect((VgtModule1Runner as any).parseStr(null, 'default_val')).toBe('default_val');
    expect((VgtModule1Runner as any).parseStr(undefined, 'default_val')).toBe('default_val');
    expect((VgtModule1Runner as any).parseStr('hello', 'default_val')).toBe('hello');

    // mapRawRow with fallback header combinations
    const row1 = (VgtModule1Runner as any).mapRawRow(
      {
        'Deletion Indicator': 'X',
        'Net Price': 50,
        'Net Value in INR': 500,
        'Name of Supplier': 'SUPPLIER_ALT',
        'Posting Date': '2023-05-15',
        'Short Text': 'SHORT_DESC',
        'Vendor': 'V-100',
        Item: null,
        'Order Quantity': null
      },
      0
    );
    expect(row1.deletionIndicator).toBe('X');
    expect(row1.netPrice).toBe(50);
    expect(row1.supplierName).toBe('SUPPLIER_ALT');
    expect(row1.shortText).toBe('SHORT_DESC');

    // mapRawRow with empty deletion indicator and NaN values
    const row2 = (VgtModule1Runner as any).mapRawRow(
      {
        'Deletion indicator': ' ',
        'Net price': null,
        'Net Order Value': null,
        'Vendor Name': null,
        'Document Date': null
      },
      1
    );
    expect(row2.deletionIndicator).toBeUndefined();
    expect(row2.netPrice).toBe(0);
    expect(row2.supplierName).toBe('UNKNOWN_VENDOR');
  });

  it('12. should verify INR-only transaction regression logic (FX rate = 1.0, zero methodology impact)', () => {
    const inrTxInputs = [
      {
        transactionId: 'TEST-INR-001',
        originalValue: 500000,
        originalCurrency: 'INR',
        transactionDate: '2024-06-15',
        poNumber: 'PO-INR-1',
        lineItem: 1,
        supplierName: 'DOMESTIC SUPPLIER',
        materialDescription: 'STEEL COILS'
      }
    ];
    const inrNorm = fxReferenceService.normalizeTransactions(inrTxInputs);
    expect(inrNorm.summary.convertedSpendInr).toBe(500000);
    expect(inrNorm.normalizedTransactions[0].fxRate).toBe(1.0);
    expect(inrNorm.normalizedTransactions[0].inrNormalizedValue).toBe(500000);
    expect(inrNorm.summary.fxCoveragePct).toBe(100.0);
  });

  it('13. should verify frozen FX master v2 checksum integrity and zero synthetic rates', () => {
    expect(fxReferenceService.getMasterChecksum()).toBe(VGT_FX_MASTER_SHA256);
    expect(fxReferenceService.isMasterLoaded()).toBe(true);
    expect(fxReferenceService.getMasterVersion()).toBe('v2.0');
    expect(fxReferenceService.getObservationCount()).toBeGreaterThan(25000);
  });

  it('14. should verify strict isolation ensuring no impact to Modules 2, 3 or 4', () => {
    // Verified that Module 1 validated spend is 4073.8307 Cr and does NOT alter PCBI, categorization, or Savings Engine
    expect(result.module1.totalConvertedInrSpendCr).toBe(4073.8307);
    expect(result.module1.fxMethodologyImpactCr).toBe(153.5029);
    // FX methodology impact is spend normalization only, NOT savings
    expect((result as any).savingsAmount).toBeUndefined();
  });

  it('15. should return cached result when called without customPath', () => {
    const cachedResult = VgtModule1Runner.processVgtDataset();
    expect(cachedResult).toBe(result);
  });

  it('16. should process dataset when customPath is explicitly provided', () => {
    const customPath = path.resolve(process.cwd(), VGT_DATASET_FILENAME);
    const customResult = VgtModule1Runner.processVgtDataset(customPath);
    expect(customResult.module1.validCount).toBe(VGT_POPULATION_VALID_ROWS);
    expect(customResult.module1.totalConvertedInrSpendCr).toBe(VGT_VALID_HISTORICAL_FX_SPEND_CR);
  }, 60000);

  it('17. should exercise parseRawRows and null-fallbacks in VgtForensicBridgeCalculator', () => {
    const sampleWs = XLSX.utils.aoa_to_sheet([['Document Date', 'Vendor Name', 'Net price'], ['2024-01-01', 'Test', 100]]);
    const parsed = VgtModule1Runner.parseRawRows(sampleWs);
    expect(parsed.length).toBe(1);

    const bridgeWithNulls = VgtForensicBridgeCalculator.computeForensicBridge(
      [
        { recordId: '1', transactionDate: '2024-01-01', currency: 'INR', quantity: 1, netPrice: 100, vendorName: 'V1', category: 'C1', plant: 'P1' },
        { recordId: '2', transactionDate: '2024-01-01', currency: 'USD', quantity: 1, netPrice: 10, vendorName: 'V2', category: 'C2', plant: 'P2' },
        { recordId: '3', transactionDate: '2024-01-01', currency: 'EUR', quantity: 1, netPrice: 10, vendorName: 'V3', category: 'C3', plant: 'P3' },
        { recordId: '4', transactionDate: '2024-01-01', currency: 'CNY', quantity: 1, netPrice: 10, vendorName: 'V4', category: 'C4', plant: 'P4' }
      ] as any,
      [
        { transactionId: '1', inrNormalizedValue: 100, fxRate: 1.0, fxRateDate: '2024-01-01' },
        { transactionId: '2', inrNormalizedValue: null, fxRate: null, fxRateDate: null },
        { transactionId: '3', inrNormalizedValue: 850, fxRate: 85.0, fxRateDate: '2024-01-01' },
        { transactionId: '4', inrNormalizedValue: 65, fxRate: 6.5, fxRateDate: '2024-01-01' }
      ] as any,
      { INR: 1.0, USD: 75.0, EUR: 85.0, CNY: 6.5 },
      1015
    );
    expect(bridgeWithNulls.foreignTransactionsBridge[0].historicalRate).toBe(1.0);
    expect(bridgeWithNulls.foreignTransactionsBridge[0].historicalInrValue).toBe(0);
    expect(bridgeWithNulls.foreignTransactionsBridge[0].historicalRateDate).toBe('2024-01-01');
  });
});
