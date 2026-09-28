/**
 * PCBI Master Admin Routes
 */

import { Router } from 'express';
import { pcbiAdminController } from '../controllers/pcbiAdmin.controller';

const router = Router();

// Version History & Queries
router.get('/versions', (req, res) => pcbiAdminController.getVersions(req, res));
router.get('/versions/:version', (req, res) => pcbiAdminController.getVersion(req, res));

// Import Master Dataset
router.post('/import', (req, res) => pcbiAdminController.importMaster(req, res));

// Publish Version to Production
router.post('/publish', (req, res) => pcbiAdminController.publishVersion(req, res));
router.post('/publish/:version', (req, res) => pcbiAdminController.publishVersion(req, res));

// Download Validation Report
router.get('/validation-report/:version', (req, res) => pcbiAdminController.getValidationReport(req, res));
router.get('/reports/validation/:version', (req, res) => pcbiAdminController.getValidationReport(req, res));

export default router;
