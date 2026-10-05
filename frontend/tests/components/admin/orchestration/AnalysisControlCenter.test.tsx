import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { AnalysisControlCenter } from '../../../../src/components/admin/orchestration/AnalysisControlCenter';
import { orchestrationApi } from '../../../../src/utils/orchestrationApi';
import { UI_STRINGS } from '../../../../src/constants';

describe('AnalysisControlCenter Component Tests', () => {
  const mockJob = {
    analysisJobId: 'JOB-SRIMAN-001',
    tenantId: 'TNT-101',
    customerName: 'Sriman Industries',
    uploadedBy: 'srini@sriman.com',
    originalUploadId: 'upl-101',
    currentDataVersionId: 'v1',
    module1VersionId: 'm1-v1',
    status: 'PCBI_REVIEW_REQUIRED' as const,
    createdAt: '2026-10-04T10:00:00.000Z',
    lastUpdatedAt: '2026-10-04T10:00:00.000Z',
    totalSpendCr: 428.5,
    totalTransactions: 31671,
    analysisPeriod: 'FY 2023 - FY 2026',
    slaHoursTarget: 48
  };

  const mockKpis = {
    newAnalyses: 1,
    pcbiReviewsPending: 1,
    dataCorrectionsPending: 0,
    reportsPendingReview: 0,
    reportsReadyToSubmit: 0,
    customerAcknowledgementsPending: 0,
    blockedAnalyses: 0,
    totalAnalyses: 1
  };

  const mockDetails = {
    job: mockJob,
    versions: [
      {
        versionId: 'v1',
        parentVersionId: undefined,
        tenantId: 'TNT-101',
        uploadedBy: 'srini@sriman.com',
        uploaderRole: 'CUSTOMER' as const,
        uploadedAt: '2026-10-04T10:00:00.000Z',
        fileName: 'Spend_Data.xlsx',
        fileType: 'XLSX',
        fileSizeMb: 14.5,
        checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        source: 'CUSTOMER_ORIGINAL' as const,
        processingStatus: 'PROCESSED' as const,
        validationStatus: 'VALID' as const,
        transactionCount: 31671,
        supplierCount: 974,
        spendInrCr: 428.5,
        categoryCount: 16,
        plantCount: 4
      }
    ],
    pcbiGaps: [
      {
        gapId: 'gap-01',
        tenantId: 'TNT-101',
        itemCategory: 'Specialty Chemicals',
        relevantClassification: 'Caustic Soda Lye 48%',
        customerSpendInrCr: 34.2,
        transactionCount: 342,
        supplierCount: 8,
        plantCount: 4,
        requiredPcbiSeries: 'PCBI-SERIES-CAUSTIC-SODA-48',
        benchmarkSource: 'ICIS Chemical',
        pcbiQualityRating: 'A',
        status: 'PCBI_REQUIRED' as const,
        reasonForReview: 'Benchmark mapping required',
        estimatedSpendImpactCr: 34.2,
        resolutionStatus: 'PENDING' as const
      }
    ],
    readiness: {
      categoryCoveragePct: 100,
      spendCoveragePct: 100,
      itemCoveragePct: 100,
      categoriesRequiringReview: 0,
      itemsExcluded: 0,
      dataCorrectionsPending: 0,
      overallReadiness: 'READY_TO_GENERATE' as const,
      blockingReasons: []
    },
    reports: [
      {
        reportVersionId: 'RPT-TNT-101-v1',
        analysisJobId: 'JOB-SRIMAN-001',
        datasetVersionId: 'v1',
        pcbiStateVersion: 'PCBI-STATE-01',
        status: 'GENERATED_PENDING_ADMIN_REVIEW' as const,
        isCustomerVisible: false,
        generatedBy: 'usr-admin-1',
        generatedAt: '2026-10-04T11:00:00.000Z',
        adminReviewedAt: undefined,
        approvedAt: undefined,
        submittedAt: undefined,
        summaryMetrics: {
          totalSpendCr: 428.5,
          totalSavingsCr: 24.7,
          savingsPct: 5.76,
          coveredCategories: 16
        }
      }
    ],
    checklist: {
      confirmedAt: '2026-10-04T12:00:00.000Z',
      confirmedBy: 'usr-admin-1',
      isComplete: true,
      dataQuality: { sourceDataValidated: true, spendReconciles: true, duplicateChecksCompleted: true, classificationReviewed: true },
      pcbi: { requiredPcbiCategoriesResolved: true, benchmarkSourcesValidated: true, exclusionsDocumented: true, pcbiCoverageAcceptable: true },
      financial: { savingsCalculationsValidated: true, noDoubleCounting: true, overlapsHandled: true, exclusionsApplied: true, totalsReconcile: true },
      report: { module1Reviewed: true, module2Reviewed: true, module3Reviewed: true, module4Reviewed: true, executiveSummaryReviewed: true }
    },
    correctionRequests: []
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(orchestrationApi, 'getJobs').mockResolvedValue([mockJob]);
    vi.spyOn(orchestrationApi, 'getAdminKPIs').mockResolvedValue(mockKpis);
    vi.spyOn(orchestrationApi, 'getJobDetails').mockResolvedValue(mockDetails);
    vi.spyOn(orchestrationApi, 'resolvePCBIGap').mockResolvedValue({ success: true, message: 'Resolved' });
    vi.spyOn(orchestrationApi, 'uploadCorrectedDataset').mockResolvedValue({
      success: true,
      newVersion: mockDetails.versions[0],
      diff: {
        previousVersionId: 'v1',
        newVersionId: 'v2',
        previousTransactions: 31671,
        newTransactions: 31702,
        previousSuppliers: 974,
        newSuppliers: 978,
        previousSpendCr: 428.5,
        newSpendCr: 431.25,
        previousCategories: 16,
        newCategories: 18,
        previousPlants: 4,
        newPlants: 4,
        transactionsDiff: 31,
        suppliersDiff: 4,
        spendDiffCr: 2.75,
        categoriesDiff: 2,
        plantsDiff: 0,
        addedRecordsCount: 31,
        removedRecordsCount: 0,
        modifiedRecordsCount: 5
      } as any,
      message: 'Uploaded'
    });
    vi.spyOn(orchestrationApi, 'getDownloadDatasetUrl').mockReturnValue('/api/orchestration/jobs/JOB-SRIMAN-001/download-dataset/v1');
    vi.spyOn(orchestrationApi, 'generateReport').mockResolvedValue({ success: true, report: mockDetails.reports[0] as any, message: 'Generated' });
    vi.spyOn(orchestrationApi, 'confirmQualityGate').mockResolvedValue({ success: true, message: 'Quality gate confirmed' });
    vi.spyOn(orchestrationApi, 'approveAndSubmitReport').mockResolvedValue({ success: true, message: 'Approved' });
    vi.spyOn(orchestrationApi, 'resendNotification').mockResolvedValue({ success: true, message: 'Resent' });
  });

  it('renders control center header, KPI cards, and analysis jobs directory table', async () => {
    render(<AnalysisControlCenter />);

    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.orchestration.controlCenterTitle)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.orchestration.kpiNewAnalyses)).toBeInTheDocument();
      expect(screen.getByText('Sriman Industries')).toBeInTheDocument();
      expect(screen.getByText('JOB-SRIMAN-001')).toBeInTheDocument();
      expect(screen.getByText('Open Workspace')).toBeInTheDocument();
    });

    // Test filter search input
    const searchInput = screen.getByPlaceholderText('Search by customer name, job ID or tenant...');
    fireEvent.change(searchInput, { target: { value: 'Sriman' } });
    expect(screen.getByText('Sriman Industries')).toBeInTheDocument();
  });

  it('selects a job by clicking Open Workspace and loads the detailed operational workspace', async () => {
    render(<AnalysisControlCenter />);

    await waitFor(() => {
      expect(screen.getByText('Open Workspace')).toBeInTheDocument();
    });

    const openBtn = screen.getByText('Open Workspace');
    fireEvent.click(openBtn);

    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.orchestration.readinessTitle)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.orchestration.tabWorkflowReadiness)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.orchestration.tabPcbiGapReview)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.orchestration.tabDataCorrection)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.orchestration.tabQualityGate)).toBeInTheDocument();
    });

    // Test Close Workspace
    const closeBtn = screen.getByRole('button', { name: 'Close Workspace' });
    fireEvent.click(closeBtn);
    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.orchestration.controlCenterTitle)).toBeInTheDocument();
    });
  });

  it('resolves PCBI gap with exclusion action, mandatory reason, and notes', async () => {
    render(<AnalysisControlCenter />);

    await waitFor(() => {
      expect(screen.getByText('Open Workspace')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Open Workspace'));

    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.orchestration.tabPcbiGapReview)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(UI_STRINGS.orchestration.tabPcbiGapReview));

    await waitFor(() => {
      expect(screen.getByText('Specialty Chemicals')).toBeInTheDocument();
      expect(screen.getByText('Resolve')).toBeInTheDocument();
    });

    // Open Resolve Modal
    fireEvent.click(screen.getByText('Resolve'));

    await waitFor(() => {
      expect(screen.getByText('Resolve PCBI Gap')).toBeInTheDocument();
    });

    // Choose EXCLUDE action
    const actionSelect = screen.getByDisplayValue('Map to Existing PCBI Series');
    fireEvent.change(actionSelect, { target: { value: 'EXCLUDE' } });

    // Exclusion reason and notes appear
    await waitFor(() => {
      expect(screen.getByText('Mandatory Exclusion Reason')).toBeInTheDocument();
    });

    const notesTextarea = screen.getByPlaceholderText('Explain justification for exclusion...');
    fireEvent.change(notesTextarea, { target: { value: 'Custom logistics chemical service' } });

    // Submit resolution
    const saveBtn = screen.getByText('Save Resolution');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(orchestrationApi.resolvePCBIGap).toHaveBeenCalledWith(
        'JOB-SRIMAN-001',
        'gap-01',
        expect.objectContaining({
          action: 'EXCLUDE',
          exclusionNotes: 'Custom logistics chemical service'
        })
      );
    });
  });

  it('downloads working dataset and uploads corrected dataset', async () => {
    render(<AnalysisControlCenter />);

    await waitFor(() => {
      expect(screen.getByText('Open Workspace')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Open Workspace'));

    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.orchestration.tabDataCorrection)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(UI_STRINGS.orchestration.tabDataCorrection));

    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.orchestration.btnUploadCorrectedData)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.orchestration.btnDownloadForCorrection)).toBeInTheDocument();
    });

    // Test download link
    const downloadLink = screen.getByText(UI_STRINGS.orchestration.btnDownloadForCorrection).closest('a');
    expect(downloadLink).toHaveAttribute('href', '/api/orchestration/jobs/JOB-SRIMAN-001/download-dataset/v1');
    expect(downloadLink).toHaveAttribute('download');

    // Test open upload modal and submit
    fireEvent.click(screen.getByText(UI_STRINGS.orchestration.btnUploadCorrectedData));

    await waitFor(() => {
      expect(screen.getAllByText('Upload Corrected Dataset').length).toBeGreaterThanOrEqual(2);
    });

    const fileInput = screen.getByPlaceholderText('e.g. Corrected_Procurement_Data_v2.xlsx');
    fireEvent.change(fileInput, { target: { value: 'Corrected_Spend.xlsx' } });

    const notesInput = screen.getByPlaceholderText('Describe corrected items, vendor updates, or transaction modifications...');
    fireEvent.change(notesInput, { target: { value: 'Updated Caustic Soda classifications' } });

    const generateBtn = screen.getByText('Generate New Data Version');
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(orchestrationApi.uploadCorrectedDataset).toHaveBeenCalledWith(
        'JOB-SRIMAN-001',
        expect.objectContaining({
          fileName: 'Corrected_Spend.xlsx',
          notes: 'Updated Caustic Soda classifications'
        })
      );
    });
  });

  it('confirms quality gate checklist and approves report for customer visibility', async () => {
    render(<AnalysisControlCenter />);

    await waitFor(() => {
      expect(screen.getByText('Open Workspace')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Open Workspace'));

    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.orchestration.tabQualityGate)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(UI_STRINGS.orchestration.tabQualityGate));

    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.orchestration.checklistDataQualityTitle)).toBeInTheDocument();
    });

    // Toggle checklist checkbox
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThanOrEqual(10);
    fireEvent.click(checkboxes[0]);

    // Click Confirm Quality Gate
    const confirmBtn = screen.getByText(UI_STRINGS.orchestration.modalConfirmChecklist);
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(orchestrationApi.confirmQualityGate).toHaveBeenCalled();
    });

    // Click Approve & Submit
    const approveBtn = screen.getByText(UI_STRINGS.orchestration.btnApproveAndSubmit);
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(orchestrationApi.approveAndSubmitReport).toHaveBeenCalledWith('JOB-SRIMAN-001', 'RPT-TNT-101-v1');
    });
  });

  it('triggers generate report when readiness is ready', async () => {
    render(<AnalysisControlCenter />);

    await waitFor(() => {
      expect(screen.getByText('Open Workspace')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Open Workspace'));

    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.orchestration.btnGenerateReport)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(UI_STRINGS.orchestration.btnGenerateReport));

    await waitFor(() => {
      expect(orchestrationApi.generateReport).toHaveBeenCalledWith('JOB-SRIMAN-001');
    });
  });
});
