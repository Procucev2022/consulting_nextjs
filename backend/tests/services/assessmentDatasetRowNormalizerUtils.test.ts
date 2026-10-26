import { describe, it, expect } from 'vitest';
import {
  parseExcelDate,
  findValueByKeys,
  isRowDeleted,
  resolveCategoryAndGroup,
  resolveEntities,
  computeRowSpend
} from '../../src/services/assessmentDatasetRowNormalizerUtils';

describe('assessmentDatasetRowNormalizerUtils', () => {
  describe('parseExcelDate', () => {
    it('parses numeric excel serial numbers', () => {
      const res = parseExcelDate(44593); // FY22 date
      expect(res.isoDate).toBeDefined();
      expect(res.monthKey).toBeDefined();
      expect(res.fiscalYear).toMatch(/^FY\d{2}$/);
    });

    it('parses numeric excel serial numbers in Q1 (Jan-Mar) with correct FY', () => {
      // 44950 corresponds to late Jan 2023 -> FY23
      const res = parseExcelDate(44950);
      expect(res.isoDate).toBeDefined();
      expect(res.fiscalYear).toBe('FY23');
    });

    it('parses valid ISO string dates', () => {
      const res = parseExcelDate('2022-08-15');
      expect(res.isoDate).toBe('2022-08-15');
      expect(res.monthKey).toBe('2022-08');
      expect(res.fiscalYear).toBe('FY23');
    });

    it('parses Jan-Mar string dates with current year FY', () => {
      const res = parseExcelDate('2023-02-10');
      expect(res.isoDate).toBe('2023-02-10');
      expect(res.monthKey).toBe('2023-02');
      expect(res.fiscalYear).toBe('FY23');
    });

    it('falls back to default date on invalid string or non-date values', () => {
      const resInvalid = parseExcelDate('not-a-date');
      expect(resInvalid.isoDate).toBe('2023-01-15');
      expect(resInvalid.monthKey).toBe('2023-01');
      expect(resInvalid.fiscalYear).toBe('FY23');

      const resNull = parseExcelDate(null);
      expect(resNull.isoDate).toBe('2023-01-15');
    });
  });

  describe('findValueByKeys', () => {
    it('finds values with exact, case-insensitive, or stripped punctuation matching', () => {
      const row = {
        'Basic Value in Crs.': 12.34,
        'Supplier Desc': 'ACME SUPPLIES',
        EmptyField: '   ',
        NullField: null
      };

      expect(findValueByKeys(row, ['basic value in crs'])).toBe(12.34);
      expect(findValueByKeys(row, ['Basic Value In Crs.'])).toBe(12.34);
      expect(findValueByKeys(row, ['Supplier Desc'])).toBe('ACME SUPPLIES');
      expect(findValueByKeys(row, ['EmptyField'])).toBeUndefined();
      expect(findValueByKeys(row, ['NullField'])).toBeUndefined();
      expect(findValueByKeys(row, ['MissingField'])).toBeUndefined();
    });
  });

  describe('isRowDeleted', () => {
    it('detects deleted indicators correctly', () => {
      expect(isRowDeleted({ 'Deletion Indicator': 'D' })).toBe(true);
      expect(isRowDeleted({ LOEKZ: 'X' })).toBe(true);
      expect(isRowDeleted({ 'Deletion indicator': true })).toBe(true);
      expect(isRowDeleted({ 'Deletion Indicator': 'DELETED' })).toBe(true);
      expect(isRowDeleted({ 'Deletion Indicator': '' })).toBe(false);
      expect(isRowDeleted({})).toBe(false);
    });
  });

  describe('resolveCategoryAndGroup', () => {
    it('resolves material group, department, and procurement category', () => {
      const row1 = {
        'Material Group': 'RAW_MATERIALS',
        'Department Name': 'Production',
        'Procurement Category': 'Direct Packaging'
      };
      const res1 = resolveCategoryAndGroup(row1);
      expect(res1.materialGroup).toBe('RAW_MATERIALS');
      expect(res1.department).toBe('Production');
      expect(res1.procurementCategory).toBeDefined();

      const row2 = {
        Department: 'Logistics'
      };
      const res2 = resolveCategoryAndGroup(row2);
      expect(res2.department).toBe('Logistics');
      expect(res2.materialGroup).toBe('Logistics');
    });
  });

  describe('resolveEntities', () => {
    it('extracts PO number, line, vendor, material, and plant', () => {
      const row = {
        'Purchasing Document': '4500123456',
        Item: '10',
        'Vendor Name': 'Test Supplier Ltd',
        'Vendor Code': 'V100',
        Material: 'MAT-999',
        'Short Text': 'Precision Glass Tube',
        Plant: '2001'
      };
      const res = resolveEntities(row, 0);
      expect(res.poNum).toBe('4500123456');
      expect(res.poLine).toBe('10');
      expect(res.vendorName).toBe('Test Supplier Ltd');
      expect(res.vendorCode).toBe('V100');
      expect(res.materialCode).toBe('MAT-999');
      expect(res.shortText).toBe('Precision Glass Tube');
      expect(res.plant).toBe('2001');
    });
  });

  describe('computeRowSpend', () => {
    it('computes spend correctly for INR with Net Order Value', () => {
      const row = {
        'Net Order Value': 50000,
        Quantity: 50,
        'Price unit': 1,
        'Net price': 1000
      };
      const res = computeRowSpend(row, 'INR', 1.0);
      expect(res.rowRawSpend).toBe(50000);
      expect(res.rowSpendInr).toBe(50000);
      expect(res.qty).toBe(50);
      expect(res.netPrice).toBe(1000);
    });

    it('computes spend correctly for foreign currency with FX rate', () => {
      const row = {
        'Net Order Value': 1000,
        Quantity: 10,
        'Price unit': 1,
        'Net price': 100
      };
      const res = computeRowSpend(row, 'USD', 86.75);
      expect(res.rowRawSpend).toBe(1000);
      expect(res.rowSpendInr).toBe(86750);
    });

    it('handles Price unit > 1 (e.g. 1000) when calculating from qty and price', () => {
      const row = {
        Quantity: 2000,
        'Price unit': 1000,
        'Net price': 500
      };
      const res = computeRowSpend(row, 'INR', 1.0);
      // (2000 * 500) / 1000 = 1000
      expect(res.rowRawSpend).toBe(1000);
      expect(res.rowSpendInr).toBe(1000);
    });

    it('respects Basic Value in Crs when present', () => {
      const row = {
        'Basic Value in Crs.': 0.05
      };
      const res = computeRowSpend(row, 'INR', 1.0);
      expect(res.rowSpendInr).toBe(500000);
    });
  });
});
