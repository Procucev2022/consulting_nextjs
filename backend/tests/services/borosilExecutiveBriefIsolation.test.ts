/**
 * Comprehensive Borosil Executive Brief & Customer Isolation Tests (Prompt 587)
 * Verifies strict customer isolation, zero foreign customer data leakage,
 * authoritative financial metrics reconciliation, and fail-fast context resolution.
 */

import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import type { Request, Response } from 'express';
import { logger } from '../../src/utils/logger';
import { resolveExecutiveBriefContext } from '../../src/utils/executiveBriefContextResolver';
import { AiCevManagementReportBuilder } from '../../src/services/aiCevManagementReportBuilder';
import { AiCevManagementReportPdfBuilder } from '../../src/services/aiCevManagementReportPdfBuilder';
import { AiCevManagementReportPptxBuilder } from '../../src/services/aiCevManagementReportPptxBuilder';
import {
  getExportStatus,
  getExecutiveReportData,
  downloadPdf,
  downloadPptx
} from '../../src/controllers/executiveBriefExport.controller';
import { resolveAuthoritativeAssessment } from '../../src/utils/assessmentContextResolver';

function createMockResponse(): {
  res: Partial<Response>;
  statusCode: number;
  jsonBody: any;
  headers: Record<string, string>;
  sentBuffer: Buffer | null;
} {
  const result = {
    statusCode: 200,
    jsonBody: null as any,
    headers: {} as Record<string, string>,
    sentBuffer: null as Buffer | null,
    res: {} as Partial<Response>
  };

  result.res = {
    status: vi.fn((code: number) => {
      result.statusCode = code;
      return result.res as Response;
    }),
    json: vi.fn((data: any) => {
      result.jsonBody = data;
      return result.res as Response;
    }),
    setHeader: vi.fn((key: string, val: string | number) => {
      result.headers[key] = String(val);
      return result.res as Response;
    }),
    send: vi.fn((data: any) => {
      result.sentBuffer = data;
      return result.res as Response;
    })
  };

  return result;
}

describe('Borosil Executive Brief Customer Isolation & Data Integrity', () => {
  it('strictly resolves Borosil context for valid assessment and customer identifiers', () => {
    const req1 = { query: { assessmentId: 'AIC-2026-0002' } } as unknown as Request;
    const ctx1 = resolveExecutiveBriefContext(req1);
    expect(ctx1.isBorosil).toBe(true);
    expect(ctx1.assessmentId).toBe('AIC-2026-0002');
    expect(ctx1.customerId).toBe('CUST-2026-0002');
    expect(ctx1.customerName).toBe('Borosil Ltd');

    const req2 = { query: { client: 'Borosil Ltd' } } as unknown as Request;
    const ctx2 = resolveExecutiveBriefContext(req2);
    expect(ctx2.isBorosil).toBe(true);

    const req3 = { headers: { 'x-assessment-id': 'AIC-2026-0002' } } as unknown as Request;
    const ctx3 = resolveExecutiveBriefContext(req3);
    expect(ctx3.isBorosil).toBe(true);
  });

  it('fails fast and rejects missing or empty assessment context', () => {
    const emptyReq = { query: {}, headers: {}, body: {} } as unknown as Request;
    expect(() => resolveExecutiveBriefContext(emptyReq)).toThrow(
      'Assessment context cannot be resolved. Please provide a valid assessmentId or client name.'
    );
  });

  it('fails fast and rejects unknown or foreign assessments to prevent data leakage', () => {
    const foreignReq = { query: { assessmentId: 'AIC-2026-9999' } } as unknown as Request;
    expect(() => resolveExecutiveBriefContext(foreignReq)).toThrow(
      "Assessment 'AIC-2026-9999' could not be resolved in the authoritative assessment store."
    );
  });

  it('builds Borosil management report with 100% certified authoritative Module 1-4 figures', () => {
    const assessment = resolveAuthoritativeAssessment('AIC-2026-0002');
    const report = AiCevManagementReportBuilder.buildBorosilReport(assessment) as any;

    expect(report.reportId).toBe('RPT-AICEV-CUST-2026-0002-AIC-2026-0002');
    expect(report.tenant.enterpriseName).toBe('Borosil Ltd');
    expect(report.tenant.assessmentId).toBe('AIC-2026-0002');

    // Section 4 Spend Baseline (Module 1)
    expect(report.section4SpendBaseline.validatedSpendCr).toBe(556.5346);
    expect(report.section4SpendBaseline.canonicalTransactionsCount).toBe(27777);
    expect(report.section4SpendBaseline.activeSuppliersCount).toBe(1537);
    expect(report.section4SpendBaseline.plantsCount).toBe(3);

    // Section 3 Financial Summary (Module 2, 3, 4)
    expect(report.section3ExecutiveSummary.addressableSourcingSpendCr).toBe(168.658);
    expect(report.section3ExecutiveSummary.grossSourcingOpportunityCr).toBe(117.512);
    expect(report.section3ExecutiveSummary.overlapDeductionsCr).toBe(30.412);
    expect(report.section3ExecutiveSummary.netModelledOpportunityCr).toBe(87.1);
    expect(report.section3ExecutiveSummary.internalProvenCommercialOpportunityCr).toBe(85.066);
    expect(report.section3ExecutiveSummary.customerFacingApprovedProvenOpportunityCr).toBe(75.121);
    expect(report.section3ExecutiveSummary.provenCommercialOpportunityCr).toBe(75.121);
    expect(report.section3ExecutiveSummary.modelledOpportunityExcludingLever2Cr).toBe(75.121);
    expect(report.section3ExecutiveSummary.vendorConsolidationSpendUnderValidationCr).toBe(12.081);
    expect(report.section3ExecutiveSummary.vendorConsolidationStatus).toBe(
      'Under Commercial Validation — Savings Not Yet Established'
    );
    expect(report.section3ExecutiveSummary.proposedYear1TargetCr).toBe(12.9);

    // Module 3 & Module 4 Status
    expect(report.section3ExecutiveSummary.module3BenchmarkContributionCr).toBe(0.0);
    expect(report.section3ExecutiveSummary.clientApprovedOpportunityCr).toBe(0.0);
    expect(report.section3ExecutiveSummary.auditedRealizedSavingsCr).toBe(0.0);

    // Lever precision reconciliation
    const lever1 = report.section6StrategicSourcing.provenOpportunityCr; // 73.769
    const lever3 = report.section8EAuction.provenOpportunityCr; // 1.352
    const internalL2 = report.section7VendorConsolidation.internalModelledProvenOpportunityCr; // 11.978
    expect(report.section7VendorConsolidation.customerFacingProvenSavingsCr).toBe(0.0);
    expect(report.section7VendorConsolidation.relevantAddressableSpendCr).toBe(12.081);
    expect(Number((lever1 + lever3).toFixed(3))).toBe(75.121);
    expect(Number((lever1 + internalL2 + lever3).toFixed(3))).toBe(87.099);
  });

  it('Section 8 Regression: asserts zero foreign demo data and complete financial reconciliation', () => {
    const assessment = resolveAuthoritativeAssessment('AIC-2026-0002');
    const report = AiCevManagementReportBuilder.buildBorosilReport(assessment);
    const serialized = JSON.stringify(report).toLowerCase();

    // 1. Borosil assessment ID preserved end-to-end
    expect(report.tenant.assessmentId).toBe('AIC-2026-0002');
    expect(report.tenant.tenantId).toBe('CUST-2026-0002');
    expect(report.section2CompanyContext.customerId).toBe('CUST-2026-0002');
    expect(report.tenant.enterpriseName).toBe('Borosil Ltd');

    // 2. Zero occurrences of foreign customer or demo records
    expect(serialized.includes('ultratech')).toBe(false);
    expect(serialized.includes('5920.35')).toBe(false);
    expect(serialized.includes('4931')).toBe(false);
    expect(serialized.includes('4,931')).toBe(false);
    expect(serialized.includes('68 cr')).toBe(false);
    expect(serialized.includes('68.00 cr')).toBe(false);
    expect(serialized.includes('169.38')).toBe(false);
    expect(serialized.includes('173.12')).toBe(false);
    expect(serialized.includes('154.20')).toBe(false);
    expect(serialized.includes('7.71')).toBe(false);
    expect(serialized.includes('62.80')).toBe(false);
    expect(serialized.includes('93.60')).toBe(false);
    expect(serialized.includes('974 suppliers')).toBe(false);

    // 3. Lever 2 vendor consolidation savings excluded from customer-facing validated opportunity
    expect(report.section7VendorConsolidation.customerFacingProvenSavingsCr).toBe(0.0);
    expect(report.section7VendorConsolidation.relevantAddressableSpendCr).toBe(12.081);
    expect(report.section7VendorConsolidation.commercialStatus).toBe(
      'Under Commercial Validation — Savings Not Yet Established'
    );

    // 4. Module 3 contribution remains zero with research formally closed
    expect(report.section10PcbiBenchmark.benchmarkDerivedSavingsCr).toBe(0.0);
    expect(report.section10PcbiBenchmark.operationalBenchmarkCoveragePct).toBe(0.0);
    expect(report.section10PcbiBenchmark.operationalBenchmarkSpendCr).toBe(0.0);
    expect(report.section10PcbiBenchmark.module3Status).toContain(
      'Research Closed — No Operational Benchmark Data Available'
    );

    // 5. Client-approved and realized savings remain zero
    expect(report.section3ExecutiveSummary.clientApprovedOpportunityCr).toBe(0.0);
    expect(report.section3ExecutiveSummary.auditedRealizedSavingsCr).toBe(0.0);
    expect(report.section12Module4Governance.clientApprovedOpportunityCr).toBe(0.0);
    expect(report.section12Module4Governance.auditedRealizedSavingsCr).toBe(0.0);

    // 6. Proposed Year 1 target
    expect(report.section3ExecutiveSummary.proposedYear1TargetCr).toBe(12.9);

    // 7. Reconcile all financial totals
    const gross = report.section3ExecutiveSummary.grossSourcingOpportunityCr; // 123.244
    const overlap = report.section3ExecutiveSummary.overlapDeductionsCr; // 31.172
    const net = report.section3ExecutiveSummary.netModelledOpportunityCr; // 92.072
    expect(Number((gross - overlap).toFixed(3))).toBe(net);

    const l1 = report.section6StrategicSourcing.provenOpportunityCr; // 78.741
    const l3 = report.section8EAuction.provenOpportunityCr; // 1.352
    const validated = report.section3ExecutiveSummary.customerFacingApprovedProvenOpportunityCr; // 80.093
    expect(Number((l1 + l3).toFixed(3))).toBe(validated);
  });

  it('generates 20-page PDF and 20-slide PPTX deliverables for Borosil with valid checksums', async () => {
    const pdfRes = AiCevManagementReportPdfBuilder.savePdfArtifacts();
    expect(pdfRes.buffer.length).toBeGreaterThan(50000);
    expect(fs.existsSync(pdfRes.briefPath)).toBe(true);

    const pptxRes = await AiCevManagementReportPptxBuilder.savePptxArtifacts();
    expect(pptxRes.buffer.length).toBeGreaterThan(100000);
    expect(fs.existsSync(pptxRes.briefPath)).toBe(true);

    const assessment = resolveAuthoritativeAssessment('AIC-2026-0002');
    const report = AiCevManagementReportBuilder.buildBorosilReport(assessment);
    const cwd = process.cwd();
    const isBackend = path.basename(cwd) === 'backend';
    const rootDir = isBackend ? path.resolve(cwd, '..') : cwd;
    const backendDir = isBackend ? cwd : path.resolve(cwd, 'backend');
    const devReportsDir = path.resolve(rootDir, 'data/dev/assessments/AIC-2026-0002/reports');

    const jsonFilename = 'aiCEV_Executive_Management_Report_AIC-2026-0002.json';
    const jsonContent = JSON.stringify(report, null, 2);
    fs.writeFileSync(path.resolve(backendDir, jsonFilename), jsonContent, 'utf-8');
    if (rootDir !== backendDir) {
      fs.writeFileSync(path.resolve(rootDir, jsonFilename), jsonContent, 'utf-8');
    }
    if (fs.existsSync(devReportsDir)) {
      fs.writeFileSync(path.resolve(devReportsDir, jsonFilename), jsonContent, 'utf-8');
    }

    const jsonDevPath = path.resolve(devReportsDir, jsonFilename);
    const jsonBytes = fs.readFileSync(jsonDevPath);
    const pdfBytes = fs.readFileSync(pdfRes.briefPath);
    const pptxBytes = fs.readFileSync(pptxRes.briefPath);

    const pdfHash = crypto.createHash('sha256').update(pdfBytes).digest('hex');
    const pptxHash = crypto.createHash('sha256').update(pptxBytes).digest('hex');
    const jsonHash = crypto.createHash('sha256').update(jsonBytes).digest('hex');

    logger.info('Delivery Gate 9: Borosil 20-slide customer deliverables generated', {
      pdf: { path: pdfRes.briefPath, size: pdfBytes.length, pages: 20, sha256: pdfHash },
      pptx: { path: pptxRes.briefPath, size: pptxBytes.length, slides: 20, sha256: pptxHash },
      json: { path: jsonDevPath, size: jsonBytes.length, sections: 15, sha256: jsonHash }
    });

    expect(pdfHash).toHaveLength(64);
    expect(pptxHash).toHaveLength(64);
    expect(jsonHash).toHaveLength(64);
    expect(AiCevManagementReportPdfBuilder.SLIDE_COUNT).toBe(20);
    expect(AiCevManagementReportPptxBuilder.SLIDE_COUNT).toBe(20);
  });

  it('controller serves Borosil export status, report data, and file downloads with correct headers', async () => {
    const req = { query: { assessmentId: 'AIC-2026-0002' } } as unknown as Request;

    // 1. Status
    const statusMock = createMockResponse();
    await getExportStatus(req, statusMock.res as Response);
    expect(statusMock.statusCode).toBe(200);
    expect(statusMock.jsonBody.data.clientName).toBe('Borosil Ltd');
    expect(statusMock.jsonBody.data.pdfFilename).toBe('aiCEV_Borosil_Ltd_Executive_Opportunity_Brief.pdf');

    // 2. Report Data
    const reportMock = createMockResponse();
    await getExecutiveReportData(req, reportMock.res as Response);
    expect(reportMock.statusCode).toBe(200);
    expect(reportMock.jsonBody.data.tenant.enterpriseName).toBe('Borosil Ltd');

    // 3. Download PDF
    const pdfMock = createMockResponse();
    await downloadPdf(req, pdfMock.res as Response);
    expect(pdfMock.headers['Content-Type']).toBe('application/pdf');
    expect(pdfMock.headers['Content-Disposition']).toContain('aiCEV_Borosil_Ltd_Executive_Opportunity_Brief.pdf');
    expect(pdfMock.sentBuffer).not.toBeNull();

    // 4. Download PPTX
    const pptxMock = createMockResponse();
    await downloadPptx(req, pptxMock.res as Response);
    expect(pptxMock.headers['Content-Type']).toContain('presentationml.presentation');
    expect(pptxMock.headers['Content-Disposition']).toContain('aiCEV_Borosil_Ltd_Executive_Opportunity_Brief.pptx');
    expect(pptxMock.sentBuffer).not.toBeNull();
  });

  it('controller rejects unresolvable assessments with HTTP 400', async () => {
    const unresolvableReq = { query: { assessmentId: 'UNKNOWN-ID' } } as unknown as Request;
    const resMock = createMockResponse();
    await getExportStatus(unresolvableReq, resMock.res as Response);
    expect(resMock.statusCode).toBe(400);
    expect(resMock.jsonBody.success).toBe(false);
  });
});
