import type { Request, Response } from 'express';
import { geminiService } from '../services/geminiService';
import { aiCategorizationService } from '../services/aiCategorizationService';
import { aiReportService } from '../services/aiReportService';
import { aiAnomalyService } from '../services/aiAnomalyService';
import logger from '../utils/logger';
import { EXTRACTION_STATUS, CLASSIFICATION_STATUS } from '../constants/ai';

export class AiController {
  public static async checkConfig(_req: Request, res: Response): Promise<void> {
    const isConfigured = geminiService.isConfigured();
    const models = geminiService.resolveModelChain();
    res.json({
      success: true,
      configured: isConfigured,
      primaryModel: models[0] || null,
      fallbackModels: models.slice(1)
    });
  }

  public static async extractDocument(req: Request, res: Response): Promise<void> {
    const start = Date.now();
    try {
      const { documentText, inlineData, mimeType, fileName } = req.body;
      const result = await geminiService.extractLineItems({
        documentText,
        inlineData,
        mimeType,
        fileName
      });

      const durationMs = Date.now() - start;
      logger.info('AI document extraction completed', {
        status: result.status,
        itemCount: result.items.length,
        model: result.model,
        durationMs
      });

      res.status(200).json({
        success: result.status === EXTRACTION_STATUS.SUCCESS,
        ...result,
        durationMs
      });
    } catch (err: unknown) {
      const errorObj = err as Error;
      logger.error('Unhandled error in extractDocument controller', {}, errorObj);
      res.status(500).json({
        success: false,
        status: EXTRACTION_STATUS.AI_FAILED,
        items: [],
        error: errorObj.message || 'Internal AI Extraction Error'
      });
    }
  }

  public static async categorizeItems(req: Request, res: Response): Promise<void> {
    const start = Date.now();
    try {
      const { items } = req.body;
      const result = await aiCategorizationService.categorizeLineItems(items);
      const durationMs = Date.now() - start;

      logger.info('AI categorization completed', {
        status: result.status,
        mappedCount: result.mappings.length,
        model: result.model,
        durationMs
      });

      res.status(200).json({
        success: result.status === CLASSIFICATION_STATUS.SUCCESS,
        ...result,
        durationMs
      });
    } catch (err: unknown) {
      const errorObj = err as Error;
      logger.error('Unhandled error in categorizeItems controller', {}, errorObj);
      res.status(500).json({
        success: false,
        status: CLASSIFICATION_STATUS.AI_FAILED,
        mappings: [],
        error: errorObj.message || 'Internal AI Categorization Error'
      });
    }
  }

  public static async generateExecutiveSummary(req: Request, res: Response): Promise<void> {
    const start = Date.now();
    try {
      const { tenantName, totalSpendInrCr, categories, vendors, currency } = req.body;
      const result = await aiReportService.generateExecutiveSummary({
        tenantName,
        totalSpendInrCr,
        categories,
        vendors,
        currency
      });

      const durationMs = Date.now() - start;
      logger.info('AI executive summary generation completed', {
        status: result.status,
        model: result.model,
        durationMs
      });

      res.status(200).json({
        success: result.status === EXTRACTION_STATUS.SUCCESS,
        ...result,
        durationMs
      });
    } catch (err: unknown) {
      const errorObj = err as Error;
      logger.error('Unhandled error in generateExecutiveSummary controller', {}, errorObj);
      res.status(500).json({
        success: false,
        status: EXTRACTION_STATUS.AI_FAILED,
        data: null,
        error: errorObj.message || 'Internal AI Executive Report Error'
      });
    }
  }

  public static async analyzeAnomalies(req: Request, res: Response): Promise<void> {
    const start = Date.now();
    try {
      const { records } = req.body;
      const result = await aiAnomalyService.analyzeAnomalies(records);
      const durationMs = Date.now() - start;

      logger.info('AI anomaly pre-check completed', {
        status: result.status,
        anomalyCount: result.anomalies.length,
        model: result.model,
        durationMs
      });

      res.status(200).json({
        success: result.status === EXTRACTION_STATUS.SUCCESS,
        ...result,
        durationMs
      });
    } catch (err: unknown) {
      const errorObj = err as Error;
      logger.error('Unhandled error in analyzeAnomalies controller', {}, errorObj);
      res.status(500).json({
        success: false,
        status: EXTRACTION_STATUS.AI_FAILED,
        anomalies: [],
        error: errorObj.message || 'Internal AI Anomaly Detection Error'
      });
    }
  }
}
