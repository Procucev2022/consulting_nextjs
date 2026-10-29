import * as XLSX from 'xlsx';
import { describe, expect, it } from 'vitest';
import { MODULE2_D1_VOLUME_EXPORT } from '../../src/constants/module2D1Scoped';
import { buildVolumeAggregationResult } from '../../src/services/workerD1VolumeAggregation';
import { buildVolumeAggregationWorkbook } from '../../src/services/workerD1VolumeAggregationWorkbook';
import type { StrategicInputTransaction } from '../../src/types/strategicSourcing';

const transaction = (overrides: Partial<StrategicInputTransaction> = {}): StrategicInputTransaction => ({
  id: 'TX-1', vendor_name: 'Supplier A', material_code: 'MAT-1', material_desc: 'Resin Grade A',
  quantity: 10, uom: 'KG', unit_price: 100, total_spend_inr: 1000, po_date: '2026-01-10',
  plant: 'PLANT-1', spend_category: 'Resin', ...overrides
});

const readWorkbook = (bytes: Uint8Array): XLSX.WorkBook => XLSX.read(bytes, { type: 'array' });

describe('buildVolumeAggregationWorkbook', () => {
  it('exports four named worksheets with the assessment-backed result rows', () => {
    const result = buildVolumeAggregationResult('ASSESSMENT-1', [
      transaction(),
      transaction({ id: 'TX-2', plant: 'PLANT-2', po_date: '2026-02-10', quantity: 20, total_spend_inr: 3000 })
    ]);
    const workbook = readWorkbook(buildVolumeAggregationWorkbook(result));

    expect(workbook.SheetNames).toEqual(MODULE2_D1_VOLUME_EXPORT.SHEETS);
    expect(XLSX.utils.sheet_to_json(workbook.Sheets.Coverage)).toContainEqual({
      Metric: 'totalTransactionsCount', Value: 2
    });
    expect(XLSX.utils.sheet_to_json(workbook.Sheets['Tier 1 Opportunities'])).toContainEqual(
      expect.objectContaining({ materialCode: 'MAT-1', transactionCount: 2, historicalSpendInr: 4000 })
    );
    expect(XLSX.utils.sheet_to_json(workbook.Sheets.Plants)).toHaveLength(2);
    expect(XLSX.utils.sheet_to_json(workbook.Sheets.Materials)).toContainEqual(
      expect.objectContaining({ materialCode: 'MAT-1', uom: 'KG', historicalSpendInr: 4000 })
    );
  });

  it('retains empty data sheets when an assessment has no transactions', () => {
    const result = buildVolumeAggregationResult('EMPTY', []);
    const workbook = readWorkbook(buildVolumeAggregationWorkbook(result));

    expect(workbook.SheetNames).toEqual(MODULE2_D1_VOLUME_EXPORT.SHEETS);
    expect(XLSX.utils.sheet_to_json(workbook.Sheets['Tier 1 Opportunities'])).toEqual([]);
    expect(XLSX.utils.sheet_to_json(workbook.Sheets.Plants)).toEqual([]);
    expect(XLSX.utils.sheet_to_json(workbook.Sheets.Materials)).toEqual([]);
  });
});
