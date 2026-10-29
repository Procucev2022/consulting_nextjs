import { describe, expect, it } from 'vitest';
import { MODULE2_D1_DIRECT_PRICE } from '../../src/constants/module2D1Scoped';
import { buildDirectPriceResult } from '../../src/services/workerD1DirectPrice';
import type { StrategicInputTransaction } from '../../src/types/strategicSourcing';

const transaction = (overrides: Partial<StrategicInputTransaction> = {}): StrategicInputTransaction => ({
  id: 'TX-1', po_number: 'PO-1', po_date: '2025-04-01', vendor_code: 'SUP-1', vendor_name: 'Supplier 1',
  material_code: 'MAT-1', material_desc: 'Resin Grade A', quantity: 10, uom: 'KG', unit_price: 0,
  total_spend_inr: 100000, currency: 'USD', plant: 'P1', spend_category: 'Resin', ...overrides
});

const comparisonRows = (): StrategicInputTransaction[] => [
  transaction({ id: 'T1', po_number: 'PO-1', vendor_code: 'SUP-1', vendor_name: 'Supplier 1',
    total_spend_inr: 100000, quantity: 10 }),
  transaction({ id: 'T2', po_number: 'PO-2', vendor_code: 'SUP-2', vendor_name: 'Supplier 2',
    total_spend_inr: 200000, quantity: 10, plant: 'P2', po_date: '2025-05-01' }),
  transaction({ id: 'T3', po_number: 'PO-3', vendor_code: 'SUP-3', vendor_name: 'Supplier 3',
    total_spend_inr: 150000, quantity: 5, plant: 'P2', po_date: '2026-03-01', unspsc_code: '12345678',
    unspsc_category: 'Resins' })
];

describe('D1 direct-price historical comparisons', () => {
  it('compares exact material, unit and financial-year evidence without claiming realized savings', () => {
    const result = buildDirectPriceResult('A-1', comparisonRows(), {}, 'Customer from D1');
    const item = result.items[0];
    expect(result).toMatchObject({
      assessmentId: 'A-1', customerName: 'Customer from D1', selectedFinancialYear: 'ALL',
      totalEligibleTransactions: 3, totalIneligibleTransactions: 0, totalEligibleSpendInr: 450000,
      actualSpendInr: 450000, benchmarkCostInr: 250000, historicalLostOpportunityInr: 200000,
      commerciallyValidatedSavingsInr: 0, commerciallyValidatedSavingsCr: 0,
      itemsEvaluatedCount: 1, itemsWithOpportunityCount: 1, disqualifiedItemsCount: 0
    });
    expect(item).toMatchObject({
      qualificationStatus: 'QUALIFIED', lowestUnitPrice: 10000, weightedAveragePrice: 18000,
      highestUnitPrice: 30000, actualPurchaseCostInr: 450000, benchmarkCostInr: 250000,
      historicalLostOpportunityInr: 200000, benchmarkSupplierCode: 'SUP-1', unspscCode: '12345678',
      unspscCategory: 'Resins', supplierCount: 3, plantCount: 2
    });
    expect(item.transactions).toHaveLength(3);
    expect(item.transactions[0]).toMatchObject({
      isBenchmarkTransaction: true, benchmarkCostInr: 100000, historicalLostOpportunityInr: 0
    });
    expect(item.suppliers.find((supplier) => supplier.supplierCode === 'SUP-2'))
      .toMatchObject({ historicalLostOpportunityInr: 100000, isLowestPriceSupplier: false });
    expect(result.categorySummaries[0]).toMatchObject({
      spendCategory: 'Resin', eligibleTransactionCount: 3, eligibleSpendInr: 450000,
      historicalLostOpportunityInr: 200000, dataQualityStatus: MODULE2_D1_DIRECT_PRICE.DATA_QUALITY_COMPARABLE
    });
  });

  it('marks missing comparability, single supplier and uniform prices for review without a benchmark gap', () => {
    const rows = [
      transaction({ id: 'SINGLE', material_code: 'SINGLE', total_spend_inr: 1000 }),
      transaction({ id: 'U1', material_code: 'UNIFORM', po_number: 'U-1', total_spend_inr: 1000 }),
      transaction({ id: 'U2', material_code: 'UNIFORM', po_number: 'U-2', vendor_code: 'SUP-2',
        total_spend_inr: 1000 }),
      transaction({ id: 'MISSING', material_code: '', uom: '', total_spend_inr: 1000 }),
      transaction({ id: 'MISMATCH-1', material_code: 'MISMATCH', material_desc: 'Resin A',
        po_number: 'M-1', total_spend_inr: 1000 }),
      transaction({ id: 'MISMATCH-2', material_code: 'MISMATCH', material_desc: 'Resin B',
        po_number: 'M-2', vendor_code: 'SUP-2', total_spend_inr: 2000 }),
      transaction({ id: 'ZERO-QTY', material_code: 'ZERO-QTY', quantity: 0, total_spend_inr: 1000 })
    ];
    const result = buildDirectPriceResult('A-2', rows);
    const byCode = (code: string) => result.items.find((item) => item.materialCode === code);

    expect(byCode('SINGLE')).toMatchObject({ qualificationStatus: 'SINGLE_SUPPLIER', historicalLostOpportunityInr: 0 });
    expect(byCode('UNIFORM')).toMatchObject({ qualificationStatus: 'UNIFORM_PRICING', historicalLostOpportunityInr: 0 });
    expect(byCode(MODULE2_D1_DIRECT_PRICE.UNKNOWN_VALUE))
      .toMatchObject({ qualificationStatus: 'SPEC_MISMATCH', benchmarkSupplierName: 'Unavailable' });
    expect(byCode('MISMATCH')).toMatchObject({ qualificationStatus: 'SPEC_MISMATCH', transactionCount: 2 });
    expect(byCode('ZERO-QTY')).toMatchObject({ qualificationStatus: 'SPEC_MISMATCH', weightedAveragePrice: 0 });
    expect(result.categoriesRequiringReviewCount).toBe(1);
    expect(result.totalEligibleTransactions).toBe(0);
    expect(result.totalIneligibleSpendInr).toBe(8000);
  });

  it('filters by year, category and material while preserving observed financial-year choices', () => {
    const rows = [...comparisonRows(), transaction({ id: 'OLD', material_code: 'MAT-OLD', spend_category: 'Paper',
      po_number: 'OLD-1', po_date: '2024-03-31', total_spend_inr: 5000 })];
    const year = buildDirectPriceResult('A-3', rows, { financialYear: 'FY2025-26' });
    expect(year).toMatchObject({
      selectedFinancialYear: 'FY2025-26', actualSpendInr: 450000,
      availableFinancialYears: ['ALL', 'FY2025-26', 'FY2023-24']
    });
    const filtered = buildDirectPriceResult('A-3', rows, {
      category: 'resin', materialCode: 'mat-1'
    });
    expect(filtered.items).toHaveLength(1);
    expect(filtered.categorySummaries).toHaveLength(1);
    expect(filtered.fySummaries).toHaveLength(2);
    const noMatch = buildDirectPriceResult('A-3', rows, { category: 'missing' });
    expect(noMatch).toMatchObject({
      actualSpendInr: 0, items: [], categorySummaries: [], categoriesAnalysedCount: 0
    });
  });

  it('returns empty and unknown-date summaries with safe zero denominators and missing field fallbacks', () => {
    const empty = buildDirectPriceResult('EMPTY', []);
    expect(empty).toMatchObject({
      availableFinancialYears: ['ALL'], actualSpendInr: 0, items: [], categorySummaries: [], fySummaries: []
    });
    const unknown = buildDirectPriceResult('UNKNOWN', [transaction({
      id: '', po_number: '', po_date: 'not-a-date', vendor_code: '', vendor_name: '', plant: '',
      material_code: 'MISSING-DATA', material_desc: '', spend_category: '', uom: '',
      quantity: Infinity, total_spend_inr: -10, unspsc_code: '', unspsc_category: ''
    })]);
    expect(unknown.availableFinancialYears).toEqual(['ALL', 'UNKNOWN']);
    expect(unknown.fySummaries[0]).toMatchObject({ financialYear: 'UNKNOWN', actualSpendInr: 0 });
    expect(unknown.items[0]).toMatchObject({
      materialDesc: 'Unavailable', spendCategory: 'Unclassified — UNSPSC mapping unavailable',
      uom: 'Unavailable', transactionCount: 1, supplierCount: 0, plantCount: 0
    });
    expect(unknown.items[0].transactions[0]).toMatchObject({
      id: 'Unavailable', poNumber: 'Unavailable', supplierName: 'Unavailable', plantCode: 'Unavailable',
      quantity: 0, totalSpendInr: 0
    });
  });
});
