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

  it('getDashboardOverviewGraphQL should perform batch GraphQL query and return dashboard overview data', async () => {
    const mockOverview = {
      tenant: { enterprise_name: 'Test Tenant' },
      categories: [],
      opportunities: [],
      funnelStages: [],
      ingestionQueue: [],
      validationRecords: [],
      queryMetrics: {
        totalQueries: 5,
        slowQueries: 0,
        cacheHitRatio: 100,
        averageDurationMs: 1.2
      }
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { dashboardOverview: mockOverview }
      })
    });

    const res = await apiClient.getDashboardOverviewGraphQL();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/graphql'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' })
      })
    );
    expect(res).toEqual(mockOverview);
  });

  it('getPCBIDashboard should perform GET /api/pcbi/dashboard', async () => {
    const mockDash = { summary: { total_spend_inr_cr: 100 } };
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => mockDash
    });

    const res = await apiClient.getPCBIDashboard();
    expect(global.fetch).toHaveBeenCalledWith('/api/pcbi/dashboard');
    expect(res).toEqual(mockDash);
  });

  it('getPCBIExplainabilityAudit should perform GET /api/pcbi/opportunity/:id', async () => {
    const mockAudit = { transaction_id: 'TX-01', material_code: 'MAT-01' };
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({ audit: mockAudit })
    });

    const res = await apiClient.getPCBIExplainabilityAudit('TX-01');
    expect(global.fetch).toHaveBeenCalledWith('/api/pcbi/opportunity/TX-01');
    expect(res).toEqual(mockAudit);
  });

  it('getConsolidatedSavings should perform GET /api/savings/consolidated', async () => {
    const mockData = { opportunities: [], overlaps: [], waterfallMetrics: {} };
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({ data: mockData })
    });

    const res = await apiClient.getConsolidatedSavings();
    expect(global.fetch).toHaveBeenCalledWith('/api/savings/consolidated');
    expect(res).toEqual(mockData);
  });

  it('updateActionPlan should perform POST /api/savings/action-plan/update', async () => {
    const mockPlan = { id: 'ACT-01', status: 'In Progress' };
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({ data: mockPlan })
    });

    const res = await apiClient.updateActionPlan('ACT-01', { status: 'In Progress', owner: 'Procurement' });
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/savings/action-plan/update',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionId: 'ACT-01', status: 'In Progress', owner: 'Procurement' })
      })
    );
    expect(res).toEqual(mockPlan);
  });

  it('updateSavingsOpportunityStatus should perform POST /api/savings/opportunity/status', async () => {
    const mockOpp = { opportunity_id: 'OPP-01', status: 'APPROVED' };
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({ data: mockOpp })
    });

    const res = await apiClient.updateSavingsOpportunityStatus('OPP-01', 'APPROVED');
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/savings/opportunity/status',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opp_id: 'OPP-01', status: 'APPROVED' })
      })
    );
    expect(res).toEqual(mockOpp);
  });

  it('getDBMetrics should perform GET /api/db/metrics', async () => {
    const mockMetrics = { queryCount: 10 };
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({ data: mockMetrics })
    });

    const res = await apiClient.getDBMetrics();
    expect(global.fetch).toHaveBeenCalledWith('/api/db/metrics');
    expect(res).toEqual(mockMetrics);
  });

  it('getDBTableData should perform GET /api/db/tables with query params', async () => {
    const mockData = { rows: [], total: 0 };
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({ data: mockData })
    });

    const res = await apiClient.getDBTableData('tenants', 1, 20, 'Acme');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/db/tables?table=tenants&page=1&limit=20&search=Acme')
    );
    expect(res).toEqual(mockData);
  });

  it('testDBConnection should perform POST /api/db/test-connection', async () => {
    const mockData = { success: true, latencyMs: 2.5 };
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => mockData
    });

    const res = await apiClient.testDBConnection();
    expect(global.fetch).toHaveBeenCalledWith('/api/db/test-connection', { method: 'POST' });
    expect(res).toEqual(mockData);
  });

  it('getVendorDetails should perform GET /api/vendors?details=true', async () => {
    const mockDetails = [{ vendor_name: 'Vendor A', year: 2024 }];
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({ data: { vendorDetails: mockDetails } })
    });

    const res = await apiClient.getVendorDetails();
    expect(global.fetch).toHaveBeenCalledWith('/api/vendors?details=true');
    expect(res).toEqual(mockDetails);
  });

  it('getCurrencyConversion should perform GET /api/currency with and without date', async () => {
    const mockData = { from: 'USD', amount: 100, converted: 8300 };
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({ data: mockData })
    });

    const res1 = await apiClient.getCurrencyConversion('USD', 100, 2024);
    expect(global.fetch).toHaveBeenCalledWith('/api/currency?from=USD&amount=100&date=2024');
    expect(res1).toEqual(mockData);

    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({ data: mockData })
    });
    const res2 = await apiClient.getCurrencyConversion('USD', 100);
    expect(global.fetch).toHaveBeenCalledWith('/api/currency?from=USD&amount=100');
    expect(res2).toEqual(mockData);
  });

  it('getDBStatus should perform GET /api/db/status', async () => {
    const mockHealth = { status: 'healthy', latencyMs: 5 };
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({ data: mockHealth })
    });

    const res = await apiClient.getDBStatus();
    expect(global.fetch).toHaveBeenCalledWith('/api/db/status');
    expect(res).toEqual(mockHealth);
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

    it('should throw validation error when updateActionPlan receives invalid data', async () => {
      await expect(apiClient.updateActionPlan('', { status: 'In Progress' })).rejects.toThrow('Invalid action plan update');
    });

    it('should throw validation error when updateSavingsOpportunityStatus receives invalid data', async () => {
      await expect(apiClient.updateSavingsOpportunityStatus('', 'APPROVED')).rejects.toThrow('Invalid opportunity status update');
    });
  });
});

