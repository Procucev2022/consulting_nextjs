import React from 'react';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { act, render, screen, fireEvent } from '@testing-library/react';
import { ExecutiveOpportunityBriefView } from '@/components/presentation/ExecutiveOpportunityBriefView';
import { ExecutiveOpportunityBriefSlideContent } from '@/components/presentation/ExecutiveOpportunityBriefSlideContent';
import { UI_STRINGS } from '@/constants/uiStrings';
import type { ExecutiveOpportunityBriefReportData } from '@/types';

const report: ExecutiveOpportunityBriefReportData = {
  tenant: { tenantId: 'T1', enterpriseName: 'D1 Enterprise' },
  generatedAt: '2026-10-30T00:00:00.000Z',
  scopeDescription: 'Baseline D1 transaction rows, excluding assessment-specific copies.',
  metrics: {
    transactionCount: 12, totalSpendCr: 125.5, supplierCount: 4, materialCount: 6,
    plantCount: 2, purchaseOrderCount: 9, firstTransactionDate: '2024-01-01', lastTransactionDate: '2025-12-31',
    opportunityCount: 1, estimatedSavingsCr: 10.25, averageConfidence: 0.87
  },
  opportunities: [{
    id: 'O1', category: 'Packaging', title: 'Packaging sourcing', currentSpendCr: 50,
    estimatedSavingsCr: 10.25, lever: 'Strategic sourcing', recommendedAction: 'Launch a tender',
    status: 'Identified', riskLevel: 'Medium', confidence: 0.9
  }],
  levers: [{ label: 'Strategic sourcing', count: 1, estimatedSavingsCr: 10.25 }],
  statuses: [{ label: 'Identified', count: 1, estimatedSavingsCr: 10.25 }],
  risks: [{ label: 'Medium', count: 1, estimatedSavingsCr: 10.25 }]
};

const successResponse = (): Response => new Response(JSON.stringify({ success: true, data: report }), { status: 200 });

const installFetch = (...responses: Array<Response | Error>): ReturnType<typeof vi.fn> => {
  const fetchMock = vi.fn();
  responses.forEach((response) => {
    if (response instanceof Error) fetchMock.mockRejectedValueOnce(response);
    else fetchMock.mockResolvedValueOnce(response);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

describe('ExecutiveOpportunityBriefView', () => {
  beforeEach(() => installFetch(successResponse()));
  afterEach(() => vi.unstubAllGlobals());

  it('loads the report from D1 and displays the database-backed enterprise and savings', async () => {
    const handleBack = vi.fn();
    render(<ExecutiveOpportunityBriefView clientName="A different client label" onBackToWorkspace={handleBack} />);
    expect(screen.getByTestId('opportunity-brief-loading')).toHaveTextContent(UI_STRINGS.opportunityBrief.reportLoading);
    fireEvent.click(screen.getByTestId('back-to-workspace-btn'));
    expect(handleBack).toHaveBeenCalledOnce();
    expect(await screen.findByTestId('executive-opportunity-brief-view')).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`D1 Enterprise`))).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.opportunityBrief.currencyCr(125.5))).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.opportunityBrief.currencyCr(10.25))).toBeInTheDocument();
    expect(screen.queryByText(/UltraTech/i)).not.toBeInTheDocument();
  });

  it('navigates through all ten D1-backed slides and disables navigation at both ends', async () => {
    render(<ExecutiveOpportunityBriefView />);
    await screen.findByTestId('executive-opportunity-brief-view');
    expect(screen.getByText(UI_STRINGS.opportunityBrief.slideTitles[0])).toBeInTheDocument();
    expect(screen.getByTestId('brief-prev-slide-btn')).toBeDisabled();
    const next = screen.getByTestId('brief-next-slide-btn');
    const expectedSlideContent = [
      'brief-slide-baseline', 'brief-slide-opportunities', 'brief-slide-levers', 'brief-slide-status',
      'brief-slide-risk', 'brief-slide-actions', 'brief-slide-footprint', 'brief-slide-scope', 'brief-slide-next-actions'
    ];
    for (let index = 0; index < expectedSlideContent.length; index += 1) {
      fireEvent.click(next);
      expect(screen.getByTestId(expectedSlideContent[index])).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.opportunityBrief.slideTitles[index + 1])).toBeInTheDocument();
    }
    expect(screen.getByTestId('brief-next-slide-btn')).toBeDisabled();
    fireEvent.click(screen.getByTestId('brief-prev-slide-btn'));
    expect(screen.getByText(UI_STRINGS.opportunityBrief.slideTitles[8])).toBeInTheDocument();
  });

  it('triggers download, back, and fullscreen callbacks', async () => {
    const handlePdf = vi.fn();
    const handlePptx = vi.fn();
    const handleBack = vi.fn();
    const handleFullscreen = vi.fn();
    const { unmount } = render(<ExecutiveOpportunityBriefView
      onDownloadPdf={handlePdf}
      onDownloadPptx={handlePptx}
      onBackToWorkspace={handleBack}
      isFullScreen={false}
      onToggleFullScreen={handleFullscreen}
    />);
    await screen.findByTestId('executive-opportunity-brief-view');
    fireEvent.click(screen.getByTestId('download-brief-pdf-btn'));
    fireEvent.click(screen.getByTestId('download-brief-pptx-btn'));
    fireEvent.click(screen.getByTestId('back-to-workspace-btn'));
    fireEvent.click(screen.getByTestId('brief-fullscreen-btn'));
    expect(handlePdf).toHaveBeenCalledOnce();
    expect(handlePptx).toHaveBeenCalledOnce();
    expect(handleBack).toHaveBeenCalledOnce();
    expect(handleFullscreen).toHaveBeenCalledOnce();

    unmount();
    installFetch(successResponse());
    const handleExitFullscreen = vi.fn();
    render(<ExecutiveOpportunityBriefView isFullScreen onToggleFullScreen={handleExitFullscreen} />);
    await screen.findByTestId('executive-opportunity-brief-view');
    expect(screen.getByTestId('brief-fullscreen-btn')).toHaveTextContent(UI_STRINGS.opportunityBrief.exitFullScreen);
    fireEvent.click(screen.getByTestId('brief-fullscreen-btn'));
    expect(handleExitFullscreen).toHaveBeenCalledOnce();
  });

  it('shows detailed server errors and retries loading the report', async () => {
    const handleBack = vi.fn();
    installFetch(
      new Response('{}', { status: 503, headers: { 'x-request-id': 'req-brief' } }),
      successResponse()
    );
    render(<ExecutiveOpportunityBriefView onBackToWorkspace={handleBack} />);
    expect(await screen.findByTestId('opportunity-brief-load-error')).toHaveTextContent(
      UI_STRINGS.opportunityBrief.reportUnavailable(503, 'req-brief')
    );
    fireEvent.click(screen.getByTestId('back-to-workspace-btn'));
    expect(handleBack).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByTestId('retry-opportunity-brief-btn'));
    await screen.findByTestId('executive-opportunity-brief-view');
  });

  it('shows a network-specific actionable error after a fetch failure', async () => {
    installFetch(new Error('network down'));
    render(<ExecutiveOpportunityBriefView />);
    expect(await screen.findByRole('alert')).toHaveTextContent(UI_STRINGS.opportunityBrief.reportUnavailableNetwork);
  });

  it('uses the request-id fallback when a server error has no correlation header', async () => {
    installFetch(new Response('{}', { status: 503 }));
    render(<ExecutiveOpportunityBriefView />);
    expect(await screen.findByRole('alert')).toHaveTextContent(UI_STRINGS.opportunityBrief.reportUnavailable(
      503,
      UI_STRINGS.opportunityBrief.requestIdNotReturned
    ));
  });

  it('falls back to the supplied client name when D1 has no enterprise name', async () => {
    const blankTenantReport = { ...report, tenant: { ...report.tenant, enterpriseName: '' } };
    installFetch(new Response(JSON.stringify({ success: true, data: blankTenantReport }), { status: 200 }));
    render(<ExecutiveOpportunityBriefView clientName="Workspace client" />);
    expect(await screen.findByText(/Workspace client/)).toBeInTheDocument();
  });

  it('uses the generic enterprise label when both D1 and the workspace omit the name', async () => {
    const blankTenantReport = { ...report, tenant: { ...report.tenant, enterpriseName: '' } };
    installFetch(new Response(JSON.stringify({ success: true, data: blankTenantReport }), { status: 200 }));
    render(<ExecutiveOpportunityBriefView clientName="" />);
    expect(await screen.findByRole('heading', {
      name: `${UI_STRINGS.opportunityBrief.title} — ${UI_STRINGS.opportunityBrief.metricLabels.enterprise}`
    })).toBeInTheDocument();
  });

  it('ignores an in-flight report response after the view unmounts', async () => {
    let resolveResponse: ((response: Response) => void) | undefined;
    const fetchMock = vi.fn(() => new Promise<Response>((resolve) => {
      resolveResponse = resolve;
    }));
    vi.stubGlobal('fetch', fetchMock);
    const { unmount } = render(<ExecutiveOpportunityBriefView />);
    unmount();
    await act(async () => {
      resolveResponse?.(successResponse());
    });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('uses the configured unknown-slide title when the title list is empty', async () => {
    const titles = UI_STRINGS.opportunityBrief.slideTitles as unknown as string[];
    const originalTitles = [...titles];
    titles.splice(0, titles.length);
    try {
      installFetch(successResponse());
      render(<ExecutiveOpportunityBriefView />);
      expect(await screen.findByText(UI_STRINGS.opportunityBrief.unknownSlide(1))).toBeInTheDocument();
    } finally {
      titles.push(...originalTitles);
    }
  });

  it('renders the Bronze teaser with D1 figures and fires the tier and back callbacks', async () => {
    const handleExploreSilver = vi.fn();
    const handleBack = vi.fn();
    render(<ExecutiveOpportunityBriefView
      currentTier="BRONZE"
      onExploreSilver={handleExploreSilver}
      onBackToWorkspace={handleBack}
    />);
    expect(await screen.findByTestId('executive-opportunity-brief-bronze-teaser')).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.opportunityBrief.currencyCr(125.5))).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.opportunityBrief.countValue(4))).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.opportunityBrief.countValue(6))).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('bronze-explore-silver-btn'));
    fireEvent.click(screen.getByText(UI_STRINGS.opportunityBrief.backToWorkspace));
    expect(handleExploreSilver).toHaveBeenCalledOnce();
    expect(handleBack).toHaveBeenCalledOnce();
  });

  it('renders an empty-state section and unknown slide fallback', async () => {
    const emptyReport = { ...report, opportunities: [], levers: [], statuses: [], risks: [] };
    installFetch(new Response(JSON.stringify({ success: true, data: emptyReport }), { status: 200 }));
    render(<ExecutiveOpportunityBriefView />);
    await screen.findByTestId('executive-opportunity-brief-view');
    const next = screen.getByTestId('brief-next-slide-btn');
    for (let slide = 2; slide <= 10; slide += 1) {
      fireEvent.click(next);
      expect(screen.getByText(UI_STRINGS.opportunityBrief.slideTitles[slide - 1])).toBeInTheDocument();
      if ([3, 4, 5, 6, 7, 10].includes(slide)) {
        expect(screen.getByText(UI_STRINGS.opportunityBrief.noRecords)).toBeInTheDocument();
      }
    }
    render(<ExecutiveOpportunityBriefSlideContent currentSlide={99} report={report} />);
    expect(screen.getByText(UI_STRINGS.opportunityBrief.unknownSlide(99))).toBeInTheDocument();
  });
});
