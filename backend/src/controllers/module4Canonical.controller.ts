/**
 * Module 4 Savings Canonical Controller
 * Exposes authoritative audit endpoints, canonical opportunity ledger, and evidence downloads.
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
  public async getAuditReport(_req: Request, res: Response): Promise<void> {
    try {
      const report = Module4SavingsForensicEngine.getCertificationReport();
      res.json({ success: true, report });
    } catch (err: unknown) {
      logger.error('Failed to get Module 4 certification report', { error: getErrorMessage(err) });
      res.status(500).json({ success: false, message: 'Failed to retrieve savings audit report' });
    }
  }

  public async getOpportunityLedger(_req: Request, res: Response): Promise<void> {
    try {
      const opportunities = Module4SavingsForensicEngine.getCanonicalOpportunityLedger();
      const bridge = Module4SavingsForensicEngine.getFinancialBridge();
      res.json({ success: true, opportunities, bridge });
    } catch (err: unknown) {
      logger.error('Failed to get Module 4 opportunity ledger', { error: getErrorMessage(err) });
      res.status(500).json({ success: false, message: 'Failed to retrieve opportunity ledger' });
    }
  }

  public async getFinancialBridge(_req: Request, res: Response): Promise<void> {
    try {
      const bridge = Module4SavingsForensicEngine.getFinancialBridge();
      res.json({ success: true, bridge });
    } catch (err: unknown) {
      logger.error('Failed to get Module 4 financial bridge', { error: getErrorMessage(err) });
      res.status(500).json({ success: false, message: 'Failed to retrieve financial bridge' });
    }
  }

  public async getIndependentAudit(_req: Request, res: Response): Promise<void> {
    try {
      const result = Module4SavingsIndependentCalculator.runIndependentRecalculation();
      res.json({ success: true, ...result });
    } catch (err: unknown) {
      logger.error('Failed to get Module 4 independent audit', { error: getErrorMessage(err) });
      res.status(500).json({ success: false, message: 'Failed to retrieve independent audit comparison' });
    }
  }

  public async getTestMatrix(_req: Request, res: Response): Promise<void> {
    try {
      const tests = Module4SavingsForensicEngine.getTestMatrix();
      res.json({ success: true, tests, totalCount: tests.length });
    } catch (err: unknown) {
      logger.error('Failed to get Module 4 test matrix', { error: getErrorMessage(err) });
      res.status(500).json({ success: false, message: 'Failed to retrieve test matrix' });
    }
  }

  public async downloadEvidenceWorkbook(_req: Request, res: Response): Promise<void> {
    try {
      const { filePath } = Module4SavingsWorkbookBuilder.buildWorkbook();
      res.download(filePath, MODULE_4_WORKBOOK_FILENAME);
    } catch (err: unknown) {
      logger.error('Failed to generate Module 4 evidence workbook', { error: getErrorMessage(err) });
      res.status(500).json({ success: false, message: 'Failed to generate evidence workbook' });
    }
  }

  public async getTransactionLineage(req: Request, res: Response): Promise<void> {
    try {
      const lineage = Module4SavingsForensicEngine.getCompleteTransactionLineage();
      const metrics = Module4SavingsForensicEngine.getLineageCoverageMetrics();
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

  public async getTransactionLineageTests(_req: Request, res: Response): Promise<void> {
    try {
      const tests = Module4SavingsForensicEngine.getTransactionLineageTestMatrix();
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

  public async getLineageSetReconciliation(_req: Request, res: Response): Promise<void> {
    try {
      const summary = Module4SavingsForensicEngine.getLineageSetReconciliation();
      res.json({
        success: true,
        summary
      });
    } catch (err: unknown) {
      logger.error('Failed to get lineage set reconciliation', { error: getErrorMessage(err) });
      res.status(500).json({ success: false, message: 'Failed to retrieve lineage set reconciliation' });
    }
  }

  public async getLineageContradictionTests(_req: Request, res: Response): Promise<void> {
    try {
      const tests = Module4SavingsForensicEngine.getLineageContradictionTests();
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
