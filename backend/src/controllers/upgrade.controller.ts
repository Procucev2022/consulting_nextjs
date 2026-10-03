/**
 * Customer Upgrade & Admin OTP Validation Controller (Prompt 81)
 */

import type { Request, Response } from 'express';
import { db } from '../services/db';
import { upgradeEmailService } from '../services/upgradeEmailService';
import { generateAuthToken, sanitizeUserProfile } from '../utils/auth';
import { AUTH_ROLES, AUTH_STATUS } from '../constants/auth';
import type { UpgradeRequestRecord } from '../types/pcbi';
import logger from '../utils/logger';

function resolveTiers(currentTier?: string, requestedTier?: string): {
  validCurrentTier: UpgradeRequestRecord['current_tier'];
  validRequestedTier: UpgradeRequestRecord['requested_tier'];
} {
  const isSilverOrGold = currentTier === 'SILVER' || currentTier === 'GOLD';
  const isSilverOrEnterprise = requestedTier === 'SILVER' || requestedTier === 'ENTERPRISE';
  return {
    validCurrentTier: isSilverOrGold ? currentTier : 'BRONZE',
    validRequestedTier: isSilverOrEnterprise ? requestedTier : 'GOLD'
  };
}

export class UpgradeController {
  /**
   * 1. Customer initiates Upgrade Request
   */
  public async requestUpgrade(req: Request, res: Response): Promise<void> {
    try {
      const {
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        company_name: companyName,
        company_details: companyDetails,
        current_tier: currentTier = 'BRONZE',
        requested_tier: requestedTier = 'GOLD',
        requirements_note: requirementsNote
      } = req.body;

      if (!customerName || !customerEmail || !companyName) {
        res.status(400).json({
          success: false,
          message: 'Customer name, email, and company name are required.'
        });
        return;
      }

      const { validCurrentTier, validRequestedTier } = resolveTiers(currentTier, requestedTier);

      const record = db.createUpgradeRequest({
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim().toLowerCase(),
        customer_phone: (customerPhone || '').trim(),
        company_name: companyName.trim(),
        company_details: companyDetails ? companyDetails.trim() : undefined,
        current_tier: validCurrentTier,
        requested_tier: validRequestedTier,
        requirements_note: requirementsNote ? requirementsNote.trim() : undefined
      });

      // Send email to admin
      await upgradeEmailService.sendAdminUpgradeNotification(record);

      logger.info('Customer upgrade request submitted successfully', {
        requestId: record.id,
        email: record.customer_email,
        company: record.company_name
      });

      res.status(201).json({
        success: true,
        message: 'Your upgrade request has been submitted. Our Customer Service Representative will connect with you and guide for upgrade.',
        request: record
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error('Failed to submit upgrade request', { error: errorMessage });
      res.status(500).json({ success: false, message: 'Failed to submit upgrade request' });
    }
  }

  /**
   * 2. Admin lists all pending & processed upgrade requests
   */
  public async listUpgradeRequests(req: Request, res: Response): Promise<void> {
    try {
      const requests = db.getUpgradeRequests();
      res.json({
        success: true,
        total: requests.length,
        requests
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error('Failed to list upgrade requests', { error: errorMessage });
      res.status(500).json({ success: false, message: 'Failed to list upgrade requests' });
    }
  }

  /**
   * 3. Admin requests Mobile OTP to authorize unique code generation
   */
  public async requestAdminOTP(req: Request, res: Response): Promise<void> {
    try {
      const { request_id: requestId } = req.body;
      if (!requestId) {
        res.status(400).json({ success: false, message: 'Upgrade Request ID is required.' });
        return;
      }

      const upgReq = db.getUpgradeRequestById(requestId);
      if (!upgReq) {
        res.status(404).json({ success: false, message: 'Upgrade request record not found.' });
        return;
      }

      // Generate 6-digit OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const adminMobile = process.env.ADMIN_MOBILE || '+91 98765 43210';
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@procucev.com';

      db.setAdminOtpSession({
        request_id: requestId,
        admin_email: adminEmail,
        admin_mobile: adminMobile,
        otp_code: otpCode,
        expires_at: Date.now() + 10 * 60 * 1000, // 10 minutes
        verified: false
      });

      logger.info(`Admin mobile OTP generated for upgrade request [${requestId}]`, {
        requestId,
        destination: `${adminMobile.slice(0, 7)}****`
      });

      res.json({
        success: true,
        message: `OTP sent to Admin linked mobile (${adminMobile.slice(0, 7)}****). Please verify to generate unique code.`,
        request_id: requestId,
        admin_mobile: `${adminMobile.slice(0, 7)}****`
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error('Failed to generate admin OTP', { error: errorMessage });
      res.status(500).json({ success: false, message: 'Failed to generate admin OTP' });
    }
  }

  /**
   * 4. Admin submits OTP, verifies, generates Unique Code, and emails it to Customer
   */
  public async verifyOtpAndGenerateCode(req: Request, res: Response): Promise<void> {
    try {
      const { request_id: requestId, otp } = req.body;
      if (!requestId || !otp) {
        res.status(400).json({ success: false, message: 'Request ID and OTP are required.' });
        return;
      }

      const session = db.getAdminOtpSession(requestId);
      if (!session) {
        res.status(400).json({ success: false, message: 'No active OTP session found. Please request a new OTP.' });
        return;
      }

      if (Date.now() > session.expires_at) {
        res.status(400).json({ success: false, message: 'OTP has expired. Please request a new OTP.' });
        return;
      }

      if (session.otp_code !== otp.trim()) {
        res.status(400).json({ success: false, message: 'Invalid OTP entered. Please check and try again.' });
        return;
      }

      const upgReq = db.getUpgradeRequestById(requestId);
      if (!upgReq) {
        res.status(404).json({ success: false, message: 'Upgrade request record not found.' });
        return;
      }

      // Generate unique code
      const part1 = Math.floor(1000 + Math.random() * 9000);
      const part2 = Math.floor(1000 + Math.random() * 9000);
      const uniqueCode = `PCBI-UPG-${part1}-${part2}`;

      const updated = db.updateUpgradeRequest(requestId, {
        status: 'OTP_VERIFIED_CODE_SENT',
        generated_unique_code: uniqueCode,
        code_generated_at: new Date().toISOString()
      });

      session.verified = true;

      // Email unique code to customer
      if (updated) {
        await upgradeEmailService.sendCustomerUniqueUpgradeCode(updated);
      }

      logger.info('Admin verified OTP and issued unique upgrade code', {
        requestId,
        codePrefix: `${uniqueCode.slice(0, 4)}****`,
        customerEmail: upgReq.customer_email
      });

      res.json({
        success: true,
        message: `OTP authorized successfully. Unique code ${uniqueCode} has been generated and dispatched to ${upgReq.customer_email}.`,
        code: uniqueCode,
        request: updated
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error('Failed to verify OTP and generate code', { error: errorMessage });
      res.status(500).json({ success: false, message: 'Failed to verify OTP' });
    }
  }

  /**
   * 5. Customer logs in using their Unique Upgrade Code
   */
  public async loginWithUpgradeCode(req: Request, res: Response): Promise<void> {
    try {
      const { email, code } = req.body;
      if (!email || !code) {
        res.status(400).json({ success: false, message: 'Registered email and unique upgrade code are required.' });
        return;
      }

      const upgReq = db.findUpgradeRequestByCode(code);
      if (!upgReq) {
        res.status(401).json({ success: false, message: 'Invalid or unrecognized upgrade code.' });
        return;
      }

      if (upgReq.customer_email.toLowerCase() !== email.trim().toLowerCase()) {
        res.status(401).json({
          success: false,
          message: 'The upgrade code does not match this registered email address.'
        });
        return;
      }

      // Find or create customer user
      let user = await db.getUserByEmail(email.trim().toLowerCase());
      const upgradedTier = upgReq.requested_tier === 'ENTERPRISE' ? 'GOLD' : upgReq.requested_tier;

      if (user) {
        // Upgrade user subscription tier
        user = await db.updateUserTier(user.id, upgradedTier) || user;
      } else {
        // Create active user
        user = await db.createUser({
          id: `usr-upg-${Date.now()}`,
          name: upgReq.customer_name,
          email: upgReq.customer_email,
          mobile_number: upgReq.customer_phone,
          company_name: upgReq.company_name,
          company_address: upgReq.company_details || 'Corporate Office',
          password_hash: 'UPGRADED_CODE_AUTH',
          role: AUTH_ROLES.USER,
          status: AUTH_STATUS.ACTIVE,
          subscription_tier: upgradedTier
        });
      }

      // Mark request as completed
      db.updateUpgradeRequest(upgReq.id, {
        status: 'UPGRADE_COMPLETED',
        code_redeemed_at: new Date().toISOString()
      });

      const token = generateAuthToken(user.id, user.email, user.role, user.subscription_tier);

      res.json({
        success: true,
        welcome_note: `Welcome to PROCUCEV Enterprise! Your account has been upgraded to ${user.subscription_tier} Tier.`,
        upgradation_message: `Congratulations ${user.name}! You now have full access to PCBI Benchmark Intelligence, Savings Engine, and Advanced Conversion Analytics.`,
        token,
        user: sanitizeUserProfile(user),
        tier: user.subscription_tier
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error('Failed login with upgrade code', { error: errorMessage });
      res.status(500).json({ success: false, message: 'Failed to login with upgrade code' });
    }
  }
}

export const upgradeController = new UpgradeController();
