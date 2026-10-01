/**
 * Savings Opportunity Register Types (Prompt 269 Section 2 & 7)
 * Authoritative data model for structured savings attribution and executive reporting.
 */

export type SavingsType =
  | 'HARD_PROCUREMENT_SAVINGS'
  | 'COST_AVOIDANCE'
  | 'PRODUCTIVITY_SOFT_SAVINGS'
  | 'RISK_STRATEGIC_BENEFIT';

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export type ConsolidationStatus =
  | 'INCLUDED'
  | 'PARTIALLY_INCLUDED'
  | 'OVERLAPPING'
  | 'EXCLUDED_FROM_CONSOLIDATED';

export type ImplementationComplexity = 'LOW' | 'MEDIUM' | 'HIGH';

export type SourcingPriority = 'WAVE_1' | 'WAVE_2' | 'WAVE_3' | 'PIPELINE';

export interface SavingsOpportunityRegisterItem {
  opportunityId: string;
  module: 'Module 1' | 'Module 2' | 'Module 3' | 'Module 4';
  analysisType:
    | 'VENDOR_CONSOLIDATION'
    | 'PO_CONSOLIDATION'
    | 'STRATEGIC_SOURCING'
    | 'COMPETITIVE_RFQ'
    | 'E_AUCTION'
    | 'STRATEGIC_RISK'
    | 'SPECIFICATION_STANDARDIZATION'
    | 'PCBI_BENCHMARK_GAP'
    | 'PRICE_TREND_TIMING'
    | 'RATE_HARMONIZATION';
  category: string;
  subCategory: string;
  currentSpendInr: number;
  addressableSpendInr: number;
  currentBaseline: string;
  targetImprovement: string;
  savingsPercent: number;
  estimatedSavingsInr: number;
  savingsType: SavingsType;
  confidenceLevel: ConfidenceLevel;
  calculationMethod: string;
  keyAssumption: string;
  finding: string;
  background: string;
  objective: string;
  recommendedAction: string;
  expectedOutcome: string;
  nextStep: string;
  implementationComplexity: ImplementationComplexity;
  priority: SourcingPriority;
  owner: string;
  realizationTimeline: string;
  overlapGroup: string;
  consolidationStatus: ConsolidationStatus;
}

export interface ConsolidatedSavingsSummary {
  totalEvaluatedSpendInr: number;
  addressableSpendInr: number;
  grossOpportunityInr: number;
  overlapInr: number;
  exclusionInr: number;
  netDefensibleOpportunityInr: number;
  hardProcurementSavingsInr: number;
  costAvoidanceInr: number;
  productivityEffortReductionPercent: number;
  productivityPoReductionCount: number;
  strategicRiskInitiativesCount: number;
}
