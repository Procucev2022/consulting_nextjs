/**
 * Module 2 — Lever 4: Volume Aggregation Controller
 * Compliant with Rule 4, 8, 9, max 300 lines, cyclomatic complexity <= 10
 */

import type { Request, Response } from 'express';
import logger from '../utils/logger';
import { Module2VolumeAggregationEngine } from '../services/module2VolumeAggregationEngine';
import { Module2VolumeAggregationExcelBuilder } from '../services/module2VolumeAggregationExcelBuilder';

export class Module2VolumeAggregationController {
  /**
   * GET /api/module2/sourcing/volume-aggregation
   * Retrieves Lever 4 Volume Aggregation calculation results.
   */
  public static async getVolumeAggregation(req: Request, res: Response): Promise<void> {
    const assessmentId = String(req.query.assessmentId || 'AIC-2026-0002').trim();
    logger.info('Handling GET /volume-aggregation request', { assessmentId });

    try {
      const result = Module2VolumeAggregationEngine.calculate(assessmentId);
      res.status(200).json({
        success: true,
        message: 'Volume Aggregation analysis retrieved successfully',
        data: result
      });
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to calculate Volume Aggregation', {
        assessmentId,
        error: err.message,
        stack: err.stack
      });
      res.status(500).json({
        success: false,
        message: 'Internal server error while executing Volume Aggregation analysis',
        error: err.message
      });
    }
  }

  /**
   * GET /api/module2/sourcing/volume-aggregation/export-excel
   * Downloads authoritative 8-sheet Excel workbook.
   */
  public static async exportExcel(req: Request, res: Response): Promise<void> {
    const assessmentId = String(req.query.assessmentId || 'AIC-2026-0002').trim();
    logger.info('Handling GET /volume-aggregation/export-excel request', { assessmentId });

    try {
      const result = Module2VolumeAggregationEngine.calculate(assessmentId);
      const buffer = Module2VolumeAggregationExcelBuilder.buildWorkbook(result);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="Volume_Aggregation_${assessmentId}.xlsx"`);
      res.status(200).send(buffer);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to export Volume Aggregation Excel workbook', {
        assessmentId,
        error: err.message,
        stack: err.stack
      });
      res.status(500).json({
        success: false,
        message: 'Failed to generate Volume Aggregation Excel workbook',
        error: err.message
      });
    }
  }
}
