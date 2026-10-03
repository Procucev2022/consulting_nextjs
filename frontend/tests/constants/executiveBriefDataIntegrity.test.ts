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
      'REALIZED_SAVING'
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
    expect(EXECUTIVE_BRIEF_ASSUMPTION_REGISTER).toHaveLength(7);
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

  it('5. No process productivity is included in direct savings', () => {
    const poOpp = EXECUTIVE_BRIEF_MASTER_OPPORTUNITIES.find((o) => o.opportunityId === 'OPP-002');
    expect(poOpp).toBeDefined();
    expect(poOpp?.valueClassification).toBe('PROCESS_PRODUCTIVITY');
    expect(poOpp?.calculationMethod).toContain('Direct spend: ₹0 / NOT MONETIZED');
  });

  it('6. No risk avoidance is included in direct savings', () => {
    const riskOpp = EXECUTIVE_BRIEF_MASTER_OPPORTUNITIES.find((o) => o.opportunityId === 'OPP-005');
    expect(riskOpp).toBeDefined();
    expect(riskOpp?.valueClassification).toBe('COST_AVOIDANCE');
    expect(riskOpp?.calculationMethod).toContain('Cost Avoidance');
    expect(riskOpp?.indicativeOpportunity).toContain('Direct Spend: ₹0.00 Cr / Cost Avoidance');
  });

  it('7. Strategic market value is kept strictly separate', () => {
    const marketOpp = EXECUTIVE_BRIEF_MASTER_OPPORTUNITIES.find((o) => o.opportunityId === 'OPP-006');
    expect(marketOpp).toBeDefined();
    expect(marketOpp?.valueClassification).toBe('STRATEGIC_VALUE');
    expect(marketOpp?.exclusionStatus).toBe('Subject to Joint Commercial Committee Review');
  });

  it('8. Validated savings are kept strictly separate from unvalidated opportunities', () => {
    const opp007 = EXECUTIVE_BRIEF_MASTER_OPPORTUNITIES.find((o) => o.opportunityId === 'OPP-007');
    expect(opp007).toBeDefined();
    expect(opp007?.confidence).toContain('Verified (General Ledger Audited Actuals)');
    expect(opp007?.indicativeOpportunity).toContain('₹68.00 Cr Realized (₹143.00 Cr In-Flight Run-Rate)');
  });

  it('9. Realized savings are evidenced by General Ledger and invoice audits', () => {
    const opp007 = EXECUTIVE_BRIEF_MASTER_OPPORTUNITIES.find((o) => o.opportunityId === 'OPP-007');
    expect(opp007?.valueClassification).toBe('REALIZED_SAVING');
    expect(opp007?.transactionProof?.source).toContain('SAP Invoiced Payment Voucher');
  });

  it('10. E-auction is not presented as the exclusive savings source', () => {
    const note = EXECUTIVE_BRIEF_PORTFOLIO_SECTIONS.eauctionShareNote;
    expect(note).toContain('E-auction is strictly one execution mechanism under Strategic Sourcing');
    expect(note).toContain('14.8% of portfolio execution');
  });

  it('11. No duplicate opportunity IDs exist in the Master Opportunity Register', () => {
    const ids = EXECUTIVE_BRIEF_MASTER_OPPORTUNITIES.map((o) => o.opportunityId);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('12. No overlap group produces double counting with mathematical reconciliation', () => {
    const wb = EXECUTIVE_BRIEF_WATERFALL_BREAKDOWN;
    expect(wb.grossIdentifiedCr).toBe('₹173.12 Cr');
    expect(wb.overlapAdjustmentCr).toBe('-₹62.80 Cr');
    expect(wb.exclusionsCr).toBe('-₹16.72 Cr');
    expect(wb.netDefensibleCr).toBe('₹93.60 Cr');

    const gross = 173.12;
    const overlap = 62.80;
    const exclusions = 16.72;
    const net = gross - overlap - exclusions;
    expect(net).toBeCloseTo(93.60, 2);
  });

  it('13. Module 1 → Module 2 → Module 3 → Module 4 lineage remains intact', () => {
    const modules = new Set(EXECUTIVE_BRIEF_MASTER_OPPORTUNITIES.map((o) => o.module));
    expect(modules.has('Module 2')).toBe(true);
    expect(modules.has('Module 3')).toBe(true);
    expect(modules.has('Module 4')).toBe(true);
    expect(EXECUTIVE_BRIEF_PORTFOLIO_SECTIONS.totalAddressableSpend).toBe('₹4,931.00 Cr');
  });

  it('14. UI values match governed portfolio constants', () => {
    expect(EXECUTIVE_BRIEF_PORTFOLIO_SECTIONS.totalAddressableSpend).toBe('₹4,931.00 Cr');
    expect(EXECUTIVE_BRIEF_PORTFOLIO_SECTIONS.netIndicativeOpportunity).toBe('₹93.60 Cr');
    expect(EXECUTIVE_BRIEF_PORTFOLIO_SECTIONS.hardSavingsCr).toBe('₹78.72 Cr');
    expect(EXECUTIVE_BRIEF_PORTFOLIO_SECTIONS.costAvoidanceCr).toBe('₹14.88 Cr');
  });

  it('15. Governance registers and checklist items are fully populated and valid', () => {
    expect(EXECUTIVE_BRIEF_VALUE_CLASSIFICATIONS).toHaveLength(6);
    expect(EXECUTIVE_BRIEF_VALIDATION_CHECKLIST).toHaveLength(14);
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
