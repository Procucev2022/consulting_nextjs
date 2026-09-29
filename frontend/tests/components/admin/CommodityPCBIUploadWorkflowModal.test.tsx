import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CommodityPCBIUploadWorkflowModal } from '../../../src/components/admin/pcbi/CommodityPCBIUploadWorkflowModal';
import { pcbiCommodityDataLabApi } from '../../../src/utils/pcbiCommodityDataLabApi';
import type { CommodityResearchQueueRow } from '../../../src/types/pcbiCommodityDataLab';

vi.mock('../../../src/utils/pcbiCommodityDataLabApi', () => ({
  pcbiCommodityDataLabApi: {
    approveCommodityData: vi.fn()
  }
}));

describe('CommodityPCBIUploadWorkflowModal (Part E)', () => {
  const mockCommodity: CommodityResearchQueueRow = {
    commodity: 'Ferro Molybdenum 65%',
    commodityId: 'COM-MET-FMO',
    module2Classification: 'METALS_AND_ALLOYS',
    unspsc: '30102900',
    customerSpend: 12500000,
    customerSpendCr: '₹1.25 Cr',
    transactionCount: 65,
    pcbiId: 'PCBI-FEMO-65-001',
    seriesId: 'SER-IND-FEMO-65-M',
    currentStatus: 'PARTIAL_HISTORY',
    requiredHistory: '75 months (2020-04 to 2026-06)',
    availableHistory: '18 observations / 32 months',
    requiredFrequency: 'WEEKLY' as const,
    availableFrequency: 'MONTHLY' as const,
    sourceStatus: 'SOURCE_UNVERIFIED',
    methodologyStatus: 'METHODOLOGY_PENDING',
    priority: 'P1',
    researchStatus: 'IN_PROGRESS',
    lastUpdated: '2026-09-28',
    action: 'OPEN WORKSPACE'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <CommodityPCBIUploadWorkflowModal
        isOpen={false}
        initialCommodity={mockCommodity}
        onClose={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders Step 1 with full commodity exposure attributes', () => {
    render(
      <CommodityPCBIUploadWorkflowModal
        isOpen={true}
        initialCommodity={mockCommodity}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('GOVERNED 10-STEP COMMODITY PCBI PIPELINE')).toBeInTheDocument();
    expect(screen.getByText('Upload Commodity PCBI Source Data')).toBeInTheDocument();
    expect(screen.getByText('Step 1 of 10')).toBeInTheDocument();
    expect(screen.getByText('Step 1 — Commodity Context & Exposure Attributes')).toBeInTheDocument();
    expect(screen.getByText('Ferro Molybdenum 65%')).toBeInTheDocument();
    expect(screen.getByText('PCBI-FEMO-65-001')).toBeInTheDocument();
    expect(screen.getByText('₹1.25 Cr')).toBeInTheDocument();
  });

  it('steps forward and backward through the steps', () => {
    render(
      <CommodityPCBIUploadWorkflowModal
        isOpen={true}
        initialCommodity={mockCommodity}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /Previous/i })).toBeDisabled();

    // Step 1 -> Step 2
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    expect(screen.getByText('Step 2 of 10')).toBeInTheDocument();
    expect(screen.getByText(/Step 2 — PCBI Series Association & Specification Target/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Previous/i })).not.toBeDisabled();

    // Step 2 -> Step 3
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    expect(screen.getByText('Step 3 of 10')).toBeInTheDocument();
    expect(screen.getByText(/Step 3 — Upload Source File/i)).toBeInTheDocument();

    // Step 3 -> Step 4
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    expect(screen.getByText('Step 4 of 10')).toBeInTheDocument();
    expect(screen.getByText(/Step 4 — Source Provenance Identification/i)).toBeInTheDocument();

    // Test back button (Step 4 -> Step 3)
    fireEvent.click(screen.getByRole('button', { name: /Previous/i }));
    expect(screen.getByText('Step 3 of 10')).toBeInTheDocument();
    expect(screen.getByText(/Step 3 — Upload Source File/i)).toBeInTheDocument();
  });

  it('navigates to Step 7 and confirms zero production writes notice', () => {
    render(
      <CommodityPCBIUploadWorkflowModal
        isOpen={true}
        initialCommodity={mockCommodity}
        onClose={vi.fn()}
      />
    );

    // Step from 1 to 7
    for (let targetStep = 2; targetStep <= 7; targetStep++) {
      fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    }

    expect(screen.getByText('Step 7 of 10')).toBeInTheDocument();
    expect(screen.getByText(/Step 7 — PCBI Standardization Preview/i)).toBeInTheDocument();
  });

  it('reaches Step 9 and allows selecting approval actions, then executes activation on Step 10', async () => {
    vi.mocked(pcbiCommodityDataLabApi.approveCommodityData).mockResolvedValueOnce({
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

    const handleClose = vi.fn();
    const handleComplete = vi.fn();

    render(
      <CommodityPCBIUploadWorkflowModal
        isOpen={true}
        initialCommodity={mockCommodity}
        onClose={handleClose}
        onComplete={handleComplete}
      />
    );

    // Step from 1 to 9
    for (let targetStep = 2; targetStep <= 9; targetStep++) {
      fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    }

    expect(screen.getByText('Step 9 of 10')).toBeInTheDocument();
    expect(screen.getByText(/Step 9 — Formal Administrator Approval Gate/i)).toBeInTheDocument();

    // Toggle actions
    const rejectBtn = screen.getByRole('button', { name: 'REJECT' });
    fireEvent.click(rejectBtn);

    const correctionBtn = screen.getByRole('button', { name: 'REQUEST CORRECTION' });
    fireEvent.click(correctionBtn);

    const approveBtn = screen.getByRole('button', { name: 'APPROVE' });
    fireEvent.click(approveBtn);

    // Advance to step 10
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    expect(screen.getByText('Step 10 of 10')).toBeInTheDocument();
    expect(screen.getByText(/Step 10 — Production Activation & Customer Reprocessing/i)).toBeInTheDocument();

    // Execute Activation
    const activateBtn = screen.getByRole('button', { name: 'Execute Activation' });
    fireEvent.click(activateBtn);

    await waitFor(() => {
      expect(pcbiCommodityDataLabApi.approveCommodityData).toHaveBeenCalledWith({
        commodityId: 'COM-MET-FMO',
        pcbiId: 'PCBI-FEMO-65-001',
        approverName: 'Sriman Admin',
        comments: expect.any(String)
      });
      expect(handleComplete).toHaveBeenCalledWith({
        commodityId: 'COM-MET-FMO',
        pcbiId: 'PCBI-FEMO-65-001',
        versionId: 'V1.9'
      });
      expect(handleClose).toHaveBeenCalled();
    });
  });

  it('handles submission error gracefully and displays error message', async () => {
    vi.mocked(pcbiCommodityDataLabApi.approveCommodityData).mockRejectedValueOnce(
      new Error('Governance verification failed: checksum mismatch')
    );

    render(
      <CommodityPCBIUploadWorkflowModal
        isOpen={true}
        initialCommodity={mockCommodity}
        onClose={vi.fn()}
      />
    );

    // Advance to step 10
    for (let targetStep = 2; targetStep <= 10; targetStep++) {
      fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    }

    expect(screen.getByText('Step 10 of 10')).toBeInTheDocument();

    const activateBtn = screen.getByRole('button', { name: 'Execute Activation' });
    fireEvent.click(activateBtn);

    await waitFor(() => {
      expect(screen.getByText('Governance verification failed: checksum mismatch')).toBeInTheDocument();
    });
  });

  it('closes modal when clicking close X button', () => {
    const handleClose = vi.fn();
    render(
      <CommodityPCBIUploadWorkflowModal
        isOpen={true}
        initialCommodity={mockCommodity}
        onClose={handleClose}
      />
    );

    const closeBtn = screen.getAllByRole('button')[0];
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('handles file selection on Step 3 and editing source metadata on Step 4 and 9', () => {
    render(
      <CommodityPCBIUploadWorkflowModal
        isOpen={true}
        initialCommodity={null}
        onClose={vi.fn()}
      />
    );

    // Step 1 to Step 3
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    expect(screen.getByText('Step 3 of 10')).toBeInTheDocument();

    // Select file on Step 3
    const file = new File(['mock content'], 'source_data.csv', { type: 'text/csv' });
    const fileInput = document.getElementById('source-file-input') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });
    expect(screen.getByText('source_data.csv')).toBeInTheDocument();

    // Advance to Step 4
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    expect(screen.getByText('Step 4 of 10')).toBeInTheDocument();

    // Fill Step 4 form inputs
    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: 'Custom IBM Benchmark' } });
    fireEvent.change(inputs[1], { target: { value: 'Ministry of Mines' } });
    fireEvent.change(inputs[2], { target: { value: 'https://mines.gov.in/data' } });

    const comboboxes = screen.getAllByRole('combobox');
    fireEvent.change(comboboxes[0], { target: { value: 'CSV' } });

    // Step to Step 9
    for (let s = 5; s <= 9; s++) {
      fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    }
    expect(screen.getByText('Step 9 of 10')).toBeInTheDocument();

    // Fill Step 9 comment
    const commentInput = screen.getByPlaceholderText(/Provide formal administrative audit reasoning/i);
    fireEvent.change(commentInput, { target: { value: 'Verified against secondary metallurgical gazette.' } });
    expect(commentInput).toHaveValue('Verified against secondary metallurgical gazette.');
  });
});

