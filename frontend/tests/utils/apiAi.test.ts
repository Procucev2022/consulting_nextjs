import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { aiApiClient, apiClient } from '../../src/utils/api';

describe('Frontend aiApiClient Integration Tests', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('checkConfig should query /api/ai/config', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, configured: true, primaryModel: 'gemini-3.6-flash' })
    } as any);

    const res = await aiApiClient.checkConfig();
    expect(res.configured).toBe(true);
    expect(res.primaryModel).toBe('gemini-3.6-flash');
  });

  it('extractDocument should call POST /api/ai/extract', async () => {
    const mockRes = {
      success: true,
      items: [{ itemDescription: 'Industrial Valve', totalAmount: 10000 }]
    };

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockRes
    } as any);

    const res = await aiApiClient.extractDocument({
      documentText: 'Industrial Valve 10000',
      fileName: 'invoice.pdf'
    });

    expect(res.success).toBe(true);
    expect(res.items.length).toBe(1);
  });

  it('categorizeItems should call POST /api/ai/categorize', async () => {
    const mockRes = {
      success: true,
      mappings: [{ mappedUnspscCode: '40141600', unspscTitle: 'Valves' }]
    };

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockRes
    } as any);

    const res = await aiApiClient.categorizeItems([{ rawLineText: 'Valve 2 inch' }]);
    expect(res.success).toBe(true);
    expect(res.mappings[0].mappedUnspscCode).toBe('40141600');
  });

  it('generateExecutiveSummary should call POST /api/ai/executive-summary', async () => {
    const mockRes = {
      success: true,
      data: { executiveSummary: 'Spend Analysis Summary', totalSpendEvaluated: 500 }
    };

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockRes
    } as any);

    const res = await aiApiClient.generateExecutiveSummary({
      tenantName: 'Client 1',
      totalSpendInrCr: 500,
      categories: [],
      vendors: []
    });

    expect(res.success).toBe(true);
    expect(res.data.executiveSummary).toBe('Spend Analysis Summary');
  });

  it('analyzeAnomalies should call POST /api/ai/analyze-anomalies', async () => {
    const mockRes = {
      success: true,
      anomalies: [{ recordId: 'REC-1', issueFlag: 'Currency' }]
    };

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockRes
    } as any);

    const res = await aiApiClient.analyzeAnomalies([
      { recordId: 'REC-1', poNumber: 'PO-1', vendorName: 'V1', amount: 500 }
    ]);

    expect(res.success).toBe(true);
    expect(res.anomalies.length).toBe(1);
  });
});
