/**
 * Admin Controller (Backend)
 */

import type { Request, Response } from 'express';
import { db } from '../services/db';
import { sanitizeUserProfile, verifyAuthToken, hashPassword } from '../utils/auth';
import { adminUserQuerySchema, adminUpdateUserStatusSchema, adminUpdateUserTierSchema } from '../constants/validation';
import { createAdminSchema } from '../constants/adminValidation';
import { AUTH_MESSAGES, AUTH_STATUS } from '../constants/auth';
import logger from '../utils/logger';

export class AdminController {
  /**
   * List all registered enterprise users with complete details and metrics
   */
  public async listUsers(req: Request, res: Response): Promise<void> {
    const start = Date.now();
    const requestId = req.headers['x-request-id'] as string | undefined;

    // Optional admin token validation: if token present, verify role
    const authHeader = req.headers.authorization || (req.headers['x-auth-token'] as string);
    if (authHeader) {
      const rawToken = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
      const decoded = verifyAuthToken(rawToken);
      if (decoded && decoded.role !== 'ADMIN') {
        logger.warn('Non-admin user attempted to access admin user registry', {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role,
          requestId
        });
        res.status(403).json({
          success: false,
          message: AUTH_MESSAGES.FORBIDDEN_ADMIN_ONLY
        });
        return;
      }
    }

    const parseResult = adminUserQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.issues
      });
      return;
    }

    const { search, role, status, tier } = parseResult.data;
    const users = await db.getAllUsers({ search, role, status, tier });
    const sanitized = users.map(sanitizeUserProfile);

    const activeCount = users.filter((u) => u.status === AUTH_STATUS.ACTIVE).length;
    const uniqueCompanies = new Set(users.map((u) => u.company_name.trim().toLowerCase())).size;

    logger.info('Admin retrieved user registry', {
      userCount: users.length,
      activeCount,
      uniqueCompanies,
      durationMs: Date.now() - start,
      requestId
    });

    res.json({
      success: true,
      users: sanitized,
      total: users.length,
      activeCount,
      companiesCount: uniqueCompanies
    });
  }

  /**
   * Update user status (e.g., ACTIVE, SUSPENDED)
   */
  public async updateUserStatus(req: Request, res: Response): Promise<void> {
    const start = Date.now();
    const requestId = req.headers['x-request-id'] as string | undefined;
    const { id } = req.params;

    if (!id || id.trim() === '') {
      res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
      return;
    }

    const parseResult = adminUpdateUserStatusSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.issues
      });
      return;
    }

    const updated = await db.updateUserStatus(id, parseResult.data.status);
    if (!updated) {
      logger.warn('Failed to update user status: user not found', { id, requestId });
      res.status(404).json({
        success: false,
        message: AUTH_MESSAGES.USER_NOT_FOUND
      });
      return;
    }

    logger.info('User status updated successfully by administrator', {
      userId: updated.id,
      newStatus: updated.status,
      durationMs: Date.now() - start,
      requestId
    });

    res.json({
      success: true,
      message: AUTH_MESSAGES.STATUS_UPDATED,
      user: sanitizeUserProfile(updated)
    });
  }

  /**
   * Update user subscription tier (e.g., BRONZE, SILVER, GOLD)
   */
  public async updateUserTier(req: Request, res: Response): Promise<void> {
    const start = Date.now();
    const requestId = req.headers['x-request-id'] as string | undefined;
    const { id } = req.params;

    if (!id || id.trim() === '') {
      res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
      return;
    }

    const parseResult = adminUpdateUserTierSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.issues
      });
      return;
    }

    const updated = await db.updateUserTier(id, parseResult.data.tier);
    if (!updated) {
      logger.warn('Failed to update user tier: user not found', { id, requestId });
      res.status(404).json({
        success: false,
        message: AUTH_MESSAGES.USER_NOT_FOUND
      });
      return;
    }

    logger.info('User subscription tier updated successfully by administrator', {
      userId: updated.id,
      newTier: updated.subscription_tier,
      durationMs: Date.now() - start,
      requestId
    });

    res.json({
      success: true,
      message: AUTH_MESSAGES.TIER_UPDATED,
      user: sanitizeUserProfile(updated)
    });
  }

  /**
   * Provision or update enterprise administrator credentials and details
   */
  public async createAdmin(req: Request, res: Response): Promise<void> {
    const start = Date.now();
    const requestId = req.headers['x-request-id'] as string | undefined;

    const parseResult = createAdminSchema.safeParse(req.body);
    if (!parseResult.success) {
      logger.warn('Admin creation validation failed', {
        errors: parseResult.error.format(),
        requestId
      });
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.issues
      });
      return;
    }

    const {
      name,
      email,
      mobile_number: mobileNumber,
      company_name: companyName,
      company_address: companyAddress,
      password,
      role,
      subscription_tier: subscriptionTier
    } = parseResult.data;

    const passwordHash = hashPassword(password);
    const user = await db.createOrUpdateAdminUser({
      name,
      email,
      mobile_number: mobileNumber,
      company_name: companyName,
      company_address: companyAddress,
      password_hash: passwordHash,
      role,
      status: AUTH_STATUS.ACTIVE,
      subscription_tier: subscriptionTier
    });

    logger.info('Administrator credentials provisioned successfully', {
      userId: user.id,
      email: user.email,
      role: user.role,
      durationMs: Date.now() - start,
      requestId
    });

    res.status(201).json({
      success: true,
      message: 'Admin details created and verified successfully',
      user: sanitizeUserProfile(user)
    });
  }
}

export const adminController = new AdminController();
