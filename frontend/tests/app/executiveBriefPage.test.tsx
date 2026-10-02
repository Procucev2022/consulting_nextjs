import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ExecutiveBriefPage from '../../src/app/executive-brief/page';
import { EXECUTIVE_BRIEF_EXPORT_STRINGS } from '../../src/constants/executiveBriefExportStrings';
import { mockReportData } from '../fixtures/executiveBriefMockData';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  })
}));

describe('ExecutiveBriefPage', () => {
  beforeEach(() => {
    mockPush.mockClear();
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

    if (!window.URL.createObjectURL) {
      window.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading state and then populates full report workspace', async () => {
    render(<ExecutiveBriefPage />);
    expect(screen.getByText(/Preparing Certified Executive Brief/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('UltraTech Cement Limited')).toBeInTheDocument();
      expect(screen.getByText('Total Evaluated Spend')).toBeInTheDocument();
      expect(screen.getByText('Executive Overview')).toBeInTheDocument();
    });
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

  it('handles report regeneration confirmation flow and error branch', async () => {
    render(<ExecutiveBriefPage />);
    await waitFor(() => {
      expect(screen.getByTestId('admin-regenerate-brief-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('admin-regenerate-brief-btn'));
    expect(screen.getByText(EXECUTIVE_BRIEF_EXPORT_STRINGS.regenerationModal.title)).toBeInTheDocument();

    // Close without confirming
    fireEvent.click(screen.getByTestId('cancel-regenerate-btn'));
    expect(screen.queryByText(EXECUTIVE_BRIEF_EXPORT_STRINGS.regenerationModal.title)).not.toBeInTheDocument();

    // Reopen and confirm
    fireEvent.click(screen.getByTestId('admin-regenerate-brief-btn'));
    fireEvent.click(screen.getByTestId('confirm-regenerate-btn'));
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/reports/executive-brief/regenerate', expect.any(Object));
    });

    // Test regeneration failure branch
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('/regenerate')) {
          return Promise.resolve({ ok: false, status: 500 });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: mockReportData })
        });
      })
    );
    fireEvent.click(screen.getByTestId('admin-regenerate-brief-btn'));
    fireEvent.click(screen.getByTestId('confirm-regenerate-btn'));
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

