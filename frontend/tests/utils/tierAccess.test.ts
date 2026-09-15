import { describe, it, expect } from 'vitest';
import {
  getTierCapabilities,
  getEffectiveUserTier,
  hasMinimumTier,
  isModuleDetailsMasked,
  isModuleSummaryAllowed
} from '../../src/utils/tierAccess';
import type { UserProfile, SubscriptionTier } from '../../src/types';

describe('tierAccess utilities (frontend/src/utils/tierAccess.ts)', () => {
  const baseUser: UserProfile = {
    id: 'usr-100',
    name: 'Test Customer',
    mobile_number: '+91 99999 11111',
    email: 'customer@test.com',
    company_name: 'Customer Corp',
    company_address: '456 Business Way',
    role: 'USER',
    status: 'ACTIVE',
    subscription_tier: 'BRONZE',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  };

  describe('getTierCapabilities', () => {
    it('should return strict Bronze tier restrictions with Stage 1 ingestion details enabled', () => {
      const caps = getTierCapabilities('BRONZE');
      expect(caps.tier).toBe('BRONZE');
      expect(caps.canUploadData).toBe(true);
      expect(caps.canViewSavingsAvailabilitySummary).toBe(true);
      expect(caps.canViewStage1Details).toBe(true);
      expect(caps.canViewStage2Summary).toBe(false);
      expect(caps.canViewStage2Details).toBe(false);
      expect(caps.canViewStage3Summary).toBe(false);
      expect(caps.canViewStage3Details).toBe(false);
      expect(caps.canViewStage4Summary).toBe(false);
      expect(caps.canViewStage4Details).toBe(false);
      expect(caps.canViewStage5TotalSavingsValue).toBe(false);
      expect(caps.canViewStage5SavingsLocationsAndActions).toBe(false);
    });

    it('should return Silver tier permissions with summary levels and total savings enabled', () => {
      const caps = getTierCapabilities('SILVER');
      expect(caps.tier).toBe('SILVER');
      expect(caps.canUploadData).toBe(true);
      expect(caps.canViewSavingsAvailabilitySummary).toBe(true);
      expect(caps.canViewStage1Details).toBe(true);
      expect(caps.canViewStage2Summary).toBe(true);
      expect(caps.canViewStage2Details).toBe(false);
      expect(caps.canViewStage3Summary).toBe(true);
      expect(caps.canViewStage3Details).toBe(false);
      expect(caps.canViewStage4Summary).toBe(true);
      expect(caps.canViewStage4Details).toBe(false);
      expect(caps.canViewStage5TotalSavingsValue).toBe(true);
      expect(caps.canViewStage5SavingsLocationsAndActions).toBe(false);
    });

    it('should return unrestricted Gold tier capabilities', () => {
      const caps = getTierCapabilities('GOLD');
      expect(caps.tier).toBe('GOLD');
      expect(caps.canUploadData).toBe(true);
      expect(caps.canViewSavingsAvailabilitySummary).toBe(true);
      expect(caps.canViewStage1Details).toBe(true);
      expect(caps.canViewStage2Summary).toBe(true);
      expect(caps.canViewStage2Details).toBe(true);
      expect(caps.canViewStage3Summary).toBe(true);
      expect(caps.canViewStage3Details).toBe(true);
      expect(caps.canViewStage4Summary).toBe(true);
      expect(caps.canViewStage4Details).toBe(true);
      expect(caps.canViewStage5TotalSavingsValue).toBe(true);
      expect(caps.canViewStage5SavingsLocationsAndActions).toBe(true);
    });

    it('should fallback to Gold capabilities for unknown tiers', () => {
      const caps = getTierCapabilities('UNKNOWN' as any);
      expect(caps.tier).toBe('GOLD');
      expect(caps.canViewStage5SavingsLocationsAndActions).toBe(true);
    });
  });

  describe('getEffectiveUserTier', () => {
    it('should prioritize simulated tier over user profile', () => {
      expect(getEffectiveUserTier(baseUser, 'GOLD')).toBe('GOLD');
      expect(getEffectiveUserTier(baseUser, 'SILVER')).toBe('SILVER');
    });

    it('should return BRONZE if user is null and no simulation is active', () => {
      expect(getEffectiveUserTier(null, null)).toBe('BRONZE');
    });

    it('should return GOLD automatically for ADMIN users', () => {
      const adminUser: UserProfile = { ...baseUser, role: 'ADMIN', subscription_tier: 'BRONZE' };
      expect(getEffectiveUserTier(adminUser, null)).toBe('GOLD');
    });

    it('should return user subscription tier when set', () => {
      const silverUser: UserProfile = { ...baseUser, subscription_tier: 'SILVER' };
      expect(getEffectiveUserTier(silverUser, null)).toBe('SILVER');
    });

    it('should fallback to BRONZE if user subscription_tier is undefined', () => {
      const noTierUser = { ...baseUser, subscription_tier: undefined as any };
      expect(getEffectiveUserTier(noTierUser, null)).toBe('BRONZE');
    });
  });

  describe('hasMinimumTier', () => {
    it('should correctly evaluate tier comparisons', () => {
      expect(hasMinimumTier('GOLD', 'BRONZE')).toBe(true);
      expect(hasMinimumTier('GOLD', 'SILVER')).toBe(true);
      expect(hasMinimumTier('GOLD', 'GOLD')).toBe(true);

      expect(hasMinimumTier('SILVER', 'BRONZE')).toBe(true);
      expect(hasMinimumTier('SILVER', 'SILVER')).toBe(true);
      expect(hasMinimumTier('SILVER', 'GOLD')).toBe(false);

      expect(hasMinimumTier('BRONZE', 'BRONZE')).toBe(true);
      expect(hasMinimumTier('BRONZE', 'SILVER')).toBe(false);
      expect(hasMinimumTier('BRONZE', 'GOLD')).toBe(false);
    });

    it('should fallback gracefully for unrecognized tier values', () => {
      expect(hasMinimumTier('INVALID' as any, 'BRONZE')).toBe(true);
      expect(hasMinimumTier('BRONZE', 'INVALID' as any)).toBe(true);
    });
  });

  describe('isModuleDetailsMasked', () => {
    it('should allow stage 1 details and mask subsequent modules for Bronze', () => {
      expect(isModuleDetailsMasked('BRONZE', 1)).toBe(false);
      expect(isModuleDetailsMasked('BRONZE', 2)).toBe(true);
      expect(isModuleDetailsMasked('BRONZE', 3)).toBe(true);
      expect(isModuleDetailsMasked('BRONZE', 4)).toBe(true);
      expect(isModuleDetailsMasked('BRONZE', 5)).toBe(true);
    });

    it('should allow stage 1 details and mask granular details for Silver', () => {
      expect(isModuleDetailsMasked('SILVER', 1)).toBe(false);
      expect(isModuleDetailsMasked('SILVER', 2)).toBe(true);
      expect(isModuleDetailsMasked('SILVER', 3)).toBe(true);
      expect(isModuleDetailsMasked('SILVER', 4)).toBe(true);
      expect(isModuleDetailsMasked('SILVER', 5)).toBe(true);
    });

    it('should allow all details for Gold', () => {
      expect(isModuleDetailsMasked('GOLD', 1)).toBe(false);
      expect(isModuleDetailsMasked('GOLD', 2)).toBe(false);
      expect(isModuleDetailsMasked('GOLD', 3)).toBe(false);
      expect(isModuleDetailsMasked('GOLD', 4)).toBe(false);
      expect(isModuleDetailsMasked('GOLD', 5)).toBe(false);
    });

    it('should return false for unrecognized module numbers', () => {
      expect(isModuleDetailsMasked('BRONZE', 99)).toBe(false);
    });
  });

  describe('isModuleSummaryAllowed', () => {
    it('should evaluate summary allowances accurately', () => {
      expect(isModuleSummaryAllowed('BRONZE', 1)).toBe(true);
      expect(isModuleSummaryAllowed('BRONZE', 2)).toBe(false);
      expect(isModuleSummaryAllowed('BRONZE', 3)).toBe(false);
      expect(isModuleSummaryAllowed('BRONZE', 4)).toBe(false);
      expect(isModuleSummaryAllowed('BRONZE', 5)).toBe(false);

      expect(isModuleSummaryAllowed('SILVER', 1)).toBe(true);
      expect(isModuleSummaryAllowed('SILVER', 2)).toBe(true);
      expect(isModuleSummaryAllowed('SILVER', 3)).toBe(true);
      expect(isModuleSummaryAllowed('SILVER', 4)).toBe(true);
      expect(isModuleSummaryAllowed('SILVER', 5)).toBe(true);

      expect(isModuleSummaryAllowed('GOLD', 1)).toBe(true);
      expect(isModuleSummaryAllowed('GOLD', 2)).toBe(true);
      expect(isModuleSummaryAllowed('GOLD', 3)).toBe(true);
      expect(isModuleSummaryAllowed('GOLD', 4)).toBe(true);
      expect(isModuleSummaryAllowed('GOLD', 5)).toBe(true);

      expect(isModuleSummaryAllowed('BRONZE', 99)).toBe(true);
    });
  });
});
