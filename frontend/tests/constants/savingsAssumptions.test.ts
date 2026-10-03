import { describe, it, expect } from 'vitest';
import { SAVINGS_ASSUMPTIONS } from '../../src/constants/savingsAssumptions';

describe('Savings Assumptions Constants (Prompt 269 Section 16)', () => {
  it('should define centralized configurable assumptions with explicit default values', () => {
    expect(SAVINGS_ASSUMPTIONS.VENDOR_CONSOLIDATION_DISCOUNT).toBe(0.05);
    expect(SAVINGS_ASSUMPTIONS.STRATEGIC_SOURCING_IMPROVEMENT).toBe(0.03);
    expect(SAVINGS_ASSUMPTIONS.COMPETITIVE_RFQ_IMPROVEMENT).toBe(0.04);
    expect(SAVINGS_ASSUMPTIONS.E_AUCTION_IMPROVEMENT).toBe(0.06);
    expect(SAVINGS_ASSUMPTIONS.PO_EFFORT_REDUCTION_PERCENT).toBe(0.20);
    expect(SAVINGS_ASSUMPTIONS.DEFAULT_ANNUAL_PO_PROCESSING_COST_PER_PO).toBe(0);
  });

  it('should provide compliant CFO/CEO disclaimer and illustrative assumption labels', () => {
    expect(SAVINGS_ASSUMPTIONS.DISCLAIMER_TEXT).toContain('Based on analysed addressable spend and stated modelling assumptions.');
    expect(SAVINGS_ASSUMPTIONS.ILLUSTRATIVE_ASSUMPTION_LABEL).toBe('Illustrative modelling assumption');
  });

  it('should include full standard disclaimers for vendor consolidation, PO productivity, and e-auctions', () => {
    expect(SAVINGS_ASSUMPTIONS.VENDOR_CONSOLIDATION_DISCLAIMER).toContain('indicative 5% volume-discount assumption');
    expect(SAVINGS_ASSUMPTIONS.PO_CONSOLIDATION_DISCLAIMER).toContain('20% reduction in PO-processing effort');
    expect(SAVINGS_ASSUMPTIONS.E_AUCTION_DISCLAIMER).toContain('E-auction is one of several sourcing mechanisms evaluated');
    expect(SAVINGS_ASSUMPTIONS.PCBI_BENCHMARK_DISCLAIMER).toContain('independent of the sourcing mechanism');
    expect(SAVINGS_ASSUMPTIONS.STRATEGIC_RISK_DISCLAIMER).toContain('classified as Risk Mitigation Opportunity');
  });
});
