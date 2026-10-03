import { describe, it, expect, beforeEach, vi } from 'vitest';
import { subscriptionService } from '../../src/services/subscriptionService';
import { subscriptionOtpService } from '../../src/services/subscriptionOtpService';
import { smsService } from '../../src/services/smsService';
import {
  FEATURE_PERMISSIONS,
  SUBSCRIPTION_TIERS,
  SUBSCRIPTION_STATES,
  COMMERCIAL_STATUS
} from '../../src/constants/subscription';

describe('SubscriptionService', () => {
  let capturedOtp = '';

  beforeEach(() => {
    subscriptionService.reset();
    subscriptionOtpService.resetSessions();
    capturedOtp = '';
    vi.spyOn(smsService, 'sendAdminProvisioningOtp').mockImplementation(async (_mobile, otp) => {
      capturedOtp = otp;
      return { success: true, destination: '******3210' };
    });
  });

  it('determines entitlement accurately across Bronze, Silver, Gold', () => {
    expect(subscriptionService.can('TNT-BRONZE-CLIENT', FEATURE_PERMISSIONS.SPEND_SUMMARY)).toBe(true);
    expect(subscriptionService.can('TNT-BRONZE-CLIENT', FEATURE_PERMISSIONS.SAVINGS_INDICATOR)).toBe(true);
    expect(subscriptionService.can('TNT-BRONZE-CLIENT', FEATURE_PERMISSIONS.TOTAL_SAVINGS)).toBe(false);
    expect(subscriptionService.can('TNT-BRONZE-CLIENT', FEATURE_PERMISSIONS.MODULE_2_FULL)).toBe(false);
    expect(subscriptionService.can('TNT-BRONZE-CLIENT', FEATURE_PERMISSIONS.PCBI_DETAIL)).toBe(false);

    expect(subscriptionService.can('TNT-SILVER-CLIENT', FEATURE_PERMISSIONS.TOTAL_SAVINGS)).toBe(true);
    expect(subscriptionService.can('TNT-SILVER-CLIENT', FEATURE_PERMISSIONS.MODULE_2_SUMMARY)).toBe(true);
    expect(subscriptionService.can('TNT-SILVER-CLIENT', FEATURE_PERMISSIONS.SUPPLIER_OPPORTUNITY)).toBe(false);

    expect(subscriptionService.can('TNT-GLOBAL-8902', FEATURE_PERMISSIONS.TOTAL_SAVINGS)).toBe(true);
    expect(subscriptionService.can('TNT-GLOBAL-8902', FEATURE_PERMISSIONS.SUPPLIER_OPPORTUNITY)).toBe(true);
    expect(subscriptionService.can('TNT-GLOBAL-8902', FEATURE_PERMISSIONS.MODULE_2_FULL)).toBe(true);
  });

  it('allows all features for authorized admins regardless of tenant tier', () => {
    expect(subscriptionService.can('TNT-BRONZE-CLIENT', FEATURE_PERMISSIONS.MODULE_2_FULL, true)).toBe(true);
    expect(subscriptionService.can('TNT-BRONZE-CLIENT', FEATURE_PERMISSIONS.PCBI_DETAIL, true)).toBe(true);
  });

  it('restricts paid entitlements when subscription is suspended, expired, or pending', () => {
    expect(subscriptionService.can('TNT-SUSPENDED-CLIENT', FEATURE_PERMISSIONS.TOTAL_SAVINGS)).toBe(false);
    expect(subscriptionService.can('TNT-EXPIRED-CLIENT', FEATURE_PERMISSIONS.TOTAL_SAVINGS)).toBe(false);
    expect(subscriptionService.can('TNT-PENDING-CLIENT', FEATURE_PERMISSIONS.TOTAL_SAVINGS)).toBe(false);
  });

  it('provisions new subscription with admin OTP verification and generates code', async () => {
    const adminEmail = 'admin@procucev.com';
    const otpRes = await subscriptionOtpService.generateAdminOtp(adminEmail, '+919876543210', 'usr-test');

    const provisionRes = subscriptionService.provisionSubscription({
      tenant_id: 'TNT-NEW-01',
      customer_id: 'usr-test',
      customer_email: 'newuser@enterprise.com',
      customer_name: 'Jane Doe',
      company_name: 'Acme Corp',
      tier: 'GOLD',
      commercial_status: COMMERCIAL_STATUS.PAYMENT_RECEIVED,
      payment_reference: 'OFFLINE-INV-9901',
      admin_email: adminEmail,
      admin_role: 'ADMIN',
      otp_session_id: otpRes.sessionId,
      otp_code: capturedOtp
    });

    expect(provisionRes.subscription.status).toBe(SUBSCRIPTION_STATES.PENDING_ACTIVATION);
    expect(provisionRes.subscription.tier).toBe('GOLD');
    expect(provisionRes.activationCode).toBeDefined();

    const activateRes = subscriptionService.activateCustomerSubscription(
      'newuser@enterprise.com',
      provisionRes.activationCode,
      'TNT-NEW-01'
    );
    expect(activateRes.subscription.status).toBe(SUBSCRIPTION_STATES.ACTIVE);
    expect(subscriptionService.can('TNT-NEW-01', FEATURE_PERMISSIONS.TOTAL_SAVINGS)).toBe(true);
  });

  it('rejects provisioning when OTP is invalid', async () => {
    const adminEmail = 'admin@procucev.com';
    const otpRes = await subscriptionOtpService.generateAdminOtp(adminEmail, '+919876543210', 'usr-err');

    expect(() => {
      subscriptionService.provisionSubscription({
        tenant_id: 'TNT-ERR-01',
        customer_id: 'usr-err',
        customer_email: 'err@enterprise.com',
        customer_name: 'Err User',
        company_name: 'Err Corp',
        tier: 'GOLD',
        commercial_status: COMMERCIAL_STATUS.PAYMENT_RECEIVED,
        payment_reference: 'INV-000',
        admin_email: adminEmail,
        admin_role: 'ADMIN',
        otp_session_id: otpRes.sessionId,
        otp_code: '000000'
      });
    }).toThrow();
  });

  it('handles subscription lifecycle: suspend, reactivate, cancel, renew', async () => {
    const sub = subscriptionService.getSubscriptionByTenantId('TNT-SILVER-CLIENT');

    const suspended = subscriptionService.updateStatus(sub.id, 'SUSPENDED', 'admin@procucev.com', 'ADMIN', 'Payment dispute');
    expect(suspended.status).toBe('SUSPENDED');
    expect(subscriptionService.can('TNT-SILVER-CLIENT', FEATURE_PERMISSIONS.TOTAL_SAVINGS)).toBe(false);

    const active = subscriptionService.updateStatus(sub.id, 'ACTIVE', 'admin@procucev.com', 'ADMIN');
    expect(active.status).toBe('ACTIVE');
    expect(subscriptionService.can('TNT-SILVER-CLIENT', FEATURE_PERMISSIONS.TOTAL_SAVINGS)).toBe(true);

    const otpRes = await subscriptionOtpService.generateAdminOtp('admin@procucev.com', '+919876543210', sub.customer_id, 'RENEW');
    const renewed = subscriptionService.renewSubscription({
      id: sub.id,
      new_end_date: new Date(Date.now() + 730 * 86400000).toISOString(),
      payment_reference: 'RENEW-9988',
      admin_email: 'admin@procucev.com',
      admin_role: 'ADMIN',
      otp_session_id: otpRes.sessionId,
      otp_code: capturedOtp
    });
    expect(renewed.payment_reference).toBe('RENEW-9988');

    const cancelled = subscriptionService.updateStatus(sub.id, 'CANCELLED', 'admin@procucev.com', 'ADMIN', 'Client churned');
    expect(cancelled.status).toBe('CANCELLED');
    expect(subscriptionService.can('TNT-SILVER-CLIENT', FEATURE_PERMISSIONS.TOTAL_SAVINGS)).toBe(false);
  });

  it('rejects illegal state transitions according to Prompt 289 state machine', () => {
    const sub = subscriptionService.getSubscriptionByTenantId('TNT-SILVER-CLIENT');
    subscriptionService.updateStatus(sub.id, 'CANCELLED', 'admin@procucev.com', 'ADMIN');

    // CANCELLED -> ACTIVE is illegal without renewal
    expect(() => {
      subscriptionService.updateStatus(sub.id, 'ACTIVE', 'admin@procucev.com', 'ADMIN');
    }).toThrow(/CANCELLED subscription cannot be changed to ACTIVE/i);

    // PENDING_ACTIVATION -> ACTIVE is illegal without activation code
    const pendingSub = subscriptionService.getSubscriptionByTenantId('TNT-PENDING-CLIENT');
    expect(() => {
      subscriptionService.updateStatus(pendingSub.id, 'ACTIVE', 'admin@procucev.com', 'ADMIN');
    }).toThrow(/PENDING_ACTIVATION requires customer activation code redemption/i);
  });

  it('provides public customer plan info and admin simulation', () => {
    const plan = subscriptionService.getCustomerPlanInfo('TNT-BRONZE-CLIENT');
    expect(plan.tier).toBe('BRONZE');
    expect(plan.entitled_features).toContain(FEATURE_PERMISSIONS.SPEND_SUMMARY);
    expect(plan.entitled_features).not.toContain(FEATURE_PERMISSIONS.TOTAL_SAVINGS);

    // Admin simulator test
    const sim = subscriptionService.simulateTier('GOLD', true);
    expect(sim.tier).toBe('GOLD');
    expect(sim.is_simulation).toBe(true);
    expect(sim.entitled_features).toContain(FEATURE_PERMISSIONS.MODULE_2_FULL);

    // Non-admin simulation rejected
    expect(() => subscriptionService.simulateTier('GOLD', false)).toThrow(/restricted to authorized administrators/i);
  });

  it('records immutable audit events and allows querying by subscriptionId', () => {
    const allEvents = subscriptionService.getAuditEvents();
    expect(Array.isArray(allEvents)).toBe(true);

    const sub = subscriptionService.getSubscriptionByTenantId('TNT-SILVER-CLIENT');
    const subEvents = subscriptionService.getAuditEvents(sub.id);
    expect(Array.isArray(subEvents)).toBe(true);
  });

  it('handles unknown tenant by auto-generating bronze subscription', () => {
    const unknown = subscriptionService.getSubscriptionByTenantId('TNT-UNKNOWN-1234');
    expect(unknown.tier).toBe(SUBSCRIPTION_TIERS.BRONZE);
    expect(unknown.status).toBe(SUBSCRIPTION_STATES.FREE);
  });

  it('handles getSubscriptionById for existing and non-existing subscriptions', () => {
    const sub = subscriptionService.getSubscriptionByTenantId('TNT-BRONZE-CLIENT');
    expect(subscriptionService.getSubscriptionById(sub.id)).not.toBeNull();
    expect(subscriptionService.getSubscriptionById('sub-does-not-exist')).toBeNull();
  });

  it('throws error when renewing with invalid OTP or non-existent subscription', async () => {
    expect(() => {
      subscriptionService.renewSubscription({
        id: 'sub-silver-demo',
        new_end_date: new Date().toISOString(),
        payment_reference: 'REF-1',
        admin_email: 'admin@test.com',
        admin_role: 'ADMIN',
        otp_session_id: 'sess-invalid',
        otp_code: '123456'
      });
    }).toThrow(/Admin mobile OTP verification/i);

    const otpRes = await subscriptionOtpService.generateAdminOtp('admin@test.com', '+919876543210', 'usr-test', 'RENEW');
    expect(() => {
      subscriptionService.renewSubscription({
        id: 'sub-unknown',
        new_end_date: new Date().toISOString(),
        payment_reference: 'REF-1',
        admin_email: 'admin@test.com',
        admin_role: 'ADMIN',
        otp_session_id: otpRes.sessionId,
        otp_code: capturedOtp
      });
    }).toThrow(/not found/i);
  });

  it('throws error when activating with wrong tenant or cancelled subscription', async () => {
    const otpRes = await subscriptionOtpService.generateAdminOtp('admin@procucev.com', '+919876543210', 'usr-cancel-test');
    const prov = subscriptionService.provisionSubscription({
      tenant_id: 'TNT-CANCEL-TEST',
      customer_id: 'usr-cancel-test',
      customer_email: 'cancel@test.com',
      customer_name: 'Cancel User',
      company_name: 'Cancel Co',
      tier: 'SILVER',
      commercial_status: COMMERCIAL_STATUS.PAYMENT_RECEIVED,
      admin_email: 'admin@procucev.com',
      admin_role: 'ADMIN',
      otp_session_id: otpRes.sessionId,
      otp_code: capturedOtp
    });

    // Cross-tenant activation rejected
    expect(() => {
      subscriptionService.activateCustomerSubscription('cancel@test.com', prov.activationCode, 'TNT-DIFFERENT');
    }).toThrow();

    // Cancel and verify activation rejected
    subscriptionService.updateStatus(prov.subscription.id, 'CANCELLED', 'admin@procucev.com', 'ADMIN');
    expect(() => {
      subscriptionService.activateCustomerSubscription('cancel@test.com', prov.activationCode, 'TNT-CANCEL-TEST');
    }).toThrow(/Cannot activate cancelled subscription/i);
  });
});
