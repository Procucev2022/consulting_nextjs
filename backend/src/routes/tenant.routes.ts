import { Router } from 'express';
import { getTenant, updateTenant } from '../controllers/tenant.controller';

const router = Router();

router.get('/', getTenant);
router.put('/', updateTenant);

export default router;
