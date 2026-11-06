import { apiFetch } from './apiFetch';
import { BACKEND_API_BASE_URL, UI_STRINGS, module2LogisticsPackagingQuerySchema } from '../constants';
import type { Module2LogisticsPackagingResponse } from '../types/module2Logistics';
import { logger } from './logger';
import { authApiClient } from './authApi';

const parseLogisticsEnvelope = (payload: unknown): Module2LogisticsPackagingResponse | null => {
  if (typeof payload !== 'object' || payload === null) return null;
  const envelope = payload as { success?: unknown; data?: unknown };
  if (envelope.success !== true || typeof envelope.data !== 'object' || envelope.data === null) return null;
  const data = envelope.data as Partial<Module2LogisticsPackagingResponse>;
  if (data.success !== true || !Array.isArray(data.candidates) || typeof data.count !== 'number') return null;
  return data as Module2LogisticsPackagingResponse;
};

export const loadModule2LogisticsCandidates = async (
  assessmentId: string
): Promise<Module2LogisticsPackagingResponse> => {
  const parsed = module2LogisticsPackagingQuerySchema.safeParse({ assessmentId });
  if (!parsed.success) throw new Error(UI_STRINGS.module2Logistics.assessmentMissing);
  try {
    const query = new URLSearchParams({ assessmentId: parsed.data.assessmentId });
    const token = authApiClient.getStoredToken();
    const response = await apiFetch(`${BACKEND_API_BASE_URL}/api/module2/logistics-packaging?${query.toString()}`, {
      headers: token ? { Authorization: 'Bearer ' + token } : {}
    });
    if (!response.ok) throw new Error(UI_STRINGS.module2Logistics.loadFailed(response.status));
    const responseData = parseLogisticsEnvelope(await response.json());
    if (responseData === null) throw new Error(UI_STRINGS.module2Logistics.requestFailed);
    return responseData;
  } catch (error) {
    logger.error('Failed to load Module 2 logistics and packaging data from D1', { assessmentId: parsed.data.assessmentId }, error);
    throw error;
  }
};
