/**
 * Unit Tests for Module 2 — Lever 1: Direct Price Improvement
 * Strict >= 90% per-file code coverage across statements, branches, functions, lines
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import {
  DIRECT_PRICE_CONFIG,
  DIRECT_PRICE_WARNINGS,
  DIRECT_PRICE_EXCLUSION_REASONS
} from '../../src/constants/module2DirectPriceImprovement';
import {
  parseIndianFinancialYear,
  classifyItemQualification,
  buildSupplierComparisons,
  buildPlantComparisons,
  computeGroupTotals,
  mapDirectPriceTransactionRecords
} from '../../src/services/module2DirectPriceImprovementHelpers';
import {
  Module2DirectPriceImprovementEngine
} from '../../src/services/module2DirectPriceImprovementEngine';
import {
  getDirectPriceImprovement
} from '../../src/controllers/module2DirectPriceImprovement.controller';
import { Module2CanonicalService } from '../../src/services/module2CanonicalService';
import type { StrategicInputTransaction } from '../../src/types/strategicSourcing';
import type { Module2CanonicalInput } from '../../src/types/module2Canonical';

describe('Module 2 — Lever 1 Constants', () => {
  it('exposes expected configuration constants', () => {
    expect(DIRECT_PRICE_CONFIG.ENGINE_NAME).toBe('LEVER_1_DIRECT_PRICE_IMPROVEMENT_ENGINE');
    expect(DIRECT_PRICE_CONFIG.SPEC_MISMATCH_PRICE_RATIO_THRESHOLD).toBe(3.0);
    expect(DIRECT_PRICE_WARNINGS.VOLATILE_COMMODITY_UOM).toContain('discrete unit');
    expect(DIRECT_PRICE_EXCLUSION_REASONS.DUPLICATE_TRANSACTION).toBe('DUPLICATE_TRANSACTION');
  });
});

describe('Module 2 — Lever 1 Helpers', () => {
  it('parses Indian Financial Years accurately', () => {
    expect(parseIndianFinancialYear('2023-05-15')).toBe('FY2023-24');
    expect(parseIndianFinancialYear('2023-01-20')).toBe('FY2022-23');
    expect(parseIndianFinancialYear('2024-03-31')).toBe('FY2023-24');
    expect(parseIndianFinancialYear('2024-04-01')).toBe('FY2024-25');
    expect(parseIndianFinancialYear('invalid-date')).toBe('UNKNOWN_FY');
    expect(parseIndianFinancialYear('')).toBe('UNKNOWN_FY');
    expect(parseIndianFinancialYear(undefined)).toBe('UNKNOWN_FY');
  });

  it('classifies item qualification accurately across all branches', () => {
    // 1. Coal with EA unit
    const coalEa = classifyItemQualification('STEAM COAL', 'Fuel', 'EA', 100, 150, 2, 2);
    expect(coalEa.status).toBe('VOLATILE_COMMODITY');
    expect(coalEa.warnings[0]).toBe(DIRECT_PRICE_WARNINGS.VOLATILE_COMMODITY_UOM);

    // 1b. Coal by category with NO unit
    const coalNo = classifyItemQualification('MINED FUEL', 'THERMAL COAL', 'NO', 100, 150, 2, 2);
    expect(coalNo.status).toBe('VOLATILE_COMMODITY');
    expect(coalNo.warnings[0]).toBe(DIRECT_PRICE_WARNINGS.VOLATILE_COMMODITY_UOM);

    // 1c. Coal by category with PCS unit
    const coalPcs = classifyItemQualification('MINED FUEL', 'IMPORTED COAL', 'PCS', 100, 150, 2, 2);
    expect(coalPcs.status).toBe('VOLATILE_COMMODITY');
    expect(coalPcs.warnings[0]).toBe(DIRECT_PRICE_WARNINGS.VOLATILE_COMMODITY_UOM);

    // 2. Coal with MT unit
    const coalMt = classifyItemQualification('INDONESIAN COAL', 'Fuel', 'MT', 100, 150, 2, 2);
    expect(coalMt.status).toBe('VOLATILE_COMMODITY');
    expect(coalMt.warnings[0]).toBe(DIRECT_PRICE_WARNINGS.VOLATILE_COMMODITY_GRADE);

    // 3. Spec mismatch on complex parts (>3.0x ratio)
    const specMismatch = classifyItemQualification('SCRAPPER BLADE', 'Spare Parts', 'PCS', 100, 350, 2, 2);
    expect(specMismatch.status).toBe('SPEC_MISMATCH');
    expect(specMismatch.warnings[0]).toBe(DIRECT_PRICE_WARNINGS.SPEC_MISMATCH);

    // 3b. Complex part with normal ratio <= 3.0x (should qualify if other checks pass)
    const complexNormalRatio = classifyItemQualification('CONTROL VALVE 2 INCH', 'Valves', 'PCS', 100, 120, 2, 2);
    expect(complexNormalRatio.status).toBe('QUALIFIED');

    // 3c. Complex part with zero lowest price
    const complexZeroPrice = classifyItemQualification('ADAPTER FLANGE', 'Piping', 'PCS', 0, 100, 2, 2);
    expect(complexZeroPrice.status).toBe('QUALIFIED');

    // 4. Single supplier
    const singleSup = classifyItemQualification('STANDARD BEARING', 'Mechanical', 'PCS', 100, 120, 1, 2);
    expect(singleSup.status).toBe('SINGLE_SUPPLIER');
    expect(singleSup.warnings[0]).toBe(DIRECT_PRICE_WARNINGS.SINGLE_SUPPLIER);

    // 5. Uniform pricing
    const uniform = classifyItemQualification('STANDARD BOLT', 'Hardware', 'PCS', 50, 50, 2, 1);
    expect(uniform.status).toBe('UNIFORM_PRICING');
    expect(uniform.warnings[0]).toBe(DIRECT_PRICE_WARNINGS.UNIFORM_PRICING);

    // 6. Normal qualified
    const qualified = classifyItemQualification('COTTON YARN', 'Raw Material', 'KG', 200, 240, 3, 3);
    expect(qualified.status).toBe('QUALIFIED');
    expect(qualified.warnings.length).toBe(0);
  });

  it('builds supplier price comparisons with accurate calculations', () => {
    const txs: StrategicInputTransaction[] = [
      { vendor_code: 'V01', vendor_name: 'Vendor A', quantity: 10, unit_price: 100, total_spend_inr: 1000, material_desc: 'Item' },
      { vendor_code: 'V01', vendor_name: 'Vendor A', quantity: 10, unit_price: 120, total_spend_inr: 1200, material_desc: 'Item' },
      { vendor_code: 'V02', vendor_name: 'Vendor B', quantity: 20, unit_price: 90, total_spend_inr: 1800, material_desc: 'Item' }
    ];
    const lowestPrice = 90;
    const comps = buildSupplierComparisons(txs, lowestPrice);
    expect(comps.length).toBe(2);

    // Vendor A: 20 qty, spend 2200, weighted avg 110, bench spend 20*90 = 1800, lost opp = 400
    const supA = comps.find((s) => s.supplierCode === 'V01');
    expect(supA).toBeDefined();
    expect(supA?.totalQuantity).toBe(20);
    expect(supA?.totalSpendInr).toBe(2200);
    expect(supA?.weightedAveragePrice).toBe(110);
    expect(supA?.historicalLostOpportunityInr).toBe(400);
    expect(supA?.isLowestPriceSupplier).toBe(false);

    // Vendor B: 20 qty, spend 1800, lowestPrice 90, lost opp = 0
    const supB = comps.find((s) => s.supplierCode === 'V02');
    expect(supB).toBeDefined();
    expect(supB?.historicalLostOpportunityInr).toBe(0);
    expect(supB?.isLowestPriceSupplier).toBe(true);
  });

  it('builds plant price comparisons accurately', () => {
    const txs: StrategicInputTransaction[] = [
      { plant: 'PLANT-1', quantity: 10, unit_price: 100, total_spend_inr: 1000, vendor_name: 'V', material_desc: 'M' },
      { plant: 'PLANT-2', quantity: 10, unit_price: 90, total_spend_inr: 900, vendor_name: 'V', material_desc: 'M' }
    ];
    const comps = buildPlantComparisons(txs, 90);
    expect(comps.length).toBe(2);
    expect(comps[0].plantCode).toBe('PLANT-1');
    expect(comps[0].historicalLostOpportunityInr).toBe(100);
  });

  it('computes group totals and maps transaction records', () => {
    const txs: StrategicInputTransaction[] = [
      { id: 'TX-1', po_number: 'PO-100', po_date: '2023-05-01', vendor_code: 'V1', vendor_name: 'Sup 1', plant: 'P1', quantity: 5, unit_price: 20, total_spend_inr: 100, material_desc: 'Mat' },
      { id: 'TX-2', po_number: 'PO-101', po_date: '2023-06-01', vendor_code: 'V2', vendor_name: 'Sup 2', plant: 'P1', quantity: 10, unit_price: 15, total_spend_inr: 150, material_desc: 'Mat' }
    ];
    const totals = computeGroupTotals(txs);
    expect(totals.totalQty).toBe(15);
    expect(totals.actualCost).toBe(250);
    expect(totals.suppliersSet.size).toBe(2);
    expect(totals.plantsSet.size).toBe(1);

    const records = mapDirectPriceTransactionRecords(txs, 'FY2023-24', 15, { status: 'QUALIFIED', warnings: [] });
    expect(records.length).toBe(2);
    // Highest opportunity first
    expect(records[0].poNumber).toBe('PO-100');
    expect(records[0].historicalLostOpportunityInr).toBe(25); // 5 * (20 - 15)
    expect(records[0].isBenchmarkTransaction).toBe(false);
    expect(records[1].isBenchmarkTransaction).toBe(true);
    expect(records[1].historicalLostOpportunityInr).toBe(0);
  });

  it('handles fallback defaults in computeGroupTotals and mapDirectPriceTransactionRecords', () => {
    const fallbackTxs: StrategicInputTransaction[] = [
      // 1: vendor_name only, no plant, no total_spend_inr
      { vendor_name: 'NameOnly Vendor', quantity: 2, unit_price: 50, material_desc: 'Item' },
      // 2: no vendor_code, no vendor_name, no plant, no total_spend_inr, no id, no po_number, no po_date
      { vendor_name: '', quantity: 1, unit_price: 30, material_desc: 'Item' }
    ];
    const totals = computeGroupTotals(fallbackTxs);
    expect(totals.totalQty).toBe(3);
    expect(totals.actualCost).toBe(130); // 2*50 + 1*30
    expect(totals.suppliersSet.has('NameOnly Vendor')).toBe(true);
    expect(totals.suppliersSet.has('UNKNOWN')).toBe(true);
    expect(totals.plantsSet.has('DEFAULT_PLANT')).toBe(true);

    const records = mapDirectPriceTransactionRecords(fallbackTxs, 'FY2023-24', 30, { status: 'QUALIFIED', warnings: [] });
    expect(records.length).toBe(2);
    expect(records[0].supplierName).toBe('NameOnly Vendor');
    expect(records[0].plantCode).toBe('DEFAULT_PLANT');
    expect(records[0].poNumber).toBe('N/A');
    expect(records[0].poDate).toBe('N/A');
    expect(records[1].supplierName).toBe('Unknown Supplier');
    expect(records[1].supplierCode).toBe('UNKNOWN');
  });
});

describe('Module 2 — Direct Price Improvement Engine', () => {
  const mockTransactions: StrategicInputTransaction[] = [
    // Item 1 in FY2022-23 (po_date: 2022-08-10)
    { id: 'T1', po_number: 'PO-01', po_date: '2022-08-10', material_code: 'MAT-A', material_desc: 'Cotton Fabric', spend_category: 'Raw Materials', uom: 'MTR', currency: 'INR', quantity: 100, unit_price: 50, total_spend_inr: 5000, vendor_code: 'V1', vendor_name: 'Supplier 1', plant: 'P1' },
    { id: 'T2', po_number: 'PO-02', po_date: '2022-09-15', material_code: 'MAT-A', material_desc: 'Cotton Fabric', spend_category: 'Raw Materials', uom: 'MTR', currency: 'INR', quantity: 100, unit_price: 40, total_spend_inr: 4000, vendor_code: 'V2', vendor_name: 'Supplier 2', plant: 'P1' },
    // Item 1 in FY2023-24 (po_date: 2023-05-10)
    { id: 'T3', po_number: 'PO-03', po_date: '2023-05-10', material_code: 'MAT-A', material_desc: 'Cotton Fabric', spend_category: 'Raw Materials', uom: 'MTR', currency: 'INR', quantity: 50, unit_price: 45, total_spend_inr: 2250, vendor_code: 'V1', vendor_name: 'Supplier 1', plant: 'P2' },
    // Duplicate of T3 (should be excluded)
    { id: 'T3-DUP', po_number: 'PO-03', po_date: '2023-05-10', material_code: 'MAT-A', material_desc: 'Cotton Fabric', spend_category: 'Raw Materials', uom: 'MTR', currency: 'INR', quantity: 50, unit_price: 45, total_spend_inr: 2250, vendor_code: 'V1', vendor_name: 'Supplier 1', plant: 'P2' },
    // Invalid record (zero qty)
    { id: 'T4', po_number: 'PO-04', po_date: '2023-06-10', material_code: 'MAT-B', material_desc: 'Invalid Item', spend_category: 'General', uom: 'PCS', currency: 'INR', quantity: 0, unit_price: 100, total_spend_inr: 0, vendor_code: 'V1', vendor_name: 'Supplier 1', plant: 'P1' },
    // Missing material code
    { id: 'T5', po_number: 'PO-05', po_date: '2023-07-10', material_code: '', material_desc: 'Missing Code', spend_category: 'General', uom: 'PCS', currency: 'INR', quantity: 10, unit_price: 100, total_spend_inr: 1000, vendor_code: 'V1', vendor_name: 'Supplier 1', plant: 'P1' },
    // Unknown material code
    { id: 'T6', po_number: 'PO-06', po_date: '2023-07-11', material_code: 'UNKNOWN_MAT', material_desc: 'Unknown Code', spend_category: 'General', uom: 'PCS', currency: 'INR', quantity: 10, unit_price: 100, total_spend_inr: 1000, vendor_code: 'V1', vendor_name: 'Supplier 1', plant: 'P1' },
    // Negative price
    { id: 'T7', po_number: 'PO-07', po_date: '2023-07-12', material_code: 'MAT-C', material_desc: 'Negative Price', spend_category: 'General', uom: 'PCS', currency: 'INR', quantity: 10, unit_price: -10, total_spend_inr: -100, vendor_code: 'V1', vendor_name: 'Supplier 1', plant: 'P1' }
  ];

  const mockCanonicalInput: Module2CanonicalInput = {
    datasetId: 'TEST-001',
    dataVersionId: 'v1',
    sourceFileName: 'test.xlsx',
    sourceRowCount: 8,
    validRowCount: 3,
    excludedRowCount: 5,
    anomalyRowCount: 0,
    totalValidatedSpendInr: 14500,
    totalValidatedSpendCr: 0.00145,
    transactions: mockTransactions,
    suppliersCount: 2,
    materialGroupsCount: 2,
    plantsCount: 2,
    billingMonthsCount: 12,
    period: {
      startDate: '2022-04-01',
      endDate: '2024-03-31',
      actualBillingMonths: 24,
      fiscalYear: 'FY2022-24',
      fiscalMonthCoverage: '24 Months',
      isFullFiscalYear: true,
      missingMonthsNotice: 'None'
    },
    currencyCoverage: { currenciesDetected: ['INR'], normalizedSpendInr: 14500 },
    fxNormalization: { masterVersion: '1.0', checksum: 'abc' }
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(Module2CanonicalService, 'getCanonicalInput').mockReturnValue(mockCanonicalInput);
  });

  it('calculates Direct Price Improvement across all financial years', async () => {
    const result = await Module2DirectPriceImprovementEngine.calculate('TEST-001');

    expect(result.assessmentId).toBe('TEST-001');
    expect(result.totalEligibleTransactions).toBe(3); // T1, T2, T3
    expect(result.totalIneligibleTransactions).toBe(5); // T3-DUP, T4, T5, T6, T7
    expect(result.availableFinancialYears).toContain('ALL');
    expect(result.availableFinancialYears).toContain('FY2022-23');
    expect(result.availableFinancialYears).toContain('FY2023-24');

    // Mathematical verification:
    // FY2022-23: MAT-A has 2 txs: T1 (100 @ 50) and T2 (100 @ 40).
    // Total qty = 200, lowest price = 40.
    // Benchmark cost = 200 * 40 = 8000.
    // Actual cost = 5000 + 4000 = 9000.
    // Lost opp = 9000 - 8000 = 1000.
    // Weighted avg price = 9000 / 200 = 45.
    const fy22 = result.items.find((i) => i.financialYear === 'FY2022-23');
    expect(fy22).toBeDefined();
    expect(fy22?.totalEligibleQuantity).toBe(200);
    expect(fy22?.lowestUnitPrice).toBe(40);
    expect(fy22?.weightedAveragePrice).toBe(45);
    expect(fy22?.actualPurchaseCostInr).toBe(9000);
    expect(fy22?.benchmarkCostInr).toBe(8000);
    expect(fy22?.historicalLostOpportunityInr).toBe(1000);

    // FY2023-24: MAT-A has 1 tx: T3 (50 @ 45).
    // Total qty = 50, lowest price = 45.
    // Benchmark cost = 50 * 45 = 2250.
    // Actual cost = 2250.
    // Lost opp = 0 (single tx/supplier).
    const fy23 = result.items.find((i) => i.financialYear === 'FY2023-24');
    expect(fy23).toBeDefined();
    expect(fy23?.historicalLostOpportunityInr).toBe(0);

    // Summary totals:
    expect(result.actualSpendInr).toBe(11250); // 9000 + 2250
    expect(result.benchmarkCostInr).toBe(10250); // 8000 + 2250
    expect(result.historicalLostOpportunityInr).toBe(1000);
    expect(result.commerciallyValidatedSavingsInr).toBe(0);
    expect(result.certificationNotice).toContain('NOT YET CERTIFIED');
  });

  it('filters results by specific financial year', async () => {
    const result = await Module2DirectPriceImprovementEngine.calculate('TEST-001', {
      financialYear: 'FY2022-23'
    });

    expect(result.selectedFinancialYear).toBe('FY2022-23');
    expect(result.items.length).toBe(1);
    expect(result.items[0].financialYear).toBe('FY2022-23');
    expect(result.historicalLostOpportunityInr).toBe(1000);
  });

  it('filters results by material code and category', async () => {
    const resultMat = await Module2DirectPriceImprovementEngine.calculate('TEST-001', {
      materialCode: 'MAT-A'
    });
    expect(resultMat.items.length).toBe(2);

    const resultMatMismatch = await Module2DirectPriceImprovementEngine.calculate('TEST-001', {
      materialCode: 'NON-EXISTENT'
    });
    expect(resultMatMismatch.items.length).toBe(0);

    const resultCat = await Module2DirectPriceImprovementEngine.calculate('TEST-001', {
      category: 'NonExistentCategory'
    });
    expect(resultCat.items.length).toBe(0);
  });

  it('resolves customerName for PQR Cement Ltd (AIC-2026-0003)', async () => {
    const result = await Module2DirectPriceImprovementEngine.calculate('AIC-2026-0003');
    expect(result.customerName).toBe('PQR Cement Ltd');
  });

  it('resolves customerName for ABC Textile Ltd (AIC-2026-0002)', async () => {
    const result = await Module2DirectPriceImprovementEngine.calculate('AIC-2026-0002');
    expect(result.customerName).toBe('ABC Textile Ltd');
  });

  it('distinguishes legitimate distinct PO line items and excludes genuine ingestion duplicates', async () => {
    const multiLineTransactions: StrategicInputTransaction[] = [
      // Line item 1
      {
        id: 'TX-LINE-1',
        po_number: 'PO-MULTI',
        po_line: '1',
        po_date: '2023-08-15',
        material_code: 'MAT-X',
        material_desc: 'Packaging Item',
        spend_category: 'Packaging',
        uom: 'PCS',
        currency: 'INR',
        quantity: 500,
        unit_price: 100,
        total_spend_inr: 50000,
        vendor_code: 'V1',
        vendor_name: 'Supplier 1',
        plant: 'P1'
      },
      // Line item 2: Same PO, date, vendor, mat, qty, price, spend — but distinct line item '2'!
      {
        id: 'TX-LINE-2',
        po_number: 'PO-MULTI',
        po_line: '2',
        po_date: '2023-08-15',
        material_code: 'MAT-X',
        material_desc: 'Packaging Item',
        spend_category: 'Packaging',
        uom: 'PCS',
        currency: 'INR',
        quantity: 500,
        unit_price: 100,
        total_spend_inr: 50000,
        vendor_code: 'V1',
        vendor_name: 'Supplier 1',
        plant: 'P1'
      },
      // Genuine ingestion duplicate: identical PO and line item '1' clone
      {
        id: 'TX-LINE-1-CLONE',
        po_number: 'PO-MULTI',
        po_line: '1',
        po_date: '2023-08-15',
        material_code: 'MAT-X',
        material_desc: 'Packaging Item',
        spend_category: 'Packaging',
        uom: 'PCS',
        currency: 'INR',
        quantity: 500,
        unit_price: 100,
        total_spend_inr: 50000,
        vendor_code: 'V1',
        vendor_name: 'Supplier 1',
        plant: 'P1'
      }
    ];

    vi.spyOn(Module2CanonicalService, 'getCanonicalInput').mockReturnValueOnce({
      ...mockCanonicalInput,
      transactions: multiLineTransactions
    });

    const result = await Module2DirectPriceImprovementEngine.calculate('TEST-MULTI');
    // TX-LINE-1 and TX-LINE-2 must both be ELIGIBLE (distinct line items preserved)
    expect(result.totalEligibleTransactions).toBe(2);
    // TX-LINE-1-CLONE must be INELIGIBLE (genuine repeated ingestion clone)
    expect(result.totalIneligibleTransactions).toBe(1);
    expect(result.actualSpendInr).toBe(100000); // 50000 + 50000
    expect(result.benchmarkCostInr).toBe(100000); // 1000 * 100
  });
});

describe('Module 2 — Direct Price Improvement Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let statusMock: ReturnType<typeof vi.fn>;
  let jsonMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    mockResponse = {
      status: statusMock,
      json: jsonMock
    };
  });

  it('returns 400 when assessmentId is missing', async () => {
    mockRequest = {
      headers: {},
      query: {}
    };

    await getDirectPriceImprovement(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        category: 'VALIDATION_ERROR'
      })
    );
  });

  it('returns 200 with calculation result when assessmentId and all query params are valid', async () => {
    mockRequest = {
      headers: { 'x-request-id': 'REQ-TEST-100' },
      query: {
        assessmentId: 'AIC-2026-0002',
        financialYear: 'FY2023-24',
        materialCode: 'MAT-100',
        category: 'Packaging'
      }
    };

    vi.spyOn(Module2DirectPriceImprovementEngine, 'calculate').mockResolvedValue({
      assessmentId: 'AIC-2026-0002',
      customerName: 'ABC Textile Ltd',
      availableFinancialYears: ['ALL', 'FY2023-24'],
      selectedFinancialYear: 'FY2023-24',
      totalEligibleTransactions: 100,
      totalIneligibleTransactions: 10,
      totalEligibleSpendInr: 1000000,
      totalEligibleSpendCr: 0.1,
      totalIneligibleSpendInr: 50000,
      totalIneligibleSpendCr: 0.005,
      actualSpendInr: 1000000,
      actualSpendCr: 0.1,
      benchmarkCostInr: 900000,
      benchmarkCostCr: 0.09,
      historicalLostOpportunityInr: 100000,
      historicalLostOpportunityCr: 0.01,
      commerciallyValidatedSavingsInr: 0,
      commerciallyValidatedSavingsCr: 0,
      itemsEvaluatedCount: 10,
      itemsWithOpportunityCount: 5,
      disqualifiedItemsCount: 1,
      certificationNotice: DIRECT_PRICE_CONFIG.CERTIFICATION_NOTICE,
      fySummaries: [],
      items: []
    });

    await getDirectPriceImprovement(mockRequest as Request, mockResponse as Response);

    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          assessmentId: 'AIC-2026-0002',
          customerName: 'ABC Textile Ltd'
        })
      })
    );
  });

  it('handles not found error gracefully', async () => {
    mockRequest = {
      headers: {},
      query: { assessmentId: 'NON_EXISTENT' }
    };

    vi.spyOn(Module2DirectPriceImprovementEngine, 'calculate').mockRejectedValue(
      new Error('Assessment NON_EXISTENT was not found')
    );

    await getDirectPriceImprovement(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        category: 'NOT_FOUND_ERROR'
      })
    );
  });

  it('handles general server errors gracefully with standard Error', async () => {
    mockRequest = {
      headers: {},
      query: { assessmentId: 'FAIL_TEST' }
    };

    vi.spyOn(Module2DirectPriceImprovementEngine, 'calculate').mockRejectedValue(
      new Error('Database disk error')
    );

    await getDirectPriceImprovement(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        category: 'SERVER_ERROR'
      })
    );
  });

  it('handles non-Error thrown gracefully', async () => {
    mockRequest = {
      headers: {},
      query: { assessmentId: 'FAIL_TEST_STRING' }
    };

    vi.spyOn(Module2DirectPriceImprovementEngine, 'calculate').mockRejectedValue(
      'Unknown string failure'
    );

    await getDirectPriceImprovement(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Internal calculation error',
        category: 'SERVER_ERROR'
      })
    );
  });
});
