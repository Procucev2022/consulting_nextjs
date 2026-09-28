import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pcbiApiClient } from '../../src/utils/pcbiApi';

describe('pcbiApiClient Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn();
  });

  it('getPCBIDashboard should perform GET /api/pcbi/dashboard', async () => {
    const mockData = { summary: { total_spend_inr_cr: 100 } };
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => mockData
    });

    const res = await pcbiApiClient.getPCBIDashboard();
    expect(global.fetch).toHaveBeenCalledWith('/api/pcbi/dashboard');
    expect(res).toEqual(mockData);
  });

  it('runPCBICalculation should perform POST /api/pcbi/calculate', async () => {
    const mockResult = { success: true, count: 10 };
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => mockResult
    });

    const res = await pcbiApiClient.runPCBICalculation([{ item: 'Bearing' }]);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/pcbi/calculate',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: [{ item: 'Bearing' }] })
      })
    );
    expect(res).toEqual(mockResult);
  });

  it('getPCBIOpportunities should query /api/pcbi/opportunity with params', async () => {
    const mockData = { opportunities: [] };
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => mockData
    });

    const res = await pcbiApiClient.getPCBIOpportunities({
      search: 'oil',
      sector: 'Steel',
      category: 'Direct',
      vendor: 'SKF',
      quality: 'A',
      page: 1,
      limit: 10
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/pcbi/opportunity?search=oil&sector=Steel&category=Direct&vendor=SKF&quality=A&page=1&limit=10')
    );
    expect(res).toEqual(mockData);
  });

  it('getPCBIOpportunityAudit should query by id', async () => {
    const mockAudit = { audit: { transaction_id: 'TX-1' } };
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => mockAudit
    });

    const res = await pcbiApiClient.getPCBIOpportunityAudit('OPP-001');
    expect(global.fetch).toHaveBeenCalledWith('/api/pcbi/opportunity/OPP-001');
    expect(res).toEqual(mockAudit);
  });

  it('getPCBIBasePurchases should query /api/pcbi/base-purchases', async () => {
    const mockData = { base_purchases: [] };
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => mockData
    });

    const res = await pcbiApiClient.getPCBIBasePurchases();
    expect(global.fetch).toHaveBeenCalledWith('/api/pcbi/base-purchases');
    expect(res).toEqual(mockData);
  });

  it('resetPCBIBasePurchase should perform POST /api/pcbi/base-purchase/reset', async () => {
    const mockResp = { success: true };
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => mockResp
    });

    const payload = { comparable_key: 'KEY-01', reason: 'Defective batch', user_name: 'Admin' };
    const res = await pcbiApiClient.resetPCBIBasePurchase(payload);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/pcbi/base-purchase/reset',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    );
    expect(res).toEqual(mockResp);
  });

  it('getPCBIMaterialTrend should query with comparable_key', async () => {
    const mockTrend = { trend: [] };
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => mockTrend
    });

    const res = await pcbiApiClient.getPCBIMaterialTrend('KEY-01');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/pcbi/material-trend?comparable_key=KEY-01')
    );
    expect(res).toEqual(mockTrend);
  });

  it('getPCBIMasterBenchmarks should support sector filter or all', async () => {
    const mockData = { benchmarks: [] };
    (global.fetch as any).mockResolvedValue({
      json: async () => mockData
    });

    await pcbiApiClient.getPCBIMasterBenchmarks('Cement');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/pcbi/master/benchmarks?sector=Cement')
    );

    await pcbiApiClient.getPCBIMasterBenchmarks();
    expect(global.fetch).toHaveBeenCalledWith('/api/pcbi/master/benchmarks');
  });

  it('getPCBIWeeklyIndices should fetch with pcbiId and limit', async () => {
    const mockData = { indices: [] };
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => mockData
    });

    const res = await pcbiApiClient.getPCBIWeeklyIndices('PCBI-001', 26);
    expect(global.fetch).toHaveBeenCalledWith('/api/pcbi/indices/PCBI-001?limit=26');
    expect(res).toEqual(mockData);
  });

  it('submitUpgradeRequest should perform POST /api/upgrade/request', async () => {
    const mockResp = { success: true, request_id: 'REQ-1' };
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => mockResp
    });

    const payload = {
      customer_name: 'John Doe',
      customer_email: 'john@example.com',
      customer_phone: '9876543210',
      company_name: 'Acme Corp',
      current_tier: 'BRONZE',
      requested_tier: 'GOLD'
    };

    const res = await pcbiApiClient.submitUpgradeRequest(payload);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/upgrade/request',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    );
    expect(res).toEqual(mockResp);
  });

  it('getUpgradeRequests should support status filter or all', async () => {
    const mockData = { requests: [] };
    (global.fetch as any).mockResolvedValue({
      json: async () => mockData
    });

    await pcbiApiClient.getUpgradeRequests('PENDING');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/upgrade/requests?status=PENDING')
    );

    await pcbiApiClient.getUpgradeRequests();
    expect(global.fetch).toHaveBeenCalledWith('/api/upgrade/requests');
  });

  it('generateUpgradeOTP should perform POST /api/upgrade/generate-otp', async () => {
    const mockResp = { success: true, otp: '123456' };
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => mockResp
    });

    const res = await pcbiApiClient.generateUpgradeOTP('REQ-1', 'ADM-1');
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/upgrade/generate-otp',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: 'REQ-1', adminUserId: 'ADM-1' })
      })
    );
    expect(res).toEqual(mockResp);
  });

  it('getPCBIBenchmarks should query /api/pcbi/benchmarks', async () => {
    const mockData = { benchmarks: [] };
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => mockData
    });

    const res = await pcbiApiClient.getPCBIBenchmarks();
    expect(global.fetch).toHaveBeenCalledWith('/api/pcbi/benchmarks');
    expect(res).toEqual(mockData);
  });

  it('requestAdminUpgradeOTP should perform POST /api/upgrade/admin/request-otp', async () => {
    const mockResp = { success: true };
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => mockResp
    });

    const res = await pcbiApiClient.requestAdminUpgradeOTP('REQ-1');
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/upgrade/admin/request-otp',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: 'REQ-1' })
      })
    );
    expect(res).toEqual(mockResp);
  });

  it('verifyAdminUpgradeOTP should perform POST /api/upgrade/admin/verify-otp-and-generate-code', async () => {
    const mockResp = { success: true, code: 'UPG-999' };
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => mockResp
    });

    const res = await pcbiApiClient.verifyAdminUpgradeOTP('REQ-1', '654321');
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/upgrade/admin/verify-otp-and-generate-code',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: 'REQ-1', otp: '654321' })
      })
    );
    expect(res).toEqual(mockResp);
  });

  it('loginWithUpgradeCode should perform POST /api/upgrade/login-with-code', async () => {
    const mockResp = { success: true, token: 'JWT-TOKEN' };
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => mockResp
    });

    const res = await pcbiApiClient.loginWithUpgradeCode('test@example.com', 'CODE-123');
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/upgrade/login-with-code',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', code: 'CODE-123' })
      })
    );
    expect(res).toEqual(mockResp);
  });
});
