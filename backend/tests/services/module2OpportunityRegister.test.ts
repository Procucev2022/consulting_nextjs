/**
 * Module 2 — Stage 2: Material-Level Opportunity Register & Executive Dashboard Tests
 * Unit tests covering builder logic, engine calculations, comparability, non-additive overlap,
 * controller query validation, and CSV export.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Module2OpportunityRegisterBuilder } from '../../src/services/module2OpportunityRegisterBuilder';
import { Module2OpportunityRegisterEngine } from '../../src/services/module2OpportunityRegisterEngine';
import { Module2OpportunityRegisterController } from '../../src/controllers/module2OpportunityRegister.controller';
import { OPPORTUNITY_GOVERNANCE_NOTICES } from '../../src/constants/module2OpportunityRegister';
import type { DirectPriceItemOpportunity } from '../../src/types/module2DirectPriceImprovement';
import type { SameMaterialOpportunity } from '../../src/types/module2VendorConsolidation';
import type { VolumeAggregationOpportunity } from '../../src/types/module2VolumeAggregation';
import type { SpecificationCandidateItem } from '../../src/types/module2SpecificationRationalisation';
import type { Request, Response } from 'express';

describe('Module 2 — Stage 2: Opportunity Register Unit Tests', () => {
  beforeEach(() => {
    Module2OpportunityRegisterEngine.clearCache();
    vi.restoreAllMocks();
  });

  describe('1. Module2OpportunityRegisterBuilder — Direct Price Improvement', () => {
    it('should map DPI candidates with defensible opportunity value and P25 dispersion', () => {
      const mockDpiItems: DirectPriceItemOpportunity[] = [
        {
          itemKey: 'KEY-001',
          materialCode: '100DP001IM',
          materialDesc: 'DOLOMITE POWDER (IMPORTED)',
          spendCategory: '11100',
          uom: 'MT',
          currency: 'INR',
          financialYear: '2026-2027',
          transactionCount: 25,
          totalEligibleQuantity: 1000,
          lowestUnitPrice: 4152.0,
          weightedAveragePrice: 10528.43,
          highestUnitPrice: 14000.0,
          actualPurchaseCostInr: 293321980,
          actualPurchaseCostCr: 29.3322,
          benchmarkCostInr: 115674720,
          benchmarkCostCr: 11.5675,
          historicalLostOpportunityInr: 177647260,
          historicalLostOpportunityCr: 17.7647,
          priceDispersionPct: 233.3,
          benchmarkSupplierName: 'COMEFAR ASIA',
          benchmarkSupplierCode: '600713',
          benchmarkPoNumber: '4500001',
          benchmarkPoDate: '2026-05-01',
          benchmarkPlantCode: '1120',
          supplierCount: 2,
          plantCount: 1,
          qualificationStatus: 'QUALIFIED',
          warnings: [],
          suppliers: [
            {
              supplierCode: '600713',
              supplierName: 'COMEFAR ASIA',
              transactionCount: 15,
              totalQuantity: 600,
              totalSpendInr: 2491200,
              weightedAveragePrice: 4152.0,
              lowestUnitPrice: 4152.0,
              highestUnitPrice: 4152.0,
              historicalLostOpportunityInr: 0,
              isLowestPriceSupplier: true
            }
          ],
          plants: [
            {
              plantCode: '1120',
              transactionCount: 25,
              totalQuantity: 1000,
              totalSpendInr: 293321980,
              weightedAveragePrice: 10528.43,
              lowestUnitPrice: 4152.0,
              historicalLostOpportunityInr: 177647260
            }
          ],
          transactions: [
            {
              id: 'TX-001',
              poNumber: '4500001',
              poDate: '2026-05-01',
              financialYear: '2026-2027',
              supplierName: 'COMEFAR ASIA',
              supplierCode: '600713',
              plantCode: '1120',
              quantity: 100,
              unitPrice: 4152.0,
              totalSpendInr: 415200,
              benchmarkUnitPrice: 4152.0,
              benchmarkCostInr: 415200,
              historicalLostOpportunityInr: 0,
              isBenchmarkTransaction: true,
              qualificationStatus: 'QUALIFIED'
            }
          ]
        }
      ];

      const res = Module2OpportunityRegisterBuilder.mapDpiOpportunities(mockDpiItems, 'AIC-2026-0002');
      expect(res.length).toBe(1);
      const opp = res[0];

      expect(opp.opportunityId).toBe('OPP-AIC-2026-0002-DPI-0001');
      expect(opp.opportunityType).toBe('DIRECT_PRICE_IMPROVEMENT');
      expect(opp.materialCode).toBe('100DP001IM');
      expect(opp.materialDescription).toBe('DOLOMITE POWDER (IMPORTED)');
      expect(opp.uom).toBe('MT');
      expect(opp.historicalSpendCr).toBe(29.3322);
      expect(opp.defensibleOpportunityValueCr).toBe(17.7647);
      expect(opp.defensibleOpportunityValueInr).toBe(177647260);
      expect(opp.confidenceLevel).toBe('HIGH');
      expect(opp.status).toBe('IDENTIFIED');
      expect(opp.overlapGroupId).toBe('100DP001IM');
      expect(opp.comparabilityChecks).toContain('SAME_MATERIAL_CODE');
    });

    it('should assign medium confidence and null value when opportunity is zero or single supplier', () => {
      const mockSingleSupplier: DirectPriceItemOpportunity[] = [
        {
          itemKey: 'KEY-002',
          materialCode: 'SINGLE-MAT',
          materialDesc: 'SINGLE SUPPLIER ITEM',
          spendCategory: 'MRO',
          uom: 'NOS',
          currency: 'INR',
          financialYear: '2026-2027',
          transactionCount: 2,
          totalEligibleQuantity: 10,
          lowestUnitPrice: 500,
          weightedAveragePrice: 500,
          highestUnitPrice: 500,
          actualPurchaseCostInr: 5000,
          actualPurchaseCostCr: 0.0005,
          benchmarkCostInr: 5000,
          benchmarkCostCr: 0.0005,
          historicalLostOpportunityInr: 0,
          historicalLostOpportunityCr: 0,
          priceDispersionPct: 0,
          benchmarkSupplierName: 'SUPPLIER 1',
          benchmarkSupplierCode: 'S1',
          benchmarkPoNumber: 'PO1',
          benchmarkPoDate: '2026-06-01',
          benchmarkPlantCode: 'PL1',
          supplierCount: 1,
          plantCount: 1,
          qualificationStatus: 'QUALIFIED',
          warnings: [],
          suppliers: [],
          plants: [],
          transactions: []
        }
      ];

      const res = Module2OpportunityRegisterBuilder.mapDpiOpportunities(mockSingleSupplier, 'AIC-2026-0002');
      expect(res[0].confidenceLevel).toBe('MEDIUM');
      expect(res[0].defensibleOpportunityValueCr).toBeNull();
      expect(res[0].reviewFlags).toContain('SINGLE_SUPPLIER_DISPERSION');
    });
  });

  describe('2. Module2OpportunityRegisterBuilder — Supplier Consolidation', () => {
    it('should map verified multi-supplier opportunities with null defensible value', () => {
      const mockSameMat: SameMaterialOpportunity[] = [
        {
          materialCode: '100SUA01I',
          materialDesc: 'SODIUM ANTIMONATE',
          spendCategory: '11100',
          unspscCode: '12000000',
          unspscCategory: 'Chemicals',
          uom: 'KG',
          currency: 'INR',
          totalSpendInr: 418000000,
          totalSpendCr: 41.8,
          totalQuantity: 50000,
          supplierCount: 3,
          plantCount: 2,
          suppliers: [
            {
              vendorCode: 'V1',
              vendorName: 'Supplier Alpha',
              quantity: 25000,
              spendInr: 200000000,
              spendCr: 20.0,
              weightedAvgPrice: 8000,
              poCount: 10,
              plants: ['1120']
            },
            {
              vendorCode: 'V2',
              vendorName: 'Supplier Beta',
              quantity: 25000,
              spendInr: 218000000,
              spendCr: 21.8,
              weightedAvgPrice: 8720,
              poCount: 12,
              plants: ['1130']
            }
          ],
          lowestUnitPrice: 8000,
          highestUnitPrice: 8720,
          weightedAvgPrice: 8360,
          priceDispersionPct: 9.0,
          isComparableUomAndCurrency: true,
          status: 'MULTI_SOURCED_OPPORTUNITY_IDENTIFIED',
          opportunityReason: 'Multi-vendor supply',
          addressableSpendInr: 418000000,
          addressableSpendCr: 41.8,
          transactions: [{ id: 'TX-10' }, { id: 'TX-11' }] as any
        }
      ];

      const res = Module2OpportunityRegisterBuilder.mapVendorConsolidationOpportunities(mockSameMat, 'AIC-2026-0002');
      expect(res.length).toBe(1);
      const opp = res[0];

      expect(opp.opportunityId).toBe('OPP-AIC-2026-0002-SC-0001');
      expect(opp.opportunityType).toBe('SUPPLIER_CONSOLIDATION');
      expect(opp.materialCode).toBe('100SUA01I');
      expect(opp.historicalSpendCr).toBe(41.8);
      expect(opp.defensibleOpportunityValueCr).toBeNull(); // Commercial negotiation required
      expect(opp.confidenceLevel).toBe('HIGH');
      expect(opp.status).toBe('IDENTIFIED');
      expect(opp.suppliersInvolved).toContain('Supplier Alpha');
      expect(opp.suppliersInvolved).toContain('Supplier Beta');
      expect(opp.plantsInvolved).toContain('1120');
      expect(opp.plantsInvolved).toContain('1130');
    });

    it('should assign LOW confidence and UNDER_REVIEW for description matched items', () => {
      const mockDescMatch: SameMaterialOpportunity[] = [
        {
          materialCode: 'DESC_MATCH_GLOVES',
          materialDesc: 'SAFETY GLOVES LEATHER',
          spendCategory: 'MRO',
          unspscCode: '46181504',
          unspscCategory: 'Safety',
          uom: 'PR',
          currency: 'INR',
          totalSpendInr: 500000,
          totalSpendCr: 0.05,
          totalQuantity: 100,
          supplierCount: 2,
          plantCount: 1,
          suppliers: [{ vendorCode: 'V3', vendorName: 'Vendor 3', quantity: 50, spendInr: 250000, spendCr: 0.025, weightedAvgPrice: 5000, poCount: 2, plants: ['1120'] }],
          lowestUnitPrice: 5000,
          highestUnitPrice: 5000,
          weightedAvgPrice: 5000,
          priceDispersionPct: 0,
          isComparableUomAndCurrency: true,
          status: 'MULTI_SOURCED_OPPORTUNITY_IDENTIFIED',
          opportunityReason: 'Description match',
          classificationReviewStatus: 'AWAITING_REVIEW',
          addressableSpendInr: 500000,
          addressableSpendCr: 0.05,
          transactions: []
        }
      ];

      const res = Module2OpportunityRegisterBuilder.mapVendorConsolidationOpportunities(mockDescMatch, 'AIC-2026-0002');
      expect(res[0].confidenceLevel).toBe('LOW');
      expect(res[0].status).toBe('UNDER_REVIEW');
      expect(res[0].reviewFlags).toContain('AWAITING_MATERIAL_CODE_REVIEW');
    });
  });

  describe('3. Module2OpportunityRegisterBuilder — Volume Aggregation & Spec Review', () => {
    it('should map volume aggregation candidates with MT recognition and demand recurrence', () => {
      const mockVa: VolumeAggregationOpportunity[] = [
        {
          opportunityId: 'VA-001',
          tier: 'TIER_1_IDENTICAL',
          tierLabel: 'Tier 1 Identical',
          materialCode: '100SA02G',
          materialDesc: 'SODA ASH DENSE GHCL',
          category: 'Chemicals',
          unspscCode: '12000000',
          baseUom: 'MT',
          totalHistoricalSpendInr: 581170000,
          totalHistoricalSpendCr: 58.117,
          potentiallyAggregatableSpendInr: 581170000,
          potentiallyAggregatableSpendCr: 58.117,
          aggregatableQuantity: 19600,
          excludedQuantity: 0,
          unmatchedAdjustmentsInr: 0,
          transactionCount: 45,
          plantCount: 2,
          plants: ['1120', '1130'],
          supplierCount: 1,
          primarySupplier: 'GHCL LTD',
          suppliers: ['GHCL LTD'],
          demandClassification: 'RECURRING_PREDICTABLE',
          demandClassificationLabel: 'Recurring Predictable',
          opportunityStatus: 'POTENTIAL_OPPORTUNITY_IDENTIFIED',
          statusReason: 'High volume across plants',
          nextRecommendedAction: 'Consolidate annual volume',
          technicalValidationRequired: false,
          wavgUnitPriceInr: 29651.53,
          eligibilityType: 'TEMPORAL_LOT_CONSOLIDATION',
          isGenuineOpportunity: true
        }
      ];

      const res = Module2OpportunityRegisterBuilder.mapVolumeAggregationOpportunities(mockVa, 'AIC-2026-0002');
      expect(res.length).toBe(1);
      const opp = res[0];

      expect(opp.opportunityId).toBe('OPP-AIC-2026-0002-VDC-0001');
      expect(opp.opportunityType).toBe('VOLUME_DEMAND_CONSOLIDATION');
      expect(opp.materialCode).toBe('100SA02G');
      expect(opp.uom).toBe('MT');
      expect(opp.historicalSpendCr).toBe(58.117);
      expect(opp.confidenceLevel).toBe('HIGH');
      expect(opp.defensibleOpportunityValueCr).toBeNull();
      expect(opp.overlapGroupId).toBe('100SA02G');
    });

    it('should map specification rationalisation candidates with LOW confidence and UNDER_REVIEW', () => {
      const mockSpec: SpecificationCandidateItem[] = [
        {
          candidateId: 'CAND-01',
          identificationType: 'TEXT_SIMILARITY',
          identificationRationale: 'Potential similar boxes',
          spendCategory: 'Packaging',
          primaryItem: {
            code: 'BOX-A',
            description: 'Corrugated Box 20x20',
            normalizedDescription: 'CORRUGATED BOX',
            plant: '1120',
            totalSpendInr: 1000000,
            totalQuantity: 5000,
            uom: 'NOS',
            transactionCount: 5,
            suppliersCount: 1
          },
          comparisonItem: {
            code: 'BOX-B',
            description: 'Corrugated Box 20x22',
            normalizedDescription: 'CORRUGATED BOX',
            plant: '1130',
            totalSpendInr: 1200000,
            totalQuantity: 6000,
            uom: 'NOS',
            transactionCount: 6,
            suppliersCount: 1
          },
          similarityScore: 92,
          technicalAttributes: [],
          differencesIdentified: ['Height variance 2cm'],
          missingAttributesDisclosed: [],
          hasMissingTechnicalData: true,
          expenditureUnderReviewInr: 2200000,
          expenditureUnderReviewCr: 0.22,
          quantityUnderReview: 11000,
          reviewStatus: 'AWAITING_TECHNICAL_REVIEW',
          reviewHistory: [],
          financialBenefitStatus: 'DEFERRED_TO_PHASE_2',
          potentialRelatedLevers: [],
          nextRequiredAction: 'Technical qualification'
        }
      ];

      const res = Module2OpportunityRegisterBuilder.mapSpecRationalisationOpportunities(mockSpec, 'AIC-2026-0002');
      expect(res.length).toBe(1);
      const opp = res[0];

      expect(opp.opportunityId).toBe('OPP-AIC-2026-0002-SPR-0001');
      expect(opp.opportunityType).toBe('SPECIFICATION_PROCESS_REVIEW');
      expect(opp.materialCode).toBe('BOX-A / BOX-B');
      expect(opp.historicalSpendCr).toBe(0.22);
      expect(opp.confidenceLevel).toBe('LOW');
      expect(opp.status).toBe('UNDER_REVIEW');
      expect(opp.defensibleOpportunityValueCr).toBeNull();
      expect(opp.reviewFlags).toContain('TECHNICAL_REVIEW_REQUIRED');
    });
  });

  describe('4. Module2OpportunityRegisterEngine Verification', () => {
    it('should generate opportunity register and calculate authoritative summary metrics', async () => {
      const mockDpi = [
        {
          itemKey: 'KEY-001',
          materialCode: '100DP001IM',
          materialDesc: 'DOLOMITE POWDER (IMPORTED)',
          spendCategory: '11100',
          uom: 'MT',
          currency: 'INR',
          financialYear: '2026-2027',
          transactionCount: 25,
          totalEligibleQuantity: 1000,
          lowestUnitPrice: 4152.0,
          weightedAveragePrice: 10528.43,
          highestUnitPrice: 14000.0,
          actualPurchaseCostInr: 293321980,
          actualPurchaseCostCr: 29.3322,
          benchmarkCostInr: 115674720,
          benchmarkCostCr: 11.5675,
          historicalLostOpportunityInr: 177647260,
          historicalLostOpportunityCr: 17.7647,
          priceDispersionPct: 233.3,
          benchmarkSupplierName: 'COMEFAR ASIA',
          benchmarkSupplierCode: '600713',
          benchmarkPoNumber: '4500001',
          benchmarkPoDate: '2026-05-01',
          benchmarkPlantCode: '1120',
          supplierCount: 2,
          plantCount: 1,
          qualificationStatus: 'QUALIFIED',
          warnings: [],
          suppliers: [],
          plants: [],
          transactions: []
        }
      ] as any;

      const mockVc = [
        {
          materialCode: '100SUA01I',
          materialDesc: 'SODIUM ANTIMONATE',
          spendCategory: '11100',
          unspscCode: '12000000',
          unspscCategory: 'Chemicals',
          uom: 'KG',
          currency: 'INR',
          totalSpendInr: 418000000,
          totalSpendCr: 41.8,
          totalQuantity: 50000,
          supplierCount: 2,
          plantCount: 2,
          suppliers: [],
          lowestUnitPrice: 8000,
          highestUnitPrice: 8720,
          weightedAvgPrice: 8360,
          priceDispersionPct: 9.0,
          isComparableUomAndCurrency: true,
          status: 'MULTI_SOURCED_OPPORTUNITY_IDENTIFIED',
          opportunityReason: 'Multi-vendor supply',
          addressableSpendInr: 418000000,
          addressableSpendCr: 41.8,
          transactions: []
        }
      ] as any;

      const mockVa = [
        {
          opportunityId: 'VA-001',
          tier: 'TIER_1_IDENTICAL',
          tierLabel: 'Tier 1 Identical',
          materialCode: '100SA02G',
          materialDesc: 'SODA ASH DENSE GHCL',
          category: 'Chemicals',
          unspscCode: '12000000',
          baseUom: 'MT',
          totalHistoricalSpendInr: 581170000,
          totalHistoricalSpendCr: 58.117,
          potentiallyAggregatableSpendInr: 581170000,
          potentiallyAggregatableSpendCr: 58.117,
          aggregatableQuantity: 19600,
          excludedQuantity: 0,
          unmatchedAdjustmentsInr: 0,
          transactionCount: 45,
          plantCount: 2,
          plants: ['1120', '1130'],
          supplierCount: 1,
          primarySupplier: 'GHCL LTD',
          suppliers: ['GHCL LTD'],
          demandClassification: 'RECURRING_PREDICTABLE',
          demandClassificationLabel: 'Recurring Predictable',
          opportunityStatus: 'POTENTIAL_OPPORTUNITY_IDENTIFIED',
          statusReason: 'High volume across plants',
          nextRecommendedAction: 'Consolidate annual volume',
          technicalValidationRequired: false,
          wavgUnitPriceInr: 29651.53,
          eligibilityType: 'TEMPORAL_LOT_CONSOLIDATION',
          isGenuineOpportunity: true
        }
      ] as any;

      const mockSpec = [
        {
          candidateId: 'CAND-01',
          identificationType: 'TEXT_SIMILARITY',
          identificationRationale: 'Potential similar boxes',
          spendCategory: 'Packaging',
          primaryItem: {
            code: 'BOX-A',
            description: 'Corrugated Box 20x20',
            normalizedDescription: 'CORRUGATED BOX',
            plant: '1120',
            totalSpendInr: 1000000,
            totalQuantity: 5000,
            uom: 'NOS',
            transactionCount: 5,
            suppliersCount: 1
          },
          comparisonItem: {
            code: 'BOX-B',
            description: 'Corrugated Box 20x22',
            normalizedDescription: 'CORRUGATED BOX',
            plant: '1130',
            totalSpendInr: 1200000,
            totalQuantity: 6000,
            uom: 'NOS',
            transactionCount: 6,
            suppliersCount: 1
          },
          similarityScore: 92,
          technicalAttributes: [],
          differencesIdentified: ['Height variance 2cm'],
          missingAttributesDisclosed: [],
          hasMissingTechnicalData: true,
          expenditureUnderReviewInr: 2200000,
          expenditureUnderReviewCr: 0.22,
          quantityUnderReview: 11000,
          reviewStatus: 'AWAITING_TECHNICAL_REVIEW',
          reviewHistory: [],
          financialBenefitStatus: 'DEFERRED_TO_PHASE_2',
          potentialRelatedLevers: [],
          nextRequiredAction: 'Technical qualification'
        }
      ] as any;

      const { Module2CanonicalService } = await import('../../src/services/module2CanonicalService');
      const { Module2DirectPriceImprovementEngine } = await import('../../src/services/module2DirectPriceImprovementEngine');
      const { Module2VendorConsolidationEngine } = await import('../../src/services/module2VendorConsolidationEngine');
      const { Module2VolumeAggregationEngine } = await import('../../src/services/module2VolumeAggregationEngine');
      const { Module2SpecificationRationalisationEngine } = await import(
        '../../src/services/module2SpecificationRationalisationEngine'
      );

      vi.spyOn(Module2CanonicalService, 'getCanonicalInput').mockReturnValue({
        totalValidatedSpendCr: 556.5346,
        validRowCount: 27777
      } as any);

      vi.spyOn(Module2DirectPriceImprovementEngine, 'calculateSync').mockReturnValue({
        totalEligibleSpendCr: 29.3322,
        totalEligibleTransactions: 25,
        totalIneligibleSpendCr: 101.5189,
        exclusionReasonsBreakdown: { MISSING_MATERIAL_CODE: 101.5189 },
        items: mockDpi
      } as any);

      vi.spyOn(Module2VendorConsolidationEngine, 'calculate').mockResolvedValue({
        sameMaterialMultiSourcingSpendCr: 41.8,
        sameMaterialOpportunities: mockVc
      } as any);

      vi.spyOn(Module2VolumeAggregationEngine, 'calculate').mockResolvedValue({
        coverageSummary: { uomCompatibleSpendCr: 58.117 },
        tier1Opportunities: mockVa
      } as any);

      vi.spyOn(Module2SpecificationRationalisationEngine, 'calculateSpecificationRationalisation').mockResolvedValue({
        candidates: mockSpec
      } as any);

      const reg = await Module2OpportunityRegisterEngine.generateRegister('AIC-2026-0002');
      expect(reg.assessmentId).toBe('AIC-2026-0002');
      expect(reg.summary.authoritativeBaselineSpendCr).toBe(556.5346);
      expect(reg.summary.authoritativeBaselineTransactions).toBe(27777);
      expect(reg.summary.directPriceEligibleSpendCr).toBe(29.3322);
      expect(reg.summary.supplierConsolidationEligibleSpendCr).toBe(41.8);
      expect(reg.summary.volumeConsolidationCandidateSpendCr).toBe(58.117);
      expect(reg.summary.certifiedSavingsCr).toBe(0.0);
      expect(reg.summary.realizedSavingsCr).toBe(0.0);
      expect(reg.opportunities.length).toBe(4);

      // Verify Cache hit
      const cached = await Module2OpportunityRegisterEngine.generateRegister('AIC-2026-0002');
      expect(cached).toBe(reg);

      // Verify Query filtering
      const filteredType = await Module2OpportunityRegisterEngine.queryOpportunities({
        assessmentId: 'AIC-2026-0002',
        type: 'DIRECT_PRICE_IMPROVEMENT'
      });
      expect(filteredType.opportunities.length).toBe(1);

      const filteredStatus = await Module2OpportunityRegisterEngine.queryOpportunities({
        assessmentId: 'AIC-2026-0002',
        status: 'UNDER_REVIEW'
      });
      expect(filteredStatus.opportunities.length).toBe(1);

      const filteredCat = await Module2OpportunityRegisterEngine.queryOpportunities({
        assessmentId: 'AIC-2026-0002',
        category: 'chemical'
      });
      expect(filteredCat.opportunities.length).toBe(1);

      const filteredSearch = await Module2OpportunityRegisterEngine.queryOpportunities({
        assessmentId: 'AIC-2026-0002',
        search: '100DP001IM'
      });
      expect(filteredSearch.opportunities.length).toBe(1);
    });
  });

  describe('5. Controller & CSV Export Verification', () => {
    it('should validate query parameters and return 400 on missing or invalid assessmentId', async () => {
      const mockReq = {
        headers: {},
        query: { assessmentId: '' }
      } as unknown as Request;

      let statusCode = 0;
      let jsonBody: unknown = null;
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
      expect(statusCode).toBe(400);
      expect((jsonBody as any).success).toBe(false);
    });

    it('should return 200 with opportunities on valid query', async () => {
      vi.spyOn(Module2OpportunityRegisterEngine, 'queryOpportunities').mockResolvedValue({
        assessmentId: 'AIC-2026-0002',
        customerName: 'Borosil Ltd',
        generatedAt: '2026-10-26T00:00:00.000Z',
        summary: {} as any,
        opportunities: [{ opportunityId: 'OPP-1' } as any],
        exclusionsSummary: {}
      });

      const mockReq = {
        headers: {},
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
      expect(statusCode).toBe(200);
      expect(jsonBody.success).toBe(true);
      expect(jsonBody.data.opportunities.length).toBe(1);
    });

    it('should return 400 when assessmentId is missing in getExecutiveDashboard', async () => {
      const mockReq = {
        headers: {},
        query: { assessmentId: '' }
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

      await Module2OpportunityRegisterController.getExecutiveDashboard(mockReq, mockRes);
      expect(statusCode).toBe(400);
      expect(jsonBody.success).toBe(false);
    });

    it('should return executive dashboard data with 200 using mocked engine', async () => {
      const mockSummary = {
        authoritativeBaselineSpendCr: 556.5346,
        authoritativeBaselineTransactions: 27777,
        directPriceEligibleSpendCr: 29.3322,
        directPriceEligibleTransactions: 25,
        supplierConsolidationEligibleSpendCr: 41.8,
        volumeConsolidationCandidateSpendCr: 58.117,
        spendRequiringReviewCr: 101.5189,
        totalOpportunitiesCount: 4,
        byType: {
          DIRECT_PRICE_IMPROVEMENT: { count: 1, spendCr: 29.3322, defensibleValueCr: 17.7647, materialsCount: 1 },
          SUPPLIER_CONSOLIDATION: { count: 1, spendCr: 41.8, defensibleValueCr: 0, materialsCount: 1 },
          VOLUME_DEMAND_CONSOLIDATION: { count: 1, spendCr: 58.117, defensibleValueCr: 0, materialsCount: 1 },
          SPECIFICATION_PROCESS_REVIEW: { count: 1, spendCr: 0.22, defensibleValueCr: 0, materialsCount: 1 }
        },
        byStatus: { IDENTIFIED: 3, UNDER_REVIEW: 1, VALIDATED: 0, NEGOTIATION: 0, AWARDED: 0, REJECTED: 0 },
        byConfidence: { HIGH: 3, MEDIUM: 0, LOW: 1 },
        certifiedSavingsCr: 0.0,
        realizedSavingsCr: 0.0,
        overlapDeductionNotice: OPPORTUNITY_GOVERNANCE_NOTICES.OVERLAP_NOTICE,
        dataLimitations: [...OPPORTUNITY_GOVERNANCE_NOTICES.DATA_LIMITATIONS],
        validationRequirements: [...OPPORTUNITY_GOVERNANCE_NOTICES.VALIDATION_REQUIREMENTS]
      };

      vi.spyOn(Module2OpportunityRegisterEngine, 'generateRegister').mockResolvedValue({
        assessmentId: 'AIC-2026-0002',
        customerName: 'Borosil Ltd',
        generatedAt: '2026-10-26T00:00:00.000Z',
        summary: mockSummary as any,
        opportunities: [],
        exclusionsSummary: {}
      });

      const mockReq = {
        headers: {},
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

      await Module2OpportunityRegisterController.getExecutiveDashboard(mockReq, mockRes);
      expect(statusCode).toBe(200);
      expect(jsonBody.success).toBe(true);
      expect(jsonBody.data.summary.authoritativeBaselineSpendCr).toBeCloseTo(556.5346, 3);
      expect(jsonBody.data.summary.authoritativeBaselineTransactions).toBe(27777);
      expect(jsonBody.data.summary.certifiedSavingsCr).toBe(0.0);
    });

    it('should export traceable CSV with headers and records', async () => {
      vi.spyOn(Module2OpportunityRegisterEngine, 'generateRegister').mockResolvedValue({
        assessmentId: 'AIC-2026-0002',
        customerName: 'Borosil Ltd',
        generatedAt: '2026-10-26T00:00:00.000Z',
        summary: {} as any,
        opportunities: [
          {
            opportunityId: 'OPP-AIC-2026-0002-DPI-0001',
            opportunityType: 'DIRECT_PRICE_IMPROVEMENT',
            category: 'Raw Materials',
            materialCode: '100DP001IM',
            materialDescription: 'DOLOMITE POWDER',
            uom: 'MT',
            supportingTransactionCount: 25,
            historicalSpendInr: 293321980,
            historicalSpendCr: 29.3322,
            defensibleOpportunityValueInr: 177647260,
            defensibleOpportunityValueCr: 17.7647,
            status: 'IDENTIFIED',
            confidenceLevel: 'HIGH',
            suppliersInvolved: ['COMEFAR ASIA'],
            plantsInvolved: ['1120'],
            rationale: 'Direct price dispersion against lowest unit price',
            requiredProcurementAction: 'Negotiate price alignment',
            responsibleValidationTeam: 'Category Management'
          } as any
        ],
        exclusionsSummary: {}
      });

      const mockReq = {
        query: { assessmentId: 'AIC-2026-0002' }
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
      expect(headersMap['Content-Type']).toBe('text/csv');
      expect(headersMap['Content-Disposition']).toContain('OPPORTUNITY_REGISTER_AIC-2026-0002');
      expect(responseText).toContain('Opportunity ID,Type,Category,Material Code');
      expect(responseText).toContain('OPP-AIC-2026-0002-DPI-0001');
      expect(responseText).toContain('100DP001IM');
    });

    it('should return 500 when opportunity register query throws error', async () => {
      vi.spyOn(Module2OpportunityRegisterEngine, 'queryOpportunities').mockRejectedValue(new Error('DB failure'));
      const mockReq = {
        headers: {},
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
      expect(jsonBody.success).toBe(false);
    });

    it('should return 500 when executive dashboard generation throws error', async () => {
      vi.spyOn(Module2OpportunityRegisterEngine, 'generateRegister').mockRejectedValue(new Error('Compute failure'));
      const mockReq = {
        headers: {},
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

      await Module2OpportunityRegisterController.getExecutiveDashboard(mockReq, mockRes);
      expect(statusCode).toBe(500);
      expect(jsonBody.success).toBe(false);
    });

    it('should return 500 when CSV export throws error', async () => {
      vi.spyOn(Module2OpportunityRegisterEngine, 'generateRegister').mockRejectedValue(new Error('Export failure'));
      const mockReq = {
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

      await Module2OpportunityRegisterController.exportOpportunityRegisterCsv(mockReq, mockRes);
      expect(statusCode).toBe(500);
      expect(jsonBody.success).toBe(false);
    });
  });
});
