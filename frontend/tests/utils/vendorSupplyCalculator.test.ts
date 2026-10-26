import { describe, it, expect } from 'vitest';
import { computeVendorSupplyOverview } from '../../src/utils/vendorSupplyCalculator';
import type { VendorSupplyRecord } from '../../src/types/vendorSupply';

const createVendor = (
  id: string,
  name: string,
  spendCr: number,
  categoryType: 'SINGLE_CATEGORY' | 'MULTI_CATEGORY',
  spendSharePct: number = 0
): VendorSupplyRecord => ({
  rank: 1,
  master_vendor_id: id,
  vendor_name: name,
  total_spend_inr_cr: spendCr,
  spend_fy24_cr: spendCr * 0.3,
  spend_fy25_cr: spendCr * 0.35,
  spend_fy26_cr: spendCr * 0.35,
  spend_share_pct: spendSharePct,
  category_count: categoryType === 'SINGLE_CATEGORY' ? 1 : 4,
  category_type: categoryType,
  primary_category: 'Metals',
  supplied_categories: categoryType === 'SINGLE_CATEGORY' ? ['Metals'] : ['Metals', 'Chemicals', 'Logistics', 'Packaging'],
  irrelevant_categories: [],
  line_items_count: 10,
  risk_level: 'OPTIMAL',
  observation_note: 'Standard supplier performance profile'
});

describe('vendorSupplyCalculator Unit Tests', () => {
  it('handles default empty vendors parameter', () => {
    const overview = computeVendorSupplyOverview();
    expect(overview.total_vendors).toBe(0);
    expect(overview.total_spend_cr).toBe(0);
    expect(overview.supply_structure_indicator).toBe('INSUFFICIENT_DATA');
    expect(overview.indicator_rationale).toContain('Insufficient supplier transaction history');
  });

  it('identifies SINGLE_SOURCE_DEPENDENT when only 1 vendor exists', () => {
    const vendors = [createVendor('V1', 'Monopoly Supplier', 25.0, 'SINGLE_CATEGORY', 100)];
    const overview = computeVendorSupplyOverview(vendors);

    expect(overview.total_vendors).toBe(1);
    expect(overview.supply_structure_indicator).toBe('SINGLE_SOURCE_DEPENDENT');
    expect(overview.indicator_rationale).toContain('Sole supplier configuration captures 100%');
  });

  it('identifies SINGLE_SUPPLIER_CONCENTRATION when top vendor captures >= 60% of spend', () => {
    const vendors = [
      createVendor('V1', 'Dominant Supplier', 65.0, 'SINGLE_CATEGORY', 65.0),
      createVendor('V2', 'Small Supplier 2', 20.0, 'SINGLE_CATEGORY', 20.0),
      createVendor('V3', 'Small Supplier 3', 15.0, 'SINGLE_CATEGORY', 15.0)
    ];
    const overview = computeVendorSupplyOverview(vendors);

    expect(overview.supply_structure_indicator).toBe('SINGLE_SUPPLIER_CONCENTRATION');
    expect(overview.indicator_rationale).toContain('Dominant supplier Dominant Supplier captures 65.0% of spend');
  });

  it('identifies CROSS_CATEGORY_SUPPLIER_DEPENDENCY when multi-category spend >= 40%', () => {
    const vendors = [
      createVendor('V1', 'Multi Vendor 1', 25.0, 'MULTI_CATEGORY', 35.0),
      createVendor('V2', 'Multi Vendor 2', 20.0, 'MULTI_CATEGORY', 30.0),
      createVendor('V3', 'Single Specialist', 25.0, 'SINGLE_CATEGORY', 35.0)
    ];
    const overview = computeVendorSupplyOverview(vendors);

    expect(overview.supply_structure_indicator).toBe('CROSS_CATEGORY_SUPPLIER_DEPENDENCY');
    expect(overview.indicator_rationale).toContain('held by multi-category generalists');
  });

  it('identifies TAIL_FRAGMENTATION when vendor count is >= 8 and neither concentration nor cross-category dependency triggers', () => {
    const vendors = [
      createVendor('V1', 'Vendor 1', 10.0, 'SINGLE_CATEGORY', 12.5),
      createVendor('V2', 'Vendor 2', 10.0, 'SINGLE_CATEGORY', 12.5),
      createVendor('V3', 'Vendor 3', 10.0, 'SINGLE_CATEGORY', 12.5),
      createVendor('V4', 'Vendor 4', 10.0, 'SINGLE_CATEGORY', 12.5),
      createVendor('V5', 'Vendor 5', 10.0, 'SINGLE_CATEGORY', 12.5),
      createVendor('V6', 'Vendor 6', 10.0, 'SINGLE_CATEGORY', 12.5),
      createVendor('V7', 'Vendor 7', 10.0, 'SINGLE_CATEGORY', 12.5),
      createVendor('V8', 'Vendor 8', 10.0, 'SINGLE_CATEGORY', 12.5)
    ];
    const overview = computeVendorSupplyOverview(vendors);

    expect(overview.supply_structure_indicator).toBe('TAIL_FRAGMENTATION');
    expect(overview.indicator_rationale).toContain('Supply base is fragmented across 8 vendors');
  });

  it('identifies BALANCED for competitive configuration with moderate vendor count', () => {
    const vendors = [
      createVendor('V1', 'Specialist A', 15.0, 'SINGLE_CATEGORY', 30.0),
      createVendor('V2', 'Specialist B', 15.0, 'SINGLE_CATEGORY', 30.0),
      createVendor('V3', 'Specialist C', 10.0, 'SINGLE_CATEGORY', 20.0),
      createVendor('V4', 'Specialist D', 10.0, 'SINGLE_CATEGORY', 20.0)
    ];
    const overview = computeVendorSupplyOverview(vendors);

    expect(overview.supply_structure_indicator).toBe('BALANCED');
    expect(overview.indicator_rationale).toContain('Healthy competitive balance across qualified category specialists');
  });

  it('triggers executive alarm when Tier 1 vendors have high multi-category spend share', () => {
    const vendors = [
      createVendor('V1', 'Mega Generalist', 30.0, 'MULTI_CATEGORY', 50.0),
      createVendor('V2', 'Mid Vendor', 2.0, 'SINGLE_CATEGORY', 25.0),
      createVendor('V3', 'Base Vendor', 0.5, 'SINGLE_CATEGORY', 25.0)
    ];
    const overview = computeVendorSupplyOverview(vendors);

    expect(overview.high_spend_multi_category_alarm).toBe(true);
    expect(overview.tiers[0].alarm_triggered).toBe(true);
    expect(overview.alarm_details.potential_savings_cr).toBeGreaterThan(0);
    expect(overview.alarm_details.affected_vendor_count).toBe(1);
  });
});
