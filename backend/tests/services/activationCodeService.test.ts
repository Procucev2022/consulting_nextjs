import { describe, it, expect, beforeEach, vi } from 'vitest';
import { activationCodeService } from '../../src/services/activationCodeService';
import { SUBSCRIPTION_CONFIG, SUBSCRIPTION_MESSAGES } from '../../src/constants/subscription';

describe('ActivationCodeService', () => {
  beforeEach(() => {
    activationCodeService.reset();
  });

  it('generates activation code with PCV prefix and secure hash', () => {
    const { plaintextCode, record } = activationCodeService.generateActivationCode(
      'sub-1',
      'TNT-1',
      'user@company.com'
    );

    expect(plaintextCode.startsWith(SUBSCRIPTION_CONFIG.CODE_PREFIX)).toBe(true);
    expect(record.code_hash).toBeDefined();
    expect(record.used).toBe(false);
    expect(record.locked).toBe(false);
    expect(record.customer_email).toBe('user@company.com');
  });

  it('redeems valid code successfully and prevents double redemption (reuse after success)', () => {
    const { plaintextCode } = activationCodeService.generateActivationCode(
      'sub-2',
      'TNT-2',
      'test@company.com'
    );

    const redeem = activationCodeService.redeemActivationCode('test@company.com', plaintextCode, 'TNT-2');
    expect(redeem.success).toBe(true);
    expect(redeem.subscriptionId).toBe('sub-2');

    // Second redemption fails with ACTIVATION_CODE_USED
    const secondRedeem = activationCodeService.redeemActivationCode('test@company.com', plaintextCode, 'TNT-2');
    expect(secondRedeem.success).toBe(false);
    expect(secondRedeem.error).toBe(SUBSCRIPTION_MESSAGES.ACTIVATION_CODE_USED);
  });

  it('rejects wrong activation code and locks on 5th attempt, continuing to reject on 6th attempt', () => {
    activationCodeService.generateActivationCode('sub-3', 'TNT-3', 'fail@company.com');

    for (let i = 0; i < SUBSCRIPTION_CONFIG.ACTIVATION_MAX_ATTEMPTS - 1; i++) {
      const res = activationCodeService.redeemActivationCode('fail@company.com', 'PCV-0000-0000-0000');
      expect(res.success).toBe(false);
      expect(res.error).toBe(SUBSCRIPTION_MESSAGES.ACTIVATION_CODE_INVALID);
    }

    // 5th attempt locks the code
    const lockAttempt = activationCodeService.redeemActivationCode('fail@company.com', 'PCV-0000-0000-0000');
    expect(lockAttempt.success).toBe(false);
    expect(lockAttempt.error).toBe(SUBSCRIPTION_MESSAGES.ACTIVATION_CODE_LOCKED);

    // 6th attempt is still locked
    const sixthAttempt = activationCodeService.redeemActivationCode('fail@company.com', 'PCV-0000-0000-0000');
    expect(sixthAttempt.success).toBe(false);
    expect(sixthAttempt.error).toBe(SUBSCRIPTION_MESSAGES.ACTIVATION_CODE_LOCKED);
  });

  it('rejects expired activation code', () => {
    vi.useFakeTimers();
    try {
      const { plaintextCode } = activationCodeService.generateActivationCode('sub-4', 'TNT-4', 'expired@company.com');
      vi.advanceTimersByTime(SUBSCRIPTION_CONFIG.ACTIVATION_CODE_EXPIRY_MS + 5000);

      const res = activationCodeService.redeemActivationCode('expired@company.com', plaintextCode);
      expect(res.success).toBe(false);
      expect(res.error).toBe(SUBSCRIPTION_MESSAGES.ACTIVATION_CODE_EXPIRED);
    } finally {
      vi.useRealTimers();
    }
  });

  it('invalidates old code when a new code is generated for the subscription', () => {
    const first = activationCodeService.generateActivationCode('sub-5', 'TNT-5', 'new@company.com');
    const second = activationCodeService.generateActivationCode('sub-5', 'TNT-5', 'new@company.com');

    // First code no longer works
    const resFirst = activationCodeService.redeemActivationCode('new@company.com', first.plaintextCode);
    expect(resFirst.success).toBe(false);

    // Second code works
    const resSecond = activationCodeService.redeemActivationCode('new@company.com', second.plaintextCode);
    expect(resSecond.success).toBe(true);
  });

  it('rejects activation code against wrong tenant (cross-tenant attack)', () => {
    const { plaintextCode } = activationCodeService.generateActivationCode(
      'sub-6',
      'TNT-A',
      'user@tenant-a.com'
    );

    const res = activationCodeService.redeemActivationCode('user@tenant-a.com', plaintextCode, 'TNT-B');
    expect(res.success).toBe(false);
    expect(res.error).toContain('does not belong to the authenticated tenant');
  });

  it('rejects activation code when customer email does not match', () => {
    const { plaintextCode } = activationCodeService.generateActivationCode(
      'sub-7',
      'TNT-7',
      'target@company.com'
    );

    const res = activationCodeService.redeemActivationCode('attacker@company.com', plaintextCode, 'TNT-7');
    expect(res.success).toBe(false);
    expect(res.error).toContain('issued to a different account');
  });
});
