import { describe, it, expect } from 'vitest';
import {
  isInternalCategoryCode,
  resolveHumanReadableCategory
} from '../../src/utils/procurementCategoryResolver';
import { UNMAPPED_CATEGORY_LABEL } from '../../src/constants/procurementCategoryMapping';

describe('procurementCategoryResolver', () => {
  describe('isInternalCategoryCode', () => {
    it('returns false for empty or undefined input', () => {
      expect(isInternalCategoryCode()).toBe(false);
      expect(isInternalCategoryCode('')).toBe(false);
      expect(isInternalCategoryCode('   ')).toBe(false);
    });

    it('returns true for known internal material groups', () => {
      expect(isInternalCategoryCode('P11')).toBe(true);
      expect(isInternalCategoryCode('P01')).toBe(true);
      expect(isInternalCategoryCode('KLPR20')).toBe(true);
      expect(isInternalCategoryCode('P04')).toBe(true);
      expect(isInternalCategoryCode('P06')).toBe(true);
      expect(isInternalCategoryCode('SPPOY04')).toBe(true);
      expect(isInternalCategoryCode('SPDTY03')).toBe(true);
    });

    it('returns false for approved human-readable categories', () => {
      expect(isInternalCategoryCode('SERVICES')).toBe(false);
      expect(isInternalCategoryCode('Packing')).toBe(false);
      expect(isInternalCategoryCode('Direct Materials')).toBe(false);
      expect(isInternalCategoryCode('FUEL')).toBe(false);
      expect(isInternalCategoryCode('ADMIN')).toBe(false);
    });

    it('returns true for unknown internal codes matching pattern', () => {
      expect(isInternalCategoryCode('XYZ999')).toBe(true);
    });
  });

  describe('resolveHumanReadableCategory', () => {
    it('maps representative internal material groups to their authoritative category names', () => {
      expect(resolveHumanReadableCategory('P11')).toBe('Packing');
      expect(resolveHumanReadableCategory('P01')).toBe('Packing');
      expect(resolveHumanReadableCategory('KLPR20')).toBe('Packing');
      expect(resolveHumanReadableCategory('P04')).toBe('Packing');
      expect(resolveHumanReadableCategory('P06')).toBe('Packing');
      expect(resolveHumanReadableCategory('SPPOY04')).toBe('Packing');
      expect(resolveHumanReadableCategory('SPDTY03')).toBe('DTY MECHANICAL');
    });

    it('preserves approved human-readable category names', () => {
      expect(resolveHumanReadableCategory('Packing')).toBe('Packing');
      expect(resolveHumanReadableCategory('SERVICES')).toBe('SERVICES');
      expect(resolveHumanReadableCategory('Direct Materials')).toBe('Direct Materials');
      expect(resolveHumanReadableCategory('FUEL')).toBe('FUEL');
      expect(resolveHumanReadableCategory('E&I')).toBe('E&I');
      expect(resolveHumanReadableCategory('PROJECT CAPEX')).toBe('PROJECT CAPEX');
    });

    it('falls back to rawMaterialGroup if rawCategory is missing or internal code', () => {
      expect(resolveHumanReadableCategory('', 'P11')).toBe('Packing');
      expect(resolveHumanReadableCategory(undefined, 'SPDTY03')).toBe('DTY MECHANICAL');
      expect(resolveHumanReadableCategory(null, 'P06')).toBe('Packing');
    });

    it('preserves multi-word or descriptive human-readable strings', () => {
      expect(resolveHumanReadableCategory('Industrial Chemical Supplies')).toBe('Industrial Chemical Supplies');
      expect(resolveHumanReadableCategory('Office Stationery & Printing')).toBe('Office Stationery & Printing');
    });

    it('returns Unmapped Category for unknown internal codes or empty values', () => {
      expect(resolveHumanReadableCategory('XYZ999')).toBe(UNMAPPED_CATEGORY_LABEL);
      expect(resolveHumanReadableCategory('')).toBe(UNMAPPED_CATEGORY_LABEL);
      expect(resolveHumanReadableCategory(null)).toBe(UNMAPPED_CATEGORY_LABEL);
      expect(resolveHumanReadableCategory(undefined)).toBe(UNMAPPED_CATEGORY_LABEL);
      expect(resolveHumanReadableCategory(UNMAPPED_CATEGORY_LABEL)).toBe(UNMAPPED_CATEGORY_LABEL);
    });
  });
});
