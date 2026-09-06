import { Router } from 'express';
import { getConversionStages, calculateConversionMetrics } from '../controllers/conversion.controller';

const router = Router();

router.get('/', getConversionStages);
router.post('/', calculateConversionMetrics);

export default router;
