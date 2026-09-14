/**
 * Authentication Constants (Backend)
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

export const AUTH_TOKEN_EXPIRY_SECONDS = 86400; // 24 hours

export const AUTH_MESSAGES = {
  REGISTER_SUCCESS: 'User account registered successfully',
  LOGIN_SUCCESS: 'Authentication successful',
  EMAIL_EXISTS: 'An account with this organization email already exists',
  INVALID_CREDENTIALS: 'Invalid organization email or password',
  ACCOUNT_INACTIVE: 'Account is currently suspended or inactive. Please contact support.',
  UNAUTHORIZED: 'Authentication required. Missing or invalid authorization token.',
  FORBIDDEN_ADMIN_ONLY: 'Access denied: Administrator privileges required',
  USER_NOT_FOUND: 'Requested user account not found',
  STATUS_UPDATED: 'User status updated successfully'
} as const;
