import { apiFetch } from './apiFetch';
/**
 * Dedicated Admin Management API Service (Frontend)
 */

import type { CreateAdminDetailsPayload, CreateAdminResponse } from '../types';
import { UI_STRINGS } from '../constants/uiStrings';
import frontendLogger from './logger';
import { validateInput } from './validation';
import { createAdminDetailsSchema } from '../constants/adminValidation';
import { AUTH_API_ENDPOINTS, AUTH_ROLES } from '../constants/auth';
import { getApiBaseUrl } from './apiBase';
import { authApiClient } from './authApi';

function buildFullAdminPayload(payload: Partial<CreateAdminDetailsPayload>): Partial<CreateAdminDetailsPayload> {
  return Object.assign({}, payload, {
    role: AUTH_ROLES.ADMIN,
    subscription_tier: payload.subscription_tier ?? ('GOLD' as const)
  });
}

export const adminAuthApiClient = {
  /**
   * Provision or update enterprise administrator credentials and details
   */
  async createAdminUser(
    payload: Partial<CreateAdminDetailsPayload>,
    token?: string
  ): Promise<CreateAdminResponse> {
    const storedUser = authApiClient.getStoredUser();
    if (storedUser && storedUser.role !== AUTH_ROLES.ADMIN) {
      frontendLogger.warn('Rejected non-administrator admin creation request', {
        userId: storedUser.id,
        role: storedUser.role
      });
      throw new Error(UI_STRINGS.admin.accessDeniedMessage);
    }

    const fullPayload = buildFullAdminPayload(payload);

    frontendLogger.info('Provisioning administrator details via admin API', { email: fullPayload.email });
    const validation = validateInput(createAdminDetailsSchema, fullPayload);
    if (!validation.success) {
      throw new Error(`Validation failed: ${JSON.stringify(validation.errors)}`);
    }

    const authToken = token ?? authApiClient.getStoredToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    const res = await apiFetch(`${getApiBaseUrl()}${AUTH_API_ENDPOINTS.CREATE_ADMIN}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(validation.data)
    });

    if (!res.ok) {
      const errorJson = await res.json().catch((error: unknown) => {
        frontendLogger.warn(
          'Administrator provisioning error body could not be read as JSON', { status: res.status }, error
        );
        return null;
      });
      const errorMsg = errorJson?.message ?? UI_STRINGS.admin.provisioningFailureWithStatus(res.status);
      frontendLogger.error('Administrator provisioning request was rejected', { status: res.status });
      throw new Error(errorMsg);
    }

    const json = await res.json();
    return json as CreateAdminResponse;
  }
};

