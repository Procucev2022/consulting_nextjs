import { Router } from 'express';
import { getCurrencyData } from '../controllers/currency.controller';

const router = Router();

router.get('/', getCurrencyData);

export default router;
