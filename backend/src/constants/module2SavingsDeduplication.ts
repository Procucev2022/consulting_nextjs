/**
 * Module 2 — Cross-Lever Savings Deduplication Control Constants
 * Version: MODULE_2_SAVINGS_DEDUPLICATION_V1.0
 * Compliant with Rule 7, 8: Dedicated constants and zero inline magic values
 */

export const SAVINGS_DEDUPLICATION_VERSION = 'MODULE_2_SAVINGS_DEDUPLICATION_V1.0';

export const CRORE_DIVISOR = 10000000;

export const DEDUPLICATION_STATUS_LABELS = {
  INDEPENDENT: 'Independent Validated Opportunity',
  MUTUALLY_EXCLUSIVE_ALTERNATIVE_RETAINED: 'Maximum Defensible Alternative Retained',
  DEDUPLICATED_OVERLAP: 'Overlapping Alternative Deduplicated',
  INCREMENTAL_VALIDATED: 'Validated Incremental Benefit',
  UNRESOLVED_EXCLUDED: 'Unresolved Overlap Excluded from Net Savings',
  EXPLORATORY_PIPELINE: 'Exploratory Pipeline (Planning Assumption)',
  NOT_APPLICABLE: 'Not Applicable / Discovery Only'
} as const;

export const EVIDENCE_VALIDATION_STATUS_LABELS = {
  VALIDATED_COMMERCIAL: 'Commercially Validated',
  UNVERIFIED_ESTIMATE: 'Estimated Opportunity (Pre-Validation)',
  PLANNING_ASSUMPTION: 'Planning Assumption Only',
  EXPLORATORY_PIPELINE: 'Exploratory Pipeline (Unconfirmed)',
  DISCOVERY_ONLY: 'Discovery Only (No Commercial Savings)',
  NOT_YET_QUANTIFIABLE: 'Not Yet Quantifiable'
} as const;

export const APPROVAL_STATUS_LABELS = {
  APPROVED: 'Approved by Governance',
  PENDING_REVIEW: 'Pending Commercial Review',
  EXCLUDED_FROM_NET: 'Excluded from Consolidated Net Savings'
} as const;

export const CALCULATION_BASIS = {
  PEER_PRICE_DISPERSION: 'Historical Peer Unit Price Dispersion against Lowest Achieved Rate',
  REVERSE_AUCTION_COMPETITIVE_DISCOVERY: 'Reverse Auction Dynamic Bidding with Pre-Qualified Suppliers',
  VENDOR_TAIL_CONSOLIDATION: 'Tail Vendor Consolidation to Preferred Strategic Supplier',
  VOLUME_AGGREGATION_TIER: 'Multi-Facility Volume Demand Aggregation Tier Concession',
  PAYMENT_TERMS_FINANCING_BENEFIT: 'Working Capital Financing Benefit (1.5% per 30 days extension)',
  PAYMENT_TERMS_WORKING_CAPITAL: 'Operating Working Capital Released (Balance Sheet Timing)',
  ADMINISTRATIVE_PO_REDUCTION: 'Administrative PO Consolidation Overhead Reduction (₹500/PO)',
  CATEGORY_CHARTER_STRATEGIC: 'Category Management Charter Planning Head',
  SPECIFICATION_HARMONIZATION_DISCOVERY: 'Specification Rationalisation Technical Review (Phase 1)',
  COMPLIANCE_CONTROL_GAP_AUDIT: 'Procurement Compliance Transaction Audit & Exception Exposure',
  ALTERNATE_SOURCING_DISCOVERY: 'Alternate Sourcing Repository Matching (600,000+ Vendors)'
} as const;

export const LEVER_SAFEGUARD_RULES = {
  LEVER_01: 'Preserve existing comparable-price methodology grouped by FY, clean material code, UOM, and currency.',
  LEVER_02: 'Auction candidacy or historical price dispersion alone does not prove savings without verified lowest bid / comparable transaction baseline.',
  LEVER_03: 'Supplier fragmentation and low spend do not automatically prove savings without demonstrated price concessions.',
  LEVER_04: 'Volume aggregation benefits must be validated and checked for overlap with price improvement.',
  LEVER_05: 'Keep annual financing benefit and working capital released separate. Never sum them. Do not count financing benefits as purchase-price savings.',
  LEVER_06: 'Preserve canonical heads A-J and existing overlap controls; Head F defaults to exclusion against Lever 2.',
  LEVER_07: 'Status COMING_SOON; strictly no calculation or savings invention (₹0.00 Cr).',
  LEVER_08: 'Phase 1 discovery only; no commercial savings until Phase 2 is approved (₹0.00 Cr).',
  LEVER_09: 'Include only validated, measurable financial benefits; exposure under review is not validated savings.',
  LEVER_10: 'Vendor counts and alternate sourcing discovery produce no savings estimate by themselves (₹0.00 Cr).'
} as const;

export const CONSOLIDATED_SAVINGS_NOTICES = {
  CERTIFICATION_NOTICE:
    'ESTIMATED SAVINGS NOTICE: Consolidated figures represent pre-negotiation strategic opportunities ' +
    'after cross-lever deduplication. They do not constitute realised or commercially validated savings ' +
    'until contractual supplier agreements and executive approvals are executed.',
  UNAPPROVED_ASSUMPTION_DISCLAIMER:
    'Unapproved planning assumptions and unverified price variances are strictly excluded from Commercially Validated Savings.',
  LEVER_5_SEPARATION_NOTICE:
    'FINANCIAL BENEFIT SEPARATION: Annual financing benefits and working capital released under Lever 5 ' +
    'are balance-sheet and treasury metrics, strictly segregated from income statement purchase-price savings.',
  DATA_UNAVAILABLE_FALLBACK: 'DATA_UNAVAILABLE',
  NOT_YET_QUANTIFIABLE_FALLBACK: 'NOT YET QUANTIFIABLE'
} as const;

export const DEDUPLICATION_DISCLOSURES = [
  'Cross-lever deduplication prevents double-counting of alternative sourcing strategies on identical spend pools.',
  'Where Lever 1, Lever 2, and Lever 3 target the same material spend, the highest defensible comparable estimate is retained.',
  'Administrative PO consolidation overhead benefits represent verified independent operational efficiencies and are retained incrementally.',
  'Unresolved overlaps lacking verified comparability are excluded from net consolidated savings and flagged for review.',
  'Phase 1 specification discovery (Lever 8) and alternate vendor discovery (Lever 10) carry ₹0.00 Cr commercial savings.'
];
