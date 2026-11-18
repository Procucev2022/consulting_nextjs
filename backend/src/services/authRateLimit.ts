import {
  AUTH_RATE_LIMIT_LOG_MESSAGES, AUTH_RATE_LIMIT_MESSAGES, AUTH_RATE_LIMIT_NAMESPACE, AUTH_RATE_LIMIT_WINDOW_SECONDS
} from '../constants/auth';
import { API_ERROR_CODE, API_HTTP_STATUS } from '../constants/errors';
import type { AuthRateLimitScope } from '../types/auth';
import type { AuthRouteResult, CloudflareEnvironment } from '../types/cloudflare';
import { buildApiErrorBody } from '../utils/apiErrors';
import logger from '../utils/logger';

/**
 * Limits sign-in, registration and upgrade requests per network address. A missing or failing limiter is logged and
 * the request proceeds, so a limiter outage cannot lock every user out of sign-in.
 */
export const enforceAuthRateLimit = async (
  request: Request,
  environment: CloudflareEnvironment,
  scope: AuthRateLimitScope
): Promise<AuthRouteResult | undefined> => {
  const requestId = request.headers.get('x-request-id') || undefined;
  const limiter = environment.AUTH_RATE_LIMITER;
  if (!limiter || typeof limiter.limit !== 'function') {
    logger.warn(AUTH_RATE_LIMIT_LOG_MESSAGES.limiterMissing, { requestId, action: scope });
    return undefined;
  }
  const clientAddress = request.headers.get('cf-connecting-ip') || 'unknown';
  try {
    const decision = await limiter.limit({ key: `${AUTH_RATE_LIMIT_NAMESPACE[scope]}:${clientAddress}` });
    if (decision.success) return undefined;
  } catch (error: unknown) {
    logger.warn(AUTH_RATE_LIMIT_LOG_MESSAGES.limiterFailed, { requestId, action: scope }, error);
    return undefined;
  }
  logger.warn(AUTH_RATE_LIMIT_LOG_MESSAGES.limited, {
    requestId, action: scope, statusCode: API_HTTP_STATUS.TOO_MANY_REQUESTS,
    retryAfterSeconds: AUTH_RATE_LIMIT_WINDOW_SECONDS
  });
  const errorBody = buildApiErrorBody(API_HTTP_STATUS.TOO_MANY_REQUESTS, API_ERROR_CODE.RATE_LIMITED,
    AUTH_RATE_LIMIT_MESSAGES[scope], { requestId, extra: { retryAfterSeconds: AUTH_RATE_LIMIT_WINDOW_SECONDS } });
  return { status: API_HTTP_STATUS.TOO_MANY_REQUESTS, body: { ...errorBody } };
};
