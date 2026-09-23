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

  it('handles categories, vendors, and savings routes', async () => {
    const all = vi.fn().mockResolvedValue({ results: [] });
    const environment = {
      DB: { prepare: vi.fn().mockReturnValue({ all, first: vi.fn().mockResolvedValue(null) }) }
    };

    const categoriesRes = await workerFetch(request('/api/categories'), environment, executionContext);
    expect(categoriesRes.status).toBe(200);

    const vendorsRes = await workerFetch(request('/api/vendors'), environment, executionContext);
    expect(vendorsRes.status).toBe(200);

    const savingsRes = await workerFetch(request('/api/savings'), environment, executionContext);
    expect(savingsRes.status).toBe(200);
  });

  it('handles conversion, db, and report endpoints', async () => {
    const all = vi.fn().mockResolvedValue({ results: [] });
    const first = vi.fn().mockResolvedValue({ totalSpend: 100, cnt: 5 });
    const environment = {
      DB: {
        prepare: vi.fn().mockReturnValue({
          all,
          first
        })
      }
    };

    const conversionRes = await workerFetch(request('/api/conversion'), environment, executionContext);
    expect(conversionRes.status).toBe(200);

    const dbRes = await workerFetch(request('/api/db/status'), environment, executionContext);
    expect(dbRes.status).toBe(200);

    const reportRes = await workerFetch(request('/api/report'), environment, executionContext);
    expect(reportRes.status).toBe(200);
  });

  it('handles ingestion and taxonomy endpoints', async () => {
    const all = vi.fn().mockResolvedValue({ results: [] });
    const run = vi.fn().mockResolvedValue({});
    const environment = {
      DB: { prepare: vi.fn().mockReturnValue({ all, first: vi.fn().mockResolvedValue(null), bind: vi.fn().mockReturnValue({ run }) }) }
    };

    const queueRes = await workerFetch(request('/api/ingestion'), environment, executionContext);
    expect(queueRes.status).toBe(200);

    const uploadRes = await workerFetch(
      request('/api/ingestion/upload', {
        method: 'POST',
        body: JSON.stringify({ fileName: 'data.xlsx', fileSizeMb: 2 }),
        headers: { 'Content-Type': 'application/json' }
      }),
      environment,
      executionContext
    );
    expect(uploadRes.status).toBe(200);

    const taxRes = await workerFetch(request('/api/taxonomy?q=valves'), environment, executionContext);
    expect(taxRes.status).toBe(200);
  });

  it('handles currency endpoints', async () => {
    const ratesRes = await workerFetch(request('/api/currency'), {}, executionContext);
    expect(ratesRes.status).toBe(200);

    const convertRes = await workerFetch(
      request('/api/currency?from=USD&amount=100'),
      {},
      executionContext
    );
    expect(convertRes.status).toBe(200);
  });

  it('handles AI endpoints', async () => {
    const configRes = await workerFetch(request('/api/ai/config'), {}, executionContext);
    expect(configRes.status).toBe(200);

    const extractRes = await workerFetch(
      request('/api/ai/extract', {
        method: 'POST',
        body: JSON.stringify({ documentText: 'Line 1 Item' }),
        headers: { 'Content-Type': 'application/json' }
      }),
      {},
      executionContext
    );
    expect(extractRes.status).toBe(200);

    const catRes = await workerFetch(
      request('/api/ai/categorize', {
        method: 'POST',
        body: JSON.stringify({ items: [{ lineId: '1', rawDescription: 'Ball bearings' }] }),
        headers: { 'Content-Type': 'application/json' }
      }),
      {},
      executionContext
    );
    expect(catRes.status).toBe(200);

    const execReportRes = await workerFetch(
      request('/api/ai/executive-summary', {
        method: 'POST',
        body: JSON.stringify({ tenantName: 'Acme', totalSpendInrCr: 10 }),
        headers: { 'Content-Type': 'application/json' }
      }),
      {},
      executionContext
    );
    expect(execReportRes.status).toBe(200);

    const anomaliesRes = await workerFetch(
      request('/api/ai/analyze-anomalies', {
        method: 'POST',
        body: JSON.stringify({ records: [] }),
        headers: { 'Content-Type': 'application/json' }
      }),
      {},
      executionContext
    );
    expect(anomaliesRes.status).toBe(200);
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