import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  PCBICommodityResearchQueueTable,
  getQueueContextualAction
} from '../../../src/components/admin/pcbi/PCBICommodityResearchQueueTable';

describe('PCBICommodityResearchQueueTable Component (Part F & M)', () => {
  const mockQueue = [
    {
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
      priority: 'P1 - High Impact',
      researchStatus: 'NOT_STARTED',
      lastUpdated: '2026-09-28',
      action: 'OPEN WORKSPACE'
    },
    {
      commodity: 'Tungsten Carbide Inserts',
      commodityId: 'CMD-TOOL-TCI',
      module2Classification: 'Consumables > Cutting Tools',
      unspsc: '27112800',
      customerSpend: 45000000,
      customerSpendCr: '₹4.50 Cr',
      transactionCount: 120,
      pcbiId: 'PCBI-IND-TOOL-TCI-001',
      seriesId: 'IND-DEL-TCI-M',
      currentStatus: 'PARTIAL_HISTORY',
      requiredHistory: '2020-04 to 2026-03',
      availableHistory: '2022-01 to 2025-12',
      requiredFrequency: 'MONTHLY' as const,
      availableFrequency: 'MONTHLY' as const,
      sourceStatus: 'SOURCE_UNVERIFIED',
      methodologyStatus: 'APPROVED',
      priority: 'P2',
      researchStatus: 'IN_PROGRESS',
      lastUpdated: '2026-09-28',
      action: 'OPEN WORKSPACE'
    },
    {
      commodity: 'Hydraulic Oil ISO 68',
      commodityId: 'CMD-LUB-HYD68',
      module2Classification: 'Consumables > Lubricants',
      unspsc: '15121500',
      customerSpend: 15000000,
      customerSpendCr: '₹1.50 Cr',
      transactionCount: 85,
      pcbiId: 'PCBI-IND-LUB-HYD68-001',
      seriesId: 'IND-MAH-HYD68-M',
      currentStatus: 'SPECIFICATION_MISMATCH',
      requiredHistory: '2020-04 to 2026-03',
      availableHistory: '2021-01 to 2026-01',
      requiredFrequency: 'MONTHLY' as const,
      availableFrequency: 'MONTHLY' as const,
      sourceStatus: 'SOURCE_UNVERIFIED',
      methodologyStatus: 'METHODOLOGY_PENDING',
      priority: 'P4',
      researchStatus: 'IN_PROGRESS',
      lastUpdated: '2026-09-28',
      action: 'OPEN WORKSPACE'
    },
    {
      commodity: 'Custom Pump Impeller',
      commodityId: 'CMD-CUSTOM-IMP',
      module2Classification: 'Spares > Custom Fabricated',
      unspsc: '40151500',
      customerSpend: 8000000,
      customerSpendCr: '₹0.80 Cr',
      transactionCount: 12,
      pcbiId: 'PCBI-UNMAPPED',
      seriesId: 'NONE',
      currentStatus: 'MISSING',
      requiredHistory: 'None',
      availableHistory: 'None',
      requiredFrequency: 'MONTHLY' as const,
      availableFrequency: 'NONE' as const,
      sourceStatus: 'NONE',
      methodologyStatus: 'NONE',
      priority: 'P3',
      researchStatus: 'NOT_STARTED',
      lastUpdated: '2026-09-28',
      action: 'OPEN WORKSPACE'
    }
  ];

  it('correctly maps status to contextual action via getQueueContextualAction', () => {
    expect(getQueueContextualAction('NO_HISTORY')).toEqual({ label: 'Research', actionType: 'RESEARCH' });
    expect(getQueueContextualAction('PARTIAL_HISTORY')).toEqual({ label: 'Upload', actionType: 'UPLOAD' });
    expect(getQueueContextualAction('SOURCE_UNVERIFIED')).toEqual({ label: 'Verify', actionType: 'VERIFY' });
    expect(getQueueContextualAction('SPECIFICATION_MISMATCH')).toEqual({ label: 'Review', actionType: 'REVIEW' });
    expect(getQueueContextualAction('FREQUENCY_MISMATCH')).toEqual({ label: 'Review', actionType: 'REVIEW' });
    expect(getQueueContextualAction('METHODOLOGY_PENDING')).toEqual({ label: 'Review', actionType: 'REVIEW' });
    expect(getQueueContextualAction('MISSING')).toEqual({ label: 'Create Definition', actionType: 'CREATE_DEFINITION' });
    expect(getQueueContextualAction('PRODUCTION_READY')).toEqual({ label: 'Open Workspace', actionType: 'OPEN' });
  });

  it('renders research queue rows and triggers contextual actions', () => {
    const handleWorkspace = vi.fn();
    const handleUpload = vi.fn();

    render(
      <PCBICommodityResearchQueueTable
        queue={mockQueue}
        onOpenWorkspace={handleWorkspace}
        onUploadSource={handleUpload}
      />
    );

    expect(screen.getByText('Ferro Molybdenum 65%')).toBeInTheDocument();
    expect(screen.getByText('Tungsten Carbide Inserts')).toBeInTheDocument();
    expect(screen.getByText('Hydraulic Oil ISO 68')).toBeInTheDocument();
    expect(screen.getByText('Custom Pump Impeller')).toBeInTheDocument();

    // Check action buttons
    expect(screen.getByRole('button', { name: /Research/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Review/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Definition/i })).toBeInTheDocument();

    // Test clicking upload button for Tungsten Carbide
    const uploadButtons = screen.getAllByRole('button', { name: /Upload/i });
    fireEvent.click(uploadButtons[0]);
    expect(handleUpload).toHaveBeenCalled();

    // Test clicking row to open workspace
    fireEvent.click(screen.getByText('Ferro Molybdenum 65%'));
    expect(handleWorkspace).toHaveBeenCalledWith('PCBI-IND-FEA-FEMO-001');
  });

  it('filters rows by search term and status dropdown', () => {
    render(
      <PCBICommodityResearchQueueTable
        queue={mockQueue}
        onOpenWorkspace={vi.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Search by commodity name, PCBI ID, or UNSPSC.../i);
    fireEvent.change(searchInput, { target: { value: 'Ferro' } });

    expect(screen.getByText('Ferro Molybdenum 65%')).toBeInTheDocument();
    expect(screen.queryByText('Tungsten Carbide Inserts')).toBeNull();

    // Reset search and test status filter
    fireEvent.change(searchInput, { target: { value: '' } });
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'PARTIAL_HISTORY' } });

    expect(screen.queryByText('Ferro Molybdenum 65%')).toBeNull();
    expect(screen.getByText('Tungsten Carbide Inserts')).toBeInTheDocument();
  });

  it('renders empty message when no rows match', () => {
    render(
      <PCBICommodityResearchQueueTable
        queue={mockQueue}
        onOpenWorkspace={vi.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Search by commodity name, PCBI ID, or UNSPSC.../i);
    fireEvent.change(searchInput, { target: { value: 'UNMATCHED_SEARCH_TERM' } });

    expect(screen.getByText('No commodities match your current search and filter criteria.')).toBeInTheDocument();
  });
});
