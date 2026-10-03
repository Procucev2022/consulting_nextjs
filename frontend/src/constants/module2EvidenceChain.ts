/**
 * Module 2 — Transaction-Level Evidence, Savings Proof & Traceability Constants (Frontend)
 * Version: MODULE_2_EVIDENCE_LOGIC_V1.0
 */

import type { ExclusionReasonCode } from '../types/module2EvidenceChain';

export const MODULE_2_EVIDENCE_VERSION = 'MODULE_2_EVIDENCE_LOGIC_V1.0';

export const EXCLUSION_REASON_DESCRIPTIONS: Record<ExclusionReasonCode, string> = {
  EXCLUDED_SPEC_MISMATCH: 'Item specification or grade differs from the standard baseline specification.',
  EXCLUDED_UOM_MISMATCH: 'Unit of measure cannot be harmonized without verified conversion factor.',
  EXCLUDED_CURRENCY_MISMATCH: 'Transaction currency differs and lacks reliable historical exchange rate.',
  EXCLUDED_GEOGRAPHY: 'Delivery location has unique freight or duty structures that prevent direct price comparison.',
  EXCLUDED_SINGLE_SOURCE_OUTLIER: 'Single-source abnormal spot transaction outside the interquartile range.',
  EXCLUDED_LOW_VOLUME: 'Order volume is below the statistical threshold (< 1% category volume).',
  EXCLUDED_CONTRACT_LOCK: 'Spend is bound by long-term legal contract and cannot be competed immediately.',
  EXCLUDED_NON_RECURRING: 'One-time, prototype, or emergency purchase not representative of recurring demand.',
  EXCLUDED_INVALID_TRANSACTION: 'Zero, negative, or unverified transaction price/quantity.',
  EXCLUDED_INSUFFICIENT_DATA: 'Missing essential line-item attributes (item code, supplier, or date).',
  EXCLUDED_PRICE_NOT_COMPARABLE: 'Commercial pricing structure includes bundled services or unbundled tooling.'
};

export const EVIDENCE_SAFEGUARD_NOTICES = {
  ANALYTICAL_OPPORTUNITY_LABEL: 'ANALYTICAL PROCUREMENT OPPORTUNITY — NOT REALIZED SAVINGS',
  ZERO_SAVINGS_EXPLANATION:
    'No quantified price opportunity identified from internal historical transactions. This does NOT indicate procurement is optimized. Competitive market discovery is strongly recommended.',
  ADDRESSABILITY_DISCLAIMER:
    'Spend addressability represents analytical opportunity potential. Realized savings are certified exclusively through Module 4 execution.'
};
