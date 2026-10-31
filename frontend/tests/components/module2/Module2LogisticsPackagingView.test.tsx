import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { UI_STRINGS } from '../../../src/constants';
import { Module2LogisticsPackagingView } from '../../../src/components/module2/Module2LogisticsPackagingView';
import { loadModule2LogisticsCandidates } from '../../../src/utils/module2LogisticsApi';

vi.mock('../../../src/utils/module2LogisticsApi', () => ({ loadModule2LogisticsCandidates: vi.fn() }));

const demoCandidate = {
  candidateId: 'DEMO-LOG-001', assessmentId: 'AIC-2026-0001', lane: 'Pune → Mumbai',
  materialCategory: 'Industrial chemicals', shippingMode: 'Road tanker', incoterms: 'FCA', shipmentCount: 24,
  currentFreightInr: 4800000, benchmarkFreightInr: 4320000, packagingSpec: 'Returnable bulk containers',
  containerFillPct: 82, evidenceStatus: 'DEMO_ONLY' as const, isDemo: true, updatedAt: '2026-10-31T00:00:00.000Z'
};

describe('Module2LogisticsPackagingView', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('loads D1 candidates, marks mock data, and renders nullable and recorded fields', async () => {
    vi.mocked(loadModule2LogisticsCandidates).mockResolvedValue({
      success: true,
      count: 2,
      candidates: [demoCandidate, {
        ...demoCandidate, candidateId: 'LOG-REAL-001', isDemo: false, evidenceStatus: 'SOURCE_PENDING',
        benchmarkFreightInr: null, containerFillPct: null
      }]
    });
    render(<Module2LogisticsPackagingView assessmentId="AIC-2026-0001" />);
    expect(screen.getByRole('status')).toHaveTextContent(UI_STRINGS.module2Logistics.loading);
    await waitFor(() => expect(screen.getAllByText(demoCandidate.lane)).toHaveLength(2));
    expect(screen.getByRole('note')).toHaveTextContent(UI_STRINGS.module2Logistics.demoNotice);
    expect(screen.getByText(UI_STRINGS.module2Logistics.demoOnly)).toBeInTheDocument();
    expect(screen.getByText('SOURCE_PENDING')).toBeInTheDocument();
    expect(screen.getAllByText(UI_STRINGS.module2Logistics.notRecorded)).toHaveLength(2);
    expect(loadModule2LogisticsCandidates).toHaveBeenCalledWith('AIC-2026-0001');
  });

  it('reports missing assessment IDs and empty D1 result sets', async () => {
    const missing = render(<Module2LogisticsPackagingView assessmentId="" />);
    expect(screen.getByRole('status')).toHaveTextContent(UI_STRINGS.module2Logistics.assessmentMissing);
    expect(loadModule2LogisticsCandidates).not.toHaveBeenCalled();
    missing.unmount();
    vi.mocked(loadModule2LogisticsCandidates).mockResolvedValue({ success: true, count: 0, candidates: [] });
    render(<Module2LogisticsPackagingView assessmentId="AIC-2026-0002" />);
    await waitFor(() => expect(screen.getByText(UI_STRINGS.module2Logistics.empty)).toBeInTheDocument());
  });

  it('shows detailed API errors and a specific fallback for non-Error rejections', async () => {
    vi.mocked(loadModule2LogisticsCandidates).mockRejectedValueOnce(new Error(UI_STRINGS.module2Logistics.loadFailed(503)));
    const first = render(<Module2LogisticsPackagingView assessmentId="AIC-2026-0003" />);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(UI_STRINGS.module2Logistics.loadFailed(503)));
    first.unmount();
    vi.mocked(loadModule2LogisticsCandidates).mockRejectedValueOnce('unknown');
    render(<Module2LogisticsPackagingView assessmentId="AIC-2026-0004" />);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(UI_STRINGS.module2Logistics.requestFailed));
  });
});
