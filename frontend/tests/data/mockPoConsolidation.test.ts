import { describe, it, expect } from 'vitest';
import {
  MOCK_MULTIPLE_PO_ITEMS,
  calculatePoConsolidationSummary
} from '../../src/data/mockPoConsolidation';
import type { PoConsolidationCadence } from '../../src/types/poConsolidation';

describe('mockPoConsolidation Data & Calculations', () => {
  it('should provide 6 high-frequency PO supplier accounts', () => {
    expect(MOCK_MULTIPLE_PO_ITEMS.length).toBe(6);
    MOCK_MULTIPLE_PO_ITEMS.forEach((item) => {
      expect(item.id).toBeDefined();
      expect(item.vendor_name).toBeDefined();
      expect(item.annual_po_count).toBeGreaterThan(40);
      expect(item.avg_pos_per_month).toBeGreaterThanOrEqual(8);
      expect(item.monthly_distribution.length).toBe(12);
      expect(item.cadence_options.MONTHLY.target_pos_per_year).toBe(12);
      expect(item.cadence_options.QUARTERLY.target_pos_per_year).toBe(4);
      expect(item.cadence_options.HALF_YEARLY.target_pos_per_year).toBe(2);
      expect(item.cadence_options.ANNUAL.target_pos_per_year).toBe(1);
    });
  });

  it('should calculate summary correctly for default cadence (QUARTERLY)', () => {
    const summary = calculatePoConsolidationSummary();
    expect(summary.totalFragmentedSpendCr).toBeGreaterThan(200);
    expect(summary.totalCurrentPos).toBe(144 + 168 + 96 + 108 + 132 + 120);
    expect(summary.totalTargetPos).toBe(6 * 4); // 4 per supplier for Quarterly
    expect(summary.avgPoReductionPct).toBeGreaterThan(90);
    expect(summary.totalScaleSavingsCr).toBeGreaterThan(15);
    expect(summary.totalAdminCostSavingsLakhs).toBeGreaterThan(20);
    expect(summary.qualifiedSuppliersCount).toBe(6);
  });

  it('should calculate summary for different cadences (MONTHLY, HALF_YEARLY, ANNUAL)', () => {
    const cadences: PoConsolidationCadence[] = ['MONTHLY', 'HALF_YEARLY', 'ANNUAL'];
    cadences.forEach((cad) => {
      const summary = calculatePoConsolidationSummary(MOCK_MULTIPLE_PO_ITEMS, cad);
      expect(summary.totalFragmentedSpendCr).toBeGreaterThan(0);
      if (cad === 'MONTHLY') {
        expect(summary.totalTargetPos).toBe(6 * 12);
      } else if (cad === 'HALF_YEARLY') {
        expect(summary.totalTargetPos).toBe(6 * 2);
      } else if (cad === 'ANNUAL') {
        expect(summary.totalTargetPos).toBe(6 * 1);
        expect(summary.avgPoReductionPct).toBeGreaterThan(98);
      }
    });
  });

  it('should handle empty items array gracefully in summary calculation', () => {
    const emptySummary = calculatePoConsolidationSummary([], 'QUARTERLY');
    expect(emptySummary.totalFragmentedSpendCr).toBe(0);
    expect(emptySummary.totalCurrentPos).toBe(0);
    expect(emptySummary.totalTargetPos).toBe(0);
    expect(emptySummary.avgPoReductionPct).toBe(0);
    expect(emptySummary.qualifiedSuppliersCount).toBe(0);
  });
});
