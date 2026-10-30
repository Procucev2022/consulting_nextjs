import { describe, expect, it } from 'vitest';
import {
  CLOUDFLARE_ALLOWED_HEADERS,
  CLOUDFLARE_ALLOWED_METHODS,
  CLOUDFLARE_EXPOSED_HEADERS,
  CLOUDFLARE_MAX_AGE_SECONDS
} from '../src/constants/cloudflare';
import { apiData, jsonResponse, notFoundResponse, readJson, withCors } from '../src/workerHttp';

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

  it.each([
    ['malformed JSON', '{"fileName": '],
    ['an empty body', '']
  ])('returns an empty object for %s instead of throwing', async (_label, body) => {
    await expect(readJson(request({ method: 'POST', body }))).resolves.toEqual({});
  });

  it.each([
    ['a number', '42'],
    ['a string', '"text"'],
    ['null', 'null'],
    ['a boolean', 'true']
  ])('returns an empty object when the JSON value is %s', async (_label, body) => {
    await expect(readJson(request({ method: 'POST', body }))).resolves.toEqual({});
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
