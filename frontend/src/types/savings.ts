/**
 * Savings Engine & De-Duplication Types (Master Product Spec - Prompt 100)
 */

export type SavingsSourceModule = 'MODULE_2_STRATEGIC' | 'MODULE_3_PCBI';

export type SavingsSourceEngine =
  | 'PCBI_PRICE'
  | 'VENDOR_CONSOLIDATION'
  | 'PO_CONSOLIDATION'
  | 'E_AUCTION'
  | 'RATE_CONTRACT'
  | 'SPECIFICATION_RATIONALIZATION'
  | 'DEMAND_CONSOLIDATION'
  | 'NEW_VENDOR_DEVELOPMENT'
  | 'ALTERNATE_MATERIAL'
  | 'OTHER_STRATEGIC';

export type SavingsOpportunityStatus =
  | 'IDENTIFIED'
  | 'UNDER_VALIDATION'
  | 'VALIDATED'
  | 'APPROVED'
  | 'IMPLEMENTING'
  | 'REALIZED'
  | 'REJECTED'
  | 'DEFERRED';

export type ActionOwner =
  | 'Procurement'
  | 'SCM'
  | 'Plant'
  | 'Finance'
  | 'Technical'
  | 'Management'
  | 'Other';

export interface SavingsOpportunityItem {
  opportunity_id: string;
  source_module: SavingsSourceModule;
  source_engine: SavingsSourceEngine;
  category: string;
  item: string;
  vendor: string;
  plant: string;
  spend_inr: number;
  spend_inr_cr: number;
  potential_savings_inr: number;
  potential_savings_inr_cr: number;
  overlap_id?: string;
  is_overlapping: boolean;
  net_savings_inr: number;
  net_savings_inr_cr: number;
  status: SavingsOpportunityStatus;
  owner: ActionOwner;
  department?: string;
  timeline: string;
  validation_notes?: string;
  created_at: string;
}

export interface OpportunityOverlapGroup {
  overlap_id: string;
  item: string;
  vendor?: string;
  primary_opportunity_id: string;
  primary_engine: SavingsSourceEngine;
  primary_savings_inr: number;
  overlapping_opportunities: Array<{
    opportunity_id: string;
    source_engine: SavingsSourceEngine;
    gross_savings_inr: number;
    deduplicated_amount_inr: number;
    net_savings_inr: number;
  }>;
  total_gross_savings_inr: number;
  total_net_savings_inr: number;
  total_deduplicated_inr: number;
}

export interface SavingsWaterfallMetrics {
  total_spend_inr_cr: number;
  addressable_spend_inr_cr: number;
  identified_opportunities_count: number;
  gross_potential_savings_inr_cr: number;
  deduplicated_overlap_inr_cr: number;
  net_potential_savings_inr_cr: number;
  validated_savings_inr_cr: number;
  approved_savings_inr_cr: number;
  realized_savings_inr_cr: number;
}

export interface ActionPlanItem {
  id: string;
  opportunity_id: string;
  action: string;
  owner: ActionOwner;
  department: string;
  target_date: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  expected_value_inr: number;
  expected_value_inr_cr: number;
  status: 'Open' | 'In Progress' | 'Completed' | 'Deferred';
  comments?: string;
  created_at: string;
  updated_at: string;
}

export interface ConsolidatedSavingsData {
  opportunities: SavingsOpportunityItem[];
  overlaps: OpportunityOverlapGroup[];
  waterfallMetrics: SavingsWaterfallMetrics;
  actionPlans: ActionPlanItem[];
  strategicSummary?: Record<string, unknown>;
}
