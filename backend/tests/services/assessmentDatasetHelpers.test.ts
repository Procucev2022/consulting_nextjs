import { describe, it, expect } from 'vitest';
import {
  parseExcelDate,
  findValueByKeys,
  isRowDeleted,
  normalizeAssessmentRow
} from '../../src/services/assessmentDatasetRowNormalizer';
import { AssessmentDatasetSyntheticBuilder } from '../../src/services/assessmentDatasetSyntheticBuilder';

describe('Assessment Dataset Helpers', () => {
  describe('parseExcelDate', () => {
    it('parses numeric Excel serial date correctly', () => {
      const res = parseExcelDate(44927); // 2023-01-01 approx
      expect(res.isoDate).toBeDefined();
      expect(res.monthKey).toBeDefined();
      expect(res.fiscalYear).toMatch(/^FY\d{2}$/);
    });

    it('parses string date correctly', () => {
      const res = parseExcelDate('2023-08-15');
      expect(res.isoDate).toBe('2023-08-15');
      expect(res.monthKey).toBe('2023-08');
      expect(res.fiscalYear).toBe('FY24');
    });

    it('returns default date for empty/invalid values', () => {
      const res = parseExcelDate('invalid-date');
      expect(res.isoDate).toBe('2023-01-15');
      expect(res.monthKey).toBe('2023-01');
      expect(res.fiscalYear).toBe('FY23');
    });
  });

  describe('findValueByKeys', () => {
    it('finds case-insensitive and stripped match', () => {
      const row = { 'Net Value in Crs.': 10.5, 'Other Field': 'test' };
      const val = findValueByKeys(row, ['Net Value in Crs', 'Amount']);
      expect(val).toBe(10.5);
    });

    it('returns undefined when no key matches', () => {
      const row = { Foo: 'Bar' };
      const val = findValueByKeys(row, ['Baz', 'Qux']);
      expect(val).toBeUndefined();
    });
  });

  describe('isRowDeleted', () => {
    it('identifies deleted flags', () => {
      expect(isRowDeleted({ 'Deletion Indicator': 'D' })).toBe(true);
      expect(isRowDeleted({ LOEKZ: 'X' })).toBe(true);
      expect(isRowDeleted({ 'Deletion indicator': true })).toBe(true);
      expect(isRowDeleted({ 'Deletion Indicator': 'deleted' })).toBe(true);
      expect(isRowDeleted({ 'Deletion Indicator': null })).toBe(false);
    });
  });

  describe('normalizeAssessmentRow', () => {
    const options = { assessmentId: 'AIC-2026-TEST', dataVersionId: 'DV-001' };

    it('marks row as deleted when flag is present', () => {
      const res = normalizeAssessmentRow({ 'Deletion Indicator': 'D' }, 0, 0, 'test.xlsx', options);
      expect(res.isDeleted).toBe(true);
    });

    it('marks row as anomaly when spend is negative', () => {
      const res = normalizeAssessmentRow({ 'Net Value in Crs.': -10 }, 0, 0, 'test.xlsx', options);
      expect(res.isAnomaly).toBe(true);
    });

    it('normalizes valid row with INR currency', () => {
      const row = {
        'Net Value in Crs.': 5.0,
        Currency: 'INR',
        'Vendor Name': 'Acme Corp',
        'Material': 'MAT-001'
      };
      const res = normalizeAssessmentRow(row, 0, 0, 'test.xlsx', options);
      expect(res.rowSpendInr).toBe(50000000);
      expect(res.validRecord).toBeDefined();
      expect(res.validRecord?.vendorName).toBe('Acme Corp');
      expect(res.normalizedRecord).toBeDefined();
    });

    it('normalizes valid row with raw value and exchange rate', () => {
      const row = {
        'Net Value': 1000,
        'CR': 80.0,
        Currency: 'USD',
        'Purch.Doc.': 'PO-999',
        'Vendor Name': 'Global Supplier'
      };
      const res = normalizeAssessmentRow(row, 1, 1, 'test.xlsx', options);
      expect(res.rowSpendInr).toBe(80000);
      expect(res.currency).toBe('USD');
      expect(res.validRecord?.poNumber).toBe('PO-999');
    });
  });

  describe('AssessmentDatasetSyntheticBuilder', () => {
    it('builds full synthetic dataset with 1000 rows', () => {
      const res = AssessmentDatasetSyntheticBuilder.buildSyntheticDataset('synthetic.xlsx', {
        assessmentId: 'AIC-2026-SYNTH',
        dataVersionId: 'DV-001'
      });
      expect(res.data.sourceRowCount).toBe(1000);
      expect(res.data.validRowCount).toBe(1000);
      expect(res.validRows.length).toBe(1000);
      expect(res.module1.totalConvertedInrSpendCr).toBe(125.40);
    });
  });
});
