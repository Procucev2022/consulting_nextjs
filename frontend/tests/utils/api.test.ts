import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient } from '../../src/utils/api';

describe('apiClient', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('getTenant should perform GET /api/tenant and return data', async () => {
    const mockData = { tenant_id: 'TNT-123', enterprise_name: 'Test Enterprise' };
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({ success: true, data: mockData })
    });

    const res = await apiClient.getTenant();
    expect(global.fetch).toHaveBeenCalledWith('/api/tenant');
    expect(res).toEqual(mockData);
  });

  it('updateTenant should perform PUT /api/tenant and return data', async () => {
    const mockData = { tenant_id: 'TNT-123', region: 'EU' };
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({ success: true, data: mockData })
    });

    const res = await apiClient.updateTenant({ region: 'EU' });
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/tenant',
      expect.objectContaining({
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ region: 'EU' })
      })
    );
    expect(res).toEqual(mockData);
  });

  it('getIngestionData should perform GET /api/ingestion and return data', async () => {
    const mockData = { queue: [], validationRecords: [] };
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({ success: true, data: mockData })
    });

    const res = await apiClient.getIngestionData();
    expect(global.fetch).toHaveBeenCalledWith('/api/ingestion');
    expect(res).toEqual(mockData);
  });

  it('addIngestionFile should perform POST /api/ingestion and return data', async () => {
    const mockFile = { file_name: 'test.xlsx' };
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({ success: true, data: [mockFile] })
    });

    const res = await apiClient.addIngestionFile(mockFile);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/ingestion',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockFile)
      })
    );
    expect(res).toEqual([mockFile]);
  });

  it('updateValidationRecord should perform PATCH /api/ingestion and return data', async () => {
    const updated = { record_id: 'REC-1', po_number: 'PO-UPDATED' };
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({ success: true, data: updated })
    });

    const res = await apiClient.updateValidationRecord('REC-1', { po_number: 'PO-UPDATED' });
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/ingestion',
      expect.objectContaining({
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ record_id: 'REC-1', po_number: 'PO-UPDATED' })
      })
    );
    expect(res).toEqual(updated);
  });

  it('applyBlanketRemediation should perform POST /api/ingestion/remediate', async () => {
    const mockRes = { updatedCount: 5, records: [] };
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({ success: true, data: mockRes })
    });

    const res = await apiClient.applyBlanketRemediation();
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/ingestion/remediate',
      expect.objectContaining({ method: 'POST' })
    );
    expect(res).toEqual(mockRes);
  });

  it('resetValidationRecords should perform DELETE /api/ingestion', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({ success: true, data: [] })
    });

    const res = await apiClient.resetValidationRecords();
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/ingestion',
      expect.objectContaining({ method: 'DELETE' })
    );
    expect(res).toEqual([]);
  });

  it('getCategories should perform GET /api/categories', async () => {
    const mockData = { categories: [], categoryDetails: [] };
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({ success: true, data: mockData })
    });

    const res = await apiClient.getCategories();
    expect(global.fetch).toHaveBeenCalledWith('/api/categories');
    expect(res).toEqual(mockData);
  });

  it('getVendors should perform GET /api/vendors', async () => {
    const mockData = { vendorRankings: [], vendorDetails: [] };
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({ success: true, data: mockData })
    });

    const res = await apiClient.getVendors();
    expect(global.fetch).toHaveBeenCalledWith('/api/vendors');
    expect(res).toEqual(mockData);
  });

  it('mergeVendor should perform POST /api/vendors', async () => {
    const mockResp = { success: true, message: 'Merged' };
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => mockResp
    });

    const res = await apiClient.mergeVendor('target', 'MST-1', 'Target Corp');
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/vendors',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetName: 'target', masterId: 'MST-1', canonicalName: 'Target Corp' })
      })
    );
    expect(res).toEqual(mockResp);
  });

  it('getSavingsOpportunities should perform GET /api/savings', async () => {
    const mockData = { opportunities: [], totalPotentialSavingsCr: 12.5 };
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({ success: true, data: mockData })
    });

    const res = await apiClient.getSavingsOpportunities();
    expect(global.fetch).toHaveBeenCalledWith('/api/savings');
    expect(res).toEqual(mockData);
  });

  it('deployOpportunity should perform POST /api/savings', async () => {
    const mockOpp = { opp_id: 'OPP-1', status: 'Deployed' };
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({ success: true, data: mockOpp })
    });

    const res = await apiClient.deployOpportunity('OPP-1', 'proCPX');
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/savings',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opp_id: 'OPP-1', targetModule: 'proCPX' })
      })
    );
    expect(res).toEqual(mockOpp);
  });

  it('calculateCommercialSaaS should perform POST /api/conversion', async () => {
    const mockData = { estimatedSavingsCr: 50 };
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => mockData
    });

    const res = await apiClient.calculateCommercialSaaS(500, 10, 1);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/conversion',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ annualSpendCr: 500, savingsRate: 10, saasFeeRate: 1 })
      })
    );
    expect(res).toEqual(mockData);
  });

  it('getExecutiveReport should perform GET /api/report', async () => {
    const mockData = { success: true, data: { report: 'Executive' } };
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => mockData
    });

    const res = await apiClient.getExecutiveReport();
    expect(global.fetch).toHaveBeenCalledWith('/api/report');
    expect(res).toEqual(mockData);
  });

  describe('apiClient Input Validation Failures', () => {
    it('should throw validation error when updateTenant receives invalid data', async () => {
      await expect(apiClient.updateTenant({ enterprise_name: '' })).rejects.toThrow('Invalid tenant updates');
    });

    it('should throw validation error when addIngestionFile receives invalid data', async () => {
      await expect(apiClient.addIngestionFile({ file_name: '' })).rejects.toThrow('Invalid file data');
    });

    it('should throw validation error when updateValidationRecord receives invalid data', async () => {
      await expect(apiClient.updateValidationRecord('', { resolved: true })).rejects.toThrow('Invalid record update');
    });

    it('should throw validation error when mergeVendor receives invalid data', async () => {
      await expect(apiClient.mergeVendor('', 'M1', 'Name')).rejects.toThrow('Invalid vendor merge payload');
    });

    it('should throw validation error when deployOpportunity receives invalid data', async () => {
      await expect(apiClient.deployOpportunity('', 'proCPX')).rejects.toThrow('Invalid deploy payload');
    });

    it('should throw validation error when calculateCommercialSaaS receives invalid data', async () => {
      await expect(apiClient.calculateCommercialSaaS(-100, 10, 1)).rejects.toThrow('Invalid commercial metrics calculation');
    });
  });
});

