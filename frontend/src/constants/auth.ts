/**
 * Authentication Constants (Frontend)
 */

export const AUTH_ROLES = {
  USER: 'USER',
  ADMIN: 'ADMIN'
} as const;

export const AUTH_STATUS = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  PENDING: 'PENDING'
} as const;

export const SUBSCRIPTION_TIERS = {
  BRONZE: 'BRONZE',
  SILVER: 'SILVER',
  GOLD: 'GOLD'
} as const;

export const AUTH_STORAGE_KEYS = {
  AUTH_TOKEN: 'procucev_auth_token',
  CURRENT_USER: 'procucev_current_user',
  SIMULATED_TIER: 'procucev_simulated_tier'
} as const;

export const AUTH_API_ENDPOINTS = {
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  ME: '/api/auth/me',
  CHANGE_PASSWORD: '/api/auth/change-password',
  ADMIN_USERS: '/api/admin/users',
  ADMIN_USER_STATUS: (id: string) => `/api/admin/users/${id}/status`,
  ADMIN_USER_TIER: (id: string) => `/api/admin/users/${id}/tier`
} as const;

