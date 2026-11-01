import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { PCBIMissingIndexTable } from '../../../src/components/pcbi/PCBIMissingIndexTable';
import type { PCBIMissingIndexGapItem } from '../../../src/types/module3GapList';
import { UI_STRINGS } from '../../../src/constants';

const mockItems: PCBIMissingIndexGapItem[] = [
  {
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
  },
  {
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
  },
  {
    id: 'GAP-REQ-003',
    materialCode: '100SA02G',
    materialDescription: 'Soda Ash Dense - GHCL',
    commodityClassification: 'Direct Raw Materials (Inorganics)',
    unspscCode: '12142104',
    existingGradeSpecification: 'Disodium Carbonate (Na2CO3) Dense Grade purity >= 99.2%',
    customerSpendCr: 45.1205,
    customerSpendInr: 451205000,
    transactionCount: 42,
    spendSharePct: 8.11,
    pcbiSeriesId: 'PCBI-IND-ALK-SDA-001',
    benchmarkSeriesName: 'India Domestic Soda Ash Dense Ex-Works Benchmark Index',
    benchmarkPublisherSource: 'Alkali Manufacturers Association of India (AMAI)',
    sourceStatus: 'Source Identified — Data Not Acquired',
    observationCoverage: 'Missing 2026 Monthly Observations',
    latestObservationDate: '2025-12-31',
    gapStatus: 'SOURCE IDENTIFIED — DATA NOT ACQUIRED',
    gapReason: 'Benchmark series defined but 2026 observations pending subscription extraction.',
    nextActionRequired: 'Acquire official AMAI monthly bulletins for 2026.'
  }
];

describe('PCBIMissingIndexTable Component Suite — Popup & Row Audit', () => {
  const strings = UI_STRINGS.module3.gapList;

  it('renders an audit icon button on every material row', () => {
    render(<PCBIMissingIndexTable items={mockItems} />);

    // Check that every row has an audit icon button
    for (const item of mockItems) {
      const auditBtn = screen.getByTestId(`audit-icon-${item.materialCode}`);
      expect(auditBtn).toBeInTheDocument();
      expect(auditBtn).toHaveAttribute('title', strings.auditRowIconTitle(item.materialDescription));
    }
  });

  it('opens the audit popup when clicking the customer material name', () => {
    render(<PCBIMissingIndexTable items={mockItems} />);

    // Initially popup is not open
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Click material name button for 100SSW13FG-L
    const nameBtn = screen.getByTestId('material-name-btn-100SSW13FG-L');
    fireEvent.click(nameBtn);

    // Popup opens with correct material details
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText(new RegExp(`${strings.drillDownTitle}: SILICA SAND`, 'i'))).toBeInTheDocument();
    expect(within(dialog).getByText('High Purity Float Grade SiO2 > 99.5%, Fe2O3 < 0.015%')).toBeInTheDocument();
    expect(within(dialog).getByText(/₹36.6840/i)).toBeInTheDocument();
  });

  it('opens the audit popup when clicking the audit icon', () => {
    render(<PCBIMissingIndexTable items={mockItems} />);

    const auditBtn = screen.getByTestId('audit-icon-STTV2062');
    fireEvent.click(auditBtn);

    // Popup opens with STTV2062 details
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText(new RegExp(`${strings.drillDownTitle}: Cumirex Super Refractory tiles`, 'i'))).toBeInTheDocument();
    expect(within(dialog).getByText('Fused Alumina-Mullite sintered block, 1850 deg C rating')).toBeInTheDocument();
    expect(within(dialog).getByText(/₹12.4501/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/UNMAPPED — NO APPROVED PCBI SERIES/i)).toBeInTheDocument();
  });

  it('opens the audit popup when clicking anywhere on the row', () => {
    const onSelectMock = vi.fn();
    render(<PCBIMissingIndexTable items={mockItems} onSelectRequirement={onSelectMock} />);

    const row = screen.getByText('Soda Ash Dense - GHCL').closest('tr');
    expect(row).toBeInTheDocument();
    fireEvent.click(row!);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText(new RegExp(`${strings.drillDownTitle}: Soda Ash Dense - GHCL`, 'i'))).toBeInTheDocument();
    expect(onSelectMock).toHaveBeenCalledWith(mockItems[2]);
  });

  it('displays distinct, accurate details for different rows without stale data leakage', () => {
    render(<PCBIMissingIndexTable items={mockItems} />);

    // Open first item
    fireEvent.click(screen.getByTestId('material-name-btn-100SSW13FG-L'));
    const dialog1 = screen.getByRole('dialog');
    expect(within(dialog1).getByText(mockItems[0].materialCode)).toBeInTheDocument();
    expect(within(dialog1).queryByText(mockItems[1].materialCode)).not.toBeInTheDocument();

    // Close first item
    fireEvent.click(within(dialog1).getByText(strings.auditBtnClose));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Open second item
    fireEvent.click(screen.getByTestId('material-name-btn-STTV2062'));
    const dialog2 = screen.getByRole('dialog');
    expect(within(dialog2).getByText(mockItems[1].materialCode)).toBeInTheDocument();
    expect(within(dialog2).queryByText(mockItems[0].materialCode)).not.toBeInTheDocument();
  });

  it('preserves the selected requirement when triggering Upload or Route for Mapping Review', () => {
    const onUploadMock = vi.fn();
    const onMappingMock = vi.fn();

    render(
      <PCBIMissingIndexTable
        items={mockItems}
        onUploadBenchmark={onUploadMock}
        onNavigateToMappingReview={onMappingMock}
      />
    );

    // Open first item
    fireEvent.click(screen.getByTestId('material-name-btn-100SSW13FG-L'));

    // Click Upload
    fireEvent.click(screen.getByText(strings.btnUploadRequirementBenchmark));
    expect(onUploadMock).toHaveBeenCalledWith(mockItems[0]);

    // Open second item
    fireEvent.click(screen.getByTestId('material-name-btn-STTV2062'));

    // Click Route for Mapping Review
    fireEvent.click(screen.getByText(strings.auditBtnRouteMapping));
    expect(onMappingMock).toHaveBeenCalledWith('STTV2062');
  });

  it('closing the popup preserves table rows and does not affect table display', () => {
    render(<PCBIMissingIndexTable items={mockItems} />);

    expect(screen.getByText('Soda Ash Dense - GHCL')).toBeInTheDocument();

    // Open popup
    fireEvent.click(screen.getByTestId('audit-icon-100SA02G'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Close popup
    fireEvent.click(screen.getByText(strings.auditBtnClose));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // All table rows remain present
    expect(screen.getByText('SILICA SAND (L) — Primary Solar Glass Grade')).toBeInTheDocument();
    expect(screen.getByText('Cumirex Super Refractory tiles')).toBeInTheDocument();
    expect(screen.getByText('Soda Ash Dense - GHCL')).toBeInTheDocument();
  });

  it('supports keyboard accessibility via Escape key', () => {
    render(<PCBIMissingIndexTable items={mockItems} />);

    fireEvent.click(screen.getByTestId('material-name-btn-100SSW13FG-L'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders empty message when items array is empty', () => {
    render(<PCBIMissingIndexTable items={[]} />);
    expect(screen.getByText(strings.emptyMessage)).toBeInTheDocument();
  });
});
