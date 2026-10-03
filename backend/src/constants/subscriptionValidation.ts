/**
 * Subscription Validation Schemas (Prompt 288)
 */

import { z } from 'zod';
import { SUBSCRIPTION_TIERS, SUBSCRIPTION_STATES, COMMERCIAL_STATUS } from './subscription';

export const provisionSubscriptionSchema = z.object({
  customer_id: z.string().min(1, 'customer_id is required'),
  tenant_id: z.string().min(1, 'tenant_id is required'),
  customer_email: z.string().email('Valid customer email is required'),
  customer_name: z.string().min(1, 'customer_name is required'),
  company_name: z.string().min(1, 'company_name is required'),
  tier: z.enum([SUBSCRIPTION_TIERS.SILVER, SUBSCRIPTION_TIERS.GOLD]),
  commercial_status: z.enum([
    COMMERCIAL_STATUS.QUOTED,
    COMMERCIAL_STATUS.INVOICED,
    COMMERCIAL_STATUS.PAYMENT_RECEIVED,
    COMMERCIAL_STATUS.COMPLETED
  ]),
  payment_reference: z.string().min(1, 'Offline payment reference is required'),
  payment_confirmed: z.literal(true, {
    message: 'Admin must confirm offline payment receipt'
  }),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  duration_days: z.number().optional(),
  otp_session_id: z.string().min(1, 'Admin OTP session ID is required'),
  otp_code: z.string().regex(/^\d{6}$/, 'Admin OTP must be 6 digits')
});

export const requestAdminSubscriptionOtpSchema = z.object({
  customer_id: z.string().min(1, 'customer_id is required'),
  action: z.enum(['PROVISION', 'RENEW', 'STATUS_CHANGE']).default('PROVISION')
});

export const activateSubscriptionSchema = z.object({
  email: z.string().email('Valid email is required').optional(),
  customer_email: z.string().email('Valid email is required').optional(),
  activation_code: z.string().min(8, 'Valid activation code is required')
});

export const updateSubscriptionStatusSchema = z.object({
  status: z.enum([
    SUBSCRIPTION_STATES.ACTIVE,
    SUBSCRIPTION_STATES.SUSPENDED,
    SUBSCRIPTION_STATES.CANCELLED
  ]),
  reason: z.string().optional()
});

export const renewSubscriptionSchema = z.object({
  end_date: z.string().optional(),
  new_end_date: z.string().optional(),
  payment_reference: z.string().min(1, 'Renewal payment reference is required'),
  otp_session_id: z.string().min(1, 'Admin OTP session ID is required'),
  otp_code: z.string().regex(/^\d{6}$/, 'Admin OTP must be 6 digits')
});
