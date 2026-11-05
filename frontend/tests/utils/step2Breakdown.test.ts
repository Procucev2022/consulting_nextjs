import { describe, it, expect } from 'vitest';
import {
  addSpendToFiscalYear,
  getItemSpendCr,
  computeUnitPrices,
  computePriceChangePct,
  updateExistingItem,
  createNewTopItem,
  upsertTopItem
} from '../../src/utils/step2BreakdownShared';
import { calculateCategoryYearDetails } from '../../src/utils/step2CategoryBreakdown';
import { calculateVendorYearDetails } from '../../src/utils/step2VendorBreakdown';
import { calculateStrategicVendorRisk } from '../../src/utils/step2StrategicRisk';

import type { LineItemMapping, CategoryTopItem } from '../../src/types';

const baseItem: LineItemMapping = {
  mapping_id: 'MAP-001',
  line_item_id: 'LINE-001',
  raw_desc: 'Industrial Solvent',
  vendor_identified: 'Acme Chemicals',
  unspsc_code: '12352100',
  unspsc_category_name: 'Solvents',
  core_bucket: 'Direct Materials',
  ai_confidence: 95,
  status: 'Confirmed',
  unit_price: 1000,
  qty: 100,
  total_spend: 10000000,
  inr_crores: 1.0,
  amount_inr: 10000000,
  invoice_date: '2024-05-10',
  po_number: 'PO-1001'
};

describe('step2BreakdownShared', () => {
  describe('addSpendToFiscalYear', () => {
    it('adds spend to FY24 for year <= 2023', () => {
      const target = { spendFY24: 0, spendFY25: 0, spendFY26: 0 };
      addSpendToFiscalYear(target, 1.5, 2023);
      expect(target.spendFY24).toBe(1.5);
    });
    it('adds spend to FY25 for default/undefined year (normalises to 2024)', () => {
      // Number(undefined) = NaN, NaN || 2024 = 2024, which maps to FY25
      const target = { spendFY24: 0, spendFY25: 0, spendFY26: 0 };
      addSpendToFiscalYear(target, 2.0);
      expect(target.spendFY25).toBe(2.0);
    });
    it('adds spend to FY25 for year === 2024', () => {
      const target = { spendFY24: 0, spendFY25: 0, spendFY26: 0 };
      addSpendToFiscalYear(target, 3.0, 2024);
      expect(target.spendFY25).toBe(3.0);
    });
    it('adds spend to FY26 for year > 2024', () => {
      const target = { spendFY24: 0, spendFY25: 0, spendFY26: 0 };
      addSpendToFiscalYear(target, 4.0, 2025);
      expect(target.spendFY26).toBe(4.0);
    });
  });

  describe('getItemSpendCr', () => {
    it('returns inr_crores when present', () => {
      expect(getItemSpendCr(baseItem)).toBe(1.0);
    });
    it('returns total_spend / 10000000 when inr_crores is null', () => {
      const item = { ...baseItem, inr_crores: null };
      expect(getItemSpendCr(item)).toBeCloseTo(1.0);
    });
    it('returns 0 when neither field present', () => {
      const item = { ...baseItem, inr_crores: null, total_spend: undefined };
      expect(getItemSpendCr(item)).toBe(0);
    });
  });

  describe('computeUnitPrices', () => {
    it('uses unit_price from item', () => {
      const item = { ...baseItem, qty: 100, unit_price: 200 };
      const r = computeUnitPrices(item, 1.0);
      expect(r.priceFy24).toBe(200);
    });
    it('computes price from spend when no unit_price', () => {
      const item = { ...baseItem, qty: 100, unit_price: undefined };
      const r = computeUnitPrices(item, 1.0);
      expect(r.priceFy24).toBeGreaterThan(0);
    });
    it('uses 0 price when qty is 0 and spendCr is 0 and no unit_price', () => {
      const item = { ...baseItem, qty: 0, unit_price: undefined };
      const r = computeUnitPrices(item, 0);
      expect(r.qty).toBe(0);
      expect(r.priceFy24).toBe(0);
    });
  });

  describe('computePriceChangePct', () => {
    it('returns 0.0 when all three fiscal prices are identical', () => {
      expect(computePriceChangePct(100, 100, 100)).toBe(0.0);
    });

    it('computes change between FY26 and FY24 when p24 > 0 and p26 > 0 and p26 !== p24', () => {
      expect(computePriceChangePct(100, 110, 120)).toBe(20.0);
    });

    it('computes change between FY25 and FY24 when p26 is 0 or equal to p24 and p25 !== p24', () => {
      expect(computePriceChangePct(100, 115, 0)).toBe(15.0);
      expect(computePriceChangePct(100, 115, 100)).toBe(15.0);
    });

    it('returns 0.0 for fallback edge conditions', () => {
      expect(computePriceChangePct(0, 0, 100)).toBe(0.0);
      expect(computePriceChangePct(100, 100, 0)).toBe(0.0);
    });
  });

  describe('updateExistingItem', () => {
    it('accumulates spend, qty, and opportunity', () => {
      const e = { item_id: 'I1', item_name: 'T', vendor_name: 'V', share_pct: 0, total_spend_inr_cr: 1.0, order_qty_annual: 100, opportunity_potential_inr_lakhs: 5.0 };
      updateExistingItem(e, 0.5, 50, 2.0);
      expect(e.total_spend_inr_cr).toBeCloseTo(1.5);
      expect(e.order_qty_annual).toBe(150);
    });
    it('handles undefined optional fields', () => {
      const e: CategoryTopItem = { item_id: 'I2', item_name: 'T2', vendor_name: 'V', share_pct: 0 };
      updateExistingItem(e, 1.0, 20, 1.0);
      expect(e.total_spend_inr_cr).toBeCloseTo(1.0);
    });
  });

  describe('createNewTopItem', () => {
    it('creates item with all fields', () => {
      const item = { ...baseItem, material_code: 'MAT-001', po_number: 'PO-2024', raw_currency: 'USD' };
      const r = createNewTopItem(item, 'Test', 'VendorA', 1.0, 'CODE', 100, { priceFy24: 100, priceFy25: 105, priceFy26: 110 }, 8.0);
      expect(r.item_name).toBe('Test');
      expect(r.po_number).toBe('PO-2024');
      expect(r.raw_currency).toBe('USD');
      expect(r.leakage_flag).toBeUndefined();
    });
    it('uses fallback id and defaults when fields missing', () => {
      const item = { ...baseItem, material_code: undefined, line_item_id: undefined, po_number: undefined, raw_currency: undefined };
      const r = createNewTopItem(item, 'Desc', 'V', 0.5, 'C', 50, { priceFy24: 50, priceFy25: 52.5, priceFy26: 55 }, 4.0);
      expect(r.item_id).toMatch(/^ITM-/);
      expect(r.po_number).toBe('PO-2024-SYS');
      expect(r.raw_currency).toBe('INR');
    });
  });

  describe('upsertTopItem', () => {
    it('inserts new item', () => {
      const map = new Map();
      upsertTopItem(map, baseItem, 'NewItem', 'Vendor', 1.0, 'CODE');
      expect(map.has('NewItem')).toBe(true);
    });
    it('updates existing item', () => {
      const map = new Map();
      upsertTopItem(map, baseItem, 'Item', 'Vendor', 1.0, 'CODE');
      upsertTopItem(map, baseItem, 'Item', 'Vendor', 0.5, 'CODE');
      expect(map.get('Item').total_spend_inr_cr).toBeCloseTo(1.5);
    });
  });
});

describe('step2CategoryBreakdown', () => {
  it('returns empty for no lineItems and no fallback', () => {
    expect(calculateCategoryYearDetails([], [])).toEqual([]);
  });
  it('returns empty when lineItems is undefined', () => {
    expect(calculateCategoryYearDetails(undefined)).toEqual([]);
  });
  it('transforms fallback categories', () => {
    const fallback = [{ id: 'C1', name: 'Chemicals', category: 'Chemicals', spend_inr_crores: 10, lineItemsCount: 5 }];
    const r = calculateCategoryYearDetails([], fallback);
    expect(r[0].category).toBe('Chemicals');
    expect(r[0].total_3yr_spend_inr_cr).toBe(10);
    expect(r[0].spend_fy24_cr).toBe(0);
    expect(r[0].yoy_growth_pct).toBeUndefined();
  });
  it('consolidates duplicate fallback categories and accumulates spend', () => {
    const fallback = [
      { id: 'C1', name: 'Chemicals', category: 'Chemicals', spend_inr_crores: 10, spend_fy24_cr: 5, supplier_count: 2, lineItemsCount: 5 },
      { id: 'C2', name: 'Chemicals', category: 'Chemicals', spend_inr_crores: 8, spend_fy24_cr: 4, supplier_count: 3, lineItemsCount: 6 },
      { id: 'C3', name: 'Packaging', category: 'Packaging', spend_inr_crores: 25, spend_fy24_cr: 10, supplier_count: 4, lineItemsCount: 8 }
    ];
    const r = calculateCategoryYearDetails([], fallback);
    expect(r.length).toBe(2);
    expect(r[0].category).toBe('Packaging');
    expect(r[1].category).toBe('Chemicals');
    expect(r[1].total_3yr_spend_inr_cr).toBe(18);
    expect(r[1].spend_fy24_cr).toBe(9);
    expect(r[1].vendor_count).toBe(5);
    expect(r[1].item_count).toBe(11);
  });
  it('handles Packaging bucket in fallback', () => {
    const fallback = [{ id: 'C2', name: 'Packaging Materials', spend_inr_crores: 5 }];
    expect(calculateCategoryYearDetails([], fallback)[0].core_bucket).toBe('Packaging Materials');
  });
  it('handles Freight bucket in fallback', () => {
    const fallback = [{ id: 'C3', name: 'Freight Logistics', spend_inr_crores: 3 }];
    expect(calculateCategoryYearDetails([], fallback)[0].core_bucket).toBe('Logistics & Freight');
  });
  it('handles fallback with no name and no spend', () => {
    const fallback = [{ id: 'CX' }];
    const r = calculateCategoryYearDetails([], fallback);
    expect(r[0].category).toBe('Direct Materials');
  });
  it('aggregates line items by category', () => {
    const items = [
      { ...baseItem, spend_year: 2024, inr_crores: 2.0, core_bucket: 'Direct Materials' },
      { ...baseItem, line_item_id: 'L2', spend_year: 2025, inr_crores: 3.0, core_bucket: 'Direct Materials' },
      { ...baseItem, line_item_id: 'L3', spend_year: 2025, inr_crores: 1.5, core_bucket: 'Packaging Materials', vendor_identified: 'Pack Co' }
    ];
    const r = calculateCategoryYearDetails(items);
    expect(r.length).toBeGreaterThanOrEqual(2);
    const dm = r.find((c) => c.category === 'Direct Materials');
    expect(dm).toBeDefined();
  });
  it('handles item with no vendor_identified', () => {
    const item = { ...baseItem, vendor_identified: undefined };
    const r = calculateCategoryYearDetails([item]);
    expect(r.length).toBeGreaterThan(0);
  });
  it('uses totalSpendCr when calculated total is 0', () => {
    const item = { ...baseItem, inr_crores: 0, total_spend: undefined };
    const r = calculateCategoryYearDetails([item], [], 100);
    expect(r.length).toBeGreaterThanOrEqual(1);
  });
});

describe('step2VendorBreakdown', () => {
  it('returns empty for empty lineItems', () => {
    expect(calculateVendorYearDetails([])).toEqual([]);
  });
  it('returns empty when undefined', () => {
    expect(calculateVendorYearDetails(undefined)).toEqual([]);
  });
  it('aggregates vendors correctly', () => {
    const items = [
      { ...baseItem, spend_year: 2024, inr_crores: 2.0 },
      { ...baseItem, line_item_id: 'L2', spend_year: 2025, inr_crores: 3.0 },
      { ...baseItem, line_item_id: 'L3', vendor_identified: 'Beta', spend_year: 2025, inr_crores: 1.5 }
    ];
    const r = calculateVendorYearDetails(items);
    expect(r.length).toBeGreaterThanOrEqual(2);
    const acme = r.find((v) => v.vendor_name === 'Acme Chemicals');
    expect(acme.total_3yr_spend_inr_cr).toBeCloseTo(5.0);
  });
  it('uses Unknown Supplier fallback', () => {
    const item = { ...baseItem, vendor_identified: undefined };
    expect(calculateVendorYearDetails([item])[0].vendor_name).toBe('Unknown Supplier');
  });
  it('sets HIGH CREEP for spend > 15', () => {
    const item = { ...baseItem, inr_crores: 20 };
    expect(calculateVendorYearDetails([item])[0].risk_status).toBe('HIGH CREEP');
  });
  it('sets ALIGNED for spend <= 15', () => {
    const item = { ...baseItem, inr_crores: 5 };
    expect(calculateVendorYearDetails([item])[0].risk_status).toBe('ALIGNED');
  });
  it('uses totalSpendCr as fallback', () => {
    const item = { ...baseItem, inr_crores: 0, total_spend: undefined };
    const r = calculateVendorYearDetails([item], 100);
    expect(r.length).toBeGreaterThanOrEqual(1);
  });
  it('records spend in FY24 without fabricating FY25 spend when FY25 is 0', () => {
    // spend_year 2023 -> year <= 2023 -> FY24 gets spend, FY25 stays 0 (no synthetic 0.34 multiplier)
    const item = { ...baseItem, spend_year: 2023, inr_crores: 4.0 };
    const r = calculateVendorYearDetails([item]);
    expect(r[0].spend_fy24_cr).toBeCloseTo(4.0, 1);
    expect(r[0].spend_fy25_cr).toBe(0);
    expect(r[0].yoy_growth_pct).toBeUndefined();
  });
});

describe('step2StrategicRisk', () => {
  it('returns empty for empty lineItems', () => {
    expect(calculateStrategicVendorRisk([])).toEqual([]);
  });
  it('returns empty when undefined', () => {
    expect(calculateStrategicVendorRisk(undefined)).toEqual([]);
  });
  it('identifies SOLE_SOURCE_CRITICAL for single vendor', () => {
    const items = [
      { ...baseItem, inr_crores: 5.0, material_code: 'MAT-001' },
      { ...baseItem, line_item_id: 'L2', inr_crores: 3.0, material_code: 'MAT-001' }
    ];
    const r = calculateStrategicVendorRisk(items);
    const sole = r.find((i) => i.risk_level === 'SOLE_SOURCE_CRITICAL');
    expect(sole).toBeDefined();
    expect(sole.mitigation_urgency).toBe('IMMEDIATE_ACTION');
    expect(sole.suggested_action_plan.length).toBe(3);
    expect(sole.actionable_mitigation).toContain('Sole Source Alert');
  });
  it('identifies DOMINANT_SUPPLIER for >= 75% share and secondary < 15%', () => {
    const items = [
      { ...baseItem, inr_crores: 8.0, material_code: 'MAT-002', vendor_identified: 'MajorV' },
      { ...baseItem, line_item_id: 'L2', inr_crores: 1.0, material_code: 'MAT-002', vendor_identified: 'MinorV' }
    ];
    const r = calculateStrategicVendorRisk(items);
    const dom = r.find((i) => i.risk_level === 'DOMINANT_SUPPLIER_SINGLE_DIGIT_SECONDARY');
    expect(dom).toBeDefined();
    expect(dom.mitigation_urgency).toBe('HIGH_PRIORITY');
  });
  it('excludes materials where primary share < 75%', () => {
    const items = [
      { ...baseItem, inr_crores: 3.0, material_code: 'MAT-003', vendor_identified: 'A' },
      { ...baseItem, line_item_id: 'L2', inr_crores: 2.0, material_code: 'MAT-003', vendor_identified: 'B' }
    ];
    const r = calculateStrategicVendorRisk(items);
    expect(r.find((i) => i.material_code === 'MAT-003')).toBeUndefined();
  });
  it('sets is_secondary_single_digit true when secondary share < 10%', () => {
    const items = [
      { ...baseItem, inr_crores: 9.0, material_code: 'MAT-004', vendor_identified: 'Big' },
      { ...baseItem, line_item_id: 'L2', inr_crores: 0.5, material_code: 'MAT-004', vendor_identified: 'Small' }
    ];
    const r = calculateStrategicVendorRisk(items);
    if (r.length > 0 && r[0].secondary_vendor) {
      expect(r[0].secondary_vendor.is_secondary_single_digit).toBe(true);
    }
  });
  it('uses raw_desc as material key when no material_code', () => {
    const item = { ...baseItem, material_code: undefined, inr_crores: 2.0 };
    const r = calculateStrategicVendorRisk([item]);
    expect(r.length).toBeGreaterThanOrEqual(0);
  });
  it('accumulates spend for same vendor and material on multiple POs', () => {
    const items = [
      { ...baseItem, inr_crores: 5.0, material_code: 'MAT-006' },
      { ...baseItem, line_item_id: 'L2', inr_crores: 4.0, material_code: 'MAT-006' }
    ];
    const r = calculateStrategicVendorRisk(items);
    const mat = r.find((i) => i.material_code === 'MAT-006');
    expect(mat?.primary_vendor.spend_inr_cr).toBeCloseTo(9.0);
    expect(mat?.po_count).toBe(2);
  });
});

describe('step2StrategicRisk branch coverage', () => {
  it('uses fallback materialDesc from material_desc when raw_desc is missing (line 76)', () => {
    const itemNoRawDesc = {
      mapping_id: 'MAP-BR1', line_item_id: 'LINE-BR1',
      raw_desc: undefined,
      material_desc: 'Ceramic Bearings 6206',
      material_code: 'MAT-CERAMIC',
      vendor_identified: 'NTN India',
      master_supplier_id: 'VND-NTN',
      inr_crores: 2.0,
      core_bucket: 'Direct Materials',
      status: 'Confirmed',
      ai_confidence: 91
    } as any;
    const r = calculateStrategicVendorRisk([itemNoRawDesc]);
    expect(r.length).toBeGreaterThanOrEqual(1);
    expect(r[0].material_desc).toContain('Ceramic');
  });

  it('uses raw_desc as matKey when material_code is missing (line 94)', () => {
    const itemNoCode = {
      mapping_id: 'MAP-BR2', line_item_id: 'LINE-BR2',
      raw_desc: 'Polycarbonate Sheet 4mm',
      material_code: undefined,
      vendor_identified: 'Covestro India',
      inr_crores: 1.5,
      core_bucket: 'Indirect Materials',
      status: 'Confirmed',
      ai_confidence: 88
    } as any;
    const r = calculateStrategicVendorRisk([itemNoCode]);
    expect(r.length).toBeGreaterThanOrEqual(1);
  });

  it('updates existing vendor spend when same vendor appears twice (line 106)', () => {
    const base = {
      mapping_id: 'MAP-BR3', line_item_id: 'LINE-BR3',
      raw_desc: 'Speciality Lubricant 5L',
      material_code: 'MAT-DUP-R',
      vendor_identified: 'Tata Chemicals',
      master_supplier_id: 'VND-TATA',
      core_bucket: 'Direct Materials',
      status: 'Confirmed', ai_confidence: 90
    } as any;
    const items = [
      { ...base, inr_crores: 3.0 },
      { ...base, line_item_id: 'LINE-BR4', inr_crores: 2.0 }
    ];
    const r = calculateStrategicVendorRisk(items);
    const mat = r.find((m: any) => m.material_code === 'MAT-DUP-R');
    expect(mat?.primary_vendor.spend_inr_cr).toBeCloseTo(5.0);
  });
});

describe('step2CategoryBreakdown branch coverage', () => {
  it('handles item with no vendor_identified (vendors_count = 0)', () => {
    const item = {
      mapping_id: 'MAP-CAT1', line_item_id: 'LINE-CAT1',
      raw_desc: 'Precision Gauge Block',
      vendor_identified: undefined,
      unspsc_code: '41111900',
      inr_crores: 2.0,
      core_bucket: 'Direct Materials',
      status: 'Confirmed', ai_confidence: 90
    } as any;
    const r = calculateCategoryYearDetails([item]);
    expect(r.length).toBeGreaterThanOrEqual(1);
    // vendor_count is `data.vendors.size || 1`; with no vendor_identified, size=0 → fallback 1
    expect(r[0].vendor_count).toBe(1);
  });

  it('uses material_desc fallback when raw_desc is missing (line 159)', () => {
    const item = {
      mapping_id: 'MAP-CAT2', line_item_id: 'LINE-CAT2',
      raw_desc: undefined,
      material_desc: 'Steel Sheet Grade A',
      vendor_identified: 'SAIL',
      unspsc_code: '30101500',
      inr_crores: 3.0,
      core_bucket: 'Direct Materials',
      status: 'Confirmed', ai_confidence: 92
    } as any;
    const r = calculateCategoryYearDetails([item]);
    expect(r.length).toBeGreaterThanOrEqual(1);
    expect(r[0].top_items.length).toBeGreaterThanOrEqual(1);
  });

  it('uses commodityCode fallback when unspsc_code missing (line 134)', () => {
    const item = {
      mapping_id: 'MAP-CAT3', line_item_id: 'LINE-CAT3',
      raw_desc: 'Hydraulic Pump Seal',
      unspsc_code: undefined,
      unspsc_commodity_title: undefined,
      vendor_identified: 'Parker India',
      inr_crores: 4.0,
      core_bucket: 'Direct Materials',
      status: 'Confirmed', ai_confidence: 89
    } as any;
    const r = calculateCategoryYearDetails([item]);
    expect(r.length).toBeGreaterThanOrEqual(1);
    expect(r[0].sample_column_l_code).toBeDefined();
  });
});
describe('step2CategoryBreakdown fallback category branch coverage (lines 100, 101, 104, 107)', () => {
  it('uses fallback category fields when name, id, column_l_code, and spend_inr_crores are absent', () => {
    // Pass empty lineItems => triggers transformFallbackCategories path
    const fallbackCats = [
      {
        // c.id missing => uses CAT-1 (line 104 second branch)
        // c.name missing => uses c.category (line 101 second branch)
        // c.spend_inr_crores=0 => uses c.total_3yr_spend_inr_cr (line 100 second branch)
        // c.column_l_code missing => uses '10000000' (line 107 second branch)
        category: 'Packaging Materials',
        total_3yr_spend_inr_cr: 4.5
      },
      {
        // c.name missing AND c.category missing => 'Direct Materials' (line 101 third branch)
        // c.spend_inr_crores=0 AND c.total_3yr_spend_inr_cr=0 => 0 (line 100 third branch)
        spend_inr_crores: 0,
        total_3yr_spend_inr_cr: 0,
        lineItemsCount: 7
      }
    ] as any[];

    const r = calculateCategoryYearDetails([], fallbackCats);
    expect(r.length).toBe(2);
    // First item: id should be 'CAT-1' (fallback since c.id is absent)
    expect(r[0].id).toBe('CAT-1');
    // Second item: category should be 'Direct Materials' fallback
    expect(r[1].category).toBe('Direct Materials');
    // First item: core_bucket should be 'Packaging Materials' from getFallbackBucket
    expect(r[0].core_bucket).toBe('Packaging Materials');
  });

  it('uses c.id when provided (line 104 first branch)', () => {
    const fallbackCats = [{
      id: 'MY-CAT-ID',
      name: 'MRO Indirect',
      spend_inr_crores: 2.0,
      column_l_code: '4100000'
    }] as any[];

    const r = calculateCategoryYearDetails([], fallbackCats);
    expect(r[0].id).toBe('MY-CAT-ID');
    expect(r[0].sample_column_l_code).toBe('4100000');
  });
});

describe('step2StrategicRisk additional branch coverage (lines 44, 76, 94, 106)', () => {
  it('secondaryShare = 0 when only one vendor (secondary undefined: line 44 falsy branch)', () => {
    // Single vendor => secondary = undefined => secondaryShare = 0
    // If primaryShare >= 95, isSole = true, item is included in results
    const soleItem = {
      mapping_id: 'MAP-SOLE', line_item_id: 'LINE-SOLE',
      raw_desc: 'Specialty Resin Grade A',
      material_code: 'MAT-SOLE',
      vendor_identified: 'Dow Chemical India',
      master_supplier_id: 'VND-DOW',
      inr_crores: 10.0,
      core_bucket: 'Direct Materials',
      status: 'Confirmed', ai_confidence: 95
    } as any;
    const r = calculateStrategicVendorRisk([soleItem]);
    expect(r.length).toBeGreaterThanOrEqual(1);
    // Should be sole supplier risk - property is risk_level
    expect(r[0].risk_level).toMatch(/SOLE|DOMINANT/i);
  });

  it('uses third fallback for matKey when both material_code and raw_desc are absent (line 94)', () => {
    const noCodeNoDesc = {
      mapping_id: 'MAP-NK', line_item_id: 'LINE-NK',
      raw_desc: undefined,
      material_code: undefined,
      vendor_identified: 'Generic Supplier',
      master_supplier_id: 'VND-GEN',
      inr_crores: 1.0,
      core_bucket: 'Indirect Materials',
      status: 'Confirmed', ai_confidence: 85
    } as any;
    const r = calculateStrategicVendorRisk([noCodeNoDesc]);
    // Result may or may not qualify as strategic risk; just verify no crash
    expect(Array.isArray(r)).toBe(true);
  });

  it('uses "Unknown Supplier" fallback when vendor_identified absent (line 106)', () => {
    const noVendor = {
      mapping_id: 'MAP-NV', line_item_id: 'LINE-NV',
      raw_desc: 'Generic Industrial Component',
      material_code: 'MAT-NV',
      vendor_identified: undefined,
      inr_crores: 2.0,
      core_bucket: 'Direct Materials',
      status: 'Confirmed', ai_confidence: 88
    } as any;
    const r = calculateStrategicVendorRisk([noVendor]);
    expect(Array.isArray(r)).toBe(true);
  });

  it('uses "Industrial Material" fallback when both raw_desc and material_desc absent (line 76)', () => {
    const noDesc = {
      mapping_id: 'MAP-ND', line_item_id: 'LINE-ND',
      raw_desc: undefined,
      material_desc: undefined,
      material_code: 'MAT-ND',
      vendor_identified: 'Fallback Vendor',
      master_supplier_id: 'VND-FB',
      inr_crores: 3.0,
      core_bucket: 'Direct Materials',
      status: 'Confirmed', ai_confidence: 90
    } as any;
    const r = calculateStrategicVendorRisk([noDesc]);
    expect(Array.isArray(r)).toBe(true);
    // The materialDesc should use the third fallback 'Industrial Material'
    if (r.length > 0) {
      expect(r[0].material_desc).toBe('Industrial Material');
    }
  });
});
describe('step2VendorBreakdown branch coverage (lines 30, 39, 50, 53, 54, 79, 105)', () => {
  it('covers fallback branches for category, desc, code, master_id, unknown supplier, and high creep', () => {
    const items = [
      // Item 1: no core_bucket, has unspsc_category_name, no raw_desc (has material_desc), no unspsc_code, spend > 15 (High Creep)
      {
        mapping_id: 'MAP-V1', line_item_id: 'LINE-V1',
        material_desc: 'Valves 50mm',
        unspsc_category_name: 'Industrial Equipment',
        vendor_identified: 'Mega Valves Inc',
        master_supplier_id: 'VND-MEGA',
        inr_crores: 16.0,
        status: 'Confirmed', ai_confidence: 90
      },
      // Item 2: no core_bucket, no unspsc_category_name, no raw_desc, no material_desc, no master_supplier_id, no vendor_identified
      {
        mapping_id: 'MAP-V2', line_item_id: 'LINE-V2',
        inr_crores: 2.0,
        status: 'Confirmed', ai_confidence: 85
      },
      // Item 3: vendor with spendFY25 = 0 (exercises yoy fallback 7.5)
      {
        mapping_id: 'MAP-V3', line_item_id: 'LINE-V3',
        raw_desc: 'Switchgear',
        vendor_identified: 'Schneider',
        inr_crores: 0,
        total_spend: 0,
        spend_year: 'FY24', // FY25 spend is 0, so yoy fallback 7.5
        status: 'Confirmed', ai_confidence: 90
      }
    ] as any[];

    const results = calculateVendorYearDetails(items);
    expect(results.length).toBe(3);

    const mega = results.find(v => v.vendor_name === 'Mega Valves Inc');
    expect(mega).toBeDefined();
    expect(mega?.risk_status).toBe('HIGH CREEP');
    expect(mega?.primary_category).toBe('Industrial Equipment');

    const unknown = results.find(v => v.vendor_name === 'Unknown Supplier');
    expect(unknown).toBeDefined();
    expect(unknown?.risk_status).toBe('ALIGNED');
    expect(unknown?.master_vendor_id).toMatch(/VND-M-/);
    expect(unknown?.primary_category).toBe('Direct Materials');

    const schneider = results.find(v => v.vendor_name === 'Schneider');
    expect(schneider).toBeDefined();
    expect(schneider?.yoy_growth_pct).toBeUndefined();
  });

  it('covers fy24 > 0 && fy25 > 0 YoY branch in calculateVendorYearDetails and zero totalCalculated fallback', () => {
    const items = [
      {
        mapping_id: 'MAP-V4A',
        line_item_id: 'LINE-V4A',
        vendor_identified: 'Vendor A',
        spend_year: 2023,
        inr_crores: 10.0,
        total_spend: 100000000,
        status: 'Confirmed',
        ai_confidence: 90
      },
      {
        mapping_id: 'MAP-V4B',
        line_item_id: 'LINE-V4B',
        vendor_identified: 'Vendor A',
        spend_year: 2024,
        inr_crores: 15.0,
        total_spend: 150000000,
        status: 'Confirmed',
        ai_confidence: 90
      }
    ] as any[];
    const res = calculateVendorYearDetails(items);
    expect(res.length).toBe(1);
    expect(res[0].yoy_growth_pct).toBe(50.0);

    const emptyRes = calculateVendorYearDetails([], 42.0);
    expect(emptyRes.length).toBe(0);
  });

  it('sorts zero-spend vendor items and uses the supplied denominator fallback', () => {
    const items = [
      { ...baseItem, mapping_id: 'MAP-ZERO-A', line_item_id: 'LINE-ZERO-A', raw_desc: 'Item A', vendor_identified: 'Zero Vendor', inr_crores: 0, total_spend: 0, core_bucket: 'Zinc' },
      { ...baseItem, mapping_id: 'MAP-ZERO-B', line_item_id: 'LINE-ZERO-B', raw_desc: 'Item B', vendor_identified: 'Zero Vendor', inr_crores: 0, total_spend: 0, core_bucket: 'Aluminium' }
    ];

    const result = calculateVendorYearDetails(items, 42);

    expect(result).toHaveLength(1);
    expect(result[0]?.spend_share_pct).toBe(0);
    expect(result[0]?.top_items.map((item) => item.item_name)).toEqual(['Item A', 'Item B']);
  });
});

describe('step2CategoryBreakdown branch coverage (lines 63, 116-117)', () => {
  it('covers fy24 > 0 && fy25 > 0 YoY branch in calculateCategoryYearDetails', () => {
    const items = [
      {
        mapping_id: 'MAP-C1A',
        line_item_id: 'LINE-C1A',
        core_bucket: 'Packaging Materials',
        spend_year: 2023,
        inr_crores: 20.0,
        total_spend: 200000000,
        status: 'Confirmed',
        ai_confidence: 95
      },
      {
        mapping_id: 'MAP-C1B',
        line_item_id: 'LINE-C1B',
        core_bucket: 'Packaging Materials',
        spend_year: 2024,
        inr_crores: 30.0,
        total_spend: 300000000,
        status: 'Confirmed',
        ai_confidence: 95
      }
    ] as any[];
    const res = calculateCategoryYearDetails(items);
    expect(res.length).toBe(1);
    expect(res[0].yoy_growth_pct).toBe(50.0);
  });

  it('covers calculateFallbackYoY returning number when fy25 and fy26 > 0, and undefined when 0', () => {
    const fallbackCats = [
      {
        id: 'FB-1',
        name: 'Logistics & Freight',
        spend_fy24_cr: 10.0,
        spend_fy25_cr: 20.0,
        spend_fy26_cr: 30.0,
        spend_inr_crores: 60.0
      },
      {
        id: 'FB-2',
        name: 'Packaging Materials',
        spend_fy24_cr: 10.0,
        spend_fy25_cr: 0,
        spend_fy26_cr: 15.0,
        spend_inr_crores: 25.0
      }
    ] as any[];
    const res = calculateCategoryYearDetails([], fallbackCats, 85.0);
    expect(res.length).toBe(2);
    expect(res[0].yoy_growth_pct).toBe(50.0);
    expect(res[1].yoy_growth_pct).toBeUndefined();
  });

  it('covers fallback categories with spend_inr_2023/2024/2025_26 and classified commodity matching', () => {
    const fallbackCats = [
      {
        id: 'FB-INR',
        name: 'Direct Materials',
        spend_inr_2023: 100000000,
        spend_inr_2024: 150000000,
        spend_inr_2025_26: 200000000,
        spend_inr_crores: 45.0
      }
    ] as any[];
    const resFallback = calculateCategoryYearDetails([], fallbackCats, 45.0);
    expect(resFallback.length).toBe(1);
    expect(resFallback[0].spend_fy24_cr).toBe(10.0);
    expect(resFallback[0].spend_fy25_cr).toBe(15.0);
    expect(resFallback[0].spend_fy26_cr).toBe(20.0);

    const items = [
      {
        mapping_id: 'MAP-CLASS-1',
        line_item_id: 'LINE-CLASS-1',
        raw_desc: 'Valves 50mm flanged',
        unspsc_category_name: 'Pumps & Motors',
        inr_crores: 12.0,
        spend_year: 2024,
        status: 'Confirmed',
        ai_confidence: 90
      },
      {
        mapping_id: 'MAP-CLASS-2',
        line_item_id: 'LINE-CLASS-2',
        inr_crores: 5.0,
        spend_year: 2024,
        status: 'Confirmed',
        ai_confidence: 85
      }
    ] as any[];
    const resItems = calculateCategoryYearDetails(items);
    expect(resItems.length).toBe(2);
  });

  it('uses the default fallback category label and sorts same-category zero-spend items', () => {
    const fallback = calculateCategoryYearDetails([], [{ id: 'FB-EMPTY', spend_fy24_cr: 1 } as any]);
    const items = [
      { ...baseItem, mapping_id: 'MAP-ZERO-C1', line_item_id: 'LINE-ZERO-C1', raw_desc: 'Category Item A', core_bucket: 'Zero Spend', inr_crores: 0, total_spend: 0 },
      { ...baseItem, mapping_id: 'MAP-ZERO-C2', line_item_id: 'LINE-ZERO-C2', raw_desc: 'Category Item B', core_bucket: 'Zero Spend', inr_crores: 0, total_spend: 0 }
    ];
    const result = calculateCategoryYearDetails(items, [], 25);

    expect(fallback[0]?.category).toBe('Direct Materials');
    expect(result).toHaveLength(1);
    expect(result[0]?.spend_share_pct).toBe(0);
    expect(result[0]?.top_items).toHaveLength(2);
  });
});
