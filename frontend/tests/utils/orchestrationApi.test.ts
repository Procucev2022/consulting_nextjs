import { expectApiFetchCall } from './apiFetchAssertions';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { OrchestrationApiClient } from '../../src/utils/orchestrationApi';
import { apiClient } from '../../src/utils/api';
import { DEFAULT_QUALITY_GATE_CHECKLIST } from '../../src/constants/analysisOrchestration';
import { UI_STRINGS } from '../../src/constants/uiStrings';
import { frontendLogger } from '../../src/utils/logger';

describe('OrchestrationApiClient Unit Tests', () => {
  let client: OrchestrationApiClient;
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    client = new OrchestrationApiClient();
    vi.spyOn(apiClient, 'getStoredToken').mockReturnValue('mock-jwt-token');
    vi.spyOn(apiClient, 'getStoredUser').mockReturnValue({
      id: 'usr-101',
      name: 'Admin User',
      email: 'admin@procucev.com',
      role: 'ADMIN',
      company_name: 'Procucev Corp'
    } as any);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const mockFetchResponse = (data: any, ok: boolean = true, status: number = 200) => {
    global.fetch = vi.fn().mockResolvedValue({
      ok,
      status,
      json: vi.fn().mockResolvedValue(data)
    } as any);
  };

  it('should fetch jobs with query filters', async () => {
    mockFetchResponse({ success: true, data: [{ analysisJobId: 'job-1' }] });
    const jobs = await client.getJobs({ status: 'ACTION_REQUIRED', search: 'Acme' });

    expect(jobs.length).toBe(1);
    expectApiFetchCall(global.fetch, expect.stringContaining('/api/orchestration/jobs?status=ACTION_REQUIRED&search=Acme'), expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer mock-jwt-token',
          'x-user-role': 'ADMIN'
        })
      }));
  });

  it('should get job details and readiness', async () => {
    mockFetchResponse({ success: true, data: { job: { analysisJobId: 'job-1' } } });
    const details = await client.getJobDetails('job-1');
    expect(details?.job.analysisJobId).toBe('job-1');

    mockFetchResponse({ success: true, data: { overallReadiness: 'READY_TO_GENERATE' } });
    const readiness = await client.getReadiness('job-1');
    expect(readiness?.overallReadiness).toBe('READY_TO_GENERATE');
  });

  it('should resolve PCBI gap and generate download dataset URL', async () => {
    mockFetchResponse({ success: true, message: 'Resolved' });
    const result = await client.resolvePCBIGap('job-1', 'gap-1', {
      action: 'MAP_EXISTING',
      targetPcbiSeries: 'PCBI-001'
    });
    expect(result.success).toBe(true);

    const downloadUrl = client.getDownloadDatasetUrl('job-1', 'v1');
    expect(downloadUrl).toBe('/api/orchestration/jobs/job-1/download-dataset/v1');
    expect(client.getDownloadDatasetUrl('job/1', 'v 2')).toBe('/api/orchestration/jobs/job%2F1/download-dataset/v%202');
  });

  describe('dataset downloads', () => {
    it('downloads the selected version with authenticated request headers', async () => {
      const workbook = new Blob(['workbook-bytes']);
      global.fetch = vi.fn().mockResolvedValue({ ok: true, blob: vi.fn().mockResolvedValue(workbook) });

      await expect(client.downloadDataset('job-1', 'v1', 'Spend_Data.xlsx')).resolves.toBe(workbook);
      expectApiFetchCall(global.fetch, '/api/orchestration/jobs/job-1/download-dataset/v1', expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer mock-jwt-token' }) }));
    });

    it('reports connection failures with actionable context and logs the failure', async () => {
      const networkError = new Error('offline');
      global.fetch = vi.fn().mockRejectedValue(networkError);
      vi.spyOn(frontendLogger, 'error').mockImplementation(() => ({}) as never);

      await expect(client.downloadDataset('job-1', 'v1', 'Spend_Data.xlsx'))
        .rejects.toThrow(UI_STRINGS.orchestration.datasetDownloadNetworkFailure('Spend_Data.xlsx', 'offline'));
      expect(frontendLogger.error).toHaveBeenCalledWith(
        'Source dataset download request failed',
        expect.objectContaining({ jobId: 'job-1', versionId: 'v1', fileName: 'Spend_Data.xlsx' }),
        networkError
      );

      global.fetch = vi.fn().mockRejectedValue('connection reset');
      await expect(client.downloadDataset('job-1', 'v1', 'Spend_Data.xlsx'))
        .rejects.toThrow(UI_STRINGS.orchestration.datasetDownloadNetworkFailure('Spend_Data.xlsx', 'connection reset'));
    });

    it('uses server details and request ID for HTTP failures, with a fallback when the response is not JSON', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: false, status: 403, headers: new Headers({ 'x-request-id': 'req-1' }),
          json: vi.fn().mockResolvedValue({ message: 'Version access denied' })
        })
        .mockResolvedValueOnce({
          ok: false, status: 503, headers: new Headers(),
          json: vi.fn().mockRejectedValue(new Error('invalid JSON'))
        });
      vi.spyOn(frontendLogger, 'error').mockImplementation(() => ({}) as never);

      await expect(client.downloadDataset('job-1', 'v1', 'Spend_Data.xlsx'))
        .rejects.toThrow(UI_STRINGS.orchestration.datasetDownloadHttpFailure('Spend_Data.xlsx', 403, 'Version access denied', 'req-1'));
      await expect(client.downloadDataset('job-1', 'v1', 'Spend_Data.xlsx'))
        .rejects.toThrow(UI_STRINGS.orchestration.datasetDownloadHttpFailure(
          'Spend_Data.xlsx', 503, UI_STRINGS.orchestration.datasetDownloadResponseFailure('Spend_Data.xlsx'), UI_STRINGS.common.notAvailable
        ));
      expect(frontendLogger.error).toHaveBeenCalledTimes(2);
    });

    it('reports and logs a response body read failure', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: true, blob: vi.fn().mockRejectedValue(new Error('stream interrupted')) });
      vi.spyOn(frontendLogger, 'error').mockImplementation(() => ({}) as never);

      await expect(client.downloadDataset('job-1', 'v1', 'Spend_Data.xlsx'))
        .rejects.toThrow(UI_STRINGS.orchestration.datasetDownloadResponseFailure('Spend_Data.xlsx'));
      expect(frontendLogger.error).toHaveBeenCalledWith(
        'Source dataset response body could not be read',
        expect.objectContaining({ jobId: 'job-1', versionId: 'v1', fileName: 'Spend_Data.xlsx' }),
        expect.any(Error)
      );
    });
  });

  it('validates PCBI resolutions before making a network request', async () => {
    await expect(client.resolvePCBIGap('job-1', 'gap-1', { action: 'MAP_EXISTING' }))
      .rejects.toThrow(UI_STRINGS.orchestration.pcbiResolutionMissingSeries);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should upload corrected dataset', async () => {
    mockFetchResponse({ success: true, message: 'Version v2 created' });
    const result = await client.uploadCorrectedDataset('job-1', {
      fileName: 'corrected.xlsx',
      fileSize: 5,
      checksum: 'a'.repeat(64),
      fileBase64: 'd29ya2I=',
      reason: 'INCORRECT_CATEGORY_MAPPING'
    });
    expect(result.success).toBe(true);
  });

  it('should generate report, confirm quality gate, and approve report', async () => {
    mockFetchResponse({ success: true, message: 'Report generated' });
    const genRes = await client.generateReport('job-1');
    expect(genRes.success).toBe(true);

    mockFetchResponse({ success: true, message: 'Gate confirmed' });
    const gateRes = await client.confirmQualityGate('job-1', DEFAULT_QUALITY_GATE_CHECKLIST);
    expect(gateRes.success).toBe(true);

    mockFetchResponse({ success: true, message: 'Report approved' });
    const appRes = await client.approveAndSubmitReport('job-1', 'RPT-1');
    expect(appRes.success).toBe(true);
  });

  it('should resend notification and supersede report', async () => {
    mockFetchResponse({ success: true, message: 'Resent' });
    const resendRes = await client.resendNotification('job-1', 'RPT-1');
    expect(resendRes.success).toBe(true);

    mockFetchResponse({ success: true, message: 'Superseded' });
    const supRes = await client.supersedeReport('job-1', 'RPT-1', 'Revised data received');
    expect(supRes.success).toBe(true);
  });

  it('should record customer view, acknowledgement, and request correction', async () => {
    mockFetchResponse({ success: true, message: 'View recorded' });
    const viewRes = await client.recordCustomerView('job-1', 'RPT-1');
    expect(viewRes.success).toBe(true);

    mockFetchResponse({ success: true, acknowledgement: { status: 'ACKNOWLEDGED' } });
    const ackRes = await client.acknowledgeReport('job-1', 'RPT-1', 'Confirmed by VP');
    expect(ackRes.success).toBe(true);

    mockFetchResponse({ success: true, message: 'Correction requested' });
    const reqRes = await client.requestCorrection('job-1', {
      category: 'SUPPLIER_MAPPING',
      description: 'Vendor mapping incorrect'
    });
    expect(reqRes.success).toBe(true);
  });

  it('should fetch admin KPIs, notifications, and audit trail', async () => {
    mockFetchResponse({ success: true, data: { totalAnalyses: 5 } });
    const kpis = await client.getAdminKPIs();
    expect(kpis?.totalAnalyses).toBe(5);

    mockFetchResponse({ success: true, data: [{ notificationId: 'notif-1' }] });
    const notifs = await client.getNotifications();
    expect(notifs.length).toBe(1);

    mockFetchResponse({ success: true, data: [{ eventId: 'aud-1' }] });
    const trail = await client.getAuditTrail();
    expect(trail.length).toBe(1);
  });

  it('should return null or empty array when readiness, kpis, notifications, and audit trail responses are not successful', async () => {
    vi.spyOn(frontendLogger, 'warn').mockImplementation(() => ({}) as never);
    mockFetchResponse({ success: false });
    const readiness = await client.getReadiness('job-failing');
    expect(readiness).toBeNull();

    mockFetchResponse({ success: false });
    const kpis = await client.getAdminKPIs();
    expect(kpis).toBeNull();

    mockFetchResponse({ success: false });
    const notifs = await client.getNotifications();
    expect(notifs).toEqual([]);

    mockFetchResponse({ success: false });
    const trail = await client.getAuditTrail();
    expect(trail).toEqual([]);
    expect(frontendLogger.warn).toHaveBeenCalledTimes(4);
  });

  it('logs server failures with HTTP status and request correlation before using empty read fallbacks', async () => {
    vi.spyOn(frontendLogger, 'error').mockImplementation(() => ({}) as never);
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      headers: new Headers({ 'x-request-id': 'req-orchestration-503' }),
      json: vi.fn().mockResolvedValue({ success: false, message: 'D1 unavailable' })
    });

    await expect(client.getJobs()).resolves.toEqual([]);
    expect(frontendLogger.error).toHaveBeenCalledWith(
      'Orchestration API returned a server failure',
      expect.objectContaining({
        operation: UI_STRINGS.orchestration.apiOperations.listJobs,
        statusCode: 503,
        requestId: 'req-orchestration-503',
        detail: 'D1 unavailable'
      })
    );
  });

  it('logs network failures and returns actionable retry guidance', async () => {
    const networkError = new Error('offline');
    global.fetch = vi.fn().mockRejectedValue(networkError);
    vi.spyOn(frontendLogger, 'error').mockImplementation(() => ({}) as never);

    await expect(client.getJobs()).rejects.toThrow(
      UI_STRINGS.orchestration.apiNetworkFailure(UI_STRINGS.orchestration.apiOperations.listJobs, 'offline')
    );
    expect(frontendLogger.error).toHaveBeenCalledWith(
      'Orchestration API request failed before a response was received',
      expect.objectContaining({ operation: UI_STRINGS.orchestration.apiOperations.listJobs, method: 'GET' }),
      networkError
    );
  });

  it('logs unreadable and non-object API responses before returning actionable guidance', async () => {
    vi.spyOn(frontendLogger, 'error').mockImplementation(() => ({}) as never);
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'x-request-id': 'req-json-1' }),
        json: vi.fn().mockRejectedValue(new Error('invalid JSON'))
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: vi.fn().mockResolvedValue([])
      });

    await expect(client.getJobs()).rejects.toThrow(
      UI_STRINGS.orchestration.apiInvalidResponse(UI_STRINGS.orchestration.apiOperations.listJobs, 'req-json-1')
    );
    await expect(client.getJobs()).rejects.toThrow(
      UI_STRINGS.orchestration.apiInvalidResponse(UI_STRINGS.orchestration.apiOperations.listJobs, UI_STRINGS.common.notAvailable)
    );
    expect(frontendLogger.error).toHaveBeenCalledTimes(2);
  });

  it('does not synthesize a tenant header for an admin without an assignment', async () => {
    vi.spyOn(apiClient, 'getStoredUser').mockReturnValue({
      role: 'ADMIN',
      name: 'System Admin'
    } as any);

    mockFetchResponse({ success: true, data: [] });
    await client.getJobs();

    expectApiFetchCall(global.fetch, expect.stringContaining('/api/orchestration/jobs'), expect.objectContaining({
        headers: expect.objectContaining({
          'x-user-role': 'ADMIN'
        })
      }));
    const [, options] = vi.mocked(global.fetch).mock.calls[0];
    expect((options as RequestInit).headers).not.toHaveProperty('x-tenant-id');
  });

  it('uses the assigned tenant instead of the user id in orchestration headers', async () => {
    vi.spyOn(apiClient, 'getStoredUser').mockReturnValue({
      id: 'user-101',
      role: 'USER',
      tenant_id: 'tenant-202'
    } as any);
    mockFetchResponse({ success: true, data: [] });

    await client.getJobs();

    expectApiFetchCall(global.fetch, expect.stringContaining('/api/orchestration/jobs'), expect.objectContaining({ headers: expect.objectContaining({ 'x-tenant-id': 'tenant-202' }) }));
  });

  it('does not use a user id as a tenant header when assignment is missing', async () => {
    vi.spyOn(apiClient, 'getStoredUser').mockReturnValue({
      id: 'user-101',
      role: 'USER'
    } as any);
    mockFetchResponse({ success: true, data: [] });

    await client.getJobs();

    const [, options] = vi.mocked(global.fetch).mock.calls[0];
    expect((options as RequestInit).headers).not.toHaveProperty('x-tenant-id');
  });

  it('should handle headers when user is null', async () => {
    vi.spyOn(apiClient, 'getStoredToken').mockReturnValue(null as any);
    vi.spyOn(apiClient, 'getStoredUser').mockReturnValue(null as any);

    mockFetchResponse({ success: true, data: [] });
    await client.getJobs();

    expectApiFetchCall(global.fetch, expect.stringContaining('/api/orchestration/jobs'), expect.objectContaining({
        headers: {
          'Content-Type': 'application/json'
        }
      }));
  });
});

