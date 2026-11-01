import { describe, it, expect, vi, beforeAll } from 'vitest';
import type { Request, Response } from 'express';
import { Module3CanonicalController, module3CanonicalController, getErrorMessage } from '../../src/controllers/module3Canonical.controller';
import { Module3PcbiForensicEngine } from '../../src/services/module3PcbiForensicEngine';
import { Module3PcbiIndependentCalculator } from '../../src/services/module3PcbiIndependentCalculator';
import { Module3PcbiWorkbookBuilder } from '../../src/services/module3PcbiWorkbookBuilder';
import { VgtModule1Runner } from '../../src/services/vgtModule1Runner';

function createMockResponse(): { res: Response; jsonSpy: ReturnType<typeof vi.fn>; statusSpy: ReturnType<typeof vi.fn>; downloadSpy: ReturnType<typeof vi.fn> } {
  const jsonSpy = vi.fn();
  const statusSpy = vi.fn().mockReturnThis();
  const downloadSpy = vi.fn();
  const res = {
    json: jsonSpy,
    status: statusSpy,
    download: downloadSpy
  } as unknown as Response;
  return { res, jsonSpy, statusSpy, downloadSpy };
}

describe('Module3CanonicalController', () => {
  beforeAll(async () => {
    VgtModule1Runner.processVgtDataset();
    Module3PcbiForensicEngine.processCustomerLedger();
  }, 60000);
  it('rejects request with 400 when assessmentId is missing', async () => {
    const { res, statusSpy, jsonSpy } = createMockResponse();
    await module3CanonicalController.getAuditReport({} as Request, res);
    expect(statusSpy).toHaveBeenCalledWith(400);
    expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it('handles getAuditReport success', async () => {
    const { res, jsonSpy } = createMockResponse();
    await module3CanonicalController.getAuditReport({ query: { assessmentId: 'AIC-2026-0001' } } as unknown as Request, res);
    expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('handles getAuditReport error', async () => {
    const { res, statusSpy } = createMockResponse();
    vi.spyOn(Module3PcbiForensicEngine, 'getCertificationReport').mockImplementationOnce(() => {
      throw new Error('Engine failure');
    });
    await module3CanonicalController.getAuditReport({ query: { assessmentId: 'AIC-2026-0001' } } as unknown as Request, res);
    expect(statusSpy).toHaveBeenCalledWith(500);
  });

  it('handles getSpendReconciliation success', async () => {
    const { res, jsonSpy } = createMockResponse();
    await module3CanonicalController.getSpendReconciliation({ query: { assessmentId: 'AIC-2026-0001' } } as unknown as Request, res);
    expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('handles getSpendReconciliation error', async () => {
    const { res, statusSpy } = createMockResponse();
    vi.spyOn(Module3PcbiForensicEngine, 'processCustomerLedger').mockImplementationOnce(() => {
      throw new Error('Reconciliation error');
    });
    await module3CanonicalController.getSpendReconciliation({ query: { assessmentId: 'AIC-2026-0001' } } as unknown as Request, res);
    expect(statusSpy).toHaveBeenCalledWith(500);
  });

  it('handles getIndependentAudit success', async () => {
    const { res, jsonSpy } = createMockResponse();
    await module3CanonicalController.getIndependentAudit({} as Request, res);
    expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('handles getIndependentAudit error', async () => {
    const { res, statusSpy } = createMockResponse();
    vi.spyOn(Module3PcbiIndependentCalculator, 'runIndependentRecalculation').mockImplementationOnce(() => {
      throw new Error('Audit calculation error');
    });
    await module3CanonicalController.getIndependentAudit({} as Request, res);
    expect(statusSpy).toHaveBeenCalledWith(500);
  });

  it('handles getTestMatrix success', async () => {
    const { res, jsonSpy } = createMockResponse();
    await module3CanonicalController.getTestMatrix({ query: { assessmentId: 'AIC-2026-0001' } } as unknown as Request, res);
    expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({ success: true, totalCount: 30 }));
  });

  it('handles getTestMatrix error', async () => {
    const { res, statusSpy } = createMockResponse();
    vi.spyOn(Module3PcbiForensicEngine, 'getTestMatrix').mockImplementationOnce(() => {
      throw 'String error test';
    });
    await module3CanonicalController.getTestMatrix({ query: { assessmentId: 'AIC-2026-0001' } } as unknown as Request, res);
    expect(statusSpy).toHaveBeenCalledWith(500);
  });

  it('handles downloadEvidenceWorkbook success', async () => {
    const { res, downloadSpy } = createMockResponse();
    await module3CanonicalController.downloadEvidenceWorkbook({ query: { assessmentId: 'AIC-2026-0001' } } as unknown as Request, res);
    expect(downloadSpy).toHaveBeenCalled();
  });

  it('handles downloadEvidenceWorkbook error', async () => {
    const { res, statusSpy } = createMockResponse();
    vi.spyOn(Module3PcbiWorkbookBuilder, 'buildWorkbook').mockImplementationOnce(() => {
      throw new Error('Workbook error');
    });
    await module3CanonicalController.downloadEvidenceWorkbook({ query: { assessmentId: 'AIC-2026-0001' } } as unknown as Request, res);
    expect(statusSpy).toHaveBeenCalledWith(500);
  });

  it('covers getErrorMessage with Error and non-Error objects', () => {
    expect(getErrorMessage(new Error('error occurred'))).toBe('error occurred');
    expect(getErrorMessage('plain text failure')).toBe('plain text failure');
    expect(getErrorMessage(12345)).toBe('12345');
  });
});
