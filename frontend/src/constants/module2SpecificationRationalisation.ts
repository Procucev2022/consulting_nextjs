/**
 * Module 2 — Lever 8: Specification Rationalisation (Phase 1)
 * Frontend Constants & Governance Rules
 * Compliant with Rule 8, 9, max 300 lines, line length <= 120 chars
 */

import type {
  SpecificationRationalisationReviewStatus,
  SpecificationIdentificationType
} from '../types/module2SpecificationRationalisation';

export const SPECIFICATION_REVIEW_STATUSES: Record<string, SpecificationRationalisationReviewStatus> = {
  POTENTIAL_MATCH: 'POTENTIAL_MATCH',
  AWAITING_TECHNICAL_REVIEW: 'AWAITING_TECHNICAL_REVIEW',
  TECHNICALLY_VERIFIED: 'TECHNICALLY_VERIFIED',
  REJECTED: 'REJECTED'
} as const;

export const SPECIFICATION_IDENTIFICATION_TYPES: Record<string, SpecificationIdentificationType> = {
  DUPLICATE_CODE: 'DUPLICATE_CODE',
  SIMILAR_DESCRIPTION: 'SIMILAR_DESCRIPTION',
  EQUIVALENT_SPECIFICATION: 'EQUIVALENT_SPECIFICATION',
  CROSS_PLANT_VARIATION: 'CROSS_PLANT_VARIATION',
  MULTIPLE_INTERNAL_CODES: 'MULTIPLE_INTERNAL_CODES',
  STANDARDIZATION_CANDIDATE: 'STANDARDIZATION_CANDIDATE',
  OVER_SPECIFICATION: 'OVER_SPECIFICATION'
} as const;

export const SPECIFICATION_STATUS_LABELS: Record<SpecificationRationalisationReviewStatus, string> = {
  POTENTIAL_MATCH: 'Potential Match (System Identified)',
  AWAITING_TECHNICAL_REVIEW: 'Awaiting Technical Review',
  TECHNICALLY_VERIFIED: 'Technically Verified & Approved',
  REJECTED: 'Reviewed & Rejected'
};

export const SPECIFICATION_IDENTIFICATION_LABELS: Record<SpecificationIdentificationType, string> = {
  DUPLICATE_CODE: 'Duplicate Material Code',
  SIMILAR_DESCRIPTION: 'Similar Material Description',
  EQUIVALENT_SPECIFICATION: 'Equivalent Technical Spec',
  CROSS_PLANT_VARIATION: 'Cross-Plant Spec Variation',
  MULTIPLE_INTERNAL_CODES: 'Multiple Internal Codes',
  STANDARDIZATION_CANDIDATE: 'Standardisation Candidate',
  OVER_SPECIFICATION: 'Potential Over-Specification'
};

export const SPECIFICATION_FINANCIAL_DISCLOSURES = {
  PHASE_1_STATUS:
    'NOT YET QUANTIFIABLE — COMMERCIAL QUANTIFICATION DEFERRED TO PHASE 2.',
  EXPENDITURE_UNDER_REVIEW_NOTICE:
    'Expenditure and quantities under review represent candidate spend volume, not validated cost savings.',
  AUTOMATED_APPROVAL_PROHIBITED:
    'Automated analysis cannot grant technical approval. Equivalence must be verified by authorised engineering personnel.',
  PHASE_2_ROADMAP:
    'Commercial savings calculations will be enabled in Phase 2 once approved alternative specifications, validated vendor quotes, and eligible quantities are established.'
} as const;

export const SPECIFICATION_METHODOLOGY_DISCLOSURES: string[] = [
  'Phase 1 focuses exclusively on opportunity identification and technical review; zero financial savings are claimed.',
  'Description normalisation standardises case, punctuation, unit representations, and whitespace.',
  'Technical attribute comparison isolates extracted dimensions, grades, and ratings while disclosing missing fields.',
  'Candidates are flagged as POTENTIAL_MATCH or AWAITING_TECHNICAL_REVIEW; technical verification requires human engineer review.',
  'Financial benefit status remains strictly NOT YET QUANTIFIABLE — COMMERCIAL QUANTIFICATION DEFERRED TO PHASE 2.',
  'Expenditure under review is distinguished from savings; generic or extrapolated savings percentages are strictly prohibited.',
  'Cross-lever overlap controls record potential relationships without modifying or double-counting benefits from Levers 1–7.'
];

export const SPECIFICATION_UI_STRINGS = {
  TITLE: 'Module 2 — Lever 8: Specification Rationalisation',
  SUBTITLE: 'Phase 1: Opportunity Identification & Authorised Technical Review (Zero Commercial Savings in Phase 1)',
  BADGE_PHASE_1: 'PHASE 1 — IDENTIFICATION & TECHNICAL REVIEW',
  KPI_ASSESSED_MATERIALS: 'Total Materials Assessed',
  KPI_TOTAL_CANDIDATES: 'Rationalisation Candidates',
  KPI_AWAITING_REVIEW: 'Awaiting Technical Review',
  KPI_VERIFIED: 'Technically Verified',
  KPI_REJECTED: 'Rejected Candidates',
  KPI_MISSING_DATA: 'Candidates With Data Gaps',
  KPI_EXPENDITURE_UNDER_REVIEW: 'Expenditure Under Review',
  KPI_COMMERCIAL_SAVINGS: 'Commercial Savings Quantified',
  NOT_YET_QUANTIFIABLE: 'NOT YET QUANTIFIABLE',
  BTN_EXPORT_EXCEL: 'Export Authoritative Excel (6 Sheets)',
  BTN_BACK_TO_OVERVIEW: 'Back to Sourcing Levers',
  BTN_REVIEW_SPEC: 'Technical Review',
  REVIEW_WORKFLOW_UNAVAILABLE: 'Technical review recording is unavailable until D1 review history and authenticated ' +
    'reviewer identity are configured.',
  TAB_ALL_CANDIDATES: 'All Identified Candidates',
  TAB_AWAITING_REVIEW: 'Awaiting Engineering Review',
  TAB_VERIFIED: 'Technically Verified',
  TAB_DATA_GAPS: 'Missing Technical Attributes',
  MODAL_TITLE: 'Authorised Technical Review & Equivalence Determination',
  MODAL_SUBTITLE: 'Review extracted engineering specifications and record technical approval or rejection',
  FIELD_REVIEWER_NAME: 'Reviewer Full Name',
  FIELD_REVIEWER_ROLE: 'Reviewer Professional Role / Department',
  FIELD_DECISION: 'Technical Decision',
  FIELD_JUSTIFICATION: 'Technical Justification & Verification Scope',
  FIELD_PROPOSED_STANDARD: 'Proposed Standard / Approved Item Specification',
  FIELD_APPLICATION_SCOPE: 'Application Scope & Limitations',
  FIELD_REJECTION_REASON: 'Rejection Reason (Required if rejected)',
  BTN_CANCEL: 'Cancel',
  BTN_SUBMIT_REVIEW: 'Record Technical Decision',
  SUBMITTING: 'Recording Decision...',
  ATTR_NAME: 'Technical Attribute',
  ATTR_PRIMARY: 'Primary Item Spec',
  ATTR_COMPARISON: 'Comparison Item Spec',
  ATTR_STATUS: 'Match Status',
  ATTR_CRITICAL: 'Critical Spec',
  NO_CANDIDATES_FOUND: 'No specification rationalisation candidates matching filter criteria.'
} as const;

