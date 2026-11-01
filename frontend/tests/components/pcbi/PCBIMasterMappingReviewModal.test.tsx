import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PCBIMasterMappingReviewModal } from '../../../src/components/pcbi/PCBIMasterMappingReviewModal';
import { pcbiApiClient } from '../../../src/utils/pcbiApi';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import type { PCBIMissingIndexGapItem } from '../../../src/types/module3GapList';
import type { MaterialBenchmarkMappingRecord } from '../../../src/types/module3PcbiMapping';

const mockSodaAshItem: PCBIMissingIndexGapItem = {
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
  observationCoverage: '0 observations',
  latestObservationDate: null,
  gapStatus: 'SOURCE IDENTIFIED — DATA NOT ACQUIRED',
  gapReason: 'AMAI published bulletins require official commercial acquisition.',
  nextActionRequired: 'Acquire official AMAI monthly bulletins.'
};

const mockRefractoryItem: PCBIMissingIndexGapItem = {
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
  sourceStatus: 'NO SUITABLE SOURCE IDENTIFIED',
  observationCoverage: '0 observations',
  latestObservationDate: null,
  gapStatus: 'NO SUITABLE BENCHMARK IDENTIFIED',
  gapReason: 'Engineered proprietary furnace shape. Not benchmarkable.',
  nextActionRequired: 'Exclude from PCBI calculation.'
};

const mockMappingRecord: MaterialBenchmarkMappingRecord = {
  id: 'MAP-BOR-100SA02G',
  assessmentId: 'AIC-2026-0002',
  customerName: 'Borosil Ltd',
  materialCode: '100SA02G',
  materialDescription: 'Soda Ash Dense - GHCL',
  spendCategory: '11100',
  unspscCode: '12142104',
  unspscCommodity: 'Sodium carbonate',
  historicalSpendInr: 581170000,
  historicalSpendCr: 58.1170,
  transactionCount: 6,
  sourceUom: 'MT',
  sourceCurrency: 'INR',
  benchmarkSeriesId: 'PCBI-IND-CHM-SDA-001',
  benchmarkSeriesName: 'AMAI Domestic Dense Soda Ash Index (Ex-Gujarat)',
  benchmarkPublisher: 'Alkali Manufacturers Association of India',
  benchmarkGeography: 'Gujarat, India',
  benchmarkDeliveryTerm: 'Ex-Works',
  benchmarkUom: 'MT',
  benchmarkCurrency: 'INR',
  sourceAvailability: 'SOURCE_IDENTIFIED_DATA_NOT_ACQUIRED',
  specificationComparability: 'IDENTICAL_GRADE',
  geographyCompatibility: 'DOMESTIC_EX_WORKS',
  deliveryTermCompatibility: 'EX_WORKS_MATCHED',
  unitConversion: {
    sourceUom: 'MT',
    targetBenchmarkUom: 'MT',
    conversionFactor: 1.0,
    isTraceable: true
  },
  currencyConversion: {
    sourceCurrency: 'INR',
    targetBenchmarkCurrency: 'INR',
    fxSource: 'RBI_OFFICIAL',
    isTraceable: true
  },
  mappingStatus: 'MAPPED_PENDING_APPROVAL',
  confidenceRating: 'HIGH',
  evidenceRationale: 'Dense soda ash procured from GHCL for glass melting.',
  approvalStatus: 'PENDING',
  auditHistory: []
};

describe('PCBIMasterMappingReviewModal Component Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false or requirement is null', () => {
    const { container: c1 } = render(
      <PCBIMasterMappingReviewModal
        isOpen={false}
        requirement={mockSodaAshItem}
        onClose={vi.fn()}
        onReturnToUpload={vi.fn()}
      />
    );
    expect(c1).toBeEmptyDOMElement();

    const { container: c2 } = render(
      <PCBIMasterMappingReviewModal
        isOpen={true}
        requirement={null}
        onClose={vi.fn()}
        onReturnToUpload={vi.fn()}
      />
    );
    expect(c2).toBeEmptyDOMElement();
  });

  it('renders requirement context, spend, specification, and distinguishes Category from Benchmark Family', async () => {
    vi.spyOn(pcbiApiClient, 'getMaterialMappings').mockResolvedValueOnce({
      success: true,
      mappings: [mockMappingRecord]
    });

    render(
      <PCBIMasterMappingReviewModal
        isOpen={true}
        requirement={mockSodaAshItem}
        assessmentId="AIC-2026-0002"
        customerId="CUST-2026-0002"
        customerName="Borosil Ltd"
        onClose={vi.fn()}
        onReturnToUpload={vi.fn()}
      />
    );

    // Header & Modal Title
    expect(screen.getByText(UI_STRINGS.module3.mappingReview.modalTitle)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.module3.mappingReview.badgeBaselineReconciled)).toBeInTheDocument();

    // Context details
    expect(screen.getByText('100SA02G')).toBeInTheDocument();
    expect(screen.getByText('Soda Ash Dense - GHCL')).toBeInTheDocument();
    expect(screen.getByText(/11100 \(Direct Chemicals\)/i)).toBeInTheDocument();
    expect(screen.getByText('Alkali Chemicals')).toBeInTheDocument();
    expect(screen.getByText(/₹58.1170 Cr \(6 txns\)/i)).toBeInTheDocument();

    // Awaits mapping data fetch
    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.module3.mappingReview.alertPendingApproval)).toBeInTheDocument();
    });
  });

  it('shows candidate PCBI series supported by master catalogue for benchmarkable items', async () => {
    vi.spyOn(pcbiApiClient, 'getMaterialMappings').mockResolvedValueOnce({
      success: true,
      mappings: []
    });

    render(
      <PCBIMasterMappingReviewModal
        isOpen={true}
        requirement={mockSodaAshItem}
        assessmentId="AIC-2026-0002"
        customerId="CUST-2026-0002"
        customerName="Borosil Ltd"
        onClose={vi.fn()}
        onReturnToUpload={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('AMAI Domestic Dense Soda Ash Index (Ex-Gujarat)')).toBeInTheDocument();
    });

    expect(screen.getByText('Chemical Weekly Domestic Soda Ash Spot Price')).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.module3.mappingReview.tagDirectMatch)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.module3.mappingReview.tagProxyMatch)).toBeInTheDocument();

    // Unrelated series like Ferro Moly or Base Oils are NEVER present
    expect(screen.queryByText(/Ferro Moly/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Base Oils/i)).not.toBeInTheDocument();
  });

  it('displays non-benchmarkable state and disables candidate options for engineered items (STTV2062)', async () => {
    vi.spyOn(pcbiApiClient, 'getMaterialMappings').mockResolvedValueOnce({
      success: true,
      mappings: []
    });

    render(
      <PCBIMasterMappingReviewModal
        isOpen={true}
        requirement={mockRefractoryItem}
        assessmentId="AIC-2026-0002"
        customerId="CUST-2026-0002"
        customerName="Borosil Ltd"
        onClose={vi.fn()}
        onReturnToUpload={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.module3.mappingReview.lblNoCandidates)).toBeInTheDocument();
    });

    expect(screen.getByText(UI_STRINGS.module3.mappingReview.tagNoBenchmark)).toBeInTheDocument();
  });

  it('allows proposing a candidate mapping and handles submission', async () => {
    vi.spyOn(pcbiApiClient, 'getMaterialMappings').mockResolvedValueOnce({
      success: true,
      mappings: []
    });

    const proposeSpy = vi.spyOn(pcbiApiClient, 'proposeMaterialMapping').mockResolvedValueOnce({
      success: true,
      mapping: {
        ...mockMappingRecord,
        mappingStatus: 'MAPPED_PENDING_APPROVAL',
        approvalStatus: 'PENDING'
      }
    });

    render(
      <PCBIMasterMappingReviewModal
        isOpen={true}
        requirement={mockSodaAshItem}
        assessmentId="AIC-2026-0002"
        customerId="CUST-2026-0002"
        customerName="Borosil Ltd"
        onClose={vi.fn()}
        onReturnToUpload={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.module3.mappingReview.btnProposeMapping)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(UI_STRINGS.module3.mappingReview.btnProposeMapping));

    await waitFor(() => {
      expect(proposeSpy).toHaveBeenCalled();
    });
  });

  it('enforces that proposed mappings require approval before becoming approved', async () => {
    vi.spyOn(pcbiApiClient, 'getMaterialMappings').mockResolvedValueOnce({
      success: true,
      mappings: [mockMappingRecord]
    });

    const updateApprovalSpy = vi.spyOn(pcbiApiClient, 'updateMappingApproval').mockResolvedValueOnce({
      success: true,
      mapping: {
        ...mockMappingRecord,
        mappingStatus: 'MAPPED_APPROVED',
        approvalStatus: 'APPROVED'
      }
    });

    const onApprovedMock = vi.fn();

    render(
      <PCBIMasterMappingReviewModal
        isOpen={true}
        requirement={mockSodaAshItem}
        assessmentId="AIC-2026-0002"
        customerId="CUST-2026-0002"
        customerName="Borosil Ltd"
        onClose={vi.fn()}
        onReturnToUpload={vi.fn()}
        onMappingApproved={onApprovedMock}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.module3.mappingReview.btnApproveMapping)).toBeInTheDocument();
    });

    // Approve Mapping
    fireEvent.click(screen.getByText(UI_STRINGS.module3.mappingReview.btnApproveMapping));

    await waitFor(() => {
      expect(updateApprovalSpy).toHaveBeenCalledWith(
        mockMappingRecord.id,
        'APPROVED',
        expect.any(String),
        expect.any(String)
      );
      expect(onApprovedMock).toHaveBeenCalled();
    });
  });

  it('calls onReturnToUpload when Return to Upload Workflow is clicked', async () => {
    vi.spyOn(pcbiApiClient, 'getMaterialMappings').mockResolvedValueOnce({
      success: true,
      mappings: [
        {
          ...mockMappingRecord,
          mappingStatus: 'MAPPED_APPROVED',
          approvalStatus: 'APPROVED'
        }
      ]
    });

    const onReturnMock = vi.fn();

    render(
      <PCBIMasterMappingReviewModal
        isOpen={true}
        requirement={mockSodaAshItem}
        assessmentId="AIC-2026-0002"
        customerId="CUST-2026-0002"
        customerName="Borosil Ltd"
        onClose={vi.fn()}
        onReturnToUpload={onReturnMock}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.module3.mappingReview.btnReturnToUpload)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(UI_STRINGS.module3.mappingReview.btnReturnToUpload));

    expect(onReturnMock).toHaveBeenCalledWith(
      expect.objectContaining({
        materialCode: '100SA02G',
        gapStatus: 'BENCHMARK DEFINED — OBSERVATIONS MISSING',
        pcbiSeriesId: 'PCBI-IND-CHM-SDA-001'
      })
    );
  });

  it('displays error message when mapping API fails', async () => {
    vi.spyOn(pcbiApiClient, 'getMaterialMappings').mockRejectedValueOnce(new Error('Network failure'));

    render(
      <PCBIMasterMappingReviewModal
        isOpen={true}
        requirement={mockSodaAshItem}
        onClose={vi.fn()}
        onReturnToUpload={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Failed to load authoritative mapping record/i)).toBeInTheDocument();
    });
  });
});
