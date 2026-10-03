/**
 * Centralized Savings & Opportunity Assumptions Configuration (Prompt 269 Section 16)
 * Single source of truth for all modelling assumptions across Modules 1 to 4.
 */

export const SAVINGS_ASSUMPTIONS = {
  /**
   * Default illustrative volume discount assumption for Vendor Consolidation
   */
  VENDOR_CONSOLIDATION_DISCOUNT: 0.05,

  /**
   * Indicative strategic sourcing improvement assumption
   */
  STRATEGIC_SOURCING_IMPROVEMENT: 0.03,

  /**
   * Indicative competitive sourcing / multi-supplier RFQ assumption
   */
  COMPETITIVE_RFQ_IMPROVEMENT: 0.04,

  /**
   * Indicative dynamic electronic reverse auction improvement assumption
   */
  E_AUCTION_IMPROVEMENT: 0.06,

  /**
   * Process effort reduction default percentage for PO Consolidation (Productivity)
   */
  PO_EFFORT_REDUCTION_PERCENT: 0.20,

  /**
   * Default annual processing cost baseline per PO (0 = unavailable / soft metric)
   */
  DEFAULT_ANNUAL_PO_PROCESSING_COST_PER_PO: 0,

  /**
   * Standard disclaimer text for CFO/CEO reporting
   */
  DISCLAIMER_TEXT: 'Based on analysed addressable spend and stated modelling assumptions.',

  /**
   * Explicit label for unanchored assumptions
   */
  ILLUSTRATIVE_ASSUMPTION_LABEL: 'Illustrative modelling assumption',

  /**
   * Vendor consolidation formal disclaimer text
   */
  VENDOR_CONSOLIDATION_DISCLAIMER:
    'Based on supplier fragmentation identified in the analysed spend, consolidation of eligible volumes may create additional purchasing leverage. An indicative 5% volume-discount assumption has been applied for opportunity modelling. Actual realization will depend on supplier negotiations, market conditions, specifications and competitive intensity.',

  /**
   * PO consolidation formal disclaimer text
   */
  PO_CONSOLIDATION_DISCLAIMER:
    'PO consolidation indicates an opportunity to reduce transaction workload. The model estimates a 20% reduction in PO-processing effort based on the reduction from 4,120 to 3,296 POs. Monetary benefit should only be calculated where the customer\'s procurement processing cost is available.',

  /**
   * E-auction positioning formal disclaimer text
   */
  E_AUCTION_DISCLAIMER:
    'E-auction is one of several sourcing mechanisms evaluated and is not assumed to be applicable to the entire addressable spend.',

  /**
   * PCBI benchmarking formal disclaimer text
   */
  PCBI_BENCHMARK_DISCLAIMER:
    'PCBI analysis identifies price-positioning opportunities independent of the sourcing mechanism. The opportunity may subsequently be realized through negotiation, competitive RFQ, supplier consolidation, contract reset, index-linked pricing or other commercial interventions.',

  /**
   * Single-supplier risk formal disclaimer text
   */
  STRATEGIC_RISK_DISCLAIMER:
    'Single supplier risk represents supply continuity and operational resilience. Benefit is classified as Risk Mitigation Opportunity unless an alternate-source or competitive sourcing opportunity is supported by verified data.'
} as const;

export type SavingsAssumptionsConfig = typeof SAVINGS_ASSUMPTIONS;
