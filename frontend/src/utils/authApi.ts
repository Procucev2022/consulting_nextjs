import { apiFetch } from './apiFetch';
/**
 * Dedicated Authentication & Admin API Service (Frontend)
 */

import type {
  UserProfile,
  AuthSessionResponse,
  RegisterFormData,
  LoginFormData,
  AdminUserQuery,
  AdminUsersResponse,
  AdminTenantsResponse,
  UserStatus,
  SubscriptionTier
} from '../types';
import frontendLogger from './logger';
import { validateInput } from './validation';
import {
  registerFormSchema,
  loginFormSchema,
  adminUserQuerySchema,
  adminUpdateUserTierSchema,
  adminAssignUserTenantSchema,
  adminTenantsResponseSchema
} from '../constants/validation';
import { AUTH_STORAGE_KEYS, AUTH_API_ENDPOINTS } from '../constants/auth';
import { getApiBaseUrl } from './apiBase';
import { UI_STRINGS } from '../constants/uiStrings';
import { API_REQUEST_ID_HEADER } from '../constants/app';

const setFilterParam = (params: URLSearchParams, key: string, value?: string): void => {
  if (value && value !== 'ALL') {
    params.set(key, value);
  }
};

export const buildAdminUserQueryParams = (query?: AdminUserQuery): URLSearchParams => {
  const params = new URLSearchParams();
  if (!query) return params;

  const validation = validateInput(adminUserQuerySchema, query);
  if (!validation.success || !validation.data) return params;

  const { search, role, status, tier } = validation.data;
  if (search) params.set('search', search);
  setFilterParam(params, 'role', role);
  setFilterParam(params, 'status', status);
  setFilterParam(params, 'tier', tier);

  return params;
};

const parseAuthResponseBody = async <T>(res: Response, operation: string): Promise<T | null> => {
  try {
    if (typeof res.text === 'function') return JSON.parse(await res.text()) as T;
    if (typeof res.json === 'function') return await res.json() as T;
    return null;
  } catch (error: unknown) {
    frontendLogger.error('Authentication API response body could not be parsed', {
      action: 'auth.response.parse',
      operation,
      statusCode: res.status,
      requestId: res.headers?.get(API_REQUEST_ID_HEADER) || undefined
    }, error);
    if (!res.ok) {
      throw new Error(`Server error (${res.status}): Please ensure backend API server is running`);
    }
    throw new Error('Invalid response received from server');
  }
};

async function parseResponseJson<T>(res: Response, fallbackError: string): Promise<T> {
  const json = await parseAuthResponseBody<Record<string, unknown>>(res, fallbackError);

  if (!res.ok) {
    const errorMsg = typeof json?.message === 'string' ? json.message : fallbackError;
    throw new Error(errorMsg);
  }

  return json as T;
}

export const authApiClient = {
  // Session Storage Helpers
  getStoredToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(AUTH_STORAGE_KEYS.AUTH_TOKEN);
  },

  getStoredUser(): UserProfile | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(AUTH_STORAGE_KEYS.CURRENT_USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (error: unknown) {
      frontendLogger.warn('Cached authentication profile was malformed and ignored', {
        action: 'auth.session.user.parse',
        storageKey: AUTH_STORAGE_KEYS.CURRENT_USER
      }, error);
      return null;
    }
  },

  setStoredSession(token: string, user: UserProfile): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(AUTH_STORAGE_KEYS.AUTH_TOKEN, token);
    localStorage.setItem(AUTH_STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  },

  clearStoredSession(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(AUTH_STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(AUTH_STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(AUTH_STORAGE_KEYS.SIMULATED_TIER);
    try {
      sessionStorage.removeItem('procucev_uploaded_dataset');
      sessionStorage.removeItem('procucev_autofill_active_doc');
    } catch (error: unknown) {
      frontendLogger.warn('Optional session data could not be cleared; authentication session cleanup continued', {
        action: 'auth.session.optional-storage.clear'
      }, error);
    }
  },

  getSimulatedTier(): SubscriptionTier | null {
    if (typeof window === 'undefined') return null;
    const val = localStorage.getItem(AUTH_STORAGE_KEYS.SIMULATED_TIER);
    if (val === 'BRONZE' || val === 'SILVER' || val === 'GOLD') {
      return val;
    }
    return null;
  },

  setSimulatedTier(tier: SubscriptionTier | null): void {
    if (typeof window === 'undefined') return;
    if (tier) {
      localStorage.setItem(AUTH_STORAGE_KEYS.SIMULATED_TIER, tier);
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEYS.SIMULATED_TIER);
    }
  },

  // Register
  async register(data: RegisterFormData): Promise<AuthSessionResponse> {
    frontendLogger.info('Registering new enterprise user', { email: data.email, company: data.company_name });
    const validation = validateInput(registerFormSchema, data);
    if (!validation.success) {
      throw new Error(`Validation failed: ${JSON.stringify(validation.errors)}`);
    }

    const res = await apiFetch(`${getApiBaseUrl()}${AUTH_API_ENDPOINTS.REGISTER}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validation.data)
    });

    const json = await parseResponseJson<AuthSessionResponse>(res, 'Registration failed');

    if (json.token && json.user) {
      authApiClient.setStoredSession(json.token, json.user);
    }
    return json;
  },

  // Login
  async login(
    dataOrEmail: LoginFormData | string,
    passwordArg?: string
  ): Promise<AuthSessionResponse> {
    const data: LoginFormData =
      typeof dataOrEmail === 'string'
        ? { email: dataOrEmail, password: passwordArg || '' }
        : dataOrEmail;

    frontendLogger.info('Logging in enterprise user', { email: data.email });
    const validation = validateInput(loginFormSchema, data);
    if (!validation.success) {
      throw new Error(`Validation failed: ${JSON.stringify(validation.errors)}`);
    }

    const res = await apiFetch(`${getApiBaseUrl()}${AUTH_API_ENDPOINTS.LOGIN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validation.data)
    });

    const json = await parseResponseJson<AuthSessionResponse>(res, 'Authentication failed');

    if (json.token && json.user) {
      authApiClient.setStoredSession(json.token, json.user);
    }
    return json;
  },

  // Get Current Profile
  async getMe(token?: string): Promise<{ success: boolean; user: UserProfile }> {
    const authToken = token || authApiClient.getStoredToken();
    if (!authToken) {
      throw new Error('No authentication token found');
    }

    const res = await apiFetch(`${getApiBaseUrl()}${AUTH_API_ENDPOINTS.ME}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    return await parseResponseJson<{ success: boolean; user: UserProfile }>(res, 'Failed to fetch user profile');
  },

  // Change Password
  async changePassword(
    data: { currentPassword: string; newPassword: string },
    token?: string
  ): Promise<{ success: boolean; message: string }> {
    frontendLogger.info('Changing user account password');
    const authToken = token || authApiClient.getStoredToken();
    if (!authToken) {
      throw new Error('Authentication required: please log in again');
    }

    const res = await apiFetch(`${getApiBaseUrl()}${AUTH_API_ENDPOINTS.CHANGE_PASSWORD}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify(data)
    });

    return await parseResponseJson<{ success: boolean; message: string }>(res, 'Failed to update password');
  },

  // Admin: List All Users
  async getAdminUsers(query?: AdminUserQuery, token?: string): Promise<AdminUsersResponse> {
    frontendLogger.info('Fetching admin registered users directory');
    const authToken = token || authApiClient.getStoredToken();
    const queryParams = buildAdminUserQueryParams(query);
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

    const headers: Record<string, string> = {};
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    const res = await apiFetch(`${getApiBaseUrl()}${AUTH_API_ENDPOINTS.ADMIN_USERS}${queryString}`, { headers });
    return await parseResponseJson<AdminUsersResponse>(res, 'Failed to load user directory');
  },

  async getAdminTenants(token?: string): Promise<AdminTenantsResponse> {
    frontendLogger.info('Fetching tenant choices for administrator provisioning');
    const authToken = token || authApiClient.getStoredToken();
    const headers: Record<string, string> = {};
    if (authToken) headers.Authorization = `Bearer ${authToken}`;
    const res = await apiFetch(`${getApiBaseUrl()}${AUTH_API_ENDPOINTS.ADMIN_TENANTS}`, { headers });
    const json = await parseResponseJson<Record<string, unknown>>(res, 'Failed to load tenant directory');
    const parsed = adminTenantsResponseSchema.safeParse(json);
    if (!parsed.success) {
      frontendLogger.error('Administrator tenant directory response failed schema validation', { errors: parsed.error.issues });
      throw new Error(UI_STRINGS.admin.tenantListInvalid);
    }
    return parsed.data;
  },

  async assignAdminUserTenant(
    id: string,
    tenantId: string,
    token?: string
  ): Promise<{ success: boolean; user: UserProfile }> {
    frontendLogger.info('Assigning enterprise account to a tenant', { id, tenantId });
    const validation = validateInput(adminAssignUserTenantSchema, { tenant_id: tenantId });
    if (!validation.success) throw new Error(`Tenant assignment failed validation: ${JSON.stringify(validation.errors)}`);
    const authToken = token || authApiClient.getStoredToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authToken) headers.Authorization = `Bearer ${authToken}`;
    const endpoint = AUTH_API_ENDPOINTS.ADMIN_USER_TENANT(encodeURIComponent(id));
    const res = await apiFetch(`${getApiBaseUrl()}${endpoint}`, {
      method: 'PATCH', headers, body: JSON.stringify(validation.data)
    });
    return await parseResponseJson<{ success: boolean; user: UserProfile }>(res, 'Failed to assign tenant');
  },

  // Admin: Update User Status
  async updateAdminUserStatus(
    id: string,
    status: UserStatus,
    token?: string
  ): Promise<{ success: boolean; user: UserProfile }> {
    frontendLogger.info('Updating user status via admin portal', { id, status });
    const authToken = token || authApiClient.getStoredToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    const endpoint = AUTH_API_ENDPOINTS.ADMIN_USER_STATUS(id);
    const res = await apiFetch(`${getApiBaseUrl()}${endpoint}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status })
    });

    return await parseResponseJson<{ success: boolean; user: UserProfile }>(res, 'Failed to update user status');
  },

  // Admin: Update User Subscription Tier
  async updateAdminUserTier(
    id: string,
    tier: SubscriptionTier,
    token?: string
  ): Promise<{ success: boolean; user: UserProfile }> {
    frontendLogger.info('Updating user tier via admin portal', { id, tier });
    const validation = validateInput(adminUpdateUserTierSchema, { tier });
    if (!validation.success) {
      throw new Error(`Validation failed: ${JSON.stringify(validation.errors)}`);
    }

    const authToken = token || authApiClient.getStoredToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    const endpoint = AUTH_API_ENDPOINTS.ADMIN_USER_TIER(id);
    const res = await apiFetch(`${getApiBaseUrl()}${endpoint}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(validation.data)
    });

    return await parseResponseJson<{ success: boolean; user: UserProfile }>(res, 'Failed to update user subscription tier');
  }
};

