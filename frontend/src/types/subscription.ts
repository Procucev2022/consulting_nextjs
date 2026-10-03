/**
 * Subscription, Entitlement & Activation Types (Frontend Prompt 288)
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

export interface SubscriptionAuditEvent {
  id: string;
  timestamp: string;
  subscription_id: string;
  tenant_id: string;
  actor: string;
  actor_role: string;
  action: string;
  result: 'SUCCESS' | 'FAILURE';
  details?: Record<string, unknown>;
}

export interface CustomerPlanDisplayProps {
  currentTier: SubscriptionTier;
  planInfo?: CustomerPlanInfo | null;
  onRequestUpgrade?: (targetTier: 'SILVER' | 'GOLD') => void;
  isAdmin?: boolean;
}

export interface ActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerEmail: string;
  onActivationSuccess: (sub: SubscriptionRecord) => void;
}

export interface CommercialEnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: SubscriptionTier;
  targetTier: 'SILVER' | 'GOLD';
  customerName?: string;
  customerEmail?: string;
  companyName?: string;
}

export interface ProvisionSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProvisionSuccess: (sub: SubscriptionRecord) => void;
}
