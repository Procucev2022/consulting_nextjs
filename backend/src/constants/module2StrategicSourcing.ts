/**
 * Module 2 Strategic Sourcing Constants
 * Version: MODULE_2_SOURCING_LOGIC_V1.0
 * 
 * Centralized governance, thresholds, and metadata for:
 * Customer Spend -> Spend Intelligence -> Supplier Analysis ->
 * Sourcing Opportunity -> E-Auction / Consolidation Recommendation.
 */

import type { StrategicSourcingLeverKey } from '../types/module2StrategicSourcing';

export const MODULE_2_SOURCING_VERSION = 'MODULE_2_SOURCING_LOGIC_V2.0';

export const PRIMARY_LEVER_LABELS = {
  E_AUCTION: 'e-Auction Competitive Bidding',
  VENDOR_CONSOLIDATION: 'Strategic Vendor Consolidation',
  CATEGORY_SPECIALIST_REALIGNMENT: 'Category Specialist Sourcing Realignment',
  VOLUME_BUNDLING: 'Historical Volume Bundling',
  PO_CONSOLIDATION: 'PO Frequency Consolidation',
  RATE_CONTRACT: 'Annual Rate Contract',
  NO_QUANTIFIABLE_BENEFIT: 'Strategic Review (No Quantifiable Price Benefit)'
} as const;

export const CONSOLIDATION_EVIDENCE_PATHS = {
  PATH_A_SAME_SUPPLIER_VOLUME: 'Observed Same-Supplier Volume Tier Discount',
  PATH_B_SUPPLIER_REALLOCATION: 'Demonstrated Core Supplier Price Advantage',
  PATH_C_COMBINED_CATEGORY: 'Demonstrated Cross-Supplier Volume Aggregation',
  PATH_D_NO_EVIDENCE: 'Opportunity Identified — Benefit Not Yet Quantifiable'
} as const;

/**
 * Spend Materiality Thresholds (INR)
 */
export const MATERIALITY_THRESHOLDS = {
  HIGH_INR: 5000000,   // ₹50 Lakhs
  MEDIUM_INR: 1000000, // ₹10 Lakhs
  LOW_INR: 0
} as const;

/**
 * Recurring Spend Evaluation Rules
 */
export const RECURRING_SPEND_RULES = {
  MIN_ACTIVE_MONTHS: 3,
  MIN_TRANSACTIONS: 3,
  MIN_REPEAT_PURCHASES: 2,
  LOOKBACK_WINDOW_MONTHS: 24
} as const;

/**
 * Supplier Fragmentation HHI & Concentration Thresholds
 */
export const FRAGMENTATION_THRESHOLDS = {
  HHI_LOW_FRAGMENTATION: 2500,     // Concentrated market
  HHI_MODERATE_FRAGMENTATION: 1500, // Moderately unconcentrated
  HHI_HIGH_FRAGMENTATION: 1000,    // Unconcentrated / fragmented
  DOMINANT_SUPPLIER_SHARE: 0.85,    // If top supplier has >=85% spend, not fragmented
  TAIL_SUPPLIER_THRESHOLD_SHARE: 0.05 // Suppliers with <5% category spend are tail
} as const;

/**
 * Credible Low-Price Selection Rules
 */
export const CREDIBLE_PRICE_RULES = {
  MIN_VOLUME_SHARE: 0.05,          // Must represent at least 5% of comparable category volume
  MAX_PRICE_VARIANCE_FROM_MEDIAN: 0.50, // Flag if price is < 50% of median (likely specification mismatch/outlier)
  MIN_TRANSACTION_COUNT_PER_SUPPLIER: 1,
  OUTLIER_STD_DEV_MULTIPLIER: 2.5,
  HISTORICAL_RELEVANCE_DAYS: 730  // 24 months relevance window
} as const;

/**
 * E-Auction Suitability Criteria
 */
export const E_AUCTION_SUITABILITY_RULES = {
  MIN_COMPETITIVE_SUPPLIERS_HIGH: 3,
  MIN_COMPETITIVE_SUPPLIERS_MED: 2,
  MIN_PRICE_DISPERSION_PCT: 3.0,   // Minimum 3% spread between baseline and credible reference
  MIN_ADDRESSABLE_SPEND_INR: 500000 // ₹5 Lakhs
} as const;

/**
 * Strategic Sourcing Scorecard Dimension Weights (Total = 1.0)
 */
export const SCORECARD_WEIGHTS = {
  spendMateriality: 0.15,
  supplierFragmentation: 0.10,
  priceDispersion: 0.15,
  recurrence: 0.10,
  addressableVolume: 0.10,
  supplierCompetition: 0.10,
  comparability: 0.10,
  historicalEvidenceQuality: 0.10,
  contractConstraints: 0.05,
  specificationComplexity: 0.05
} as const;

/**
 * Disclaimers and Standard Messages
 */
export const MODULE_2_DISCLAIMERS = {
  UNQUANTIFIABLE_MESSAGE: 'Opportunity Identified — Benefit Not Yet Quantifiable',
  E_AUCTION_DISCLAIMER: 'Indicative opportunity based on customer historical comparable transactions — NOT realized savings.',
  CONSOLIDATION_DISCLAIMER: 'Indicative supplier consolidation opportunity based on historical price dispersion — NOT realized savings.',
  NET_OPPORTUNITY_DISCLAIMER: 'Net quantifiable opportunity after rigorous deduplication and overlap removal across e-auction and consolidation levers.',
  NO_FABRICATION_NOTICE: 'Module 2 calculates opportunities strictly from internal validated customer transactions without external market benchmarks or fabricated percentages.'
} as const;

/**
 * Comprehensive Metadata for all 15 Sourcing Levers
 */
export const SOURCING_LEVERS_CATALOG: Record<StrategicSourcingLeverKey, {
  name: string;
  category: 'PRICING' | 'VOLUME' | 'OPERATIONAL' | 'PROCESS';
  defaultRationale: string;
  defaultAction: string;
}> = {
  E_AUCTION: {
    name: 'e-Auction / Competitive Reverse Bidding',
    category: 'PRICING',
    defaultRationale: 'Category exhibits comparable specifications, price dispersion among qualified suppliers, and recurring transaction volume.',
    defaultAction: 'Prepare standardized specification dossier, shortlist comparable suppliers, and initiate dynamic e-auction event.'
  },
  RFQ_COMPETITION: {
    name: 'Structured RFQ Competition',
    category: 'PRICING',
    defaultRationale: 'Sufficient supplier market exists with technical comparability, but customization warrants multi-round structured quotation.',
    defaultAction: 'Issue structured RFQ with standardized unit pricing and delivery terms to all historical qualified bidders.'
  },
  VENDOR_CONSOLIDATION: {
    name: 'Strategic Vendor Consolidation',
    category: 'VOLUME',
    defaultRationale: 'Fragmented spend across multiple tail vendors with demonstrated lower-price alternatives in historical transaction data.',
    defaultAction: 'Consolidate repeat volume with competitive core suppliers and execute tail supplier phase-out plan.'
  },
  VOLUME_CONSOLIDATION: {
    name: 'Enterprise Volume Aggregation',
    category: 'VOLUME',
    defaultRationale: 'Multiple operating plants or entities procuring identical commodity items independently without enterprise volume tiers.',
    defaultAction: 'Aggregate cross-facility procurement requisitions into unified umbrella master purchase agreements.'
  },
  CONTRACT_CONSOLIDATION: {
    name: 'Contractual Agreement Consolidation',
    category: 'PROCESS',
    defaultRationale: 'Fragmented spot-order purchasing on recurring requirements without enterprise rate contracts.',
    defaultAction: 'Transition recurring spot purchase orders to annual rate contracts with indexed price escalation clauses.'
  },
  ORDER_FREQUENCY_OPTIMIZATION: {
    name: 'Order Frequency & Cadence Optimization',
    category: 'OPERATIONAL',
    defaultRationale: 'Excessive high-frequency, low-batch purchase orders resulting in administrative overhead and lost bulk pricing.',
    defaultAction: 'Align ordering schedules to monthly/quarterly batch cycles to capture bulk freight and tier pricing.'
  },
  MOQ_LOT_SIZE_OPTIMIZATION: {
    name: 'MOQ / Lot-Size Rebalancing',
    category: 'OPERATIONAL',
    defaultRationale: 'Sub-optimal order quantities falling below supplier standard production batches.',
    defaultAction: 'Collaborate with operations and inventory control to order at economic production run sizes.'
  },
  SPECIFICATION_STANDARDIZATION: {
    name: 'Technical Specification Standardization',
    category: 'PROCESS',
    defaultRationale: 'Multiple close specification variants or grades procured across entities with disparate pricing.',
    defaultAction: 'Convene technical harmonization committee to standardize grades and eliminate custom tolerances.'
  },
  SUPPLIER_TAIL_REDUCTION: {
    name: 'Supplier Base Tail Pruning',
    category: 'VOLUME',
    defaultRationale: 'Long tail of low-spend vendors contributing less than 5% of spend while inflating administrative touchpoints.',
    defaultAction: 'Migrate tail vendor items to primary qualified suppliers and rationalize vendor master catalog.'
  },
  PAYMENT_TERM_REVIEW: {
    name: 'Commercial Payment Terms Harmonization',
    category: 'PROCESS',
    defaultRationale: 'Discrepancies in payment terms (e.g. Net 30 vs Net 90) across suppliers for identical commodities.',
    defaultAction: 'Standardize commercial settlement terms across all active category contracts.'
  },
  DELIVERY_TERM_REVIEW: {
    name: 'Incoterms & Delivery Basis Review',
    category: 'PROCESS',
    defaultRationale: 'Mixed delivery terms (Ex-Works vs Delivered Duty Paid) obfuscating true comparable landed unit cost.',
    defaultAction: 'Harmonize incoterms to Delivered (FOR) to eliminate hidden transport variance.'
  },
  FREIGHT_LOGISTICS_REVIEW: {
    name: 'Freight & Logistics Route Review',
    category: 'OPERATIONAL',
    defaultRationale: 'Suppliers shipping from non-optimal regional locations resulting in disproportionate transport surcharges.',
    defaultAction: 'Evaluate freight bundling and logistics consolidation across regional supply clusters.'
  },
  LOCALIZATION_GEOGRAPHIC: {
    name: 'Geographic Localization & Proximity Sourcing',
    category: 'OPERATIONAL',
    defaultRationale: 'High lead times and transport exposure from distant suppliers where domestic/regional alternatives exist.',
    defaultAction: 'Identify and pre-qualify regional manufacturers within economic transit radius.'
  },
  MAKE_BUY_REVIEW: {
    name: 'Make vs Buy Economic Evaluation',
    category: 'PROCESS',
    defaultRationale: 'High-margin external procurement where internal manufacturing capability or capacity can be leveraged.',
    defaultAction: 'Perform cost breakdown analysis comparing internal production costs against external landed price.'
  },
  DEMAND_CONSOLIDATION: {
    name: 'Cross-Category Demand Rationalization',
    category: 'PROCESS',
    defaultRationale: 'Over-specifying requirement characteristics leading to fragmented demand across sub-codes.',
    defaultAction: 'Rationalize internal bill of materials to direct consumption toward preferred high-volume items.'
  }
};
