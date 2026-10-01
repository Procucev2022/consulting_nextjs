/**
 * Executive Brief Lever & Data Constants (Prompt 257)
 */

import type {
  OpportunityLeverSummary,
  PriceDispersionItem,
  ExecutiveFindingCard
} from '../types/executiveBriefTypes';

export const BRIEF_FINDING_CARDS: ExecutiveFindingCard[] = [
  {
    findingId: 'FIND-01',
    title: 'Inter-Plant Unit Price Dispersion on Standardized Consumables',
    background: 'Decentralized plant purchase orders across 6 regional manufacturing clusters.',
    objective: 'Determine whether standardized mechanical consumables are procured at differing unit rates.',
    evidence: '340 standardized repeat items exhibit an average unit price spread of 18.5% across plants.',
    analysis: 'Econometric variance analysis comparing ex-works unit rates across FY24 normalized for freight.',
    outcome: 'Identified substantial rate harmonization opportunity across grinding media and refractory bricks.',
    potentialValueInr: 246000000,
    potentialValueDisplay: '₹24.60 Cr',
    confidence: 'HIGH',
    confidenceRationale: 'Based on 1,840 comparable transactions with identical OEM part numbers and specs.',
    riskConstraint: 'Freight adders must be systematically unbundled from ex-works unit supplier pricing.',
    nextStep: 'Issue centralized corporate rate contracts with indexed regional logistics adders.',
    owner: 'Joint',
    timeline: '30–60 Days',
    detailedAnalysisRef: 'Appendix Item A-01 (Ledger Trace TX-00100..TX-01940)'
  },
  {
    findingId: 'FIND-02',
    title: 'Tail Vendor Base Fragmentation & Small Supplier Administrative Drag',
    background: 'Active supplier master audit evaluating transaction density and cumulative spend share.',
    objective: 'Quantify tail supplier count and administrative overhead across non-critical plant categories.',
    evidence: '912 vendors (61.5% of vendor base) account for only 4.8% of spend (₹236.00 Cr).',
    analysis: 'Supplier rationalization modeling benchmarking invoice processing costs and volume tier discounts.',
    outcome: 'Opportunity to bundle fragmented MRO purchases into pre-qualified regional distributor panels.',
    potentialValueInr: 472000000,
    potentialValueDisplay: '₹47.20 Cr',
    confidence: 'HIGH',
    confidenceRationale: 'Derived from 6,420 non-critical transactions across 18 plants with high commercial redundancy.',
    riskConstraint: 'Local emergency supply availability must be safeguarded via local warehouse consignment.',
    nextStep: 'Execute vendor consolidation wave transitioning 912 tail vendors to 180 certified partners.',
    owner: 'Procucev',
    timeline: '60–90 Days',
    detailedAnalysisRef: 'Appendix Item A-02 (Ledger Trace TX-04000..TX-10420)'
  },
  {
    findingId: 'FIND-03',
    title: 'E-Auction Dynamic Price Discovery Potential in Packaging & Freight',
    background: 'Market suitability screening of liquid multi-supplier categories with high commodity dispersion.',
    objective: 'Identify high-spend categories suitable for structured electronic reverse auction events.',
    evidence: 'Packaging (HDPE bags) and secondary outbound freight lanes feature 14+ qualified vendors.',
    analysis: 'Simulated multi-bidder English reverse auction dynamics based on historical tender spreads.',
    outcome: 'High-confidence competitive bidding opportunity without compromising technical quality.',
    potentialValueInr: 360000000,
    potentialValueDisplay: '₹36.00 Cr',
    confidence: 'HIGH',
    confidenceRationale: 'Backed by verified supplier participation index and historical tender margin variances.',
    riskConstraint: 'Detailed technical specification sign-off required prior to reverse auction event launch.',
    nextStep: 'Prepare dynamic bidding rulebook and pre-qualify 14 regional packaging fabricators.',
    owner: 'Joint',
    timeline: '0–30 Days',
    detailedAnalysisRef: 'Appendix Item A-03 (Ledger Trace TX-02000..TX-04650)'
  }
];

export const BRIEF_LEVER_SUMMARIES: OpportunityLeverSummary[] = [
  {
    leverId: 'LEV-01',
    leverName: 'Direct Price Improvement',
    eligibleSpendInr: 14200000000,
    opportunityInr: 710000000,
    confidence: 'HIGH',
    status: 'In Wave 1'
  },
  {
    leverId: 'LEV-02',
    leverName: 'E-Auction Competitive Events',
    eligibleSpendInr: 9800000000,
    opportunityInr: 588000000,
    confidence: 'HIGH',
    status: 'In Wave 1'
  },
  {
    leverId: 'LEV-03',
    leverName: 'Vendor Base Consolidation',
    eligibleSpendInr: 11800000000,
    opportunityInr: 472000000,
    confidence: 'HIGH',
    status: 'In Wave 1'
  },
  {
    leverId: 'LEV-04',
    leverName: 'Cross-Plant Volume Aggregation',
    eligibleSpendInr: 8400000000,
    opportunityInr: 420000000,
    confidence: 'MEDIUM',
    status: 'Pipeline'
  },
  {
    leverId: 'LEV-05',
    leverName: 'Payment Terms & Early Payment Discounts',
    eligibleSpendInr: 8900000000,
    opportunityInr: 356000000,
    confidence: 'HIGH',
    status: 'In Wave 1'
  },
  {
    leverId: 'LEV-06',
    leverName: 'Category Specialization Realignment',
    eligibleSpendInr: 4600000000,
    opportunityInr: 230000000,
    confidence: 'MEDIUM',
    status: 'Pipeline'
  },
  {
    leverId: 'LEV-07',
    leverName: 'Logistics Regional Rationalization',
    eligibleSpendInr: 7500000000,
    opportunityInr: 225000000,
    confidence: 'HIGH',
    status: 'In Wave 1'
  },
  {
    leverId: 'LEV-08',
    leverName: 'Specification Optimization',
    eligibleSpendInr: 5500000000,
    opportunityInr: 165000000,
    confidence: 'MEDIUM',
    status: 'In Wave 1'
  },
  {
    leverId: 'LEV-09',
    leverName: 'Contract Compliance & Leakage Audit',
    eligibleSpendInr: 3800000000,
    opportunityInr: 114000000,
    confidence: 'HIGH',
    status: 'Pipeline'
  },
  {
    leverId: 'LEV-10',
    leverName: 'PCBI Benchmark Market Realignment',
    eligibleSpendInr: 4200000000,
    opportunityInr: 126000000,
    confidence: 'HIGH',
    status: 'Pipeline'
  }
];

export const BRIEF_PRICE_DISPERSIONS: PriceDispersionItem[] = [
  {
    category: 'Grinding Media',
    item: 'High Chrome Alloy Steel Balls (60-90mm)',
    uom: 'KG',
    min: 92.0,
    p10: 96.0,
    p25: 101.0,
    median: 108.0,
    weightedAvg: 109.4,
    p75: 116.0,
    p90: 122.0,
    max: 128.0,
    eligibleSpendInr: 1420000000,
    potentialOppInr: 142000000,
    confidence: 'HIGH (90%)',
    supportingTxCount: 620
  },
  {
    category: 'Refractory Materials',
    item: 'Low Cement High Alumina Castable (LC-70)',
    uom: 'MT',
    min: 42000.0,
    p10: 44500.0,
    p25: 46800.0,
    median: 49500.0,
    weightedAvg: 50800.0,
    p75: 54200.0,
    p90: 58000.0,
    max: 61000.0,
    eligibleSpendInr: 860000000,
    potentialOppInr: 86000000,
    confidence: 'HIGH (88%)',
    supportingTxCount: 410
  },
  {
    category: 'Packaging Materials',
    item: 'HDPE Double Laminated Bags 50kg Cement',
    uom: 'PC',
    min: 14.2,
    p10: 14.8,
    p25: 15.3,
    median: 16.1,
    weightedAvg: 16.3,
    p75: 17.2,
    p90: 17.9,
    max: 18.4,
    eligibleSpendInr: 940000000,
    potentialOppInr: 94000000,
    confidence: 'HIGH (92%)',
    supportingTxCount: 850
  }
];
