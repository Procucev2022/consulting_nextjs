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
  UserStatus
} from '../types';
import frontendLogger from './logger';
import { validateInput } from './validation';
import {
  registerFormSchema,
  loginFormSchema,
  adminUserQuerySchema
} from '../constants/validation';
import { AUTH_STORAGE_KEYS, AUTH_API_ENDPOINTS } from '../constants/auth';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || '';

export const buildAdminUserQueryParams = (query?: AdminUserQuery): URLSearchParams => {
  const params = new URLSearchParams();
  if (!query) return params;

  const validation = validateInput(adminUserQuerySchema, query);
  if (!validation.success || !validation.data) return params;

  const { search, role, status } = validation.data;
  if (search) params.set('search', search);
  if (role && role !== 'ALL') params.set('role', role);
  if (status && status !== 'ALL') params.set('status', status);

  return params;
};

async function parseResponseJson<T>(res: Response, fallbackError: string): Promise<T> {
  let json: Record<string, unknown> | null = null;
  if (typeof res.text === 'function') {
    const text = await res.text();
    try {
      json = JSON.parse(text) as Record<string, unknown>;
    } catch {
      if (!res.ok) {
        throw new Error(`Server error (${res.status}): Please ensure backend is running on port 5000`);
      }
      throw new Error('Invalid response received from server');
    }
  } else if (typeof res.json === 'function') {
    try {
      json = (await res.json()) as Record<string, unknown>;
    } catch {
      if (!res.ok) {
        throw new Error(`Server error (${res.status}): Please ensure backend is running on port 5000`);
      }
      throw new Error('Invalid response received from server');
    }
  }

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

    const json = await parseResponseJson<AuthSessionResponse>(res, 'Registration failed');

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

    const res = await fetch(`${API_BASE}${AUTH_API_ENDPOINTS.ME}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    return await parseResponseJson<{ success: boolean; user: UserProfile }>(res, 'Failed to fetch user profile');
  },

  // Change Password
  async changePassword(data: { currentPassword: string; newPassword: string }, token?: string): Promise<{ success: boolean; message: string }> {
    frontendLogger.info('Changing user account password');
    const authToken = token || authApiClient.getStoredToken();
    if (!authToken) {
      throw new Error('Authentication required: please log in again');
    }

    const res = await fetch(`${API_BASE}${AUTH_API_ENDPOINTS.CHANGE_PASSWORD}`, {
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

    const res = await fetch(`${API_BASE}${AUTH_API_ENDPOINTS.ADMIN_USERS}${queryString}`, { headers });
    return await parseResponseJson<AdminUsersResponse>(res, 'Failed to load user directory');
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

    return await parseResponseJson<{ success: boolean; user: UserProfile }>(res, 'Failed to update user status');
  }
};
