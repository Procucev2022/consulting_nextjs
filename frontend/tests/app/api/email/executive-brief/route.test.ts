import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/email/executive-brief/route';
import { API_REQUEST_ID_HEADER, EXECUTIVE_OPPORTUNITY_BRIEF_EMAIL_ENDPOINT, UI_STRINGS } from '@/constants';
import { getApiBaseUrl } from '@/utils/apiBase';
import frontendLogger from '@/utils/logger';

vi.mock('@/utils/apiBase', () => ({ getApiBaseUrl: vi.fn(() => 'https://backend.example.test') }));
vi.mock('@/utils/logger', () => ({ default: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));

const routeRequest = (body: string, authorization?: string, requestId?: string): Request => new Request(
  'https://app.example.test/api/email/executive-brief',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(requestId ? { [API_REQUEST_ID_HEADER]: requestId } : {}),
      ...(authorization ? { Authorization: authorization } : {})
    },
    body
  }
);

describe('D1 Executive Brief email proxy', () => {
  beforeEach(() => {
    vi.mocked(getApiBaseUrl).mockReturnValue('https://backend.example.test');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('forwards the validated recipient and signed-in authorization to the D1 Worker', async () => {
    vi.stubEnv('BACKEND_API_URL', 'https://backend.example.test/');
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ success: true, message: 'Sent from D1' }), {
      status: 200,
      headers: { [API_REQUEST_ID_HEADER]: 'worker-brief-123' }
    }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await POST(routeRequest('{"buyerEmail":"buyer@example.test"}', 'Bearer user-token', 'browser-request-123'));
    expect(response.status).toBe(200);
    expect(response.headers.get(API_REQUEST_ID_HEADER)).toBe('worker-brief-123');
    expect(await response.json()).toEqual({ success: true, message: 'Sent from D1' });
    expect(fetchMock).toHaveBeenCalledWith(
      `https://backend.example.test${EXECUTIVE_OPPORTUNITY_BRIEF_EMAIL_ENDPOINT}`,
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer user-token',
          [API_REQUEST_ID_HEADER]: 'browser-request-123'
        },
        body: JSON.stringify({ buyerEmail: 'buyer@example.test' })
      })
    );
  });

  it('rejects malformed JSON and invalid recipients before calling the backend', async () => {
    vi.stubEnv('BACKEND_API_URL', 'https://backend.example.test');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const malformed = await POST(routeRequest('{', 'Bearer token', 'malformed-request-1'));
    expect(malformed.status).toBe(400);
    expect(malformed.headers.get(API_REQUEST_ID_HEADER)).toBe('malformed-request-1');
    expect((await malformed.json()).message).toBe(UI_STRINGS.module5.emailInvalidRequest);
    const invalid = await POST(routeRequest('{"buyerEmail":"invalid"}', 'Bearer token'));
    expect(invalid.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns an actionable configuration error when no backend URL is set', async () => {
    vi.stubEnv('BACKEND_API_URL', '');
    vi.mocked(getApiBaseUrl).mockReturnValue('');
    const response = await POST(routeRequest('{"buyerEmail":"buyer@example.test"}', 'Bearer token'));
    expect(response.status).toBe(503);
    expect((await response.json()).message).toBe(UI_STRINGS.module5.emailBackendUnavailable);
  });

  it('requires an Authorization header', async () => {
    vi.stubEnv('BACKEND_API_URL', 'https://backend.example.test');
    const response = await POST(routeRequest('{"buyerEmail":"buyer@example.test"}', undefined, 'unauthorized-request-1'));
    expect(response.status).toBe(401);
    expect(response.headers.get(API_REQUEST_ID_HEADER)).toBe('unauthorized-request-1');
    expect((await response.json()).message).toBe(UI_STRINGS.errors.auth.sessionExpired);
    expect(frontendLogger.warn).toHaveBeenCalledWith('Executive brief email request had no authorization header', expect.objectContaining({
      requestId: 'unauthorized-request-1', statusCode: 401
    }));
  });

  it('preserves Worker error statuses and bodies', async () => {
    vi.stubEnv('BACKEND_API_URL', 'https://backend.example.test');
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ success: false, message: 'D1 unavailable' }), {
      status: 503,
      headers: { [API_REQUEST_ID_HEADER]: 'worker-unavailable-123' }
    })));
    const response = await POST(routeRequest('{"buyerEmail":"buyer@example.test"}', 'Bearer token', 'browser-error-123'));
    expect(response.status).toBe(503);
    expect(response.headers.get(API_REQUEST_ID_HEADER)).toBe('worker-unavailable-123');
    expect((await response.json()).message).toBe('D1 unavailable');
    expect(frontendLogger.error).toHaveBeenCalledWith('Executive brief email backend rejected the request', expect.objectContaining({
      requestId: 'browser-error-123', backendRequestId: 'worker-unavailable-123', statusCode: 503
    }));
  });

  it('returns gateway errors for malformed Worker responses and network failures', async () => {
    vi.stubEnv('BACKEND_API_URL', 'https://backend.example.test');
    vi.stubGlobal('fetch', vi.fn(async () => new Response('null', { status: 200 })));
    const malformed = await POST(routeRequest('{"buyerEmail":"buyer@example.test"}', 'Bearer token'));
    expect(malformed.status).toBe(502);
    expect((await malformed.json()).message).toBe(UI_STRINGS.module5.emailError);
    expect(frontendLogger.error).toHaveBeenCalledWith('Executive brief email backend returned a non-object response', expect.objectContaining({
      responseStatusCode: 502, statusCode: 200
    }));

    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network failure'); }));
    const failed = await POST(routeRequest('{"buyerEmail":"buyer@example.test"}', 'Bearer token', 'browser-network-123'));
    expect(failed.status).toBe(502);
    expect(failed.headers.get(API_REQUEST_ID_HEADER)).toBe('browser-network-123');
    expect((await failed.json()).message).toBe(UI_STRINGS.module5.emailNetworkError);
    expect(frontendLogger.error).toHaveBeenCalledWith('Executive brief email backend request or response parsing failed', expect.objectContaining({
      requestId: 'browser-network-123', responseStatusCode: 502
    }), expect.any(Error));
  });

  it('replaces an invalid incoming request ID before forwarding it', async () => {
    vi.stubEnv('BACKEND_API_URL', 'https://backend.example.test');
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      new Response(JSON.stringify({ success: true }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await POST(routeRequest('{"buyerEmail":"buyer@example.test"}', 'Bearer token', 'invalid request id'));
    const forwardedHeaders = new Headers(fetchMock.mock.calls[0]?.[1]?.headers);
    const resolvedRequestId = response.headers.get(API_REQUEST_ID_HEADER);
    expect(resolvedRequestId).toMatch(/^[A-Za-z0-9._-]{1,128}$/u);
    expect(forwardedHeaders.get(API_REQUEST_ID_HEADER)).toBe(resolvedRequestId);
  });
});
