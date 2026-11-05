import {
  CLOUDFLARE_ALLOWED_HEADERS,
  CLOUDFLARE_ALLOWED_METHODS,
  CLOUDFLARE_EXPOSED_HEADERS,
  CLOUDFLARE_MAX_AGE_SECONDS
} from './constants/cloudflare';
import { D1_ROUTE_MESSAGES } from './constants/d1';
import { WORKER_JSON_BODY_MAX_BYTES } from './constants/validation';
import type { WorkerD1Result } from './types/d1';
import logger from './utils/logger';

export class RequestJsonParseError extends Error {
  public readonly underlyingError: unknown;

  constructor(cause: unknown) {
    super(D1_ROUTE_MESSAGES.invalidJsonBody);
    this.name = 'RequestJsonParseError';
    this.underlyingError = cause;
  }
}

export class RequestBodyTooLargeError extends Error {
  public readonly maxBytes: number;

  constructor(maxBytes: number) {
    super(D1_ROUTE_MESSAGES.requestBodyTooLarge(maxBytes));
    this.name = 'RequestBodyTooLargeError';
    this.maxBytes = maxBytes;
  }
}

export const requestJsonFailureResult = (request: Request, error: unknown): WorkerD1Result | null => {
  const tooLarge = error instanceof RequestBodyTooLargeError;
  if (!(error instanceof RequestJsonParseError) && !tooLarge) return null;
  const status = tooLarge ? 413 : 400;
  const message = tooLarge ? error.message : D1_ROUTE_MESSAGES.invalidJsonBody;
  logger.warn(tooLarge ? 'Rejected oversized JSON request body' : 'Rejected malformed JSON request body', {
    requestId: request.headers.get('x-request-id') || undefined,
    method: request.method,
    path: new URL(request.url).pathname,
    statusCode: status,
    maxBytes: tooLarge ? error.maxBytes : undefined
  }, error instanceof RequestJsonParseError ? error.underlyingError : error);
  return {
    status,
    data: {
      success: false,
      message: tooLarge ? message : D1_ROUTE_MESSAGES.validationFailed,
      errors: [{ path: 'body', message }]
    }
  };
};

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

export const readJson = async (
  request: Request,
  maxBytes = WORKER_JSON_BODY_MAX_BYTES
): Promise<Record<string, unknown>> => {
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) throw new RangeError('JSON body byte limit must be a positive safe integer');
  const contentLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new RequestBodyTooLargeError(maxBytes);
  }

  let rawBody = '';
  if (request.body) {
    const reader = request.body.getReader();
    const decoder = new TextDecoder();
    let bytesRead = 0;
    try {
      let chunk = await reader.read();
      while (!chunk.done) {
        bytesRead += chunk.value.byteLength;
        if (bytesRead > maxBytes) {
          void reader.cancel().catch(() => undefined);
          throw new RequestBodyTooLargeError(maxBytes);
        }
        rawBody += decoder.decode(chunk.value, { stream: true });
        chunk = await reader.read();
      }
      rawBody += decoder.decode();
    } catch (error: unknown) {
      if (error instanceof RequestBodyTooLargeError) throw error;
      throw new RequestJsonParseError(error);
    } finally {
      reader.releaseLock();
    }
  }
  if (!rawBody.trim()) return {};
  let body: unknown;
  try { body = JSON.parse(rawBody); } catch (error: unknown) {
    throw new RequestJsonParseError(error);
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    const error = new TypeError(D1_ROUTE_MESSAGES.invalidJsonBody);
    throw new RequestJsonParseError(error);
  }
  return body as Record<string, unknown>;
};

export const apiData = (data: unknown, request: Request, extra: Record<string, unknown> = {}): Response => {
  return jsonResponse({ success: true, data, timestamp: new Date().toISOString(), ...extra }, 200, request);
};

export const notFoundResponse = (request: Request): Response => {
  return jsonResponse({ success: false, message: 'Endpoint not found in the Cloudflare Worker.' }, 404, request);
};
