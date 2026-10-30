import { D1_REPORTING } from './d1';

export const MODULE2_D1_COMPLIANCE_REVIEW_STATUSES = [
  'VERIFIED_EXCEPTION', 'NOT_AN_EXCEPTION', 'AWAITING_REVIEW'
] as const;

export const MODULE2_D1_COMPLIANCE_CHECK_TYPES = [
  'PRICE_INCONSISTENCY', 'PURCHASE_PATTERN_EXCEPTION', 'PO_TRANSACTION_EXCEPTION',
  'SOURCING_APPROVAL_GAP', 'PAYMENT_COMMERCIAL_EXCEPTION', 'CONTRACT_COMPLIANCE_DISCLOSURE'
] as const;

export const MODULE2_D1_COMPLIANCE = {
  INR_PER_CRORE: D1_REPORTING.inrPerCrore,
  PRICE_VARIANCE_RATIO: 0.2,
  MIN_PRICE_COMPARISON_SUPPLIERS: 2,
  DECIMAL_PLACES: D1_REPORTING.decimalPlaces,
  CONTROL_CHECKS: [
    { type: 'PRICE_INCONSISTENCY', title: 'Historical price inconsistency' },
    { type: 'PURCHASE_PATTERN_EXCEPTION', title: 'Purchase pattern exception' },
    { type: 'PO_TRANSACTION_EXCEPTION', title: 'Purchase order transaction exception' },
    { type: 'SOURCING_APPROVAL_GAP', title: 'Sourcing approval gap' },
    { type: 'PAYMENT_COMMERCIAL_EXCEPTION', title: 'Payment and commercial exception' },
    { type: 'CONTRACT_COMPLIANCE_DISCLOSURE', title: 'Contract compliance disclosure' }
  ],
  PRICE_VARIANCE_TITLE: 'Historical price variance requires investigation',
  DUPLICATE_SCHEDULE_TITLE: 'Repeated purchase order schedule requires review',
  MISSING_EVIDENCE_TITLE: 'Required procurement identifiers are missing',
  PRICE_VARIANCE_METHOD: 'Compares assessment transactions for the same material and unit across suppliers. A price spread above the configured screening threshold is an investigation signal only.',
  DUPLICATE_SCHEDULE_METHOD: 'Groups repeated source rows by purchase order and line. A repeated key may be a source duplication or a legitimate schedule split and requires human review.',
  MISSING_EVIDENCE_METHOD: 'Flags source rows missing a purchase order, material code, or unit of measure. The source record must be corrected before a control conclusion can be made.',
  REQUIRED_SOURCE_FIELDS_GAP: 'This assessment does not contain the approval, payment-term, or contract evidence required to assess this control.',
  NO_COMPLIANCE_EVIDENCE: 'No assessment-backed evidence is available for this control.',
  CONTRACT_STATUS: 'NOT ASSESSED — CONTRACT SOURCE EVIDENCE IS NOT AVAILABLE',
  FINANCIAL_DISCLAIMER: 'Potential exposures are investigation signals derived from historical D1 transactions, not confirmed losses, savings, or legal findings. Verified financial impact remains zero until separately evidenced and approved.',
  METHODOLOGY_SAFEGUARDS: [
    'Every exception is tied to rows from the selected assessment in D1.',
    'Historical price differences and duplicate indicators are review candidates, not confirmed non-compliance.',
    'No realized savings or verified financial impact is inferred from a review status.',
    'Approval, payment-term, and contract controls remain unassessed when the source evidence is absent.'
  ],
  EXPORT: {
    MIME_TYPE: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    FILENAME_PREFIX: 'Procurement_Compliance_',
    SHEETS: ['Summary', 'Exceptions', 'Control Checks', 'Methodology']
  }
} as const;
