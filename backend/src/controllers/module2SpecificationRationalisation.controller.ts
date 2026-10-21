/**
 * Module 2 — Lever 8: Specification Rationalisation Controller (Phase 1)
 * Compliant with Rule 4, 8, 9, 10, max 300 lines, line length <= 120 chars, complexity <= 10
 */

import type { Request, Response } from 'express';
import logger from '../utils/logger';
import { Module2SpecificationRationalisationEngine } from '../services/module2SpecificationRationalisationEngine';
import { Module2SpecificationRationalisationExcelBuilder } from '../services/module2SpecificationRationalisationExcelBuilder';
import {
  specificationRationalisationQuerySchema,
  specificationRationalisationReviewSchema
} from '../constants/module2SpecificationRationalisation';
import type { TechnicalReviewRecord } from '../types/module2SpecificationRationalisation';

export class Module2SpecificationRationalisationController {
  private static reviewCache = new Map<string, Map<string, TechnicalReviewRecord[]>>();

  public static getReviewsForAssessment(assessmentId: string): Record<string, TechnicalReviewRecord[]> {
    const map = this.reviewCache.get(assessmentId);
    if (!map) return {};
    const record: Record<string, TechnicalReviewRecord[]> = {};
    for (const [key, val] of map.entries()) {
      record[key] = [...val];
    }
    return record;
  }

  public static setReviewForAssessment(
    assessmentId: string,
    record: TechnicalReviewRecord & { candidateId: string }
  ): void {
    let map = this.reviewCache.get(assessmentId);
    if (!map) {
      map = new Map<string, TechnicalReviewRecord[]>();
      this.reviewCache.set(assessmentId, map);
    }
    const history = map.get(record.candidateId) || [];
    history.push(record);
    map.set(record.candidateId, history);
  }

  public static clearReviews(): void {
    this.reviewCache.clear();
  }

  /**
   * GET /api/module2/sourcing/specification-rationalisation
   */
  public static async getSpecificationRationalisation(req: Request, res: Response): Promise<void> {
    const parseResult = specificationRationalisationQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      logger.warn('Specification Rationalisation query validation failed', { errors: parseResult.error.issues });
      res.status(400).json({
        success: false,
        message: 'Invalid query parameters for Specification Rationalisation',
        errors: parseResult.error.issues
      });
      return;
    }

    const { assessmentId, similarityThreshold } = parseResult.data;
    logger.info('Handling GET /specification-rationalisation request', { assessmentId, similarityThreshold });

    try {
      const reviews = Module2SpecificationRationalisationController.getReviewsForAssessment(assessmentId);
      const result = await Module2SpecificationRationalisationEngine.calculateSpecificationRationalisation(
        assessmentId,
        { reviews, similarityThreshold }
      );

      res.status(200).json({
        success: true,
        message: 'Specification Rationalisation analysis retrieved successfully',
        data: result
      });
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to calculate Specification Rationalisation', {
        assessmentId,
        error: err.message,
        stack: err.stack
      });
      res.status(500).json({
        success: false,
        message: 'Internal server error while executing Specification Rationalisation analysis',
        error: err.message
      });
    }
  }

  /**
   * POST /api/module2/sourcing/specification-rationalisation/review
   */
  public static async submitTechnicalReview(req: Request, res: Response): Promise<void> {
    const parseResult = specificationRationalisationReviewSchema.safeParse(req.body);
    if (!parseResult.success) {
      logger.warn('Specification Rationalisation review validation failed', { errors: parseResult.error.issues });
      res.status(400).json({
        success: false,
        message: 'Invalid payload for Specification Rationalisation technical review',
        errors: parseResult.error.issues
      });
      return;
    }

    const payload = parseResult.data;
    const { assessmentId } = payload;
    logger.info('Handling POST /specification-rationalisation/review', {
      assessmentId,
      candidateId: payload.candidateId,
      status: payload.status,
      reviewerName: payload.reviewerName
    });

    try {
      const reviewRecord: TechnicalReviewRecord & { candidateId: string } = {
        candidateId: payload.candidateId,
        reviewId: `REV-${Date.now()}`,
        reviewerName: payload.reviewerName,
        reviewerRole: payload.reviewerRole,
        reviewDate: new Date().toISOString().split('T')[0],
        status: payload.status,
        technicalJustification: payload.technicalJustification,
        proposedStandard: payload.proposedStandard,
        applicationScope: payload.applicationScope,
        rejectionReason: payload.rejectionReason
      };

      Module2SpecificationRationalisationController.setReviewForAssessment(assessmentId, reviewRecord);
      const reviews = Module2SpecificationRationalisationController.getReviewsForAssessment(assessmentId);
      const result = await Module2SpecificationRationalisationEngine.calculateSpecificationRationalisation(
        assessmentId,
        { reviews }
      );

      res.status(200).json({
        success: true,
        message: 'Technical review recorded successfully',
        data: result
      });
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to record technical review', {
        assessmentId,
        error: err.message,
        stack: err.stack
      });
      res.status(500).json({
        success: false,
        message: 'Internal server error while recording technical review',
        error: err.message
      });
    }
  }

  /**
   * GET /api/module2/sourcing/specification-rationalisation/export-excel
   */
  public static async exportExcel(req: Request, res: Response): Promise<void> {
    const parseResult = specificationRationalisationQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid query parameters for Specification Rationalisation Excel export',
        errors: parseResult.error.issues
      });
      return;
    }

    const { assessmentId, similarityThreshold } = parseResult.data;
    logger.info('Handling GET /specification-rationalisation/export-excel', { assessmentId });

    try {
      const reviews = Module2SpecificationRationalisationController.getReviewsForAssessment(assessmentId);
      const result = await Module2SpecificationRationalisationEngine.calculateSpecificationRationalisation(
        assessmentId,
        { reviews, similarityThreshold }
      );
      const buffer = Module2SpecificationRationalisationExcelBuilder.buildWorkbook(result);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="Specification_Rationalisation_${assessmentId}.xlsx"`);
      res.status(200).send(buffer);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to export Specification Rationalisation Excel workbook', {
        assessmentId,
        error: err.message,
        stack: err.stack
      });
      res.status(500).json({
        success: false,
        message: 'Internal server error while exporting Specification Rationalisation Excel workbook',
        error: err.message
      });
    }
  }
}
