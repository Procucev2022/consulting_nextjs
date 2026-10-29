import { describe, expect, it } from 'vitest';
import {
  SAVINGS_D1_ACTION_STATUS,
  SAVINGS_D1_ACTION_STATUS_STORAGE,
  SAVINGS_D1_ENGINE_BY_LEVER,
  SAVINGS_D1_INR_PER_CRORE,
  SAVINGS_D1_MESSAGES,
  SAVINGS_D1_OPPORTUNITY_STATUS,
  SAVINGS_D1_OWNER_VALUES
} from '../../src/constants/savingsD1';

describe('D1 savings constants', () => {
  it('maps persisted workflow states and owners to the savings domain', () => {
    expect(SAVINGS_D1_OPPORTUNITY_STATUS['UNDER VALIDATION']).toBe('UNDER_VALIDATION');
    expect(SAVINGS_D1_OPPORTUNITY_STATUS.UNDER_VALIDATION).toBe('UNDER_VALIDATION');
    expect(Object.values(SAVINGS_D1_ACTION_STATUS)).toEqual(expect.arrayContaining([
      'Open', 'In Progress', 'Completed', 'Deferred'
    ]));
    expect(Object.values(SAVINGS_D1_ACTION_STATUS_STORAGE)).toEqual(expect.arrayContaining([
      'PLANNED', 'IN_PROGRESS', 'COMPLETED', 'DEFERRED'
    ]));
    expect(SAVINGS_D1_OWNER_VALUES).toContain('Procurement');
    expect(SAVINGS_D1_INR_PER_CRORE).toBe(10000000);
  });

  it('maps supported sourcing levers and provides record-specific not-found guidance', () => {
    expect(Object.values(SAVINGS_D1_ENGINE_BY_LEVER)).toEqual(expect.arrayContaining([
      'PRICE_DISPERSION', 'VENDOR_CONSOLIDATION', 'VOLUME_AGGREGATION', 'PCBI_PRICE', 'E_AUCTION',
      'SPECIFICATION_RATIONALIZATION', 'RATE_CONTRACT', 'DEMAND_CONSOLIDATION', 'PAYMENT_TERMS',
      'PO_CONSOLIDATION', 'ALTERNATE_MATERIAL'
    ]));
    expect(SAVINGS_D1_MESSAGES.actionPlanNotFound('ACT-404')).toContain('ACT-404');
    expect(SAVINGS_D1_MESSAGES.opportunityNotFound('OPP-404')).toContain('OPP-404');
    expect(SAVINGS_D1_MESSAGES.actionPlanNoChanges).toContain('at least one');
  });
});
