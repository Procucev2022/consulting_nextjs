/**
 * Executive Brief Analysis-Wise Opportunity Table & Waterfall Data Constants
 * Prompt 590: Authoritative Borosil Ltd (AIC-2026-0002) Customer Delivery Standards
 * Freezes authoritative figures and eliminates inconsistent or foreign demo data.
 * Rule 8: Constants isolation; Rule 9: Strongly typed; max lines <= 300, complexity <= 10.
 */

import type {
  ExecutiveBriefOpportunityTableRow,
  AssumptionTaxonomyItem,
  RealizationRoadmapStage
} from '../types';

export const EXECUTIVE_BRIEF_OPPORTUNITY_ROWS: readonly ExecutiveBriefOpportunityTableRow[] = [
  {
    analysis: 'Lever 1 — Combined Strategic Sourcing',
    addressableSpend: '₹129.223 Cr',
    assumptionMethod: 'Cross-plant unit price harmonization and strategic supplier negotiation (90 packages)',
    indicativeOpportunity: '₹73.769 Cr',
    benefitType: 'Modelled Opportunity',
    confidence: 'High (Verified Transaction Dispersion)',
    primaryAction: 'Cross-plant unit price harmonization & bilateral negotiation'
  },
  {
    analysis: 'Lever 2 — Vendor Base Consolidation',
    addressableSpend: '₹12.081 Cr',
    assumptionMethod: 'Held in Governance Reserve — Excluded Pending Commercial Validation (4 packages)',
    indicativeOpportunity: '₹0.00 Cr (Validation Pending)',
    benefitType: 'Under Commercial Validation',
    confidence: 'Pending Validation',
    primaryAction: 'Commercial validation of vendor consolidation potential and supplier SLAs'
  },
  {
    analysis: 'Lever 3 — E-Auction Dynamic Bidding',
    addressableSpend: '₹21.817 Cr',
    assumptionMethod: 'Competitive multi-round reverse dynamic e-auctions (12 packages)',
    indicativeOpportunity: '₹1.352 Cr',
    benefitType: 'Modelled Opportunity',
    confidence: 'High (Dynamic Bidding Liquidity)',
    primaryAction: 'Multi-round reverse dynamic e-auctions for packaging & consumables'
  },
  {
    analysis: 'Module 3 — Market Benchmark Disclosure',
    addressableSpend: '₹0.00 Cr',
    assumptionMethod: 'Research Closed — No Operational Benchmark Data Available for Assessment Period',
    indicativeOpportunity: '₹0.00 Cr (0% Coverage)',
    benefitType: 'Research Closed',
    confidence: 'Closed',
    primaryAction: 'No operational market benchmark data available for assessment period'
  },
  {
    analysis: 'Module 4 — Program Governance & Realization',
    addressableSpend: '₹168.658 Cr',
    assumptionMethod: 'Proposed Year 1 Sourcing Target: ₹12.90 Cr (Proposed Target, Not Approved or Realized)',
    indicativeOpportunity: '₹0.00 Cr (Realized)',
    benefitType: 'Governance Baseline',
    confidence: 'Audit Governance',
    primaryAction: 'Quarterly invoice audit & formal client commercial approval sign-off'
  }
];

export const EXECUTIVE_BRIEF_WATERFALL_BREAKDOWN = {
  grossIdentifiedCr: '₹117.512 Cr',
  overlapAdjustmentCr: '-₹30.412 Cr',
  exclusionsCr: '₹0.00 Cr',
  netDefensibleCr: '₹87.100 Cr',
  validatedCommercialOpportunityCr: '₹75.121 Cr',
  clientApprovedSavingsCr: '₹0.00 Cr',
  realizedSavingsCr: '₹0.00 Cr',
  hardProcurementSavingsCr: '₹75.121 Cr',
  costAvoidanceCr: '₹0.00 Cr',
  productivityBenefitLabel: 'Non-monetized operational benefit',
  strategicRiskLabel: 'Standard dual-source qualification'
} as const;

export const ASSUMPTION_TAXONOMY_ITEMS: readonly AssumptionTaxonomyItem[] = [
  {
    key: 'factual_baseline',
    badge: 'Factual Baseline',
    title: 'Customer Observed Baseline',
    definition: 'Data directly observed from verified ERP purchase order and invoice records (27,777 lines).',
    colorClass: 'text-cyan-400 border-cyan-800/60 bg-cyan-950/60'
  },
  {
    key: 'analytical_finding',
    badge: 'Analytical Finding',
    title: 'Data-Driven Calculation',
    definition: 'Result calculated from customer data patterns (e.g., inter-plant unit price dispersion across 3 plants).',
    colorClass: 'text-blue-400 border-blue-800/60 bg-blue-950/60'
  },
  {
    key: 'benchmark_finding',
    badge: 'Benchmark Finding',
    title: 'External Index Comparison',
    definition: 'External PCBI benchmark indices (Research closed for assessment period with 0% coverage).',
    colorClass: 'text-purple-400 border-purple-800/60 bg-purple-950/60'
  },
  {
    key: 'planning_assumption',
    badge: 'Planning Assumption',
    title: 'Configurable Model Rate',
    definition: 'Configurable planning assumption for addressable categories under commercial validation.',
    colorClass: 'text-amber-400 border-amber-800/60 bg-amber-950/60'
  },
  {
    key: 'estimated_opportunity',
    badge: 'Estimated Opportunity',
    title: 'Modelled Procurement Value',
    definition: 'Calculated value based on addressable spend and stated empirical modelling.',
    colorClass: 'text-emerald-400 border-emerald-800/60 bg-emerald-950/60'
  },
  {
    key: 'validated_saving',
    badge: 'Validated Opportunity',
    title: 'Client Review Presented Value',
    definition: 'Modelled Opportunity Excluding Lever 2 (₹75.121 Cr across L1 + L3).',
    colorClass: 'text-teal-400 border-teal-800/60 bg-teal-950/60'
  }
];

export const PO_CONSOLIDATION_DISPLAY_DATA = {
  currentStatePOs: '27,777 Invoices',
  optimizedStatePOs: 'Non-Monetized Governance',
  poReductionCount: '0 POs Monetized',
  transactionReductionPercent: '0%',
  processEffortReductionLabel: 'Operational Governance Baseline',
  monetarySavingsLabel: '₹0.00 Cr (Direct Spend)',
  financialImpactNote: 'PO frequency reduction non-monetized to preserve CFO trust.',
  bandwidthBenefit: 'Focuses procurement bandwidth on direct sourcing negotiations.'
} as const;

export const VENDOR_CONSOLIDATION_DISPLAY_DATA = {
  currentSuppliers: '1,489 Active Vendors',
  targetSuppliers: 'Commercial Vendor Panels',
  eligibleSpendCr: '₹12.081 Cr',
  indicativeVolumeDiscountRange: 'Savings Not Yet Established',
  indicativeOpportunityCr: '₹0.00 Cr (Under Commercial Validation)',
  status: 'Under Commercial Validation — Savings Not Yet Established',
  confidence: 'PENDING_VALIDATION',
  realizationSteps: [
    '1. Validate supplier comparability and technical part cross-references',
    '2. Consolidate demand across Bharuch, Jaipur, and Tarapur facilities',
    '3. Issue structured regional RFP with multi-plant volume tiers',
    '4. Negotiate and competitively source with authorized distributors',
    '5. Evaluate vendor SLA, consignment stocking, and emergency delivery',
    '6. Award consolidated volume contracts with annual performance rebates',
    '7. Track realized contract compliance and invoice rate execution'
  ]
} as const;

export const BENCHMARK_SPECIAL_DISPLAY_DATA = {
  currentPrice: 'N/A — Research Closed',
  benchmarkPrice: '0% Operational Benchmark Coverage',
  priceGap: '₹0.00 Cr Benchmark Savings',
  addressableSpendCr: '₹0.00 Cr',
  indicativeOpportunityCr: '₹0.00 Cr',
  benchmarkQuality: 'Research Closed — No Operational Benchmark Data Available',
  benchmarkSource: 'PCBI Assessment Closed for Assessment Period',
  status: 'Research Closed — No Operational Benchmark Data Available',
  cfoDisclaimer: 'Module 3 research is formally closed for this assessment with 0% coverage and ₹0 benchmark-derived savings.'
} as const;

export const REALIZATION_ROADMAP_STAGES: readonly RealizationRoadmapStage[] = [
  {
    period: 'WAVE 1 (MONTH 1–3)',
    title: 'Direct Strategic Negotiations',
    description: 'Execute bilateral price harmonization on Soda Ash and high-volume direct materials across 3 manufacturing plants.'
  },
  {
    period: 'WAVE 2 (MONTH 3–6)',
    title: 'Dynamic Reverse E-Auctions',
    description: 'Run competitive multi-round reverse dynamic e-auctions across packaging, consumables, and standardized items.'
  },
  {
    period: 'WAVE 3 (MONTH 6–12)',
    title: 'Vendor Base Consolidation',
    description: 'Commercial validation and distributor master framework agreements for tail suppliers.'
  },
  {
    period: 'ONGOING',
    title: 'Savings Realization & P&L Audit',
    description: 'Joint Procurement and Finance audit of invoice rate execution against negotiated contract baselines.'
  }
];
