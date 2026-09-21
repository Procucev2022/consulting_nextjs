import {
  CLOUDFLARE_ALLOWED_HEADERS,
  CLOUDFLARE_ALLOWED_METHODS,
  CLOUDFLARE_API_PREFIX,
  CLOUDFLARE_DEFAULT_FRONTEND_URL,
  CLOUDFLARE_HEALTH_PATH,
  CLOUDFLARE_MAX_AGE_SECONDS,
  CLOUDFLARE_SERVICE_NAME
} from './constants/cloudflare';
import type { CloudflareEnvironment, CloudflareExecutionContext } from './types/cloudflare';

const getCorsHeaders = (request: Request): Headers => {
  const headers = new Headers({
    'Access-Control-Allow-Methods': CLOUDFLARE_ALLOWED_METHODS,
    'Access-Control-Allow-Headers': CLOUDFLARE_ALLOWED_HEADERS,
    'Access-Control-Max-Age': CLOUDFLARE_MAX_AGE_SECONDS,
    Vary: 'Origin'
  });
  const origin = request.headers.get('Origin');
  if (origin) {
    headers.set('Access-Control-Allow-Origin', origin);
  }
  return headers;
};

const withCors = (response: Response, request: Request): Response => {
  const headers = new Headers(response.headers);
  const corsHeaders = getCorsHeaders(request);
  corsHeaders.forEach((value, key) => headers.set(key, value));
  return new Response(response.body, { status: response.status, headers });
};

const jsonResponse = (body: Record<string, unknown>, status: number, request: Request): Response => {
  return withCors(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' }
    }),
    request
  );
};

const getFrontendOrigin = (environment: CloudflareEnvironment): string => {
  return environment.FRONTEND_URL || CLOUDFLARE_DEFAULT_FRONTEND_URL;
};

const handleApiRequest = async (request: Request, environment: CloudflareEnvironment): Promise<Response> => {
  const url = new URL(request.url);
  if (url.pathname === `${CLOUDFLARE_API_PREFIX}${CLOUDFLARE_HEALTH_PATH}`) {
    return jsonResponse({ status: 'ok', service: CLOUDFLARE_SERVICE_NAME, database: Boolean(environment.DB) }, 200, request);
  }

  if (!environment.DB) {
    return jsonResponse({ success: false, message: 'Cloudflare D1 binding is not configured.' }, 503, request);
  }

  if (url.pathname === `${CLOUDFLARE_API_PREFIX}/tenant` && request.method === 'GET') {
    const tenant = await environment.DB.prepare('SELECT * FROM TenantMaster LIMIT 1').first();
    return jsonResponse({ success: true, data: tenant }, 200, request);
  }

  return jsonResponse({ success: false, message: 'This API route has not been migrated to the Cloudflare Worker yet.' }, 501, request);
};

export const fetch = async (
  request: Request,
  environment: CloudflareEnvironment,
  executionContext: CloudflareExecutionContext
): Promise<Response> => {
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    const response = withCors(new Response(null, { status: 204 }), request);
    response.headers.set(
      'Access-Control-Allow-Origin',
      environment.FRONTEND_URL || request.headers.get('Origin') || getFrontendOrigin(environment)
    );
    return response;
  }

  if (url.pathname === '/') {
    return jsonResponse({
      message: 'Consulting & Procurement Intelligence Platform - Cloudflare Worker API',
      status: 'online',
      docs: `${CLOUDFLARE_API_PREFIX}${CLOUDFLARE_HEALTH_PATH}`
    }, 200, request);
  }

  if (url.pathname.startsWith(CLOUDFLARE_API_PREFIX)) {
    return handleApiRequest(request, environment);
  }

  if (url.pathname === `${CLOUDFLARE_API_PREFIX}${CLOUDFLARE_HEALTH_PATH}`) {
    return jsonResponse({ status: 'ok', service: CLOUDFLARE_SERVICE_NAME }, 200, request);
  }

  executionContext.passThroughOnException();
  return jsonResponse({ success: false, message: 'Endpoint not found.' }, 404, request);
};

export default { fetch };