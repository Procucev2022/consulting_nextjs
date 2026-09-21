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

  it('serves migrated API routes without requiring D1', async () => {
    const response = await workerFetch(request('/api/tenant'), {}, executionContext);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ success: true });
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
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: { tenant_id: 'tenant-1', enterprise_name: 'Acme' }
    });
  });

  it('registers and logs in a user through D1', async () => {
    const users = new Map<string, Record<string, unknown>>();
    const prepare = vi.fn((query: string) => ({
      bind: (...values: unknown[]) => ({
        first: async <T>(): Promise<T | null> => {
          if (query.includes('SELECT id FROM User')) return null;
          if (query.includes('SELECT * FROM User')) return [...users.values()][0] as T || null;
          return null;
        },
        run: async (): Promise<void> => {
          if (query.startsWith('INSERT')) {
            users.set(String(values[0]), {
              id: values[0], name: values[1], mobile_number: values[2], email: values[3],
              company_name: values[4], company_address: values[5], password_hash: values[6],
              role: values[7], status: values[8], subscription_tier: values[9], created_at: values[10], updated_at: values[11]
            });
          }
        }
      })
    }));
    const environment = { DB: { prepare }, AUTH_SECRET: 'test-secret' };
    const register = await workerFetch(request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test User', mobile_number: '+911234567890', email: 'test@example.com',
        company_name: 'Test Company', company_address: 'Test Address', password: 'Password123'
      }),
      headers: { 'Content-Type': 'application/json' }
    }), environment, executionContext);

    expect(register.status).toBe(201);
    const registration = await register.json() as { token: string };
    expect(registration.token).toBeTruthy();

    const login = await workerFetch(request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'Password123' }),
      headers: { 'Content-Type': 'application/json' }
    }), environment, executionContext);
    expect(login.status).toBe(200);
    await expect(login.json()).resolves.toMatchObject({ success: true });
  });
});