/**
 * Module 2 — Lever 5: Payment Terms Optimisation Constants
 * Compliant with Rule 8, 9, max 300 lines, line length <= 120 chars
 */

import type {
  PaymentTermsDataAvailabilityStatus,
  PaymentTermsDataGapReason
} from '../types/module2PaymentTerms';

/** Centrally governed default financing rate for Indian company assessments (1.5% per 30 days) */
export const PROCUCEV_STANDARD_FINANCING_RATE_PER_30_DAYS = 0.015;

/** Standard day count conventions */
export const DAYS_IN_STANDARD_YEAR = 365;
export const STANDARD_CREDIT_INTERVAL_DAYS = 30;

/** Default scenario targets */
export const DEFAULT_TARGET_CREDIT_DAYS_SCENARIO = 60;
export const EXTENDED_TARGET_CREDIT_DAYS_SCENARIO = 90;

export const PAYMENT_TERMS_DATA_AVAILABILITY_STATUSES: Record<
  PaymentTermsDataAvailabilityStatus,
  PaymentTermsDataAvailabilityStatus
> = {
  OPPORTUNITY_IDENTIFIED: 'OPPORTUNITY_IDENTIFIED',
  DATA_PARTIALLY_AVAILABLE: 'DATA_PARTIALLY_AVAILABLE',
  DATA_UNAVAILABLE: 'DATA_UNAVAILABLE',
  AWAITING_VALIDATION: 'AWAITING_VALIDATION',
  NOT_YET_QUANTIFIABLE: 'NOT_YET_QUANTIFIABLE'
} as const;

export const PAYMENT_TERMS_STATUS_DISPLAY_LABELS: Record<PaymentTermsDataAvailabilityStatus, string> = {
  OPPORTUNITY_IDENTIFIED: 'Opportunity Identified',
  DATA_PARTIALLY_AVAILABLE: 'Data Partially Available',
  DATA_UNAVAILABLE: 'Data Unavailable — Payment Terms Not Found in Source Data',
  AWAITING_VALIDATION: 'Awaiting Validation',
  NOT_YET_QUANTIFIABLE: 'Not Yet Quantifiable'
} as const;

export const PAYMENT_TERMS_DATA_GAP_DESCRIPTIONS: Record<PaymentTermsDataGapReason, string> = {
  FIELD_NOT_IN_SOURCE_ERP: 'Payment terms field is not present in the customer source ERP extract.',
  UNPARSEABLE_PAYMENT_TERM_FORMAT: 'Payment term text could not be parsed into numeric credit days without ambiguity.',
  INCONSISTENT_HEADER_AND_LINE_TERMS: 'Header terms conflict with purchase line item terms.',
  ADVANCE_OR_NON_CREDIT_TERMS: 'Transaction recorded under advance, letter of credit, or immediate cash terms.',
  MISSING_INVOICE_OR_DUE_DATE: 'Due date or invoice date missing to compute actual credit cycle.'
} as const;

export const PAYMENT_TERMS_METHODOLOGY_DISCLOSURES: string[] = [
  'Standard Modelling Assumption: Procucev standard modelling rate of 1.5% per additional 30 days of credit is an analytical baseline for Indian corporate assessments, not an assertion of uniform corporate borrowing costs.',
  'Linear Pro-Rata Benefit: Indicative Annual Financing Benefit is computed via simple linear pro-rata calculation (Spend * 1.5% * Additional Days / 30) without compounding.',
  'Strict Working Capital Segregation: Working Capital Released (Spend / 365 * Additional Days) is computed and displayed independently. Financing benefits and released working capital are never summed together.',
  'Zero Invention of Missing Data: Missing payment terms are reported transparently as Data Unavailable and never interpreted as 0 credit days, immediate payment, or automatic savings.',
  'Early-Payment Discount Separation: Early-payment discount cash yields are evaluated separately from payment-term extension benefits to prevent double-counting.',
  'Scenario Auditing & Governance: Proposed additional credit days are treated as explicit scenario hypotheses requiring commercial validation and approval before execution.',
  'Full Mathematical Reconciliation: Coverage figures, spend totals, and record counts reconcile 100% to authoritative source transactions with zero discrepancy.'
];

export const PAYMENT_TERMS_EXCEL_SHEETS = {
  SHEET_1_EXECUTIVE: '1. Executive Summary',
  SHEET_2_DATA_COVERAGE: '2. Data Coverage & Audit',
  SHEET_3_OPPORTUNITIES: '3. Payment Terms Opportunities',
  SHEET_4_SUPPLIER_ANALYSIS: '4. Supplier Terms Analysis',
  SHEET_5_EARLY_PAYMENT: '5. Early Payment Discounts',
  SHEET_6_WORKING_CAPITAL: '6. Working Capital Modeling',
  SHEET_7_TRANSACTIONS: '7. Purchase Transactions',
  SHEET_8_GOVERNANCE: '8. Methodology & Governance'
} as const;
