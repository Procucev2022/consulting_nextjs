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
  CREATE_ADMIN: '/api/admin/create-admin',
  ADMIN_USER_STATUS: (id: string) => `/api/admin/users/${id}/status`,
  ADMIN_USER_TIER: (id: string) => `/api/admin/users/${id}/tier`
} as const;

export const DEFAULT_ADMIN_DETAILS = {
  name: 'System Administrator',
  email: 'admin@procucev.com',
  password: 'Procucev@123',
  mobile_number: '+91 98765 43210',
  company_name: 'aiCEV Procucev Enterprise Inc.',
  company_address: 'Floor 14, Brigade Gateway, Malleshwaram, Bengaluru, Karnataka 560055, India',
  role: 'ADMIN',
  subscription_tier: 'GOLD'
} as const;

export const DEV_TEMP_CREDENTIALS: DevTempCredential[] =
  process.env.NODE_ENV === 'production'
    ? []
    : [
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

