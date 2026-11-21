import { describe, it, expect } from 'vitest';
import {
  sortMonthsChronologically,
  formatMonthRangeLabel,
  alignWeeklyIndicesToMonths,
  buildCorrelatedMonthlySeries,
  normalizeCoreCategory,
  deriveVendorRankingsFromValidationRecords,
  calculateModule3SummaryMetrics
} from '../../src/utils/module3Trend';
import type {
  MonthWiseSummary,
  PcbiWeeklyIndexResponse,
  ValidationPreCheckRecord,
  VendorPriceRank
} from '../../src/types';

describe('module3Trend utilities', () => {
  const sampleMonths: MonthWiseSummary[] = [
    {
      month_key: '2024-03',
      month_label: 'Mar 2024',
      fiscal_year: 'FY24',
      spend_inr_cr: 15.2,
      po_count: 10,
      top_material_group: 'Packaging',
      top_plant: 'Plant 1'
    },
    {
      month_key: '2023-04',
      month_label: 'Apr 2023',
      fiscal_year: 'FY24',
      spend_inr_cr: 10.5,
      po_count: 8,
      top_material_group: 'Direct',
      top_plant: 'Plant 1'
    },
    {
      month_key: '2025-02',
      month_label: 'Feb 2025',
      fiscal_year: 'FY25',
      spend_inr_cr: 20.0,
      po_count: 12,
      top_material_group: 'Direct',
      top_plant: 'Plant 2'
    }
  ];

  const sampleWeeklyIndices: PcbiWeeklyIndexResponse = [
    { pcbi_id: 'TEST-1', week_start: '2020-04-06', index_value: 80, unit: 'MT', currency: 'INR' },
    { pcbi_id: 'TEST-1', week_start: '2023-04-10', index_value: 100, unit: 'MT', currency: 'INR' },
    { pcbi_id: 'TEST-1', week_start: '2023-04-17', index_value: 102, unit: 'MT', currency: 'INR' },
    { pcbi_id: 'TEST-1', week_start: '2024-03-04', index_value: 110, unit: 'MT', currency: 'INR' },
    { pcbi_id: 'TEST-1', week_start: '2025-02-10', index_value: 120, unit: 'MT', currency: 'INR' },
    { pcbi_id: 'TEST-1', week_start: '2026-07-27', index_value: 135, unit: 'MT', currency: 'INR' }
  ];

  describe('sortMonthsChronologically', () => {
    it('sorts months by month_key in ascending order', () => {
      const sorted = sortMonthsChronologically(sampleMonths);
      expect(sorted.map((m) => m.month_key)).toEqual(['2023-04', '2024-03', '2025-02']);
    });

    it('handles empty months list', () => {
      expect(sortMonthsChronologically([])).toEqual([]);
    });
  });

  describe('formatMonthRangeLabel', () => {
    it('returns empty string for empty array', () => {
      expect(formatMonthRangeLabel([])).toBe('');
    });

    it('returns single month label for one month', () => {
      expect(formatMonthRangeLabel([sampleMonths[0]])).toBe('Mar 2024');
    });

    it('returns range string for multiple months', () => {
      const sorted = sortMonthsChronologically(sampleMonths);
      expect(formatMonthRangeLabel(sorted)).toBe('Apr 2023 – Feb 2025');
    });
  });

  describe('alignWeeklyIndicesToMonths', () => {
    it('returns empty array when weeklyIndices is empty', () => {
      expect(alignWeeklyIndicesToMonths([])).toEqual([]);
    });

    it('returns last 36 weeks when months is undefined or empty', () => {
      const result = alignWeeklyIndicesToMonths(sampleWeeklyIndices);
      expect(result.length).toBe(sampleWeeklyIndices.length);
      expect(result[0].week_start).toBe('2020-04-06');
    });

    it('clips weekly indices strictly to the uploaded file months window', () => {
      const result = alignWeeklyIndicesToMonths(sampleWeeklyIndices, sampleMonths);
      expect(result.map((r) => r.week_start)).toEqual([
        '2023-04-10',
        '2023-04-17',
        '2024-03-04',
        '2025-02-10'
      ]);
      expect(result.some((r) => r.week_start === '2020-04-06')).toBe(false);
      expect(result.some((r) => r.week_start === '2026-07-27')).toBe(false);
    });

    it('falls back to last entries if no indices match the months window', () => {
      const futureMonths: MonthWiseSummary[] = [
        {
          month_key: '2029-01',
          month_label: 'Jan 2029',
          fiscal_year: 'FY29',
          spend_inr_cr: 10,
          po_count: 1,
          top_material_group: 'Direct',
          top_plant: 'P1'
        }
      ];
      const result = alignWeeklyIndicesToMonths(sampleWeeklyIndices, futureMonths);
      expect(result.length).toBe(sampleWeeklyIndices.length);
    });
  });

  describe('buildCorrelatedMonthlySeries', () => {
    it('returns empty array when months is empty', () => {
      expect(buildCorrelatedMonthlySeries([], sampleWeeklyIndices)).toEqual([]);
    });

    it('returns null values when weeklyIndices is empty', () => {
      expect(buildCorrelatedMonthlySeries([sampleMonths[0]], [])).toEqual([null]);
    });

    it('averages direct weekly index matches for matching months', () => {
      const sorted = sortMonthsChronologically(sampleMonths);
      const series = buildCorrelatedMonthlySeries(sorted, sampleWeeklyIndices);
      expect(series[0]).toBe(101); // (100 + 102) / 2 = 101 for 2023-04
      expect(series[1]).toBe(110); // 110 for 2024-03
      expect(series[2]).toBe(120); // 120 for 2025-02
    });

    it('interpolates closest available index when a month has no exact weekly match', () => {
      const gapMonth: MonthWiseSummary = {
        month_key: '2024-04',
        month_label: 'Apr 2024',
        fiscal_year: 'FY25',
        spend_inr_cr: 5,
        po_count: 2,
        top_material_group: 'Direct',
        top_plant: 'P1'
      };
      const series = buildCorrelatedMonthlySeries([gapMonth], sampleWeeklyIndices);
      expect(series[0]).toBe(110); // Closest to 2024-04-15 is 2024-03-04 (110)
    });
  });

  describe('normalizeCoreCategory', () => {
    it('normalizes category strings correctly', () => {
      expect(normalizeCoreCategory(undefined)).toBe('Direct Mat.');
      expect(normalizeCoreCategory('Direct Materials')).toBe('Direct Mat.');
      expect(normalizeCoreCategory('Packaging Materials')).toBe('Packaging');
      expect(normalizeCoreCategory('Logistics & Freight')).toBe('Freight');
      expect(normalizeCoreCategory('Indirect & MRO')).toBe('Indirect / MRO');
      expect(normalizeCoreCategory('Special Category')).toBe('Special Category');
    });
  });

  describe('deriveVendorRankingsFromValidationRecords', () => {
    it('returns empty array when records is empty or undefined', () => {
      expect(deriveVendorRankingsFromValidationRecords([])).toEqual([]);
      expect(deriveVendorRankingsFromValidationRecords(undefined as unknown as ValidationPreCheckRecord[])).toEqual([]);
    });

    it('skips records without valid vendor names', () => {
      const records: ValidationPreCheckRecord[] = [
        {
          record_id: 'REC-1',
          po_number: 'PO-1',
          vendor_name: '   ',
          raw_desc: 'Item',
          issue_flag: 'Passed Clean'
        }
      ];
      expect(deriveVendorRankingsFromValidationRecords(records)).toEqual([]);
    });

    it('derives vendor rankings with accurate spend, price creep, and leakage', () => {
      const records: ValidationPreCheckRecord[] = [
        {
          record_id: 'R-1',
          po_number: 'PO-101',
          vendor_name: 'High Creep Supplier Ltd',
          raw_desc: 'Chemical Component',
          core_category: 'Direct Materials',
          inr_crores: 10.0,
          net_price: 100,
          spend_year: 2023,
          transaction_date: '2023-05-01',
          issue_flag: 'Passed Clean'
        },
        {
          record_id: 'R-2',
          po_number: 'PO-102',
          vendor_name: 'High Creep Supplier Ltd',
          raw_desc: 'Chemical Component',
          core_category: 'Direct Materials',
          inr_crores: 15.0,
          net_price: 120, // +20% price creep
          spend_year: 2025,
          transaction_date: '2025-01-10',
          issue_flag: 'Passed Clean'
        },
        {
          record_id: 'R-3',
          po_number: 'PO-201',
          vendor_name: 'Stable Supplier Corp',
          raw_desc: 'Carton Box',
          core_category: 'Packaging Materials',
          inr_crores: 8.0,
          net_price: 50,
          spend_year: 2023,
          transaction_date: '2023-06-01',
          issue_flag: 'Passed Clean'
        },
        {
          record_id: 'R-4',
          po_number: 'PO-202',
          vendor_name: 'Stable Supplier Corp',
          raw_desc: 'Carton Box',
          core_category: 'Packaging Materials',
          inr_crores: 8.0,
          net_price: 51, // +2% price creep (REVIEW)
          spend_year: 2025,
          transaction_date: '2025-02-01',
          issue_flag: 'Passed Clean'
        },
        {
          record_id: 'R-5',
          po_number: 'PO-301',
          vendor_name: 'Aligned Supplier Inc',
          raw_desc: 'Standard Pallet',
          amount_inr: 50000000,
          unit_price: 10,
          spend_year: 2024,
          issue_flag: 'Passed Clean'
        }
      ];

      const rankings = deriveVendorRankingsFromValidationRecords(records);
      expect(rankings.length).toBe(3);

      const highCreepVendor = rankings.find((r) => r.vendor_name === 'High Creep Supplier Ltd');
      expect(highCreepVendor).toBeDefined();
      expect(highCreepVendor?.risk_status).toBe('HIGH CREEP');
      expect(highCreepVendor?.price_creep_pct).toBe(20.0);
      expect(highCreepVendor?.total_spend_inr_cr).toBe(25.0);
      expect(highCreepVendor?.variance_leakage_inr_cr).toBeGreaterThan(0);

      const reviewVendor = rankings.find((r) => r.vendor_name === 'Stable Supplier Corp');
      expect(reviewVendor).toBeDefined();
      expect(reviewVendor?.risk_status).toBe('REVIEW');
      expect(reviewVendor?.price_creep_pct).toBe(2.0);

      const alignedVendor = rankings.find((r) => r.vendor_name === 'Aligned Supplier Inc');
      expect(alignedVendor).toBeDefined();
      expect(alignedVendor?.risk_status).toBe('ALIGNED');
      expect(alignedVendor?.price_creep_pct).toBe(0);
    });

    it('handles column_l_code fallback and missing date/year gracefully', () => {
      const records: ValidationPreCheckRecord[] = [
        {
          record_id: 'RL-1',
          po_number: 'PO-L1',
          vendor_name: 'L-Code Supplier',
          raw_desc: 'Test item',
          column_l_code: 'Logistics & Freight',
          unit_price: 50,
          amount_inr: 10000000,
          issue_flag: 'Passed Clean'
        },
        {
          record_id: 'RL-2',
          po_number: 'PO-L2',
          vendor_name: 'L-Code Supplier',
          raw_desc: 'Test item',
          column_l_code: 'Logistics & Freight',
          unit_price: 60,
          amount_inr: 10000000,
          issue_flag: 'Passed Clean'
        },
        {
          record_id: 'RL-3',
          po_number: 'PO-L3',
          vendor_name: 'Fallback Supplier',
          raw_desc: 'Item with no amount or price',
          issue_flag: 'Passed Clean'
        }
      ];

      const rankings = deriveVendorRankingsFromValidationRecords(records);
      expect(rankings.length).toBe(2);
      expect(rankings[0].category).toBe('Freight');
      expect(rankings[1].total_spend_inr_cr).toBe(0);
    });

    it('handles zero initial price gracefully', () => {
      const records: ValidationPreCheckRecord[] = [
        {
          record_id: 'RZ-1',
          po_number: 'PO-Z1',
          vendor_name: 'Zero Baseline Co',
          raw_desc: 'Item',
          net_price: 0,
          inr_crores: 1,
          issue_flag: 'Passed Clean'
        },
        {
          record_id: 'RZ-2',
          po_number: 'PO-Z2',
          vendor_name: 'Zero Baseline Co',
          raw_desc: 'Item',
          net_price: 10,
          inr_crores: 1,
          issue_flag: 'Passed Clean'
        }
      ];
      const rankings = deriveVendorRankingsFromValidationRecords(records);
      expect(rankings[0].price_creep_pct).toBe(0);
    });
  });

  describe('calculateModule3SummaryMetrics', () => {
    it('returns empty metrics when rankings is empty', () => {
      const metrics = calculateModule3SummaryMetrics([]);
      expect(metrics.totalLeakageCr).toBe(0);
      expect(metrics.highCreepCount).toBe(0);
      expect(metrics.avgMarkupPct).toBeNull();
    });

    it('computes aggregated leakage, vendor counts, and average markup', () => {
      const sampleRankings: VendorPriceRank[] = [
        {
          vendor_name: 'V1',
          category: 'Direct Mat.',
          total_spend_inr_cr: 10,
          price_creep_pct: 12.0,
          risk_status: 'HIGH CREEP',
          variance_leakage_inr_cr: 1.5
        },
        {
          vendor_name: 'V2',
          category: 'Packaging',
          total_spend_inr_cr: 8,
          price_creep_pct: 3.0,
          risk_status: 'REVIEW',
          variance_leakage_inr_cr: 0.3
        },
        {
          vendor_name: 'V3',
          category: 'Freight',
          total_spend_inr_cr: 5,
          price_creep_pct: -1.0,
          risk_status: 'ALIGNED',
          variance_leakage_inr_cr: 0
        },
        {
          vendor_name: 'V4',
          category: 'Direct Mat.',
          total_spend_inr_cr: 2,
          price_creep_pct: 0,
          risk_status: 'HIGH CREEP'
        },
        {
          vendor_name: 'V5',
          category: 'Direct Mat.',
          total_spend_inr_cr: 2,
          price_creep_pct: 0,
          risk_status: 'REVIEW'
        },
        {
          vendor_name: 'V6',
          category: 'Direct Mat.',
          total_spend_inr_cr: 1,
          price_creep_pct: 8.0,
          risk_status: undefined
        },
        {
          vendor_name: 'V7',
          category: 'Direct Mat.',
          total_spend_inr_cr: 1,
          price_creep_pct: undefined,
          risk_status: 'ALIGNED'
        }
      ];

      const metrics = calculateModule3SummaryMetrics(sampleRankings);
      expect(metrics.totalLeakageCr).toBe(1.8);
      expect(metrics.highCreepCount).toBe(3); // V1 (HIGH CREEP), V4 (HIGH CREEP), V6 (8.0 > 5)
      expect(metrics.creepAnomalyCount).toBe(5); // V1, V2, V4, V5, V6
    });
  });
});
