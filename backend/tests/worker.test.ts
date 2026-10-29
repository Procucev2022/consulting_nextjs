import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as XLSX from 'xlsx';
import { fetch as workerFetch } from '../src/worker';
import type { CloudflareEnvironment, CloudflareExecutionContext, CloudflareR2Bucket } from '../src/types/cloudflare';
import { CLOUDFLARE_API_PREFIX, CLOUDFLARE_HEALTH_PATH, CLOUDFLARE_SERVICE_NAME } from '../src/constants/cloudflare';
import { D1_ROUTE_MESSAGES } from '../src/constants/d1';
import { CLASSIFICATION_STATUS, EXTRACTION_STATUS } from '../src/constants/ai';
import { geminiService } from '../src/services/geminiService';
import { aiAnomalyService } from '../src/services/aiAnomalyService';
import { aiCategorizationService } from '../src/services/aiCategorizationService';
import { ensureD1Initialized, getTenantFromD1 } from '../src/workerD1';
import { handleAssessmentRoute } from '../src/workerD1Assessment';
import { handleExecutiveBriefRoute } from '../src/workerD1ExecutiveBrief';
import { handleEvidenceRoute } from '../src/workerD1Evidence';
import { handleModule2Route } from '../src/workerD1Module2';
import { handleOrchestrationRoute } from '../src/workerD1Orchestration';
import { handlePcbiRoute } from '../src/workerD1Pcbi';
import {
  createWorkerDatabase,
  insertRows,
  runtimeEnvironment,
  type WorkerDatabaseFixture
} from './helpers/workerCoreFixtures';

// The dispatch targets and the D1 init step are wrapped so that tests can control their outcome while
// every other test in this file keeps running the real implementation.
vi.mock('../src/workerD1', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/workerD1')>();
  return {
    ...actual,
    ensureD1Initialized: vi.fn(actual.ensureD1Initialized),
    getTenantFromD1: vi.fn(actual.getTenantFromD1)
  };
});
vi.mock('../src/workerD1Assessment', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/workerD1Assessment')>();
  return { ...actual, handleAssessmentRoute: vi.fn(actual.handleAssessmentRoute) };
});
vi.mock('../src/workerD1Module2', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/workerD1Module2')>();
  return { ...actual, handleModule2Route: vi.fn(actual.handleModule2Route) };
});
vi.mock('../src/workerD1Pcbi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/workerD1Pcbi')>();
  return { ...actual, handlePcbiRoute: vi.fn(actual.handlePcbiRoute) };
});
vi.mock('../src/workerD1Orchestration', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/workerD1Orchestration')>();
  return { ...actual, handleOrchestrationRoute: vi.fn(actual.handleOrchestrationRoute) };
});
vi.mock('../src/workerD1Evidence', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/workerD1Evidence')>();
  return { ...actual, handleEvidenceRoute: vi.fn(actual.handleEvidenceRoute) };
});
vi.mock('../src/workerD1ExecutiveBrief', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/workerD1ExecutiveBrief')>();
  return { ...actual, handleExecutiveBriefRoute: vi.fn(actual.handleExecutiveBriefRoute) };
});

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

  it('rejects database-backed API routes when D1 is unavailable', async () => {
    const response = await workerFetch(request('/api/tenant'), {}, executionContext);

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({ success: false });
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
    const first = vi.fn().mockResolvedValue(null);
    const environment = {
      DB: { prepare: vi.fn().mockReturnValue({ all, first, bind: vi.fn().mockReturnValue({ run, all, first }) }) }
    };

    const queueRes = await workerFetch(request('/api/ingestion'), environment, executionContext);
    expect(queueRes.status).toBe(200);

    const uploadRes = await workerFetch(
      request('/api/ingestion/upload', {
        method: 'POST',
        body: JSON.stringify({ fileName: 'data.xlsx', tenant_id: 'tenant-1', fileSizeMb: 2 }),
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
    const mockCurrencies = [{ currency: 'USD', currency_name: 'US Dollar', coverage_status: 'ACTIVE', approved_source: 'Yahoo' }];
    const mockRates = [{ currency: 'USD', inr_per_unit: 86.5, rate_date: '2026-10-24' }];
    const all = vi.fn().mockImplementation((_sql?: unknown) => {
      // return currencies first, then rates
      return Promise.resolve({ results: mockCurrencies });
    });
    let callCount = 0;
    const allFn = vi.fn().mockImplementation(() => {
      callCount += 1;
      return Promise.resolve({ results: callCount % 2 === 1 ? mockCurrencies : mockRates });
    });
    const first = vi.fn().mockResolvedValue(null);
    const environment = {
      DB: { prepare: vi.fn().mockReturnValue({ all: allFn, first, bind: vi.fn().mockReturnValue({ all: allFn, first }) }) }
    };

    const ratesRes = await workerFetch(request('/api/currency'), environment, executionContext);
    expect(ratesRes.status).toBe(200);

    const convertRes = await workerFetch(
      request('/api/currency?from=USD&amount=100'),
      environment,
      executionContext
    );
    expect(convertRes.status).toBe(200);
  });

  it('handles AI endpoints', async () => {
    const { geminiService } = await import('../src/services/geminiService');
    const { aiCategorizationService } = await import('../src/services/aiCategorizationService');
    const { aiReportService } = await import('../src/services/aiReportService');
    const { aiAnomalyService } = await import('../src/services/aiAnomalyService');

    vi.spyOn(geminiService, 'extractLineItems').mockResolvedValue({ status: 'SUCCESS', items: [] } as any);
    vi.spyOn(aiCategorizationService, 'categorizeLineItems').mockResolvedValue({ status: 'SUCCESS', mappings: [] } as any);
    vi.spyOn(aiReportService, 'generateExecutiveSummary').mockResolvedValue({ status: 'SUCCESS', data: {} } as any);
    vi.spyOn(aiAnomalyService, 'analyzeAnomalies').mockResolvedValue({ status: 'SUCCESS', anomalies: [] } as any);

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
  }, 30000);

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
    const environment: CloudflareEnvironment = {
      DB: { prepare } as unknown as CloudflareEnvironment['DB'],
      AUTH_SECRET: 'test-secret'
    };
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

const jsonRequest = (method: string, body: string): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body
});

const jsonBody = (method: string, body: unknown): RequestInit => jsonRequest(method, JSON.stringify(body));

const bodyOf = async (response: Response): Promise<Record<string, unknown>> =>
  await response.json() as Record<string, unknown>;

const dataOf = async (response: Response): Promise<Record<string, unknown>> =>
  (await bodyOf(response)).data as Record<string, unknown>;

const NO_BINDING = { DB: undefined };

describe('Cloudflare worker core routes', () => {
  let fixture: WorkerDatabaseFixture;
  let execution: CloudflareExecutionContext;

  beforeEach(() => {
    fixture = createWorkerDatabase();
    execution = { waitUntil: vi.fn(), passThroughOnException: vi.fn() };
  });

  afterEach(() => {
    fixture.close();
    vi.restoreAllMocks();
  });

  const environmentWithDb = (overrides: CloudflareEnvironment = {}): CloudflareEnvironment =>
    runtimeEnvironment({ DB: fixture.d1, ...overrides });

  const send = (path: string, init: RequestInit = {}, environment: CloudflareEnvironment = environmentWithDb()): Promise<Response> =>
    workerFetch(request(path, init), environment, execution);

  const seedTenant = (tenantId = 'TNT-1', createdAt = '2026-01-01T00:00:00Z', totalSpend: number | null = 42.5): void => {
    insertRows(fixture.db, 'INSERT INTO TenantMaster (tenant_id, enterprise_name, region, base_currency, status, total_spend_evaluated_inr, major_sector, minor_sector, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
      [tenantId, 'Alpha Enterprises', 'APAC', 'INR', 'ACTIVE', totalSpend, 'Chemicals', 'Specialty', createdAt, createdAt]
    ]);
  };

  const seedCommodities = (): void => {
    insertRows(fixture.db, 'INSERT INTO UNSPSCCommodity (commodity_code, commodity_title, class_code, class_title, family_code, family_title, segment_code, segment_title, core_bucket, classification_status, taxonomy_version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
      ['11101501', 'Hydrochloric acid', '11101500', 'Acids', '11100000', 'Chemicals', '11000000', 'Chemicals & Materials', 'Direct Materials', 'CLASSIFIED', '2026.1'],
      ['14111500', 'Copier paper', '14111500', 'Paper', '14110000', 'Paper products', '14000000', 'Paper', 'Indirect & MRO', 'CLASSIFIED', '2026.1']
    ]);
  };

  const seedMetrics = (overrides: Record<string, number | null> = {}): void => {
    const values = {
      totalSpendCr: 100,
      sourceRowCount: 1200,
      validRowCount: 1100,
      excludedRowCount: 100,
      anomalyRowCount: 7,
      cleanSpendYieldPct: 98.5,
      billingMonths: 12,
      ...overrides
    };
    insertRows(fixture.db, 'INSERT INTO DatasetMetricSummary (metric_key, metric_value, metric_text) VALUES (?, ?, ?)', Object.entries(values).map(([key, value]) => [key, value, null]));
  };

  describe('entry point, CORS and fallbacks', () => {
    it('serves the root document that advertises the health path', async () => {
      const response = await send('/');

      expect(response.status).toBe(200);
      await expect(bodyOf(response)).resolves.toEqual({
        message: 'Consulting & Procurement Intelligence Platform - Cloudflare Worker API',
        status: 'online',
        version: '1.0.1-deployment-test',
        docs: `${CLOUDFLARE_API_PREFIX}${CLOUDFLARE_HEALTH_PATH}`
      });
    });

    it('reports whether the D1 binding is present on the API health path', async () => {
      await expect(bodyOf(await send('/api/health'))).resolves.toEqual({ status: 'ok', service: CLOUDFLARE_SERVICE_NAME, database: true });
      await expect(bodyOf(await send('/api/health', {}, runtimeEnvironment(NO_BINDING)))).resolves.toEqual({ status: 'ok', service: CLOUDFLARE_SERVICE_NAME, database: false });
    });

    it('answers CORS preflight for any path before routing and never passes it to the platform', async () => {
      const response = await send('/api/does-not-exist', { method: 'OPTIONS', headers: { Origin: 'https://app.example.com' } });

      expect(response.status).toBe(204);
      expect(response.body).toBeNull();
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://app.example.com');
      expect(execution.passThroughOnException).not.toHaveBeenCalled();
    });

    it('passes non-API paths to the platform and answers 404', async () => {
      const response = await send('/health');

      expect(response.status).toBe(404);
      await expect(bodyOf(response)).resolves.toEqual({ success: false, message: 'Endpoint not found.' });
      expect(execution.passThroughOnException).toHaveBeenCalledTimes(1);
    });

    it('answers unknown API routes with the worker 404 envelope', async () => {
      const response = await send('/api/not-a-route');

      expect(response.status).toBe(404);
      await expect(bodyOf(response)).resolves.toEqual({ success: false, message: 'Endpoint not found in the Cloudflare Worker.' });
    });

    it('maps failures that mention the D1 binding to 503 and other failures to 500', async () => {
      vi.mocked(handleOrchestrationRoute).mockRejectedValueOnce(new Error('Cloudflare D1 replica unavailable'));
      vi.mocked(handleEvidenceRoute).mockRejectedValueOnce(new Error('evidence exploded'));

      const unavailable = await send('/api/orchestration/jobs');
      const exploded = await send('/api/evidence/inventory');

      expect(unavailable.status).toBe(503);
      await expect(bodyOf(unavailable)).resolves.toEqual({ success: false, message: 'Cloudflare D1 replica unavailable' });
      expect(exploded.status).toBe(500);
      await expect(bodyOf(exploded)).resolves.toEqual({ success: false, message: 'evidence exploded' });
    });

    it('reports non-Error failures by their string value', async () => {
      vi.mocked(handleExecutiveBriefRoute).mockRejectedValueOnce('brief pipeline stopped');

      const response = await send('/api/reports/executive-brief/anything');

      expect(response.status).toBe(500);
      await expect(bodyOf(response)).resolves.toEqual({ success: false, message: 'brief pipeline stopped' });
    });
  });

  describe('dispatch to orchestration, evidence and executive brief modules', () => {
    it('returns the orchestration module response unchanged and forwards the parsed URL', async () => {
      vi.mocked(handleOrchestrationRoute).mockResolvedValueOnce(new Response('orchestrated', { status: 207 }));

      const response = await send('/api/orchestration/jobs?limit=5');
      const [forwardedRequest, , forwardedUrl] = vi.mocked(handleOrchestrationRoute).mock.calls[0];

      expect(response.status).toBe(207);
      await expect(response.text()).resolves.toBe('orchestrated');
      expect(forwardedRequest.method).toBe('GET');
      expect(forwardedUrl.pathname).toBe('/api/orchestration/jobs');
    });

    it('answers 404 for sibling paths that the orchestration module does not own', async () => {
      const response = await send('/api/orchestrationarchive');

      expect(response.status).toBe(404);
      await expect(bodyOf(response)).resolves.toEqual({ success: false, message: 'Endpoint not found in the Cloudflare Worker.' });
    });

    it('returns the evidence module response unchanged', async () => {
      vi.mocked(handleEvidenceRoute).mockResolvedValueOnce(new Response('evidence', { status: 200 }));

      await expect((await send('/api/evidence/inventory')).text()).resolves.toBe('evidence');
    });

    it('falls back to 404 when the evidence module declines a request', async () => {
      vi.mocked(handleEvidenceRoute).mockResolvedValueOnce(null);

      const response = await send('/api/evidence/inventory');

      expect(response.status).toBe(404);
    });

    it('returns the executive brief module response and answers 404 for brief paths it does not own', async () => {
      vi.mocked(handleExecutiveBriefRoute).mockResolvedValueOnce(new Response('brief', { status: 202 }));

      const owned = await send('/api/reports/executive-brief/current');
      const unowned = await send('/api/reports/executive-brief/unknown-route');

      expect(owned.status).toBe(202);
      expect(unowned.status).toBe(404);
    });
  });

  describe('tenant and ingestion routes', () => {
    it('reads the tenant and applies a partial update that keeps unspecified columns', async () => {
      seedTenant();

      const read = await send('/api/tenant');
      const updated = await send('/api/tenant', jsonBody('PUT', { enterprise_name: 'Beta Holdings' }));

      await expect(bodyOf(read)).resolves.toMatchObject({ success: true, data: { tenant_id: 'TNT-1', enterprise_name: 'Alpha Enterprises', region: 'APAC' } });
      expect(updated.status).toBe(200);
      await expect(bodyOf(updated)).resolves.toMatchObject({ data: { enterprise_name: 'Beta Holdings', region: 'APAC', base_currency: 'INR' } });
    });

    it('updates the tenant named in the body rather than the default tenant', async () => {
      seedTenant('TNT-1', '2026-01-01T00:00:00Z');
      seedTenant('TNT-2', '2026-02-01T00:00:00Z');

      await send('/api/tenant', jsonBody('PUT', { tenant_id: 'TNT-2', status: 'SUSPENDED' }));

      await expect(fixture.d1.prepare('SELECT status FROM TenantMaster WHERE tenant_id = ?').bind('TNT-2').first()).resolves.toEqual({ status: 'SUSPENDED' });
      await expect(fixture.d1.prepare('SELECT status FROM TenantMaster WHERE tenant_id = ?').bind('TNT-1').first()).resolves.toEqual({ status: 'ACTIVE' });
    });

    it('treats an unreadable tenant update as an empty change', async () => {
      seedTenant();

      const response = await send('/api/tenant', jsonRequest('PUT', '{"enterprise_name":'));

      expect(response.status).toBe(200);
      await expect(bodyOf(response)).resolves.toMatchObject({ data: { enterprise_name: 'Alpha Enterprises' } });
    });

    it('returns 503 for tenant reads and updates without a D1 binding', async () => {
      const environment = runtimeEnvironment(NO_BINDING);

      expect((await send('/api/tenant', {}, environment)).status).toBe(503);
      expect((await send('/api/tenant', jsonBody('PUT', {}), environment)).status).toBe(503);
    });

    it('scopes the ingestion queue to the buyer named in the query string', async () => {
      insertRows(fixture.db, 'INSERT INTO RawDocumentIngestion (doc_id, tenant_id, file_name, uploaded_at) VALUES (?, ?, ?, ?)', [
        ['DOC-1', 'TNT-1', 'alpha.xlsx', '2026-02-01T00:00:00Z'],
        ['DOC-2', 'TNT-2', 'beta.csv', '2026-03-01T00:00:00Z']
      ]);
      insertRows(fixture.db, 'INSERT INTO ProcurementTransaction (transaction_id, tenant_id, source_document_id, supplier_name, currency, raw_json) VALUES (?, ?, ?, ?, ?, ?)', [
        ['DOC-INGEST-TNT1-ROW-2', 'TNT-1', 'DOC-INGEST-TNT1', 'Alpha Supplier', 'INR', '{}'],
        ['DOC-INGEST-TNT2-ROW-2', 'TNT-2', 'DOC-INGEST-TNT2', 'Beta Supplier', 'INR', '{}']
      ]);
      insertRows(fixture.db, 'INSERT INTO ValidationPreCheckRecord (record_id, po_number, vendor_name, raw_desc, amount, issue_flag, action_status, resolved) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [
        ['REC-DOC-INGEST-TNT1-ROW-2', 'PO-1', 'Alpha Supplier', 'Item', 1, 'Passed Clean', 'Ready', 1],
        ['REC-DOC-INGEST-TNT2-ROW-2', 'PO-2', 'Beta Supplier', 'Item', 1, 'Passed Clean', 'Ready', 1]
      ]);

      const data = await dataOf(await send('/api/ingestion?buyerId=TNT-2'));

      expect((data.queue as Array<{ doc_id: string }>).map((row) => row.doc_id)).toEqual(['DOC-2']);
      expect(data.summary).toMatchObject({ totalFiles: 1 });
      expect((data.validationRecords as Array<{ record_id: string }>).map((row) => row.record_id)).toEqual([
        'REC-DOC-INGEST-TNT2-ROW-2'
      ]);
    });

    it('returns 503 for ingestion reads without a D1 binding', async () => {
      expect((await send('/api/ingestion', {}, runtimeEnvironment(NO_BINDING))).status).toBe(503);
    });

    it('adds an ingestion record with the tenant from the body and returns the refreshed queue', async () => {
      seedTenant();

      const response = await send('/api/ingestion', jsonBody('POST', {
        file_name: ' ledger.xlsx ',
        tenant_id: 'TNT-1',
        file_size_mb: 3,
        records_count: 10,
        converted_inr_crores: 2.5,
        detected_currencies: ['INR', 'USD']
      }));
      const queue = (await bodyOf(response)).data as Array<Record<string, unknown>>;

      expect(response.status).toBe(200);
      expect(queue).toHaveLength(1);
      expect(queue[0]).toMatchObject({
        tenant_id: 'TNT-1',
        file_name: 'ledger.xlsx',
        file_size_mb: 3,
        records_count: 10,
        converted_inr_crores: 2.5,
        detected_currencies: '["INR","USD"]',
        ocr_status: 'Completed'
      });
    });

    it('takes the tenant from the buyer header, and falls back to the first tenant when none is given', async () => {
      seedTenant('TNT-1', '2026-01-01T00:00:00Z');
      seedTenant('TNT-2', '2026-02-01T00:00:00Z');

      await send('/api/ingestion', { ...jsonBody('POST', { file_name: 'a.xlsx' }), headers: { 'Content-Type': 'application/json', 'x-buyer-id': 'TNT-2' } });
      const response = await send('/api/ingestion', jsonBody('POST', { file_name: 'b.xlsx' }));
      const queue = (await bodyOf(response)).data as Array<Record<string, unknown>>;

      expect(queue.find((row) => row.file_name === 'a.xlsx')?.tenant_id).toBe('TNT-2');
      expect(queue.find((row) => row.file_name === 'b.xlsx')?.tenant_id).toBe('TNT-1');
    });

    it.each([
      ['no file name', {}],
      ['a blank file name', { file_name: '   ' }]
    ])('rejects an ingestion record with %s as a 400 validation error', async (_label, body) => {
      seedTenant();

      const response = await send('/api/ingestion', jsonBody('POST', body));

      expect(response.status).toBe(400);
      await expect(bodyOf(response)).resolves.toEqual({ success: false, message: 'file_name is required for ingestion' });
    });

    it('rejects an unreadable ingestion body before any database access', async () => {
      const response = await send('/api/ingestion', jsonRequest('POST', '{"file_name":'), runtimeEnvironment(NO_BINDING));

      expect(response.status).toBe(400);
      await expect(bodyOf(response)).resolves.toMatchObject({ message: 'file_name is required for ingestion' });
    });

    it('returns 503 when an ingestion record is added without a D1 binding', async () => {
      const response = await send('/api/ingestion', jsonBody('POST', { file_name: 'a.xlsx' }), runtimeEnvironment(NO_BINDING));

      expect(response.status).toBe(503);
    });

    it('registers a metadata-only upload and returns the object descriptor with a normalised queue', async () => {
      insertRows(fixture.db, 'INSERT INTO RawDocumentIngestion (doc_id, tenant_id, file_name, uploaded_at, detected_currencies) VALUES (?, ?, ?, ?, ?)', [
        ['DOC-BAD', 'TNT-1', 'legacy.csv', '2026-01-01T00:00:00Z', 'not-json'],
        ['DOC-NULL', 'TNT-1', 'empty.csv', '2026-01-02T00:00:00Z', null]
      ]);

      const response = await send('/api/ingestion/upload', jsonBody('POST', {
        fileName: 'ledger.xlsx',
        tenant_id: 'TNT-1',
        fileSizeMb: 2,
        fileType: 'XLSX',
        recordsCount: 5,
        convertedInrCrores: 1.5,
        detectedCurrencies: ['INR']
      }));
      const data = (await bodyOf(response)).data as { objectMeta: Record<string, unknown>; ingestionQueue: Array<Record<string, unknown>> };

      expect(response.status).toBe(200);
      expect(data.objectMeta).toMatchObject({ size: 2 * 1024 * 1024, bucket: '' });
      expect(String(data.objectMeta.key)).toMatch(/_ledger\.xlsx$/u);
      expect(data.ingestionQueue.find((row) => row.file_name === 'ledger.xlsx')?.detected_currencies).toEqual(['INR']);
      expect(data.ingestionQueue.find((row) => row.doc_id === 'DOC-BAD')?.detected_currencies).toEqual([]);
      expect(data.ingestionQueue.find((row) => row.doc_id === 'DOC-NULL')?.detected_currencies).toEqual([]);
    });

    it('attributes uploads to the buyer header, or to the default tenant when the body and headers name none', async () => {
      seedTenant('TNT-1', '2026-01-01T00:00:00Z');

      await send('/api/ingestion/upload', { ...jsonBody('POST', { fileName: 'from-header.xlsx' }), headers: { 'Content-Type': 'application/json', 'x-buyer-id': 'TNT-9' } });
      const response = await send('/api/ingestion/upload', jsonBody('POST', { fileName: 'default.xlsx' }));
      const queue = (await dataOf(response)).ingestionQueue as Array<Record<string, unknown>>;

      expect(queue.find((row) => row.file_name === 'from-header.xlsx')?.tenant_id).toBe('TNT-9');
      expect(queue.find((row) => row.file_name === 'default.xlsx')?.tenant_id).toBe('TNT-1');
    });

    it('stores decoded binary content in the object bucket and records its metadata', async () => {
      const put = vi.fn<CloudflareR2Bucket['put']>(async () => undefined);
      const bucket: CloudflareR2Bucket = { put, get: vi.fn(async () => null), delete: vi.fn(async () => undefined) };

      const response = await send('/api/ingestion/upload-object', jsonBody('POST', {
        tenant_id: 'TNT-1',
        fileName: 'payload.csv',
        fileType: 'CSV',
        fileBase64: 'data:application/octet-stream;base64,aGVs\nbG8=',
        fileSizeMb: 1
      }), environmentWithDb({ OBJECTS: bucket, R2_BUCKET: 'consulting-docs' }));
      const [key, bytes, options] = put.mock.calls[0];

      expect(response.status).toBe(200);
      expect(key).toMatch(/_payload\.csv$/u);
      expect(Array.from(bytes as Uint8Array)).toEqual([104, 101, 108, 108, 111]);
      expect(options).toEqual({ httpMetadata: { contentType: 'text/csv' } });
      await expect(fixture.d1.prepare('SELECT size_bytes, bucket, content_type, filename FROM ObjectMetadata').first()).resolves.toEqual({
        size_bytes: 5,
        bucket: 'consulting-docs',
        content_type: 'CSV',
        filename: 'payload.csv'
      });
    });

    it('imports uploaded workbook rows to D1 and deletes their linked data with the source document', async () => {
      insertRows(fixture.db, 'INSERT INTO FxReferenceRate (currency, rate_date, inr_per_unit, fx_master_version) VALUES (?, ?, ?, ?)', [
        ['USD', '2025-01-01', 84, 'FX-2025']
      ]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([
        ['PO Number', 'Supplier Name', 'Material Code', 'Description', 'Quantity', 'Net Price', 'Currency', 'Document Date'],
        ['PO-42', 'Acme Ltd', 'MAT-42', 'Resin', 2, 5, 'USD', '2025-03-01'],
        ['PO-43', 'Beta Ltd', 'MAT-43', 'Solvent', 3, 10, 'INR', '2025-04-01']
      ]), 'Ledger');
      const fileBase64 = Buffer.from(XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })).toString('base64');
      const put = vi.fn<CloudflareR2Bucket['put']>(async () => undefined);
      const deleteObject = vi.fn<CloudflareR2Bucket['delete']>(async () => undefined);
      const bucket: CloudflareR2Bucket = { put, get: vi.fn(async () => null), delete: deleteObject };

      const response = await send('/api/ingestion/upload-object', jsonBody('POST', {
        tenant_id: 'TNT-1',
        assessment_id: 'AIC-42',
        fileName: 'ledger.xlsx',
        fileType: 'XLSX',
        fileBase64,
        parseTransactions: true
      }), environmentWithDb({ OBJECTS: bucket }));
      const upload = (await dataOf(response)) as { docId: string; importedCount: number; validationCount: number };

      expect(response.status).toBe(200);
      expect(upload).toMatchObject({ importedCount: 2, validationCount: 2 });
      expect(fixture.db.prepare('SELECT COUNT(*) AS count FROM ProcurementTransaction WHERE source_document_id = ?').get(upload.docId)).toEqual({ count: 2 });
      expect(fixture.db.prepare('SELECT COUNT(*) AS count FROM ValidationPreCheckRecord WHERE record_id LIKE ?').get(`REC-${upload.docId}-ROW-%`)).toEqual({ count: 2 });
      expect(fixture.db.prepare('SELECT records_count FROM RawDocumentIngestion WHERE doc_id = ?').get(upload.docId)).toEqual({ records_count: 2 });

      const deleted = await send(`/api/ingestion/document/${encodeURIComponent(upload.docId)}`, { method: 'DELETE' }, environmentWithDb({ OBJECTS: bucket }));
      expect(deleted.status).toBe(200);
      expect(fixture.db.prepare('SELECT COUNT(*) AS count FROM ProcurementTransaction WHERE source_document_id = ?').get(upload.docId)).toEqual({ count: 0 });
      expect(fixture.db.prepare('SELECT COUNT(*) AS count FROM ValidationPreCheckRecord WHERE record_id LIKE ?').get(`REC-${upload.docId}-ROW-%`)).toEqual({ count: 0 });
      expect(fixture.db.prepare('SELECT COUNT(*) AS count FROM RawDocumentIngestion WHERE doc_id = ?').get(upload.docId)).toEqual({ count: 0 });
      expect(fixture.db.prepare('SELECT COUNT(*) AS count FROM ObjectMetadata WHERE object_key LIKE ?').get(`${upload.docId}_%`)).toEqual({ count: 0 });
      expect(deleteObject).toHaveBeenCalledTimes(1);
    });

    it('rejects an unreadable source workbook and removes the staged R2 object', async () => {
      const put = vi.fn<CloudflareR2Bucket['put']>(async () => undefined);
      const deleteObject = vi.fn<CloudflareR2Bucket['delete']>(async () => undefined);
      const bucket: CloudflareR2Bucket = { put, get: vi.fn(async () => null), delete: deleteObject };
      const response = await send('/api/ingestion/upload-object', jsonBody('POST', {
        tenant_id: 'TNT-1',
        fileName: 'corrupt.xlsx',
        fileType: 'XLSX',
        fileBase64: Buffer.from([1, 2, 3]).toString('base64'),
        parseTransactions: true
      }), environmentWithDb({ OBJECTS: bucket }));

      expect(response.status).toBe(400);
      await expect(bodyOf(response)).resolves.toMatchObject({
        message: expect.stringContaining('uploaded workbook could not be read')
      });
      expect(put).toHaveBeenCalledTimes(1);
      expect(deleteObject).toHaveBeenCalledWith(put.mock.calls[0][0]);
      expect(fixture.db.prepare('SELECT COUNT(*) AS count FROM RawDocumentIngestion').get()).toEqual({ count: 0 });
    });

    it.each([
      ['XLSX', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      ['CSV', 'text/csv']
    ])('labels %s binary uploads with the matching content type', async (fileType, contentType) => {
      const put = vi.fn<CloudflareR2Bucket['put']>(async () => undefined);

      await send('/api/ingestion/upload', jsonBody('POST', { tenant_id: 'TNT-1', fileName: 'book', fileType, fileBase64: 'aGVsbG8=' }), environmentWithDb({
        OBJECTS: { put, get: vi.fn(async () => null), delete: vi.fn(async () => undefined) }
      }));

      expect(put.mock.calls[0]?.[2]).toEqual({ httpMetadata: { contentType } });
    });

    it('fails a binary upload when the object bucket binding is absent', async () => {
      const response = await send('/api/ingestion/upload', jsonBody('POST', { tenant_id: 'TNT-1', fileName: 'book.xlsx', fileBase64: 'aGVsbG8=' }), environmentWithDb({ OBJECTS: undefined }));

      expect(response.status).toBe(500);
      await expect(bodyOf(response)).resolves.toEqual({ success: false, message: 'Cloudflare R2 binding OBJECTS is required for binary uploads' });
    });

    it.each([
      ['no file name', {}],
      ['a blank file name', { fileName: '  ' }]
    ])('rejects an upload with %s as a 400 validation error', async (_label, body) => {
      const response = await send('/api/ingestion/upload', jsonBody('POST', body));

      expect(response.status).toBe(400);
      await expect(bodyOf(response)).resolves.toEqual({ success: false, message: 'fileName is required for upload' });
    });

    it('returns 503 for uploads without a D1 binding', async () => {
      expect((await send('/api/ingestion/upload', jsonBody('POST', { fileName: 'a.xlsx' }), runtimeEnvironment(NO_BINDING))).status).toBe(503);
    });

    it('recalculates supported FX amounts and leaves records without dated rates unresolved', async () => {
      insertRows(fixture.db, 'INSERT INTO FxCurrencyMaster (currency, currency_name, coverage_status, approved_source, fx_master_version) VALUES (?, ?, ?, ?, ?)', [
        ['USD', 'US Dollar', 'FULL', 'RBI', 'FX-2026']
      ]);
      insertRows(fixture.db, 'INSERT INTO FxReferenceRate (currency, rate_date, inr_per_unit, fx_master_version) VALUES (?, ?, ?, ?)', [
        ['USD', '2025-06-30', 85, 'FX-2026']
      ]);
      insertRows(fixture.db, 'INSERT INTO ValidationPreCheckRecord (record_id, po_number, vendor_name, raw_desc, amount, raw_currency, spend_year, issue_flag, action_status, resolved) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
        ['REC-FX', 'PO-1', 'Acme', 'Item A', 100, 'USD', 2025, 'Missing Currency Code', 'Fix Currency', 0],
        ['REC-NO-DATE', 'PO-2', 'Beta', 'Item B', 25, 'USD', null, 'Currency Review', 'Review', 0]
      ]);

      const data = await dataOf(await send('/api/ingestion/remediate', { method: 'POST' }));
      const records = data.records as Array<Record<string, unknown>>;
      const persisted = await fixture.d1.prepare('SELECT amount_inr, inr_crores, fx_rate_applied, issue_flag, action_status, resolved FROM ValidationPreCheckRecord WHERE record_id = ?').bind('REC-FX').first();
      const untouched = await fixture.d1.prepare('SELECT amount_inr, issue_flag, resolved FROM ValidationPreCheckRecord WHERE record_id = ?').bind('REC-NO-DATE').first();

      expect(data).toMatchObject({ updatedCount: 1, skippedCount: 1 });
      expect(records).toHaveLength(1);
      expect(persisted).toEqual({ amount_inr: 8500, inr_crores: 0.00085, fx_rate_applied: 85, issue_flag: 'Passed Clean', action_status: 'Ready', resolved: 1 });
      expect(untouched).toEqual({ amount_inr: null, issue_flag: 'Currency Review', resolved: 0 });
    });

    it('reports zero updates when there are no validation records to remediate', async () => {
      const data = await dataOf(await send('/api/ingestion/remediate', { method: 'POST' }));

      expect(data).toEqual({ updatedCount: 0, skippedCount: 0, records: [] });
    });

    it('updates only the supplied validation fields and keeps the rest', async () => {
      insertRows(fixture.db, 'INSERT INTO ValidationPreCheckRecord (record_id, po_number, vendor_name, raw_desc, issue_flag, action_status, resolved) VALUES (?, ?, ?, ?, ?, ?, ?)', [
        ['REC-1', 'PO-1', 'Acme', 'Item A', 'Duplicate PO', 'Review', 0]
      ]);

      const escalated = await dataOf(await send('/api/ingestion', jsonBody('PATCH', { record_id: 'REC-1', issue_flag: 'Reviewed', action_status: 'Escalated', resolved: true })));
      const resolvedOnly = await dataOf(await send('/api/ingestion', jsonBody('PATCH', { record_id: 'REC-1', resolved: false })));

      expect(escalated).toMatchObject({ record_id: 'REC-1', issue_flag: 'Reviewed', action_status: 'Escalated', resolved: true });
      expect(resolvedOnly).toMatchObject({ issue_flag: 'Reviewed', action_status: 'Escalated', resolved: false });
    });

    it('reports a missing identifier, empty update and unknown validation record', async () => {
      const missingId = await send('/api/ingestion', jsonBody('PATCH', { issue_flag: 'x' }));
      const emptyUpdate = await send('/api/ingestion', jsonBody('PATCH', { record_id: 'REC-1' }));
      const unknown = await send('/api/ingestion', jsonBody('PATCH', { record_id: 'REC-404', issue_flag: 'x' }));

      expect(missingId.status).toBe(400);
      expect(emptyUpdate.status).toBe(400);
      await expect(bodyOf(missingId)).resolves.toMatchObject({ success: false, message: 'Validation update is invalid.' });
      expect(unknown.status).toBe(404);
      await expect(bodyOf(unknown)).resolves.toEqual({ success: false, message: 'Validation record not found.' });
    });

    it('persists analyst currency, source totals, FX and description corrections', async () => {
      insertRows(fixture.db, 'INSERT INTO ValidationPreCheckRecord (record_id, po_number, vendor_name, raw_desc, order_quantity, net_price, amount, raw_currency, amount_inr, inr_crores, issue_flag, action_status, resolved) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
        ['REC-FIX', 'PO-1', 'Supplier A', 'Raw item', 2, 50, 100, 'USD', null, null, 'Missing Currency Code', 'Fix (INR)', 0]
      ]);

      const response = await send('/api/ingestion', jsonBody('PATCH', {
        record_id: 'REC-FIX', raw_currency: 'USD', amount_inr: 8300, inr_crores: 0.00083,
        fx_rate_applied: 83, raw_desc: 'Normalized item', issue_flag: 'Passed Clean', action_status: 'Ready', resolved: true
      }));

      expect(response.status).toBe(200);
      const persisted = await fixture.d1.prepare('SELECT raw_currency, amount_inr, inr_crores, fx_rate_applied, raw_desc, resolved FROM ValidationPreCheckRecord WHERE record_id = ?').bind('REC-FIX').first();
      expect(persisted).toEqual({ raw_currency: 'USD', amount_inr: 8300, inr_crores: 0.00083, fx_rate_applied: 83, raw_desc: 'Normalized item', resolved: 1 });
    });

    it('returns 503 for validation updates without a D1 binding', async () => {
      expect((await send('/api/ingestion', jsonBody('PATCH', { record_id: 'REC-1' }), runtimeEnvironment(NO_BINDING))).status).toBe(503);
    });

    it('deletes one document by identifier and returns the remaining queue', async () => {
      insertRows(fixture.db, 'INSERT INTO RawDocumentIngestion (doc_id, tenant_id, file_name, uploaded_at) VALUES (?, ?, ?, ?)', [
        ['DOC-1', 'TNT-1', 'a.xlsx', '2026-01-01T00:00:00Z'],
        ['DOC-2', 'TNT-1', 'b.xlsx', '2026-01-02T00:00:00Z']
      ]);

      const response = await send('/api/ingestion/document/DOC-1', { method: 'DELETE' });

      expect((((await bodyOf(response)).data) as Array<{ doc_id: string }>).map((row) => row.doc_id)).toEqual(['DOC-2']);
    });

    it('refuses a document delete with an empty identifier and keeps every row', async () => {
      insertRows(fixture.db, 'INSERT INTO RawDocumentIngestion (doc_id, tenant_id, file_name, uploaded_at) VALUES (?, ?, ?, ?)', [
        ['DOC-1', 'TNT-1', 'a.xlsx', '2026-01-01T00:00:00Z'],
        ['DOC-2', 'TNT-1', 'b.xlsx', '2026-01-02T00:00:00Z']
      ]);

      const response = await send('/api/ingestion/document/', { method: 'DELETE' });

      expect(response.status).toBe(400);
      await expect(bodyOf(response)).resolves.toMatchObject({ success: false });
      await expect(fixture.d1.prepare('SELECT COUNT(*) AS total FROM RawDocumentIngestion').first()).resolves.toEqual({ total: 2 });
    });

    it('clears the whole ingestion queue when no document identifier is given', async () => {
      insertRows(fixture.db, 'INSERT INTO RawDocumentIngestion (doc_id, tenant_id, file_name, uploaded_at) VALUES (?, ?, ?, ?)', [
        ['DOC-1', 'TNT-1', 'a.xlsx', '2026-01-01T00:00:00Z']
      ]);

      const response = await send('/api/ingestion', { method: 'DELETE' });

      await expect(bodyOf(response)).resolves.toMatchObject({ data: [] });
    });

    it('resets validation records without deleting uploaded documents', async () => {
      insertRows(fixture.db, 'INSERT INTO RawDocumentIngestion (doc_id, tenant_id, file_name, uploaded_at) VALUES (?, ?, ?, ?)', [
        ['DOC-KEEP', 'TNT-1', 'keep.csv', '2026-01-01T00:00:00Z']
      ]);
      insertRows(fixture.db, 'INSERT INTO ValidationPreCheckRecord (record_id, po_number, vendor_name, raw_desc) VALUES (?, ?, ?, ?)', [
        ['REC-RESET', 'PO-1', 'Supplier A', 'Item A']
      ]);

      const response = await send('/api/ingestion/validation-records', { method: 'DELETE' });

      expect(response.status).toBe(200);
      await expect(fixture.d1.prepare('SELECT COUNT(*) AS total FROM ValidationPreCheckRecord').first()).resolves.toEqual({ total: 0 });
      await expect(fixture.d1.prepare('SELECT COUNT(*) AS total FROM RawDocumentIngestion').first()).resolves.toEqual({ total: 1 });
    });

    it('returns 503 for deletes without a D1 binding', async () => {
      expect((await send('/api/ingestion', { method: 'DELETE' }, runtimeEnvironment(NO_BINDING))).status).toBe(503);
    });

    it('rejects unsupported ingestion methods with 405', async () => {
      const response = await send('/api/ingestion', { method: 'PUT' });

      expect(response.status).toBe(405);
      await expect(bodyOf(response)).resolves.toEqual({ success: false, message: 'Unsupported ingestion operation.' });
    });
  });

  describe('conversion, database and report routes', () => {
    it('returns the conversion funnel phases in phase order', async () => {
      insertRows(fixture.db, 'INSERT INTO ConversionFunnelPhase (phase_num, phase_name, platform_actionable_focus, value_outcome_delivered, commercial_lock_in_metric, completion_pct, status) VALUES (?, ?, ?, ?, ?, ?, ?)', [
        [2, 'Validate', 'Focus B', 'Value B', 'Lock B', 40, 'Active'],
        [1, 'Ingest', 'Focus A', 'Value A', 'Lock A', 100, 'Complete']
      ]);

      const response = await send('/api/conversion');

      expect(((await bodyOf(response)).data as Array<{ phase_num: number }>).map((row) => row.phase_num)).toEqual([1, 2]);
    });

    it('computes gross savings, platform fee and ROI from the posted economics', async () => {
      const response = await send('/api/conversion', jsonBody('POST', { annualSpendCr: 100, savingsRate: 10, saasFeeRate: 2 }));

      await expect(bodyOf(response)).resolves.toMatchObject({
        data: { annualSpendCr: 100, savingsRate: 10, saasFeeRate: 2, grossSavingsCr: 10, platformFeeCr: 2, netClientBenefitCr: 8, roiMultiple: 5 }
      });
    });

    it('reports zero ROI without a platform fee and treats an unreadable body as zero economics', async () => {
      const noFee = await dataOf(await send('/api/conversion', jsonBody('POST', { annualSpendCr: 50, savingsRate: 4 })));
      const unreadable = await dataOf(await send('/api/conversion', jsonRequest('POST', '{"annualSpendCr":')));

      expect(noFee).toMatchObject({ grossSavingsCr: 2, platformFeeCr: 0, roiMultiple: 0 });
      expect(unreadable).toMatchObject({ annualSpendCr: 0, grossSavingsCr: 0, netClientBenefitCr: 0, roiMultiple: 0 });
    });

    it('returns 503 for conversion stages without a D1 binding', async () => {
      expect((await send('/api/conversion', {}, runtimeEnvironment(NO_BINDING))).status).toBe(503);
    });

    it('reports connectivity, table count and record totals from the live schema', async () => {
      seedTenant();
      insertRows(fixture.db, 'INSERT INTO RawDocumentIngestion (doc_id, tenant_id, file_name, uploaded_at) VALUES (?, ?, ?, ?)', [
        ['DOC-1', 'TNT-1', 'a.xlsx', '2026-01-01T00:00:00Z'],
        ['DOC-2', 'TNT-1', 'b.xlsx', '2026-01-02T00:00:00Z']
      ]);
      insertRows(fixture.db, 'INSERT INTO ValidationPreCheckRecord (record_id, po_number, vendor_name, raw_desc) VALUES (?, ?, ?, ?)', [
        ['REC-1', 'PO-1', 'Acme', 'Item A']
      ]);
      const tables = await fixture.d1.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").first<{ n: number }>();

      const data = await dataOf(await send('/api/db/status', {}, runtimeEnvironment({ DB: fixture.d1, D1_DATABASE_NAME: 'consulting-dev' })));

      expect(data).toMatchObject({
        isConnected: true,
        provider: 'Cloudflare D1',
        databaseName: 'consulting-dev',
        tablesCount: tables?.n,
        totalRecords: 4
      });
    });

    it('reports a null database name when the binding name is not configured', async () => {
      const data = await dataOf(await send('/api/db/status'));

      expect(data.databaseName).toBeNull();
    });

    it('reports a missing binding on the status path with its own message', async () => {
      const response = await send('/api/db/status', {}, runtimeEnvironment(NO_BINDING));

      expect(response.status).toBe(503);
      await expect(bodyOf(response)).resolves.toEqual({ success: false, message: 'Cloudflare D1 binding DB is not configured.' });
    });

    it('describes each table with its columns and original DDL on the schema path', async () => {
      const tables = (await bodyOf(await send('/api/db/schema'))).data as Array<{ entity_name: string; primary_attributes: string; ddl: string; system_usage: string; sample_records: unknown[] }>;
      const tenant = tables.find((table) => table.entity_name === 'TenantMaster');

      expect(tenant).toMatchObject({ system_usage: 'Cloudflare D1', sample_records: [] });
      expect(tenant?.primary_attributes.startsWith('tenant_id, enterprise_name')).toBe(true);
      expect(tenant?.ddl).toMatch(/^CREATE TABLE TenantMaster \(/u);
    });

    it.each(['/api/db/init', '/api/db/seed'])('refuses %s because deployment owns schema changes', async (path) => {
      const response = await send(path, { method: 'POST' });

      expect(response.status).toBe(405);
      await expect(bodyOf(response)).resolves.toMatchObject({ success: false, message: expect.stringContaining('deployment operations') });
    });

    it('reports whether the binding is present on the connection probe', async () => {
      await expect(bodyOf(await send('/api/db/test-connection'))).resolves.toMatchObject({ data: { success: true, provider: 'Cloudflare D1' } });
      await expect(bodyOf(await send('/api/db/test-connection', {}, runtimeEnvironment(NO_BINDING)))).resolves.toMatchObject({ data: { success: false } });
    });

    it('returns the query metrics placeholder for other database subpaths', async () => {
      await expect(bodyOf(await send('/api/db/metrics'))).resolves.toMatchObject({ data: { metrics: { totalQueries: 0, recentAudits: [] }, cacheSize: 0 } });
    });

    it('summarises spend, savings and audited lines for the report', async () => {
      seedTenant('TNT-1', '2026-01-01T00:00:00Z', 42.5);
      insertRows(fixture.db, 'INSERT INTO RawDocumentIngestion (doc_id, tenant_id, file_name, uploaded_at, converted_inr_crores) VALUES (?, ?, ?, ?, ?)', [
        ['DOC-1', 'TNT-1', 'a.xlsx', '2026-01-01T00:00:00Z', 10],
        ['DOC-2', 'TNT-1', 'b.xlsx', '2026-01-02T00:00:00Z', 2.5]
      ]);
      insertRows(fixture.db, 'INSERT INTO ValidationPreCheckRecord (record_id, po_number, vendor_name, raw_desc) VALUES (?, ?, ?, ?)', [
        ['REC-1', 'PO-1', 'Acme', 'Item A'],
        ['REC-2', 'PO-2', 'Beta', 'Item B'],
        ['REC-3', 'PO-3', 'Gamma', 'Item C']
      ]);
      insertRows(fixture.db, 'INSERT INTO SavingsOpportunity (opp_id, category, est_savings_inr_cr) VALUES (?, ?, ?)', [
        ['OPP-1', 'Logistics', 1.25],
        ['OPP-2', 'Packaging', 2.5]
      ]);
      insertRows(fixture.db, 'INSERT INTO CategoryYearDetail (id, rank, category, total_3yr_spend_inr_cr) VALUES (?, ?, ?, ?)', [
        ['CD-1', 1, 'Chemicals', 50]
      ]);

      const data = await dataOf(await send('/api/report'));

      expect(data.executiveSummary).toEqual({ totalSpendEvaluatedCr: 12.5, totalIdentifiedSavingsCr: 3.75, totalLineItemsAudited: 3 });
      expect(data.tenant).toMatchObject({ tenant_id: 'TNT-1' });
      expect(data.categoryHighlights).toHaveLength(1);
      expect((data.topActionableOpportunities as Array<{ opp_id: string }>).map((row) => row.opp_id)).toEqual(['OPP-2', 'OPP-1']);
    });

    it('falls back to the tenant spend and then to zero when no ingestion totals exist', async () => {
      seedTenant('TNT-1', '2026-01-01T00:00:00Z', 42.5);

      const withTenantTotal = await dataOf(await send('/api/report'));
      fixture.db.prepare('UPDATE TenantMaster SET total_spend_evaluated_inr = NULL').run();
      const withoutTotal = await dataOf(await send('/api/report'));

      expect(withTenantTotal.executiveSummary).toMatchObject({ totalSpendEvaluatedCr: 42.5, totalLineItemsAudited: 0 });
      expect(withoutTotal.executiveSummary).toMatchObject({ totalSpendEvaluatedCr: 0, totalIdentifiedSavingsCr: 0 });
    });

    it('returns 503 for the report without a D1 binding', async () => {
      expect((await send('/api/report', {}, runtimeEnvironment(NO_BINDING))).status).toBe(503);
    });
  });

  describe('static data, currency and category routes', () => {
    it('lists spend categories by spend and their yearly detail by rank', async () => {
      insertRows(fixture.db, 'INSERT INTO SpendCategorySummary (id, name, spend_inr_crores) VALUES (?, ?, ?)', [
        ['CAT-A', 'Packaging', 20],
        ['CAT-B', 'Chemicals', 50]
      ]);
      insertRows(fixture.db, 'INSERT INTO CategoryYearDetail (id, rank, category, total_3yr_spend_inr_cr) VALUES (?, ?, ?, ?)', [
        ['CD-2', 2, 'Packaging', 20],
        ['CD-1', 1, 'Chemicals', 50]
      ]);

      const data = await dataOf(await send('/api/categories'));

      expect((data.categories as Array<{ name: string }>).map((row) => row.name)).toEqual(['Chemicals', 'Packaging']);
      expect((data.categoryDetails as Array<{ category: string }>).map((row) => row.category)).toEqual(['Chemicals', 'Packaging']);
    });

    it('lists vendor rankings and vendor detail by spend', async () => {
      insertRows(fixture.db, 'INSERT INTO VendorPriceRank (vendor_name, master_id, category, total_spend_inr_cr) VALUES (?, ?, ?, ?)', [
        ['Vendor A', 'MV-1', 'Chemicals', 10],
        ['Vendor B', 'MV-2', 'Packaging', 30]
      ]);
      insertRows(fixture.db, 'INSERT INTO VendorYearDetail (id, rank, vendor_name, master_vendor_id, primary_category, total_3yr_spend_inr_cr) VALUES (?, ?, ?, ?, ?, ?)', [
        ['VD-1', 1, 'Vendor A', 'MV-1', 'Chemicals', 15],
        ['VD-2', 2, 'Vendor B', 'MV-2', 'Packaging', 40]
      ]);

      const data = await dataOf(await send('/api/vendors'));

      expect((data.vendorRankings as Array<{ vendor_name: string }>).map((row) => row.vendor_name)).toEqual(['Vendor B', 'Vendor A']);
      expect((data.vendorDetails as Array<{ vendor_name: string }>).map((row) => row.vendor_name)).toEqual(['Vendor B', 'Vendor A']);
    });

    it('persists supplier-master merges in vendor rankings and details', async () => {
      insertRows(fixture.db, 'INSERT INTO VendorYearDetail (id, rank, vendor_name, master_vendor_id, primary_category) VALUES (?, ?, ?, ?, ?)', [
        ['VD-1', 1, 'Acme Steel Ltd', 'MV-1', 'Steel'],
        ['VD-2', 2, 'Acme Metals', 'MV-1', 'Alloys']
      ]);
      insertRows(fixture.db, 'INSERT INTO VendorPriceRank (vendor_name, master_id, category) VALUES (?, ?, ?)', [
        ['Acme Steel Ltd', 'MV-1', 'Steel']
      ]);

      const response = await send('/api/vendors', jsonBody('POST', {
        targetName: 'Acme Steel Ltd', masterId: 'MV-1', canonicalName: 'Acme Steel'
      }));

      expect(response.status).toBe(200);
      await expect(bodyOf(response)).resolves.toMatchObject({ success: true, data: { success: true, affected: 3 } });
      await expect(fixture.d1.prepare('SELECT vendor_name FROM VendorYearDetail ORDER BY id').all())
        .resolves.toEqual({ results: [{ vendor_name: 'Acme Steel' }, { vendor_name: 'Acme Steel' }] });
      await expect(fixture.d1.prepare('SELECT vendor_name FROM VendorPriceRank WHERE master_id = ?').bind('MV-1').first())
        .resolves.toEqual({ vendor_name: 'Acme Steel' });
    });

    it('validates supplier merges and rejects missing masters or unsupported methods', async () => {
      const invalid = await send('/api/vendors', jsonBody('POST', { targetName: '', masterId: '', canonicalName: '' }));
      const missing = await send('/api/vendors', jsonBody('POST', {
        targetName: 'Unknown', masterId: 'MV-MISSING', canonicalName: 'Unknown'
      }));
      const unsupported = await send('/api/vendors', { method: 'DELETE' });

      expect(invalid.status).toBe(400);
      expect(missing.status).toBe(404);
      expect(unsupported.status).toBe(405);
    });

    it('totals savings opportunities and counts unpriced rows as zero', async () => {
      insertRows(fixture.db, 'INSERT INTO SavingsOpportunity (opp_id, category, est_savings_inr_cr) VALUES (?, ?, ?)', [
        ['OPP-1', 'Logistics', 2.5],
        ['OPP-2', 'Packaging', null]
      ]);

      const data = await dataOf(await send('/api/savings'));

      expect(data).toMatchObject({ totalPotentialSavingsCr: 2.5 });
      expect(data.opportunities).toHaveLength(2);
    });

    it('persists savings opportunity deployment and validates missing or unsupported requests', async () => {
      insertRows(fixture.db, 'INSERT INTO SavingsOpportunity (opp_id, category, title, est_savings_inr_cr, recommended_module, push_to_module, status) VALUES (?, ?, ?, ?, ?, ?, ?)', [
        ['OPP-DEPLOY', 'Logistics', 'Carrier review', 2.5, 'proCPX', 'proCPX', 'Identified']
      ]);

      const deployed = await send('/api/savings', jsonBody('POST', { opp_id: 'OPP-DEPLOY', targetModule: 'DPS NXT' }));
      const persisted = await fixture.d1.prepare('SELECT recommended_module, push_to_module, status FROM SavingsOpportunity WHERE opp_id = ?')
        .bind('OPP-DEPLOY').first();
      const invalid = await send('/api/savings', jsonBody('POST', { opp_id: '', targetModule: 'unknown' }));
      const missing = await send('/api/savings', jsonBody('POST', { opp_id: 'OPP-MISSING', targetModule: 'proCPX' }));
      const unsupported = await send('/api/savings', { method: 'DELETE' });

      expect(deployed.status).toBe(200);
      await expect(bodyOf(deployed)).resolves.toMatchObject({ data: {
        opp_id: 'OPP-DEPLOY', recommended_module: 'DPS NXT', push_to_module: 'DPS NXT', status: 'DEPLOYED'
      } });
      expect(persisted).toEqual({ recommended_module: 'DPS NXT', push_to_module: 'DPS NXT', status: 'DEPLOYED' });
      expect(invalid.status).toBe(400);
      expect(missing.status).toBe(404);
      expect(unsupported.status).toBe(405);
    });

    it.each([
      ['categories', '/api/categories'],
      ['vendors', '/api/vendors'],
      ['savings', '/api/savings'],
      ['currency rates', '/api/currency'],
      ['report', '/api/report'],
      ['category mappings', '/api/procurement/category-mappings'],
      ['taxonomy', '/api/taxonomy?q=acid'],
      ['conversion stages', '/api/conversion'],
      ['database schema', '/api/db/schema']
    ])('answers 503 for %s when initialisation is skipped and no binding exists', async (_label, path) => {
      vi.mocked(ensureD1Initialized).mockResolvedValueOnce(undefined);

      const response = await send(path, {}, runtimeEnvironment(NO_BINDING));

      expect(response.status).toBe(503);
    });

    it('converts amounts with the latest rate and rejects currencies without reference data', async () => {
      insertRows(fixture.db, 'INSERT INTO FxCurrencyMaster (currency, currency_name, coverage_status, approved_source, fx_master_version) VALUES (?, ?, ?, ?, ?)', [
        ['USD', 'US Dollar', 'FULL', 'RBI', 'FX-2026']
      ]);
      insertRows(fixture.db, 'INSERT INTO FxReferenceRate (currency, rate_date, inr_per_unit, source_name, fx_master_version) VALUES (?, ?, ?, ?, ?)', [
        ['USD', '2025-06-30', 83, 'RBI', 'FX-2026'],
        ['USD', '2026-02-01', 86.5, 'Yahoo', 'FX-2026']
      ]);

      const rates = await dataOf(await send('/api/currency'));
      const converted = await dataOf(await send('/api/currency?from=usd&amount=100'));
      const historical = await dataOf(await send('/api/currency?from=USD&amount=100&date=2025-12-31'));
      const tooEarly = await send('/api/currency?from=USD&amount=100&year=2020');
      const unknown = await send('/api/currency?from=EUR&amount=1');
      const invalid = await send('/api/currency?from=US&amount=-1');
      const noAmount = await dataOf(await send('/api/currency?from=USD'));

      expect(rates.USD).toMatchObject({ currentRate: 86.5 });
      expect(converted).toMatchObject({ amount: 100, fromCurrency: 'USD', amountINR: 8650, exchangeRate: 86.5 });
      expect(historical).toMatchObject({ amountINR: 8300, exchangeRate: 83, rateDate: '2025-06-30' });
      await expect(bodyOf(tooEarly)).resolves.toMatchObject({ message: D1_ROUTE_MESSAGES.currencyRateUnavailable('USD', '2020-12-31') });
      expect(tooEarly.status).toBe(400);
      expect(unknown.status).toBe(400);
      await expect(bodyOf(unknown)).resolves.toMatchObject({ success: false, message: D1_ROUTE_MESSAGES.currencyNotFound('EUR') });
      expect(invalid.status).toBe(400);
      expect(noAmount).toMatchObject({ amount: 0, amountINR: 0 });
    });

    it('serves procurement category mappings and passes the caller request id through', async () => {
      insertRows(fixture.db, 'INSERT INTO ProcurementCategoryMapping (material_group_code, category_name) VALUES (?, ?)', [
        ['P11', 'Packing']
      ]);

      const response = await send('/api/procurement/category-mappings', { headers: { 'x-request-id': 'req-7' } });

      expect(response.status).toBe(200);
      await expect(bodyOf(response)).resolves.toMatchObject({ data: { mappings: { P11: 'Packing' }, categories: ['Packing'] } });
    });

    it('returns the Module 1 canonical dataset and reports incomplete or unknown datasets', async () => {
      seedMetrics();

      const canonical = await dataOf(await send('/api/ingestion/canonical'));
      const unknownAssessment = await send('/api/ingestion/canonical?assessmentId=AIC-404');
      const headerScoped = await send('/api/ingestion/canonical', { headers: { 'x-assessment-id': 'AIC-404' } });
      const invalid = await send(`/api/ingestion/canonical?assessmentId=${'x'.repeat(121)}`);

      expect(canonical).toMatchObject({ totalSpendCr: 100, billingMonths: 12 });
      expect(unknownAssessment.status).toBe(500);
      await expect(bodyOf(unknownAssessment)).resolves.toEqual({ success: false, message: D1_ROUTE_MESSAGES.missingCanonical('AIC-404') });
      expect(headerScoped.status).toBe(500);
      expect(invalid.status).toBe(400);
      await expect(bodyOf(invalid)).resolves.toMatchObject({ success: false, message: 'Validation failed', errors: expect.any(Array) });
    });

    it('reports an incomplete seed as a server error on the canonical dataset', async () => {
      const response = await send('/api/ingestion/canonical');

      expect(response.status).toBe(500);
      await expect(bodyOf(response)).resolves.toEqual({ success: false, message: 'D1 seed is missing required dataset metric: totalSpendCr' });
    });

    it('returns 503 for the canonical dataset without a D1 binding', async () => {
      expect((await send('/api/ingestion/canonical', {}, runtimeEnvironment(NO_BINDING))).status).toBe(503);
    });
  });

  describe('taxonomy and GraphQL routes', () => {
    it('searches the commodity catalogue and echoes the caller request id', async () => {
      seedCommodities();

      const response = await send('/api/taxonomy?q=acid&category=Direct%20Materials&limit=10&offset=0', { headers: { 'x-request-id': 'req-tax-1' } });

      expect(response.headers.get('x-request-id')).toBe('req-tax-1');
      await expect(bodyOf(response)).resolves.toMatchObject({ success: true, total: 1, data: [{ commodityCode: '11101501' }] });
    });

    it('generates a request id when the caller omits one and returns a single record for lookups', async () => {
      seedCommodities();

      const found = await send('/api/taxonomy?lookup=11101501');
      const missing = await send('/api/taxonomy?lookup=NOPE');

      expect(found.headers.get('x-request-id')).toMatch(/^[0-9a-f-]{36}$/u);
      await expect(bodyOf(found)).resolves.toMatchObject({ success: true, data: { commodityCode: '11101501' }, total: 1 });
      await expect(bodyOf(missing)).resolves.toMatchObject({ success: true, data: null, total: 0 });
    });

    it('rejects invalid taxonomy queries before reading the database', async () => {
      const response = await send('/api/taxonomy?limit=0', {}, runtimeEnvironment(NO_BINDING));

      expect(response.status).toBe(400);
      await expect(bodyOf(response)).resolves.toMatchObject({ success: false, message: 'Validation failed' });
    });

    it('executes GraphQL over POST and GET against the tenant-scoped context', async () => {
      seedTenant();

      const posted = await send('/api/graphql', jsonBody('POST', { query: '{ __typename }' }));
      const fetched = await send(`/api/graphql?query=${encodeURIComponent('{ __typename }')}`);

      expect(posted.status).toBe(200);
      await expect(bodyOf(posted)).resolves.toEqual({ data: { __typename: 'Query' } });
      await expect(bodyOf(fetched)).resolves.toEqual({ data: { __typename: 'Query' } });
    });

    it('returns GraphQL validation errors in the response envelope', async () => {
      seedTenant();

      const response = await send('/api/graphql', jsonBody('POST', { query: '{ noSuchField }' }));

      expect(response.status).toBe(200);
      expect((await bodyOf(response)).errors).toEqual([expect.objectContaining({ message: expect.stringContaining('noSuchField') })]);
    });

    it.each([
      ['a POST without a query', 'POST', undefined],
      ['a GET without a query parameter', 'GET', undefined],
      ['an unsupported method', 'PUT', JSON.stringify({ query: '{ __typename }' })]
    ])('requires a GraphQL query for %s', async (_label, method, body) => {
      seedTenant();
      const init: RequestInit = body === undefined ? { method } : jsonRequest(method, body);

      const response = await send('/api/graphql', init);

      expect(response.status).toBe(400);
      await expect(bodyOf(response)).resolves.toEqual({ errors: [{ message: 'GraphQL query is required' }] });
    });

    it('reports a missing tenant or missing binding as a GraphQL error', async () => {
      const noTenant = await send('/api/graphql', jsonBody('POST', { query: '{ __typename }' }));
      const noBinding = await send('/api/graphql', jsonBody('POST', { query: '{ __typename }' }), runtimeEnvironment(NO_BINDING));

      expect(noTenant.status).toBe(500);
      await expect(bodyOf(noTenant)).resolves.toEqual({ errors: [{ message: 'D1 seed does not contain a tenant record' }] });
      expect(noBinding.status).toBe(500);
      await expect(bodyOf(noBinding)).resolves.toEqual({ errors: [{ message: D1_ROUTE_MESSAGES.missingBinding }] });
    });

    it('reports non-Error GraphQL failures by their string value', async () => {
      seedTenant();
      vi.mocked(getTenantFromD1).mockRejectedValueOnce('tenant service down');

      const response = await send('/api/graphql', jsonBody('POST', { query: '{ __typename }' }));

      expect(response.status).toBe(500);
      await expect(bodyOf(response)).resolves.toEqual({ errors: [{ message: 'tenant service down' }] });
    });

    it('answers 503 for taxonomy and GraphQL when the binding is absent after initialisation was skipped', async () => {
      vi.mocked(ensureD1Initialized).mockResolvedValueOnce(undefined);
      const taxonomy = await send('/api/taxonomy?q=acid', {}, runtimeEnvironment(NO_BINDING));

      vi.mocked(ensureD1Initialized).mockResolvedValueOnce(undefined);
      const graphql = await send(`/api/graphql?query=${encodeURIComponent('{ __typename }')}`, {}, runtimeEnvironment(NO_BINDING));

      expect(taxonomy.status).toBe(503);
      expect(graphql.status).toBe(503);
      await expect(bodyOf(graphql)).resolves.toEqual({ errors: [{ message: 'Cloudflare D1 binding DB is not configured.' }] });
    });
  });

  describe('module dispatch and status passthrough', () => {
    it('forwards module2 sub-paths to the module and returns its payload', async () => {
      vi.mocked(handleModule2Route).mockResolvedValueOnce({ data: { rows: [1, 2] } });

      const response = await send('/api/module2/datasets?limit=2');

      expect(response.status).toBe(200);
      await expect(bodyOf(response)).resolves.toMatchObject({ success: true, data: { rows: [1, 2] } });
      expect(vi.mocked(handleModule2Route).mock.calls[0]?.[0]).toBe(fixture.d1);
      expect(vi.mocked(handleModule2Route).mock.calls[0]?.[1]).toBe('/datasets');
    });

    it('returns module2 binary exports directly with CORS headers', async () => {
      const file = new Response(new Uint8Array([0x50, 0x4b]), {
        status: 200,
        headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
      });
      vi.mocked(handleModule2Route).mockResolvedValueOnce({ data: null, response: file });

      const response = await send('/api/module2/sourcing/volume-aggregation/export-excel?assessmentId=A1', {
        headers: { Origin: 'https://app.example.com' }
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toContain('spreadsheetml.sheet');
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://app.example.com');
      expect([...new Uint8Array(await response.arrayBuffer())]).toEqual([0x50, 0x4b]);
    });

    it('uses the root sub-path for bare module routes and surfaces module status codes unchanged', async () => {
      vi.mocked(handleModule2Route).mockResolvedValueOnce({ data: { message: 'bad input' }, status: 422 });
      vi.mocked(handlePcbiRoute).mockResolvedValueOnce({ data: { items: [] } });

      const module2 = await send('/api/module2');
      const pcbi = await send('/api/pcbi');

      expect(module2.status).toBe(422);
      await expect(bodyOf(module2)).resolves.toEqual({ message: 'bad input' });
      expect(pcbi.status).toBe(200);
      await expect(bodyOf(pcbi)).resolves.toMatchObject({ data: { items: [] } });
      expect(vi.mocked(handleModule2Route).mock.calls[0]?.[1]).toBe('/');
      expect(vi.mocked(handlePcbiRoute).mock.calls[0]?.[1]).toBe('/');
    });

    it('dispatches assessment and customer sub-paths, restoring the customer prefix', async () => {
      vi.mocked(handleAssessmentRoute)
        .mockResolvedValueOnce({ data: { scope: 'assessment' } })
        .mockResolvedValueOnce({ data: { scope: 'customer' } })
        .mockResolvedValueOnce({ data: { scope: 'customers' } });

      await send('/api/assessment/A1');
      await send('/api/customers/C1');
      await send('/api/customers');

      expect(vi.mocked(handleAssessmentRoute).mock.calls.map((call) => call[1])).toEqual(['/A1', '/customers/C1', '/customers']);
    });

    it('returns the assessment module status code for conflicting requests', async () => {
      vi.mocked(handleAssessmentRoute).mockResolvedValueOnce({ data: { message: 'conflict' }, status: 409 });

      const response = await send('/api/assessment/A1');

      expect(response.status).toBe(409);
    });

    it('routes savings and crypto sub-paths to their handlers', async () => {
      insertRows(fixture.db, 'INSERT INTO SavingsOpportunity (opp_id, category, est_savings_inr_cr) VALUES (?, ?, ?)', [
        ['OPP-1', 'Logistics', 2.5]
      ]);

      const consolidated = await dataOf(await send('/api/savings/consolidated'));
      const invalidStatus = await send('/api/savings/opportunity/status', jsonBody('POST', {}));
      const ready = await dataOf(await send('/api/crypto'));
      const badEncrypt = await send('/api/crypto/encrypt', jsonBody('POST', {}));

      expect(consolidated).toMatchObject({ totalGrossSavingsCr: 2.5 });
      expect(invalidStatus.status).toBe(400);
      expect(ready).toEqual({ message: 'Crypto endpoint ready' });
      expect(badEncrypt.status).toBe(400);
    });
  });

  describe('AI routes', () => {
    it('reports whether Gemini is configured and the model chain taken from the environment', async () => {
      const unconfigured = await send('/api/ai/config');
      const configured = await send('/api/ai/config', {}, environmentWithDb({ GEMINI_API_KEY: 'test-key' }));

      await expect(bodyOf(unconfigured)).resolves.toEqual({
        success: true,
        configured: false,
        primaryModel: 'gemini-test-primary',
        fallbackModels: ['gemini-test-fallback']
      });
      await expect(bodyOf(configured)).resolves.toMatchObject({ configured: true });
    });

    it('reports a null primary model when the model chain is empty', async () => {
      vi.spyOn(geminiService, 'resolveModelChain').mockReturnValueOnce([]);

      await expect(bodyOf(await send('/api/ai/config'))).resolves.toMatchObject({ primaryModel: null, fallbackModels: [] });
    });

    it('reports extraction failures with the AI failure status and the upstream message', async () => {
      vi.spyOn(geminiService, 'extractLineItems').mockRejectedValueOnce(new Error('gemini unreachable'));

      const response = await send('/api/ai/extract', jsonBody('POST', { documentText: 'Invoice' }));

      expect(response.status).toBe(500);
      await expect(bodyOf(response)).resolves.toEqual({
        success: false,
        status: EXTRACTION_STATUS.AI_FAILED,
        items: [],
        error: 'gemini unreachable'
      });
    });

    it('reports categorisation failures with the classification failure status', async () => {
      vi.spyOn(aiCategorizationService, 'categorizeLineItems').mockRejectedValueOnce(new Error('categorizer down'));

      const response = await send('/api/ai/categorize', jsonBody('POST', { items: [{ rawLineText: 'Ball bearings' }] }));

      expect(response.status).toBe(500);
      await expect(bodyOf(response)).resolves.toEqual({
        success: false,
        status: CLASSIFICATION_STATUS.AI_FAILED,
        mappings: [],
        error: 'categorizer down'
      });
    });

    it('reports executive summary failures with a null data payload', async () => {
      const { aiReportService } = await import('../src/services/aiReportService');
      vi.spyOn(aiReportService, 'generateExecutiveSummary').mockRejectedValueOnce(new Error('report model timeout'));

      const response = await send('/api/ai/executive-summary', jsonBody('POST', { tenantName: 'Acme', totalSpendInrCr: 10 }));

      expect(response.status).toBe(500);
      await expect(bodyOf(response)).resolves.toEqual({
        success: false,
        status: EXTRACTION_STATUS.AI_FAILED,
        data: null,
        error: 'report model timeout'
      });
    });

    it('reports anomaly detection failures with an empty anomaly list', async () => {
      vi.spyOn(aiAnomalyService, 'analyzeAnomalies').mockRejectedValueOnce(new Error('anomaly service offline'));

      const response = await send('/api/ai/analyze-anomalies', jsonBody('POST', { records: [] }));

      expect(response.status).toBe(500);
      await expect(bodyOf(response)).resolves.toEqual({
        success: false,
        status: EXTRACTION_STATUS.AI_FAILED,
        anomalies: [],
        error: 'anomaly service offline'
      });
    });

    it('falls back to a generic AI message when the failure carries no message', async () => {
      vi.spyOn(geminiService, 'extractLineItems').mockRejectedValueOnce('opaque failure');

      const response = await send('/api/ai/extract', jsonBody('POST', {}));

      await expect(bodyOf(response)).resolves.toMatchObject({ error: 'Internal AI Extraction Error' });
    });

    it('marks extraction successful only when the service reports success', async () => {
      vi.spyOn(geminiService, 'extractLineItems').mockResolvedValueOnce({
        status: EXTRACTION_STATUS.SUCCESS,
        items: [],
        model: 'gemini-test-primary',
        documentTitle: null,
        detectedCurrency: null,
        totalSpend: null,
        error: null
      });

      const success = await send('/api/ai/extract', jsonBody('POST', { documentText: 'Invoice' }));
      const unconfigured = await send('/api/ai/extract', jsonBody('POST', { documentText: 'Invoice' }));

      await expect(bodyOf(success)).resolves.toMatchObject({ success: true, status: EXTRACTION_STATUS.SUCCESS, durationMs: expect.any(Number) });
      await expect(bodyOf(unconfigured)).resolves.toMatchObject({ success: false, status: EXTRACTION_STATUS.NOT_CONFIGURED });
    });

    it('passes an unreadable extraction body to the service as empty inputs', async () => {
      const extract = vi.spyOn(geminiService, 'extractLineItems');

      const response = await send('/api/ai/extract', jsonRequest('POST', '{"documentText":'));

      expect(response.status).toBe(200);
      expect(extract).toHaveBeenCalledWith({ documentText: undefined, inlineData: undefined, mimeType: undefined, fileName: undefined });
    });

    it('marks categorisation successful and forwards the parsed items', async () => {
      const categorize = vi.spyOn(aiCategorizationService, 'categorizeLineItems').mockResolvedValueOnce({
        status: CLASSIFICATION_STATUS.SUCCESS,
        mappings: [],
        model: null,
        error: null
      });

      const response = await send('/api/ai/categorize', jsonBody('POST', { items: [{ rawLineText: 'Ball bearings' }] }));

      await expect(bodyOf(response)).resolves.toMatchObject({ success: true, status: CLASSIFICATION_STATUS.SUCCESS });
      expect(categorize).toHaveBeenCalledWith([{ rawLineText: 'Ball bearings' }]);
    });

    it('reports that no anomalies can be analysed when no records are supplied', async () => {
      const response = await send('/api/ai/analyze-anomalies', jsonBody('POST', { records: [] }));

      await expect(bodyOf(response)).resolves.toMatchObject({ success: false, status: EXTRACTION_STATUS.NO_CONTENT, anomalies: [] });
    });

    it('answers 404 for unknown AI paths and for AI endpoints called with the wrong method', async () => {
      expect((await send('/api/ai/unknown', { method: 'POST' })).status).toBe(404);
      expect((await send('/api/ai/extract')).status).toBe(404);
    });

    it('wires the taxonomy lookup to the D1 catalogue only when a binding exists', async () => {
      seedCommodities();
      const configure = vi.spyOn(aiCategorizationService, 'configureTaxonomyLookup');

      await send('/api/ai/config');
      await send('/api/ai/config', {}, runtimeEnvironment(NO_BINDING));
      const lookup = configure.mock.calls[0]?.[0];

      if (typeof lookup !== 'function') throw new Error('expected a taxonomy lookup when a binding exists');
      await expect(lookup('11101501')).resolves.toMatchObject({ commodityCode: '11101501' });
      expect(configure.mock.calls[1]?.[0]).toBeUndefined();
    });
  });

  describe('authentication and admin routes', () => {
    it('requires a token for profile reads and administrator rights for the registry', async () => {
      expect((await send('/api/auth/me')).status).toBe(401);
      expect((await send('/api/admin/users')).status).toBe(403);
    });

    it('returns 503 for auth routes without a D1 binding', async () => {
      const response = await send('/api/auth/login', jsonBody('POST', { email: 'a@example.com', password: 'Secret123' }), runtimeEnvironment(NO_BINDING));

      expect(response.status).toBe(503);
    });
  });
});
