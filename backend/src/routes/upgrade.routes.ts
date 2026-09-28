/**
 * Customer Upgrade Request & Admin OTP Authorization Routes (Prompt 81)
 */

import { Router } from 'express';
import { upgradeController } from '../controllers/upgrade.controller';

const router = Router();

// Customer submits upgrade request
router.post('/request', (req, res) => upgradeController.requestUpgrade(req, res));

// Admin views upgrade requests
router.get('/requests', (req, res) => upgradeController.listUpgradeRequests(req, res));

// Admin requests OTP for unique code generation
router.post('/admin/request-otp', (req, res) => upgradeController.requestAdminOTP(req, res));

// Admin verifies OTP and generates/dispatches unique code
router.post('/admin/verify-otp-and-generate-code', (req, res) => upgradeController.verifyOtpAndGenerateCode(req, res));

// Customer logs in with unique upgrade code
router.post('/login-with-code', (req, res) => upgradeController.loginWithUpgradeCode(req, res));

export default router;
