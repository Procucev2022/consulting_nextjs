import { describe, it, expect } from 'vitest';
import {
  mockRecurringConsolidationItems,
  calculateVendorConsolidationSummary
} from '../../src/data/mockVendorConsolidation';
import { VENDOR_CONSOLIDATION_THRESHOLDS } from '../../src/constants/vendorConsolidation';

describe('mockVendorConsolidation Data & Calculations', () => {
  it('strictly satisfies all criteria: > 5 vendors, recurring monthly cadence, and high spend', () => {
    expect(mockRecurringConsolidationItems.length).toBeGreaterThanOrEqual(5);

    mockRecurringConsolidationItems.forEach((item) => {
      // Must have strictly MORE than 5 vendors
      expect(item.vendor_count).toBeGreaterThan(VENDOR_CONSOLIDATION_THRESHOLDS.MIN_VENDOR_COUNT_THRESHOLD);
      expect(item.suppliers.length).toBe(item.vendor_count);

      // Must be procured recurringly every month (12/12 months)
      expect(item.recurring_monthly).toBe(true);
      expect(item.procurement_cadence).toContain('12 / 12 Months');
      expect(item.monthly_po_avg).toBeGreaterThan(0);

      // Must be high value (>= 10 Cr)
      expect(item.total_spend_inr_cr).toBeGreaterThanOrEqual(VENDOR_CONSOLIDATION_THRESHOLDS.HIGH_SPEND_THRESHOLD_CR);

      // Must specify consolidation target, price variance, and e-auction volume savings
      expect(item.target_consolidated_vendors).toBeLessThan(item.vendor_count);
      expect(item.price_variance_pct).toBeGreaterThan(0);
      expect(item.est_volume_savings_cr).toBeGreaterThan(0);
      expect(item.est_volume_savings_pct).toBeGreaterThan(0);
      expect(item.auction_platform).toBe('DPS NXT');
      expect(item.consolidation_roadmap.length).toBeGreaterThanOrEqual(3);

      // Each supplier must have valid spend and status
      item.suppliers.forEach((sup) => {
        expect(sup.vendor_name).toBeDefined();
        expect(sup.annual_spend_inr_cr).toBeGreaterThan(0);
        expect(sup.spend_share_pct).toBeGreaterThan(0);
        expect(sup.unit_rate_index).toBeGreaterThanOrEqual(100);
        expect(sup.monthly_po_count).toBeGreaterThan(0);
      });
    });
  });

  it('correctly calculates summary metrics for populated list', () => {
    const summary = calculateVendorConsolidationSummary(mockRecurringConsolidationItems);

    expect(summary.categoriesCount).toBe(mockRecurringConsolidationItems.length);
    expect(summary.totalFragmentedSpendCr).toBeGreaterThan(150);
    expect(summary.totalActiveVendors).toBeGreaterThan(30);
    expect(summary.avgVendorsPerCategory).toBeGreaterThan(5);
    expect(summary.potentialVolumeSavingsCr).toBeGreaterThan(20);
    expect(summary.avgSavingsPct).toBeGreaterThan(10);
  });

  it('handles empty items list gracefully in calculateVendorConsolidationSummary', () => {
    const summary = calculateVendorConsolidationSummary([]);

    expect(summary.totalFragmentedSpendCr).toBe(0);
    expect(summary.categoriesCount).toBe(0);
    expect(summary.totalActiveVendors).toBe(0);
    expect(summary.avgVendorsPerCategory).toBe(0);
    expect(summary.potentialVolumeSavingsCr).toBe(0);
    expect(summary.avgSavingsPct).toBe(0);
  });
});
