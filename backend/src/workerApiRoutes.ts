import {
  CLOUDFLARE_API_PREFIX,
  CLOUDFLARE_CLIENT_ERROR_PATH,
  CLOUDFLARE_HEALTH_PATH,
  CLOUDFLARE_SERVICE_NAME
} from './constants/cloudflare';
import type { CloudflareEnvironment } from './types/cloudflare';
import { handleAuthRoute, handleAdminRoute } from './workerAuth';
import { handleUpgradeRoute } from './services/workerCommercialUpgrade';
import { handleSubscriptionRoute } from './services/workerCommercialSubscriptions';
import {
  jsonResponse, notFoundResponse
} from './workerHttp';
import { handleOrchestrationRoute } from './workerD1Orchestration';
import { handleEvidenceRoute } from './workerD1Evidence';
import { handleExecutiveBriefRoute } from './workerD1ExecutiveBrief';
import { handleClientErrorTelemetry } from './services/clientErrorTelemetry';
import { handleGraphQLRoute } from './workerGraphql';
import { handleAiRoute } from './workerAiRoutes';
import { handleTaxonomyRoute } from './workerTaxonomyRoutes';
import { handleTenantRoute } from './workerD1TenantRoutes';
import { handleDataRoute } from './workerDataRoutes';

export const handleApiRequest = async (request: Request, environment: CloudflareEnvironment): Promise<Response> => {
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
    const response = await handleAiRoute(request, url, environment);
    return response;
  }
  if (url.pathname.startsWith(`${CLOUDFLARE_API_PREFIX}/taxonomy`)) {
    const response = await handleTaxonomyRoute(request, environment, url);
    return response;
  }
  if (url.pathname === `${CLOUDFLARE_API_PREFIX}/graphql`) {
    const response = await handleGraphQLRoute(request, environment, url);
    return response;
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
