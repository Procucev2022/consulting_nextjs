/**
 * Module 2 — Lever 2: E-Auction / Dynamic Bidding Constants
 * Compliant with Rule 8 (Constants Isolation)
 */

import type { AuctionPlanningAssumption } from '../types/module2EAuction';

export const EAUCTION_CONFIG = {
  MIN_REPEAT_POS_MULTI_SUPPLIER: 3,
  MIN_REPEAT_POS_SINGLE_SUPPLIER: 5,
  MIN_SPEND_INR_MULTI_SUPPLIER: 1000000, // ₹10 Lakhs
  MIN_SPEND_INR_SINGLE_SUPPLIER: 5000000, // ₹50 Lakhs
  ALL_FINANCIAL_YEARS: 'ALL',
  UNMAPPED_UNSPSC_CODE: '00000000',
  UNMAPPED_UNSPSC_TITLE: 'Unclassified — UNSPSC mapping unavailable',
  CERTIFICATION_NOTICE: 'Candidate Identification Engine • Indicative Feasibility Only • NOT Commercially Validated',
  IMPORTANT_LIMITATIONS: [
    'Purchase history alone cannot prove that suppliers will participate in an e-auction.',
    'Historical price dispersion does not constitute guaranteed or commercial savings.',
    'Quantified savings remain at ₹0.00 until an actual auction event is executed and validated.',
    'Final e-auction approval requires thorough procurement review of technical specifications, supplier eligibility, and commercial terms.'
  ],
  PROCUREMENT_REVIEW_REQUIREMENTS: [
    'Detailed technical specifications & tolerance comparability review',
    'Supplier qualification, active manufacturing capacity & financial solvency',
    'Supplier willingness & readiness to participate in dynamic digital bidding',
    'Commercial terms, payment cycles & incoterms standardization',
    'Plant-specific delivery schedules, freight terms & storage constraints',
    'Statutory, taxation, ESG & compliance clearance'
  ]
} as const;

export const AUCTION_SUITABILITY_LABELS = {
  CANDIDATE: 'Candidate for Review',
  FURTHER_DATA: 'Further Data Required',
  NOT_SUITABLE: 'Not Currently Suitable',
  NOT_ASSESSED: 'Not Assessed'
} as const;

export const DEFAULT_AUCTION_PLANNING_ASSUMPTIONS: AuctionPlanningAssumption[] = [
  {
    id: 'ASSUMP-PACKAGING',
    categoryOrMaterial: 'Packaging',
    minSavingsRate: 0.03,
    expectedSavingsRate: 0.055,
    maxSavingsRate: 0.09,
    rateSource: 'Industrial Packaging Dynamic Reverse Auction Index',
    referencePeriod: '2023-2025 Historical Dynamic Bidding Indices',
    applicability: 'Multi-supplier corrugated, polybags, boxes and industrial packaging',
    approvalStatus: 'Proposed Planning Assumption — Approval Required',
    confidence: 'HIGH',
    isPlanningAssumptionOnly: true,
    notes: 'Provisional planning assumption — Approval required by authorised user. Editable in governance settings.'
  },
  {
    id: 'ASSUMP-CHEMICALS',
    categoryOrMaterial: 'Chemicals',
    minSavingsRate: 0.02,
    expectedSavingsRate: 0.04,
    maxSavingsRate: 0.065,
    rateSource: 'Chemical Industry Reverse Auction Procurement Benchmarks',
    referencePeriod: 'FY2023-FY2025',
    applicability: 'Standardized bulk industrial chemicals and dyes with >= 2 active suppliers',
    approvalStatus: 'Proposed Planning Assumption — Approval Required',
    confidence: 'HIGH',
    isPlanningAssumptionOnly: true,
    notes: 'Provisional planning assumption — Approval required by authorised user. Editable in governance settings.'
  },
  {
    id: 'ASSUMP-MRO-SPARES',
    categoryOrMaterial: 'MRO',
    minSavingsRate: 0.04,
    expectedSavingsRate: 0.07,
    maxSavingsRate: 0.12,
    rateSource: 'MRO & Standard Hardware Dynamic Bidding Benchmarks',
    referencePeriod: 'FY2023-FY2025',
    applicability: 'Standardized off-the-shelf industrial parts, fasteners and hardware',
    approvalStatus: 'Proposed Planning Assumption — Approval Required',
    confidence: 'MEDIUM',
    isPlanningAssumptionOnly: true,
    notes: 'Provisional planning assumption — Approval required by authorised user. Editable in governance settings.'
  },
  {
    id: 'ASSUMP-GENERAL-SOURCING',
    categoryOrMaterial: 'DEFAULT',
    minSavingsRate: 0.02,
    expectedSavingsRate: 0.035,
    maxSavingsRate: 0.05,
    rateSource: 'Enterprise Strategic Sourcing Conservative Planning Baseline',
    referencePeriod: 'FY2024-FY2025',
    applicability: 'Multi-supplier candidate materials with documented price dispersion',
    approvalStatus: 'Proposed Planning Assumption — Approval Required',
    confidence: 'MEDIUM',
    isPlanningAssumptionOnly: true,
    notes: 'Provisional planning assumption — Approval required by authorised user. Editable in governance settings.'
  }
];
