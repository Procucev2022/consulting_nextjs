/**
 * Executive Brief Portfolio Types & Interfaces
 * Adheres strictly to Section 2, Section 13, Section 15, Section 19, and Section 22 of Prompt 274.
 */

export type ExecutiveBriefValueType =
  | 'DIRECT_PROCUREMENT_SAVING'
  | 'PROCESS_PRODUCTIVITY_BENEFIT'
  | 'RISK_COST_AVOIDANCE'
  | 'STRATEGIC_OPPORTUNITY'
  | 'VALIDATED_SAVING';

export type ExecutiveBriefAssumptionClassification =
  | 'FACTUAL BASELINE'
  | 'ANALYTICAL FINDING'
  | 'BENCHMARK FINDING'
  | 'PLANNING ASSUMPTION'
  | 'ESTIMATED OPPORTUNITY'
  | 'VALIDATED SAVING';

export interface ExecutiveBriefFindingStructure {
  readonly background: string;
  readonly objective: string;
  readonly dataEvidence: string;
  readonly finding: string;
  readonly valueOpportunity: string;
  readonly calculation: string;
  readonly confidence: string;
  readonly executionApproach: string;
  readonly nextStep: string;
  readonly validationRequired: string;
}

export interface ExecutiveBriefMasterOpportunityItem extends ExecutiveBriefFindingStructure {
  readonly opportunityId: string;
  readonly module: string;
  readonly analysis: string;
  readonly category: string;
  readonly item: string;
  readonly supplier: string;
  readonly customerSpendBase: string;
  readonly eligibleSpend: string;
  readonly valueType: ExecutiveBriefValueType;
  readonly valueTypeLabel: string;
  readonly lowPercent: string;
  readonly basePercent: string;
  readonly highPercent: string;
  readonly lowValue: string;
  readonly baseValue: string;
  readonly highValue: string;
  readonly indicativeOpportunity: string;
  readonly assumption: string;
  readonly executionMechanism: string;
  readonly overlapGroup: string;
  readonly exclusionStatus: string;
  readonly owner: string;
  readonly timeline: string;
  readonly status: string;
  readonly classificationLabel: ExecutiveBriefAssumptionClassification;
  readonly transactionSampleId: string;
}

export interface ExecutiveBriefTotalValuePortfolioProps {
  readonly onSelectOpportunity?: (opportunityId: string) => void;
}
