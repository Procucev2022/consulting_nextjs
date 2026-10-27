/**
 * Module 2 — Stage 2: Material-Level Opportunity Register Constants
 * Compliant with Repository Rules: Section 8 (Constants Isolation), max 300 lines, 120 chars
 */

import type {
  OpportunityLeverClassification,
  OpportunityLifecycleStatus,
  OpportunityConfidenceLevel
} from '../types/module2OpportunityRegister';

export const OPPORTUNITY_LEVER_LABELS: Record<OpportunityLeverClassification, string> = {
  DIRECT_PRICE_IMPROVEMENT: 'Lever 1: Direct Price Improvement',
  SUPPLIER_CONSOLIDATION: 'Lever 3: Supplier Base Consolidation',
  VOLUME_DEMAND_CONSOLIDATION: 'Lever 4: Volume & Demand Consolidation',
  SPECIFICATION_PROCESS_REVIEW: 'Lever 8: Specification & Process Review'
};

export const OPPORTUNITY_STATUS_LABELS: Record<OpportunityLifecycleStatus, string> = {
  IDENTIFIED: 'Identified',
  UNDER_REVIEW: 'Under Review',
  VALIDATED: 'Validated',
  NEGOTIATION: 'Negotiation',
  AWARDED: 'Awarded',
  REJECTED: 'Rejected'
};

export const OPPORTUNITY_CONFIDENCE_LABELS: Record<OpportunityConfidenceLevel, string> = {
  HIGH: 'High Confidence',
  MEDIUM: 'Medium Confidence',
  LOW: 'Low Confidence (Review Required)'
};

export const RESPONSIBLE_VALIDATION_TEAMS: Record<OpportunityLeverClassification, string> = {
  DIRECT_PRICE_IMPROVEMENT: 'Procurement — Direct Sourcing Team',
  SUPPLIER_CONSOLIDATION: 'Strategic Sourcing & Vendor Management',
  VOLUME_DEMAND_CONSOLIDATION: 'Central Procurement & Supply Chain Planning',
  SPECIFICATION_PROCESS_REVIEW: 'Technical Review Committee & Quality Assurance'
};

export const OPPORTUNITY_GOVERNANCE_NOTICES = {
  DATA_LIMITATIONS: [
    'Zero external benchmarks applied: All price dispersion is derived strictly from internal transactional variance.',
    'Non-additive opportunity populations: Levers represent alternate or intersecting negotiation paths.',
    'Certified savings remain at ₹0.00 Cr until commercial terms and contract awards are executed.',
    'Uncoded transactions (5,023 line items, ₹101.52 Cr) are excluded from price dispersion and held for review.',
    'Negative returns and credit notes (-₹0.87 Cr) remain fully included in baseline accounting.'
  ],
  VALIDATION_REQUIREMENTS: [
    'Direct Price: Supplier verification of grade, technical specification sheet, and delivery lot size.',
    'Supplier Consolidation: Plant capacity audit, supplier qualification status, and single-source risk mitigation.',
    'Volume Aggregation: Inter-plant transit feasibility, warehouse holding limits, and tax harmonisation.',
    'Specification Review: Engineering and quality sign-off on technical interchangeability before commercial RFQ.'
  ],
  OVERLAP_HEADING: 'IMPORTANT: OPPORTUNITIES ARE NOT CONFIRMED SAVINGS',
  OVERLAP_NOTICE:
    'Opportunity values are mutually qualifying candidates and MUST NOT be added together across levers.'
} as const;

export const EXECUTIVE_DASHBOARD_STRINGS = {
  STAGE_BADGE: 'STAGE 2 DECISION ENGINE',
  ASSESSMENT_PREFIX: (id: string): string => `ASSESSMENT: ${id}`,
  TITLE: (customerName: string): string => `${customerName} — Strategic Sourcing Intelligence`,
  DESCRIPTION:
    'An evidence-based view of procurement spend, price variations, supplier concentration and volume aggregation opportunities—helping procurement teams prioritize actions and make better sourcing decisions.',
  VIEW_REGISTER_BUTTON: 'View Material Register',
  LOADING_TEXT: 'Loading Executive Sourcing Intelligence...',

  // KPI Card 1: Authoritative Baseline
  BASELINE_TITLE: 'Authoritative Baseline',
  BASELINE_DESC: 'Verified procurement baseline across 27,777 included transactions.',
  BASELINE_BADGE: 'Module 1 Net Certified',

  // KPI Card 2: Direct Price Eligible Spend
  DIRECT_PRICE_TITLE: 'Direct Price Eligible Spend',
  DIRECT_PRICE_DESC: 'Spend eligible for direct price-comparison analysis.',
  GROSS_MODELLED_PRICE_OPP_LABEL: (valCr: string | number): string =>
    `Gross Modelled Price Opportunity: ₹${typeof valCr === 'number' ? valCr.toFixed(2) : valCr} Cr`,
  GROSS_MODELLED_PRICE_OPP_DISCLAIMER: 'Preliminary modelled potential, not confirmed savings',

  // KPI Card 3: Multi-Supplier Spend Under Review
  SUPPLIER_CONSOLIDATION_TITLE: 'Multi-Supplier Spend Under Review',
  SUPPLIER_CONSOLIDATION_DESC:
    'Spend associated with materials purchased from multiple suppliers, not savings.',
  SUPPLIER_CONSOLIDATION_BADGE: (count: number | string): string =>
    `${count} Multi-Sourced Materials Under Review`,

  // KPI Card 4: High-Volume Spend Under Review
  VOLUME_AGGREGATION_TITLE: 'High-Volume Spend Under Review',
  VOLUME_AGGREGATION_DESC:
    'Purchasing groups for possible volume or demand aggregation analysis, not guaranteed savings.',
  VOLUME_AGGREGATION_BADGE: (count: number | string): string =>
    `${count} High-Volume Groups Under Review`,

  // KPI Card 5: Review Required
  REVIEW_REQUIRED_TITLE: 'Review Required',
  REVIEW_REQUIRED_DESC:
    'Spend excluded from direct price-comparison analysis and requiring further review.',
  REVIEW_REQUIRED_TXS: '7,129 Excluded Transactions',
  REVIEW_REQUIRED_INDICATOR:
    'Separate indicator: ₹101.5189 Cr across 5,023 transactions without material codes',

  // Yellow Warning Banner
  WARNING_HEADING: 'IMPORTANT: OPPORTUNITIES ARE NOT CONFIRMED SAVINGS',
  WARNING_MESSAGE:
    'Identified opportunities may overlap across sourcing levers and must not be added together. All opportunities require commercial and operational validation. Certified and realized savings remain ₹0 until the relevant actions are implemented and verified.',

  // Matrix & Panels
  MATRIX_TITLE: 'Sourcing Levers Decision Matrix',
  TOTAL_TRACEABLE_CANDIDATES: (count: number | string): string =>
    `Total Traceable Candidates: ${typeof count === 'number' ? count.toLocaleString() : count}`,
  TH_CLASSIFICATION: 'Lever Classification',
  TH_CANDIDATE_ITEMS: 'Candidate Items',
  TH_HISTORICAL_SPEND: 'Historical Spend (₹ Cr)',
  TH_DEFENSIBLE_VALUATION: 'Defensible Valuation (₹ Cr)',
  TH_COMMERCIAL_STATUS: 'Commercial Status',
  TH_GOVERNING_TEAM: 'Governing Validation Team',
  DATA_LIMITATIONS_TITLE: 'Data Limitations & Analytical Boundaries',
  VALIDATION_REQUIREMENTS_TITLE: 'Validation Requirements Before Execution',

  // Table rows
  LEVER_1_LABEL: 'Lever 1: Direct Price Improvement',
  LEVER_1_STATUS: 'Analytical Rate Dispersion',
  LEVER_1_TEAM: 'Procurement — Direct Sourcing Team',
  LEVER_3_LABEL: 'Lever 3: Supplier Base Consolidation',
  LEVER_3_STATUS: 'Multi-Vendor Fragmentation',
  LEVER_3_TEAM: 'Strategic Sourcing & Vendor Management',
  LEVER_4_LABEL: 'Lever 4: Volume & Demand Consolidation',
  LEVER_4_STATUS: 'Inter-Plant Lot Aggregation',
  LEVER_4_TEAM: 'Central SCM & Plant Operations',
  LEVER_8_LABEL: 'Lever 8: Specification Rationalisation',
  LEVER_8_STATUS: 'Standardization Candidate',
  LEVER_8_TEAM: 'Technical Review Committee',
  PENDING_TERMS: 'Pending Terms',
  PENDING_TIERING: 'Pending Tiering',
  TECHNICAL_AUDIT: 'Technical Audit'
} as const;

