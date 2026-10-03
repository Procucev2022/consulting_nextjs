import { describe, it, expect } from 'vitest';
import {
  EXECUTIVE_BRIEF_ASSUMPTION_REGISTER,
  EXECUTIVE_BRIEF_VALIDATION_CHECKLIST,
  EXECUTIVE_BRIEF_TRANSACTION_EVIDENCE,
  EXECUTIVE_BRIEF_MASTER_OPPORTUNITIES,
  EXECUTIVE_BRIEF_MASTER_OPPORTUNITIES_PART1,
  EXECUTIVE_BRIEF_MASTER_OPPORTUNITIES_PART2
} from '../../src/constants';

describe('Executive Brief Governance & Master Register Constants', () => {
  it('should define all 7 items in EXECUTIVE_BRIEF_ASSUMPTION_REGISTER per Section 19', () => {
    expect(EXECUTIVE_BRIEF_ASSUMPTION_REGISTER).toHaveLength(7);
    const oppIds = EXECUTIVE_BRIEF_ASSUMPTION_REGISTER.map((item) => item.opportunityId);
    expect(oppIds).toEqual([
      'OPP-001',
      'OPP-002',
      'OPP-003',
      'OPP-004',
      'OPP-005',
      'OPP-006',
      'OPP-007'
    ]);

    EXECUTIVE_BRIEF_ASSUMPTION_REGISTER.forEach((item) => {
      expect(item.assumptionId).toMatch(/^ASM-\d{3}$/);
      expect(item.assumption.length).toBeGreaterThan(0);
      expect(item.value.length).toBeGreaterThan(0);
      expect(item.basis.length).toBeGreaterThan(0);
      expect(item.source.length).toBeGreaterThan(0);
      expect(typeof item.customerValidated).toBe('boolean');
      expect(item.impact.length).toBeGreaterThan(0);
      expect(item.scenarioClassification.length).toBeGreaterThan(0);
    });
  });

  it('should define all 14 validation checklist items per Section 20', () => {
    expect(EXECUTIVE_BRIEF_VALIDATION_CHECKLIST).toHaveLength(14);
    const itemIds = EXECUTIVE_BRIEF_VALIDATION_CHECKLIST.map((item) => item.itemId);
    expect(itemIds[0]).toBe('VAL-01');
    expect(itemIds[13]).toBe('VAL-14');

    EXECUTIVE_BRIEF_VALIDATION_CHECKLIST.forEach((item) => {
      expect(item.itemId).toMatch(/^VAL-\d{2}$/);
      expect(item.item.length).toBeGreaterThan(0);
      expect(item.category.length).toBeGreaterThan(0);
      expect(['VALIDATED', 'IN_REVIEW', 'PENDING']).toContain(item.status);
      expect(item.description.length).toBeGreaterThan(0);
    });
  });

  it('should define granular transaction evidence for all 7 opportunities per Section 18', () => {
    const oppIds = ['OPP-001', 'OPP-002', 'OPP-003', 'OPP-004', 'OPP-005', 'OPP-006', 'OPP-007'];
    oppIds.forEach((oppId) => {
      const evidence = EXECUTIVE_BRIEF_TRANSACTION_EVIDENCE[oppId];
      expect(evidence).toBeDefined();
      expect(evidence.transactionId.length).toBeGreaterThan(0);
      expect(evidence.poNumber.length).toBeGreaterThan(0);
      expect(evidence.poDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(evidence.supplier.length).toBeGreaterThan(0);
      expect(evidence.itemDescription.length).toBeGreaterThan(0);
      expect(evidence.quantity.length).toBeGreaterThan(0);
      expect(evidence.uom.length).toBeGreaterThan(0);
      expect(evidence.unitPrice.length).toBeGreaterThan(0);
      expect(evidence.spend.length).toBeGreaterThan(0);
      expect(evidence.category.length).toBeGreaterThan(0);
      expect(evidence.benchmarkPrice.length).toBeGreaterThan(0);
      expect(evidence.calculation.length).toBeGreaterThan(0);
      expect(evidence.source.length).toBeGreaterThan(0);
    });
  });

  it('should correctly assemble EXECUTIVE_BRIEF_MASTER_OPPORTUNITIES from Part1 and Part2', () => {
    expect(EXECUTIVE_BRIEF_MASTER_OPPORTUNITIES_PART1).toHaveLength(4);
    expect(EXECUTIVE_BRIEF_MASTER_OPPORTUNITIES_PART2).toHaveLength(3);
    expect(EXECUTIVE_BRIEF_MASTER_OPPORTUNITIES).toHaveLength(7);

    const fullIds = EXECUTIVE_BRIEF_MASTER_OPPORTUNITIES.map((item) => item.opportunityId);
    expect(fullIds).toEqual([
      'OPP-001',
      'OPP-002',
      'OPP-003',
      'OPP-004',
      'OPP-005',
      'OPP-006',
      'OPP-007'
    ]);

    EXECUTIVE_BRIEF_MASTER_OPPORTUNITIES.forEach((item) => {
      expect(item.opportunityId).toMatch(/^OPP-\d{3}$/);
      expect(item.module.length).toBeGreaterThan(0);
      expect(item.analysis.length).toBeGreaterThan(0);
      expect(item.category.length).toBeGreaterThan(0);
      expect(item.item.length).toBeGreaterThan(0);
      expect(item.background.length).toBeGreaterThan(0);
      expect(item.objective.length).toBeGreaterThan(0);
      expect(item.dataEvidence.length).toBeGreaterThan(0);
      expect(item.whatWeFound.length).toBeGreaterThan(0);
      expect(item.whyItMatters.length).toBeGreaterThan(0);
      expect(item.finding.length).toBeGreaterThan(0);
      expect(item.valueOpportunity.length).toBeGreaterThan(0);
      expect(item.calculation.length).toBeGreaterThan(0);
      expect(item.confidence.length).toBeGreaterThan(0);
      expect(item.executionApproach.length).toBeGreaterThan(0);
      expect(item.expectedOutcome.length).toBeGreaterThan(0);
      expect(item.nextStep.length).toBeGreaterThan(0);
      expect(item.validationRequired.length).toBeGreaterThan(0);
      expect(item.transactionProof).toBeDefined();
    });
  });
});
