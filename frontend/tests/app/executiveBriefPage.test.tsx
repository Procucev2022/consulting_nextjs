import React from 'react';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ExecutiveBriefPage from '../../src/app/executive-brief/page';
import { EXECUTIVE_BRIEF_EXPORT_STRINGS } from '../../src/constants/executiveBriefExportStrings';
import { UI_STRINGS } from '../../src/constants/uiStrings';
import { apiClient } from '../../src/utils/api';
import { frontendLogger } from '../../src/utils/logger';
import { mockReportData } from '../fixtures/executiveBriefMockData';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  })
}));

const PAGE = UI_STRINGS.executiveBriefPage;
const REGENERATE_URL = '/api/reports/executive-brief/regenerate';

interface FakeReply {
  ok: boolean;
  status: number;
  headers?: Headers;
  json?: () => Promise<unknown>;
}

const jsonReply = (status: number, body: unknown, headers: Record<string, string> = {}): FakeReply => ({
  ok: status >= 200 && status < 300,
  status,
  headers: new Headers(headers),
  json: async (): Promise<unknown> => body
});

const reportReply = (): FakeReply => jsonReply(200, { success: true, data: mockReportData });

const stubRegenerateReply = (reply: FakeReply): ReturnType<typeof vi.fn> => {
  const fetchMock = vi.fn().mockImplementation((url: string) => {
    if (url.includes('/regenerate')) return Promise.resolve(reply);
    if (url.includes('/report')) return Promise.resolve(reportReply());
    return Promise.resolve({ ok: true, status: 200, json: async () => ({ success: true, data: mockReportData }) });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

const openRegenerateAndConfirm = async (): Promise<void> => {
  await waitFor(() => {
    expect(screen.getByTestId('admin-regenerate-brief-btn')).toBeInTheDocument();
  });
  fireEvent.click(screen.getByTestId('admin-regenerate-brief-btn'));
  await act(async () => {
    fireEvent.click(screen.getByTestId('confirm-regenerate-btn'));
  });
};

describe('ExecutiveBriefPage', () => {
  beforeEach(() => {
    mockPush.mockClear();
    vi.spyOn(apiClient, 'getStoredToken').mockReturnValue('tok-admin');
    vi.spyOn(frontendLogger, 'error').mockImplementation(() => ({}) as never);
    vi.spyOn(frontendLogger, 'warn').mockImplementation(() => ({}) as never);
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('/api/reports/executive-brief/report')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ success: true, data: mockReportData })
          });
        }
        if (url.includes('/api/reports/executive-brief/download/')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            headers: new Headers({ 'content-disposition': 'attachment; filename="test.pdf"' }),
            blob: async () => new Blob(['dummy pdf buffer'], { type: 'application/pdf' })
          });
        }
        if (url.includes('/api/reports/executive-brief/regenerate')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ success: true, data: {} })
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          text: async () => '# Executive Brief Audit Mock'
        });
      })
    );

    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading state and then populates full report workspace', async () => {
    render(<ExecutiveBriefPage />);
    expect(screen.getByText(PAGE.loadingTitle)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText(mockReportData.clientProfile.clientName).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Total Evaluated Spend')).toBeInTheDocument();
      expect(screen.getByText('Executive Overview')).toBeInTheDocument();
    });
    expect(screen.getByText(PAGE.footer.encryptedBadge)).toBeInTheDocument();
    expect(screen.getByText(PAGE.footer.productLine)).toBeInTheDocument();
    expect(screen.getByText(PAGE.footer.copyright(new Date().getFullYear()))).toBeInTheDocument();
  });

  it('handles empty or error state when report fetch fails and clicking return', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500
      })
    );

    render(<ExecutiveBriefPage />);
    await waitFor(() => {
      expect(screen.getByText(EXECUTIVE_BRIEF_EXPORT_STRINGS.emptyState.notReadyTitle)).toBeInTheDocument();
    });

    const returnBtn = screen.getByRole('button', {
      name: new RegExp(EXECUTIVE_BRIEF_EXPORT_STRINGS.emptyState.returnToPipeline, 'i')
    });
    fireEvent.click(returnBtn);
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('handles report response with success: false and default fallback message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: false })
      })
    );

    render(<ExecutiveBriefPage />);
    await waitFor(() => {
      expect(screen.getByText(EXECUTIVE_BRIEF_EXPORT_STRINGS.emptyState.notReadyTitle)).toBeInTheDocument();
    });
  });

  it('handles non-Error object thrown during fetch', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValueOnce('Network string failure')
    );

    render(<ExecutiveBriefPage />);
    await waitFor(() => {
      expect(screen.getByText(EXECUTIVE_BRIEF_EXPORT_STRINGS.emptyState.notReadyTitle)).toBeInTheDocument();
    });
  });

  it('handles PDF and PPTX download actions', async () => {
    render(<ExecutiveBriefPage />);
    await waitFor(() => {
      expect(screen.getByTestId('download-pdf-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('download-pdf-btn'));
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/reports/executive-brief/download/pdf');
    });

    await waitFor(() => {
      expect(screen.getByTestId('download-pptx-btn')).not.toBeDisabled();
    });

    fireEvent.click(screen.getByTestId('download-pptx-btn'));
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/reports/executive-brief/download/pptx');
    });
  });

  it('names the download from the client when the server sends no file name', async () => {
    render(<ExecutiveBriefPage />);
    await waitFor(() => {
      expect(screen.getByTestId('download-pdf-btn')).toBeInTheDocument();
    });

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
        blob: async () => new Blob(['pdf'], { type: 'application/pdf' })
      })
    );
    fireEvent.click(screen.getByTestId('download-pdf-btn'));

    await waitFor(() => {
      expect(window.URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    });
  });

  it('falls back to the default client label in the file name when the client name is empty', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('/download/')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            headers: new Headers(),
            blob: async () => new Blob(['pdf'], { type: 'application/pdf' })
          });
        }
        return Promise.resolve(jsonReply(200, {
          success: true,
          data: { ...mockReportData, clientProfile: { ...mockReportData.clientProfile, clientName: '' } }
        }));
      })
    );
    render(<ExecutiveBriefPage />);
    await waitFor(() => {
      expect(screen.getByTestId('download-pdf-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('download-pdf-btn'));

    await waitFor(() => {
      expect(window.URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    });
  });

  it('handles download error gracefully', async () => {
    render(<ExecutiveBriefPage />);
    await waitFor(() => {
      expect(screen.getByTestId('download-pdf-btn')).toBeInTheDocument();
    });

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('/download/pdf')) {
          return Promise.resolve({ ok: false, status: 500 });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: mockReportData })
        });
      })
    );

    fireEvent.click(screen.getByTestId('download-pdf-btn'));
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/reports/executive-brief/download/pdf');
    });
    await waitFor(() => {
      expect(frontendLogger.error).toHaveBeenCalledWith('Export download error', expect.objectContaining({ format: 'pdf' }));
    });
  });

  it('handles slide preview actions', async () => {
    render(<ExecutiveBriefPage />);
    await waitFor(() => {
      expect(screen.getByTestId('preview-open-full-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('preview-open-full-btn'));
    fireEvent.click(screen.getByTestId('preview-download-pdf-btn'));
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/reports/executive-brief/download/pdf');
    });
  });

  it('handles evidence drilldown and opens traceability modal', async () => {
    render(<ExecutiveBriefPage />);
    await waitFor(() => {
      expect(screen.getByTestId('evidence-btn-kpi-total-spend')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('evidence-btn-kpi-total-spend'));
    expect(screen.getByText(EXECUTIVE_BRIEF_EXPORT_STRINGS.traceability.modalTitle)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('close-traceability-modal-btn'));
    expect(screen.queryByText(EXECUTIVE_BRIEF_EXPORT_STRINGS.traceability.modalTitle)).not.toBeInTheDocument();
  });

  it('cancels the regeneration confirmation without calling the server', async () => {
    const fetchMock = stubRegenerateReply(jsonReply(200, { success: true }));
    render(<ExecutiveBriefPage />);
    await waitFor(() => {
      expect(screen.getByTestId('admin-regenerate-brief-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('admin-regenerate-brief-btn'));
    expect(screen.getByText(EXECUTIVE_BRIEF_EXPORT_STRINGS.regenerationModal.title)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('cancel-regenerate-btn'));
    expect(screen.queryByText(EXECUTIVE_BRIEF_EXPORT_STRINGS.regenerationModal.title)).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalledWith(REGENERATE_URL, expect.any(Object));
  });

  it('sends the stored bearer token with the regeneration request and reloads the report on success', async () => {
    const fetchMock = stubRegenerateReply(jsonReply(200, { success: true, message: 'Regenerated' }));
    render(<ExecutiveBriefPage />);

    await openRegenerateAndConfirm();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(REGENERATE_URL, expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer tok-admin' },
        body: JSON.stringify({ client: mockReportData.clientProfile.clientName })
      }));
    });
    await waitFor(() => {
      expect(screen.queryByText(EXECUTIVE_BRIEF_EXPORT_STRINGS.regenerationModal.title)).not.toBeInTheDocument();
    });
    expect(fetchMock.mock.calls.filter(([url]) => String(url).includes('/report')).length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByTestId('executive-brief-regenerate-error')).toBeNull();
  });

  it('sends no Authorization header when the user has no stored token', async () => {
    vi.spyOn(apiClient, 'getStoredToken').mockReturnValue(null);
    const fetchMock = stubRegenerateReply(jsonReply(200, { success: true }));
    render(<ExecutiveBriefPage />);

    await openRegenerateAndConfirm();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(REGENERATE_URL, expect.objectContaining({
        headers: { 'Content-Type': 'application/json' }
      }));
    });
  });

  it.each([
    [401, 'Administrator sign-in required. Send Authorization: Bearer <admin token>.', 'req-401', PAGE.regenerate.unauthorized],
    [403, 'This account does not have the ADMIN role.', 'req-403', PAGE.regenerate.forbidden],
    [409, 'Export blocked: the financial reconciliation does not match.', 'req-409', PAGE.regenerate.conflict],
    [503, 'AUTH_SECRET is not set on the Worker.', 'req-503', PAGE.regenerate.unavailable]
  ])('explains an HTTP %i refusal with the server message and the request ID', async (status, serverMessage, requestId, buildMessage) => {
    stubRegenerateReply(jsonReply(status, { success: false, message: serverMessage, requestId }));
    render(<ExecutiveBriefPage />);

    await openRegenerateAndConfirm();

    const alert = await screen.findByTestId('executive-brief-regenerate-error');
    expect(alert).toHaveAttribute('role', 'alert');
    expect(alert).toHaveTextContent(buildMessage(serverMessage, requestId));
    expect(screen.queryByText(EXECUTIVE_BRIEF_EXPORT_STRINGS.regenerationModal.title)).not.toBeInTheDocument();
    expect(frontendLogger.error).toHaveBeenCalledWith(
      'Executive brief regeneration was rejected',
      { statusCode: status, requestId, serverMessage }
    );
  });

  it('uses the response request ID header and a generic detail when the error body is unreadable', async () => {
    stubRegenerateReply({
      ok: false,
      status: 500,
      headers: new Headers({ 'x-request-id': 'hdr-500' }),
      json: async () => {
        throw new SyntaxError('Unexpected token <');
      }
    });
    render(<ExecutiveBriefPage />);

    await openRegenerateAndConfirm();

    expect(await screen.findByTestId('executive-brief-regenerate-error')).toHaveTextContent(
      PAGE.regenerate.failed(500, PAGE.regenerate.noServerDetail, 'hdr-500')
    );
  });

  it('says no request ID was returned when neither the body nor the headers carry one', async () => {
    stubRegenerateReply(jsonReply(500, { message: '' }));
    render(<ExecutiveBriefPage />);

    await openRegenerateAndConfirm();

    expect(await screen.findByTestId('executive-brief-regenerate-error')).toHaveTextContent(
      PAGE.regenerate.failed(500, PAGE.regenerate.noServerDetail, null)
    );
  });

  it('treats a body that is not a JSON object as having no server message', async () => {
    stubRegenerateReply(jsonReply(502, 'Bad gateway'));
    render(<ExecutiveBriefPage />);

    await openRegenerateAndConfirm();

    expect(await screen.findByTestId('executive-brief-regenerate-error')).toHaveTextContent(
      PAGE.regenerate.failed(502, PAGE.regenerate.noServerDetail, null)
    );
  });

  it('reports a network failure with the reason when the regeneration request does not complete', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      if (url.includes('/regenerate')) return Promise.reject(new Error('Failed to fetch'));
      return Promise.resolve(reportReply());
    }));
    render(<ExecutiveBriefPage />);

    await openRegenerateAndConfirm();

    expect(await screen.findByTestId('executive-brief-regenerate-error')).toHaveTextContent(
      PAGE.regenerate.networkFailed('Failed to fetch')
    );
    expect(frontendLogger.error).toHaveBeenCalledWith(
      'Executive brief regeneration did not reach the server',
      { error: 'Failed to fetch' },
      expect.any(Error)
    );
  });

  it('describes a non-Error network rejection as text', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      if (url.includes('/regenerate')) return Promise.reject('offline');
      return Promise.resolve(reportReply());
    }));
    render(<ExecutiveBriefPage />);

    await openRegenerateAndConfirm();

    expect(await screen.findByTestId('executive-brief-regenerate-error')).toHaveTextContent(
      PAGE.regenerate.networkFailed('offline')
    );
  });

  it('handles artifact downloads and artifact download error', async () => {
    render(<ExecutiveBriefPage />);
    await waitFor(() => {
      expect(screen.getByTestId('download-artifact-btn-EXECUTIVE_BRIEF_AUDIT.md')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('download-artifact-btn-EXECUTIVE_BRIEF_AUDIT.md'));
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/reports/executive-brief/audit');
    });

    fireEvent.click(screen.getByTestId('download-artifact-btn-EXECUTIVE_BRIEF.pdf'));
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/reports/executive-brief/download/pdf');
    });

    // Artifact download failure branch
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('/audit')) {
          return Promise.resolve({ ok: false, status: 500 });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: mockReportData })
        });
      })
    );
    fireEvent.click(screen.getByTestId('download-artifact-btn-EXECUTIVE_BRIEF_AUDIT.md'));
    await waitFor(() => {
      expect(frontendLogger.warn).toHaveBeenCalledWith('Artifact download failure', { error: 'Error: Artifact HTTP 500' });
    });
  });

  it('handles accordion toggles, deep dives, and module navigation', async () => {
    render(<ExecutiveBriefPage />);
    await waitFor(() => {
      expect(screen.getByTestId('accordion-group-btn-01')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('accordion-group-btn-01'));
    fireEvent.click(screen.getByTestId('accordion-group-btn-01'));

    const deepDiveBtn = screen.getByTestId('deep-dive-btn-FIND-01');
    fireEvent.click(deepDiveBtn);

    const drillBtn = screen.getByTestId('drill-evidence-btn-FIND-01');
    fireEvent.click(drillBtn);
    expect(screen.getByText(EXECUTIVE_BRIEF_EXPORT_STRINGS.traceability.modalTitle)).toBeInTheDocument();

    fireEvent.click(deepDiveBtn);

    // Module nav: Brief should not navigate
    const briefBtn = screen.getByTestId('module-nav-btn-brief');
    fireEvent.click(briefBtn);
    expect(mockPush).not.toHaveBeenCalled();

    // Module nav: Module 1 should navigate
    const module1Btn = screen.getByTestId('module-nav-btn-module1');
    fireEvent.click(module1Btn);
    expect(mockPush).toHaveBeenCalledWith('/?tab=module1');
  });

  it('handles custom content-disposition and PPTX artifact endpoint', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('/download/')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            headers: new Headers({ 'content-disposition': 'attachment; filename="custom_report.pptx"' }),
            blob: async () => new Blob(['pptx-bytes'], { type: 'application/vnd.ms-powerpoint' })
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: {
              ...mockReportData,
              artifacts: [
                ...mockReportData.artifacts,
                {
                  name: 'PowerPoint Slide Deck',
                  filename: 'EXECUTIVE_BRIEF.pptx',
                  description: 'Editable presentation',
                  endpoint: '/api/reports/executive-brief/download/pptx'
                }
              ]
            }
          })
        });
      })
    );

    render(<ExecutiveBriefPage />);
    await waitFor(() => {
      expect(screen.getByTestId('download-artifact-btn-EXECUTIVE_BRIEF.pptx')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('download-artifact-btn-EXECUTIVE_BRIEF.pptx'));
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/reports/executive-brief/download/pptx');
    });
  });
});
