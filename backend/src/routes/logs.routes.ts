import { Router } from 'express';
import {
  searchLogsHandler,
  purgeLogsHandler,
  getLogStatsHandler
} from '../controllers/logs.controller';
import { validateQuery, validateBody } from '../utils/validation';
import { logsSearchQuerySchema, logsPurgeSchema } from '../constants/validation';

const router = Router();

router.get('/', validateQuery(logsSearchQuerySchema), searchLogsHandler);
router.post('/purge', validateBody(logsPurgeSchema), purgeLogsHandler);
router.get('/stats', getLogStatsHandler);

export default router;
