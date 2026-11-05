import { afterEach, describe, expect, it, vi } from 'vitest';
import { handleClientErrorTelemetry, sanitizeClientErrorText } from '../../src/services/clientErrorTelemetry';
import type { CloudflareEnvironment } from '../../src/types/cloudflare';
import logger from '../../src/utils/logger';

vi.mock('../../src/utils/logger', () => ({
  default: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
}));

const url = 'https://backend.example.com/api/telemetry/client-error';
const environment: CloudflareEnvironment = {
  FRONTEND_URL: 'https://app.example.com', NEXT_PUBLIC_APP_URL: 'https://app.example.com/dashboard'
};
const validReport = {
  level: 'error', source: 'window', errorName: 'TypeError', message: 'Cannot read property',
  stack: 'TypeError: Cannot read property at https://app.example.com/app.js:4:2',
  route: '/dashboard', occurredAt: '2026-11-03T12:00:00.000Z', clientRequestId: 'client-abc'
};
const requestFor = (body: BodyInit | null, headers: Record<string, string> = {}): Request => new Request(url, {
  method: 'POST',
  headers: { 'content-type': 'application/json', ...headers },
  ...(body === null ? {} : { body })
});

describe('client error telemetry endpoint', () => {
  afterEach(() => vi.clearAllMocks());

  it('rejects non-POST requests, unexpected browser origins, and non-JSON bodies', async () => {
    const getResponse = await handleClientErrorTelemetry(new Request(url), environment);
    const originResponse = await handleClientErrorTelemetry(requestFor(JSON.stringify(validReport), {
      origin: 'https://attacker.example'
    }), environment);
    const contentResponse = await handleClientErrorTelemetry(new Request(url, {
      method: 'POST', body: JSON.stringify(validReport), headers: { 'content-type': 'text/plain' }
    }), environment);

    expect(getResponse.status).toBe(405);
    expect(originResponse.status).toBe(403);
    expect(contentResponse.status).toBe(415);
  });

  it('rejects oversized reports before parsing and caps streamed bodies without a content length', async () => {
    const declaredLarge = requestFor('{}', { 'content-length': '5000' });
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('x'.repeat(5000)));
        controller.close();
      }
    });
    const streamedLarge = new Request(url, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: stream,
      duplex: 'half'
    } as RequestInit & { duplex: 'half' });

    expect((await handleClientErrorTelemetry(declaredLarge, environment)).status).toBe(413);
    expect((await handleClientErrorTelemetry(streamedLarge, environment)).status).toBe(413);
  });

  it('rejects invalid JSON and schema fields, including unexpected unvalidated data', async () => {
    const invalidJson = await handleClientErrorTelemetry(requestFor('not-json'), environment);
    const invalidFields = await handleClientErrorTelemetry(requestFor(JSON.stringify({
      ...validReport, level: 'warn', context: { uploadedWorkbook: 'private' }
    })), environment);
    const missingBody = await handleClientErrorTelemetry(requestFor(null), environment);

    expect(invalidJson.status).toBe(400);
    expect(invalidFields.status).toBe(400);
    expect(missingBody.status).toBe(400);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('accepts a validated report and logs scrubbed fields with request correlation', async () => {
    const payload = {
      ...validReport,
      message: 'User a.person@example.com called token=secret-value at 123-456-7890',
      stack: 'Error at /api?access_token=private',
      route: '/customers/123456',
      clientRequestId: 'client-abc'
    };
    const request = requestFor(JSON.stringify(payload), {
      origin: 'https://app.example.com', 'x-request-id': 'server-request-1'
    });
    const response = await handleClientErrorTelemetry(request, environment);

    expect(response.status, JSON.stringify(await response.clone().json())).toBe(202);
    expect(await response.json()).toEqual({ success: true });
    expect(logger.error).toHaveBeenCalledWith('Browser reported an application error', expect.objectContaining({
      requestId: 'server-request-1', clientRequestId: 'client-abc', route: '/customers/[id]'
    }), expect.objectContaining({
      message: expect.stringContaining('[REDACTED_EMAIL]'),
      stack: expect.stringContaining('access_token=[REDACTED]')
    }));
    const serialized = JSON.stringify(vi.mocked(logger.error).mock.calls[0]);
    expect(serialized).not.toContain('a.person@example.com');
    expect(serialized).not.toContain('secret-value');
    expect(serialized).not.toContain('123-456-7890');
  });

  it('records caught warning exceptions at warning severity', async () => {
    const response = await handleClientErrorTelemetry(requestFor(JSON.stringify({
      ...validReport, level: 'warn', source: 'logger'
    })), environment);
    expect(response.status).toBe(202);
    expect(logger.warn).toHaveBeenCalledWith('Browser reported a recovered application exception', expect.any(Object), expect.any(Error));
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('scrubs secrets and safely truncates diagnostic strings', () => {
    const safe = sanitizeClientErrorText(
      'Bearer very-secret password=pw123 a.person@example.com 123-456-7890 token=eyJ12345678901.abcdefghijk.abcdefghijk', 45
    );
    expect(safe).toHaveLength(45);
    expect(safe).not.toContain('very-secret');
    expect(safe).not.toContain('a.person@example.com');
    const safeUrl = sanitizeClientErrorText('See https://app.example.com/path?token=private', 180);
    expect(safeUrl).toContain('https://app.example.com/path');
    expect(safeUrl).not.toContain('private');
    expect(sanitizeClientErrorText('Broken URL https://%', 120)).toContain('[REDACTED_URL]');
  });

  it('rejects malformed configured frontend URLs without throwing', async () => {
    const invalidConfiguration = { FRONTEND_URL: 'not a URL' };
    const response = await handleClientErrorTelemetry(requestFor(JSON.stringify(validReport), {
      origin: 'https://app.example.com'
    }), invalidConfiguration);
    expect(response.status).toBe(403);
  });
});
