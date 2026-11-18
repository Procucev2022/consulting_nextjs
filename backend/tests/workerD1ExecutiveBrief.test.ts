import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handleExecutiveBriefRoute } from '../src/workerD1ExecutiveBrief';
import {
  EXECUTIVE_BRIEF_HTTP_STATUS,
  EXECUTIVE_BRIEF_MESSAGES
} from '../src/constants/executiveBriefRouteConstants';
import {
  EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES,
  EXECUTIVE_OPPORTUNITY_BRIEF_SQL
} from '../src/constants/executiveOpportunityBriefConstants';
import {
  EXECUTIVE_BRIEF_ARTIFACT_FILENAMES,
  EXECUTIVE_BRIEF_CONTENT_TYPES
} from '../src/constants/executiveBriefExportConstants';
import type { CloudflareEnvironment, CloudflareExecutionContext } from '../src/types/cloudflare';
import { fetch as workerFetch } from '../src/worker';
import { createWorkerAuthToken } from '../src/workerAuth';
import { createWorkerDatabase, insertRows, runtimeEnvironment, WORKER_CORE_SECRET } from './helpers/workerCoreFixtures';
import { adminToken, briefRequest, briefUrl, testEnvironment, TEST_REPORT_DATE, userToken } from './executiveBriefTestHelpers';

vi.mock('../src/utils/logger', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}));

const OFFICIAL_PDF_NAME = `Executive_Opportunity_Brief_D1_Enterprise_${TEST_REPORT_DATE}.pdf`;
const OFFICIAL_PPTX_NAME = OFFICIAL_PDF_NAME.replace(/\.pdf$/u, '.pptx');
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u;

const callRoute = async (
  method: string,
  path: string,
  options: { query?: string; headers?: Record<string, string>; env?: CloudflareEnvironment } = {}
): Promise<Response | null> => {
  const token = await adminToken();
  const headers = { Authorization: 'Bearer ' + token, ...options.headers };
  const request = briefRequest(method, path, { query: options.query, headers });
  return handleExecutiveBriefRoute(request, options.env ?? testEnvironment(), briefUrl(path, options.query ?? ''));
};

const expectResponse = (response: Response | null): Response => {
  expect(response).not.toBeNull();
  return response as Response;
};

const d1OpportunityDb = (options: {
  tenants?: Array<{ tenant_id: string; enterprise_name: string }>;
  transactionCount?: number;
  classification?: string;
  fail?: boolean;
} = {}): CloudflareEnvironment['DB'] => ({
  prepare: (query: string) => {
    let values: unknown[] = [];
    const statement = {
      bind: (...boundValues: unknown[]) => { values = boundValues; return statement; },
      first: async <T>() => {
        if (query.includes('FROM User')) {
          const userId = String(values[0]);
          return {
            id: userId,
            name: userId === 'usr-standard-test' ? 'D1 Standard User' : 'D1 Test Admin',
            email: userId === 'usr-standard-test' ? 'user@example.test' : 'admin@example.test',
            role: userId === 'usr-standard-test' ? 'USER' : 'ADMIN',
            status: 'ACTIVE',
            tenant_id: 'TEN-1'
          } as T;
        }
        if (options.fail) throw new Error('D1 query failed');
        if (query === EXECUTIVE_OPPORTUNITY_BRIEF_SQL.tenant) {
          const tenantId = String(values[0]);
          return ((options.tenants ?? [{ tenant_id: 'TEN-1', enterprise_name: 'D1 Enterprise' }])
            .find((tenant) => tenant.tenant_id === tenantId) ?? null) as T | null;
        }
        if (query === EXECUTIVE_OPPORTUNITY_BRIEF_SQL.transactionMetrics) {
          return {
            transaction_count: options.transactionCount ?? 12,
            total_spend_cr: 125.5,
            supplier_count: 4,
            material_count: 6,
            plant_count: 2,
            purchase_order_count: 9,
            first_transaction_date: '2024-01-01',
            last_transaction_date: '2025-12-31'
          } as T;
        }
        if (query === EXECUTIVE_OPPORTUNITY_BRIEF_SQL.opportunityMetrics) {
          return { opportunity_count: 2, estimated_savings_cr: 10.25, average_confidence: 0.87 } as T;
        }
        if (query === EXECUTIVE_OPPORTUNITY_BRIEF_SQL.tenantProvenance) {
          return { classification: options.classification ?? 'DEMO_ONLY' } as T;
        }
        return null;
      },
      all: async <T>() => {
        if (options.fail) throw new Error('D1 query failed');
        if (query === EXECUTIVE_OPPORTUNITY_BRIEF_SQL.opportunities) {
          return {
            results: [{
              opp_id: 'OPP-1', category: 'Packaging', title: 'Packaging sourcing', current_spend_cr: 50,
              estimated_savings_cr: 8, lever: 'Strategic sourcing', recommended_action: 'Launch a tender',
              status: 'Identified', risk_level: 'Medium', confidence_score: 0.9
            }, {
              opp_id: 'OPP-2', category: 'Logistics', title: null, current_spend_cr: null,
              estimated_savings_cr: 2.25, lever: null, recommended_action: null,
              status: null, risk_level: null, confidence_score: null
            }] as T[]
          };
        }
        const label = query === EXECUTIVE_OPPORTUNITY_BRIEF_SQL.leverBreakdown
          ? 'Strategic sourcing'
          : query === EXECUTIVE_OPPORTUNITY_BRIEF_SQL.statusBreakdown
            ? 'Identified'
            : 'Medium';
        return { results: [{ label, record_count: 2, estimated_savings_cr: 10.25 }] as T[] };
      },
      run: async () => ({ success: true })
    };
    return statement;
  }
});

describe('executive brief routing', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-24T09:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('returns null for paths outside the executive brief routes so the Worker answers 404', async () => {
    const env = testEnvironment();
    const outside = new URL('https://worker.example.test/api/other');
    expect(await handleExecutiveBriefRoute(new Request(outside), env, outside)).toBeNull();
    expect(await callRoute('GET', '')).toBeNull();
    expect(await callRoute('GET', '/unknown')).toBeNull();
    const sibling = new URL('https://worker.example.test/api/reports/executive-brief-archive');
    expect(await handleExecutiveBriefRoute(new Request(sibling), env, sibling)).toBeNull();
  });

  it('serves the legacy report URL from D1 with the current report fields', async () => {
    const response = expectResponse(await callRoute('GET', '/report'));
    expect(response.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.OK);
    expect(response.headers.get('Content-Type')).toBe(EXECUTIVE_BRIEF_CONTENT_TYPES.JSON);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.get('Access-Control-Expose-Headers')).toContain('Content-Disposition');
    expect(UUID_PATTERN.test(response.headers.get('X-Request-Id') ?? '')).toBe(true);
    const body = (await response.json()) as { success: boolean; data: Record<string, unknown> };
    expect(body.success).toBe(true);
    expect(Object.keys(body.data)).toEqual(
      expect.arrayContaining(['tenant', 'dataClassification', 'metrics', 'opportunities', 'levers', 'statuses', 'risks'])
    );
    expect((body.data.tenant as { enterpriseName: string }).enterpriseName).toBe('D1 Enterprise');
    expect((body.data.metrics as { totalSpendCr: number }).totalSpendCr).toBe(125.5);
    expect(body.data.dataClassification).toBe('DEMO_ONLY');
  });

  it('requires active authentication while allowing standard tenant users and administrators to read or download briefs', async () => {
    const paths = [
      '/report',
      '/audit',
      '/download/pdf',
      '/download/pptx',
      '/opportunity-brief/report',
      '/download/opportunity-brief/pdf',
      '/download/opportunity-brief/pptx'
    ];
    const standardUserToken = await userToken();
    for (const path of paths) {
      const anonymous = expectResponse(await callRoute('GET', path, { headers: { Authorization: '' } }));
      expect(anonymous.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.UNAUTHORIZED);
      expect(((await anonymous.json()) as { message: string }).message).toBe(EXECUTIVE_BRIEF_MESSAGES.userAuthRequired);
      const standardUser = expectResponse(await callRoute('GET', path, {
        headers: { Authorization: 'Bearer ' + standardUserToken }
      }));
      expect(standardUser.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.OK);
    }
  });

  it('returns actionable D1 availability errors from each legacy report route', async () => {
    const environment = testEnvironment({ DB: undefined });
    for (const path of ['/report', '/audit', '/download/pdf', '/download/pptx']) {
      const response = expectResponse(await callRoute('GET', path, { env: environment }));
      expect(response.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.SERVICE_UNAVAILABLE);
      expect(response.headers.get('Content-Disposition')).toBeNull();
    }
  });

  it('serves the audit as a Markdown attachment', async () => {
    const response = expectResponse(await callRoute('GET', '/audit'));
    expect(response.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.OK);
    expect(response.headers.get('Content-Type')).toBe(EXECUTIVE_BRIEF_CONTENT_TYPES.MARKDOWN);
    expect(response.headers.get('Content-Disposition')).toBe(
      `attachment; filename="${EXECUTIVE_BRIEF_ARTIFACT_FILENAMES.AUDIT}"`
    );
    expect(await response.text()).toContain('D1 Enterprise');
  });

  it('serves the PDF with the PDF content type, a dated attachment name, and a PDF body', async () => {
    const response = expectResponse(await callRoute('GET', '/download/pdf'));
    expect(response.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.OK);
    expect(response.headers.get('Content-Type')).toBe(EXECUTIVE_BRIEF_CONTENT_TYPES.PDF);
    expect(response.headers.get('Content-Disposition')).toBe(`attachment; filename="${OFFICIAL_PDF_NAME}"`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    expect(Buffer.from(bytes.slice(0, 8)).toString('latin1')).toBe('%PDF-1.4');
    expect(response.headers.get('Content-Length')).toBe(String(bytes.byteLength));
  });

  it('serves the PPTX with the presentation content type and a zip body', async () => {
    const response = expectResponse(await callRoute('GET', '/download/pptx'));
    expect(response.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.OK);
    expect(response.headers.get('Content-Type')).toBe(EXECUTIVE_BRIEF_CONTENT_TYPES.PPTX);
    expect(response.headers.get('Content-Disposition')).toBe(`attachment; filename="${OFFICIAL_PPTX_NAME}"`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    expect(Buffer.from(bytes.slice(0, 2)).toString('latin1')).toBe('PK');
  });

  it('serves the Opportunity Brief from D1 tenant, transaction, and savings records', async () => {
    const response = expectResponse(await callRoute('GET', '/opportunity-brief/report', {
      env: testEnvironment({ DB: d1OpportunityDb() })
    }));
    expect(response.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.OK);
    expect(response.headers.get('Content-Type')).toBe(EXECUTIVE_BRIEF_CONTENT_TYPES.JSON);
    const body = (await response.json()) as {
      success: boolean;
      data: { tenant: { enterpriseName: string }; dataClassification: string; metrics: { totalSpendCr: number; estimatedSavingsCr: number }; opportunities: unknown[] };
    };
    expect(body.success).toBe(true);
    expect(body.data.tenant.enterpriseName).toBe('D1 Enterprise');
    expect(body.data.dataClassification).toBe('DEMO_ONLY');
    expect(body.data.metrics.totalSpendCr).toBe(125.5);
    expect(body.data.metrics.estimatedSavingsCr).toBe(10.25);
    expect(body.data.opportunities).toHaveLength(2);
  });

  it('creates D1-backed Opportunity Brief PDF and PPTX attachments', async () => {
    const environment = testEnvironment({ DB: d1OpportunityDb() });
    const pdf = expectResponse(await callRoute('GET', '/download/opportunity-brief/pdf', { env: environment }));
    expect(pdf.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.OK);
    expect(pdf.headers.get('Content-Type')).toBe(EXECUTIVE_BRIEF_CONTENT_TYPES.PDF);
    expect(pdf.headers.get('Content-Disposition')).toContain('D1_Enterprise_2026-10-24.pdf');
    const pdfBytes = new Uint8Array(await pdf.arrayBuffer());
    expect(Buffer.from(pdfBytes.slice(0, 8)).toString('latin1')).toBe('%PDF-1.4');
    expect(Buffer.from(pdfBytes).toString('latin1')).toContain('DEMO ONLY - NOT VALIDATED SAVINGS');

    const pptx = expectResponse(await callRoute('GET', '/download/opportunity-brief/pptx', { env: environment }));
    expect(pptx.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.OK);
    expect(pptx.headers.get('Content-Type')).toBe(EXECUTIVE_BRIEF_CONTENT_TYPES.PPTX);
    expect(pptx.headers.get('Content-Disposition')).toContain('D1_Enterprise_2026-10-24.pptx');
    expect(Buffer.from(new Uint8Array(await pptx.arrayBuffer()).slice(0, 2)).toString('latin1')).toBe('PK');
  });

  it('returns actionable status codes when the D1 binding or required report data is unavailable', async () => {
    const noBinding = expectResponse(await callRoute('GET', '/opportunity-brief/report', {
      env: testEnvironment({ DB: undefined })
    }));
    expect(noBinding.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.SERVICE_UNAVAILABLE);
    expect(((await noBinding.json()) as { message: string }).message).toBe(EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.d1Unavailable);

    const noTenant = expectResponse(await callRoute('GET', '/opportunity-brief/report', {
      env: testEnvironment({ DB: d1OpportunityDb({ tenants: [] }) })
    }));
    expect(noTenant.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.NOT_FOUND);
    expect(((await noTenant.json()) as { reason: string }).reason).toBe('no-tenant');

    const noTenantDownload = expectResponse(await callRoute('GET', '/download/opportunity-brief/pdf', {
      env: testEnvironment({ DB: d1OpportunityDb({ tenants: [] }) })
    }));
    expect(noTenantDownload.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.NOT_FOUND);

    const noBindingDownload = expectResponse(await callRoute('GET', '/download/opportunity-brief/pptx', {
      env: testEnvironment({ DB: undefined })
    }));
    expect(noBindingDownload.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.SERVICE_UNAVAILABLE);

    const selectedTenantReport = expectResponse(await callRoute('GET', '/opportunity-brief/report', {
      env: testEnvironment({
        DB: d1OpportunityDb({
          tenants: [
            { tenant_id: 'A', enterprise_name: 'A' }, { tenant_id: 'B', enterprise_name: 'B' }
          ]
        }), REQUEST_TENANT_ID: 'B'
      })
    }));
    expect(selectedTenantReport.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.OK);
    expect(((await selectedTenantReport.json()) as { data: { tenant: { tenantId: string } } }).data.tenant.tenantId).toBe('B');

    const missingScope = expectResponse(await callRoute('GET', '/opportunity-brief/report', {
      env: testEnvironment({ DB: d1OpportunityDb(), REQUEST_TENANT_ID: undefined })
    }));
    expect(missingScope.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.FORBIDDEN);

    const empty = expectResponse(await callRoute('GET', '/opportunity-brief/report', {
      env: testEnvironment({ DB: d1OpportunityDb({ transactionCount: 0 }) })
    }));
    expect(empty.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.NOT_FOUND);

    const failed = expectResponse(await callRoute('GET', '/opportunity-brief/report', {
      env: testEnvironment({ DB: d1OpportunityDb({ fail: true }) })
    }));
    expect(failed.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.INTERNAL_ERROR);
    expect(((await failed.json()) as { message: string }).message).toContain('request ID');

    const failedExport = expectResponse(await callRoute('GET', '/download/opportunity-brief/pdf', {
      env: testEnvironment({ DB: d1OpportunityDb({ fail: true }) })
    }));
    expect(failedExport.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.INTERNAL_ERROR);
    const failedExportRequestId = failedExport.headers.get('X-Request-Id') ?? '';
    expect(((await failedExport.json()) as { message: string }).message)
      .toBe(EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.reportFailed(failedExportRequestId));
  });

  it('answers 405 with the allowed method when the method does not match the route', async () => {
    const postReport = expectResponse(await callRoute('POST', '/report'));
    expect(postReport.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.METHOD_NOT_ALLOWED);
    expect(postReport.headers.get('Allow')).toBe('GET');
    const getRegenerate = expectResponse(await callRoute('GET', '/regenerate'));
    expect(getRegenerate.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.METHOD_NOT_ALLOWED);
    expect(getRegenerate.headers.get('Allow')).toBe('POST');
  });

  it('echoes a well-formed x-request-id and replaces a malformed one', async () => {
    const echoed = expectResponse(await callRoute('GET', '/report', { headers: { 'x-request-id': 'req-2026.10.24_01' } }));
    expect(echoed.headers.get('X-Request-Id')).toBe('req-2026.10.24_01');
    const replaced = expectResponse(await callRoute('GET', '/report', { headers: { 'x-request-id': 'bad id!' } }));
    expect(UUID_PATTERN.test(replaced.headers.get('X-Request-Id') ?? '')).toBe(true);
  });

  it('serves the Opportunity Brief through workerFetch for active USER accounts within their tenant while keeping regenerate admin-only', async () => {
    const fixture = createWorkerDatabase();
    try {
      insertRows(fixture.db, 'INSERT INTO TenantMaster (tenant_id, enterprise_name, status) VALUES (?, ?, ?)', [
        ['TEN-ALPHA', 'Alpha Procurement Ltd', 'ACTIVE'],
        ['TEN-BETA', 'Beta Procurement Ltd', 'ACTIVE']
      ]);
      insertRows(fixture.db, `INSERT INTO User (
        id, name, mobile_number, email, company_name, company_address, password_hash, role, status, subscription_tier, tenant_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        ['usr-alpha', 'Alpha Buyer', '+919000000001', 'alpha@alpha.test', 'Alpha Procurement Ltd', 'Pune', 'unused', 'USER', 'ACTIVE', 'SILVER', 'TEN-ALPHA']
      ]);
      insertRows(fixture.db, `INSERT INTO ProcurementTransaction (
        transaction_id, tenant_id, assessment_id, supplier_name, material_code, plant, po_number, currency, total_in_cr_raw, document_date_raw, raw_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        ['TX-ALPHA-1', 'TEN-ALPHA', null, 'Vendor A', 'MAT-1', 'P1', 'PO-1', 'INR', 42.5, '2026-01-15', '{}']
      ]);
      insertRows(fixture.db, `INSERT INTO SavingsOpportunity (
        opp_id, category, title, current_spend, current_spend_inr_cr, est_savings, est_savings_inr_cr, lever, recommended_action, status, risk_level, confidence_score
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        ['OPP-ALPHA-1', 'Packaging', 'Carton consolidation', 200000000, 20, 20000000, 2, 'Supplier Consolidation', 'Consolidate carton suppliers', 'Identified', 'Low', 0.9]
      ]);
      insertRows(fixture.db, 'INSERT INTO SavingsOpportunityTenantScope (opp_id, tenant_id) VALUES (?, ?)', [
        ['OPP-ALPHA-1', 'TEN-ALPHA']
      ]);

      const token = await createWorkerAuthToken(
        { id: 'usr-alpha', email: 'alpha@alpha.test', role: 'USER', subscription_tier: 'SILVER', tenant_id: 'TEN-ALPHA' },
        WORKER_CORE_SECRET
      );
      const env = runtimeEnvironment({ DB: fixture.d1 });
      const ctx: CloudflareExecutionContext = { waitUntil: vi.fn(), passThroughOnException: vi.fn() };

      const reportResponse = await workerFetch(
        new Request('https://worker.example.test/api/reports/executive-brief/opportunity-brief/report', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        env,
        ctx
      );
      expect(reportResponse.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.OK);
      const reportJson = (await reportResponse.json()) as {
        success: boolean;
        data: { tenant: { tenantId: string; enterpriseName: string }; metrics: { totalSpendCr: number; estimatedSavingsCr: number } };
      };
      expect(reportJson.success).toBe(true);
      expect(reportJson.data.tenant).toEqual({ tenantId: 'TEN-ALPHA', enterpriseName: 'Alpha Procurement Ltd' });
      expect(reportJson.data.metrics.totalSpendCr).toBe(42.5);
      expect(reportJson.data.metrics.estimatedSavingsCr).toBe(2);

      const pdfResponse = await workerFetch(
        new Request('https://worker.example.test/api/reports/executive-brief/download/opportunity-brief/pdf', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        env,
        ctx
      );
      expect(pdfResponse.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.OK);

      const crossTenantResponse = await workerFetch(
        new Request('https://worker.example.test/api/reports/executive-brief/opportunity-brief/report?tenantId=TEN-BETA', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        env,
        ctx
      );
      expect(crossTenantResponse.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.FORBIDDEN);

      const regenerateResponse = await workerFetch(
        new Request('https://worker.example.test/api/reports/executive-brief/regenerate', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: '{}'
        }),
        env,
        ctx
      );
      expect(regenerateResponse.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.FORBIDDEN);
    } finally {
      fixture.close();
    }
  });

  it('serves assessment-scoped Opportunity Brief PDF and PPTX downloads and validates invalid assessmentId parameters', async () => {
    const fixture = createWorkerDatabase();
    try {
      insertRows(fixture.db, 'INSERT INTO TenantMaster (tenant_id, enterprise_name, status) VALUES (?, ?, ?)', [
        ['TEN-CEMENT', 'PQR Cement Ltd', 'ACTIVE']
      ]);
      insertRows(fixture.db, `INSERT INTO User (
        id, name, mobile_number, email, company_name, company_address, password_hash, role, status, subscription_tier, tenant_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        ['usr-cement', 'Anurag Shaw', '+919000000002', 'anurag@cement.test', 'PQR Cement Ltd', 'Mumbai', 'unused', 'USER', 'ACTIVE', 'BRONZE', 'TEN-CEMENT']
      ]);
      insertRows(fixture.db, `INSERT INTO ProcurementTransaction (
        transaction_id, tenant_id, assessment_id, supplier_name, material_code, plant, po_number, currency, total_in_cr_raw, document_date_raw, raw_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        ['TX-CEMENT-1', 'TEN-CEMENT', 'AIC-CEMENT-1', 'Vendor C1', 'MAT-C1', 'PL-1', 'PO-C1', 'INR', 262.64, '2022-08-01', '{}']
      ]);

      const token = await createWorkerAuthToken(
        { id: 'usr-cement', email: 'anurag@cement.test', role: 'USER', subscription_tier: 'BRONZE', tenant_id: 'TEN-CEMENT' },
        WORKER_CORE_SECRET
      );
      const env = runtimeEnvironment({ DB: fixture.d1 });
      const ctx: CloudflareExecutionContext = { waitUntil: vi.fn(), passThroughOnException: vi.fn() };

      const scopedPdf = await workerFetch(
        new Request('https://worker.example.test/api/reports/executive-brief/download/opportunity-brief/pdf', {
          headers: { Authorization: `Bearer ${token}`, 'x-assessment-id': 'AIC-CEMENT-1' }
        }),
        env,
        ctx
      );
      expect(scopedPdf.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.OK);
      expect(scopedPdf.headers.get('Content-Type')).toBe(EXECUTIVE_BRIEF_CONTENT_TYPES.PDF);

      const fallbackPptx = await workerFetch(
        new Request('https://worker.example.test/api/reports/executive-brief/download/opportunity-brief/pptx', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        env,
        ctx
      );
      expect(fallbackPptx.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.OK);
      expect(fallbackPptx.headers.get('Content-Type')).toBe(EXECUTIVE_BRIEF_CONTENT_TYPES.PPTX);

      const invalidScope = await workerFetch(
        new Request('https://worker.example.test/api/reports/executive-brief/download/opportunity-brief/pdf?assessmentId=%20%20', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        env,
        ctx
      );
      expect(invalidScope.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.BAD_REQUEST);
    } finally {
      fixture.close();
    }
  });
});
