/**
 * Module 2 Strategic Sourcing Constants (Frontend)
 * Version: MODULE_2_SOURCING_LOGIC_V1.0
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

export const MATERIALITY_THRESHOLDS = {
  HIGH_INR: 5000000,
  MEDIUM_INR: 1000000,
  LOW_INR: 0
} as const;

export const MODULE_2_DISCLAIMERS = {
  UNQUANTIFIABLE_MESSAGE: 'Opportunity Identified — Benefit Not Yet Quantifiable',
  E_AUCTION_DISCLAIMER: 'Indicative opportunity based on customer historical comparable transactions — NOT realized savings.',
  CONSOLIDATION_DISCLAIMER: 'Indicative supplier consolidation opportunity based on historical price dispersion — NOT realized savings.',
  NET_OPPORTUNITY_DISCLAIMER: 'Net quantifiable opportunity after rigorous deduplication and overlap removal across e-auction and consolidation levers.',
  NO_FABRICATION_NOTICE: 'Module 2 calculates opportunities strictly from internal validated customer transactions without external market benchmarks or fabricated percentages.'
} as const;

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
    defaultRationale: 'Discrepancies in payment terms across suppliers for identical commodities.',
    defaultAction: 'Standardize commercial settlement terms across all active category contracts.'
  },
  DELIVERY_TERM_REVIEW: {
    name: 'Incoterms & Delivery Basis Review',
    category: 'PROCESS',
    defaultRationale: 'Mixed delivery terms obfuscating true comparable landed unit cost.',
    defaultAction: 'Harmonize incoterms to Delivered (FOR) to eliminate hidden transport variance.'
  },
  FREIGHT_LOGISTICS_REVIEW: {
    name: 'Freight & Logistics Route Review',
    category: 'OPERATIONAL',
    defaultRationale: 'Suppliers shipping from non-optimal regional locations resulting in transport surcharges.',
    defaultAction: 'Evaluate freight bundling and logistics consolidation across regional supply clusters.'
  },
  LOCALIZATION_GEOGRAPHIC: {
    name: 'Geographic Localization & Proximity Sourcing',
    category: 'OPERATIONAL',
    defaultRationale: 'High lead times and transport exposure from distant suppliers where domestic alternatives exist.',
    defaultAction: 'Identify and pre-qualify regional manufacturers within economic transit radius.'
  },
  MAKE_BUY_REVIEW: {
    name: 'Make vs Buy Economic Evaluation',
    category: 'PROCESS',
    defaultRationale: 'High-margin external procurement where internal manufacturing capability can be leveraged.',
    defaultAction: 'Perform cost breakdown analysis comparing internal production costs against external landed price.'
  },
  DEMAND_CONSOLIDATION: {
    name: 'Cross-Category Demand Rationalization',
    category: 'PROCESS',
    defaultRationale: 'Over-specifying requirement characteristics leading to fragmented demand across sub-codes.',
    defaultAction: 'Rationalize internal bill of materials to direct consumption toward preferred high-volume items.'
  }
};
