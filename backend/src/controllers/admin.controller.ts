/**
 * Admin Controller (Backend)
 */

import type { Request, Response } from 'express';
import { db } from '../services/db';
import { sanitizeUserProfile, verifyAuthToken } from '../utils/auth';
import { adminUserQuerySchema, adminUpdateUserStatusSchema } from '../constants/validation';
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

    const { search, role, status } = parseResult.data;
    const users = await db.getAllUsers({ search, role, status });
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
}

export const adminController = new AdminController();
