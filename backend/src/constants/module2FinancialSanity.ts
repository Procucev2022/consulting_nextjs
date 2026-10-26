/**
 * Module 2 Financial Formula & Savings Sanity Certification Constants
 * Version: MODULE_2_FINANCIAL_SANITY_V1.0
 */

export const FINANCIAL_SANITY_THRESHOLDS = {
  RATE_FLAG_25_PCT: 25,
  RATE_FLAG_50_PCT: 50,
  RATE_FLAG_100_PCT: 100,
  MAX_ALLOWED_VARIANCE_INR: 0.01,
  CONSERVATIVE_DELIVERY_MIN_PCT: 10.0,
  CONSERVATIVE_DELIVERY_MAX_PCT: 25.0
} as const;

export const FINANCIAL_GOVERNANCE_DELIVERY_RATES = {
  INDICATIVE_MIN_PCT: 10.0,
  INDICATIVE_MAX_PCT: 25.0,
  FORMULA_DESCRIPTION: 'Delivery Minimum = Proven Opportunity * 0.10; Delivery Maximum = Proven Opportunity * 0.25'
} as const;

export const FINANCIAL_DENOMINATOR_TYPES = {
  PRICE_VARIANCE_ELIGIBLE_SPEND: 'PRICE_VARIANCE_ELIGIBLE_SPEND',
  VOLUME_BUNDLING_ELIGIBLE_SPEND: 'VOLUME_BUNDLING_ELIGIBLE_SPEND',
  VENDOR_CONSOLIDATION_ELIGIBLE_SPEND: 'VENDOR_CONSOLIDATION_ELIGIBLE_SPEND',
  E_AUCTION_ELIGIBLE_SPEND: 'E_AUCTION_ELIGIBLE_SPEND',
  HISTORICAL_PRICE_VARIANCE_SPEND: 'HISTORICAL_PRICE_VARIANCE_SPEND',
  OTHER_APPROVED_DENOMINATOR: 'OTHER_APPROVED_DENOMINATOR'
} as const;

export const FINANCIAL_SANITY_SHEETS = [
  '01_README',
  '02_FINANCIAL_CERTIFICATION',
  '03_TOTAL_SPEND_RECONCILIATION',
  '04_ADDRESSABLE_SPEND',
  '05_OPPORTUNITY_DENOMINATORS',
  '06_GROSS_OPPORTUNITY_LEDGER',
  '07_VOLUME_BUNDLING',
  '08_VENDOR_CONSOLIDATION',
  '09_E_AUCTION',
  '10_CATEGORY_OPPORTUNITY',
  '11_OVERLAP_LEDGER',
  '12_NET_OPPORTUNITY',
  '13_PROVEN_OPPORTUNITY',
  '14_DELIVERY_ASSUMPTIONS',
  '15_TRANSACTION_EVIDENCE',
  '16_INDEPENDENT_RECALCULATION',
  '17_UI_API_REPORT_PARITY',
  '18_FINANCIAL_GOVERNANCE_TESTS',
  '19_EXCLUSIONS_AND_UNSUPPORTED',
  '20_FINAL_CERTIFICATION'
] as const;

export const FINANCIAL_LEVERS = {
  E_AUCTION: 'E-Auction Dynamic Negotiation',
  VENDOR_CONSOLIDATION: 'Vendor Consolidation & Tail Rationalization',
  VOLUME_BUNDLING: 'Multi-Plant Volume Bundling',
  CATEGORY_SPECIALIST: 'Category Specialist Realignment',
  PO_CONSOLIDATION: 'PO Frequency Consolidation (Operational Process Lever)'
} as const;

export const FINANCIAL_GOVERNANCE_TERMINOLOGY = {
  GROSS_POOL_LABEL: 'Gross Multi-Lever Opportunity Pool',
  GROSS_RATIO_LABEL: 'Gross Opportunity / Addressable Spend',
  GROSS_DESCRIPTION:
    'This is a theoretical multi-lever opportunity pool before overlap and execution constraints. ' +
    'It is NOT a savings rate and must not be interpreted as an immediately realizable savings percentage.',
  INTERNAL_EVIDENCE_CITATION:
    'The result is based on the customer\'s validated transaction data and the documented opportunity methodology.',
  VALUE_HIERARCHY: [
    '1. Total Evaluated Spend: ₹4,073.8307 Cr',
    '2. Module 2 Addressable Spend: ₹443.621 Cr',
    '3. Gross Multi-Lever Opportunity Pool: ₹441.833 Cr (Theoretical pool before overlap/constraints)',
    '4. Net Defensible Opportunity: ₹337.766 Cr',
    '5. Proven Opportunity: ₹319.439 Cr (Evidence-backed commercial opportunity)',
    '6. Indicative Deliverable Opportunity: ₹31.944–₹79.860 Cr (10%–25% of Proven Opportunity)'
  ]
} as const;

export const FINANCIAL_CRITICAL_CHECK_EXPLANATIONS = {
  CAUSE_ANALYSIS: 'Multi-Lever Concurrent Aggregation with Disjoint Denominators & Mutual Exclusion Overlap',
  DETAILED_RATIONALE:
    'Gross Multi-Lever Opportunity Pool (₹441.833 Cr) represents the unconstrained theoretical sum of 3 strategic ' +
    'levers: E-Auction (₹77.366 Cr), Vendor Consolidation (₹168.245 Cr), and Volume Bundling (₹196.222 Cr). ' +
    'While E-Auction and Consolidation are evaluated against Comparable Spend (Addressable Spend = ₹443.621 Cr), ' +
    'Volume Bundling encompasses Volume Bundling Eligible Spend across broader item lines. The ratio ' +
    'Gross Opportunity / Addressable Spend = 99.60% is a diagnostic multi-lever index, NOT a savings rate. ' +
    'Double counting is strictly prevented via opportunity-level overlap deduplication (-₹104.067 Cr), ' +
    'resulting in Net Defensible Opportunity of ₹337.766 Cr (8.29% of evaluated spend).',
  DOUBLE_COUNTING_PROTECTION: 'Guaranteed by category-level Math.max() selection and explicit Overlap Ledger deduction.'
} as const;
