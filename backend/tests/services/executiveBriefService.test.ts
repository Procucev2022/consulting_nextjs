import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  ExecutiveBriefService,
  executiveBriefService
} from '../../src/services/executiveBriefService';
import {
  formatExecutiveBriefAuditMarkdown,
  formatExecutiveBriefValidationMarkdown
} from '../../src/services/executiveBriefMarkdown';
import {
  RAW_TOTAL_SPEND_INR,
  RAW_NET_DEFENSIBLE_INR,
  RAW_APPROVED_MODULE4_INR,
  RAW_REALIZED_INR
} from '../../src/constants/numericalAuditConstants';

describe('ExecutiveBriefService Unit Tests (Prompt 257)', () => {
  it('verifies singleton getter for ExecutiveBriefService', () => {
    const inst1 = ExecutiveBriefService.getInstance();
    const inst2 = executiveBriefService;
    expect(inst1).toBe(inst2);
    expect(inst1).toBeInstanceOf(ExecutiveBriefService);
  });

  it('generates the complete 30-slide PDF presentation canvas with default & custom client', () => {
    const canvasDefault = executiveBriefService.generatePresentationCanvas();
    expect(canvasDefault.getPageCount()).toBe(30);

    const canvas = executiveBriefService.generatePresentationCanvas('UltraTech Cement Limited');
    expect(canvas.getPageCount()).toBe(30);

    const buf = canvas.toBuffer();
    expect(buf.toString('latin1', 0, 8)).toBe('%PDF-1.4');
    expect(buf.toString('latin1')).toContain('%%EOF');
    expect(buf.length).toBeGreaterThan(15000);
  });

  it('generates report metadata adhering to Section 27 specifications', () => {
    const metaDefault = executiveBriefService.generateReportMetadata();
    expect(metaDefault.client).toBe('UltraTech Cement Limited');

    const meta = executiveBriefService.generateReportMetadata('UltraTech Cement Limited');
    expect(meta.client).toBe('UltraTech Cement Limited');
    expect(meta.modulesIncluded).toEqual(['Module 1', 'Module 2', 'Module 3', 'Module 4']);
    expect(meta.transactionCount).toBe(31671);
    expect(meta.totalSpendInr).toBe(RAW_TOTAL_SPEND_INR);
    expect(meta.addressableSpendInr).toBe(49310000000);
    expect(meta.netDefensibleOpportunityInr).toBe(RAW_NET_DEFENSIBLE_INR);
    expect(meta.approvedSavingsInr).toBe(RAW_APPROVED_MODULE4_INR);
    expect(meta.realizedSavingsInr).toBe(RAW_REALIZED_INR);
    expect(meta.opportunityCount).toBe(10);
    expect(meta.confidenceSummary.high).toBe(7);
    expect(meta.sourceReferences.length).toBeGreaterThanOrEqual(5);
  });

  it('generates report audit trail markdown adhering to Section 28 specifications', () => {
    const mdDefault = executiveBriefService.generateAuditMarkdown();
    expect(mdDefault).toContain('# EXECUTIVE BRIEF AUDIT TRAIL');

    const md = executiveBriefService.generateAuditMarkdown('UltraTech Cement Limited');
    expect(md).toContain('# EXECUTIVE BRIEF AUDIT TRAIL');
    expect(md).toContain('59203477681.66');
    expect(md).toContain(String(RAW_NET_DEFENSIBLE_INR));
    expect(md).toContain('479000000');
    expect(md).toContain('Zero Discrepancy');
    expect(md).toContain('Lineage & Traceability Audit');
  });

  it('generates validation report markdown adhering to Section 30 specifications', () => {
    const val = {
      totalPages: 30,
      totalCharts: 18,
      totalFindings: 3,
      totalOpportunities: 10,
      totalEvidenceReferences: 12,
      totalExternalSources: 5,
      financialVariance: 0.0,
      financialReconciliationStatus: 'PASS' as const,
      module1Linkage: 'VERIFIED' as const,
      module2Linkage: 'VERIFIED' as const,
      module3Linkage: 'VERIFIED' as const,
      module4Linkage: 'VERIFIED' as const,
      securityStatus: 'VERIFIED' as const,
      pdfRenderingStatus: 'VERIFIED' as const,
      finalStatus: 'EXECUTIVE_BRIEF_READY' as const
    };
    const valMd = executiveBriefService.generateValidationReportMarkdown(val);
    expect(valMd).toContain('# EXECUTIVE BRIEF VALIDATION REPORT');
    expect(valMd).toContain('- **Total Slides / Pages**: 30');
    expect(valMd).toContain('EXECUTIVE_BRIEF_READY');

    // Also test helper directly
    const directValMd = formatExecutiveBriefValidationMarkdown(val);
    expect(directValMd).toBe(valMd);

    const meta = executiveBriefService.generateReportMetadata();
    const directAuditMd = formatExecutiveBriefAuditMarkdown(meta);
    expect(directAuditMd).toContain('# EXECUTIVE BRIEF AUDIT TRAIL');
  });

  it('executes full artifact generation writing PDF, JSON, Audit, and Validation reports', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'exec-brief-test-'));
    const result = executiveBriefService.generateAllArtifacts('UltraTech Cement Limited', tempDir);

    expect(fs.existsSync(result.pdfPath)).toBe(true);
    expect(fs.existsSync(result.jsonPath)).toBe(true);
    expect(fs.existsSync(result.auditPath)).toBe(true);
    expect(fs.existsSync(result.validationPath)).toBe(true);

    expect(result.validation.totalPages).toBe(30);
    expect(result.validation.financialVariance).toBe(0.0);
    expect(result.validation.finalStatus).toBe('EXECUTIVE_BRIEF_READY');

    const pdfStat = fs.statSync(result.pdfPath);
    expect(pdfStat.size).toBeGreaterThan(15000);

    // Cleanup
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('exercises generateAllArtifacts in backend directory branch and default targetDir branch', () => {
    const tempBackendDir = fs.mkdtempSync(path.join(os.tmpdir(), 'backend'));
    const result = executiveBriefService.generateAllArtifacts('UltraTech Cement Limited', tempBackendDir);
    expect(fs.existsSync(result.pdfPath)).toBe(true);
    expect(fs.existsSync(result.jsonPath)).toBe(true);
    expect(fs.existsSync(result.auditPath)).toBe(true);
    expect(fs.existsSync(result.validationPath)).toBe(true);

    // Default targetDir branch
    const defaultResult = executiveBriefService.generateAllArtifacts();
    expect(fs.existsSync(defaultResult.pdfPath)).toBe(true);

    // Cleanup
    fs.rmSync(tempBackendDir, { recursive: true, force: true });
  });
});
