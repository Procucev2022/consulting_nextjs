import { Router } from 'express';
import { getVendors, mergeVendor } from '../controllers/vendors.controller';
import { validateBody } from '../utils/validation';
import { mergeVendorSchema } from '../constants/validation';

const router = Router();

router.get('/', getVendors);
router.post('/', validateBody(mergeVendorSchema), mergeVendor);

export default router;
