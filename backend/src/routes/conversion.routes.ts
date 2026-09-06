import { Router } from 'express';
import { getConversionStages, calculateConversionMetrics } from '../controllers/conversion.controller';
import { validateBody } from '../utils/validation';
import { calculateConversionMetricsSchema } from '../constants/validation';

const router = Router();

router.get('/', getConversionStages);
router.post('/', validateBody(calculateConversionMetricsSchema), calculateConversionMetrics);

export default router;
