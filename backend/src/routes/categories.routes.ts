import { Router } from 'express';
import { getCategories } from '../controllers/categories.controller';
import { validateQuery } from '../utils/validation';
import { categoryQuerySchema } from '../constants/validation';

const router = Router();

router.get('/', validateQuery(categoryQuerySchema), getCategories);

export default router;
