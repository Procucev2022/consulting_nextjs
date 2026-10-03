import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import {
  extractAuthContext,
  requireFeature,
  requireSubscriptionAdmin
} from '../../src/utils/entitlementMiddleware';
import { generateAuthToken } from '../../src/utils/auth';
import { FEATURE_PERMISSIONS } from '../../src/constants/subscription';

describe('EntitlementMiddleware', () => {
  it('extracts context without token (default fallback)', () => {
    const req = {
      headers: {},
      query: {}
    } as unknown as Request;

    const ctx = extractAuthContext(req);
    expect(ctx.isAdmin).toBe(false);
    expect(ctx.tenantId).toBe('TNT-GLOBAL-8902');
  });

  it('extracts context with valid user token and ignores client header tier override (Prompt 289)', () => {
    const token = generateAuthToken('usr-1', 'test@test.com', 'USER', 'BRONZE');
    const req = {
      headers: {
        authorization: `Bearer ${token}`,
        'x-tenant-id': 'TNT-CUSTOM-1',
        'x-subscription-tier': 'silver'
      },
      query: {}
    } as unknown as Request;

    const ctx = extractAuthContext(req);
    expect(ctx.userId).toBe('usr-1');
    expect(ctx.role).toBe('USER');
    expect(ctx.tenantId).toBe('TNT-CUSTOM-1');
    expect(ctx.tier).toBe('BRONZE');
  });

  it('requireFeature calls next() when user has feature', () => {
    const token = generateAuthToken('usr-admin', 'admin@test.com', 'ADMIN', 'GOLD');
    const req = {
      headers: { authorization: `Bearer ${token}` },
      query: {}
    } as unknown as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    } as unknown as Response;

    const next: NextFunction = vi.fn();

    const mw = requireFeature(FEATURE_PERMISSIONS.MODULE_4_FULL);
    mw(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('requireFeature blocks when user does not have feature', () => {
    const token = generateAuthToken('usr-b', 'b@test.com', 'USER', 'BRONZE');
    const req = {
      headers: {
        authorization: `Bearer ${token}`,
        'x-tenant-id': 'TNT-BRONZE-CLIENT'
      },
      query: {},
      originalUrl: '/test'
    } as unknown as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    } as unknown as Response;

    const next: NextFunction = vi.fn();

    const mw = requireFeature(FEATURE_PERMISSIONS.TOTAL_SAVINGS);
    mw(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('requireSubscriptionAdmin blocks non-admin and passes admin', () => {
    const userToken = generateAuthToken('usr-u', 'u@test.com', 'USER', 'GOLD');
    const adminToken = generateAuthToken('usr-a', 'a@test.com', 'ADMIN', 'GOLD');

    const reqUser = {
      headers: { authorization: `Bearer ${userToken}` },
      query: {}
    } as unknown as Request;

    const reqAdmin = {
      headers: { authorization: `Bearer ${adminToken}` },
      query: {}
    } as unknown as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    } as unknown as Response;

    const nextUser: NextFunction = vi.fn();
    const nextAdmin: NextFunction = vi.fn();

    requireSubscriptionAdmin(reqUser, res, nextUser);
    expect(nextUser).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);

    requireSubscriptionAdmin(reqAdmin, res, nextAdmin);
    expect(nextAdmin).toHaveBeenCalled();
  });

  it('handles x-auth-token header without Bearer prefix and query tenantId', () => {
    const token = generateAuthToken('usr-2', 'direct@test.com', 'USER', 'BRONZE');
    const req = {
      headers: {
        'x-auth-token': token
      },
      query: { tenantId: 'TNT-QUERY-1' }
    } as unknown as Request;

    const ctx = extractAuthContext(req);
    expect(ctx.userId).toBe('usr-2');
    expect(ctx.tenantId).toBe('TNT-QUERY-1');
  });

  it('handles x-buyer-id and query buyerId tenant fallbacks', () => {
    const req1 = {
      headers: { 'x-buyer-id': 'TNT-BUYER-HDR' },
      query: {}
    } as unknown as Request;
    expect(extractAuthContext(req1).tenantId).toBe('TNT-BUYER-HDR');

    const req2 = {
      headers: {},
      query: { buyerId: 'TNT-BUYER-QRY' }
    } as unknown as Request;
    expect(extractAuthContext(req2).tenantId).toBe('TNT-BUYER-QRY');
  });

  it('requireFeature falls back to getEffectiveTier when auth.tier is not provided', () => {
    const req = {
      headers: {
        'x-tenant-id': 'TNT-BRONZE-CLIENT'
      },
      query: {},
      originalUrl: '/api/savings'
    } as unknown as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    } as unknown as Response;

    const next: NextFunction = vi.fn();

    const mw = requireFeature(FEATURE_PERMISSIONS.TOTAL_SAVINGS);
    mw(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        currentTier: 'BRONZE'
      })
    );
  });
});
