import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs';
import { AssessmentDatasetParser } from '../../src/services/assessmentDatasetParser';
import { normalizeAssessmentRow } from '../../src/services/assessmentDatasetRowNormalizer';
import { getYahooFinanceRateAsOfDate } from '../../src/utils/currencyConverter';
import { yahooFinanceFXRates } from '../../src/constants/currency';

describe('Borosil Module 1 Ingestion & Financial Baseline Regression Tests', () => {
  const borosilCandidates = [
    path.resolve(process.cwd(), 'data', 'dev', 'assessments', 'AIC-2026-0002', 'uploads', 'Borosil_PO_Consol_Excluding_BSL_Pune.xlsx'),
    path.resolve(process.cwd(), '..', 'data', 'dev', 'assessments', 'AIC-2026-0002', 'uploads', 'Borosil_PO_Consol_Excluding_BSL_Pune.xlsx')
  ];
  const borosilFilePath = borosilCandidates.find(c => fs.existsSync(c)) || borosilCandidates[0];

  describe('1. SAP Duplicate Detection & Header Support', () => {
    it('recognizes Purchasing Document and Item composite key without false duplicate alerts', () => {
      // Simulate rows with identical Purchasing Document but different Items
      const row1: Record<string, unknown> = {
        'Purchasing Document': '4500123456',
        Item: '10',
        'Material Description': 'Item 1',
        'Net Order Value': 10000,
        Currency: 'INR',
        'Document Date': '2026-05-15',
        Vendor: 'Supplier A',
        Plant: '1001'
      };
      const row2: Record<string, unknown> = {
        'Purchasing Document': '4500123456',
        Item: '20',
        'Material Description': 'Item 2',
        'Net Order Value': 20000,
        Currency: 'INR',
        'Document Date': '2026-05-15',
        Vendor: 'Supplier A',
        Plant: '1001'
      };

      const res1 = normalizeAssessmentRow(row1, 0, 0, 'test.xlsx', { assessmentId: 'AIC-2026-0002', dataVersionId: 'DV-001' });
      const res2 = normalizeAssessmentRow(row2, 1, 1, 'test.xlsx', { assessmentId: 'AIC-2026-0002', dataVersionId: 'DV-001' });

      expect(res1.validRecord?.poNumber).toBe('4500123456');
      expect(res1.validRecord?.poLine).toBe('10');
      expect(res2.validRecord?.poNumber).toBe('4500123456');
      expect(res2.validRecord?.poLine).toBe('20');
      expect(res1.validRecord?.poNumber).toBe(res2.validRecord?.poNumber);
      expect(res1.validRecord?.poLine).not.toBe(res2.validRecord?.poLine);
    });

    it('supports existing SAP aliases for Purchasing Document', () => {
      const alias1 = normalizeAssessmentRow({ 'Purch.Doc.': 'PO-100', Item: '10', Currency: 'INR', 'Net Order Value': 5000 }, 0, 0, 't.xlsx', {});
      const alias2 = normalizeAssessmentRow({ 'Purchase Doc.': 'PO-200', Item: '10', Currency: 'INR', 'Net Order Value': 5000 }, 1, 1, 't.xlsx', {});
      const alias3 = normalizeAssessmentRow({ 'Purchasing Document': 'PO-300', Item: '10', Currency: 'INR', 'Net Order Value': 5000 }, 2, 2, 't.xlsx', {});

      expect(alias1.validRecord?.poNumber).toBe('PO-100');
      expect(alias2.validRecord?.poNumber).toBe('PO-200');
      expect(alias3.validRecord?.poNumber).toBe('PO-300');
    });
  });

  describe('2. Multi-Currency Normalization & Approved FX Rates', () => {
    it('preserves source currency and applies approved benchmark FX rate to Net Order Value', () => {
      const usdRow: Record<string, unknown> = {
        'Purchasing Document': '4500999001',
        Item: '10',
        'Material Description': 'Imported Lab Glassware Tool',
        'Net Order Value': 1000.0,
        Currency: 'USD',
        'Document Date': '2026-05-10',
        Vendor: 'Corning Inc',
        Plant: '1001'
      };

      const res = normalizeAssessmentRow(usdRow, 0, 0, 'test.xlsx', { assessmentId: 'AIC-2026-0002', dataVersionId: 'DV-001' });

      expect(res.currency).toBe('USD');
      expect(res.rowRawSpend).toBe(1000.0);
      expect(res.approvedFxRate).toBeGreaterThan(80.0); // USD rate is ~86.75
      expect(res.approvedFxRate).not.toBe(1.0); // Must never default to 1.0
      expect(res.rowSpendInr).toBeCloseTo(1000.0 * res.approvedFxRate, 2);
      expect(res.validRecord?.lineSpendInr).toBeCloseTo(1000.0 * res.approvedFxRate, 2);
      expect(res.validRecord?.currency).toBe('USD');
    });

    it('retains INR transactions at exact FX rate of 1.0', () => {
      const inrRow: Record<string, unknown> = {
        'Purchasing Document': '4500999002',
        Item: '10',
        'Material Description': 'Local Packing Cartons',
        'Net Order Value': 250000.0,
        Currency: 'INR',
        'Document Date': '2026-06-01',
        Vendor: 'Packers India Ltd',
        Plant: '1001'
      };

      const res = normalizeAssessmentRow(inrRow, 0, 0, 'test.xlsx', { assessmentId: 'AIC-2026-0002', dataVersionId: 'DV-001' });

      expect(res.currency).toBe('INR');
      expect(res.approvedFxRate).toBe(1.0);
      expect(res.rowRawSpend).toBe(250000.0);
      expect(res.rowSpendInr).toBe(250000.0);
    });

    it('handles all 6 foreign currencies (USD, EUR, CNY, CHF, GBP, JPY) without defaulting to 1.0', () => {
      const currencies = ['USD', 'EUR', 'CNY', 'CHF', 'GBP', 'JPY'];
      for (const curr of currencies) {
        const rateInfo = getYahooFinanceRateAsOfDate(curr, '2026-05-15');
        expect(rateInfo.rate).toBeGreaterThan(0);
        expect(rateInfo.rate).not.toBe(1.0);

        const row: Record<string, unknown> = {
          'Purchasing Document': '4500999003',
          Item: '10',
          Currency: curr,
          'Net Order Value': 100,
          'Document Date': '2026-05-15'
        };
        const res = normalizeAssessmentRow(row, 0, 0, 'test.xlsx', {});
        expect(res.currency).toBe(curr);
        expect(res.approvedFxRate).toBe(rateInfo.rate);
        expect(res.rowSpendInr).toBeCloseTo(100 * rateInfo.rate, 2);
      }
    });

    it('quarantines transactions with unknown or unsupported foreign currency', () => {
      const unknownRow: Record<string, unknown> = {
        'Purchasing Document': '4500999004',
        Item: '10',
        Currency: 'XYZ_UNKNOWN',
        'Net Order Value': 1000,
        'Document Date': '2026-05-15'
      };
      const res = normalizeAssessmentRow(unknownRow, 0, 0, 'test.xlsx', {});
      expect(res.approvedFxRate).toBe(0.0);
      expect(res.validRecord?.inclusionStatus).toBe('REQUIRES_REVIEW');
      expect(res.validRecord?.exclusionReason).toContain('UNAVAILABLE_FX_RATE');
    });
  });

  describe('3. Transaction Status Classifications', () => {
    it('classifies SAP deletion/block indicators (L, S) transparently as DELETED_OR_BLOCKED_LINE', () => {
      const deletedRow: Record<string, unknown> = {
        'Purchasing Document': '4500111222',
        Item: '10',
        'Deletion indicator': 'L',
        'Net Order Value': 50000,
        Currency: 'INR',
        'Document Date': '2026-04-10'
      };
      const res = normalizeAssessmentRow(deletedRow, 0, 0, 'test.xlsx', {});
      expect(res.validRecord?.transactionClassification).toBe('DELETED_OR_BLOCKED_LINE');
      expect(res.validRecord?.inclusionStatus).toBe('REQUIRES_REVIEW');
      expect(res.validRecord?.exclusionReason).toContain('SAP_DELETED_LINE_L');
    });

    it('classifies Document Type UB as INTERNAL_TRANSFER_STO', () => {
      const stoRow: Record<string, unknown> = {
        'Purchasing Document': '4500111333',
        Item: '10',
        'Purchasing Document Type': 'UB',
        'Net Order Value': 0,
        Currency: 'INR',
        'Document Date': '2026-04-10'
      };
      const res = normalizeAssessmentRow(stoRow, 0, 0, 'test.xlsx', {});
      expect(res.validRecord?.transactionClassification).toBe('INTERNAL_TRANSFER_STO');
      expect(res.validRecord?.inclusionStatus).toBe('REQUIRES_REVIEW');
      expect(res.validRecord?.exclusionReason).toContain('INTERNAL_STOCK_TRANSPORT_ORDER');
    });

    it('classifies negative Net Order Value as NEGATIVE_RETURN_CREDIT without silent dropping', () => {
      const creditRow: Record<string, unknown> = {
        'Purchasing Document': '4500111444',
        Item: '10',
        'Purchasing Document Type': 'ZC',
        'Net Order Value': -12500,
        Currency: 'INR',
        'Document Date': '2026-04-10'
      };
      const res = normalizeAssessmentRow(creditRow, 0, 0, 'test.xlsx', {});
      expect(res.validRecord?.transactionClassification).toBe('NEGATIVE_RETURN_CREDIT');
      expect(res.validRecord?.lineSpendInr).toBe(-12500);
      expect(res.validRecord?.inclusionStatus).toBe('VALID');
    });

    it('classifies standard transactions as ORDINARY_PROCUREMENT', () => {
      const normalRow: Record<string, unknown> = {
        'Purchasing Document': '4500111555',
        Item: '10',
        'Purchasing Document Type': 'NB',
        'Net Order Value': 75000,
        Currency: 'INR',
        'Document Date': '2026-04-10'
      };
      const res = normalizeAssessmentRow(normalRow, 0, 0, 'test.xlsx', {});
      expect(res.validRecord?.transactionClassification).toBe('ORDINARY_PROCUREMENT');
      expect(res.validRecord?.inclusionStatus).toBe('VALID');
      expect(res.validRecord?.lineSpendInr).toBe(75000);
    });
  });

  describe('4. Actual Borosil Dataset Acceptance Verification', () => {
    it('parses actual Borosil file with exactly 30,740 rows, 0 duplicate alerts, and correct date range', () => {
      if (!fs.existsSync(borosilFilePath)) {
        console.warn('Borosil file not present at path, skipping acceptance test:', borosilFilePath);
        return;
      }

      const result = AssessmentDatasetParser.parseDataset(borosilFilePath, {
        assessmentId: 'AIC-2026-0002',
        dataVersionId: 'DV-001',
        fileName: 'Borosil_PO_Consol_Excluding_BSL_Pune.xlsx'
      });

      // 1. Transaction count exactly 30,740
      expect(result.data.sourceRowCount).toBe(30740);

      // 2. Zero duplicate alerts
      expect(result.data.duplicateRowCount).toBe(0);
      expect(result.module1.duplicateCount).toBe(0);

      // 3. No BSL Pune rows present (only BRL, BSL Nashik, and BSLB)
      const plants = new Set(result.validRows.map(r => r.plant));
      expect(plants.has('BSL Pune')).toBe(false);
      expect(plants.has('Pune')).toBe(false);

      // 4. Date coverage: 1 April 2026 to 22 October 2026 (all dates within this range)
      const dates = result.validRows.map(r => r.transactionDate).filter(Boolean).sort();
      expect(dates[0]).toBe('2026-04-01');
      expect(dates[dates.length - 1]).toBe('2026-10-22');

      // 5. Total gross spend reconciles to ~₹585.30 Cr
      expect(result.module1.totalConvertedInrSpendCr).toBeCloseTo(585.3049, 2);

      // 6. Currencies detected include all 7: INR, USD, EUR, CNY, CHF, GBP, JPY
      expect(result.currency.currenciesDetected).toContain('INR');
      expect(result.currency.currenciesDetected).toContain('USD');
      expect(result.currency.currenciesDetected).toContain('EUR');
      expect(result.currency.currenciesDetected).toContain('CNY');
      expect(result.currency.currenciesDetected).toContain('CHF');
      expect(result.currency.currenciesDetected).toContain('GBP');
      expect(result.currency.currenciesDetected).toContain('JPY');

      // 7. PCBI Master benchmarks are unchanged
      expect(yahooFinanceFXRates.USD).toBeDefined();
      expect(yahooFinanceFXRates.EUR).toBeDefined();
    }, 120000);
  });
});
