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
      line_id: 'L1',
      raw_desc: 'Precision Ball Bearings 6204',
      core_bucket: 'Direct Materials',
      total_spend: 25000000,
      inr_crores: 2.5,
      vendor_identified: 'SKF India',
      master_supplier_id: 'VND-001',
      qty: 5000,
      po_number: 'PO-1001'
    },
    {
      line_id: 'L2',
      raw_desc: 'Precision Ball Bearings 6204',
      core_bucket: 'Direct Materials',
      total_spend: 35000000,
      inr_crores: 3.5,
      vendor_identified: 'FAG Bearings',
      master_supplier_id: 'VND-002',
      qty: 7000,
      po_number: 'PO-1002'
    },
    {
      line_id: 'L3',
      raw_desc: 'Precision Ball Bearings 6204',
      core_bucket: 'Direct Materials',
      total_spend: 15000000,
      inr_crores: 1.5,
      vendor_identified: 'Timken',
      master_supplier_id: 'VND-003',
      qty: 3000,
      po_number: 'PO-1003'
    },
    {
      line_id: 'L4',
      raw_desc: 'Hydraulic Cylinder Seals',
      core_bucket: 'MRO',
      total_spend: 10000000,
      inr_crores: 1.0,
      vendor_identified: 'SealCo',
      qty: 1000
    }
  ];

  it('returns empty array when given empty line items', () => {
    expect(calculateVendorConsolidation([])).toEqual([]);
    expect(calculateVendorConsolidation(undefined as unknown as LineItemMapping[])).toEqual([]);
  });

  it('calculates vendor consolidation groups with >= 2 suppliers', () => {
    const results = calculateVendorConsolidation(sampleItems);
    expect(results.length).toBe(1); // Only bearings has >= 2 vendors
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
      line_id: 'P1',
      raw_desc: 'Steel Fasteners M10',
      core_bucket: 'Direct Materials',
      total_spend: 40000000,
      inr_crores: 4.0,
      vendor_identified: 'Sundaram Fasteners',
      master_supplier_id: 'VND-SF-1',
      material_code: 'MAT-100',
      po_number: 'PO-2001'
    },
    {
      line_id: 'P2',
      raw_desc: 'Steel Fasteners M10',
      core_bucket: 'Direct Materials',
      total_spend: 20000000,
      inr_crores: 2.0,
      vendor_identified: 'Sundaram Fasteners',
      master_supplier_id: 'VND-SF-1',
      material_code: 'MAT-100',
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
});
