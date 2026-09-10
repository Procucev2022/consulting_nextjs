import { describe, it, expect } from 'vitest';
import {
  mockTop50VendorsSupply,
  computeVendorSupplyOverview
} from '../../src/data/mockVendorSupply';
import type { VendorSupplyRecord } from '../../src/types/vendorSupply';

describe('mockVendorSupply and computeVendorSupplyOverview', () => {
  it('contains exactly 50 vendors ranked in descending spend order', () => {
    expect(mockTop50VendorsSupply).toHaveLength(50);

    for (let i = 0; i < mockTop50VendorsSupply.length; i++) {
      const vendor = mockTop50VendorsSupply[i];
      expect(vendor.rank).toBe(i + 1);
      expect(vendor.vendor_name).toBeTruthy();
      expect(vendor.master_vendor_id).toMatch(/^VND-/);
      expect(vendor.total_spend_inr_cr).toBeGreaterThan(0);
      expect(vendor.spend_fy24_cr).toBeGreaterThan(0);
      expect(vendor.spend_fy25_cr).toBeGreaterThan(0);
      expect(vendor.spend_fy26_cr).toBeGreaterThan(0);
      expect(vendor.supplied_categories.length).toBeGreaterThanOrEqual(1);

      if (i > 0) {
        expect(vendor.total_spend_inr_cr).toBeLessThanOrEqual(
          mockTop50VendorsSupply[i - 1].total_spend_inr_cr
        );
      }
    }
  });

  it('correctly classifies Single Category vs Multi Category vendors', () => {
    const singleVendors = mockTop50VendorsSupply.filter((v) => v.category_type === 'SINGLE_CATEGORY');
    const multiVendors = mockTop50VendorsSupply.filter((v) => v.category_type === 'MULTI_CATEGORY');

    expect(singleVendors.length).toBeGreaterThan(0);
    expect(multiVendors.length).toBeGreaterThan(0);
    expect(singleVendors.length + multiVendors.length).toBe(50);

    singleVendors.forEach((v) => {
      expect(v.category_count).toBe(1);
      expect(v.irrelevant_categories).toHaveLength(0);
    });

    multiVendors.forEach((v) => {
      expect(v.category_count).toBeGreaterThan(1);
      expect(v.irrelevant_categories.length).toBeGreaterThan(0);
    });
  });

  it('computes overview metrics and triggers high spend multi-category alarm for mockTop50', () => {
    const overview = computeVendorSupplyOverview(mockTop50VendorsSupply);

    expect(overview.total_vendors).toBe(50);
    expect(overview.total_spend_cr).toBeGreaterThan(500);
    expect(overview.single_category_vendors_count + overview.multi_category_vendors_count).toBe(50);
    expect(
      Number((overview.single_category_spend_pct + overview.multi_category_spend_pct).toFixed(1))
    ).toBeCloseTo(100.0, 0);

    expect(overview.tiers).toHaveLength(3);
    const tier1 = overview.tiers[0];
    expect(tier1.tier_id).toBe('TIER_1_HIGH');
    expect(tier1.alarm_triggered).toBe(true);
    expect(tier1.multi_category_spend_pct).toBeGreaterThan(50);

    expect(overview.high_spend_multi_category_alarm).toBe(true);
    expect(overview.alarm_details.affected_vendor_count).toBeGreaterThan(0);
    expect(overview.alarm_details.potential_savings_cr).toBeGreaterThan(0);
  });

  it('handles empty vendor array gracefully with zero values and no alarm', () => {
    const emptyOverview = computeVendorSupplyOverview([]);

    expect(emptyOverview.total_vendors).toBe(0);
    expect(emptyOverview.total_spend_cr).toBe(0);
    expect(emptyOverview.single_category_spend_pct).toBe(0);
    expect(emptyOverview.multi_category_spend_pct).toBe(0);
    expect(emptyOverview.high_spend_multi_category_alarm).toBe(false);
    expect(emptyOverview.tiers).toHaveLength(3);
    expect(emptyOverview.tiers[0].alarm_triggered).toBe(false);
  });

  it('does not trigger alarm when single-category specialists dominate high spends', () => {
    const customSingleDominantVendors: VendorSupplyRecord[] = [
      {
        rank: 1,
        vendor_name: 'Pure Direct Chemicals Ltd',
        master_vendor_id: 'VND-PDC-01',
        total_spend_inr_cr: 50.0,
        spend_fy24_cr: 15.0,
        spend_fy25_cr: 17.0,
        spend_fy26_cr: 18.0,
        yoy_growth_pct: 5.0,
        category_type: 'SINGLE_CATEGORY',
        category_count: 1,
        primary_category: 'Chemicals, Catalysts & Bio-Chemical Materials',
        supplied_categories: ['Chemicals, Catalysts & Bio-Chemical Materials'],
        irrelevant_categories: [],
        line_items_count: 1000,
        risk_level: 'OPTIMAL',
        observation_note: 'Pure-play direct specialist.',
        spend_share_pct: 60.0
      },
      {
        rank: 2,
        vendor_name: 'Pure Logistics Group',
        master_vendor_id: 'VND-PLG-02',
        total_spend_inr_cr: 30.0,
        spend_fy24_cr: 9.0,
        spend_fy25_cr: 10.5,
        spend_fy26_cr: 10.5,
        yoy_growth_pct: 4.0,
        category_type: 'SINGLE_CATEGORY',
        category_count: 1,
        primary_category: 'Road Truckload Freight & Ocean Container Logistics',
        supplied_categories: ['Road Truckload Freight & Ocean Container Logistics'],
        irrelevant_categories: [],
        line_items_count: 500,
        risk_level: 'OPTIMAL',
        observation_note: 'Specialist logistics carrier.',
        spend_share_pct: 36.0
      },
      {
        rank: 3,
        vendor_name: 'Small Tail Multi Vendor',
        master_vendor_id: 'VND-STM-03',
        total_spend_inr_cr: 3.0,
        spend_fy24_cr: 1.0,
        spend_fy25_cr: 1.0,
        spend_fy26_cr: 1.0,
        yoy_growth_pct: 0.0,
        category_type: 'MULTI_CATEGORY',
        category_count: 2,
        primary_category: 'Industrial Hardware & Fasteners',
        supplied_categories: ['Industrial Hardware & Fasteners', 'Cleaning Rags'],
        irrelevant_categories: ['Cleaning Rags'],
        line_items_count: 40,
        risk_level: 'MEDIUM_RISK',
        observation_note: 'Tail spend multi vendor.',
        spend_share_pct: 4.0
      }
    ];

    const result = computeVendorSupplyOverview(customSingleDominantVendors);
    expect(result.high_spend_multi_category_alarm).toBe(false);
    expect(result.tiers[0].alarm_triggered).toBe(false);
    expect(result.tiers[0].multi_category_spend_pct).toBe(0);
    expect(result.tiers[0].single_category_spend_pct).toBe(100);
  });
});
