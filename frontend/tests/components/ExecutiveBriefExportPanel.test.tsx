import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExecutiveBriefExportPanel } from '../../src/components/ExecutiveBriefExportPanel';
import { EXECUTIVE_BRIEF_EXPORT_STRINGS } from '../../src/constants/executiveBriefExportStrings';

describe('ExecutiveBriefExportPanel Component', () => {
  const strings = EXECUTIVE_BRIEF_EXPORT_STRINGS;
  const originalFetch = global.fetch;

  beforeEach(() => {
    // Mock URL.createObjectURL
    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-download-url');
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('EXPORT-01 & EXPORT-02: renders prominent PDF and PPTX download actions with checklist', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        status: 'EXECUTIVE_BRIEF_EXPORT_READY',
        reportVersion: '1.1',
        reportDetails: {
          generationTimestamp: '01-Oct-2026 | 09:30 AM',
          sourceDataVersion: 'v1.4-certified',
          analysisPeriod: 'Apr 2025 – Mar 2026',
          validationStatus: 'PASS',
          evidenceCount: 48,
          opportunityCount: 14
        },
        history: [
          {
            reportVersion: '1.0',
            generatedDate: '01-Oct-2026',
            generatedBy: 'System',
            dataVersion: 'v1.0',
            pdfAvailable: true,
            pptxAvailable: true
          }
        ]
      })
    } as any);

    render(<ExecutiveBriefExportPanel tenantName="UltraTech Cement Limited" />);

    // Verify Title & Certified badge
    expect(screen.getByText(strings.panelTitle)).toBeInTheDocument();
    expect(screen.getByText(strings.certifiedBadge)).toBeInTheDocument();

    // Verify Checklists
    expect(screen.getByText(strings.checklists.dataValidated)).toBeInTheDocument();
    expect(screen.getByText(strings.checklists.financialReconciliation)).toBeInTheDocument();
    expect(screen.getByText(strings.checklists.module1)).toBeInTheDocument();
    expect(screen.getByText(strings.checklists.module4)).toBeInTheDocument();

    // EXPORT-01: PDF button visible
    expect(screen.getByText(strings.buttons.downloadPdf)).toBeInTheDocument();
    expect(screen.getByText(strings.buttons.downloadPdfSub)).toBeInTheDocument();

    // EXPORT-02: PPTX button visible
    expect(screen.getByText(strings.buttons.downloadPptx)).toBeInTheDocument();
    expect(screen.getByText(strings.buttons.downloadPptxSub)).toBeInTheDocument();
  });

  it('handles PDF download flow with state transitions and success callback', async () => {
    const onExportSuccess = vi.fn();
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/status')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            status: 'EXECUTIVE_BRIEF_EXPORT_READY',
            reportVersion: '1.1',
            reportDetails: { generationTimestamp: '01-Oct-2026 | 09:30 AM' },
            history: []
          })
        });
      }
      return Promise.resolve({
        ok: true,
        headers: new Headers({
          'content-disposition': 'attachment; filename="Procucev_Report.pdf"'
        }),
        blob: async () => new Blob(['mock-pdf'], { type: 'application/pdf' })
      });
    });

    render(
      <ExecutiveBriefExportPanel
        tenantName="UltraTech Cement Limited"
        onExportSuccess={onExportSuccess}
      />
    );

    const pdfBtn = screen.getByText(strings.buttons.downloadPdf);
    fireEvent.click(pdfBtn);

    await waitFor(() => {
      expect(onExportSuccess).toHaveBeenCalledWith('pdf', 'Procucev_Report.pdf');
    });
    await new Promise((r) => setTimeout(r, 70));
  });

  it('handles PPTX download flow with state transitions and success callback', async () => {
    const onExportSuccess = vi.fn();
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/status')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            status: 'EXECUTIVE_BRIEF_EXPORT_READY',
            reportVersion: '1.1',
            reportDetails: { generationTimestamp: '01-Oct-2026 | 09:30 AM' },
            history: []
          })
        });
      }
      return Promise.resolve({
        ok: true,
        headers: new Headers({
          'content-disposition': 'attachment; filename="Procucev_Report.pptx"'
        }),
        blob: async () =>
          new Blob(['mock-pptx'], {
            type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
          })
      });
    });

    render(
      <ExecutiveBriefExportPanel
        tenantName="UltraTech Cement Limited"
        onExportSuccess={onExportSuccess}
      />
    );

    const pptxBtn = screen.getByText(strings.buttons.downloadPptx);
    fireEvent.click(pptxBtn);

    await waitFor(() => {
      expect(onExportSuccess).toHaveBeenCalledWith('pptx', 'Procucev_Report.pptx');
    });
  });

  it('handles blocked export response and triggers failure callback', async () => {
    const onExportFailure = vi.fn();
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/status')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            status: 'EXECUTIVE_BRIEF_EXPORT_READY',
            reportVersion: '1.1',
            reportDetails: { generationTimestamp: '01-Oct-2026' },
            history: []
          })
        });
      }
      return Promise.resolve({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Financial variance detected: ₹10.00 Cr' })
      });
    });

    render(
      <ExecutiveBriefExportPanel
        tenantName="UltraTech Cement Limited"
        onExportFailure={onExportFailure}
      />
    );

    const pdfBtn = screen.getByText(strings.buttons.downloadPdf);
    fireEvent.click(pdfBtn);

    await waitFor(() => {
      expect(onExportFailure).toHaveBeenCalledWith(
        'pdf',
        'Financial variance detected: ₹10.00 Cr'
      );
    });

    expect(
      screen.getByText(/Export Blocked: Financial variance detected: ₹10.00 Cr/)
    ).toBeInTheDocument();
  });

  it('handles network error during download gracefully', async () => {
    const onExportFailure = vi.fn();
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/status')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            status: 'EXECUTIVE_BRIEF_EXPORT_READY',
            reportVersion: '1.1',
            reportDetails: { generationTimestamp: '01-Oct-2026' },
            history: []
          })
        });
      }
      return Promise.reject(new Error('Network disconnected'));
    });

    render(
      <ExecutiveBriefExportPanel
        tenantName="UltraTech Cement Limited"
        onExportFailure={onExportFailure}
      />
    );

    const pdfBtn = screen.getByText(strings.buttons.downloadPdf);
    fireEvent.click(pdfBtn);

    await waitFor(() => {
      expect(onExportFailure).toHaveBeenCalledWith('pdf', 'Network disconnected');
    });
  });

  it('toggles expandable Report Details and Report History sections', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        status: 'EXECUTIVE_BRIEF_EXPORT_READY',
        reportVersion: '1.1',
        reportDetails: {
          generationTimestamp: '01-Oct-2026 | 09:30 AM',
          sourceDataVersion: 'v1.4-certified',
          analysisPeriod: 'Apr 2025 – Mar 2026',
          validationStatus: 'PASS',
          evidenceCount: 48,
          opportunityCount: 14
        },
        history: [
          {
            reportVersion: '1.0',
            generatedDate: '01-Oct-2026',
            generatedBy: 'System',
            dataVersion: 'v1.0',
            pdfAvailable: true,
            pptxAvailable: true
          }
        ]
      })
    } as any);

    render(<ExecutiveBriefExportPanel tenantName="UltraTech Cement Limited" />);

    // Toggle Report Details
    const detailsBtn = screen.getByText(strings.buttons.reportDetails);
    fireEvent.click(detailsBtn);
    expect(screen.getByText(strings.details.title)).toBeInTheDocument();
    expect(screen.getByText(strings.details.varianceZero)).toBeInTheDocument();

    // Toggle Report History
    const historyBtn = screen.getByText(strings.buttons.reportHistory);
    fireEvent.click(historyBtn);
    expect(screen.getAllByText(strings.history.title).length).toBeGreaterThan(1);
    expect(screen.getByText(strings.history.versionCol)).toBeInTheDocument();

    // Click history download action after statusData renders
    await waitFor(() => {
      const downloadLinks = screen.getAllByText(strings.history.downloadAction);
      expect(downloadLinks.length).toBeGreaterThan(1);
      fireEvent.click(downloadLinks[0]);
      fireEvent.click(downloadLinks[1]);
    });
  });

  it('handles status load failure gracefully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500
    } as any);

    render(<ExecutiveBriefExportPanel tenantName="UltraTech Cement Limited" />);
    expect(screen.getByText(strings.panelTitle)).toBeInTheDocument();
  });
});
