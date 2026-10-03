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
    finding: '340 standardized repeat items exhibit an average unit price spread of 18.5% across plants',
    background: 'Decentralized plant purchase orders across 6 regional manufacturing clusters cause rate creep',
    objective: 'Standardize ex-works purchase rates to corporate benchmark rate cards across all facilities',
    addressableBase: '₹1,420.00 Cr in direct consumable purchase ledger transactions',
    methodology: 'Econometric variance analysis comparing ex-works unit rates across FY24 normalized for freight',
    analysis: 'Econometric variance analysis comparing ex-works unit rates across FY24 normalized for freight',
    evidence: '340 standardized repeat items exhibit an average unit price spread of 18.5% across plants',
    assumption: 'Regional logistics adders systematically unbundled from base ex-works vendor pricing',
    outcome: 'Direct unit rate savings realized on subsequent purchase order releases across plants',
    potentialValueInr: 246000000,
    potentialValueDisplay: '₹24.60 Cr',
    indicativeOpportunity: 'Indicative Procurement Opportunity: ₹24.60 Cr',
    confidence: 'HIGH',
    confidenceRationale: 'Based on 1,840 comparable transactions with identical OEM part numbers and specs',
    riskConstraint: 'Freight adders must be systematically unbundled from ex-works unit supplier pricing',
    recommendedAction: 'Enforce mandatory corporate rate cards with indexed regional logistics adders',
    expectedOutcome: 'Direct unit rate savings realized on subsequent purchase order releases across plants',
    nextStep: 'Issue centralized corporate rate contracts with indexed regional logistics adders',
    owner: 'Joint',
    timeline: '30–60 Days',
    detailedAnalysisRef: 'Appendix Item A-01 (Ledger Trace TX-00100..TX-01940)'
  },
  {
    findingId: 'FIND-02',
    title: 'Tail Vendor Base Fragmentation & Small Supplier Administrative Drag',
    finding: '912 vendors (61.5% of vendor base) account for only 4.8% of spend (₹236.00 Cr)',
    background: 'Active supplier master audit evaluating transaction density and cumulative spend share',
    objective: 'Consolidate fragmented demand and improve purchasing leverage with master partners',
    addressableBase: '₹480.00 Cr in fragmented plant MRO & hardware purchases',
    methodology: 'Supplier consolidation modeling applying volume tier pricing to pooled annual demand',
    analysis: 'Supplier rationalization modeling benchmarking invoice processing costs and volume tier discounts',
    evidence: '912 vendors (61.5% of vendor base) account for only 4.8% of spend (₹236.00 Cr)',
    assumption: 'Indicative 5% volume-discount assumption applied for opportunity modelling',
    outcome: 'Consolidated commercial purchasing leverage and vendor-managed inventory stocking',
    potentialValueInr: 472000000,
    potentialValueDisplay: '₹47.20 Cr',
    indicativeOpportunity: 'Indicative Procurement Opportunity: ₹47.20 Cr',
    confidence: 'HIGH',
    confidenceRationale: 'Derived from 6,420 non-critical transactions across 18 plants with high commercial redundancy',
    riskConstraint: 'Local emergency supply availability must be safeguarded via local warehouse consignment',
    recommendedAction: 'Transition 912 tail vendors into 4 pre-qualified regional master distributor panels',
    expectedOutcome: 'Consolidated commercial purchasing leverage and vendor-managed inventory stocking',
    nextStep: 'Execute vendor consolidation wave transitioning 912 tail vendors to 180 certified partners',
    owner: 'Procucev',
    timeline: '60–90 Days',
    detailedAnalysisRef: 'Appendix Item A-02 (Ledger Trace TX-04000..TX-10420)'
  },
  {
    findingId: 'FIND-03',
    title: 'Competitive Sourcing & E-Auction Execution in Standardized Packaging',
    finding: 'Packaging materials (HDPE bags) feature 14+ qualified vendors and liquid supply market',
    background: 'E-auction is evaluated as one execution mechanism within the broader sourcing strategy',
    objective: 'Dynamic, transparent price discovery among pre-qualified manufacturers with locked reserves',
    addressableBase: '₹320.00 Cr in standardized HDPE double laminated bag procurement',
    methodology: 'Simulated multi-bidder English reverse auction dynamics based on historical tender spreads',
    analysis: 'Simulated multi-bidder English reverse auction dynamics based on historical tender spreads',
    evidence: 'Packaging materials (HDPE bags) feature 14+ qualified vendors and liquid supply market',
    assumption: 'Standardized technical spec; e-auction applied only to liquid categories with 5+ bidders',
    outcome: 'L1 price discovery driven by real-time competitive bidding compression',
    potentialValueInr: 360000000,
    potentialValueDisplay: '₹36.00 Cr',
    indicativeOpportunity: 'Indicative Procurement Opportunity: ₹36.00 Cr',
    confidence: 'HIGH',
    confidenceRationale: 'Backed by verified supplier participation index and historical tender margin variances',
    riskConstraint: 'Detailed technical specification sign-off required prior to reverse auction event launch',
    recommendedAction: 'Publish competitive bidding rulebook and execute multi-lot English dynamic reverse auction',
    expectedOutcome: 'L1 price discovery driven by real-time competitive bidding compression',
    nextStep: 'Prepare dynamic bidding rulebook and pre-qualify 14 regional packaging fabricators',
    owner: 'Joint',
    timeline: '0–30 Days',
    detailedAnalysisRef: 'Appendix Item A-03 (Ledger Trace TX-02000..TX-04650)'
  },
  {
    findingId: 'FIND-04',
    title: 'PCBI Benchmark Gap Independent Price Positioning in Energy & Resins',
    finding: 'Imported petcoke and PP resin show 6.28% and 7.41% variance against PCBI benchmarks',
    background: 'PCBI analysis identifies price-positioning opportunities independent of the sourcing mechanism',
    objective: 'Align term supply contracts with independent international commodity price indices',
    addressableBase: '₹2,104.50 Cr across imported bulk energy and petrochemical feedstock',
    methodology: 'Volume-weighted variance analysis comparing customer landed contract rates to PCBI Grade A+ index',
    analysis: 'Volume-weighted variance analysis comparing customer landed contract rates to PCBI Grade A+ index',
    evidence: 'Imported petcoke and PP resin show 6.28% and 7.41% variance against PCBI benchmarks',
    assumption: 'Grade A+ independent market indices derived from verified customs import declarations',
    outcome: 'Direct protection against non-market commodity markups and automatic downside capture',
    potentialValueInr: 137500000,
    potentialValueDisplay: '₹13.75 Cr',
    indicativeOpportunity: 'Indicative Procurement Opportunity: ₹13.75 Cr',
    confidence: 'HIGH',
    confidenceRationale: 'Derived from audited customs import records and official producer spot price bulletins',
    riskConstraint: 'Index adjustment corridors must be negotiated into long-term master contracts',
    recommendedAction: 'Restructure supplier contracts with monthly index-linked pricing formulas',
    expectedOutcome: 'Direct protection against non-market commodity markups and automatic downside capture',
    nextStep: 'Present audited PCBI benchmark gap dossiers during upcoming quarterly term contract renewals',
    owner: 'Procucev',
    timeline: '30–60 Days',
    detailedAnalysisRef: 'Appendix Item A-04 (PCBI Benchmark Database Feed Q3 FY24)'
  },
  {
    findingId: 'FIND-05',
    title: 'PO Consolidation & Operational Process Effort Reduction',
    finding: '4,120 micro-purchase orders generated annually across 18 manufacturing facilities',
    background: 'PO consolidation represents operational productivity and manpower effort reduction, not spend savings',
    objective: 'Automate recurring repetitive transactional orders into scheduled blanket releases',
    addressableBase: '4,120 annual purchase orders across standard plant consumables',
    methodology: 'Process effort reduction formula: (Current POs [4,120] - Target POs [3,296]) / Current POs [4,120]',
    analysis: 'Operational workload assessment analyzing purchase order frequency and buyer transaction cycle times',
    evidence: '4,120 micro-purchase orders generated annually across 18 manufacturing facilities',
    assumption: 'Model estimates a 20% reduction in PO-processing effort; no spend conversion without cost baseline',
    outcome: '824 fewer purchase orders processed annually, releasing buyer bandwidth for strategic sourcing',
    potentialValueInr: 0,
    potentialValueDisplay: '20% Effort Reduction',
    indicativeOpportunity: 'Indicative Productivity Opportunity: 20% Process Effort Reduction',
    confidence: 'HIGH',
    confidenceRationale: 'Based on complete ERP transaction log analysis of repeat orders under ₹5 Lakh',
    riskConstraint: 'Plant emergency requisition pathways must be preserved for unscheduled downtime',
    recommendedAction: 'Implement automated monthly blanket releases and pre-approved digital catalog purchasing',
    expectedOutcome: '824 fewer purchase orders processed annually, releasing buyer bandwidth for strategic sourcing',
    nextStep: 'Configure ERP automatic batch replenishment for standardized plant consumables',
    owner: 'Customer',
    timeline: '0–30 Days',
    detailedAnalysisRef: 'Appendix Item A-05 (PO Ledger Trace PO-88000..PO-92120)'
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
