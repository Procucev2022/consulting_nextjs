/**
 * Unit & Acceptance Tests for Module 2 Opportunity Intelligence V2.0
 * Tests cover:
 * 1. Market Discovery Engine (Single supplier, duopoly, dependency, price transparency)
 * 2. Commercial Excellence Engine (12 dimensions, non-monetary structural potential)
 * 3. Procurement Maturity Engine (10 diagnostic dimensions, weakness/strength sorting)
 * 4. Opportunity Evidence Engine (6 evidence states, 2D model, non-parametric range)
 * 5. Action Recommendation Engine (5-pillar analysis, prioritized actions)
 * 6. Opportunity Intelligence Helper (end-to-end integration)
 * 7. Waterfall V2 Builder (13 stages, zero double-counting)
 */

import { describe, it, expect } from 'vitest';
import { Module2MarketDiscoveryEngine } from '../../src/services/module2MarketDiscoveryEngine';
import { Module2CommercialExcellenceEngine } from '../../src/services/module2CommercialExcellenceEngine';
import { Module2ProcurementMaturityEngine } from '../../src/services/module2ProcurementMaturityEngine';
import { Module2OpportunityEvidenceEngine } from '../../src/services/module2OpportunityEvidenceEngine';
import { Module2ActionRecommendationEngine } from '../../src/services/module2ActionRecommendationEngine';
import { Module2OpportunityIntelligenceHelper } from '../../src/services/module2OpportunityIntelligenceHelper';
import { Module2WaterfallBuilder } from '../../src/services/module2WaterfallBuilder';
import type { CategorySupplierStructureItem, PriceDispersionMetrics } from '../../src/types/module2StrategicSourcing';

describe('Module 2 Opportunity Intelligence V2.0 Engine Suite', () => {
  const mockSuppliers: CategorySupplierStructureItem[] = [
    {
      supplierId: 'SUPP-1',
      supplierName: 'Alpha Core Supplier',
      totalSpendInr: 8000000,
      totalSpendInrCr: 0.8,
      spendSharePct: 75.0,
      transactionCount: 20,
      transactionSharePct: 50.0,
      totalQuantity: 10000,
      weightedAveragePrice: 800,
      minPrice: 750,
      maxPrice: 850,
      rank: 1,
      isTopSupplier: true,
      isTailSupplier: false,
      pricePositionVsComparable: 'BELOW_AVERAGE',
      potentialConsolidationRelevance: 'Core supplier candidate'
    },
    {
      supplierId: 'SUPP-2',
      supplierName: 'Beta Tail Supplier',
      totalSpendInr: 2000000,
      totalSpendInrCr: 0.2,
      spendSharePct: 20.0,
      transactionCount: 15,
      transactionSharePct: 37.5,
      totalQuantity: 2000,
      weightedAveragePrice: 1000,
      minPrice: 950,
      maxPrice: 1050,
      rank: 2,
      isTopSupplier: false,
      isTailSupplier: true,
      pricePositionVsComparable: 'ABOVE_AVERAGE',
      potentialConsolidationRelevance: 'Consolidation exit candidate'
    },
    {
      supplierId: 'SUPP-3',
      supplierName: 'Gamma Spot Vendor',
      totalSpendInr: 500000,
      totalSpendInrCr: 0.05,
      spendSharePct: 5.0,
      transactionCount: 5,
      transactionSharePct: 12.5,
      totalQuantity: 500,
      weightedAveragePrice: 1000,
      minPrice: 900,
      maxPrice: 1100,
      rank: 3,
      isTopSupplier: false,
      isTailSupplier: true,
      pricePositionVsComparable: 'ABOVE_AVERAGE',
      potentialConsolidationRelevance: 'Spot vendor exit candidate'
    }
  ];

  const mockDispersion: PriceDispersionMetrics = {
    totalQuantity: 12500,
    totalSpendInr: 10500000,
    weightedAveragePrice: 840,
    simpleAveragePrice: 933.33,
    medianPrice: 850,
    minPrice: 750,
    maxPrice: 1100,
    p10Price: 760,
    p25Price: 790,
    p50Price: 850,
    p75Price: 980,
    p90Price: 1050,
    priceDispersionInr: 350,
    priceDispersionPct: 41.67,
    volumeAboveP25Pct: 60.0,
    dispersionInterpretation: 'Substantial price dispersion observed across material lines.'
  };

  describe('Module2MarketDiscoveryEngine', () => {
    it('should trigger single supplier lock-in when category has only 1 supplier', () => {
      const assessment = Module2MarketDiscoveryEngine.evaluateMarketDiscovery({
        suppliers: [mockSuppliers[0]],
        totalSpendInr: 8000000,
        isRecurring: true,
        activeMonthsCount: 12,
        priceDispersion: null,
        confidence: 'HIGH'
      });

      expect(assessment.isMarketDiscoveryRequired).toBe(true);
      expect(assessment.discoveryStatus).toBe('MARKET_DISCOVERY_REQUIRED');
      expect(assessment.recommendedSourcingVehicle).toBe('RUN_COMPETITIVE_RFQ');
      expect(assessment.triggers.some(t => t.triggerKey === 'SINGLE_SUPPLIER_LOCK_IN')).toBe(true);
    });

    it('should trigger duopoly and high dependency when 2 suppliers and top supplier > 70%', () => {
      const assessment = Module2MarketDiscoveryEngine.evaluateMarketDiscovery({
        suppliers: [mockSuppliers[0], mockSuppliers[1]],
        totalSpendInr: 10000000,
        isRecurring: true,
        activeMonthsCount: 10,
        priceDispersion: mockDispersion,
        confidence: 'HIGH'
      });

      expect(assessment.isMarketDiscoveryRequired).toBe(true);
      expect(assessment.triggers.some(t => t.triggerKey === 'DUOPOLY_LIMITED_COMPETITION')).toBe(true);
      expect(assessment.triggers.some(t => t.triggerKey === 'HIGH_SUPPLIER_DEPENDENCY')).toBe(true);
      expect(assessment.triggers.some(t => t.triggerKey === 'HIGH_RECURRING_MATERIALITY')).toBe(true);
    });

    it('should return sufficient internal evidence when competition is healthy and variance exists', () => {
      const balancedSuppliers: CategorySupplierStructureItem[] = [
        { ...mockSuppliers[0], spendSharePct: 35.0 },
        { ...mockSuppliers[1], spendSharePct: 35.0 },
        { ...mockSuppliers[2], spendSharePct: 30.0 }
      ];

      const assessment = Module2MarketDiscoveryEngine.evaluateMarketDiscovery({
        suppliers: balancedSuppliers,
        totalSpendInr: 3000000, // < 50L
        isRecurring: false,
        activeMonthsCount: 4,
        priceDispersion: mockDispersion,
        confidence: 'HIGH'
      });

      expect(assessment.isMarketDiscoveryRequired).toBe(false);
      expect(assessment.discoveryStatus).toBe('SUFFICIENT_INTERNAL_EVIDENCE');
      expect(assessment.recommendedSourcingVehicle).toBe('RUN_E_AUCTION');
    });
  });

  describe('Module2CommercialExcellenceEngine', () => {
    it('should analyze 12 commercial dimensions with non-monetary structural potential', () => {
      const profile = Module2CommercialExcellenceEngine.analyzeCategory({
        totalSpendInr: 10500000,
        supplierCount: 3,
        activeMonthsCount: 12,
        isRecurring: true,
        confidence: 'HIGH'
      });

      expect(profile.dimensions).toHaveLength(12);
      expect(profile.opportunityIdentifiedCount).toBeGreaterThanOrEqual(4);
      expect(profile.dimensions.every(d => d.isQuantifiable === false)).toBe(true);
      expect(profile.dimensions.every(d => d.estimatedBenefitInr === null)).toBe(true);
      expect(profile.keyFindings.length).toBeGreaterThan(0);
      expect(profile.strategicActionSummary).toContain('payment terms');
    });
  });

  describe('Module2ProcurementMaturityEngine', () => {
    it('should evaluate 10 diagnostic dimensions and rank weaknesses and strengths', () => {
      const result = Module2ProcurementMaturityEngine.evaluateMaturity({
        totalSpendInr: 10500000,
        supplierCount: 3,
        suppliers: mockSuppliers,
        fragmentationLevel: 'MODERATE_FRAGMENTATION',
        priceDispersion: mockDispersion,
        isRecurring: true,
        activeMonthsCount: 12,
        comparableTxCount: 35,
        totalTxCount: 40,
        confidence: 'HIGH'
      });

      expect(result.dimensions).toHaveLength(10);
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(result.topWeaknesses).toHaveLength(3);
      expect(result.topStrengths).toHaveLength(3);
      expect(result.topWeaknesses[0].score).toBeLessThanOrEqual(result.topStrengths[0].score);
      expect(result.diagnosticSummary).toContain('Overall Procurement Maturity assessed at');
    });
  });

  describe('Module2OpportunityEvidenceEngine', () => {
    it('should resolve PROVEN_OPPORTUNITY when price and net opp are verified', () => {
      const state = Module2OpportunityEvidenceEngine.resolveEvidenceState({
        provenPriceOppInr: 500000,
        volumeBundlingOppInr: 0,
        eauctionOppInr: 500000,
        consolidationOppInr: 200000,
        specialistOppInr: 0,
        netOppInr: 500000,
        isMarketDiscoveryRequired: false,
        suppliers: mockSuppliers,
        dispersion: mockDispersion,
        confidence: 'HIGH',
        comparableTxCount: 40
      });
      expect(state).toBe('PROVEN_OPPORTUNITY');
    });

    it('should resolve QUANTIFIABLE_OPPORTUNITY_RANGE when quartile dispersion exists', () => {
      const state = Module2OpportunityEvidenceEngine.resolveEvidenceState({
        provenPriceOppInr: 0,
        volumeBundlingOppInr: 0,
        eauctionOppInr: 0,
        consolidationOppInr: 0,
        specialistOppInr: 0,
        netOppInr: 0,
        isMarketDiscoveryRequired: false,
        suppliers: mockSuppliers,
        dispersion: mockDispersion,
        confidence: 'MEDIUM',
        comparableTxCount: 20
      });
      expect(state).toBe('QUANTIFIABLE_OPPORTUNITY_RANGE');
    });

    it('should calculate non-parametric opportunity range without arbitrary percentages', () => {
      const range = Module2OpportunityEvidenceEngine.calculateOpportunityRange(10000, mockDispersion);
      expect(range.rangeMinInr).not.toBeNull();
      expect(range.rangeMaxInr).not.toBeNull();
      expect(range.rangeMaxInr!).toBeGreaterThan(range.rangeMinInr!);
      expect(range.rangeMethodology).toContain('NON_PARAMETRIC_QUARTILE_DISPERSION');
    });

    it('should generate two-dimensional opportunity assessments across 6 levers', () => {
      const assessments = Module2OpportunityEvidenceEngine.buildTwoDimensionalAssessments(
        {
          provenPriceOppInr: 400000,
          volumeBundlingOppInr: 100000,
          eauctionOppInr: 400000,
          consolidationOppInr: 250000,
          specialistOppInr: 0,
          netOppInr: 450000,
          isMarketDiscoveryRequired: true,
          suppliers: mockSuppliers,
          dispersion: mockDispersion,
          confidence: 'HIGH',
          comparableTxCount: 40
        },
        'PROVEN_OPPORTUNITY'
      );

      expect(assessments).toHaveLength(6);
      expect(assessments[0].dimensionKey).toBe('PRICE_OPPORTUNITY');
      expect(assessments[0].potentialValue).toBe('PROVEN');
      expect(assessments[5].dimensionKey).toBe('COMMERCIAL_EXCELLENCE');
      expect(assessments[5].potentialValue).toBe('NOT_QUANTIFIABLE');
    });
  });

  describe('Module2ActionRecommendationEngine', () => {
    it('should generate actionable procurement roadmaps and priority', () => {
      const marketDiscovery = Module2MarketDiscoveryEngine.evaluateMarketDiscovery({
        suppliers: mockSuppliers,
        totalSpendInr: 10500000,
        isRecurring: true,
        activeMonthsCount: 12,
        priceDispersion: mockDispersion,
        confidence: 'HIGH'
      });

      const recommendation = Module2ActionRecommendationEngine.generateRecommendation({
        categoryName: 'Industrial Fasteners',
        totalSpendInr: 10500000,
        activeSuppliersCount: 3,
        suppliers: mockSuppliers,
        fragmentationLevel: 'MODERATE_FRAGMENTATION',
        priceDispersion: mockDispersion,
        provenOpportunityInr: 600000,
        rangeMinInr: 400000,
        rangeMaxInr: 800000,
        marketDiscovery,
        evidenceState: 'PROVEN_OPPORTUNITY',
        confidence: 'HIGH'
      });

      expect(recommendation.whatWeFound).toContain('Industrial Fasteners');
      expect(recommendation.whatWeCanQuantify).toContain('Proven historical price opportunity');
      expect(recommendation.whatProcurementShouldDoNext.length).toBeGreaterThan(0);
      expect(recommendation.priorityLevel).toBe('CRITICAL');
    });
  });

  describe('Module2OpportunityIntelligenceHelper & Waterfall V2', () => {
    it('should build complete category intelligence and 13-stage waterfall', () => {
      const result = Module2OpportunityIntelligenceHelper.buildIntelligence({
        categoryName: 'Precision Bearings',
        totalSpendInr: 12000000,
        addressableSpendInr: 10000000,
        comparableSpendInr: 9500000,
        addressableQuantity: 5000,
        suppliers: mockSuppliers,
        fragmentationLevel: 'HIGH_FRAGMENTATION',
        priceDispersion: mockDispersion,
        isRecurring: true,
        activeMonthsCount: 12,
        comparableTxCount: 45,
        totalTxCount: 50,
        confidence: 'HIGH',
        eauctionOppInr: 500000,
        consolidationOppInr: 300000,
        volumeBundlingOppInr: 150000,
        specialistOppInr: 100000,
        overlapOppInr: 200000,
        netOppInr: 850000
      });

      expect(result.evidenceState).toBe('PROVEN_OPPORTUNITY');
      expect(result.waterfallV2).toHaveLength(13);
      expect(result.waterfallV2[0].stageKey).toBe('TOTAL_CATEGORY_SPEND');
      expect(result.waterfallV2[11].stageKey).toBe('OVERLAP_DOUBLE_COUNT_ADJUSTMENT');
      expect(result.waterfallV2[12].stageKey).toBe('NET_DEFENSIBLE_OPPORTUNITY_POTENTIAL');
      expect(result.waterfallV2[12].eligibleAmountInr).toBe(850000);
    });
  });
});
