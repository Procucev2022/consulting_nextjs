/**
 * Error Constants Module (Frontend)
 *
 * Categorized error constants, error codes, and severity mappings.
 */

export const ERROR_CATEGORIES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  CONFLICT_ERROR: 'CONFLICT_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR'
} as const;

export const ERROR_SEVERITIES = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
} as const;

export const DEFAULT_ERROR_AUTO_DISMISS_MS = 6000;
