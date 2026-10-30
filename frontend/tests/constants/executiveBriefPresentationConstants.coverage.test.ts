import { describe, expect, it } from 'vitest';
import {
  ABC_TEXTILE_PRESENTATION_CONTRACT,
  DEMO_ARCHETYPE_PRESENTATION_CONTRACT,
  EXECUTIVE_BRIEF_PRESENTATION_CONSTANTS,
  EXECUTIVE_BRIEF_PRESENTATION_CONTRACT,
  getExecutiveBriefPresentationContract,
  isAdditiveDirectSaving,
  isCustomerAssessment,
  validateNetComposition,
  validateWaterfallMath
} from '../../src/constants/executiveBriefPresentationConstants';

describe('isCustomerAssessment', () => {
  it.each<[string, boolean]>([
    ['ABC Textile Mills', true],
    ['abc holdings', true],
    ['Premier Textile Group', true],
    ['Client Reference 0002', true],
    ['  AIC-2026-001  ', true],
    ['Demo Enterprise', false],
    ['', false]
  ])('classifies "%s" as a customer assessment: %s', (clientNameOrAssessmentId, expected) => {
    expect(isCustomerAssessment(clientNameOrAssessmentId)).toBe(expected);
  });

  it('returns false when no client name or assessment id is provided', () => {
    expect(isCustomerAssessment()).toBe(false);
  });
});

describe('getExecutiveBriefPresentationContract', () => {
  it('returns the demo archetype contract when no client is supplied', () => {
    expect(getExecutiveBriefPresentationContract()).toEqual(EXECUTIVE_BRIEF_PRESENTATION_CONTRACT);
  });

  it('returns the demo archetype contract for a non-customer assessment', () => {
    expect(getExecutiveBriefPresentationContract('Demo Enterprise')).toEqual(
      DEMO_ARCHETYPE_PRESENTATION_CONTRACT
    );
  });

  it('returns the ABC Textile contract for a customer assessment', () => {
    expect(getExecutiveBriefPresentationContract('ABC Textile Mills')).toBe(
      ABC_TEXTILE_PRESENTATION_CONTRACT
    );
  });
});

describe('presentation contract aliases', () => {
  it('exposes the executive brief contract under the constants alias', () => {
    expect(EXECUTIVE_BRIEF_PRESENTATION_CONSTANTS).toBe(EXECUTIVE_BRIEF_PRESENTATION_CONTRACT);
  });

  it('builds the demo archetype as a copy of the executive brief contract', () => {
    expect(DEMO_ARCHETYPE_PRESENTATION_CONTRACT).toEqual(EXECUTIVE_BRIEF_PRESENTATION_CONTRACT);
    expect(DEMO_ARCHETYPE_PRESENTATION_CONTRACT).not.toBe(EXECUTIVE_BRIEF_PRESENTATION_CONTRACT);
  });
});

describe('isAdditiveDirectSaving', () => {
  it('counts only the direct savings classification toward the additive total', () => {
    expect(isAdditiveDirectSaving('DIRECT_SAVINGS')).toBe(true);
    expect(isAdditiveDirectSaving('STRATEGIC_VALUE')).toBe(false);
    expect(isAdditiveDirectSaving('COST_AVOIDANCE')).toBe(false);
  });
});

describe('waterfall validators', () => {
  it('accepts the certified waterfall and net composition by default', () => {
    expect(validateWaterfallMath()).toBe(true);
    expect(validateNetComposition()).toBe(true);
  });

  it('accepts a difference below the 0.001 Cr tolerance', () => {
    const nearlyBalanced = {
      ...EXECUTIVE_BRIEF_PRESENTATION_CONTRACT,
      netDefensiblePipelineCr: EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.netDefensiblePipelineCr + 0.0005
    };
    expect(validateWaterfallMath(nearlyBalanced)).toBe(true);
    expect(validateNetComposition(nearlyBalanced)).toBe(true);
  });

  it('rejects a net pipeline that does not reconcile', () => {
    const unbalanced = { ...EXECUTIVE_BRIEF_PRESENTATION_CONTRACT, netDefensiblePipelineCr: 90 };
    expect(validateWaterfallMath(unbalanced)).toBe(false);
    expect(validateNetComposition(unbalanced)).toBe(false);
  });
});
