/**
 * Executive Brief Analysis-Wise Opportunity Table & Waterfall Data Constants
 * Prompt 271: CFO/CEO Savings Analysis & Attribution Standards
 */

import type {
  ExecutiveBriefOpportunityTableRow,
  AssumptionTaxonomyItem,
  RealizationRoadmapStage
} from '../types';

export const EXECUTIVE_BRIEF_OPPORTUNITY_ROWS: readonly ExecutiveBriefOpportunityTableRow[] = [
  {
    analysis: 'Vendor Consolidation',
    addressableSpend: '₹154.20 Cr',
    assumptionMethod: '5% illustrative volume-discount assumption',
    indicativeOpportunity: '₹7.71 Cr',
    benefitType: 'Hard Savings — Indicative',
    confidence: 'Medium',
    primaryAction: 'Category supplier consolidation & tiered volume rebates'
  },
  {
    analysis: 'PO Consolidation',
    addressableSpend: '₹0.00 Cr (Process Effort)',
    assumptionMethod: '20% process-effort reduction (824 POs)',
    indicativeOpportunity: '₹0.00 Cr (20% workload)',
    benefitType: 'Productivity Benefit',
    confidence: 'High',
    primaryAction: 'Minimum order quantities & batch purchasing cadence'
  },
  {
    analysis: 'Strategic Sourcing',
    addressableSpend: '₹412.50 Cr',
    assumptionMethod: '3% category strategy & negotiation assumption',
    indicativeOpportunity: '₹12.38 Cr',
    benefitType: 'Hard Savings — Indicative',
    confidence: 'High',
    primaryAction: 'Long-term agreements & indexed pricing formulas'
  },
  {
    analysis: 'Competitive RFQ',
    addressableSpend: '₹185.00 Cr',
    assumptionMethod: '4% multi-vendor sealed-bid market testing',
    indicativeOpportunity: '₹7.40 Cr',
    benefitType: 'Hard Savings — Indicative',
    confidence: 'High',
    primaryAction: 'Competitive multi-vendor bidding & price discovery'
  },
  {
    analysis: 'E-Auction',
    addressableSpend: '₹98.00 Cr',
    assumptionMethod: '6% dynamic reverse auction on standardized lots',
    indicativeOpportunity: '₹5.88 Cr',
    benefitType: 'Hard Savings — Indicative',
    confidence: 'Medium',
    primaryAction: 'Dynamic reverse auction on qualified packaging lots'
  },
  {
    analysis: 'Benchmark Gap (PCBI)',
    addressableSpend: '₹1,284.50 Cr',
    assumptionMethod: 'PCBI material price gap to median/lower quartile',
    indicativeOpportunity: '₹169.38 Cr',
    benefitType: 'Hard Savings — Defensible',
    confidence: 'High',
    primaryAction: 'Contract price reset & formula-based indexation'
  },
  {
    analysis: 'Price Trend / Cost Avoidance',
    addressableSpend: '₹410.00 Cr',
    assumptionMethod: 'Hedged forward positions & spot pre-booking',
    indicativeOpportunity: '₹41.00 Cr',
    benefitType: 'Cost Avoidance',
    confidence: 'High',
    primaryAction: 'Strategic pre-booking ahead of commodity upward cycles'
  },
  {
    analysis: 'Strategic Supplier Risk',
    addressableSpend: '₹142.00 Cr (Exposure)',
    assumptionMethod: 'Dual-sourcing qualification & alternate development',
    indicativeOpportunity: '₹0.00 Cr (4 programs)',
    benefitType: 'Strategic / Risk Benefit',
    confidence: 'High',
    primaryAction: 'Alternate supplier qualification & dual-sourcing allocation'
  }
];

export const EXECUTIVE_BRIEF_WATERFALL_BREAKDOWN = {
  grossIdentifiedCr: '₹173.12 Cr',
  overlapAdjustmentCr: '-₹62.80 Cr',
  exclusionsCr: '-₹16.72 Cr',
  netDefensibleCr: '₹93.60 Cr',
  hardProcurementSavingsCr: '₹78.72 Cr',
  costAvoidanceCr: '₹14.88 Cr',
  productivityBenefitLabel: '20% process-effort reduction (824 POs saved)',
  strategicRiskLabel: '4 dual-source qualified programs de-risked'
} as const;

export const ASSUMPTION_TAXONOMY_ITEMS: readonly AssumptionTaxonomyItem[] = [
  {
    key: 'factual_baseline',
    badge: 'Factual Baseline',
    title: 'Customer Observed Baseline',
    definition: 'Data directly observed from verified ERP purchase order and invoice records.',
    colorClass: 'text-cyan-400 border-cyan-800/60 bg-cyan-950/60'
  },
  {
    key: 'analytical_finding',
    badge: 'Analytical Finding',
    title: 'Data-Driven Calculation',
    definition: 'Result calculated from customer data patterns (e.g., inter-plant unit price dispersion).',
    colorClass: 'text-blue-400 border-blue-800/60 bg-blue-950/60'
  },
  {
    key: 'benchmark_finding',
    badge: 'Benchmark Finding',
    title: 'External Index Comparison',
    definition: 'Result compared against external PCBI commodity benchmarks and independent market indices.',
    colorClass: 'text-purple-400 border-purple-800/60 bg-purple-950/60'
  },
  {
    key: 'planning_assumption',
    badge: 'Planning Assumption',
    title: 'Configurable Model Rate',
    definition: 'Indicative percentage used to model opportunity (e.g., 5% volume discount, 20% PO effort).',
    colorClass: 'text-amber-400 border-amber-800/60 bg-amber-950/60'
  },
  {
    key: 'estimated_opportunity',
    badge: 'Estimated Opportunity',
    title: 'Modelled Procurement Value',
    definition: 'Calculated value based on addressable spend and stated planning assumptions.',
    colorClass: 'text-emerald-400 border-emerald-800/60 bg-emerald-950/60'
  },
  {
    key: 'validated_saving',
    badge: 'Validated Saving',
    title: 'Realized P&L Impact',
    definition: 'Only applied where actual post-action contract execution or invoice reduction is audited.',
    colorClass: 'text-teal-400 border-teal-800/60 bg-teal-950/60'
  }
];

export const PO_CONSOLIDATION_DISPLAY_DATA = {
  currentStatePOs: '4,120 POs',
  optimizedStatePOs: '3,296 POs',
  poReductionCount: '824 POs',
  transactionReductionPercent: '20%',
  processEffortReductionLabel: '~20% Process Effort Reduction',
  monetarySavingsLabel: '₹0.00 Cr (Direct Spend)',
  financialImpactNote: 'Financial impact to be quantified using customer-specific processing cost.',
  bandwidthBenefit: 'Releases ~1,650 buyer hours for strategic category negotiation.'
} as const;

export const VENDOR_CONSOLIDATION_DISPLAY_DATA = {
  currentSuppliers: '912 Tail Vendors',
  targetSuppliers: '4 Regional Master Distributors',
  eligibleSpendCr: '₹154.20 Cr',
  indicativeVolumeDiscountRange: '3–5%',
  indicativeOpportunityCr: '₹7.71 Cr',
  confidence: 'HIGH',
  realizationSteps: [
    '1. Validate supplier comparability and technical part cross-references',
    '2. Consolidate demand across 18 manufacturing facilities',
    '3. Issue structured regional RFP with multi-plant volume tiers',
    '4. Negotiate and competitively source with authorized distributors',
    '5. Evaluate vendor SLA, consignment stocking, and emergency delivery',
    '6. Award consolidated volume contracts with annual performance rebates',
    '7. Track realized contract compliance and invoice rate execution'
  ]
} as const;

export const BENCHMARK_SPECIAL_DISPLAY_DATA = {
  currentPrice: '₹14,250 / MT',
  benchmarkPrice: '₹13,355 / MT (PCBI Grade A+)',
  priceGap: '6.28% Median Gap',
  addressableSpendCr: '₹1,284.50 Cr',
  indicativeOpportunityCr: '₹169.38 Cr',
  benchmarkQuality: 'Quality Grade A (Direct customs & port import filings)',
  benchmarkSource: 'PCBI Global Energy & Petrochemical Weekly Terminal',
  cfoDisclaimer: 'Indicative Price Opportunity subject to grade specification, terms, and market negotiation.'
} as const;

export const REALIZATION_ROADMAP_STAGES: readonly RealizationRoadmapStage[] = [
  {
    period: '0–30 DAYS',
    title: 'Validate Data & Opportunities',
    description: 'Verify ERP transaction ledger, normalize specifications, and confirm addressable base with category leaders.'
  },
  {
    period: '30–60 DAYS',
    title: 'Supplier & Category Validation',
    description: 'Assess supplier market liquidity, technical qualifications, and benchmark price corridors.'
  },
  {
    period: '60–90 DAYS',
    title: 'RFQ, Negotiation & Sourcing',
    description: 'Launch multi-vendor RFPs, execute dynamic reverse auctions on standardized packaging, and negotiate master rate cards.'
  },
  {
    period: '90–120 DAYS',
    title: 'Award & Contract Implementation',
    description: 'Finalize master distributor framework agreements, lock in price indexes, and bind plant ERP buyers.'
  },
  {
    period: '120+ DAYS',
    title: 'Savings Realization & Tracking',
    description: 'Audit invoice matching against negotiated contract rates, track P&L EBITDA impact, and verify zero leakage.'
  }
];

