import { describe, expect, it } from 'vitest';
import {
  SAVINGS_OPPORTUNITY_REGISTER,
  calculateConsolidatedSavingsSummary
} from '../../src/constants/savingsOpportunityRegisterConstants';
import type { SavingsOpportunityRegisterItem } from '../../src/types/savingsOpportunityRegister';

const TEMPLATE_ITEM: SavingsOpportunityRegisterItem = SAVINGS_OPPORTUNITY_REGISTER[0];

const buildItem = (overrides: Partial<SavingsOpportunityRegisterItem>): SavingsOpportunityRegisterItem => ({
  ...TEMPLATE_ITEM,
  ...overrides
});

describe('calculateConsolidatedSavingsSummary fallbacks', () => {
  it('falls back to the certified productivity and strategic counts for an empty register', () => {
    const summary = calculateConsolidatedSavingsSummary([]);

    expect(summary.productivityEffortReductionPercent).toBe(20.0);
    expect(summary.productivityPoReductionCount).toBe(824);
    expect(summary.strategicRiskInitiativesCount).toBe(1);
  });

  it('keeps the certified spend totals independent of the register rows supplied', () => {
    const emptySummary = calculateConsolidatedSavingsSummary([]);
    const defaultSummary = calculateConsolidatedSavingsSummary();

    expect(emptySummary.totalEvaluatedSpendInr).toBe(defaultSummary.totalEvaluatedSpendInr);
    expect(emptySummary.netDefensibleOpportunityInr).toBe(defaultSummary.netDefensibleOpportunityInr);
  });

  it('keeps the fallback effort percent when every productivity row reports zero', () => {
    const summary = calculateConsolidatedSavingsSummary([
      buildItem({ savingsType: 'PRODUCTIVITY_SOFT_SAVINGS', savingsPercent: 0 })
    ]);

    expect(summary.productivityEffortReductionPercent).toBe(20.0);
    expect(summary.productivityPoReductionCount).toBe(824);
  });

  it('reports the largest productivity percent and sums the PO reduction across productivity rows', () => {
    const summary = calculateConsolidatedSavingsSummary([
      buildItem({ savingsType: 'PRODUCTIVITY_SOFT_SAVINGS', savingsPercent: 12.5 }),
      buildItem({ savingsType: 'PRODUCTIVITY_SOFT_SAVINGS', savingsPercent: 7.5 })
    ]);

    expect(summary.productivityEffortReductionPercent).toBe(12.5);
    expect(summary.productivityPoReductionCount).toBe(2 * 824);
  });

  it('counts every risk and strategic benefit row and never reports fewer than one initiative', () => {
    const twoRiskRows = [
      buildItem({ savingsType: 'RISK_STRATEGIC_BENEFIT' }),
      buildItem({ savingsType: 'RISK_STRATEGIC_BENEFIT' })
    ];
    const oneRiskRow = [buildItem({ savingsType: 'RISK_STRATEGIC_BENEFIT' })];

    expect(calculateConsolidatedSavingsSummary(twoRiskRows).strategicRiskInitiativesCount).toBe(2);
    expect(calculateConsolidatedSavingsSummary(oneRiskRow).strategicRiskInitiativesCount).toBe(1);
  });

  it('ignores hard procurement and cost avoidance rows when computing productivity and risk counters', () => {
    const summary = calculateConsolidatedSavingsSummary([
      buildItem({ savingsType: 'HARD_PROCUREMENT_SAVINGS', savingsPercent: 9 }),
      buildItem({ savingsType: 'COST_AVOIDANCE', savingsPercent: 9 })
    ]);

    expect(summary.productivityEffortReductionPercent).toBe(20.0);
    expect(summary.productivityPoReductionCount).toBe(824);
    expect(summary.strategicRiskInitiativesCount).toBe(1);
  });
});
