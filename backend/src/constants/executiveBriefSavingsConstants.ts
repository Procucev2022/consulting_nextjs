/**
 * Executive Brief Savings, Auction, and Benchmark Constants (Prompt 257)
 */

import type {
  EAuctionOpportunity,
  VendorConsolidationPlan,
  PCBIBenchmarkItem,
  SavingsInitiative
} from '../types/executiveBriefTypes';

export const BRIEF_E_AUCTIONS: EAuctionOpportunity[] = [
  {
    category: 'Packaging Materials',
    eligibleSpendInr: 3200000000,
    supplierCount: 14,
    historicalDispersion: '16.2% spread between L1 and L3',
    auctionSuitability: 'Excellent — Standardized technical spec, high capacity suppliers',
    recommendedAuctionType: 'English Dynamic Reverse Auction',
    reserveLogic: 'Set reserve at historical P10 (₹14.80/bag)',
    potentialBenefitInr: 192000000,
    confidence: 'HIGH (85%)',
    nextAction: 'Finalize supplier qualification & lock bidding lots'
  },
  {
    category: 'Inbound Coal Logistics',
    eligibleSpendInr: 2800000000,
    supplierCount: 22,
    historicalDispersion: '14.8% spread across regional transport corridors',
    auctionSuitability: 'High — Multiple fleet owners with regional lane capacity',
    recommendedAuctionType: 'Multi-Round Corridor Dutch Auction',
    reserveLogic: 'Indexed to diesel fuel base rate per MT-KM',
    potentialBenefitInr: 168000000,
    confidence: 'HIGH (82%)',
    nextAction: 'Bundle 8 primary clinker & fuel dispatch lanes'
  },
  {
    category: 'Mechanical Fasteners & Hardware',
    eligibleSpendInr: 1100000000,
    supplierCount: 18,
    historicalDispersion: '22.4% variance across non-contract purchases',
    auctionSuitability: 'High — Off-the-shelf DIN/ISO standard grades',
    recommendedAuctionType: 'Rank-Based Reverse Auction',
    reserveLogic: 'Volume weighted discount table across 400 line items',
    potentialBenefitInr: 77000000,
    confidence: 'MEDIUM (78%)',
    nextAction: 'Consolidate annual plant requirements into national tender'
  }
];

export const BRIEF_CONSOLIDATION_PLANS: VendorConsolidationPlan[] = [
  {
    category: 'Industrial Plant Hardware & Consumables',
    currentState: '342 local hardware suppliers across 18 plants, avg spend ₹14L/supplier',
    targetState: '4 regional master stocking distributors with on-site consignment stores',
    eligibleSpendInr: 480000000,
    supplierRationalization: 'Rationalize 342 vendors down to 4 master partners (-98.8%)',
    potentialBenefitInr: 48000000,
    risk: 'Potential local plant delivery delay during emergency outages',
    nextStep: 'Enforce 4-hour emergency SLA with vendor-managed inventory (VMI)'
  },
  {
    category: 'Plant Electrical Consumables & Cables',
    currentState: '215 electrical supply shops billing fragmented ad-hoc invoices',
    targetState: '3 authorized direct OEM distributors (Schneider, ABB, Polycab)',
    eligibleSpendInr: 390000000,
    supplierRationalization: 'Rationalize 215 suppliers to 3 authorized OEM channels (-98.6%)',
    potentialBenefitInr: 39000000,
    risk: 'Loss of extended local credit terms from informal vendors',
    nextStep: 'Harmonize payment terms to 60 days backed by supply chain financing'
  }
];

export const BRIEF_PCBI_BENCHMARKS: PCBIBenchmarkItem[] = [
  {
    commodity: 'Imported Petroleum Coke (Petcoke)',
    specification: '6.5% Max Sulfur, 8200 kcal/kg GCV, CIF West Coast Port landed',
    customerPrice: 13850,
    pcbiReference: 12980,
    variancePercent: -6.28,
    period: 'Q3 FY24',
    uom: 'MT',
    currency: 'INR',
    source: 'PCBI Independent Global Bulk Energy Landed Index',
    qualityRating: 'GRADE A+ (Verified Port Cargo Shipments)'
  },
  {
    commodity: 'Polypropylene Homopolymer Resin',
    specification: 'Raffia Grade Yarn extrusion for HDPE/PP woven sacks',
    customerPrice: 98.5,
    pcbiReference: 91.2,
    variancePercent: -7.41,
    period: 'Q3 FY24',
    uom: 'KG',
    currency: 'INR',
    source: 'PCBI Petrochemical Feedstock Index (Ex-Refinery Mumbai)',
    qualityRating: 'GRADE A+ (Published Producer Spot Benchmarks)'
  },
  {
    commodity: 'Imported Thermal Coal 5000 kcal/kg',
    specification: 'GAR 5000 kcal/kg, 0.8% Sulfur, Ex-Mundra / Dahej Port',
    customerPrice: 8640,
    pcbiReference: 8120,
    variancePercent: -6.02,
    period: 'Q3 FY24',
    uom: 'MT',
    currency: 'INR',
    source: 'PCBI Seaborne Thermal Coal Delivered Index',
    qualityRating: 'GRADE A+ (Customs Import Cleared Declarations)'
  }
];

export const BRIEF_SAVINGS_INITIATIVES: SavingsInitiative[] = [
  {
    initiativeId: 'INIT-01',
    initiative: 'Direct Material Price Harmonization (Grinding Media & Refractories)',
    category: 'Direct Materials',
    baselineSpendInr: 1420000000,
    targetInr: 142000000,
    approvedBenefitInr: 142000000,
    realizedBenefitInr: 85200000,
    realizationPercent: 60.0,
    status: 'IN EXECUTION',
    owner: 'Procucev Category Lead',
    timeline: 'Month 1–3'
  },
  {
    initiativeId: 'INIT-02',
    initiative: 'HDPE Cement Packaging Reverse E-Auction',
    category: 'Packaging',
    baselineSpendInr: 1180000000,
    targetInr: 118000000,
    approvedBenefitInr: 118000000,
    realizedBenefitInr: 59000000,
    realizationPercent: 50.0,
    status: 'IN EXECUTION',
    owner: 'Corporate Procurement Head',
    timeline: 'Month 2–4'
  },
  {
    initiativeId: 'INIT-03',
    initiative: 'Dynamic Early Payment Discounting Program',
    category: 'Finance / Treasury',
    baselineSpendInr: 890000000,
    targetInr: 89000000,
    approvedBenefitInr: 89000000,
    realizedBenefitInr: 44500000,
    realizationPercent: 50.0,
    status: 'IN EXECUTION',
    owner: 'CFO / Treasury Lead',
    timeline: 'Month 1–2'
  },
  {
    initiativeId: 'INIT-04',
    initiative: 'Secondary Inbound Coal Logistics Lane Rationalization',
    category: 'Logistics',
    baselineSpendInr: 750000000,
    targetInr: 75000000,
    approvedBenefitInr: 75000000,
    realizedBenefitInr: 25000000,
    realizationPercent: 33.3,
    status: 'IN EXECUTION',
    owner: 'Head of Logistics',
    timeline: 'Month 2–5'
  },
  {
    initiativeId: 'INIT-05',
    initiative: 'Standardization of HDPE Bag GSM Specifications',
    category: 'Packaging & Quality',
    baselineSpendInr: 550000000,
    targetInr: 55000000,
    approvedBenefitInr: 55000000,
    realizedBenefitInr: 0,
    realizationPercent: 0.0,
    status: 'APPROVED — PRE-TENDER',
    owner: 'Joint Quality & Sourcing',
    timeline: 'Month 3–6'
  }
];
