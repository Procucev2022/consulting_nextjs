import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PCBICommodityDataLabView } from '../../../src/components/admin/pcbi/PCBICommodityDataLabView';
import { pcbiCommodityDataLabApi } from '../../../src/utils/pcbiCommodityDataLabApi';
import { UI_STRINGS } from '../../../src/constants';

describe('PCBICommodityDataLabView Unit Tests (Part C, D, F, I)', () => {
  const mockMetrics = {
    totalCommodities: 10,
    productionReadyCount: 3,
    partialHistoryCount: 2,
    noHistoryCount: 2,
    missingCount: 1,
    sourceUnverifiedCount: 6,
    methodologyPendingCount: 7,
    specificationMismatchCount: 1,
    frequencyMismatchCount: 1,
    highImpactGapsCount: 2,
    queueByPriority: {
      p1Critical: 2,
      p2High: 2,
      p3Medium: 3,
      p4Low: 3
    }
  };

  const mockQueue = [
    {
      commodity: 'Ferro Molybdenum 65%',
      commodityId: 'COM-MET-FMO',
      module2Classification: 'METALS_AND_ALLOYS',
      unspsc: '30102900',
      customerSpend: 12500000,
      customerSpendCr: '₹1.25 Cr',
      transactionCount: 65,
      txnCount: 65,
      pcbiId: 'PCBI-FEMO-65-001',
      seriesId: 'SER-IND-FEMO-65-M',
      currentStatus: 'PARTIAL_HISTORY',
      pcbiDefinitionStatus: 'AVAILABLE',
      pcbiDataStatus: 'PARTIAL_HISTORY',
      requiredHistory: '75 months (2020-04 to 2026-06)',
      availableHistory: '18 observations (Under Review)',
      requiredFrequency: 'WEEKLY' as const,
      availableFrequency: 'MONTHLY' as const,
      requiredUnit: 'MT',
      requiredCurrency: 'INR',
      requiredGeography: 'India',
      sourceStatus: 'SOURCE_UNVERIFIED',
      methodologyStatus: 'METHODOLOGY_PENDING',
      priority: 'P1 — Critical Coverage Gap',
      researchStatus: 'IN_PROGRESS',
      lastUpdated: '2026-09-28T18:00:00.000Z',
      action: 'OPEN WORKSPACE'
    },
    {
      commodity: 'Heavy Duty Slurry Pumps',
      commodityId: 'COM-EQP-SLP',
      module2Classification: 'INDUSTRIAL_MACHINERY',
      unspsc: '40151500',
      customerSpend: 10320000,
      customerSpendCr: '₹1.03 Cr',
      transactionCount: 28,
      txnCount: 28,
      pcbiId: 'PCBI-IND-EQP-SLP-001',
      seriesId: 'SER-IND-EQP-SLP-M',
      currentStatus: 'NO_HISTORY',
      pcbiDefinitionStatus: 'AVAILABLE',
      pcbiDataStatus: 'NO_HISTORY',
      requiredHistory: '75 months (2020-04 to 2026-06)',
      availableHistory: '0 months (None)',
      requiredFrequency: 'MONTHLY' as const,
      availableFrequency: 'NONE' as const,
      requiredUnit: 'PCS',
      requiredCurrency: 'INR',
      requiredGeography: 'India',
      sourceStatus: 'SOURCE_UNVERIFIED',
      methodologyStatus: 'METHODOLOGY_PENDING',
      priority: 'P1 — Critical Coverage Gap',
      researchStatus: 'QUEUED',
      lastUpdated: '2026-09-28T16:00:00.000Z',
      action: 'OPEN WORKSPACE'
    }
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(pcbiCommodityDataLabApi, 'getDashboard').mockResolvedValue({
      success: true,
      metrics: mockMetrics
    });
    vi.spyOn(pcbiCommodityDataLabApi, 'getQueue').mockResolvedValue({
      success: true,
      total: 2,
      queue: mockQueue as any
    });
    vi.spyOn(pcbiCommodityDataLabApi, 'getCommodityWorkspace').mockResolvedValue({
      success: true,
      workspace: {
        overview: mockQueue[0],
        sources: [],
        extractedObservations: [],
        methodologyDetails: { methodologyId: 'M1', title: 'T1', status: 'S1', conversionRule: 'C1', governanceNotes: 'G1' },
        validationSummary: { passed: false, totalObservations: 0, validObservations: 0, missingPeriods: [], criticalErrorsCount: 0 },
        approvalPackage: { isReadyForApproval: false, canWriteToCatalog: false, approvalGateStatus: 'LOCKED_PENDING_REVIEW' },
        activeTab: 'OVERVIEW'
      } as any
    });
  });

  it('renders breadcrumb, warning banner, page header, and dashboard metrics', async () => {
    render(<PCBICommodityDataLabView />);

    expect(screen.getByText('PCBI Data Library — Commodity Research Workspace')).toBeInTheDocument();
    expect(screen.getByText('PCBI DATA LIBRARY — COMMODITY SOURCE DATA')).toBeInTheDocument();
    expect(
      screen.getByText('Upload and manage historical market/reference data used to construct and maintain PCBI series.')
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.pcbiCommodityDataLab.researchDashboardTitle)).toBeInTheDocument();
      expect(screen.getByText('10 Total Commodities in Scope')).toBeInTheDocument();
    });

    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders all 9 sub-tabs and allows switching between them', async () => {
    render(<PCBICommodityDataLabView />);

    await waitFor(() => {
      expect(screen.getByText('Coverage Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Research Queue')).toBeInTheDocument();
      expect(screen.getByText('Commodity PCBI')).toBeInTheDocument();
      expect(screen.getByText('Source Library')).toBeInTheDocument();
      expect(screen.getByText('Upload PCBI Data')).toBeInTheDocument();
      expect(screen.getByText('Validation Queue')).toBeInTheDocument();
      expect(screen.getByText('Pending Approval')).toBeInTheDocument();
      expect(screen.getByText('Active PCBI Series')).toBeInTheDocument();
      expect(screen.getByText('Version History')).toBeInTheDocument();
    });

    // Click Source Library tab
    fireEvent.click(screen.getByText('Source Library'));
    expect(screen.getByText('PCBI DATA LIBRARY — SOURCE REGISTRY')).toBeInTheDocument();

    // Click Commodity PCBI tab
    fireEvent.click(screen.getByText('Commodity PCBI'));
    expect(screen.getByText('Select Commodity to Open Workspace')).toBeInTheDocument();

    // Click Validation Queue tab
    fireEvent.click(screen.getByText('Validation Queue'));
    expect(screen.getByText(/Displaying commodities with pending validations/i)).toBeInTheDocument();

    // Click Pending Approval tab
    fireEvent.click(screen.getByText('Pending Approval'));
    expect(screen.getByText(/Displaying commodities where source observations have been staged/i)).toBeInTheDocument();

    // Click Active PCBI Series tab
    fireEvent.click(screen.getByText('Active PCBI Series'));
    expect(screen.getByText(/Displaying active production-ready PCBI series/i)).toBeInTheDocument();

    // Click Version History tab
    fireEvent.click(screen.getByText('Version History'));
    expect(screen.getByText('PCBI Data Library — Promotion Audit Trail')).toBeInTheDocument();
  });

  it('opens 10-step upload workflow modal when clicking "Upload Commodity PCBI Source Data"', async () => {
    render(<PCBICommodityDataLabView />);

    await waitFor(() => {
      expect(screen.getByText('Ferro Molybdenum 65%')).toBeInTheDocument();
    });

    const uploadBtns = screen.getAllByRole('button', { name: /Upload Commodity PCBI Source Data/i });
    fireEvent.click(uploadBtns[0]);

    await waitFor(() => {
      expect(screen.getByText('GOVERNED 10-STEP COMMODITY PCBI PIPELINE')).toBeInTheDocument();
    });
  });

  it('opens workspace modal when clicking row or contextual action', async () => {
    render(<PCBICommodityDataLabView />);

    await waitFor(() => {
      expect(screen.getByText('Ferro Molybdenum 65%')).toBeInTheDocument();
    });

    // Click Research action button for Slurry Pumps
    const researchBtn = screen.getByRole('button', { name: /^Research$/i });
    fireEvent.click(researchBtn);

    await waitFor(() => {
      expect(screen.getByText('COMMODITY PCBI WORKSPACE')).toBeInTheDocument();
    });
  });

  it('refreshes data when clicking refresh button', async () => {
    render(<PCBICommodityDataLabView />);

    await waitFor(() => {
      expect(screen.getByText('Ferro Molybdenum 65%')).toBeInTheDocument();
    });

    const refreshBtn = screen.getByRole('button', { name: /Refresh/i });
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(pcbiCommodityDataLabApi.getDashboard).toHaveBeenCalledTimes(2);
      expect(pcbiCommodityDataLabApi.getQueue).toHaveBeenCalledTimes(2);
    });
  });

  it('handles API errors gracefully', async () => {
    vi.spyOn(pcbiCommodityDataLabApi, 'getDashboard').mockRejectedValueOnce(new Error('Network failure'));
    vi.spyOn(pcbiCommodityDataLabApi, 'getQueue').mockRejectedValueOnce(new Error('Queue failure'));

    render(<PCBICommodityDataLabView />);

    await waitFor(() => {
      expect(pcbiCommodityDataLabApi.getDashboard).toHaveBeenCalled();
    });
  });

  it('switches between all 9 Part C sub-tabs smoothly', async () => {
    render(<PCBICommodityDataLabView />);

    await waitFor(() => {
      expect(screen.getByText('Ferro Molybdenum 65%')).toBeInTheDocument();
    });

    // Sub-tab 1: Coverage Dashboard
    fireEvent.click(screen.getByRole('button', { name: 'Coverage Dashboard' }));
    expect(screen.getByText(UI_STRINGS.pcbiCommodityDataLab.researchDashboardTitle)).toBeInTheDocument();

    // Sub-tab 3: Commodity PCBI
    fireEvent.click(screen.getByRole('button', { name: 'Commodity PCBI' }));
    expect(screen.getByText('Ferro Molybdenum 65%')).toBeInTheDocument();

    // Sub-tab 4: Source Library
    fireEvent.click(screen.getByRole('button', { name: 'Source Library' }));
    expect(screen.getByText(/Searchable Commodity Source Repository/i)).toBeInTheDocument();

    // Sub-tab 5: Upload PCBI Data
    fireEvent.click(screen.getByRole('button', { name: 'Upload PCBI Data' }));
    expect(screen.getByText('GOVERNED 10-STEP COMMODITY PCBI PIPELINE')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Close upload modal'));

    // Sub-tab 6: Validation Queue
    fireEvent.click(screen.getByRole('button', { name: 'Validation Queue' }));
    expect(screen.getByText(/Displaying commodities with pending validations/i)).toBeInTheDocument();

    // Sub-tab 7: Pending Approval
    fireEvent.click(screen.getByRole('button', { name: 'Pending Approval' }));
    expect(screen.getByText(/Displaying commodities where source observations have been staged/i)).toBeInTheDocument();

    // Sub-tab 8: Active PCBI Series
    fireEvent.click(screen.getByRole('button', { name: 'Active PCBI Series' }));
    expect(screen.getByText(/Displaying active production-ready PCBI series/i)).toBeInTheDocument();

    // Sub-tab 9: Version History
    fireEvent.click(screen.getByRole('button', { name: 'Version History' }));
    expect(screen.getByText(/PCBI Data Library — Promotion Audit Trail/i)).toBeInTheDocument();

    // Return to Sub-tab 2: Research Queue
    fireEvent.click(screen.getByRole('button', { name: 'Research Queue' }));
    expect(screen.getByText('Ferro Molybdenum 65%')).toBeInTheDocument();
  });

  it('opens and closes workspace modal and upload workflow modal', async () => {
    render(<PCBICommodityDataLabView />);

    await waitFor(() => {
      expect(screen.getByText('Ferro Molybdenum 65%')).toBeInTheDocument();
    });

    // Open Workspace
    const researchBtn = screen.getByRole('button', { name: /^Research$/i });
    fireEvent.click(researchBtn);

    await waitFor(() => {
      expect(screen.getByText('COMMODITY PCBI WORKSPACE')).toBeInTheDocument();
    });

    // Close Workspace via aria-label
    const closeWorkspaceBtn = screen.getByLabelText('Close workspace modal');
    fireEvent.click(closeWorkspaceBtn);

    await waitFor(() => {
      expect(screen.queryByText('COMMODITY PCBI WORKSPACE')).not.toBeInTheDocument();
    });

    // Open Upload Workflow
    const uploadBtn = screen.getByRole('button', { name: /Upload Commodity PCBI Source Data/i });
    fireEvent.click(uploadBtn);

    await waitFor(() => {
      expect(screen.getByText('GOVERNED 10-STEP COMMODITY PCBI PIPELINE')).toBeInTheDocument();
    });

    // Close Upload Workflow Modal via aria-label
    const modalCloseBtn = screen.getByLabelText('Close upload modal');
    fireEvent.click(modalCloseBtn);

    await waitFor(() => {
      expect(screen.queryByText('GOVERNED 10-STEP COMMODITY PCBI PIPELINE')).not.toBeInTheDocument();
    });
  });

  it('triggers upload modal from Source Library tab and refreshes data on completion', async () => {
    vi.spyOn(pcbiCommodityDataLabApi, 'approveCommodityData').mockResolvedValueOnce({
      success: true,
      result: {
        success: true,
        commodityId: 'COM-MET-FMO',
        pcbiId: 'PCBI-FEMO-65-001',
        approvalStatus: 'ADMIN_APPROVED',
        catalogVersionCreated: true,
        catalogVersionId: 'V1.9',
        message: 'Approved'
      }
    } as any);

    render(<PCBICommodityDataLabView />);

    await waitFor(() => {
      expect(screen.getByText('Ferro Molybdenum 65%')).toBeInTheDocument();
    });

    // Go to Source Library tab
    fireEvent.click(screen.getByRole('button', { name: 'Source Library' }));
    expect(screen.getByText(/Searchable Commodity Source Repository/i)).toBeInTheDocument();

    // Click upload from within Source Library view
    const sourceUploadBtns = screen.getAllByRole('button', { name: /Upload Commodity PCBI Source Data/i });
    fireEvent.click(sourceUploadBtns[1] || sourceUploadBtns[0]);

    await waitFor(() => {
      expect(screen.getByText('GOVERNED 10-STEP COMMODITY PCBI PIPELINE')).toBeInTheDocument();
    });

    // Step to Step 10
    for (let i = 2; i <= 10; i++) {
      fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    }

    // Click Execute Activation
    const activateBtn = screen.getByRole('button', { name: 'Execute Activation' });
    fireEvent.click(activateBtn);

    await waitFor(() => {
      expect(pcbiCommodityDataLabApi.approveCommodityData).toHaveBeenCalled();
    });
  });
});


