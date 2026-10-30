import type {
  ConsolidatedSavingsData,
  ActionPlanItem,
  ActionOwner,
  SavingsOpportunityItem,
  SavingsOpportunityStatus,
  SavingsApiResponse
} from '../types/savings';
import frontendLogger from './logger';
import { validateInput } from './validation';
import {
  updateActionPlanSchema,
  updateOpportunityStatusSchema
} from '../constants/validation';
import { UI_STRINGS } from '../constants/uiStrings';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || '';

async function readSavingsResponse<T>(response: Response, operation: string): Promise<T> {
  const payload = await response.json().catch(() => null) as SavingsApiResponse<T> | null;
  if (!response.ok || !payload || payload.success === false || payload.data == null) {
    const requestId = response.headers?.get('x-request-id') ?? UI_STRINGS.common.notAvailable;
    const message = UI_STRINGS.module4.apiRequestFailed(
      operation, response.status, payload?.message || UI_STRINGS.module4.apiNoDetails, requestId
    );
    frontendLogger.warn('Savings API operation failed', { operation, status: response.status, requestId, message });
    throw new Error(message);
  }
  return payload.data;
}

export const savingsApiClient = {
  async getConsolidatedSavings(assessmentId?: string): Promise<ConsolidatedSavingsData> {
    frontendLogger.debug('Fetching consolidated savings with overlap de-duplication', { assessmentId });
    const query = assessmentId ? `?assessmentId=${encodeURIComponent(assessmentId)}` : '';
    const res = await fetch(`${API_BASE}/api/savings/consolidated${query}`);
    return readSavingsResponse<ConsolidatedSavingsData>(res, UI_STRINGS.module4.apiOperations.load);
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
    return readSavingsResponse<ActionPlanItem>(res, UI_STRINGS.module4.apiOperations.actionPlan);
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
    return readSavingsResponse<SavingsOpportunityItem>(res, UI_STRINGS.module4.apiOperations.opportunity);
  }
};
