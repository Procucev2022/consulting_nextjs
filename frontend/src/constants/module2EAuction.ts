/**
 * Module 2 — Lever 2: E-Auction / Dynamic Bidding Constants (Frontend)
 * Compliant with Rule 8 (Constants Isolation)
 */

export const EAUCTION_CONFIG = {
  MIN_REPEAT_POS_MULTI_SUPPLIER: 3,
  MIN_REPEAT_POS_SINGLE_SUPPLIER: 5,
  MIN_SPEND_INR_MULTI_SUPPLIER: 1000000,
  MIN_SPEND_INR_SINGLE_SUPPLIER: 5000000,
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
