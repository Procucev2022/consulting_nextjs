import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Module2OpportunityRegisterApi } from '@/utils/module2OpportunityRegisterApi';

describe('Module2OpportunityRegisterApi', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('getOpportunityRegister', () => {
    it('returns opportunity register result on 200 ok', async () => {
      const mockResult = {
        assessmentId: 'AIC-2026-0002',
        customerName: 'Borosil Ltd',
        generatedAt: '2026-10-26T00:00:00.000Z',
        summary: { authoritativeBaselineSpendCr: 556.5346 },
        opportunities: [{ opportunityId: 'OPP-01' }],
        exclusionsSummary: {}
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockResult })
      });

      const res = await Module2OpportunityRegisterApi.getOpportunityRegister({
        assessmentId: 'AIC-2026-0002',
        type: 'DIRECT_PRICE_IMPROVEMENT',
        status: 'IDENTIFIED',
        category: 'Chemicals',
        search: 'Soda'
      });

      expect(res).toEqual(mockResult);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/opportunity-register?assessmentId=AIC-2026-0002')
      );
    });

    it('returns null when API returns non-ok status', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400
      });

      const res = await Module2OpportunityRegisterApi.getOpportunityRegister({
        assessmentId: 'AIC-2026-0002'
      });

      expect(res).toBeNull();
    });

    it('returns null when network throws error', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const res = await Module2OpportunityRegisterApi.getOpportunityRegister({
        assessmentId: 'AIC-2026-0002'
      });

      expect(res).toBeNull();
    });
  });

  describe('getExecutiveDashboard', () => {
    it('returns executive dashboard summary and customer name on 200 ok', async () => {
      const mockSummary = {
        authoritativeBaselineSpendCr: 556.5346,
        authoritativeBaselineTransactions: 27777
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { summary: mockSummary, customerName: 'Borosil Ltd' }
        })
      });

      const res = await Module2OpportunityRegisterApi.getExecutiveDashboard('AIC-2026-0002');
      expect(res).toEqual({
        summary: mockSummary,
        customerName: 'Borosil Ltd'
      });
    });

    it('returns fallback customer name when missing in payload', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { summary: {} }
        })
      });

      const res = await Module2OpportunityRegisterApi.getExecutiveDashboard('AIC-2026-0002');
      expect(res?.customerName).toBe('Borosil Ltd');
    });

    it('returns null on non-ok status or network error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500
      });

      const res = await Module2OpportunityRegisterApi.getExecutiveDashboard('AIC-2026-0002');
      expect(res).toBeNull();
    });
  });

  describe('getExportCsvUrl', () => {
    it('constructs correct CSV export URL with assessmentId', () => {
      const url = Module2OpportunityRegisterApi.getExportCsvUrl('AIC-2026-0002');
      expect(url).toContain('/opportunity-register/export-csv?assessmentId=AIC-2026-0002');
    });
  });

  describe('URL resolution and query parameters', () => {
    const originalEnv = process.env.NEXT_PUBLIC_BACKEND_URL;

    afterEach(() => {
      process.env.NEXT_PUBLIC_BACKEND_URL = originalEnv;
    });

    it('uses NEXT_PUBLIC_BACKEND_URL when configured', async () => {
      process.env.NEXT_PUBLIC_BACKEND_URL = 'https://api.procure.example.com';
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { summary: {} } })
      });

      await Module2OpportunityRegisterApi.getExecutiveDashboard('AIC-2026-0002');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://api.procure.example.com/api/module2/sourcing/executive-dashboard')
      );
    });

    it('falls back to localhost when window is undefined and env is not set', async () => {
      delete process.env.NEXT_PUBLIC_BACKEND_URL;
      const originalWindow = global.window;
      delete (global as Record<string, unknown>).window;

      try {
        const url = Module2OpportunityRegisterApi.getExportCsvUrl('AIC-2026-0002');
        expect(url).toContain('http://localhost:5000/api/module2/sourcing/opportunity-register/export-csv');
      } finally {
        global.window = originalWindow;
      }
    });

    it('handles network error in getExecutiveDashboard gracefully', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Executive network crash'));
      const res = await Module2OpportunityRegisterApi.getExecutiveDashboard('AIC-2026-0002');
      expect(res).toBeNull();
    });
  });
});

