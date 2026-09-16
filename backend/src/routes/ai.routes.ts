import { Router } from 'express';
import { AiController } from '../controllers/ai.controller';
import { validateBody } from '../utils/validation';
import {
  aiExtractSchema,
  aiCategorizeSchema,
  aiExecutiveSummarySchema,
  aiAnalyzeAnomaliesSchema
} from '../constants/validation';

const router = Router();

router.get('/config', AiController.checkConfig);
router.post('/extract', validateBody(aiExtractSchema), AiController.extractDocument);
router.post('/categorize', validateBody(aiCategorizeSchema), AiController.categorizeItems);
router.post('/executive-summary', validateBody(aiExecutiveSummarySchema), AiController.generateExecutiveSummary);
router.post('/analyze-anomalies', validateBody(aiAnalyzeAnomaliesSchema), AiController.analyzeAnomalies);

export default router;
