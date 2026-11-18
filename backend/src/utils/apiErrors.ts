/**
 * API error envelope helpers (Backend)
 */
import { API_ERROR_CATEGORY, API_HTTP_STATUS } from '../constants/errors';
import type { ApiErrorBody, ApiErrorBodyOptions, ApiErrorCategory, ApiErrorCode } from '../types/errors';

/**
 * Maps an HTTP status to the error category shown to clients and used in log searches.
 */
export const resolveApiErrorCategory = (status: number): ApiErrorCategory => {
  if (status === API_HTTP_STATUS.UNAUTHORIZED || status === API_HTTP_STATUS.FORBIDDEN) return API_ERROR_CATEGORY.AUTH;
  if (status === API_HTTP_STATUS.NOT_FOUND) return API_ERROR_CATEGORY.NOT_FOUND;
  if (status === API_HTTP_STATUS.CONFLICT) return API_ERROR_CATEGORY.CONFLICT;
  if (status === API_HTTP_STATUS.TOO_MANY_REQUESTS) return API_ERROR_CATEGORY.RATE_LIMIT;
  if (status >= API_HTTP_STATUS.INTERNAL_SERVER_ERROR) return API_ERROR_CATEGORY.SERVER;
  return API_ERROR_CATEGORY.VALIDATION;
};

/**
 * Builds the JSON body for a failed request. The core fields are written last so caller-supplied extra fields
 * cannot overwrite success, message or the classification.
 */
/**
 * An error whose message is written for the client. The Worker returns its status, code and message as they are.
 * Every other exception is answered with a generic message, and its text is kept in the logs only.
 */
export class ClientFacingError extends Error {
  readonly status: number;
  readonly errorCode: ApiErrorCode;

  constructor(status: number, errorCode: ApiErrorCode, message: string) {
    super(message);
    this.name = 'ClientFacingError';
    this.status = status;
    this.errorCode = errorCode;
  }
}

export const buildApiErrorBody = (
  status: number,
  errorCode: ApiErrorCode,
  message: string,
  options: ApiErrorBodyOptions = {}
): ApiErrorBody => ({
  ...options.extra,
  success: false,
  message,
  errorCode,
  errorCategory: resolveApiErrorCategory(status),
  ...(options.requestId ? { requestId: options.requestId } : {})
});
