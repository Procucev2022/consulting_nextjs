/**
 * Module 2 — Lever 9: Procurement Compliance & Control
 * Backend Constants, Governance Labels & Zod Schemas
 * Compliant with Rule 8, 9, 10, max 300 lines, line length <= 120 chars
 */

import { z } from 'zod';
import type {
  ProcurementComplianceStatus,
  ProcurementComplianceCheckType,
  FinancialExposureClassification
} from '../types/module2ProcurementCompliance';

export const COMPLIANCE_REVIEW_STATUSES: Record<string, ProcurementComplianceStatus> = {
  POTENTIAL_EXCEPTION: 'POTENTIAL_EXCEPTION',
  AWAITING_REVIEW: 'AWAITING_REVIEW',
  VERIFIED_EXCEPTION: 'VERIFIED_EXCEPTION',
  NOT_AN_EXCEPTION: 'NOT_AN_EXCEPTION',
  DATA_INSUFFICIENT: 'DATA_INSUFFICIENT'
} as const;

export const COMPLIANCE_CHECK_TYPES: Record<string, ProcurementComplianceCheckType> = {
  PRICE_INCONSISTENCY: 'PRICE_INCONSISTENCY',
  PURCHASE_PATTERN_EXCEPTION: 'PURCHASE_PATTERN_EXCEPTION',
  PO_TRANSACTION_EXCEPTION: 'PO_TRANSACTION_EXCEPTION',
  SOURCING_APPROVAL_GAP: 'SOURCING_APPROVAL_GAP',
  PAYMENT_COMMERCIAL_EXCEPTION: 'PAYMENT_COMMERCIAL_EXCEPTION',
  CONTRACT_COMPLIANCE_DISCLOSURE: 'CONTRACT_COMPLIANCE_DISCLOSURE'
} as const;

export const COMPLIANCE_FINANCIAL_LABELS: Record<FinancialExposureClassification, string> = {
  PRICE_VARIANCE_INVESTIGATION_SIGNAL: 'PRICE_VARIANCE_INVESTIGATION_SIGNAL',
  POTENTIAL_PO_SCHEDULE_DUPLICATE: 'POTENTIAL_PO_SCHEDULE_DUPLICATE — AP VERIFICATION REQUIRED',
  POTENTIAL_DUPLICATE_TRANSACTION: 'POTENTIAL_DUPLICATE_TRANSACTION — AP VERIFICATION REQUIRED',
  POTENTIAL_EXPOSURE_REQUIRES_VALIDATION: 'Potential Financial Exposure — Requires Validation',
  NOT_YET_QUANTIFIABLE_ADDITIONAL_DATA_REQUIRED: 'Not Yet Quantifiable — Additional Data Required',
  VERIFIED_EXCEPTION_IMPACT_NOT_YET_ESTABLISHED: 'Verified Exception — Financial Impact Not Yet Established'
} as const;

export const COMPLIANCE_CONFIGURABLE_THRESHOLDS = {
  PRICE_DISPERSION_THRESHOLD_PCT: 5.0,
  SUPPLIER_CONCENTRATION_THRESHOLD_PCT: 40.0,
  FRAGMENTED_ORDER_MIN_TRANSACTIONS: 5,
  MIN_PRICE_EXCESS_INR: 10000
} as const;

export const COMPLIANCE_AUTHORIZED_ROLES = [
  'ADMIN',
  'AUDIT_LEAD',
  'PROCUREMENT_OFFICER',
  'INTERNAL_AUDITOR',
  'CONTROLLER',
  'AUDITOR',
  'MANAGER',
  'LEAD_AUDITOR'
] as const;

export const COMPLIANCE_DISCLOSURES = {
  CONTRACT_COMPLIANCE_NOTICE:
    'Contract Compliance Verification — Additional Contract or Rate-Card Data Required.',
  FINANCIAL_EXPOSURE_NOTICE:
    'Potential financial exposure reflects transaction variance under investigation; it does not represent realised savings or confirmed recoveries.',
  DUPLICATE_CHECK_DISCLOSURE:
    'Duplicate identification is deterministic, requiring identical vendor, material code, date, quantity, and spend value.',
  DATA_GAP_NOTICE:
    'Where ERP line item fields are unpopulated, field-level gaps are recorded without assuming unauthorised procurement.',
  ANALYTICAL_RULES_NOTICE:
    'The 5% price dispersion, 40% supplier concentration, and 5-transaction order fragmentation thresholds are configurable analytical rules, not universal industry standards.'
} as const;

export const COMPLIANCE_METHODOLOGY_SAFEGUARDS: string[] = [
  'Lever 9 performs procurement control and transaction anomaly checks on available purchase data without requiring executed contracts.',
  'Price inconsistencies are calculated only when material code, UOM, and currency are identical across compared line items.',
  'Lowest historical purchase price is not interpreted as an automatically achievable rate; variance is labeled potential exposure requiring validation.',
  'The 5% price-dispersion, 40% supplier concentration, and 5-order fragmentation thresholds are configurable analytical rules, not statutory benchmarks.',
  'Supplier pattern anomalies and fragmented orders serve as investigation signals and are not labeled as contractual breaches.',
  'Deterministic duplicate matching prevents false positives by requiring exact match across supplier, item, date, quantity, and amount.',
  'Credit notes, reversals, and negative expenditure entries are handled as adjustments and are never interpreted as positive exposure.',
  'Approval and sourcing-reference absences are documented as ERP extract data gaps, not classified as unauthorized spend.',
  'Missing payment terms are disclosed without calculating assumed working capital benefits or duplicating Lever 5.',
  'Potential financial exposure is strictly segregated from savings and distinguished from non-quantifiable control gaps.',
  'Cross-lever overlap controls record potential intersections with Levers 1–8 without double counting financial benefits.'
];

export const COMPLIANCE_EXCEL_SHEETS = {
  SHEET_1_EXECUTIVE: 'Executive Summary',
  SHEET_2_EXCEPTIONS: 'Exceptions Register',
  SHEET_3_CHECKS: 'Control Checks Breakdown',
  SHEET_4_DATA_GAPS: 'Data Gaps & Coverage',
  SHEET_5_REVIEW_HISTORY: 'Review Audit History',
  SHEET_6_METHODOLOGY: 'Methodology & Safeguards'
} as const;

export const COMPLIANCE_CONTROL_CHECKS_CONFIG: {
  type: ProcurementComplianceCheckType;
  title: string;
  gap?: string;
}[] = [
  {
    type: 'PRICE_INCONSISTENCY',
    title: 'Inter-Transaction Unit Price Inconsistency',
    gap: 'Contractual volume discount tiers and freight inclusions not available in ERP extract.'
  },
  {
    type: 'PURCHASE_PATTERN_EXCEPTION',
    title: 'Supplier & Purchase Pattern Exceptions',
    gap: 'Supplier exclusivity agreements and emergency procurement orders unflagged in extract.'
  },
  {
    type: 'PO_TRANSACTION_EXCEPTION',
    title: 'PO References & Deterministic Duplicate Checks',
    gap: 'Goods receipt confirmation logs and AP clearing dates absent from upload.'
  },
  {
    type: 'SOURCING_APPROVAL_GAP',
    title: 'Sourcing & Approval Control Gaps',
    gap: 'Tender competition records and single-source authorization files require Phase 2 integration.'
  },
  {
    type: 'PAYMENT_COMMERCIAL_EXCEPTION',
    title: 'Payment Terms & Credit Window Verification',
    gap: 'ERP extract lacks early payment discount schedule master data.'
  },
  {
    type: 'CONTRACT_COMPLIANCE_DISCLOSURE',
    title: 'Contract Compliance & Rate-Card Audit',
    gap: 'Executed contract documents and rate-card master files require Phase 2 integration.'
  }
];

export const procurementComplianceQuerySchema = z.object({
  assessmentId: z.string().min(1).optional().default('AIC-2026-0002')
});

export const procurementComplianceReviewSchema = z
  .object({
    assessmentId: z.string().min(1).optional().default('AIC-2026-0002'),
    candidateId: z.string().min(1, 'candidateId is required'),
    status: z.enum(['VERIFIED_EXCEPTION', 'NOT_AN_EXCEPTION', 'AWAITING_REVIEW']),
    reviewerName: z.string().min(1, 'reviewerName is required'),
    reviewerRole: z.string().optional(),
    technicalJustification: z.string().min(1, 'technicalJustification is required'),
    correctiveActionPlan: z.string().optional(),
    dismissalReason: z.string().optional()
  })
  .refine(
    (data) => data.status !== 'NOT_AN_EXCEPTION' || Boolean(data.dismissalReason && data.dismissalReason.trim().length > 0),
    {
      message: 'dismissalReason is mandatory when review status is NOT_AN_EXCEPTION',
      path: ['dismissalReason']
    }
  );
