import {
  CLOUDFLARE_ALLOWED_HEADERS,
  CLOUDFLARE_ALLOWED_METHODS,
  CLOUDFLARE_API_PREFIX,
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

const resolveOrigin = (environment: CloudflareEnvironment): URL | null => {
  if (!environment.BACKEND_ORIGIN) {
    return null;
  }

  try {
    return new URL(environment.BACKEND_ORIGIN);
  } catch {
    return null;
  }
};

const proxyRequest = async (
  request: Request,
  environment: CloudflareEnvironment,
  executionContext: CloudflareExecutionContext
): Promise<Response> => {
  const origin = resolveOrigin(environment);
  if (!origin) {
    return jsonResponse(
      { success: false, message: 'BACKEND_ORIGIN is missing or invalid.' },
      503,
      request
    );
  }

  const target = new URL(request.url);
  origin.pathname = `${origin.pathname.replace(/\/$/, '')}${target.pathname}`;
  origin.search = target.search;

  const headers = new Headers(request.headers);
  headers.set('X-Forwarded-Host', target.host);
  headers.set('X-Cloudflare-Service', CLOUDFLARE_SERVICE_NAME);

  try {
    const response = await globalThis.fetch(new Request(origin, {
      method: request.method,
      headers,
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
      duplex: request.method === 'GET' || request.method === 'HEAD' ? undefined : 'half',
      redirect: 'manual'
    }));
    executionContext.waitUntil(Promise.resolve());
    return withCors(response, request);
  } catch {
    return jsonResponse(
      { success: false, message: 'Backend origin is unavailable. Retry the request.' },
      502,
      request
    );
  }
};

export const fetch = async (
  request: Request,
  environment: CloudflareEnvironment,
  executionContext: CloudflareExecutionContext
): Promise<Response> => {
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return withCors(new Response(null, { status: 204 }), request);
  }

  if (url.pathname === `${CLOUDFLARE_API_PREFIX}${CLOUDFLARE_HEALTH_PATH}`) {
    return jsonResponse({ status: 'ok', service: CLOUDFLARE_SERVICE_NAME }, 200, request);
  }

  return proxyRequest(request, environment, executionContext);
};

export default { fetch };