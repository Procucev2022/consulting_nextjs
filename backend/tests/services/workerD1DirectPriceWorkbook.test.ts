import * as XLSX from 'xlsx';
import { describe, expect, it } from 'vitest';
import { MODULE2_D1_DIRECT_PRICE } from '../../src/constants/module2D1Scoped';
import { buildDirectPriceResult } from '../../src/services/workerD1DirectPrice';
import { buildDirectPriceWorkbook } from '../../src/services/workerD1DirectPriceWorkbook';
import type { StrategicInputTransaction } from '../../src/types/strategicSourcing';

const rows: StrategicInputTransaction[] = [
  { id: 'T1', po_number: 'PO-1', po_date: '2025-04-01', vendor_code: 'S1', vendor_name: 'Supplier 1',
    material_code: 'M1', material_desc: 'Resin', quantity: 10, uom: 'KG', unit_price: 0,
    total_spend_inr: 100000, currency: 'USD', spend_category: 'Resin' },
  { id: 'T2', po_number: 'PO-2', po_date: '2025-05-01', vendor_code: 'S2', vendor_name: 'Supplier 2',
    material_code: 'M1', material_desc: 'Resin', quantity: 10, uom: 'KG', unit_price: 0,
    total_spend_inr: 200000, currency: 'INR', spend_category: 'Resin' }
];

describe('buildDirectPriceWorkbook', () => {
  it('exports historical comparison evidence with the realized savings field fixed at zero', () => {
    const result = buildDirectPriceResult('A-1', rows);
    const workbook = XLSX.read(buildDirectPriceWorkbook(result), { type: 'array' });

    expect(workbook.SheetNames).toEqual(MODULE2_D1_DIRECT_PRICE.EXPORT.SHEETS);
    expect(XLSX.utils.sheet_to_json(workbook.Sheets.Summary)).toContainEqual({
      metric: 'commerciallyValidatedSavingsInr', value: 0
    });
    expect(XLSX.utils.sheet_to_json(workbook.Sheets.Materials)).toContainEqual(expect.objectContaining({
      materialCode: 'M1', actualPurchaseCostInr: 300000, qualificationStatus: 'QUALIFIED'
    }));
    expect(XLSX.utils.sheet_to_json(workbook.Sheets.Transactions)).toHaveLength(2);
  });

  it('keeps worksheet names and empty sheets when no transaction records exist', () => {
    const workbook = XLSX.read(buildDirectPriceWorkbook(buildDirectPriceResult('EMPTY', [])), { type: 'array' });

    expect(workbook.SheetNames).toEqual(MODULE2_D1_DIRECT_PRICE.EXPORT.SHEETS);
    expect(XLSX.utils.sheet_to_json(workbook.Sheets.Materials)).toEqual([]);
    expect(XLSX.utils.sheet_to_json(workbook.Sheets.Transactions)).toEqual([]);
  });
});
