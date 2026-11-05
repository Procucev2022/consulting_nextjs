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
import {
  getCanonicalModule1Data,
  handleModule2Route,
  handlePcbiRoute,
  handleSavingsRoute,
  handleAssessmentRoute,
  handleCryptoRoute,
  getTenantFromD1,
  getTaxonomyFromD1,
  getProcurementCategoryMappingsFromD1,
  requireD1Binding
} from './workerD1';
import {
  d1DatasetScopeSchema, requestHeadersSchema, taxonomyQuerySchema
} from './constants/validation';
import logger from './utils/logger';
import { D1_ROUTE_MESSAGES } from './constants/d1';
import {
  apiData, jsonResponse, notFoundResponse, readJson, RequestBodyTooLargeError, RequestJsonParseError, withCors
} from './workerHttp';
import { handleOrchestrationRoute } from './workerD1Orchestration';
import { handleEvidenceRoute } from './workerD1Evidence';
import { handleExecutiveBriefRoute } from './workerD1ExecutiveBrief';
import { handleIndustryProfilesRoute } from './workerD1IndustryProfiles';
import { handleModule2LogisticsPackagingRoute } from './workerD1Module2Logistics';
import { handleClientErrorTelemetry } from './services/clientErrorTelemetry';
import { D1_QUERY_LOG_MESSAGES } from './constants/db';
import { createD1RequestMetrics, instrumentD1Database } from './services/d1QueryTelemetry';
import { authorizeTenantRequest } from './services/workerTenantAccess';
import { handleGraphQLRoute } from './workerGraphql';
import { handleDatabaseRoute } from './workerD1Database';
import { handleD1DataRoute } from './workerD1DataRoutes';
import { handleIngestionRoute } from './workerD1IngestionRoutes';
import { handleAiRoute } from './workerAiRoutes';

const getTenant = async (environment: CloudflareEnvironment): Promise<Record<string, unknown>> => {
  requireD1Binding(environment.DB);
  return { ...await getTenantFromD1(environment.DB, environment.REQUEST_TENANT_ID) };
};


const handleTaxonomyRoute = async (request: Request, environment: CloudflareEnvironment, url: URL): Promise<Response> => {
  const validation = taxonomyQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
  if (!validation.success) {
    logger.warn('Rejected invalid taxonomy query', { requestId, errors: validation.error.issues });
    return jsonResponse({ success: false, message: 'Validation failed', errors: validation.error.issues }, 400, request);
  }
  const start = Date.now();
  const database = requireD1Binding(environment.DB);
  const { q, category, lookup, limit, offset } = validation.data;
  const data = await getTaxonomyFromD1(database, q, category, lookup, limit, offset);
  const total = Array.isArray(data) ? data.length : data ? 1 : 0;
  logger.info('Read D1 commodity catalog page', { requestId, durationMs: Date.now() - start, operation: 'SELECT', model: 'UNSPSCCommodity', affectedRows: total, cache: 'miss' });
  const response = jsonResponse({ success: true, data, total, timestamp: new Date().toISOString() }, 200, request);
  response.headers.set('x-request-id', requestId);
  return response;
};

const handleDataRoute = async (request: Request, environment: CloudflareEnvironment, url: URL): Promise<Response> => {
  if (url.pathname === `${CLOUDFLARE_API_PREFIX}/industry-profiles`) {
    requireD1Binding(environment.DB);
    const result = await handleIndustryProfilesRoute(environment.DB, request, url);
    return result.status
      ? jsonResponse(result.data as Record<string, unknown>, result.status, request)
      : apiData(result.data, request);
  }
  if (url.pathname === `${CLOUDFLARE_API_PREFIX}/procurement/category-mappings` && request.method === 'GET') {
    const database = requireD1Binding(environment.DB);
    return apiData(await getProcurementCategoryMappingsFromD1(
      database,
      request.headers.get('x-request-id') || undefined
    ), request);
  }
  if (url.pathname === `${CLOUDFLARE_API_PREFIX}/ingestion/canonical`) {
    const scope = d1DatasetScopeSchema.safeParse({
      assessmentId: url.searchParams.get('assessmentId') ?? request.headers.get('x-assessment-id') ?? undefined
    });
    if (!scope.success) return jsonResponse({
      success: false, message: 'Validation failed', errors: scope.error.issues
    }, 400, request);
    const canonicalData = await getCanonicalModule1Data(
      environment.DB, scope.data.assessmentId, environment.REQUEST_TENANT_ID
    );
    return apiData(canonicalData, request);
  }
  if (url.pathname === `${CLOUDFLARE_API_PREFIX}/module2/logistics-packaging`) {
    const result = await handleModule2LogisticsPackagingRoute(environment, request, url);
    return result.status
      ? jsonResponse(result.data as Record<string, unknown>, result.status, request)
      : apiData(result.data, request);
  }
  if (url.pathname.startsWith(`${CLOUDFLARE_API_PREFIX}/ingestion`)) return handleIngestionRoute(request, environment, url);
  if (url.pathname.startsWith(`${CLOUDFLARE_API_PREFIX}/module2`)) {
    const subPath = url.pathname.slice(`${CLOUDFLARE_API_PREFIX}/module2`.length) || '/';
    const result = await handleModule2Route(environment.DB, subPath, request, url, environment.AUTH_SECRET);
    if (result.response) return withCors(result.response, request);
    return result.status ? jsonResponse(result.data as Record<string, unknown>, result.status, request) : apiData(result.data, request);
  }
  if (url.pathname.startsWith(`${CLOUDFLARE_API_PREFIX}/pcbi`)) {
    const subPath = url.pathname.slice(`${CLOUDFLARE_API_PREFIX}/pcbi`.length) || '/';
    const result = await handlePcbiRoute(environment.DB, subPath, request, url);
    return result.status ? jsonResponse(result.data as Record<string, unknown>, result.status, request) : apiData(result.data, request);
  }
  if (url.pathname.startsWith(`${CLOUDFLARE_API_PREFIX}/savings/`)) {
    const subPath = url.pathname.slice(`${CLOUDFLARE_API_PREFIX}/savings`.length);
    const result = await handleSavingsRoute(environment.DB, subPath, request, url, environment);
    return result.status ? jsonResponse(result.data as Record<string, unknown>, result.status, request) : apiData(result.data, request);
  }
  if (url.pathname.startsWith(`${CLOUDFLARE_API_PREFIX}/assessment`)) {
    const subPath = url.pathname.slice(`${CLOUDFLARE_API_PREFIX}/assessment`.length) || '/';
    const result = await handleAssessmentRoute(environment.DB, subPath, request, url, environment);
    if (result.response) return withCors(result.response, request);
    return result.status ? jsonResponse(result.data as Record<string, unknown>, result.status, request) : apiData(result.data, request);
  }
  if (url.pathname.startsWith(`${CLOUDFLARE_API_PREFIX}/customers`)) {
    const subPath = '/customers' + (url.pathname.slice(`${CLOUDFLARE_API_PREFIX}/customers`.length) || '');
    const result = await handleAssessmentRoute(environment.DB, subPath, request, url, environment);
    if (result.response) return withCors(result.response, request);
    return result.status ? jsonResponse(result.data as Record<string, unknown>, result.status, request) : apiData(result.data, request);
  }
  if (url.pathname.startsWith(`${CLOUDFLARE_API_PREFIX}/crypto`)) {
    const result = await handleCryptoRoute(request, url, environment);
    return result.status ? jsonResponse(result.data as Record<string, unknown>, result.status, request) : apiData(result.data, request);
  }
  const d1DataResponse = await handleD1DataRoute(request, environment, url);
  if (d1DataResponse) return d1DataResponse;
  if (url.pathname.startsWith(`${CLOUDFLARE_API_PREFIX}/db/`)) return handleDatabaseRoute(request, environment);
  return jsonResponse({ success: false, message: 'Endpoint not found in the Cloudflare Worker.' }, 404, request);
};

const handleApiRequest = async (request: Request, environment: CloudflareEnvironment): Promise<Response> => {
  const url = new URL(request.url);
  if (url.pathname === CLOUDFLARE_CLIENT_ERROR_PATH) {
    return handleClientErrorTelemetry(request, environment);
  }
  if (url.pathname === `${CLOUDFLARE_API_PREFIX}${CLOUDFLARE_HEALTH_PATH}`) {
    return jsonResponse({ status: 'ok', service: CLOUDFLARE_SERVICE_NAME, database: Boolean(environment.DB) }, 200, request);
  }

  if (url.pathname === `${CLOUDFLARE_API_PREFIX}/tenant` && request.method === 'GET') {
    return apiData(await getTenant(environment), request);
  }

  if (url.pathname === `${CLOUDFLARE_API_PREFIX}/tenant` && request.method === 'PUT') {
    const database = requireD1Binding(environment.DB);
    const body = await readJson(request);
    const tenantId = environment.REQUEST_TENANT_ID;
    if (!tenantId) return jsonResponse({ success: false, message: D1_ROUTE_MESSAGES.tenantScopeRequired }, 403, request);
    await database.prepare(`
      UPDATE TenantMaster
      SET enterprise_name = COALESCE(?, enterprise_name), region = COALESCE(?, region), base_currency = COALESCE(?, base_currency),
          status = COALESCE(?, status), major_sector = COALESCE(?, major_sector), minor_sector = COALESCE(?, minor_sector),
          updated_at = CURRENT_TIMESTAMP
      WHERE tenant_id = ?
    `).bind(body.enterprise_name ?? null, body.region ?? null, body.base_currency ?? null, body.status ?? null, body.major_sector ?? null, body.minor_sector ?? null, tenantId).run();
    return apiData(await getTenant(environment), request);
  }
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
