/**
 * Module 2 — Lever 6: Category Specialisation Backend Constants
 * Compliant with Rule 8, 9, max 300 lines, line length <= 120 chars
 */

import type {
  OpportunityHeadAssumption,
  OpportunityHeadKey,
  CategoryPriority,
  CategoryManagementApproach,
  CategorySpecialisationValidationStatus
} from '../types/module2CategorySpecialisation';

export const LEVER6_TENANT_IDS = {
  ABC_TEXTILE: 'AIC-2026-0002',
  PQR_CEMENT: 'AIC-2026-0003'
} as const;

export const LEVER6_PRIORITIES: Record<string, CategoryPriority> = {
  PRIORITY_A: 'PRIORITY_A',
  PRIORITY_B: 'PRIORITY_B',
  PRIORITY_C: 'PRIORITY_C'
} as const;

export const LEVER6_APPROACHES: Record<string, CategoryManagementApproach> = {
  DEDICATED_CATEGORY_MANAGER: 'DEDICATED_CATEGORY_MANAGER',
  SHARED_CATEGORY_MANAGER: 'SHARED_CATEGORY_MANAGER',
  CENTRALISED_CATEGORY_MGMT: 'CENTRALISED_CATEGORY_MGMT',
  STANDARD_AUTOMATED: 'STANDARD_AUTOMATED'
} as const;

export const LEVER6_VALIDATION_STATUSES: Record<string, CategorySpecialisationValidationStatus> = {
  TENTATIVE_PENDING: 'TENTATIVE — PENDING VALIDATION',
  DATA_PARTIALLY_AVAILABLE: 'DATA PARTIALLY AVAILABLE',
  DATA_UNAVAILABLE: 'DATA UNAVAILABLE',
  AWAITING_VALIDATION: 'AWAITING VALIDATION',
  OVERLAP_REVIEW_REQUIRED: 'OVERLAP REVIEW REQUIRED',
  IDENTIFIED_NOT_QUANTIFIED: 'OPPORTUNITY IDENTIFIED — NOT YET QUANTIFIABLE',
  APPROVED: 'APPROVED',
  REALISED: 'REALISED'
} as const;

export const LEVER6_OVERLAP_STATUSES = {
  NO_OVERLAP: 'NO_OVERLAP',
  OVERLAP_DEDUPLICATED: 'OVERLAP_DEDUPLICATED',
  OVERLAP_REVIEW_REQUIRED: 'OVERLAP_REVIEW_REQUIRED'
} as const;

export const LEVER6_THRESHOLDS = {
  STRATEGIC_SPEND_SHARE_PCT: 5.0,
  OPTIMISATION_SPEND_SHARE_PCT: 1.0,
  COMPLEX_SUPPLIER_COUNT: 8,
  MODERATE_SUPPLIER_COUNT: 4,
  COMPLEX_MATERIAL_COUNT: 10,
  PRICE_VARIATION_SIGNIFICANT: 0.1,
  HIGH_HERFINDAHL_INDEX: 2500,
  HIGH_TOP_SUPPLIER_SHARE_PCT: 60.0
} as const;

export const LEVER6_BENEFIT_DISCLAIMER =
  'TENTATIVE — ILLUSTRATIVE PLANNING ESTIMATE — PENDING VALIDATION.';

export const LEVER6_EVIDENCE_DISCLOSURES = {
  CONTRACT_DATA_GAP:
    'Eligible Spend Not Yet Established — Further Data or Validation Required: Contract coverage data is not present in transaction feed.',
  OPERATING_COST_GAP:
    'Eligible Spend Not Yet Established — Further Data or Validation Required: Procurement operating cost baseline is not established.',
  PRICE_VARIANCE_GAP:
    'Defensible identical-item price variation could not be established from available line items.',
  SUPPLIER_STRATEGY_GAP:
    'Genuinely addressable supplier tail strategy requires category manager commercial review.',
  GOVERNANCE_NOT_QUANTIFIED:
    'Opportunity Identified — Monetary Benefit Not Yet Quantifiable: Requires defensible eligible-spend base and specific commercial savings mechanism.',
  EXPERTISE_NOT_QUANTIFIED:
    'Opportunity Identified — Monetary Benefit Not Yet Quantifiable: Technical specialist deployment is a capability intervention; specific commercial savings mechanism required.'
} as const;

export const LEVER6_METHODOLOGY_DISCLOSURES: string[] = [
  'Opportunity heads use Procucev initial planning assumptions for scenario analysis.',
  'Strategic Category Management (Head A) and Category Expertise (Head I) are governance and capability interventions; monetary savings are not assigned without a specific commercial mechanism.',
  'Eligible spend is strictly determined from actual transaction patterns, never a blanket percentage.',
  'Process & Transaction Efficiency applies exclusively to addressable operating costs, not material purchase spend.',
  'Strategic Sourcing & Bidding (Head F) defaults to OVERLAP REVIEW REQUIRED against Lever 2 unless an opportunity-level record proves distinct scope.',
  'Cross-lever overlap controls prevent double-counting across all relevant levers (Levers 1, 2, 3, 4, 8).',
  'Items with unresolved overlap are marked OVERLAP REVIEW REQUIRED and excluded from net indicative opportunity.',
  'Initial benefit estimates are tentative planning figures, pending commercial and supplier validation.'
];

export const LEVER6_EXCEL_SHEETS = {
  SHEET_1_EXECUTIVE: 'Executive Summary',
  SHEET_2_CATEGORIES: 'Category Assessment Register',
  SHEET_3_OPPORTUNITIES: 'Opportunity Head Estimates',
  SHEET_4_CALCULATIONS: 'Eligible Spend & Details',
  SHEET_5_OVERLAPS: 'Cross-Lever Overlap Register',
  SHEET_6_RESOURCES: 'Resource Recommendations',
  SHEET_7_DATA_GAPS: 'Data & Validation Gaps',
  SHEET_8_METHODOLOGY: 'Assumptions & Methodology'
} as const;

export const LEVER6_OPPORTUNITY_HEAD_ASSUMPTIONS: Record<OpportunityHeadKey, OpportunityHeadAssumption> = {
  'HEAD-A': {
    key: 'HEAD-A',
    code: 'HEAD-A',
    title: 'Strategic Category Management',
    lowPct: 1.0,
    basePct: 2.0,
    highPct: 3.0,
    description: 'End-to-end category strategy, demand management, and proactive cross-plant governance.'
  },
  'HEAD-B': {
    key: 'HEAD-B',
    code: 'HEAD-B',
    title: 'Supplier Base Rationalisation',
    lowPct: 1.0,
    basePct: 2.0,
    highPct: 3.0,
    description: 'Consolidation of fragmented supplier tail into primary strategic partners.',
    relatedLever: 'LEVER_3'
  },
  'HEAD-C': {
    key: 'HEAD-C',
    code: 'HEAD-C',
    title: 'Purchasing Consolidation',
    lowPct: 1.0,
    basePct: 2.0,
    highPct: 3.0,
    description: 'Harmonising common purchase orders, joint shipment schedules, and multi-unit order pooling.',
    relatedLever: 'LEVER_4'
  },
  'HEAD-D': {
    key: 'HEAD-D',
    code: 'HEAD-D',
    title: 'Price Variation Reduction',
    lowPct: 2.0,
    basePct: 3.5,
    highPct: 5.0,
    description: 'Compressing material price spreads to the lowest demonstrated transaction price.',
    relatedLever: 'LEVER_1'
  },
  'HEAD-E': {
    key: 'HEAD-E',
    code: 'HEAD-E',
    title: 'Contract Coverage Improvement',
    lowPct: 1.0,
    basePct: 2.0,
    highPct: 3.0,
    description: 'Transitioning spot purchases to comprehensive rate contracts with indexed price protection.'
  },
  'HEAD-F': {
    key: 'HEAD-F',
    code: 'HEAD-F',
    title: 'Strategic Sourcing & Competitive Bidding',
    lowPct: 2.0,
    basePct: 3.5,
    highPct: 5.0,
    description: 'Structured e-RFI/e-RFP go-to-market events and multi-round negotiation rounds.',
    relatedLever: 'LEVER_2'
  },
  'HEAD-G': {
    key: 'HEAD-G',
    code: 'HEAD-G',
    title: 'Alternative Supplier Development',
    lowPct: 1.0,
    basePct: 2.5,
    highPct: 4.0,
    description: 'Qualifying secondary and regional manufacturers to mitigate monopoly supplier pricing.'
  },
  'HEAD-H': {
    key: 'HEAD-H',
    code: 'HEAD-H',
    title: 'Specification & Requirement Optimisation',
    lowPct: 1.0,
    basePct: 3.0,
    highPct: 5.0,
    description: 'Value engineering and aligning non-standard internal specs with market standards.',
    relatedLever: 'LEVER_8'
  },
  'HEAD-I': {
    key: 'HEAD-I',
    code: 'HEAD-I',
    title: 'Category Expertise Deployment',
    lowPct: 0.5,
    basePct: 1.25,
    highPct: 2.0,
    description: 'Engaging dedicated technical category specialists for deep domain engineering sourcing.'
  },
  'HEAD-J': {
    key: 'HEAD-J',
    code: 'HEAD-J',
    title: 'Process & Transaction Efficiency',
    lowPct: 5.0,
    basePct: 10.0,
    highPct: 15.0,
    description: 'Streamlining operational purchase order processing, automated workflows, and invoice matching.',
    appliesToOperatingCost: true
  }
};
