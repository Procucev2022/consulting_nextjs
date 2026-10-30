import { z } from 'zod';
import { COMMERCIAL_WORKFLOW } from './commercialWorkflow';

const email = z.string().trim().email().max(254);
const tier = z.enum(['BRONZE', 'SILVER', 'GOLD']);
const otpCode = z.string().regex(new RegExp(`^\\d{${COMMERCIAL_WORKFLOW.otpDigits}}$`));

export const upgradeRequestSchema = z.object({
  customer_name: z.string().trim().min(1).max(120),
  customer_email: email,
  customer_phone: z.string().trim().min(7).max(32),
  company_name: z.string().trim().min(1).max(160),
  company_details: z.string().trim().max(1000).optional(),
  current_tier: tier,
  requested_tier: z.enum(['SILVER', 'GOLD', 'ENTERPRISE']),
  requirements_note: z.string().trim().max(COMMERCIAL_WORKFLOW.maxRequestNoteLength).optional()
}).refine((value) => value.current_tier !== value.requested_tier, {
  message: 'Choose a tier different from the current subscription.',
  path: ['requested_tier']
});

export const upgradeRequestQuerySchema = z.object({
  status: z.enum(['ALL', 'PENDING_ADMIN_ACTION', 'OTP_VERIFIED_CODE_SENT', 'UPGRADE_COMPLETED', 'REJECTED']).optional()
});

export const commercialOtpRequestSchema = z.object({
  request_id: z.string().trim().min(1).max(120).optional(),
  requestId: z.string().trim().min(1).max(120).optional(),
  customer_id: z.string().trim().min(1).max(120).optional(),
  action: z.literal('PROVISION').optional()
}).refine((value) => Boolean(value.request_id || value.requestId || value.customer_id), {
  message: 'Specify the upgrade request or subscription customer for OTP authorization.'
});

export const commercialOtpVerifySchema = z.object({
  request_id: z.string().trim().min(1).max(120).optional(),
  requestId: z.string().trim().min(1).max(120).optional(),
  otp_session_id: z.string().trim().min(1).max(120).optional(),
  otp: otpCode.optional(),
  otp_code: otpCode.optional()
}).refine((value) => Boolean(value.request_id || value.requestId || value.otp_session_id), {
  message: 'The OTP session reference is required.'
}).refine((value) => Boolean(value.otp || value.otp_code), {
  message: 'Enter the six-digit authorization code.'
});

export const upgradeCodeLoginSchema = z.object({
  email,
  code: z.string().trim().min(12).max(120)
});

export const subscriptionProvisionSchema = z.object({
  tenant_id: z.string().trim().min(1).max(120),
  customer_id: z.string().trim().min(1).max(120),
  customer_email: email,
  customer_name: z.string().trim().min(1).max(120),
  company_name: z.string().trim().min(1).max(160),
  tier: z.enum(['SILVER', 'GOLD']),
  commercial_status: z.literal('PAYMENT_RECEIVED'),
  payment_reference: z.string().trim().min(1).max(120),
  payment_confirmed: z.literal(true),
  otp_session_id: z.string().trim().min(1).max(120),
  otp_code: z.string().regex(/^\d{6}$/)
});

export const subscriptionStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'CANCELLED'])
});

export const adminProvisionSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email,
  mobile_number: z.string().trim().min(7).max(32),
  company_name: z.string().trim().min(2).max(160),
  company_address: z.string().trim().min(2).max(500),
  password: z.string().min(8).max(128),
  role: z.literal('ADMIN').optional(),
  subscription_tier: z.literal('GOLD').optional()
});
