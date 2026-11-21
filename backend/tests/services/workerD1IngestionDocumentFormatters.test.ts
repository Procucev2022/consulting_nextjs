import { describe, expect, it } from 'vitest';
import {
  toCrores,
  toUsdMillions,
  toSharePct,
  formatMonthLabel,
  formatFiscalYear,
  buildMaterialGroups,
  buildPlantSummaries,
  buildMonthSummaries
} from '../../src/services/workerD1IngestionDocumentFormatters';

describe('workerD1IngestionDocumentFormatters', () => {
  it('converts values to crores correctly', () => {
    expect(toCrores(123.456)).toBe(123.46);
    expect(toCrores('50.5')).toBe(50.5);
    expect(toCrores(0)).toBe(0);
  });

  it('converts spend in crores to USD millions using fallback rate', () => {
    expect(toUsdMillions(0)).toBe(0);
    const usd = toUsdMillions(10);
    expect(usd).toBeGreaterThan(0);
  });

  it('calculates share percentages accurately', () => {
    expect(toSharePct(25, 100)).toBe(25);
    expect(toSharePct(0, 100)).toBe(0);
    expect(toSharePct(50, 0)).toBe(0);
  });

  it('formats month labels and fiscal years correctly', () => {
    expect(formatMonthLabel('2026-03')).toBe('Mar 2026');
    expect(formatMonthLabel('2026-11')).toBe('Nov 2026');
    expect(formatMonthLabel('invalid')).toBe('invalid');

    expect(formatFiscalYear('2026-03')).toBe('FY26');
    expect(formatFiscalYear('2026-04')).toBe('FY27');
    expect(formatFiscalYear('2025-12')).toBe('FY26');
  });

  it('builds material group summaries with unmapped and specified labels', () => {
    const rows = [
      {
        group_code: 'MAT-CHEM',
        spend_inr_cr: 10.5,
        unique_items_count: 5,
        unique_vendors_count: 2,
        records_count: 20,
        po_count: 8,
        sample_item: 'Reagent A',
        top_supplier: 'ChemCorp'
      },
      {
        group_code: 'UNSPECIFIED',
        spend_inr_cr: 2.0,
        unique_items_count: 1,
        unique_vendors_count: 1,
        records_count: 5,
        po_count: 2
      }
    ];

    const result = buildMaterialGroups(rows, 12.5);
    expect(result).toHaveLength(2);
    expect(result[0].group_code).toBe('MAT-CHEM');
    expect(result[0].spend_inr_cr).toBe(10.5);
    expect(result[0].sample_item).toBe('Reagent A');
    expect(result[0].top_supplier).toBe('ChemCorp');
    expect(result[1].group_name).toBe('Unspecified Material Group');
  });

  it('builds plant summaries with specified and unspecified plants', () => {
    const rows = [
      {
        plant_code: 'PLANT-01',
        spend_inr_cr: 15.0,
        po_count: 12,
        records_count: 30,
        unique_items_count: 10,
        unique_vendors_count: 4,
        top_material_group: 'Metals'
      },
      {
        plant_code: 'UNSPECIFIED',
        spend_inr_cr: 5.0,
        po_count: 3,
        records_count: 8,
        unique_items_count: 2,
        unique_vendors_count: 1
      }
    ];

    const result = buildPlantSummaries(rows, 20.0);
    expect(result).toHaveLength(2);
    expect(result[0].plant_name).toBe('PLANT-01');
    expect(result[0].top_material_group).toBe('Metals');
    expect(result[1].plant_name).toBe('Unspecified Plant');
  });

  it('builds month summaries with default segments and plant codes', () => {
    const rows = [
      {
        month_key: '2026-05',
        spend_inr_cr: 8.5,
        records_count: 18,
        po_count: 6,
        unique_items_count: 9,
        unique_vendors_count: 3,
        top_material_group: 'Direct',
        top_plant: 'P1'
      },
      {
        month_key: '2026-06',
        spend_inr_cr: 4.0,
        records_count: 7,
        po_count: 2,
        unique_items_count: 3,
        unique_vendors_count: 1
      }
    ];

    const result = buildMonthSummaries(rows);
    expect(result).toHaveLength(2);
    expect(result[0].month_label).toBe('May 2026');
    expect(result[0].top_material_group).toBe('Direct');
    expect(result[0].top_plant).toBe('P1');
    expect(result[1].top_material_group).toBe('Direct Materials');
    expect(result[1].top_plant).toBe('UNSPECIFIED');
  });
});
