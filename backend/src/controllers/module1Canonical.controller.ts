import type { Request, Response } from 'express';
import { Module1CanonicalService } from '../services/module1CanonicalService';
import logger from '../utils/logger';

export const getCanonicalModule1 = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const filePath = (req?.query?.filePath as string) || undefined;
    const assessmentId =
      (req?.query?.assessmentId as string) ||
      (req?.headers?.['x-assessment-id'] as string) ||
      undefined;

    if (assessmentId) {
      const canonical = Module1CanonicalService.getCanonicalViewModelForAssessment(assessmentId, filePath);
      if (!canonical) {
        return res.json({
          success: true,
          data: null,
          message: `No analysis run executed for assessment '${assessmentId}'`,
          timestamp: new Date().toISOString()
        });
      }
      return res.json({
        success: true,
        data: canonical,
        message: `Fetched authoritative Module 1 canonical view model for assessment '${assessmentId}'`,
        timestamp: new Date().toISOString()
      });
    }

    const canonical = Module1CanonicalService.getOrBuildCanonicalViewModel(filePath);
    return res.json({
      success: true,
      data: canonical,
      message: 'Fetched authoritative Module 1 canonical view model',
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to fetch canonical Module 1 view model', { query: req?.query }, error);
    return res.status(500).json({ success: false, message: `Failed to retrieve canonical Module 1 data: ${message}` });
  }
};
