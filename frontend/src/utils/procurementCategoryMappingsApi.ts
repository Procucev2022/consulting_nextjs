import { BACKEND_API_BASE_URL } from '../constants/app';
import { PROCUREMENT_CATEGORY_MAPPINGS_API_PATH } from '../constants/procurementCategoryMapping';
import { procurementCategoryMappingsResponseSchema } from '../constants/validation';
import { UI_STRINGS } from '../constants/uiStrings';
import type { ProcurementCategoryMappingsResponse } from '../types/validation';
import frontendLogger from './logger';
import { setProcurementCategoryMappings } from './procurementCategoryResolver';

export async function getProcurementCategoryMappings(): Promise<ProcurementCategoryMappingsResponse['data']> {
  frontendLogger.debug('Fetching procurement category mappings from D1');
  const response = await fetch(`${BACKEND_API_BASE_URL}${PROCUREMENT_CATEGORY_MAPPINGS_API_PATH}`);
  const requestId = response.headers.get('x-request-id');
  if (!response.ok) {
    const message = UI_STRINGS.databaseData.procurementMappingsLoadFailed;
    frontendLogger.error('D1 procurement category mapping request failed', {
      status: response.status,
      requestId,
      message
    });
    throw new Error(message);
  }

  const parsed = procurementCategoryMappingsResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    const message = UI_STRINGS.databaseData.procurementMappingsLoadFailed;
    frontendLogger.error('D1 procurement category mapping response was invalid', {
      requestId,
      issues: parsed.error.issues,
      message
    });
    throw new Error(message);
  }

  setProcurementCategoryMappings(parsed.data.data.mappings);
  frontendLogger.info('Loaded procurement category mappings from D1', {
    mappingCount: Object.keys(parsed.data.data.mappings).length,
    categoryCount: parsed.data.data.categories.length,
    requestId
  });
  return parsed.data.data;
}
