import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PCBISourceComparisonView } from '../../../src/components/admin/pcbi/PCBISourceComparisonView';
import type { CommodityResearchQueueRow, CommoditySourceEvidenceObject } from '../../../src/types/pcbiCommodityDataLab';

describe('PCBISourceComparisonView Component (Part H)', () => {
  const mockCommodity: CommodityResearchQueueRow = {
    commodity: 'Ferro Molybdenum 65%',
    commodityId: 'CMD-FEA-FEMO-65',
    module2Classification: 'Direct Raw Materials > Ferro Alloys',
    unspsc: '30102700',
    customerSpend: 184500000,
    customerSpendCr: '₹18.45 Cr',
    transactionCount: 342,
    pcbiId: 'PCBI-IND-FEA-FEMO-001',
    seriesId: 'IND-MUM-FEMO65-M',
    currentStatus: 'NO_HISTORY',
    requiredHistory: '2020-04 to 2026-03',
    availableHistory: 'None',
    requiredFrequency: 'MONTHLY' as const,
    availableFrequency: 'NONE' as const,
    sourceStatus: 'SOURCE_UNVERIFIED',
    methodologyStatus: 'METHODOLOGY_PENDING',
    priority: 'P1',
    researchStatus: 'NOT_STARTED',
    lastUpdated: '2026-09-28',
    action: 'OPEN WORKSPACE'
  };

  const mockSources: CommoditySourceEvidenceObject[] = [
    {
      sourceId: 'SRC-FEMO-01',
      sourceName: 'Indian Bureau of Mines (IBM) Monthly Bulletin',
      publisher: 'Indian Bureau of Mines',
      url: 'https://ibm.gov.in/femo-bulletin',
      documentName: 'IBM_Monthly_Mineral_Statistics_2020_2026.pdf',
      publicationDate: '2026-08-15',
      uploadDate: '2026-08-16',
      fileType: 'PDF' as const,
      checksum: 'sha256-a1b2c3d4e5f6',
      deliveryBasis: 'Ex-Works',
      frequency: 'MONTHLY' as const,
      unit: 'MT',
      currency: 'INR',
      geography: 'India',
      gradeSpecification: 'Ferro Molybdenum FeMo65 Grade A IS:1465',
      historicalCoverage: '2020-04 to 2026-07',
      extractionStatus: 'EXTRACTED' as const,
      validationStatus: 'VALIDATED' as const,
      methodologyStatus: 'METHODOLOGY_APPROVED' as const,
      approvalStatus: 'ADMIN_APPROVED' as const,
      extractedObservationsCount: 75
    },
    {
      sourceId: 'SRC-FEMO-02',
      sourceName: 'Steel & Alloy Market Daily',
      publisher: 'Alloy Daily News',
      url: 'https://alloydaily.com/femo',
      documentName: 'FeMo_Daily_Spot_2024.xlsx',
      publicationDate: '2026-09-01',
      uploadDate: '2026-09-02',
      fileType: 'XLSX' as const,
      checksum: 'sha256-f6e5d4c3b2a1',
      deliveryBasis: 'Delivered',
      frequency: 'WEEKLY' as const,
      unit: 'KG',
      currency: 'INR',
      geography: 'India',
      gradeSpecification: 'FeMo 60% standard',
      historicalCoverage: '2024-01 to 2026-08',
      extractionStatus: 'EXTRACTED' as const,
      validationStatus: 'PENDING' as const,
      methodologyStatus: 'PENDING' as const,
      approvalStatus: 'UNDER_REVIEW' as const,
      extractedObservationsCount: 40
    }
  ];

  it('renders commodity details and candidate sources in comparison matrix', () => {
    const handleClose = vi.fn();
    render(
      <PCBISourceComparisonView
        commodity={mockCommodity}
        sources={mockSources}
        onClose={handleClose}
      />
    );

    expect(screen.getByText('PCBI SOURCE COMPARISON MATRIX')).toBeInTheDocument();
    expect(screen.getByText('Ferro Molybdenum 65% — Multi-Source Evaluation')).toBeInTheDocument();
    expect(screen.getByText('Indian Bureau of Mines (IBM) Monthly Bulletin')).toBeInTheDocument();
    expect(screen.getByText('Steel & Alloy Market Daily')).toBeInTheDocument();
    expect(screen.getByText('PASSED')).toBeInTheDocument();
    expect(screen.getByText('PENDING')).toBeInTheDocument();

    const backBtn = screen.getByRole('button', { name: 'Back to Overview' });
    fireEvent.click(backBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('allows selecting primary source and triggers callback', () => {
    const handleSelectPrimary = vi.fn();
    render(
      <PCBISourceComparisonView
        commodity={mockCommodity}
        sources={mockSources}
        onSelectPrimarySource={handleSelectPrimary}
      />
    );

    const selectButtons = screen.getAllByRole('button', { name: /Select|Primary/i });
    expect(selectButtons.length).toBe(2);

    // Click the second source to select it
    fireEvent.click(selectButtons[1]);
    expect(handleSelectPrimary).toHaveBeenCalledWith('SRC-FEMO-02');
  });

  it('renders empty state when sources array is empty', () => {
    render(<PCBISourceComparisonView commodity={mockCommodity} sources={[]} />);
    expect(
      screen.getByText('No candidate sources currently registered for this commodity.')
    ).toBeInTheDocument();
  });
});
