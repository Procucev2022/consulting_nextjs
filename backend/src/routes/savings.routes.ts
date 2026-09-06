import { Router } from 'express';
import { getSavings, deployOpportunity } from '../controllers/savings.controller';
import { validateBody } from '../utils/validation';
import { deployOpportunitySchema } from '../constants/validation';

const router = Router();

router.get('/', getSavings);
router.post('/', validateBody(deployOpportunitySchema), deployOpportunity);

export default router;
