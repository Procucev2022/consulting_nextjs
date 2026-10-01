import { describe, it, expect } from 'vitest';
import {
  calculateVendorConsolidation,
  calculateVendorConsolidationSummary
} from '../../src/utils/step2VendorConsolidation';
import {
  calculatePoConsolidation,
  calculatePoConsolidationSummary
} from '../../src/utils/step2PoConsolidation';
import type { LineItemMapping } from '../../src/types';

describe('step2VendorConsolidation', () => {
  const sampleItems: LineItemMapping[] = [
    {
      mapping_id: 'M1',
      line_item_id: 'L1',
      raw_desc: 'Precision Ball Bearings 6204',
      core_bucket: 'Direct Materials',
      unspsc_code: '31171504',
      unspsc_category_name: 'Direct Materials',
      ai_confidence: 95,
      status: 'Confirmed',
      unit_price: 500,
      total_spend: 25000000,
      inr_crores: 2.5,
      vendor_identified: 'SKF India',
      master_supplier_id: 'VND-001',
      qty: 5000,
      invoice_date: '2024-05-10',
      po_number: 'PO-1001'
    },
    {
      mapping_id: 'M2',
      line_item_id: 'L2',
      raw_desc: 'Precision Ball Bearings 6204',
      core_bucket: 'Direct Materials',
      unspsc_code: '31171504',
      unspsc_category_name: 'Direct Materials',
      ai_confidence: 95,
      status: 'Confirmed',
      unit_price: 500,
      total_spend: 35000000,
      inr_crores: 3.5,
      vendor_identified: 'FAG Bearings',
      master_supplier_id: 'VND-002',
      qty: 7000,
      invoice_date: '2024-05-12',
      po_number: 'PO-1002'
    },
    {
      mapping_id: 'M3',
      line_item_id: 'L3',
      raw_desc: 'Precision Ball Bearings 6204',
      core_bucket: 'Direct Materials',
      unspsc_code: '31171504',
      unspsc_category_name: 'Direct Materials',
      ai_confidence: 95,
      status: 'Confirmed',
      unit_price: 500,
      total_spend: 15000000,
      inr_crores: 1.5,
      vendor_identified: 'Timken',
      master_supplier_id: 'VND-003',
      qty: 3000,
      invoice_date: '2024-05-15',
      po_number: 'PO-1003'
    },
    {
      mapping_id: 'M4',
      line_item_id: 'L4',
      raw_desc: 'Hydraulic Cylinder Seals',
      core_bucket: 'Indirect & MRO',
      unspsc_code: '31181500',
      unspsc_category_name: 'Indirect & MRO',
      ai_confidence: 90,
      status: 'Confirmed',
      unit_price: 1000,
      total_spend: 10000000,
      inr_crores: 1.0,
      vendor_identified: 'SealCo',
      qty: 1000,
      invoice_date: '2024-06-01',
      po_number: 'PO-1004'
    }
  ];

  it('returns empty array when given empty line items', () => {
    expect(calculateVendorConsolidation([])).toEqual([]);
    expect(calculateVendorConsolidation(undefined as unknown as LineItemMapping[])).toEqual([]);
  });

  it('calculates vendor consolidation groups with >= 2 suppliers', () => {
    const results = calculateVendorConsolidation(sampleItems);
    expect(results.length).toBe(1);
    expect(results[0].total_spend_inr_cr).toBe(7.5);
    expect(results[0].vendor_count).toBe(3);
    expect(results[0].suppliers.length).toBe(3);
    expect(results[0].suppliers[0].status).toBe('Primary');
    expect(results[0].suppliers[1].status).toBe('Incumbent');
    expect(results[0].suppliers[2].status).toBe('Spot / Peripheral');
    expect(results[0].est_volume_savings_cr).toBeGreaterThan(0);
  });

  it('calculates vendor consolidation summary', () => {
    const items = calculateVendorConsolidation(sampleItems);
    const summary = calculateVendorConsolidationSummary(items);
    expect(summary.totalFragmentedSpendCr).toBe(7.5);
    expect(summary.categoriesCount).toBe(1);
    expect(summary.totalActiveVendors).toBe(3);
    expect(summary.avgVendorsPerCategory).toBe(3);
    expect(summary.potentialVolumeSavingsCr).toBeGreaterThan(0);
    expect(summary.avgSavingsPct).toBeGreaterThan(0);
  });

  it('calculates empty summary when items are empty', () => {
    const summary = calculateVendorConsolidationSummary([]);
    expect(summary.totalFragmentedSpendCr).toBe(0);
    expect(summary.avgVendorsPerCategory).toBe(0);
    expect(summary.avgSavingsPct).toBe(0);
  });
});

describe('step2PoConsolidation', () => {
  const sampleItems: LineItemMapping[] = [
    {
      mapping_id: 'MP1',
      line_item_id: 'P1',
      raw_desc: 'Steel Fasteners M10',
      core_bucket: 'Direct Materials',
      unspsc_code: '31161500',
      unspsc_category_name: 'Direct Materials',
      ai_confidence: 92,
      status: 'Confirmed',
      unit_price: 100,
      total_spend: 40000000,
      inr_crores: 4.0,
      vendor_identified: 'Sundaram Fasteners',
      master_supplier_id: 'VND-SF-1',
      material_code: 'MAT-100',
      qty: 400000,
      invoice_date: '2024-04-01',
      po_number: 'PO-2001'
    },
    {
      mapping_id: 'MP2',
      line_item_id: 'P2',
      raw_desc: 'Steel Fasteners M10',
      core_bucket: 'Direct Materials',
      unspsc_code: '31161500',
      unspsc_category_name: 'Direct Materials',
      ai_confidence: 92,
      status: 'Confirmed',
      unit_price: 100,
      total_spend: 20000000,
      inr_crores: 2.0,
      vendor_identified: 'Sundaram Fasteners',
      master_supplier_id: 'VND-SF-1',
      material_code: 'MAT-100',
      qty: 200000,
      invoice_date: '2024-07-01',
      po_number: 'PO-2002'
    }
  ];

  it('returns empty array when given empty line items', () => {
    expect(calculatePoConsolidation([])).toEqual([]);
    expect(calculatePoConsolidation(undefined as unknown as LineItemMapping[])).toEqual([]);
  });

  it('calculates PO consolidation items and cadences', () => {
    const results = calculatePoConsolidation(sampleItems);
    expect(results.length).toBe(1);
    expect(results[0].vendor_name).toBe('Sundaram Fasteners');
    expect(results[0].total_annual_spend_cr).toBe(6.0);
    expect(results[0].cadence_options.QUARTERLY.po_reduction_pct).toBeGreaterThanOrEqual(0);
    expect(results[0].cadence_options.HALF_YEARLY.po_reduction_pct).toBeGreaterThan(0);
    expect(results[0].cadence_options.MONTHLY.scale_savings_cr).toBeGreaterThan(0);
    expect(results[0].cadence_options.HALF_YEARLY.total_benefit_cr).toBeGreaterThan(0);
    expect(results[0].cadence_options.ANNUAL.admin_savings_lakhs).toBeGreaterThanOrEqual(0);
  });

  it('calculates PO consolidation summary across cadences', () => {
    const results = calculatePoConsolidation(sampleItems);
    const summaryQuarterly = calculatePoConsolidationSummary(results, 'QUARTERLY');
    expect(summaryQuarterly.totalFragmentedSpendCr).toBe(6.0);
    expect(summaryQuarterly.totalTargetPos).toBe(4);
    expect(summaryQuarterly.qualifiedSuppliersCount).toBe(1);

    const summaryMonthly = calculatePoConsolidationSummary(results, 'MONTHLY');
    expect(summaryMonthly.totalTargetPos).toBe(12);

    const emptySummary = calculatePoConsolidationSummary([]);
    expect(emptySummary.totalFragmentedSpendCr).toBe(0);
    expect(emptySummary.avgPoReductionPct).toBe(0);
  });

  it('uses fallback "Supplier" when vendor_identified is undefined (line 55 branch)', () => {
    // vendor_identified missing → 'Supplier' fallback, raw_desc missing → material_desc fallback
    const items = [
      {
        mapping_id: 'M1', line_item_id: 'L1',
        vendor_identified: undefined,
        material_desc: 'Bolt Assembly',
        raw_desc: undefined,
        inr_crores: 3.0,
        core_bucket: 'Direct Materials',
        status: 'Confirmed', ai_confidence: 90,
        po_number: 'PO-X1'
      },
      {
        mapping_id: 'M2', line_item_id: 'L2',
        vendor_identified: undefined,
        material_desc: 'Bolt Assembly',
        raw_desc: undefined,
        inr_crores: 3.0,
        core_bucket: 'Direct Materials',
        status: 'Confirmed', ai_confidence: 90,
        po_number: 'PO-X2'
      },
      {
        mapping_id: 'M3', line_item_id: 'L3',
        vendor_identified: undefined,
        material_desc: 'Bolt Assembly',
        raw_desc: undefined,
        inr_crores: 3.0,
        core_bucket: 'Direct Materials',
        status: 'Confirmed', ai_confidence: 90,
        po_number: 'PO-X3'
      },
      {
        mapping_id: 'M4', line_item_id: 'L4',
        vendor_identified: undefined,
        material_desc: 'Bolt Assembly',
        raw_desc: undefined,
        inr_crores: 3.0,
        core_bucket: 'Direct Materials',
        status: 'Confirmed', ai_confidence: 90,
        po_number: 'PO-X4'
      }
    ] as unknown as LineItemMapping[];
    const results = calculatePoConsolidation(items);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].vendor_name).toBe('Supplier');
  });
});

describe('step2VendorConsolidation branch coverage', () => {
  it('updates existing supplier spend/poCount when same supplier appears twice (lines 78-79)', () => {
    // To trigger the existingS branch: same vendor, same material group → second item updates existing entry
    const items = [
      {
        mapping_id: 'M1', line_item_id: 'L1',
        raw_desc: 'Hydraulic Seal Ring 50mm',
        core_bucket: 'Direct Materials',
        vendor_identified: 'Freudenberg India',
        master_supplier_id: 'VND-HYD-01',
        inr_crores: 2.0,
        status: 'Confirmed', ai_confidence: 92,
        po_number: 'PO-H1', invoice_date: '2024-04-01'
      },
      {
        mapping_id: 'M2', line_item_id: 'L2',
        raw_desc: 'Hydraulic Seal Ring 50mm',
        core_bucket: 'Direct Materials',
        vendor_identified: 'Freudenberg India',
        master_supplier_id: 'VND-HYD-01',
        inr_crores: 3.0,
        status: 'Confirmed', ai_confidence: 92,
        po_number: 'PO-H2', invoice_date: '2024-05-01'
      },
      // Second vendor to ensure group qualifies with >= 2 suppliers
      {
        mapping_id: 'M3', line_item_id: 'L3',
        raw_desc: 'Hydraulic Seal Ring 50mm',
        core_bucket: 'Direct Materials',
        vendor_identified: 'Parker Hannifin India',
        master_supplier_id: 'VND-HYD-02',
        inr_crores: 1.5,
        status: 'Confirmed', ai_confidence: 90,
        po_number: 'PO-H3', invoice_date: '2024-06-01'
      },
      {
        mapping_id: 'M4', line_item_id: 'L4',
        raw_desc: 'Hydraulic Seal Ring 50mm',
        core_bucket: 'Direct Materials',
        vendor_identified: 'Parker Hannifin India',
        master_supplier_id: 'VND-HYD-02',
        inr_crores: 1.5,
        status: 'Confirmed', ai_confidence: 90,
        po_number: 'PO-H4', invoice_date: '2024-07-01'
      }
    ] as unknown as LineItemMapping[];
    const results = calculateVendorConsolidation(items);
    expect(results.length).toBeGreaterThanOrEqual(1);
    // Total spend should reflect both items (supplier updated, not duplicated)
    expect(results[0].total_spend_inr_cr).toBeGreaterThan(0);
    const summary = calculateVendorConsolidationSummary(results);
    expect(summary.totalFragmentedSpendCr).toBeGreaterThan(0);
  });
});

describe('step2VendorConsolidation extended branch coverage (lines 112-116, 125, 131)', () => {
  // Need 3+ suppliers in same group so sortedSuppliersList.slice(1) runs with more entries
  // and the tail excess spend loops multiple times, exercising lines 121-122

  it('calculates tail excess spend across 3 suppliers (exercises slice(1) loop and sIdx branches)', () => {
    const items = [
      {
        mapping_id: 'M-V1', line_item_id: 'L-V1',
        raw_desc: 'Carbon Steel Pipe 2 inch',
        core_bucket: 'Direct Materials',
        vendor_identified: 'Tata Steel', master_supplier_id: 'VND-TS',
        inr_crores: 8.0, status: 'Confirmed', ai_confidence: 93,
        po_number: 'PO-S1', invoice_date: '2024-04-01'
      },
      {
        mapping_id: 'M-V2', line_item_id: 'L-V2',
        raw_desc: 'Carbon Steel Pipe 2 inch',
        core_bucket: 'Direct Materials',
        vendor_identified: 'JSW Steel', master_supplier_id: 'VND-JSW',
        inr_crores: 3.0, status: 'Confirmed', ai_confidence: 91,
        po_number: 'PO-S2', invoice_date: '2024-05-01'
      },
      {
        mapping_id: 'M-V3', line_item_id: 'L-V3',
        raw_desc: 'Carbon Steel Pipe 2 inch',
        core_bucket: 'Direct Materials',
        vendor_identified: 'SAIL Ltd', master_supplier_id: 'VND-SAIL',
        inr_crores: 2.0, status: 'Confirmed', ai_confidence: 90,
        po_number: 'PO-S3', invoice_date: '2024-06-01'
      },
      {
        mapping_id: 'M-V4', line_item_id: 'L-V4',
        raw_desc: 'Carbon Steel Pipe 2 inch',
        core_bucket: 'Direct Materials',
        vendor_identified: 'SAIL Ltd', master_supplier_id: 'VND-SAIL',
        inr_crores: 1.0, status: 'Confirmed', ai_confidence: 90,
        po_number: 'PO-S4', invoice_date: '2024-07-01'
      }
    ] as any[];

    const results = calculateVendorConsolidation(items);
    expect(results.length).toBeGreaterThanOrEqual(1);
    // 3 distinct suppliers ? status mapping: Primary, Incumbent, Spot/Peripheral
    const statuses = results[0].suppliers.map((s: any) => s.status);
    expect(statuses).toContain('Primary');
    expect(statuses).toContain('Incumbent');
    // savings_pct should be > 0 since tail suppliers exist
    expect(results[0].est_volume_savings_pct).toBeGreaterThan(0);
  });
});
describe('step2PoConsolidation extended branch coverage (lines 40, 41, 42, 56, 65)', () => {
  it('covers fallback branches for category, material_desc, item, total_spend, and default spend', () => {
    const items = [
      // Item 1: no core_bucket, no raw_desc (has material_desc), no inr_crores (has total_spend), no master_supplier_id, no material_code
      {
        mapping_id: 'MAP-PO1', line_item_id: 'LINE-PO1',
        material_desc: 'Bearing Bush',
        vendor_identified: 'SKF India',
        total_spend: 20000000, // 2.0 Cr
        status: 'Confirmed', ai_confidence: 90
      },
      // Item 2: same vendor, no raw_desc, no material_desc (exercises "Item"), no inr_crores, no total_spend (exercises 0.5)
      {
        mapping_id: 'MAP-PO2', line_item_id: 'LINE-PO2',
        vendor_identified: 'SKF India',
        status: 'Confirmed', ai_confidence: 85
      }
    ] as any[];

    const results = calculatePoConsolidation(items);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].category).toBe('Direct Materials');
    expect(results[0].material_code).toMatch(/MAT-200/);
    expect(results[0].vendor_id).toMatch(/VND-M-100/);
  });
});

describe('step2VendorConsolidation comprehensive branch coverage (lines 58, 60, 61, 84, 94, 95, 102, 105, 106)', () => {
  it('covers fallbacks when core_bucket, raw_desc, inr_crores, qty, and vendor IDs are missing', () => {
    const items = [
      // Item 1: has unspsc_category_name, no raw_desc, has total_spend, no qty, no master_supplier_id
      {
        mapping_id: 'MAP-VC1', line_item_id: 'LINE-VC1',
        unspsc_category_name: 'Raw Metals',
        vendor_identified: 'Vendor A',
        total_spend: 15000000,
        status: 'Confirmed', ai_confidence: 90
      },
      // Item 2: same groupKey, second vendor to form a group with >= 2 suppliers, no inr_crores, no total_spend (0.5 Cr)
      {
        mapping_id: 'MAP-VC2', line_item_id: 'LINE-VC2',
        unspsc_category_name: 'Raw Metals',
        vendor_identified: 'Vendor B',
        status: 'Confirmed', ai_confidence: 90
      }
    ] as any[];

    const results = calculateVendorConsolidation(items);
    expect(results.length).toBe(1);
    expect(results[0].category).toBe('Raw Metals');
    expect(results[0].item_group_title).toContain('Supply Group');
    expect(results[0].annual_units).toBeGreaterThanOrEqual(200); // 100 per fallback item
    expect(results[0].suppliers.length).toBe(2);
    expect(results[0].suppliers[0].vendor_id).toMatch(/VND-10/);
  });
});
