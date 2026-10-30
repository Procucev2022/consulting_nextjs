/**
 * Dedicated Admin Management API Service (Frontend)
 */

import type { CreateAdminDetailsPayload, CreateAdminResponse } from '../types';
import frontendLogger from './logger';
import { validateInput } from './validation';
import { createAdminDetailsSchema } from '../constants/adminValidation';
import { AUTH_API_ENDPOINTS, DEFAULT_ADMIN_DETAILS } from '../constants/auth';
import { getApiBaseUrl } from './apiBase';
import { authApiClient } from './authApi';

function buildFullAdminPayload(payload?: Partial<CreateAdminDetailsPayload>): CreateAdminDetailsPayload {
  return Object.assign({}, DEFAULT_ADMIN_DETAILS, payload, {
    role: 'ADMIN' as const,
    subscription_tier: 'GOLD' as const
  });
}

export const adminAuthApiClient = {
  /**
   * Provision or update enterprise administrator credentials and details
   */
  async createAdminUser(
    payload?: Partial<CreateAdminDetailsPayload>,
    token?: string
  ): Promise<CreateAdminResponse> {
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

    const res = await fetch(`${getApiBaseUrl()}${AUTH_API_ENDPOINTS.CREATE_ADMIN}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(validation.data)
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => null);
      const errorMsg = errorJson?.message ?? `Failed to provision administrator (HTTP ${res.status})`;
      throw new Error(errorMsg);
    }

    const json = await res.json();
    return json as CreateAdminResponse;
  }
};

