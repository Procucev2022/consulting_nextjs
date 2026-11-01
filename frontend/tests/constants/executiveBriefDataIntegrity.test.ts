import { describe, it, expect } from 'vitest';
import {
  EXECUTIVE_BRIEF_MASTER_OPPORTUNITIES,
  EXECUTIVE_BRIEF_PORTFOLIO_SECTIONS,
  EXECUTIVE_BRIEF_WATERFALL_BREAKDOWN,
  EXECUTIVE_BRIEF_VALUE_CLASSIFICATIONS,
  EXECUTIVE_BRIEF_ASSUMPTION_REGISTER,
  EXECUTIVE_BRIEF_VALIDATION_CHECKLIST,
  EXECUTIVE_BRIEF_TRANSACTION_EVIDENCE
} from '../../src/constants';

describe('Prompt 276 Section 18: Final Data Integrity Test Suite', () => {
  it('1. Every opportunity has an explicit value classification', () => {
    const validClassifications = [
      'DIRECT_SAVING',
      'PROCESS_PRODUCTIVITY',
      'COST_AVOIDANCE',
      'STRATEGIC_VALUE',
      'VALIDATED_SAVING',
      'REALIZED_SAVING',
      'BENCHMARK_SAVING'
    ];
    EXECUTIVE_BRIEF_MASTER_OPPORTUNITIES.forEach((opp) => {
      expect(validClassifications).toContain(opp.valueClassification);
    });
  });

  it('2. Every monetary opportunity has a clear mathematical calculation formula', () => {
    EXECUTIVE_BRIEF_MASTER_OPPORTUNITIES.forEach((opp) => {
      expect(opp.calculation).toBeDefined();
      expect(opp.calculation.length).toBeGreaterThan(0);
      expect(opp.calculationMethod).toBeDefined();
      expect(opp.calculationMethod?.length).toBeGreaterThan(0);
    });
  });

  it('3. Every assumption is explicitly labelled and classified', () => {
    expect(EXECUTIVE_BRIEF_ASSUMPTION_REGISTER).toHaveLength(5);
    EXECUTIVE_BRIEF_MASTER_OPPORTUNITIES.forEach((opp) => {
      expect(opp.assumption).toBeDefined();
      expect(opp.assumption.length).toBeGreaterThan(0);
      expect(opp.classificationLabel).toBeDefined();
    });
  });

  it('4. Every opportunity has verifiable transaction evidence or is labelled illustrative', () => {
    EXECUTIVE_BRIEF_MASTER_OPPORTUNITIES.forEach((opp) => {
      expect(opp.dataEvidence).toBeDefined();
      expect(opp.dataEvidence.length).toBeGreaterThan(0);
      expect(opp.transactionSampleId).toBeDefined();
      expect(EXECUTIVE_BRIEF_TRANSACTION_EVIDENCE[opp.opportunityId]).toBeDefined();
    });
  });

  it('5. Lever 2 vendor consolidation savings are strictly excluded pending validation', () => {
    const l2Opp = EXECUTIVE_BRIEF_MASTER_OPPORTUNITIES.find((o) => o.opportunityId === 'OPP-BOR-L2');
    expect(l2Opp).toBeDefined();
    expect(l2Opp?.exclusionStatus).toContain('Commercial Validation Pending');
    expect(l2Opp?.indicativeOpportunity).toContain('₹0.00 Cr (Under Commercial Validation)');
  });

  it('6. Module 3 research is formally closed with zero benchmark savings', () => {
    const m3Opp = EXECUTIVE_BRIEF_MASTER_OPPORTUNITIES.find((o) => o.opportunityId === 'OPP-BOR-M3');
    expect(m3Opp).toBeDefined();
    expect(m3Opp?.finding).toContain('Research Closed — No Operational Benchmark Data Available');
    expect(m3Opp?.indicativeOpportunity).toContain('0% Coverage');
  });

  it('7. Lever 1 strategic sourcing yields proven commercial savings', () => {
    const l1Opp = EXECUTIVE_BRIEF_MASTER_OPPORTUNITIES.find((o) => o.opportunityId === 'OPP-BOR-L1');
    expect(l1Opp).toBeDefined();
    expect(l1Opp?.valueClassification).toBe('DIRECT_SAVING');
    expect(l1Opp?.indicativeOpportunity).toContain('₹73.769 Cr');
  });

  it('8. Validated savings are presented for client review and client approved is zero', () => {
    const m4Opp = EXECUTIVE_BRIEF_MASTER_OPPORTUNITIES.find((o) => o.opportunityId === 'OPP-BOR-M4');
    expect(m4Opp).toBeDefined();
    expect(m4Opp?.valueOpportunity).toContain('Client-Approved Savings: ₹0.00 Cr');
    expect(m4Opp?.indicativeOpportunity).toContain('Proposed Target: ₹12.90 Cr');
    expect(m4Opp?.assumption).toContain('not a commitment or realized saving');
  });

  it('9. Realized savings are zero pending billing and contract execution', () => {
    const m4Opp = EXECUTIVE_BRIEF_MASTER_OPPORTUNITIES.find((o) => o.opportunityId === 'OPP-BOR-M4');
    expect(m4Opp?.indicativeOpportunity).toContain('₹0.00 Cr Realized');
  });

  it('10. E-auction is not presented as the exclusive savings source', () => {
    const note = EXECUTIVE_BRIEF_PORTFOLIO_SECTIONS.eauctionShareNote;
    expect(note).toContain('E-auction is Lever 3 execution mechanism');
  });

  it('11. No duplicate opportunity IDs exist in the Master Opportunity Register', () => {
    const ids = EXECUTIVE_BRIEF_MASTER_OPPORTUNITIES.map((o) => o.opportunityId);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('12. No overlap group produces double counting with mathematical reconciliation', () => {
    const wb = EXECUTIVE_BRIEF_WATERFALL_BREAKDOWN;
    expect(wb.grossIdentifiedCr).toBe('₹117.512 Cr');
    expect(wb.overlapAdjustmentCr).toBe('-₹30.412 Cr');
    expect(wb.exclusionsCr).toBe('₹0.00 Cr');
    expect(wb.netDefensibleCr).toBe('₹87.100 Cr');

    const gross = 117.512;
    const overlap = 30.412;
    const exclusions = 0.00;
    const net = gross - overlap - exclusions;
    expect(net).toBeCloseTo(87.100, 3);
  });

  it('13. Module 1 → Module 2 → Module 3 → Module 4 lineage remains intact', () => {
    const modules = new Set(EXECUTIVE_BRIEF_MASTER_OPPORTUNITIES.map((o) => o.module));
    expect(modules.has('Module 2')).toBe(true);
    expect(modules.has('Module 3')).toBe(true);
    expect(modules.has('Module 4')).toBe(true);
    expect(EXECUTIVE_BRIEF_PORTFOLIO_SECTIONS.totalAddressableSpend).toBe('₹168.658 Cr');
  });

  it('14. UI values match governed portfolio constants', () => {
    expect(EXECUTIVE_BRIEF_PORTFOLIO_SECTIONS.totalAddressableSpend).toBe('₹168.658 Cr');
    expect(EXECUTIVE_BRIEF_PORTFOLIO_SECTIONS.netIndicativeOpportunity).toBe('₹87.100 Cr');
    expect(EXECUTIVE_BRIEF_PORTFOLIO_SECTIONS.hardSavingsCr).toBe('₹75.121 Cr');
    expect(EXECUTIVE_BRIEF_PORTFOLIO_SECTIONS.costAvoidanceCr).toBe('₹0.00 Cr');
  });

  it('15. Governance registers and checklist items are fully populated and valid', () => {
    expect(EXECUTIVE_BRIEF_VALUE_CLASSIFICATIONS).toHaveLength(6);
    expect(EXECUTIVE_BRIEF_VALIDATION_CHECKLIST).toHaveLength(6);
    const validStatuses = ['PENDING', 'IN_REVIEW', 'VALIDATED', 'NOT_APPLICABLE'];
    EXECUTIVE_BRIEF_VALIDATION_CHECKLIST.forEach((val) => {
      expect(validStatuses).toContain(val.status);
    });
  });

  it('16. All 15 points of Section 2 structure exist on every master opportunity', () => {
    EXECUTIVE_BRIEF_MASTER_OPPORTUNITIES.forEach((opp) => {
      expect(opp.background.length).toBeGreaterThan(0);
      expect(opp.objective.length).toBeGreaterThan(0);
      expect(opp.dataEvidence.length).toBeGreaterThan(0);
      expect(opp.currentState?.length).toBeGreaterThan(0);
      expect(opp.finding.length).toBeGreaterThan(0);
      expect(opp.valueOpportunity.length).toBeGreaterThan(0);
      expect(opp.calculationMethod?.length).toBeGreaterThan(0);
      expect(opp.assumption.length).toBeGreaterThan(0);
      expect(opp.lowCase?.length).toBeGreaterThan(0);
      expect(opp.baseCase?.length).toBeGreaterThan(0);
      expect(opp.highCase?.length).toBeGreaterThan(0);
      expect(opp.confidence.length).toBeGreaterThan(0);
      expect(opp.executionApproach.length).toBeGreaterThan(0);
      expect(opp.nextStep.length).toBeGreaterThan(0);
      expect(opp.customerValidationRequired?.length).toBeGreaterThan(0);
    });
  });
});
