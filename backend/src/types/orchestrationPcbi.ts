import type { PCBIExclusionReason, PCBIResolutionAction } from './analysisOrchestration';

export interface PCBIGapSourceRow {
  category_key: string;
  item_category: string;
  relevant_classification: string;
  spend_cr: number;
  transaction_count: number;
  supplier_count: number;
  plant_count: number;
  action: PCBIResolutionAction | null;
  target_pcbi_series: string | null;
  benchmark_source: string | null;
  quality_rating: string | null;
  exclusion_reason: PCBIExclusionReason | null;
  exclusion_notes: string | null;
  research_notes: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
}

export interface PCBISeriesRow {
  pcbi_id: string;
  benchmark_source: string | null;
  quality_rating: string | null;
}

export interface PCBIGapCoverageInput {
  hasEvidence: boolean;
  totalCategories: number;
  resolvedCategories: number;
  totalItems: number;
  resolvedItems: number;
  excludedItems: number;
}
