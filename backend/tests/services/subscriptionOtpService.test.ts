import { describe, it, expect, beforeEach, vi } from 'vitest';
import { subscriptionOtpService } from '../../src/services/subscriptionOtpService';
import { SUBSCRIPTION_CONFIG, SUBSCRIPTION_MESSAGES } from '../../src/constants/subscription';
import { smsService } from '../../src/services/smsService';

describe('SubscriptionOtpService', () => {
  let capturedOtp: string;

  beforeEach(() => {
    subscriptionOtpService.resetSessions();
    capturedOtp = '';
    vi.spyOn(smsService, 'sendAdminProvisioningOtp').mockImplementation(async (_mobile, otp) => {
      capturedOtp = otp;
      return { success: true, destination: '******3210' };
    });
  });

  it('generates a 6-digit OTP and session via SMS', async () => {
    const res = await subscriptionOtpService.generateAdminOtp('admin@procucev.com', '+919876543210', 'usr-1');
    expect(res.sessionId).toBeDefined();
    expect(res.expiresAt).toBeGreaterThan(Date.now());
    expect(capturedOtp).toMatch(/^\d{6}$/);
    expect(res.destination).toContain('3210');
  });

  it('enforces 15-second rate limit between rapid OTP generation requests', async () => {
    await subscriptionOtpService.generateAdminOtp('admin@procucev.com', '+919876543210', 'usr-rate');
    await expect(
      subscriptionOtpService.generateAdminOtp('admin@procucev.com', '+919876543210', 'usr-rate')
    ).rejects.toThrow('Rate limit exceeded');
  });

  it('invalidates existing unverified session when new OTP is requested after cooldown', async () => {
    const first = await subscriptionOtpService.generateAdminOtp('admin@procucev.com', '+919876543210', 'usr-1');
    subscriptionOtpService.resetSessions(); // reset rate limit for test
    const second = await subscriptionOtpService.generateAdminOtp('admin@procucev.com', '+919876543210', 'usr-1');

    expect(first.sessionId).not.toBe(second.sessionId);
    const verifyFirst = subscriptionOtpService.verifyAdminOtp(first.sessionId, '123456');
    expect(verifyFirst.valid).toBe(false);
  });

  it('verifies valid OTP successfully using SHA-256 hash comparison', async () => {
    const res = await subscriptionOtpService.generateAdminOtp('admin@procucev.com', '+919876543210', 'usr-2');
    const verify = subscriptionOtpService.verifyAdminOtp(res.sessionId, capturedOtp);
    expect(verify.valid).toBe(true);

    // Cannot verify twice
    const verifyAgain = subscriptionOtpService.verifyAdminOtp(res.sessionId, capturedOtp);
    expect(verifyAgain.valid).toBe(false);
    expect(verifyAgain.error).toBe('OTP has already been used');
  });

  it('rejects invalid OTP and counts attempts', async () => {
    const res = await subscriptionOtpService.generateAdminOtp('admin@procucev.com', '+919876543210', 'usr-3');
    const verify = subscriptionOtpService.verifyAdminOtp(res.sessionId, '000000');
    expect(verify.valid).toBe(false);
    expect(verify.error).toBe(SUBSCRIPTION_MESSAGES.OTP_INVALID);
  });

  it('locks after maximum failed attempts', async () => {
    const res = await subscriptionOtpService.generateAdminOtp('admin@procucev.com', '+919876543210', 'usr-4');
    for (let i = 0; i < SUBSCRIPTION_CONFIG.ADMIN_OTP_MAX_ATTEMPTS; i++) {
      subscriptionOtpService.verifyAdminOtp(res.sessionId, '000000');
    }
    const finalAttempt = subscriptionOtpService.verifyAdminOtp(res.sessionId, '000000');
    expect(finalAttempt.valid).toBe(false);
    expect(finalAttempt.error).toBe(SUBSCRIPTION_MESSAGES.OTP_MAX_ATTEMPTS);
  });

  it('rejects expired OTP', async () => {
    vi.useFakeTimers();
    try {
      const res = await subscriptionOtpService.generateAdminOtp('admin@procucev.com', '+919876543210', 'usr-5');
      vi.advanceTimersByTime(SUBSCRIPTION_CONFIG.ADMIN_OTP_EXPIRY_MS + 1000);
      const verify = subscriptionOtpService.verifyAdminOtp(res.sessionId, capturedOtp);
      expect(verify.valid).toBe(false);
      expect(verify.error).toBe(SUBSCRIPTION_MESSAGES.OTP_EXPIRED);
    } finally {
      vi.useRealTimers();
    }
  });

  it('consumes verified session successfully', async () => {
    const res = await subscriptionOtpService.generateAdminOtp('admin@procucev.com', '+919876543210', 'usr-6');
    expect(subscriptionOtpService.consumeVerifiedSession(res.sessionId)).toBe(false);

    subscriptionOtpService.verifyAdminOtp(res.sessionId, capturedOtp);
    expect(subscriptionOtpService.consumeVerifiedSession(res.sessionId)).toBe(true);
    expect(subscriptionOtpService.consumeVerifiedSession(res.sessionId)).toBe(false);
  });
});
