/**
 * Module 2 — Lever 3: Vendor Base Consolidation Controller
 * Compliant with Rule 4, 10, 11, max 300 lines, cyclomatic complexity <= 10
 */

import type { Request, Response } from 'express';
import logger from '../utils/logger';
import { Module2VendorConsolidationEngine } from '../services/module2VendorConsolidationEngine';
import { Module2ExcelExportService } from '../services/module2ExcelExportService';
import { Module2MaterialMappingRegister } from '../services/module2MaterialMappingRegister';
import type { ConsolidationOpportunityStatus } from '../types/module2VendorConsolidation';

export const getVendorConsolidation = async (req: Request, res: Response): Promise<Response | void> => {
  const reqId = (req.headers?.['x-request-id'] as string) || `REQ-${Date.now()}`;

  try {
    const assessmentId = (req.query.assessmentId as string)?.trim();
    if (!assessmentId) {
      logger.warn('Vendor consolidation analysis requested without assessmentId', { reqId });
      return res.status(400).json({
        success: false,
        message: 'Assessment identifier (assessmentId) is required to evaluate Lever 3 Vendor Base Consolidation',
        category: 'VALIDATION_ERROR'
      });
    }

    const category = (req.query.category as string)?.trim();
    const status = (req.query.status as string)?.trim() as ConsolidationOpportunityStatus;
    const materialCode = (req.query.materialCode as string)?.trim();

    logger.info('Evaluating Vendor Base Consolidation (Lever 3)', {
      reqId,
      assessmentId,
      category,
      status,
      materialCode
    });

    const result = await Module2VendorConsolidationEngine.calculate(assessmentId, {
      category: category || undefined,
      status: status || undefined,
      materialCode: materialCode || undefined
    });

    return res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Internal evaluation error';
    logger.error('Failed to evaluate Vendor Base Consolidation', { reqId }, error);

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

export const exportVendorConsolidationExcel = async (req: Request, res: Response): Promise<Response | void> => {
  const reqId = (req.headers?.['x-request-id'] as string) || `REQ-${Date.now()}`;

  try {
    const assessmentId = (req.query.assessmentId as string)?.trim();
    if (!assessmentId) {
      logger.warn('Vendor consolidation excel export requested without assessmentId', { reqId });
      return res.status(400).json({
        success: false,
        message: 'Assessment identifier (assessmentId) is required to export Lever 3 Vendor Base Consolidation',
        category: 'VALIDATION_ERROR'
      });
    }

    const category = (req.query.category as string)?.trim();
    const { buffer, fileName } = await Module2ExcelExportService.generateVendorConsolidationWorkbookBuffer(
      assessmentId,
      { category: category || undefined }
    );

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.send(buffer);
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Internal export error';
    logger.error('Failed to export Vendor Base Consolidation Excel', { reqId }, error);
    return res.status(500).json({
      success: false,
      message: errMessage,
      category: 'SERVER_ERROR'
    });
  }
};

export const updateMaterialMapping = async (req: Request, res: Response): Promise<Response | void> => {
  const reqId = (req.headers?.['x-request-id'] as string) || `REQ-${Date.now()}`;
  try {
    const { sourceMaterialId, unspscCode, reviewStatus, reviewedBy, auditNotes } = req.body || {};
    if (!sourceMaterialId || !unspscCode || !reviewStatus) {
      return res.status(400).json({
        success: false,
        message: 'sourceMaterialId, unspscCode, and reviewStatus are required',
        category: 'VALIDATION_ERROR'
      });
    }

    const updated = Module2MaterialMappingRegister.updateMapping({
      sourceMaterialId,
      unspscCode,
      reviewStatus,
      reviewedBy: reviewedBy || 'Engineering Reviewer',
      auditNotes
    });

    return res.json({
      success: true,
      data: updated,
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Failed to update mapping';
    logger.error('Failed to update material mapping', { reqId }, error);
    return res.status(500).json({
      success: false,
      message: errMessage,
      category: 'SERVER_ERROR'
    });
  }
};
