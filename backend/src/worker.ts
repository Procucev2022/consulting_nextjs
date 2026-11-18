import {
  CLOUDFLARE_API_PREFIX,
  CLOUDFLARE_HEALTH_PATH
} from './constants/cloudflare';
import type { CloudflareEnvironment, CloudflareExecutionContext, CloudflareScheduledController } from './types/cloudflare';
import { requestHeadersSchema } from './constants/validation';
import logger from './utils/logger';
import { D1_ROUTE_MESSAGES } from './constants/d1';
import {
  apiErrorResponse, jsonResponse, notFoundResponse, RequestBodyTooLargeError, RequestJsonParseError, withCors
} from './workerHttp';
import { API_ERROR_CODE, API_ERROR_MESSAGES, API_HTTP_STATUS } from './constants/errors';
import { ClientFacingError } from './utils/apiErrors';
import { D1_QUERY_LOG_MESSAGES } from './constants/db';
import { createD1RequestMetrics, instrumentD1Database } from './services/d1QueryTelemetry';
import { authorizeTenantRequest } from './services/workerTenantAccess';
import { handleApiRequest } from './workerApiRoutes';
import { processR2ObjectCleanupOutbox } from './services/r2ObjectCleanupOutbox';
import { R2_CLEANUP_ACTIONS, R2_CLEANUP_LOG_MESSAGES } from './constants';

export const fetch = async (
  request: Request,
  environment: CloudflareEnvironment,
  executionContext: CloudflareExecutionContext
): Promise<Response> => {
  const startedAt = Date.now();
  let requestId: string = crypto.randomUUID();
  let correlatedRequest = request;
  const d1Metrics = createD1RequestMetrics();
  const finishResponse = (response: Response, logHttpError = true): Response => {
    const headers = new Headers(response.headers);
    headers.set('x-request-id', requestId);
    if (logHttpError && response.status >= 400) {
      const context = {
        requestId,
        method: correlatedRequest.method,
        path: new URL(correlatedRequest.url).pathname,
        statusCode: response.status,
        durationMs: Date.now() - startedAt
      };
      if (response.status >= 500) logger.error('Worker request returned server error', context);
      else logger.warn('Worker request returned client error', context);
    }
    if (d1Metrics.totalQueries > 0) logger.debug(D1_QUERY_LOG_MESSAGES.requestSummary, {
      requestId,
      totalQueries: d1Metrics.totalQueries,
      failedQueries: d1Metrics.failedQueries,
      slowQueries: d1Metrics.slowQueries,
      cacheHits: d1Metrics.cacheHits,
      cacheMisses: d1Metrics.cacheMisses,
      cacheHitRatio: d1Metrics.cacheHits + d1Metrics.cacheMisses > 0
        ? d1Metrics.cacheHits / (d1Metrics.cacheHits + d1Metrics.cacheMisses)
        : 0,
      totalDurationMs: d1Metrics.totalDurationMs,
      averageDurationMs: d1Metrics.totalDurationMs / d1Metrics.totalQueries,
      totalRowsRead: d1Metrics.totalRowsRead,
      totalRowsWritten: d1Metrics.totalRowsWritten
    });
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  };

  try {
    const headerValidation = requestHeadersSchema.safeParse({
      'x-request-id': request.headers.get('x-request-id') ?? undefined
    });
    if (!headerValidation.success) {
      logger.warn('Rejected invalid request correlation header', {
        requestId,
        method: request.method,
        path: new URL(request.url).pathname,
        errors: headerValidation.error.issues
      });
      return finishResponse(apiErrorResponse(request, API_HTTP_STATUS.BAD_REQUEST,
        API_ERROR_CODE.INVALID_REQUEST_CORRELATION, D1_ROUTE_MESSAGES.validationFailed, {
          requestId,
          extra: { errors: headerValidation.error.issues }
        }));
    }

    requestId = headerValidation.data['x-request-id'] || requestId;
    const headers = new Headers(request.headers);
    headers.set('x-request-id', requestId);
    correlatedRequest = new Request(request, { headers });
    const url = new URL(correlatedRequest.url);

    if (correlatedRequest.method === 'OPTIONS') {
      return finishResponse(withCors(new Response(null, { status: 204 }), correlatedRequest));
    }

    if (url.pathname === '/') {
      return finishResponse(jsonResponse({
        message: 'Consulting & Procurement Intelligence Platform - Cloudflare Worker API',
        status: 'online',
        version: '1.0.1-deployment-test',
        docs: `${CLOUDFLARE_API_PREFIX}${CLOUDFLARE_HEALTH_PATH}`
      }, 200, correlatedRequest));
    }

    if (url.pathname.startsWith(CLOUDFLARE_API_PREFIX)) {
      const requestEnvironment = environment.DB
        ? { ...environment, DB: instrumentD1Database(environment.DB, requestId, d1Metrics) }
        : environment;
      const tenantAuthorization = await authorizeTenantRequest(correlatedRequest, requestEnvironment);
      if (tenantAuthorization.status) {
        return finishResponse(jsonResponse({
          success: false,
          message: tenantAuthorization.message || 'Authentication is required before accessing this API.'
        }, tenantAuthorization.status, correlatedRequest));
      }
      return finishResponse(await handleApiRequest(
        tenantAuthorization.request || correlatedRequest,
        tenantAuthorization.environment || requestEnvironment
      ));
    }

    executionContext.passThroughOnException();
    return finishResponse(notFoundResponse(correlatedRequest));
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const invalidJson = err instanceof RequestJsonParseError;
    const bodyTooLarge = err instanceof RequestBodyTooLargeError;
    const clientFacing = err instanceof ClientFacingError ? err : undefined;
    const status = bodyTooLarge
      ? API_HTTP_STATUS.PAYLOAD_TOO_LARGE
      : invalidJson
        ? API_HTTP_STATUS.BAD_REQUEST
        : clientFacing
          ? clientFacing.status
          : errorMsg.includes('Cloudflare D1')
            ? API_HTTP_STATUS.SERVICE_UNAVAILABLE
            : API_HTTP_STATUS.INTERNAL_SERVER_ERROR;
    const context = {
      requestId,
      method: correlatedRequest.method,
      path: new URL(correlatedRequest.url).pathname,
      statusCode: status,
      durationMs: Date.now() - startedAt
    };
    if (bodyTooLarge) logger.warn('Worker rejected an oversized JSON request body', { ...context, maxBytes: err.maxBytes }, err);
    else if (invalidJson) logger.warn('Worker rejected an invalid JSON request body', context, err.underlyingError);
    else if (clientFacing && clientFacing.status < API_HTTP_STATUS.INTERNAL_SERVER_ERROR) {
      logger.warn('Worker rejected a request that cannot be completed', { ...context, errorCode: clientFacing.errorCode }, err);
    } else logger.error('Worker request failed', context, err);
    // Internal exception text stays in the logs above. Clients receive a fixed message and the request ID.
    if (invalidJson || bodyTooLarge) {
      return finishResponse(apiErrorResponse(correlatedRequest, status,
        bodyTooLarge ? API_ERROR_CODE.REQUEST_BODY_TOO_LARGE : API_ERROR_CODE.INVALID_JSON_BODY,
        bodyTooLarge ? errorMsg : D1_ROUTE_MESSAGES.validationFailed,
        { requestId, extra: { errors: [{ path: 'body', message: errorMsg }] } }), true);
    }
    if (clientFacing) {
      return finishResponse(apiErrorResponse(correlatedRequest, status, clientFacing.errorCode, clientFacing.message, { requestId }), false);
    }
    const databaseUnavailable = status === API_HTTP_STATUS.SERVICE_UNAVAILABLE;
    return finishResponse(apiErrorResponse(correlatedRequest, status,
      databaseUnavailable ? API_ERROR_CODE.DATABASE_UNAVAILABLE : API_ERROR_CODE.INTERNAL_ERROR,
      databaseUnavailable ? API_ERROR_MESSAGES.databaseUnavailable(requestId) : API_ERROR_MESSAGES.internalError(requestId),
      { requestId }), false);
  }
};

export const scheduled = async (
  controller: CloudflareScheduledController,
  environment: CloudflareEnvironment
): Promise<void> => {
  const requestId = crypto.randomUUID();
  logger.info(R2_CLEANUP_LOG_MESSAGES.cronStarted, {
    action: R2_CLEANUP_ACTIONS.cron,
    requestId,
    cron: controller.cron,
    scheduledTime: controller.scheduledTime
  });
  try {
    await processR2ObjectCleanupOutbox(environment, { requestId });
  } catch (error: unknown) {
    logger.error(R2_CLEANUP_LOG_MESSAGES.queueReadFailed, {
      action: R2_CLEANUP_ACTIONS.cron,
      requestId,
      cron: controller.cron,
      scheduledTime: controller.scheduledTime
    }, error);
    throw error;
  }
};

export default { fetch, scheduled };
