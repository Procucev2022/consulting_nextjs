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
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/module2/sourcing/dashboard?refresh=true'));
    });

    it('returns null and logs debug when fetch fails', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await Module2StrategicSourcingApi.getDashboardSummary();
      expect(result).toBeNull();
    });

    it('returns null when response status is not ok', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const result = await Module2StrategicSourcingApi.getDashboardSummary();
      expect(result).toBeNull();
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
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/module2/sourcing/categories?refresh=true'));
    });

    it('returns empty array when response has no data or no profiles property', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      });

      const result = await Module2StrategicSourcingApi.getCategoryProfiles();
      expect(result).toEqual([]);
    });

    it('returns empty array when response status is not ok', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      });

      const result = await Module2StrategicSourcingApi.getCategoryProfiles();
      expect(result).toEqual([]);
    });

    it('returns empty array on network failure', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network failure'));

      const result = await Module2StrategicSourcingApi.getCategoryProfiles();
      expect(result).toEqual([]);
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
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining(encodeURIComponent('cat-special/1')));
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

  describe('getFullUrl environment fallback', () => {
    it('uses window.location.origin when in browser environment', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: {} })
      });

      await Module2StrategicSourcingApi.getDashboardSummary();
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('http://localhost:3000/api/module2/sourcing/dashboard'));
    });

    it('falls back to localhost URL when window is undefined', async () => {
      const originalWindow = global.window;
      delete (global as { window?: unknown }).window;

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: {} })
      });

      await Module2StrategicSourcingApi.getDashboardSummary();
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('http://localhost:5000/api/module2/sourcing/dashboard'));

      global.window = originalWindow;
    });
  });
});
