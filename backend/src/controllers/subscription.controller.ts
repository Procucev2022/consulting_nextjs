/**
 * Subscription & Entitlement Controller (Prompt 288 & Prompt 289)
 */

import type { Request, Response } from 'express';
import { subscriptionService } from '../services/subscriptionService';
import { subscriptionOtpService } from '../services/subscriptionOtpService';
import { upgradeEmailService } from '../services/upgradeEmailService';
import { extractAuthContext } from '../utils/entitlementMiddleware';
import {
  provisionSubscriptionSchema,
  requestAdminSubscriptionOtpSchema,
  activateSubscriptionSchema,
  updateSubscriptionStatusSchema,
  renewSubscriptionSchema
} from '../constants/subscriptionValidation';
import {
  SUBSCRIPTION_MESSAGES,
  BRONZE_ENTITLED_FEATURES,
  SILVER_ENTITLED_FEATURES,
  GOLD_ENTITLED_FEATURES
} from '../constants/subscription';
import logger from '../utils/logger';

export class SubscriptionController {
  public async getCurrentPlan(req: Request, res: Response): Promise<void> {
    try {
      const auth = extractAuthContext(req);
      if (auth.hasTenantMismatch) {
        res.status(403).json({ success: false, error: 'TENANT_MISMATCH', message: SUBSCRIPTION_MESSAGES.TENANT_MISMATCH });
        return;
      }
      const plan = subscriptionService.getCustomerPlanInfo(auth.tenantId, auth.isAdmin);
      res.json({ success: true, plan });
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : String(err);
      logger.error('Failed to get customer plan', { error });
      res.status(500).json({ success: false, message: 'Failed to retrieve plan information' });
    }
  }

  public async getTierFeatures(_req: Request, res: Response): Promise<void> {
    res.json({
      success: true,
      tiers: {
        BRONZE: Array.from(BRONZE_ENTITLED_FEATURES),
        SILVER: Array.from(SILVER_ENTITLED_FEATURES),
        GOLD: Array.from(GOLD_ENTITLED_FEATURES)
      }
    });
  }

  public async requestAdminOtp(req: Request, res: Response): Promise<void> {
    try {
      const auth = extractAuthContext(req);
      if (!auth.isAdmin) {
        res.status(403).json({ success: false, message: SUBSCRIPTION_MESSAGES.ADMIN_ONLY });
        return;
      }

      const parseResult = requestAdminSubscriptionOtpSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({ success: false, message: 'Validation failed', errors: parseResult.error.issues });
        return;
      }

      const { customer_id: customerId, action } = parseResult.data;
      const adminEmail = auth.email || process.env.ADMIN_EMAIL || 'admin@procucev.com';
      const adminMobile = process.env.ADMIN_MOBILE || '+91 98765 43210';

      if (!adminMobile || adminMobile.trim() === '') {
        res.status(412).json({
          success: false,
          error: 'ADMIN_MOBILE_UNCONFIGURED',
          message: 'Authenticated administrator does not have a registered mobile number.'
        });
        return;
      }

      const session = await subscriptionOtpService.generateAdminOtp(adminEmail, adminMobile, customerId, action);

      res.json({
        success: true,
        message: `Admin OTP sent to registered mobile (${session.destination})`,
        session_id: session.sessionId,
        expires_at: session.expiresAt
      });
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : String(err);
      logger.error('Failed to generate admin OTP', { error });
      res.status(500).json({ success: false, message: error });
    }
  }

  public async provisionSubscription(req: Request, res: Response): Promise<void> {
    try {
      const auth = extractAuthContext(req);
      if (!auth.isAdmin) {
        res.status(403).json({ success: false, message: SUBSCRIPTION_MESSAGES.ADMIN_ONLY });
        return;
      }

      const parseResult = provisionSubscriptionSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({ success: false, message: 'Validation failed', errors: parseResult.error.issues });
        return;
      }

      const d = parseResult.data;
      const result = subscriptionService.provisionSubscription({
        tenant_id: d.tenant_id,
        customer_id: d.customer_id,
        customer_email: d.customer_email,
        customer_name: d.customer_name,
        company_name: d.company_name,
        tier: d.tier,
        commercial_status: d.commercial_status,
        payment_reference: d.payment_reference,
        start_date: d.start_date,
        end_date: d.end_date,
        duration_days: d.duration_days,
        admin_email: auth.email || 'admin@procucev.com',
        admin_role: 'ADMIN',
        otp_session_id: d.otp_session_id,
        otp_code: d.otp_code
      });

      upgradeEmailService.sendCustomerActivationEmail({
        customerEmail: d.customer_email,
        customerName: d.customer_name,
        tier: d.tier,
        activationCode: result.activationCode,
        expiresAt: new Date(Date.now() + 72 * 3600000).toISOString()
      }).catch((e: unknown) => logger.warn('Failed to dispatch activation email', { error: String(e) }));

      res.status(201).json({
        success: true,
        message: SUBSCRIPTION_MESSAGES.PROVISION_SUCCESS,
        subscription: result.subscription,
        activation_code_hint: `${result.activationCode.slice(0, 8)}****`
      });
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : String(err);
      logger.error('Provisioning failed', { error });
      res.status(400).json({ success: false, message: error });
    }
  }

  public async activateSubscription(req: Request, res: Response): Promise<void> {
    try {
      const auth = extractAuthContext(req);
      if (auth.hasTenantMismatch) {
        res.status(403).json({ success: false, error: 'TENANT_MISMATCH', message: SUBSCRIPTION_MESSAGES.TENANT_MISMATCH });
        return;
      }

      const parseResult = activateSubscriptionSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({ success: false, message: 'Validation failed', errors: parseResult.error.issues });
        return;
      }

      const { customer_email: inputEmail, email: rawEmail, activation_code: code } = parseResult.data;
      const email = auth.email || inputEmail || rawEmail || '';
      const result = subscriptionService.activateCustomerSubscription(
        email,
        code,
        auth.authenticatedTenantId
      );

      res.json({
        success: true,
        message: SUBSCRIPTION_MESSAGES.ACTIVATION_SUCCESS,
        subscription: result.subscription
      });
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : String(err);
      logger.warn('Subscription activation rejected', { error });
      res.status(400).json({ success: false, message: error });
    }
  }

  public async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const auth = extractAuthContext(req);
      if (!auth.isAdmin) {
        res.status(403).json({ success: false, message: SUBSCRIPTION_MESSAGES.ADMIN_ONLY });
        return;
      }

      const parseResult = updateSubscriptionStatusSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({ success: false, message: 'Validation failed', errors: parseResult.error.issues });
        return;
      }

      const subId = req.params.id;
      const { status, reason } = parseResult.data;
      const sub = subscriptionService.updateStatus(subId, status, auth.email || 'admin@procucev.com', 'ADMIN', reason);

      res.json({ success: true, message: SUBSCRIPTION_MESSAGES.STATUS_UPDATED, subscription: sub });
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : String(err);
      logger.error('Failed to update subscription status', { error });
      res.status(400).json({ success: false, message: error });
    }
  }

  public async renewSubscription(req: Request, res: Response): Promise<void> {
    try {
      const auth = extractAuthContext(req);
      if (!auth.isAdmin) {
        res.status(403).json({ success: false, message: SUBSCRIPTION_MESSAGES.ADMIN_ONLY });
        return;
      }

      const parseResult = renewSubscriptionSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({ success: false, message: 'Validation failed', errors: parseResult.error.issues });
        return;
      }

      const subId = req.params.id;
      const d = parseResult.data;
      const sub = subscriptionService.renewSubscription({
        id: subId,
        new_end_date: d.new_end_date || d.end_date || new Date(Date.now() + 365 * 86400000).toISOString(),
        payment_reference: d.payment_reference,
        admin_email: auth.email || 'admin@procucev.com',
        admin_role: 'ADMIN',
        otp_session_id: d.otp_session_id,
        otp_code: d.otp_code
      });

      res.json({ success: true, message: SUBSCRIPTION_MESSAGES.RENEW_SUCCESS, subscription: sub });
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : String(err);
      logger.error('Failed to renew subscription', { error });
      res.status(400).json({ success: false, message: error });
    }
  }

  public async listSubscriptions(req: Request, res: Response): Promise<void> {
    try {
      const auth = extractAuthContext(req);
      if (!auth.isAdmin) {
        res.status(403).json({ success: false, message: SUBSCRIPTION_MESSAGES.ADMIN_ONLY });
        return;
      }
      const subs = subscriptionService.getAllSubscriptions();
      res.json({ success: true, subscriptions: subs });
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : String(err);
      logger.error('Failed to list subscriptions', { error });
      res.status(500).json({ success: false, message: 'Failed to list subscriptions' });
    }
  }

  public async getAuditTrail(req: Request, res: Response): Promise<void> {
    try {
      const auth = extractAuthContext(req);
      if (!auth.isAdmin) {
        res.status(403).json({ success: false, message: SUBSCRIPTION_MESSAGES.ADMIN_ONLY });
        return;
      }
      const subId = req.query.subscription_id as string | undefined;
      const events = subscriptionService.getAuditEvents(subId);
      res.json({ success: true, audit_events: events });
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : String(err);
      logger.error('Failed to retrieve audit trail', { error });
      res.status(500).json({ success: false, message: 'Failed to retrieve audit trail' });
    }
  }

  public async simulateTier(req: Request, res: Response): Promise<void> {
    try {
      const auth = extractAuthContext(req);
      if (!auth.isAdmin) {
        res.status(403).json({ success: false, message: SUBSCRIPTION_MESSAGES.ADMIN_ONLY });
        return;
      }
      const targetTier = (req.body?.target_tier || req.query.target_tier || 'BRONZE') as string;
      const sim = subscriptionService.simulateTier(targetTier, true);
      res.json({ success: true, plan: sim });
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : String(err);
      res.status(400).json({ success: false, message: error });
    }
  }
}

export const subscriptionController = new SubscriptionController();
