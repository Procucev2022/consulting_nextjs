import { describe, it, expect } from 'vitest';
import { enrichVendorWithYoYData } from '../../src/data/mockVendorSupplyYoY';
import type { VendorSupplyRecord } from '../../src/types/vendorSupply';

describe('enrichVendorWithYoYData', () => {
  const baseRecord: VendorSupplyRecord = {
    rank: 1,
    vendor_name: 'Test Supplier',
    master_vendor_id: 'VND-TST-001',
    total_spend_inr_cr: 50.0,
    spend_fy24_cr: 15.0,
    spend_fy25_cr: 17.0,
    spend_fy26_cr: 18.0,
    yoy_growth_pct: 6.0,
    category_type: 'MULTI_CATEGORY',
    category_count: 2,
    primary_category: 'Chemicals, Catalysts & Bio-Chemical Materials',
    supplied_categories: ['Chemicals, Catalysts & Bio-Chemical Materials', 'Packaging Materials'],
    irrelevant_categories: ['Packaging Materials'],
    line_items_count: 1000,
    risk_level: 'HIGH_RISK',
    observation_note: 'Multi-category test note',
    spend_share_pct: 10.0
  };

  it('enriches vendor across pattern 0 (Sharp Increase: Green with Red Observation)', () => {
    const enriched = enrichVendorWithYoYData(baseRecord, 0);

    expect(enriched.spend_yoy_pct).toBeGreaterThan(0);
    expect(enriched.qty_yoy_pct).toBeGreaterThan(0);
    expect(enriched.price_yoy_pct).toBeGreaterThan(0);
    expect(enriched.yoy_observation_mark).toContain('Observation:');
    expect(enriched.yoy_remark).toContain('Remark:');
    expect(enriched.top_items).toHaveLength(3);
    expect(enriched.top_items![0].material_code).toMatch(/^MAT-CHM-/);
    expect(enriched.top_items![0].observation_mark).toContain('Observation:');
  });

  it('enriches vendor across pattern 1 (Price Creep)', () => {
    const resinVendor: VendorSupplyRecord = {
      ...baseRecord,
      primary_category: 'Resins, Polymers & Bulk Elastomeric Compounds'
    };
    const enriched = enrichVendorWithYoYData(resinVendor, 1);

    expect(enriched.spend_yoy_pct).toBeGreaterThan(0);
    expect(enriched.price_yoy_pct).toBeGreaterThan(enriched.qty_yoy_pct!);
    expect(enriched.yoy_observation_mark).toContain('Significant price creep');
    expect(enriched.top_items![0].material_code).toMatch(/^MAT-RSN-/);
  });

  it('enriches vendor across pattern 2 (Broad Expansion with Freight template)', () => {
    const freightVendor: VendorSupplyRecord = {
      ...baseRecord,
      primary_category: 'Road Truckload Freight & Ocean Container Logistics'
    };
    const enriched = enrichVendorWithYoYData(freightVendor, 2);

    expect(enriched.spend_yoy_pct).toBeGreaterThan(0);
    expect(enriched.yoy_observation_mark).toContain('Broad expansion');
    expect(enriched.top_items![0].material_code).toMatch(/^MAT-LOG-/);
  });

  it('enriches vendor across pattern 3 (Decrease: Amber with Blue Remark)', () => {
    const pkgVendor: VendorSupplyRecord = {
      ...baseRecord,
      category_type: 'SINGLE_CATEGORY',
      irrelevant_categories: [],
      primary_category: 'Corrugated Paper, Packaging & Heavy Pallets'
    };
    const enriched = enrichVendorWithYoYData(pkgVendor, 3);

    expect(enriched.spend_yoy_pct).toBeLessThan(0);
    expect(enriched.qty_yoy_pct).toBeLessThan(0);
    expect(enriched.price_yoy_pct).toBeLessThan(0);
    expect(enriched.yoy_remark).toContain('Remark: Spend contracted');
    expect(enriched.top_items![0].material_code).toMatch(/^MAT-PKG-/);
    expect(enriched.top_items![0].remark).toContain('Remark:');
  });

  it('enriches vendor across pattern 4 (Volume Softened with Default MRO template)', () => {
    const mroVendor: VendorSupplyRecord = {
      ...baseRecord,
      category_type: 'SINGLE_CATEGORY',
      irrelevant_categories: [],
      primary_category: 'Pumps, Compressors & Fluid Distribution Systems'
    };
    const enriched = enrichVendorWithYoYData(mroVendor, 4);

    expect(enriched.spend_yoy_pct).toBe(-3.8);
    expect(enriched.qty_yoy_pct).toBe(-4.5);
    expect(enriched.price_yoy_pct).toBe(-1.2);
    expect(enriched.yoy_remark).toContain('Remark: Centralized category unbundling reduced spend');
    expect(enriched.top_items![0].material_code).toMatch(/^MAT-MRO-/);
  });

  it('handles negative or zero base growth pct correctly in pattern 0, 1, and 3', () => {
    const negativeVendor: VendorSupplyRecord = {
      ...baseRecord,
      yoy_growth_pct: -2.5
    };

    const p0 = enrichVendorWithYoYData(negativeVendor, 0);
    expect(p0.spend_yoy_pct).toBe(8.4);

    const p1 = enrichVendorWithYoYData(negativeVendor, 1);
    expect(p1.spend_yoy_pct).toBe(6.8);

    const p2 = enrichVendorWithYoYData(negativeVendor, 2);
    expect(p2.spend_yoy_pct).toBe(5.4);

    const p3 = enrichVendorWithYoYData(negativeVendor, 3);
    expect(p3.spend_yoy_pct).toBe(-4.2);
  });
});
