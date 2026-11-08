import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CommodityWorkspaceModal } from '../../../src/components/admin/pcbi/CommodityWorkspaceModal';
import { pcbiCommodityDataLabApi } from '../../../src/utils/pcbiCommodityDataLabApi';
import { UI_STRINGS } from '../../../src/constants';

describe('CommodityWorkspaceModal Unit Tests', () => {
  const mockWorkspace = {
    overview: {
      commodityId: 'COM-MET-FMO',
      commodityName: 'Ferro Molybdenum 65%',
      pcbiId: 'PCBI-FEMO-65-001',
      seriesId: 'SER-IND-FEMO-65-M',
      module2Classification: 'METALS_AND_ALLOYS',
      unspsc: '30102900',
      currentStatus: 'PARTIAL_HISTORY',
      customerSpendInr: 12500000,
      customerSpendCr: '₹1.25 Cr',
      transactionCount: 65,
      requiredStartDate: '2020-04-01',
      requiredEndDate: '2026-06-30',
      requiredFrequency: 'WEEKLY' as const,
      requiredUnit: 'INR/MT',
      requiredCurrency: 'INR',
      requiredGeography: 'INDIA_DOMESTIC',
      availableHistory: '18 observations (Under Review)',
      priority: 'P1 — Critical Coverage Gap',
      priorityScore: 100,
      priorityReason: 'RANKED_BY_CUSTOMER_SPEND',
      researchStatus: 'IN_PROGRESS',
      lastUpdated: '2026-09-28T18:00:00.000Z'
    },
    sources: [
      {
        sourceId: 'SRC-FMO-MMR-01',
        sourceName: 'Minerals & Metals Review',
        publisher: 'MMR Pub',
        url: '',
        documentName: 'MMR_Assessments.pdf',
        publicationDate: '2024-04-15',
        uploadDate: '2026-09-28T16:30:00.000Z',
        fileType: 'PDF' as const,
        checksum: 'sha256-test',
        geography: 'India Domestic',
        gradeSpecification: 'FeMo 60% Basis',
        unit: 'INR/KG',
        currency: 'INR',
        frequency: 'MONTHLY' as const,
        deliveryBasis: 'Ex-Works',
        historicalCoverage: '18 observations',
        extractionStatus: 'EXTRACTED' as const,
        validationStatus: 'ISSUES_DETECTED' as const,
        methodologyStatus: 'PENDING' as const,
        approvalStatus: 'UNDER_REVIEW' as const,
        extractedObservationsCount: 18
      }
    ],
    extractedObservations: [
      {
        observationId: 'OBS-001',
        sourceId: 'SRC-FMO-MMR-01',
        sourceDate: '2024-04-01',
        rawValue: 3250,
        rawUnit: 'INR/KG',
        rawCurrency: 'INR',
        normalizedValue: 3250000,
        normalizedUnit: 'INR/MT',
        normalizedCurrency: 'INR',
        frequency: 'MONTHLY',
        status: 'VERIFIED' as const
      }
    ],
    methodologyDetails: {
      methodologyId: 'METH-COM-MET-FMO',
      title: 'Ferro Molybdenum Derivation Methodology',
      status: 'METHODOLOGY_PENDING',
      conversionRule: 'Normalized to INR/MT',
      governanceNotes: 'Requires dual source verification'
    },
    validationSummary: {
      passed: false,
      totalObservations: 18,
      validObservations: 14,
      missingPeriods: ['2020-04 to 2020-12'],
      criticalErrorsCount: 2
    },
    approvalPackage: {
      isReadyForApproval: false,
      canWriteToCatalog: false,
      approvalGateStatus: 'LOCKED_PENDING_REVIEW' as const
    },
    activeTab: 'OVERVIEW' as const
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(pcbiCommodityDataLabApi, 'getCommodityWorkspace').mockResolvedValue({
      success: true,
      workspace: mockWorkspace as any
    });
    vi.spyOn(pcbiCommodityDataLabApi, 'detectUploadDomain').mockResolvedValue({
      success: true,
      detection: { detectedDomain: 'COMMODITY_RESEARCH_EVIDENCE', isAllowedInTarget: true, targetArea: 'COMMODITY_DATA_LAB', matchedSignatures: [] }
    });
    vi.spyOn(pcbiCommodityDataLabApi, 'uploadCommoditySource').mockResolvedValue({
      success: true,
      source: mockWorkspace.sources[0] as any,
      banner: UI_STRINGS.pcbiCommodityDataLab.uploadBannerText,
      message: 'Source staged'
    });
    vi.spyOn(pcbiCommodityDataLabApi, 'approveCommodityData').mockResolvedValue({
      success: true,
      result: {
        success: true,
        commodityId: 'COM-MET-FMO',
        pcbiId: 'PCBI-FEMO-65-001',
        approvalStatus: 'ADMIN_APPROVED',
        catalogVersionCreated: true,
        catalogVersionId: 'V1.7.1',
        message: 'Commodity successfully approved'
      }
    });
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <CommodityWorkspaceModal isOpen={false} pcbiId="PCBI-FEMO-65-001" onClose={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('does not render when pcbiId is null', () => {
    const { container } = render(
      <CommodityWorkspaceModal isOpen={true} pcbiId={null} onClose={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal with prominent banner and loads workspace details', async () => {
    render(
      <CommodityWorkspaceModal isOpen={true} pcbiId="PCBI-FEMO-65-001" onClose={vi.fn()} />
    );

    expect(screen.getByText(UI_STRINGS.pcbiCommodityDataLab.uploadBannerText)).toBeInTheDocument();
    const heading = await screen.findByRole('heading', { level: 2, name: /Ferro Molybdenum 65%/i });
    expect(heading).toBeInTheDocument();
    expect(screen.getByText('PCBI-FEMO-65-001')).toBeInTheDocument();
  });

  it('switches between tabs when clicked', async () => {
    render(
      <CommodityWorkspaceModal isOpen={true} pcbiId="PCBI-FEMO-65-001" onClose={vi.fn()} />
    );

    await screen.findByRole('heading', { level: 2, name: /Ferro Molybdenum 65%/i });

    // Switch to Upload Data tab
    const uploadTabBtn = screen.getByText(UI_STRINGS.pcbiCommodityDataLab.workspaceTabLabels.UPLOAD_DATA);
    fireEvent.click(uploadTabBtn);
    expect(screen.getByText(UI_STRINGS.pcbiCommodityDataLab.workspaceSelectResearchFile)).toBeInTheDocument();

    // Switch to Source Register tab
    const sourceRegBtn = screen.getByText(UI_STRINGS.pcbiCommodityDataLab.workspaceTabLabels.SOURCE_REGISTER);
    fireEvent.click(sourceRegBtn);
    expect(screen.getByText('Minerals & Metals Review')).toBeInTheDocument();

    // Switch to Approval tab
    const approvalTabBtn = screen.getByText(UI_STRINGS.pcbiCommodityDataLab.workspaceTabLabels.APPROVAL);
    fireEvent.click(approvalTabBtn);
    expect(screen.getByText(UI_STRINGS.pcbiCommodityDataLab.workspaceApprovalHeading)).toBeInTheDocument();
  });

  it('triggers admin approval when clicking approve button in approval tab', async () => {
    const onApproved = vi.fn();
    render(
      <CommodityWorkspaceModal
        isOpen={true}
        pcbiId="PCBI-FEMO-65-001"
        onClose={vi.fn()}
        onDataApproved={onApproved}
      />
    );

    await screen.findByRole('heading', { level: 2, name: /Ferro Molybdenum 65%/i });

    fireEvent.click(screen.getByText(UI_STRINGS.pcbiCommodityDataLab.workspaceTabLabels.APPROVAL));
    const approveBtn = screen.getByRole('button', { name: /ADMIN APPROVAL — PROMOTE TO PCBI CATALOG/i });
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(pcbiCommodityDataLabApi.approveCommodityData).toHaveBeenCalledWith(
        expect.objectContaining({
          commodityId: 'COM-MET-FMO',
          pcbiId: 'PCBI-FEMO-65-001'
        })
      );
      expect(onApproved).toHaveBeenCalledWith('V1.7.1');
    });
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    render(
      <CommodityWorkspaceModal isOpen={true} pcbiId="PCBI-FEMO-65-001" onClose={onClose} />
    );
    await screen.findByRole('heading', { level: 2, name: /Ferro Molybdenum 65%/i });

    const closeBtn = screen.getAllByRole('button')[0];
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('renders all other tabs correctly when clicked', async () => {
    render(
      <CommodityWorkspaceModal isOpen={true} pcbiId="PCBI-FEMO-65-001" onClose={vi.fn()} />
    );

    await screen.findByRole('heading', { level: 2, name: /Ferro Molybdenum 65%/i });

    // Tab 2: Research Queue
    fireEvent.click(screen.getByText(UI_STRINGS.pcbiCommodityDataLab.workspaceTabLabels.RESEARCH_QUEUE));
    expect(screen.getByText(new RegExp(UI_STRINGS.pcbiCommodityDataLab.workspacePriorityLabel))).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.pcbiCommodityDataLab.priorityScoreLabel(100))).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.pcbiCommodityDataLab.highImpactQueueItem)).toBeInTheDocument();

    // Tab 5: Extracted Observations
    fireEvent.click(screen.getByText(UI_STRINGS.pcbiCommodityDataLab.workspaceTabLabels.EXTRACTED_OBSERVATIONS));
    expect(screen.getByText('OBS-001')).toBeInTheDocument();
    expect(screen.getByText(/3250/)).toBeInTheDocument();

    // Tab 6: Standardization Preview
    fireEvent.click(screen.getByText(UI_STRINGS.pcbiCommodityDataLab.workspaceTabLabels.STANDARDIZATION_PREVIEW));
    expect(screen.getByText(UI_STRINGS.pcbiCommodityDataLab.workspaceTransformationHeading)).toBeInTheDocument();

    // Tab 7: Source Comparison
    fireEvent.click(screen.getByText(UI_STRINGS.pcbiCommodityDataLab.workspaceTabLabels.SOURCE_COMPARISON));
    expect(screen.getByText(UI_STRINGS.pcbiCommodityDataLab.workspaceSourceComparisonHeading)).toBeInTheDocument();

    // Tab 8: Methodology
    fireEvent.click(screen.getByText(UI_STRINGS.pcbiCommodityDataLab.workspaceTabLabels.METHODOLOGY));
    expect(screen.getByText(/Ferro Molybdenum Derivation Methodology/i)).toBeInTheDocument();

    // Tab 9: Validation
    fireEvent.click(screen.getByText(UI_STRINGS.pcbiCommodityDataLab.workspaceTabLabels.VALIDATION));
    expect(screen.getByText(UI_STRINGS.pcbiCommodityDataLab.workspaceValidationHeading)).toBeInTheDocument();

    // Tab 11: Version History
    fireEvent.click(screen.getByText(UI_STRINGS.pcbiCommodityDataLab.workspaceTabLabels.VERSION_HISTORY));
    expect(screen.getByText(UI_STRINGS.pcbiCommodityDataLab.workspaceVersionHistoryHeading)).toBeInTheDocument();

    // Tab 12: PCBI History
    fireEvent.click(screen.getByText(UI_STRINGS.pcbiCommodityDataLab.workspaceTabLabels.PCBI_HISTORY));
    expect(screen.getByText(UI_STRINGS.pcbiCommodityDataLab.workspacePcbiHistoryHeading)).toBeInTheDocument();
  });

  it('marks unlinked workspace spend as unscored and removes its high-impact designation', async () => {
    const workspaceWithoutSpend = {
      ...mockWorkspace,
      overview: {
        ...mockWorkspace.overview,
        customerSpendInr: 0,
        priority: 'PENDING — Spend Link Required',
        priorityScore: 0,
        priorityReason: 'SPEND_LINK_REQUIRED' as const
      }
    };
    vi.spyOn(pcbiCommodityDataLabApi, 'getCommodityWorkspace').mockResolvedValue({
      success: true,
      workspace: workspaceWithoutSpend as any
    });
    render(<CommodityWorkspaceModal isOpen={true} pcbiId="PCBI-FEMO-65-001" onClose={vi.fn()} />);
    await screen.findByRole('heading', { level: 2, name: /Ferro Molybdenum 65%/i });
    fireEvent.click(screen.getByText(UI_STRINGS.pcbiCommodityDataLab.workspaceTabLabels.RESEARCH_QUEUE));
    expect(screen.getByText(UI_STRINGS.pcbiCommodityDataLab.priorityScoreNotScored)).toBeInTheDocument();
    expect(screen.queryByText(UI_STRINGS.pcbiCommodityDataLab.highImpactQueueItem)).not.toBeInTheDocument();
  });

  it('does not label a resolved high-spend commodity as an active high-impact gap', async () => {
    const resolvedHighSpendWorkspace = {
      ...mockWorkspace,
      overview: {
        ...mockWorkspace.overview,
        currentStatus: 'PRODUCTION_READY',
        priority: 'P4 — Low Coverage Gap',
        priorityScore: 0,
        priorityReason: 'GAP_RESOLVED' as const
      }
    };
    vi.spyOn(pcbiCommodityDataLabApi, 'getCommodityWorkspace').mockResolvedValue({
      success: true,
      workspace: resolvedHighSpendWorkspace as any
    });
    render(<CommodityWorkspaceModal isOpen={true} pcbiId="PCBI-FEMO-65-001" onClose={vi.fn()} />);
    await screen.findByRole('heading', { level: 2, name: /Ferro Molybdenum 65%/i });
    fireEvent.click(screen.getByText(UI_STRINGS.pcbiCommodityDataLab.workspaceTabLabels.RESEARCH_QUEUE));
    expect(screen.getByText(UI_STRINGS.pcbiCommodityDataLab.priorityScoreResolved)).toBeInTheDocument();
    expect(screen.queryByText(UI_STRINGS.pcbiCommodityDataLab.highImpactQueueItem)).not.toBeInTheDocument();
  });

  it('handles file upload selection, domain detection, and staging successfully', async () => {
    render(
      <CommodityWorkspaceModal isOpen={true} pcbiId="PCBI-FEMO-65-001" onClose={vi.fn()} />
    );

    await screen.findByRole('heading', { level: 2, name: /Ferro Molybdenum 65%/i });

    // Go to upload tab
    fireEvent.click(screen.getByText(UI_STRINGS.pcbiCommodityDataLab.workspaceTabLabels.UPLOAD_DATA));

    // Mock file input
    const file = new File(['content,date,price\n3200,2024-01-01,3200'], 'MMR_Research_Data.csv', {
      type: 'text/csv'
    });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.pcbiCommodityDataLab.workspaceSelectedFile('MMR_Research_Data.csv', '0.0'))).toBeInTheDocument();
    });

    const uploadBtn = screen.getByRole('button', { name: UI_STRINGS.pcbiCommodityDataLab.workspaceUploadEvidence });
    fireEvent.click(uploadBtn);

    await waitFor(() => {
      expect(pcbiCommodityDataLabApi.uploadCommoditySource).toHaveBeenCalled();
      expect(screen.getByText('Minerals & Metals Review')).toBeInTheDocument();
    });
  });

  it('shows error banner when customer purchase history file is detected in upload tab', async () => {
    vi.spyOn(pcbiCommodityDataLabApi, 'detectUploadDomain').mockResolvedValue({
      success: true,
      detection: {
        detectedDomain: 'CUSTOMER_PURCHASE_HISTORY',
        isAllowedInTarget: false,
        errorMessage: 'CUSTOMER DATA DETECTED',
        guidanceMessage: 'Customer purchase history must be uploaded through Module 1.',
        targetArea: 'COMMODITY_DATA_LAB',
        matchedSignatures: ['po number']
      }
    });

    render(
      <CommodityWorkspaceModal isOpen={true} pcbiId="PCBI-FEMO-65-001" onClose={vi.fn()} />
    );

    await screen.findByRole('heading', { level: 2, name: /Ferro Molybdenum 65%/i });

    fireEvent.click(screen.getByText(UI_STRINGS.pcbiCommodityDataLab.workspaceTabLabels.UPLOAD_DATA));

    const file = new File(['po number,vendor,spend'], 'Customer_PO_History.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('CUSTOMER DATA DETECTED')).toBeInTheDocument();
      expect(screen.getByText(/Customer purchase history must be uploaded through Module 1/i)).toBeInTheDocument();
    });
  });

  it('handles error gracefully when approveCommodityData rejects', async () => {
    vi.spyOn(pcbiCommodityDataLabApi, 'approveCommodityData').mockRejectedValueOnce(
      new Error('Approval gate failed: insufficient sources')
    );

    render(
      <CommodityWorkspaceModal isOpen={true} pcbiId="PCBI-FEMO-65-001" onClose={vi.fn()} />
    );

    await screen.findByRole('heading', { level: 2, name: /Ferro Molybdenum 65%/i });

    fireEvent.click(screen.getByText(UI_STRINGS.pcbiCommodityDataLab.workspaceTabLabels.APPROVAL));
    const approveBtn = screen.getByRole('button', { name: /ADMIN APPROVAL — PROMOTE TO PCBI CATALOG/i });
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(pcbiCommodityDataLabApi.approveCommodityData).toHaveBeenCalled();
    });
  });

  it('handles workspace load failure gracefully', async () => {
    vi.spyOn(pcbiCommodityDataLabApi, 'getCommodityWorkspace').mockRejectedValueOnce(
      new Error('Failed to load workspace')
    );

    render(
      <CommodityWorkspaceModal isOpen={true} pcbiId="PCBI-ERR-001" onClose={vi.fn()} />
    );

    await waitFor(() => {
      expect(pcbiCommodityDataLabApi.getCommodityWorkspace).toHaveBeenCalled();
    });
  });

  it('handles file selection with empty files array', async () => {
    render(
      <CommodityWorkspaceModal isOpen={true} pcbiId="PCBI-FEMO-65-001" onClose={vi.fn()} />
    );

    await screen.findByRole('heading', { level: 2, name: /Ferro Molybdenum 65%/i });
    fireEvent.click(screen.getByText(UI_STRINGS.pcbiCommodityDataLab.workspaceTabLabels.UPLOAD_DATA));

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [] } });
    expect(screen.queryByText(UI_STRINGS.pcbiCommodityDataLab.workspaceSelectedFile('file.csv', '0.0'))).not.toBeInTheDocument();
  });

  it('handles upload errors when uploadCommoditySource rejects with customer data, master data, or generic error', async () => {
    vi.spyOn(pcbiCommodityDataLabApi, 'uploadCommoditySource')
      .mockRejectedValueOnce(new Error('CUSTOMER DATA DETECTED: Not allowed'))
      .mockRejectedValueOnce(new Error('PCBI MASTER DATA DETECTED: Invalid target'))
      .mockRejectedValueOnce(new Error('Server timeout 504'));

    render(
      <CommodityWorkspaceModal isOpen={true} pcbiId="PCBI-FEMO-65-001" onClose={vi.fn()} />
    );

    await screen.findByRole('heading', { level: 2, name: /Ferro Molybdenum 65%/i });
    fireEvent.click(screen.getByText(UI_STRINGS.pcbiCommodityDataLab.workspaceTabLabels.UPLOAD_DATA));

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['test'], 'data.csv', { type: 'text/csv' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    const uploadBtn = screen.getByRole('button', { name: UI_STRINGS.pcbiCommodityDataLab.workspaceUploadEvidence });

    // 1st error: CUSTOMER DATA DETECTED
    fireEvent.click(uploadBtn);
    await waitFor(() => {
      expect(screen.getByText('CUSTOMER DATA DETECTED')).toBeInTheDocument();
    });

    // 2nd error: PCBI MASTER DATA DETECTED
    fireEvent.click(uploadBtn);
    await waitFor(() => {
      expect(screen.getByText('PCBI MASTER DATA DETECTED')).toBeInTheDocument();
    });

    // 3rd error: UPLOAD FAILED
    fireEvent.click(uploadBtn);
    await waitFor(() => {
      expect(screen.getByText('UPLOAD FAILED')).toBeInTheDocument();
      expect(screen.getByText('Server timeout 504')).toBeInTheDocument();
    });
  });

  it('renders approved workspace state with catalog write authorization and approved source status', async () => {
    const approvedWorkspace = {
      ...mockWorkspace,
      sources: [
        {
          ...mockWorkspace.sources[0],
          approvalStatus: 'ADMIN_APPROVED' as const
        }
      ],
      approvalPackage: {
        isReadyForApproval: true,
        canWriteToCatalog: true,
        approvalGateStatus: 'READY_FOR_CATALOG' as const,
        approverName: 'Lead PCBI Auditor',
        approvedAt: '2026-09-28T18:00:00Z'
      }
    };

    vi.spyOn(pcbiCommodityDataLabApi, 'getCommodityWorkspace').mockResolvedValueOnce({
      success: true,
      workspace: approvedWorkspace as any
    });

    render(
      <CommodityWorkspaceModal isOpen={true} pcbiId="PCBI-FEMO-65-001" onClose={vi.fn()} />
    );

    await screen.findByRole('heading', { level: 2, name: /Ferro Molybdenum 65%/i });

    // Check Source Register shows ADMIN_APPROVED badge
    fireEvent.click(screen.getByText(UI_STRINGS.pcbiCommodityDataLab.workspaceTabLabels.SOURCE_REGISTER));
    expect(screen.getByText('ADMIN_APPROVED')).toBeInTheDocument();

    // Check Approval tab shows YES for catalog write and approver name
    fireEvent.click(screen.getByText(UI_STRINGS.pcbiCommodityDataLab.workspaceTabLabels.APPROVAL));
    expect(screen.getByText(UI_STRINGS.pcbiCommodityDataLab.workspaceApprovalYes)).toBeInTheDocument();
    expect(screen.getByText(/Lead PCBI Auditor/i)).toBeInTheDocument();
  });

  it('handles onSourceUploaded callback, non-standard file extension, and non-Error rejections', async () => {
    const onUploaded = vi.fn();
    render(
      <CommodityWorkspaceModal
        isOpen={true}
        pcbiId="PCBI-FEMO-65-001"
        onClose={vi.fn()}
        onSourceUploaded={onUploaded}
      />
    );

    await screen.findByRole('heading', { level: 2, name: /Ferro Molybdenum 65%/i });
    fireEvent.click(screen.getByText(UI_STRINGS.pcbiCommodityDataLab.workspaceTabLabels.UPLOAD_DATA));

    // File with unknown extension (falls back to CSV)
    const file = new File(['data'], 'raw_data_nodot', { type: 'application/octet-stream' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    const uploadBtn = screen.getByRole('button', { name: UI_STRINGS.pcbiCommodityDataLab.workspaceUploadEvidence });
    fireEvent.click(uploadBtn);

    await waitFor(() => {
      expect(onUploaded).toHaveBeenCalled();
    });

    // Test non-Error rejection on upload
    vi.spyOn(pcbiCommodityDataLabApi, 'uploadCommoditySource').mockRejectedValueOnce('Network dropped completely');
    fireEvent.click(screen.getByText(UI_STRINGS.pcbiCommodityDataLab.workspaceTabLabels.UPLOAD_DATA));
    const uploadInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(uploadInput, { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.pcbiCommodityDataLab.workspaceUploadEvidence }));
    await waitFor(() => {
      expect(screen.getByText('Network dropped completely')).toBeInTheDocument();
    });

    // Test non-Error rejection on approval
    vi.spyOn(pcbiCommodityDataLabApi, 'approveCommodityData').mockRejectedValueOnce('Approval string error');
    fireEvent.click(screen.getByText(UI_STRINGS.pcbiCommodityDataLab.workspaceTabLabels.APPROVAL));
    const approveBtn = screen.getByRole('button', { name: /ADMIN APPROVAL — PROMOTE TO PCBI CATALOG/i });
    fireEvent.click(approveBtn);
    await waitFor(() => {
      expect(pcbiCommodityDataLabApi.approveCommodityData).toHaveBeenCalled();
    });

    // Test non-Error rejection on workspace load
    vi.spyOn(pcbiCommodityDataLabApi, 'getCommodityWorkspace').mockRejectedValueOnce('Failed workspace load');
    fireEvent.click(screen.getByText(UI_STRINGS.pcbiCommodityDataLab.workspaceTabLabels.OVERVIEW));
  });

  it('uses the domain-specific fallback guidance when preflight detection omits its messages', async () => {
    vi.spyOn(pcbiCommodityDataLabApi, 'detectUploadDomain').mockResolvedValueOnce({
      success: true,
      detection: {
        detectedDomain: 'CUSTOMER_PURCHASE_HISTORY',
        isAllowedInTarget: false,
        targetArea: 'COMMODITY_DATA_LAB',
        matchedSignatures: []
      }
    } as any);
    render(<CommodityWorkspaceModal isOpen pcbiId="PCBI-FEMO-65-001" onClose={vi.fn()} />);

    await screen.findByRole('heading', { level: 2, name: /Ferro Molybdenum 65%/i });
    fireEvent.click(screen.getByText(UI_STRINGS.pcbiCommodityDataLab.workspaceTabLabels.UPLOAD_DATA));
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [new File(['rows'], 'purchases.csv', { type: 'text/csv' })] } });

    expect(await screen.findByText('CUSTOMER DATA DETECTED')).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.pcbiCommodityDataLab.customerDataDetectedMsg)).toBeInTheDocument();
  });

  it('keeps the current workspace when D1 returns an unsuccessful payload and ignores rejected approval payloads', async () => {
    vi.spyOn(pcbiCommodityDataLabApi, 'getCommodityWorkspace').mockResolvedValueOnce({ success: false } as any);
    vi.spyOn(pcbiCommodityDataLabApi, 'approveCommodityData').mockResolvedValueOnce({ success: false } as any);
    const failedWorkspaceView = render(<CommodityWorkspaceModal isOpen pcbiId="PCBI-FEMO-65-001" onClose={vi.fn()} />);

    await waitFor(() => expect(pcbiCommodityDataLabApi.getCommodityWorkspace).toHaveBeenCalled());
    expect(screen.queryByRole('heading', { level: 2, name: /Ferro Molybdenum 65%/i })).not.toBeInTheDocument();
    failedWorkspaceView.unmount();

    // Restore the normal workspace for the approval interaction.
    vi.mocked(pcbiCommodityDataLabApi.getCommodityWorkspace).mockResolvedValue({
      success: true,
      workspace: mockWorkspace as any
    });
    const approvalView = render(<CommodityWorkspaceModal isOpen pcbiId="PCBI-FEMO-65-001" onClose={vi.fn()} />);
    await screen.findByRole('heading', { level: 2, name: /Ferro Molybdenum 65%/i });
    fireEvent.click(screen.getByText(UI_STRINGS.pcbiCommodityDataLab.workspaceTabLabels.APPROVAL));
    fireEvent.click(screen.getByRole('button', { name: /ADMIN APPROVAL — PROMOTE TO PCBI CATALOG/i }));
    await waitFor(() => expect(pcbiCommodityDataLabApi.approveCommodityData).toHaveBeenCalled());
    approvalView.unmount();
  });
});



