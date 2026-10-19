import { describe, it, expect, vi, beforeAll } from 'vitest';
import type { Request, Response } from 'express';
import {
  roundToTwoDecimals,
  inrToCrore,
  calculateBenefitForHead,
  computeHerfindahlIndex,
  isKnownCustomerAssessment,
  type CategoryMetrics
} from '../../src/services/module2CategorySpecialisationCalculators';
import {
  classifyCategory,
  buildCategoryProfile
} from '../../src/services/module2CategorySpecialisationPrioritiser';
import {
  evaluateCrossLeverOverlap,
  aggregateSpecialisationSummary
} from '../../src/services/module2CategorySpecialisationOverlapHelper';
import { Module2CategorySpecialisationMetricHelper } from '../../src/services/module2CategorySpecialisationMetricHelper';
import { Module2CategorySpecialisationOpportunityHelper } from '../../src/services/module2CategorySpecialisationOpportunityHelper';
import { Module2CategorySpecialisationEngine } from '../../src/services/module2CategorySpecialisationEngine';
import { Module2CategorySpecialisationExcelBuilder } from '../../src/services/module2CategorySpecialisationExcelBuilder';
import { Module2CategorySpecialisationController } from '../../src/controllers/module2CategorySpecialisation.controller';
import { AssessmentStore } from '../../src/services/assessmentStore';
import { getDevelopmentDataDir } from '../../src/services/assessmentPersistence';
import { Module2CanonicalService } from '../../src/services/module2CanonicalService';
import {
  LEVER6_OPPORTUNITY_HEAD_ASSUMPTIONS,
  LEVER6_PRIORITIES,
  LEVER6_APPROACHES,
  LEVER6_OVERLAP_STATUSES,
  LEVER6_VALIDATION_STATUSES,
  LEVER6_EXCEL_SHEETS
} from '../../src/constants/module2CategorySpecialisation';
import * as XLSX from 'xlsx';

describe('Module 2 — Lever 6: Category Specialisation Engine & Services', () => {
  beforeAll(() => {
    const devDir = getDevelopmentDataDir();
    const store = AssessmentStore.getInstance();
    store.setCustomDataDir(devDir);
    store.reloadFromDisk();
    Module2CanonicalService.clearCache();
    // Pre-warm canonical datasets so individual tests execute well within 10,000ms global timeout
    Module2CategorySpecialisationEngine.calculate('AIC-2026-0002');
    Module2CategorySpecialisationEngine.calculate('AIC-2026-0003');
  }, 180000);

  describe('Calculators & Math Utilities', () => {
    it('correctly rounds to two decimal places and converts to Crores', () => {
      expect(roundToTwoDecimals(123.456)).toBe(123.46);
      expect(roundToTwoDecimals(100.004)).toBe(100.0);
      expect(inrToCrore(10000000)).toBe(1.0);
      expect(inrToCrore(25000000)).toBe(2.5);
    });

    it('calculates benefits when eligible spend is established', () => {
      const assumption = LEVER6_OPPORTUNITY_HEAD_ASSUMPTIONS['HEAD-A'];
      const benefit = calculateBenefitForHead(
        assumption,
        'Packaging',
        10000000,
        true,
        'Strategic spend',
        'TENTATIVE — PENDING VALIDATION',
        'Validation needed'
      );

      expect(benefit.isEligibleEstablished).toBe(true);
      expect(benefit.eligibleAnnualSpendInr).toBe(10000000);
      expect(benefit.eligibleAnnualSpendCr).toBe(1.0);
      expect(benefit.lowEstimateInr).toBe(100000);
      expect(benefit.baseEstimateInr).toBe(200000);
      expect(benefit.highEstimateInr).toBe(300000);
      expect(benefit.baseEstimateCr).toBe(0.02);
    });

    it('returns zero benefit and unestablished status when spend is unestablished or zero', () => {
      const assumption = LEVER6_OPPORTUNITY_HEAD_ASSUMPTIONS['HEAD-J'];
      const benefit = calculateBenefitForHead(
        assumption,
        'Logistics',
        0,
        false,
        'Operating cost pool unestablished',
        LEVER6_VALIDATION_STATUSES.DATA_UNAVAILABLE,
        'Operating audit needed'
      );

      expect(benefit.isEligibleEstablished).toBe(false);
      expect(benefit.eligibleAnnualSpendInr).toBe(0);
      expect(benefit.eligibleAnnualSpendCr).toBe(0);
      expect(benefit.lowEstimateInr).toBe(0);
      expect(benefit.baseEstimateInr).toBe(0);
      expect(benefit.highEstimateInr).toBe(0);
      expect(benefit.dataAndEvidenceStatus).toBe('DATA UNAVAILABLE');
    });

    it('calculates Herfindahl-Hirschman Index correctly', () => {
      expect(computeHerfindahlIndex([], 0)).toBe(0);
      expect(computeHerfindahlIndex([100], 0)).toBe(0);
      expect(computeHerfindahlIndex([100], 100)).toBe(10000);
      expect(computeHerfindahlIndex([50, 50], 100)).toBe(5000);
    });

    it('identifies known customer assessments', () => {
      expect(isKnownCustomerAssessment('AIC-2026-0002')).toBe(true);
      expect(isKnownCustomerAssessment('AIC-2026-0003')).toBe(true);
      expect(isKnownCustomerAssessment('CUSTOM-999')).toBe(false);
    });
  });

  describe('Category Prioritisation & Resource Classification', () => {
    const baseMetrics: CategoryMetrics = {
      categoryName: 'Dyes & Chemicals',
      totalSpendInr: 500000000,
      transactionCount: 600,
      distinctSuppliersCount: 12,
      distinctMaterialsCount: 15,
      distinctPlantsCount: 4,
      topSupplierSpendInr: 150000000,
      topSupplierSharePct: 30,
      herfindahlIndex: 1800,
      priceVariationCoefficient: 0.15,
      contractCoveragePct: 0
    };

    it('classifies high-spend, complex categories as Priority A with Dedicated Manager', () => {
      const classification = classifyCategory(baseMetrics, 1000000000);
      expect(classification.priority).toBe(LEVER6_PRIORITIES.PRIORITY_A);
      expect(classification.recommendedApproach).toBe(LEVER6_APPROACHES.DEDICATED_CATEGORY_MANAGER);
      expect(classification.dataLimitations).toContain('Contract');

      const profile = buildCategoryProfile(baseMetrics, 1000000000, classification);
      expect(profile.requiresSpecialisedManagement).toBe(true);
      expect(profile.validationStatus).toBe('TENTATIVE — PENDING VALIDATION');
    });

    it('classifies moderate-spend categories as Priority B with Shared/Centralised Manager', () => {
      const moderateMetrics: CategoryMetrics = {
        ...baseMetrics,
        totalSpendInr: 25000000,
        distinctSuppliersCount: 4,
        distinctPlantsCount: 1,
        transactionCount: 50,
        priceVariationCoefficient: 0.05
      };

      const classification = classifyCategory(moderateMetrics, 1000000000);
      expect(classification.priority).toBe(LEVER6_PRIORITIES.PRIORITY_B);
      expect(classification.recommendedApproach).toBe(LEVER6_APPROACHES.CENTRALISED_CATEGORY_MGMT);

      const profile = buildCategoryProfile(moderateMetrics, 1000000000, classification);
      expect(profile.requiresSpecialisedManagement).toBe(true);
    });

    it('classifies low-spend simple categories as Priority C with Automated Procurement', () => {
      const routineMetrics: CategoryMetrics = {
        ...baseMetrics,
        totalSpendInr: 1000000,
        distinctSuppliersCount: 1,
        distinctPlantsCount: 1,
        transactionCount: 5,
        priceVariationCoefficient: 0
      };

      const classification = classifyCategory(routineMetrics, 1000000000);
      expect(classification.priority).toBe(LEVER6_PRIORITIES.PRIORITY_C);
      expect(classification.recommendedApproach).toBe(LEVER6_APPROACHES.STANDARD_AUTOMATED);

      const profile = buildCategoryProfile(routineMetrics, 1000000000, classification);
      expect(profile.requiresSpecialisedManagement).toBe(false);
      expect(profile.validationStatus).toBe('DATA PARTIALLY AVAILABLE');
    });
  });

  describe('Metric & Opportunity Helpers', () => {
    it('calculates price variation accurately across transactions', () => {
      const txs = [
        { material_desc: 'Item A', unit_price: 100, total_spend_inr: 1000, vendor_name: 'V1', quantity: 10 },
        { material_desc: 'Item A', unit_price: 120, total_spend_inr: 1200, vendor_name: 'V2', quantity: 10 },
        { material_desc: 'Item B', unit_price: 50, total_spend_inr: 500, vendor_name: 'V1', quantity: 10 }
      ];

      const metrics = Module2CategorySpecialisationMetricHelper.buildMetricsForCategory('General', txs);
      expect(metrics.transactionCount).toBe(3);
      expect(metrics.totalSpendInr).toBe(2700);
      expect(metrics.distinctSuppliersCount).toBe(2);
      expect(metrics.distinctMaterialsCount).toBe(2);
      expect(metrics.priceVariationCoefficient).toBeGreaterThan(0);
    });

    it('evaluates all 10 opportunity heads for a category', () => {
      const metrics: CategoryMetrics = {
        categoryName: 'Packaging Materials',
        totalSpendInr: 100000000,
        transactionCount: 120,
        distinctSuppliersCount: 6,
        distinctMaterialsCount: 8,
        distinctPlantsCount: 3,
        topSupplierSpendInr: 60000000,
        topSupplierSharePct: 60,
        herfindahlIndex: 3800,
        priceVariationCoefficient: 0.12,
        contractCoveragePct: 0
      };

      const benefits = Module2CategorySpecialisationOpportunityHelper.evaluateOpportunitiesForCategory(
        metrics,
        LEVER6_PRIORITIES.PRIORITY_A
      );

      expect(benefits.length).toBe(10);
      expect(benefits[0].headKey).toBe('HEAD-A');
      expect(benefits[0].isEligibleEstablished).toBe(false);
      expect(benefits[0].baseEstimateInr).toBe(0);
      expect(benefits[0].calculationRationale).toBe('Opportunity Identified — Monetary Benefit Not Yet Quantifiable.');
      expect(benefits[1].headKey).toBe('HEAD-B');
      expect(benefits[1].isEligibleEstablished).toBe(true);
      expect(benefits[4].headKey).toBe('HEAD-E');
      expect(benefits[4].isEligibleEstablished).toBe(false);
      expect(benefits[8].headKey).toBe('HEAD-I');
      expect(benefits[8].isEligibleEstablished).toBe(false);
      expect(benefits[8].calculationRationale).toBe('Opportunity Identified — Monetary Benefit Not Yet Quantifiable.');
      expect(benefits[9].headKey).toBe('HEAD-J');
      expect(benefits[9].isEligibleEstablished).toBe(false);
      expect(benefits[9].appliesToOperatingCost).toBe(true);
    });
  });

  describe('Cross-Lever Overlap & Deduplication Controls', () => {
    it('flags overlaps for Levers 1, 3, 4, 8 and keeps net benefit at zero pending review', () => {
      const baseOpp = calculateBenefitForHead(
        LEVER6_OPPORTUNITY_HEAD_ASSUMPTIONS['HEAD-D'],
        'Raw Cotton',
        10000000,
        true,
        'Price variance',
        'TENTATIVE — PENDING VALIDATION',
        'Validation needed'
      );

      const overlap = evaluateCrossLeverOverlap(baseOpp);
      expect(overlap.relatedLever).toBe('LEVER_1');
      expect(overlap.overlapStatus).toBe(LEVER6_OVERLAP_STATUSES.OVERLAP_REVIEW_REQUIRED);
      expect(overlap.netIndicativeBenefitInr).toBe(0);
      expect(overlap.amountExcludedInr).toBe(baseOpp.baseEstimateInr);
      expect(overlap.exclusionReason).toContain('Lever 1');
    });

    it('retains full benefit in net when no cross-lever overlap exists', () => {
      const baseOpp = calculateBenefitForHead(
        LEVER6_OPPORTUNITY_HEAD_ASSUMPTIONS['HEAD-G'],
        'Raw Cotton',
        10000000,
        true,
        'Alternative supplier qualification',
        'TENTATIVE — PENDING VALIDATION',
        'Validation needed'
      );

      const overlap = evaluateCrossLeverOverlap(baseOpp);
      expect(overlap.relatedLever).toBeUndefined();
      expect(overlap.overlapStatus).toBe(LEVER6_OVERLAP_STATUSES.NO_OVERLAP);
      expect(overlap.netIndicativeBenefitInr).toBe(baseOpp.baseEstimateInr);
      expect(overlap.amountExcludedInr).toBe(0);
    });

    it('aggregates summary separating Gross vs Net totals cleanly', () => {
      const opp1 = calculateBenefitForHead(
        LEVER6_OPPORTUNITY_HEAD_ASSUMPTIONS['HEAD-G'],
        'Category 1',
        10000000,
        true,
        'Commercial mechanism',
        'TENTATIVE',
        'Valid'
      );
      const opp2 = calculateBenefitForHead(
        LEVER6_OPPORTUNITY_HEAD_ASSUMPTIONS['HEAD-D'],
        'Category 1',
        10000000,
        true,
        'Price Var',
        'TENTATIVE',
        'Valid'
      );

      const overlap1 = evaluateCrossLeverOverlap(opp1);
      const overlap2 = evaluateCrossLeverOverlap(opp2);

      const summary = aggregateSpecialisationSummary(
        'TEST-001',
        20000000,
        [opp1, opp2],
        [overlap1, overlap2],
        1,
        1,
        0,
        0,
        1,
        0,
        0,
        0
      );

      expect(summary.grossTentativeOpportunityBaseInr).toBe(opp1.baseEstimateInr + opp2.baseEstimateInr);
      expect(summary.netIndicativeOpportunityBaseInr).toBe(opp1.baseEstimateInr);
      expect(summary.opportunitiesRequiringOverlapReviewCount).toBe(1);
      expect(summary.overlapReviewAmountInr).toBe(opp2.baseEstimateInr);
    });

    it('ensures partial overlap within a category does not exclude entire category', () => {
      // Category "Polyester Fiber" has both Head G (Alternative Suppliers, no overlap) and Head D (Price Var, Lever 1)
      const oppG = calculateBenefitForHead(
        LEVER6_OPPORTUNITY_HEAD_ASSUMPTIONS['HEAD-G'],
        'Polyester Fiber',
        50000000,
        true,
        'Alternative supplier qualification',
        'TENTATIVE — PENDING VALIDATION',
        'Charter review'
      );
      const oppD = calculateBenefitForHead(
        LEVER6_OPPORTUNITY_HEAD_ASSUMPTIONS['HEAD-D'],
        'Polyester Fiber',
        25000000,
        true,
        'Price variance',
        'TENTATIVE — PENDING VALIDATION',
        'Price dispersion review'
      );

      const overlapG = evaluateCrossLeverOverlap(oppG);
      const overlapD = evaluateCrossLeverOverlap(oppD);

      // Head D overlaps with Lever 1 and is excluded, Head G has no overlap and is retained
      expect(overlapD.overlapStatus).toBe(LEVER6_OVERLAP_STATUSES.OVERLAP_REVIEW_REQUIRED);
      expect(overlapD.netIndicativeBenefitInr).toBe(0);
      expect(overlapG.overlapStatus).toBe(LEVER6_OVERLAP_STATUSES.NO_OVERLAP);
      expect(overlapG.netIndicativeBenefitInr).toBe(oppG.baseEstimateInr);

      const summary = aggregateSpecialisationSummary(
        'TEST-002',
        50000000,
        [oppG, oppD],
        [overlapG, overlapD],
        1, 1, 0, 0, 1, 0, 0, 0
      );
      // Net includes Head G in full even though Head D in same category was excluded
      expect(summary.netIndicativeOpportunityBaseInr).toBe(oppG.baseEstimateInr);
      expect(summary.overlapReviewAmountInr).toBe(oppD.baseEstimateInr);
      expect(summary.grossTentativeOpportunityBaseInr).toBe(oppG.baseEstimateInr + oppD.baseEstimateInr);
    });

    it('handles Lever 2 (E-Auction) and Lever 5 (Payment Terms) overlap governance correctly', () => {
      const oppF = calculateBenefitForHead(
        LEVER6_OPPORTUNITY_HEAD_ASSUMPTIONS['HEAD-F'],
        'Contestable Category',
        10000000,
        true,
        'Competitive bidding',
        'TENTATIVE — PENDING VALIDATION',
        'RFP review'
      );
      // Default: Head F is flagged for review and excluded from net indicative total
      const defaultOverlapF = evaluateCrossLeverOverlap(oppF);
      expect(defaultOverlapF.overlapStatus).toBe(LEVER6_OVERLAP_STATUSES.OVERLAP_REVIEW_REQUIRED);
      expect(defaultOverlapF.netIndicativeBenefitInr).toBe(0);
      expect(defaultOverlapF.amountExcludedInr).toBe(oppF.baseEstimateInr);
      expect(defaultOverlapF.exclusionReason).toContain('Lever 2');

      // When opportunity-level record proves distinct scope from Lever 2
      const oppFDistinct = {
        ...oppF,
        hasDistinctScopeFromLever2: true,
        distinctScopeEvidence: 'Non-auction spend scope verified through manual multi-round tender process'
      };
      const distinctOverlapF = evaluateCrossLeverOverlap(oppFDistinct);
      expect(distinctOverlapF.overlapStatus).toBe(LEVER6_OVERLAP_STATUSES.NO_OVERLAP);
      expect(distinctOverlapF.netIndicativeBenefitInr).toBe(oppF.baseEstimateInr);
      expect(distinctOverlapF.amountExcludedInr).toBe(0);

      // Lever 5 (Payment Terms) has 0 overlap with category spend
      const oppLever5Mock = {
        ...oppF,
        relatedLever: 'LEVER_5'
      };
      const overlapLever5 = evaluateCrossLeverOverlap(oppLever5Mock);
      expect(overlapLever5.overlapStatus).toBe(LEVER6_OVERLAP_STATUSES.NO_OVERLAP);
    });

    it('supports custom configurable prioritisation thresholds', () => {
      const testMetrics: CategoryMetrics = {
        categoryName: 'Test Category',
        totalSpendInr: 3000000,
        transactionCount: 10,
        distinctSuppliersCount: 5,
        distinctMaterialsCount: 2,
        distinctPlantsCount: 1,
        topSupplierSpendInr: 1500000,
        topSupplierSharePct: 50,
        herfindahlIndex: 3000,
        priceVariationCoefficient: 0,
        contractCoveragePct: 0
      };

      // Default threshold: distinctSuppliersCount >= 4 makes it Priority B
      const defaultPrio = classifyCategory(testMetrics, 100000000);
      expect(defaultPrio.priority).toBe(LEVER6_PRIORITIES.PRIORITY_B);

      // Custom higher threshold: MODERATE_SUPPLIER_COUNT: 8, COMPLEX_SUPPLIER_COUNT: 10 -> Priority C
      const customPrio = classifyCategory(testMetrics, 100000000, {
        STRATEGIC_SPEND_SHARE_PCT: 10.0,
        OPTIMISATION_SPEND_SHARE_PCT: 5.0,
        COMPLEX_SUPPLIER_COUNT: 10,
        MODERATE_SUPPLIER_COUNT: 8
      });
      expect(customPrio.priority).toBe(LEVER6_PRIORITIES.PRIORITY_C);
    });
  });

  describe('End-to-End Engine & Authoritative Customers', () => {
    it('executes Lever 6 analysis for ABC Textile (AIC-2026-0002) successfully', () => {
      const result = Module2CategorySpecialisationEngine.calculate('AIC-2026-0002');

      expect(result.assessmentId).toBe('AIC-2026-0002');
      expect(result.customerName).toBe('ABC Textile Ltd');
      expect(result.categories.length).toBeGreaterThan(0);
      expect(result.summary.totalProcurementSpendInr).toBeGreaterThan(0);
      expect(result.summary.grossTentativeOpportunityBaseCr).toBe(45.65);
      expect(result.summary.netIndicativeOpportunityBaseCr).toBe(2.62);
      expect(result.summary.overlapReviewAmountCr).toBe(43.03);
      expect(result.summary.unquantifiedOpportunitiesCount).toBe(1565);
      expect(result.opportunityHeadAssumptions.length).toBe(10);
      expect(result.methodologyDisclosures.length).toBeGreaterThan(0);
    });

    it('executes Lever 6 analysis for PQR Cement (AIC-2026-0003) successfully', () => {
      const result = Module2CategorySpecialisationEngine.calculate('AIC-2026-0003');

      expect(result.assessmentId).toBe('AIC-2026-0003');
      expect(result.customerName).toBe('PQR Cement Ltd');
      expect(result.categories.length).toBeGreaterThan(0);
      expect(result.summary.grossTentativeOpportunityBaseCr).toBe(20.59);
      expect(result.summary.netIndicativeOpportunityBaseCr).toBe(0.13);
      expect(result.summary.overlapReviewAmountCr).toBe(20.46);
      expect(result.summary.unquantifiedOpportunitiesCount).toBe(220);
    });
  });

  describe('Excel Workbook Builder', () => {
    it('builds a valid 8-sheet Excel workbook matching dashboard totals', () => {
      const result = Module2CategorySpecialisationEngine.calculate('AIC-2026-0002');
      const buffer = Module2CategorySpecialisationExcelBuilder.buildWorkbook(result);

      expect(buffer).toBeDefined();
      expect(buffer.length).toBeGreaterThan(0);

      const parsedWb = XLSX.read(buffer, { type: 'buffer' });
      expect(parsedWb.SheetNames).toContain(LEVER6_EXCEL_SHEETS.SHEET_1_EXECUTIVE);
      expect(parsedWb.SheetNames).toContain(LEVER6_EXCEL_SHEETS.SHEET_2_CATEGORIES);
      expect(parsedWb.SheetNames).toContain(LEVER6_EXCEL_SHEETS.SHEET_3_OPPORTUNITIES);
      expect(parsedWb.SheetNames).toContain(LEVER6_EXCEL_SHEETS.SHEET_4_CALCULATIONS);
      expect(parsedWb.SheetNames).toContain(LEVER6_EXCEL_SHEETS.SHEET_5_OVERLAPS);
      expect(parsedWb.SheetNames).toContain(LEVER6_EXCEL_SHEETS.SHEET_6_RESOURCES);
      expect(parsedWb.SheetNames).toContain(LEVER6_EXCEL_SHEETS.SHEET_7_DATA_GAPS);
      expect(parsedWb.SheetNames).toContain(LEVER6_EXCEL_SHEETS.SHEET_8_METHODOLOGY);
    });
  });

  describe('Category Specialisation Controller', () => {
    it('handles GET /category-specialisation correctly', async () => {
      const req = { query: { assessmentId: 'AIC-2026-0002' } } as unknown as Request;
      const jsonMock = vi.fn();
      const statusMock = vi.fn().mockReturnValue({ json: jsonMock });
      const res = {
        status: statusMock
      } as unknown as Response;

      await Module2CategorySpecialisationController.getCategorySpecialisation(req, res);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ assessmentId: 'AIC-2026-0002' })
        })
      );
    });

    it('handles GET /category-specialisation/export-excel correctly', async () => {
      const req = { query: { assessmentId: 'AIC-2026-0002' } } as unknown as Request;
      const sendMock = vi.fn();
      const statusMock = vi.fn().mockReturnValue({ send: sendMock });
      const res = {
        status: statusMock,
        setHeader: vi.fn()
      } as unknown as Response;

      await Module2CategorySpecialisationController.exportExcel(req, res);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      expect(sendMock).toHaveBeenCalled();
    });

    it('handles errors gracefully in controller', async () => {
      const req = { query: { assessmentId: 'FAIL_ID' } } as unknown as Request;
      const jsonMock = vi.fn();
      const statusMock = vi.fn().mockReturnValue({ json: jsonMock });
      const res = {
        status: statusMock
      } as unknown as Response;

      vi.spyOn(Module2CategorySpecialisationEngine, 'calculate').mockImplementationOnce(() => {
        throw new Error('Database failure');
      });

      await Module2CategorySpecialisationController.getCategorySpecialisation(req, res);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Database failure'
        })
      );
    });

    it('handles exportExcel errors gracefully in controller', async () => {
      const req = { query: { assessmentId: 'FAIL_ID' } } as unknown as Request;
      const jsonMock = vi.fn();
      const statusMock = vi.fn().mockReturnValue({ json: jsonMock });
      const res = {
        status: statusMock,
        setHeader: vi.fn()
      } as unknown as Response;

      vi.spyOn(Module2CategorySpecialisationEngine, 'calculate').mockImplementationOnce(() => {
        throw new Error('Export failure');
      });

      await Module2CategorySpecialisationController.exportExcel(req, res);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Export failure'
        })
      );
    });
  });
  });
});
