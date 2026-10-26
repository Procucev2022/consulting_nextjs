/**
 * Module 2 — Lever 6: Category Specialisation Controller
 * Compliant with Rule 4, 8, 9, max 300 lines, cyclomatic complexity <= 10
 */

import type { Request, Response } from 'express';
import logger from '../utils/logger';
import { Module2CategorySpecialisationEngine } from '../services/module2CategorySpecialisationEngine';
import { Module2CategorySpecialisationExcelBuilder } from '../services/module2CategorySpecialisationExcelBuilder';

export class Module2CategorySpecialisationController {
  /**
   * GET /api/module2/sourcing/category-specialisation
   * Retrieves Lever 6 Category Specialisation results.
   */
  public static async getCategorySpecialisation(req: Request, res: Response): Promise<void> {
    const assessmentId = String(req.query.assessmentId || 'AIC-2026-0002').trim();
    logger.info('Handling GET /category-specialisation request', { assessmentId });

    try {
      const result = Module2CategorySpecialisationEngine.calculate(assessmentId);

      res.status(200).json({
        success: true,
        message: 'Category Specialisation analysis retrieved successfully',
        data: result
      });
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to calculate Category Specialisation', {
        assessmentId,
        error: err.message,
        stack: err.stack
      });
      res.status(500).json({
        success: false,
        message: 'Internal server error while executing Category Specialisation analysis',
        error: err.message
      });
    }
  }

  /**
   * GET /api/module2/sourcing/category-specialisation/export-excel
   * Downloads authoritative 8-sheet Excel workbook.
   */
  public static async exportExcel(req: Request, res: Response): Promise<void> {
    const assessmentId = String(req.query.assessmentId || 'AIC-2026-0002').trim();
    logger.info('Handling GET /category-specialisation/export-excel request', { assessmentId });

    try {
      const result = Module2CategorySpecialisationEngine.calculate(assessmentId);
      const buffer = Module2CategorySpecialisationExcelBuilder.buildWorkbook(result);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="Category_Specialisation_${assessmentId}.xlsx"`);
      res.status(200).send(buffer);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to export Category Specialisation Excel workbook', {
        assessmentId,
        error: err.message,
        stack: err.stack
      });
      res.status(500).json({
        success: false,
        message: 'Internal server error while exporting Category Specialisation Excel workbook',
        error: err.message
      });
    }
  }
}
