/**
 * Executive Brief Presentation Types & Contract (Frontend)
 * Strictly adheres to Prompt 280 (CFO/CEO Sales-Ready Edition - aiCEV by Procucev)
 */

export type ValueClassificationType =
  | 'DIRECT_SAVINGS'
  | 'STRATEGIC_VALUE'
  | 'PROCESS_PRODUCTIVITY'
  | 'COST_AVOIDANCE'
  | 'VALIDATED_SAVINGS'
  | 'REALIZED_SAVINGS';

export type MonetizationStatusType =
  | 'MONETIZED_DIRECT'
  | 'STRATEGIC_MARKET'
  | 'PENDING_VALIDATION'
  | 'NOT_MONETIZED';

export interface ExecutiveBriefPresentationValueClassification {
  readonly type: ValueClassificationType;
  readonly label: string;
  readonly valueFormatted: string;
  readonly numericCr: number | null;
  readonly isDirectSaving: boolean;
  readonly monetizationStatus: MonetizationStatusType;
  readonly description: string;
}

export type PresentationValueClassification = ExecutiveBriefPresentationValueClassification;

export interface PresentationKpiCard {
  readonly id: string;
  readonly title: string;
  readonly value: string;
  readonly subtitle: string;
  readonly classification: ValueClassificationType;
  readonly accentColor: string;
  readonly isHeroCard?: boolean;
}

export interface ExecutiveBriefPresentationContract {
  readonly totalCustomerSpendCr: number;
  readonly totalCustomerSpendInr: number;
  readonly addressableSpendCr: number;
  readonly addressableSpendInr: number;
  readonly analysisPeriod: string;
  readonly analysisPeriodMonths: number;
  readonly grossOpportunityCr: number;
  readonly grossOpportunityInr: number;
  readonly overlapDeductionsCr: number;
  readonly overlapDeductionsInr: number;
  readonly exclusionsCr: number;
  readonly exclusionsInr: number;
  readonly netDefensiblePipelineCr: number;
  readonly netDefensiblePipelineInr: number;
  readonly netDirectSavingsCr: number;
  readonly netDirectSavingsInr: number;
  readonly strategicMarketValueCr: number;
  readonly strategicMarketValueInr: number;
  readonly processProductivityPct: number;
  readonly lowValuePOsCount: number;
  readonly directProcessSavingCr: number;
  readonly spendDeRiskedCr: number;
  readonly dualSourceProgramsCount: number;
  readonly validatedSavingsCr: number;
  readonly validatedSavingsInr: number;
  readonly realizedSavingsCr: number;
  readonly realizedSavingsInr: number;
  readonly baselineTransactions: number;
  readonly baselineSuppliers: number;
  readonly baselineMaterialGroups: number;
  readonly baselinePlants: number;
  readonly baselineTotalPOs: number;
  readonly classifications: readonly ExecutiveBriefPresentationValueClassification[];
}
