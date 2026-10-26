/**
 * Module 2 — Stage 2: Opportunity Register Branch Coverage Test Suite
 * Exercises all branches, fallbacks, search criteria, and edge-cases across:
 * - Module2OpportunityRegisterBuilder
 * - Module2OpportunityRegisterEngine
 * - Module2OpportunityRegisterController
 * Strict >= 90% per-file code coverage across statements, branches, functions, and lines.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Module2OpportunityRegisterBuilder } from '../../src/services/module2OpportunityRegisterBuilder';
import { Module2OpportunityRegisterEngine } from '../../src/services/module2OpportunityRegisterEngine';
import { Module2OpportunityRegisterController } from '../../src/controllers/module2OpportunityRegister.controller';
import { Module2CanonicalService } from '../../src/services/module2CanonicalService';
import { Module2DirectPriceImprovementEngine } from '../../src/services/module2DirectPriceImprovementEngine';
import { Module2VendorConsolidationEngine } from '../../src/services/module2VendorConsolidationEngine';
import { Module2VolumeAggregationEngine } from '../../src/services/module2VolumeAggregationEngine';
import { Module2SpecificationRationalisationEngine } from '../../src/services/module2SpecificationRationalisationEngine';
import type { DirectPriceItemOpportunity } from '../../src/types/module2DirectPriceImprovement';
import type { SameMaterialOpportunity } from '../../src/types/module2VendorConsolidation';
import type { VolumeAggregationOpportunity } from '../../src/types/module2VolumeAggregation';
import type { SpecificationCandidateItem } from '../../src/types/module2SpecificationRationalisation';
import type { Request, Response } from 'express';

describe('Module 2 — Stage 2: Comprehensive Branch Coverage', () => {
  beforeEach(() => {
    Module2OpportunityRegisterEngine.clearCache();
    vi.restoreAllMocks();
  });

  describe('Builder Branch Coverage', () => {
    it('covers DPI builder branches with low txCount, single supplier, and fallback spend/price', () => {
      const item: DirectPriceItemOpportunity = {
        itemKey: 'KEY-BRANCH',
        materialCode: 'MAT-BRANCH',
        materialDesc: 'BRANCH MATERIAL',
        spendCategory: '',
        uom: 'EA',
        currency: 'INR',
        financialYear: '2026-2027',
        transactionCount: 5, // < 10 -> MEDIUM confidence
        totalEligibleQuantity: 10,
        lowestUnitPrice: 0, // 0 fallback
        weightedAveragePrice: 0, // 0 fallback
        highestUnitPrice: 0,
        actualPurchaseCostInr: 0, // 0 fallback
        actualPurchaseCostCr: 0, // computes from spendInr
        benchmarkCostInr: 0,
        benchmarkCostCr: 0,
        historicalLostOpportunityInr: -50, // <= 0 -> null
        historicalLostOpportunityCr: 0,
        priceDispersionPct: 0,
        benchmarkSupplierName: 'SUPP',
        benchmarkSupplierCode: 'S1',
        benchmarkPoNumber: 'PO1',
        benchmarkPoDate: '2026-05-01',
        benchmarkPlantCode: 'PL1',
        supplierCount: 1, // === 1 -> SINGLE_SUPPLIER_DISPERSION
        plantCount: 1,
        qualificationStatus: 'QUALIFIED',
        warnings: [],
        suppliers: undefined as any, // undefined fallback
        plants: undefined as any,
        transactions: undefined as any
      };

      const res = Module2OpportunityRegisterBuilder.mapDpiOpportunities([item], 'AIC-TEST');
      expect(res.length).toBe(1);
      expect(res[0].confidenceLevel).toBe('MEDIUM');
      expect(res[0].defensibleOpportunityValueInr).toBeNull();
      expect(res[0].defensibleOpportunityValueCr).toBeNull();
      expect(res[0].category).toBe('Direct Materials');
      expect(res[0].reviewFlags).toContain('SINGLE_SUPPLIER_DISPERSION');
      expect(res[0].supportingTransactionIds).toEqual([]);
      expect(res[0].suppliersInvolved).toEqual([]);
      expect(res[0].plantsInvolved).toEqual([]);
    });

    it('covers VC builder branches: DESC_MATCH_ without awaiting review, supplier counts 2 and 3, missing txs and plants', () => {
      const opp1: SameMaterialOpportunity = {
        materialCode: 'DESC_MATCH_GLOVES',
        materialDesc: 'GLOVES',
        spendCategory: undefined as any,
        unspscCode: '1',
        unspscCategory: 'Safety',
        uom: undefined as any,
        currency: 'INR',
        totalSpendInr: 0,
        totalSpendCr: 0,
        totalQuantity: 10,
        supplierCount: 2, // < 3 -> MEDIUM confidence when not review required, but DESC_MATCH -> review required -> LOW
        plantCount: 1,
        classificationReviewStatus: 'CLASSIFIED', // Not AWAITING_REVIEW, but starts with DESC_MATCH_
        suppliers: [{ vendorCode: 'V1', vendorName: 'Vendor 1' } as any],
        lowestUnitPrice: 10,
        highestUnitPrice: 12,
        weightedAvgPrice: 11,
        priceDispersionPct: 18,
        isComparableUomAndCurrency: true,
        status: 'IDENTIFIED',
        opportunityReason: 'Multi-vendor',
        addressableSpendInr: 0,
        addressableSpendCr: 0,
        transactions: undefined as any
      };

      const opp2: SameMaterialOpportunity = {
        materialCode: '100SOD01',
        materialDesc: 'SODA ASH',
        spendCategory: 'Chemicals',
        unspscCode: '1',
        unspscCategory: 'Chemicals',
        uom: 'MT',
        currency: 'INR',
        totalSpendInr: 5000000,
        totalSpendCr: 0.5,
        totalQuantity: 100,
        supplierCount: 2, // supplierCount < 3 -> MEDIUM
        plantCount: 1,
        classificationReviewStatus: 'CLASSIFIED',
        suppliers: [{ vendorCode: 'V1', vendorName: 'V1', plants: undefined as any } as any],
        lowestUnitPrice: 10,
        highestUnitPrice: 12,
        weightedAvgPrice: 11,
        priceDispersionPct: 18,
        isComparableUomAndCurrency: true,
        status: 'IDENTIFIED',
        opportunityReason: 'Multi-vendor',
        addressableSpendInr: 5000000,
        addressableSpendCr: 0.5,
        transactions: [{ id: undefined as any }] as any
      };

      const res = Module2OpportunityRegisterBuilder.mapVendorConsolidationOpportunities([opp1, opp2], 'AIC-TEST');
      expect(res[0].confidenceLevel).toBe('LOW');
      expect(res[0].status).toBe('UNDER_REVIEW');
      expect(res[0].uom).toBe('N/A');
      expect(res[0].category).toBe('Direct Materials');
      expect(res[0].supportingTransactionCount).toBe(1);

      expect(res[1].confidenceLevel).toBe('MEDIUM');
      expect(res[1].status).toBe('IDENTIFIED');
      expect(res[1].supportingTransactionIds).toEqual(['']);
    });

    it('covers Volume Aggregation builder branches: exclusions, plantCount 1, fallback spend, missing suppliers/plants', () => {
      const opps: VolumeAggregationOpportunity[] = [
        {
          materialCode: 'EXCLUDED-01',
          materialDesc: 'Excluded non-genuine',
          category: undefined as any,
          baseUom: 'MT',
          transactionCount: 1, // < 2 -> filtered out
          isGenuineOpportunity: false, // filtered out
          plantCount: 1,
          suppliers: undefined as any,
          plants: undefined as any,
          totalHistoricalSpendInr: 0,
          potentiallyAggregatableSpendInr: 0,
          aggregatableQuantity: 0,
          eligibilityType: 'SINGLE_PURCHASE'
        } as any,
        {
          materialCode: 'VA-GENUINE-SINGLE-PLANT',
          materialDesc: 'Single plant genuine',
          category: undefined as any,
          baseUom: 'KG',
          transactionCount: 3,
          isGenuineOpportunity: true,
          plantCount: 1, // < 2 -> MEDIUM confidence
          suppliers: undefined as any,
          plants: undefined as any,
          totalHistoricalSpendInr: 1000000,
          potentiallyAggregatableSpendInr: 0, // fallback to totalHistoricalSpendInr
          aggregatableQuantity: 500,
          eligibilityType: 'ANNUAL_VOLUME_QUALIFIED'
        } as any
      ];

      const res = Module2OpportunityRegisterBuilder.mapVolumeAggregationOpportunities(opps, 'AIC-TEST');
      expect(res.length).toBe(1);
      expect(res[0].materialCode).toBe('VA-GENUINE-SINGLE-PLANT');
      expect(res[0].confidenceLevel).toBe('MEDIUM');
      expect(res[0].historicalSpendInr).toBe(1000000);
      expect(res[0].category).toBe('Direct Materials');
      expect(res[0].suppliersInvolved).toEqual([]);
      expect(res[0].plantsInvolved).toEqual([]);
    });

    it('covers Specification Rationalisation builder branches: >50 candidates slicing, missing plants/uom/txCount', () => {
      const candidates: SpecificationCandidateItem[] = Array.from({ length: 55 }, (_, idx) => ({
        candidateId: `CAND-${idx}`,
        primaryItem: {
          code: `CODE-A-${idx}`,
          description: `DESC-A-${idx}`,
          plant: undefined as any,
          uom: undefined as any,
          transactionCount: undefined as any
        } as any,
        comparisonItem: {
          code: `CODE-B-${idx}`,
          description: `DESC-B-${idx}`,
          plant: undefined as any,
          transactionCount: undefined as any
        } as any,
        similarityScore: 85,
        spendCategory: undefined as any,
        expenditureUnderReviewInr: 200000,
        expenditureUnderReviewCr: undefined as any
      }));

      const res = Module2OpportunityRegisterBuilder.mapSpecRationalisationOpportunities(candidates, 'AIC-TEST');
      expect(res.length).toBe(50); // Sliced to 50
      expect(res[0].uom).toBe('VARIOUS');
      expect(res[0].category).toBe('Direct Materials');
      expect(res[0].plantsInvolved).toEqual([]);
      expect(res[0].supportingTransactionCount).toBe(2);
      expect(res[0].historicalSpendCr).toBe(0.02);
    });
  });

  describe('Engine Branch Coverage', () => {
    it('returns cached results on subsequent calls without recalculating', async () => {
      const mockResult = {
        assessmentId: 'AIC-CACHED',
        customerName: 'Cached Customer',
        generatedAt: '2026-10-26T00:00:00Z',
        summary: {} as any,
        opportunities: [],
        exclusionsSummary: {}
      };

      vi.spyOn(Module2CanonicalService, 'getCanonicalInput').mockReturnValue({
        totalValidatedSpendCr: 100,
        validRowCount: 50
      } as any);
      vi.spyOn(Module2DirectPriceImprovementEngine, 'calculateSync').mockReturnValue({
        totalEligibleSpendCr: 50,
        totalEligibleTransactions: 25,
        exclusionReasonsBreakdown: { MISSING_MATERIAL_CODE: 10 },
        totalIneligibleSpendCr: 5.5,
        items: []
      } as any);
      vi.spyOn(Module2VendorConsolidationEngine, 'calculate').mockResolvedValue({
        sameMaterialMultiSourcingSpendCr: 30,
        sameMaterialOpportunities: []
      } as any);
      vi.spyOn(Module2VolumeAggregationEngine, 'calculate').mockResolvedValue({
        coverageSummary: { uomCompatibleSpendCr: 20 },
        tier1Opportunities: []
      } as any);
      vi.spyOn(Module2SpecificationRationalisationEngine, 'calculateSpecificationRationalisation').mockResolvedValue({
        candidates: []
      } as any);

      const first = await Module2OpportunityRegisterEngine.generateRegister('AIC-CACHED');
      expect(first.summary.spendRequiringReviewCr).toBe(5.5);

      // Second call should return cached instance immediately
      const second = await Module2OpportunityRegisterEngine.generateRegister('AIC-CACHED');
      expect(second).toBe(first);
    });

    it('handles undefined/null engine outputs gracefully when building summary metrics', async () => {
      vi.spyOn(Module2CanonicalService, 'getCanonicalInput').mockReturnValue(null as any);
      vi.spyOn(Module2DirectPriceImprovementEngine, 'calculateSync').mockReturnValue(null as any);
      vi.spyOn(Module2VendorConsolidationEngine, 'calculate').mockResolvedValue(null as any);
      vi.spyOn(Module2VolumeAggregationEngine, 'calculate').mockResolvedValue(null as any);
      vi.spyOn(Module2SpecificationRationalisationEngine, 'calculateSpecificationRationalisation').mockResolvedValue(null as any);

      const res = await Module2OpportunityRegisterEngine.generateRegister('AIC-NULL-ENGINES');
      expect(res.summary.authoritativeBaselineSpendCr).toBe(0);
      expect(res.summary.authoritativeBaselineTransactions).toBe(0);
      expect(res.summary.directPriceEligibleSpendCr).toBe(0);
      expect(res.summary.supplierConsolidationEligibleSpendCr).toBe(0);
      expect(res.summary.volumeConsolidationCandidateSpendCr).toBe(0);
      expect(res.summary.spendRequiringReviewCr).toBe(101.5189); // Fallback
      expect(res.opportunities).toEqual([]);
    });

    it('filters opportunities by type, status, category, and search query across all searchable fields', async () => {
      const mockOpps = [
        {
          opportunityId: 'OPP-001',
          opportunityType: 'DIRECT_PRICE_IMPROVEMENT',
          status: 'IDENTIFIED',
          category: 'Chemicals Raw',
          materialCode: 'CHEM-SODA',
          materialDescription: 'Soda Ash Dense',
          suppliersInvolved: ['Tata Chemicals', 'DCW'],
          historicalSpendCr: 10,
          confidenceLevel: 'HIGH'
        },
        {
          opportunityId: 'OPP-002',
          opportunityType: 'SUPPLIER_CONSOLIDATION',
          status: 'UNDER_REVIEW',
          category: 'Packaging',
          materialCode: 'BOX-CORR',
          materialDescription: 'Corrugated Cartons',
          suppliersInvolved: ['Paper Pack Ltd'],
          historicalSpendCr: 5,
          confidenceLevel: 'LOW'
        }
      ];

      vi.spyOn(Module2OpportunityRegisterEngine, 'generateRegister').mockResolvedValue({
        assessmentId: 'AIC-TEST',
        customerName: 'Test Corp',
        generatedAt: '2026-10-26T00:00:00Z',
        summary: {} as any,
        opportunities: mockOpps as any,
        exclusionsSummary: {}
      });

      // Filter by type
      const byType = await Module2OpportunityRegisterEngine.queryOpportunities({
        assessmentId: 'AIC-TEST',
        type: 'DIRECT_PRICE_IMPROVEMENT'
      });
      expect(byType.opportunities.length).toBe(1);
      expect(byType.opportunities[0].opportunityId).toBe('OPP-001');

      // Filter by status
      const byStatus = await Module2OpportunityRegisterEngine.queryOpportunities({
        assessmentId: 'AIC-TEST',
        status: 'UNDER_REVIEW'
      });
      expect(byStatus.opportunities.length).toBe(1);
      expect(byStatus.opportunities[0].opportunityId).toBe('OPP-002');

      // Filter by category
      const byCat = await Module2OpportunityRegisterEngine.queryOpportunities({
        assessmentId: 'AIC-TEST',
        category: 'chemical'
      });
      expect(byCat.opportunities.length).toBe(1);

      // Search matching materialCode
      const searchCode = await Module2OpportunityRegisterEngine.queryOpportunities({
        assessmentId: 'AIC-TEST',
        search: 'CHEM-SODA'
      });
      expect(searchCode.opportunities.length).toBe(1);

      // Search matching materialDescription
      const searchDesc = await Module2OpportunityRegisterEngine.queryOpportunities({
        assessmentId: 'AIC-TEST',
        search: 'cartons'
      });
      expect(searchDesc.opportunities.length).toBe(1);

      // Search matching opportunityId
      const searchId = await Module2OpportunityRegisterEngine.queryOpportunities({
        assessmentId: 'AIC-TEST',
        search: 'OPP-002'
      });
      expect(searchId.opportunities.length).toBe(1);

      // Search matching suppliersInvolved
      const searchSupp = await Module2OpportunityRegisterEngine.queryOpportunities({
        assessmentId: 'AIC-TEST',
        search: 'Tata'
      });
      expect(searchSupp.opportunities.length).toBe(1);
    });
  });

  describe('Controller Branch Coverage', () => {
    it('uses x-request-id from headers and handles non-Error exception in getOpportunityRegister', async () => {
      vi.spyOn(Module2OpportunityRegisterEngine, 'queryOpportunities').mockRejectedValue('String exception');

      const mockReq = {
        headers: { 'x-request-id': 'CUSTOM-REQ-123' },
        query: { assessmentId: 'AIC-2026-0002' }
      } as unknown as Request;

      let statusCode = 0;
      let jsonBody: any = null;
      const mockRes = {
        status: (code: number) => {
          statusCode = code;
          return mockRes;
        },
        json: (data: unknown) => {
          jsonBody = data;
          return mockRes;
        }
      } as unknown as Response;

      await Module2OpportunityRegisterController.getOpportunityRegister(mockReq, mockRes);
      expect(statusCode).toBe(500);
      expect(jsonBody.error).toBe('String exception');
    });

    it('returns 400 when assessmentId is missing in getExecutiveDashboard and handles non-Error exception', async () => {
      const mockReqNoId = {
        headers: { 'x-request-id': 'REQ-DASH' },
        query: {}
      } as unknown as Request;

      let statusCode = 0;
      let jsonBody: any = null;
      const mockRes = {
        status: (code: number) => {
          statusCode = code;
          return mockRes;
        },
        json: (data: unknown) => {
          jsonBody = data;
          return mockRes;
        }
      } as unknown as Response;

      await Module2OpportunityRegisterController.getExecutiveDashboard(mockReqNoId, mockRes);
      expect(statusCode).toBe(400);
      expect(jsonBody.message).toContain('Assessment ID is required');

      // Test non-Error exception in getExecutiveDashboard
      vi.spyOn(Module2OpportunityRegisterEngine, 'generateRegister').mockRejectedValue('Dashboard string failure');
      const mockReqValid = {
        headers: { 'x-request-id': 'REQ-DASH-ERR' },
        query: { assessmentId: 'AIC-2026-0002' }
      } as unknown as Request;

      await Module2OpportunityRegisterController.getExecutiveDashboard(mockReqValid, mockRes);
      expect(statusCode).toBe(500);
      expect(jsonBody.error).toBe('Dashboard string failure');
    });

    it('exports CSV using default assessmentId when query param is absent and handles nullish opportunity fields', async () => {
      vi.spyOn(Module2OpportunityRegisterEngine, 'generateRegister').mockResolvedValue({
        assessmentId: 'AIC-2026-0002',
        customerName: 'Default Corp',
        generatedAt: '2026-10-26T00:00:00Z',
        summary: {} as any,
        opportunities: [
          {
            opportunityId: 'OPP-EMPTY-FIELDS',
            opportunityType: 'SUPPLIER_CONSOLIDATION',
            category: undefined as any,
            materialCode: undefined as any,
            materialDescription: undefined as any,
            uom: undefined as any,
            supportingTransactionCount: 1,
            historicalSpendInr: 100,
            historicalSpendCr: 0.0001,
            defensibleOpportunityValueInr: null,
            defensibleOpportunityValueCr: null,
            status: 'UNDER_REVIEW',
            confidenceLevel: 'LOW',
            suppliersInvolved: undefined as any,
            plantsInvolved: undefined as any,
            rationale: undefined as any,
            requiredProcurementAction: undefined as any,
            responsibleValidationTeam: undefined as any
          } as any
        ],
        exclusionsSummary: {}
      });

      const mockReq = {
        query: {} // Tests default 'AIC-2026-0002'
      } as unknown as Request;

      let responseText = '';
      const headersMap: Record<string, string> = {};
      const mockRes = {
        setHeader: (k: string, v: string) => {
          headersMap[k] = v;
        },
        status: () => mockRes,
        send: (content: string) => {
          responseText = content;
          return mockRes;
        }
      } as unknown as Response;

      await Module2OpportunityRegisterController.exportOpportunityRegisterCsv(mockReq, mockRes);
      expect(headersMap['Content-Disposition']).toContain('OPPORTUNITY_REGISTER_AIC-2026-0002');
      expect(responseText).toContain('OPP-EMPTY-FIELDS');
      expect(responseText).toContain('N/A');
    });
  });
});
