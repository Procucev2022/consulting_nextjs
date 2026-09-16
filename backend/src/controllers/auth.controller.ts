/**
 * Authentication Controller (Backend)
 */

import type { Request, Response } from 'express';
import { db } from '../services/db';
import { hashPassword, verifyPassword, generateAuthToken, verifyAuthToken, sanitizeUserProfile } from '../utils/auth';
import { registerUserSchema, loginUserSchema, changePasswordSchema } from '../constants/validation';
import { AUTH_MESSAGES, AUTH_TOKEN_EXPIRY_SECONDS, AUTH_ROLES, AUTH_STATUS } from '../constants/auth';
import logger from '../utils/logger';

export class AuthController {
  /**
   * Register a new enterprise user
   */
  public async register(req: Request, res: Response): Promise<void> {
    const start = Date.now();
    const requestId = req.headers['x-request-id'] as string | undefined;

    const parseResult = registerUserSchema.safeParse(req.body);
    if (!parseResult.success) {
      logger.warn('User registration validation failed', {
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
      mobile_number: mobileNumber,
      email,
      company_name: companyName,
      company_address: companyAddress,
      password
    } = parseResult.data;

    const existing = await db.getUserByEmail(email);
    if (existing) {
      logger.warn('Registration conflict: organization email already exists', { email, requestId });
      res.status(409).json({
        success: false,
        message: AUTH_MESSAGES.EMAIL_EXISTS
      });
      return;
    }

    const passwordHash = hashPassword(password);
    const userId = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const user = await db.createUser({
      id: userId,
      name,
      mobile_number: mobileNumber,
      email,
      company_name: companyName,
      company_address: companyAddress,
      password_hash: passwordHash,
      role: AUTH_ROLES.USER,
      status: AUTH_STATUS.ACTIVE,
      subscription_tier: parseResult.data.subscription_tier || 'BRONZE'
    });

    const token = generateAuthToken(user.id, user.email, user.role, user.subscription_tier);

    logger.info('User account registered successfully', {
      userId: user.id,
      email: user.email,
      role: user.role,
      tier: user.subscription_tier,
      durationMs: Date.now() - start,
      requestId
    });

    res.status(201).json({
      success: true,
      message: AUTH_MESSAGES.REGISTER_SUCCESS,
      token,
      user: sanitizeUserProfile(user),
      expires_in_seconds: AUTH_TOKEN_EXPIRY_SECONDS
    });
  }

  /**
   * Authenticate user and return session token
   */
  public async login(req: Request, res: Response): Promise<void> {
    const start = Date.now();
    const requestId = req.headers['x-request-id'] as string | undefined;

    const parseResult = loginUserSchema.safeParse(req.body);
    if (!parseResult.success) {
      logger.warn('User login validation failed', {
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

    const { email, password } = parseResult.data;
    const user = await db.getUserByEmailOrBuyerId(email);

    if (!user) {
      logger.warn('Login failure: user not found in database', { identifier: email, requestId });
      res.status(401).json({
        success: false,
        message: AUTH_MESSAGES.INVALID_CREDENTIALS
      });
      return;
    }

    const isValidPassword = verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      logger.warn('Login failure: password mismatch', { email, userId: user.id, requestId });
      res.status(401).json({
        success: false,
        message: AUTH_MESSAGES.INVALID_CREDENTIALS
      });
      return;
    }

    if (user.status === AUTH_STATUS.SUSPENDED) {
      logger.warn('Login blocked: account suspended', { email, userId: user.id, requestId });
      res.status(403).json({
        success: false,
        message: AUTH_MESSAGES.ACCOUNT_INACTIVE
      });
      return;
    }

    const token = generateAuthToken(user.id, user.email, user.role, user.subscription_tier);

    logger.info('User authenticated successfully', {
      userId: user.id,
      email: user.email,
      role: user.role,
      durationMs: Date.now() - start,
      requestId
    });

    res.json({
      success: true,
      message: AUTH_MESSAGES.LOGIN_SUCCESS,
      user: sanitizeUserProfile(user),
      token,
      expires_in_seconds: AUTH_TOKEN_EXPIRY_SECONDS
    });
  }

  /**
   * Fetch authenticated user profile
   */
  public async getMe(req: Request, res: Response): Promise<void> {
    const authHeader = req.headers.authorization || (req.headers['x-auth-token'] as string);
    if (!authHeader) {
      res.status(401).json({
        success: false,
        message: AUTH_MESSAGES.UNAUTHORIZED
      });
      return;
    }

    const rawToken = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
    const decoded = verifyAuthToken(rawToken);

    if (!decoded) {
      res.status(401).json({
        success: false,
        message: AUTH_MESSAGES.UNAUTHORIZED
      });
      return;
    }

    const user = await db.getUserById(decoded.userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: AUTH_MESSAGES.USER_NOT_FOUND
      });
      return;
    }

    res.json({
      success: true,
      user: sanitizeUserProfile(user)
    });
  }

  /**
   * Change authenticated user's password
   */
  public async changePassword(req: Request, res: Response): Promise<void> {
    const authHeader = req.headers.authorization || (req.headers['x-auth-token'] as string);
    if (!authHeader) {
      res.status(401).json({
        success: false,
        message: AUTH_MESSAGES.UNAUTHORIZED
      });
      return;
    }

    const rawToken = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
    const decoded = verifyAuthToken(rawToken);

    if (!decoded) {
      res.status(401).json({
        success: false,
        message: AUTH_MESSAGES.UNAUTHORIZED
      });
      return;
    }

    const parseResult = changePasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.issues
      });
      return;
    }

    const { currentPassword, newPassword } = parseResult.data;
    const user = await db.getUserById(decoded.userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: AUTH_MESSAGES.USER_NOT_FOUND
      });
      return;
    }

    const isValidCurrent = verifyPassword(currentPassword, user.password_hash);
    if (!isValidCurrent) {
      res.status(400).json({
        success: false,
        message: AUTH_MESSAGES.CURRENT_PASSWORD_INCORRECT
      });
      return;
    }

    const newHash = hashPassword(newPassword);
    await db.updateUserPassword(user.id, newHash);

    logger.info('User password updated successfully', { userId: user.id, email: user.email });

    res.json({
      success: true,
      message: AUTH_MESSAGES.PASSWORD_CHANGED
    });
  }
}

export const authController = new AuthController();
