import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PCBISourceLibraryView } from '../../../src/components/admin/pcbi/PCBISourceLibraryView';
import type { CommodityResearchQueueRow, CommoditySourceEvidenceObject } from '../../../src/types/pcbiCommodityDataLab';

describe('PCBISourceLibraryView Component (Part I)', () => {
  const mockQueue: CommodityResearchQueueRow[] = [
    {
      commodity: 'Ferro Molybdenum 65%',
      commodityId: 'COM-MET-FMO',
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
    }
  ];

  const mockSources: CommoditySourceEvidenceObject[] = [
    {
      sourceId: 'SRC-MET-FMO-01',
      sourceName: 'Indian Bureau of Mines (IBM) Monthly Bulletin',
      publisher: 'Indian Bureau of Mines',
      url: 'https://ibm.gov.in/femo',
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
      sourceId: 'SRC-MET-FMO-02',
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

  it('renders searchable source repository and domain categorization buttons', () => {
    const handleWorkspace = vi.fn();
    const handleUpload = vi.fn();

    render(
      <PCBISourceLibraryView
        sources={mockSources}
        queue={mockQueue}
        onOpenWorkspace={handleWorkspace}
        onSelectCommodityUpload={handleUpload}
      />
    );

    expect(screen.getByText('PCBI DATA LIBRARY — SOURCE REGISTRY')).toBeInTheDocument();
    expect(screen.getByText('Searchable Commodity Source Repository')).toBeInTheDocument();
    expect(screen.getByText('1. Source Data (Raw Publications)')).toBeInTheDocument();
    expect(screen.getByText('2. Standardized Data (Normalized)')).toBeInTheDocument();
    expect(screen.getByText('3. Active PCBI Series (Production)')).toBeInTheDocument();

    fireEvent.click(screen.getByText('1. Source Data (Raw Publications)'));
    fireEvent.click(screen.getByText('2. Standardized Data (Normalized)'));
    fireEvent.click(screen.getByText('3. Active PCBI Series (Production)'));
    fireEvent.click(screen.getByText('All Library Objects'));

    const uploadBtn = screen.getByRole('button', { name: 'Upload Commodity PCBI Source Data' });
    fireEvent.click(uploadBtn);
    expect(handleUpload).toHaveBeenCalledWith('COM-MET-FMO');
  });

  it('filters sources based on search term and publisher dropdown', () => {
    render(
      <PCBISourceLibraryView
        sources={mockSources}
        queue={mockQueue}
        onOpenWorkspace={vi.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Search source by ID, publisher/i);
    fireEvent.change(searchInput, { target: { value: 'IBM' } });

    expect(screen.getByText('Indian Bureau of Mines (IBM) Monthly Bulletin')).toBeInTheDocument();
    expect(screen.queryByText('Steel & Alloy Market Daily')).toBeNull();

    // Reset search and filter by publisher
    fireEvent.change(searchInput, { target: { value: '' } });
    const publisherSelect = screen.getByRole('combobox');
    fireEvent.change(publisherSelect, { target: { value: 'Alloy Daily News' } });

    expect(screen.queryByText('Indian Bureau of Mines (IBM) Monthly Bulletin')).toBeNull();
    expect(screen.getByText('Steel & Alloy Market Daily')).toBeInTheDocument();
  });

  it('navigates to workspace when clicking Open Workspace', () => {
    const handleWorkspace = vi.fn();
    render(
      <PCBISourceLibraryView
        sources={mockSources}
        queue={mockQueue}
        onOpenWorkspace={handleWorkspace}
      />
    );

    const publisherDropdown = screen.getByRole('combobox');
    fireEvent.change(publisherDropdown, { target: { value: 'Indian Bureau of Mines' } });
    expect(screen.getByText('Indian Bureau of Mines (IBM) Monthly Bulletin')).toBeInTheDocument();
    expect(screen.queryByText('Steel & Alloy Market Daily')).not.toBeInTheDocument();

    const openWorkspaceButtons = screen.getAllByRole('button', { name: /Open Workspace/i });
    fireEvent.click(openWorkspaceButtons[0]);
    expect(handleWorkspace).toHaveBeenCalled();
  });

  it('displays empty state when no sources match filters', () => {
    render(
      <PCBISourceLibraryView
        sources={mockSources}
        queue={mockQueue}
        onOpenWorkspace={vi.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Search source by ID, publisher/i);
    fireEvent.change(searchInput, { target: { value: 'NONEXISTENT_SOURCE' } });
    expect(screen.getByText('No source evidence objects matched your filter parameters.')).toBeInTheDocument();
  });

  it('handles Upload Commodity PCBI Source Data button and empty queue fallbacks', () => {
    const handleWorkspace = vi.fn();
    const handleUpload = vi.fn();

    // Render with queue and onSelectCommodityUpload
    const { unmount } = render(
      <PCBISourceLibraryView
        sources={mockSources}
        queue={mockQueue}
        onOpenWorkspace={handleWorkspace}
        onSelectCommodityUpload={handleUpload}
      />
    );

    const uploadBtn = screen.getByRole('button', { name: /Upload Commodity PCBI Source Data/i });
    fireEvent.click(uploadBtn);
    expect(handleUpload).toHaveBeenCalledWith('COM-MET-FMO');

    unmount();

    // Render with empty queue to test fallback values
    render(
      <PCBISourceLibraryView
        sources={mockSources}
        queue={[]}
        onOpenWorkspace={handleWorkspace}
        onSelectCommodityUpload={handleUpload}
      />
    );

    const uploadBtnFallback = screen.getByRole('button', { name: /Upload Commodity PCBI Source Data/i });
    fireEvent.click(uploadBtnFallback);
    expect(handleUpload).toHaveBeenCalledWith('COM-MET-FMO');

    const openWorkspaceBtnsFallback = screen.getAllByRole('button', { name: /Open Workspace/i });
    fireEvent.click(openWorkspaceBtnsFallback[0]);
    expect(handleWorkspace).toHaveBeenCalledWith('PCBI-FEMO-65-001');
  });
});

