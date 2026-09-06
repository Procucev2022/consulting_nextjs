import { Router } from 'express';
import { getExecutiveReport } from '../controllers/report.controller';

const router = Router();

router.get('/', getExecutiveReport);

export default router;
