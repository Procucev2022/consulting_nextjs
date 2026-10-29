import { describe, expect, it } from 'vitest';
import { MODULE2_D1_EAUCTION } from '../../src/constants/module2D1Scoped';
import { buildEAuctionResult, getEAuctionFinancialYear } from '../../src/services/workerD1EAuction';
import type { StrategicInputTransaction } from '../../src/types/strategicSourcing';

const transaction = (overrides: Partial<StrategicInputTransaction> = {}): StrategicInputTransaction => ({
  id: 'TX-1', po_number: 'PO-1', po_date: '2025-04-01', vendor_code: 'SUP-1', vendor_name: 'Supplier 1',
  material_code: 'MAT-1', material_desc: 'Resin Grade A', quantity: 10, uom: 'KG', unit_price: 100,
  total_spend_inr: 500000, currency: 'INR', plant: 'P1', spend_category: 'Resin', ...overrides
});

const candidateTransactions = (): StrategicInputTransaction[] => [
  transaction({ id: 'C1', po_number: 'PO-1', vendor_code: 'SUP-1', po_date: '2025-04-01', total_spend_inr: 500000 }),
  transaction({ id: 'C2', po_number: 'PO-2', vendor_code: 'SUP-2', po_date: '2025-05-01', total_spend_inr: 400000,
    unit_price: 125, currency: 'USD', plant: 'P2' }),
  transaction({ id: 'C3', po_number: 'PO-3', vendor_code: 'SUP-1', po_date: '2026-03-01', total_spend_inr: 300000,
    unspsc_code: '12345678', unspsc_category: 'Resins' })
];

describe('D1 e-auction candidate analysis', () => {
  it('maps dates to the Indian financial year and marks malformed dates unknown', () => {
    expect(getEAuctionFinancialYear('2025-04-01')).toBe('FY2025-26');
    expect(getEAuctionFinancialYear('2025-03-31')).toBe('FY2024-25');
    expect(getEAuctionFinancialYear('2025-13-01')).toBe(MODULE2_D1_EAUCTION.UNKNOWN_FINANCIAL_YEAR);
    expect(getEAuctionFinancialYear('2025-02-30')).toBe(MODULE2_D1_EAUCTION.UNKNOWN_FINANCIAL_YEAR);
    expect(getEAuctionFinancialYear('bad-date')).toBe(MODULE2_D1_EAUCTION.UNKNOWN_FINANCIAL_YEAR);
  });

  it('identifies comparable evidence candidates without estimating or claiming savings', () => {
    const rows = [
      ...candidateTransactions(),
      transaction({ id: 'MISSING', po_number: '', material_code: '', uom: '', total_spend_inr: 200000 }),
      transaction({ id: 'LOW', po_number: 'PO-LOW', material_code: 'MAT-LOW', total_spend_inr: 1000 }),
      transaction({ id: 'NO-PRICE', po_number: '', vendor_code: '', material_code: 'MAT-NO-PRICE',
      unit_price: 0, quantity: 0, uom: '', po_date: '2024-01-01', spend_category: '' })
    ];
    const result = buildEAuctionResult('ASSESSMENT-1', rows);
    const resin = result.categories.find((item) => item.spendCategory === 'Resin');
    const candidate = resin?.materials.find((item) => item.materialCode === 'MAT-1');
    const missing = resin?.materials.find((item) => item.materialCode === MODULE2_D1_EAUCTION.UNKNOWN_VALUE);

    expect(result).toMatchObject({
      assessmentId: 'ASSESSMENT-1', customerName: 'ASSESSMENT-1', totalSpendReviewedInr: 1901000,
      candidateCategoriesCount: 1, candidateMaterialsCount: 1, recordsRequiringDataReviewCount: 2,
      commerciallyValidatedSavingsInr: 0, commerciallyValidatedSavingsCr: 0, planningAssumptions: [],
      availableFinancialYears: ['ALL', 'FY2025-26', 'FY2023-24']
    });
    expect(candidate).toMatchObject({
      suitability: MODULE2_D1_EAUCTION.SUITABILITY.CANDIDATE,
      totalSpendInr: 1200000, addressableSpendInr: 1200000, poCount: 3, supplierCount: 2,
      plantCount: 2, unspscCode: '12345678', unspscCategory: 'Resins',
      savingsRange: { savingsRangeStatus: 'NOT_YET_QUANTIFIABLE' }
    });
    expect(candidate?.priceRangeStr).toBe(MODULE2_D1_EAUCTION.PRICE_NOT_AVAILABLE);
    expect(resin?.materials.find((item) => item.materialCode === 'MAT-LOW')?.suitability)
      .toBe(MODULE2_D1_EAUCTION.SUITABILITY.NOT_SUITABLE);
    expect(missing?.suitability).toBe(MODULE2_D1_EAUCTION.SUITABILITY.MORE_DATA);
    expect(result.categories.find((item) => item.spendCategory === 'Unclassified')?.uom)
      .toBe(MODULE2_D1_EAUCTION.UNKNOWN_VALUE);
    expect(result.summarySavingsRange.addressableSpendInr).toBe(1200000);
  });

  it('filters by financial year, category, material and suitability while retaining the available year list', () => {
    const rows = [...candidateTransactions(), transaction({ id: 'OLD', po_number: 'PO-OLD', po_date: '2024-03-30',
      material_code: 'MAT-OLD', spend_category: 'Chemicals', total_spend_inr: 200000 })];
    const fy = buildEAuctionResult('ASSESSMENT-2', rows, { financialYear: 'FY2025-26' });
    expect(fy).toMatchObject({
      selectedFinancialYear: 'FY2025-26', totalSpendReviewedInr: 1200000,
      availableFinancialYears: ['ALL', 'FY2025-26', 'FY2023-24']
    });
    expect(fy.categories.every((item) => item.spendCategory === 'Resin')).toBe(true);
    const filtered = buildEAuctionResult('ASSESSMENT-2', rows, {
      category: 'resin', materialCode: 'mat-1', suitability: MODULE2_D1_EAUCTION.SUITABILITY.CANDIDATE
    });
    expect(filtered.categories).toHaveLength(1);
    expect(filtered.categories[0].materials).toHaveLength(1);
    expect(filtered.categories[0].addressableSpendInr).toBe(1200000);
    const noMatch = buildEAuctionResult('ASSESSMENT-2', rows, {
      category: 'resin', suitability: MODULE2_D1_EAUCTION.SUITABILITY.NOT_SUITABLE
    });
    expect(noMatch.categories).toEqual([]);
    const allFilter = buildEAuctionResult('ASSESSMENT-2', rows, { suitability: 'ALL' });
    expect(allFilter.categories).toHaveLength(2);
  });

  it('returns a valid empty result and records undated rows under the unknown year', () => {
    const empty = buildEAuctionResult('EMPTY', []);
    expect(empty).toMatchObject({
      totalSpendReviewedInr: 0, totalAddressableSpendInr: 0, availableFinancialYears: ['ALL'],
      categories: [], fySummaries: [], candidateCategoriesCount: 0, candidateMaterialsCount: 0
    });
    const unknown = buildEAuctionResult('UNDATED', [transaction({
      po_date: 'not-a-date', quantity: Infinity, unit_price: 0
    })]);
    expect(unknown.availableFinancialYears).toEqual(['ALL', 'UNKNOWN']);
    expect(unknown.fySummaries).toMatchObject([{ financialYear: 'UNKNOWN', totalQuantity: 0 }]);
    expect(unknown.categories[0].materials[0]).toMatchObject({
      financialYear: 'ALL', unspscCode: '00000000',
      priceRangeStr: MODULE2_D1_EAUCTION.PRICE_NOT_AVAILABLE
    });
  });
});
