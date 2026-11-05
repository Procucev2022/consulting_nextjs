import { expectApiFetchCall } from './apiFetchAssertions';
/**
 * Unit Tests for Frontend evidenceApi Client (Prompt 305)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { evidenceApi } from '../../src/utils/evidenceApi';

describe('Frontend evidenceApi Client Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should generate correct workbook download URL', () => {
    const url = evidenceApi.getWorkbookDownloadUrl('job-alpha-001', 'MODULE_1_EVIDENCE');
    expect(url).toContain('/api/evidence/jobs/job-alpha-001/workbooks/MODULE_1_EVIDENCE/download');
  });

  it('should generate correct package download URL', () => {
    const url = evidenceApi.getPackageDownloadUrl('job-alpha-001');
    expect(url).toContain('/api/evidence/jobs/job-alpha-001/package/download');
  });

  it('should fetch inventory with headers', async () => {
    const mockInventory = {
      success: true,
      jobId: 'job-001',
      tenantId: 'TNT-001',
      items: [{ type: 'MODULE_1_EVIDENCE', filename: '01_Module_1_Evidence.xlsx', title: 'M1', description: 'desc', sheetCount: 8, isAvailable: true, requiredRole: 'ADMIN' }]
    };

    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue(mockInventory)
    } as any);

    const res = await evidenceApi.getInventory('job-001');
    expectApiFetchCall(global.fetch, '/api/evidence/jobs/job-001/inventory', expect.objectContaining({ headers: expect.any(Object) }));
    expect(res.success).toBe(true);
    expect(res.items.length).toBe(1);
  });

  it('should fetch parity validation with optional workbookType query', async () => {
    const mockParity = {
      success: true,
      parity: {
        jobId: 'job-001',
        dataVersionId: 'v1',
        totalChecks: 13,
        passedChecks: 13,
        failedChecks: 0,
        overallStatus: 'PASS',
        evaluatedAt: '2026-10-04T12:00:00Z',
        discrepancies: [],
        checks: []
      }
    };

    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue(mockParity)
    } as any);

    const res = await evidenceApi.getParityValidation('job-001', 'FINANCIAL_VALIDATION');
    expectApiFetchCall(global.fetch, '/api/evidence/jobs/job-001/parity?workbookType=FINANCIAL_VALIDATION', expect.any(Object));
    expect(res.success).toBe(true);
    expect(res.parity.overallStatus).toBe('PASS');
  });

  it('should generate correct savings type download URL', () => {
    const url = evidenceApi.getSavingsTypeDownloadUrl('job-alpha-001', 'VENDOR_CONSOLIDATION');
    expect(url).toContain('/api/evidence/jobs/job-alpha-001/savings/VENDOR_CONSOLIDATION/download');
  });

  it('should fetch savings inventory without or with specific savingsType', async () => {
    const mockSavingsInventory = {
      success: true,
      jobId: 'job-001',
      tenantId: 'TNT-001',
      items: [{ savingsType: 'VENDOR_CONSOLIDATION', filename: '04A_Vendor_Consolidation_Evidence.xlsx', netAmountCr: 6.17 }]
    };

    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue(mockSavingsInventory)
    } as any);

    const resAll = await evidenceApi.getSavingsInventory('job-001');
    expectApiFetchCall(global.fetch, '/api/evidence/jobs/job-001/savings/inventory', expect.any(Object));
    expect(resAll.success).toBe(true);

    const resSingle = await evidenceApi.getSavingsInventory('job-001', 'VENDOR_CONSOLIDATION');
    expectApiFetchCall(global.fetch, '/api/evidence/jobs/job-001/savings/VENDOR_CONSOLIDATION/inventory', expect.any(Object));
    expect(resSingle.success).toBe(true);
  });

  it('should include full authentication headers when token and user profile exist', async () => {
    const { apiClient } = await import('../../src/utils/api');
    vi.spyOn(apiClient, 'getStoredToken').mockReturnValue('jwt-token-xyz');
    vi.spyOn(apiClient, 'getStoredUser').mockReturnValue({
      id: 'USR-777',
      role: 'ADMIN',
      name: 'Auditor Pro',
      company_name: 'Acme Audit',
      tenant_id: 'TNT-AUDIT-777'
    } as any);

    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ success: true, items: [] })
    } as any);

    await evidenceApi.getInventory('job-auth');
    expectApiFetchCall(global.fetch, '/api/evidence/jobs/job-auth/inventory', expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer jwt-token-xyz',
          'x-user-role': 'ADMIN',
          'x-user-id': 'USR-777',
          'x-user-name': 'Auditor Pro',
          'x-company-name': 'Acme Audit',
          'x-tenant-id': 'TNT-AUDIT-777'
        })
      }));
  });

  it('does not synthesize a tenant header for a user without an assignment', async () => {
    const { apiClient } = await import('../../src/utils/api');
    vi.spyOn(apiClient, 'getStoredUser').mockReturnValue({
      id: 'USR-UNASSIGNED',
      role: 'USER'
    } as any);
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ success: true, items: [] })
    } as any);

    await evidenceApi.getInventory('job-unassigned');

    const [, options] = vi.mocked(global.fetch).mock.calls[0];
    expect((options as RequestInit).headers).not.toHaveProperty('x-tenant-id');
  });

  it('should fetch parity validation without workbookType query when omitted', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ success: true, parity: { overallStatus: 'PASS' } })
    } as any);

    const res = await evidenceApi.getParityValidation('job-002');
    expectApiFetchCall(global.fetch, '/api/evidence/jobs/job-002/parity', expect.any(Object));
    expect(res.success).toBe(true);
  });
});
