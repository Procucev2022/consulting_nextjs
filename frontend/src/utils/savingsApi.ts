import type {
  ConsolidatedSavingsData,
  ActionPlanItem,
  ActionOwner,
  SavingsOpportunityItem,
  SavingsOpportunityStatus,
  SavingsApiResponse
} from '../types/savings';
import type { SavingsOpportunity } from '../types';
import frontendLogger from './logger';
import { validateInput } from './validation';
import {
  apiDeployOpportunityPayloadSchema,
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

const readOpportunityHandoffBody = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    if (!response.ok) throw new Error(UI_STRINGS.databaseData.opportunityHandoffFailed(response.status));
    throw new Error(UI_STRINGS.databaseData.invalidOpportunityHandoff);
  }
};

const readOpportunityHandoff = (
  response: Response,
  json: unknown,
  opportunityId: string
): SavingsOpportunity => {
  const payload = typeof json === 'object' && json !== null
    ? json as { data?: unknown; message?: unknown }
    : {};
  if (!response.ok) {
    const message = typeof payload.message === 'string' && payload.message.trim()
      ? payload.message
      : UI_STRINGS.databaseData.opportunityHandoffFailed(response.status);
    throw new Error(message);
  }
  if (typeof payload.data !== 'object' || payload.data === null ||
      (payload.data as { opp_id?: unknown }).opp_id !== opportunityId) {
    throw new Error(UI_STRINGS.databaseData.invalidOpportunityHandoff);
  }
  return payload.data as SavingsOpportunity;
};

export const savingsApiClient = {
  async deployOpportunity(opp_id: string, targetModule: 'proCPX' | 'DPS NXT'): Promise<SavingsOpportunity> {
    frontendLogger.info('Deploying opportunity to module', { opp_id, targetModule });
    const validation = validateInput(apiDeployOpportunityPayloadSchema, { opp_id, targetModule });
    if (!validation.success) {
      throw new Error(`Invalid deploy payload: ${JSON.stringify(validation.errors)}`);
    }
    const response = await fetch(`${API_BASE}/api/savings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validation.data)
    });
    return readOpportunityHandoff(response, await readOpportunityHandoffBody(response), opp_id);
  },

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
