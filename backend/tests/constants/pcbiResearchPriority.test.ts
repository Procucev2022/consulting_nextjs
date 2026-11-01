import { describe, expect, it } from 'vitest';
import {
  PCBI_RESEARCH_PRIORITY_GAP_STATUSES,
  PCBI_RESEARCH_PRIORITY_ORDER,
  PCBI_RESEARCH_PRIORITY_SCORE_BANDS
} from '../../src/constants/pcbiResearchPriority';

describe('PCBI research priority constants', () => {
  it('defines score bands and the one-crore high-impact spend threshold', () => {
    expect(PCBI_RESEARCH_PRIORITY_SCORE_BANDS).toEqual({
      criticalMinimum: 75,
      highMinimum: 50,
      mediumMinimum: 25,
      maximumScore: 100,
      highImpactSpendCr: 1
    });
  });

  it('lists open gap states and keeps unlinked spend after scored priorities', () => {
    expect(PCBI_RESEARCH_PRIORITY_GAP_STATUSES.has('NO_HISTORY')).toBe(true);
    expect(PCBI_RESEARCH_PRIORITY_GAP_STATUSES.has('PRODUCTION_READY')).toBe(false);
    expect(PCBI_RESEARCH_PRIORITY_ORDER).toEqual([
      'P1 — Critical Coverage Gap',
      'P2 — High Coverage Gap',
      'P3 — Medium Coverage Gap',
      'P4 — Low Coverage Gap',
      'PENDING — Spend Link Required'
    ]);
  });
});
