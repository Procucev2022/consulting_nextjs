/**
 * Module 2 — Lever 8: Specification Rationalisation (Phase 1)
 * Backend Constants & Governance Rules
 * Compliant with Rule 8, 9, max 300 lines, line length <= 120 chars
 */

import { z } from 'zod';
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

export const SPECIFICATION_FINANCIAL_DISCLOSURES = {
  PHASE_1_STATUS:
    'NOT YET QUANTIFIABLE — COMMERCIAL QUANTIFICATION DEFERRED TO PHASE 2.',
  EXPENDITURE_UNDER_REVIEW_NOTICE:
    'Expenditure and quantities under review represent candidate spend volume, not validated cost savings.',
  AUTOMATED_APPROVAL_PROHIBITED:
    'Automated text matching or statistical similarity cannot grant technical approval or establish interchangeability.',
  DATA_GAP_DISCLOSURE:
    'Technical attributes (grade, dimension, rating, tolerance) are partially available or missing in ERP line items.'
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

export const SPECIFICATION_EXCEL_SHEETS = {
  SHEET_1_EXECUTIVE: 'Executive Summary',
  SHEET_2_CANDIDATES: 'Rationalisation Candidates',
  SHEET_3_ATTRIBUTES: 'Attribute Comparisons',
  SHEET_4_DATA_GAPS: 'Technical Data Gaps',
  SHEET_5_REVIEW_HISTORY: 'Review Audit History',
  SHEET_6_METHODOLOGY: 'Methodology & Safeguards'
} as const;

export const SPECIFICATION_THRESHOLDS = {
  HIGH_SIMILARITY_SCORE: 0.85,
  MODERATE_SIMILARITY_SCORE: 0.70,
  MIN_TOKEN_LENGTH: 3
} as const;


export const specificationRationalisationQuerySchema = z.object({
  assessmentId: z.string().min(1).optional().default('AIC-2026-0002'),
  similarityThreshold: z.coerce.number().min(0.1).max(1.0).optional()
});

export const specificationRationalisationReviewSchema = z
  .object({
    assessmentId: z.string().min(1).optional().default('AIC-2026-0002'),
    candidateId: z.string().min(1, 'candidateId is required'),
    status: z.enum(['TECHNICALLY_VERIFIED', 'REJECTED', 'AWAITING_TECHNICAL_REVIEW']),
    reviewerName: z.string().min(1, 'reviewerName is required'),
    reviewerRole: z.string().optional(),
    technicalJustification: z.string().min(1, 'technicalJustification is required'),
    proposedStandard: z.string().optional(),
    applicationScope: z.string().optional(),
    rejectionReason: z.string().optional()
  })
  .refine(
    (data) => data.status !== 'REJECTED' || Boolean(data.rejectionReason && data.rejectionReason.trim().length > 0),
    {
      message: 'rejectionReason is mandatory when review status is REJECTED',
      path: ['rejectionReason']
    }
  );

