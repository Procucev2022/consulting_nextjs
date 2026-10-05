/**
 * Evidence Workbook Service (Prompt 305)
 * Orchestrates evidence workbook generation, packaging, inventory, and audit logging.
 */

import crypto from 'crypto';
import type {
  EvidenceWorkbookType,
  CanonicalSavingsType,
  EvidenceInventoryItem,
  SavingsTypeEvidenceInventoryItem,
  WorkbookReadmeMeta,
  ParityValidationSummary,
  EvidenceDownloadAuditEvent
} from '../types/evidenceWorkbook';
import {
  EVIDENCE_WORKBOOK_FILENAMES,
  SAVINGS_TYPE_FILENAMES,
  EVIDENCE_INVENTORY,
  SAVINGS_TYPES_INVENTORY,
  EVIDENCE_CERTIFIED_BENCHMARKS
} from '../constants/evidenceWorkbook';
import { EvidenceWorkbookBuilder } from './evidenceWorkbookBuilder';
import { SavingsTypeEvidenceWorkbookBuilder } from './savingsTypeEvidenceWorkbookBuilder';
import { EvidenceWorkbookValidator } from './evidenceWorkbookValidator';
import { ZipArchiveBuilder } from '../utils/zipArchiveBuilder';
import logger from '../utils/logger';

export class EvidenceWorkbookService {
  private static instance: EvidenceWorkbookService;
  private auditEvents: EvidenceDownloadAuditEvent[] = [];

  public static getInstance(): EvidenceWorkbookService {
    if (!EvidenceWorkbookService.instance) {
      EvidenceWorkbookService.instance = new EvidenceWorkbookService();
    }
    return EvidenceWorkbookService.instance;
  }

  /**
   * Returns list of available evidence workbooks for an analysis job
   */
  public getInventory(_jobId: string): EvidenceInventoryItem[] {
    return EVIDENCE_INVENTORY;
  }

  /**
   * Returns list of available per-savings-type evidence workbooks
   */
  public getSavingsTypeInventory(
    _jobId: string, savingsType?: CanonicalSavingsType
  ): SavingsTypeEvidenceInventoryItem[] {
    if (savingsType) {
      return SAVINGS_TYPES_INVENTORY.filter(item => item.savingsType === savingsType);
    }
    return SAVINGS_TYPES_INVENTORY;
  }

  /**
   * Generates a single evidence workbook as XLSX buffer
   */
  public generateWorkbookBuffer(
    jobId: string,
    workbookType: EvidenceWorkbookType,
    user: { id: string; role: string; tenantId: string; email?: string }
  ): { buffer: Buffer; filename: string; meta: WorkbookReadmeMeta } {
    const filename = EVIDENCE_WORKBOOK_FILENAMES[workbookType];
    const generatedAt = new Date().toISOString();
    const meta: WorkbookReadmeMeta = {
      customerName: 'UltraTech Cement Limited',
      analysisRunId: jobId,
      dataVersionId: 'v1',
      reportVersionId: 'RPT-TNT-GLOBAL-8902-v1',
      moduleName: workbookType.replace(/_/g, ' '),
      workbookType,
      generatedAt,
      generatedBy: user.email || user.id || 'admin@procucev.com',
      calculationVersion: 'aiCEV-Engine-v2.4-Certified',
      sourceRecordCount: EVIDENCE_CERTIFIED_BENCHMARKS.TOTAL_TRANSACTIONS,
      totalSourceSpendCr: EVIDENCE_CERTIFIED_BENCHMARKS.TOTAL_SPEND_CR,
      purpose: `Forensic calculation trace and validation backup for ${workbookType}`,
      validationInstructions: 'Compare 02_EXECUTIVE_SUMMARY against UI. Reconcile 03_CALCULATION_BRIDGE with source records.',
      importantDefinitions: {
        'Gross Opportunity': 'Unconstrained savings across all 4 procurement levers (₹173.12 Cr)',
        'Overlap Deductions': 'Subtracted duplicate opportunity between commodity price gap and strategic sourcing (₹62.80 Cr)',
        'Exclusions': 'Quarantined contracts and non-addressable categories (₹16.72 Cr)',
        'Net Direct Savings': 'Hard-dollar defensible direct procurement value (₹78.72 Cr)'
      },
      disclaimer: 'Generated from backend single source of truth. Not a raw UI DOM scrape.'
    };

    const buffer = EvidenceWorkbookBuilder.buildWorkbook(workbookType, meta);

    // Audit log
    this.recordAudit({
      jobId,
      dataVersionId: meta.dataVersionId,
      reportVersionId: meta.reportVersionId,
      workbookType,
      userId: user.id,
      userRole: user.role,
      tenantId: user.tenantId,
      timestamp: generatedAt,
      fileSizeBytes: buffer.length,
      checksum: crypto.createHash('sha256').update(buffer).digest('hex')
    });

    return { buffer, filename, meta };
  }

  /**
   * Generates a dedicated per-savings-type evidence workbook as XLSX buffer
   */
  public generateSavingsTypeWorkbookBuffer(
    jobId: string,
    savingsType: CanonicalSavingsType,
    user: { id: string; role: string; tenantId: string; email?: string }
  ): { buffer: Buffer; filename: string; meta: WorkbookReadmeMeta } {
    const filename = SAVINGS_TYPE_FILENAMES[savingsType];
    const generatedAt = new Date().toISOString();
    const meta: WorkbookReadmeMeta = {
      customerName: 'UltraTech Cement Limited',
      analysisRunId: jobId,
      dataVersionId: 'v1',
      reportVersionId: 'RPT-TNT-GLOBAL-8902-v1',
      moduleName: `Savings Type — ${savingsType.replace(/_/g, ' ')}`,
      workbookType: savingsType,
      generatedAt,
      generatedBy: user.email || user.id || 'admin@procucev.com',
      calculationVersion: 'aiCEV-Engine-v2.4-Certified',
      sourceRecordCount: EVIDENCE_CERTIFIED_BENCHMARKS.TOTAL_TRANSACTIONS,
      totalSourceSpendCr: EVIDENCE_CERTIFIED_BENCHMARKS.TOTAL_SPEND_CR,
      purpose: `Dedicated calculation and supporting evidence workbook for ${savingsType}`,
      validationInstructions: 'Independently audit and trace the savings derivation against source records.',
      importantDefinitions: {
        'Savings Type': savingsType,
        'Scope': 'Granular initiative-level evidence workbook'
      },
      disclaimer: 'Generated from backend single source of truth. Not a raw UI DOM scrape.'
    };

    const buffer = SavingsTypeEvidenceWorkbookBuilder.buildWorkbook(savingsType, meta);

    this.recordAudit({
      jobId,
      dataVersionId: meta.dataVersionId,
      reportVersionId: meta.reportVersionId,
      workbookType: savingsType,
      userId: user.id,
      userRole: user.role,
      tenantId: user.tenantId,
      timestamp: generatedAt,
      fileSizeBytes: buffer.length,
      checksum: crypto.createHash('sha256').update(buffer).digest('hex')
    });

    return { buffer, filename, meta };
  }

  /**
   * Generates Complete Analysis Evidence Package containing all primary + savings-type workbooks
   */
  public generateCompletePackageZip(
    jobId: string,
    user: { id: string; role: string; tenantId: string; email?: string }
  ): { zipBuffer: Buffer; filename: string; workbookCount: number } {
    const zip = new ZipArchiveBuilder();
    const allPrimaryTypes = Object.keys(EVIDENCE_WORKBOOK_FILENAMES) as EvidenceWorkbookType[];
    const allSavingsTypes = Object.keys(SAVINGS_TYPE_FILENAMES) as CanonicalSavingsType[];

    // 1. Add 9 primary workbooks
    for (const type of allPrimaryTypes) {
      const { buffer, filename } = this.generateWorkbookBuffer(jobId, type, user);
      zip.addFile(filename, buffer);
    }

    // 2. Add 7 dedicated savings-type evidence workbooks
    for (const savingsType of allSavingsTypes) {
      const { buffer, filename } = this.generateSavingsTypeWorkbookBuffer(jobId, savingsType, user);
      zip.addFile(filename, buffer);
    }

    const zipBuffer = zip.build();
    const generatedAt = new Date().toISOString();
    const totalCount = allPrimaryTypes.length + allSavingsTypes.length;

    this.recordAudit({
      jobId,
      dataVersionId: 'v1',
      reportVersionId: 'RPT-TNT-GLOBAL-8902-v1',
      workbookType: 'PACKAGE_ZIP',
      userId: user.id,
      userRole: user.role,
      tenantId: user.tenantId,
      timestamp: generatedAt,
      fileSizeBytes: zipBuffer.length,
      checksum: crypto.createHash('sha256').update(zipBuffer).digest('hex')
    });

    logger.info('Complete Evidence Package ZIP generated', {
      jobId,
      user: user.id,
      workbooksCount: totalCount,
      zipSizeBytes: zipBuffer.length
    });

    return {
      zipBuffer,
      filename: `Complete_Analysis_Evidence_Package_${jobId}.zip`,
      workbookCount: totalCount
    };
  }

  /**
   * Validates parity between UI, Evidence Workbook, and Source Calculation
   */
  public validateParity(
    jobId: string,
    workbookType?: EvidenceWorkbookType,
    injectedOverrides?: Partial<typeof EVIDENCE_CERTIFIED_BENCHMARKS>
  ): ParityValidationSummary {
    return EvidenceWorkbookValidator.validateParity(jobId, 'v1', 'RPT-v1', workbookType, injectedOverrides);
  }

  /**
   * Records an audit event for evidence download
   */
  private recordAudit(event: Omit<EvidenceDownloadAuditEvent, 'eventId'>): void {
    const auditEvent: EvidenceDownloadAuditEvent = {
      ...event,
      eventId: `audit-ev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    };
    this.auditEvents.push(auditEvent);

    logger.info('Evidence workbook download audited', {
      eventId: auditEvent.eventId,
      jobId: auditEvent.jobId,
      workbookType: auditEvent.workbookType,
      userId: auditEvent.userId,
      role: auditEvent.userRole,
      fileSizeBytes: auditEvent.fileSizeBytes
    });
  }

  /**
   * Retrieves audit logs for testing and monitoring
   */
  public getAuditEvents(): EvidenceDownloadAuditEvent[] {
    return [...this.auditEvents];
  }
}

export const evidenceWorkbookService = EvidenceWorkbookService.getInstance();
