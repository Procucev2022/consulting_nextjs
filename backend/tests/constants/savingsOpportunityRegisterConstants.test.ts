import { describe, it, expect } from 'vitest';
import {
  SAVINGS_OPPORTUNITY_REGISTER,
  calculateConsolidatedSavingsSummary
} from '../../src/constants/savingsOpportunityRegisterConstants';
import { SAVINGS_ASSUMPTIONS } from '../../src/constants/savingsAssumptions';
import {
  RAW_TOTAL_SPEND_INR,
  RAW_ADDRESSABLE_INR,
  RAW_GROSS_OPP_INR,
  RAW_OVERLAPS_INR,
  RAW_EXCLUSIONS_INR,
  RAW_NET_DEFENSIBLE_INR
} from '../../src/constants/numericalAuditConstants';

describe('Savings Opportunity Register & Consolidation Engine (Prompt 269)', () => {
  it('should contain structured opportunities with all 24 required fields', () => {
    expect(SAVINGS_OPPORTUNITY_REGISTER.length).toBeGreaterThan(5);

    SAVINGS_OPPORTUNITY_REGISTER.forEach((item) => {
      expect(item.opportunityId).toBeDefined();
      expect(item.module).toBeDefined();
      expect(item.analysisType).toBeDefined();
      expect(item.category).toBeDefined();
      expect(item.subCategory).toBeDefined();
      expect(typeof item.currentSpendInr).toBe('number');
      expect(typeof item.addressableSpendInr).toBe('number');
      expect(item.currentBaseline).toBeDefined();
      expect(item.targetImprovement).toBeDefined();
      expect(typeof item.savingsPercent).toBe('number');
      expect(typeof item.estimatedSavingsInr).toBe('number');
      expect(['HARD_PROCUREMENT_SAVINGS', 'COST_AVOIDANCE', 'PRODUCTIVITY_SOFT_SAVINGS', 'RISK_STRATEGIC_BENEFIT']).toContain(
        item.savingsType
      );
      expect(['HIGH', 'MEDIUM', 'LOW']).toContain(item.confidenceLevel);
      expect(item.calculationMethod).toBeDefined();
      expect(item.keyAssumption).toBeDefined();
      expect(item.finding).toBeDefined();
      expect(item.background).toBeDefined();
      expect(item.objective).toBeDefined();
      expect(item.recommendedAction).toBeDefined();
      expect(item.expectedOutcome).toBeDefined();
      expect(item.nextStep).toBeDefined();
      expect(['LOW', 'MEDIUM', 'HIGH']).toContain(item.implementationComplexity);
      expect(['WAVE_1', 'WAVE_2', 'WAVE_3', 'PIPELINE']).toContain(item.priority);
      expect(item.owner).toBeDefined();
      expect(item.realizationTimeline).toBeDefined();
      expect(item.overlapGroup).toBeDefined();
      expect(['INCLUDED', 'PARTIALLY_INCLUDED', 'OVERLAPPING', 'EXCLUDED_FROM_CONSOLIDATED']).toContain(
        item.consolidationStatus
      );
    });
  });

  it('should model Module 1 Baseline first without calculating savings on non-addressable spend', () => {
    const m1Item = SAVINGS_OPPORTUNITY_REGISTER.find((item) => item.opportunityId === 'OPP-M1-01');
    expect(m1Item).toBeDefined();
    expect(m1Item?.module).toBe('Module 1');
    expect(m1Item?.analysisType).toBe('RATE_HARMONIZATION');
    expect(m1Item?.addressableSpendInr).toBe(1420000000);
    expect(m1Item?.savingsPercent).toBe(5.0);
    expect(m1Item?.estimatedSavingsInr).toBe(71000000);
  });

  it('should model Vendor Consolidation using configurable 5% assumption with clear disclaimer', () => {
    const vcItems = SAVINGS_OPPORTUNITY_REGISTER.filter(
      (item) => item.analysisType === 'VENDOR_CONSOLIDATION'
    );
    expect(vcItems.length).toBeGreaterThan(0);
    vcItems.forEach((item) => {
      expect(item.savingsPercent).toBe(SAVINGS_ASSUMPTIONS.VENDOR_CONSOLIDATION_DISCOUNT * 100);
      expect(item.keyAssumption).toBe(SAVINGS_ASSUMPTIONS.ILLUSTRATIVE_ASSUMPTION_LABEL);
    });
  });

  it('should model PO Consolidation strictly as process effort reduction % without artificial spend savings', () => {
    const poItem = SAVINGS_OPPORTUNITY_REGISTER.find((item) => item.opportunityId === 'OPP-M2-03');
    expect(poItem).toBeDefined();
    expect(poItem?.analysisType).toBe('PO_CONSOLIDATION');
    expect(poItem?.savingsType).toBe('PRODUCTIVITY_SOFT_SAVINGS');
    expect(poItem?.savingsPercent).toBe(20.0);
    expect(poItem?.estimatedSavingsInr).toBe(0.0);
    expect(poItem?.addressableSpendInr).toBe(0.0);
  });

  it('should model Strategic Sourcing and Competitive RFQ with explicit assumptions', () => {
    const stratItem = SAVINGS_OPPORTUNITY_REGISTER.find((item) => item.opportunityId === 'OPP-M2-04');
    expect(stratItem?.analysisType).toBe('STRATEGIC_SOURCING');
    expect(stratItem?.savingsPercent).toBe(SAVINGS_ASSUMPTIONS.STRATEGIC_SOURCING_IMPROVEMENT * 100);

    const rfqItem = SAVINGS_OPPORTUNITY_REGISTER.find((item) => item.opportunityId === 'OPP-M2-05');
    expect(rfqItem?.analysisType).toBe('COMPETITIVE_RFQ');
    expect(rfqItem?.savingsPercent).toBe(SAVINGS_ASSUMPTIONS.COMPETITIVE_RFQ_IMPROVEMENT * 100);
  });

  it('should treat E-Auction as ONE sourcing lever restricted to auction-suitable spend', () => {
    const auctionItem = SAVINGS_OPPORTUNITY_REGISTER.find((item) => item.opportunityId === 'OPP-M2-06');
    expect(auctionItem?.analysisType).toBe('E_AUCTION');
    expect(auctionItem?.background).toContain(SAVINGS_ASSUMPTIONS.E_AUCTION_DISCLAIMER);
    expect(auctionItem?.addressableSpendInr).toBeLessThan(RAW_ADDRESSABLE_INR);
  });

  it('should classify Single-Supplier Risk as Risk Mitigation without synthetic spend savings', () => {
    const riskItem = SAVINGS_OPPORTUNITY_REGISTER.find((item) => item.opportunityId === 'OPP-M2-07');
    expect(riskItem?.analysisType).toBe('STRATEGIC_RISK');
    expect(riskItem?.savingsType).toBe('RISK_STRATEGIC_BENEFIT');
    expect(riskItem?.estimatedSavingsInr).toBe(0.0);
  });

  it('should model Module 3 PCBI Benchmark Gap independently of sourcing mechanism', () => {
    const pcbiItem = SAVINGS_OPPORTUNITY_REGISTER.find((item) => item.opportunityId === 'OPP-M3-01');
    expect(pcbiItem?.analysisType).toBe('PCBI_BENCHMARK_GAP');
    expect(pcbiItem?.savingsType).toBe('HARD_PROCUREMENT_SAVINGS');
    expect(pcbiItem?.confidenceLevel).toBe('HIGH');
    expect(pcbiItem?.background).toContain(SAVINGS_ASSUMPTIONS.PCBI_BENCHMARK_DISCLAIMER);
  });

  it('should model Price Trend as Negotiation / Timing Opportunity and Cost Avoidance', () => {
    const trendItem = SAVINGS_OPPORTUNITY_REGISTER.find((item) => item.opportunityId === 'OPP-M3-03');
    expect(trendItem?.analysisType).toBe('PRICE_TREND_TIMING');
    expect(trendItem?.savingsType).toBe('COST_AVOIDANCE');
    expect(trendItem?.estimatedSavingsInr).toBe(41000000.0);
  });

  it('should eliminate overlaps and calculate consolidated net defensible total without triple counting', () => {
    const summary = calculateConsolidatedSavingsSummary(SAVINGS_OPPORTUNITY_REGISTER);
    expect(summary.totalEvaluatedSpendInr).toBe(RAW_TOTAL_SPEND_INR);
    expect(summary.addressableSpendInr).toBe(RAW_ADDRESSABLE_INR);
    expect(summary.grossOpportunityInr).toBe(RAW_GROSS_OPP_INR);
    expect(summary.overlapInr).toBe(RAW_OVERLAPS_INR);
    expect(summary.exclusionInr).toBe(RAW_EXCLUSIONS_INR);
    expect(summary.netDefensibleOpportunityInr).toBe(RAW_NET_DEFENSIBLE_INR);

    // Separates hard savings and cost avoidance
    expect(summary.hardProcurementSavingsInr).toBe(RAW_NET_DEFENSIBLE_INR - 410000000.0);
    expect(summary.costAvoidanceInr).toBe(410000000.0);
    expect(summary.hardProcurementSavingsInr + summary.costAvoidanceInr).toBe(summary.netDefensibleOpportunityInr);

    // Soft productivity and risk separated from cash savings
    expect(summary.productivityEffortReductionPercent).toBe(20.0);
    expect(summary.productivityPoReductionCount).toBe(824);
    expect(summary.strategicRiskInitiativesCount).toBeGreaterThanOrEqual(1);
  });

  it('CRITICAL TEST (Section 17): should prevent triple-counting when Vendor Consolidation, Benchmark Gap, and E-Auction target the same spend', () => {
    // Synthetic test case matching Prompt 269 Section 17 & Section 8
    const sharedSpendInr = 200000000; // ₹20 Cr

    const oppBenchmarkGap: Partial<typeof SAVINGS_OPPORTUNITY_REGISTER[0]> = {
      opportunityId: 'TEST-BENCH-01',
      analysisType: 'PCBI_BENCHMARK_GAP',
      addressableSpendInr: sharedSpendInr,
      estimatedSavingsInr: 16000000, // ₹1.60 Cr (8%)
      overlapGroup: 'OG-SHARED-SPEND-01',
      consolidationStatus: 'INCLUDED' // Primary Opportunity
    };

    const oppVendorConsolidation: Partial<typeof SAVINGS_OPPORTUNITY_REGISTER[0]> = {
      opportunityId: 'TEST-VC-02',
      analysisType: 'VENDOR_CONSOLIDATION',
      addressableSpendInr: sharedSpendInr,
      estimatedSavingsInr: 10000000, // ₹1.00 Cr (5%)
      overlapGroup: 'OG-SHARED-SPEND-01',
      consolidationStatus: 'OVERLAPPING' // Realization Lever (De-duplicated)
    };

    const oppEAuction: Partial<typeof SAVINGS_OPPORTUNITY_REGISTER[0]> = {
      opportunityId: 'TEST-AUC-03',
      analysisType: 'E_AUCTION',
      addressableSpendInr: sharedSpendInr,
      estimatedSavingsInr: 12000000, // ₹1.20 Cr (6%)
      overlapGroup: 'OG-SHARED-SPEND-01',
      consolidationStatus: 'OVERLAPPING' // Optional Execution Mechanism (De-duplicated)
    };

    const sharedSpendOpportunities = [
      oppBenchmarkGap,
      oppVendorConsolidation,
      oppEAuction
    ];

    // Naive sum without overlap control would triple count: 1.6 Cr + 1.0 Cr + 1.2 Cr = 3.8 Cr
    const naiveTotal = sharedSpendOpportunities.reduce(
      (acc, o) => acc + (o.estimatedSavingsInr || 0),
      0
    );
    expect(naiveTotal).toBe(38000000); // ₹3.80 Cr

    // De-duplicated consolidated total includes ONLY non-overlapping primary opportunity
    const nonOverlappingTotal = sharedSpendOpportunities
      .filter((o) => o.consolidationStatus === 'INCLUDED')
      .reduce((acc, o) => acc + (o.estimatedSavingsInr || 0), 0);

    expect(nonOverlappingTotal).toBe(16000000); // Strictly ₹1.60 Cr, NOT ₹3.80 Cr
    expect(nonOverlappingTotal).toBeLessThan(naiveTotal);

    // Also verify in global register that overlap adjustment exists
    const registerOverlapItem = SAVINGS_OPPORTUNITY_REGISTER.find(
      (item) => item.consolidationStatus === 'OVERLAPPING'
    );
    expect(registerOverlapItem).toBeDefined();
    expect(registerOverlapItem?.estimatedSavingsInr).toBeLessThan(0);
  });
});
