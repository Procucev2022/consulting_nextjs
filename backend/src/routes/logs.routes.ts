import { Router } from 'express';
import {
  searchLogsHandler,
  purgeLogsHandler,
  getLogStatsHandler
} from '../controllers/logs.controller';

const router = Router();

router.get('/', searchLogsHandler);
router.post('/purge', purgeLogsHandler);
router.get('/stats', getLogStatsHandler);

export default router;
