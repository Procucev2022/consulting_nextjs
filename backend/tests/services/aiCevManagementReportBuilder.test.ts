import { describe, it, expect } from 'vitest';
import { AiCevManagementReportBuilder } from '../../src/services/aiCevManagementReportBuilder';
import { AiCevManagementReportPdfBuilder } from '../../src/services/aiCevManagementReportPdfBuilder';
import { resolveAuthoritativeAssessment } from '../../src/utils/assessmentContextResolver';

describe('AiCevManagementReportBuilder and PdfBuilder for Borosil', () => {
  it('should build report with fully reconciled lever-wise proven opportunity', () => {
    const assessment = resolveAuthoritativeAssessment('AIC-2026-0002');
    const report = AiCevManagementReportBuilder.buildBorosilReport(assessment) as any;

    expect(report.reportId).toBe('RPT-AICEV-CUST-2026-0002-AIC-2026-0002');
    expect(report.section7ConsolidatedSavingsOpportunity.provenOpportunityCr).toBe(75.121);

    const l1 = report.section8LeverWiseBreakdown.combinedStrategic;
    const l2 = report.section8LeverWiseBreakdown.vendorConsolidation;
    const l3 = report.section8LeverWiseBreakdown.eAuction;

    expect(l1.provenOpportunityCr).toBe(73.769);
    expect(l2.provenOpportunityCr).toBe(11.978);
    expect(l3.provenOpportunityCr).toBe(1.352);

    // Mathematical reconciliation check: L1 (73.769) + L3 (1.352) = 75.121 (Excl L2)
    const sumExclL2 = Number((l1.provenOpportunityCr + l3.provenOpportunityCr).toFixed(3));
    expect(sumExclL2).toBe(75.121);
    expect(sumExclL2).toBe(report.section7ConsolidatedSavingsOpportunity.provenOpportunityCr);
  });

  it('should generate valid PDF buffer with all pages', () => {
    const pdfBuffer = AiCevManagementReportPdfBuilder.generatePdf();
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(1000);
    // PDF Magic bytes
    expect(pdfBuffer.subarray(0, 4).toString()).toBe('%PDF');
  });
});
