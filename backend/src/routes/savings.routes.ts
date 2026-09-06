import { Router } from 'express';
import { getSavings, deployOpportunity } from '../controllers/savings.controller';

const router = Router();

router.get('/', getSavings);
router.post('/', deployOpportunity);

export default router;
