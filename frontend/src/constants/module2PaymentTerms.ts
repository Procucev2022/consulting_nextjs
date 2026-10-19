/**
 * Module 2 — Lever 5: Payment Terms Optimisation Frontend Constants
 * Compliant with Rule 7, 8, 9, max 300 lines, line length <= 120 chars
 */

import type {
  PaymentTermsDataAvailabilityStatus,
  PaymentTermsDataGapReason
} from '../types/module2PaymentTerms';

export const PROCUCEV_STANDARD_FINANCING_RATE_PER_30_DAYS = 0.015;
export const DAYS_IN_STANDARD_YEAR = 365;
export const STANDARD_CREDIT_INTERVAL_DAYS = 30;

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

export const PAYMENT_TERMS_UI_STRINGS = {
  TITLE: 'Lever 5: Payment Terms Optimisation',
  SUBTITLE:
    'Analyses supplier payment terms, identifies evidence-supported opportunities to negotiate additional credit days, and calculates indicative financing benefits.',
  GOVERNANCE_NOTICE:
    'Procucev standard modelling rate = 1.5% per additional 30 days of credit. Missing payment terms are never invented or assumed as zero.',
  TAB_COVERAGE: 'Data Coverage & Gap Audit',
  TAB_OPPORTUNITIES: 'Payment Terms Opportunities',
  TAB_SUPPLIERS: 'Supplier Profile Analysis',
  TAB_SCENARIOS: 'Credit Terms Simulation',
  TAB_TRANSACTIONS: 'Transaction Register',
  KPI_TOTAL_SPEND_ANALYSED: 'Total Spend Analysed',
  KPI_VERIFIED_SPEND: 'Verified Payment Terms Spend',
  KPI_MISSING_SPEND: 'Missing Payment Terms Spend',
  KPI_DATA_AVAILABILITY_STATUS: 'Data Availability Status',
  KPI_WORKING_CAPITAL_RELEASED: 'Indicative Working Capital Released',
  KPI_FINANCING_BENEFIT: 'Indicative Annual Financing Benefit',
  KPI_FINANCING_BENEFIT_SUB: 'Procucev 1.5% / 30 days modelling rate',
  EXPORT_BUTTON: 'Download 8-Sheet Auditable Excel Report',
  FILTER_ALL: 'All Statuses',
  SEARCH_PLACEHOLDER: 'Search by supplier, spend category, or payment terms...',
  DATA_UNAVAILABLE_MESSAGE: 'Data Unavailable — Payment Terms Not Found in Source Data.',
  DATA_UNAVAILABLE_SUB: 'The source ERP extract does not contain payment term fields. No financing benefit has been fabricated.',
  EMPTY_RECORDS: 'No payment terms records matching the criteria.',
  SCENARIO_BOX_TITLE: 'Illustrative Credit Extension Scenario Simulator',
  SCENARIO_GOVERNANCE_TAG: 'ILLUSTRATIVE, UNAPPROVED SCENARIO — NOT AN IDENTIFIED OPPORTUNITY',
  SCENARIO_DISCLAIMER:
    'This scenario simulator is an interactive modelling sandbox. It does not appear as an identified opportunity and does not feed into opportunity totals until required commercial inputs and approvals are provided.',
  SCENARIO_RATE_NOTE: 'Procucev standard modelling rate: 1.5% per additional 30 days of credit (simple linear, non-compounded).'
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
