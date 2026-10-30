import { describe, expect, it } from 'vitest';
import {
  commercialOtpRequestSchema,
  commercialOtpVerifySchema,
  subscriptionProvisionSchema,
  subscriptionStatusSchema,
  upgradeCodeLoginSchema,
  upgradeRequestQuerySchema,
  upgradeRequestSchema
} from '../../src/constants/commercialValidation';

const upgrade = {
  customer_name: 'Asha Rao',
  customer_email: 'asha@example.com',
  customer_phone: '+919812345678',
  company_name: 'Rao Textiles',
  current_tier: 'BRONZE',
  requested_tier: 'SILVER'
};

const provision = {
  tenant_id: 'T-1',
  customer_id: 'C-1',
  customer_email: 'asha@example.com',
  customer_name: 'Asha Rao',
  company_name: 'Rao Textiles',
  tier: 'SILVER',
  commercial_status: 'PAYMENT_RECEIVED',
  payment_reference: 'INV-1',
  payment_confirmed: true,
  otp_session_id: 'OTP-1',
  otp_code: '123456'
};

describe('commercial workflow input schemas', () => {
  it('validates public upgrade enquiries and enforces a different tier', () => {
    expect(upgradeRequestSchema.safeParse(upgrade).success).toBe(true);
    expect(upgradeRequestSchema.safeParse({ ...upgrade, current_tier: 'SILVER' }).success).toBe(false);
    expect(upgradeRequestSchema.safeParse({ ...upgrade, customer_email: 'invalid' }).success).toBe(false);
  });

  it('supports admin request filters and rejects unsupported statuses', () => {
    expect(upgradeRequestQuerySchema.safeParse({}).success).toBe(true);
    expect(upgradeRequestQuerySchema.safeParse({ status: 'PENDING_ADMIN_ACTION' }).success).toBe(true);
    expect(upgradeRequestQuerySchema.safeParse({ status: 'OPEN' }).success).toBe(false);
  });

  it('requires an upgrade or provisioning target when requesting an admin OTP', () => {
    expect(commercialOtpRequestSchema.safeParse({ request_id: 'REQ-1' }).success).toBe(true);
    expect(commercialOtpRequestSchema.safeParse({ customer_id: 'C-1', action: 'PROVISION' }).success).toBe(true);
    expect(commercialOtpRequestSchema.safeParse({}).success).toBe(false);
    expect(commercialOtpRequestSchema.safeParse({ request_id: 'REQ-1', action: 'DELETE' }).success).toBe(false);
  });

  it('requires an OTP session and six-digit code through either supported field name', () => {
    expect(commercialOtpVerifySchema.safeParse({ request_id: 'REQ-1', otp: '123456' }).success).toBe(true);
    expect(commercialOtpVerifySchema.safeParse({ otp_session_id: 'OTP-1', otp_code: '123456' }).success).toBe(true);
    expect(commercialOtpVerifySchema.safeParse({ request_id: 'REQ-1', otp: '12' }).success).toBe(false);
    expect(commercialOtpVerifySchema.safeParse({ otp: '123456' }).success).toBe(false);
    expect(commercialOtpVerifySchema.safeParse({ request_id: 'REQ-1' }).success).toBe(false);
  });

  it('validates one-time upgrade login credentials', () => {
    expect(upgradeCodeLoginSchema.safeParse({ email: upgrade.customer_email, code: '123456789012' }).success)
      .toBe(true);
    expect(upgradeCodeLoginSchema.safeParse({ email: 'bad', code: 'short' }).success).toBe(false);
  });

  it('requires verified payment details and an OTP for provisioning', () => {
    expect(subscriptionProvisionSchema.safeParse(provision).success).toBe(true);
    expect(subscriptionProvisionSchema.safeParse({ ...provision, payment_confirmed: false }).success).toBe(false);
    expect(subscriptionProvisionSchema.safeParse({ ...provision, otp_code: 'bad' }).success).toBe(false);
  });

  it('accepts only supported subscription status transitions', () => {
    expect(subscriptionStatusSchema.safeParse({ status: 'ACTIVE' }).success).toBe(true);
    expect(subscriptionStatusSchema.safeParse({ status: 'EXPIRED' }).success).toBe(false);
  });
});
