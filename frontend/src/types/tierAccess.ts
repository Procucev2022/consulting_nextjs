/**
 * Subscription Tier Access & Feature Capability Types (Frontend)
 */

import type { SubscriptionTier } from './auth';

export interface TierCapabilities {
  tier: SubscriptionTier;
  canUploadData: boolean;
  canViewSavingsAvailabilitySummary: boolean;
  canViewStage1Details: boolean;
  canViewStage2Summary: boolean;
  canViewStage2Details: boolean;
  canViewStage3Summary: boolean;
  canViewStage3Details: boolean;
  canViewStage4Summary: boolean;
  canViewStage4Details: boolean;
  canViewStage5TotalSavingsValue: boolean;
  canViewStage5SavingsLocationsAndActions: boolean;
}

export interface TierMaskOverlayProps {
  requiredTier: SubscriptionTier;
  title: string;
  description: string;
  onUpgrade?: () => void;
  ctaText?: string;
  isSummaryVisible?: boolean;
}
