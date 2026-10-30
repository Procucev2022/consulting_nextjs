import * as XLSX from 'xlsx';
import { describe, expect, it } from 'vitest';
import { MODULE2_D1_EAUCTION } from '../../src/constants/module2D1Scoped';
import { buildEAuctionResult } from '../../src/services/workerD1EAuction';
import { buildEAuctionWorkbook } from '../../src/services/workerD1EAuctionWorkbook';
import type { StrategicInputTransaction } from '../../src/types/strategicSourcing';

const rows: StrategicInputTransaction[] = [
  { id: 'T1', po_number: 'PO-1', po_date: '2025-04-01', vendor_code: 'S1', vendor_name: 'Supplier 1',
    material_code: 'M1', material_desc: 'Resin', quantity: 10, uom: 'KG', unit_price: 10,
    total_spend_inr: 500000, spend_category: 'Resin' },
  { id: 'T2', po_number: 'PO-2', po_date: '2025-05-01', vendor_code: 'S2', vendor_name: 'Supplier 2',
    material_code: 'M1', material_desc: 'Resin', quantity: 10, uom: 'KG', unit_price: 11,
    total_spend_inr: 400000, spend_category: 'Resin' },
  { id: 'T3', po_number: 'PO-3', po_date: '2025-06-01', vendor_code: 'S1', vendor_name: 'Supplier 1',
    material_code: 'M1', material_desc: 'Resin', quantity: 10, uom: 'KG', unit_price: 12,
    total_spend_inr: 300000, spend_category: 'Resin' }
];

describe('buildEAuctionWorkbook', () => {
  it('exports assessment evidence, limitations, and planning assumptions in the workbook', () => {
    const result = { ...buildEAuctionResult('A-1', rows), planningAssumptions: [
      { id: 'A-1', categoryOrMaterial: 'Packaging', minSavingsRate: 0.03, expectedSavingsRate: 0.055,
        maxSavingsRate: 0.09, rateSource: 'Auction index', referencePeriod: 'FY2024-FY2025',
        applicability: 'Standard packaging', approvalStatus: 'PENDING_APPROVAL' as const,
        confidence: 'MEDIUM' as const, isPlanningAssumptionOnly: true, notes: 'Review before use.' },
      { id: 'A-2', categoryOrMaterial: 'Chemicals', minSavingsRate: 0.01, expectedSavingsRate: 0.02,
        maxSavingsRate: 0.03, rateSource: 'Chemical index', referencePeriod: 'FY2025-FY2026',
        applicability: 'Bulk chemicals', approvalStatus: 'APPROVED' as const,
        approvedBy: 'Admin', approvedDate: '2026-10-30T00:00:00.000Z', confidence: 'HIGH' as const,
        isPlanningAssumptionOnly: true }
    ] };
    const bytes = buildEAuctionWorkbook(result);
    const workbook = XLSX.read(bytes, { type: 'array' });

    expect(workbook.SheetNames).toEqual(MODULE2_D1_EAUCTION.EXPORT.SHEETS);
    expect(XLSX.utils.sheet_to_json(workbook.Sheets.Summary)).toContainEqual({
      metric: 'commerciallyValidatedSavingsInr', value: 0
    });
    expect(XLSX.utils.sheet_to_json(workbook.Sheets.Materials)).toContainEqual(expect.objectContaining({
      materialCode: 'M1', historicalSpendInr: 1200000, suitability: 'Candidate for Review'
    }));
    expect(XLSX.utils.sheet_to_json(workbook.Sheets.Limitations)).toHaveLength(4);
    expect(XLSX.utils.sheet_to_json(workbook.Sheets['Planning Assumptions'])).toContainEqual(expect.objectContaining({
      categoryOrMaterial: 'Packaging', minSavingsRatePct: 3, expectedSavingsRatePct: 5.5,
      approvalStatus: 'PENDING_APPROVAL', approvedBy: '', notes: 'Review before use.'
    }));
    expect(XLSX.utils.sheet_to_json(workbook.Sheets['Planning Assumptions'])).toContainEqual(expect.objectContaining({
      categoryOrMaterial: 'Chemicals', approvedBy: 'Admin', notes: ''
    }));
  });

  it('retains all named worksheets for assessments without rows', () => {
    const workbook = XLSX.read(buildEAuctionWorkbook(buildEAuctionResult('EMPTY', [])), { type: 'array' });

    expect(workbook.SheetNames).toEqual(MODULE2_D1_EAUCTION.EXPORT.SHEETS);
    expect(XLSX.utils.sheet_to_json(workbook.Sheets.Categories)).toEqual([]);
    expect(XLSX.utils.sheet_to_json(workbook.Sheets.Materials)).toEqual([]);
    expect(XLSX.utils.sheet_to_json(workbook.Sheets['Planning Assumptions'])).toEqual([]);
  });
});
