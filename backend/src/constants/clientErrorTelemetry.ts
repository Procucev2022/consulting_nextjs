export const CLIENT_ERROR_REPORT_MAX_BYTES = 4096;
export const CLIENT_ERROR_REPORT_MAX_ERROR_NAME_LENGTH = 80;
export const CLIENT_ERROR_REPORT_MAX_MESSAGE_LENGTH = 240;
export const CLIENT_ERROR_REPORT_MAX_STACK_LENGTH = 1800;
export const CLIENT_ERROR_REPORT_MAX_ROUTE_LENGTH = 180;
export const CLIENT_ERROR_REPORT_MAX_CLIENT_REQUEST_ID_LENGTH = 128;
export const CLIENT_ERROR_LOCAL_FRONTEND_ORIGINS = [
  'http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'
] as const;
export const CLIENT_ERROR_TEXT_PATTERNS = [
  { pattern: /\bBearer\s+[^\s,;]+/gi, replacement: 'Bearer [REDACTED]' },
  { pattern: /\b(password|token|secret|authorization|api[_-]?key)\s*[:=]\s*[^\s,;]+/gi, replacement: '$1=[REDACTED]' },
  { pattern: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, replacement: '[REDACTED_TOKEN]' },
  { pattern: /[\w.+-]+@[\w.-]+\.[A-Z]{2,}/gi, replacement: '[REDACTED_EMAIL]' },
  { pattern: /\b\+?\d[\d ().-]{7,}\d\b/g, replacement: '[REDACTED_NUMBER]' },
  { pattern: /([?&][^=\s]+)=([^&\s)]+)/g, replacement: '$1=[REDACTED]' }
] as const;
export const CLIENT_ERROR_URL_PATTERN = /https?:\/\/[^\s)]+/gi;
export const CLIENT_ERROR_UUID_PATH_PATTERN = /\/[0-9a-f]{8}-[0-9a-f-]{27,}/gi;
export const CLIENT_ERROR_NUMERIC_PATH_PATTERN = /\/\d{5,}(?=\/|$)/g;
export const CLIENT_ERROR_TIMESTAMP_WHITESPACE_PATTERN = /[\r\n\t]+/g;
export const CLIENT_ERROR_TELEMETRY_HTTP_STATUS = {
  ACCEPTED: 202,
  BAD_REQUEST: 400,
  FORBIDDEN: 403,
  METHOD_NOT_ALLOWED: 405,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415
} as const;
export const CLIENT_ERROR_TELEMETRY_MESSAGES = {
  postRequired: 'Client error reports require POST.',
  originRejected: 'Client error reports are accepted only from configured application origins.',
  jsonRequired: 'Client error reports require an application/json body.',
  invalidJson: 'Client error report JSON is invalid.',
  invalidFields: 'Client error report fields are invalid.',
  bodyTooLarge: (maxBytes: number) => `Client error report exceeds the ${maxBytes}-byte limit.`
} as const;
