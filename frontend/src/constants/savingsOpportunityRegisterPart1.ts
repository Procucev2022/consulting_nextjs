/**
 * Savings Opportunity Register - Part 1 (Prompt 269)
 * Module 1 Baseline & Module 2 Core Sourcing Opportunities (Items 1 to 6)
 */

import type { SavingsOpportunityRegisterItem } from '../types/savingsOpportunityRegister';
import { SAVINGS_ASSUMPTIONS } from './savingsAssumptions';

export const SAVINGS_OPPORTUNITY_REGISTER_PART1: SavingsOpportunityRegisterItem[] = [
  // 1. Module 1: Price Harmonization across operating facilities
  {
    opportunityId: 'OPP-M1-01',
    module: 'Module 1',
    analysisType: 'RATE_HARMONIZATION',
    category: 'Direct Materials & Consumables',
    subCategory: 'Grinding Media & Refractories',
    currentSpendInr: 14200000000.0,
    addressableSpendInr: 1420000000.0,
    currentBaseline: '18.5% inter-plant unit price dispersion across 6 manufacturing clusters',
    targetImprovement: 'Harmonize plant purchase rates to P25 corporate benchmark rate cards',
    savingsPercent: 5.0,
    estimatedSavingsInr: 71000000.0,
    savingsType: 'HARD_PROCUREMENT_SAVINGS',
    confidenceLevel: 'HIGH',
    calculationMethod: 'Eligible Addressable Spend (₹1,420 Cr) * Harmonization Potential (5.0%)',
    keyAssumption: 'Ex-works prices standardized with regional freight adders separated',
    finding: '340 standardized repeat items show an average inter-plant price spread of 18.5%',
    background: 'Decentralized local purchasing creates price variances for identical items',
    objective: 'Establish corporate rate contracts with indexed logistics adders',
    recommendedAction: 'Enforce master pricing rate cards across all operating clusters',
    expectedOutcome: 'Direct unit rate savings realized on subsequent purchase order releases',
    nextStep: 'Issue centralized contract amendments and bind plant buyers to master cards',
    implementationComplexity: 'LOW',
    priority: 'WAVE_1',
    owner: 'Joint Corporate Procurement & Plant Sourcing',
    realizationTimeline: '0–30 Days',
    overlapGroup: 'OG-DIRECT-MAT',
    consolidationStatus: 'INCLUDED'
  },

  // 2. Module 2: Vendor Consolidation - Hardware & Consumables
  {
    opportunityId: 'OPP-M2-01',
    module: 'Module 2',
    analysisType: 'VENDOR_CONSOLIDATION',
    category: 'Plant Hardware & Consumables',
    subCategory: 'Mechanical Fasteners & Industrial Hardware',
    currentSpendInr: 4800000000.0,
    addressableSpendInr: 480000000.0,
    currentBaseline: '912 active tail vendors supplying overlapping plant hardware specifications',
    targetImprovement: 'Consolidate 912 vendors into 4 regional Tier-1 authorized distributors',
    savingsPercent: SAVINGS_ASSUMPTIONS.VENDOR_CONSOLIDATION_DISCOUNT * 100,
    estimatedSavingsInr: 24000000.0,
    savingsType: 'HARD_PROCUREMENT_SAVINGS',
    confidenceLevel: 'HIGH',
    calculationMethod: `Eligible Consolidation Spend (₹480 Cr) * Assumed Volume Discount (${(
      SAVINGS_ASSUMPTIONS.VENDOR_CONSOLIDATION_DISCOUNT * 100
    ).toFixed(0)}%)`,
    keyAssumption: SAVINGS_ASSUMPTIONS.ILLUSTRATIVE_ASSUMPTION_LABEL,
    finding: 'High supplier fragmentation across mechanical and hardware items across 18 plants',
    background: SAVINGS_ASSUMPTIONS.VENDOR_CONSOLIDATION_DISCLAIMER,
    objective: 'Consolidate fragmented demand and improve purchasing leverage with master partners',
    recommendedAction: 'Transition tail volume to pre-negotiated master distributor framework contracts',
    expectedOutcome: 'Direct volume discount realization and reduction of 730 tail vendor accounts',
    nextStep: 'Issue RFP to top 4 national hardware distribution networks for consolidated catalog pricing',
    implementationComplexity: 'MEDIUM',
    priority: 'WAVE_1',
    owner: 'Corporate Procurement Category Manager',
    realizationTimeline: '30–60 Days',
    overlapGroup: 'OG-HARDWARE-CONS',
    consolidationStatus: 'INCLUDED'
  },

  // 3. Module 2: Vendor Consolidation - Electrical Spares
  {
    opportunityId: 'OPP-M2-02',
    module: 'Module 2',
    analysisType: 'VENDOR_CONSOLIDATION',
    category: 'Electrical & Automation Spares',
    subCategory: 'Switchgear, Cables & Motor Drives',
    currentSpendInr: 3900000000.0,
    addressableSpendInr: 390000000.0,
    currentBaseline: '215 regional electrical traders supplying OEM electrical spares at unbundled list price',
    targetImprovement: 'Direct OEM master agreements with Schneider, ABB, and Polycab with tier rebates',
    savingsPercent: SAVINGS_ASSUMPTIONS.VENDOR_CONSOLIDATION_DISCOUNT * 100,
    estimatedSavingsInr: 19500000.0,
    savingsType: 'HARD_PROCUREMENT_SAVINGS',
    confidenceLevel: 'MEDIUM',
    calculationMethod: `Eligible Consolidation Spend (₹390 Cr) * Assumed Volume Discount (${(
      SAVINGS_ASSUMPTIONS.VENDOR_CONSOLIDATION_DISCOUNT * 100
    ).toFixed(0)}%)`,
    keyAssumption: SAVINGS_ASSUMPTIONS.ILLUSTRATIVE_ASSUMPTION_LABEL,
    finding: 'High trader markup from 215 non-exclusive local electrical shops',
    background: 'Bypassing intermediaries to OEM direct channels eliminates trading margins',
    objective: 'Direct commercial partnership with Tier-1 manufacturers (Schneider, ABB, Polycab)',
    recommendedAction: 'Direct factory agreements with authorized primary distributors',
    expectedOutcome: 'Standardized specifications, direct warranties, and volume rebate tiers',
    nextStep: 'Execute tripartite supply agreements and harmonize credit terms to 60 days',
    implementationComplexity: 'MEDIUM',
    priority: 'WAVE_1',
    owner: 'Procucev Category Specialist',
    realizationTimeline: '30–60 Days',
    overlapGroup: 'OG-ELECTRICAL',
    consolidationStatus: 'INCLUDED'
  },

  // 4. Module 2: PO Consolidation - Productivity / Process Effort Reduction
  {
    opportunityId: 'OPP-M2-03',
    module: 'Module 2',
    analysisType: 'PO_CONSOLIDATION',
    category: 'Procurement Operations',
    subCategory: 'Transaction Workflow & Processing Overhead',
    currentSpendInr: 0.0, // Operational process, NOT direct spend!
    addressableSpendInr: 0.0, // NOT direct spend!
    currentBaseline: '4,120 small-dollar monthly purchase orders processed annually across plants',
    targetImprovement: 'Reduce transaction volume by 20% to 3,296 monthly aggregated releases',
    savingsPercent: SAVINGS_ASSUMPTIONS.PO_EFFORT_REDUCTION_PERCENT * 100,
    estimatedSavingsInr: 0.0, // NOT converted to INR without explicit client labor cost baseline
    savingsType: 'PRODUCTIVITY_SOFT_SAVINGS',
    confidenceLevel: 'HIGH',
    calculationMethod:
      '(Current PO Count [4,120] - Target PO Count [3,296]) / Current PO Count [4,120] = 20% Effort Reduction',
    keyAssumption: 'PO consolidation reduces operational administrative workload, not procurement spend',
    finding: 'Excessive micro-POs generated for routine repetitive maintenance requirements',
    background: 'High PO volume consumes buyer and accounting bandwidth without procurement leverage',
    objective: 'Automate repetitive ordering into scheduled blanket releases and digital catalogs',
    recommendedAction: 'Implement automated monthly release schedules under blanket purchase orders',
    expectedOutcome: '20% process-effort reduction potential for plant buying and finance teams',
    nextStep: 'Configure ERP automatic batch replenishment for standard catalog items',
    implementationComplexity: 'LOW',
    priority: 'WAVE_1',
    owner: 'Procurement Operations & ERP Lead',
    realizationTimeline: '0–30 Days',
    overlapGroup: 'OG-PO-OPS',
    consolidationStatus: 'INCLUDED'
  },

  // 5. Module 2: Strategic Sourcing - Volume Aggregation
  {
    opportunityId: 'OPP-M2-04',
    module: 'Module 2',
    analysisType: 'STRATEGIC_SOURCING',
    category: 'Direct Raw Materials',
    subCategory: 'Grinding Media & Synthetic Lubricants',
    currentSpendInr: 8400000000.0,
    addressableSpendInr: 840000000.0,
    currentBaseline: 'Independent plant-level tender lots without consolidated national volume commitments',
    targetImprovement: 'Consolidated national commitment across 18 plants pooling 14,200 MT demand',
    savingsPercent: SAVINGS_ASSUMPTIONS.STRATEGIC_SOURCING_IMPROVEMENT * 100,
    estimatedSavingsInr: 25200000.0,
    savingsType: 'HARD_PROCUREMENT_SAVINGS',
    confidenceLevel: 'MEDIUM',
    calculationMethod: `Eligible Spend (₹840 Cr) * Sourcing Improvement Factor (${(
      SAVINGS_ASSUMPTIONS.STRATEGIC_SOURCING_IMPROVEMENT * 100
    ).toFixed(0)}%)`,
    keyAssumption: 'Supplier market has excess capacity willing to discount for guaranteed annual volume',
    finding: 'National scale is fragmented across isolated local plant purchasing schedules',
    background: 'Volume pooling creates significant commercial leverage against Tier-1 fabricators',
    objective: 'Execute single national sourcing event leveraging aggregate enterprise scale',
    recommendedAction: 'Pool annual volumes into structured national framework tenders',
    expectedOutcome: 'Multi-year tier volume discounts and prioritized production allocation',
    nextStep: 'Draft uniform national technical specifications with plant quality heads',
    implementationComplexity: 'HIGH',
    priority: 'WAVE_2',
    owner: 'Corporate Head of Sourcing',
    realizationTimeline: '60–90 Days',
    overlapGroup: 'OG-DIRECT-MAT',
    consolidationStatus: 'PARTIALLY_INCLUDED'
  },

  // 6. Module 2: Competitive RFQ - Secondary Logistics Corridors
  {
    opportunityId: 'OPP-M2-05',
    module: 'Module 2',
    analysisType: 'COMPETITIVE_RFQ',
    category: 'Logistics & Transport',
    subCategory: 'Inbound Clinker & Coal Road Freight',
    currentSpendInr: 7500000000.0,
    addressableSpendInr: 750000000.0,
    currentBaseline: '22 regional transport vendors operating fragmented point-to-point contracts',
    targetImprovement: 'Multi-supplier corridor RFQ with benchmarked fuel-index escalations',
    savingsPercent: SAVINGS_ASSUMPTIONS.COMPETITIVE_RFQ_IMPROVEMENT * 100,
    estimatedSavingsInr: 30000000.0,
    savingsType: 'HARD_PROCUREMENT_SAVINGS',
    confidenceLevel: 'HIGH',
    calculationMethod: `Eligible Logistics Spend (₹750 Cr) * Competitive Improvement (${(
      SAVINGS_ASSUMPTIONS.COMPETITIVE_RFQ_IMPROVEMENT * 100
    ).toFixed(0)}%)`,
    keyAssumption: 'Liquid carrier market with backhaul capacity on primary industrial routes',
    finding: 'Lanes have 14.8% rate spread across comparable distance corridors',
    background: 'Multi-supplier competitive bidding on structured routes drives corridor efficiency',
    objective: 'Harmonize freight base rates per MT-KM pegged to regional diesel price movements',
    recommendedAction: 'Launch multi-round corridor RFQ across 8 primary industrial lanes',
    expectedOutcome: 'Rationalized corridor freight rates and guaranteed vehicle placement SLAs',
    nextStep: 'Publish structured route tender dossiers and verify carrier fleet ownership',
    implementationComplexity: 'MEDIUM',
    priority: 'WAVE_1',
    owner: 'Head of Logistics',
    realizationTimeline: '30–60 Days',
    overlapGroup: 'OG-LOGISTICS',
    consolidationStatus: 'INCLUDED'
  }
];
