import { describe, it, expect, vi } from 'vitest';
import type { Request, Response } from 'express';
import {
  getExportStatus,
  downloadPdf,
  downloadPptx,
  getExportAudit,
  getExportHistory
} from '../../src/controllers/executiveBriefExport.controller';
import { executiveBriefExportService } from '../../src/services/executiveBriefExportService';

const mockResponse = (): Response => {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.setHeader = vi.fn().mockReturnValue(res);
  res.send = vi.fn().mockReturnValue(res);
  return res as Response;
};

describe('executiveBriefExport.controller', () => {
  it('getExportStatus should return export status with clientName', async () => {
    const req = { query: { client: 'UltraTech Cement Limited' } } as unknown as Request;
    const res = mockResponse();

    await getExportStatus(req, res);
    expect(res.json).toHaveBeenCalled();
    const body = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('EXECUTIVE_BRIEF_EXPORT_READY');
    expect(body.data.financialConsistency.isConsistent).toBe(true);
  });

  it('getExportStatus should return BLOCKED when consistency check fails', async () => {
    const req = { query: { client: 'Inconsistent Client' } } as unknown as Request;
    const res = mockResponse();
    vi.spyOn(executiveBriefExportService, 'verifyFinancialConsistency').mockReturnValueOnce({
      totalSpendVarianceInr: 100,
      addressableSpendVarianceInr: 0,
      grossOpportunityVarianceInr: 0,
      netDefensibleVarianceInr: 0,
      approvedSavingsVarianceInr: 0,
      realizedSavingsVarianceInr: 0,
      isConsistent: false,
      status: 'FAIL'
    });

    await getExportStatus(req, res);
    expect(res.json).toHaveBeenCalled();
    const body = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(body.data.status).toBe('EXECUTIVE_BRIEF_EXPORT_BLOCKED');
  });

  it('getExportStatus should handle exceptions gracefully', async () => {
    const req = { query: {} } as unknown as Request;
    const res = mockResponse();
    vi.spyOn(executiveBriefExportService, 'verifyFinancialConsistency').mockImplementationOnce(() => {
      throw new Error('Database connection failed');
    });

    await getExportStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    const body = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(body.success).toBe(false);
  });

  it('downloadPdf should stream PDF buffer with headers', async () => {
    const req = { query: { client: 'UltraTech Cement Limited' } } as unknown as Request;
    const res = mockResponse();

    await downloadPdf(req, res);
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
    expect(res.send).toHaveBeenCalled();
  }, 20000);

  it('downloadPdf should return 400 when export is blocked', async () => {
    const req = { query: { client: 'Blocked Client' } } as unknown as Request;
    const res = mockResponse();
    vi.spyOn(executiveBriefExportService, 'generateDualFormatExport').mockResolvedValueOnce({
      audit: {
        reportId: 'RPT-BLOCKED',
        client: 'Blocked Client',
        generationTimestamp: new Date().toISOString(),
        sourceDataVersion: 'V1.0',
        pdfGenerated: false,
        pptxGenerated: false,
        pdfValidation: 'FAIL',
        pptxValidation: 'FAIL',
        financialReconciliation: { varianceInr: 999, status: 'FAIL' },
        pageCount: 0,
        slideCount: 0,
        fileSize: { pdfBytes: 0, pptxBytes: 0 },
        checksums: { pdfSha256: '', pptxSha256: '' },
        exportStatus: 'EXECUTIVE_BRIEF_EXPORT_BLOCKED',
        blockedReason: undefined
      },
      pdfPath: '',
      pptxPath: '',
      auditPath: '',
      pdfBuffer: Buffer.alloc(0),
      pptxBuffer: Buffer.alloc(0)
    });

    await downloadPdf(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    const body = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(body.success).toBe(false);
  });

  it('downloadPdf should handle errors and return 500', async () => {
    const req = { query: {} } as unknown as Request;
    const res = mockResponse();
    vi.spyOn(executiveBriefExportService, 'generateDualFormatExport').mockRejectedValueOnce(
      new Error('PDF engine failure')
    );

    await downloadPdf(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('downloadPptx should stream PPTX buffer with headers', async () => {
    const req = { query: { client: 'UltraTech Cement Limited' } } as unknown as Request;
    const res = mockResponse();

    await downloadPptx(req, res);
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    );
    expect(res.send).toHaveBeenCalled();
  }, 20000);

  it('downloadPptx should return 400 when export is blocked', async () => {
    const req = { query: { client: 'Blocked Client' } } as unknown as Request;
    const res = mockResponse();
    vi.spyOn(executiveBriefExportService, 'generateDualFormatExport').mockResolvedValueOnce({
      audit: {
        reportId: 'RPT-BLOCKED',
        client: 'Blocked Client',
        generationTimestamp: new Date().toISOString(),
        sourceDataVersion: 'V1.0',
        pdfGenerated: false,
        pptxGenerated: false,
        pdfValidation: 'FAIL',
        pptxValidation: 'FAIL',
        financialReconciliation: { varianceInr: 999, status: 'FAIL' },
        pageCount: 0,
        slideCount: 0,
        fileSize: { pdfBytes: 0, pptxBytes: 0 },
        checksums: { pdfSha256: '', pptxSha256: '' },
        exportStatus: 'EXECUTIVE_BRIEF_EXPORT_BLOCKED',
        blockedReason: undefined
      },
      pdfPath: '',
      pptxPath: '',
      auditPath: '',
      pdfBuffer: Buffer.alloc(0),
      pptxBuffer: Buffer.alloc(0)
    });

    await downloadPptx(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('downloadPptx should handle errors and return 500', async () => {
    const req = { query: {} } as unknown as Request;
    const res = mockResponse();
    vi.spyOn(executiveBriefExportService, 'generateDualFormatExport').mockRejectedValueOnce(
      new Error('PPTX engine failure')
    );

    await downloadPptx(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('getExportAudit should return audit JSON', async () => {
    const req = {} as Request;
    const res = mockResponse();

    await getExportAudit(req, res);
    expect(res.json).toHaveBeenCalled();
    const body = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
  });

  it('getExportHistory should return export history array', async () => {
    const req = {} as Request;
    const res = mockResponse();

    await getExportHistory(req, res);
    expect(res.json).toHaveBeenCalled();
    const body = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('getExportAudit should handle errors and return 500', async () => {
    const req = { query: {} } as unknown as Request;
    const res = mockResponse();
    vi.spyOn(executiveBriefExportService, 'generateDualFormatExport').mockRejectedValueOnce(
      new Error('Audit generation failure')
    );

    await getExportAudit(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('getExportHistory should handle errors and return 500', async () => {
    const req = {} as Request;
    const res = mockResponse();
    vi.spyOn(executiveBriefExportService, 'getHistory').mockImplementationOnce(() => {
      throw new Error('History read failure');
    });

    await getExportHistory(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('handlers should handle non-Error thrown exceptions', async () => {
    const req = { query: {} } as unknown as Request;
    const res = mockResponse();

    vi.spyOn(executiveBriefExportService, 'verifyFinancialConsistency').mockImplementationOnce(() => {
      throw 'string error';
    });
    await getExportStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(500);

    vi.spyOn(executiveBriefExportService, 'generateDualFormatExport').mockRejectedValueOnce('string error');
    await downloadPdf(req, res);
    expect(res.status).toHaveBeenCalledWith(500);

    vi.spyOn(executiveBriefExportService, 'generateDualFormatExport').mockRejectedValueOnce('string error');
    await downloadPptx(req, res);
    expect(res.status).toHaveBeenCalledWith(500);

    vi.spyOn(executiveBriefExportService, 'generateDualFormatExport').mockRejectedValueOnce('string error');
    await getExportAudit(req, res);
    expect(res.status).toHaveBeenCalledWith(500);

    vi.spyOn(executiveBriefExportService, 'getHistory').mockImplementationOnce(() => {
      throw 'string error';
    });
    await getExportHistory(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
