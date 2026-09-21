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
    await expect(response.json()).resolves.toEqual({
      status: 'ok',
      service: 'consulting-nextjs-backend',
      database: false
    });
  });

  it('rejects API requests when D1 is not configured', async () => {
    const response = await workerFetch(request('/api/tenant'), {}, executionContext);

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      success: false,
      message: 'Cloudflare D1 binding is not configured.'
    });
  });

  it('reads the tenant from D1', async () => {
    const first = vi.fn().mockResolvedValue({ tenant_id: 'tenant-1', enterprise_name: 'Acme' });
    const environment = {
      DB: { prepare: vi.fn().mockReturnValue({ first }) }
    };

    const response = await workerFetch(
      request('/api/tenant'),
      environment,
      executionContext
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: { tenant_id: 'tenant-1', enterprise_name: 'Acme' }
    });
  });
});