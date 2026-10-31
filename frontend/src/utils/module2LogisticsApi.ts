import { BACKEND_API_BASE_URL, UI_STRINGS, module2LogisticsPackagingQuerySchema } from '../constants';
import type { Module2LogisticsPackagingResponse } from '../types/module2Logistics';
import { logger } from './logger';

export const loadModule2LogisticsCandidates = async (
  assessmentId: string
): Promise<Module2LogisticsPackagingResponse> => {
  const parsed = module2LogisticsPackagingQuerySchema.safeParse({ assessmentId });
  if (!parsed.success) throw new Error(UI_STRINGS.module2Logistics.assessmentMissing);
  try {
    const query = new URLSearchParams({ assessmentId: parsed.data.assessmentId });
    const response = await fetch(`${BACKEND_API_BASE_URL}/api/module2/logistics-packaging?${query.toString()}`);
    if (!response.ok) throw new Error(UI_STRINGS.module2Logistics.loadFailed(response.status));
    const payload: unknown = await response.json();
    if (!payload || typeof payload !== 'object') throw new Error(UI_STRINGS.module2Logistics.requestFailed);
    const responseData = payload as Partial<Module2LogisticsPackagingResponse>;
    if (responseData.success !== true || !Array.isArray(responseData.candidates) || typeof responseData.count !== 'number') {
      throw new Error(UI_STRINGS.module2Logistics.requestFailed);
    }
    return responseData as Module2LogisticsPackagingResponse;
  } catch (error) {
    logger.error('Failed to load Module 2 logistics and packaging data from D1', { assessmentId: parsed.data.assessmentId }, error);
    throw error;
  }
};
