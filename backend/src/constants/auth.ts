/**
 * Authentication Constants (Backend)
 */

import type { AuthRateLimitScope } from '../types/auth';

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

export const AUTH_TOKEN_EXPIRY_SECONDS = 86400; // 24 hours
export const AUTH_BOOTSTRAP_TOKEN_HEADER = 'x-admin-bootstrap-token';
export const AUTH_LEGACY_PASSWORD_PATTERN = /^[0-9a-f]{32}:[0-9a-f]{128}$/iu;
export const AUTH_HEX_BYTE_PATTERN = /[0-9a-f]{2}/giu;

export const AUTH_MESSAGES = {
  REGISTER_SUCCESS: 'User account registered successfully',
  REGISTER_PENDING: 'Your account request was received. An administrator must assign your organization before you can sign in.',
  TENANT_ASSIGNMENT_PENDING: 'Your account is awaiting administrator tenant assignment. Contact your administrator before signing in.',
  LOGIN_SUCCESS: 'Authentication successful',
  EMAIL_EXISTS: 'An account with this organization email already exists',
  bootstrapAccountExists: 'An account with this email already exists, so the first-administrator setup did not change it. Sign in as an administrator to update that account.',
  bootstrapTokenInvalid: 'The bootstrap token is missing or incorrect. Send the X-Admin-Bootstrap-Token value from this environment\'s deployment settings and retry.',
  bootstrapDisabled: 'Unauthenticated administrator provisioning is disabled because AUTH_BOOTSTRAP_TOKEN is not configured for this environment. Sign in with an existing administrator account or configure the bootstrap token.',
  INVALID_CREDENTIALS: 'Invalid organization email or password',
  ACCOUNT_INACTIVE: 'Account is currently suspended or inactive. Please contact support.',
  UNAUTHORIZED: 'Authentication required. Missing or invalid authorization token.',
  FORBIDDEN_ADMIN_ONLY: 'Access denied: Administrator privileges required',
  USER_NOT_FOUND: 'Requested user account not found',
  USER_UPDATE_CONFLICT: 'The user account changed during this update. Refresh the user registry and retry the requested change.',
  STATUS_UPDATED: 'User status updated successfully',
  PASSWORD_CHANGED: 'Password updated successfully',
  CURRENT_PASSWORD_INCORRECT: 'Current password is incorrect',
  TIER_UPDATED: 'User subscription tier updated successfully',
  TENANT_SCOPE_INVALID: 'Tenant scope fields must contain one valid tenant identifier.',
  TENANT_SCOPE_REQUIRED: 'Select an organization to access tenant data. Ask an administrator if your organization is missing.',
  TENANT_SCOPE_FORBIDDEN: 'The requested tenant is outside this account assignment.',
  TENANT_UNAVAILABLE: 'The assigned tenant is unavailable. Ask an administrator to review the tenant assignment.',
  TENANT_ASSIGNMENT_COMPLETE: 'Tenant assigned and account activated.',
  TENANT_REQUIRED_FOR_ACTIVATION: 'A tenant assignment is required before activating this user. Assign the account to one active organization, then retry.',
  TENANT_ASSIGNMENT_ACCOUNT_ONLY: 'Only user and administrator accounts can be assigned to a tenant.',
  TENANT_NOT_FOUND: 'The selected tenant does not exist. Refresh the tenant list and choose an existing organization.'
} as const;

export const AUTH_SQL = {
  USER_BY_NORMALIZED_EMAIL: 'SELECT id FROM User WHERE lower(email) = ?1',
  REGISTER_IF_EMAIL_AVAILABLE: `
    INSERT INTO User (id, name, mobile_number, email, company_name, company_address, password_hash,
      role, status, subscription_tier, tenant_id, created_at, updated_at)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)
    ON CONFLICT DO NOTHING
  `
} as const;

/** Subscription tier every self-registered account starts on. Upgrades go through the commercial workflow. */
export const AUTH_REGISTRATION_SUBSCRIPTION_TIER = 'BRONZE' as const;

/** Length of the rate-limit window. The Cloudflare binding in wrangler.jsonc allows the same count per window. */
export const AUTH_RATE_LIMIT_WINDOW_SECONDS = 60;

/** Key prefix for each request family. The network address is appended to make each key unique to a client. */
export const AUTH_RATE_LIMIT_NAMESPACE: Readonly<Record<AuthRateLimitScope, string>> = {
  login: 'auth-login',
  register: 'auth-register',
  upgradeRequest: 'upgrade-request'
};

export const AUTH_RATE_LIMIT_MESSAGES: Readonly<Record<AuthRateLimitScope, string>> = {
  login: 'Too many sign-in attempts from this network. Wait one minute, then try again. If the problem continues, contact your administrator.',
  register: 'Too many registration requests from this network. Wait one minute, then try again.',
  upgradeRequest: 'Too many upgrade requests from this network. Wait one minute, then try again.'
};

export const AUTH_RATE_LIMIT_LOG_MESSAGES = {
  limited: 'Authentication request rate limit reached',
  limiterMissing: 'Authentication rate limiter is not bound; the request was not limited',
  limiterFailed: 'Authentication rate limiter failed; the request was not limited'
} as const;
