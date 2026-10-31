import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CommodityPCBIUploadWorkflowModal } from '../../../src/components/admin/pcbi/CommodityPCBIUploadWorkflowModal';
import { pcbiCommodityDataLabApi } from '../../../src/utils/pcbiCommodityDataLabApi';
import type { CommodityResearchQueueRow } from '../../../src/types/pcbiCommodityDataLab';
import { UI_STRINGS } from '../../../src/constants/uiStrings';

vi.mock('../../../src/utils/pcbiCommodityDataLabApi', () => ({
  pcbiCommodityDataLabApi: {
    approveCommodityData: vi.fn(),
    uploadCommoditySource: vi.fn(),
    getCommodityWorkspace: vi.fn()
  }
}));
vi.mock('../../../src/utils/pcbiSourceFile', () => ({ encodePCBIFileBase64: vi.fn().mockResolvedValue('c291cmNl') }));

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
    priorityScore: 100,
    priorityReason: 'RANKED_BY_CUSTOMER_SPEND',
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

  it('requires an actual evidence file and provenance before extraction can continue', async () => {
    render(
      <CommodityPCBIUploadWorkflowModal
        isOpen={true}
        initialCommodity={mockCommodity}
        onClose={vi.fn()}
      />
    );

    // Reach the source staging step without supplying a mock file.
    for (let targetStep = 2; targetStep <= 4; targetStep++) {
      fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    }
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    expect(await screen.findByText(UI_STRINGS.pcbiCommodityDataLab.uploadWorkflow.evidenceFileRequired)).toBeInTheDocument();
    expect(screen.getByText('Step 4 of 10')).toBeInTheDocument();
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

    vi.mocked(pcbiCommodityDataLabApi.uploadCommoditySource).mockResolvedValueOnce({
      success: true,
      source: { sourceId: 'SRC-1', documentName: 'source.csv', extractionStatus: 'EXTRACTED', validationStatus: 'VALIDATED', checksum: 'abc', extractedObservationsCount: 1 } as any,
      banner: 'SOURCE_STAGED', message: 'Staged'
    });
    vi.mocked(pcbiCommodityDataLabApi.getCommodityWorkspace).mockResolvedValueOnce({
      success: true,
      workspace: { validationSummary: { validObservations: 1, criticalErrorsCount: 0 }, overview: { availableHistory: '2026-10-01' }, extractedObservations: [], methodologyDetails: { status: 'PENDING' } } as any
    });

    // Navigate through a staged source.
    for (let targetStep = 2; targetStep <= 3; targetStep++) {
      fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    }
    fireEvent.change(document.getElementById('source-file-input') as HTMLInputElement, {
      target: { files: [new File(['week_start,index_value\n2026-10-01,105'], 'source.csv', { type: 'text/csv' })] }
    });
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    const sourceInputs = screen.getAllByRole('textbox');
    fireEvent.change(sourceInputs[0], { target: { value: 'Steel index' } });
    fireEvent.change(sourceInputs[1], { target: { value: 'Market publisher' } });
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    await screen.findByText('Step 5 of 10');
    for (let targetStep = 6; targetStep <= 9; targetStep++) {
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

    vi.mocked(pcbiCommodityDataLabApi.uploadCommoditySource).mockResolvedValueOnce({
      success: true,
      source: { sourceId: 'SRC-2', documentName: 'source.csv', extractionStatus: 'EXTRACTED', validationStatus: 'VALIDATED', checksum: 'abc', extractedObservationsCount: 1 } as any,
      banner: 'SOURCE_STAGED', message: 'Staged'
    });
    vi.mocked(pcbiCommodityDataLabApi.getCommodityWorkspace).mockResolvedValueOnce({
      success: true,
      workspace: { validationSummary: { validObservations: 1, criticalErrorsCount: 0 }, overview: { availableHistory: '2026-10-01' }, extractedObservations: [], methodologyDetails: { status: 'PENDING' } } as any
    });
    for (let targetStep = 2; targetStep <= 3; targetStep++) fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    fireEvent.change(document.getElementById('source-file-input') as HTMLInputElement, {
      target: { files: [new File(['source'], 'source.csv', { type: 'text/csv' })] }
    });
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    const sourceInputs = screen.getAllByRole('textbox');
    fireEvent.change(sourceInputs[0], { target: { value: 'Source name' } });
    fireEvent.change(sourceInputs[1], { target: { value: 'Publisher' } });
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    await screen.findByText('Step 5 of 10');
    for (let targetStep = 6; targetStep <= 10; targetStep++) fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));

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

  it('handles file selection and source provenance before allowing later review steps', async () => {
    render(
      <CommodityPCBIUploadWorkflowModal
        isOpen={true}
        initialCommodity={mockCommodity}
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

    vi.mocked(pcbiCommodityDataLabApi.uploadCommoditySource).mockResolvedValueOnce({
      success: true,
      source: { sourceId: 'SRC-3', documentName: 'source_data.csv', extractionStatus: 'EXTRACTED', validationStatus: 'VALIDATED', checksum: 'abc', extractedObservationsCount: 1 } as any,
      banner: 'SOURCE_STAGED', message: 'Staged'
    });
    vi.mocked(pcbiCommodityDataLabApi.getCommodityWorkspace).mockResolvedValueOnce({
      success: true,
      workspace: { validationSummary: { validObservations: 1, criticalErrorsCount: 0 }, overview: { availableHistory: '2026-10-01' }, extractedObservations: [], methodologyDetails: { status: 'PENDING' } } as any
    });
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    await screen.findByText('Step 5 of 10');
    // Step to Step 9
    for (let s = 6; s <= 9; s++) {
      fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    }
    expect(screen.getByText('Step 9 of 10')).toBeInTheDocument();

    // Fill Step 9 comment
    const commentInput = screen.getByPlaceholderText(/Provide formal administrative audit reasoning/i);
    fireEvent.change(commentInput, { target: { value: 'Verified against secondary metallurgical gazette.' } });
    expect(commentInput).toHaveValue('Verified against secondary metallurgical gazette.');
  });

  it('shows D1 field fallbacks throughout review and allows activation without a returned version id', async () => {
    const handleClose = vi.fn();
    const handleComplete = vi.fn();
    vi.mocked(pcbiCommodityDataLabApi.uploadCommoditySource).mockResolvedValueOnce({
      success: true,
      source: {} as any,
      banner: 'SOURCE_STAGED',
      message: 'Staged'
    } as any);
    vi.mocked(pcbiCommodityDataLabApi.getCommodityWorkspace).mockResolvedValueOnce({
      success: true,
      workspace: undefined
    } as any);
    vi.mocked(pcbiCommodityDataLabApi.approveCommodityData).mockResolvedValueOnce({
      success: true,
      result: {}
    } as any);

    render(
      <CommodityPCBIUploadWorkflowModal
        isOpen={true}
        initialCommodity={mockCommodity}
        onClose={handleClose}
        onComplete={handleComplete}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    fireEvent.change(document.getElementById('source-file-input') as HTMLInputElement, {
      target: { files: [new File(['source'], 'fallback.csv', { type: 'text/csv' })] }
    });
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    const sourceInputs = screen.getAllByRole('textbox');
    fireEvent.change(sourceInputs[0], { target: { value: 'Source name' } });
    fireEvent.change(sourceInputs[1], { target: { value: 'Publisher' } });
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));

    expect(await screen.findByText('Step 5 of 10')).toBeInTheDocument();
    const workflowStrings = UI_STRINGS.pcbiCommodityDataLab.uploadWorkflow;
    expect(screen.getByText(workflowStrings.noStagedSource)).toBeInTheDocument();
    expect(screen.getByText(`${workflowStrings.extractionStatusLabel} ${workflowStrings.pendingExtractionStatus}`)).toBeInTheDocument();
    expect(screen.getByText(workflowStrings.savedObservationCount(0))).toBeInTheDocument();
    expect(screen.getByText(workflowStrings.sourceRowsNeedReview)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    expect(screen.getByText(workflowStrings.sourceValidationLabel)).toBeInTheDocument();
    expect(screen.getByText(workflowStrings.pendingSourceValidationStatus)).toBeInTheDocument();
    expect(screen.getByText(workflowStrings.verifiedObservationsLabel)).toBeInTheDocument();
    expect(screen.getAllByText(workflowStrings.verifiedObservationCount(0))).toHaveLength(2);
    expect(screen.getByText(workflowStrings.observationsNeedingReviewLabel)).toBeInTheDocument();
    expect(screen.getAllByText(workflowStrings.observationReviewCount(0))).toHaveLength(2);
    expect(screen.getByText(workflowStrings.dateCoverageLabel)).toBeInTheDocument();
    expect(screen.getByText(workflowStrings.dateCoverageUnavailable)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    expect(screen.getByText(workflowStrings.noObservationsAvailable)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    expect(screen.getByText((_, element) =>
      element?.tagName === 'P' && element.textContent === `${workflowStrings.sourceIdentityCheckLabel} ${workflowStrings.sourceIdentityCheckNotRun}`
    )).toBeInTheDocument();
    expect(screen.getByText((_, element) =>
      element?.tagName === 'P' && element.textContent === `${workflowStrings.methodologyReviewLabel} ${workflowStrings.pendingMethodologyReview}`
    )).toBeInTheDocument();
    expect(screen.getByText((_, element) =>
      element?.tagName === 'P' && element.textContent === `${workflowStrings.checksumLabel} ${workflowStrings.checksumUnavailable}`
    )).toBeInTheDocument();

    for (let step = 9; step <= 10; step += 1) {
      fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    }
    fireEvent.click(screen.getByRole('button', { name: 'Execute Activation' }));

    await waitFor(() => {
      expect(handleComplete).toHaveBeenCalledWith({
        commodityId: 'COM-MET-FMO',
        pcbiId: 'PCBI-FEMO-65-001',
        versionId: ''
      });
      expect(handleClose).toHaveBeenCalled();
    });
  });

  it('does not stage a file until both source name and publisher are provided', async () => {
    render(
      <CommodityPCBIUploadWorkflowModal
        isOpen={true}
        initialCommodity={mockCommodity}
        onClose={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    fireEvent.change(document.getElementById('source-file-input') as HTMLInputElement, {
      target: { files: [new File(['source'], 'metadata.csv', { type: 'text/csv' })] }
    });
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: 'Source name' } });
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));

    expect(await screen.findByText(UI_STRINGS.pcbiCommodityDataLab.uploadWorkflow.sourceMetadataRequired)).toBeInTheDocument();
    expect(pcbiCommodityDataLabApi.uploadCommoditySource).not.toHaveBeenCalled();
  });

  it('shows a non-Error staging rejection and keeps the workflow at source identification', async () => {
    vi.mocked(pcbiCommodityDataLabApi.uploadCommoditySource).mockRejectedValueOnce('D1 rejected the source upload');
    render(
      <CommodityPCBIUploadWorkflowModal
        isOpen={true}
        initialCommodity={mockCommodity}
        onClose={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    fireEvent.change(document.getElementById('source-file-input') as HTMLInputElement, {
      target: { files: [new File(['source'], 'failed.csv', { type: 'text/csv' })] }
    });
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    const sourceInputs = screen.getAllByRole('textbox');
    fireEvent.change(sourceInputs[0], { target: { value: 'Source name' } });
    fireEvent.change(sourceInputs[1], { target: { value: 'Publisher' } });
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));

    expect(await screen.findByText('D1 rejected the source upload')).toBeInTheDocument();
    expect(screen.getByText('Step 4 of 10')).toBeInTheDocument();
  });

  it('blocks activation when a successful D1 upload response omits its staged source', async () => {
    vi.mocked(pcbiCommodityDataLabApi.uploadCommoditySource).mockResolvedValueOnce({
      success: true,
      source: undefined
    } as any);
    vi.mocked(pcbiCommodityDataLabApi.getCommodityWorkspace).mockResolvedValueOnce({
      success: true,
      workspace: undefined
    } as any);
    const handleClose = vi.fn();
    render(
      <CommodityPCBIUploadWorkflowModal
        isOpen={true}
        initialCommodity={mockCommodity}
        onClose={handleClose}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    fireEvent.change(document.getElementById('source-file-input') as HTMLInputElement, {
      target: { files: [new File(['source'], 'missing-source.csv', { type: 'text/csv' })] }
    });
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    const sourceInputs = screen.getAllByRole('textbox');
    fireEvent.change(sourceInputs[0], { target: { value: 'Source name' } });
    fireEvent.change(sourceInputs[1], { target: { value: 'Publisher' } });
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    expect(await screen.findByText('Step 5 of 10')).toBeInTheDocument();
    for (let step = 6; step <= 10; step += 1) {
      fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    }
    fireEvent.click(screen.getByRole('button', { name: 'Execute Activation' }));

    expect(await screen.findByText(UI_STRINGS.pcbiCommodityDataLab.uploadWorkflow.sourceApprovalRequiresStagedEvidence)).toBeInTheDocument();
    expect(pcbiCommodityDataLabApi.approveCommodityData).not.toHaveBeenCalled();
    expect(handleClose).not.toHaveBeenCalled();
  });
});

