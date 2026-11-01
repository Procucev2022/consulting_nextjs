/**
 * Module 4 Savings Canonical Controller
 * Exposes authoritative audit endpoints, canonical opportunity ledger, and evidence downloads.
 * Conforms to Rule 8 (constants isolation), Rule 9 (types isolation), max file length <= 300 lines.
 */

import type { Request, Response } from 'express';
import { Module4SavingsForensicEngine } from '../services/module4SavingsForensicEngine';
import { Module4SavingsIndependentCalculator } from '../services/module4SavingsIndependentCalculator';
import { Module4SavingsWorkbookBuilder } from '../services/module4SavingsWorkbookBuilder';
import { MODULE_4_WORKBOOK_FILENAME } from '../constants/module4SavingsForensic';
import { logger } from '../utils/logger';

export function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export class Module4CanonicalController {
  private resolveAssessmentId(req: Request): string | null {
    const raw = (req.query?.assessmentId as string) ||
      (req.headers?.['x-assessment-id'] as string) ||
      (req.body?.assessmentId as string);
    return raw ? String(raw).trim() : null;
  }

  private isAssessmentStaged(assessmentId: string): boolean {
    return assessmentId !== 'AIC-2026-0001' && assessmentId !== 'AIC-2026-0002';
  }

  private handleStaged(res: Response, assessmentId: string, extra?: Record<string, unknown>): boolean {
    if (this.isAssessmentStaged(assessmentId)) {
      res.json({
        success: true,
        assessmentId,
        status: 'STAGED_NOT_ACTIVATED',
        message: `Module 4 is staged and not yet activated for ${assessmentId}. Controlled remediation in progress.`,
        ...extra
      });
      return true;
    }
    return false;
  }

  public async getAuditReport(req: Request, res: Response): Promise<void> {
    try {
      const assessmentId = this.resolveAssessmentId(req);
      if (!assessmentId) {
        res.status(400).json({ success: false, message: 'Assessment ID is required for Module 4 canonical operations' });
        return;
      }
      if (this.handleStaged(res, assessmentId, { report: null })) return;

      const report = Module4SavingsForensicEngine.getCertificationReport('PENDING_WORKBOOK_BUILD', assessmentId);
      res.json({ success: true, report });
    } catch (err: unknown) {
      logger.error('Failed to get Module 4 certification report', { error: getErrorMessage(err) });
      res.status(500).json({ success: false, message: 'Failed to retrieve savings audit report' });
    }
  }

  public async getOpportunityLedger(req: Request, res: Response): Promise<void> {
    try {
      const assessmentId = this.resolveAssessmentId(req);
      if (!assessmentId) {
        res.status(400).json({ success: false, message: 'Assessment ID is required for Module 4 canonical operations' });
        return;
      }
      if (this.handleStaged(res, assessmentId, { opportunities: [], bridge: null })) return;

      const opportunities = Module4SavingsForensicEngine.getCanonicalOpportunityLedger(assessmentId);
      const bridge = Module4SavingsForensicEngine.getFinancialBridge(assessmentId);
      res.json({ success: true, opportunities, bridge });
    } catch (err: unknown) {
      logger.error('Failed to get Module 4 opportunity ledger', { error: getErrorMessage(err) });
      res.status(500).json({ success: false, message: 'Failed to retrieve opportunity ledger' });
    }
  }

  public async getFinancialBridge(req: Request, res: Response): Promise<void> {
    try {
      const assessmentId = this.resolveAssessmentId(req);
      if (!assessmentId) {
        res.status(400).json({ success: false, message: 'Assessment ID is required for Module 4 canonical operations' });
        return;
      }
      if (this.handleStaged(res, assessmentId, { bridge: null })) return;

      const bridge = Module4SavingsForensicEngine.getFinancialBridge(assessmentId);
      res.json({ success: true, bridge });
    } catch (err: unknown) {
      logger.error('Failed to get Module 4 financial bridge', { error: getErrorMessage(err) });
      res.status(500).json({ success: false, message: 'Failed to retrieve financial bridge' });
    }
  }

  public async getIndependentAudit(req: Request, res: Response): Promise<void> {
    try {
      const assessmentId = this.resolveAssessmentId(req);
      if (!assessmentId) {
        res.status(400).json({ success: false, message: 'Assessment ID is required for Module 4 canonical operations' });
        return;
      }
      if (this.handleStaged(res, assessmentId)) return;

      const result = Module4SavingsIndependentCalculator.runIndependentRecalculation(assessmentId);
      res.json({ success: true, ...result });
    } catch (err: unknown) {
      logger.error('Failed to get Module 4 independent audit', { error: getErrorMessage(err) });
      res.status(500).json({ success: false, message: 'Failed to retrieve independent audit comparison' });
    }
  }

  public async getTestMatrix(req: Request, res: Response): Promise<void> {
    try {
      const assessmentId = this.resolveAssessmentId(req);
      if (!assessmentId) {
        res.status(400).json({ success: false, message: 'Assessment ID is required for Module 4 canonical operations' });
        return;
      }
      if (this.handleStaged(res, assessmentId, { tests: [], totalCount: 0 })) return;

      const tests = Module4SavingsForensicEngine.getTestMatrix('PENDING_WORKBOOK_BUILD', assessmentId);
      res.json({ success: true, tests, totalCount: tests.length });
    } catch (err: unknown) {
      logger.error('Failed to get Module 4 test matrix', { error: getErrorMessage(err) });
      res.status(500).json({ success: false, message: 'Failed to retrieve test matrix' });
    }
  }

  public async downloadEvidenceWorkbook(req: Request, res: Response): Promise<void> {
    try {
      const assessmentId = this.resolveAssessmentId(req);
      if (!assessmentId) {
        res.status(400).json({ success: false, message: 'Assessment ID is required for Module 4 evidence workbook' });
        return;
      }
      if (this.isAssessmentStaged(assessmentId)) {
        res.status(400).json({
          success: false,
          message: `Module 4 evidence workbook cannot be generated for ${assessmentId} while Module 4 is not activated.`
        });
        return;
      }
      const { filePath } = Module4SavingsWorkbookBuilder.buildWorkbook(undefined, assessmentId);
      res.download(filePath, MODULE_4_WORKBOOK_FILENAME);
    } catch (err: unknown) {
      logger.error('Failed to generate Module 4 evidence workbook', { error: getErrorMessage(err) });
      res.status(500).json({ success: false, message: 'Failed to generate evidence workbook' });
    }
  }

  public async getTransactionLineage(req: Request, res: Response): Promise<void> {
    try {
      const assessmentId = this.resolveAssessmentId(req);
      if (!assessmentId) {
        res.status(400).json({ success: false, message: 'Assessment ID is required for transaction lineage' });
        return;
      }
      if (this.handleStaged(res, assessmentId, { totalCount: 0, lineage: [] })) return;

      const lineage = Module4SavingsForensicEngine.getCompleteTransactionLineage(assessmentId);
      const metrics = Module4SavingsForensicEngine.getLineageCoverageMetrics(assessmentId);
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 100;
      const offset = req.query.offset ? parseInt(String(req.query.offset), 10) : 0;
      const all = req.query.all === 'true';

      const returnedRows = all ? lineage : lineage.slice(offset, offset + limit);

      res.json({
        success: true,
        totalCount: lineage.length,
        metrics,
        lineage: returnedRows
      });
    } catch (err: unknown) {
      logger.error('Failed to get transaction lineage', { error: getErrorMessage(err) });
      res.status(500).json({ success: false, message: 'Failed to retrieve transaction lineage' });
    }
  }

  public async getTransactionLineageTests(req: Request, res: Response): Promise<void> {
    try {
      const assessmentId = this.resolveAssessmentId(req);
      if (!assessmentId) {
        res.status(400).json({ success: false, message: 'Assessment ID is required for transaction lineage tests' });
        return;
      }
      if (this.handleStaged(res, assessmentId, { tests: [], totalCount: 0, passedCount: 0 })) return;

      const tests = Module4SavingsForensicEngine.getTransactionLineageTestMatrix(assessmentId);
      const passed = tests.filter((t) => t.status === 'PASSED').length;
      res.json({
        success: true,
        tests,
        totalCount: tests.length,
        passedCount: passed
      });
    } catch (err: unknown) {
      logger.error('Failed to get transaction lineage test matrix', { error: getErrorMessage(err) });
      res.status(500).json({ success: false, message: 'Failed to retrieve lineage test matrix' });
    }
  }

  public async getLineageSetReconciliation(req: Request, res: Response): Promise<void> {
    try {
      const assessmentId = this.resolveAssessmentId(req);
      if (!assessmentId) {
        res.status(400).json({ success: false, message: 'Assessment ID is required for lineage set reconciliation' });
        return;
      }
      if (this.handleStaged(res, assessmentId)) return;

      const summary = Module4SavingsForensicEngine.getLineageSetReconciliation(assessmentId);
      res.json({
        success: true,
        summary
      });
    } catch (err: unknown) {
      logger.error('Failed to get lineage set reconciliation', { error: getErrorMessage(err) });
      res.status(500).json({ success: false, message: 'Failed to retrieve lineage set reconciliation' });
    }
  }

  public async getLineageContradictionTests(req: Request, res: Response): Promise<void> {
    try {
      const assessmentId = this.resolveAssessmentId(req);
      if (!assessmentId) {
        res.status(400).json({ success: false, message: 'Assessment ID is required for lineage contradiction tests' });
        return;
      }
      if (this.handleStaged(res, assessmentId, { tests: [], totalCount: 0, passedCount: 0 })) return;

      const tests = Module4SavingsForensicEngine.getLineageContradictionTests(assessmentId);
      const passed = tests.filter((t) => t.status === 'PASSED').length;
      res.json({
        success: true,
        tests,
        totalCount: tests.length,
        passedCount: passed
      });
    } catch (err: unknown) {
      logger.error('Failed to get lineage contradiction tests', { error: getErrorMessage(err) });
      res.status(500).json({ success: false, message: 'Failed to retrieve contradiction tests' });
    }
  }
}

export const module4CanonicalController = new Module4CanonicalController();
