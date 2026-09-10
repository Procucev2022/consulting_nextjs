import { describe, it, expect } from 'vitest';
import {
  buildVendorParetoHierarchy,
  buildItemParetoHierarchy,
  getDefaultParetoData,
  SEED_PARETO_RAW_RECORDS,
  DEFAULT_PARETO_CUTOFF_PCT
} from '@/utils/paretoCalculator';
import type { ParetoRawRecord } from '@/types';

describe('paretoCalculator', () => {
  describe('buildVendorParetoHierarchy', () => {
    it('returns empty result when records array is empty or undefined', () => {
      const emptyResult = buildVendorParetoHierarchy([]);
      expect(emptyResult.parents).toEqual([]);
      expect(emptyResult.totalSpendCr).toBe(0);
      expect(emptyResult.paretoSpendCr).toBe(0);
      expect(emptyResult.paretoPct).toBe(0);

      const nullResult = buildVendorParetoHierarchy(null as unknown as ParetoRawRecord[]);
      expect(nullResult.parents).toEqual([]);

      // Test records with 0 spend
      const zeroResult = buildVendorParetoHierarchy([{ vendorName: 'VZERO', shortText: 'IZERO', spendCr: 0 }]);
      expect(zeroResult.totalSpendCr).toBe(0);
      expect(zeroResult.parents[0].sharePct).toBe(0);
    });

    it('aggregates items under vendors, sorts descending, and applies 80% cutoff', () => {
      const mockRecords: ParetoRawRecord[] = [
        { vendorName: 'VENDOR A', shortText: 'ITEM 1', spendCr: 50 },
        { vendorName: 'VENDOR A', shortText: 'ITEM 2', spendCr: 30 },
        { vendorName: 'VENDOR B', shortText: 'ITEM 3', spendCr: 15 },
        { vendorName: 'VENDOR C', shortText: 'ITEM 4', spendCr: 5 }
      ];

      const result = buildVendorParetoHierarchy(mockRecords, 80);

      expect(result.totalSpendCr).toBe(100);
      expect(result.parents.length).toBe(1); // VENDOR A has 80 Cr (80% of 100), reaching the 80% cutoff!
      expect(result.parents[0].name).toBe('VENDOR A');
      expect(result.parents[0].totalSpendCr).toBe(80);
      expect(result.parents[0].sharePct).toBe(80);
      expect(result.parents[0].cumulativePct).toBe(80);
      expect(result.parents[0].isCutoffBoundary).toBe(true);

      // Check sorted children
      expect(result.parents[0].children).toEqual([
        { name: 'ITEM 1', spendCr: 50, percentage: 62.5 },
        { name: 'ITEM 2', spendCr: 30, percentage: 37.5 }
      ]);
    });

    it('handles negative or invalid spend values and trims whitespace', () => {
      const records: ParetoRawRecord[] = [
        { vendorName: '  VENDOR TRIM  ', shortText: '  ITEM TRIM  ', spendCr: 100 },
        { vendorName: '', shortText: '', spendCr: 10 },
        { vendorName: 'VENDOR NEG', shortText: 'ITEM NEG', spendCr: -5 }
      ];

      const result = buildVendorParetoHierarchy(records, 100);
      expect(result.parents.length).toBe(2);
      expect(result.parents[0].name).toBe('VENDOR TRIM');
      expect(result.parents[0].children[0].name).toBe('ITEM TRIM');
      expect(result.parents[1].name).toBe('UNKNOWN VENDOR');
      expect(result.parents[1].children[0].name).toBe('UNKNOWN ITEM');
    });

    it('handles custom cutoff percentages', () => {
      const mockRecords: ParetoRawRecord[] = [
        { vendorName: 'V1', shortText: 'I1', spendCr: 40 },
        { vendorName: 'V2', shortText: 'I2', spendCr: 30 },
        { vendorName: 'V3', shortText: 'I3', spendCr: 20 },
        { vendorName: 'V4', shortText: 'I4', spendCr: 10 }
      ];

      const result50 = buildVendorParetoHierarchy(mockRecords, 50);
      expect(result50.parents.length).toBe(2); // V1 (40%) + V2 (30%) = 70% >= 50%
      expect(result50.parents[0].name).toBe('V1');
      expect(result50.parents[1].name).toBe('V2');
      expect(result50.parents[1].isCutoffBoundary).toBe(true);
    });
  });

  describe('buildItemParetoHierarchy', () => {
    it('returns empty result when records array is empty or undefined', () => {
      const emptyResult = buildItemParetoHierarchy([]);
      expect(emptyResult.parents).toEqual([]);
      expect(emptyResult.totalSpendCr).toBe(0);

      const nullResult = buildItemParetoHierarchy(undefined as unknown as ParetoRawRecord[]);
      expect(nullResult.parents).toEqual([]);
    });

    it('aggregates vendors under items, sorts descending, and applies cutoff', () => {
      const mockRecords: ParetoRawRecord[] = [
        { vendorName: 'VENDOR X', shortText: 'RAW MATERIAL A', spendCr: 60 },
        { vendorName: 'VENDOR Y', shortText: 'RAW MATERIAL A', spendCr: 25 },
        { vendorName: 'VENDOR Z', shortText: 'RAW MATERIAL B', spendCr: 15 }
      ];

      const result = buildItemParetoHierarchy(mockRecords, 80);
      expect(result.totalSpendCr).toBe(100);
      expect(result.parents.length).toBe(1); // RAW MATERIAL A has 85 Cr (85% >= 80%)
      expect(result.parents[0].name).toBe('RAW MATERIAL A');
      expect(result.parents[0].totalSpendCr).toBe(85);
      expect(result.parents[0].children).toEqual([
        { name: 'VENDOR X', spendCr: 60, percentage: 70.6 },
        { name: 'VENDOR Y', spendCr: 25, percentage: 29.4 }
      ]);
    });

    it('handles fallback names and edge zero spend', () => {
      const records: ParetoRawRecord[] = [
        { vendorName: '', shortText: '', spendCr: 0 }
      ];
      const result = buildItemParetoHierarchy(records, 80);
      expect(result.parents.length).toBe(1);
      expect(result.parents[0].name).toBe('UNKNOWN ITEM');
      expect(result.parents[0].totalSpendCr).toBe(0);
      expect(result.parents[0].sharePct).toBe(0);
    });
  });

  describe('getDefaultParetoData & SEED_PARETO_RAW_RECORDS', () => {
    it('includes TRAFIGURA INDIA and BFN FORGINGS records from user specification', () => {
      const trafiguraRecords = SEED_PARETO_RAW_RECORDS.filter(
        (r) => r.vendorName === 'TRAFIGURA INDIA PRIVATE LIMITED'
      );
      expect(trafiguraRecords.length).toBe(3);
      expect(trafiguraRecords.some((r) => r.shortText === 'NICKEL' && r.spendCr === 1215.81)).toBe(true);
      expect(trafiguraRecords.some((r) => r.shortText === 'FERRO NICKEL - NI% 10 - 14' && r.spendCr === 40.04)).toBe(true);
      expect(trafiguraRecords.some((r) => r.shortText === 'FERRO NICKEL' && r.spendCr === 3.34)).toBe(true);

      const bfnRecords = SEED_PARETO_RAW_RECORDS.filter(
        (r) => r.vendorName === 'BFN FORGINGS PRIVATE LIMITED'
      );
      expect(bfnRecords.length).toBeGreaterThanOrEqual(10);
      expect(bfnRecords.some((r) => r.shortText.includes('304L 16 SORF'))).toBe(true);
    });

    it('computes default Pareto spend data with both vendor and item hierarchies', () => {
      const data = getDefaultParetoData();
      expect(data.vendorHierarchy.length).toBeGreaterThan(0);
      expect(data.itemHierarchy.length).toBeGreaterThan(0);
      expect(data.totalSpendCr).toBeGreaterThan(7000);
      expect(data.paretoSpendCr).toBeGreaterThan(5000);
      expect(data.paretoPct).toBeGreaterThanOrEqual(DEFAULT_PARETO_CUTOFF_PCT);

      // Verify top vendor is either JINDAL or VALE or TRAFIGURA
      expect(data.vendorHierarchy.some((v) => v.name.includes('TRAFIGURA'))).toBe(true);
      // Verify top item is NICKEL
      expect(data.itemHierarchy[0].name).toBe('NICKEL');
    });
  });
});
