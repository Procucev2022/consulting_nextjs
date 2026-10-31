import {
  BACKEND_API_BASE_URL,
  UI_STRINGS,
  VENDOR_CONSOLIDATION_UI_CONFIG,
  apiBulkUpdateModule2MaterialMappingsPayloadSchema
} from '../constants';
import type { ApiBulkUpdateModule2MaterialMappingsPayload } from '../types/validation';
import type { MaterialMappingEntry } from '../types/module2MaterialMapping';
import { authApiClient } from './authApi';
import { frontendLogger } from './logger';

const savedMappings = (payload: unknown): MaterialMappingEntry[] | null => {
  const response = asRecord(payload);
  const responseData = asRecord(response?.data);
  if (responseData?.success !== true || !Array.isArray(responseData.mappings)) return null;
  return responseData.mappings.every(isSavedMapping) ? responseData.mappings : null;
};

const asRecord = (value: unknown): Record<string, unknown> | null => (
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
);

const isSavedMapping = (value: unknown): value is MaterialMappingEntry => {
  const mapping = asRecord(value);
  return mapping !== null &&
    typeof mapping.sourceMaterialId === 'string' &&
    typeof mapping.assignedUnspscCode === 'string' &&
    typeof mapping.assignedUnspscTitle === 'string' &&
    typeof mapping.reviewStatus === 'string' &&
    typeof mapping.confidenceScore === 'number';
};

const postMappingBatch = async (
  payload: ApiBulkUpdateModule2MaterialMappingsPayload
): Promise<MaterialMappingEntry[]> => {
  const token = authApiClient.getStoredToken();
  if (!token) {
    frontendLogger.warn('Module 2 mapping update requires an authenticated D1 session', {
      assessmentId: payload.assessmentId,
      mappingCount: payload.mappings.length,
      requestId: null
    });
    throw new Error(UI_STRINGS.toasts.module2MappingFailed(UI_STRINGS.errors.auth.sessionExpired));
  }

  let requestId: string | null = null;
  try {
    const endpoint = `${BACKEND_API_BASE_URL}${VENDOR_CONSOLIDATION_UI_CONFIG.MAPPING_BULK_UPDATE_ENDPOINT}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    requestId = response.headers.get('x-request-id');
    if (!response.ok) throw new Error(UI_STRINGS.toasts.mappingServerRejected(response.status));

    const mappings = savedMappings(await response.json());
    if (mappings?.length !== payload.mappings.length) {
      throw new Error(UI_STRINGS.databaseData.invalidData);
    }
    return mappings;
  } catch (error) {
    const reason = error instanceof Error ? error.message : UI_STRINGS.errors.server.databaseUnavailable;
    frontendLogger.error('Failed to persist Module 2 taxonomy mappings to D1', {
      assessmentId: payload.assessmentId,
      mappingCount: payload.mappings.length,
      requestId
    }, error instanceof Error ? error : undefined);
    throw new Error(UI_STRINGS.toasts.module2MappingFailed(reason));
  }
};

export const saveModule2MaterialMappings = async (
  assessmentId: string,
  mappings: ApiBulkUpdateModule2MaterialMappingsPayload['mappings']
): Promise<MaterialMappingEntry[]> => {
  if (mappings.length === 0) return [];
  const saved: MaterialMappingEntry[] = [];
  for (let index = 0; index < mappings.length; index += VENDOR_CONSOLIDATION_UI_CONFIG.MAPPING_BATCH_LIMIT) {
    const batch = mappings.slice(index, index + VENDOR_CONSOLIDATION_UI_CONFIG.MAPPING_BATCH_LIMIT);
    const parsed = apiBulkUpdateModule2MaterialMappingsPayloadSchema.safeParse({ assessmentId, mappings: batch });
    if (!parsed.success) {
      throw new Error(UI_STRINGS.toasts.module2MappingFailed(UI_STRINGS.toasts.invalidMappingPayload));
    }
    saved.push(...await postMappingBatch(parsed.data));
  }
  return saved;
};
