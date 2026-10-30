import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handleExecutiveBriefRoute } from '../src/workerD1ExecutiveBrief';
import {
  EXECUTIVE_BRIEF_HTTP_STATUS,
  EXECUTIVE_BRIEF_MESSAGES
} from '../src/constants/executiveBriefRouteConstants';
import { EXECUTIVE_OPPORTUNITY_BRIEF_GAP } from '../src/constants/executiveOpportunityBriefConstants';
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

  it('answers 501 with the named gap for both Opportunity Brief downloads, not a file', async () => {
    for (const path of ['/download/opportunity-brief/pdf', '/download/opportunity-brief/pptx']) {
      const response = expectResponse(await callRoute('GET', path));
      expect(response.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.NOT_IMPLEMENTED);
      expect(response.headers.get('Content-Type')).toBe(EXECUTIVE_BRIEF_CONTENT_TYPES.JSON);
      expect(response.headers.get('Content-Disposition')).toBeNull();
      const body = (await response.json()) as { success: boolean; message: string; gap: { code: string } };
      expect(body.success).toBe(false);
      expect(body.message).toBe(EXECUTIVE_OPPORTUNITY_BRIEF_GAP.message);
      expect(body.gap.code).toBe(EXECUTIVE_OPPORTUNITY_BRIEF_GAP.code);
    }
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
