import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetch as workerFetch } from '../src/worker';
import type { CloudflareExecutionContext } from '../src/types/cloudflare';

const executionContext: CloudflareExecutionContext = {
  waitUntil: vi.fn(),
  passThroughOnException: vi.fn()
};

const request = (path: string, init?: RequestInit): Request => {
  return new Request(`https://edge.example.com${path}`, init);
};

describe('Cloudflare backend worker', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('handles CORS preflight requests', async () => {
    const response = await workerFetch(
      request('/api/tenant', { method: 'OPTIONS', headers: { Origin: 'https://app.example.com' } }),
      {},
      executionContext
    );

    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://app.example.com');
  });

  it('returns a local health response', async () => {
    const response = await workerFetch(request('/api/health'), {}, executionContext);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: 'ok', service: 'consulting-backend-edge' });
  });

  it('rejects a missing or invalid backend origin', async () => {
    const missing = await workerFetch(request('/api/tenant'), {}, executionContext);
    const invalid = await workerFetch(request('/api/tenant'), { BACKEND_ORIGIN: 'not-a-url' }, executionContext);

    expect(missing.status).toBe(503);
    expect(invalid.status).toBe(503);
  });

  it('proxies requests, preserving the path, query, body, and CORS headers', async () => {
    const upstream = new Response(JSON.stringify({ success: true }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
    const fetchMock = vi.fn().mockResolvedValue(upstream);
    vi.stubGlobal('fetch', fetchMock);

    const response = await workerFetch(
      request('/api/tenant?region=us', {
        method: 'POST',
        headers: { Origin: 'https://app.example.com', 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Acme' })
      }),
      { BACKEND_ORIGIN: 'https://origin.example.com/base/' },
      executionContext
    );

    const proxiedRequest = fetchMock.mock.calls[0]?.[0];
    expect(proxiedRequest).toBeInstanceOf(Request);
    expect((proxiedRequest as Request).url).toBe('https://origin.example.com/base/api/tenant?region=us');
    expect((proxiedRequest as Request).headers.get('X-Cloudflare-Service')).toBe('consulting-backend-edge');
    await expect((proxiedRequest as Request).json()).resolves.toEqual({ name: 'Acme' });
    expect(response.status).toBe(201);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://app.example.com');
  });

  it('proxies GET requests without a body', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('ok'));
    vi.stubGlobal('fetch', fetchMock);

    await workerFetch(request('/api/tenant'), { BACKEND_ORIGIN: 'https://origin.example.com' }, executionContext);

    const proxiedRequest = fetchMock.mock.calls[0]?.[0] as Request;
    expect(proxiedRequest.method).toBe('GET');
    expect(proxiedRequest.body).toBeNull();
  });

  it('returns a gateway error when the origin cannot be reached', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('connection refused')));

    const response = await workerFetch(
      request('/api/tenant'),
      { BACKEND_ORIGIN: 'https://origin.example.com' },
      executionContext
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      success: false,
      message: 'Backend origin is unavailable. Retry the request.'
    });
  });
});