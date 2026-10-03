/**
 * PCBI (Procucev Benchmark Intelligence) Routes (Prompts 82 & 86)
 */

import { Router } from 'express';
import { pcbiController } from '../controllers/pcbi.controller';
import { requireFeature } from '../utils/entitlementMiddleware';
import { FEATURE_PERMISSIONS } from '../constants/subscription';

const router = Router();

// Dashboard & Aggregations
router.get('/dashboard', requireFeature(FEATURE_PERMISSIONS.PCBI_SUMMARY), (req, res) => pcbiController.getDashboard(req, res));

// Calculation Trigger
router.post('/calculate', (req, res) => pcbiController.calculate(req, res));
router.post('/calculate/:upload_id', (req, res) => pcbiController.calculate(req, res));

// Opportunities & Audit
router.get('/opportunity', (req, res) => pcbiController.getOpportunities(req, res));
router.get('/opportunity/:id', requireFeature(FEATURE_PERMISSIONS.PCBI_DETAIL), (req, res) => pcbiController.getOpportunityAudit(req, res));

// Base Purchases & Controlled Reset
router.get('/base-purchases', requireFeature(FEATURE_PERMISSIONS.PCBI_DETAIL), (req, res) => pcbiController.getBasePurchases(req, res));
router.post('/base-purchase/reset', (req, res) => pcbiController.resetBasePurchase(req, res));

// Material & Trend Details
router.get('/material/:material_id', (req, res) => pcbiController.getMaterialTrend(req, res));

// Benchmarks Master
router.get('/benchmarks', (req, res) => pcbiController.getBenchmarks(req, res));
router.post('/benchmarks', (req, res) => pcbiController.addBenchmark(req, res));
router.post('/categories', (req, res) => pcbiController.addBenchmark(req, res));

// Components Master
router.get('/components', (req, res) => pcbiController.getComponents(req, res));
router.post('/components', (req, res) => pcbiController.addComponent(req, res));

// Weekly Index Series
router.get('/indices', (req, res) => pcbiController.getWeeklyIndices(req, res));
router.get('/index-trend', (req, res) => pcbiController.getWeeklyIndices(req, res));
router.post('/index', (req, res) => pcbiController.addBenchmark(req, res));

// UNSPSC Mappings
router.get('/unspsc-mapping', (req, res) => pcbiController.getUNSPSCMappings(req, res));
router.post('/unspsc-mapping', (req, res) => pcbiController.getUNSPSCMappings(req, res));

export default router;
