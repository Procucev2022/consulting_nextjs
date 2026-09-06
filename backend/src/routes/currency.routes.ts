import { Router } from 'express';
import { getCurrencyData } from '../controllers/currency.controller';
import { validateQuery } from '../utils/validation';
import { currencyQuerySchema } from '../constants/validation';

const router = Router();

router.get('/', validateQuery(currencyQuerySchema), getCurrencyData);

export default router;
