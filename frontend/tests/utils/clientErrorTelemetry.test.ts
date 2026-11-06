import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CLIENT_ERROR_REPORT_DEDUPE_MS,
  CLIENT_ERROR_REPORT_ENDPOINT,
  CLIENT_ERROR_REPORT_MAX_TRACKED_KEYS
} from '../../src/constants/errors';
import type { FrontendLogEntry } from '../../src/types/logger';
import {
  buildClientErrorReport,
  createClientRequestId,
  installClientErrorMonitoring,
  sanitizeClientErrorText,
  sendClientErrorReport
} from '../../src/utils/clientErrorTelemetry';
import { frontendLogger } from '../../src/utils/logger';

const entry = (overrides: Partial<FrontendLogEntry> = {}): FrontendLogEntry => ({
  timestamp: '2026-11-03T12:00:00.000Z',
  level: 'error',
  service: 'consulting-frontend',
  message: 'Rendering failed for a.person@example.com?token=private',
  context: { requestId: 'api-request-123' },
  error: {
    name: 'TypeError', message: 'Rendering failed for a.person@example.com?token=private',
    stack: 'TypeError at https://app.example.com/customers/12345?token=private:12:4'
  },
  ...overrides
});

describe('client error telemetry', () => {
  const browserWindow = window;
  beforeEach(() => {
    frontendLogger.clearHistory();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 202 })));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('builds a validated report with private values removed and request route reduced to a path', () => {
    window.history.replaceState({}, '', '/customers/123456?secret=private');
    const report = buildClientErrorReport(entry(), 'unsupported-source');
    expect(report).toMatchObject({
      level: 'error', source: 'logger', errorName: 'TypeError',
      route: '/customers/[id]', clientRequestId: 'api-request-123'
    });
    expect(report?.message).not.toContain('a.person@example.com');
    expect(report?.message).not.toContain('token=private');
    expect(report?.stack).not.toContain('token=private');
    expect(report?.stack).toContain('/customers/[id]');
    window.history.replaceState({}, '', '/');
  });

  it('skips non-error and server-side entries and rejects invalid timestamp payloads', () => {
    expect(buildClientErrorReport(entry({ level: 'warn', error: undefined }))).toBeNull();
    expect(buildClientErrorReport(entry({ level: 'warn', error: { name: 'Error', message: 'Recovered issue' } }))?.level)
      .toBe('warn');
    vi.stubGlobal('window', undefined);
    expect(buildClientErrorReport(entry())).toBeNull();
    vi.stubGlobal('window', browserWindow);
    expect(buildClientErrorReport(entry({ timestamp: 'bad timestamp' }))).toBeNull();
    expect(buildClientErrorReport(entry({ context: undefined, error: undefined }))?.clientRequestId).toBeTruthy();
  });

  it('sends a report once per repeated error and suppresses reporting transport failures', async () => {
    const fetchMock = vi.mocked(fetch);
    await sendClientErrorReport(entry());
    await sendClientErrorReport(entry());
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain(CLIENT_ERROR_REPORT_ENDPOINT);
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: 'POST', credentials: 'omit', keepalive: true });

    fetchMock.mockRejectedValueOnce(new Error('telemetry endpoint unavailable'));
    await expect(sendClientErrorReport(entry({
      message: 'Distinct telemetry failure', error: { name: 'Error', message: 'Distinct telemetry failure' }
    }))).resolves.toBeUndefined();
  });

  it('captures window errors and unhandled promise rejections and removes all listeners on cleanup', () => {
    const fetchMock = vi.mocked(fetch);
    const cleanup = installClientErrorMonitoring();
    window.dispatchEvent(new ErrorEvent('error', {
      message: 'window rendering failure', error: new Error('window rendering failure')
    }));
    window.dispatchEvent(new ErrorEvent('error', { message: 'window event without an Error object' }));
    const rejection = new Event('unhandledrejection');
    Object.defineProperty(rejection, 'reason', { value: 'unhandled operation failure' });
    window.dispatchEvent(rejection);
    const rejectionWithError = new Event('unhandledrejection');
    Object.defineProperty(rejectionWithError, 'reason', { value: new Error('rejected error instance') });
    window.dispatchEvent(rejectionWithError);
    const rejectionWithObject = new Event('unhandledrejection');
    Object.defineProperty(rejectionWithObject, 'reason', { value: { secret: 'not serialized' } });
    window.dispatchEvent(rejectionWithObject);
    expect(fetchMock).toHaveBeenCalledTimes(5);

    cleanup();
    window.dispatchEvent(new ErrorEvent('error', { message: 'after cleanup' }));
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });

  it('reports logger-caught exceptions but leaves routine warnings local', () => {
    const fetchMock = vi.mocked(fetch);
    const cleanup = installClientErrorMonitoring();
    frontendLogger.warn('Recovered without an exception');
    frontendLogger.warn('Recovered with an exception', {}, new Error('Recovered exception detail'));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    cleanup();
  });

  it('redacts bearer credentials, email, and phone values and respects the output limit', () => {
    const safe = sanitizeClientErrorText(
      'Bearer secret-value a.person@example.com 123-456-7890', 24
    );
    expect(safe).toHaveLength(24);
    expect(safe).not.toContain('secret-value');
    expect(safe).not.toContain('a.person@example.com');
  });

  it('uses safe defaults when browser location, error fields, request IDs, or URL parsing are unavailable', () => {
    vi.stubGlobal('crypto', undefined);
    expect(createClientRequestId()).toMatch(/^client-/);
    vi.stubGlobal('URL', class InvalidUrl { constructor() { throw new Error('invalid URL'); } });
    vi.stubGlobal('window', { location: { pathname: undefined } });

    const report = buildClientErrorReport(entry({
      message: '',
      context: { requestId: '' },
      error: { name: '', message: 'Bad URL https://[invalid', stack: undefined }
    }));

    expect(report).toMatchObject({
      route: '/',
      errorName: 'Error',
      message: 'Bad URL [REDACTED_URL]'
    });
    expect(report?.clientRequestId).toMatch(/^client-/);
  });

  it('uses the generic route when the browser path is an empty string', () => {
    vi.stubGlobal('window', { location: { pathname: '' } });
    expect(buildClientErrorReport(entry())?.route).toBe('/');
  });

  it('expires old dedupe entries and bounds the tracked error keys', async () => {
    const fetchMock = vi.mocked(fetch);
    vi.spyOn(Date, 'now')
      .mockReturnValueOnce(1_000)
      .mockReturnValueOnce(1_000 + CLIENT_ERROR_REPORT_DEDUPE_MS + 1);
    await sendClientErrorReport(entry({ message: 'expired report', error: { name: 'Error', message: 'expired report' } }));
    await sendClientErrorReport(entry({ message: 'fresh report', error: { name: 'Error', message: 'fresh report' } }));

    vi.spyOn(Date, 'now').mockReturnValue(1_000_000);
    for (let index = 0; index <= CLIENT_ERROR_REPORT_MAX_TRACKED_KEYS; index += 1) {
      const message = `bounded report ${index}`;
      await sendClientErrorReport(entry({ message, error: { name: 'Error', message } }));
    }
    expect(fetchMock).toHaveBeenCalledTimes(CLIENT_ERROR_REPORT_MAX_TRACKED_KEYS + 3);
  });
});
