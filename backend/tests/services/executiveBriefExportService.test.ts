import { describe, it, expect, vi } from 'vitest';
import { executiveBriefExportService } from '../../src/services/executiveBriefExportService';
import { executiveBriefService } from '../../src/services/executiveBriefService';

describe('Executive Brief Export Service', () => {
  it('EXPORT-14: should verify zero financial variance across Modules 1-4', () => {
    const recon = executiveBriefExportService.verifyFinancialConsistency('UltraTech Cement Limited');

    expect(recon.isConsistent).toBe(true);
    expect(recon.status).toBe('PASS');
    expect(recon.totalSpendVarianceInr).toBe(0);
    expect(recon.grossOpportunityVarianceInr).toBe(0);
    expect(recon.netDefensibleVarianceInr).toBe(0);
    expect(recon.approvedSavingsVarianceInr).toBe(0);
    expect(recon.realizedSavingsVarianceInr).toBe(0);
  });

  it('EXPORT-17: should block export if financial discrepancy is detected', () => {
    const spy = vi.spyOn(executiveBriefService, 'generateReportMetadata').mockReturnValueOnce({
      ...executiveBriefService.generateReportMetadata('UltraTech Cement Limited'),
      totalSpendInr: 999999999999
    });

    const recon = executiveBriefExportService.verifyFinancialConsistency('UltraTech Cement Limited');
    expect(recon.isConsistent).toBe(false);
    expect(recon.status).toBe('FAIL');
    expect(recon.errorMessage).toBeDefined();

    spy.mockRestore();
  });

  it('EXPORT-03, 04, 07-10: should generate dual-format export with identical values and audit', async () => {
    const result = await executiveBriefExportService.generateDualFormatExport('UltraTech Cement Limited');

    expect(result.audit.exportStatus).toBe('EXECUTIVE_BRIEF_EXPORT_READY');
    expect(result.pdfBuffer.length).toBeGreaterThan(1000);
    expect(result.pptxBuffer.length).toBeGreaterThan(1000);
    expect(result.audit.pageCount).toBe(30);
    expect(result.audit.slideCount).toBe(30);
    expect(result.audit.reportId).toContain('RPT-EXEC-');
    expect(result.audit.pdfGenerated).toBe(true);
    expect(result.audit.pptxGenerated).toBe(true);
    expect(result.audit.checksums.pdfSha256).toBeDefined();
    expect(result.audit.checksums.pptxSha256).toBeDefined();
  }, 25000);

  it('EXPORT-11: should enforce strict client isolation without cross-client data', async () => {
    const result1 = await executiveBriefExportService.generateDualFormatExport('Client Alpha');
    const result2 = await executiveBriefExportService.generateDualFormatExport('Client Beta');

    expect(result1.audit.client).toBe('Client Alpha');
    expect(result2.audit.client).toBe('Client Beta');
  }, 25000);

  it('EXPORT-18, 19, 20: should record audit and update history', async () => {
    await executiveBriefExportService.generateDualFormatExport('UltraTech Cement Limited');
    const history = executiveBriefExportService.getHistory();
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].reportVersion).toBe('1.1');
  });

  it('EXPORT-17: should block export in generateDualFormatExport if consistency check fails', async () => {
    const spy = vi.spyOn(executiveBriefExportService, 'verifyFinancialConsistency').mockReturnValueOnce({
      totalSpendVarianceInr: 5000,
      addressableSpendVarianceInr: 0,
      grossOpportunityVarianceInr: 0,
      netDefensibleVarianceInr: 0,
      approvedSavingsVarianceInr: 0,
      realizedSavingsVarianceInr: 0,
      isConsistent: false,
      status: 'FAIL',
      errorMessage: 'Financial reconciliation failure'
    });

    const result = await executiveBriefExportService.generateDualFormatExport('Corrupted Client');
    expect(result.audit.exportStatus).toBe('EXECUTIVE_BRIEF_EXPORT_BLOCKED');
    expect(result.pdfBuffer.length).toBe(0);
    expect(result.pptxBuffer.length).toBe(0);

    spy.mockRestore();
  });

  it('should set FAIL validation statuses if canvas page count or pptx is invalid', async () => {
    const canvasSpy = vi.spyOn(executiveBriefService, 'generatePresentationCanvas').mockReturnValueOnce({
      toBuffer: () => Buffer.from('mock pdf'),
      getPageCount: () => 29
    } as any);

    const result = await executiveBriefExportService.generateDualFormatExport('UltraTech Cement Limited');
    expect(result.audit.pdfValidation).toBe('FAIL');

    canvasSpy.mockRestore();
  });
});
