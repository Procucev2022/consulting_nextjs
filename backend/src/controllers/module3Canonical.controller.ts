/**
 * Module 3 PCBI Canonical Controller
 * Exposes authoritative audit endpoints, reconciliation metrics, and evidence workbook downloads.
 */

import type { Request, Response } from 'express';
import { Module3PcbiForensicEngine } from '../services/module3PcbiForensicEngine';
import { Module3PcbiIndependentCalculator } from '../services/module3PcbiIndependentCalculator';
import { Module3PcbiWorkbookBuilder } from '../services/module3PcbiWorkbookBuilder';
import { Module3PcbiMappingService } from '../services/module3PcbiMappingService';
import { logger } from '../utils/logger';

export function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export class Module3CanonicalController {
  private resolveAssessmentId(req: Request): string | null {
    const raw = (req.query?.assessmentId as string) || (req.params?.assessmentId as string);
    if (!raw) return null;
    const clean = raw.trim();
    if (clean !== 'AIC-2026-0001' && clean !== 'AIC-2026-0002') {
      return 'INVALID';
    }
    return clean;
  }

  public async getAuditReport(req: Request, res: Response): Promise<void> {
    try {
      const targetId = this.resolveAssessmentId(req);
      if (targetId === 'INVALID') {
        res.status(400).json({ success: false, message: 'Invalid or unknown assessment ID. Cross-customer fallback rejected.' });
        return;
      }
      const assessmentId = targetId || 'AIC-2026-0001';
      const report = Module3PcbiForensicEngine.getCertificationReport(assessmentId);
      res.json({ success: true, report });
    } catch (err: unknown) {
      logger.error('Failed to get Module 3 PCBI certification report', {
        error: getErrorMessage(err)
      });
      res.status(500).json({ success: false, message: 'Failed to retrieve PCBI audit report' });
    }
  }

  public async getSpendReconciliation(req: Request, res: Response): Promise<void> {
    try {
      const targetId = this.resolveAssessmentId(req);
      if (targetId === 'INVALID') {
        res.status(400).json({ success: false, message: 'Invalid or unknown assessment ID. Cross-customer fallback rejected.' });
        return;
      }
      const assessmentId = targetId || 'AIC-2026-0001';
      const { reconciliation, priceGap } = Module3PcbiForensicEngine.processCustomerLedger(assessmentId);
      res.json({ success: true, reconciliation, priceGap });
    } catch (err: unknown) {
      logger.error('Failed to get PCBI spend reconciliation', {
        error: getErrorMessage(err)
      });
      res.status(500).json({ success: false, message: 'Failed to retrieve PCBI reconciliation' });
    }
  }

  public async getIndependentAudit(_req: Request, res: Response): Promise<void> {
    try {
      const result = Module3PcbiIndependentCalculator.runIndependentRecalculation();
      res.json({ success: true, ...result });
    } catch (err: unknown) {
      logger.error('Failed to get PCBI independent audit comparison', {
        error: getErrorMessage(err)
      });
      res.status(500).json({ success: false, message: 'Failed to retrieve independent audit comparison' });
    }
  }

  public async getTestMatrix(req: Request, res: Response): Promise<void> {
    try {
      const targetId = this.resolveAssessmentId(req);
      if (targetId === 'INVALID') {
        res.status(400).json({ success: false, message: 'Invalid or unknown assessment ID. Cross-customer fallback rejected.' });
        return;
      }
      const assessmentId = targetId || 'AIC-2026-0001';
      const tests = Module3PcbiForensicEngine.getTestMatrix(assessmentId);
      res.json({ success: true, tests, totalCount: tests.length });
    } catch (err: unknown) {
      logger.error('Failed to get PCBI test matrix', {
        error: getErrorMessage(err)
      });
      res.status(500).json({ success: false, message: 'Failed to retrieve PCBI test matrix' });
    }
  }

  public async downloadEvidenceWorkbook(_req: Request, res: Response): Promise<void> {
    try {
      const { filePath } = Module3PcbiWorkbookBuilder.buildWorkbook();
      res.download(filePath, 'MODULE_3_PCBI_FORENSIC_EVIDENCE.xlsx');
    } catch (err: unknown) {
      logger.error('Failed to generate Module 3 evidence workbook', {
        error: getErrorMessage(err)
      });
      res.status(500).json({ success: false, message: 'Failed to generate evidence workbook' });
    }
  }

  public async getBenchmarkRequirements(req: Request, res: Response): Promise<void> {
    try {
      const targetId = this.resolveAssessmentId(req);
      if (targetId === 'INVALID' || !targetId) {
        res.status(400).json({ success: false, message: 'Valid assessment ID is required.' });
        return;
      }
      const requirements = Module3PcbiMappingService.getRequirementsCatalog(targetId);
      res.json({ success: true, assessmentId: targetId, count: requirements.length, requirements });
    } catch (err: unknown) {
      logger.error('Failed to get benchmark requirements', { error: getErrorMessage(err) });
      res.status(500).json({ success: false, message: 'Failed to retrieve benchmark requirements' });
    }
  }

  public async getMaterialMappings(req: Request, res: Response): Promise<void> {
    try {
      const targetId = this.resolveAssessmentId(req);
      if (targetId === 'INVALID' || !targetId) {
        res.status(400).json({ success: false, message: 'Valid assessment ID is required.' });
        return;
      }
      const mappings = Module3PcbiMappingService.getMappings(targetId);
      res.json({ success: true, assessmentId: targetId, count: mappings.length, mappings });
    } catch (err: unknown) {
      logger.error('Failed to get material mappings', { error: getErrorMessage(err) });
      res.status(500).json({ success: false, message: 'Failed to retrieve material mappings' });
    }
  }

  public async updateMappingApproval(req: Request, res: Response): Promise<void> {
    try {
      const { mappingId, approvalStatus, actor, comment } = req.body || {};
      if (!mappingId || (approvalStatus !== 'APPROVED' && approvalStatus !== 'REJECTED')) {
        res.status(400).json({ success: false, message: 'Invalid mapping approval payload.' });
        return;
      }
      const updated = Module3PcbiMappingService.updateMappingApproval(
        mappingId,
        approvalStatus,
        actor || 'Procurement Admin',
        comment || 'Manual review decision'
      );
      res.json({ success: true, mapping: updated });
    } catch (err: unknown) {
      logger.error('Failed to update mapping approval', { error: getErrorMessage(err) });
      res.status(500).json({ success: false, message: 'Failed to update mapping approval' });
    }
  }

  public async getCoverageSummary(req: Request, res: Response): Promise<void> {
    try {
      const targetId = this.resolveAssessmentId(req);
      if (targetId === 'INVALID' || !targetId) {
        res.status(400).json({ success: false, message: 'Valid assessment ID is required.' });
        return;
      }
      const summary = Module3PcbiMappingService.getCoverageSummary(targetId);
      res.json({ success: true, summary });
    } catch (err: unknown) {
      logger.error('Failed to get benchmark coverage summary', { error: getErrorMessage(err) });
      res.status(500).json({ success: false, message: 'Failed to retrieve coverage summary' });
    }
  }
}

export const module3CanonicalController = new Module3CanonicalController();
