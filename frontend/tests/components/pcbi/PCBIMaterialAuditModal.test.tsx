import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PCBIMaterialAuditModal } from '../../../src/components/pcbi/PCBIMaterialAuditModal';
import type { PCBIMissingIndexGapItem } from '../../../src/types/module3GapList';
import { UI_STRINGS } from '../../../src/constants';

const mockItem: PCBIMissingIndexGapItem = {
  id: 'GAP-REQ-001',
  materialCode: '100SSW13FG-L',
  materialDescription: 'SILICA SAND (L) — Primary Solar Glass Grade',
  commodityClassification: 'Industrial Minerals & Clays',
  unspscCode: '11101504',
  existingGradeSpecification: 'High Purity Float Grade SiO2 > 99.5%, Fe2O3 < 0.015%',
  customerSpendCr: 36.684,
  customerSpendInr: 366840000,
  transactionCount: 28,
  spendSharePct: 6.59,
  pcbiSeriesId: 'PCBI-IND-MIN-SLS-001',
  benchmarkSeriesName: 'Indian Bureau of Mines (IBM) Silica Sand Mineral Statistics',
  benchmarkPublisherSource: 'Indian Bureau of Mines (IBM) / Ministry of Mines',
  sourceStatus: 'Source Identified — Data Not Acquired',
  observationCoverage: 'Historic Only (No 2026 data)',
  latestObservationDate: '2025-11-30',
  gapStatus: 'MAPPING / SPECIFICATION REVIEW REQUIRED',
  gapReason: 'Customer purchases high-purity float grade sand while available index is bulk mining grade.',
  nextActionRequired: 'Review specification alignment with PCBI Category Manager.'
};

const mockUnmappedItem: PCBIMissingIndexGapItem = {
  id: 'GAP-REQ-002',
  materialCode: 'STTV2062',
  materialDescription: 'Cumirex Super Refractory tiles',
  commodityClassification: 'Refractory & High-Temp Ceramics',
  unspscCode: '30102604',
  existingGradeSpecification: 'Fused Alumina-Mullite sintered block, 1850 deg C rating',
  customerSpendCr: 12.4501,
  customerSpendInr: 124501000,
  transactionCount: 6,
  spendSharePct: 2.24,
  pcbiSeriesId: null,
  benchmarkSeriesName: null,
  benchmarkPublisherSource: 'Custom Engineered (No Public Spot)',
  sourceStatus: 'Unmapped',
  observationCoverage: 'None',
  latestObservationDate: null,
  gapStatus: 'NO SUITABLE BENCHMARK IDENTIFIED',
  gapReason: 'Proprietary engineered ceramic formula without standardized public commodity benchmark.',
  nextActionRequired: 'Excluded from PCBI calculations (Zero Synthetic Variance Rule).'
};

describe('PCBIMaterialAuditModal Component Suite', () => {
  const strings = UI_STRINGS.module3.gapList;

  it('renders nothing when isOpen is false or item is null', () => {
    const { rerender, container } = render(
      <PCBIMaterialAuditModal
        isOpen={false}
        item={mockItem}
        onClose={vi.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();

    rerender(
      <PCBIMaterialAuditModal
        isOpen={true}
        item={null}
        onClose={vi.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders all required forensic audit attributes for mapped item', () => {
    render(
      <PCBIMaterialAuditModal
        isOpen={true}
        item={mockItem}
        onClose={vi.fn()}
      />
    );

    // Header & identifiers
    expect(screen.getByText(new RegExp(strings.drillDownTitle, 'i'))).toBeInTheDocument();
    expect(screen.getByText(mockItem.materialCode)).toBeInTheDocument();
    expect(screen.getByText(`UNSPSC: ${mockItem.unspscCode}`)).toBeInTheDocument();

    // Classification & Specification
    expect(screen.getByText(mockItem.commodityClassification)).toBeInTheDocument();
    expect(screen.getByText(mockItem.existingGradeSpecification)).toBeInTheDocument();

    // Spend & Transactions
    expect(screen.getByText(/₹36.6840/i)).toBeInTheDocument();
    expect(screen.getByText(/28 transactions/i)).toBeInTheDocument();

    // PCBI Series
    expect(screen.getByText(mockItem.pcbiSeriesId!)).toBeInTheDocument();
    expect(screen.getByText(mockItem.benchmarkSeriesName!)).toBeInTheDocument();

    // Source & Coverage
    expect(screen.getByText(mockItem.benchmarkPublisherSource)).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes(mockItem.observationCoverage))).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes(mockItem.latestObservationDate!))).toBeInTheDocument();

    // Gap Status & Reason
    expect(screen.getByText(mockItem.gapStatus)).toBeInTheDocument();
    expect(screen.getByText(mockItem.gapReason)).toBeInTheDocument();

    // Recommended Action
    expect(screen.getByText(mockItem.nextActionRequired)).toBeInTheDocument();
  });

  it('renders unmapped indicator when pcbiSeriesId is null', () => {
    render(
      <PCBIMaterialAuditModal
        isOpen={true}
        item={mockUnmappedItem}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText(/UNMAPPED — NO APPROVED PCBI SERIES/i)).toBeInTheDocument();
    expect(screen.getByText(mockUnmappedItem.materialCode)).toBeInTheDocument();
    expect(screen.getByText(mockUnmappedItem.gapStatus)).toBeInTheDocument();
  });

  it('handles Upload Benchmark action and closes modal', () => {
    const onUploadMock = vi.fn();
    const onCloseMock = vi.fn();

    render(
      <PCBIMaterialAuditModal
        isOpen={true}
        item={mockItem}
        onClose={onCloseMock}
        onUploadBenchmark={onUploadMock}
      />
    );

    const uploadBtn = screen.getByText(strings.btnUploadRequirementBenchmark);
    fireEvent.click(uploadBtn);

    expect(onUploadMock).toHaveBeenCalledWith(mockItem);
    expect(onCloseMock).toHaveBeenCalled();
  });

  it('handles Route for Mapping Review action and closes modal', () => {
    const onRouteMock = vi.fn();
    const onCloseMock = vi.fn();

    render(
      <PCBIMaterialAuditModal
        isOpen={true}
        item={mockItem}
        onClose={onCloseMock}
        onNavigateToMappingReview={onRouteMock}
      />
    );

    const routeBtn = screen.getByText(strings.auditBtnRouteMapping);
    fireEvent.click(routeBtn);

    expect(onRouteMock).toHaveBeenCalledWith(mockItem.materialCode);
    expect(onCloseMock).toHaveBeenCalled();
  });

  it('closes on Close button and backdrop click', () => {
    const onCloseMock = vi.fn();

    render(
      <PCBIMaterialAuditModal
        isOpen={true}
        item={mockItem}
        onClose={onCloseMock}
      />
    );

    // Click footer close button
    fireEvent.click(screen.getByText(strings.auditBtnClose));
    expect(onCloseMock).toHaveBeenCalledTimes(1);

    // Click header X button
    fireEvent.click(screen.getByTitle(strings.drillDownClose));
    expect(onCloseMock).toHaveBeenCalledTimes(2);

    // Click backdrop (dialog root)
    fireEvent.click(screen.getByRole('dialog'));
    expect(onCloseMock).toHaveBeenCalledTimes(3);
  });

  it('closes when Escape key is pressed', () => {
    const onCloseMock = vi.fn();

    render(
      <PCBIMaterialAuditModal
        isOpen={true}
        item={mockItem}
        onClose={onCloseMock}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
});
