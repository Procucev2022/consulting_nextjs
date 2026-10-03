/**
 * Subscription, Entitlement & Activation Types (Prompt 288)
 */

import type { SubscriptionTier } from './auth';

export type { SubscriptionTier };

export type SubscriptionState =
  | 'FREE'
  | 'PENDING_ACTIVATION'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'EXPIRED'
  | 'CANCELLED';

export type CommercialStatus =
  | 'FREE_TIER'
  | 'QUOTED'
  | 'INVOICED'
  | 'PAYMENT_RECEIVED'
  | 'COMPLETED';

export type SubscriptionAuditAction =
  | 'SUBSCRIPTION_CREATED'
  | 'SUBSCRIPTION_PROVISIONED'
  | 'OTP_REQUESTED'
  | 'OTP_VERIFIED'
  | 'OTP_FAILED'
  | 'ACTIVATION_CODE_GENERATED'
  | 'ACTIVATION_EMAIL_SENT'
  | 'ACTIVATION_ATTEMPTED'
  | 'ACTIVATION_SUCCEEDED'
  | 'ACTIVATION_FAILED'
  | 'SUBSCRIPTION_ACTIVATED'
  | 'SUBSCRIPTION_UPGRADED'
  | 'SUBSCRIPTION_DOWNGRADED'
  | 'SUBSCRIPTION_RENEWED'
  | 'SUBSCRIPTION_SUSPENDED'
  | 'SUBSCRIPTION_REACTIVATED'
  | 'SUBSCRIPTION_CANCELLED'
  | 'SUBSCRIPTION_EXPIRED';

export interface SubscriptionRecord {
  id: string;
  tenant_id: string;
  customer_id: string;
  customer_email: string;
  customer_name: string;
  company_name: string;
  tier: SubscriptionTier;
  status: SubscriptionState;
  commercial_status: CommercialStatus;
  payment_reference?: string;
  payment_confirmed: boolean;
  start_date: string;
  end_date: string;
  provisioned_by?: string;
  provisioned_at?: string;
  activated_by?: string;
  activated_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ActivationCodeRecord {
  id: string;
  subscription_id: string;
  tenant_id: string;
  customer_email: string;
  code_hash: string;
  code_prefix: string; // e.g. PCV-****
  created_at: string;
  expires_at: string;
  used: boolean;
  used_at?: string;
  attempt_count: number;
  locked: boolean;
}

export interface AdminSubscriptionOtpSession {
  id: string;
  admin_email: string;
  admin_mobile: string;
  customer_id: string;
  otp_hash: string;
  created_at: number;
  expires_at: number;
  attempts: number;
  verified: boolean;
  action: 'PROVISION' | 'RENEW' | 'STATUS_CHANGE';
}

export interface SubscriptionAuditEvent {
  id: string;
  timestamp: string;
  subscription_id: string;
  tenant_id: string;
  actor: string;
  actor_role: string;
  action: SubscriptionAuditAction;
  result: 'SUCCESS' | 'FAILURE';
  details?: Record<string, unknown>;
}

export interface CustomerPlanInfo {
  tier: SubscriptionTier;
  status: SubscriptionState;
  commercial_status: CommercialStatus;
  is_active: boolean;
  is_pending_activation: boolean;
  start_date: string;
  end_date: string;
  entitled_features: string[];
}
