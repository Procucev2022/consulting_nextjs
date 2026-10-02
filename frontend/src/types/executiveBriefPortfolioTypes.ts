/**
 * Executive Brief Portfolio Types & Interfaces
 * Adheres strictly to Section 1, Section 12, Section 15, Section 18, Section 19, and Section 20 of Prompt 275.
 */

export type ExecutiveBriefValueClassification =
  | 'DIRECT_SAVING'
  | 'PROCESS_PRODUCTIVITY'
  | 'COST_AVOIDANCE'
  | 'STRATEGIC_VALUE'
  | 'VALIDATED_SAVING'
  | 'REALIZED_SAVING';

export type ExecutiveBriefValueType =
  | 'DIRECT_SAVING'
  | 'PROCESS_PRODUCTIVITY'
  | 'COST_AVOIDANCE'
  | 'STRATEGIC_VALUE'
  | 'VALIDATED_SAVING'
  | 'REALIZED_SAVING'
  | 'DIRECT_PROCUREMENT_SAVING'
  | 'PROCESS_PRODUCTIVITY_BENEFIT'
  | 'RISK_COST_AVOIDANCE'
  | 'STRATEGIC_OPPORTUNITY';

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
  readonly currentState?: string;
  readonly whatWeFound: string;
  readonly whyItMatters: string;
  readonly finding: string;
  readonly valueOpportunity: string;
  readonly calculation: string;
  readonly calculationMethod?: string;
  readonly confidence: string;
  readonly executionApproach: string;
  readonly expectedOutcome: string;
  readonly nextStep: string;
  readonly validationRequired: string;
  readonly customerValidationRequired?: string;
  readonly lowCase?: string;
  readonly baseCase?: string;
  readonly highCase?: string;
}

export interface ExecutiveBriefTransactionEvidence {
  readonly transactionId: string;
  readonly poNumber: string;
  readonly poDate: string;
  readonly supplier: string;
  readonly itemDescription: string;
  readonly quantity: string;
  readonly uom: string;
  readonly unitPrice: string;
  readonly spend: string;
  readonly category: string;
  readonly benchmarkPrice: string;
  readonly calculation: string;
  readonly source: string;
}

export interface ExecutiveBriefAssumptionRegisterItem {
  readonly assumptionId: string;
  readonly opportunityId: string;
  readonly assumption: string;
  readonly value: string;
  readonly basis: string;
  readonly source: string;
  readonly customerValidated: boolean;
  readonly impact: string;
  readonly scenarioClassification: string;
}

export interface ExecutiveBriefValidationChecklistItem {
  readonly itemId: string;
  readonly item: string;
  readonly category: string;
  readonly status: 'PENDING' | 'IN_REVIEW' | 'VALIDATED' | 'NOT_APPLICABLE';
  readonly description: string;
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
  readonly valueClassification: ExecutiveBriefValueClassification;
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
  readonly transactionProof?: ExecutiveBriefTransactionEvidence;
}

export interface ExecutiveBriefTotalValuePortfolioProps {
  readonly onSelectOpportunity?: (opportunityId: string) => void;
}
