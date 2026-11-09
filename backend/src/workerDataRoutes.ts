import { CLOUDFLARE_API_PREFIX } from './constants/cloudflare';
import { D1_ROUTE_MESSAGES } from './constants/d1';
import { d1DatasetScopeSchema } from './constants/validation';
import type { CloudflareEnvironment } from './types/cloudflare';
import {
  getCanonicalModule1Data,
  handleModule2Route,
  handlePcbiRoute,
  handleSavingsRoute,
  handleAssessmentRoute,
  handleCryptoRoute,
  getProcurementCategoryMappingsFromD1,
  requireD1Binding
} from './workerD1';
import {
  apiData, jsonResponse, withCors
} from './workerHttp';
import { handleIndustryProfilesRoute } from './workerD1IndustryProfiles';
import { handleModule2LogisticsPackagingRoute } from './workerD1Module2Logistics';
import { handleDatabaseRoute } from './workerD1Database';
import { handleD1DataRoute } from './workerD1DataRoutes';
import { handleIngestionRoute } from './workerD1IngestionRoutes';

export const handleDataRoute = async (
  request: Request,
  environment: CloudflareEnvironment,
  url: URL
): Promise<Response> => {
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
      success: false, message: D1_ROUTE_MESSAGES.validationFailed, errors: scope.error.issues
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
