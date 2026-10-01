import { describe, it, expect, vi } from 'vitest';
import type { Request, Response } from 'express';
import {
  getExecutiveReportData,
  regenerateExecutiveBrief
} from '../../src/controllers/executiveBriefExport.controller';
import { executiveBriefService } from '../../src/services/executiveBriefService';
import { executiveBriefExportService } from '../../src/services/executiveBriefExportService';

const mockResponse = (): Response => {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.setHeader = vi.fn().mockReturnValue(res);
  res.send = vi.fn().mockReturnValue(res);
  return res as Response;
};

describe('ExecutiveBriefReportController Additional Handlers', () => {
  it('getExecutiveReportData should return assembled report JSON', async () => {
    const req = { query: { client: 'UltraTech Cement Limited' } } as unknown as Request;
    const res = mockResponse();

    await getExecutiveReportData(req, res);
    expect(res.json).toHaveBeenCalled();
    const body = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data.summaryCards).toHaveLength(9);
    expect(body.data.sections).toHaveLength(8);
  });

  it('getExecutiveReportData should handle exceptions gracefully', async () => {
    const req = { query: {} } as unknown as Request;
    const res = mockResponse();
    vi.spyOn(executiveBriefService, 'generateReportMetadata').mockImplementationOnce(() => {
      throw new Error('Report data assembly failure');
    });

    await getExecutiveReportData(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    const body = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(body.success).toBe(false);
  });

  it('regenerateExecutiveBrief should trigger regeneration and return updated state', async () => {
    const req = { body: { client: 'UltraTech Cement Limited' } } as unknown as Request;
    const res = mockResponse();

    await regenerateExecutiveBrief(req, res);
    expect(res.json).toHaveBeenCalled();
    const body = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data.reportData).toBeDefined();
    expect(body.data.audit).toBeDefined();
  }, 20000);

  it('regenerateExecutiveBrief should handle query param client and fallback', async () => {
    const req = { query: { client: 'Client Alpha' }, body: {} } as unknown as Request;
    const res = mockResponse();

    await regenerateExecutiveBrief(req, res);
    expect(res.json).toHaveBeenCalled();
    const body = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(body.success).toBe(true);
  }, 20000);

  it('regenerateExecutiveBrief should handle exceptions gracefully', async () => {
    const req = { body: {} } as unknown as Request;
    const res = mockResponse();
    vi.spyOn(executiveBriefService, 'generateAllArtifacts').mockImplementationOnce(() => {
      throw new Error('Disk write failure');
    });

    await regenerateExecutiveBrief(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    const body = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(body.success).toBe(false);
  });

  it('handlers should catch non-Error thrown exceptions', async () => {
    const req = { query: {} } as unknown as Request;
    const res = mockResponse();
    vi.spyOn(executiveBriefService, 'generateReportMetadata').mockImplementationOnce(() => {
      throw 'string error';
    });

    await getExecutiveReportData(req, res);
    expect(res.status).toHaveBeenCalledWith(500);

    vi.spyOn(executiveBriefService, 'generateAllArtifacts').mockImplementationOnce(() => {
      throw 'string error';
    });
    await regenerateExecutiveBrief(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
