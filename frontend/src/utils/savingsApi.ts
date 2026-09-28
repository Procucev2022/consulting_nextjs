import type {
  ConsolidatedSavingsData,
  ActionPlanItem,
  ActionOwner,
  SavingsOpportunityItem,
  SavingsOpportunityStatus
} from '../types/savings';
import frontendLogger from './logger';
import { validateInput } from './validation';
import {
  updateActionPlanSchema,
  updateOpportunityStatusSchema
} from '../constants/validation';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || '';

export const savingsApiClient = {
  async getConsolidatedSavings(): Promise<ConsolidatedSavingsData> {
    frontendLogger.debug('Fetching consolidated savings with overlap de-duplication');
    const res = await fetch(`${API_BASE}/api/savings/consolidated`);
    const json = await res.json();
    return json.data;
  },

  async updateActionPlan(
    actionId: string,
    updates: {
      status?: ActionPlanItem['status'];
      owner?: ActionOwner;
      priority?: 'HIGH' | 'MEDIUM' | 'LOW';
      comments?: string;
    }
  ): Promise<ActionPlanItem> {
    frontendLogger.info('Updating action plan item', { actionId, updates });
    const payload = { actionId, ...updates };
    const validation = validateInput(updateActionPlanSchema, payload);
    if (!validation.success) {
      throw new Error(`Invalid action plan update: ${JSON.stringify(validation.errors)}`);
    }

    const res = await fetch(`${API_BASE}/api/savings/action-plan/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validation.data)
    });
    const json = await res.json();
    return json.data;
  },

  async updateSavingsOpportunityStatus(
    opp_id: string,
    status: SavingsOpportunityStatus
  ): Promise<SavingsOpportunityItem> {
    frontendLogger.info('Updating opportunity status', { opp_id, status });
    const payload = { opp_id, status };
    const validation = validateInput(updateOpportunityStatusSchema, payload);
    if (!validation.success) {
      throw new Error(`Invalid opportunity status update: ${JSON.stringify(validation.errors)}`);
    }

    const res = await fetch(`${API_BASE}/api/savings/opportunity/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validation.data)
    });
    const json = await res.json();
    return json.data;
  }
};
