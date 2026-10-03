/**
 * Subscription & Entitlement Routes (Prompt 288 & Prompt 289)
 */

import { Router } from 'express';
import { subscriptionController } from '../controllers/subscription.controller';
import { requireSubscriptionAdmin, enforceTenantIsolation } from '../utils/entitlementMiddleware';

const router = Router();

// Customer Plan & Entitlement (with tenant isolation enforcement)
router.get('/plan', enforceTenantIsolation, (req, res) => subscriptionController.getCurrentPlan(req, res));
router.get('/current', enforceTenantIsolation, (req, res) => subscriptionController.getCurrentPlan(req, res));
router.get('/tier-features', (req, res) => subscriptionController.getTierFeatures(req, res));

// Customer Activation (with tenant isolation enforcement)
router.post('/activate', enforceTenantIsolation, (req, res) => subscriptionController.activateSubscription(req, res));

// Admin Subscription Endpoints (Strictly restricted to Admin role via requireSubscriptionAdmin)
router.post('/admin/request-otp', requireSubscriptionAdmin, (req, res) => subscriptionController.requestAdminOtp(req, res));
router.post('/request-otp', requireSubscriptionAdmin, (req, res) => subscriptionController.requestAdminOtp(req, res));
router.post('/admin/provision', requireSubscriptionAdmin, (req, res) => subscriptionController.provisionSubscription(req, res));
router.post('/provision', requireSubscriptionAdmin, (req, res) => subscriptionController.provisionSubscription(req, res));
router.get('/admin/list', requireSubscriptionAdmin, (req, res) => subscriptionController.listSubscriptions(req, res));
router.patch('/admin/:id/status', requireSubscriptionAdmin, (req, res) => subscriptionController.updateStatus(req, res));
router.patch('/status/:id', requireSubscriptionAdmin, (req, res) => subscriptionController.updateStatus(req, res));
router.post('/admin/:id/renew', requireSubscriptionAdmin, (req, res) => subscriptionController.renewSubscription(req, res));
router.post('/renew/:id', requireSubscriptionAdmin, (req, res) => subscriptionController.renewSubscription(req, res));
router.get('/admin/audit-trail', requireSubscriptionAdmin, (req, res) => subscriptionController.getAuditTrail(req, res));
router.get('/audit', requireSubscriptionAdmin, (req, res) => subscriptionController.getAuditTrail(req, res));
router.post('/admin/simulate-tier', requireSubscriptionAdmin, (req, res) => subscriptionController.simulateTier(req, res));

export default router;
