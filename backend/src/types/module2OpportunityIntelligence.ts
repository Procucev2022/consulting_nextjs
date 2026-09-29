/**
 * Module 2 — Opportunity Potential, Market Discovery & Procurement Maturity Types
 * Version: MODULE_2_OPPORTUNITY_INTELLIGENCE_V2.0
 */

import type { SourcingDataConfidence } from './module2StrategicSourcing';

export type OpportunityEvidenceState =
  | 'PROVEN_OPPORTUNITY'
  | 'QUANTIFIABLE_OPPORTUNITY_RANGE'
  | 'MARKET_DISCOVERY_OPPORTUNITY'
  | 'IDENTIFIED_NOT_QUANTIFIABLE'
  | 'LOW_EVIDENCED_OPPORTUNITY'
  | 'INSUFFICIENT_DATA';

export type OpportunityPotentialValue =
  | 'PROVEN'
  | 'RANGE'
  | 'MARKET_DISCOVERY'
  | 'NOT_QUANTIFIABLE'
  | 'LOW_EVIDENCED'
  | 'INSUFFICIENT_DATA';

export interface TwoDimensionalOpportunityAssessment {
  dimensionKey: string;
  dimensionLabel: string;
  potentialValue: OpportunityPotentialValue;
  evidenceConfidence: SourcingDataConfidence;
  valueDisplay: string;
  monetaryValueInr: number | null;
  rangeMinInr: number | null;
  rangeMaxInr: number | null;
  confidenceRationale: string;
  diagnosticExplanation: string;
}

export type CommercialDimensionKey =
  | 'PAYMENT_TERMS'
  | 'CONTRACT_COVERAGE'
  | 'CONTRACT_EXPIRY'
  | 'ESCALATION_CLAUSE'
  | 'REBATE_STRUCTURE'
  | 'MOQ_POLICY'
  | 'FREIGHT_TERMS'
  | 'WARRANTY_TERMS'
  | 'LEAD_TIME'
  | 'PRICE_REVIEW'
  | 'VOLUME_COMMITMENT'
  | 'SERVICE_LEVELS';

export type CommercialDimensionStatus =
  | 'OPTIMIZED'
  | 'PARTIALLY_OPTIMIZED'
  | 'OPPORTUNITY_IDENTIFIED'
  | 'INSUFFICIENT_DATA';

export interface CommercialDimensionAssessment {
  dimensionKey: CommercialDimensionKey;
  dimensionLabel: string;
  status: CommercialDimensionStatus;
  statusLabel: string;
  currentCondition: string;
  observedEvidence: string;
  potentialImplication: string;
  recommendedAction: string;
  isQuantifiable: boolean;
  estimatedBenefitInr: number | null;
  confidence: SourcingDataConfidence;
}

export interface CategoryCommercialExcellenceProfile {
  overallStatus: CommercialDimensionStatus;
  overallStatusLabel: string;
  dimensions: CommercialDimensionAssessment[];
  optimizedCount: number;
  partiallyOptimizedCount: number;
  opportunityIdentifiedCount: number;
  insufficientDataCount: number;
  keyFindings: string[];
  strategicActionSummary: string;
}

export interface MarketDiscoveryTrigger {
  triggerKey: string;
  triggerLabel: string;
  observedCondition: string;
  structuralImpact: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface MarketDiscoveryAssessment {
  isMarketDiscoveryRequired: boolean;
  discoveryStatus: 'MARKET_DISCOVERY_REQUIRED' | 'MARKET_VALIDATION_RECOMMENDED' | 'SUFFICIENT_INTERNAL_EVIDENCE';
  discoveryStatusLabel: string;
  triggers: MarketDiscoveryTrigger[];
  diagnosticRationale: string;
  marketTestingRecommendation: string;
  recommendedSourcingVehicle: 'RUN_COMPETITIVE_RFQ' | 'RUN_E_AUCTION' | 'RUN_MARKET_BENCHMARK' | 'SOURCING_STUDY';
  confidence: SourcingDataConfidence;
}

export type ProcurementMaturityDimensionKey =
  | 'PRICE_MANAGEMENT'
  | 'VOLUME_MANAGEMENT'
  | 'SUPPLIER_MANAGEMENT'
  | 'CATEGORY_STRATEGY'
  | 'SPECIFICATION_MANAGEMENT'
  | 'COMPETITIVE_SOURCING'
  | 'CONTRACT_MANAGEMENT'
  | 'COMMERCIAL_TERMS'
  | 'DEMAND_MANAGEMENT'
  | 'DATA_QUALITY';

export type ProcurementMaturityLevel =
  | 'OPTIMIZED'
  | 'MANAGED'
  | 'DEVELOPING'
  | 'BASIC'
  | 'FRAGMENTED';

export interface ProcurementMaturityDimensionAssessment {
  dimensionKey: ProcurementMaturityDimensionKey;
  dimensionLabel: string;
  score: number; // 0 to 10
  maturityLevel: ProcurementMaturityLevel;
  observedCondition: string;
  evidence: string;
  potentialImplication: string;
  recommendedAction: string;
  quantifiability: 'QUANTIFIABLE' | 'NOT_QUANTIFIABLE' | 'MARKET_DISCOVERY';
}

export interface ProcurementMaturityScorecardResult {
  overallScore: number; // 0 to 100
  overallMaturityLevel: ProcurementMaturityLevel;
  dimensions: ProcurementMaturityDimensionAssessment[];
  topWeaknesses: ProcurementMaturityDimensionAssessment[];
  topStrengths: ProcurementMaturityDimensionAssessment[];
  diagnosticSummary: string;
}

export type SourcingNextAction =
  | 'RUN_E_AUCTION'
  | 'RUN_RFQ'
  | 'CONSOLIDATE_VOLUME'
  | 'CONSOLIDATE_SUPPLIERS'
  | 'HARMONIZE_SPECIFICATIONS'
  | 'SEPARATE_CATEGORY_SOURCING'
  | 'NEGOTIATE_COMMERCIAL_TERMS'
  | 'REVIEW_CONTRACT'
  | 'PERFORM_MARKET_DISCOVERY'
  | 'COLLECT_MISSING_DATA'
  | 'MONITOR';

export interface ActionRecommendationOutput {
  whatWeFound: string;
  whyItMatters: string;
  whatWeCanQuantify: string;
  whatWeCannotYetQuantify: string;
  whatShouldBeTested: string;
  whatProcurementShouldDoNext: SourcingNextAction[];
  priorityLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'MONITORING';
}

export interface OverlapReconciliationRecord {
  opportunityComponentId: string;
  overlapGroupId: string;
  primaryOpportunity: string;
  secondaryOpportunity: string;
  overlapAmountInr: number;
  overlapAmountInrCr: number;
  netOpportunityInr: number;
  netOpportunityInrCr: number;
  deduplicationRationale: string;
}

export interface OpportunityWaterfallV2Stage {
  stageKey:
    | 'TOTAL_CATEGORY_SPEND'
    | 'ADDRESSABLE_SPEND'
    | 'COMPARABLE_SPEND'
    | 'PRICE_OPPORTUNITY'
    | 'VOLUME_LEVERAGE'
    | 'E_AUCTION_OPPORTUNITY'
    | 'SUPPLIER_CONSOLIDATION'
    | 'CATEGORY_SPECIALIZATION'
    | 'COMMERCIAL_CONTRACT_OPPORTUNITY'
    | 'PROCESS_DEMAND_OPPORTUNITY'
    | 'MARKET_DISCOVERY_POTENTIAL'
    | 'OVERLAP_DOUBLE_COUNT_ADJUSTMENT'
    | 'NET_DEFENSIBLE_OPPORTUNITY_POTENTIAL';
  label: string;
  startingAmountInr: number;
  eligibleAmountInr: number;
  excludedAmountInr: number;
  exclusionReason: string;
  evidenceLevel: OpportunityEvidenceState;
  confidence: SourcingDataConfidence;
}
