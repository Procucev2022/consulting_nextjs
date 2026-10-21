/**
 * Module 2 — Lever 9: Procurement Compliance & Control
 * Frontend Constants & Governance Rules
 * Compliant with Rule 8, 9, max 300 lines, line length <= 120 chars
 */

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

export const COMPLIANCE_STATUS_LABELS: Record<ProcurementComplianceStatus, string> = {
  POTENTIAL_EXCEPTION: 'Potential Exception (System Signal)',
  AWAITING_REVIEW: 'Awaiting Audit Review',
  VERIFIED_EXCEPTION: 'Verified Exception',
  NOT_AN_EXCEPTION: 'Dismissed (Not An Exception)',
  DATA_INSUFFICIENT: 'Data Insufficient For Check'
};

export const COMPLIANCE_CHECK_LABELS: Record<ProcurementComplianceCheckType, string> = {
  PRICE_INCONSISTENCY: 'Price Inconsistency (Same Material & UOM)',
  PURCHASE_PATTERN_EXCEPTION: 'Supplier & Purchase Pattern Exception',
  PO_TRANSACTION_EXCEPTION: 'PO & Transaction Exception (Deterministic)',
  SOURCING_APPROVAL_GAP: 'Sourcing & Approval Control Gap',
  PAYMENT_COMMERCIAL_EXCEPTION: 'Payment & Commercial Exception',
  CONTRACT_COMPLIANCE_DISCLOSURE: 'Contract Compliance Disclosure'
};

export const COMPLIANCE_FINANCIAL_LABELS: Record<FinancialExposureClassification, string> = {
  PRICE_VARIANCE_INVESTIGATION_SIGNAL: 'PRICE_VARIANCE_INVESTIGATION_SIGNAL',
  POTENTIAL_PO_SCHEDULE_DUPLICATE: 'POTENTIAL_PO_SCHEDULE_DUPLICATE — AP VERIFICATION REQUIRED',
  POTENTIAL_DUPLICATE_TRANSACTION: 'POTENTIAL_DUPLICATE_TRANSACTION — AP VERIFICATION REQUIRED',
  POTENTIAL_EXPOSURE_REQUIRES_VALIDATION: 'Potential Financial Exposure — Requires Validation',
  NOT_YET_QUANTIFIABLE_ADDITIONAL_DATA_REQUIRED: 'Not Yet Quantifiable — Additional Data Required',
  VERIFIED_EXCEPTION_IMPACT_NOT_YET_ESTABLISHED: 'Verified Exception — Financial Impact Not Yet Established'
};

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
    'Potential financial exposure reflects transaction variance under investigation; ' +
    'it does not represent realised savings or confirmed recoveries.',
  DUPLICATE_CHECK_DISCLOSURE:
    'Duplicate identification is deterministic, requiring identical vendor, material code, ' +
    'date, quantity, and spend value.',
  DATA_GAP_NOTICE:
    'Where ERP line item fields are unpopulated, field-level gaps are recorded without assuming unauthorised spend.',
  ANALYTICAL_RULES_NOTICE:
    'The 5% price dispersion, 40% supplier concentration, and 5-transaction order fragmentation thresholds are configurable analytical rules, not universal industry standards.'
} as const;

export const COMPLIANCE_METHODOLOGY_SAFEGUARDS: string[] = [
  'Lever 9 performs procurement control and transaction anomaly checks on available purchase data without ' +
    'requiring executed contracts.',
  'Price inconsistencies are calculated only when material code, UOM, and currency are identical across ' +
    'compared line items.',
  'Lowest historical purchase price is not interpreted as an automatically achievable rate; variance is labeled ' +
    'potential exposure requiring validation.',
  'The 5% price-dispersion, 40% supplier concentration, and 5-order fragmentation thresholds are configurable ' +
    'analytical rules, not statutory benchmarks.',
  'Supplier pattern anomalies and fragmented orders serve as investigation signals and are not labeled as ' +
    'contractual breaches.',
  'Deterministic duplicate matching prevents false positives by requiring exact match across supplier, item, ' +
    'date, quantity, and amount.',
  'Credit notes, reversals, and negative expenditure entries are handled as adjustments and are never interpreted ' +
    'as positive exposure.',
  'Approval and sourcing-reference absences are documented as ERP extract data gaps, not classified as ' +
    'unauthorized spend.',
  'Missing payment terms are disclosed without calculating assumed working capital benefits or duplicating Lever 5.',
  'Potential financial exposure is strictly segregated from savings and distinguished from non-quantifiable ' +
    'control gaps.',
  'Cross-lever overlap controls record potential intersections with Levers 1–8 without double counting ' +
    'financial benefits.'
];

export const COMPLIANCE_UI_STRINGS = {
  TITLE: 'Module 2 — Lever 9: Procurement Compliance & Control',
  SUBTITLE: 'Defensible Transaction Auditing & Control Gap Identification (Zero Assumed Contractual Breaches)',
  BADGE: 'LEVER 9 — COMPLIANCE & CONTROL',
  KPI_TRANSACTIONS_REVIEWED: 'Total Transactions Reviewed',
  KPI_EXCEPTIONS_IDENTIFIED: 'Exceptions Identified',
  KPI_AWAITING_REVIEW: 'Awaiting Audit Review',
  KPI_VERIFIED_EXCEPTIONS: 'Verified Exceptions',
  KPI_DISMISSED: 'Dismissed After Review',
  KPI_EXPENDITURE_UNDER_REVIEW: 'Expenditure Under Review',
  KPI_POTENTIAL_EXPOSURE: 'Potential Financial Exposure',
  KPI_NON_QUANTIFIABLE: 'Non-Quantifiable Exceptions',
  KPI_UNIQUE_EXPENDITURE: 'Unique Expenditure Under Review',
  KPI_PRICE_VARIANCE_SIGNALS: 'Price-Variance Signals',
  KPI_PO_SCHEDULE_DUPLICATES: 'Same-PO Schedule Duplicates',
  KPI_CROSS_PO_DUPLICATES: 'Cross-PO Duplicates',
  KPI_TOTAL_AWAITING_AP: 'Total Awaiting AP Verification',
  KPI_OTHER_GOVERNANCE: 'Other Governance Exceptions',
  KPI_QUANTIFIED_DEFENSIBLE: 'Quantified Defensible Exposure',
  KPI_VERIFIED_IMPACT: 'Verified Financial Impact',
  SUB_INVESTIGATION_SIGNAL: 'INVESTIGATION SIGNAL',
  SUB_AWAITING_AP: 'AWAITING AP VERIFICATION',
  SUB_ZERO_LOSS_CLAIMED: 'ZERO CONFIRMED LOSS CLAIMED',
  REQUIRES_VALIDATION: 'REQUIRES VALIDATION',
  NOT_APPLICABLE: 'N/A',
  BTN_EXPORT_EXCEL: 'Export Compliance Audit Excel (6 Sheets)',
  BTN_BACK_TO_OVERVIEW: 'Back to Sourcing Levers',
  BTN_AUDIT_REVIEW: 'Audit Review',
  BTN_RETRY: 'Retry',
  TAB_ALL_EXCEPTIONS: 'All Exceptions',
  TAB_AWAITING_REVIEW: 'Awaiting Review',
  TAB_VERIFIED: 'Verified Exceptions',
  TAB_DISMISSED: 'Dismissed / Inactive',
  TAB_DATA_GAPS: 'Data Gaps & Disclosures',
  MODAL_TITLE: 'Procurement Control Exception Review & Sign-Off',
  MODAL_SUBTITLE: 'Inspect underlying transaction evidence, assess control risks, and record formal audit review',
  FIELD_REVIEWER_NAME: 'Reviewer Full Name',
  FIELD_REVIEWER_ROLE: 'Reviewer Title / Professional Role',
  FIELD_DECISION: 'Audit Decision',
  FIELD_JUSTIFICATION: 'Audit Justification & Investigation Scope',
  FIELD_ACTION_PLAN: 'Corrective Action Plan / Control Remediation',
  FIELD_DISMISSAL_REASON: 'Dismissal Reason (Mandatory if dismissed)',
  BTN_CANCEL: 'Cancel',
  BTN_SUBMIT_REVIEW: 'Record Audit Decision',
  SUBMITTING: 'Recording Decision...',
  COL_EXCEPTION_ID: 'Exception ID',
  COL_CHECK_TYPE: 'Control Check Type',
  COL_ITEM_VENDOR: 'Material / Supplier',
  COL_TX_COUNT: 'Tx Count',
  COL_EXPENDITURE: 'Spend Under Review',
  COL_POTENTIAL_EXPOSURE: 'Potential Exposure',
  COL_STATUS: 'Review Status',
  COL_ACTIONS: 'Actions'
} as const;

export const COMPLIANCE_TABLE_COLUMNS = [
  { label: COMPLIANCE_UI_STRINGS.COL_EXCEPTION_ID, align: 'text-left' },
  { label: COMPLIANCE_UI_STRINGS.COL_CHECK_TYPE, align: 'text-left' },
  { label: COMPLIANCE_UI_STRINGS.COL_ITEM_VENDOR, align: 'text-left' },
  { label: COMPLIANCE_UI_STRINGS.COL_TX_COUNT, align: 'text-right' },
  { label: COMPLIANCE_UI_STRINGS.COL_EXPENDITURE, align: 'text-right' },
  { label: COMPLIANCE_UI_STRINGS.COL_POTENTIAL_EXPOSURE, align: 'text-right' },
  { label: COMPLIANCE_UI_STRINGS.COL_STATUS, align: 'text-left' },
  { label: COMPLIANCE_UI_STRINGS.COL_ACTIONS, align: 'text-right' }
] as const;
