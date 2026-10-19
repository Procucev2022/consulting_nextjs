import { describe, it, expect } from 'vitest';
import {
  parseExcelDate,
  findValueByKeys,
  isRowDeleted
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
});
