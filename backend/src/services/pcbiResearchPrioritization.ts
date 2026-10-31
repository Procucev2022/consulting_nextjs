import {
  PCBI_RESEARCH_PRIORITY_GAP_STATUSES,
  PCBI_RESEARCH_PRIORITY_ORDER,
  PCBI_RESEARCH_PRIORITY_SCORE_BANDS
} from '../constants/pcbiResearchPriority';
import type { CommodityResearchQueueRow, PCBIResearchPriorityReason } from '../types/pcbiCommodityDataLab';

type PrioritizedQueueRow = CommodityResearchQueueRow & {
  priorityScore: number;
  priorityReason: PCBIResearchPriorityReason;
};

const isResearchGap = (row: CommodityResearchQueueRow): boolean =>
  PCBI_RESEARCH_PRIORITY_GAP_STATUSES.has(row.currentStatus);

const scoreForPosition = (position: number, count: number): number => count <= 1
  ? PCBI_RESEARCH_PRIORITY_SCORE_BANDS.maximumScore
  : Math.round((count - position - 1) / (count - 1) * PCBI_RESEARCH_PRIORITY_SCORE_BANDS.maximumScore);

const priorityForScore = (score: number): CommodityResearchQueueRow['priority'] => {
  if (score >= PCBI_RESEARCH_PRIORITY_SCORE_BANDS.criticalMinimum) return 'P1 — Critical Coverage Gap';
  if (score >= PCBI_RESEARCH_PRIORITY_SCORE_BANDS.highMinimum) return 'P2 — High Coverage Gap';
  if (score >= PCBI_RESEARCH_PRIORITY_SCORE_BANDS.mediumMinimum) return 'P3 — Medium Coverage Gap';
  return 'P4 — Low Coverage Gap';
};

const rankPosition = (row: CommodityResearchQueueRow, rows: CommodityResearchQueueRow[]): number => {
  const firstTie = rows.findIndex((candidate) => candidate.customerSpend === row.customerSpend);
  const ties = rows.filter((candidate) => candidate.customerSpend === row.customerSpend).length;
  return firstTie + (ties - 1) / 2;
};

export const prioritizePcbiResearchQueue = (queue: CommodityResearchQueueRow[]): PrioritizedQueueRow[] => {
  const scoredRows = queue.filter((row) => isResearchGap(row) && row.customerSpend > 0)
    .sort((left, right) => right.customerSpend - left.customerSpend || left.pcbiId.localeCompare(right.pcbiId));
  const prioritized = queue.map((row): PrioritizedQueueRow => {
    if (!isResearchGap(row)) return {
      ...row, priority: 'P4 — Low Coverage Gap', priorityScore: 0, priorityReason: 'GAP_RESOLVED'
    };
    if (row.customerSpend <= 0) return {
      ...row, priority: 'PENDING — Spend Link Required', priorityScore: 0, priorityReason: 'SPEND_LINK_REQUIRED'
    };
    const score = scoreForPosition(rankPosition(row, scoredRows), scoredRows.length);
    return {
      ...row, priority: priorityForScore(score), priorityScore: score, priorityReason: 'RANKED_BY_CUSTOMER_SPEND'
    };
  });
  return prioritized.sort((left, right) => {
    const priorityDifference = PCBI_RESEARCH_PRIORITY_ORDER.indexOf(left.priority) -
      PCBI_RESEARCH_PRIORITY_ORDER.indexOf(right.priority);
    const resolvedDifference = Number(left.priorityReason === 'GAP_RESOLVED') -
      Number(right.priorityReason === 'GAP_RESOLVED');
    const scoreDifference = right.priorityScore - left.priorityScore;
    const spendDifference = right.customerSpend - left.customerSpend;
    if (priorityDifference !== 0) return priorityDifference;
    if (resolvedDifference !== 0) return resolvedDifference;
    if (scoreDifference !== 0) return scoreDifference;
    if (spendDifference !== 0) return spendDifference;
    return left.pcbiId.localeCompare(right.pcbiId);
  });
};

export const countPcbiHighImpactGaps = (queue: CommodityResearchQueueRow[]): number =>
  queue.filter((row) => isResearchGap(row) &&
    row.customerSpend >= PCBI_RESEARCH_PRIORITY_SCORE_BANDS.highImpactSpendCr
  ).length;

export const countPcbiPriorities = (queue: CommodityResearchQueueRow[]): {
  p1Critical: number;
  p2High: number;
  p3Medium: number;
  p4Low: number;
} => {
  const scoredGaps = queue.filter((row) => isResearchGap(row) && row.customerSpend > 0);
  return {
    p1Critical: scoredGaps.filter((row) => row.priority === PCBI_RESEARCH_PRIORITY_ORDER[0]).length,
    p2High: scoredGaps.filter((row) => row.priority === PCBI_RESEARCH_PRIORITY_ORDER[1]).length,
    p3Medium: scoredGaps.filter((row) => row.priority === PCBI_RESEARCH_PRIORITY_ORDER[2]).length,
    p4Low: scoredGaps.filter((row) => row.priority === PCBI_RESEARCH_PRIORITY_ORDER[3]).length
  };
};
