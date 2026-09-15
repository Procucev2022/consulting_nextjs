/**
 * Database View & Telemetry Routes (Backend)
 */

import { Router } from 'express';
import { dbController } from '../controllers/db.controller';

const router = Router();

// DB connection reachability, latency, and table row counts
router.get('/status', (req, res) => dbController.getDBStatus(req, res));

// Query cache and optimization metrics
router.get('/metrics', (req, res) => dbController.getDBMetrics(req, res));

// Live table explorer with pagination & search
router.get('/tables', (req, res) => dbController.getTableData(req, res));

// Real-time ping test
router.post('/test-connection', (req, res) => dbController.testConnection(req, res));

export default router;
