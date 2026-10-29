/**
 * Executive Brief service-layer types: summary card definitions, reconciliation results, and rendered artifacts.
 */
import type { FinancialConsistencyCheck } from './executiveBriefExportTypes';

export type ExecutiveBriefSummaryMetric =
  | 'totalSpend'
  | 'addressableSpend'
  | 'grossOpportunity'
  | 'approvedSavings'
  | 'realizedSavings'
  | 'opportunityCount'
  | 'transactionCount'
  | 'baselineSuppliers'
  | 'baselineMaterialGroups';

export interface ExecutiveBriefSummaryCardDefinition {
  id: string;
  label: string;
  metric: ExecutiveBriefSummaryMetric;
  unit?: string;
  module: string;
  evidenceRef: string;
}

export interface ExecutiveBriefFinancialReconciliation {
  consistency: FinancialConsistencyCheck;
  waterfallValid: boolean;
  netCompositionValid: boolean;
  isReconciled: boolean;
}

export type ExecutiveBriefFormat = 'pdf' | 'pptx' | 'json' | 'markdown';

export interface ExecutiveBriefRenderedArtifact {
  format: ExecutiveBriefFormat;
  filename: string;
  downloadFilename: string;
  contentType: string;
  body: Uint8Array;
}

export interface ExecutiveBriefStoredArtifact {
  key: string;
  filename: string;
  contentType: string;
  bytes: number;
}
