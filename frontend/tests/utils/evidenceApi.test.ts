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
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/evidence/jobs/job-001/inventory',
      expect.objectContaining({ headers: expect.any(Object) })
    );
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
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/evidence/jobs/job-001/parity?workbookType=FINANCIAL_VALIDATION',
      expect.any(Object)
    );
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
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/evidence/jobs/job-001/savings/inventory',
      expect.any(Object)
    );
    expect(resAll.success).toBe(true);

    const resSingle = await evidenceApi.getSavingsInventory('job-001', 'VENDOR_CONSOLIDATION');
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/evidence/jobs/job-001/savings/VENDOR_CONSOLIDATION/inventory',
      expect.any(Object)
    );
    expect(resSingle.success).toBe(true);
  });
});
