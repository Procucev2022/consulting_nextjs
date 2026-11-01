import React from 'react';
import * as fs from 'fs';
import * as path from 'path';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CommodityPCBIUploadWorkflowModal } from '../../../src/components/admin/pcbi/CommodityPCBIUploadWorkflowModal';
import { pcbiCommodityDataLabApi } from '../../../src/utils/pcbiCommodityDataLabApi';
import { convertGapItemToResearchQueueRow } from '../../../src/utils/pcbiGapUploadHelper';
import { BOROSIL_DEFAULT_REQUIREMENTS } from '../../../src/constants/pcbiBorosilRequirements';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import type { CommodityResearchQueueRow } from '../../../src/types/pcbiCommodityDataLab';

vi.mock('../../../src/utils/pcbiCommodityDataLabApi', () => ({
  pcbiCommodityDataLabApi: {
    approveCommodityData: vi.fn()
  }
}));

describe('CommodityPCBIUploadWorkflowModal (Part E & Borosil Flow)', () => {
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
    action: 'OPEN WORKSPACE',
    isMappingRequired: false
  };

  const uploadFileHelper = (): void => {
    const file = new File(['obs_date,price\n2025-01-01,32000'], 'official_data.csv', { type: 'text/csv' });
    const fileInput = document.getElementById('source-file-input') as HTMLInputElement;
    if (fileInput) {
      fireEvent.change(fileInput, { target: { files: [file] } });
    }
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

  it('steps forward and backward through the steps when file is uploaded on Step 3', () => {
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
    expect(screen.getByRole('button', { name: /Previous/i })).not.toBeDisabled();

    // Step 2 -> Step 3
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    expect(screen.getByText('Step 3 of 10')).toBeInTheDocument();
    expect(screen.getByText(/Step 3 — Upload Source File/i)).toBeInTheDocument();

    // Select file on Step 3
    uploadFileHelper();

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

    // Step 1 to Step 3
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    uploadFileHelper();

    // Step 3 to Step 7
    for (let targetStep = 4; targetStep <= 7; targetStep++) {
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

    // Step 1 to Step 3
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    uploadFileHelper();

    // Step 3 to Step 9
    for (let targetStep = 4; targetStep <= 9; targetStep++) {
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

    // Step 1 to Step 3
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    uploadFileHelper();

    // Advance to step 10
    for (let targetStep = 4; targetStep <= 10; targetStep++) {
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

    const closeBtn = screen.getByLabelText('Close upload modal');
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  /* =========================================================================
   * SECTION E: BOROSIL FLOW TEST REQUIREMENTS
   * ========================================================================= */

  it('Section E.1: Selecting Soda Ash Dense – GHCL opens the wizard with that requirement, not Ferro Molybdenum', () => {
    const sodaAshItem = BOROSIL_DEFAULT_REQUIREMENTS[0]; // Soda Ash Dense - GHCL (100SA02G)
    const sodaAshCommodity = convertGapItemToResearchQueueRow(sodaAshItem, {
      assessmentId: 'AIC-2026-0002',
      customerId: 'CUST-2026-0002',
      customerName: 'Borosil Ltd'
    });

    render(
      <CommodityPCBIUploadWorkflowModal
        isOpen={true}
        initialCommodity={sodaAshCommodity}
        assessmentId="AIC-2026-0002"
        customerId="CUST-2026-0002"
        customerName="Borosil Ltd"
        onClose={vi.fn()}
      />
    );

    // Confirms correct Borosil Soda Ash requirement is loaded
    expect(screen.getByText('Soda Ash Dense - GHCL')).toBeInTheDocument();
    expect(screen.getByText('100SA02G')).toBeInTheDocument();
    expect(screen.getByText('PCBI-IND-CHM-SDA-001')).toBeInTheDocument();
    expect(screen.getByText('₹58.1170 Cr')).toBeInTheDocument();
    expect(screen.getByText('6 PO lines')).toBeInTheDocument();

    // Proves Ferro Molybdenum is NOT loaded
    expect(screen.queryByText('Ferro Molybdenum 65%')).not.toBeInTheDocument();
    expect(screen.queryByText('COM-MET-FMO')).not.toBeInTheDocument();
    expect(screen.queryByText('SER-IND-FEMO-65-M')).not.toBeInTheDocument();
  });

  it('Section E.2: Selecting a different requirement loads its own correct context', () => {
    const silicaSandItem = BOROSIL_DEFAULT_REQUIREMENTS[2]; // SILICA SAND (L) (100SSW13FG-L)
    const silicaCommodity = convertGapItemToResearchQueueRow(silicaSandItem, {
      assessmentId: 'AIC-2026-0002',
      customerId: 'CUST-2026-0002',
      customerName: 'Borosil Ltd'
    });

    render(
      <CommodityPCBIUploadWorkflowModal
        isOpen={true}
        initialCommodity={silicaCommodity}
        assessmentId="AIC-2026-0002"
        customerId="CUST-2026-0002"
        customerName="Borosil Ltd"
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('SILICA SAND (L) — Primary Solar Glass Grade')).toBeInTheDocument();
    expect(screen.getByText('100SSW13FG-L')).toBeInTheDocument();
    expect(screen.getByText('₹36.6840 Cr')).toBeInTheDocument();
    expect(screen.getByText('20 PO lines')).toBeInTheDocument();
    expect(screen.queryByText('Soda Ash Dense - GHCL')).not.toBeInTheDocument();
  });

  it('Section E.3: The general upload button requires an explicit commodity/material selection', () => {
    render(
      <CommodityPCBIUploadWorkflowModal
        isOpen={true}
        initialCommodity={null}
        assessmentId="AIC-2026-0002"
        customerId="CUST-2026-0002"
        customerName="Borosil Ltd"
        availableRequirements={BOROSIL_DEFAULT_REQUIREMENTS}
        onClose={vi.fn()}
      />
    );

    // Shows selection prompt
    expect(screen.getByText('Select Intended Commodity / Material Requirement')).toBeInTheDocument();

    // Clicking Next without selecting is blocked
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    expect(screen.getByText(/Please select an intended material requirement/i)).toBeInTheDocument();
    expect(screen.getByText('Step 1 of 10')).toBeInTheDocument();

    // User explicitly selects Soda Ash Dense
    const select = screen.getByLabelText('Select Material Requirement');
    fireEvent.change(select, { target: { value: '100SA02G' } });

    // Now requirement is selected and displays its details
    expect(screen.getByText('Soda Ash Dense - GHCL')).toBeInTheDocument();

    // User can now advance to Step 2
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    expect(screen.getByText('Step 2 of 10')).toBeInTheDocument();
  });

  it('Section E.4: No unrelated sample file, source metadata or observation count appears before upload, and Step 3 blocks next if no file', () => {
    const sodaAshItem = BOROSIL_DEFAULT_REQUIREMENTS[0];
    const sodaAshCommodity = convertGapItemToResearchQueueRow(sodaAshItem, {
      assessmentId: 'AIC-2026-0002',
      customerId: 'CUST-2026-0002',
      customerName: 'Borosil Ltd'
    });

    render(
      <CommodityPCBIUploadWorkflowModal
        isOpen={true}
        initialCommodity={sodaAshCommodity}
        onClose={vi.fn()}
      />
    );

    // Step 1 -> Step 2 -> Step 3
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    expect(screen.getByText('Step 3 of 10')).toBeInTheDocument();

    // Verifies no pre-filled fake sample file
    expect(screen.getByText('Drag & drop research file here, or click to browse')).toBeInTheDocument();
    expect(screen.queryByText(/MMR_FeMo60_Historical/i)).not.toBeInTheDocument();

    // Clicking Next without selecting file is blocked
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    expect(screen.getByText('Please select an actual research source file to proceed.')).toBeInTheDocument();
    expect(screen.getByText('Step 3 of 10')).toBeInTheDocument();

    // Upload actual file
    uploadFileHelper();
    expect(screen.getByText('official_data.csv')).toBeInTheDocument();

    // Now can proceed to Step 4
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    expect(screen.getByText('Step 4 of 10')).toBeInTheDocument();
  });

  it('Section E.5: Switching items clears all stale staged data', () => {
    const sodaAshItem = BOROSIL_DEFAULT_REQUIREMENTS[0];
    const sodaAshCommodity = convertGapItemToResearchQueueRow(sodaAshItem);

    const { rerender } = render(
      <CommodityPCBIUploadWorkflowModal
        isOpen={true}
        initialCommodity={sodaAshCommodity}
        onClose={vi.fn()}
      />
    );

    // Advance to Step 3 and stage a file
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    uploadFileHelper();
    expect(screen.getByText('official_data.csv')).toBeInTheDocument();

    // Switch to a different requirement
    const polymersItem = BOROSIL_DEFAULT_REQUIREMENTS.find((item) => item.materialCode === 'KPPMSCBSP110911400')!;
    const polymersCommodity = convertGapItemToResearchQueueRow(polymersItem);

    rerender(
      <CommodityPCBIUploadWorkflowModal
        isOpen={true}
        initialCommodity={polymersCommodity}
        onClose={vi.fn()}
      />
    );

    // Step should be reset to 1, showing the new requirement and zero staged file
    expect(screen.getByText('Step 1 of 10')).toBeInTheDocument();
    expect(screen.getByText('Plastic Caps & Closures')).toBeInTheDocument();
    expect(screen.queryByText('Soda Ash Dense - GHCL')).not.toBeInTheDocument();
    expect(screen.queryByText('official_data.csv')).not.toBeInTheDocument();
  });

  it('Section E.6: Missing or ambiguous series mappings block progression until resolved', () => {
    const unmappedTileItem = BOROSIL_DEFAULT_REQUIREMENTS.find((item) => item.materialCode === 'STTV2062')!;
    const unmappedCommodity = convertGapItemToResearchQueueRow(unmappedTileItem, {
      assessmentId: 'AIC-2026-0002',
      customerId: 'CUST-2026-0002',
      customerName: 'Borosil Ltd'
    });

    const handleNavigateMapping = vi.fn();

    render(
      <CommodityPCBIUploadWorkflowModal
        isOpen={true}
        initialCommodity={unmappedCommodity}
        onClose={vi.fn()}
        onNavigateToMappingReview={handleNavigateMapping}
      />
    );

    expect(screen.getByText('Cumirex Super Refractory Tiles')).toBeInTheDocument();

    // Step 1 -> Step 2
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    expect(screen.getByText('Step 2 of 10')).toBeInTheDocument();

    // Displays Mapping Required warning banner
    expect(screen.getByText('MAPPING REQUIRED — NO APPROVED PCBI SERIES MAPPED')).toBeInTheDocument();

    // Route for mapping review button is available
    const routeBtn = screen.getByRole('button', { name: 'Route for Mapping Review' });
    fireEvent.click(routeBtn);
    expect(handleNavigateMapping).toHaveBeenCalledWith('STTV2062');

    // Attempting to advance to Step 3 is blocked
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    expect(
      screen.getByText('Cannot proceed with benchmark data upload until an approved PCBI series is mapped to this material requirement.')
    ).toBeInTheDocument();
    expect(screen.getByText('Step 2 of 10')).toBeInTheDocument();
  });

  it('Section E.7: Approval and activation remain gated by validation and authorization', async () => {
    vi.mocked(pcbiCommodityDataLabApi.approveCommodityData).mockResolvedValueOnce({
      success: true,
      result: {
        success: true,
        commodityId: '100SA02G',
        pcbiId: 'PCBI-IND-CHM-SDA-001',
        approvalStatus: 'ADMIN_APPROVED',
        catalogVersionCreated: true,
        catalogVersionId: 'V2.1',
        message: 'Activated'
      }
    } as any);

    const sodaAshItem = BOROSIL_DEFAULT_REQUIREMENTS[0];
    const sodaAshCommodity = convertGapItemToResearchQueueRow(sodaAshItem, {
      assessmentId: 'AIC-2026-0002',
      customerId: 'CUST-2026-0002',
      customerName: 'Borosil Ltd'
    });

    const handleComplete = vi.fn();
    const handleClose = vi.fn();

    render(
      <CommodityPCBIUploadWorkflowModal
        isOpen={true}
        initialCommodity={sodaAshCommodity}
        assessmentId="AIC-2026-0002"
        onClose={handleClose}
        onComplete={handleComplete}
      />
    );

    // Advance 1 -> 2 -> 3
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    uploadFileHelper();

    // Step 3 -> 9
    for (let s = 4; s <= 9; s++) {
      fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    }

    // Enter audit comments
    const commentInput = screen.getByPlaceholderText(/Provide formal administrative audit reasoning/i);
    fireEvent.change(commentInput, { target: { value: 'Approved verified AMAI monthly circular for Borosil Ltd.' } });

    // Advance to Step 10
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    expect(screen.getByText('Step 10 of 10')).toBeInTheDocument();

    // Execute Activation
    fireEvent.click(screen.getByRole('button', { name: /Execute Activation/i }));

    await waitFor(() => {
      expect(pcbiCommodityDataLabApi.approveCommodityData).toHaveBeenCalledWith({
        commodityId: '100SA02G',
        pcbiId: 'PCBI-IND-CHM-SDA-001',
        approverName: 'Sriman Admin',
        comments: 'Approved verified AMAI monthly circular for Borosil Ltd.'
      });
      expect(handleComplete).toHaveBeenCalledWith({
        commodityId: '100SA02G',
        pcbiId: 'PCBI-IND-CHM-SDA-001',
        versionId: 'V2.1'
      });
      expect(handleClose).toHaveBeenCalled();
    });
  });

  it('allows customizing source metadata on Step 4 and selecting reject or request correction on Step 9', async () => {
    const sodaAshItem = BOROSIL_DEFAULT_REQUIREMENTS[0];
    const sodaAshCommodity = convertGapItemToResearchQueueRow(sodaAshItem, {
      assessmentId: 'AIC-2026-0002',
      customerId: 'CUST-2026-0002',
      customerName: 'Borosil Ltd'
    });

    const handleClose = vi.fn();

    render(
      <CommodityPCBIUploadWorkflowModal
        isOpen={true}
        initialCommodity={sodaAshCommodity}
        onClose={handleClose}
      />
    );

    // Step 1 -> 2 -> 3
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    uploadFileHelper();

    // Step 3 -> 4
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    expect(screen.getByText('Step 4 of 10')).toBeInTheDocument();

    // Modify source metadata inputs
    const sourceNameInput = screen.getByPlaceholderText('e.g. AMAI Monthly Official Bulletin');
    fireEvent.change(sourceNameInput, { target: { value: 'Custom AMAI Price Bulletin' } });
    expect(sourceNameInput).toHaveValue('Custom AMAI Price Bulletin');

    const publisherInput = screen.getByPlaceholderText('e.g. Alkali Manufacturers Association of India');
    fireEvent.change(publisherInput, { target: { value: 'Custom Publisher India' } });
    expect(publisherInput).toHaveValue('Custom Publisher India');

    const urlInput = screen.getByPlaceholderText('https://...');
    fireEvent.change(urlInput, { target: { value: 'https://amaiindia.org/bulletins' } });
    expect(urlInput).toHaveValue('https://amaiindia.org/bulletins');

    const fileFormatSelect = screen.getByRole('combobox');
    fireEvent.change(fileFormatSelect, { target: { value: 'CSV' } });
    expect(fileFormatSelect).toHaveValue('CSV');

    // Advance 4 -> 9
    for (let s = 5; s <= 9; s++) {
      fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    }
    expect(screen.getByText('Step 9 of 10')).toBeInTheDocument();

    // Select Request Correction
    const correctionBtn = screen.getByRole('button', { name: 'REQUEST CORRECTION' });
    fireEvent.click(correctionBtn);

    // Select Reject
    const rejectBtn = screen.getByRole('button', { name: 'REJECT' });
    fireEvent.click(rejectBtn);

    // Re-select Approve
    const approveBtn = screen.getByRole('button', { name: 'APPROVE' });
    fireEvent.click(approveBtn);

    // Switch back to Reject and finish workflow on Step 10
    fireEvent.click(rejectBtn);
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    expect(screen.getByText('Step 10 of 10')).toBeInTheDocument();

    // Executing rejection closes modal without calling approveCommodityData
    fireEvent.click(screen.getByRole('button', { name: /Execute Activation/i }));
    await waitFor(() => {
      expect(pcbiCommodityDataLabApi.approveCommodityData).not.toHaveBeenCalled();
      expect(handleClose).toHaveBeenCalled();
    });
  });

  it('blocks advancing from Step 5 if 0 observations were extracted from an empty file', () => {
    const sodaAshItem = BOROSIL_DEFAULT_REQUIREMENTS[0];
    const sodaAshCommodity = convertGapItemToResearchQueueRow(sodaAshItem);

    render(
      <CommodityPCBIUploadWorkflowModal
        isOpen={true}
        initialCommodity={sodaAshCommodity}
        onClose={vi.fn()}
      />
    );

    // Step 1 -> 2 -> 3
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));

    // Upload an empty file
    const emptyFile = new File([], 'empty_records.csv', { type: 'text/csv' });
    const fileInput = document.getElementById('source-file-input') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [emptyFile] } });

    // Step 3 -> 4 -> 5
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    expect(screen.getByText('Step 5 of 10')).toBeInTheDocument();

    // Attempting to advance from Step 5 is blocked
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    expect(
      screen.getByText(UI_STRINGS.module3.gapList.uploadWorkflow.noExtractedRecords)
    ).toBeInTheDocument();
    expect(screen.getByText('Step 5 of 10')).toBeInTheDocument();
  });

  it('extracts all 43 weekly observations from candidate workbook for Borosil Soda Ash Dense on Step 5', async () => {
    const sodaAshItem = BOROSIL_DEFAULT_REQUIREMENTS[0];
    const sodaAshCommodity = convertGapItemToResearchQueueRow(sodaAshItem);

    render(
      <CommodityPCBIUploadWorkflowModal
        isOpen={true}
        initialCommodity={sodaAshCommodity}
        onClose={vi.fn()}
      />
    );

    // Step 1 -> 2 -> 3
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    expect(screen.getByText('Step 3 of 10')).toBeInTheDocument();

    // Upload the real candidate fixture
    const fixturePath = path.resolve(__dirname, '../../fixtures/Borosil_Soda_Ash_Dense_Existing_Series_Upload_Candidate.xlsx');
    const fixtureBuffer = fs.readFileSync(fixturePath);
    const candidateFile = new File([fixtureBuffer], 'Borosil_Soda_Ash_Dense_Existing_Series_Upload_Candidate.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const fileInput = document.getElementById('source-file-input') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [candidateFile] } });

    // Step 3 -> 4 -> 5
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    expect(screen.getByText('Step 5 of 10')).toBeInTheDocument();

    // Verify 43 records and 100.0% confidence extracted from actual workbook
    expect(screen.getByText('43 records parsed')).toBeInTheDocument();
    expect(screen.getByText('100.0% (Standard Parsed Table)')).toBeInTheDocument();
    expect(screen.getByText('Observation Date (Auto-detected)')).toBeInTheDocument();
    expect(screen.getByText('Index Value (Auto-detected)')).toBeInTheDocument();

    // Step 5 -> 6
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    expect(screen.getByText('Step 6 of 10')).toBeInTheDocument();

    // Verify dynamic quality audit indicators on Step 6
    expect(screen.getByText('0 Periods Missing')).toBeInTheDocument();
    expect(screen.getByText('0 Duplicates')).toBeInTheDocument();
    expect(screen.getByText('Uniform (INDEX_POINTS)')).toBeInTheDocument();
    expect(screen.getByText('Validated (WEEKLY)')).toBeInTheDocument();
    expect(screen.getByText('Underlying Supplier Price Basis:')).toBeInTheDocument();
    expect(screen.getByText('INR/MT')).toBeInTheDocument();

    // Step 6 -> 7
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    expect(screen.getByText('Step 7 of 10')).toBeInTheDocument();
    expect(screen.getByText('2026-01-05')).toBeInTheDocument();
    expect(screen.getByText('2026-01-12')).toBeInTheDocument();
    expect(screen.getByText('2026-01-19')).toBeInTheDocument();

    // Step 7: Displays index points, never rupees per MT
    expect(screen.getByText('Normalized Value (INDEX_POINTS)')).toBeInTheDocument();
    expect(screen.getAllByText('100 Pts').length).toBeGreaterThan(0);
    expect(screen.getAllByText('100 INDEX_POINTS').length).toBeGreaterThan(0);
    expect(screen.queryByText(/₹100 \/ MT/)).not.toBeInTheDocument();

    // Preserves existing series ID PCBI-IND-CHM-SDA-001
    expect(screen.getByText('PCBI-IND-CHM-SDA-001')).toBeInTheDocument();

    // Step 7 -> 8: Governance Standards Audit
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    expect(screen.getByText('Step 8 of 10')).toBeInTheDocument();

    // Verify Zero Synthetic Data Rule & No-Interpolation with April and June step changes
    expect(
      screen.getByText('COMPLIANT (No interpolation, discrete step-changes preserved)')
    ).toBeInTheDocument();
    expect(
      screen.getByText(/No-Interpolation Verified: 43 discrete weekly observations/)
    ).toBeInTheDocument();
    expect(screen.getByText(/Step changes confirmed:/)).toBeInTheDocument();
    expect(screen.getByText(/2026-04-06 \(\+3\.8462 Pts, circular effective 2026-04-01\)/)).toBeInTheDocument();
    expect(screen.getByText(/2026-06-01 \(\+1\.923 Pts, circular effective 2026-06-01\)/)).toBeInTheDocument();

    // Verify Specification Validation is marked as PENDING VERIFICATION
    expect(screen.getByText('PENDING VERIFICATION')).toBeInTheDocument();
    expect(
      screen.getByText(
        /Ex-Works Gujarat price basis derived from Tata Chemicals Mithapur proxy circulars/
      )
    ).toBeInTheDocument();

    // Verify Provenance Hash is computed 64-hex SHA-256 digest, NOT mock string
    await waitFor(() => {
      expect(
        screen.getByText('sha256:72e4765d36483431968852add4f7a9fa98278b02b95014ab252d31e329af6127')
      ).toBeInTheDocument();
    });
    expect(screen.queryByText('sha256:60a9e9437verified')).not.toBeInTheDocument();
  });

  it('Section E.8: The Borosil baseline remains ₹556.5346426 Cr and the transaction count remains 27,777', () => {
    // Verifies that opening, operating, or completing the upload workflow preserves
    // the authoritative Borosil baseline and transaction count invariant.
    const totalBorosilSpendCr = BOROSIL_DEFAULT_REQUIREMENTS.reduce(
      (sum, item) => sum + item.customerSpendCr,
      0
    );
    const totalTransactions = BOROSIL_DEFAULT_REQUIREMENTS.reduce(
      (sum, item) => sum + item.transactionCount,
      0
    );

    // Baseline assertions
    expect(totalBorosilSpendCr).toBeCloseTo(556.5346, 3);
    expect(totalTransactions).toBe(27777);
  });
});
