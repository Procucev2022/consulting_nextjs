import type { Request, Response } from 'express';
import { Module1CanonicalService } from '../services/module1CanonicalService';
import { AssessmentStore } from '../services/assessmentStore';
import logger from '../utils/logger';

export const getCanonicalModule1 = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const filePath = (req?.query?.filePath as string) || undefined;
    const rawAssessmentId =
      (req?.query?.assessmentId as string) ||
      (req?.headers?.['x-assessment-id'] as string) ||
      undefined;

    if (!rawAssessmentId || typeof rawAssessmentId !== 'string' || rawAssessmentId.trim().length === 0) {
      logger.warn('Canonical Module 1 request rejected: missing assessment identifier');
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Missing assessment identifier in x-assessment-id header or assessmentId query parameter',
        timestamp: new Date().toISOString()
      });
    }

    const assessmentId = rawAssessmentId.trim();
    if (!/^AIC-[A-Za-z0-9_-]+$/.test(assessmentId)) {
      logger.warn('Canonical Module 1 request rejected: malformed assessment identifier', { assessmentId });
      return res.status(400).json({
        success: false,
        data: null,
        message: `Malformed assessment identifier: '${assessmentId}'`,
        timestamp: new Date().toISOString()
      });
    }

    const assessmentStore = AssessmentStore.getInstance();
    const assessment = assessmentStore.getAssessmentById(assessmentId);
    if (!assessment) {
      logger.warn('Canonical Module 1 request rejected: unknown assessment identifier', { assessmentId });
      return res.status(404).json({
        success: false,
        data: null,
        message: `Assessment '${assessmentId}' not found`,
        timestamp: new Date().toISOString()
      });
    }

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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to fetch canonical Module 1 view model', { query: req?.query }, error);
    return res.status(500).json({ success: false, message: `Failed to retrieve canonical Module 1 data: ${message}` });
  }
};

