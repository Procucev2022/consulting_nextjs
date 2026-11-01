import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ExecutiveOpportunityBriefViewProps } from '../../src/types';
import { UI_STRINGS } from '../../src/constants/uiStrings';
import { frontendLogger } from '../../src/utils/logger';
import { authApiClient } from '../../src/utils/authApi';
import ExecutiveBriefPage from '../../src/app/executive-brief/page';

const { mockPush } = vi.hoisted(() => ({ mockPush: vi.fn() }));

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));

vi.mock('../../src/components/presentation/ExecutiveOpportunityBriefView', () => ({
  ExecutiveOpportunityBriefView: (props: ExecutiveOpportunityBriefViewProps): React.ReactElement => (
    <section>
      <button type="button" data-testid="download-pdf" onClick={props.onDownloadPdf}>
        {UI_STRINGS.opportunityBrief.downloadPdf}
      </button>
      <button type="button" data-testid="download-pptx" onClick={props.onDownloadPptx}>
        {UI_STRINGS.opportunityBrief.downloadPptx}
      </button>
      <button type="button" data-testid="back-to-workspace" onClick={props.onBackToWorkspace}>
        {UI_STRINGS.opportunityBrief.backToWorkspace}
      </button>
    </section>
  )
}));

const createDownloadResponse = (headers: Record<string, string> = {}): Response => ({
  ok: true,
  status: 200,
  headers: new Headers(headers),
  blob: async () => new Blob(['report-bytes'])
}) as Response;

describe('ExecutiveBriefPage', () => {
  beforeEach(() => {
    mockPush.mockClear();
    vi.spyOn(frontendLogger, 'error').mockImplementation(() => ({}) as never);
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:executive-brief');
    window.URL.revokeObjectURL = vi.fn();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(createDownloadResponse()));
    vi.spyOn(authApiClient, 'getStoredToken').mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('downloads the D1-backed PDF and releases its object URL on unmount', async () => {
    vi.spyOn(authApiClient, 'getStoredToken').mockReturnValue('session-token');
    const { unmount } = render(<ExecutiveBriefPage />);
    fireEvent.click(screen.getByTestId('download-pdf'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/reports/executive-brief/download/opportunity-brief/pdf',
        { headers: { Authorization: 'Bearer ' + 'session-token' } }
      );
      expect(window.URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
      expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledOnce();
    });

    unmount();
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:executive-brief');
  });

  it('uses the server supplied filename and supports PPTX downloads', async () => {
    const blob = new Blob(['pptx-bytes']);
    vi.mocked(fetch).mockResolvedValueOnce(createDownloadResponse({ 'content-disposition': 'attachment; filename="customer-brief.pptx"' }));
    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:pptx');
    render(<ExecutiveBriefPage />);

    fireEvent.click(screen.getByTestId('download-pptx'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/reports/executive-brief/download/opportunity-brief/pptx',
        { headers: {} }
      );
      expect(window.URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
      expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledOnce();
    });
    expect(blob.size).toBeGreaterThan(0);
    expect(document.querySelector('[download="customer-brief.pptx"]')).toBeInTheDocument();
  });

  it('uses the centralized default filename when the server omits one', async () => {
    render(<ExecutiveBriefPage />);
    fireEvent.click(screen.getByTestId('download-pdf'));

    await waitFor(() => {
      expect(document.querySelector(`[download="${UI_STRINGS.opportunityBrief.downloadFilename('pdf')}"]`)).toBeInTheDocument();
    });
  });

  it('shows a detailed server failure and request ID when download is rejected', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      headers: new Headers({ 'x-request-id': 'req-brief-503' })
    }));
    render(<ExecutiveBriefPage />);
    fireEvent.click(screen.getByTestId('download-pdf'));

    expect(await screen.findByTestId('brief-download-error')).toHaveTextContent(
      UI_STRINGS.opportunityBrief.downloadFailed('PDF', 503, 'req-brief-503')
    );
    expect(frontendLogger.error).toHaveBeenCalledWith(
      'Opportunity brief download was rejected by the server',
      expect.objectContaining({ statusCode: 503, requestId: 'req-brief-503' })
    );
  });

  it('uses the centralized request ID fallback when a failed response has no correlation header', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      headers: new Headers()
    }));
    render(<ExecutiveBriefPage />);
    fireEvent.click(screen.getByTestId('download-pptx'));

    expect(await screen.findByTestId('brief-download-error')).toHaveTextContent(
      UI_STRINGS.opportunityBrief.downloadFailed('PPTX', 500, UI_STRINGS.opportunityBrief.requestIdNotReturned)
    );
  });

  it('shows an actionable network error and logs the failure context', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    render(<ExecutiveBriefPage />);
    fireEvent.click(screen.getByTestId('download-pdf'));

    expect(await screen.findByTestId('brief-download-error')).toHaveTextContent(
      UI_STRINGS.opportunityBrief.downloadNetworkFailed('PDF')
    );
    expect(frontendLogger.error).toHaveBeenCalledWith(
      'Opportunity brief download request failed',
      expect.objectContaining({ format: 'pdf' }),
      expect.any(Error)
    );
  });

  it('returns to the procurement workspace', () => {
    render(<ExecutiveBriefPage />);
    fireEvent.click(screen.getByTestId('back-to-workspace'));
    expect(mockPush).toHaveBeenCalledWith('/');
  });
});
