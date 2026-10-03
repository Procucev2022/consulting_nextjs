/**
 * Admin Subscription OTP Security Service (Prompt 288 §16 & Prompt 289 §2)
 */

import crypto from 'crypto';
import { SUBSCRIPTION_CONFIG, SUBSCRIPTION_MESSAGES } from '../constants/subscription';
import type { AdminSubscriptionOtpSession } from '../types/subscription';
import { smsService, maskMobileNumber } from './smsService';
import logger from '../utils/logger';

export class SubscriptionOtpService {
  private sessions: Map<string, AdminSubscriptionOtpSession> = new Map();
  private rateLimits: Map<string, number> = new Map();

  private hashOtp(otp: string): string {
    return crypto.createHash('sha256').update(otp.trim()).digest('hex');
  }

  /**
   * Request / Generate a new 6-digit Admin OTP delivered via SMS to registered mobile
   */
  public async generateAdminOtp(
    adminEmail: string,
    adminMobile: string,
    customerId: string,
    action: 'PROVISION' | 'RENEW' | 'STATUS_CHANGE' = 'PROVISION'
  ): Promise<{ sessionId: string; expiresAt: number; destination: string }> {
    const rateKey = `${adminEmail}:${customerId}`;
    const lastRequest = this.rateLimits.get(rateKey) || 0;
    const now = Date.now();

    // 15-second rate limit between OTP requests
    if (now - lastRequest < 15000) {
      throw new Error('Rate limit exceeded: Please wait before requesting another OTP.');
    }
    this.rateLimits.set(rateKey, now);

    // Invalidate any existing sessions for this customer + admin
    for (const [id, s] of this.sessions.entries()) {
      if (s.admin_email === adminEmail && s.customer_id === customerId && !s.verified) {
        this.sessions.delete(id);
      }
    }

    const sessionId = `otp-sess-${now}-${crypto.randomBytes(4).toString('hex')}`;
    const otpCode = crypto.randomInt(100000, 1000000).toString();
    const otpHash = this.hashOtp(otpCode);
    const expiresAt = now + SUBSCRIPTION_CONFIG.ADMIN_OTP_EXPIRY_MS;

    const session: AdminSubscriptionOtpSession = {
      id: sessionId,
      admin_email: adminEmail,
      admin_mobile: adminMobile,
      customer_id: customerId,
      otp_hash: otpHash,
      created_at: now,
      expires_at: expiresAt,
      attempts: 0,
      verified: false,
      action
    };

    this.sessions.set(sessionId, session);

    // Dispatch primary OTP to administrator's registered mobile number
    await smsService.sendAdminProvisioningOtp(adminMobile, otpCode, customerId);

    const maskedMobile = maskMobileNumber(adminMobile);
    logger.info('Admin subscription OTP generated and hashed', {
      sessionId,
      adminEmail,
      destination: maskedMobile,
      customerId,
      action,
      expiresAt: new Date(expiresAt).toISOString()
    });

    return {
      sessionId,
      expiresAt,
      destination: maskedMobile
    };
  }

  /**
   * Verify an Admin OTP using timing-safe comparison of SHA-256 hash
   */
  public verifyAdminOtp(
    sessionId: string,
    enteredOtp: string
  ): { valid: boolean; error?: string } {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { valid: false, error: SUBSCRIPTION_MESSAGES.OTP_REQUIRED };
    }

    if (session.verified) {
      return { valid: false, error: 'OTP has already been used' };
    }

    if (Date.now() > session.expires_at) {
      this.sessions.delete(sessionId);
      return { valid: false, error: SUBSCRIPTION_MESSAGES.OTP_EXPIRED };
    }

    if (session.attempts >= SUBSCRIPTION_CONFIG.ADMIN_OTP_MAX_ATTEMPTS) {
      this.sessions.delete(sessionId);
      return { valid: false, error: SUBSCRIPTION_MESSAGES.OTP_MAX_ATTEMPTS };
    }

    session.attempts += 1;

    const enteredHash = this.hashOtp(enteredOtp);
    const enteredBuf = Buffer.from(enteredHash, 'hex');
    const storedBuf = Buffer.from(session.otp_hash, 'hex');

    const matches = enteredBuf.length === storedBuf.length && crypto.timingSafeEqual(enteredBuf, storedBuf);

    if (!matches) {
      logger.warn('Failed admin OTP verification attempt', {
        sessionId,
        attempts: session.attempts
      });
      return { valid: false, error: SUBSCRIPTION_MESSAGES.OTP_INVALID };
    }

    session.verified = true;
    logger.info('Admin OTP successfully verified', { sessionId, customerId: session.customer_id });
    return { valid: true };
  }

  /**
   * Consume a verified session so it cannot be reused
   */
  public consumeVerifiedSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (session?.verified) {
      this.sessions.delete(sessionId);
      return true;
    }
    return false;
  }

  /**
   * Clear all sessions and rate limits (for testing)
   */
  public resetSessions(): void {
    this.sessions.clear();
    this.rateLimits.clear();
  }
}

export const subscriptionOtpService = new SubscriptionOtpService();
