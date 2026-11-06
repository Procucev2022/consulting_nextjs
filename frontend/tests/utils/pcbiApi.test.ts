import { expectApiFetchCall } from './apiFetchAssertions';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pcbiApiClient } from '../../src/utils/pcbiApi';
import { PCBI_HISTORICAL_OBSERVATIONS_ENDPOINT } from '../../src/constants/pcbiHistorical';
import { UI_STRINGS } from '../../src/constants/uiStrings';
import { authApiClient } from '../../src/utils/authApi';

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
    expectApiFetchCall(global.fetch, '/api/pcbi/dashboard');
    expect(res).toEqual(mockData);
  });

  it('getPCBIMasterBenchmarks should support sector filter or all', async () => {
    const mockData = { benchmarks: [] };
    (global.fetch as any).mockResolvedValue({
      json: async () => mockData
    });

    await pcbiApiClient.getPCBIMasterBenchmarks('Cement');
    expectApiFetchCall(global.fetch, expect.stringContaining('/api/pcbi/master/benchmarks?sector=Cement'));

    await pcbiApiClient.getPCBIMasterBenchmarks();
    expectApiFetchCall(global.fetch, '/api/pcbi/master/benchmarks');
  });

  it('getPCBIWeeklyIndices should fetch with pcbiId and limit', async () => {
    const mockData = { indices: [] };
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => mockData
    });

    const res = await pcbiApiClient.getPCBIWeeklyIndices('PCBI-001', 26);
    expectApiFetchCall(global.fetch, '/api/pcbi/indices/PCBI-001?limit=26');
    expect(res).toEqual(mockData);
  });

  it('loads validated archived monthly PCBI observations with bounded filters', async () => {
    const mockResponse = {
      success: true,
      data: {
        archiveOnly: true,
        frequency: 'MONTHLY',
        count: 0,
        observations: []
      }
    };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: vi.fn().mockReturnValue('req-pcbi-history-1') },
      json: async () => mockResponse
    });

    const result = await pcbiApiClient.getPCBIHistoricalObservations({
      pcbiId: 'PCBI-TEST', startDate: '2021-01-01', endDate: '2021-12-31', limit: 20
    });

    expectApiFetchCall(global.fetch,
      `${PCBI_HISTORICAL_OBSERVATIONS_ENDPOINT}?limit=20&pcbiId=PCBI-TEST&startDate=2021-01-01&endDate=2021-12-31`
    );
    expect(result).toMatchObject(mockResponse);
  });

  it('rejects invalid historical filters before issuing a request', async () => {
    await expect(pcbiApiClient.getPCBIHistoricalObservations({
      startDate: '2022-01-01', endDate: '2021-01-01'
    })).rejects.toThrow(UI_STRINGS.pcbiAdmin.historicalObservationsInvalidQuery);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('logs and rejects an unsuccessful historical observations response with its request ID', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 503,
      headers: { get: vi.fn().mockReturnValue('req-pcbi-history-2') }
    });

    await expect(pcbiApiClient.getPCBIHistoricalObservations()).rejects.toThrow(
      UI_STRINGS.pcbiAdmin.historicalObservationsHttpFailure(503, 'req-pcbi-history-2')
    );
  });

  it('uses the unavailable request reference when an HTTP error has no correlation header', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 503,
      headers: { get: vi.fn().mockReturnValue(null) }
    });

    await expect(pcbiApiClient.getPCBIHistoricalObservations()).rejects.toThrow(
      UI_STRINGS.pcbiAdmin.historicalObservationsHttpFailure(
        503, UI_STRINGS.pcbiAdmin.historicalRequestIdUnavailable
      )
    );
  });

  it('rejects a malformed historical observations response and logs schema failure', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: vi.fn().mockReturnValue(null) },
      json: async () => ({ success: true, data: { archiveOnly: false } })
    });

    await expect(pcbiApiClient.getPCBIHistoricalObservations()).rejects.toThrow(
      UI_STRINGS.pcbiAdmin.historicalObservationsInvalidResponse(UI_STRINGS.pcbiAdmin.historicalRequestIdUnavailable)
    );
  });

  it('preserves network failures while logging the PCBI historical endpoint context', async () => {
    const networkFailure = new Error('Connection reset');
    (global.fetch as any).mockRejectedValueOnce(networkFailure);

    await expect(pcbiApiClient.getPCBIHistoricalObservations()).rejects.toBe(networkFailure);
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
    expectApiFetchCall(global.fetch, '/api/upgrade/request', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }));
    expect(res).toEqual(mockResp);
  });

  it('getUpgradeRequests should support status filter or all', async () => {
    const mockData = { requests: [] };
    (global.fetch as any).mockResolvedValue({
      json: async () => mockData
    });

    await pcbiApiClient.getUpgradeRequests('PENDING');
    expectApiFetchCall(global.fetch, expect.stringContaining('/api/upgrade/requests?status=PENDING'), { headers: {} });

    await pcbiApiClient.getUpgradeRequests();
    expectApiFetchCall(global.fetch, '/api/upgrade/requests', { headers: {} }, -1);
  });

  it('sends the stored administrator bearer token on authenticated upgrade requests', async () => {
    vi.spyOn(authApiClient, 'getStoredToken').mockReturnValue('admin-test-token');
    (global.fetch as any).mockResolvedValueOnce({ json: async () => ({ requests: [] }) });
    await pcbiApiClient.getUpgradeRequests();
    expectApiFetchCall(global.fetch, '/api/upgrade/requests', {
      headers: { Authorization: 'Bearer admin-test-token' }
    });
  });

  it('generateUpgradeOTP should perform POST /api/upgrade/generate-otp', async () => {
    const mockResp = { success: true, otp: '123456' };
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => mockResp
    });

    const res = await pcbiApiClient.generateUpgradeOTP('REQ-1', 'ADM-1');
    expectApiFetchCall(global.fetch, '/api/upgrade/generate-otp', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: 'REQ-1', adminUserId: 'ADM-1' })
      }));
    expect(res).toEqual(mockResp);
  });

  it('getPCBIBenchmarks should query /api/pcbi/benchmarks', async () => {
    const mockData = { benchmarks: [] };
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => mockData
    });

    const res = await pcbiApiClient.getPCBIBenchmarks();
    expectApiFetchCall(global.fetch, '/api/pcbi/benchmarks');
    expect(res).toEqual(mockData);
  });

  it('requestAdminUpgradeOTP should perform POST /api/upgrade/admin/request-otp', async () => {
    const mockResp = { success: true };
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => mockResp
    });

    const res = await pcbiApiClient.requestAdminUpgradeOTP('REQ-1');
    expectApiFetchCall(global.fetch, '/api/upgrade/admin/request-otp', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: 'REQ-1' })
      }));
    expect(res).toEqual(mockResp);
  });

  it('verifyAdminUpgradeOTP should perform POST /api/upgrade/admin/verify-otp-and-generate-code', async () => {
    const mockResp = { success: true, code: 'UPG-999' };
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => mockResp
    });

    const res = await pcbiApiClient.verifyAdminUpgradeOTP('REQ-1', '654321');
    expectApiFetchCall(global.fetch, '/api/upgrade/admin/verify-otp-and-generate-code', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: 'REQ-1', otp: '654321' })
      }));
    expect(res).toEqual(mockResp);
  });

  it('loginWithUpgradeCode should perform POST /api/upgrade/login-with-code', async () => {
    const mockResp = { success: true, token: 'JWT-TOKEN' };
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => mockResp
    });

    const res = await pcbiApiClient.loginWithUpgradeCode('test@example.com', 'CODE-123');
    expectApiFetchCall(global.fetch, '/api/upgrade/login-with-code', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', code: 'CODE-123' })
      }));
    expect(res).toEqual(mockResp);
  });
});
