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
  UserStatus,
  SubscriptionTier
} from '../types';
import frontendLogger from './logger';
import { validateInput } from './validation';
import {
  registerFormSchema,
  loginFormSchema,
  adminUserQuerySchema,
  adminUpdateUserTierSchema
} from '../constants/validation';
import { AUTH_STORAGE_KEYS, AUTH_API_ENDPOINTS } from '../constants/auth';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || '';

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
    } catch {
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

    const res = await fetch(`${API_BASE}${AUTH_API_ENDPOINTS.REGISTER}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validation.data)
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Registration failed');
    }

    if (json.token && json.user) {
      authApiClient.setStoredSession(json.token, json.user);
    }
    return json;
  },

  // Login
  async login(data: LoginFormData): Promise<AuthSessionResponse> {
    frontendLogger.info('Logging in enterprise user', { email: data.email });
    const validation = validateInput(loginFormSchema, data);
    if (!validation.success) {
      throw new Error(`Validation failed: ${JSON.stringify(validation.errors)}`);
    }

    const res = await fetch(`${API_BASE}${AUTH_API_ENDPOINTS.LOGIN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validation.data)
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Authentication failed');
    }

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

    const res = await fetch(`${API_BASE}${AUTH_API_ENDPOINTS.ME}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Failed to fetch user profile');
    }
    return json;
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

    const res = await fetch(`${API_BASE}${AUTH_API_ENDPOINTS.ADMIN_USERS}${queryString}`, { headers });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Failed to load user directory');
    }
    return json;
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
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status })
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Failed to update user status');
    }
    return json;
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
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(validation.data)
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Failed to update user subscription tier');
    }
    return json;
  }
};

