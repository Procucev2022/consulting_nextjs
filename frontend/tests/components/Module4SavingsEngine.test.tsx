import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { Module4SavingsEngine } from '../../src/components/Module4SavingsEngine';
import { UI_STRINGS } from '../../src/constants/uiStrings';
import { apiClient } from '../../src/utils/api';
import { orchestrationApi } from '../../src/utils/orchestrationApi';
import { frontendLogger } from '../../src/utils/logger';
import type { AnalysisJob } from '../../src/types/analysisOrchestration';
import type { ConsolidatedSavingsData } from '../../src/types/savings';

vi.mock('../../src/components/savings/SavingsTypeEvidenceSection', () => ({
  SavingsTypeEvidenceSection: (props: { jobId: string }) => <div data-testid="evidence-section-stub">{props.jobId}</div>
}));

vi.mock('../../src/components/savings/SavingsWaterfallSection', () => ({
  SavingsWaterfallSection: () => <div data-testid="waterfall-stub" />
}));

vi.mock('../../src/components/savings/ActionPlanTracker', () => ({
  ActionPlanTracker: (props: { actionPlans?: Array<{ id: string; status: string }>; onUpdateAction: (id: string, updates: { status?: string }) => void }) => (
    <div>
    <button type="button" onClick={() => props.onUpdateAction('AP-1', { status: 'Completed' })}>
      trigger-action-plan
    </button>
    <span data-testid="persisted-action-plans">{JSON.stringify(props.actionPlans)}</span>
    </div>
  )
}));

vi.mock('../../src/components/savings/OverlapDeduplicationTable', () => ({
  OverlapDeduplicationTable: (props: { opportunities?: Array<{ opportunity_id: string; status: string }>; onUpdateStatus?: (id: string, status: string) => void }) => (
    <div>
    <button type="button" onClick={() => props.onUpdateStatus?.('OPP-A', 'APPROVED')}>
      trigger-overlap-status
    </button>
    <span data-testid="persisted-opportunity-statuses">{JSON.stringify(props.opportunities)}</span>
    </div>
  )
}));

const sampleSavingsOpportunities = [
  {
    opp_id: 'OPP-001',
    category: 'Direct Materials',
    current_spend_inr_cr: 45.0,
    current_spend: 450000000,
    est_savings_inr_cr: 4.5,
    est_savings: 45000000,
    savings_percentage: 10.0,
    lever: 'Supplier Consolidation',
    recommended_module: 'proCPX' as const,
    complexity: 'Low' as const,
    status: 'Ready to Deploy'
  },
  {
    opp_id: 'OPP-002',
    category: 'Packaging Materials',
    current_spend_inr_cr: 20.0,
    current_spend: 200000000,
    est_savings_inr_cr: 2.4,
    est_savings: 24000000,
    savings_percentage: 12.0,
    lever: 'Index-Linked Should-Costing',
    recommended_module: 'DPS NXT' as const,
    complexity: 'Medium' as const,
    status: 'Ready to Deploy'
  }
];

const sampleJob = {
  analysisJobId: 'AIC-JOB-77',
  tenantId: 'TNT-77',
  customerName: 'Gamma Foods',
  status: 'PCBI_REVIEW_REQUIRED'
} as unknown as AnalysisJob;

const consolidatedData = {
  waterfallMetrics: {
    total_spend_inr_cr: 120.5,
    addressable_spend_inr_cr: 100.25,
    identified_opportunities_count: 2,
    gross_potential_savings_inr_cr: 6.9,
    deduplicated_overlap_inr_cr: 0.5,
    net_potential_savings_inr_cr: 12.3456,
    validated_savings_inr_cr: 1,
    approved_savings_inr_cr: 0.5,
    realized_savings_inr_cr: 0
  },
  overlaps: [],
  actionPlans: [],
  opportunities: [
    {
      opportunity_id: 'OPP-A',
      source_module: 'MODULE_4',
      source_engine: 'E_AUCTION',
      category: 'Direct Materials',
      item: 'Steel',
      vendor: 'Vendor A',
      plant: 'Plant 1',
      spend_inr: 0,
      spend_inr_cr: 0,
      potential_savings_inr: 0,
      potential_savings_inr_cr: 2.5,
      is_overlapping: false,
      net_savings_inr: 0,
      net_savings_inr_cr: 0,
      status: 'IDENTIFIED',
      owner: 'Procurement',
      timeline: 'Q1',
      validation_notes: '',
      created_at: '2026-10-04T00:00:00.000Z'
    },
    {
      opportunity_id: 'OPP-B',
      source_module: 'MODULE_4',
      source_engine: 'PCBI',
      category: 'Logistics & Freight',
      item: 'Freight lane',
      vendor: 'Vendor B',
      plant: 'Plant 2',
      spend_inr: 400000000,
      spend_inr_cr: 40,
      potential_savings_inr: 4000000,
      potential_savings_inr_cr: 0.4,
      is_overlapping: false,
      net_savings_inr: 3500000,
      net_savings_inr_cr: 0.35,
      status: 'APPROVED',
      owner: 'SCM',
      timeline: 'Q2',
      validation_notes: 'Rate card leakage',
      created_at: '2026-10-04T00:00:00.000Z'
    }
  ]
} as unknown as ConsolidatedSavingsData;

const renderEngine = (overrides: Partial<React.ComponentProps<typeof Module4SavingsEngine>> = {}): ReturnType<typeof render> =>
  render(
    <Module4SavingsEngine
      opportunities={sampleSavingsOpportunities as never}
      onOpenProCPX={vi.fn()}
      onOpenDPSNXT={vi.fn()}
      onProceedToConversion={vi.fn()}
      {...overrides}
    />
  );

describe('Module4SavingsEngine Component', () => {
  beforeEach(() => {
    // Pending by default, so no state update lands after a synchronous render. Tests that need data resolve it.
    vi.spyOn(orchestrationApi, 'getJobs').mockReturnValue(new Promise<AnalysisJob[]>(() => undefined));
    vi.spyOn(apiClient, 'getConsolidatedSavings').mockReturnValue(
      new Promise<ConsolidatedSavingsData>(() => undefined) as never
    );
    vi.spyOn(frontendLogger, 'warn').mockImplementation(() => ({}) as never);
  });

  afterEach(async () => {
    // Let pending mocked requests settle inside act so their state updates do not leak past teardown.
    await act(async () => {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 0);
      });
    });
    vi.restoreAllMocks();
  });

  it('renders cold zero-data state when opportunities is empty', async () => {
    vi.mocked(orchestrationApi.getJobs).mockResolvedValue([sampleJob]);
    renderEngine({ opportunities: [] });
    expect(screen.getByText(UI_STRINGS.module4.awaitingDatasetIngestion)).toBeInTheDocument();
    expect(await screen.findByTestId('evidence-section-stub')).toHaveTextContent(sampleJob.analysisJobId);
  });

  it('renders summary cards, category breakdowns, and opportunities table', () => {
    renderEngine();

    expect(screen.getAllByText(UI_STRINGS.module4.categories.directMaterials).length).toBeGreaterThan(0);
    expect(screen.getAllByText(UI_STRINGS.module4.categories.packagingMaterials).length).toBeGreaterThan(0);
    expect(screen.getByText(UI_STRINGS.module4.pipelineTitle)).toBeInTheDocument();
    expect(screen.getAllByText(UI_STRINGS.module4.netModelledOpportunityLabel).length).toBeGreaterThan(0);
    expect(screen.getByText(UI_STRINGS.module4.realizationTargetBenchmarkBadge('16.4'))).toBeInTheDocument();
  });

  it('filters opportunities by category and by module', () => {
    renderEngine();

    const selects = screen.getAllByRole('combobox');
    const categorySelect = selects[0];
    const moduleSelect = selects[1];

    // Filter by Packaging Materials
    fireEvent.change(categorySelect, { target: { value: UI_STRINGS.module4.categories.packagingMaterials } });
    expect(screen.queryByText('OPP-001')).toBeNull();
    expect(screen.getByText('OPP-002')).toBeInTheDocument();

    // Reset the category, then filter by proCPX
    fireEvent.change(categorySelect, { target: { value: 'ALL' } });
    fireEvent.change(moduleSelect, { target: { value: 'proCPX' } });
    expect(screen.getByText('OPP-001')).toBeInTheDocument();
    expect(screen.queryByText('OPP-002')).toBeNull();

    // Filter by DPS NXT
    fireEvent.change(moduleSelect, { target: { value: 'DPS NXT' } });
    expect(screen.queryByText('OPP-001')).toBeNull();
    expect(screen.getByText('OPP-002')).toBeInTheDocument();

    // Reset to ALL
    fireEvent.change(moduleSelect, { target: { value: 'ALL' } });
    expect(screen.getByText('OPP-001')).toBeInTheDocument();
    expect(screen.getByText('OPP-002')).toBeInTheDocument();
  });

  it('shows the awaiting message when the selected category has no opportunities', () => {
    renderEngine();

    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: UI_STRINGS.module4.categories.indirectMRO } });

    expect(screen.getByText(UI_STRINGS.module4.awaitingDatasetIngestion)).toBeInTheDocument();
  });

  it('triggers onOpenProCPX and onOpenDPSNXT with the matching opportunity', () => {
    const onOpenProCPX = vi.fn();
    const onOpenDPSNXT = vi.fn();
    renderEngine({ onOpenProCPX, onOpenDPSNXT });

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.module4.pushToProCPX }));
    expect(onOpenProCPX).toHaveBeenCalledWith(expect.objectContaining({ opp_id: 'OPP-001' }));

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.module4.pushToDPSNXT }));
    expect(onOpenDPSNXT).toHaveBeenCalledWith(expect.objectContaining({ opp_id: 'OPP-002' }));
  });

  it('handles opportunities with already pushed status and fallback spend values', () => {
    const customOpps = [
      {
        ...sampleSavingsOpportunities[0],
        status: 'Pushed to proCPX',
        current_spend_inr_cr: undefined as any,
        est_savings_inr_cr: undefined as any
      },
      {
        ...sampleSavingsOpportunities[1],
        status: 'Pushed to DPS NXT',
        current_spend_inr_cr: undefined as any,
        est_savings_inr_cr: undefined as any
      }
    ];

    renderEngine({ opportunities: customOpps as any });

    const pushedBadges = screen.getAllByText(UI_STRINGS.module4.pushedBadge);
    expect(pushedBadges).toHaveLength(2);
    // Spend and savings fall back to the raw INR values converted to crore
    expect(screen.getByText(UI_STRINGS.common.croreAmount('3771.00'))).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.common.croreAmount('377.10'))).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: UI_STRINGS.module4.pushToProCPX })).toBeNull();
  });

  it('labels an opportunity with no module as proCPX and offers the DPS NXT push', () => {
    const onOpenDPSNXT = vi.fn();
    const untargeted = [{ ...sampleSavingsOpportunities[0], recommended_module: undefined, push_to_module: undefined }];
    renderEngine({ opportunities: untargeted as never, onOpenDPSNXT });

    const pipeline = screen.getByTestId('savings-pipeline-table-section');
    expect(within(pipeline).getByText('proCPX', { selector: 'span' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.module4.pushToDPSNXT }));
    expect(onOpenDPSNXT).toHaveBeenCalledTimes(1);
  });

  it('triggers onProceedToConversion when CTA is clicked', () => {
    const onProceed = vi.fn();
    renderEngine({ onProceedToConversion: onProceed });

    const ctaBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.module4.ctaProceedButton, 'i') });
    fireEvent.click(ctaBtn);
    expect(onProceed).toHaveBeenCalled();
  });

  it('links to the executive brief and suppresses the default navigation', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    renderEngine();

    const briefLink = screen.getByTestId('module4-open-brief-btn');
    expect(briefLink).toHaveAttribute('href', '/executive-brief');
    expect(briefLink).toHaveTextContent(UI_STRINGS.module4.btnOpenExecutiveBrief);
    expect(fireEvent.click(briefLink)).toBe(false);
  });

  it('renders masked overlay for Bronze customer and handles upgrade to silver', () => {
    const onUpgrade = vi.fn();
    renderEngine({ currentTier: 'BRONZE', onUpgrade });

    const upgradeBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.subscription.upgradeToSilver, 'i') });
    expect(upgradeBtn).toBeInTheDocument();
    fireEvent.click(upgradeBtn);
    expect(onUpgrade).toHaveBeenCalledWith('SILVER');
  });

  it('ignores the upgrade request for Bronze when no upgrade handler is provided', () => {
    renderEngine({ currentTier: 'BRONZE' });

    const upgradeBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.subscription.upgradeToSilver, 'i') });
    expect(() => fireEvent.click(upgradeBtn)).not.toThrow();
    expect(screen.getByRole('button', { name: new RegExp(UI_STRINGS.subscription.upgradeToSilver, 'i') })).toBeInTheDocument();
  });

  it('renders total savings value for Silver customer and masks opportunity pipeline with Gold upgrade trigger', () => {
    const onUpgrade = vi.fn();
    const onProceed = vi.fn();
    renderEngine({ currentTier: 'SILVER', onUpgrade, onProceedToConversion: onProceed });

    expect(screen.getByText(UI_STRINGS.module4.heading)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.subscription.savingsWhereLockedTitle)).toBeInTheDocument();
    expect(screen.queryByTestId('savings-pipeline-table-section')).toBeNull();

    const upgradeBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.subscription.upgradeToGold, 'i') });
    expect(upgradeBtn).toBeInTheDocument();
    fireEvent.click(upgradeBtn);
    expect(onUpgrade).toHaveBeenCalledWith('GOLD');

    const ctaBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.module4.ctaProceedButton, 'i') });
    fireEvent.click(ctaBtn);
    expect(onProceed).toHaveBeenCalled();
  });

  it('renders StrategicSavingsSummaryBanner and handles click-to-detail navigation', () => {
    const handleNavigate = vi.fn();
    // Mock scrollIntoView
    const scrollIntoViewMock = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

    renderEngine({ onNavigateToSection: handleNavigate });

    // Verify Strategic Savings Banner is rendered
    expect(screen.getByTestId('strategic-savings-summary-banner')).toBeInTheDocument();

    // Click Vendor Consolidation savings number
    fireEvent.click(screen.getByTestId('btn-savings-number-VENDOR_CONSOLIDATION'));
    expect(handleNavigate).toHaveBeenCalledWith('module2', 'vendor-consolidation-section');

    // Click Category Savings Pipeline savings number (internal to module4)
    fireEvent.click(screen.getByTestId('btn-savings-number-CATEGORY_SAVINGS_PIPELINE'));
    expect(handleNavigate).toHaveBeenCalledWith('module4', 'savings-pipeline-table-section');
    expect(scrollIntoViewMock).toHaveBeenCalled();
  });

  it('navigates without a handler when no section navigation callback is provided', () => {
    renderEngine();

    expect(() => fireEvent.click(screen.getByTestId('btn-savings-number-VENDOR_CONSOLIDATION'))).not.toThrow();
  });

  describe('analysis job and savings evidence', () => {
    it('uses the selected assessment job instead of another customer first in the job list', async () => {
      const selectedJob = { ...sampleJob, analysisJobId: 'AIC-2026-0002' };
      vi.mocked(orchestrationApi.getJobs).mockResolvedValue([sampleJob, selectedJob]);
      renderEngine({ assessmentId: selectedJob.analysisJobId });

      expect(await screen.findByTestId('evidence-section-stub')).toHaveTextContent(selectedJob.analysisJobId);
      expect(screen.getByTestId('evidence-section-stub')).not.toHaveTextContent(sampleJob.analysisJobId);
    });

    it('hides evidence when the selected assessment has no job even if other customers do', async () => {
      vi.mocked(orchestrationApi.getJobs).mockResolvedValue([sampleJob]);
      renderEngine({ assessmentId: 'AIC-2026-OTHER' });

      await act(async () => undefined);
      expect(screen.queryByTestId('evidence-section-stub')).not.toBeInTheDocument();
    });

    it('clears another assessment savings and evidence immediately and keeps them hidden after a failed request', async () => {
      let rejectSavings: (reason: Error) => void = () => undefined;
      let rejectJobs: (reason: Error) => void = () => undefined;
      vi.mocked(apiClient.getConsolidatedSavings)
        .mockResolvedValueOnce(consolidatedData)
        .mockImplementationOnce(() => new Promise((_resolve, reject) => { rejectSavings = reject; }));
      vi.mocked(orchestrationApi.getJobs)
        .mockResolvedValueOnce([{ ...sampleJob, analysisJobId: 'AIC-FIRST' }])
        .mockImplementationOnce(() => new Promise((_resolve, reject) => { rejectJobs = reject; }));
      const { rerender } = renderEngine({ assessmentId: 'AIC-FIRST', opportunities: [] });
      expect(await screen.findByText('OPP-A')).toBeInTheDocument();
      expect(await screen.findByTestId('evidence-section-stub')).toHaveTextContent('AIC-FIRST');

      rerender(<Module4SavingsEngine opportunities={[]} assessmentId="AIC-SECOND" onOpenProCPX={vi.fn()} onOpenDPSNXT={vi.fn()} onProceedToConversion={vi.fn()} />);
      expect(screen.queryByText('OPP-A')).not.toBeInTheDocument();
      expect(screen.queryByText(UI_STRINGS.common.croreAmount('12.346'))).not.toBeInTheDocument();
      expect(screen.queryByTestId('evidence-section-stub')).not.toBeInTheDocument();

      await act(async () => {
        rejectSavings(new Error('Selected assessment savings unavailable'));
        rejectJobs(new Error('Selected assessment job unavailable'));
      });
      expect(screen.queryByText('OPP-A')).not.toBeInTheDocument();
      expect(screen.queryByTestId('evidence-section-stub')).not.toBeInTheDocument();
    });

    it('ignores failures from an old assessment after another assessment has been selected', async () => {
      let rejectSavings: (reason: Error) => void = () => undefined;
      let rejectJobs: (reason: Error) => void = () => undefined;
      vi.mocked(apiClient.getConsolidatedSavings)
        .mockImplementationOnce(() => new Promise((_resolve, reject) => { rejectSavings = reject; }))
        .mockResolvedValueOnce(consolidatedData);
      vi.mocked(orchestrationApi.getJobs)
        .mockImplementationOnce(() => new Promise((_resolve, reject) => { rejectJobs = reject; }))
        .mockResolvedValueOnce([{ ...sampleJob, analysisJobId: 'AIC-CURRENT' }]);
      const { rerender } = renderEngine({ assessmentId: 'AIC-OLD', opportunities: [] });
      rerender(<Module4SavingsEngine opportunities={[]} assessmentId="AIC-CURRENT" onOpenProCPX={vi.fn()} onOpenDPSNXT={vi.fn()} onProceedToConversion={vi.fn()} />);
      expect(await screen.findByText('OPP-A')).toBeInTheDocument();
      expect(await screen.findByTestId('evidence-section-stub')).toHaveTextContent('AIC-CURRENT');

      await act(async () => {
        rejectSavings(new Error('Old request failed late'));
        rejectJobs(new Error('Old job request failed late'));
      });
      expect(frontendLogger.warn).not.toHaveBeenCalled();
      expect(screen.getByText('OPP-A')).toBeInTheDocument();
      expect(screen.getByTestId('evidence-section-stub')).toHaveTextContent('AIC-CURRENT');
    });

    it('renders the savings evidence section with the real analysis job id', async () => {
      vi.mocked(orchestrationApi.getJobs).mockResolvedValue([sampleJob]);
      renderEngine();

      expect(await screen.findByTestId('evidence-section-stub')).toHaveTextContent('AIC-JOB-77');
      expect(orchestrationApi.getJobs).toHaveBeenCalledWith();
    });

    it('hides the savings evidence section when the customer has no analysis job', async () => {
      vi.spyOn(orchestrationApi, 'getJobs').mockResolvedValue([]);
      renderEngine();

      await waitFor(() => expect(orchestrationApi.getJobs).toHaveBeenCalled());
      expect(screen.queryByTestId('evidence-section-stub')).toBeNull();
    });

    it('logs a warning and hides the evidence section when the job lookup fails', async () => {
      vi.spyOn(orchestrationApi, 'getJobs').mockRejectedValue(new Error('Unauthorized'));
      renderEngine();

      await waitFor(() => {
        expect(frontendLogger.warn).toHaveBeenCalledWith(
          'Analysis job could not be loaded, so savings evidence downloads are hidden.',
          { error: 'Unauthorized' }
        );
      });
      expect(screen.queryByTestId('evidence-section-stub')).toBeNull();
    });

    it('ignores job and savings responses that arrive after the component unmounts', async () => {
      let resolveJobs: (jobs: AnalysisJob[]) => void = () => undefined;
      let resolveSavings: (data: ConsolidatedSavingsData) => void = () => undefined;
      vi.spyOn(orchestrationApi, 'getJobs').mockReturnValue(new Promise<AnalysisJob[]>((resolve) => { resolveJobs = resolve; }));
      vi.spyOn(apiClient, 'getConsolidatedSavings').mockReturnValue(
        new Promise<ConsolidatedSavingsData>((resolve) => { resolveSavings = resolve; }) as never
      );
      const { unmount } = renderEngine();

      unmount();
      await act(async () => {
        resolveJobs([sampleJob]);
        resolveSavings(consolidatedData);
      });

      expect(frontendLogger.warn).not.toHaveBeenCalled();
    });
  });

  describe('consolidated savings', () => {
    it('builds the opportunity pipeline and headline from consolidated savings when no opportunities are passed', async () => {
      vi.spyOn(apiClient, 'getConsolidatedSavings').mockResolvedValue(consolidatedData);
      renderEngine({ opportunities: [] });

      expect(await screen.findByText('OPP-A')).toBeInTheDocument();
      expect(screen.getByText('OPP-B')).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.common.croreAmount('12.346'))).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.module4.leakPrefix(UI_STRINGS.module4.defaultLeverLabel))).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.module4.leakPrefix('Rate card leakage'))).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.module4.evaluatedBaselineSpendNote('120.50'))).toBeInTheDocument();
      expect(screen.getByTestId('waterfall-stub')).toBeInTheDocument();
    });

    it('shows the opportunity list only and logs a warning when consolidated savings cannot be loaded', async () => {
      vi.spyOn(apiClient, 'getConsolidatedSavings').mockRejectedValue(new Error('Savings API down'));
      renderEngine();

      await waitFor(() => {
        expect(frontendLogger.warn).toHaveBeenCalledWith(
          'Consolidated savings could not be loaded. Showing the opportunity list only.',
          expect.objectContaining({ error: 'Savings API down' })
        );
      });
      expect(screen.getByText('OPP-001')).toBeInTheDocument();
    });

    it('logs a non-Error consolidated savings failure as text', async () => {
      vi.spyOn(apiClient, 'getConsolidatedSavings').mockRejectedValue('timeout');
      renderEngine();

      await waitFor(() => {
        expect(frontendLogger.warn).toHaveBeenCalledWith(
          'Consolidated savings could not be loaded. Showing the opportunity list only.',
          expect.objectContaining({ error: 'timeout' })
        );
      });
    });

    it('derives the headline and baseline from USD fields when the waterfall is missing', () => {
      const usdOnly = [{
        opp_id: 'USD-1',
        category: 'Packaging Materials',
        title: 'USD lever',
        current_spend: 0,
        current_spend_usd: 5000000,
        est_savings: 0,
        estimated_savings_usd: 1000000,
        target_savings_pct: 10,
        status: 'Pending',
        push_to_module: 'proCPX',
        recommended_module: 'proCPX',
        lever: 'usd lever',
        contract_leak_type: 'Usd leakage'
      }];
      renderEngine({ opportunities: usdOnly as never });

      expect(screen.getByText(UI_STRINGS.common.croreAmount('8.380'))).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.module4.evaluatedBaselineSpendNote('41.90'))).toBeInTheDocument();
    });

    it('shows the baseline spend with four decimals when it has more than two decimal places', () => {
      const precise = [{ ...sampleSavingsOpportunities[0], baseline_spend_inr_cr: 45.125 }];
      renderEngine({ opportunities: precise as never });

      expect(screen.getByText(UI_STRINGS.module4.evaluatedBaselineSpendNote('45.1250'))).toBeInTheDocument();
    });

    it('shows the category target from the savings ratio, the fixed realization target, or zero', () => {
      const categoryOpps = [
        { ...sampleSavingsOpportunities[0], category: 'Direct Materials', est_savings_inr_cr: 4.5, baseline_spend_inr_cr: 45 },
        { opp_id: 'LOG-1', category: 'Logistics & Freight', est_savings_inr_cr: 1.5, baseline_spend_inr_cr: 0, current_spend_inr_cr: 0, target_savings_pct: 1, status: 'Pending', recommended_module: 'proCPX' }
      ];
      renderEngine({ opportunities: categoryOpps as never });

      expect(screen.getByText(UI_STRINGS.module4.targetPrefix('10.0%'))).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.module4.targetPrefix('16.4%'))).toBeInTheDocument();
      expect(screen.getAllByText(UI_STRINGS.module4.targetPrefix('0.0%')).length).toBeGreaterThan(0);
    });

    it('applies action plan and status updates from the trackers and logs rejected saves', async () => {
      const planSpy = vi.spyOn(apiClient, 'updateActionPlan').mockRejectedValue(new Error('Plan locked'));
      const statusSpy = vi.spyOn(apiClient, 'updateSavingsOpportunityStatus').mockRejectedValue('Status rejected');
      vi.spyOn(apiClient, 'getConsolidatedSavings').mockResolvedValue(consolidatedData);
      renderEngine({ opportunities: [] });
      await screen.findByText('OPP-A');

      fireEvent.click(screen.getByRole('button', { name: 'trigger-action-plan' }));
      fireEvent.click(screen.getByRole('button', { name: 'trigger-overlap-status' }));

      expect(planSpy).toHaveBeenCalledWith('AP-1', { status: 'Completed' });
      expect(statusSpy).toHaveBeenCalledWith('OPP-A', 'APPROVED');
      await waitFor(() => {
        expect(frontendLogger.warn).toHaveBeenCalledWith(
          'Action plan update was not saved to the server.',
          expect.objectContaining({ actionId: 'AP-1', error: 'Plan locked' })
        );
      });
      expect(frontendLogger.warn).toHaveBeenCalledWith(
        'Opportunity status update was not saved to the server.',
        expect.objectContaining({ oppId: 'OPP-A', error: 'Status rejected' })
      );
      expect(screen.getByRole('alert')).toHaveTextContent(UI_STRINGS.module4.saveFailed('Status rejected'));
      expect(screen.getByTestId('persisted-opportunity-statuses')).toHaveTextContent('IDENTIFIED');
    });

    it('changes tracker values only after the database acknowledges a successful save', async () => {
      let resolvePlan: (value: never) => void = () => undefined;
      let resolveStatus: (value: never) => void = () => undefined;
      vi.spyOn(apiClient, 'updateActionPlan').mockImplementation(() => new Promise((resolve) => { resolvePlan = resolve; }));
      vi.spyOn(apiClient, 'updateSavingsOpportunityStatus').mockImplementation(() => new Promise((resolve) => { resolveStatus = resolve; }));
      vi.spyOn(apiClient, 'getConsolidatedSavings').mockResolvedValue({ ...consolidatedData, actionPlans: [
        { id: 'AP-1', status: 'Pending' }, { id: 'AP-2', status: 'In Progress' }
      ] } as never);
      renderEngine({ opportunities: [] });
      await screen.findByText('OPP-A');

      fireEvent.click(screen.getByRole('button', { name: 'trigger-action-plan' }));
      fireEvent.click(screen.getByRole('button', { name: 'trigger-overlap-status' }));
      expect(screen.getByTestId('persisted-action-plans')).toHaveTextContent('Pending');
      expect(screen.getByTestId('persisted-opportunity-statuses')).toHaveTextContent('IDENTIFIED');
      await act(async () => { resolvePlan({} as never); resolveStatus({} as never); });
      expect(screen.getByTestId('persisted-action-plans')).toHaveTextContent('Completed');
      expect(screen.getByTestId('persisted-action-plans')).toHaveTextContent('In Progress');
      expect(screen.getByTestId('persisted-opportunity-statuses')).not.toHaveTextContent('IDENTIFIED');
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('accepts tracker updates when no consolidated data has loaded', async () => {
      const planSpy = vi.spyOn(apiClient, 'updateActionPlan').mockResolvedValue({} as never);
      const statusSpy = vi.spyOn(apiClient, 'updateSavingsOpportunityStatus').mockResolvedValue({} as never);
      renderEngine();

      fireEvent.click(screen.getByRole('button', { name: 'trigger-action-plan' }));
      fireEvent.click(screen.getByRole('button', { name: 'trigger-overlap-status' }));

      expect(planSpy).toHaveBeenCalledTimes(1);
      expect(statusSpy).toHaveBeenCalledTimes(1);
      expect(frontendLogger.warn).not.toHaveBeenCalled();
    });

    it('lists the pipeline table within the section and keeps its rows scoped', async () => {
      renderEngine();

      const pipeline = screen.getByTestId('savings-pipeline-table-section');
      expect(within(pipeline).getByText('OPP-001')).toBeInTheDocument();
      expect(within(pipeline).getByText('OPP-002')).toBeInTheDocument();
    });
  });
});
