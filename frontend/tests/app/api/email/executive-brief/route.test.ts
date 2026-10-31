import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/email/executive-brief/route';
import { EXECUTIVE_OPPORTUNITY_BRIEF_EMAIL_ENDPOINT, UI_STRINGS } from '@/constants';
import { getApiBaseUrl } from '@/utils/apiBase';

vi.mock('@/utils/apiBase', () => ({ getApiBaseUrl: vi.fn(() => 'https://backend.example.test') }));

const routeRequest = (body: string, authorization?: string): Request => new Request(
  'https://app.example.test/api/email/executive-brief',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
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
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ success: true, message: 'Sent from D1' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await POST(routeRequest('{"buyerEmail":"buyer@example.test"}', 'Bearer user-token'));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, message: 'Sent from D1' });
    expect(fetchMock).toHaveBeenCalledWith(
      `https://backend.example.test${EXECUTIVE_OPPORTUNITY_BRIEF_EMAIL_ENDPOINT}`,
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer user-token' },
        body: JSON.stringify({ buyerEmail: 'buyer@example.test' })
      })
    );
  });

  it('rejects malformed JSON and invalid recipients before calling the backend', async () => {
    vi.stubEnv('BACKEND_API_URL', 'https://backend.example.test');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const malformed = await POST(routeRequest('{', 'Bearer token'));
    expect(malformed.status).toBe(400);
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
    const response = await POST(routeRequest('{"buyerEmail":"buyer@example.test"}'));
    expect(response.status).toBe(401);
    expect((await response.json()).message).toBe(UI_STRINGS.errors.auth.sessionExpired);
  });

  it('preserves Worker error statuses and bodies', async () => {
    vi.stubEnv('BACKEND_API_URL', 'https://backend.example.test');
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ success: false, message: 'D1 unavailable' }), { status: 503 })));
    const response = await POST(routeRequest('{"buyerEmail":"buyer@example.test"}', 'Bearer token'));
    expect(response.status).toBe(503);
    expect((await response.json()).message).toBe('D1 unavailable');
  });

  it('returns gateway errors for malformed Worker responses and network failures', async () => {
    vi.stubEnv('BACKEND_API_URL', 'https://backend.example.test');
    vi.stubGlobal('fetch', vi.fn(async () => new Response('null', { status: 200 })));
    const malformed = await POST(routeRequest('{"buyerEmail":"buyer@example.test"}', 'Bearer token'));
    expect(malformed.status).toBe(502);
    expect((await malformed.json()).message).toBe(UI_STRINGS.module5.emailError);

    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network failure'); }));
    const failed = await POST(routeRequest('{"buyerEmail":"buyer@example.test"}', 'Bearer token'));
    expect(failed.status).toBe(502);
    expect((await failed.json()).message).toBe(UI_STRINGS.module5.emailNetworkError);
  });
});
