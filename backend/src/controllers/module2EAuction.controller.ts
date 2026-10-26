/**
 * Module 2 — Lever 2: E-Auction / Dynamic Bidding Controller
 * Compliant with Rule 4, 10, 11, max 300 lines, cyclomatic complexity <= 10
 */

import type { Request, Response } from 'express';
import logger from '../utils/logger';
import { Module2EAuctionEngine } from '../services/module2EAuctionEngine';
import { Module2ExcelExportService } from '../services/module2ExcelExportService';
import { Module2EAuctionAssumptionStore } from '../services/module2EAuctionAssumptionStore';
import type { AuctionSuitabilityClassification } from '../types/module2EAuction';

export const getEAuctionDynamicBidding = async (req: Request, res: Response): Promise<Response | void> => {
  const reqId = (req.headers['x-request-id'] as string) || `REQ-${Date.now()}`;
  try {
    const assessmentId = (req.query.assessmentId as string)?.trim();
    if (!assessmentId) {
      logger.warn('E-auction analysis requested without assessmentId', { reqId });
      return res.status(400).json({
        success: false,
        message: 'Assessment identifier (assessmentId) is required to evaluate Lever 2 E-Auction Dynamic Bidding',
        category: 'VALIDATION_ERROR'
      });
    }

    const financialYear = (req.query.financialYear as string)?.trim();
    const category = (req.query.category as string)?.trim();
    const suitability = (req.query.suitability as string)?.trim() as AuctionSuitabilityClassification;
    const materialCode = (req.query.materialCode as string)?.trim();

    logger.info('Evaluating E-Auction Dynamic Bidding Candidates (Lever 2)', {
      reqId,
      assessmentId,
      financialYear,
      category,
      suitability,
      materialCode
    });

    const result = await Module2EAuctionEngine.calculate(assessmentId, {
      financialYear: financialYear || undefined,
      category: category || undefined,
      suitability: suitability || undefined,
      materialCode: materialCode || undefined
    });

    return res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Internal evaluation error';
    logger.error('Failed to evaluate E-Auction Dynamic Bidding', { reqId }, error);

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

export const exportEAuctionExcel = async (req: Request, res: Response): Promise<Response | void> => {
  const reqId = (req.headers['x-request-id'] as string) || `REQ-${Date.now()}`;
  try {
    const assessmentId = (req.query.assessmentId as string)?.trim();
    if (!assessmentId) {
      logger.warn('E-auction excel export requested without assessmentId', { reqId });
      return res.status(400).json({
        success: false,
        message: 'Assessment identifier (assessmentId) is required to export Lever 2 E-Auction candidates',
        category: 'VALIDATION_ERROR'
      });
    }

    const financialYear = (req.query.financialYear as string)?.trim();
    const { buffer, fileName } = await Module2ExcelExportService.generateEAuctionWorkbookBuffer(
      assessmentId,
      financialYear || undefined
    );

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.send(buffer);
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Internal export error';
    logger.error('Failed to export E-Auction Excel', { reqId }, error);
    return res.status(500).json({
      success: false,
      message: errMessage,
      category: 'SERVER_ERROR'
    });
  }
};

export const saveEAuctionPlanningAssumption = async (req: Request, res: Response): Promise<Response | void> => {
  const reqId = (req.headers['x-request-id'] as string) || `REQ-${Date.now()}`;
  try {
    const { assessmentId, assumption } = req.body;
    if (!assessmentId || !assumption) {
      logger.warn('Save assumption called with missing payload', { reqId });
      return res.status(400).json({
        success: false,
        message: 'Assessment ID and planning assumption payload are required',
        category: 'VALIDATION_ERROR'
      });
    }

    if (
      assumption.minSavingsRate > assumption.expectedSavingsRate ||
      assumption.expectedSavingsRate > assumption.maxSavingsRate
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid savings rates: minSavingsRate <= expectedSavingsRate <= maxSavingsRate is required',
        category: 'VALIDATION_ERROR'
      });
    }

    const updated = Module2EAuctionAssumptionStore.saveAssumption(assessmentId, assumption);
    logger.info('E-Auction planning assumption successfully configured and saved', {
      reqId,
      assessmentId,
      assumptionId: assumption.id
    });

    return res.json({
      success: true,
      data: updated,
      message: 'Planning assumption saved successfully'
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Internal error';
    logger.error('Failed to save E-Auction planning assumption', { reqId }, error);
    return res.status(500).json({
      success: false,
      message: errMessage,
      category: 'SERVER_ERROR'
    });
  }
};
