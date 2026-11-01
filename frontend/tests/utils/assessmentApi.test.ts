import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { assessmentApi, assessmentApiClient } from '../../src/utils/assessmentApi';
import { authApiClient } from '../../src/utils/authApi';

describe('assessmentApi', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('fetches operating mode successfully', async () => {
    const mockMode = {
      mode: 'INTERNAL_ASSESSMENT',
      isInternalAssessment: true,
      features: { assessmentCentre: true }
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockMode })
    });

    const res = await assessmentApi.getOperatingMode();
    expect(res.mode).toBe('INTERNAL_ASSESSMENT');
    expect(res.isInternalAssessment).toBe(true);
  });

  it('throws error when getOperatingMode fetch fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500
    });

    await expect(assessmentApi.getOperatingMode()).rejects.toThrow('Failed to fetch operating mode: HTTP 500');
  });

  it('lists assessments with filter', async () => {
    const mockList = [{ assessmentId: 'AIC-2026-0001', customerName: 'Varroc Polymers (VGT)' }];
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockList })
    });

    const res = await assessmentApi.listAssessments('APPROVED');
    expect(res.length).toBe(1);
    expect(res[0].assessmentId).toBe('AIC-2026-0001');
  });

  it('throws error when getAssessments fetch fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502
    });

    await expect(assessmentApi.getAssessments()).rejects.toThrow('Failed to fetch assessments: HTTP 502');
  });

  it('fetches assessment by id successfully', async () => {
    const mockRecord = { assessmentId: 'AIC-2026-0001', customerName: 'Varroc Polymers (VGT)' };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockRecord })
    });

    const res = await assessmentApi.getAssessmentById('AIC-2026-0001');
    expect(res.assessmentId).toBe('AIC-2026-0001');
  });

  it('throws error when getAssessmentById fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404
    });

    await expect(assessmentApi.getAssessmentById('NON_EXISTENT')).rejects.toThrow('Failed to fetch assessment NON_EXISTENT: HTTP 404');
  });

  it('creates an assessment successfully', async () => {
    const newRecord = { assessmentId: 'AIC-2026-0002', customerName: 'Acme Motors' };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: newRecord })
    });

    const res = await assessmentApi.createAssessment({
      customerName: 'Acme Motors',
      industry: 'Automotive',
      assessmentPeriodStart: 'April 2022',
      assessmentPeriodEnd: 'March 2023',
      assignedAnalyst: 'analyst@procucev.com',
      ndaStatus: 'SIGNED'
    });
    expect(res.assessmentId).toBe('AIC-2026-0002');
  });

  it('throws error when createAssessment fails or success is false', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ success: false, message: 'Invalid payload' })
    });

    await expect(
      assessmentApi.createAssessment({
        customerName: '',
        industry: '',
        assessmentPeriodStart: '',
        assessmentPeriodEnd: '',
        assignedAnalyst: ''
      })
    ).rejects.toThrow('Invalid payload');
  });

  it('throws default error when createAssessment fails without message', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ success: false })
    });

    await expect(
      assessmentApi.createAssessment({
        customerName: 'Test',
        industry: 'Test',
        assessmentPeriodStart: 'Jan',
        assessmentPeriodEnd: 'Dec',
        assignedAnalyst: 'analyst@example.com'
      })
    ).rejects.toThrow('Failed to create assessment: HTTP 500');
  });

  it('updates NDA status successfully', async () => {
    const mockRecord = { assessmentId: 'AIC-2026-0001', ndaStatus: 'SIGNED' };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockRecord })
    });

    const res = await assessmentApi.updateNdaStatus('AIC-2026-0001', 'SIGNED', 'Signed via DocuSign');
    expect(res.ndaStatus).toBe('SIGNED');
  });

  it('throws error when updateNdaStatus fails with message', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ success: false, message: 'Invalid NDA status' })
    });

    await expect(assessmentApi.updateNdaStatus('AIC-2026-0001', 'SIGNED')).rejects.toThrow('Invalid NDA status');
  });

  it('throws default error when updateNdaStatus fails without message', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ success: false })
    });

    await expect(assessmentApi.updateNdaStatus('AIC-2026-0001', 'SIGNED')).rejects.toThrow('Failed to update NDA status: HTTP 500');
  });

  it('updates Data status successfully', async () => {
    const mockRecord = { assessmentId: 'AIC-2026-0001', dataStatus: 'RECEIVED' };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockRecord })
    });

    const res = await assessmentApi.updateDataStatus('AIC-2026-0001', 'RECEIVED', 'Files verified');
    expect(res.dataStatus).toBe('RECEIVED');
  });

  it('throws error when updateDataStatus fails with message', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ success: false, message: 'Invalid data status' })
    });

    await expect(assessmentApi.updateDataStatus('AIC-2026-0001', 'RECEIVED')).rejects.toThrow('Invalid data status');
  });

  it('throws error when updateDataStatus fails without message', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ success: false })
    });

    await expect(assessmentApi.updateDataStatus('AIC-2026-0001', 'RECEIVED')).rejects.toThrow('Failed to update data status: HTTP 404');
  });

  it('uploads data version successfully', async () => {
    const mockUploadResult = {
      assessment: { assessmentId: 'AIC-2026-0001' } as any,
      dataVersion: { dataVersionId: 'DV-002', fileName: 'sample.xlsx' } as any
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockUploadResult })
    });

    const res = await assessmentApi.uploadDataVersion('AIC-2026-0001', {
      fileName: 'sample.xlsx',
      fileSize: 1024,
      checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      recordCount: 50
    });
    expect(res.dataVersion.dataVersionId).toBe('DV-002');
  });

  it('throws error when uploadDataVersion fails with message', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 413,
      json: async () => ({ success: false, message: 'File too large' })
    });

    await expect(
      assessmentApi.uploadDataVersion('AIC-2026-0001', {
        fileName: 'large.xlsx',
        fileSize: 1024,
        checksum: 'abc'
      })
    ).rejects.toThrow('File too large');
  });

  it('throws error when uploadDataVersion fails without message', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ success: false })
    });

    await expect(
      assessmentApi.uploadDataVersion('AIC-2026-0001', {
        fileName: 'large.xlsx',
        fileSize: 1024,
        checksum: 'abc'
      })
    ).rejects.toThrow('Failed to upload data version: HTTP 500');
  });

  it('runs analysis successfully', async () => {
    const mockRun = { analysisRunId: 'RUN-001' };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockRun })
    });

    const res = await assessmentApi.runAnalysis('AIC-2026-0001', 'DV-001');
    expect(res.analysisRunId).toBe('RUN-001');
  });

  it('throws error when runAnalysis fails with message', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ success: false, message: 'Analysis failed' })
    });

    await expect(assessmentApi.runAnalysis('AIC-2026-0001')).rejects.toThrow('Analysis failed');
  });

  it('throws error when runAnalysis fails without message', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ success: false })
    });

    await expect(assessmentApi.runAnalysis('AIC-2026-0001')).rejects.toThrow('Failed to run analysis: HTTP 500');
  });

  it('approves assessment successfully', async () => {
    const mockRecord = { assessmentId: 'AIC-2026-0001', status: 'APPROVED' };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockRecord })
    });

    const res = await assessmentApi.approveAssessment('AIC-2026-0001', {
      approvalComment: 'Certified',
      approvedBy: 'lead.analyst@procucev.com'
    });
    expect(res.status).toBe('APPROVED');
  });

  it('throws error when approveAssessment fails with message', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ success: false, message: 'Incomplete review gates' })
    });

    await expect(
      assessmentApi.approveAssessment('AIC-2026-0001', { approvalComment: 'Cert' })
    ).rejects.toThrow('Incomplete review gates');
  });

  it('throws error when approveAssessment fails without message', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ success: false })
    });

    await expect(
      assessmentApi.approveAssessment('AIC-2026-0001', { approvalComment: 'Cert' })
    ).rejects.toThrow('Failed to approve assessment: HTTP 500');
  });

  it('generates delivery package successfully', async () => {
    const mockPkg = { assessmentId: 'AIC-2026-0001', items: [{ id: 'item-1' }] };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockPkg })
    });

    const res = await assessmentApi.generateDeliveryPackage('AIC-2026-0001');
    expect(res.items.length).toBe(1);
  });

  it('throws error when generateDeliveryPackage fails with message', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ success: false, message: 'Package bundling failed' })
    });

    await expect(assessmentApi.generateDeliveryPackage('AIC-2026-0001')).rejects.toThrow('Package bundling failed');
  });

  it('throws error when generateDeliveryPackage fails without message', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ success: false })
    });

    await expect(assessmentApi.generateDeliveryPackage('AIC-2026-0001')).rejects.toThrow('Failed to generate delivery package: HTTP 500');
  });

  it('delivers assessment successfully', async () => {
    const mockRecord = { assessmentId: 'AIC-2026-0001', status: 'DELIVERED' };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockRecord })
    });

    const res = await assessmentApi.deliverAssessment('AIC-2026-0001', {
      recipientEmail: 'cfo@client.com',
      deliveryChannel: 'EMAIL'
    });
    expect(res.status).toBe('DELIVERED');
  });

  it('throws error when deliverAssessment fails with message', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ success: false, message: 'SMTP error' })
    });

    await expect(
      assessmentApi.deliverAssessment('AIC-2026-0001', { recipientEmail: 'test@client.com' })
    ).rejects.toThrow('SMTP error');
  });

  it('throws error when deliverAssessment fails without message', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ success: false })
    });

    await expect(
      assessmentApi.deliverAssessment('AIC-2026-0001', { recipientEmail: 'test@client.com' })
    ).rejects.toThrow('Failed to mark assessment delivered: HTTP 500');
  });

  it('closes assessment successfully', async () => {
    const mockRecord = { assessmentId: 'AIC-2026-0001', status: 'CLOSED' };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockRecord })
    });

    const res = await assessmentApi.closeAssessment('AIC-2026-0001');
    expect(res.status).toBe('CLOSED');
  });

  it('throws error when closeAssessment fails with message', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ success: false, message: 'Assessment already closed' })
    });

    await expect(assessmentApi.closeAssessment('AIC-2026-0001')).rejects.toThrow('Assessment already closed');
  });

  it('throws error when closeAssessment fails without message', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ success: false })
    });

    await expect(assessmentApi.closeAssessment('AIC-2026-0001')).rejects.toThrow('Failed to close assessment: HTTP 500');
  });

  it('fetches audit logs successfully', async () => {
    const mockLogs = [{ logId: 'log-1', action: 'ASSESSMENT_CREATED' }];
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockLogs })
    });

    const res = await assessmentApi.getAuditLogs('AIC-2026-0001');
    expect(res.length).toBe(1);
  });

  it('throws error when getAuditLogs fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500
    });

    await expect(assessmentApi.getAuditLogs('AIC-2026-0001')).rejects.toThrow('Failed to fetch audit logs: HTTP 500');
  });

  it('fetches system info successfully', async () => {
    const mockInfo = { applicationVersion: '1.0.1', buildNumber: 'E2E-002-CERTIFIED' };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockInfo })
    });

    const res = await assessmentApi.getSystemInfo();
    expect(res.applicationVersion).toBe('1.0.1');
  });

  it('throws error when getSystemInfo fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    await expect(assessmentApi.getSystemInfo()).rejects.toThrow('Failed to fetch system info: HTTP 500');
  });

  it('fetches customers successfully', async () => {
    const mockCustomers = [{ id: 'CUST-2026-0001', customerName: 'Acme Heavy Engineering Ltd' }];
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockCustomers })
    });

    const res = await assessmentApi.getCustomers();
    expect(res.length).toBe(1);
    expect(res[0].id).toBe('CUST-2026-0001');
  });

  it('throws error when getCustomers fetch fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    await expect(assessmentApi.getCustomers()).rejects.toThrow('Failed to fetch customers: HTTP 500');
  });

  it('fetches customer by id successfully', async () => {
    const mockCustomer = { customer: { id: 'CUST-2026-0001', customerName: 'Acme Heavy Engineering Ltd' }, assessments: [] };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockCustomer })
    });

    const res = await assessmentApi.getCustomerById('CUST-2026-0001');
    expect(res.customer.id).toBe('CUST-2026-0001');
  });

  it('creates customer successfully', async () => {
    const created = { id: 'CUST-2026-0002', customerName: 'New Corp', industry: 'Logistics' };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: created })
    });

    const res = await assessmentApi.createCustomer({ customerName: 'New Corp', industry: 'Logistics' });
    expect(res.id).toBe('CUST-2026-0002');
  });

  it('updates customer successfully', async () => {
    const updated = { id: 'CUST-2026-0002', customerName: 'Updated Corp', industry: 'Logistics' };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: updated })
    });

    const res = await assessmentApi.updateCustomer('CUST-2026-0002', { customerName: 'Updated Corp' });
    expect(res.customerName).toBe('Updated Corp');
  });

  it('validates dataset successfully', async () => {
    const valRes = {
      assessment: { assessmentId: 'AIC-2026-0001' },
      dataVersion: { dataVersionId: 'DV-001' },
      validationSummary: { sourceRowCount: 100, validRowCount: 100, excludedRowCount: 0, anomalyRowCount: 0, cleanSpendYieldPct: 100 }
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: valRes })
    });

    const res = await assessmentApi.validateDataset('AIC-2026-0001', 'DV-001');
    expect(res.validationSummary).toBeDefined();
    expect(res.validationSummary.validRowCount).toBe(100);
  });

  it('runs Module 1 successfully', async () => {
    const runRes = {
      assessment: { assessmentId: 'AIC-2026-0001', validatedSpendCr: 100.5 },
      analysisRun: { analysisRunId: 'RUN-001' }
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: runRes })
    });

    const res = await assessmentApi.runModule1('AIC-2026-0001', 'DV-001');
    expect(res.assessment).toBeDefined();
    expect(res.assessment.validatedSpendCr).toBe(100.5);
  });

  it('fetches D1 review gates and returns an empty list for malformed collection data', async () => {
    const gates = [{ assessmentId: 'AIC-2026-0001', gateKey: 'M1_INPUT_ROW_RECONCILIATION', status: 'PENDING' }];
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: gates }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: null }) });

    await expect(assessmentApi.getReviewGates('AIC-2026-0001')).resolves.toEqual(gates);
    await expect(assessmentApi.getReviewGates('AIC-2026-0001')).resolves.toEqual([]);
  });

  it('saves an assessment review gate with a PUT request', async () => {
    vi.spyOn(authApiClient, 'getStoredToken').mockReturnValue('reviewer-session-token');
    const gates = [{ assessmentId: 'AIC-2026-0001', gateKey: 'M1_INPUT_ROW_RECONCILIATION', status: 'PASSED' }];
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: gates })
    });
    const payload = {
      gateKey: 'M1_INPUT_ROW_RECONCILIATION',
      status: 'PASSED' as const,
      evidenceReference: 'D1:DV-1'
    };

    await expect(assessmentApi.saveReviewGate('AIC-2026-0001', payload)).resolves.toEqual(gates);
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/AIC-2026-0001/review-gates'), expect.objectContaining({
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: ['Bearer', 'reviewer-session-token'].join(' ')
      },
      body: JSON.stringify(payload)
    }));
  });

  it('does not send an authorization header when no session token is available', async () => {
    vi.spyOn(authApiClient, 'getStoredToken').mockReturnValue(null);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: [] })
    });

    await assessmentApi.saveReviewGate('AIC-2026-0001', {
      gateKey: 'M1_INPUT_ROW_RECONCILIATION',
      status: 'PENDING'
    });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/AIC-2026-0001/review-gates'),
      expect.objectContaining({ headers: { 'Content-Type': 'application/json' } })
    );
  });

  it('verifies default export matches named export', () => {
    expect(assessmentApiClient).toBe(assessmentApi);
  });
});
