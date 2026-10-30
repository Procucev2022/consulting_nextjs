import { describe, expect, it } from 'vitest';
import { COMMERCIAL_WORKFLOW } from '../../src/constants/commercialWorkflow';

describe('commercial workflow limits and states', () => {
  it('defines bounded OTP, code, and subscription periods', () => {
    expect(COMMERCIAL_WORKFLOW).toMatchObject({
      otpDigits: 6,
      otpTtlSeconds: 300,
      otpMaxAttempts: 5,
      upgradeCodeTtlSeconds: 86400,
      subscriptionTermDays: 365,
      maxRequestNoteLength: 2000
    });
  });

  it('keeps the expected business workflow states centralized', () => {
    expect(COMMERCIAL_WORKFLOW.upgradeStatus).toMatchObject({
      PENDING: 'PENDING_ADMIN_ACTION', CODE_SENT: 'OTP_VERIFIED_CODE_SENT',
      COMPLETED: 'UPGRADE_COMPLETED', REJECTED: 'REJECTED'
    });
    expect(COMMERCIAL_WORKFLOW.subscriptionStatus.ACTIVE).toBe('ACTIVE');
    expect(COMMERCIAL_WORKFLOW.commercialStatus.RECEIVED).toBe('PAYMENT_RECEIVED');
    expect(Object.values(COMMERCIAL_WORKFLOW.otpPurpose)).toEqual(['UPGRADE_APPROVAL', 'SUBSCRIPTION_PROVISION']);
  });
});
