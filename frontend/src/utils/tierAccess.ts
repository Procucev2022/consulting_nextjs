/**
 * Subscription Tier Capability & Access Management Utility (Frontend)
 */

import type { SubscriptionTier, UserProfile, TierCapabilities } from '../types';
import frontendLogger from './logger';

const TIER_HIERARCHY: Record<SubscriptionTier, number> = {
  BRONZE: 1,
  SILVER: 2,
  GOLD: 3
};

/**
 * Returns complete feature capability matrix for a specific subscription tier
 */
export const getTierCapabilities = (tier: SubscriptionTier): TierCapabilities => {
  switch (tier) {
    case 'BRONZE':
      return {
        tier: 'BRONZE',
        canUploadData: true,
        canViewSavingsAvailabilitySummary: true,
        canViewStage1Details: true,
        canViewStage2Summary: false,
        canViewStage2Details: false,
        canViewStage3Summary: false,
        canViewStage3Details: false,
        canViewStage4Summary: false,
        canViewStage4Details: false,
        canViewStage5TotalSavingsValue: false,
        canViewStage5SavingsLocationsAndActions: false
      };
    case 'SILVER':
      return {
        tier: 'SILVER',
        canUploadData: true,
        canViewSavingsAvailabilitySummary: true,
        canViewStage1Details: true,
        canViewStage2Summary: true,
        canViewStage2Details: false,
        canViewStage3Summary: true,
        canViewStage3Details: false,
        canViewStage4Summary: true,
        canViewStage4Details: false,
        canViewStage5TotalSavingsValue: true,
        canViewStage5SavingsLocationsAndActions: false
      };
    case 'GOLD':
    default:
      return {
        tier: 'GOLD',
        canUploadData: true,
        canViewSavingsAvailabilitySummary: true,
        canViewStage1Details: true,
        canViewStage2Summary: true,
        canViewStage2Details: true,
        canViewStage3Summary: true,
        canViewStage3Details: true,
        canViewStage4Summary: true,
        canViewStage4Details: true,
        canViewStage5TotalSavingsValue: true,
        canViewStage5SavingsLocationsAndActions: true
      };
  }
};

/**
 * Resolves the effective active tier considering user profile and simulated tier
 */
export const getEffectiveUserTier = (
  user: UserProfile | null,
  simulatedTier: SubscriptionTier | null
): SubscriptionTier => {
  if (simulatedTier) {
    return simulatedTier;
  }
  if (!user) {
    return 'BRONZE';
  }
  if (user.role === 'ADMIN') {
    return 'GOLD';
  }
  return user.subscription_tier || 'BRONZE';
};

/**
 * Validates if the current tier meets or exceeds the required tier threshold
 */
export const hasMinimumTier = (
  currentTier: SubscriptionTier,
  requiredTier: SubscriptionTier
): boolean => {
  const currentLevel = TIER_HIERARCHY[currentTier] || 1;
  const requiredLevel = TIER_HIERARCHY[requiredTier] || 1;
  return currentLevel >= requiredLevel;
};

/**
 * Determines whether a specific pipeline module (1 to 5) has its detail view masked
 */
export const isModuleDetailsMasked = (
  currentTier: SubscriptionTier,
  moduleNumber: number
): boolean => {
  const caps = getTierCapabilities(currentTier);
  switch (moduleNumber) {
    case 1:
      return !caps.canViewStage1Details;
    case 2:
      return !caps.canViewStage2Details;
    case 3:
      return !caps.canViewStage3Details;
    case 4:
      return !caps.canViewStage4Details;
    case 5:
      return !caps.canViewStage5SavingsLocationsAndActions;
    default:
      frontendLogger.debug('Unknown module number checked for detail masking', { moduleNumber });
      return false;
  }
};

/**
 * Determines whether a specific pipeline module (1 to 5) has summary level access
 */
export const isModuleSummaryAllowed = (
  currentTier: SubscriptionTier,
  moduleNumber: number
): boolean => {
  const caps = getTierCapabilities(currentTier);
  switch (moduleNumber) {
    case 1:
      return caps.canUploadData && caps.canViewSavingsAvailabilitySummary;
    case 2:
      return caps.canViewStage2Summary;
    case 3:
      return caps.canViewStage3Summary;
    case 4:
      return caps.canViewStage4Summary;
    case 5:
      return caps.canViewStage5TotalSavingsValue;
    default:
      return true;
  }
};
