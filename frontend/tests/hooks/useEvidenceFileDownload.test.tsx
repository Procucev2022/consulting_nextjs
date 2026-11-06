/**
 * Unit tests for useEvidenceFileDownload: authenticated fetch, Blob hand-off, declarative click,
 * and user-facing failure messages.
 */

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { EVIDENCE_DOWNLOAD_CONSTANTS } from '../../src/constants/evidenceDownload';
import { UI_STRINGS } from '../../src/constants/uiStrings';
import { useEvidenceFileDownload } from '../../src/hooks/useEvidenceFileDownload';
import { apiClient } from '../../src/utils/api';
import { frontendLogger } from '../../src/utils/logger';

interface FakeResponseInit {
  ok: boolean;
  status: number;
  body?: unknown;
  invalidJson?: boolean;
  headers?: Record<string, string>;
}

const fakeResponse = (init: FakeResponseInit): Response => ({
  ok: init.ok,
  status: init.status,
  headers: { get: (name: string): string | null => init.headers?.[name] ?? null },
  json: async (): Promise<unknown> => {
    if (init.invalidJson) throw new SyntaxError('Unexpected token < in JSON');
    return init.body;
  },
  blob: async (): Promise<Blob> => new Blob(['workbook-bytes'])
}) as unknown as Response;

const HOOK_KEY = 'MODULE_1_EVIDENCE';
const HOOK_URL = '/api/evidence/jobs/AIC-1/workbooks/MODULE_1_EVIDENCE/download';
const HOOK_FILENAME = '01_Module_1_Evidence.xlsx';
const DOWNLOAD_FAILURE = UI_STRINGS.evidence.downloadFailure;

const Harness: React.FC = () => {
  const { downloadPayload, downloadLinkRef, downloadError, pendingKey, requestDownload } = useEvidenceFileDownload();
  return (
    <div>
      <button type="button" onClick={() => void requestDownload(HOOK_KEY, HOOK_URL, HOOK_FILENAME)}>
        start
      </button>
      <span data-testid="pending">{pendingKey ?? 'idle'}</span>
      {downloadError && <p role="alert">{downloadError}</p>}
      {downloadPayload && (
        <a ref={downloadLinkRef} href={downloadPayload.href} download={downloadPayload.filename} data-testid="anchor" />
      )}
    </div>
  );
};

describe('useEvidenceFileDownload', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(apiClient, 'getStoredToken').mockReturnValue('tok-1');
    vi.spyOn(frontendLogger, 'error').mockImplementation(() => ({}) as never);
    URL.createObjectURL = vi.fn(() => 'blob:evidence-1');
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches with the Bearer token and exposes a Blob payload for the declarative anchor', async () => {
    const fetchMock = vi.fn().mockResolvedValue(fakeResponse({ ok: true, status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useEvidenceFileDownload());

    await act(async () => {
      await result.current.requestDownload(HOOK_KEY, HOOK_URL, HOOK_FILENAME);
    });

    const [requestedUrl, init] = fetchMock.mock.calls[0];
    const headers = new Headers(init?.headers);
    expect(requestedUrl).toBe(HOOK_URL);
    expect(headers.get(EVIDENCE_DOWNLOAD_CONSTANTS.AUTH_HEADER)).toBe('Bearer tok-1');
    expect(headers.get(EVIDENCE_DOWNLOAD_CONSTANTS.REQUEST_ID_HEADER)).toMatch(/^[A-Za-z0-9._:-]+$/u);
    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(result.current.downloadPayload).toEqual({ href: 'blob:evidence-1', filename: HOOK_FILENAME });
    expect(result.current.downloadError).toBeNull();
    expect(result.current.pendingKey).toBeNull();
  });

  it('clicks the rendered anchor and revokes the Blob URL after the delay', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fakeResponse({ ok: true, status: 200 })));
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    render(<Harness />);

    fireEvent.click(screen.getByText('start'));

    await waitFor(() => expect(clickSpy).toHaveBeenCalled());
    expect(screen.getByTestId('anchor')).toHaveAttribute('href', 'blob:evidence-1');
    expect(screen.getByTestId('anchor')).toHaveAttribute('download', HOOK_FILENAME);
    await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:evidence-1'), {
      timeout: EVIDENCE_DOWNLOAD_CONSTANTS.REVOKE_DELAY_MS + 2000
    });
  });

  it('shows the in-flight key while the request runs', async () => {
    let resolveFetch: (value: Response) => void = () => undefined;
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>((resolve) => { resolveFetch = resolve; })));
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    render(<Harness />);

    fireEvent.click(screen.getByText('start'));
    expect(screen.getByTestId('pending')).toHaveTextContent(HOOK_KEY);

    await act(async () => {
      resolveFetch(fakeResponse({ ok: true, status: 200 }));
    });
    expect(screen.getByTestId('pending')).toHaveTextContent('idle');
  });

  it('sends no Authorization header when the user has no stored token', async () => {
    vi.spyOn(apiClient, 'getStoredToken').mockReturnValue(null);
    const fetchMock = vi.fn().mockResolvedValue(fakeResponse({ ok: true, status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useEvidenceFileDownload());

    await act(async () => {
      await result.current.requestDownload(HOOK_KEY, HOOK_URL, HOOK_FILENAME);
    });

    const [requestedUrl, init] = fetchMock.mock.calls[0];
    const headers = new Headers(init?.headers);
    expect(requestedUrl).toBe(HOOK_URL);
    expect(headers.has(EVIDENCE_DOWNLOAD_CONSTANTS.AUTH_HEADER)).toBe(false);
    expect(headers.get(EVIDENCE_DOWNLOAD_CONSTANTS.REQUEST_ID_HEADER)).toMatch(/^[A-Za-z0-9._:-]+$/u);
  });

  it('turns a JSON failure into a message with the file, status, reason, and request ID', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fakeResponse({
      ok: false,
      status: 409,
      body: { message: 'No ProcurementTransaction rows are linked to job AIC-1.', requestId: 'req-42' }
    })));
    const errorSpy = vi.mocked(frontendLogger.error);
    const { result } = renderHook(() => useEvidenceFileDownload());

    await act(async () => {
      await result.current.requestDownload(HOOK_KEY, HOOK_URL, HOOK_FILENAME);
    });

    const expected = DOWNLOAD_FAILURE.httpFailure(HOOK_FILENAME, 409, 'No ProcurementTransaction rows are linked to job AIC-1.', 'req-42');
    expect(result.current.downloadError).toBe(expected);
    expect(result.current.downloadPayload).toBeNull();
    expect(errorSpy).toHaveBeenCalledWith('Evidence download failed', expect.objectContaining({ statusCode: 409, requestId: 'req-42' }));
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('falls back to the response header request ID and a generic detail for non-JSON errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fakeResponse({
      ok: false,
      status: 502,
      invalidJson: true,
      headers: { [EVIDENCE_DOWNLOAD_CONSTANTS.REQUEST_ID_HEADER]: 'hdr-7' }
    })));
    const { result } = renderHook(() => useEvidenceFileDownload());

    await act(async () => {
      await result.current.requestDownload(HOOK_KEY, HOOK_URL, HOOK_FILENAME);
    });

    expect(result.current.downloadError).toBe(DOWNLOAD_FAILURE.httpFailure(HOOK_FILENAME, 502, DOWNLOAD_FAILURE.noServerDetail, 'hdr-7'));
  });

  it.each([
    ['a null JSON body', { body: null }],
    ['a non-object JSON body', { body: 'plain text' }],
    ['a message that is not a string', { body: { message: 12 } }],
    ['an empty message', { body: { message: '' } }]
  ])('uses the generic detail for %s and omits the request note when no ID exists', async (_label, extra) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fakeResponse({ ok: false, status: 500, ...extra })));
    const { result } = renderHook(() => useEvidenceFileDownload());

    await act(async () => {
      await result.current.requestDownload(HOOK_KEY, HOOK_URL, HOOK_FILENAME);
    });

    expect(result.current.downloadError).toBe(DOWNLOAD_FAILURE.httpFailure(HOOK_FILENAME, 500, DOWNLOAD_FAILURE.noServerDetail, null));
    expect(result.current.downloadError).not.toContain('Request ID');
  });

  it('reports a network failure with the underlying cause', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Failed to fetch')));
    const { result } = renderHook(() => useEvidenceFileDownload());

    await act(async () => {
      await result.current.requestDownload(HOOK_KEY, HOOK_URL, HOOK_FILENAME);
    });

    expect(result.current.downloadError).toBe(DOWNLOAD_FAILURE.networkFailure(HOOK_FILENAME, 'Failed to fetch'));
  });

  it('describes non-Error rejections as text', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('offline'));
    const { result } = renderHook(() => useEvidenceFileDownload());

    await act(async () => {
      await result.current.requestDownload(HOOK_KEY, HOOK_URL, HOOK_FILENAME);
    });

    expect(result.current.downloadError).toBe(DOWNLOAD_FAILURE.networkFailure(HOOK_FILENAME, 'offline'));
  });

  it('clears a previous error when a new download starts', async () => {
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new Error('down'))
      .mockResolvedValueOnce(fakeResponse({ ok: true, status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useEvidenceFileDownload());

    await act(async () => {
      await result.current.requestDownload(HOOK_KEY, HOOK_URL, HOOK_FILENAME);
    });
    expect(result.current.downloadError).not.toBeNull();

    await act(async () => {
      await result.current.requestDownload(HOOK_KEY, HOOK_URL, HOOK_FILENAME);
    });
    expect(result.current.downloadError).toBeNull();
  });
});
