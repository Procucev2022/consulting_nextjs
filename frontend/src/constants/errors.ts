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
export const CLIENT_ERROR_REPORT_ENDPOINT = '/api/telemetry/client-error';
export const CLIENT_ERROR_REPORT_DEDUPE_MS = 30000;
export const CLIENT_ERROR_REPORT_MAX_ERROR_NAME_LENGTH = 80;
export const CLIENT_ERROR_REPORT_MAX_MESSAGE_LENGTH = 240;
export const CLIENT_ERROR_REPORT_MAX_STACK_LENGTH = 1800;
export const CLIENT_ERROR_REPORT_MAX_ROUTE_LENGTH = 180;
export const CLIENT_ERROR_REPORT_MAX_CLIENT_REQUEST_ID_LENGTH = 128;
export const CLIENT_ERROR_REPORT_MAX_TRACKED_KEYS = 100;
export const CLIENT_ERROR_REQUEST_ID_PREFIX = 'client';
export const CLIENT_ERROR_REQUEST_ID_SUFFIX_LENGTH = 8;
export const CLIENT_ERROR_REPORT_PATH_PATTERNS = {
  uuid: /\/[0-9a-f]{8}-[0-9a-f-]{27,}/gi,
  numericId: /\/\d{5,}(?=\/|$)/g,
  emailSegment: /\/[^/]{1,100}@[^/]{1,100}(?=\/|$)/g
} as const;
export const CLIENT_ERROR_REPORT_SENSITIVE_TEXT_PATTERNS = [
  { pattern: /\bBearer\s+[^\s,;]+/gi, replacement: 'Bearer [REDACTED]' },
  { pattern: /\b(password|token|secret|authorization|api[_-]?key)\s*[:=]\s*[^\s,;]+/gi, replacement: '$1=[REDACTED]' },
  { pattern: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, replacement: '[REDACTED_TOKEN]' },
  { pattern: /[\w.+-]+@[\w.-]+\.[A-Z]{2,}/gi, replacement: '[REDACTED_EMAIL]' },
  { pattern: /\b\+?\d[\d ().-]{7,}\d\b/g, replacement: '[REDACTED_NUMBER]' },
  { pattern: /([?&][^=\s]+)=([^&\s)]+)/g, replacement: '$1=[REDACTED]' }
] as const;
export const CLIENT_ERROR_REPORT_URL_PATTERN = /https?:\/\/[^\s)]+/gi;
export const CLIENT_ERROR_REPORT_LINEBREAK_PATTERN = /[\r\n\t]+/g;
