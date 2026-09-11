import { describe, it, expect } from 'vitest';
import { mockStrategicSingleVendorItems } from '../../src/data/mockStrategicSingleVendorItems';
import {
  HIGH_VALUE_MIN_SPEND_CR,
  SINGLE_DIGIT_SECONDARY_MAX_PCT,
  calculateStrategicRiskSummary,
  isSoleSource,
  isSingleDigitSecondary
} from '../../src/constants';

describe('Strategic Single Vendor Items Dataset & Calculation Utilities', () => {
  it('contains valid high-value strategic records exceeding 1 Cr threshold', () => {
    expect(mockStrategicSingleVendorItems.length).toBeGreaterThanOrEqual(12);

    for (const item of mockStrategicSingleVendorItems) {
      expect(item.total_spend_inr_cr).toBeGreaterThanOrEqual(HIGH_VALUE_MIN_SPEND_CR);
      expect(item.material_code).toBeTruthy();
      expect(item.material_desc).toBeTruthy();
      expect(item.unspsc_code).toMatch(/^\d{8}$/);
      expect(item.primary_vendor.is_primary).toBe(true);
      expect(item.primary_vendor.share_percentage).toBeGreaterThanOrEqual(90.0);
    }
  });

  it('correctly classifies sole source items and single-digit secondary vendor items', () => {
    const soleSourceItems = mockStrategicSingleVendorItems.filter(isSoleSource);
    const singleDigitItems = mockStrategicSingleVendorItems.filter(isSingleDigitSecondary);

    expect(soleSourceItems.length).toBeGreaterThan(0);
    expect(singleDigitItems.length).toBeGreaterThan(0);

    for (const item of soleSourceItems) {
      expect(item.risk_level).toBe('SOLE_SOURCE_CRITICAL');
      expect(item.secondary_vendor).toBeUndefined();
      expect(item.primary_vendor.share_percentage).toBe(100.0);
    }

    for (const item of singleDigitItems) {
      expect(item.risk_level).toBe('DOMINANT_SUPPLIER_SINGLE_DIGIT_SECONDARY');
      expect(item.secondary_vendor).toBeDefined();
      expect(item.secondary_vendor?.share_percentage).toBeLessThanOrEqual(SINGLE_DIGIT_SECONDARY_MAX_PCT);
      expect(item.secondary_vendor?.is_secondary_single_digit).toBe(true);
    }
  });

  it('calculates summary statistics correctly for full dataset and empty dataset', () => {
    const summary = calculateStrategicRiskSummary(mockStrategicSingleVendorItems);

    expect(summary.totalStrategicItems).toBe(mockStrategicSingleVendorItems.length);
    expect(summary.totalAtRiskSpendCr).toBeGreaterThan(0);
    expect(summary.soleSourceCount + summary.singleDigitSecondaryCount).toBe(mockStrategicSingleVendorItems.length);
    expect(summary.avgPrimaryConcentrationPct).toBeGreaterThan(90.0);

    // Empty dataset handling
    const emptySummary = calculateStrategicRiskSummary([]);
    expect(emptySummary.totalStrategicItems).toBe(0);
    expect(emptySummary.totalAtRiskSpendCr).toBe(0);
    expect(emptySummary.soleSourceCount).toBe(0);
    expect(emptySummary.singleDigitSecondaryCount).toBe(0);
    expect(emptySummary.avgPrimaryConcentrationPct).toBe(0);
  });

  it('handles edge cases in isSoleSource and isSingleDigitSecondary', () => {
    const syntheticItem = { ...mockStrategicSingleVendorItems[0] };
    delete syntheticItem.secondary_vendor;
    expect(isSoleSource(syntheticItem)).toBe(true);
    expect(isSingleDigitSecondary(syntheticItem)).toBe(false);

    const balancedItem: any = {
      ...mockStrategicSingleVendorItems[0],
      risk_level: 'DOMINANT_SUPPLIER_SINGLE_DIGIT_SECONDARY',
      secondary_vendor: {
        vendor_name: 'Vendor B',
        spend_inr_cr: 20,
        share_percentage: 20,
        is_primary: false,
        is_secondary_single_digit: false
      }
    };
    expect(isSoleSource(balancedItem)).toBe(false);
    expect(isSingleDigitSecondary(balancedItem)).toBe(false);
    const summary = calculateStrategicRiskSummary([balancedItem]);
    expect(summary.soleSourceCount).toBe(0);
    expect(summary.singleDigitSecondaryCount).toBe(0);
  });
});
