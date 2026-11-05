import { expectApiFetchCall } from './apiFetchAssertions';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Module2StrategicSourcingApi } from '@/utils/module2StrategicSourcingApi';

describe('Module2StrategicSourcingApi', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('getDashboardSummary', () => {
    it('returns dashboard summary data when response is successful', async () => {
      const mockData = { totalSpendInr: 1000000, totalCategories: 12 };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockData })
      });

      const result = await Module2StrategicSourcingApi.getDashboardSummary(true);
      expect(result).toEqual(mockData);
      expectApiFetchCall(global.fetch, expect.stringContaining('/api/module2/sourcing/dashboard?refresh=true'));
    });

    it('preserves network failures for the workspace error state', async () => {
      const networkError = new Error('Network error');
      global.fetch = vi.fn().mockRejectedValue(networkError);

      await expect(Module2StrategicSourcingApi.getDashboardSummary()).rejects.toMatchObject({
        feature: 'dashboard',
        statusCode: undefined,
        requestId: undefined
      });
      await expect(Module2StrategicSourcingApi.getDashboardSummary()).rejects.toBe(networkError);
    });

    it('preserves the server status and request ID when the dashboard request fails', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Headers({ 'x-request-id': 'req-dashboard-500' })
      });

      await expect(Module2StrategicSourcingApi.getDashboardSummary()).rejects.toMatchObject({
        feature: 'dashboard',
        statusCode: 500,
        requestId: 'req-dashboard-500'
      });
    });
  });

  describe('getCategoryProfiles', () => {
    it('returns category profiles when successful', async () => {
      const mockProfiles = [{ categoryId: 'cat-1', categoryName: 'Steel' }];
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { profiles: mockProfiles, count: 1 } })
      });

      const result = await Module2StrategicSourcingApi.getCategoryProfiles(true);
      expect(result).toEqual(mockProfiles);
      expectApiFetchCall(global.fetch, expect.stringContaining('/api/module2/sourcing/categories?refresh=true'));
    });

    it('returns empty array when response has no data or no profiles property', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      });

      const result = await Module2StrategicSourcingApi.getCategoryProfiles();
      expect(result).toEqual([]);
    });

    it('preserves failed HTTP status and request ID instead of returning an empty dataset', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Headers({ 'x-request-id': 'req-categories-503' })
      });

      await expect(Module2StrategicSourcingApi.getCategoryProfiles()).rejects.toMatchObject({
        feature: 'category-profiles',
        statusCode: 503,
        requestId: 'req-categories-503'
      });
    });

    it('preserves network failure instead of returning an empty dataset', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network failure'));

      await expect(Module2StrategicSourcingApi.getCategoryProfiles()).rejects.toMatchObject({
        feature: 'category-profiles',
        statusCode: undefined,
        requestId: undefined
      });
    });
  });

  describe('getCategoryProfileById', () => {
    it('returns profile by ID when successful', async () => {
      const mockProfile = { categoryId: 'cat-special/1', categoryName: 'Chemicals' };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockProfile })
      });

      const result = await Module2StrategicSourcingApi.getCategoryProfileById('cat-special/1');
      expect(result).toEqual(mockProfile);
      expectApiFetchCall(global.fetch, expect.stringContaining(encodeURIComponent('cat-special/1')));
    });

    it('returns null on failure', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      const result = await Module2StrategicSourcingApi.getCategoryProfileById('invalid');
      expect(result).toBeNull();
    });

    it('returns null on throw', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await Module2StrategicSourcingApi.getCategoryProfileById('cat-1');
      expect(result).toBeNull();
    });
  });

  describe('getSupplierDeepDive', () => {
    it('returns supplier deep dive list on success', async () => {
      const mockSuppliers = [{ supplierName: 'Acme Corp', categories: ['Steel'], totalSpendInr: 500000 }];
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { suppliers: mockSuppliers } })
      });

      const result = await Module2StrategicSourcingApi.getSupplierDeepDive();
      expect(result).toEqual(mockSuppliers);
    });

    it('returns empty array when response has no data or no suppliers property', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      });

      const result = await Module2StrategicSourcingApi.getSupplierDeepDive();
      expect(result).toEqual([]);
    });

    it('returns empty array when response status is not ok', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const result = await Module2StrategicSourcingApi.getSupplierDeepDive();
      expect(result).toEqual([]);
    });

    it('returns empty array on error', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Fetch failed'));

      const result = await Module2StrategicSourcingApi.getSupplierDeepDive();
      expect(result).toEqual([]);
    });
  });

  describe('getHandoffPackages', () => {
    it('returns handoff packages on success', async () => {
      const mockPackages = [{ packageId: 'PKG-1', categoryName: 'Packaging' }];
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { packages: mockPackages } })
      });

      const result = await Module2StrategicSourcingApi.getHandoffPackages();
      expect(result).toEqual(mockPackages);
    });

    it('returns empty array when response has no data or no packages property', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      });

      const result = await Module2StrategicSourcingApi.getHandoffPackages();
      expect(result).toEqual([]);
    });

    it('returns empty array on error or non-ok status', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Error'
      });

      const result = await Module2StrategicSourcingApi.getHandoffPackages();
      expect(result).toEqual([]);
    });
  });

  describe('exportAuditDossier', () => {
    it('returns export payload on success', async () => {
      const mockExport = { reportVersion: '1.0', generatedAt: '2026-09-29' };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockExport })
      });

      const result = await Module2StrategicSourcingApi.exportAuditDossier();
      expect(result).toEqual(mockExport);
    });

    it('returns null when response status is not ok', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden'
      });

      const result = await Module2StrategicSourcingApi.exportAuditDossier();
      expect(result).toBeNull();
    });

    it('returns null on failure', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Export failed'));

      const result = await Module2StrategicSourcingApi.exportAuditDossier();
      expect(result).toBeNull();
    });
  });

  describe('getDirectPriceImprovement', () => {
    it('returns data on successful response', async () => {
      const mockData = { items: [] };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockData })
      });

      const result = await Module2StrategicSourcingApi.getDirectPriceImprovement('ASS-1', {
        financialYear: 'FY2024-25',
        materialCode: 'MAT-1',
        category: 'Packaging'
      });
      expect(result).toEqual(mockData);
    });

    it('returns null when response status is not ok', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Error'
      });

      const result = await Module2StrategicSourcingApi.getDirectPriceImprovement('ASS-1');
      expect(result).toBeNull();
    });

    it('returns null on fetch throw', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Fetch failed'));

      const result = await Module2StrategicSourcingApi.getDirectPriceImprovement('ASS-1');
      expect(result).toBeNull();
    });
  });

  describe('getEAuctionDynamicBidding', () => {
    it('returns data on successful response', async () => {
      const mockData = { candidates: [] };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockData })
      });

      const result = await Module2StrategicSourcingApi.getEAuctionDynamicBidding('ASS-1', {
        financialYear: 'FY2024-25',
        category: 'Metals',
        suitability: 'Candidate for Review',
        materialCode: 'MAT-2'
      });
      expect(result).toEqual(mockData);
    });

    it('returns null when response status is not ok', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      const result = await Module2StrategicSourcingApi.getEAuctionDynamicBidding('ASS-1');
      expect(result).toBeNull();
    });

    it('returns null on fetch throw', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await Module2StrategicSourcingApi.getEAuctionDynamicBidding('ASS-1');
      expect(result).toBeNull();
    });
  });

  describe('getVendorConsolidation', () => {
    it('returns data on successful response', async () => {
      const mockData = { opportunities: [] };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockData })
      });

      const result = await Module2StrategicSourcingApi.getVendorConsolidation('ASS-1', {
        category: 'Packaging',
        status: 'ACTIVE',
        materialCode: 'MAT-3'
      });
      expect(result).toEqual(mockData);
    });

    it('returns null when response status is not ok', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Error'
      });

      const result = await Module2StrategicSourcingApi.getVendorConsolidation('ASS-1');
      expect(result).toBeNull();
    });

    it('returns null on fetch throw', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Connection reset'));

      const result = await Module2StrategicSourcingApi.getVendorConsolidation('ASS-1');
      expect(result).toBeNull();
    });
  });

  describe('getFullUrl environment fallback', () => {
    it('uses NEXT_PUBLIC_BACKEND_URL when configured', async () => {
      const originalEnv = process.env.NEXT_PUBLIC_BACKEND_URL;
      process.env.NEXT_PUBLIC_BACKEND_URL = 'http://backend.example.com';

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: {} })
      });

      await Module2StrategicSourcingApi.getDashboardSummary();
      expectApiFetchCall(global.fetch, 'http://backend.example.com/api/module2/sourcing/dashboard');

      process.env.NEXT_PUBLIC_BACKEND_URL = originalEnv;
    });

    it('uses window.location.origin when in browser environment', async () => {
      const originalEnv = process.env.NEXT_PUBLIC_BACKEND_URL;
      delete process.env.NEXT_PUBLIC_BACKEND_URL;

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: {} })
      });

      await Module2StrategicSourcingApi.getDashboardSummary();
      expectApiFetchCall(global.fetch, expect.stringContaining('http://localhost:3000/api/module2/sourcing/dashboard'));

      process.env.NEXT_PUBLIC_BACKEND_URL = originalEnv;
    });

    it('falls back to relative URL when window is undefined', async () => {
      const originalEnv = process.env.NEXT_PUBLIC_BACKEND_URL;
      delete process.env.NEXT_PUBLIC_BACKEND_URL;
      const originalWindow = global.window;
      delete (global as { window?: unknown }).window;

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: {} })
      });

      await Module2StrategicSourcingApi.getDashboardSummary();
      expectApiFetchCall(global.fetch, '/api/module2/sourcing/dashboard');

      global.window = originalWindow;
      process.env.NEXT_PUBLIC_BACKEND_URL = originalEnv;
    });
  });

  describe('Excel Download URLs', () => {
    it('generates direct price download URL with financial year', () => {
      const url = Module2StrategicSourcingApi.getDirectPriceExcelDownloadUrl('ASS-1', 'FY2024-25');
      expect(url).toContain('/direct-price-improvement/export-excel');
      expect(url).toContain('assessmentId=ASS-1');
      expect(url).toContain('financialYear=FY2024-25');
    });

    it('generates direct price download URL without financial year or with ALL', () => {
      const urlAll = Module2StrategicSourcingApi.getDirectPriceExcelDownloadUrl('ASS-1', 'ALL');
      expect(urlAll).toContain('assessmentId=ASS-1');
      expect(urlAll).not.toContain('financialYear=');

      const urlDefault = Module2StrategicSourcingApi.getDirectPriceExcelDownloadUrl('ASS-1');
      expect(urlDefault).toContain('assessmentId=ASS-1');
      expect(urlDefault).not.toContain('financialYear=');
    });

    it('generates e-auction download URL with financial year', () => {
      const url = Module2StrategicSourcingApi.getEAuctionExcelDownloadUrl('ASS-1', 'FY2024-25');
      expect(url).toContain('/e-auction/export-excel');
      expect(url).toContain('assessmentId=ASS-1');
      expect(url).toContain('financialYear=FY2024-25');
    });

    it('generates e-auction download URL without financial year or with ALL', () => {
      const urlAll = Module2StrategicSourcingApi.getEAuctionExcelDownloadUrl('ASS-1', 'ALL');
      expect(urlAll).toContain('assessmentId=ASS-1');
      expect(urlAll).not.toContain('financialYear=');

      const urlDefault = Module2StrategicSourcingApi.getEAuctionExcelDownloadUrl('ASS-1');
      expect(urlDefault).toContain('assessmentId=ASS-1');
      expect(urlDefault).not.toContain('financialYear=');
    });

    it('generates vendor consolidation download URL with category', () => {
      const url = Module2StrategicSourcingApi.getVendorConsolidationExcelDownloadUrl('ASS-1', 'Packaging');
      expect(url).toContain('/vendor-consolidation/export-excel');
      expect(url).toContain('assessmentId=ASS-1');
      expect(url).toContain('category=Packaging');
    });

    it('generates vendor consolidation download URL without category or with ALL', () => {
      const urlAll = Module2StrategicSourcingApi.getVendorConsolidationExcelDownloadUrl('ASS-1', 'ALL');
      expect(urlAll).toContain('assessmentId=ASS-1');
      expect(urlAll).not.toContain('category=');

      const urlDefault = Module2StrategicSourcingApi.getVendorConsolidationExcelDownloadUrl('ASS-1');
      expect(urlDefault).toContain('assessmentId=ASS-1');
      expect(urlDefault).not.toContain('category=');
    });
  });
});
