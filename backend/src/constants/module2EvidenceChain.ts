/**
 * Module 2 — Transaction-Level Evidence, Savings Proof & Traceability Constants
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

export const LOWEST_CREDIBLE_PRICE_CONFIG = {
  MIN_VOLUME_SHARE_THRESHOLD: 0.05, // Transaction must represent at least 5% of comparable volume
  MAX_MEDIAN_DISCOUNT_FACTOR: 0.65, // Price cannot be lower than 65% of median (prevents erroneous dump prices)
  MIN_SUPPLIER_TRANSACTIONS: 2, // Supplier must have at least 2 transactions
  RECENCY_MONTHS_WINDOW: 24 // Historical transaction validity window
};

export const ZERO_OPPORTUNITY_DIAGNOSTIC_REASONS = [
  'Low historical price dispersion across incumbent suppliers',
  'Insufficient count of standardized comparable transactions',
  'Single supplier lock-in with unobservable market pricing',
  'Active long-term fixed price contract restrictions',
  'Low recurring transaction volume in recent periods',
  'Insufficient historical depth (< 6 active months)',
  'High supplier concentration with pricing discipline',
  'Stable index-linked pricing agreements already active',
  'Specification fragmentation preventing cross-supplier comparison'
];

export const UNTESTED_OPPORTUNITY_AREAS = [
  'E-auction dynamic market price discovery',
  'Competitive multi-supplier RFQ tender',
  'Volume aggregation across operating facilities',
  'Commercial terms & payment period renegotiation',
  'Specification harmonization & SKU rationalization',
  'Demand smoothing & emergency order suppression',
  'Cross-category strategic vendor consolidation',
  'Tail-spend supplier base rationalization'
];

export const EVIDENCE_SAFEGUARD_NOTICES = {
  ANALYTICAL_OPPORTUNITY_LABEL: 'ANALYTICAL PROCUREMENT OPPORTUNITY — NOT REALIZED SAVINGS',
  ZERO_SAVINGS_EXPLANATION:
    'No quantified price opportunity identified from internal historical transactions. This does NOT indicate procurement is optimized. Competitive market discovery is strongly recommended.',
  ADDRESSABILITY_DISCLAIMER:
    'Spend addressability represents analytical opportunity potential. Realized savings are certified exclusively through Module 4 execution.'
};
