import { describe, it, expect } from 'vitest';
import {
  OPPORTUNITY_LEVER_LABELS,
  OPPORTUNITY_STATUS_LABELS,
  OPPORTUNITY_CONFIDENCE_LABELS,
  RESPONSIBLE_VALIDATION_TEAMS,
  OPPORTUNITY_GOVERNANCE_NOTICES
} from '@/constants/module2OpportunityRegister';
import { opportunityRegisterQuerySchema } from '@/constants/module2OpportunityValidation';

describe('module2OpportunityRegister constants', () => {
  it('exposes correct lever labels', () => {
    expect(OPPORTUNITY_LEVER_LABELS.DIRECT_PRICE_IMPROVEMENT).toContain('Direct Price');
    expect(OPPORTUNITY_LEVER_LABELS.SUPPLIER_CONSOLIDATION).toContain('Supplier Base');
    expect(OPPORTUNITY_LEVER_LABELS.VOLUME_DEMAND_CONSOLIDATION).toContain('Volume & Demand');
    expect(OPPORTUNITY_LEVER_LABELS.SPECIFICATION_PROCESS_REVIEW).toContain('Specification & Process');
  });

  it('exposes correct lifecycle status labels', () => {
    expect(OPPORTUNITY_STATUS_LABELS.IDENTIFIED).toBe('Identified');
    expect(OPPORTUNITY_STATUS_LABELS.UNDER_REVIEW).toBe('Under Review');
    expect(OPPORTUNITY_STATUS_LABELS.VALIDATED).toBe('Validated');
    expect(OPPORTUNITY_STATUS_LABELS.NEGOTIATION).toBe('Negotiation');
    expect(OPPORTUNITY_STATUS_LABELS.AWARDED).toBe('Awarded');
    expect(OPPORTUNITY_STATUS_LABELS.REJECTED).toBe('Rejected');
  });

  it('exposes correct confidence labels', () => {
    expect(OPPORTUNITY_CONFIDENCE_LABELS.HIGH).toBe('High Confidence');
    expect(OPPORTUNITY_CONFIDENCE_LABELS.MEDIUM).toBe('Medium Confidence');
    expect(OPPORTUNITY_CONFIDENCE_LABELS.LOW).toContain('Low Confidence');
  });

  it('exposes responsible validation teams', () => {
    expect(RESPONSIBLE_VALIDATION_TEAMS.DIRECT_PRICE_IMPROVEMENT).toContain('Direct Sourcing');
    expect(RESPONSIBLE_VALIDATION_TEAMS.SUPPLIER_CONSOLIDATION).toContain('Strategic Sourcing');
    expect(RESPONSIBLE_VALIDATION_TEAMS.VOLUME_DEMAND_CONSOLIDATION).toContain('Central Procurement');
    expect(RESPONSIBLE_VALIDATION_TEAMS.SPECIFICATION_PROCESS_REVIEW).toContain('Technical Review');
  });

  it('contains mandatory data governance notices', () => {
    expect(OPPORTUNITY_GOVERNANCE_NOTICES.OVERLAP_NOTICE).toContain('MUST NOT be added together');
    expect(OPPORTUNITY_GOVERNANCE_NOTICES.DATA_LIMITATIONS.length).toBeGreaterThan(3);
    expect(OPPORTUNITY_GOVERNANCE_NOTICES.VALIDATION_REQUIREMENTS.length).toBeGreaterThan(3);
  });
});

describe('module2OpportunityValidation schemas', () => {
  it('validates valid opportunity query parameters', () => {
    const valid = {
      assessmentId: 'AIC-2026-0002',
      type: 'DIRECT_PRICE_IMPROVEMENT',
      status: 'IDENTIFIED',
      category: 'Chemicals',
      search: 'Soda'
    };
    const res = opportunityRegisterQuerySchema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it('fails on missing assessmentId', () => {
    const res = opportunityRegisterQuerySchema.safeParse({ assessmentId: '' });
    expect(res.success).toBe(false);
  });
});
