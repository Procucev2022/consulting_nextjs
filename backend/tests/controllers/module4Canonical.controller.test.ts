import * as path from 'path';
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import type { Request, Response } from 'express';
import {
  module4CanonicalController,
  getErrorMessage
} from '../../src/controllers/module4Canonical.controller';
import { Module4SavingsForensicEngine } from '../../src/services/module4SavingsForensicEngine';
import { Module4SavingsWorkbookBuilder } from '../../src/services/module4SavingsWorkbookBuilder';
import { VgtModule1Runner } from '../../src/services/vgtModule1Runner';

describe('Module 4 Canonical Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonMock: ReturnType<typeof vi.fn>;
  let statusMock: ReturnType<typeof vi.fn>;
  let downloadMock: ReturnType<typeof vi.fn>;

  beforeAll(async () => {
    Module4SavingsForensicEngine.clearCache();
    VgtModule1Runner.processVgtDataset();
    Module4SavingsForensicEngine.getCertificationReport();
    Module4SavingsForensicEngine.getCertificationReport('PENDING_WORKBOOK_BUILD', 'AIC-2026-0002');
  }, 90000);

  beforeEach(() => {
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnThis();
    downloadMock = vi.fn();
    mockReq = { query: { assessmentId: 'AIC-2026-0001' } };
    mockRes = {
      json: jsonMock,
      status: statusMock,
      download: downloadMock
    };
  });

  it('rejects endpoints when assessmentId is missing', async () => {
    mockReq = { query: {} };
    await module4CanonicalController.getAuditReport(mockReq as Request, mockRes as Response);
    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: expect.stringContaining('Assessment ID is required') })
    );
  });

  it('returns STAGED_NOT_ACTIVATED when requested for unactivated assessment (AIC-2026-0003)', async () => {
    mockReq = { query: { assessmentId: 'AIC-2026-0003' } };
    await module4CanonicalController.getAuditReport(mockReq as Request, mockRes as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        assessmentId: 'AIC-2026-0003',
        status: 'STAGED_NOT_ACTIVATED'
      })
    );

    await module4CanonicalController.downloadEvidenceWorkbook(mockReq as Request, mockRes as Response);
    expect(statusMock).toHaveBeenCalledWith(400);
  });

  it('returns live activated certification report for Borosil (AIC-2026-0002)', async () => {
    mockReq = { query: { assessmentId: 'AIC-2026-0002' } };
    await module4CanonicalController.getAuditReport(mockReq as Request, mockRes as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        report: expect.objectContaining({
          finalVerdict: 'SAVINGS ENGINE CERTIFIED',
          netOpportunityCr: 87.1,
          eligibleSpendCr: 168.658,
          opportunitiesCount: 105
        })
      })
    );
  }, 60000);

  it('getAuditReport should return certification report for AIC-2026-0001', async () => {
    await module4CanonicalController.getAuditReport(mockReq as Request, mockRes as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        report: expect.objectContaining({ finalVerdict: 'SAVINGS ENGINE CERTIFIED' })
      })
    );
  }, 15000);

  it('getOpportunityLedger should return canonical opportunities and bridge', async () => {
    await module4CanonicalController.getOpportunityLedger(mockReq as Request, mockRes as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        opportunities: expect.any(Array),
        bridge: expect.any(Object)
      })
    );
  });

  it('getFinancialBridge should return definitive financial bridge', async () => {
    await module4CanonicalController.getFinancialBridge(mockReq as Request, mockRes as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        bridge: expect.objectContaining({ module4NetOpportunityCr: 337.766 })
      })
    );
  });

  it('getIndependentAudit should return independent audit comparisons', async () => {
    await module4CanonicalController.getIndependentAudit(mockReq as Request, mockRes as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        isZeroVariance: true
      })
    );
  });

  it('getTestMatrix should return all 40 forensic test gates', async () => {
    await module4CanonicalController.getTestMatrix(mockReq as Request, mockRes as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        totalCount: 40
      })
    );
  });

  it('downloadEvidenceWorkbook should trigger workbook download', async () => {
    vi.spyOn(Module4SavingsWorkbookBuilder, 'buildWorkbook').mockReturnValueOnce({
      filePath: path.resolve(process.cwd(), 'MODULE_4_FINAL_SAVINGS_EVIDENCE.xlsx'),
      sha256: 'mock_sha256'
    });
    await module4CanonicalController.downloadEvidenceWorkbook(mockReq as Request, mockRes as Response);
    expect(downloadMock).toHaveBeenCalledWith(
      expect.stringContaining('MODULE_4_FINAL_SAVINGS_EVIDENCE.xlsx'),
      'MODULE_4_FINAL_SAVINGS_EVIDENCE.xlsx'
    );
  });

  it('handles error in getErrorMessage helper', () => {
    expect(getErrorMessage(new Error('Test failure'))).toBe('Test failure');
    expect(getErrorMessage('Raw string error')).toBe('Raw string error');
  });

  it('handles exceptions with 500 status', async () => {
    vi.spyOn(Module4SavingsForensicEngine, 'getCertificationReport').mockImplementationOnce(() => {
      throw new Error('Fatal engine crash');
    });
    await module4CanonicalController.getAuditReport(mockReq as Request, mockRes as Response);
    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: 'Failed to retrieve savings audit report' })
    );
  });

  it('getTransactionLineage should return lineage rows and metrics', async () => {
    mockReq = { query: { assessmentId: 'AIC-2026-0001', limit: '50', offset: '0' } };
    await module4CanonicalController.getTransactionLineage(mockReq as Request, mockRes as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        totalCount: 20241,
        metrics: expect.objectContaining({ opportunityCoveragePct: 100 }),
        lineage: expect.any(Array)
      })
    );

    // Test with all=true
    mockReq = { query: { assessmentId: 'AIC-2026-0001', all: 'true' } };
    await module4CanonicalController.getTransactionLineage(mockReq as Request, mockRes as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        totalCount: 20241
      })
    );
  });

  it('getTransactionLineageTests should return 25 test gates', async () => {
    mockReq = { query: { assessmentId: 'AIC-2026-0001' } };
    await module4CanonicalController.getTransactionLineageTests(mockReq as Request, mockRes as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        totalCount: 25,
        passedCount: 25
      })
    );
  });

  it('handles exceptions in getTransactionLineage and getTransactionLineageTests', async () => {
    vi.spyOn(Module4SavingsForensicEngine, 'getCompleteTransactionLineage').mockImplementationOnce(() => {
      throw new Error('Lineage fetch error');
    });
    mockReq = { query: { assessmentId: 'AIC-2026-0001' } };
    await module4CanonicalController.getTransactionLineage(mockReq as Request, mockRes as Response);
    expect(statusMock).toHaveBeenCalledWith(500);

    vi.spyOn(Module4SavingsForensicEngine, 'getTransactionLineageTestMatrix').mockImplementationOnce(() => {
      throw new Error('Test matrix error');
    });
    await module4CanonicalController.getTransactionLineageTests(mockReq as Request, mockRes as Response);
    expect(statusMock).toHaveBeenCalledWith(500);
  });

  it('getLineageSetReconciliation should return reconciliation summary', async () => {
    mockReq = { query: { assessmentId: 'AIC-2026-0001' } };
    await module4CanonicalController.getLineageSetReconciliation(mockReq as Request, mockRes as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        summary: expect.objectContaining({
          totalAssignments: 20241,
          uniqueTransactionUnion: 20241,
          is1To1PartitionConfirmed: true
        })
      })
    );
  });

  it('getLineageContradictionTests should return 12 contradiction closeout tests', async () => {
    mockReq = { query: { assessmentId: 'AIC-2026-0001' } };
    await module4CanonicalController.getLineageContradictionTests(mockReq as Request, mockRes as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        totalCount: 12,
        passedCount: 12
      })
    );
  });

  it('handles exceptions in getLineageSetReconciliation and getLineageContradictionTests', async () => {
    vi.spyOn(Module4SavingsForensicEngine, 'getLineageSetReconciliation').mockImplementationOnce(() => {
      throw new Error('Reconciliation error');
    });
    mockReq = { query: { assessmentId: 'AIC-2026-0001' } };
    await module4CanonicalController.getLineageSetReconciliation(mockReq as Request, mockRes as Response);
    expect(statusMock).toHaveBeenCalledWith(500);

    vi.spyOn(Module4SavingsForensicEngine, 'getLineageContradictionTests').mockImplementationOnce(() => {
      throw new Error('Contradiction test error');
    });
    await module4CanonicalController.getLineageContradictionTests(mockReq as Request, mockRes as Response);
    expect(statusMock).toHaveBeenCalledWith(500);
  });
});
