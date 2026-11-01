import { describe, expect, it } from 'vitest';
import { UI_STRINGS } from '../../src/constants/uiStrings';
import type { LineItemMapping } from '../../src/types/models';
import { buildVendorSupplyRecords } from '../../src/utils/vendorSupplyData';

const lineItem = (overrides: Partial<LineItemMapping> = {}): LineItemMapping => ({
  mapping_id: 'map-1',
  line_item_id: 'line-1',
  material_code: 'mat-1',
  material_desc: 'Material one',
  raw_desc: 'Material one description',
  vendor_identified: 'Acme',
  master_supplier_id: 'SUP-1',
  unspsc_code: '12345678',
  unspsc_category_name: 'Chemicals',
  core_bucket: 'Direct Materials',
  ai_confidence: 90,
  status: 'Confirmed',
  unit_price: 10,
  qty: 2,
  total_spend: 20_000_000,
  inr_crores: 2,
  invoice_date: '2023-06-10',
  spend_year: 2023,
  po_number: 'PO-1',
  ...overrides
});

describe('buildVendorSupplyRecords', () => {
  it('returns an empty list when the assessment has no stored line items', () => {
    expect(buildVendorSupplyRecords()).toEqual([]);
    expect(buildVendorSupplyRecords([])).toEqual([]);
  });

  it('aggregates actual spend, categories, known fiscal years and source item details', () => {
    const records = buildVendorSupplyRecords([
      lineItem(),
      lineItem({
        mapping_id: 'map-2', line_item_id: 'line-2', material_code: 'mat-2',
        raw_desc: 'Second material', core_bucket: 'Packaging Materials',
        inr_crores: null, total_spend: 50_000_000, spend_year: 2024, po_number: 'PO-2'
      }),
      lineItem({
        mapping_id: 'map-3', line_item_id: 'line-3', material_code: 'mat-3',
        raw_desc: 'Third material', inr_crores: 3, spend_year: 2025, po_number: 'PO-3'
      })
    ], 20);

    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      rank: 1,
      vendor_name: 'Acme',
      master_vendor_id: 'SUP-1',
      total_spend_inr_cr: 10,
      spend_fy24_cr: 2,
      spend_fy25_cr: 5,
      spend_fy26_cr: 3,
      yoy_growth_pct: 150,
      category_type: 'MULTI_CATEGORY',
      category_count: 2,
      primary_category: 'Direct Materials',
      supplied_categories: ['Direct Materials', 'Packaging Materials'],
      risk_level: 'HIGH_RISK',
      spend_share_pct: 50,
      line_items_count: 3
    });
    expect(records[0].top_items?.map((item) => item.material_code)).toEqual(['mat-2', 'mat-3', 'mat-1']);
    expect(records[0].top_items?.[0]).toMatchObject({
      material_description: 'Second material',
      po_number: 'PO-2',
      unspsc_code: '12345678'
    });
    expect(records[0].price_yoy_pct).toBeUndefined();
    expect(records[0].qty_yoy_pct).toBeUndefined();
  });

  it('groups by a persisted supplier id and otherwise normalizes the supplier name', () => {
    const records = buildVendorSupplyRecords([
      lineItem({ master_supplier_id: undefined, vendor_identified: ' Same Supplier ', inr_crores: 1 }),
      lineItem({ mapping_id: 'map-2', line_item_id: 'line-2', master_supplier_id: undefined, vendor_identified: 'same supplier', inr_crores: 2 }),
      lineItem({ mapping_id: 'map-3', line_item_id: 'line-3', master_supplier_id: 'SUP-2', vendor_identified: 'Same Supplier', inr_crores: 4 })
    ]);

    expect(records).toHaveLength(2);
    expect(records[0].master_vendor_id).toBe('SUP-2');
    expect(records[1].total_spend_inr_cr).toBe(3);
    expect(records[1].master_vendor_id).toBe(UI_STRINGS.common.notAvailable);
  });

  it('does not invent spend, categories, year allocations, identifiers, or item fields when source values are absent', () => {
    const records = buildVendorSupplyRecords([lineItem({
      vendor_identified: '', master_supplier_id: undefined, material_code: '', line_item_id: '',
      raw_desc: '', material_desc: '', po_number: '', unspsc_code: '', unspsc_commodity_title: '',
      unspsc_category_name: '', core_bucket: '', inr_crores: undefined, total_spend: 0,
      spend_year: undefined, invoice_date: 'invalid-date', qty: 0
    })]);

    expect(records[0]).toMatchObject({
      vendor_name: UI_STRINGS.common.notAvailable,
      master_vendor_id: UI_STRINGS.common.notAvailable,
      total_spend_inr_cr: 0,
      spend_fy24_cr: 0,
      spend_fy25_cr: 0,
      spend_fy26_cr: 0,
      yoy_growth_pct: undefined,
      category_count: 0,
      primary_category: UI_STRINGS.common.notAvailable,
      supplied_categories: [],
      risk_level: 'OPTIMAL',
      spend_share_pct: 0
    });
    expect(records[0].top_items?.[0]).toEqual({
      material_code: UI_STRINGS.common.notAvailable,
      material_description: UI_STRINGS.common.notAvailable,
      po_number: UI_STRINGS.common.notAvailable,
      unspsc_code: UI_STRINGS.common.notAvailable,
      unspsc_title: UI_STRINGS.common.notAvailable
    });
  });

  it('uses invoice year when present and only assigns YoY when two comparable fiscal years exist', () => {
    const [withComparablePeriods] = buildVendorSupplyRecords([
      lineItem({ spend_year: undefined, invoice_date: '2024-02-15', inr_crores: 4 }),
      lineItem({ mapping_id: 'map-2', line_item_id: 'line-2', spend_year: undefined, invoice_date: '2025-02-15', inr_crores: 6 })
    ]);
    const [onePeriod] = buildVendorSupplyRecords([
      lineItem({ spend_year: undefined, invoice_date: '2025-02-15', inr_crores: 6 })
    ]);

    expect(withComparablePeriods.spend_fy25_cr).toBe(4);
    expect(withComparablePeriods.spend_fy26_cr).toBe(6);
    expect(withComparablePeriods.yoy_growth_pct).toBe(50);
    expect(onePeriod.yoy_growth_pct).toBeUndefined();
  });

  it('orders by spend, keeps only the top 50, and applies the medium spend risk tier', () => {
    const items = Array.from({ length: 52 }, (_, index) => lineItem({
      mapping_id: `map-${index}`,
      line_item_id: `line-${index}`,
      vendor_identified: `Supplier ${index}`,
      master_supplier_id: `SUP-${index}`,
      inr_crores: index === 0 ? 6 : 1 + index / 100,
      core_bucket: 'Direct Materials'
    }));

    const records = buildVendorSupplyRecords(items);

    expect(records).toHaveLength(50);
    expect(records[0].vendor_name).toBe('Supplier 0');
    expect(records[0].risk_level).toBe('MEDIUM_RISK');
    expect(records[0].rank).toBe(1);
    expect(records[49].rank).toBe(50);
  });
});
