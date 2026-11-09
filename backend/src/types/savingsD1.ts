import type { UpdateActionPlanInput } from './validation';

export type UpdateActionPlanFields = Omit<UpdateActionPlanInput, 'actionId'>;

export interface SavingsActionPlanWriteContext {
  actionId: string;
  tenantId: string;
  requestId?: string;
}

export interface D1SavingsOpportunityRow {
  opp_id: string;
  category: string;
  title: string | null;
  current_spend: number | null;
  current_spend_inr_cr: number | null;
  target_savings_pct: number | null;
  est_savings: number | null;
  est_savings_inr_cr: number | null;
  lever: string | null;
  recommended_action: string | null;
  push_to_module: string | null;
  status: string | null;
  contract_leak_type: string | null;
}

export interface D1SavingsActionPlanRow {
  id: string;
  opp_id: string;
  title: string;
  lever: string;
  category: string;
  est_savings_inr_cr: number;
  owner: string;
  quarter: string;
  status: string;
  created_at: string;
  updated_at: string;
  target_date: string | null;
  priority: string | null;
  comments: string | null;
}

export interface D1SavingsAssessmentRow {
  total_spend_cr: number | null;
  addressable_spend_cr: number | null;
  overlap_deductions_cr: number | null;
  proven_opportunity_cr: number | null;
}
