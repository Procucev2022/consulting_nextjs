/**
 * Module 2 — Lever 5: Payment Terms Optimisation Controller
 * Compliant with Rule 4, 8, 9, max 300 lines, cyclomatic complexity <= 10
 */

import type { Request, Response } from 'express';
import logger from '../utils/logger';
import { Module2PaymentTermsEngine } from '../services/module2PaymentTermsEngine';
import { Module2PaymentTermsExcelBuilder } from '../services/module2PaymentTermsExcelBuilder';

export class Module2PaymentTermsController {
  /**
   * GET /api/module2/sourcing/payment-terms
   * Retrieves Lever 5 Payment Terms Optimisation results.
   */
  public static async getPaymentTerms(req: Request, res: Response): Promise<void> {
    const assessmentId = String(req.query.assessmentId || 'AIC-2026-0002').trim();
    logger.info('Handling GET /payment-terms request', { assessmentId });

    try {
      const customRate = req.query.customFinancingRate
        ? parseFloat(String(req.query.customFinancingRate))
        : undefined;
      const targetDays = req.query.targetCreditDays
        ? parseInt(String(req.query.targetCreditDays), 10)
        : undefined;

      const result = Module2PaymentTermsEngine.calculate(assessmentId, {
        customFinancingRatePer30Days: customRate,
        targetCreditDaysScenario: targetDays
      });

      res.status(200).json({
        success: true,
        message: 'Payment Terms analysis retrieved successfully',
        data: result
      });
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to calculate Payment Terms Optimisation', {
        assessmentId,
        error: err.message,
        stack: err.stack
      });
      res.status(500).json({
        success: false,
        message: 'Internal server error while executing Payment Terms analysis',
        error: err.message
      });
    }
  }

  /**
   * GET /api/module2/sourcing/payment-terms/export-excel
   * Downloads authoritative 8-sheet Excel workbook.
   */
  public static async exportExcel(req: Request, res: Response): Promise<void> {
    const assessmentId = String(req.query.assessmentId || 'AIC-2026-0002').trim();
    logger.info('Handling GET /payment-terms/export-excel request', { assessmentId });

    try {
      const result = Module2PaymentTermsEngine.calculate(assessmentId);
      const buffer = Module2PaymentTermsExcelBuilder.buildWorkbook(result);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="Payment_Terms_${assessmentId}.xlsx"`);
      res.status(200).send(buffer);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to export Payment Terms Excel workbook', {
        assessmentId,
        error: err.message,
        stack: err.stack
      });
      res.status(500).json({
        success: false,
        message: 'Internal server error while exporting Payment Terms Excel',
        error: err.message
      });
    }
  }
}
