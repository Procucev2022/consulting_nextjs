import { describe, expect, it, vi } from 'vitest';
import {
  CLOUDFLARE_ALLOWED_HEADERS,
  CLOUDFLARE_ALLOWED_METHODS,
  CLOUDFLARE_EXPOSED_HEADERS,
  CLOUDFLARE_MAX_AGE_SECONDS
} from '../src/constants/cloudflare';
import {
  apiData, jsonResponse, notFoundResponse, readJson, requestJsonFailureResult,
  RequestBodyTooLargeError, RequestJsonParseError, withCors
} from '../src/workerHttp';
import { D1_ROUTE_MESSAGES } from '../src/constants/d1';
import logger from '../src/utils/logger';

const ORIGIN = 'https://app.example.com';

const request = (init: RequestInit = {}): Request => new Request('https://edge.example.com/api/example', init);

describe('workerHttp CORS helpers', () => {
  it('applies wildcard CORS headers without credentials when the caller sends no Origin', () => {
    const response = withCors(new Response('ok'), request());

    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(response.headers.get('Access-Control-Allow-Methods')).toBe(CLOUDFLARE_ALLOWED_METHODS);
    expect(response.headers.get('Access-Control-Allow-Headers')).toBe(CLOUDFLARE_ALLOWED_HEADERS);
    expect(response.headers.get('Access-Control-Expose-Headers')).toBe(CLOUDFLARE_EXPOSED_HEADERS);
    expect(response.headers.get('Access-Control-Max-Age')).toBe(CLOUDFLARE_MAX_AGE_SECONDS);
    expect(response.headers.get('Vary')).toBe('Origin');
    expect(response.headers.has('Access-Control-Allow-Credentials')).toBe(false);
  });

  it('reflects a specific origin and allows credentials', () => {
    const response = withCors(new Response('ok'), request({ headers: { Origin: ORIGIN } }));

    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);
    expect(response.headers.get('Access-Control-Allow-Credentials')).toBe('true');
  });

  it('echoes the headers requested by a preflight instead of the default allow-list', () => {
    const response = withCors(
      new Response(null, { status: 204 }),
      request({ headers: { 'Access-Control-Request-Headers': 'X-Custom-Trace' } })
    );

    expect(response.headers.get('Access-Control-Allow-Headers')).toBe('X-Custom-Trace');
  });

  it('keeps status, body and unrelated headers while replacing stale CORS headers', async () => {
    const original = new Response('payload', {
      status: 201,
      headers: { 'X-Trace': 'trace-1', 'Access-Control-Allow-Origin': 'https://stale.example.com' }
    });

    const response = withCors(original, request({ headers: { Origin: ORIGIN } }));

    expect(response.status).toBe(201);
    expect(response.headers.get('X-Trace')).toBe('trace-1');
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);
    await expect(response.text()).resolves.toBe('payload');
  });
});

describe('workerHttp jsonResponse', () => {
  it('serialises the body with a JSON content type, the given status and CORS headers', async () => {
    const response = jsonResponse({ success: false, message: 'Rejected' }, 422, request({ headers: { Origin: ORIGIN } }));

    expect(response.status).toBe(422);
    expect(response.headers.get('Content-Type')).toBe('application/json');
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);
    await expect(response.json()).resolves.toEqual({ success: false, message: 'Rejected' });
  });
});

describe('workerHttp readJson', () => {
  it('parses a JSON object body', async () => {
    const parsed = await readJson(request({ method: 'POST', body: JSON.stringify({ fileName: 'ledger.xlsx' }) }));

    expect(parsed).toEqual({ fileName: 'ledger.xlsx' });
  });

  it('allows an empty body so endpoint schemas can reject missing required fields', async () => {
    await expect(readJson(request({ method: 'POST', body: '' }))).resolves.toEqual({});
  });

  it('rejects malformed JSON without allowing the caller to continue with fallback data', async () => {
    const responseRequest = request({ method: 'POST', headers: { 'x-request-id': 'req-json-1' }, body: '{broken' });

    await expect(readJson(responseRequest)).rejects.toMatchObject({
      name: 'RequestJsonParseError', message: D1_ROUTE_MESSAGES.invalidJsonBody, underlyingError: expect.any(SyntaxError)
    });
  });

  it.each([
    ['a number', '42'],
    ['a string', '"text"'],
    ['null', 'null'],
    ['a boolean', 'true']
  ])('rejects a non-object JSON value when the JSON value is %s', async (_label, body) => {
    await expect(readJson(request({ method: 'POST', body }))).rejects.toBeInstanceOf(RequestJsonParseError);
  });

  it('accepts a body exactly at the configured UTF-8 byte limit', async () => {
    const body = JSON.stringify({ value: 'é' });
    const byteLength = new TextEncoder().encode(body).byteLength;
    await expect(readJson(request({ method: 'POST', body }), byteLength)).resolves.toEqual({ value: 'é' });
  });

  it('rejects an oversized body from content-length before reading it', async () => {
    const body = JSON.stringify({ value: 'oversized' });
    const response = request({
      method: 'POST',
      body,
      headers: { 'content-length': String(new TextEncoder().encode(body).byteLength) }
    });

    await expect(readJson(response, 4)).rejects.toMatchObject({
      name: 'RequestBodyTooLargeError', maxBytes: 4, message: D1_ROUTE_MESSAGES.requestBodyTooLarge(4)
    });
  });

  it('rejects streamed bodies that exceed the byte limit', async () => {
    const encoded = new TextEncoder().encode(JSON.stringify({ value: 'large' }));
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoded.slice(0, 5));
        controller.enqueue(encoded.slice(5));
        controller.close();
      }
    });
    const streamedRequest = new Request('https://edge.example.com/api/example', {
      method: 'POST', body, duplex: 'half'
    } as RequestInit);

    await expect(readJson(streamedRequest, 7)).rejects.toBeInstanceOf(RequestBodyTooLargeError);
  });

  it('rejects invalid size limits and wraps request stream failures', async () => {
    await expect(readJson(request({ method: 'POST', body: '{}' }), 0)).rejects.toThrow(RangeError);
    const body = new ReadableStream<Uint8Array>({
      start(controller) { controller.error(new Error('stream failed')); }
    });
    const failedRequest = new Request('https://edge.example.com/api/example', {
      method: 'POST', body, duplex: 'half'
    } as RequestInit);
    await expect(readJson(failedRequest)).rejects.toBeInstanceOf(RequestJsonParseError);
  });

  it('returns correlated route failures and logs the underlying parse error', () => {
    const log = vi.spyOn(logger, 'warn');
    const malformedRequest = request({ method: 'POST', headers: { 'x-request-id': 'req-bad-json' } });
    const parseError = new RequestJsonParseError(new SyntaxError('unexpected token'));

    expect(requestJsonFailureResult(malformedRequest, parseError)).toMatchObject({
      status: 400,
      data: { success: false, message: D1_ROUTE_MESSAGES.validationFailed, errors: [{ path: 'body', message: D1_ROUTE_MESSAGES.invalidJsonBody }] }
    });
    expect(log).toHaveBeenCalledWith('Rejected malformed JSON request body', expect.objectContaining({
      requestId: 'req-bad-json', method: 'POST', path: '/api/example', statusCode: 400
    }), parseError.underlyingError);

    expect(requestJsonFailureResult(malformedRequest, new RequestBodyTooLargeError(4))).toMatchObject({
      status: 413,
      data: { success: false, message: D1_ROUTE_MESSAGES.requestBodyTooLarge(4) }
    });
    expect(requestJsonFailureResult(malformedRequest, new Error('database failed'))).toBeNull();
    log.mockRestore();
  });
});

describe('workerHttp apiData', () => {
  it('wraps data in a success envelope with an ISO timestamp', async () => {
    const response = apiData({ id: 'AIC-A' }, request());
    const body = await response.json() as { success: boolean; data: unknown; timestamp: string };

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual({ id: 'AIC-A' });
    expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
  });

  it('merges extra envelope fields after the defaults', async () => {
    const response = apiData([1, 2], request(), { total: 2, page: 1 });

    await expect(response.json()).resolves.toMatchObject({ success: true, data: [1, 2], total: 2, page: 1 });
  });
});

describe('workerHttp notFoundResponse', () => {
  it('returns a 404 JSON envelope with CORS headers', async () => {
    const response = notFoundResponse(request({ headers: { Origin: ORIGIN } }));

    expect(response.status).toBe(404);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);
    await expect(response.json()).resolves.toEqual({
      success: false,
      message: 'Endpoint not found in the Cloudflare Worker.'
    });
  });
});
