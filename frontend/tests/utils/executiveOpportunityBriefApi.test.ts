import { describe, expect, it, vi } from 'vitest';
import { EXECUTIVE_OPPORTUNITY_BRIEF_REPORT_ENDPOINT } from '../../src/constants/app';
import { fetchExecutiveOpportunityBriefReport } from '../../src/utils/executiveOpportunityBriefApi';
import { authApiClient } from '../../src/utils/authApi';

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
    const response = new Response('{}', { status: 503, headers: { 'x-request-id': 'req-d1' } });
    const result = await fetchExecutiveOpportunityBriefReport(async () => response);
    expect(result).toEqual({ ok: false, statusCode: 503, requestId: 'req-d1' });
  });

  it('handles malformed JSON and schema-invalid success payloads', async () => {
    const malformed = new Response('', { status: 200 });
    const badJson = await fetchExecutiveOpportunityBriefReport(async () => malformed);
    expect(badJson).toEqual({ ok: false, statusCode: 200, requestId: null });

    const invalid = new Response(JSON.stringify({ success: true, data: {} }), {
      status: 200, headers: { 'x-request-id': 'req-invalid' }
    });
    const invalidSchema = await fetchExecutiveOpportunityBriefReport(async () => invalid);
    expect(invalidSchema).toEqual({ ok: false, statusCode: 200, requestId: 'req-invalid' });
  });

  it('returns a network failure result when fetch rejects', async () => {
    const result = await fetchExecutiveOpportunityBriefReport(async () => {
      throw new Error('offline');
    });
    expect(result).toEqual({ ok: false, statusCode: 0, requestId: null });
  });
});
