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
  OVERLAP_NOTICE:
    'Opportunity values are mutually qualifying candidates and MUST NOT be added together across levers.'
} as const;
