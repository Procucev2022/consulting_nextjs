import {
  CLOUDFLARE_ALLOWED_HEADERS,
  CLOUDFLARE_ALLOWED_METHODS,
  CLOUDFLARE_EXPOSED_HEADERS,
  CLOUDFLARE_MAX_AGE_SECONDS
} from './constants/cloudflare';

const getCorsHeaders = (request: Request): Headers => {
  const origin = request.headers.get('Origin') || '*';
  const reqHeaders = request.headers.get('Access-Control-Request-Headers') || CLOUDFLARE_ALLOWED_HEADERS;
  const headers = new Headers({
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': CLOUDFLARE_ALLOWED_METHODS,
    'Access-Control-Allow-Headers': reqHeaders,
    'Access-Control-Expose-Headers': CLOUDFLARE_EXPOSED_HEADERS,
    'Access-Control-Max-Age': CLOUDFLARE_MAX_AGE_SECONDS,
    Vary: 'Origin'
  });
  if (origin !== '*') {
    headers.set('Access-Control-Allow-Credentials', 'true');
  }
  return headers;
};


export const withCors = (response: Response, request: Request): Response => {
  const headers = new Headers(response.headers);
  const corsHeaders = getCorsHeaders(request);
  corsHeaders.forEach((value, key) => headers.set(key, value));
  return new Response(response.body, { status: response.status, headers });
};

export const jsonResponse = (body: Record<string, unknown>, status: number, request: Request): Response => {
  return withCors(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' }
    }),
    request
  );
};

export const readJson = async (request: Request): Promise<Record<string, unknown>> => {
  try {
    const body: unknown = await request.json();
    return body && typeof body === 'object' ? body as Record<string, unknown> : {};
  } catch {
    return {};
  }
};

export const apiData = (data: unknown, request: Request, extra: Record<string, unknown> = {}): Response => {
  return jsonResponse({ success: true, data, timestamp: new Date().toISOString(), ...extra }, 200, request);
};

export const notFoundResponse = (request: Request): Response => {
  return jsonResponse({ success: false, message: 'Endpoint not found in the Cloudflare Worker.' }, 404, request);
};
