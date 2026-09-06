import { Router } from 'express';
import { getTenant, updateTenant } from '../controllers/tenant.controller';
import { validateBody } from '../utils/validation';
import { tenantUpdateSchema } from '../constants/validation';

const router = Router();

router.get('/', getTenant);
router.put('/', validateBody(tenantUpdateSchema), updateTenant);

export default router;
