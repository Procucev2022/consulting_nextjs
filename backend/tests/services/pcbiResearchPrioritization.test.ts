import { describe, expect, it } from 'vitest';
import type { CommodityResearchQueueRow } from '../../src/types/pcbiCommodityDataLab';
import {
  countPcbiHighImpactGaps,
  countPcbiPriorities,
  prioritizePcbiResearchQueue
} from '../../src/services/pcbiResearchPrioritization';

const row = (pcbiId: string, customerSpend: number, currentStatus: string): CommodityResearchQueueRow => ({
  commodity: pcbiId,
  commodityId: pcbiId,
  module2Classification: 'Metals',
  unspsc: '30100000',
  customerSpend,
  customerSpendCr: String(customerSpend),
  transactionCount: 2,
  pcbiId,
  seriesId: pcbiId,
  currentStatus: currentStatus as CommodityResearchQueueRow['currentStatus'],
  requiredHistory: '2024-01-01 to 2026-01-01',
  availableHistory: 'None',
  requiredFrequency: 'WEEKLY',
  availableFrequency: 'NONE',
  sourceStatus: 'NO_SOURCE',
  methodologyStatus: 'NOT_REVIEWED',
  priority: 'PENDING — Spend Link Required',
  priorityScore: 0,
  priorityReason: 'SPEND_LINK_REQUIRED',
  researchStatus: 'QUEUED',
  lastUpdated: '',
  action: 'UPLOAD SOURCE'
});

describe('PCBI research queue prioritization', () => {
  it('returns empty counts and no gaps for an empty queue', () => {
    expect(prioritizePcbiResearchQueue([])).toEqual([]);
    expect(countPcbiHighImpactGaps([])).toBe(0);
    expect(countPcbiPriorities([])).toEqual({ p1Critical: 0, p2High: 0, p3Medium: 0, p4Low: 0 });
  });

  it('scores gaps by relative linked spend, assigns all priority bands, and sorts the queue', () => {
    const result = prioritizePcbiResearchQueue([
      row('LOW', 0.00001, 'NO_HISTORY'),
      row('HIGH', 20, 'NO_HISTORY'),
      row('MID_HIGH', 0.5, 'NO_HISTORY'),
      row('MID_LOW', 0.1, 'NO_HISTORY'),
      row('NO_SPEND', 0, 'NO_HISTORY'),
      row('READY', 25000000, 'PRODUCTION_READY')
    ]);
    expect(result.map((item) => item.pcbiId)).toEqual(['HIGH', 'MID_HIGH', 'MID_LOW', 'LOW', 'READY', 'NO_SPEND']);
    expect(result.slice(0, 4).map(({ priority, priorityScore }) => [priority, priorityScore])).toEqual([
      ['P1 — Critical Coverage Gap', 100],
      ['P2 — High Coverage Gap', 67],
      ['P3 — Medium Coverage Gap', 33],
      ['P4 — Low Coverage Gap', 0]
    ]);
    expect(result[0].priorityReason).toBe('RANKED_BY_CUSTOMER_SPEND');
    expect(result[4]).toMatchObject({ priorityReason: 'GAP_RESOLVED', priorityScore: 0 });
    expect(result[5]).toMatchObject({ priorityReason: 'SPEND_LINK_REQUIRED', priorityScore: 0 });
    expect(countPcbiHighImpactGaps(result)).toBe(1);
    expect(countPcbiPriorities(result)).toEqual({ p1Critical: 1, p2High: 1, p3Medium: 1, p4Low: 1 });
  });

  it('scores the only spend-linked gap at the top of its queue and includes the one-crore boundary', () => {
    const onlyGap = prioritizePcbiResearchQueue([row('ONLY', 1, 'NO_HISTORY')]);
    expect(onlyGap[0]).toMatchObject({ priority: 'P1 — Critical Coverage Gap', priorityScore: 100 });
    expect(countPcbiHighImpactGaps(onlyGap)).toBe(1);
    expect(countPcbiHighImpactGaps([row('UNDER', 0.9999999, 'NO_HISTORY')])).toBe(0);
  });

  it('gives equal-spend rows the same score and uses PCBI ID as a stable tie-breaker', () => {
    const result = prioritizePcbiResearchQueue([
      row('TIE-B', 0.5, 'PARTIAL_HISTORY'),
      row('TIE-A', 0.5, 'PARTIAL_HISTORY'),
      row('OTHER', 0.1, 'SOURCE_UNVERIFIED')
    ]);
    expect(result.map(({ pcbiId, priorityScore }) => [pcbiId, priorityScore])).toEqual([
      ['TIE-A', 75], ['TIE-B', 75], ['OTHER', 0]
    ]);
    expect(result[0].priority).toBe('P1 — Critical Coverage Gap');
    expect(result[2].priority).toBe('P4 — Low Coverage Gap');
  });

  it('does not count non-benchmarkable or production-ready records as research gaps', () => {
    const rows = prioritizePcbiResearchQueue([
      row('READY', 20000000, 'PRODUCTION_READY'),
      row('NOT_BENCHMARKABLE', 15000000, 'NOT_BENCHMARKABLE')
    ]);
    expect(rows.every((item) => item.priorityReason === 'GAP_RESOLVED')).toBe(true);
    expect(countPcbiHighImpactGaps(rows)).toBe(0);
    expect(countPcbiPriorities(rows)).toEqual({ p1Critical: 0, p2High: 0, p3Medium: 0, p4Low: 0 });
  });
});
