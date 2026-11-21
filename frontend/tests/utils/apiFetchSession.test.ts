import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { apiFetch } from '../../src/utils/apiFetch';
import frontendLogger from '../../src/utils/logger';
import { AUTH_SESSION_EXPIRED_EVENT, AUTH_STORAGE_KEYS } from '../../src/constants/auth';
import { API_LOG_MESSAGES } from '../../src/constants/apiLogging';
import { API_REQUEST_ID_HEADER } from '../../src/constants/app';

const silenceLogger = (): void => undefined;

describe('apiFetch session and failure handling', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('clears the stored session and announces expiry when a token-bearing request is rejected', async () => {
    localStorage.setItem(AUTH_STORAGE_KEYS.AUTH_TOKEN, 'expired-token');
    localStorage.setItem(AUTH_STORAGE_KEYS.CURRENT_USER, '{"id":"usr-1"}');
    localStorage.setItem(AUTH_STORAGE_KEYS.SIMULATED_TIER, 'GOLD');
    localStorage.setItem(AUTH_STORAGE_KEYS.SELECTED_ASSESSMENT_ID, 'ASM-EXP');
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 401 }));
    const announce = vi.fn();
    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, announce);
    const warn = vi.spyOn(frontendLogger, 'warn').mockImplementation(silenceLogger as never);
    try {
      const response = await apiFetch('/api/categories');

      expect(response.status).toBe(401);
      expect(localStorage.getItem(AUTH_STORAGE_KEYS.AUTH_TOKEN)).toBeNull();
      expect(localStorage.getItem(AUTH_STORAGE_KEYS.CURRENT_USER)).toBeNull();
      expect(localStorage.getItem(AUTH_STORAGE_KEYS.SIMULATED_TIER)).toBeNull();
      expect(localStorage.getItem(AUTH_STORAGE_KEYS.SELECTED_ASSESSMENT_ID)).toBeNull();
      expect(announce).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(API_LOG_MESSAGES.sessionExpired, expect.objectContaining({
        path: '/api/categories', statusCode: 401
      }));
    } finally {
      window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, announce);
    }
  });

  it('keeps the session when an authentication endpoint rejects a credential', async () => {
    localStorage.setItem(AUTH_STORAGE_KEYS.AUTH_TOKEN, 'still-valid');
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 401 }));
    const announce = vi.fn();
    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, announce);
    vi.spyOn(frontendLogger, 'warn').mockImplementation(silenceLogger as never);
    try {
      await apiFetch('/api/auth/change-password', { method: 'POST' });

      expect(localStorage.getItem(AUTH_STORAGE_KEYS.AUTH_TOKEN)).toBe('still-valid');
      expect(announce).not.toHaveBeenCalled();
    } finally {
      window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, announce);
    }
  });

  it('does not treat a 401 as an expired session when the request carried no token', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 401 }));
    const announce = vi.fn();
    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, announce);
    vi.spyOn(frontendLogger, 'warn').mockImplementation(silenceLogger as never);
    try {
      await apiFetch('/api/categories');

      expect(announce).not.toHaveBeenCalled();
    } finally {
      window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, announce);
    }
  });

  it('logs failed backend responses with their status and request identifier', async () => {
    const warn = vi.spyOn(frontendLogger, 'warn').mockImplementation(silenceLogger as never);
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(null, {
      status: 404,
      headers: { [API_REQUEST_ID_HEADER]: 'req-404' }
    }));

    await apiFetch('/api/missing');

    expect(warn).toHaveBeenCalledWith(API_LOG_MESSAGES.httpFailure, expect.objectContaining({
      path: '/api/missing', statusCode: 404, requestId: 'req-404'
    }));
  });

  it('logs server failures at error level', async () => {
    const error = vi.spyOn(frontendLogger, 'error').mockImplementation(silenceLogger as never);
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 503 }));

    await apiFetch('/api/categories');

    expect(error).toHaveBeenCalledWith(API_LOG_MESSAGES.httpFailure, expect.objectContaining({ statusCode: 503 }));
  });

  it('logs a warning when browser storage refuses to clear the expired session', async () => {
    localStorage.setItem(AUTH_STORAGE_KEYS.AUTH_TOKEN, 'expired-token');
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 401 }));
    const warn = vi.spyOn(frontendLogger, 'warn').mockImplementation(silenceLogger as never);

    await apiFetch('/api/categories');

    expect(warn).toHaveBeenCalledWith(API_LOG_MESSAGES.sessionClearFailed, expect.objectContaining({
      action: 'api.session.clear'
    }), expect.any(Error));
  });

  it('still reports expiry and logs the storage failure when no browser window exists', async () => {
    vi.stubGlobal('window', undefined);
    try {
      globalThis.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 401 }));
      const warn = vi.spyOn(frontendLogger, 'warn').mockImplementation(silenceLogger as never);

      const response = await apiFetch('/api/categories', { headers: { Authorization: 'Bearer server-token' } });

      expect(response.status).toBe(401);
      expect(warn).toHaveBeenCalledWith(API_LOG_MESSAGES.sessionClearFailed, expect.objectContaining({
        path: '/api/categories'
      }), expect.any(Error));
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('logs a rejected token request that exposes no response headers using the request identifier', async () => {
    localStorage.setItem(AUTH_STORAGE_KEYS.AUTH_TOKEN, 'expired-token');
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 401 });
    const warn = vi.spyOn(frontendLogger, 'warn').mockImplementation(silenceLogger as never);

    await apiFetch('/api/categories', { headers: { 'x-request-id': 'req-no-headers' } });

    expect(warn).toHaveBeenCalledWith(API_LOG_MESSAGES.sessionExpired, expect.objectContaining({
      requestId: 'req-no-headers', statusCode: 401
    }));
  });
});