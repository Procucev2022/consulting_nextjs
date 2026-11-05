import { z } from 'zod';
import { UI_STRINGS } from './uiStrings';

const provisionStrings = UI_STRINGS.subscription.provisionModal.inputValidation;

export const provisionSubscriptionDetailsSchema = z.object({
  tenantId: z.string().trim().min(1, provisionStrings.tenantIdRequired).max(120),
  customerId: z.string().trim().min(1, provisionStrings.customerIdRequired).max(120),
  customerEmail: z.string().trim().email(provisionStrings.emailInvalid).max(254),
  customerName: z.string().trim().min(1, provisionStrings.customerNameRequired).max(120),
  companyName: z.string().trim().min(1, provisionStrings.companyNameRequired).max(160),
  tier: z.enum(['SILVER', 'GOLD']),
  paymentReference: z.string().trim().min(1, provisionStrings.paymentReferenceRequired).max(120)
});

export const provisionSubscriptionOtpSchema = z.object({
  otpSessionId: z.string().trim().min(1, provisionStrings.otpSessionRequired).max(120),
  otpCode: z.string().regex(/^\d{6}$/, provisionStrings.otpInvalid)
});

export const provisionSubscriptionOtpRequestSchema = z.object({
  customer_id: z.string().trim().min(1, provisionStrings.customerIdRequired).max(120),
  action: z.literal('PROVISION')
}).strict();

export const provisionSubscriptionRequestSchema = z.object({
  tenant_id: z.string().trim().min(1, provisionStrings.tenantIdRequired).max(120),
  customer_id: z.string().trim().min(1, provisionStrings.customerIdRequired).max(120),
  customer_email: z.string().trim().email(provisionStrings.emailInvalid).max(254),
  customer_name: z.string().trim().min(1, provisionStrings.customerNameRequired).max(120),
  company_name: z.string().trim().min(1, provisionStrings.companyNameRequired).max(160),
  tier: z.enum(['SILVER', 'GOLD']),
  commercial_status: z.literal('PAYMENT_RECEIVED'),
  payment_reference: z.string().trim().min(1, provisionStrings.paymentReferenceRequired).max(120),
  payment_confirmed: z.literal(true),
  otp_session_id: z.string().trim().min(1, provisionStrings.otpSessionRequired).max(120),
  otp_code: z.string().regex(/^\d{6}$/, provisionStrings.otpInvalid)
}).strict();

export const provisionSubscriptionOtpResponseSchema = z.object({
  success: z.literal(true),
  session_id: z.string().trim().min(1),
  otp_hint: z.string().optional()
}).passthrough();

export const provisionSubscriptionResponseSchema = z.object({
  success: z.literal(true),
  subscription: z.object({
    id: z.string().min(1),
    tenant_id: z.string().min(1),
    customer_id: z.string().min(1),
    customer_email: z.string().email(),
    customer_name: z.string().min(1),
    company_name: z.string().min(1),
    tier: z.enum(['BRONZE', 'SILVER', 'GOLD']),
    status: z.enum(['FREE', 'PENDING_ACTIVATION', 'ACTIVE', 'SUSPENDED', 'EXPIRED', 'CANCELLED']),
    commercial_status: z.enum(['FREE_TIER', 'QUOTED', 'INVOICED', 'PAYMENT_RECEIVED', 'COMPLETED']),
    payment_confirmed: z.boolean(),
    start_date: z.string().datetime(),
    end_date: z.string().datetime(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime()
  }).passthrough()
}).passthrough();
