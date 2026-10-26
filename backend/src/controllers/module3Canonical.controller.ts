/**
 * Module 3 PCBI Canonical Controller
 * Exposes authoritative audit endpoints, reconciliation metrics, and evidence workbook downloads.
 */

import type { Request, Response } from 'express';
import { Module3PcbiForensicEngine } from '../services/module3PcbiForensicEngine';
import { Module3PcbiIndependentCalculator } from '../services/module3PcbiIndependentCalculator';
import { Module3PcbiWorkbookBuilder } from '../services/module3PcbiWorkbookBuilder';
import { logger } from '../utils/logger';

export function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export class Module3CanonicalController {
  public async getAuditReport(_req: Request, res: Response): Promise<void> {
    try {
      const report = Module3PcbiForensicEngine.getCertificationReport();
      res.json({ success: true, report });
    } catch (err: unknown) {
      logger.error('Failed to get Module 3 PCBI certification report', {
        error: getErrorMessage(err)
      });
      res.status(500).json({ success: false, message: 'Failed to retrieve PCBI audit report' });
    }
  }

  public async getSpendReconciliation(_req: Request, res: Response): Promise<void> {
    try {
      const { reconciliation, priceGap } = Module3PcbiForensicEngine.processCustomerLedger();
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

  public async getTestMatrix(_req: Request, res: Response): Promise<void> {
    try {
      const tests = Module3PcbiForensicEngine.getTestMatrix();
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
}

export const module3CanonicalController = new Module3CanonicalController();
