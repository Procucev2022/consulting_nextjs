import { Router, Request, Response } from 'express';
import tenantRoutes from './tenant.routes';
import ingestionRoutes from './ingestion.routes';
import categoriesRoutes from './categories.routes';
import vendorsRoutes from './vendors.routes';
import savingsRoutes from './savings.routes';
import conversionRoutes from './conversion.routes';
import reportRoutes from './report.routes';
import currencyRoutes from './currency.routes';
import taxonomyRoutes from './taxonomy.routes';
import logsRoutes from './logs.routes';

const router = Router();

// Health Check
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Mount domain routes
router.use('/tenant', tenantRoutes);
router.use('/ingestion', ingestionRoutes);
router.use('/categories', categoriesRoutes);
router.use('/vendors', vendorsRoutes);
router.use('/savings', savingsRoutes);
router.use('/conversion', conversionRoutes);
router.use('/report', reportRoutes);
router.use('/currency', currencyRoutes);
router.use('/taxonomy', taxonomyRoutes);
router.use('/logs', logsRoutes);

export default router;

