import { apiDataEnvelopeResponseSchema } from '../constants/validation';
import { UI_STRINGS } from '../constants/uiStrings';
import type { TenantApiResponse } from '../types';
import frontendLogger from './logger';

export const readTenantApiResponse = async (
  response: Response,
  method: string,
  operation: string,
  tenantId?: string
): Promise<TenantApiResponse> => {
  const requestId = response.headers.get('x-request-id') || UI_STRINGS.common.notAvailable;
  try {
    return await response.json() as TenantApiResponse;
  } catch (error: unknown) {
    frontendLogger.error('Tenant API response could not be parsed', {
      method,
      path: '/api/tenant',
      statusCode: response.status,
      tenantId,
      operation,
      requestId
    }, error);
    throw new Error(UI_STRINGS.module4.apiInvalidResponse(operation, response.status, requestId));
  }
};

export const readDashboardApiData = async <T>(
  response: Response,
  path: string,
  operation: string
): Promise<T> => {
  const requestId = response.headers.get('x-request-id') || UI_STRINGS.common.notAvailable;
  let payload: unknown;
  try {
    payload = await response.json();
  } catch (error: unknown) {
    frontendLogger.error('Dashboard API response could not be parsed', {
      method: 'GET', path, statusCode: response.status, requestId, operation
    }, error);
    throw new Error(UI_STRINGS.databaseData.apiInvalidResponse(operation, response.status, requestId));
  }

  if (!response.ok) {
    const detail = payload !== null && typeof payload === 'object' && 'message' in payload &&
      typeof payload.message === 'string' ? payload.message : UI_STRINGS.databaseData.apiNoDetails;
    frontendLogger.error('Dashboard API request failed', {
      method: 'GET', path, statusCode: response.status, requestId, operation, detail
    }, new Error(detail));
    throw new Error(UI_STRINGS.databaseData.apiRequestFailed(operation, response.status, detail, requestId));
  }

  const parsed = apiDataEnvelopeResponseSchema.safeParse(payload);
  if (!parsed.success) {
    frontendLogger.error('Dashboard API response envelope was invalid', {
      method: 'GET', path, statusCode: response.status, requestId, operation,
      issues: parsed.error.issues
    });
    throw new Error(UI_STRINGS.databaseData.apiInvalidResponse(operation, response.status, requestId));
  }
  return parsed.data.data as T;
};
