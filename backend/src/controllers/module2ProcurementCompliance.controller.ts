/**
 * Module 2 — Lever 9: Procurement Compliance & Control Controller
 * Endpoints for Retrieval, Review Recording & Excel Export
 * Hardened Authentication & Authorization (Prompt 466)
 * Compliant with Rule 4, 8, 9, 10, max 300 lines, line length <= 120 chars, complexity <= 10
 */

import type { Request, Response } from 'express';
import logger from '../utils/logger';
import { Module2ProcurementComplianceEngine } from '../services/module2ProcurementComplianceEngine';
import { Module2ProcurementComplianceExcelBuilder } from '../services/module2ProcurementComplianceExcelBuilder';
import { ComplianceAuditStore } from '../services/complianceAuditStore';
import { Module2ComplianceAuth } from '../utils/module2ComplianceAuth';
import {
  procurementComplianceQuerySchema,
  procurementComplianceReviewSchema
} from '../constants/module2ProcurementCompliance';
import type { ComplianceReviewRecord } from '../types/module2ProcurementCompliance';

export class Module2ProcurementComplianceController {
  public static getReviewsForAssessment(assessmentId: string): Record<string, ComplianceReviewRecord[]> {
    return ComplianceAuditStore.getInstance().getReviewsForAssessment(assessmentId);
  }

  public static setReviewForAssessment(
    assessmentId: string,
    record: ComplianceReviewRecord & { candidateId: string }
  ): void {
    ComplianceAuditStore.getInstance().appendReview(assessmentId, record);
  }

  public static clearReviews(): void {
    ComplianceAuditStore.getInstance().clear();
  }

  /**
   * GET /api/module2/sourcing/procurement-compliance
   */
  public static async getProcurementCompliance(req: Request, res: Response): Promise<void> {
    const parseResult = procurementComplianceQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      logger.warn('Procurement Compliance query validation failed', { errors: parseResult.error.issues });
      res.status(400).json({
        success: false,
        message: 'Invalid query parameters for Procurement Compliance analysis',
        errors: parseResult.error.issues
      });
      return;
    }

    const { assessmentId } = parseResult.data;
    const authCheck = Module2ComplianceAuth.resolveAuthContext(req, assessmentId);
    if (!authCheck.authorized) {
      const statusCode = typeof authCheck.statusCode === 'number' ? authCheck.statusCode : 401;
      res.status(statusCode).json({
        success: false,
        message: authCheck.message
      });
      return;
    }

    logger.info('Handling GET /procurement-compliance request', {
      assessmentId,
      userId: authCheck.user?.userId,
      role: authCheck.user?.role
    });

    try {
      const reviews = Module2ProcurementComplianceController.getReviewsForAssessment(assessmentId);
      const result = await Module2ProcurementComplianceEngine.calculateProcurementCompliance(assessmentId, {
        reviews
      });

      res.status(200).json({
        success: true,
        message: 'Procurement Compliance analysis retrieved successfully',
        data: result
      });
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to calculate Procurement Compliance', {
        assessmentId,
        error: err.message,
        stack: err.stack
      });
      res.status(500).json({
        success: false,
        message: 'Internal server error while executing Procurement Compliance analysis',
        error: err.message
      });
    }
  }

  /**
   * POST /api/module2/sourcing/procurement-compliance/review
   */
  public static async submitComplianceReview(req: Request, res: Response): Promise<void> {
    const parseResult = procurementComplianceReviewSchema.safeParse(req.body);
    if (!parseResult.success) {
      logger.warn('Procurement Compliance review validation failed', { errors: parseResult.error.issues });
      res.status(400).json({
        success: false,
        message: 'Invalid payload for Procurement Compliance review',
        errors: parseResult.error.issues
      });
      return;
    }

    const payload = parseResult.data;
    const { assessmentId } = payload;
    const authCheck = Module2ComplianceAuth.resolveAuthContext(req, assessmentId);
    if (!authCheck.authorized || !authCheck.user) {
      const statusCode = typeof authCheck.statusCode === 'number' ? authCheck.statusCode : 401;
      res.status(statusCode).json({
        success: false,
        message: authCheck.message
      });
      return;
    }

    const authenticatedUser = authCheck.user;
    const reviewerRole = authenticatedUser.role;
    const reviewerName = authenticatedUser.email || authenticatedUser.userId;

    logger.info('Handling POST /procurement-compliance/review', {
      assessmentId,
      candidateId: payload.candidateId,
      status: payload.status,
      reviewerName,
      reviewerRole
    });

    try {
      const existingReviews = Module2ProcurementComplianceController.getReviewsForAssessment(assessmentId);
      const currentResult = await Module2ProcurementComplianceEngine.calculateProcurementCompliance(assessmentId, {
        reviews: existingReviews
      });
      const targetEx = currentResult.exceptions.find((x) => x.exceptionId === payload.candidateId);

      if (!targetEx) {
        res.status(404).json({
          success: false,
          message: `Compliance exception ${payload.candidateId} not found in assessment ${assessmentId}`
        });
        return;
      }

      const reviewRecord: ComplianceReviewRecord & { candidateId: string } = {
        candidateId: payload.candidateId,
        exceptionId: payload.candidateId,
        reviewId: `REV-CMP-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        reviewerName,
        reviewerRole,
        reviewDate: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString(),
        previousStatus: targetEx.reviewStatus,
        status: payload.status,
        decision: payload.status === 'NOT_AN_EXCEPTION' ? 'DISMISS_EXCEPTION' : 'VERIFY_EXCEPTION',
        technicalJustification: payload.technicalJustification,
        correctiveActionPlan: payload.correctiveActionPlan,
        dismissalReason: payload.dismissalReason,
        supportingReferences: targetEx.supportingTransactions.map((t) => t.poNumber).filter(Boolean)
      };

      Module2ProcurementComplianceController.setReviewForAssessment(assessmentId, reviewRecord);
      const updatedReviews = Module2ProcurementComplianceController.getReviewsForAssessment(assessmentId);
      const result = await Module2ProcurementComplianceEngine.calculateProcurementCompliance(assessmentId, {
        reviews: updatedReviews
      });

      res.status(200).json({
        success: true,
        message: 'Compliance review recorded successfully',
        data: result
      });
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to record compliance review', {
        assessmentId,
        error: err.message,
        stack: err.stack
      });
      res.status(500).json({
        success: false,
        message: 'Internal server error while recording compliance review',
        error: err.message
      });
    }
  }

  /**
   * GET /api/module2/sourcing/procurement-compliance/export-excel
   */
  public static async exportExcel(req: Request, res: Response): Promise<void> {
    const parseResult = procurementComplianceQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid query parameters for Procurement Compliance Excel export',
        errors: parseResult.error.issues
      });
      return;
    }

    const { assessmentId } = parseResult.data;
    const authCheck = Module2ComplianceAuth.resolveAuthContext(req, assessmentId);
    if (!authCheck.authorized) {
      const statusCode = typeof authCheck.statusCode === 'number' ? authCheck.statusCode : 401;
      res.status(statusCode).json({
        success: false,
        message: authCheck.message
      });
      return;
    }

    logger.info('Handling GET /procurement-compliance/export-excel', {
      assessmentId,
      userId: authCheck.user?.userId,
      role: authCheck.user?.role
    });

    try {
      const reviews = Module2ProcurementComplianceController.getReviewsForAssessment(assessmentId);
      const result = await Module2ProcurementComplianceEngine.calculateProcurementCompliance(assessmentId, {
        reviews
      });
      const buffer = Module2ProcurementComplianceExcelBuilder.buildWorkbook(result);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="Procurement_Compliance_${assessmentId}.xlsx"`);
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Referrer-Policy', 'no-referrer');
      res.status(200).send(buffer);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to export Procurement Compliance Excel workbook', {
        assessmentId,
        error: err.message,
        stack: err.stack
      });
      res.status(500).json({
        success: false,
        message: 'Internal server error while exporting Procurement Compliance Excel workbook',
        error: err.message
      });
    }
  }
}
