/**
 * Borosil Sourcing Lever Calculation Mechanisms (Prompt 596)
 * Authoritative models for Part 2 calculation mechanisms.
 * Rule 8: Constants isolation; Rule 9: Strongly typed; max lines <= 300, complexity <= 10.
 */

import type { SourcingLeverCalculationMechanism } from '../types/borosilCommercialScenarios';

export const PROCUCEV_CALCULATION_MECHANISMS: SourcingLeverCalculationMechanism[] = [
  {
    leverNumber: 1,
    leverName: 'Direct Price Improvement and Strategic Sourcing',
    modelledNetOpportunityInr: 737693024,
    modelledNetOpportunityCr: 73.769,
    governanceStatus: 'Modelled Opportunity Identified for Commercial Validation',
    formula: 'Potential Price Opportunity = MAX(0, Actual Comparable Purchase Price − Reference Price) × Eligible Quantity',
    visualFlow: [
      'Purchase Transactions',
      'Material / Grade Normalization',
      'Cross-Plant & Supplier Price Comparison',
      'Reference Price Identification',
      'Quantity-Weighted Opportunity',
      'Overlap Deduction',
      'Net Modelled Opportunity'
    ],
    steps: [
      {
        stepNumber: 1,
        stepName: 'Transaction Normalization',
        description: 'Normalize purchase transactions by material, grade, specification, plant, supplier, quantity, and unit price; eliminate duplicate lines.',
        keyOutputs: ['27,777 canonical rows', '8,976 normalized catalog items', '100% PO lineage']
      },
      {
        stepNumber: 2,
        stepName: 'Price Comparison',
        description: 'Compare purchase prices for equivalent materials across Borosil plants (1120, 6101, 8202) and suppliers, adjusting for freight, taxes, and terms.',
        keyOutputs: ['Cross-plant rate dispersion', 'Normalized ex-works rates', 'Equivalent grade mapping']
      },
      {
        stepNumber: 3,
        stepName: 'Reference Price Identification',
        description: 'Identify the appropriate comparable purchase price using defensible internal transaction evidence where volume and conditions are comparable.',
        keyOutputs: ['Defensible rate baseline', 'Volume-weighted benchmarks', 'Justified reference prices']
      },
      {
        stepNumber: 4,
        stepName: 'Opportunity Calculation',
        description: 'Calculate positive differential between current eligible purchase price and reference price multiplied by purchase quantity: MAX(0, Actual − Reference) × Quantity.',
        keyOutputs: ['₹103.729 Cr gross opportunity', '89 qualified direct packages', '100% formula traceability']
      },
      {
        stepNumber: 5,
        stepName: 'Volume and Commercial Adjustment',
        description: 'Evaluate consolidated plant demand, multi-plant delivery capacity, credit terms, and landed cost; deduct cross-lever overlaps.',
        keyOutputs: ['Freight normalization', 'Landed cost parity', 'Credit term adjustments']
      },
      {
        stepNumber: 6,
        stepName: 'Final Net Opportunity',
        description: 'Aggregate package-level opportunities after multi-lever overlap deductions; preserve exact INR and report in Cr.',
        keyOutputs: ['₹29.960 Cr overlap deducted', '₹73.769 Cr net opportunity', '0 double-counting']
      }
    ]
  },
  {
    leverNumber: 2,
    leverName: 'Vendor Consolidation and Supplier Rationalization',
    modelledNetOpportunityInr: 119782414,
    modelledNetOpportunityCr: 11.978,
    governanceStatus: 'Held in Governance Reserve — Excluded from Commercial Target',
    formula: 'Illustrative Consolidation Opportunity = Eligible Consolidated Spend × Commercial Improvement Assumption %',
    visualFlow: [
      'Supplier Fragmentation',
      'Category Spend Analysis',
      'Volume Consolidation',
      'Supplier Qualification',
      'Commercial Negotiation',
      'Landed Cost Comparison',
      'Validated Opportunity'
    ],
    steps: [
      {
        stepNumber: 1,
        stepName: 'Supplier Fragmentation Analysis',
        description: 'Identify supplier fragmentation per category across Bharuch and Jaipur plants to pinpoint micro-fragmented tail spend.',
        keyOutputs: ['1,537 active SAP vendors', 'Category fragmentation index', 'Plant vendor overlaps']
      },
      {
        stepNumber: 2,
        stepName: 'Spend and Volume Aggregation',
        description: 'Consolidate eligible purchase volume across plants where high-performing suppliers can service combined plant requirements.',
        keyOutputs: ['Pooled regional volume', 'Cross-plant consolidation scope', '₹12.081 Cr addressable spend']
      },
      {
        stepNumber: 3,
        stepName: 'Supplier Capability Assessment',
        description: 'Evaluate quality track record, plant capacity, geographic proximity, delivery SLAs, and financial stability.',
        keyOutputs: ['Vetted supplier shortlist', 'Capacity verification', 'Risk heat map']
      },
      {
        stepNumber: 4,
        stepName: 'Consolidated Commercial Benchmark',
        description: 'Compare weighted-average prices against tiered vendor scale proposals, accounting for logistics and transition costs.',
        keyOutputs: ['Tiered rate-card benchmarks', 'Volume rebate structures', 'Consignment stock terms']
      },
      {
        stepNumber: 5,
        stepName: 'Opportunity Calculation',
        description: 'Apply conservative commercial improvement assumptions against eligible spend or utilize supplier scale quotations.',
        keyOutputs: ['₹11.978 Cr modelled pool', '4 high-fragmentation packages', 'Held in governance reserve']
      },
      {
        stepNumber: 6,
        stepName: 'Governance & Validation',
        description: 'Validate technical continuity, obtain formal vendor proposals and management approvals prior to release from reserve.',
        keyOutputs: ['Client approval gate', 'Supply continuity safeguard', '₹0 current realized claim']
      }
    ]
  },
  {
    leverNumber: 3,
    leverName: 'Reverse E-Auction and Dynamic Bidding',
    modelledNetOpportunityInr: 13519875,
    modelledNetOpportunityCr: 1.352,
    governanceStatus: 'Modelled Opportunity Identified for Commercial Validation',
    formula: 'Auction Opportunity = MAX(0, Normalized Existing Purchase Price − Final Qualified Bid) × Eligible Auction Quantity',
    visualFlow: [
      'Auction-Eligible Spend',
      'Specification Standardization',
      'Qualified Supplier Panel',
      'RFQ Template',
      'Multi-Round Reverse Auction',
      'Final Qualified Bid',
      'Quantity-Weighted Opportunity',
      'Overlap Deduction'
    ],
    steps: [
      {
        stepNumber: 1,
        stepName: 'Auction Suitability Screening',
        description: 'Screen categories for standardized commodity specifications and multiple capable suppliers; exclude non-comparables.',
        keyOutputs: ['12 qualified packages', 'Standardized packaging/indirects', 'Multi-supplier readiness']
      },
      {
        stepNumber: 2,
        stepName: 'RFQ Standardization',
        description: 'Standardize technical specifications, delivery terms, tax structures, and freight to create common bidding parameters.',
        keyOutputs: ['Standardized bid lot templates', 'Normalized ex-factory terms', 'Clear qualification criteria']
      },
      {
        stepNumber: 3,
        stepName: 'Supplier Qualification',
        description: 'Invite vetted existing and approved regional suppliers; verify technical compliance and commercial eligibility.',
        keyOutputs: ['Prequalified bidder panel', 'Quality test certification', 'Capacity commitment']
      },
      {
        stepNumber: 4,
        stepName: 'Competitive Dynamic Bidding',
        description: 'Conduct multi-round reverse e-auctions on Procucev platform; capture opening, intermediate, and final bids with audit trail.',
        keyOutputs: ['Real-time price discovery', 'Full audit trail', 'Dynamic market pricing']
      },
      {
        stepNumber: 5,
        stepName: 'Opportunity Calculation',
        description: 'Multiply positive differential between existing normalized baseline rate and final qualified bid by eligible quantity.',
        keyOutputs: ['₹1.440 Cr gross opportunity', 'Transparent market savings', 'Transaction-level records']
      },
      {
        stepNumber: 6,
        stepName: 'Overlap Deduction & Finalization',
        description: 'Deduct categories and volume already accounted for under Lever 1 to isolate pure incremental dynamic bidding value.',
        keyOutputs: ['₹0.088 Cr overlap deducted', '₹1.352 Cr net opportunity', '12 qualified packages']
      }
    ]
  }
];

