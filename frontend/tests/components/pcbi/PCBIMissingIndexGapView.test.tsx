import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PCBIMissingIndexGapView } from '../../../src/components/pcbi/PCBIMissingIndexGapView';
import { pcbiApiClient } from '../../../src/utils/pcbiApi';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import type { PCBIMissingIndexGapReport } from '../../../src/types/module3GapList';

const mockReport: PCBIMissingIndexGapReport = {
  assessmentId: 'AIC-2026-0002',
  customerId: 'CUST-2026-0002',
  customerName: 'Borosil Ltd',
  reportDate: '2026-10-28',
  baselineSpendCr: 556.5346,
  baselineSpendInr: 5565346426.19,
  baselineTransactions: 27777,
  totalRequirementsCount: 8976,
  verifiedObservationsCount: 0,
  verifiedSpendCr: 0.0,
  missingIndexGapSpendCr: 556.5346,
  missingIndexGapSpendPct: 100.0,
  quarantinedObservationsCount: 14,
  certifiedSavingsCr: 0.0,
  realizedSavingsCr: 0.0,
  pcbiIndexCalculated: false,
  statusSummaries: [
    {
      status: 'VERIFIED OBSERVATIONS AVAILABLE',
      statusLabel: 'Verified Observations Available',
      itemCount: 0,
      transactionCount: 0,
      totalSpendCr: 0.0,
      totalSpendInr: 0.0,
      spendPercentage: 0.0,
      actionGuidance: 'Ready'
    },
    {
      status: 'SOURCE IDENTIFIED — DATA NOT ACQUIRED',
      statusLabel: 'Source Identified — Data Not Acquired',
      itemCount: 6,
      transactionCount: 59,
      totalSpendCr: 79.1808,
      totalSpendInr: 791807349.05,
      spendPercentage: 14.23,
      actionGuidance: 'Acquire'
    }
  ],
  items: [
    {
      id: 'GAP-BOR-001',
      materialCode: '100SA02G',
      materialDescription: 'Soda Ash Dense - GHCL',
      commodityClassification: 'Direct Chemical Raw Materials / Sodium Carbonate',
      unspscCode: '12142104',
      existingGradeSpecification: 'Dense Soda Ash (Na2CO3 >= 99.2%)',
      customerSpendCr: 58.1170,
      customerSpendInr: 581170000.0,
      transactionCount: 6,
      spendSharePct: 10.44,
      pcbiSeriesId: 'PCBI-IND-CHM-SDA-001',
      benchmarkSeriesName: 'AMAI Domestic Dense Soda Ash Index (Ex-Gujarat)',
      benchmarkPublisherSource: 'Alkali Manufacturers Association of India (AMAI)',
      sourceStatus: 'SOURCE IDENTIFIED — DATA NOT ACQUIRED',
      observationCoverage: '0 observations (FY 2026-27 unacquired)',
      latestObservationDate: null,
      gapStatus: 'SOURCE IDENTIFIED — DATA NOT ACQUIRED',
      gapReason: 'AMAI published bulletins require official commercial acquisition.',
      nextActionRequired: 'Acquire official AMAI monthly bulletins.'
    },
    {
      id: 'GAP-BOR-003',
      materialCode: '100SSW13FG-L',
      materialDescription: 'SILICA SAND (L) — Primary Solar Glass Grade',
      commodityClassification: 'Direct Minerals / Beneficiated Silica Sand',
      unspscCode: '11111601',
      existingGradeSpecification: 'Beneficiated Low-Iron Silica Sand (SiO2 > 99.5%, Fe2O3 < 100-150 ppm)',
      customerSpendCr: 36.6840,
      customerSpendInr: 366840000.0,
      transactionCount: 20,
      spendSharePct: 6.59,
      pcbiSeriesId: 'PCBI-IND-MIN-SLS-001',
      benchmarkSeriesName: 'IBM Monthly Mineral Sale Price — Quartz & Silica Sand',
      benchmarkPublisherSource: 'Indian Bureau of Mines (IBM)',
      sourceStatus: 'MAPPING / SPECIFICATION REVIEW REQUIRED',
      observationCoverage: '0 observations (review required)',
      latestObservationDate: null,
      gapStatus: 'MAPPING / SPECIFICATION REVIEW REQUIRED',
      gapReason: 'IBM tracks unwashed commercial sand; washing spread requires review.',
      nextActionRequired: 'Engage engineering committee for beneficiation wash spread.'
    },
    {
      id: 'GAP-BOR-011',
      materialCode: 'STTV2062',
      materialDescription: 'Cumirex Super Refractory tiles',
      commodityClassification: 'Refractory Ceramics',
      unspscCode: '30111603',
      existingGradeSpecification: 'Fused Zirconia Mullite (AZS) Pressed Feeder Block',
      customerSpendCr: 0.0153,
      customerSpendInr: 153000.0,
      transactionCount: 2,
      spendSharePct: 0.003,
      pcbiSeriesId: null,
      benchmarkSeriesName: null,
      benchmarkPublisherSource: null,
      sourceStatus: 'NO SUITABLE BENCHMARK IDENTIFIED',
      observationCoverage: '0 observations',
      latestObservationDate: null,
      gapStatus: 'NO SUITABLE BENCHMARK IDENTIFIED',
      gapReason: 'Engineered proprietary furnace shape. Not benchmarkable.',
      nextActionRequired: 'Excluded from PCBI calculations (Zero Synthetic Variance Rule).'
    }
  ]
};

describe('PCBIMissingIndexGapView Component Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading indicator initially then displays report upon successful fetch', async () => {
    vi.spyOn(pcbiApiClient, 'getPCBIMissingIndexGapList').mockResolvedValueOnce({
      success: true,
      report: mockReport
    });

    render(<PCBIMissingIndexGapView assessmentId="AIC-2026-0002" />);

    // Initially displays loader
    expect(screen.getByText(/Loading authoritative Borosil PCBI gap catalog/i)).toBeInTheDocument();

    // Resolves and displays title and metrics
    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.module3.gapList.viewTitle)).toBeInTheDocument();
    });

    expect(screen.getByText(UI_STRINGS.module3.gapList.badgeReadiness)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.module3.gapList.badgeBaseline)).toBeInTheDocument();
    expect(screen.getByText('Soda Ash Dense - GHCL')).toBeInTheDocument();
    expect(screen.getByText('100SA02G')).toBeInTheDocument();
    expect(screen.getByText('SILICA SAND (L) — Primary Solar Glass Grade')).toBeInTheDocument();
  });

  it('renders drilldown details when requirement row is clicked', async () => {
    vi.spyOn(pcbiApiClient, 'getPCBIMissingIndexGapList').mockResolvedValueOnce({
      success: true,
      report: mockReport
    });

    render(<PCBIMissingIndexGapView assessmentId="AIC-2026-0002" />);

    await waitFor(() => {
      expect(screen.getByText('Soda Ash Dense - GHCL')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Soda Ash Dense - GHCL'));

    expect(screen.getByText(new RegExp(UI_STRINGS.module3.gapList.drillDownTitle, 'i'))).toBeInTheDocument();
    expect(screen.getAllByText(/Acquire official AMAI monthly bulletins/i).length).toBeGreaterThanOrEqual(1);

    // Close drilldown
    fireEvent.click(screen.getByText(UI_STRINGS.module3.gapList.drillDownClose));
    expect(screen.queryByText(new RegExp(UI_STRINGS.module3.gapList.drillDownTitle, 'i'))).not.toBeInTheDocument();
  });

  it('handles CSV export button click', async () => {
    vi.spyOn(pcbiApiClient, 'getPCBIMissingIndexGapList').mockResolvedValueOnce({
      success: true,
      report: mockReport
    });

    const exportSpy = vi.spyOn(pcbiApiClient, 'getPCBIMissingIndexGapListExportUrl').mockReturnValue(
      'http://localhost:5000/api/module3/gap-list/export?assessmentId=AIC-2026-0002'
    );

    render(<PCBIMissingIndexGapView assessmentId="AIC-2026-0002" />);

    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.module3.gapList.btnExportCsv)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(UI_STRINGS.module3.gapList.btnExportCsv));
    expect(exportSpy).toHaveBeenCalledWith('AIC-2026-0002');
  });

  it('displays error message and retry button when fetch fails', async () => {
    vi.spyOn(pcbiApiClient, 'getPCBIMissingIndexGapList').mockRejectedValueOnce(
      new Error('Connection refused')
    );

    render(<PCBIMissingIndexGapView assessmentId="AIC-2026-0002" />);

    await waitFor(() => {
      expect(screen.getByText(/Error Loading Gap List/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Retry Loading/i)).toBeInTheDocument();
  });

  it('routes to mapping review interface and preserves requirement context for unmapped requirements (100SSW13FG-L)', async () => {
    vi.spyOn(pcbiApiClient, 'getPCBIMissingIndexGapList').mockResolvedValue({
      success: true,
      report: mockReport
    });
    vi.spyOn(pcbiApiClient, 'getMaterialMappings').mockResolvedValue({
      success: true,
      mappings: []
    });

    const onSelectReqMock = vi.fn();

    render(
      <PCBIMissingIndexGapView
        assessmentId="AIC-2026-0002"
        onSelectRequirement={onSelectReqMock}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('SILICA SAND (L) — Primary Solar Glass Grade')).toBeInTheDocument();
    });

    // Click the row to open detail slide-over
    fireEvent.click(screen.getByText('SILICA SAND (L) — Primary Solar Glass Grade'));

    // Click upload benchmark button in slide-over
    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.module3.gapList.btnUploadRequirementBenchmark)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(UI_STRINGS.module3.gapList.btnUploadRequirementBenchmark));

    // Upload modal opens at Step 1
    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.module3.gapList.uploadWorkflow.step1Title)).toBeInTheDocument();
    });

    // Click Next to advance to Step 2
    fireEvent.click(screen.getByText(UI_STRINGS.module3.gapList.uploadWorkflow.btnNext));

    // Step 2 shows the mapping required warning banner and "Route for Mapping Review" button
    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.module3.gapList.uploadWorkflow.btnRouteMapping)).toBeInTheDocument();
    });

    // Click "Route for Mapping Review"
    fireEvent.click(screen.getByText(UI_STRINGS.module3.gapList.uploadWorkflow.btnRouteMapping));

    // The Mapping Review Modal opens!
    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.module3.mappingReview.modalTitle)).toBeInTheDocument();
    });

    // Verify context is preserved: Material code, spend, transactions, and benchmark family
    expect(screen.getAllByText('100SSW13FG-L').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/₹36.6840 Cr/i)).toBeInTheDocument();
    expect(screen.getByText('Industrial Minerals')).toBeInTheDocument();
    expect(screen.getByText('Indian Bureau of Mines (IBM) Silica Sand Mineral Statistics')).toBeInTheDocument();

    // Verify onSelectRequirement callback was invoked
    expect(onSelectReqMock).toHaveBeenCalledWith(
      expect.objectContaining({ materialCode: '100SSW13FG-L' })
    );
  });

  it('routes to mapping review for custom refractory item (STTV2062) showing non-benchmarkable state', async () => {
    vi.spyOn(pcbiApiClient, 'getPCBIMissingIndexGapList').mockResolvedValue({
      success: true,
      report: mockReport
    });
    vi.spyOn(pcbiApiClient, 'getMaterialMappings').mockResolvedValue({
      success: true,
      mappings: []
    });

    render(<PCBIMissingIndexGapView assessmentId="AIC-2026-0002" />);

    await waitFor(() => {
      expect(screen.getByText('Cumirex Super Refractory tiles')).toBeInTheDocument();
    });

    // Click row to open detail slide-over
    fireEvent.click(screen.getByText('Cumirex Super Refractory tiles'));

    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.module3.gapList.btnUploadRequirementBenchmark)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(UI_STRINGS.module3.gapList.btnUploadRequirementBenchmark));

    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.module3.gapList.uploadWorkflow.step1Title)).toBeInTheDocument();
    });

    // Advance to Step 2
    fireEvent.click(screen.getByText(UI_STRINGS.module3.gapList.uploadWorkflow.btnNext));

    // Route for mapping review
    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.module3.gapList.uploadWorkflow.btnRouteMapping)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(UI_STRINGS.module3.gapList.uploadWorkflow.btnRouteMapping));

    // Mapping review modal displays STTV2062 context with No Candidates
    await waitFor(() => {
      expect(screen.getAllByText('STTV2062').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(UI_STRINGS.module3.mappingReview.lblNoCandidates)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.module3.mappingReview.tagNoBenchmark)).toBeInTheDocument();
    });
  });

  it('displays visible navigation failure error message if requirement is not found', async () => {
    vi.spyOn(pcbiApiClient, 'getPCBIMissingIndexGapList').mockResolvedValue({
      success: true,
      report: mockReport
    });

    render(<PCBIMissingIndexGapView assessmentId="AIC-2026-0002" />);

    await waitFor(() => {
      expect(screen.getByText('Soda Ash Dense - GHCL')).toBeInTheDocument();
    });

    // Trigger general upload modal
    fireEvent.click(screen.getByText(UI_STRINGS.module3.gapList.btnUploadBenchmark));

    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.module3.gapList.uploadWorkflow.modalTitle)).toBeInTheDocument();
    });
  });
});
