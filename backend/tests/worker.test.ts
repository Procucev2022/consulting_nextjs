import defaultWorker, { fetch as workerFetch } from '../src/worker';
import type { CloudflareExecutionContext } from '../src/types/cloudflare';
import { db } from '../src/services/db';

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
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });

  it('handles CORS preflight requests with default origin', async () => {
    const response = await workerFetch(
      request('/api/tenant', { method: 'OPTIONS' }),
      {},
      executionContext
    );

    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('returns a health response from the Express app', async () => {
    const response = await workerFetch(request('/api/health'), {}, executionContext);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('ok');
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('works when invoked through default export fetch', async () => {
    const response = await defaultWorker.fetch(request('/api/health'), {}, executionContext);
    expect(response.status).toBe(200);
  });

  it('forwards requests with Origin headers and preserves CORS', async () => {
    const response = await workerFetch(
      request('/api/health', {
        headers: { Origin: 'https://client.procucev.com' }
      }),
      {},
      executionContext
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://client.procucev.com');
  });

  it('initializes D1 database when environment.DB binding is present', async () => {
    const initD1Spy = vi.spyOn(db, 'initD1').mockResolvedValue(undefined as never);
    const mockDbBinding = { prepare: vi.fn() };

    const response = await workerFetch(
      request('/api/health'),
      { DB: mockDbBinding },
      executionContext
    );

    expect(initD1Spy).toHaveBeenCalledWith(mockDbBinding);
    expect(response.status).toBe(200);
  });

  it('processes POST requests with JSON body into Express router', async () => {
    const response = await workerFetch(
      request('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'https://app.example.com'
        },
        body: JSON.stringify({})
      }),
      {},
      executionContext
    );

    // Should return 400 Bad Request because of missing required fields in request body
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://app.example.com');
  });
});
