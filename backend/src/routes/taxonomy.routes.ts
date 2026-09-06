import { Router } from 'express';
import { getTaxonomyData } from '../controllers/taxonomy.controller';

const router = Router();

router.get('/', getTaxonomyData);

export default router;
