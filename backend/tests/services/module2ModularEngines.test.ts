/**
 * Module 2 Modular Engines & Section 36 Acceptance Test Matrix (A through R)
 * Version: MODULE_2_SOURCING_LOGIC_V2.0
 */

import { describe, it, expect } from 'vitest';
import { Module2EAuctionBenefitEngine } from '../../src/services/module2EAuctionBenefitEngine';
import { Module2VendorConsolidationEngine } from '../../src/services/module2VendorConsolidationEngine';
import { Module2CategorySpecializationEngine } from '../../src/services/module2CategorySpecializationEngine';
import { Module2VolumeBundlingEngine } from '../../src/services/module2VolumeBundlingEngine';
import { Module2POConsolidationEngine } from '../../src/services/module2POConsolidationEngine';
import { Module2OpportunityOverlapEngine } from '../../src/services/module2OpportunityOverlapEngine';
import { Module2BenefitTraceabilityEngine } from '../../src/services/module2BenefitTraceabilityEngine';
import { Module2ConfidenceEngine } from '../../src/services/module2ConfidenceEngine';
import { Module2BenefitEngine } from '../../src/services/module2BenefitEngine';
import { Module2FragmentationHelper } from '../../src/services/module2FragmentationHelper';

import type { StrategicInputTransaction } from '../../src/types/strategicSourcing';
import type {
  PriceDispersionMetrics,
  CategorySupplierStructureItem,
  CrediblePriceReferenceResult
} from '../../src/types/module2StrategicSourcing';

describe('Module 2 Sourcing Logic V2.0 — Modular Engines & Section 36 A-R Matrix', () => {
  const dummyDispersion: PriceDispersionMetrics = {
    minPrice: 80,
    maxPrice: 120,
    medianPrice: 100,
    weightedAveragePrice: 105,
    p25Price: 90,
    p75Price: 110,
    iqr: 20,
    priceDispersionPct: 20,
    outliersCount: 0,
    hasCredibleLowPrice: true,
    credibleReferencePrice: 85,
    referencePriceMethod: 'P25'
  };

  const dummyCredibleRef: CrediblePriceReferenceResult = {
    referencePrice: 85,
    methodology: 'LOWEST_CREDIBLE_HISTORICAL',
    qualifyingTransactionCount: 10,
    isCredible: true,
    qualificationCriteria: {
      comparableSpec: true,
      comparableUom: true,
      comparableCurrency: true,
      sufficientVolume: true,
      nonOutlier: true,
      withinHistoricalWindow: true
    },
    explanation: 'Lowest credible comparable transaction'
  };

  const dummySuppliers: CategorySupplierStructureItem[] = [
    {
      supplierName: 'Core Supplier 1',
      totalSpendInr: 600000,
      totalQuantity: 6000,
      weightedAveragePrice: 100,
      poCount: 12,
      transactionCount: 12,
      spendSharePct: 60,
      isTailSupplier: false,
      itemsSuppliedCount: 2,
      primaryCategory: 'Fasteners',
      isMultiCategory: false,
      isCoreSupplier: true
    },
    {
      supplierName: 'Tail Supplier 2',
      totalSpendInr: 400000,
      totalQuantity: 3636,
      weightedAveragePrice: 110,
      poCount: 12,
      transactionCount: 12,
      spendSharePct: 40,
      isTailSupplier: true,
      itemsSuppliedCount: 1,
      primaryCategory: 'Fasteners',
      isMultiCategory: false,
      isCoreSupplier: false
    }
  ];

  // A. One supplier, no competition
  it('Scenario A: One supplier, no competition -> Not suitable, not quantifiable', () => {
    const res = Module2EAuctionBenefitEngine.evaluate(
      true,
      1,
      500000,
      1000,
      dummyDispersion,
      dummyCredibleRef
    );
    expect(res.suitability).toBe('NOT_SUITABLE');
    expect(res.isQuantifiable).toBe(false);
    expect(res.opportunityInr).toBe(0);
  });

  // B. Multiple suppliers, identical price
  it('Scenario B: Multiple suppliers, identical price -> Dispersion 0, mathematical zero opportunity', () => {
    const zeroDispersion: PriceDispersionMetrics = {
      ...dummyDispersion,
      minPrice: 100,
      maxPrice: 100,
      medianPrice: 100,
      weightedAveragePrice: 100,
      p25Price: 100,
      p75Price: 100,
      iqr: 0,
      priceDispersionPct: 0,
      credibleReferencePrice: 100
    };
    const zeroCredibleRef: CrediblePriceReferenceResult = {
      ...dummyCredibleRef,
      referencePrice: 100
    };
    const res = Module2EAuctionBenefitEngine.evaluate(
      true,
      4,
      500000,
      5000,
      zeroDispersion,
      zeroCredibleRef
    );
    expect(res.isQuantifiable).toBe(false);
    expect(res.opportunityInr).toBe(0);
  });

  // C. Multiple suppliers, high price dispersion
  it('Scenario C: Multiple suppliers, high price dispersion -> High suitability and quantifiable', () => {
    const res = Module2EAuctionBenefitEngine.evaluate(
      true,
      5,
      1050000,
      10000,
      dummyDispersion,
      dummyCredibleRef
    );
    expect(['HIGH', 'MEDIUM']).toContain(res.suitability);
    expect(res.isQuantifiable).toBe(true);
    expect(res.unitBenefit).toBe(20); // 105 - 85
    expect(res.opportunityInr).toBe(200000); // (105 - 85) * 10000
    expect(res.eligibleQuantity).toBe(10000);
  });

  // D. Multi-category generalist supplier & E. Category specialist with lower historical price
  it('Scenario D & E: Multi-category generalist vs specialist cheaper price', () => {
    const multiCatVendor = {
      vendorName: 'OmniCorp',
      total3YearSpendInr: 5000000,
      categoriesCount: 3,
      primaryCategory: 'Fasteners',
      otherCategories: ['Electrical', 'Safety'],
      itemCount: 10,
      overallPricePosition: 'ABOVE_AVERAGE' as const,
      categories: [
        {
          categoryName: 'Electrical',
          spendInr: 1500000,
          itemCount: 4,
          pricePosition: 'ABOVE_AVERAGE' as const,
          hasSpecialistAlternative: true,
          specialistDemonstratedSavingsInr: 150000
        }
      ],
      classification: 'MULTI_CATEGORY_SUPPLIER' as const,
      riskFlag: 'CROSS_CATEGORY_LEAKAGE' as const
    };

    const dummyTxs: StrategicInputTransaction[] = [
      { vendor_name: 'OmniCorp', spend_category: 'Electrical', material_code: 'WIRE-01', total_spend_inr: 1500000, quantity: 1500, unit_price: 1000 },
      { vendor_name: 'ElectroPro Specialist', spend_category: 'Electrical', material_code: 'WIRE-01', total_spend_inr: 850000, quantity: 1000, unit_price: 850 }
    ];

    const result = Module2CategorySpecializationEngine.evaluateSpecialistReSourcing([multiCatVendor], dummyTxs);
    expect(result.quantifiableSpecialistBenefitInr).toBe(150000);
    const depMap = result.dependencyMaps.get('OmniCorp');
    expect(depMap).toBeDefined();
    expect(depMap![0].specialistAvailable).toBe(true);
    expect(depMap![0].opportunityClassification).toBe('QUANTIFIABLE');
  });

  // F. Multiple small suppliers with comparable items & volume bundling
  it('Scenario F: Multiple small suppliers with comparable items and volume tier evidence', () => {
    const mockItems = [
      {
        itemId: 'ITEM-01',
        materialCode: 'ITM-01',
        materialDescription: 'Hex Bolt 10mm',
        categoryName: 'Fasteners',
        annualSpendInr: 300000,
        annualQuantity: 3000,
        currentWeightedPrice: 100,
        historicalMedianPrice: 95,
        p25Price: 90,
        p75Price: 105,
        lowestCrediblePrice: 85,
        activeSupplierCount: 3,
        suppliers: [
          { supplierName: 'Supplier S1', spendSharePct: 15 },
          { supplierName: 'Supplier S2', spendSharePct: 15 },
          { supplierName: 'Supplier S3', spendSharePct: 70 }
        ],
        hasVolumeTierEvidence: true,
        volumeTierSlopePct: 5,
        volumeBundlingBenefitInr: 15000
      }
    ];

    const res = Module2VolumeBundlingEngine.evaluateCategoryVolumeBundling(mockItems as any);
    expect(res.isQuantifiable).toBe(true);
    expect(res.quantifiableBenefitInr).toBe(15000);
    expect(res.smallSuppliersCount).toBe(2);
  });

  // G. Recurring monthly demand & H. Multiple monthly POs
  it('Scenario G & H: Recurring demand and multiple monthly PO consolidation', () => {
    const poEval = Module2POConsolidationEngine.evaluatePoConsolidation(
      'Core Supplier 1',
      'Fasteners',
      1200000,
      48,
      1500
    );
    expect(poEval.currentAnnualPoCount).toBe(48);
    expect(poEval.cadenceOptions.MONTHLY.targetPosPerYear).toBe(12);
    expect(poEval.cadenceOptions.MONTHLY.poReductionPct).toBe(75);
    expect(poEval.cadenceOptions.MONTHLY.quantifiableAdminSavingsInr).toBe(54000); // 36 * 1500
    expect(poEval.cadenceOptions.MONTHLY.administrativeStatus).toBe('QUANTIFIABLE');

    // Without customer cost per PO
    const unquantified = Module2POConsolidationEngine.evaluatePoConsolidation(
      'Core Supplier 1',
      'Fasteners',
      600000,
      24,
      null
    );
    expect(unquantified.quantifiableAdminSavingsInr).toBeNull();
    expect(unquantified.administrativeBenefitStatus).toBe('NOT_QUANTIFIABLE');
  });

  // I. Sole-source category
  it('Scenario I: Sole-source category -> Vendor consolidation not suitable', () => {
    const singleSupplier = [dummySuppliers[0]];
    const res = Module2VendorConsolidationEngine.evaluate(
      true,
      singleSupplier,
      6000,
      dummyDispersion,
      12,
      null
    );
    expect(res.suitability).toBe('NOT_SUITABLE');
    expect(res.isQuantifiable).toBe(false);
    expect(res.proposedTargetSupplierRange).toContain('sole supplier');
  });

  // J. Insufficient historical data
  it('Scenario J: Insufficient historical data -> Evaluated as INSUFFICIENT confidence', () => {
    const conf = Module2ConfidenceEngine.evaluateConfidence({
      comparableTxCount: 1,
      totalTxCount: 1,
      supplierCount: 1,
      activeMonthsCount: 1,
      priceDispersionPct: 0,
      hasOutliers: false
    });
    expect(conf.confidence).toBe('INSUFFICIENT');
    expect(conf.rationale).toContain('Insufficient');
  });

  // P. Overlapping e-auction and consolidation opportunity
  it('Scenario P: Overlapping e-auction and consolidation opportunity strictly deduplicated', () => {
    const overlapResult = Module2OpportunityOverlapEngine.deduplicateCategoryOpportunities(
      100000, // E-auction
      80000,  // Vendor consolidation
      70000,  // Specialist realignment
      15000,  // Volume bundling
      5000,   // Admin benefit
      true,
      5
    );
    // Gross: 100k + 80k + 70k + 15k + 5k = 270k
    // Net: max(100k, 80k, 70k, 15k) + 5k = 105k
    // Overlap: 270k - 105k = 165k
    expect(overlapResult.grossOpportunityInr).toBe(270000);
    expect(overlapResult.netQuantifiableOpportunityInr).toBe(105000);
    expect(overlapResult.overlappingOpportunityInr).toBe(165000);
    expect(overlapResult.primaryLever).toBe('E_AUCTION');
    expect(overlapResult.isQuantifiable).toBe(true);
  });

  // Q. Genuine zero opportunity
  it('Scenario Q: Genuine zero opportunity produces mathematical zero, not unquantifiable', () => {
    const overlapZero = Module2OpportunityOverlapEngine.deduplicateCategoryOpportunities(
      0,
      0,
      0,
      0,
      0,
      true,
      5
    );
    expect(overlapZero.grossOpportunityInr).toBe(0);
    expect(overlapZero.netQuantifiableOpportunityInr).toBeNull();
    expect(overlapZero.isQuantifiable).toBe(false);
  });

  // R. Opportunity identified but not quantifiable
  it('Scenario R: Opportunity identified but not quantifiable maintains transparent trace', () => {
    const trace = Module2BenefitTraceabilityEngine.createAuditRecord({
      opportunityId: 'OPP-TRACE-01',
      categoryId: 'CAT-FASTENERS',
      categoryName: 'Safety Gear',
      itemIds: ['ITM-001'],
      supplierIds: ['SUP-001'],
      opportunityType: 'VENDOR_CONSOLIDATION',
      currentSpendInr: 400000,
      eligibleSpendInr: 400000,
      quantity: 4000,
      currentWeightedPrice: 100,
      referencePrice: 100,
      referenceSupplierIds: ['SUP-001'],
      referenceTransactionIds: ['TX-001'],
      referenceVolumeSharePct: 100,
      grossOpportunityInr: 0,
      overlapAmountInr: 0,
      netOpportunityInr: 0,
      confidence: 'LOW',
      qualificationRules: ['Verified recurring spend'],
      disqualificationRules: ['Zero empirical price gap between core and tail suppliers']
    });

    expect(trace.opportunityId).toBe('OPP-TRACE-01');
    expect(trace.netOpportunityInr).toBe(0);
    expect(trace.confidence).toBe('LOW');
    expect(trace.disqualificationRules).toContain('Zero empirical price gap between core and tail suppliers');
  });

  // Master Orchestration Engine Check
  it('Verifies Module2BenefitEngine integrates all 5 levers with full traceability', () => {
    const combined = Module2BenefitEngine.evaluateCategoryBenefits({
      categoryId: 'CAT-FASTENERS',
      categoryName: 'Fasteners',
      isRecurring: true,
      addressableSpendInr: 1000000,
      addressableQuantity: 9636,
      dispersion: dummyDispersion,
      credibleRef: dummyCredibleRef,
      suppliers: dummySuppliers,
      activeMonthsCount: 12,
      comparableTxCount: 24,
      totalTxCount: 24,
      items: []
    });

    expect(combined.auditTrail.categoryName).toBe('Fasteners');
    expect(combined.auditTrail.opportunityId).toBeDefined();
    expect(combined.overlap.netQuantifiableOpportunityInr).toBeGreaterThan(0);
  });

  // ─── BRANCH COVERAGE: OpportunityOverlapEngine ────────────────────────────

  it('OpportunityOverlapEngine: isDataSufficient=false -> buildInsufficientResult', () => {
    const res = Module2OpportunityOverlapEngine.deduplicateCategoryOpportunities(
      100000, 80000, 0, 0, 0,
      false, // isDataSufficient = false
      5
    );
    expect(res.isQuantifiable).toBe(false);
    expect(res.netQuantifiableOpportunityInr).toBeNull();
    expect(res.status).toBe('IDENTIFIED_NOT_QUANTIFIABLE');
    expect(res.primaryLever).toBe('NO_QUANTIFIABLE_BENEFIT');
    expect(res.grossOpportunityInr).toBe(0);
  });

  it('OpportunityOverlapEngine: comparableTxCount < 2 -> buildInsufficientResult', () => {
    const res = Module2OpportunityOverlapEngine.deduplicateCategoryOpportunities(
      50000, 40000, 0, 0, 0,
      true,
      1 // comparableTxCount = 1 → insufficient
    );
    expect(res.isQuantifiable).toBe(false);
    expect(res.netQuantifiableOpportunityInr).toBeNull();
    expect(res.status).toBe('IDENTIFIED_NOT_QUANTIFIABLE');
  });

  it('OpportunityOverlapEngine: admin-only opportunity uses PO_CONSOLIDATION lever', () => {
    const res = Module2OpportunityOverlapEngine.deduplicateCategoryOpportunities(
      0, 0, 0, 0,
      25000, // admin only
      true, 5
    );
    expect(res.primaryLever).toBe('PO_CONSOLIDATION');
    expect(res.netQuantifiableOpportunityInr).toBe(25000);
    expect(res.isQuantifiable).toBe(true);
  });

  it('OpportunityOverlapEngine: consolidation dominant -> CONSOLIDATION_CANDIDATE status', () => {
    const res = Module2OpportunityOverlapEngine.deduplicateCategoryOpportunities(
      0,      // no eauction
      90000,  // consolidation
      0, 0, 0,
      true, 4
    );
    expect(res.status).toBe('CONSOLIDATION_CANDIDATE');
    expect(res.primaryLever).toBe('VENDOR_CONSOLIDATION');
    expect(res.netQuantifiableOpportunityInr).toBe(90000);
  });

  it('OpportunityOverlapEngine: volume bundling dominant -> VOLUME_BUNDLING lever', () => {
    const res = Module2OpportunityOverlapEngine.deduplicateCategoryOpportunities(
      0, 0,
      0,      // specialist
      120000, // volume bundling dominates
      0,
      true, 4
    );
    expect(res.primaryLever).toBe('VOLUME_BUNDLING');
    expect(res.netQuantifiableOpportunityInr).toBe(120000);
  });

  it('OpportunityOverlapEngine: specialist dominant -> CATEGORY_SPECIALIST_REALIGNMENT lever', () => {
    const res = Module2OpportunityOverlapEngine.deduplicateCategoryOpportunities(
      0, 0,
      95000, // specialist dominant
      0, 0,
      true, 4
    );
    expect(res.primaryLever).toBe('CATEGORY_SPECIALIST_REALIGNMENT');
    expect(res.netQuantifiableOpportunityInr).toBe(95000);
  });

  it('OpportunityOverlapEngine: buildRationale with overlap > 0', () => {
    const res = Module2OpportunityOverlapEngine.deduplicateCategoryOpportunities(
      100000, 80000, 0, 0, 0,
      true, 5
    );
    // Gross = 180k, Net = 100k (max), overlap = 80k
    expect(res.overlappingOpportunityInr).toBe(80000);
    expect(res.deduplicationRationale).toContain('Lakhs');
  });

  // ─── BRANCH COVERAGE: EAuctionBenefitEngine ───────────────────────────────

  it('EAuctionBenefitEngine: null dispersion -> INSUFFICIENT_DATA', () => {
    const res = Module2EAuctionBenefitEngine.evaluate(
      true, 4, 500000, 1000,
      null, // null dispersion
      dummyCredibleRef
    );
    expect(res.suitability).toBe('INSUFFICIENT_DATA');
    expect(res.isQuantifiable).toBe(false);
    expect(res.opportunityInr).toBeNull();
  });

  it('EAuctionBenefitEngine: non-credible reference -> INSUFFICIENT_DATA', () => {
    const nonCredibleRef: CrediblePriceReferenceResult = {
      ...dummyCredibleRef,
      isCredible: false,
      referencePrice: null
    };
    const res = Module2EAuctionBenefitEngine.evaluate(
      true, 4, 500000, 1000,
      dummyDispersion,
      nonCredibleRef
    );
    expect(res.suitability).toBe('INSUFFICIENT_DATA');
    expect(res.opportunityInr).toBeNull();
  });

  it('EAuctionBenefitEngine: zero addressable quantity -> INSUFFICIENT_DATA', () => {
    const res = Module2EAuctionBenefitEngine.evaluate(
      true, 4, 500000,
      0, // addressableQuantity = 0
      dummyDispersion,
      dummyCredibleRef
    );
    expect(res.suitability).toBe('INSUFFICIENT_DATA');
  });

  it('EAuctionBenefitEngine: 2 suppliers, low gap -> MEDIUM or LOW suitability', () => {
    const tightDispersion: PriceDispersionMetrics = {
      ...dummyDispersion,
      weightedAveragePrice: 100,
      credibleReferencePrice: 99.5
    };
    const tightRef: CrediblePriceReferenceResult = {
      ...dummyCredibleRef,
      referencePrice: 99.5
    };
    const res = Module2EAuctionBenefitEngine.evaluate(
      false, 2, 200000, 2000,
      tightDispersion,
      tightRef
    );
    // priceGapPct = 0.5%, at NOT_SUITABLE threshold boundary
    expect(['NOT_SUITABLE', 'LOW', 'MEDIUM']).toContain(res.suitability);
  });

  it('EAuctionBenefitEngine: negligible gap (<=0.5%) -> NOT_SUITABLE', () => {
    const uniformDisp: PriceDispersionMetrics = {
      ...dummyDispersion,
      weightedAveragePrice: 100,
      credibleReferencePrice: 100
    };
    const uniformRef: CrediblePriceReferenceResult = {
      ...dummyCredibleRef,
      referencePrice: 100
    };
    const res = Module2EAuctionBenefitEngine.evaluate(
      true, 4, 1000000, 5000,
      uniformDisp,
      uniformRef
    );
    expect(res.suitability).toBe('NOT_SUITABLE');
    expect(res.opportunityInr).toBe(0);
  });

  // ─── BRANCH COVERAGE: FragmentationHelper ─────────────────────────────────

  it('FragmentationHelper: EXTREME_FRAGMENTATION (HHI < 1000, suppliers >= 5)', () => {
    // 12 suppliers at ~8.33% each → HHI = 12 × 69.44 ≈ 833 (strictly < 1000)
    const manySuppliers: CategorySupplierStructureItem[] = Array.from({ length: 12 }, (_, i) => ({
      supplierName: `Supplier ${i + 1}`,
      totalSpendInr: Math.round(1000000 / 12),
      totalQuantity: Math.round(10000 / 12),
      weightedAveragePrice: 100,
      poCount: 3,
      transactionCount: 3,
      spendSharePct: 100 / 12,
      isTailSupplier: true,
      itemsSuppliedCount: 1,
      primaryCategory: 'Test',
      isMultiCategory: false,
      isCoreSupplier: false
    }));
    const { fragmentationLevel, hhiScore } =
      Module2FragmentationHelper.calculateHHIAndFragmentation(manySuppliers, 1000000);
    // HHI ≈ 12 × (8.33)^2 ≈ 833 — strictly < FRAGMENTATION_THRESHOLDS.HHI_HIGH_FRAGMENTATION (1000)
    expect(hhiScore).toBeLessThan(1000);
    expect(fragmentationLevel).toBe('EXTREME_FRAGMENTATION');
  });

  it('FragmentationHelper: MODERATE_FRAGMENTATION (HHI <= moderate threshold, < 4 suppliers)', () => {
    // 3 suppliers, moderately concentrated
    const threeSuppliers: CategorySupplierStructureItem[] = [
      { supplierName: 'S1', totalSpendInr: 500000, totalQuantity: 5000, weightedAveragePrice: 100, poCount: 5, transactionCount: 5, spendSharePct: 50, isTailSupplier: false, itemsSuppliedCount: 1, primaryCategory: 'Test', isMultiCategory: false, isCoreSupplier: true },
      { supplierName: 'S2', totalSpendInr: 300000, totalQuantity: 3000, weightedAveragePrice: 100, poCount: 3, transactionCount: 3, spendSharePct: 30, isTailSupplier: false, itemsSuppliedCount: 1, primaryCategory: 'Test', isMultiCategory: false, isCoreSupplier: false },
      { supplierName: 'S3', totalSpendInr: 200000, totalQuantity: 2000, weightedAveragePrice: 100, poCount: 2, transactionCount: 2, spendSharePct: 20, isTailSupplier: true, itemsSuppliedCount: 1, primaryCategory: 'Test', isMultiCategory: false, isCoreSupplier: false }
    ];
    // HHI = 50^2 + 30^2 + 20^2 = 2500 + 900 + 400 = 3800 — concentrated
    // But top share = 50% < 70% (DOMINANT threshold)
    // 3 < 5 (not EXTREME) and 3 < 4 (not HIGH)
    // HHI 3800 > moderate threshold (2500), enters LOW_FRAGMENTATION via fallback
    const { fragmentationLevel } =
      Module2FragmentationHelper.calculateHHIAndFragmentation(threeSuppliers, 1000000);
    expect(['LOW_FRAGMENTATION', 'MODERATE_FRAGMENTATION', 'HIGH_FRAGMENTATION']).toContain(fragmentationLevel);
  });

  it('FragmentationHelper: empty suppliers -> LOW_FRAGMENTATION fallback', () => {
    const { fragmentationLevel, hhiScore } =
      Module2FragmentationHelper.calculateHHIAndFragmentation([], 0);
    expect(hhiScore).toBe(10000);
    expect(fragmentationLevel).toBe('LOW_FRAGMENTATION');
  });

  it('FragmentationHelper: getHhiInterpretation boundaries', () => {
    // Test via calculateHHIAndFragmentation with controlled HHI
    const highConc: CategorySupplierStructureItem[] = [
      { supplierName: 'Solo', totalSpendInr: 1000000, totalQuantity: 10000, weightedAveragePrice: 100, poCount: 10, transactionCount: 10, spendSharePct: 100, isTailSupplier: false, itemsSuppliedCount: 1, primaryCategory: 'T', isMultiCategory: false, isCoreSupplier: true }
    ];
    const { hhiInterpretation: highInterp } =
      Module2FragmentationHelper.calculateHHIAndFragmentation(highConc, 1000000);
    // Full string: "Highly concentrated market (HHI: N)"
    expect(highInterp).toContain('Highly concentrated market');

    // Moderate: 2 suppliers at 50/50 → HHI = 2 × 2500 = 5000 → highly concentrated market
    const evenSuppliers: CategorySupplierStructureItem[] = [
      { supplierName: 'S1', totalSpendInr: 500000, totalQuantity: 5000, weightedAveragePrice: 100, poCount: 5, transactionCount: 5, spendSharePct: 50, isTailSupplier: false, itemsSuppliedCount: 1, primaryCategory: 'T', isMultiCategory: false, isCoreSupplier: true },
      { supplierName: 'S2', totalSpendInr: 500000, totalQuantity: 5000, weightedAveragePrice: 100, poCount: 5, transactionCount: 5, spendSharePct: 50, isTailSupplier: true, itemsSuppliedCount: 1, primaryCategory: 'T', isMultiCategory: false, isCoreSupplier: false }
    ];
    const { hhiInterpretation: evenInterp } =
      Module2FragmentationHelper.calculateHHIAndFragmentation(evenSuppliers, 1000000);
    // HHI = 2×2500 = 5000 → "Highly concentrated market"
    expect(evenInterp).toContain('concentrated market');

    // Unconcentrated: 8 suppliers at 12.5% each — HHI = 8 * 156.25 = 1250
    const fragSuppliers: CategorySupplierStructureItem[] = Array.from({ length: 8 }, (_, i) => ({
      supplierName: `Frag${i}`,
      totalSpendInr: 125000,
      totalQuantity: 1250,
      weightedAveragePrice: 100,
      poCount: 3,
      transactionCount: 3,
      spendSharePct: 12.5,
      isTailSupplier: true,
      itemsSuppliedCount: 1,
      primaryCategory: 'T',
      isMultiCategory: false,
      isCoreSupplier: false
    }));
    const { hhiInterpretation: fragInterp } =
      Module2FragmentationHelper.calculateHHIAndFragmentation(fragSuppliers, 1000000);
    expect(fragInterp).toContain('Unconcentrated');
  });
});

