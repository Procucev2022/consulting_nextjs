/**
 * Unit Tests for Module 2 — Lever 3: Vendor Base Consolidation
 * Strict >= 90% per-file code coverage across statements, branches, functions, lines
 */

import * as fs from 'fs';
import * as path from 'path';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import {
  VENDOR_CONSOLIDATION_CONFIG,
  CONSOLIDATION_STATUS_LABELS,
  VENDOR_CONSOLIDATION_DISCLOSURES,
  METHODOLOGY_DISCLOSURES,
  DATA_QUALITY_EXCLUSION_RULES,
  VENDOR_CONSOLIDATION_EXCEL_SHEETS
} from '../../src/constants/module2VendorConsolidation';
import {
  calculateSupplierProfiles,
  evaluateSameMaterialOpportunities
} from '../../src/services/module2VendorConsolidationHelpers';
import {
  evaluateComparableMaterialOpportunities,
  evaluateCrossPlantOpportunities
} from '../../src/services/module2VendorConsolidationOpportunitiesHelper';
import {
  determineCategoryClassification,
  evaluateCategoryStatus
} from '../../src/services/module2VendorConsolidationCategoryHelper';
import {
  Module2VendorConsolidationStrategyHelper
} from '../../src/services/module2VendorConsolidationStrategyHelper';
import {
  Module2VendorConsolidationEngine
} from '../../src/services/module2VendorConsolidationEngine';
import {
  Module2VendorConsolidationExcelBuilder
} from '../../src/services/module2VendorConsolidationExcelBuilder';
import {
  Module2ExcelExportService
} from '../../src/services/module2ExcelExportService';
import {
  getVendorConsolidation,
  exportVendorConsolidationExcel,
  updateMaterialMapping
} from '../../src/controllers/module2VendorConsolidation.controller';
import { Module2MaterialMappingRegister } from '../../src/services/module2MaterialMappingRegister';
import { evaluateActionableStatus } from '../../src/services/module2ActionableOpportunityHelper';
import { Module2CanonicalService } from '../../src/services/module2CanonicalService';
import type { StrategicInputTransaction } from '../../src/types/strategicSourcing';
import type { Module2CanonicalInput } from '../../src/types/module2Canonical';

describe('Module 2 — Lever 3 Constants', () => {
  it('exposes expected configuration constants', () => {
    expect(VENDOR_CONSOLIDATION_CONFIG.LEVER_ID).toBe(3);
    expect(VENDOR_CONSOLIDATION_CONFIG.LEVER_CODE).toBe('LEV-03');
    expect(VENDOR_CONSOLIDATION_CONFIG.LEVER_NAME).toBe('Vendor Base Consolidation');
    expect(VENDOR_CONSOLIDATION_CONFIG.MIN_SUPPLIERS_FOR_MULTI_SOURCING).toBe(2);
    expect(VENDOR_CONSOLIDATION_CONFIG.HIGH_FRAGMENTATION_SUPPLIER_COUNT).toBe(5);
    expect(VENDOR_CONSOLIDATION_CONFIG.MEDIUM_FRAGMENTATION_SUPPLIER_COUNT).toBe(3);
    expect(VENDOR_CONSOLIDATION_CONFIG.TAIL_SUPPLIER_SHARE_THRESHOLD_PCT).toBe(5);
  });

  it('exposes expected status labels and disclosures', () => {
    expect(CONSOLIDATION_STATUS_LABELS.OPPORTUNITY_IDENTIFIED).toBe('Opportunity Identified');
    expect(CONSOLIDATION_STATUS_LABELS.POTENTIAL_OPPORTUNITY).toBe(
      'Potential Opportunity — Further Validation Required'
    );
    expect(CONSOLIDATION_STATUS_LABELS.INSUFFICIENT_DATA).toBe('Insufficient Data');
    expect(CONSOLIDATION_STATUS_LABELS.NO_CLEAR_OPPORTUNITY).toBe('No Clear Opportunity Identified');
    expect(VENDOR_CONSOLIDATION_DISCLOSURES.SAVINGS_NOT_QUANTIFIABLE).toContain('Not Yet Quantifiable');
    expect(VENDOR_CONSOLIDATION_DISCLOSURES.CROSS_PLANT_CAVEAT).toContain('operating facilities');

    expect(METHODOLOGY_DISCLOSURES.length).toBeGreaterThan(0);
    expect(DATA_QUALITY_EXCLUSION_RULES.MISSING_SUPPLIER_ID).toContain('Supplier ID');
    expect(VENDOR_CONSOLIDATION_EXCEL_SHEETS.EXECUTIVE_SUMMARY).toBe('1. Executive Summary');
  });
});

describe('Module 2 — Lever 3 Category Classification & Evaluation Helper', () => {
  it('correctly classifies verified UNSPSC categories when valid 8-digit code exists and materials approved', () => {
    const mappingMap = new Map();
    mappingMap.set('MAT1', { reviewStatus: 'APPROVED' });
    const verified = determineCategoryClassification(
      'Packaging',
      [{ material_code: 'MAT1', unspsc_code: '24111507', unspsc_commodity: 'Corrugated Boxes' } as StrategicInputTransaction],
      undefined,
      mappingMap
    );
    expect(verified.classificationType).toBe('VERIFIED_UNSPSC');
    expect(verified.unspscCode).toBe('24111507');
    expect(verified.unspscCategory).toBe('Packaging');
  });

  it('marks category as PROVISIONAL_UNSPSC when underlying materials are provisional or awaiting review', () => {
    const mappingMap = new Map();
    mappingMap.set('MAT2', { reviewStatus: 'PROVISIONAL' });
    const prov = determineCategoryClassification(
      'Packaging',
      [{ material_code: 'MAT2', unspsc_code: '24111507', unspsc_commodity: 'Corrugated Boxes' } as StrategicInputTransaction],
      undefined,
      mappingMap
    );
    expect(prov.classificationType).toBe('PROVISIONAL_UNSPSC');
    expect(prov.classificationLabel).toBe('Provisional UNSPSC Category');

    const emptyMapRes = determineCategoryClassification(
      'Packaging',
      [{ material_code: '', unspsc_code: '24111507' } as StrategicInputTransaction],
      undefined,
      new Map()
    );
    expect(emptyMapRes.classificationType).toBe('PROVISIONAL_UNSPSC');

    const approvedMap = new Map();
    approvedMap.set('MAT1', { reviewStatus: 'TAXONOMY_VERIFIED' });
    const verifiedRes = determineCategoryClassification(
      'Packaging',
      [{ material_code: 'MAT1', unspsc_code: '24111507' } as StrategicInputTransaction],
      undefined,
      approvedMap
    );
    expect(verifiedRes.classificationType).toBe('VERIFIED_UNSPSC');
  });

  it('correctly classifies source spend categories when code is 00000000 or unmapped', () => {
    const sourceCat = determineCategoryClassification('ELECTRICAL', [
      { unspsc_code: '00000000' } as StrategicInputTransaction
    ]);
    expect(sourceCat.classificationType).toBe('SOURCE_SPEND_CATEGORY');
    expect(sourceCat.unspscCode).toBe('00000000');
    expect(sourceCat.unspscCategory).toBe('ELECTRICAL');
  });

  it('correctly marks general or unclassified as UNMAPPED', () => {
    const unmapped = determineCategoryClassification('General', [
      { unspsc_code: '' } as StrategicInputTransaction
    ]);
    expect(unmapped.classificationType).toBe('UNMAPPED');
  });

  it('evaluates category opportunity status across multiple branches', () => {
    const identified = evaluateCategoryStatus(2, 3, 0, 4);
    expect(identified.status).toBe('Opportunity Identified');
    expect(identified.candidateStatus).toBe('IDENTIFIED');

    const potentialSuppliers = evaluateCategoryStatus(0, 2, 0, 1);
    expect(potentialSuppliers.status).toBe('Potential Opportunity — Further Validation Required');
    expect(potentialSuppliers.candidateStatus).toBe('NOT_APPLICABLE');

    const potentialComp = evaluateCategoryStatus(0, 1, 1, 1);
    expect(potentialComp.status).toBe('Potential Opportunity — Further Validation Required');
    expect(potentialComp.candidateStatus).toBe('NOT_APPLICABLE');

    const noOpp = evaluateCategoryStatus(0, 1, 0, 1);
    expect(noOpp.status).toBe('No Clear Opportunity Identified');
    expect(noOpp.candidateStatus).toBe('NOT_APPLICABLE');
  });
});

describe('Module 2 — Lever 3 Helpers & Opportunities', () => {
  const sampleTxs: StrategicInputTransaction[] = [
    {
      po_number: 'PO-001',
      po_line: '1',
      po_date: '2023-05-10',
      vendor_code: 'V001',
      vendor_name: 'Alpha Supplies',
      material_code: 'MAT-BOX-01',
      material_desc: 'Corrugated Box 10x10',
      spend_category: 'Packaging',
      unspsc_code: '24111507',
      unspsc_category: 'Corrugated Boxes',
      plant: 'PLANT-A',
      quantity: 1000,
      uom: 'EA',
      unit_price: 25.0,
      currency: 'INR',
      total_spend_inr: 25000.0
    },
    {
      po_number: 'PO-002',
      po_line: '1',
      po_date: '2023-06-15',
      vendor_code: 'V002',
      vendor_name: 'Beta Packaging',
      material_code: 'MAT-BOX-01',
      material_desc: 'Corrugated Box 10x10',
      spend_category: 'Packaging',
      unspsc_code: '24111507',
      unspsc_category: 'Corrugated Boxes',
      plant: 'PLANT-B',
      quantity: 1500,
      uom: 'EA',
      unit_price: 30.0,
      currency: 'INR',
      total_spend_inr: 45000.0
    },
    {
      po_number: 'PO-003',
      po_line: '1',
      po_date: '2023-07-20',
      vendor_code: 'V003',
      vendor_name: 'Gamma Containers',
      material_code: 'MAT-BOX-02',
      material_desc: 'Heavy Box 20x20',
      spend_category: 'Packaging',
      unspsc_code: '24111507',
      unspsc_category: 'Corrugated Boxes',
      plant: 'PLANT-A',
      quantity: 500,
      uom: 'EA',
      unit_price: 50.0,
      currency: 'INR',
      total_spend_inr: 25000.0
    }
  ];

  it('calculates supplier profiles with concentration and fragmentation metrics', () => {
    const totalSpend = 95000;
    const res = calculateSupplierProfiles(sampleTxs, totalSpend);

    expect(res.suppliers.length).toBe(3);
    expect(res.suppliers[0].vendorCode).toBe('V002');
    expect(res.suppliers[0].spendInr).toBe(45000);
    expect(res.top1SharePct).toBeCloseTo(47.4, 1);
    expect(res.top3SharePct).toBe(100);
    expect(res.fragmentation).toBe('MEDIUM');
    expect(res.hhiIndex).toBeGreaterThan(0);
  });

  it('evaluates high and low fragmentation levels properly', () => {
    // High fragmentation: >= 5 suppliers and top 1 < 50%
    const manyTxs: StrategicInputTransaction[] = [
      { vendor_code: 'V1', total_spend_inr: 20, quantity: 1, uom: 'EA', currency: 'INR' },
      { vendor_code: 'V2', total_spend_inr: 20, quantity: 1, uom: 'EA', currency: 'INR' },
      { vendor_code: 'V3', total_spend_inr: 20, quantity: 1, uom: 'EA', currency: 'INR' },
      { vendor_code: 'V4', total_spend_inr: 20, quantity: 1, uom: 'EA', currency: 'INR' },
      { vendor_code: 'V5', total_spend_inr: 20, quantity: 1, uom: 'EA', currency: 'INR' }
    ];
    const highRes = calculateSupplierProfiles(manyTxs, 100);
    expect(highRes.fragmentation).toBe('HIGH');

    // Low fragmentation: < 3 suppliers
    const lowTxs: StrategicInputTransaction[] = [
      { vendor_code: 'V1', total_spend_inr: 90, quantity: 1, uom: 'EA', currency: 'INR' },
      { vendor_code: 'V2', total_spend_inr: 10, quantity: 1, uom: 'EA', currency: 'INR' }
    ];
    const lowRes = calculateSupplierProfiles(lowTxs, 100);
    expect(lowRes.fragmentation).toBe('LOW');
  });

  it('evaluates same-material consolidation opportunities correctly', () => {
    const opps = evaluateSameMaterialOpportunities(sampleTxs, 'Packaging', '24111507', 'Corrugated Boxes');
    expect(opps.length).toBe(1);
    expect(opps[0].materialCode).toBe('MAT-BOX-01');
    expect(opps[0].supplierCount).toBe(2);
    expect(opps[0].totalSpendInr).toBe(70000);
    expect(opps[0].lowestUnitPrice).toBe(25.0);
    expect(opps[0].highestUnitPrice).toBe(30.0);
    expect(opps[0].priceDispersionPct).toBeGreaterThan(0);
    expect(opps[0].status).toBe(CONSOLIDATION_STATUS_LABELS.OPPORTUNITY_IDENTIFIED);
    expect(opps[0].isComparableUomAndCurrency).toBe(true);
  });

  it('marks same-material opportunities as Potential when price dispersion is low', () => {
    const lowDispTxs: StrategicInputTransaction[] = [
      {
        vendor_code: 'V1',
        material_code: 'MAT-LOW-01',
        quantity: 100,
        uom: 'EA',
        unit_price: 100.0,
        currency: 'INR',
        total_spend_inr: 10000
      },
      {
        vendor_code: 'V2',
        material_code: 'MAT-LOW-01',
        quantity: 100,
        uom: 'EA',
        unit_price: 102.0,
        currency: 'INR',
        total_spend_inr: 10200
      }
    ];
    const opps = evaluateSameMaterialOpportunities(lowDispTxs, 'General', '10000000', 'General');
    expect(opps.length).toBe(1);
    expect(opps[0].priceDispersionPct).toBeLessThan(10);
    expect(opps[0].status).toBe(CONSOLIDATION_STATUS_LABELS.POTENTIAL_OPPORTUNITY);
  });

  it('evaluates comparable material opportunities based on keywords', () => {
    const compOpps = evaluateComparableMaterialOpportunities(sampleTxs, 'Packaging');
    expect(compOpps.length).toBe(1);
    expect(compOpps[0].relationshipLabel).toBe('Potential Comparable — Validation Required');
    expect(compOpps[0].similarityBasis).toContain('BOX');
    expect(compOpps[0].materials.length).toBe(2);
    expect(compOpps[0].status).toBe(CONSOLIDATION_STATUS_LABELS.POTENTIAL_OPPORTUNITY);
  });

  it('evaluates cross-plant consolidation opportunities', () => {
    const crossOpps = evaluateCrossPlantOpportunities(sampleTxs, 'Packaging');
    expect(crossOpps.length).toBe(1);
    expect(crossOpps[0].code).toBe('MAT-BOX-01');
    expect(crossOpps[0].distinctPlantsCount).toBe(2);
    expect(crossOpps[0].distinctSuppliersCount).toBe(2);
    expect(crossOpps[0].governanceDisclosure).toBe(VENDOR_CONSOLIDATION_DISCLOSURES.CROSS_PLANT_CAVEAT);
  });
});

describe('Module 2 — Lever 3 Strategy Helper', () => {
  it('evaluates sole supplier as not eligible', () => {
    const res = Module2VendorConsolidationStrategyHelper.evaluate(
      true,
      [{
        vendorCode: 'V1',
        vendorName: 'Sole Vendor',
        totalSpend: 100000,
        totalSpendInr: 100000,
        spendSharePct: 100,
        totalQuantity: 1000,
        weightedAveragePrice: 100,
        transactionCount: 10,
        isTailSupplier: false
      }],
      1000,
      { lowestPrice: 100, highestPrice: 100, weightedAveragePrice: 100, priceSpread: 0, dispersionRatio: 1 },
      12
    );
    expect(res.status).toBe('NOT_ELIGIBLE');
    expect(res.suitability).toBe('NOT_SUITABLE');
    expect(res.isQuantifiable).toBe(false);
  });

  it('evaluates insufficient data when dispersion is null or addressable qty is 0', () => {
    const res = Module2VendorConsolidationStrategyHelper.evaluate(
      true,
      [
        { vendorCode: 'V1', vendorName: 'V1', totalSpend: 50, totalSpendInr: 50, spendSharePct: 50, totalQuantity: 0, weightedAveragePrice: 0, transactionCount: 1, isTailSupplier: false },
        { vendorCode: 'V2', vendorName: 'V2', totalSpend: 50, totalSpendInr: 50, spendSharePct: 50, totalQuantity: 0, weightedAveragePrice: 0, transactionCount: 1, isTailSupplier: false }
      ],
      0,
      null,
      12
    );
    expect(res.status).toBe('IDENTIFIED_NOT_QUANTIFIABLE');
    expect(res.suitability).toBe('INSUFFICIENT_DATA');
  });

  it('evaluates eligible candidate with tail suppliers and admin benefits', () => {
    const suppliers = [
      { vendorCode: 'V1', vendorName: 'Core 1', totalSpend: 70000, totalSpendInr: 70000, spendSharePct: 70, totalQuantity: 700, weightedAveragePrice: 100, transactionCount: 20, isTailSupplier: false },
      { vendorCode: 'V2', vendorName: 'Core 2', totalSpend: 20000, totalSpendInr: 20000, spendSharePct: 20, totalQuantity: 200, weightedAveragePrice: 100, transactionCount: 10, isTailSupplier: false },
      { vendorCode: 'V3', vendorName: 'Tail 1', totalSpend: 10000, totalSpendInr: 10000, spendSharePct: 10, totalQuantity: 80, weightedAveragePrice: 125, transactionCount: 5, isTailSupplier: true }
    ];
    const dispersion = { lowestPrice: 100, highestPrice: 125, weightedAveragePrice: 102, priceSpread: 25, dispersionRatio: 1.25 };

    const res = Module2VendorConsolidationStrategyHelper.evaluate(
      true,
      suppliers,
      980,
      dispersion,
      12,
      500
    );

    expect(res.isQuantifiable).toBe(true);
    expect(res.status).toBe('CONSOLIDATION_CANDIDATE');
    expect(res.commercialPriceOpportunityInr).toBe(2000); // 80 * (125 - 100)
    expect(res.administrativeOpportunityInr).toBe(2500); // 5 * 500
  });
});

describe('Module 2 — Lever 3 Engine & Canonical Integration', () => {
  const dummyCanonical: Module2CanonicalInput = {
    assessmentId: 'TEST-ASSESSMENT-001',
    customerName: 'Test Corp',
    spendProfile: {
      totalSpendInr: 1000000,
      totalSpendCr: 0.1,
      totalTransactionsCount: 3,
      categoriesCount: 1,
      suppliersCount: 2,
      materialsCount: 1,
      plantsCount: 2,
      dateRange: { minDate: '2023-01-01', maxDate: '2023-12-31' },
      transactions: [
        {
          id: 'TX-101',
          po_number: 'PO-101',
          po_line: '1',
          po_date: '2023-04-10',
          vendor_code: 'SUP-01',
          vendor_name: 'Supplier One',
          material_code: 'MAT-01',
          material_desc: 'Packaging Box',
          spend_category: 'Packaging',
          unspsc_code: '24111507',
          unspsc_category: 'Corrugated Boxes',
          plant: 'PLANT-1',
          quantity: 100,
          uom: 'EA',
          unit_price: 50.0,
          currency: 'INR',
          total_spend_inr: 5000.0
        },
        {
          id: 'TX-102',
          po_number: 'PO-102',
          po_line: '1',
          po_date: '2023-05-15',
          vendor_code: 'SUP-02',
          vendor_name: 'Supplier Two',
          material_code: 'MAT-01',
          material_desc: 'Packaging Box',
          spend_category: 'Packaging',
          unspsc_code: '24111507',
          unspsc_category: 'Corrugated Boxes',
          plant: 'PLANT-2',
          quantity: 200,
          uom: 'EA',
          unit_price: 60.0,
          currency: 'INR',
          total_spend_inr: 12000.0
        },
        // Ineligible record to test data quality exclusion (missing vendor code)
        {
          id: 'TX-103',
          po_number: 'PO-103',
          po_line: '1',
          po_date: '2023-06-20',
          vendor_code: '',
          material_code: 'MAT-02',
          quantity: 10,
          unit_price: 10.0,
          total_spend_inr: 100.0
        }
      ]
    }
  };

  beforeEach(() => {
    vi.spyOn(Module2CanonicalService, 'getCanonicalInput').mockResolvedValue(dummyCanonical);
  });

  it('calculates full Lever 3 Vendor Base Consolidation metrics', async () => {
    const result = await Module2VendorConsolidationEngine.calculate('TEST-ASSESSMENT-001');

    expect(result.assessmentId).toBe('TEST-ASSESSMENT-001');
    expect(result.leverId).toBe(3);
    expect(result.leverCode).toBe('LEV-03');
    expect(result.leverName).toBe('Vendor Base Consolidation');
    expect(result.categoriesAnalysedCount).toBe(2);

    expect(result.distinctSuppliersCount).toBe(2);
    expect(result.distinctMaterialsCount).toBe(2);

    expect(result.distinctPlantsCount).toBe(2);
    expect(result.multiSourcedMaterialsCount).toBe(1);

    // Financial separation compliance
    expect(result.addressableSpendInr).toBe(17000);
    expect(result.estimatedSavingsInr).toBeNull();
    expect(result.estimatedSavingsCr).toBeNull();
    expect(result.actualSavingsCr).toBe(0);
    expect(result.validatedSavingsCr).toBe(0);
    expect(result.savingsStatus).toBe('NOT_YET_QUANTIFIABLE');
    expect(result.savingsDisclosure).toContain('Not Yet Quantifiable');

    // Data quality exclusions
    expect(result.dataQualityExclusions.length).toBeGreaterThan(0);
    const missingSupplierExclusion = result.dataQualityExclusions.find(e =>
      e.rule.includes('Supplier Identification')
    );

    expect(missingSupplierExclusion?.affectedCount).toBe(1);
  });

  it('filters by category and supplier code', async () => {
    const catFiltered = await Module2VendorConsolidationEngine.calculate('TEST-ASSESSMENT-001', {
      category: 'Packaging'
    });
    expect(catFiltered.categories.length).toBe(1);

    const supFiltered = await Module2VendorConsolidationEngine.calculate('TEST-ASSESSMENT-001', {
      supplierCode: 'SUP-01'
    });
    expect(supFiltered.categories.length).toBe(1);
    expect(supFiltered.categories[0].suppliers.some(s => s.vendorCode === 'SUP-01')).toBe(true);
  });

  it('handles empty canonical transactions gracefully', async () => {
    vi.spyOn(Module2CanonicalService, 'getCanonicalInput').mockResolvedValueOnce({
      assessmentId: 'EMPTY-001',
      spendProfile: {
        totalSpendInr: 0,
        totalSpendCr: 0,
        totalTransactionsCount: 0,
        categoriesCount: 0,
        suppliersCount: 0,
        materialsCount: 0,
        plantsCount: 0,
        dateRange: { minDate: null, maxDate: null },
        transactions: []
      }
    });

    const result = await Module2VendorConsolidationEngine.calculate('EMPTY-001');
    expect(result.categoriesAnalysedCount).toBe(0);
    expect(result.addressableSpendInr).toBe(0);
    expect(result.categories.length).toBe(0);
  });

  it('provides backward-compatible evaluate method for Module2BenefitEngine', () => {
    const evalRes = Module2VendorConsolidationEngine.evaluate(
      true,
      [{
        vendorCode: 'V1',
        vendorName: 'V1',
        totalSpend: 100,
        totalSpendInr: 100,
        spendSharePct: 100,
        totalQuantity: 1,
        weightedAveragePrice: 100,
        transactionCount: 1,
        isTailSupplier: false
      }],
      1,
      null,
      12
    );
    expect(evalRes).toBeDefined();
    expect(evalRes.status).toBe('NOT_ELIGIBLE');
  });
});

describe('Module 2 — Lever 3 Excel Export Service', () => {
  it('generates a 9-sheet Excel workbook buffer reconciling accurately', async () => {
    const calculation = await Module2VendorConsolidationEngine.calculate('TEST-ASSESSMENT-001');
    const wb = Module2VendorConsolidationExcelBuilder.buildWorkbook(calculation);
    expect(wb).toBeDefined();
    expect(wb.SheetNames.length).toBe(9);

    const serviceResult = await Module2ExcelExportService.generateVendorConsolidationWorkbookBuffer(calculation);
    expect(serviceResult.buffer).toBeDefined();
    expect(serviceResult.buffer.length).toBeGreaterThan(1000);
    expect(serviceResult.fileName).toContain('Lever_3_Vendor_Base_Consolidation_');
  });
});

describe('Module 2 — Lever 3 Controllers', () => {
  it('handles getVendorConsolidation successfully', async () => {
    const req = {
      headers: { 'x-request-id': 'REQ-001' },
      query: { assessmentId: 'TEST-ASSESSMENT-001' }
    } as unknown as Request;
    const jsonMock = vi.fn();
    const statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    const res = { json: jsonMock, status: statusMock } as unknown as Response;

    await getVendorConsolidation(req, res);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ assessmentId: 'TEST-ASSESSMENT-001' })
      })
    );
  });

  it('returns 400 when assessmentId is missing in getVendorConsolidation', async () => {
    const req = {
      headers: { 'x-request-id': 'REQ-002' },
      query: {}
    } as unknown as Request;
    const jsonMock = vi.fn();
    const statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    const res = { json: jsonMock, status: statusMock } as unknown as Response;

    await getVendorConsolidation(req, res);
    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, category: 'VALIDATION_ERROR' })
    );
  });

  it('returns 404 when assessment is not found in getVendorConsolidation', async () => {
    vi.spyOn(Module2CanonicalService, 'getCanonicalInput').mockRejectedValueOnce(
      new Error('Assessment not found')
    );
    const req = {
      headers: { 'x-request-id': 'REQ-003' },
      query: { assessmentId: 'NOT-FOUND-001' }
    } as unknown as Request;
    const jsonMock = vi.fn();
    const statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    const res = { json: jsonMock, status: statusMock } as unknown as Response;

    await getVendorConsolidation(req, res);
    expect(statusMock).toHaveBeenCalledWith(404);
  });

  it('returns 500 on unexpected errors in getVendorConsolidation', async () => {
    vi.spyOn(Module2CanonicalService, 'getCanonicalInput').mockRejectedValueOnce(
      new Error('Database connectivity exploded')
    );
    const req = {
      headers: { 'x-request-id': 'REQ-004' },
      query: { assessmentId: 'ERROR-001' }
    } as unknown as Request;
    const jsonMock = vi.fn();
    const statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    const res = { json: jsonMock, status: statusMock } as unknown as Response;

    await getVendorConsolidation(req, res);
    expect(statusMock).toHaveBeenCalledWith(500);
  });

  it('handles exportVendorConsolidationExcel successfully', async () => {
    const req = {
      headers: { 'x-request-id': 'REQ-005' },
      query: { assessmentId: 'TEST-ASSESSMENT-001' }
    } as unknown as Request;
    const setHeaderMock = vi.fn();
    const sendMock = vi.fn();
    const statusMock = vi.fn().mockReturnValue({ json: vi.fn() });
    const res = { setHeader: setHeaderMock, send: sendMock, status: statusMock } as unknown as Response;

    await exportVendorConsolidationExcel(req, res);
    expect(setHeaderMock).toHaveBeenCalledWith(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    expect(setHeaderMock).toHaveBeenCalledWith(
      'Content-Disposition',
      expect.stringContaining('attachment; filename="Lever_3_Vendor_Base_Consolidation_')
    );
    expect(sendMock).toHaveBeenCalled();
  });

  it('returns 400 when assessmentId is missing in exportVendorConsolidationExcel', async () => {
    const req = {
      headers: { 'x-request-id': 'REQ-006' },
      query: {}
    } as unknown as Request;
    const jsonMock = vi.fn();
    const statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    const res = { json: jsonMock, status: statusMock } as unknown as Response;

    await exportVendorConsolidationExcel(req, res);
    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, category: 'VALIDATION_ERROR' })
    );
  });

  it('returns 500 when exportVendorConsolidationExcel encounters an unexpected error', async () => {
    vi.spyOn(Module2CanonicalService, 'getCanonicalInput').mockRejectedValueOnce(
      new Error('Excel formatting failed')
    );
    const req = {
      headers: { 'x-request-id': 'REQ-007' },
      query: { assessmentId: 'ERROR-002' }
    } as unknown as Request;
    const jsonMock = vi.fn();
    const statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    const res = { json: jsonMock, status: statusMock } as unknown as Response;

    await exportVendorConsolidationExcel(req, res);
    expect(statusMock).toHaveBeenCalledWith(500);
  });

  it('handles updateMaterialMapping successfully', async () => {
    const req = {
      headers: { 'x-request-id': 'REQ-008' },
      body: {
        sourceMaterialId: 'MAT-REV-01',
        unspscCode: '15101505',
        reviewStatus: 'APPROVED',
        reviewedBy: 'Senior Consultant',
        auditNotes: 'Verified fuel specification match'
      }
    } as unknown as Request;
    const jsonMock = vi.fn();
    const statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    const res = { json: jsonMock, status: statusMock } as unknown as Response;

    await updateMaterialMapping(req, res);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          sourceMaterialId: 'MAT-REV-01',
          assignedUnspscCode: '15101505',
          reviewStatus: 'APPROVED'
        })
      })
    );
  });

  it('returns 400 when required fields are missing in updateMaterialMapping', async () => {
    const req = {
      headers: { 'x-request-id': 'REQ-009' },
      body: { sourceMaterialId: 'MAT-REV-01' }
    } as unknown as Request;
    const jsonMock = vi.fn();
    const statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    const res = { json: jsonMock, status: statusMock } as unknown as Response;

    await updateMaterialMapping(req, res);
    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, category: 'VALIDATION_ERROR' })
    );
  });

  it('returns 500 when updateMaterialMapping throws an error', async () => {
    vi.spyOn(Module2MaterialMappingRegister, 'updateMapping').mockImplementationOnce(() => {
      throw new Error('Disk write error');
    });
    const req = {
      headers: { 'x-request-id': 'REQ-010' },
      body: {
        sourceMaterialId: 'MAT-ERR-01',
        unspscCode: '15101505',
        reviewStatus: 'APPROVED'
      }
    } as unknown as Request;
    const jsonMock = vi.fn();
    const statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    const res = { json: jsonMock, status: statusMock } as unknown as Response;

    await updateMaterialMapping(req, res);
    expect(statusMock).toHaveBeenCalledWith(500);
  });
});

describe('Module 2 — Material UNSPSC Classification Register', () => {
  it('achieves 100% material workflow coverage across diverse materials', () => {
    const sampleTxs: StrategicInputTransaction[] = [
      {
        id: 'TX-S1',
        material_code: 'MAT-DIESEL',
        material_desc: 'High Speed Diesel HSD Fuel',
        spend_category: 'P01',
        total_spend_inr: 5000000,
        vendor_code: 'V1',
        quantity: 100,
        unit_price: 50000
      },
      {
        id: 'TX-S2',
        material_code: 'MAT-BOX',
        material_desc: 'Corrugated Box 5 Ply',
        spend_category: 'RF02',
        total_spend_inr: 200000,
        vendor_code: 'V2',
        quantity: 1000,
        unit_price: 200
      },
      {
        id: 'TX-S3',
        material_code: 'MAT-UNKNOWN',
        material_desc: 'Special Client Part XYZ-999',
        spend_category: 'STORES',
        total_spend_inr: 100000,
        vendor_code: 'V3',
        quantity: 5,
        unit_price: 20000
      }
    ];

    const { register, coverage, exceptions } = Module2MaterialMappingRegister.classifyMaterials(sampleTxs);
    expect(register.length).toBe(3);
    expect(coverage.totalMaterialsCount).toBe(3);
    expect(coverage.workflowCoveragePct).toBe(100.0);
    expect(coverage.totalSpendInr).toBe(5300000);
    expect(exceptions.length).toBe(1);
    expect(exceptions[0].sourceMaterialId).toBe('MAT-UNKNOWN');
    expect(exceptions[0].reviewStatus).toBe('AWAITING_REVIEW');
  });

  it('updates material mapping and persists in register', () => {
    const updated = Module2MaterialMappingRegister.updateMapping({
      sourceMaterialId: 'MAT-PERSIST-TEST',
      unspscCode: '24121502',
      reviewStatus: 'APPROVED',
      reviewedBy: 'Lead Consultant',
      auditNotes: 'Manually verified as Corrugated Box'
    });

    expect(updated.sourceMaterialId).toBe('MAT-PERSIST-TEST');
    expect(updated.assignedUnspscCode).toBe('24121502');
    expect(updated.reviewStatus).toBe('APPROVED');
    expect(updated.reviewedBy).toBe('Lead Consultant');
  });

  it('updates material mapping with CLIENT_APPROVED and uses it in classification', () => {
    Module2MaterialMappingRegister.updateMapping({
      sourceMaterialId: 'MAT-CLIENT-APP',
      unspscCode: '24112502',
      reviewStatus: 'CLIENT_APPROVED',
      reviewedBy: 'Client Approver',
      auditNotes: 'Documented client sign-off'
    });

    const txs: StrategicInputTransaction[] = [
      {
        id: 'TX-CA1',
        material_code: 'MAT-CLIENT-APP',
        material_desc: 'Custom Packaging Box',
        total_spend_inr: 500000,
        vendor_code: 'V-CA'
      }
    ];

    const { register, coverage } = Module2MaterialMappingRegister.classifyMaterials(txs);
    expect(register[0].reviewStatus).toBe('CLIENT_APPROVED');
    expect(coverage.clientApprovedCount).toBe(1);
    expect(coverage.clientApprovedSpendInr).toBe(500000);
  });

  it('correctly maps un-coded transactions using transaction ID fallback if description is also empty', () => {
    const txs: StrategicInputTransaction[] = [
      {
        id: 'TX-FALLBACK-1',
        material_code: '',
        material_desc: '',
        total_spend_inr: 25000,
        vendor_code: 'V-EMPTY'
      },
      {
        material_code: '',
        material_desc: '',
        total_spend_inr: 10000
      }
    ];
    const { register } = Module2MaterialMappingRegister.classifyMaterials(txs);
    expect(register[0].sourceMaterialId).toBe('TX_TX-FALLBACK-1');
    expect(register[1].sourceMaterialId).toBe('TX_UNKNOWN');
  });

  it('covers branches for persisted APPROVED status, vendor name fallback, category fallback, and empty transactions', () => {
    Module2MaterialMappingRegister.updateMapping({
      sourceMaterialId: 'MAT-TAX-APP',
      unspscCode: '15101505',
      reviewStatus: 'APPROVED',
      reviewedBy: 'Auditor',
      auditNotes: 'Verified standard'
    });

    const txs: StrategicInputTransaction[] = [
      {
        id: 'TX-B1',
        material_code: 'MAT-TAX-APP',
        total_spend_inr: 200000,
        vendor_name: 'Vendor Name Only'
      },
      {
        id: 'TX-B2',
        material_code: 'MAT-UNSPSC-RAW',
        total_spend_inr: 100000,
        unspsc_code: '15101505',
        unspsc_category: 'Fuels'
      },
      {
        id: 'TX-B3',
        material_code: 'MAT-UNSPSC-NO-DESC',
        total_spend_inr: 50000,
        unspsc_code: '15101505'
      }
    ];

    const { register, coverage } = Module2MaterialMappingRegister.classifyMaterials(txs);
    expect(register.find(r => r.sourceMaterialId === 'MAT-TAX-APP')?.reviewStatus).toBe('TAXONOMY_VERIFIED');
    expect(register.find(r => r.sourceMaterialId === 'MAT-UNSPSC-RAW')?.assignedUnspscTitle).toBe('Fuels');
    expect(register.find(r => r.sourceMaterialId === 'MAT-UNSPSC-NO-DESC')?.assignedUnspscTitle).toBe('UNSPSC Commodity (15101505)');
    expect(coverage.totalMaterialsCount).toBe(3);

    // Empty txs branch
    const emptyResult = Module2MaterialMappingRegister.classifyMaterials([]);
    expect(emptyResult.coverage.totalMaterialsCount).toBe(0);
    expect(emptyResult.coverage.workflowCoveragePct).toBe(0);
  });

  it('recovers gracefully when disk persistence file is corrupted or unwriteable', () => {
    const filePath = path.resolve(process.cwd(), 'data', 'material_mapping_register.json');
    const backup = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : null;

    try {
      // 1. Corrupt json triggers line 55-56 catch
      fs.writeFileSync(filePath, '{ INVALID JSON CORRUPTED', 'utf-8');
      (Module2MaterialMappingRegister as any).isInitialized = false;
      expect(() => Module2MaterialMappingRegister.initialize()).not.toThrow();

      // 2. Make directory triggers line 67-68 catch
      fs.unlinkSync(filePath);
      fs.mkdirSync(filePath); // now it is a directory, writeFileSync will throw
      expect(() => Module2MaterialMappingRegister.persistStore()).not.toThrow();
      fs.rmdirSync(filePath);
    } finally {
      if (backup !== null) {
        fs.writeFileSync(filePath, backup, 'utf-8');
      } else if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      (Module2MaterialMappingRegister as any).isInitialized = false;
      Module2MaterialMappingRegister.initialize();
    }
  });
});

describe('Module 2 — Actionable Opportunity Status Evaluation', () => {
  it('returns Further Data Required when materials are not comparable', () => {
    const res = evaluateActionableStatus(20, 2, 2, false, 'APPROVED');
    expect(res.actionableStatus).toBe('Further Data Required');
    expect(res.qualificationCriteria).toContain('Inconsistent UOM');
  });

  it('returns Candidate for Review when mapping status is AWAITING_REVIEW', () => {
    const res = evaluateActionableStatus(20, 2, 2, true, 'AWAITING_REVIEW');
    expect(res.actionableStatus).toBe('Candidate for Review');
    expect(res.qualificationCriteria).toContain('pending engineering UNSPSC mapping');
  });

  it('returns Technical Validation Required when price dispersion is high', () => {
    const res = evaluateActionableStatus(18, 3, 1, true, 'APPROVED');
    expect(res.actionableStatus).toBe('Technical Validation Required');
    expect(res.qualificationCriteria).toContain('18% price variance');
  });

  it('returns Supplier/Commercial Validation Required for cross-plant items', () => {
    const res = evaluateActionableStatus(8, 2, 3, true, 'APPROVED');
    expect(res.actionableStatus).toBe('Supplier/Commercial Validation Required');
    expect(res.qualificationCriteria).toContain('Cross-plant multi-sourced item');
  });

  it('returns Validated for Sourcing Action only when documented validation is verified', () => {
    const res = evaluateActionableStatus(5, 2, 1, true, 'APPROVED', true);
    expect(res.actionableStatus).toBe('Validated for Sourcing Action');
    expect(res.nextRecommendedAction).toContain('Initiate volume consolidation RFP');
  });

  it('retains Candidate for Review when multi-sourced but validations not yet documented', () => {
    const res = evaluateActionableStatus(5, 2, 1, true, 'APPROVED', false);
    expect(res.actionableStatus).toBe('Candidate for Review');
    expect(res.qualificationCriteria).toContain('pending validation');
  });

  it('returns Candidate for Review fallback when not meeting higher criteria', () => {
    const res = evaluateActionableStatus(0, 1, 1, true, 'PROVISIONAL');
    expect(res.actionableStatus).toBe('Candidate for Review');
    expect(res.nextRecommendedAction).toContain('Review commercial contract terms');
  });
});
