import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTH_STORAGE_KEYS } from '../../src/constants/auth';
import { apiFetch } from '../../src/utils/apiFetch';
import frontendLogger from '../../src/utils/logger';

describe('apiFetch', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    localStorage.clear();
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('attaches the stored bearer token to same-origin API paths', async () => {
    localStorage.setItem(AUTH_STORAGE_KEYS.AUTH_TOKEN, 'member-token');

    await apiFetch('/api/categories');

    const [, init] = vi.mocked(globalThis.fetch).mock.calls[0];
    const headers = new Headers(init?.headers);
    expect(headers.get('Authorization')).toBe('Bearer member-token');
    expect(headers.get('x-request-id')).toMatch(/^[A-Za-z0-9._:-]+$/u);
  });

  it('preserves a caller-supplied authorization header and merges request headers', async () => {
    localStorage.setItem(AUTH_STORAGE_KEYS.AUTH_TOKEN, 'stored-token');
    const request = new Request(`${window.location.origin}/api/report`, {
      headers: { Authorization: 'Bearer explicit-token', 'x-request-id': 'trace-1' }
    });

    await apiFetch(request, { headers: { 'Content-Type': 'application/json' } });

    const [, init] = vi.mocked(globalThis.fetch).mock.calls[0];
    const headers = new Headers(init?.headers);
    expect(headers.get('Authorization')).toBe('Bearer explicit-token');
    expect(headers.get('x-request-id')).toBe('trace-1');
    expect(headers.get('Content-Type')).toBe('application/json');
  });

  it('keeps anonymous and non-API requests unchanged', async () => {
    await apiFetch('/api/login');
    await apiFetch('/login');
    await apiFetch('https://assets.example.test/api/image');

    const calls = vi.mocked(globalThis.fetch).mock.calls;
    expect(calls).toHaveLength(3);
    expect(calls.every(([, init]) => !new Headers(init?.headers).has('Authorization'))).toBe(true);
  });

  it('falls back to the native fetch path when a request URL cannot be resolved', async () => {
    await apiFetch('http://[');

    expect(globalThis.fetch).toHaveBeenCalledWith('http://[');
  });

  it('logs correlated, query-free context when a backend API request fails before a response', async () => {
    const networkError = new Error('network unavailable');
    const errorLog = vi.spyOn(frontendLogger, 'error').mockImplementation(() => ({}) as never);
    globalThis.fetch = vi.fn().mockRejectedValue(networkError);

    await expect(apiFetch('/api/orders?token=private-value', {
      method: 'POST', headers: { 'x-request-id': 'request-123' }
    })).rejects.toBe(networkError);

    const [, init] = vi.mocked(globalThis.fetch).mock.calls[0];
    expect(errorLog).toHaveBeenCalledWith('Backend API request failed before a response was received', {
      action: 'api.request.fetch', method: 'POST', path: '/api/orders', statusCode: 0,
      requestId: new Headers(init?.headers).get('x-request-id')
    }, networkError);
    expect(new Headers(init?.headers).get('x-request-id')).toBe('request-123');
  });

  it('creates a correlation ID for an API request that has no caller-provided ID', async () => {
    const networkError = new Error('network unavailable');
    const errorLog = vi.spyOn(frontendLogger, 'error').mockImplementation(() => ({}) as never);
    globalThis.fetch = vi.fn().mockRejectedValue(networkError);

    await expect(apiFetch('/api/categories')).rejects.toBe(networkError);

    const [, init] = vi.mocked(globalThis.fetch).mock.calls[0];
    const requestId = new Headers(init?.headers).get('x-request-id');
    expect(requestId).toMatch(/^[A-Za-z0-9._:-]+$/u);
    expect(errorLog).toHaveBeenCalledWith('Backend API request failed before a response was received', expect.objectContaining({
      requestId
    }), networkError);
  });

  it('logs a warning and sends an anonymous request when browser storage is unavailable', async () => {
    const storageError = new Error('storage unavailable');
    const errorLog = vi.spyOn(frontendLogger, 'error').mockImplementation(() => ({}) as never);
    const warningLog = vi.spyOn(frontendLogger, 'warn').mockImplementation(() => ({}) as never);
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw storageError; });

    await expect(apiFetch('/api/categories')).resolves.toBeInstanceOf(Response);

    const [, init] = vi.mocked(globalThis.fetch).mock.calls[0];
    const headers = new Headers(init?.headers);
    expect(warningLog).toHaveBeenCalledWith('Browser auth token could not be read; continuing without stored credentials', expect.objectContaining({
      action: 'api.request.auth-token.read', path: '/api/categories', statusCode: 0,
      requestId: headers.get('x-request-id')
    }), storageError);
    expect(errorLog).not.toHaveBeenCalled();
    expect(headers.has('Authorization')).toBe(false);
    expect(headers.get('x-request-id')).toMatch(/^[A-Za-z0-9._:-]+$/u);
    expect(globalThis.fetch).toHaveBeenCalledOnce();
  });

  it('adds a request ID to relative API calls during server rendering', async () => {
    const originalWindow = global.window;
    delete (global as { window?: unknown }).window;

    await apiFetch('/api/categories');

    const [, init] = vi.mocked(globalThis.fetch).mock.calls[0];
    expect(new Headers(init?.headers).get('x-request-id')).toMatch(/^[A-Za-z0-9._:-]+$/u);
    global.window = originalWindow;
  });
});
