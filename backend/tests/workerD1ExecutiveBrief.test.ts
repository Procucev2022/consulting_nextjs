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
import { DEFAULT_CLIENT_PROFILE } from '../src/constants/executiveBriefConstants';
import type { CloudflareEnvironment } from '../src/types/cloudflare';
import { briefRequest, briefUrl, testEnvironment, TEST_REPORT_DATE } from './executiveBriefTestHelpers';

vi.mock('../src/utils/logger', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}));

const OFFICIAL_PDF_NAME = `Procucev_Procurement_Value_Savings_Diagnostic_UltraTech_Cement_Limited_${TEST_REPORT_DATE}.pdf`;
const OFFICIAL_PPTX_NAME = OFFICIAL_PDF_NAME.replace(/\.pdf$/u, '.pptx');
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u;

const callRoute = async (
  method: string,
  path: string,
  options: { query?: string; headers?: Record<string, string>; env?: CloudflareEnvironment } = {}
): Promise<Response | null> => {
  const request = briefRequest(method, path, { query: options.query, headers: options.headers });
  return handleExecutiveBriefRoute(request, options.env ?? testEnvironment(), briefUrl(path, options.query ?? ''));
};

const expectResponse = (response: Response | null): Response => {
  expect(response).not.toBeNull();
  return response as Response;
};

const d1OpportunityDb = (options: {
  tenants?: Array<{ tenant_id: string; enterprise_name: string }>;
  transactionCount?: number;
  fail?: boolean;
} = {}): CloudflareEnvironment['DB'] => ({
  prepare: (query: string) => {
    const statement = {
      bind: (..._values: unknown[]) => statement,
      first: async <T>() => {
        if (options.fail) throw new Error('D1 query failed');
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
        return null;
      },
      all: async <T>() => {
        if (options.fail) throw new Error('D1 query failed');
        if (query === EXECUTIVE_OPPORTUNITY_BRIEF_SQL.tenants) {
          return { results: options.tenants ?? [{ tenant_id: 'TEN-1', enterprise_name: 'D1 Enterprise' }] as T[] };
        }
        if (query === EXECUTIVE_OPPORTUNITY_BRIEF_SQL.opportunities) {
          return { results: [{
            opp_id: 'OPP-1', category: 'Packaging', title: 'Packaging sourcing', current_spend_cr: 50,
            estimated_savings_cr: 8, lever: 'Strategic sourcing', recommended_action: 'Launch a tender',
            status: 'Identified', risk_level: 'Medium', confidence_score: 0.9
          }, {
            opp_id: 'OPP-2', category: 'Logistics', title: null, current_spend_cr: null,
            estimated_savings_cr: 2.25, lever: null, recommended_action: null,
            status: null, risk_level: null, confidence_score: null
          }] as T[] };
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

  it('serves the report JSON publicly with the fields the executive brief page reads', async () => {
    const response = expectResponse(await callRoute('GET', '/report'));
    expect(response.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.OK);
    expect(response.headers.get('Content-Type')).toBe(EXECUTIVE_BRIEF_CONTENT_TYPES.JSON);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.get('Access-Control-Expose-Headers')).toContain('Content-Disposition');
    expect(UUID_PATTERN.test(response.headers.get('X-Request-Id') ?? '')).toBe(true);
    const body = (await response.json()) as { success: boolean; data: Record<string, unknown> };
    expect(body.success).toBe(true);
    expect(Object.keys(body.data)).toEqual(
      expect.arrayContaining(['clientProfile', 'summaryCards', 'sections', 'validationChecklist', 'artifacts', 'traceabilityLineage'])
    );
    expect((body.data.metadata as { reportDate: string }).reportDate).toBe(TEST_REPORT_DATE);
  });

  it('accepts the certified client, rejects other clients with 404, and rejects invalid queries with 400', async () => {
    const certified = expectResponse(
      await callRoute('GET', '/report', { query: '?client=ultratech%20cement%20limited' })
    );
    expect(certified.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.OK);

    const other = expectResponse(await callRoute('GET', '/report', { query: '?client=ABC%20Textile' }));
    expect(other.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.NOT_FOUND);
    expect(((await other.json()) as { message: string }).message).toContain('ABC Textile');

    const empty = expectResponse(await callRoute('GET', '/report', { query: '?client=' }));
    expect(empty.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.BAD_REQUEST);
    const invalid = (await empty.json()) as { message: string; errors: Array<{ path: string }> };
    expect(invalid.message).toBe(EXECUTIVE_BRIEF_MESSAGES.validationFailed);
    expect(invalid.errors[0].path).toBe('client');
  });

  it('applies the same client validation to every GET route before rendering anything', async () => {
    for (const path of ['/report', '/audit', '/download/pdf', '/download/pptx']) {
      const other = expectResponse(await callRoute('GET', path, { query: '?client=ABC%20Textile' }));
      expect(other.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.NOT_FOUND);
      expect(other.headers.get('Content-Disposition')).toBeNull();
      const blank = expectResponse(await callRoute('GET', path, { query: '?client=%20%20' }));
      expect(blank.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.BAD_REQUEST);
    }
  });

  it('serves the audit as a Markdown attachment', async () => {
    const response = expectResponse(await callRoute('GET', '/audit'));
    expect(response.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.OK);
    expect(response.headers.get('Content-Type')).toBe(EXECUTIVE_BRIEF_CONTENT_TYPES.MARKDOWN);
    expect(response.headers.get('Content-Disposition')).toBe(
      `attachment; filename="${EXECUTIVE_BRIEF_ARTIFACT_FILENAMES.AUDIT}"`
    );
    expect(await response.text()).toContain(DEFAULT_CLIENT_PROFILE.clientName);
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
      data: { tenant: { enterpriseName: string }; metrics: { totalSpendCr: number; estimatedSavingsCr: number }; opportunities: unknown[] };
    };
    expect(body.success).toBe(true);
    expect(body.data.tenant.enterpriseName).toBe('D1 Enterprise');
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
    expect(Buffer.from(new Uint8Array(await pdf.arrayBuffer()).slice(0, 8)).toString('latin1')).toBe('%PDF-1.4');

    const pptx = expectResponse(await callRoute('GET', '/download/opportunity-brief/pptx', { env: environment }));
    expect(pptx.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.OK);
    expect(pptx.headers.get('Content-Type')).toBe(EXECUTIVE_BRIEF_CONTENT_TYPES.PPTX);
    expect(pptx.headers.get('Content-Disposition')).toContain('D1_Enterprise_2026-10-24.pptx');
    expect(Buffer.from(new Uint8Array(await pptx.arrayBuffer()).slice(0, 2)).toString('latin1')).toBe('PK');
  });

  it('returns actionable status codes when the D1 binding or required report data is unavailable', async () => {
    const noBinding = expectResponse(await callRoute('GET', '/opportunity-brief/report'));
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

    const noBindingDownload = expectResponse(await callRoute('GET', '/download/opportunity-brief/pptx'));
    expect(noBindingDownload.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.SERVICE_UNAVAILABLE);

    const ambiguous = expectResponse(await callRoute('GET', '/opportunity-brief/report', {
      env: testEnvironment({ DB: d1OpportunityDb({ tenants: [
        { tenant_id: 'A', enterprise_name: 'A' }, { tenant_id: 'B', enterprise_name: 'B' }
      ] }) })
    }));
    expect(ambiguous.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.CONFLICT);

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
    expect(((await failedExport.json()) as { message: string }).message).toContain('PDF');
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
});
