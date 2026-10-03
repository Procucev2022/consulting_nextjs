/**
 * Backend Entitlement & Authorization Middleware (Prompt 288 & Prompt 289)
 */

import type { Request, Response, NextFunction } from 'express';
import { verifyAuthToken } from './auth';
import { subscriptionService } from '../services/subscriptionService';
import { SUBSCRIPTION_MESSAGES } from '../constants/subscription';
import logger from './logger';

export interface AuthenticatedRequest extends Request {
  userContext?: {
    userId: string;
    email: string;
    role: string;
    tier?: string;
  };
  tenantId?: string;
}

export interface AuthContext {
  userId?: string;
  email?: string;
  role?: string;
  tier?: string;
  isAdmin: boolean;
  tenantId: string;
  authenticatedTenantId?: string;
  hasTenantMismatch: boolean;
  clientRequestedTenantId?: string;
}

interface DecodedAuthResult {
  userId?: string;
  email?: string;
  role?: string;
  tier?: string;
  authenticatedTenantId?: string;
  isAdmin: boolean;
}

function extractDecodedAuth(req: Request): DecodedAuthResult {
  const authHeader = req.headers.authorization || (req.headers['x-auth-token'] as string);
  if (!authHeader) {
    return { isAdmin: false };
  }
  const rawToken = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
  const decoded = verifyAuthToken(rawToken);
  if (!decoded) {
    return { isAdmin: false };
  }
  return {
    userId: decoded.userId,
    email: decoded.email,
    role: decoded.role,
    tier: decoded.tier,
    authenticatedTenantId: decoded.tenantId,
    isAdmin: decoded.role === 'ADMIN'
  };
}

function extractRequestedTenant(req: Request): string | undefined {
  const queryTenant = (req.query.tenantId || req.query.buyerId || req.query.tenant_id) as string | undefined;
  const headerTenant = (req.headers['x-tenant-id'] || req.headers['x-buyer-id']) as string | undefined;
  let bodyTenant: string | undefined;
  if (req.body && typeof req.body === 'object') {
    const b = req.body as Record<string, unknown>;
    bodyTenant = (b.tenant_id || b.tenantId || b.buyer_id || b.buyerId) as string | undefined;
  }
  return queryTenant || headerTenant || bodyTenant;
}

function checkTenantMismatch(isAdmin: boolean, authTenant?: string, reqTenant?: string): boolean {
  if (isAdmin || !authTenant || !reqTenant) {
    return false;
  }
  return reqTenant.trim().toUpperCase() !== authTenant.trim().toUpperCase();
}

/**
 * Extract auth token and server-side authenticated user context
 */
export function extractAuthContext(req: Request): AuthContext {
  const auth = extractDecodedAuth(req);
  const clientRequestedTenantId = extractRequestedTenant(req);
  const hasTenantMismatch = checkTenantMismatch(auth.isAdmin, auth.authenticatedTenantId, clientRequestedTenantId);

  // Authoritative server-side tenant: non-admins are strictly bound to their authenticated tenant
  const tenantId = (!auth.isAdmin && auth.authenticatedTenantId)
    ? auth.authenticatedTenantId
    : (clientRequestedTenantId || auth.authenticatedTenantId || 'TNT-GLOBAL-8902');

  return {
    userId: auth.userId,
    email: auth.email,
    role: auth.role,
    tier: auth.tier,
    isAdmin: auth.isAdmin,
    tenantId,
    authenticatedTenantId: auth.authenticatedTenantId,
    hasTenantMismatch,
    clientRequestedTenantId
  };
}

/**
 * Express Middleware factory to enforce a required feature permission
 */
export function requireFeature(feature: string): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    const auth = extractAuthContext(req);

    // Cross-tenant access is immediately rejected
    if (auth.hasTenantMismatch) {
      logger.warn('Access denied: Cross-tenant access attempt blocked', {
        authenticatedTenant: auth.authenticatedTenantId,
        requestedTenant: auth.clientRequestedTenantId,
        email: auth.email,
        path: req.originalUrl
      });
      res.status(403).json({
        success: false,
        error: 'TENANT_MISMATCH',
        message: SUBSCRIPTION_MESSAGES.TENANT_MISMATCH
      });
      return;
    }

    // Server-side entitlement check
    const isEntitled = subscriptionService.can(auth.tenantId, feature, auth.isAdmin);

    if (!isEntitled) {
      const sub = subscriptionService.getSubscriptionByTenantId(auth.tenantId);
      const effectiveTier = subscriptionService.getEffectiveTier(sub);

      logger.warn('Access denied: Feature permission missing', {
        feature,
        tenantId: auth.tenantId,
        email: auth.email,
        effectiveTier,
        path: req.originalUrl
      });

      res.status(403).json({
        success: false,
        error: 'FEATURE_LOCKED',
        message: SUBSCRIPTION_MESSAGES.FEATURE_LOCKED,
        requiredFeature: feature,
        currentTier: effectiveTier,
        status: sub.status
      });
      return;
    }

    next();
  };
}

/**
 * Express Middleware to require Admin role
 */
export function requireSubscriptionAdmin(req: Request, res: Response, next: NextFunction): void {
  const auth = extractAuthContext(req);

  if (!auth.isAdmin) {
    logger.warn('Non-admin user attempted admin subscription action', {
      email: auth.email,
      role: auth.role,
      path: req.originalUrl
    });

    res.status(403).json({
      success: false,
      error: 'ADMIN_ACCESS_REQUIRED',
      message: SUBSCRIPTION_MESSAGES.ADMIN_ONLY
    });
    return;
  }

  next();
}

/**
 * Express Middleware to enforce strict tenant isolation on customer endpoints
 */
export function enforceTenantIsolation(req: Request, res: Response, next: NextFunction): void {
  const auth = extractAuthContext(req);

  if (auth.hasTenantMismatch) {
    logger.warn('Access denied: Cross-tenant access blocked by tenant isolation middleware', {
      authenticatedTenant: auth.authenticatedTenantId,
      requestedTenant: auth.clientRequestedTenantId,
      path: req.originalUrl
    });

    res.status(403).json({
      success: false,
      error: 'TENANT_MISMATCH',
      message: SUBSCRIPTION_MESSAGES.TENANT_MISMATCH
    });
    return;
  }

  next();
}
