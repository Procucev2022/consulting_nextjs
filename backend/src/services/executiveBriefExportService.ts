/**
 * Executive Brief Dual-Format Export Service (Prompt 258)
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { logger } from '../utils/logger';
import {
  DEFAULT_CLIENT_PROFILE,
  EXECUTIVE_BRIEF_VERSION
} from '../constants/executiveBriefConstants';
import {
  REPORT_EXPORT_VERSION,
  REPORT_ID_PREFIX,
  DEFAULT_EXPORT_HISTORY,
  EXPORT_VALIDATION_ERRORS
} from '../constants/executiveBriefExportConstants';
import {
  RAW_TOTAL_SPEND_INR,
  RAW_GROSS_OPP_INR,
  RAW_NET_DEFENSIBLE_INR,
  RAW_APPROVED_MODULE4_INR,
  RAW_REALIZED_INR
} from '../constants/numericalAuditConstants';
import {
  getOfficialPdfFilename,
  getOfficialPptxFilename
} from '../utils/filenameSanitizer';
import { executiveBriefService } from './executiveBriefService';
import { ExecutiveBriefPptxGenerator } from './executiveBriefPptxGenerator';
import type {
  FinancialConsistencyCheck,
  ExecutiveBriefExportAudit,
  ReportHistoryEntry
} from '../types/executiveBriefExportTypes';

export class ExecutiveBriefExportService {
  private static instance: ExecutiveBriefExportService;
  private history: ReportHistoryEntry[] = [...DEFAULT_EXPORT_HISTORY];

  private constructor() {}

  public static getInstance(): ExecutiveBriefExportService {
    if (!ExecutiveBriefExportService.instance) {
      ExecutiveBriefExportService.instance = new ExecutiveBriefExportService();
    }
    return ExecutiveBriefExportService.instance;
  }

  /**
   * Verifies Financial Consistency across Modules 1 to 4 (Section 5)
   */
  public verifyFinancialConsistency(
    clientName = DEFAULT_CLIENT_PROFILE.clientName
  ): FinancialConsistencyCheck {
    const meta = executiveBriefService.generateReportMetadata(clientName);

    const totalSpendDiff = Math.abs(meta.totalSpendInr - RAW_TOTAL_SPEND_INR);
    const addressableDiff = Math.abs(meta.addressableSpendInr - 49310000000);
    const grossOppDiff = Math.abs(meta.grossOpportunityInr - RAW_GROSS_OPP_INR);
    const netDefensibleDiff = Math.abs(meta.netDefensibleOpportunityInr - RAW_NET_DEFENSIBLE_INR);
    const approvedDiff = Math.abs(meta.approvedSavingsInr - RAW_APPROVED_MODULE4_INR);
    const realizedDiff = Math.abs(meta.realizedSavingsInr - RAW_REALIZED_INR);

    const totalVariance =
      totalSpendDiff + addressableDiff + grossOppDiff + netDefensibleDiff + approvedDiff + realizedDiff;

    const isConsistent = totalVariance === 0;

    return {
      totalSpendVarianceInr: totalSpendDiff,
      addressableSpendVarianceInr: addressableDiff,
      grossOpportunityVarianceInr: grossOppDiff,
      netDefensibleVarianceInr: netDefensibleDiff,
      approvedSavingsVarianceInr: approvedDiff,
      realizedSavingsVarianceInr: realizedDiff,
      isConsistent,
      status: isConsistent ? 'PASS' : 'FAIL',
      errorMessage: isConsistent ? undefined : EXPORT_VALIDATION_ERRORS.VARIANCE_DETECTED
    };
  }

  /**
   * Generates SHA-256 checksum for audit
   */
  public calculateChecksum(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Generates Dual-Format Export: PDF + Editable PPTX + Audit JSON
   */
  public async generateDualFormatExport(
    clientName = DEFAULT_CLIENT_PROFILE.clientName,
    targetDir?: string
  ): Promise<{
    audit: ExecutiveBriefExportAudit;
    pdfPath: string;
    pptxPath: string;
    auditPath: string;
    pdfBuffer: Buffer;
    pptxBuffer: Buffer;
  }> {
    const dir = targetDir || process.cwd();
    const dateStr = new Date().toISOString().split('T')[0];
    const reportId = `${REPORT_ID_PREFIX}${dateStr.replace(/-/g, '')}-001`;

    logger.info('Initiating Dual-Format Executive Brief Export', { clientName, reportId, dir });

    // Step 1: Strict Financial Consistency Check
    const consistency = this.verifyFinancialConsistency(clientName);
    if (!consistency.isConsistent) {
      logger.error('Executive Brief Export BLOCKED by financial variance', { consistency });
      const blockedAudit: ExecutiveBriefExportAudit = {
        reportId,
        client: clientName,
        generationTimestamp: new Date().toISOString(),
        sourceDataVersion: 'MODULE_1_4_CERTIFIED_V1.0',
        pdfGenerated: false,
        pptxGenerated: false,
        pdfValidation: 'FAIL',
        pptxValidation: 'FAIL',
        financialReconciliation: { varianceInr: 999.0, status: 'FAIL' },
        pageCount: 0,
        slideCount: 0,
        fileSize: { pdfBytes: 0, pptxBytes: 0 },
        checksums: { pdfSha256: '', pptxSha256: '' },
        exportStatus: 'EXECUTIVE_BRIEF_EXPORT_BLOCKED',
        blockedReason: consistency.errorMessage
      };
      const auditPath = path.resolve(dir, 'EXECUTIVE_BRIEF_EXPORT_AUDIT.json');
      fs.writeFileSync(auditPath, JSON.stringify(blockedAudit, null, 2), 'utf-8');
      return {
        audit: blockedAudit,
        pdfPath: '',
        pptxPath: '',
        auditPath,
        pdfBuffer: Buffer.alloc(0),
        pptxBuffer: Buffer.alloc(0)
      };
    }

    // Step 2: Generate PDF via PdfCanvas
    const canvas = executiveBriefService.generatePresentationCanvas(clientName);
    const pdfBuffer = canvas.toBuffer();
    const pdfFilename = getOfficialPdfFilename(clientName, dateStr);
    const pdfPath = path.resolve(dir, pdfFilename);
    fs.writeFileSync(pdfPath, pdfBuffer);

    // Also maintain standardized short path
    const stdPdfPath = path.resolve(dir, 'EXECUTIVE_BRIEF.pdf');
    fs.writeFileSync(stdPdfPath, pdfBuffer);

    // Step 3: Generate Editable PPTX via ExecutiveBriefPptxGenerator
    const pptxBuffer = await ExecutiveBriefPptxGenerator.generateBuffer(clientName);
    const pptxFilename = getOfficialPptxFilename(clientName, dateStr);
    const pptxPath = path.resolve(dir, pptxFilename);
    fs.writeFileSync(pptxPath, pptxBuffer);

    const stdPptxPath = path.resolve(dir, 'EXECUTIVE_BRIEF.pptx');
    fs.writeFileSync(stdPptxPath, pptxBuffer);

    // Step 4: Inspect PPTX
    const pptxInspection = ExecutiveBriefPptxGenerator.inspectPresentation(30, pptxBuffer.length);

    // Step 5: Generate Export Audit JSON
    const audit: ExecutiveBriefExportAudit = {
      reportId,
      client: clientName,
      generationTimestamp: new Date().toISOString(),
      sourceDataVersion: 'MODULE_1_4_CERTIFIED_V1.0',
      pdfGenerated: true,
      pptxGenerated: true,
      pdfValidation: canvas.getPageCount() === 30 ? 'PASS' : 'FAIL',
      pptxValidation: pptxInspection.isValid ? 'PASS' : 'FAIL',
      financialReconciliation: { varianceInr: 0.0, status: 'PASS' },
      pageCount: canvas.getPageCount(),
      slideCount: pptxInspection.slideCount,
      fileSize: {
        pdfBytes: pdfBuffer.length,
        pptxBytes: pptxBuffer.length
      },
      checksums: {
        pdfSha256: this.calculateChecksum(pdfBuffer),
        pptxSha256: this.calculateChecksum(pptxBuffer)
      },
      exportStatus: 'EXECUTIVE_BRIEF_EXPORT_READY'
    };

    const auditPath = path.resolve(dir, 'EXECUTIVE_BRIEF_EXPORT_AUDIT.json');
    fs.writeFileSync(auditPath, JSON.stringify(audit, null, 2), 'utf-8');

    // Also write to parent root if executing from backend/
    if (path.basename(dir) === 'backend') {
      const rootDir = path.resolve(dir, '..');
      fs.writeFileSync(path.resolve(rootDir, pdfFilename), pdfBuffer);
      fs.writeFileSync(path.resolve(rootDir, pptxFilename), pptxBuffer);
      fs.writeFileSync(path.resolve(rootDir, 'EXECUTIVE_BRIEF.pdf'), pdfBuffer);
      fs.writeFileSync(path.resolve(rootDir, 'EXECUTIVE_BRIEF.pptx'), pptxBuffer);
      fs.writeFileSync(path.resolve(rootDir, 'EXECUTIVE_BRIEF_EXPORT_AUDIT.json'), JSON.stringify(audit, null, 2));
    }

    // Step 6: Record in Export History
    const historyEntry: ReportHistoryEntry = {
      reportId,
      reportVersion: REPORT_EXPORT_VERSION,
      generatedDate: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      generatedBy: 'Procucev Automated Savings Engine',
      dataVersion: EXECUTIVE_BRIEF_VERSION,
      clientName,
      analysisPeriod: DEFAULT_CLIENT_PROFILE.analysisPeriod,
      pdfFileName: pdfFilename,
      pptxFileName: pptxFilename,
      pdfPath,
      pptxPath,
      exportStatus: audit.exportStatus
    };
    this.history.unshift(historyEntry);

    logger.info('Dual-Format Executive Brief Export generated successfully', {
      reportId,
      pdfBytes: pdfBuffer.length,
      pptxBytes: pptxBuffer.length,
      status: audit.exportStatus
    });

    return {
      audit,
      pdfPath,
      pptxPath,
      auditPath,
      pdfBuffer,
      pptxBuffer
    };
  }

  /**
   * Retrieves Export History
   */
  public getHistory(): ReportHistoryEntry[] {
    return [...this.history];
  }
}

export const executiveBriefExportService = ExecutiveBriefExportService.getInstance();
