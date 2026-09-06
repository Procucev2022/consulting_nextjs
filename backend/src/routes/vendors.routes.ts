import { Router } from 'express';
import { getVendors, mergeVendor } from '../controllers/vendors.controller';

const router = Router();

router.get('/', getVendors);
router.post('/', mergeVendor);

export default router;
