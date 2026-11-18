import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  EXECUTIVE_OPPORTUNITY_BRIEF_ASSESSMENT_HEADER,
  EXECUTIVE_OPPORTUNITY_BRIEF_PAGE_PATH,
  EXECUTIVE_OPPORTUNITY_BRIEF_REPORT_ENDPOINT
} from '../../src/constants/app';
import { UI_STRINGS } from '../../src/constants/uiStrings';
import {
  fetchExecutiveOpportunityBriefReport,
  formatExecutiveOpportunityBriefError,
  readExecutiveOpportunityBriefErrorDetails,
  resolveExecutiveBriefAssessmentIdFromSearch,
  resolveExecutiveBriefDownloadFilename,
  resolveExecutiveBriefHref
} from '../../src/utils/executiveOpportunityBriefApi';
import { authApiClient } from '../../src/utils/authApi';
import { frontendLogger } from '../../src/utils/logger';

const validPayload = {
  success: true,
  data: {
    tenant: { tenantId: 'T1', enterpriseName: 'D1 Enterprise' },
    dataClassification: 'DEMO_ONLY',
    generatedAt: '2026-10-30T00:00:00.000Z',
    scopeDescription: 'D1 report scope',
    metrics: {
      transactionCount: 1, totalSpendCr: 2, supplierCount: 1, materialCount: 1, plantCount: 1,
      purchaseOrderCount: 1, firstTransactionDate: null, lastTransactionDate: null,
      opportunityCount: 0, estimatedSavingsCr: 0, averageConfidence: 0
    },
    opportunities: [], levers: [], statuses: [], risks: []
  }
};

describe('fetchExecutiveOpportunityBriefReport', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('uses apiFetch by default when no custom fetcher is supplied', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(validPayload), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const result = await fetchExecutiveOpportunityBriefReport();
    expect(result).toMatchObject({ ok: true, data: { tenant: { enterpriseName: 'D1 Enterprise' } } });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('extracts server error message and reason from failed responses and handles non-JSON bodies', async () => {
    const jsonErr = new Response(
      JSON.stringify({ success: false, message: '  Tenant assignment pending.  ', reason: 'tenant-scope-required' }),
      { status: 403, headers: { 'x-request-id': 'req-403' } }
    );
    const result = await fetchExecutiveOpportunityBriefReport(async () => jsonErr);
    expect(result).toEqual({
      ok: false,
      statusCode: 403,
      requestId: 'req-403',
      serverMessage: 'Tenant assignment pending.',
      reason: 'tenant-scope-required'
    });

    await expect(readExecutiveOpportunityBriefErrorDetails({} as Response)).resolves.toEqual({});
    await expect(readExecutiveOpportunityBriefErrorDetails(new Response('not-json', { status: 500 }))).resolves.toEqual({});
    await expect(readExecutiveOpportunityBriefErrorDetails(new Response('[]', { status: 500 }))).resolves.toEqual({});
    await expect(readExecutiveOpportunityBriefErrorDetails(new Response(JSON.stringify({ message: '   ', reason: 123 }), { status: 403 }))).resolves.toEqual({});
  });

  it('formats status-specific actionable messages for report loading and downloads', () => {
    expect(formatExecutiveOpportunityBriefError({ statusCode: 0, requestId: null })).toBe(
      UI_STRINGS.opportunityBrief.reportUnavailableNetwork
    );
    expect(formatExecutiveOpportunityBriefError({ statusCode: 401, requestId: 'r-1', serverMessage: 'Expired.' })).toBe(
      UI_STRINGS.opportunityBrief.reportUnauthorized('r-1', 'Expired.')
    );
    expect(formatExecutiveOpportunityBriefError({ statusCode: 403, requestId: 'r-2', serverMessage: 'No tenant.' })).toBe(
      UI_STRINGS.opportunityBrief.reportForbidden('r-2', 'No tenant.')
    );
    expect(formatExecutiveOpportunityBriefError({ statusCode: 404, requestId: null })).toBe(
      UI_STRINGS.opportunityBrief.reportNotFound(UI_STRINGS.opportunityBrief.requestIdNotReturned)
    );
    expect(formatExecutiveOpportunityBriefError({ statusCode: 401, requestId: 'd-1', formatLabel: 'PDF' })).toBe(
      UI_STRINGS.opportunityBrief.downloadUnauthorized('PDF', 'd-1')
    );
    expect(formatExecutiveOpportunityBriefError({ statusCode: 403, requestId: 'd-2', serverMessage: 'Blocked.', formatLabel: 'PPTX' })).toBe(
      UI_STRINGS.opportunityBrief.downloadForbidden('PPTX', 'd-2', 'Blocked.')
    );
    expect(formatExecutiveOpportunityBriefError({ statusCode: 404, requestId: 'd-3', formatLabel: 'PDF' })).toBe(
      UI_STRINGS.opportunityBrief.downloadNotFound('PDF', 'd-3')
    );
  });

  it('fetches and validates the D1 report response', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify(validPayload), { status: 200 }));
    const result = await fetchExecutiveOpportunityBriefReport(fetcher);
    expect(fetcher).toHaveBeenCalledWith(EXECUTIVE_OPPORTUNITY_BRIEF_REPORT_ENDPOINT, { headers: {} });
    expect(result).toMatchObject({ ok: true, data: { tenant: { enterpriseName: 'D1 Enterprise' } } });
  });

  it('sends the active session token with report requests', async () => {
    vi.spyOn(authApiClient, 'getStoredToken').mockReturnValue('session-token');
    const fetcher = vi.fn(async () => new Response(JSON.stringify(validPayload), { status: 200 }));
    await fetchExecutiveOpportunityBriefReport(fetcher);
    expect(fetcher).toHaveBeenCalledWith(EXECUTIVE_OPPORTUNITY_BRIEF_REPORT_ENDPOINT, {
      headers: { Authorization: 'Bearer ' + 'session-token' }
    });
  });

  it('allows a blank D1 enterprise name so the view can use its workspace fallback', async () => {
    const blankNamePayload = {
      ...validPayload,
      data: { ...validPayload.data, tenant: { tenantId: 'T1', enterpriseName: '' } }
    };
    const result = await fetchExecutiveOpportunityBriefReport(async () => new Response(JSON.stringify(blankNamePayload), { status: 200 }));
    expect(result).toMatchObject({ ok: true, data: { tenant: { enterpriseName: '' } } });
  });

  it('returns the response status and correlation ID for HTTP failures', async () => {
    const errorLog = vi.spyOn(frontendLogger, 'error').mockImplementation(() => ({}) as never);
    const response = new Response('{}', { status: 503, headers: { 'x-request-id': 'req-d1' } });
    const result = await fetchExecutiveOpportunityBriefReport(async () => response);
    expect(result).toEqual({ ok: false, statusCode: 503, requestId: 'req-d1' });
    expect(errorLog).toHaveBeenCalledWith('Executive opportunity brief endpoint returned a server failure', expect.objectContaining({
      method: 'GET', statusCode: 503, requestId: 'req-d1'
    }));
  });

  it('warns when the report endpoint rejects a request without a server failure', async () => {
    const warningLog = vi.spyOn(frontendLogger, 'warn').mockImplementation(() => ({}) as never);
    const response = new Response('{}', { status: 400, headers: { 'x-request-id': 'req-invalid' } });
    const result = await fetchExecutiveOpportunityBriefReport(async () => response);

    expect(result).toEqual({ ok: false, statusCode: 400, requestId: 'req-invalid' });
    expect(warningLog).toHaveBeenCalledWith('Executive opportunity brief endpoint returned an unsuccessful response', expect.objectContaining({
      action: 'executive-brief.report.response', method: 'GET', statusCode: 400, requestId: 'req-invalid'
    }));
  });

  it('handles malformed JSON and schema-invalid success payloads', async () => {
    const errorLog = vi.spyOn(frontendLogger, 'error').mockImplementation(() => ({}) as never);
    const malformed = new Response('', { status: 200 });
    const badJson = await fetchExecutiveOpportunityBriefReport(async () => malformed);
    expect(badJson).toEqual({ ok: false, statusCode: 200, requestId: null });

    const invalid = new Response(JSON.stringify({ success: true, data: {} }), {
      status: 200, headers: { 'x-request-id': 'req-invalid' }
    });
    const invalidSchema = await fetchExecutiveOpportunityBriefReport(async () => invalid);
    expect(invalidSchema).toEqual({ ok: false, statusCode: 200, requestId: 'req-invalid' });
    expect(errorLog).toHaveBeenNthCalledWith(1, 'Executive opportunity brief response was not valid JSON', expect.objectContaining({
      action: 'executive-brief.report.parse', statusCode: 200
    }), expect.any(SyntaxError));
    expect(errorLog).toHaveBeenNthCalledWith(2, 'Executive opportunity brief response did not match the expected schema', expect.objectContaining({
      action: 'executive-brief.report.validate', requestId: 'req-invalid'
    }), expect.any(Error));
  });

  it('returns a network failure result when fetch rejects', async () => {
    const errorLog = vi.spyOn(frontendLogger, 'error').mockImplementation(() => ({}) as never);
    const networkError = new Error('offline');
    const result = await fetchExecutiveOpportunityBriefReport(async () => {
      throw networkError;
    });
    expect(result).toEqual({ ok: false, statusCode: 0, requestId: null });
    expect(errorLog).toHaveBeenCalledWith('Executive opportunity brief request failed before a response was received', expect.objectContaining({
      action: 'executive-brief.report.fetch', statusCode: 0
    }), networkError);
  });

  it('forwards valid assessment scope headers and resolves brief links and filenames safely', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify(validPayload), { status: 200 }));
    await fetchExecutiveOpportunityBriefReport(fetcher, { assessmentId: 'AIC-101' });
    expect(fetcher).toHaveBeenCalledWith(EXECUTIVE_OPPORTUNITY_BRIEF_REPORT_ENDPOINT, {
      headers: { [EXECUTIVE_OPPORTUNITY_BRIEF_ASSESSMENT_HEADER]: 'AIC-101' }
    });

    expect(resolveExecutiveBriefAssessmentIdFromSearch('?assessmentId=AIC-202')).toBe('AIC-202');
    expect(resolveExecutiveBriefAssessmentIdFromSearch('?assessmentId=%20%20')).toBeUndefined();
    expect(resolveExecutiveBriefHref(undefined)).toBe(EXECUTIVE_OPPORTUNITY_BRIEF_PAGE_PATH);
    expect(resolveExecutiveBriefHref('AIC 1', 'https://app.test')).toBe(
      `https://app.test${EXECUTIVE_OPPORTUNITY_BRIEF_PAGE_PATH}?assessmentId=AIC%201`
    );
    expect(resolveExecutiveBriefDownloadFilename('attachment; filename="Custom.pdf"', 'pdf')).toBe('Custom.pdf');
    expect(resolveExecutiveBriefDownloadFilename('attachment; filename=PlainName.pptx', 'pptx')).toBe('PlainName.pptx');
    expect(resolveExecutiveBriefDownloadFilename(null, 'pdf')).toBe(
      UI_STRINGS.opportunityBrief.downloadFilename('pdf')
    );
  });
});
