import {
  CLOUDFLARE_API_PREFIX,
  CLOUDFLARE_CLIENT_ERROR_PATH,
  CLOUDFLARE_HEALTH_PATH,
  CLOUDFLARE_SERVICE_NAME
} from './constants/cloudflare';
import type { CloudflareEnvironment, CloudflareExecutionContext } from './types/cloudflare';
import { handleAuthRoute, handleAdminRoute } from './workerAuth';
import { handleUpgradeRoute } from './services/workerCommercialUpgrade';
import { handleSubscriptionRoute } from './services/workerCommercialSubscriptions';
import { requestHeadersSchema } from './constants/validation';
import logger from './utils/logger';
import { D1_ROUTE_MESSAGES } from './constants/d1';
import {
  jsonResponse, notFoundResponse, RequestBodyTooLargeError, RequestJsonParseError, withCors
} from './workerHttp';
import { handleOrchestrationRoute } from './workerD1Orchestration';
import { handleEvidenceRoute } from './workerD1Evidence';
import { handleExecutiveBriefRoute } from './workerD1ExecutiveBrief';
import { handleClientErrorTelemetry } from './services/clientErrorTelemetry';
import { D1_QUERY_LOG_MESSAGES } from './constants/db';
import { createD1RequestMetrics, instrumentD1Database } from './services/d1QueryTelemetry';
import { authorizeTenantRequest } from './services/workerTenantAccess';
import { handleGraphQLRoute } from './workerGraphql';
import { handleAiRoute } from './workerAiRoutes';
import { handleTaxonomyRoute } from './workerTaxonomyRoutes';
import { handleTenantRoute } from './workerD1TenantRoutes';
import { handleDataRoute } from './workerDataRoutes';

const handleApiRequest = async (request: Request, environment: CloudflareEnvironment): Promise<Response> => {
  const url = new URL(request.url);
  if (url.pathname === CLOUDFLARE_CLIENT_ERROR_PATH) {
    return handleClientErrorTelemetry(request, environment);
  }
  if (url.pathname === `${CLOUDFLARE_API_PREFIX}${CLOUDFLARE_HEALTH_PATH}`) {
    return jsonResponse({ status: 'ok', service: CLOUDFLARE_SERVICE_NAME, database: Boolean(environment.DB) }, 200, request);
  }

  const tenantResponse = await handleTenantRoute(request, environment, url);
  if (tenantResponse) return tenantResponse;
  if (url.pathname.startsWith(`${CLOUDFLARE_API_PREFIX}/auth/`)) {
    const authResult = await handleAuthRoute(request, environment, url);
    return jsonResponse(authResult.body, authResult.status, request);
  }
  if (url.pathname.startsWith(`${CLOUDFLARE_API_PREFIX}/admin`)) {
    const adminResult = await handleAdminRoute(request, environment, url);
    return jsonResponse(adminResult.body, adminResult.status, request);
  }
  if (url.pathname.startsWith(`${CLOUDFLARE_API_PREFIX}/upgrade`)) {
    const commercialResult = await handleUpgradeRoute(request, environment, url);
    if (commercialResult) return jsonResponse(commercialResult.body, commercialResult.status, request);
  }
  if (url.pathname.startsWith(`${CLOUDFLARE_API_PREFIX}/subscription`)) {
    const subscriptionResult = await handleSubscriptionRoute(request, environment, url);
    if (subscriptionResult) return jsonResponse(subscriptionResult.body, subscriptionResult.status, request);
  }
  if (url.pathname.startsWith(`${CLOUDFLARE_API_PREFIX}/ai`)) {
    return handleAiRoute(request, url, environment);
  }
  if (url.pathname.startsWith(`${CLOUDFLARE_API_PREFIX}/taxonomy`)) {
    return handleTaxonomyRoute(request, environment, url);
  }
  if (url.pathname === `${CLOUDFLARE_API_PREFIX}/graphql`) {
    return handleGraphQLRoute(request, environment, url);
  }
  if (url.pathname.startsWith(`${CLOUDFLARE_API_PREFIX}/orchestration`)) {
    return (await handleOrchestrationRoute(request, environment, url)) ?? notFoundResponse(request);
  }
  if (url.pathname.startsWith(`${CLOUDFLARE_API_PREFIX}/evidence`)) {
    return (await handleEvidenceRoute(request, environment, url)) ?? notFoundResponse(request);
  }
  if (url.pathname.startsWith(`${CLOUDFLARE_API_PREFIX}/reports/executive-brief`)) {
    return (await handleExecutiveBriefRoute(request, environment, url)) ?? notFoundResponse(request);
  }
  return handleDataRoute(request, environment, url);
};

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
      return finishResponse(jsonResponse({
        success: false,
        message: 'Validation failed',
        errors: headerValidation.error.issues
      }, 400, request));
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
    return finishResponse(jsonResponse({ success: false, message: 'Endpoint not found.' }, 404, correlatedRequest));
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const invalidJson = err instanceof RequestJsonParseError;
    const bodyTooLarge = err instanceof RequestBodyTooLargeError;
    const status = bodyTooLarge ? 413 : invalidJson ? 400 : errorMsg.includes('Cloudflare D1') ? 503 : 500;
    const context = {
      requestId,
      method: correlatedRequest.method,
      path: new URL(correlatedRequest.url).pathname,
      statusCode: status,
      durationMs: Date.now() - startedAt
    };
    if (bodyTooLarge) logger.warn('Worker rejected an oversized JSON request body', { ...context, maxBytes: err.maxBytes }, err);
    else if (invalidJson) logger.warn('Worker rejected an invalid JSON request body', context, err.underlyingError);
    else logger.error('Worker request failed', context, err);
    const response = invalidJson || bodyTooLarge
      ? { success: false, message: bodyTooLarge ? errorMsg : D1_ROUTE_MESSAGES.validationFailed, errors: [{ path: 'body', message: errorMsg }] }
      : { success: false, message: errorMsg };
    return finishResponse(jsonResponse(response, status, correlatedRequest), invalidJson || bodyTooLarge);
  }
};

export default { fetch };
