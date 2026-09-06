import { Router } from 'express';
import { getTaxonomyData } from '../controllers/taxonomy.controller';
import { validateQuery } from '../utils/validation';
import { taxonomyQuerySchema } from '../constants/validation';

const router = Router();

router.get('/', validateQuery(taxonomyQuerySchema), getTaxonomyData);

export default router;
