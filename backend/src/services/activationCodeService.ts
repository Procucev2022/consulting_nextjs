/**
 * Subscription Activation Code Service (Prompt 288 §17 & Prompt 289 §6)
 */

import crypto from 'crypto';
import { SUBSCRIPTION_CONFIG, SUBSCRIPTION_MESSAGES } from '../constants/subscription';
import type { ActivationCodeRecord } from '../types/subscription';
import logger from '../utils/logger';

export class ActivationCodeService {
  private codes: Map<string, ActivationCodeRecord> = new Map();

  /**
   * Compute secure SHA-256 hash of plaintext code
   */
  public hashActivationCode(plaintextCode: string): string {
    return crypto.createHash('sha256').update(plaintextCode.trim().toUpperCase()).digest('hex');
  }

  /**
   * Generate random 4-character alphanumeric segment
   */
  private generateSegment(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous chars
    let seg = '';
    for (let i = 0; i < 4; i++) {
      seg += chars[crypto.randomInt(0, chars.length)];
    }
    return seg;
  }

  /**
   * Issue a new activation code for a subscription
   */
  public generateActivationCode(
    subscriptionId: string,
    tenantId: string,
    customerEmail: string
  ): { plaintextCode: string; record: ActivationCodeRecord } {
    // Invalidate any existing active codes for this subscription
    for (const [id, r] of this.codes.entries()) {
      if (r.subscription_id === subscriptionId && !r.used) {
        this.codes.delete(id);
      }
    }

    const plaintextCode = `${SUBSCRIPTION_CONFIG.CODE_PREFIX}${this.generateSegment()}-${this.generateSegment()}-${this.generateSegment()}`;
    const codeHash = this.hashActivationCode(plaintextCode);
    const id = `act-code-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SUBSCRIPTION_CONFIG.ACTIVATION_CODE_EXPIRY_MS);

    const record: ActivationCodeRecord = {
      id,
      subscription_id: subscriptionId,
      tenant_id: tenantId,
      customer_email: customerEmail.toLowerCase().trim(),
      code_hash: codeHash,
      code_prefix: `${SUBSCRIPTION_CONFIG.CODE_PREFIX}****`,
      created_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      used: false,
      attempt_count: 0,
      locked: false
    };

    this.codes.set(id, record);

    logger.info('Activation code generated and hashed for subscription', {
      subscriptionId,
      tenantId,
      customerEmail: record.customer_email,
      expiresAt: record.expires_at
    });

    return { plaintextCode, record };
  }

  /**
   * Verify and redeem an activation code with strict tenant binding & state checks
   */
  public redeemActivationCode(
    customerEmail: string,
    enteredCode: string,
    requestTenantId?: string
  ): { success: boolean; subscriptionId?: string; tenantId?: string; error?: string } {
    const cleanEmail = customerEmail.toLowerCase().trim();
    const enteredHash = this.hashActivationCode(enteredCode);

    // 1. Check if the code hash exists
    const match = Array.from(this.codes.values()).find((c) => c.code_hash === enteredHash);

    if (match) {
      // Tenant binding check
      if (requestTenantId && match.tenant_id !== requestTenantId) {
        logger.warn('Cross-tenant activation attempt rejected', {
          requestTenant: requestTenantId,
          codeTenant: match.tenant_id,
          customerEmail: cleanEmail
        });
        return { success: false, error: 'Activation code does not belong to the authenticated tenant' };
      }

      // Customer account binding check
      if (match.customer_email !== cleanEmail) {
        logger.warn('Account mismatch in activation code redemption', {
          requestEmail: cleanEmail,
          codeEmail: match.customer_email
        });
        return { success: false, error: 'Activation code was issued to a different account' };
      }

      if (match.locked) {
        return { success: false, error: SUBSCRIPTION_MESSAGES.ACTIVATION_CODE_LOCKED };
      }

      if (new Date() > new Date(match.expires_at)) {
        return { success: false, error: SUBSCRIPTION_MESSAGES.ACTIVATION_CODE_EXPIRED };
      }

      if (match.used) {
        return { success: false, error: SUBSCRIPTION_MESSAGES.ACTIVATION_CODE_USED };
      }

      // Mark code as used
      match.used = true;
      match.used_at = new Date().toISOString();

      logger.info('Activation code successfully redeemed', {
        subscriptionId: match.subscription_id,
        tenantId: match.tenant_id,
        customerEmail: match.customer_email
      });

      return { success: true, subscriptionId: match.subscription_id, tenantId: match.tenant_id };
    }

    // 2. Code hash did not match: find pending record to increment attempt count
    const pendingRecord = Array.from(this.codes.values()).find(
      (c) => c.customer_email === cleanEmail && !c.used && (!requestTenantId || c.tenant_id === requestTenantId)
    );

    if (pendingRecord) {
      pendingRecord.attempt_count += 1;
      if (pendingRecord.attempt_count >= SUBSCRIPTION_CONFIG.ACTIVATION_MAX_ATTEMPTS) {
        pendingRecord.locked = true;
        logger.warn('Activation code locked due to max attempts exceeded', {
          subscriptionId: pendingRecord.subscription_id,
          customerEmail: pendingRecord.customer_email,
          attempts: pendingRecord.attempt_count
        });
        return { success: false, error: SUBSCRIPTION_MESSAGES.ACTIVATION_CODE_LOCKED };
      }
    }

    return { success: false, error: SUBSCRIPTION_MESSAGES.ACTIVATION_CODE_INVALID };
  }

  /**
   * Reset store (for testing)
   */
  public reset(): void {
    this.codes.clear();
  }
}

export const activationCodeService = new ActivationCodeService();
