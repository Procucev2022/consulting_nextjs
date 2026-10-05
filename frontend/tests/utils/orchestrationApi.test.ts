import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { OrchestrationApiClient } from '../../src/utils/orchestrationApi';
import { apiClient } from '../../src/utils/api';
import { DEFAULT_QUALITY_GATE_CHECKLIST } from '../../src/constants/analysisOrchestration';

describe('OrchestrationApiClient Unit Tests', () => {
  let client: OrchestrationApiClient;
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
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
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/orchestration/jobs?status=ACTION_REQUIRED&search=Acme'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer mock-jwt-token',
          'x-user-role': 'ADMIN'
        })
      })
    );
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
  });

  it('should upload corrected dataset', async () => {
    mockFetchResponse({ success: true, message: 'Version v2 created' });
    const result = await client.uploadCorrectedDataset('job-1', {
      fileName: 'corrected.xlsx',
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
});
