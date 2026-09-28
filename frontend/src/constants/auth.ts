import type { DevTempCredential } from '../types/auth';

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

export const DEV_TEMP_CREDENTIALS: DevTempCredential[] = [
  {
    email: 'sriman@procucev.com',
    password: 'sriman@123',
    role: 'ADMIN',
    label: 'Sriman (Admin)',
    badge: 'Admin',
    name: 'Sriman Admin',
    company: 'Procucev Enterprise Solutions Pvt Ltd'
  },
  {
    email: 'admin@procucev.com',
    password: 'Admin@123456',
    role: 'ADMIN',
    label: 'System Administrator',
    badge: 'Admin',
    name: 'System Administrator',
    company: 'aiCEV Procucev Enterprise Inc.'
  },
  {
    email: 'buyer@procucev.com',
    password: 'User@123456',
    role: 'USER',
    label: 'Enterprise Buyer',
    badge: 'Buyer',
    name: 'Enterprise Buyer',
    company: 'Apex Industrial Dynamics Ltd.'
  }
];

