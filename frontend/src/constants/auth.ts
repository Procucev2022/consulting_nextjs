export const AUTH_ROLES = {
  USER: 'USER',
  ADMIN: 'ADMIN'
} as const;

export const AUTH_STATUS = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  PENDING: 'PENDING'
} as const;

export const PASSWORD_MINIMUM_LENGTH = 6;

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
  ADMIN_TENANTS: '/api/admin/tenants',
  CREATE_ADMIN: '/api/admin/create-admin',
  ADMIN_USER_STATUS: (id: string) => `/api/admin/users/${id}/status`,
  ADMIN_USER_TIER: (id: string) => `/api/admin/users/${id}/tier`,
  ADMIN_USER_TENANT: (id: string) => `/api/admin/users/${id}/tenant`
} as const;


/** HTTP status that means the stored credential is no longer accepted. */
export const AUTH_HTTP_STATUS = {
  UNAUTHORIZED: 401
} as const;

/** Window event fired when a token-bearing backend request is rejected with 401. */
export const AUTH_SESSION_EXPIRED_EVENT = 'procucev:auth-session-expired';

/** Query parameter that tells the login page to explain why the user was signed out. */
export const AUTH_SESSION_EXPIRED_QUERY = {
  PARAM: 'session',
  VALUE: 'expired'
} as const;

export const AUTH_ROUTES = {
  LOGIN: '/login'
} as const;

/**
 * Requests under these prefixes answer 401 for reasons other than an expired session, such as a wrong password
 * or a rejected one-time code. They never end the session.
 */
export const AUTH_SESSION_EXEMPT_PATH_PREFIXES: readonly string[] = [
  '/api/auth/',
  '/api/upgrade/',
  '/api/telemetry/',
  '/api/admin/create-admin'
];

/** Label recorded when no signed-in administrator identity is available. */
export const AUTH_ADMIN_DISPLAY_FALLBACK = 'Signed-in administrator';
