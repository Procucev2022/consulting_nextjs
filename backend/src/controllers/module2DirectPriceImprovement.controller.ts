/**
 * Module 2 — Lever 1: Direct Price Improvement Controller
 * Compliant with Rule 4, 10, 11, max 300 lines, cyclomatic complexity <= 10
 */

import type { Request, Response } from 'express';
import logger from '../utils/logger';
import { Module2DirectPriceImprovementEngine } from '../services/module2DirectPriceImprovementEngine';
import { Module2ExcelExportService } from '../services/module2ExcelExportService';

export const getDirectPriceImprovement = async (req: Request, res: Response): Promise<Response | void> => {
  const reqId = (req.headers['x-request-id'] as string) || `REQ-${Date.now()}`;
  try {
    const assessmentId = (req.query.assessmentId as string)?.trim();
    if (!assessmentId) {
      logger.warn('Direct price improvement requested without assessmentId', { reqId });
      return res.status(400).json({
        success: false,
        message: 'Assessment identifier (assessmentId) is required to calculate Lever 1 Direct Price Improvement',
        category: 'VALIDATION_ERROR'
      });
    }

    const financialYear = (req.query.financialYear as string)?.trim();
    const materialCode = (req.query.materialCode as string)?.trim();
    const category = (req.query.category as string)?.trim();

    logger.info('Calculating Direct Price Improvement (Lever 1)', {
      reqId,
      assessmentId,
      financialYear,
      materialCode,
      category
    });

    const result = await Module2DirectPriceImprovementEngine.calculate(assessmentId, {
      financialYear: financialYear || undefined,
      materialCode: materialCode || undefined,
      category: category || undefined
    });

    return res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Internal calculation error';
    logger.error('Failed to calculate Direct Price Improvement', { reqId }, error);

    if (errMessage.includes('not found') || errMessage.includes('was not found')) {
      return res.status(404).json({
        success: false,
        message: errMessage,
        category: 'NOT_FOUND_ERROR'
      });
    }

    return res.status(500).json({
      success: false,
      message: errMessage,
      category: 'SERVER_ERROR'
    });
  }
};

export const exportDirectPriceExcel = async (req: Request, res: Response): Promise<Response | void> => {
  const reqId = (req.headers['x-request-id'] as string) || `REQ-${Date.now()}`;
  try {
    const assessmentId = (req.query.assessmentId as string)?.trim();
    if (!assessmentId) {
      logger.warn('Direct price excel export requested without assessmentId', { reqId });
      return res.status(400).json({
        success: false,
        message: 'Assessment identifier (assessmentId) is required to export Lever 1 Direct Price Improvement',
        category: 'VALIDATION_ERROR'
      });
    }

    const financialYear = (req.query.financialYear as string)?.trim();
    const { buffer, fileName } = await Module2ExcelExportService.generateDirectPriceWorkbookBuffer(
      assessmentId,
      financialYear || undefined
    );

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.send(buffer);
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Internal export error';
    logger.error('Failed to export Direct Price Excel', { reqId }, error);
    return res.status(500).json({
      success: false,
      message: errMessage,
      category: 'SERVER_ERROR'
    });
  }
};

