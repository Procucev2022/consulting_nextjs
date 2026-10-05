/**
 * Unit Tests for EvidenceExportController (Prompt 305)
 */

import { describe, it, expect, vi } from 'vitest';
import { EvidenceExportController } from '../../src/controllers/evidenceExport.controller';
import { evidenceWorkbookService } from '../../src/services/evidenceWorkbookService';

describe('EvidenceExportController Unit Tests', () => {
  const createMockRes = () => {
    const res: any = {};
    res.statusCode = 200;
    res.headers = {};
    res.status = vi.fn().mockImplementation((code: number) => {
      res.statusCode = code;
      return res;
    });
    res.json = vi.fn().mockImplementation((data: any) => {
      res.data = data;
      return res;
    });
    res.setHeader = vi.fn().mockImplementation((key: string, value: any) => {
      res.headers[key] = value;
      return res;
    });
    res.send = vi.fn().mockImplementation((data: any) => {
      res.body = data;
      return res;
    });
    return res;
  };

  it('should retrieve inventory successfully', async () => {
    const req: any = {
      params: { jobId: 'job-001' },
      user: { id: 'admin-01', role: 'ADMIN', tenantId: 'TNT-001' }
    };
    const res = createMockRes();

    await EvidenceExportController.getInventory(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
    expect(res.data.success).toBe(true);
    expect(res.data.items.length).toBe(9);
  });

  it('should download single evidence workbook successfully with headers', async () => {
    const req: any = {
      params: { jobId: 'job-001', workbookType: 'MODULE_1_EVIDENCE' },
      user: { id: 'admin-01', role: 'ADMIN', tenantId: 'TNT-001' }
    };
    const res = createMockRes();

    await EvidenceExportController.downloadWorkbook(req, res);

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', expect.stringContaining('01_Module_1_Evidence.xlsx'));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalled();
  });

  it('should return 400 when invalid workbook type is passed', async () => {
    const req: any = {
      params: { jobId: 'job-001', workbookType: 'INVALID_WORKBOOK_TYPE' },
      user: { id: 'admin-01', role: 'ADMIN', tenantId: 'TNT-001' }
    };
    const res = createMockRes();

    await EvidenceExportController.downloadWorkbook(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.data.success).toBe(false);
  });

  it('should deny non-admin role from downloading evidence workbook with 403', async () => {
    const req: any = {
      params: { jobId: 'job-001', workbookType: 'MODULE_1_EVIDENCE' },
      user: { id: 'customer-user', role: 'CUSTOMER_ANALYST', tenantId: 'TNT-001' }
    };
    const res = createMockRes();

    await EvidenceExportController.downloadWorkbook(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.data.success).toBe(false);
    expect(res.data.message).toContain('Access denied');
  });

  it('should download complete package ZIP successfully', async () => {
    const req: any = {
      params: { jobId: 'job-001' },
      user: { id: 'admin-01', role: 'ADMIN', tenantId: 'TNT-001' }
    };
    const res = createMockRes();

    await EvidenceExportController.downloadCompletePackage(req, res);

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/zip');
    expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', expect.stringContaining('.zip'));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalled();
  });

  it('should deny non-admin from downloading complete package with 403', async () => {
    const req: any = {
      params: { jobId: 'job-001' },
      user: { id: 'viewer-01', role: 'CUSTOMER_VIEWER', tenantId: 'TNT-001' }
    };
    const res = createMockRes();

    await EvidenceExportController.downloadCompletePackage(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.data.success).toBe(false);
  });

  it('should return parity validation report', async () => {
    const req: any = {
      params: { jobId: 'job-001' },
      query: {},
      user: { id: 'admin-01', role: 'ADMIN', tenantId: 'TNT-001' }
    };
    const res = createMockRes();

    await EvidenceExportController.getParityValidation(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.data.success).toBe(true);
    expect(res.data.parity.overallStatus).toBe('PASS');
  });

  it('should handle internal errors in downloadCompletePackage with 500', async () => {
    vi.spyOn(evidenceWorkbookService, 'generateCompletePackageZip').mockRejectedValueOnce(new Error('Zip error'));
    const req: any = {
      params: { jobId: 'job-001' },
      user: { id: 'admin-01', role: 'ADMIN', tenantId: 'TNT-001' }
    };
    const res = createMockRes();

    await EvidenceExportController.downloadCompletePackage(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.data.success).toBe(false);
  });

  it('should handle internal errors in getParityValidation with 500', async () => {
    vi.spyOn(evidenceWorkbookService, 'validateParity').mockImplementationOnce(() => {
      throw new Error('Parity error');
    });
    const req: any = {
      params: { jobId: 'job-001' },
      query: {},
      user: { id: 'admin-01', role: 'ADMIN', tenantId: 'TNT-001' }
    };
    const res = createMockRes();

    await EvidenceExportController.getParityValidation(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.data.success).toBe(false);
  });

  it('should handle internal errors in downloadWorkbook with 500', async () => {
    vi.spyOn(evidenceWorkbookService, 'generateWorkbookBuffer').mockRejectedValueOnce(new Error('Workbook error'));
    const req: any = {
      params: { jobId: 'job-001', workbookType: 'MODULE_1_EVIDENCE' },
      user: { id: 'admin-01', role: 'ADMIN', tenantId: 'TNT-001' }
    };
    const res = createMockRes();

    await EvidenceExportController.downloadWorkbook(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.data.success).toBe(false);
  });

  it('should reject invalid query params in getParityValidation with 400', async () => {
    const req: any = {
      params: { jobId: 'job-001' },
      query: { workbookType: 'INVALID_TYPE' },
      user: { id: 'admin-01', role: 'ADMIN', tenantId: 'TNT-001' }
    };
    const res = createMockRes();

    await EvidenceExportController.getParityValidation(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.data.success).toBe(false);
  });
  it('should retrieve savings inventory successfully', async () => {
    const req: any = {
      params: { jobId: 'job-001' },
      user: { id: 'admin-01', role: 'ADMIN', tenantId: 'TNT-001' }
    };
    const res = createMockRes();

    await EvidenceExportController.getSavingsInventory(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.data.success).toBe(true);
    expect(res.data.items.length).toBe(7);
  });

  it('should retrieve savings inventory for specific valid savingsType', async () => {
    const req: any = {
      params: { jobId: 'job-001', savingsType: 'VENDOR_CONSOLIDATION' },
      user: { id: 'admin-01', role: 'ADMIN', tenantId: 'TNT-001' }
    };
    const res = createMockRes();

    await EvidenceExportController.getSavingsInventory(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.data.items.length).toBe(1);
    expect(res.data.items[0].savingsType).toBe('VENDOR_CONSOLIDATION');
  });

  it('should download dedicated savings-type workbook successfully', async () => {
    const req: any = {
      params: { jobId: 'job-001', savingsType: 'VENDOR_CONSOLIDATION' },
      user: { id: 'admin-01', role: 'ADMIN', tenantId: 'TNT-001' }
    };
    const res = createMockRes();

    await EvidenceExportController.downloadSavingsTypeWorkbook(req, res);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      expect.stringContaining('04A_Vendor_Consolidation_Evidence.xlsx')
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalled();
  });

  it('should deny non-admin from downloading savings-type workbook with 403', async () => {
    const req: any = {
      params: { jobId: 'job-001', savingsType: 'VENDOR_CONSOLIDATION' },
      user: { id: 'customer-user', role: 'CUSTOMER_ANALYST', tenantId: 'TNT-001' }
    };
    const res = createMockRes();

    await EvidenceExportController.downloadSavingsTypeWorkbook(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.data.success).toBe(false);
  });

  it('should reject invalid savingsType with 400', async () => {
    const req: any = {
      params: { jobId: 'job-001', savingsType: 'INVALID_SAVINGS' },
      user: { id: 'admin-01', role: 'ADMIN', tenantId: 'TNT-001' }
    };
    const res = createMockRes();

    await EvidenceExportController.downloadSavingsTypeWorkbook(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.data.success).toBe(false);
  });
});


