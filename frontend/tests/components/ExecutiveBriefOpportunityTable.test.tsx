import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ExecutiveBriefOpportunityTable } from '../../src/components/executiveBrief/ExecutiveBriefOpportunityTable';
import { UI_STRINGS } from '../../src/constants/uiStrings';
import { fetchExecutiveOpportunityBriefReport } from '../../src/utils/executiveOpportunityBriefApi';
import type { ExecutiveOpportunityBriefReportData } from '../../src/types';

vi.mock('../../src/utils/executiveOpportunityBriefApi', () => ({
  fetchExecutiveOpportunityBriefReport: vi.fn()
}));

const report: ExecutiveOpportunityBriefReportData = {
  tenant: { tenantId: 'T1', enterpriseName: 'D1 Enterprise' },
  dataClassification: 'DEMO_ONLY',
  generatedAt: '2026-10-30T00:00:00.000Z',
  scopeDescription: 'Demo seed data is illustrative and not validated customer results.',
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

const successfulResult = { ok: true as const, data: report };

describe('ExecutiveBriefOpportunityTable', () => {
  beforeEach(() => vi.mocked(fetchExecutiveOpportunityBriefReport).mockResolvedValue(successfulResult));
  afterEach(() => vi.clearAllMocks());

  it('loads the D1 tenant report and renders metrics, provenance, group summaries, and opportunities', async () => {
    render(<ExecutiveBriefOpportunityTable />);
    expect(screen.getByRole('status')).toHaveTextContent(UI_STRINGS.opportunityBrief.reportLoading);
    expect(await screen.findByTestId('executive-brief-opportunity-panel')).toBeInTheDocument();
    expect(screen.getByText(report.tenant.enterpriseName)).toBeInTheDocument();
    expect(screen.getByTestId('executive-brief-data-classification')).toHaveTextContent(
      UI_STRINGS.opportunityBrief.classificationValues.DEMO_ONLY
    );
    expect(screen.getByText(UI_STRINGS.opportunityBrief.currencyCr(125.5))).toBeInTheDocument();
    expect(screen.getAllByText(UI_STRINGS.opportunityBrief.currencyCr(10.25))).toHaveLength(2);
    expect(screen.getByText(UI_STRINGS.opportunityBrief.countValue(12))).toBeInTheDocument();
    expect(screen.getAllByText(report.opportunities[0].lever)).toHaveLength(2);
    expect(screen.getByText(report.opportunities[0].recommendedAction)).toBeInTheDocument();
  });

  it('drills into an opportunity by its D1 identifier when a callback is provided', async () => {
    const onDrill = vi.fn();
    render(<ExecutiveBriefOpportunityTable onDrillOpportunity={onDrill} />);
    fireEvent.click(await screen.findByRole('button', { name: 'O1' }));
    expect(onDrill).toHaveBeenCalledWith('O1');
  });

  it('shows explicit empty states for tenants without D1 opportunities or breakdown rows', async () => {
    vi.mocked(fetchExecutiveOpportunityBriefReport).mockResolvedValueOnce({
      ok: true,
      data: { ...report, opportunities: [], levers: [], statuses: [], risks: [], metrics: { ...report.metrics, opportunityCount: 0 } }
    });
    render(<ExecutiveBriefOpportunityTable />);
    expect(await screen.findByText(UI_STRINGS.opportunityBrief.noOpportunities)).toBeInTheDocument();
    expect(screen.getAllByText(UI_STRINGS.opportunityBrief.noGroups)).toHaveLength(3);
  });

  it('reports D1 failures and allows retrying the opportunity panel', async () => {
    vi.mocked(fetchExecutiveOpportunityBriefReport)
      .mockResolvedValueOnce({ ok: false, statusCode: 503, requestId: 'req-d1' })
      .mockResolvedValueOnce(successfulResult);
    render(<ExecutiveBriefOpportunityTable />);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      UI_STRINGS.opportunityBrief.reportUnavailable(503, 'req-d1')
    );
    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.opportunityBrief.retryPanel }));
    expect(await screen.findByTestId('executive-brief-opportunity-panel')).toBeInTheDocument();
  });

  it('shows the network-specific failure message when the API helper unexpectedly rejects', async () => {
    vi.mocked(fetchExecutiveOpportunityBriefReport).mockRejectedValueOnce(new Error('offline'));
    render(<ExecutiveBriefOpportunityTable />);
    expect(await screen.findByRole('alert')).toHaveTextContent(UI_STRINGS.opportunityBrief.reportUnavailableNetwork);
  });

  it('uses the request-id fallback when the server omits its correlation id', async () => {
    vi.mocked(fetchExecutiveOpportunityBriefReport).mockResolvedValueOnce({
      ok: false,
      statusCode: 502,
      requestId: null
    });
    render(<ExecutiveBriefOpportunityTable />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      UI_STRINGS.opportunityBrief.reportUnavailable(502, UI_STRINGS.opportunityBrief.requestIdNotReturned)
    );
  });

  it('ignores a report response that arrives after the panel unmounts', async () => {
    let resolveReport: ((result: typeof successfulResult) => void) | undefined;
    vi.mocked(fetchExecutiveOpportunityBriefReport).mockImplementationOnce(() => new Promise((resolve) => {
      resolveReport = resolve as (result: typeof successfulResult) => void;
    }));
    const view = render(<ExecutiveBriefOpportunityTable />);
    view.unmount();

    await act(async () => {
      resolveReport?.(successfulResult);
      await Promise.resolve();
    });

    expect(fetchExecutiveOpportunityBriefReport).toHaveBeenCalledTimes(2);
  });
});
