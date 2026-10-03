/**
 * Core Subscription & Entitlement Service (Prompt 288 & Prompt 289)
 */

import {
  SUBSCRIPTION_TIERS,
  SUBSCRIPTION_STATES,
  COMMERCIAL_STATUS,
  SUBSCRIPTION_AUDIT_ACTIONS,
  BRONZE_ENTITLED_FEATURES,
  SILVER_ENTITLED_FEATURES,
  GOLD_ENTITLED_FEATURES
} from '../constants/subscription';
import type {
  SubscriptionRecord,
  SubscriptionTier,
  SubscriptionAuditEvent,
  CustomerPlanInfo
} from '../types/subscription';
import { subscriptionStore } from './subscriptionStore';
import { subscriptionOtpService } from './subscriptionOtpService';
import { activationCodeService } from './activationCodeService';

export class SubscriptionService {
  public can(
    tenantId: string,
    feature: string,
    isAdmin = false,
    simulatedTier?: string
  ): boolean {
    if (isAdmin && !simulatedTier) return true;
    const sub = subscriptionStore.getSubscriptionByTenantId(tenantId);
    const effectiveTier = (simulatedTier && isAdmin)
      ? (simulatedTier.toUpperCase() as SubscriptionTier)
      : this.getEffectiveTier(sub);
    const features = this.getFeaturesForTier(effectiveTier);
    return features.has(feature);
  }

  public getEffectiveTier(sub: SubscriptionRecord): SubscriptionTier {
    if (sub.status === SUBSCRIPTION_STATES.ACTIVE) return sub.tier;
    if (sub.status === SUBSCRIPTION_STATES.PENDING_ACTIVATION) return SUBSCRIPTION_TIERS.BRONZE;
    return SUBSCRIPTION_TIERS.BRONZE;
  }

  public getFeaturesForTier(tier: SubscriptionTier): Set<string> {
    switch (tier) {
      case SUBSCRIPTION_TIERS.GOLD: return GOLD_ENTITLED_FEATURES;
      case SUBSCRIPTION_TIERS.SILVER: return SILVER_ENTITLED_FEATURES;
      case SUBSCRIPTION_TIERS.BRONZE:
      default: return BRONZE_ENTITLED_FEATURES;
    }
  }

  public getSubscriptionByTenantId(tenantId: string): SubscriptionRecord {
    return subscriptionStore.getSubscriptionByTenantId(tenantId);
  }

  public getCustomerPlanInfo(tenantId: string, isAdmin = false): CustomerPlanInfo {
    const sub = subscriptionStore.getSubscriptionByTenantId(tenantId);
    const effectiveTier = this.getEffectiveTier(sub);
    const entitledFeatures = Array.from(this.getFeaturesForTier(effectiveTier));
    return {
      tier: effectiveTier,
      status: sub.status,
      commercial_status: sub.commercial_status,
      is_active: sub.status === SUBSCRIPTION_STATES.ACTIVE,
      is_pending_activation: sub.status === SUBSCRIPTION_STATES.PENDING_ACTIVATION,
      start_date: sub.start_date,
      end_date: sub.end_date,
      entitled_features: isAdmin ? Array.from(GOLD_ENTITLED_FEATURES) : entitledFeatures
    };
  }

  public simulateTier(targetTier: string, isAdmin: boolean): CustomerPlanInfo & { is_simulation: boolean } {
    if (!isAdmin) throw new Error('Simulation restricted to authorized administrators');
    const upper = (targetTier || 'BRONZE').toUpperCase() as SubscriptionTier;
    const features = Array.from(this.getFeaturesForTier(upper));
    return {
      tier: upper,
      status: SUBSCRIPTION_STATES.ACTIVE,
      commercial_status: COMMERCIAL_STATUS.COMPLETED,
      is_active: true,
      is_pending_activation: false,
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 365 * 86400000).toISOString(),
      entitled_features: features,
      is_simulation: true
    };
  }

  public provisionSubscription(params: {
    tenant_id: string;
    customer_id: string;
    customer_email: string;
    customer_name: string;
    company_name: string;
    tier: SubscriptionTier;
    commercial_status: typeof COMMERCIAL_STATUS[keyof typeof COMMERCIAL_STATUS];
    payment_reference?: string;
    start_date?: string;
    end_date?: string;
    admin_email: string;
    admin_role: string;
    otp_session_id: string;
    otp_code: string;
    duration_days?: number;
  }): { subscription: SubscriptionRecord; activationCode: string } {
    const otpVerification = subscriptionOtpService.verifyAdminOtp(params.otp_session_id, params.otp_code);
    if (!otpVerification.valid) {
      this.logAudit(SUBSCRIPTION_AUDIT_ACTIONS.OTP_FAILED, 'N/A', params.tenant_id, params.admin_email, params.admin_role, 'FAILURE', { error: otpVerification.error });
      throw new Error(otpVerification.error || 'Admin OTP verification failed');
    }

    subscriptionOtpService.consumeVerifiedSession(params.otp_session_id);
    this.logAudit(SUBSCRIPTION_AUDIT_ACTIONS.OTP_VERIFIED, 'N/A', params.tenant_id, params.admin_email, params.admin_role, 'SUCCESS');

    const durationDays = params.duration_days || 365;
    const now = params.start_date ? new Date(params.start_date) : new Date();
    const endDate = params.end_date ? new Date(params.end_date) : new Date(now.getTime() + durationDays * 86400000);
    const subId = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const newSub: SubscriptionRecord = {
      id: subId,
      tenant_id: params.tenant_id,
      customer_id: params.customer_id,
      customer_email: params.customer_email,
      customer_name: params.customer_name,
      company_name: params.company_name,
      tier: params.tier,
      status: SUBSCRIPTION_STATES.PENDING_ACTIVATION,
      commercial_status: params.commercial_status,
      payment_reference: params.payment_reference,
      payment_confirmed: true,
      start_date: now.toISOString(),
      end_date: endDate.toISOString(),
      provisioned_by: params.admin_email,
      provisioned_at: now.toISOString(),
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    };

    subscriptionStore.setSubscription(subId, newSub);
    this.logAudit(SUBSCRIPTION_AUDIT_ACTIONS.SUBSCRIPTION_PROVISIONED, subId, params.tenant_id, params.admin_email, params.admin_role, 'SUCCESS', { tier: params.tier });

    const codeRes = activationCodeService.generateActivationCode(subId, params.tenant_id, params.customer_email);
    this.logAudit(SUBSCRIPTION_AUDIT_ACTIONS.ACTIVATION_CODE_GENERATED, subId, params.tenant_id, params.admin_email, params.admin_role, 'SUCCESS', { expiresAt: codeRes.record.expires_at });

    return { subscription: newSub, activationCode: codeRes.plaintextCode };
  }

  public activateCustomerSubscription(
    customerEmail: string,
    rawCode: string,
    requestTenantId?: string
  ): { subscription: SubscriptionRecord } {
    const redeemRes = activationCodeService.redeemActivationCode(customerEmail, rawCode, requestTenantId);
    if (!redeemRes.success || !redeemRes.subscriptionId) {
      this.logAudit(SUBSCRIPTION_AUDIT_ACTIONS.ACTIVATION_FAILED, 'N/A', requestTenantId || 'N/A', customerEmail, 'CUSTOMER', 'FAILURE', { error: redeemRes.error });
      throw new Error(redeemRes.error || 'Invalid activation code');
    }

    const sub = subscriptionStore.getSubscriptionById(redeemRes.subscriptionId);
    if (!sub) throw new Error('Subscription record not found for activation code');

    if (sub.status === SUBSCRIPTION_STATES.CANCELLED) {
      throw new Error('Cannot activate cancelled subscription');
    }
    if (sub.status === SUBSCRIPTION_STATES.EXPIRED) {
      throw new Error('Cannot activate expired subscription');
    }
    if (requestTenantId && sub.tenant_id !== requestTenantId) {
      throw new Error('Cannot activate subscription belonging to another tenant');
    }

    const now = new Date().toISOString();
    sub.status = SUBSCRIPTION_STATES.ACTIVE;
    sub.activated_at = now;
    sub.activated_by = customerEmail;
    sub.updated_at = now;

    this.logAudit(SUBSCRIPTION_AUDIT_ACTIONS.SUBSCRIPTION_ACTIVATED, sub.id, sub.tenant_id, customerEmail, 'CUSTOMER', 'SUCCESS', { tier: sub.tier });
    return { subscription: sub };
  }

  public updateStatus(
    id: string,
    status: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED',
    adminEmail: string,
    adminRole: string,
    reason?: string
  ): SubscriptionRecord {
    const sub = subscriptionStore.getSubscriptionById(id);
    if (!sub) throw new Error('Subscription not found');

    const prev = sub.status;
    if (prev === status) return sub;

    // Reject illegal transitions
    if (prev === SUBSCRIPTION_STATES.CANCELLED) {
      throw new Error(`Invalid state transition: CANCELLED subscription cannot be changed to ${status}. Renewal or re-provisioning required.`);
    }
    if (prev === SUBSCRIPTION_STATES.EXPIRED && status === SUBSCRIPTION_STATES.ACTIVE) {
      throw new Error('Invalid state transition: EXPIRED subscription cannot be directly set to ACTIVE without renewal.');
    }
    if (prev === SUBSCRIPTION_STATES.FREE && status === SUBSCRIPTION_STATES.ACTIVE) {
      throw new Error('Invalid state transition: FREE subscription cannot be set to ACTIVE without provisioning.');
    }
    if (prev === SUBSCRIPTION_STATES.PENDING_ACTIVATION && status === SUBSCRIPTION_STATES.ACTIVE) {
      throw new Error('Invalid state transition: PENDING_ACTIVATION requires customer activation code redemption.');
    }

    sub.status = status;
    sub.updated_at = new Date().toISOString();

    const action = status === SUBSCRIPTION_STATES.SUSPENDED
      ? SUBSCRIPTION_AUDIT_ACTIONS.SUBSCRIPTION_SUSPENDED
      : status === SUBSCRIPTION_STATES.CANCELLED
        ? SUBSCRIPTION_AUDIT_ACTIONS.SUBSCRIPTION_CANCELLED
        : SUBSCRIPTION_AUDIT_ACTIONS.SUBSCRIPTION_REACTIVATED;

    this.logAudit(action, sub.id, sub.tenant_id, adminEmail, adminRole, 'SUCCESS', { prevStatus: prev, newStatus: status, reason });
    return sub;
  }

  public renewSubscription(params: {
    id: string;
    new_end_date: string;
    payment_reference: string;
    admin_email: string;
    admin_role: string;
    otp_session_id: string;
    otp_code: string;
  }): SubscriptionRecord {
    const verifyRes = subscriptionOtpService.verifyAdminOtp(params.otp_session_id, params.otp_code);
    if (!verifyRes.valid) throw new Error(verifyRes.error || 'Invalid Admin OTP');
    subscriptionOtpService.consumeVerifiedSession(params.otp_session_id);

    const sub = subscriptionStore.getSubscriptionById(params.id);
    if (!sub) throw new Error('Subscription not found');

    sub.end_date = params.new_end_date;
    sub.payment_reference = params.payment_reference;
    sub.status = SUBSCRIPTION_STATES.ACTIVE;
    sub.commercial_status = COMMERCIAL_STATUS.COMPLETED;
    sub.updated_at = new Date().toISOString();

    this.logAudit(SUBSCRIPTION_AUDIT_ACTIONS.SUBSCRIPTION_RENEWED, sub.id, sub.tenant_id, params.admin_email, params.admin_role, 'SUCCESS', { newEndDate: params.new_end_date });
    return sub;
  }

  public logAudit(
    action: string,
    subscriptionId: string,
    tenantId: string,
    actor: string,
    actorRole: string,
    result: 'SUCCESS' | 'FAILURE',
    details?: Record<string, unknown>
  ): void {
    subscriptionStore.addAuditEvent({
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      subscription_id: subscriptionId,
      tenant_id: tenantId,
      actor,
      actor_role: actorRole,
      action: action as import('../types/subscription').SubscriptionAuditAction,
      result,
      details
    });
  }

  public getSubscriptionById(id: string): SubscriptionRecord | null {
    return subscriptionStore.getSubscriptionById(id);
  }

  public getAllSubscriptions(): SubscriptionRecord[] {
    return subscriptionStore.listSubscriptions();
  }

  public getAuditEvents(subId?: string): SubscriptionAuditEvent[] {
    return subscriptionStore.getAuditTrail(subId);
  }

  public reset(): void {
    subscriptionStore.reset();
  }
}

export const subscriptionService = new SubscriptionService();
