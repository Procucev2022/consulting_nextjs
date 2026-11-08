/**
 * Module 2 — Lever 5: Payment Terms Optimisation Frontend Constants
 * Compliant with Rule 7, 8, 9, max 300 lines, line length <= 120 chars
 */

import type {
  PaymentTermsDataAvailabilityStatus,
  PaymentTermsDataGapReason
} from '../types/module2PaymentTerms';
import { UI_STRINGS } from './uiStrings';

export const PROCUCEV_STANDARD_FINANCING_RATE_PER_30_DAYS = 0.015;
export const DAYS_IN_STANDARD_YEAR = 365;
export const STANDARD_CREDIT_INTERVAL_DAYS = 30;
export const PAYMENT_TERMS_ENDPOINT = '/api/module2/sourcing/payment-terms';

export const PAYMENT_TERMS_STATUS_DISPLAY_LABELS: Record<PaymentTermsDataAvailabilityStatus, string> =
  UI_STRINGS.module2.paymentTerms.availabilityLabels;

export const PAYMENT_TERMS_SIMULATION_DEFAULT_SPEND_CR = 120;
export const PAYMENT_TERMS_SIMULATION_DEFAULT_CREDIT_DAYS = 30;
export const PAYMENT_TERMS_SIMULATION_CREDIT_DAY_OPTIONS = [15, 30, 45, 60, 90] as const;
export const PAYMENT_TERMS_SUPPLIER_PREVIEW_LIMIT = 50;
export const PAYMENT_TERMS_TRANSACTION_PREVIEW_LIMIT = 100;

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
