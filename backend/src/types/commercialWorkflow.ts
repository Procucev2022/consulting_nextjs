import type { COMMERCIAL_WORKFLOW } from '../constants/commercialWorkflow';
import type { AuthRouteResult, CloudflareD1Database } from './cloudflare';

export type CommercialUpgradeStatus = typeof COMMERCIAL_WORKFLOW.upgradeStatus[
  keyof typeof COMMERCIAL_WORKFLOW.upgradeStatus
];
export type CommercialSubscriptionStatus = typeof COMMERCIAL_WORKFLOW.subscriptionStatus[
  keyof typeof COMMERCIAL_WORKFLOW.subscriptionStatus
];
export type CommercialOtpPurpose = typeof COMMERCIAL_WORKFLOW.otpPurpose[keyof typeof COMMERCIAL_WORKFLOW.otpPurpose];

export interface UpgradeRequestD1Row {
  id: string;
  customer_user_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  company_name: string;
  company_details: string | null;
  current_tier: string;
  requested_tier: string;
  requirements_note: string | null;
  status: CommercialUpgradeStatus;
  generated_unique_code_hash: string | null;
  code_generated_at: string | null;
  code_expires_at: number | null;
  code_redeemed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminOtpSessionD1Row {
  id: string;
  purpose: CommercialOtpPurpose;
  request_id: string | null;
  customer_id: string | null;
  requested_by: string;
  otp_hash: string;
  expires_at: number;
  attempts: number;
  verified_at: string | null;
  created_at: string;
}

export interface SubscriptionRecordD1Row {
  id: string;
  tenant_id: string;
  customer_id: string;
  customer_email: string;
  customer_name: string;
  company_name: string;
  tier: string;
  status: CommercialSubscriptionStatus;
  commercial_status: string;
  payment_reference: string | null;
  payment_confirmed: number;
  start_date: string;
  end_date: string;
  provisioned_by: string | null;
  provisioned_at: string | null;
  activated_by: string | null;
  activated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommercialActor {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN';
}

export type CommercialAdminAuthorization =
  | { actor: CommercialActor; db: CloudflareD1Database; result: null }
  | { actor: null; db: null; result: AuthRouteResult };

export interface ResendEmailResponse {
  id?: string;
  message?: string;
  error?: { message?: string };
}
