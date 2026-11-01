export const PCBI_RESEARCH_PRIORITY_SCORE_BANDS = {
  criticalMinimum: 75,
  highMinimum: 50,
  mediumMinimum: 25,
  maximumScore: 100,
  highImpactSpendCr: 1
} as const;

export const PCBI_RESEARCH_PRIORITY_GAP_STATUSES = new Set([
  'PARTIAL_HISTORY', 'NO_HISTORY', 'MISSING', 'SOURCE_UNVERIFIED',
  'METHODOLOGY_PENDING', 'SPECIFICATION_MISMATCH', 'FREQUENCY_MISMATCH'
]);

export const PCBI_RESEARCH_PRIORITY_ORDER = [
  'P1 — Critical Coverage Gap',
  'P2 — High Coverage Gap',
  'P3 — Medium Coverage Gap',
  'P4 — Low Coverage Gap',
  'PENDING — Spend Link Required'
] as const;
