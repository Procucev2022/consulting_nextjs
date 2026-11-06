import { apiFetch } from './apiFetch';
import type { IndustryCatalogResponse } from '../types/industry';
import { BACKEND_API_BASE_URL, UI_STRINGS } from '../constants';
import { logger } from './logger';

const parseIndustryCatalogEnvelope = (payload: unknown): IndustryCatalogResponse | null => {
  if (typeof payload !== 'object' || payload === null) return null;
  const envelope = payload as { success?: unknown; data?: unknown };
  if (envelope.success !== true || typeof envelope.data !== 'object' || envelope.data === null) return null;
  const catalog = envelope.data as Partial<IndustryCatalogResponse>;
  if (catalog.success !== true || !Array.isArray(catalog.profiles) || !Array.isArray(catalog.presets)) return null;
  return catalog as IndustryCatalogResponse;
};

export const loadIndustryCatalog = async (): Promise<IndustryCatalogResponse> => {
  try {
    const response = await apiFetch(`${BACKEND_API_BASE_URL}/api/industry-profiles`);
    if (!response.ok) throw new Error(UI_STRINGS.module2.industryContext.profileLoadFailed);
    const catalog = parseIndustryCatalogEnvelope(await response.json());
    if (catalog === null) throw new Error(UI_STRINGS.module2.industryContext.profileLoadFailed);
    return catalog;
  } catch (error) {
    logger.error('Failed to load industry catalog from D1', {}, error);
    throw error;
  }
};
