/**
 * API error constants (Backend)
 *
 * Every error response carries a stable errorCode and an errorCategory, so clients and log searches can
 * classify a failure without parsing free-text messages. Categories match the orchestration and evidence
 * modules, which already return errorCategory.
 */

export const API_ERROR_CATEGORY = {
  VALIDATION: 'VALIDATION_ERROR',
  AUTH: 'AUTH_ERROR',
  NOT_FOUND: 'NOT_FOUND_ERROR',
  CONFLICT: 'CONFLICT_ERROR',
  RATE_LIMIT: 'RATE_LIMIT_ERROR',
  SERVER: 'SERVER_ERROR'
} as const;

export const API_HTTP_STATUS = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const;

export const API_ERROR_CODE = {
  INVALID_REQUEST_CORRELATION: 'INVALID_REQUEST_CORRELATION',
  INVALID_JSON_BODY: 'INVALID_JSON_BODY',
  REQUEST_BODY_TOO_LARGE: 'REQUEST_BODY_TOO_LARGE',
  ROUTE_NOT_FOUND: 'ROUTE_NOT_FOUND',
  DATABASE_UNAVAILABLE: 'DATABASE_UNAVAILABLE',
  DATASET_NOT_FOUND: 'DATASET_NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
} as const;

export const API_ERROR_MESSAGES = {
  routeNotFound: 'No API route matches this path and HTTP method. Check the endpoint and method, then retry.',
  databaseUnavailable: (requestId: string): string =>
    `The database is temporarily unavailable. Retry in a few seconds. If the problem continues, contact support with request ${requestId}.`,
  internalError: (requestId: string): string =>
    `An unexpected server error occurred. Retry the action. If the problem continues, contact support with request ${requestId}.`
} as const;
