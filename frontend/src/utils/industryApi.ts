import type { IndustryCatalogResponse } from '../types/industry';
import { BACKEND_API_BASE_URL, UI_STRINGS } from '../constants';
import { logger } from './logger';

export const loadIndustryCatalog = async (): Promise<IndustryCatalogResponse> => {
  try {
    const response = await fetch(`${BACKEND_API_BASE_URL}/api/industry-profiles`);
    if (!response.ok) throw new Error(UI_STRINGS.module2.industryContext.profileLoadFailed);
    const payload: unknown = await response.json();
    if (!payload || typeof payload !== 'object') throw new Error(UI_STRINGS.module2.industryContext.profileLoadFailed);
    const catalog = payload as Partial<IndustryCatalogResponse>;
    if (catalog.success !== true || !Array.isArray(catalog.profiles) || !Array.isArray(catalog.presets)) {
      throw new Error(UI_STRINGS.module2.industryContext.profileLoadFailed);
    }
    return catalog as IndustryCatalogResponse;
  } catch (error) {
    logger.error('Failed to load industry catalog from D1', {}, error);
    throw error;
  }
};
