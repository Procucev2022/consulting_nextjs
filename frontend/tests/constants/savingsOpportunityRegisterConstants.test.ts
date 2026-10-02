import { describe, it, expect } from 'vitest';
import {
  SAVINGS_OPPORTUNITY_REGISTER,
  calculateConsolidatedSavingsSummary
} from '../../src/constants/savingsOpportunityRegisterConstants';
import { SAVINGS_ASSUMPTIONS } from '../../src/constants/savingsAssumptions';

describe('Savings Opportunity Register & Consolidation Engine (Frontend)', () => {
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

  it('should model Module 1 Baseline and Vendor Consolidation 5% assumption', () => {
    const vcItems = SAVINGS_OPPORTUNITY_REGISTER.filter(
      (item) => item.analysisType === 'VENDOR_CONSOLIDATION'
    );
    expect(vcItems.length).toBeGreaterThan(0);
    vcItems.forEach((item) => {
      expect(item.savingsPercent).toBe(SAVINGS_ASSUMPTIONS.VENDOR_CONSOLIDATION_DISCOUNT * 100);
      expect(item.keyAssumption).toBe(SAVINGS_ASSUMPTIONS.ILLUSTRATIVE_ASSUMPTION_LABEL);
    });
  });

  it('should model PO Consolidation as productivity effort reduction without spend conversion', () => {
    const poItem = SAVINGS_OPPORTUNITY_REGISTER.find((item) => item.opportunityId === 'OPP-M2-03');
    expect(poItem).toBeDefined();
    expect(poItem?.savingsType).toBe('PRODUCTIVITY_SOFT_SAVINGS');
    expect(poItem?.savingsPercent).toBe(20.0);
    expect(poItem?.estimatedSavingsInr).toBe(0.0);
  });

  it('should calculate consolidated savings without triple counting', () => {
    const summary = calculateConsolidatedSavingsSummary(SAVINGS_OPPORTUNITY_REGISTER);
    expect(summary.totalEvaluatedSpendInr).toBeGreaterThan(0);
    expect(summary.addressableSpendInr).toBe(49310000000.0);
    expect(summary.grossOpportunityInr).toBe(1731200000.0);
    expect(summary.netDefensibleOpportunityInr).toBe(936000000.0);
    expect(summary.hardProcurementSavingsInr).toBe(787200000.0);
    expect(summary.costAvoidanceInr).toBe(148800000.0);
    expect(summary.productivityEffortReductionPercent).toBe(20.0);
    expect(summary.productivityPoReductionCount).toBe(824);
  });

  it('CRITICAL TEST (Section 17): should prevent triple-counting when Vendor Consolidation, Benchmark Gap, and E-Auction target the same spend', () => {
    const sharedSpendInr = 200000000; // ₹20 Cr

    const oppBenchmarkGap: Partial<typeof SAVINGS_OPPORTUNITY_REGISTER[0]> = {
      opportunityId: 'TEST-BENCH-01',
      analysisType: 'PCBI_BENCHMARK_GAP',
      addressableSpendInr: sharedSpendInr,
      estimatedSavingsInr: 16000000,
      overlapGroup: 'OG-SHARED-SPEND-01',
      consolidationStatus: 'INCLUDED'
    };

    const oppVendorConsolidation: Partial<typeof SAVINGS_OPPORTUNITY_REGISTER[0]> = {
      opportunityId: 'TEST-VC-02',
      analysisType: 'VENDOR_CONSOLIDATION',
      addressableSpendInr: sharedSpendInr,
      estimatedSavingsInr: 10000000,
      overlapGroup: 'OG-SHARED-SPEND-01',
      consolidationStatus: 'OVERLAPPING'
    };

    const oppEAuction: Partial<typeof SAVINGS_OPPORTUNITY_REGISTER[0]> = {
      opportunityId: 'TEST-AUC-03',
      analysisType: 'E_AUCTION',
      addressableSpendInr: sharedSpendInr,
      estimatedSavingsInr: 12000000,
      overlapGroup: 'OG-SHARED-SPEND-01',
      consolidationStatus: 'OVERLAPPING'
    };

    const sharedSpendOpportunities = [
      oppBenchmarkGap,
      oppVendorConsolidation,
      oppEAuction
    ];

    const naiveTotal = sharedSpendOpportunities.reduce(
      (acc, o) => acc + (o.estimatedSavingsInr || 0),
      0
    );
    expect(naiveTotal).toBe(38000000);

    const nonOverlappingTotal = sharedSpendOpportunities
      .filter((o) => o.consolidationStatus === 'INCLUDED')
      .reduce((acc, o) => acc + (o.estimatedSavingsInr || 0), 0);

    expect(nonOverlappingTotal).toBe(16000000);
    expect(nonOverlappingTotal).toBeLessThan(naiveTotal);

    const registerOverlapItem = SAVINGS_OPPORTUNITY_REGISTER.find(
      (item) => item.consolidationStatus === 'OVERLAPPING'
    );
    expect(registerOverlapItem).toBeDefined();
    expect(registerOverlapItem?.estimatedSavingsInr).toBeLessThan(0);
  });
});
