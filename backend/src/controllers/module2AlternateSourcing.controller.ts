/**
 * Module 2 — Lever 10: Alternate Vendor Discovery Controller
 * Compliant with Rule 4, 8, 9, 10, max 300 lines, line length <= 120 chars, complexity <= 10
 */

import type { Request, Response } from 'express';
import logger from '../utils/logger';
import { Module2AlternateSourcingEngine } from '../services/module2AlternateSourcingEngine';
import { alternateSourcingQuerySchema } from '../constants/module2AlternateSourcing';

export class Module2AlternateSourcingController {
  /**
   * GET /api/module2/sourcing/alternate-sourcing
   */
  public static async getAlternateSourcing(req: Request, res: Response): Promise<void> {
    const parseResult = alternateSourcingQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      logger.warn('Alternate Sourcing query validation failed', { errors: parseResult.error.issues });
      res.status(400).json({
        success: false,
        message: 'Invalid query parameters for Alternate Vendor Discovery',
        errors: parseResult.error.issues
      });
      return;
    }

    const {
      assessmentId,
      materialCode,
      spendCategory,
      geographicPreference,
      preferredState,
      preferredCity,
      matchType
    } = parseResult.data;

    logger.info('Handling GET /alternate-sourcing request', {
      assessmentId,
      materialCode,
      spendCategory,
      geographicPreference,
      preferredState,
      preferredCity
    });

    try {
      const result = Module2AlternateSourcingEngine.calculateAlternateSourcing(assessmentId, {
        materialCode,
        spendCategory,
        geographicPreference,
        preferredState,
        preferredCity,
        matchType
      });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      logger.error('Error generating Alternate Sourcing discovery results', {
        assessmentId,
        error: err instanceof Error ? { message: err.message, stack: err.stack } : err
      });

      res.status(500).json({
        success: false,
        message: 'Internal error generating Alternate Vendor Discovery results',
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  }
}
