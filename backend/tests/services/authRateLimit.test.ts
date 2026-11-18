import { afterEach, describe, expect, it, vi } from 'vitest';
import { enforceAuthRateLimit } from '../../src/services/authRateLimit';
import { handleUpgradeRoute } from '../../src/services/workerCommercialUpgrade';
import { handleAuthRoute } from '../../src/workerAuth';
import {
  AUTH_RATE_LIMIT_LOG_MESSAGES, AUTH_RATE_LIMIT_MESSAGES, AUTH_RATE_LIMIT_NAMESPACE, AUTH_RATE_LIMIT_WINDOW_SECONDS
} from '../../src/constants/auth';
import { API_ERROR_CATEGORY, API_ERROR_CODE } from '../../src/constants/errors';
import logger from '../../src/utils/logger';
import type { CloudflareRateLimiter } from '../../src/types/cloudflare';
import { createWorkerDatabase, WORKER_CORE_SECRET } from '../helpers/workerCoreFixtures';

const requestFrom = (path: string, address?: string): Request => new Request(`https://consulting.edge${path}`, {
  method: 'POST',
  headers: {
    'x-request-id': 'req-rate-1',
    ...(address ? { 'cf-connecting-ip': address } : {})
  }
});

const limiter = (success: boolean) => ({ limit: vi.fn(async (_input: { key: string }) => ({ success })) });

describe('authentication rate limiting', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('allows a request inside its limit and keys the counter by request family and network address', async () => {
    const allowed = limiter(true);

    const result = await enforceAuthRateLimit(requestFrom('/api/auth/login', '203.0.113.7'), {
      AUTH_RATE_LIMITER: allowed
    }, 'login');

    expect(result).toBeUndefined();
    expect(allowed.limit).toHaveBeenCalledWith({ key: `${AUTH_RATE_LIMIT_NAMESPACE.login}:203.0.113.7` });
  });

  it('counts requests without a network address or request ID under an unknown key', async () => {
    const allowed = limiter(true);
    const bare = new Request('https://consulting.edge/api/auth/register', { method: 'POST' });

    await enforceAuthRateLimit(bare, { AUTH_RATE_LIMITER: allowed }, 'register');

    expect(allowed.limit).toHaveBeenCalledWith({ key: `${AUTH_RATE_LIMIT_NAMESPACE.register}:unknown` });
  });

  it('returns a rate-limit error with the retry window once the limit is reached', async () => {
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => undefined);

    const result = await enforceAuthRateLimit(requestFrom('/api/auth/login', '203.0.113.9'), {
      AUTH_RATE_LIMITER: limiter(false)
    }, 'login');

    expect(result).toEqual({
      status: 429,
      body: {
        success: false,
        message: AUTH_RATE_LIMIT_MESSAGES.login,
        errorCode: API_ERROR_CODE.RATE_LIMITED,
        errorCategory: API_ERROR_CATEGORY.RATE_LIMIT,
        requestId: 'req-rate-1',
        retryAfterSeconds: AUTH_RATE_LIMIT_WINDOW_SECONDS
      }
    });
    expect(warn).toHaveBeenCalledWith(AUTH_RATE_LIMIT_LOG_MESSAGES.limited, expect.objectContaining({
      requestId: 'req-rate-1', action: 'login', statusCode: 429
    }));
  });

  it('lets the request through when no limiter is bound, and records that the limit was not applied', async () => {
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => undefined);

    expect(await enforceAuthRateLimit(requestFrom('/api/auth/login'), {}, 'login')).toBeUndefined();
    expect(await enforceAuthRateLimit(requestFrom('/api/auth/login'), {
      AUTH_RATE_LIMITER: {} as unknown as CloudflareRateLimiter
    }, 'login')).toBeUndefined();
    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn).toHaveBeenCalledWith(AUTH_RATE_LIMIT_LOG_MESSAGES.limiterMissing, expect.objectContaining({ action: 'login' }));
  });

  it('lets the request through when the limiter fails, and records the failure with its cause', async () => {
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => undefined);
    const broken = { limit: vi.fn(async (): Promise<{ success: boolean }> => { throw new Error('limiter offline'); }) };

    expect(await enforceAuthRateLimit(requestFrom('/api/auth/login', '203.0.113.2'), {
      AUTH_RATE_LIMITER: broken
    }, 'login')).toBeUndefined();
    expect(warn).toHaveBeenCalledWith(AUTH_RATE_LIMIT_LOG_MESSAGES.limiterFailed, expect.objectContaining({ action: 'login' }),
      expect.objectContaining({ message: 'limiter offline' }));
  });

  it('limits sign-in before the database is read', async () => {
    const fixture = createWorkerDatabase();
    try {
      const response = await handleAuthRoute(requestFrom('/api/auth/login', '203.0.113.4'), {
        DB: fixture.d1, AUTH_SECRET: WORKER_CORE_SECRET, AUTH_RATE_LIMITER: limiter(false)
      }, new URL('https://consulting.edge/api/auth/login'));

      expect(response.status).toBe(429);
      expect(response.body).toMatchObject({ errorCode: API_ERROR_CODE.RATE_LIMITED, retryAfterSeconds: 60 });
    } finally {
      fixture.close();
    }
  });

  it('limits registration before any account is written', async () => {
    const fixture = createWorkerDatabase();
    try {
      const response = await handleAuthRoute(requestFrom('/api/auth/register', '203.0.113.5'), {
        DB: fixture.d1, AUTH_SECRET: WORKER_CORE_SECRET, AUTH_RATE_LIMITER: limiter(false)
      }, new URL('https://consulting.edge/api/auth/register'));

      expect(response.status).toBe(429);
      expect(fixture.db.prepare('SELECT COUNT(*) AS count FROM User WHERE email = ?').get('new.user@example.test'))
        .toEqual({ count: 0 });
    } finally {
      fixture.close();
    }
  });

  it('limits upgrade requests before the request is stored', async () => {
    const response = await handleUpgradeRoute(requestFrom('/api/upgrade/request', '203.0.113.6'), {
      AUTH_RATE_LIMITER: limiter(false)
    }, new URL('https://consulting.edge/api/upgrade/request'));

    expect(response).toMatchObject({
      status: 429,
      body: { errorCode: API_ERROR_CODE.RATE_LIMITED, message: AUTH_RATE_LIMIT_MESSAGES.upgradeRequest }
    });
  });
});
