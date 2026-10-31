import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act, within } from '@testing-library/react';
import { AnalysisControlCenter } from '../../../../src/components/admin/orchestration/AnalysisControlCenter';
import { orchestrationApi } from '../../../../src/utils/orchestrationApi';
import { frontendLogger } from '../../../../src/utils/logger';
import { UI_STRINGS } from '../../../../src/constants';
import type {
  AdminOrchestrationKPIs,
  AdminQualityGateChecklist,
  AnalysisJob,
  AnalysisJobDetailPayload,
  DataVersionDiffSummary,
  DatasetVersion,
  PCBIGapCategory,
  ReportVersion
} from '../../../../src/types/analysisOrchestration';

vi.mock('../../../../src/components/admin/orchestration/EvidenceWorkbooksPanel', () => ({
  EvidenceWorkbooksPanel: (props: { jobId: string; customerName: string; totalSpendCr: number }) => (
    <div data-testid="evidence-panel-stub">{`${props.jobId}|${props.customerName}|${props.totalSpendCr}`}</div>
  )
}));

const ORCH = UI_STRINGS.orchestration;
const SEARCH_PLACEHOLDER = ORCH.searchPlaceholder;
const selectCorrectedFile = (): File => {
  const file = new File(['PO Number,Supplier Name,Quantity,Net Price,Currency,Total INR,Transaction Date,Material Group,Plant\nPO-9,Acme,2,5,INR,10,2026-01-01,Packaging,Plant 1'], 'Corrected_Spend.csv', { type: 'text/csv' });
  fireEvent.change(screen.getByLabelText(ORCH.fieldFileName), { target: { files: [file] } });
  return file;
};

const mockJob: AnalysisJob = {
  analysisJobId: 'JOB-SRIMAN-001',
  tenantId: 'TNT-101',
  customerName: 'Sriman Industries',
  uploadedBy: 'srini@sriman.com',
  originalUploadId: 'upl-101',
  currentDataVersionId: 'v1',
  module1VersionId: 'm1-v1',
  status: 'PCBI_REVIEW_REQUIRED',
  createdAt: '2026-10-04T10:00:00.000Z',
  lastUpdatedAt: '2026-10-04T10:00:00.000Z',
  totalSpendCr: 428.5,
  totalTransactions: 31671,
  analysisPeriod: 'FY 2023 - FY 2026',
  slaHoursTarget: 48
};

const mockKpis: AdminOrchestrationKPIs = {
  newAnalyses: 1,
  pcbiReviewsPending: 1,
  dataCorrectionsPending: 0,
  reportsPendingReview: 0,
  reportsReadyToSubmit: 0,
  customerAcknowledgementsPending: 0,
  blockedAnalyses: 0,
  totalAnalyses: 1
};

const mockVersion: DatasetVersion = {
  versionId: 'v1',
  tenantId: 'TNT-101',
  uploadedBy: 'srini@sriman.com',
  uploaderRole: 'CUSTOMER',
  uploadedAt: '2026-10-04T10:00:00.000Z',
  fileName: 'Spend_Data.xlsx',
  fileType: 'XLSX',
  fileSizeMb: 14.5,
  checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  source: 'CUSTOMER_ORIGINAL',
  processingStatus: 'PROCESSED',
  validationStatus: 'VALID',
  transactionCount: 31671,
  supplierCount: 974,
  spendInrCr: 428.5,
  categoryCount: 16,
  plantCount: 4
};

const mockGap: PCBIGapCategory = {
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
  status: 'PCBI_REQUIRED',
  reasonForReview: 'Benchmark mapping required',
  estimatedSpendImpactCr: 34.2,
  resolutionStatus: 'PENDING'
};

const mockReport: ReportVersion = {
  reportVersionId: 'RPT-TNT-101-v1',
  analysisJobId: 'JOB-SRIMAN-001',
  datasetVersionId: 'v1',
  pcbiStateVersion: 'PCBI-STATE-01',
  status: 'GENERATED_PENDING_ADMIN_REVIEW',
  isCustomerVisible: false,
  generatedBy: 'usr-admin-1',
  generatedAt: '2026-10-04T11:00:00.000Z',
  summaryMetrics: {
    totalSpendCr: 428.5,
    totalSavingsCr: 24.7,
    savingsPct: 5.76,
    coveredCategories: 16
  }
};

const mockChecklist: AdminQualityGateChecklist = {
  confirmedAt: '2026-10-04T12:00:00.000Z',
  confirmedByAdminId: 'usr-admin-1',
  dataQuality: { sourceDataValidated: true, spendReconciles: true, duplicateChecksCompleted: true, classificationReviewed: true },
  pcbi: { requiredPcbiCategoriesResolved: true, benchmarkSourcesValidated: true, exclusionsDocumented: true, pcbiCoverageAcceptable: true },
  financial: { savingsCalculationsValidated: true, noDoubleCounting: true, overlapsHandled: true, exclusionsApplied: true, totalsReconcile: true },
  report: { module1Reviewed: true, module2Reviewed: true, module3Reviewed: true, module4Reviewed: true, executiveSummaryReviewed: true }
};

const buildDetails = (overrides: Partial<AnalysisJobDetailPayload> = {}): AnalysisJobDetailPayload => ({
  job: mockJob,
  versions: [mockVersion],
  pcbiGaps: [mockGap],
  readiness: {
    categoryCoveragePct: 100,
    spendCoveragePct: 100,
    itemCoveragePct: 100,
    categoriesRequiringReview: 0,
    itemsExcluded: 0,
    dataCorrectionsPending: 0,
    overallReadiness: 'READY_TO_GENERATE',
    blockingReasons: []
  },
  reports: [mockReport],
  checklist: mockChecklist,
  correctionRequests: [],
  ...overrides
});

const diffSummary: DataVersionDiffSummary = {
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
  changedRecordsCount: 36,
  addedRecordsCount: 31,
  removedRecordsCount: 0,
  modifiedRecordsCount: 5
};

const openWorkspace = async (): Promise<void> => {
  fireEvent.click(await screen.findByText(ORCH.btnOpenWorkspace));
  await screen.findByText(ORCH.readinessTitle);
};

const openTab = (label: string): void => {
  fireEvent.click(screen.getByText(label));
};

const openWorkspaceAndTab = async (label: string): Promise<void> => {
  await openWorkspace();
  openTab(label);
};

describe('AnalysisControlCenter Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(frontendLogger, 'error').mockImplementation(() => ({}) as never);
    vi.spyOn(orchestrationApi, 'getJobs').mockResolvedValue([mockJob]);
    vi.spyOn(orchestrationApi, 'getAdminKPIs').mockResolvedValue(mockKpis);
    vi.spyOn(orchestrationApi, 'getJobDetails').mockResolvedValue(buildDetails());
    vi.spyOn(orchestrationApi, 'resolvePCBIGap').mockResolvedValue({ success: true, message: 'Resolved' });
    vi.spyOn(orchestrationApi, 'uploadCorrectedDataset').mockResolvedValue({
      success: true,
      newVersion: mockVersion,
      diff: diffSummary,
      message: 'Uploaded'
    });
    vi.spyOn(orchestrationApi, 'generateReport').mockResolvedValue({ success: true, report: mockReport, message: 'Generated' });
    vi.spyOn(orchestrationApi, 'confirmQualityGate').mockResolvedValue({ success: true, message: 'Quality gate confirmed' });
    vi.spyOn(orchestrationApi, 'approveAndSubmitReport').mockResolvedValue({ success: true, message: 'Approved' });
    vi.spyOn(orchestrationApi, 'resendNotification').mockResolvedValue({ success: true, message: 'Resent' });
    vi.spyOn(orchestrationApi, 'supersedeReport').mockResolvedValue({ success: true, message: 'Superseded' });
  });

  afterEach(async () => {
    // Let pending mocked requests settle inside act so their state updates do not leak past teardown.
    await act(async () => {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 0);
      });
    });
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('job directory', () => {
    it('renders control center header, KPI cards, and analysis jobs directory table', async () => {
      render(<AnalysisControlCenter />);

      await waitFor(() => {
        expect(screen.getByText(ORCH.controlCenterTitle)).toBeInTheDocument();
        expect(screen.getByText(ORCH.kpiNewAnalyses)).toBeInTheDocument();
        expect(screen.getByText('Sriman Industries')).toBeInTheDocument();
        expect(screen.getByText('JOB-SRIMAN-001')).toBeInTheDocument();
        expect(screen.getByText(ORCH.btnOpenWorkspace)).toBeInTheDocument();
      });

      // Test filter search input
      const searchInput = screen.getByPlaceholderText(SEARCH_PLACEHOLDER);
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'Sriman' } });
      });
      expect(screen.getByText('Sriman Industries')).toBeInTheDocument();
    });

    it('shows the loading message while the job directory is still loading', () => {
      vi.spyOn(orchestrationApi, 'getJobs').mockReturnValue(new Promise<AnalysisJob[]>(() => undefined));
      render(<AnalysisControlCenter />);

      expect(screen.getByText(ORCH.loadingJobs)).toBeInTheDocument();
    });

    it('shows the empty state when no job matches the selected criteria', async () => {
      vi.spyOn(orchestrationApi, 'getJobs').mockResolvedValue([]);
      render(<AnalysisControlCenter />);

      expect(await screen.findByText(ORCH.noJobsFound)).toBeInTheDocument();
    });

    it.each([
      ['a network error', new Error('Network down'), 'Network down'],
      ['an error without a message', new Error(''), ORCH.unknownFailureReason],
      ['a value that is not an Error', 'boom', ORCH.unknownFailureReason]
    ])('reports a directory load failure for %s and logs it', async (_label, error, reason) => {
      vi.spyOn(orchestrationApi, 'getJobs').mockRejectedValue(error);
      render(<AnalysisControlCenter />);

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent(ORCH.errorLoadControlCenter(reason));
      expect(frontendLogger.error).toHaveBeenCalledWith(
        'Analysis control center action failed',
        expect.objectContaining({ action: 'loadControlCenter' }),
        error
      );
    });

    it('dismisses an action message when its dismiss button is pressed', async () => {
      vi.spyOn(orchestrationApi, 'getJobs').mockRejectedValue(new Error('Network down'));
      render(<AnalysisControlCenter />);

      await screen.findByRole('alert');
      fireEvent.click(screen.getByRole('button', { name: ORCH.btnDismissMessage }));

      await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
    });

    it('reloads the directory when the refresh button is pressed', async () => {
      render(<AnalysisControlCenter />);
      await screen.findByText('Sriman Industries');

      fireEvent.click(screen.getByRole('button', { name: ORCH.btnRefresh }));

      await waitFor(() => expect(orchestrationApi.getJobs).toHaveBeenCalledTimes(2));
    });

    it('reloads the directory with the selected status filter and the search text', async () => {
      render(<AnalysisControlCenter />);
      await screen.findByText('Sriman Industries');

      fireEvent.click(screen.getByRole('button', { name: ORCH.filterPcbiReview }));
      await waitFor(() => expect(orchestrationApi.getJobs).toHaveBeenLastCalledWith({ status: 'PCBI_REVIEW_REQUIRED', search: '' }));

      fireEvent.change(screen.getByPlaceholderText(SEARCH_PLACEHOLDER), { target: { value: 'Sriman' } });
      await waitFor(() => expect(orchestrationApi.getJobs).toHaveBeenLastCalledWith({ status: 'PCBI_REVIEW_REQUIRED', search: 'Sriman' }));

      fireEvent.click(screen.getByRole('button', { name: ORCH.filterAll }));
      await waitFor(() => expect(orchestrationApi.getJobs).toHaveBeenLastCalledWith({ status: 'ALL', search: 'Sriman' }));
    });

    it('labels every workflow status and shows elapsed hours against the SLA', async () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date('2026-10-04T22:00:00.000Z'));
      const statuses: AnalysisJob['status'][] = [
        'SUBMITTED_TO_CUSTOMER',
        'CUSTOMER_VIEWED',
        'CUSTOMER_ACKNOWLEDGED',
        'ADMIN_APPROVED',
        'REPORT_GENERATED',
        'ADMIN_REVIEW',
        'READY_FOR_GENERATION',
        'PCBI_REVIEW_IN_PROGRESS',
        'ANALYSIS_BLOCKED',
        'UPLOADED'
      ];
      vi.spyOn(orchestrationApi, 'getJobs').mockResolvedValue(
        statuses.map((status, idx) => ({ ...mockJob, analysisJobId: `JOB-${idx}`, customerName: `Client ${idx}`, status }))
      );
      render(<AnalysisControlCenter />);

      await screen.findByText('Client 0');
      const table = screen.getByRole('table');
      expect(within(table).getAllByText(ORCH.statusSubmitted)).toHaveLength(2);
      expect(within(table).getByText(ORCH.statusAcknowledged)).toBeInTheDocument();
      expect(within(table).getByText(ORCH.statusReadyToSubmit)).toBeInTheDocument();
      expect(within(table).getAllByText(ORCH.statusAdminReview)).toHaveLength(2);
      expect(within(table).getByText(ORCH.statusReadyToGenerate)).toBeInTheDocument();
      expect(within(table).getByText(ORCH.statusPcbiReview)).toBeInTheDocument();
      expect(within(table).getByText(ORCH.statusBlocked)).toBeInTheDocument();
      expect(within(table).getByText('UPLOADED')).toBeInTheDocument();
      expect(within(table).getAllByText(ORCH.elapsedHoursOfSla(12, 48))).toHaveLength(statuses.length);
    });
  });

  describe('job workspace', () => {
    it('selects a job by clicking Open Workspace and loads the detailed operational workspace', async () => {
      render(<AnalysisControlCenter />);

      await waitFor(() => {
        expect(screen.getByText(ORCH.btnOpenWorkspace)).toBeInTheDocument();
      });

      const openBtn = screen.getByText(ORCH.btnOpenWorkspace);
      fireEvent.click(openBtn);

      await waitFor(() => {
        expect(screen.getByText(ORCH.readinessTitle)).toBeInTheDocument();
        expect(screen.getByText(ORCH.tabWorkflowReadiness)).toBeInTheDocument();
        expect(screen.getByText(ORCH.tabPcbiGapReview)).toBeInTheDocument();
        expect(screen.getByText(ORCH.tabDataCorrection)).toBeInTheDocument();
        expect(screen.getByText(ORCH.tabQualityGate)).toBeInTheDocument();
      });

      // Test Close Workspace
      const closeBtn = screen.getByRole('button', { name: ORCH.btnCloseWorkspace });
      fireEvent.click(closeBtn);
      await waitFor(() => {
        expect(screen.getByText(ORCH.controlCenterTitle)).toBeInTheDocument();
      });
    });

    it('shows the updating indicator while a reopened workspace is loading', async () => {
      let resolveSecond: (value: AnalysisJobDetailPayload) => void = () => undefined;
      vi.spyOn(orchestrationApi, 'getJobDetails')
        .mockResolvedValueOnce(buildDetails())
        .mockReturnValueOnce(new Promise<AnalysisJobDetailPayload>((resolve) => { resolveSecond = resolve; }));
      render(<AnalysisControlCenter />);
      await openWorkspace();

      fireEvent.click(screen.getByText(ORCH.btnOpenWorkspace));
      expect(await screen.findByText(ORCH.updatingDetails)).toBeInTheDocument();

      await act(async () => {
        resolveSecond(buildDetails());
      });
      await waitFor(() => expect(screen.queryByText(ORCH.updatingDetails)).toBeNull());
    });

    it('shows a descriptive message when the workspace fails to load', async () => {
      vi.spyOn(orchestrationApi, 'getJobDetails').mockRejectedValue(new Error('Timeout reaching D1'));
      render(<AnalysisControlCenter />);

      fireEvent.click(await screen.findByText(ORCH.btnOpenWorkspace));

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent(ORCH.errorLoadWorkspace('Timeout reaching D1'));
      expect(screen.queryByText(ORCH.readinessTitle)).toBeNull();
    });

    it('keeps the workspace closed when the server returns no details', async () => {
      vi.spyOn(orchestrationApi, 'getJobDetails').mockResolvedValue(null);
      render(<AnalysisControlCenter />);

      fireEvent.click(await screen.findByText(ORCH.btnOpenWorkspace));

      await waitFor(() => expect(orchestrationApi.getJobDetails).toHaveBeenCalledWith('JOB-SRIMAN-001'));
      expect(screen.queryByText(ORCH.readinessTitle)).toBeNull();
    });

    it('shows the job header with the data version, uploader, and spend', async () => {
      render(<AnalysisControlCenter />);
      await openWorkspace();

      expect(screen.getByText(ORCH.labelDataVersion, { exact: false })).toBeInTheDocument();
      expect(screen.getByText(ORCH.labelUploadedBy, { exact: false })).toBeInTheDocument();
      expect(screen.getByText(ORCH.labelTotalSpend, { exact: false })).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.common.croreAmount('428.50'), { selector: 'strong' })).toBeInTheDocument();
    });

    it('renders the evidence workbooks tab for the selected job', async () => {
      render(<AnalysisControlCenter />);
      await openWorkspaceAndTab(UI_STRINGS.evidence.title);

      expect(screen.getByTestId('evidence-panel-stub')).toHaveTextContent('JOB-SRIMAN-001|Sriman Industries|428.5');
    });
  });

  describe('readiness and report generation', () => {
    it('lists blocking reasons and keeps report generation disabled until the job is ready', async () => {
      vi.spyOn(orchestrationApi, 'getJobDetails').mockResolvedValue(buildDetails({
        readiness: {
          categoryCoveragePct: 80,
          spendCoveragePct: 90,
          itemCoveragePct: 85,
          categoriesRequiringReview: 2,
          itemsExcluded: 1,
          dataCorrectionsPending: 0,
          overallReadiness: 'ACTION_REQUIRED',
          blockingReasons: ['Missing PCBI mapping for Caustic Soda']
        }
      }));
      render(<AnalysisControlCenter />);
      await openWorkspace();

      expect(screen.getByText(ORCH.actionItemsTitle)).toBeInTheDocument();
      expect(screen.getByText('Missing PCBI mapping for Caustic Soda')).toBeInTheDocument();
      expect(screen.getByText(ORCH.statusActionRequired)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: ORCH.btnGenerateReport })).toBeDisabled();
    });

    it('triggers generate report when readiness is ready and shows the success message', async () => {
      render(<AnalysisControlCenter />);
      await openWorkspace();

      fireEvent.click(screen.getByText(ORCH.btnGenerateReport));

      await waitFor(() => {
        expect(orchestrationApi.generateReport).toHaveBeenCalledWith('JOB-SRIMAN-001');
      });
      expect(await screen.findByText('Generated')).toBeInTheDocument();
    });

    it('shows the server message when report generation is refused', async () => {
      vi.spyOn(orchestrationApi, 'generateReport').mockResolvedValue({ success: false, message: 'Checklist is incomplete' });
      render(<AnalysisControlCenter />);
      await openWorkspace();

      fireEvent.click(screen.getByText(ORCH.btnGenerateReport));

      expect(await screen.findByRole('alert')).toHaveTextContent('Checklist is incomplete');
    });

    it('shows a descriptive message when report generation throws', async () => {
      vi.spyOn(orchestrationApi, 'generateReport').mockRejectedValue(new Error('Worker timed out'));
      render(<AnalysisControlCenter />);
      await openWorkspace();

      fireEvent.click(screen.getByText(ORCH.btnGenerateReport));

      expect(await screen.findByRole('alert')).toHaveTextContent(ORCH.errorGenerateReport('Worker timed out'));
    });
  });

  describe('PCBI gap review', () => {
    it('shows each gap resolution state with its matching label', async () => {
      vi.spyOn(orchestrationApi, 'getJobDetails').mockResolvedValue(buildDetails({
        pcbiGaps: [
          { ...mockGap, gapId: 'g-mapped', itemCategory: 'Mapped Item', status: 'PCBI_COVERED', resolutionStatus: 'MAPPED', existingPcbiMapping: 'PCBI-SER-1' },
          { ...mockGap, gapId: 'g-excluded', itemCategory: 'Excluded Item', status: 'NOT_BENCHMARKABLE', resolutionStatus: 'EXCLUDED', exclusionReason: 'SERVICE' },
          { ...mockGap, gapId: 'g-no-reason', itemCategory: 'Unreasoned Item', status: 'SERVICE_NON_COMMODITY', resolutionStatus: 'EXCLUDED' },
          { ...mockGap, gapId: 'g-pending', itemCategory: 'Pending Item', status: 'PCBI_REQUIRED', resolutionStatus: 'PENDING' }
        ]
      }));
      render(<AnalysisControlCenter />);
      await openWorkspaceAndTab(ORCH.tabPcbiGapReview);

      expect(screen.getByText('PCBI-SER-1')).toBeInTheDocument();
      expect(screen.getByText(ORCH.excludedReason('SERVICE'))).toBeInTheDocument();
      expect(screen.getAllByText(/^Excluded:/)).toHaveLength(2);
      expect(screen.getByText(ORCH.resolutionActionRequired)).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: ORCH.btnResolve })).toHaveLength(4);
    });

    it('resolves a gap with a mapped series and reports success', async () => {
      render(<AnalysisControlCenter />);
      await openWorkspaceAndTab(ORCH.tabPcbiGapReview);

      fireEvent.click(screen.getByText(ORCH.btnResolve));
      expect(await screen.findByText(ORCH.resolveGapModalTitle)).toBeInTheDocument();

      fireEvent.change(screen.getByPlaceholderText(mockGap.requiredPcbiSeries ?? ''), { target: { value: 'PCBI-SERIES-ALT' } });
      fireEvent.click(screen.getByText(ORCH.btnSaveResolution));

      await waitFor(() => {
        expect(orchestrationApi.resolvePCBIGap).toHaveBeenCalledWith('JOB-SRIMAN-001', 'gap-01', {
          action: 'MAP_EXISTING',
          targetPcbiSeries: 'PCBI-SERIES-ALT',
          exclusionReason: undefined,
          exclusionNotes: undefined
        });
      });
      expect(await screen.findByText(ORCH.gapResolvedSuccess('Caustic Soda Lye 48%'))).toBeInTheDocument();
      expect(screen.queryByText(ORCH.resolveGapModalTitle)).toBeNull();
    });

    it('submits without a series id and uses the generic placeholder when the gap has no required series', async () => {
      vi.spyOn(orchestrationApi, 'getJobDetails').mockResolvedValue(buildDetails({
        pcbiGaps: [{ ...mockGap, requiredPcbiSeries: undefined }]
      }));
      render(<AnalysisControlCenter />);
      await openWorkspaceAndTab(ORCH.tabPcbiGapReview);

      fireEvent.click(screen.getByText(ORCH.btnResolve));
      expect(await screen.findByPlaceholderText(ORCH.placeholderSeriesId)).toBeInTheDocument();
      fireEvent.click(screen.getByText(ORCH.btnSaveResolution));

      await waitFor(() => {
        expect(orchestrationApi.resolvePCBIGap).toHaveBeenCalledWith(
          'JOB-SRIMAN-001',
          'gap-01',
          expect.objectContaining({ action: 'MAP_EXISTING', targetPcbiSeries: undefined })
        );
      });
    });

    it('resolves a gap with an exclusion reason and notes', async () => {
      render(<AnalysisControlCenter />);
      await openWorkspaceAndTab(ORCH.tabPcbiGapReview);

      fireEvent.click(screen.getByText(ORCH.btnResolve));
      expect(await screen.findByText(ORCH.resolveGapModalTitle)).toBeInTheDocument();

      // Choose EXCLUDE action
      const actionSelect = screen.getByDisplayValue(ORCH.actionMapExisting);
      fireEvent.change(actionSelect, { target: { value: 'EXCLUDE' } });

      // Exclusion reason and notes appear
      await waitFor(() => {
        expect(screen.getByText(ORCH.fieldExclusionReason)).toBeInTheDocument();
      });

      const notesTextarea = screen.getByPlaceholderText(ORCH.placeholderExclusionNotes);
      fireEvent.change(notesTextarea, { target: { value: 'Custom logistics chemical service' } });
      const [, exclusionReasonSelect] = screen.getAllByRole('combobox');
      fireEvent.change(exclusionReasonSelect, { target: { value: 'SERVICE' } });

      // Submit resolution
      fireEvent.click(screen.getByText(ORCH.btnSaveResolution));

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

    it('captures optional research notes for a PCBI research request', async () => {
      render(<AnalysisControlCenter />);
      await openWorkspaceAndTab(ORCH.tabPcbiGapReview);
      fireEvent.click(screen.getByText(ORCH.btnResolve));
      fireEvent.change(screen.getByDisplayValue(ORCH.actionMapExisting), { target: { value: 'REQUEST_RESEARCH' } });
      const researchNotes = await screen.findByPlaceholderText(ORCH.placeholderResearchNotes);
      fireEvent.change(researchNotes, { target: { value: 'Find current India benchmark sources' } });
      fireEvent.click(screen.getByText(ORCH.btnSaveResolution));

      await waitFor(() => {
        expect(orchestrationApi.resolvePCBIGap).toHaveBeenCalledWith('JOB-SRIMAN-001', 'gap-01', {
          action: 'REQUEST_RESEARCH',
          targetPcbiSeries: undefined,
          exclusionReason: undefined,
          exclusionNotes: undefined,
          researchNotes: 'Find current India benchmark sources'
        });
      });
    });

    it('shows the server message when the gap resolution is refused', async () => {
      vi.spyOn(orchestrationApi, 'resolvePCBIGap').mockResolvedValue({ success: false, message: 'Series PCBI-X not found' });
      render(<AnalysisControlCenter />);
      await openWorkspaceAndTab(ORCH.tabPcbiGapReview);

      fireEvent.click(screen.getByText(ORCH.btnResolve));
      fireEvent.click(await screen.findByText(ORCH.btnSaveResolution));

      expect(await screen.findByRole('alert')).toHaveTextContent('Series PCBI-X not found');
    });

    it('shows a descriptive message when the gap resolution throws', async () => {
      vi.spyOn(orchestrationApi, 'resolvePCBIGap').mockRejectedValue(new Error('Connection reset'));
      render(<AnalysisControlCenter />);
      await openWorkspaceAndTab(ORCH.tabPcbiGapReview);

      fireEvent.click(screen.getByText(ORCH.btnResolve));
      fireEvent.click(await screen.findByText(ORCH.btnSaveResolution));

      expect(await screen.findByRole('alert')).toHaveTextContent(ORCH.errorResolveGap('Connection reset'));
    });

    it('shows the saving state while the resolution is submitted', async () => {
      let resolveSave: (value: { success: boolean; message: string }) => void = () => undefined;
      vi.spyOn(orchestrationApi, 'resolvePCBIGap')
        .mockReturnValue(new Promise<{ success: boolean; message: string }>((resolve) => { resolveSave = resolve; }));
      render(<AnalysisControlCenter />);
      await openWorkspaceAndTab(ORCH.tabPcbiGapReview);

      fireEvent.click(screen.getByText(ORCH.btnResolve));
      fireEvent.click(await screen.findByText(ORCH.btnSaveResolution));

      expect(await screen.findByRole('button', { name: ORCH.savingResolution })).toBeDisabled();

      await act(async () => {
        resolveSave({ success: true, message: 'Saved' });
      });
      await waitFor(() => expect(screen.queryByText(ORCH.resolveGapModalTitle)).toBeNull());
    });

    it('closes the resolution modal with Cancel and with the close button', async () => {
      render(<AnalysisControlCenter />);
      await openWorkspaceAndTab(ORCH.tabPcbiGapReview);

      fireEvent.click(screen.getByText(ORCH.btnResolve));
      fireEvent.click(await screen.findByRole('button', { name: ORCH.btnCancel }));
      expect(screen.queryByText(ORCH.resolveGapModalTitle)).toBeNull();

      fireEvent.click(screen.getByText(ORCH.btnResolve));
      fireEvent.click(await screen.findByRole('button', { name: ORCH.btnCloseModal }));
      expect(screen.queryByText(ORCH.resolveGapModalTitle)).toBeNull();
    });
  });

  describe('data versioning and correction', () => {
    it('shows the dataset download as unavailable, not as a link, and renders version history', async () => {
      vi.spyOn(orchestrationApi, 'getJobDetails').mockResolvedValue(buildDetails({
        versions: [
          mockVersion,
          { ...mockVersion, versionId: 'v2', source: 'ADMIN_CORRECTION', uploaderRole: 'ADMIN', correctionReason: 'MISSING_TRANSACTIONS' }
        ]
      }));
      render(<AnalysisControlCenter />);
      await openWorkspaceAndTab(ORCH.tabDataCorrection);

      const downloadButton = screen.getByRole('button', { name: ORCH.btnDownloadForCorrection });
      expect(downloadButton).toBeDisabled();
      expect(screen.queryByRole('link', { name: ORCH.btnDownloadForCorrection })).toBeNull();
      expect(screen.getByText(ORCH.datasetDownloadUnavailable)).toBeInTheDocument();
      expect(screen.getByText(ORCH.originalBaselineUpload)).toBeInTheDocument();
      expect(screen.getByText('MISSING_TRANSACTIONS')).toBeInTheDocument();
      expect(screen.getByText(ORCH.dataCorrectionTitle)).toBeInTheDocument();
    });

    it('uploads corrected file bytes with the selected reason and notes, then shows the version change', async () => {
      render(<AnalysisControlCenter />);
      await openWorkspaceAndTab(ORCH.tabDataCorrection);

      fireEvent.click(screen.getByText(ORCH.btnUploadCorrectedData));
      expect(await screen.findByText(ORCH.uploadCorrectedModalSubtitle)).toBeInTheDocument();

      const file = selectCorrectedFile();

      const notesInput = screen.getByPlaceholderText(ORCH.placeholderCorrectionNotes);
      fireEvent.change(notesInput, { target: { value: 'Updated Caustic Soda classifications' } });

      fireEvent.click(screen.getByText(ORCH.btnGenerateNewVersion));

      await waitFor(() => {
        expect(orchestrationApi.uploadCorrectedDataset).toHaveBeenCalledWith(
          'JOB-SRIMAN-001',
          expect.objectContaining({
            fileName: file.name,
            fileSize: file.size,
            fileBase64: expect.any(String),
            checksum: expect.stringMatching(/^[a-f0-9]{64}$/u),
            notes: 'Updated Caustic Soda classifications'
          })
        );
      });
      expect(await screen.findByText(ORCH.dataVersionChangeTitle('v1', 'v2'))).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.common.croreAmount('428.50') + ' → ' + UI_STRINGS.common.croreAmount('431.25'))).toBeInTheDocument();
      expect(screen.queryByText(ORCH.uploadCorrectedModalSubtitle)).toBeNull();
    });

    it('requires an actual corrected workbook before enabling upload', async () => {
      render(<AnalysisControlCenter />);
      await openWorkspaceAndTab(ORCH.tabDataCorrection);

      fireEvent.click(screen.getByText(ORCH.btnUploadCorrectedData));
      expect(await screen.findByText(ORCH.btnGenerateNewVersion)).toBeDisabled();
      expect(orchestrationApi.uploadCorrectedDataset).not.toHaveBeenCalled();
      const form = screen.getByText(ORCH.btnGenerateNewVersion).closest('form');
      if (form) fireEvent.submit(form);
      expect(await screen.findByRole('alert')).toHaveTextContent(ORCH.correctedDatasetFileRequired);
    });

    it('sends the chosen reanalysis reason', async () => {
      render(<AnalysisControlCenter />);
      await openWorkspaceAndTab(ORCH.tabDataCorrection);

      fireEvent.click(screen.getByText(ORCH.btnUploadCorrectedData));
      fireEvent.change(await screen.findByRole('combobox'), { target: { value: 'PCBI_MAPPING_CORRECTION' } });
      selectCorrectedFile();
      fireEvent.click(screen.getByText(ORCH.btnGenerateNewVersion));

      await waitFor(() => {
        expect(orchestrationApi.uploadCorrectedDataset).toHaveBeenCalledWith(
          'JOB-SRIMAN-001',
          expect.objectContaining({ reason: 'PCBI_MAPPING_CORRECTION' })
        );
      });
    });

    it('shows zero for version change figures that the server leaves out', async () => {
      vi.spyOn(orchestrationApi, 'uploadCorrectedDataset').mockResolvedValue({
        success: true,
        message: 'Uploaded',
        diff: {} as DataVersionDiffSummary
      });
      render(<AnalysisControlCenter />);
      await openWorkspaceAndTab(ORCH.tabDataCorrection);

      fireEvent.click(screen.getByText(ORCH.btnUploadCorrectedData));
      selectCorrectedFile();
      fireEvent.click(await screen.findByText(ORCH.btnGenerateNewVersion));

      expect(await screen.findByText(ORCH.dataVersionChangeTitle('undefined', 'undefined'))).toBeInTheDocument();
      expect(screen.getAllByText('0 → 0').length).toBeGreaterThan(0);
    });

    it('shows the server message when the upload is refused', async () => {
      vi.spyOn(orchestrationApi, 'uploadCorrectedDataset').mockResolvedValue({ success: false, message: 'File is locked by another upload' });
      render(<AnalysisControlCenter />);
      await openWorkspaceAndTab(ORCH.tabDataCorrection);

      fireEvent.click(screen.getByText(ORCH.btnUploadCorrectedData));
      selectCorrectedFile();
      fireEvent.click(await screen.findByText(ORCH.btnGenerateNewVersion));

      expect(await screen.findByRole('alert')).toHaveTextContent('File is locked by another upload');
    });

    it('shows a descriptive message when the upload throws', async () => {
      vi.spyOn(orchestrationApi, 'uploadCorrectedDataset').mockRejectedValue(new Error('Payload too large'));
      render(<AnalysisControlCenter />);
      await openWorkspaceAndTab(ORCH.tabDataCorrection);

      fireEvent.click(screen.getByText(ORCH.btnUploadCorrectedData));
      selectCorrectedFile();
      fireEvent.click(await screen.findByText(ORCH.btnGenerateNewVersion));

      expect(await screen.findByRole('alert')).toHaveTextContent(ORCH.errorUploadCorrected('Payload too large'));
    });

    it('closes the upload modal with Cancel and with the close button', async () => {
      render(<AnalysisControlCenter />);
      await openWorkspaceAndTab(ORCH.tabDataCorrection);

      fireEvent.click(screen.getByText(ORCH.btnUploadCorrectedData));
      fireEvent.click(await screen.findByRole('button', { name: ORCH.btnCancel }));
      expect(screen.queryByText(ORCH.uploadCorrectedModalSubtitle)).toBeNull();

      fireEvent.click(screen.getByText(ORCH.btnUploadCorrectedData));
      fireEvent.click(await screen.findByRole('button', { name: ORCH.btnCloseModal }));
      expect(screen.queryByText(ORCH.uploadCorrectedModalSubtitle)).toBeNull();
    });
  });

  describe('quality gate and report approval', () => {
    it('toggles every checklist group and confirms the checklist', async () => {
      render(<AnalysisControlCenter />);
      await openWorkspaceAndTab(ORCH.tabQualityGate);

      await waitFor(() => {
        expect(screen.getByText(ORCH.checklistDataQualityTitle)).toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThanOrEqual(10);
      // First checkbox of each group: data quality, PCBI, financial, report
      [0, 4, 8, 13].forEach((index) => {
        expect(checkboxes[index]).toBeChecked();
        fireEvent.click(checkboxes[index]);
        expect(checkboxes[index]).not.toBeChecked();
      });

      // Click Confirm Quality Gate
      const confirmBtn = screen.getByText(ORCH.modalConfirmChecklist);
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(orchestrationApi.confirmQualityGate).toHaveBeenCalledWith(
          'JOB-SRIMAN-001',
          expect.objectContaining({ dataQuality: expect.objectContaining({ sourceDataValidated: false }) })
        );
      });
      expect(await screen.findByText('Quality gate confirmed')).toBeInTheDocument();
    });

    it('shows the server message and a descriptive message when the checklist cannot be confirmed', async () => {
      vi.spyOn(orchestrationApi, 'confirmQualityGate').mockResolvedValueOnce({ success: false, message: 'Checklist is incomplete' });
      render(<AnalysisControlCenter />);
      await openWorkspaceAndTab(ORCH.tabQualityGate);

      fireEvent.click(screen.getByText(ORCH.modalConfirmChecklist));
      expect(await screen.findByRole('alert')).toHaveTextContent('Checklist is incomplete');

      vi.spyOn(orchestrationApi, 'confirmQualityGate').mockRejectedValueOnce(new Error('Session expired'));
      fireEvent.click(screen.getByText(ORCH.modalConfirmChecklist));
      expect(await screen.findByText(ORCH.errorConfirmChecklist('Session expired'))).toBeInTheDocument();
    });

    it('confirms quality gate checklist and approves report for customer visibility', async () => {
      render(<AnalysisControlCenter />);
      await openWorkspaceAndTab(ORCH.tabQualityGate);

      await waitFor(() => {
        expect(screen.getByText(ORCH.checklistDataQualityTitle)).toBeInTheDocument();
      });

      // Toggle checklist checkbox
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThanOrEqual(10);
      fireEvent.click(checkboxes[0]);

      // Click Confirm Quality Gate
      const confirmBtn = screen.getByText(ORCH.modalConfirmChecklist);
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(orchestrationApi.confirmQualityGate).toHaveBeenCalled();
      });

      // Click Approve & Submit
      const approveBtn = screen.getByText(ORCH.btnApproveAndSubmit);
      fireEvent.click(approveBtn);

      await waitFor(() => {
        expect(orchestrationApi.approveAndSubmitReport).toHaveBeenCalledWith('JOB-SRIMAN-001', 'RPT-TNT-101-v1');
      });
    });

    it('disables approval until the quality checklist has been confirmed', async () => {
      vi.spyOn(orchestrationApi, 'getJobDetails').mockResolvedValue(buildDetails({ checklist: undefined }));
      render(<AnalysisControlCenter />);
      await openWorkspaceAndTab(ORCH.tabQualityGate);

      expect(screen.getByRole('button', { name: ORCH.btnApproveAndSubmit })).toBeDisabled();
    });

    it('shows approval failures from the server and from a thrown error', async () => {
      vi.spyOn(orchestrationApi, 'approveAndSubmitReport')
        .mockResolvedValueOnce({ success: false, message: 'Report is not approved yet' })
        .mockRejectedValueOnce(new Error('Gateway timeout'));
      render(<AnalysisControlCenter />);
      await openWorkspaceAndTab(ORCH.tabQualityGate);

      fireEvent.click(screen.getByText(ORCH.btnApproveAndSubmit));
      expect(await screen.findByRole('alert')).toHaveTextContent('Report is not approved yet');

      fireEvent.click(screen.getByText(ORCH.btnApproveAndSubmit));
      expect(await screen.findByText(ORCH.errorApproveReport('Gateway timeout'))).toBeInTheDocument();
    });

    it('approves the newest non-superseded report rather than the oldest one', async () => {
      vi.spyOn(orchestrationApi, 'getJobDetails').mockResolvedValue(buildDetails({
        reports: [
          { ...mockReport, reportVersionId: 'RPT-OLD', generatedAt: '2026-10-01T00:00:00.000Z' },
          { ...mockReport, reportVersionId: 'RPT-SUPERSEDED', generatedAt: '2026-10-06T00:00:00.000Z', status: 'SUPERSEDED' },
          { ...mockReport, reportVersionId: 'RPT-NEW', generatedAt: '2026-10-04T11:00:00.000Z' }
        ]
      }));
      render(<AnalysisControlCenter />);
      await openWorkspaceAndTab(ORCH.tabQualityGate);

      fireEvent.click(screen.getByText(ORCH.btnApproveAndSubmit));

      await waitFor(() => {
        expect(orchestrationApi.approveAndSubmitReport).toHaveBeenCalledWith('JOB-SRIMAN-001', 'RPT-NEW');
      });
    });

    it('treats an unreadable report timestamp as the oldest report', async () => {
      vi.spyOn(orchestrationApi, 'getJobDetails').mockResolvedValue(buildDetails({
        reports: [
          { ...mockReport, reportVersionId: 'RPT-BAD-DATE', generatedAt: 'not-a-date' },
          { ...mockReport, reportVersionId: 'RPT-VALID-DATE', generatedAt: '2026-10-04T11:00:00.000Z' }
        ]
      }));
      render(<AnalysisControlCenter />);
      await openWorkspaceAndTab(ORCH.tabQualityGate);

      fireEvent.click(screen.getByText(ORCH.btnApproveAndSubmit));

      await waitFor(() => {
        expect(orchestrationApi.approveAndSubmitReport).toHaveBeenCalledWith('JOB-SRIMAN-001', 'RPT-VALID-DATE');
      });
    });

    it('shows resend and supersede actions for an active report that is already submitted', async () => {
      vi.spyOn(orchestrationApi, 'getJobDetails').mockResolvedValue(buildDetails({
        reports: [{ ...mockReport, status: 'SUBMITTED', submittedAt: '2026-10-04T13:00:00.000Z' }]
      }));
      render(<AnalysisControlCenter />);
      await openWorkspaceAndTab(ORCH.tabQualityGate);

      expect(screen.queryByRole('button', { name: ORCH.btnApproveAndSubmit })).toBeNull();
      fireEvent.click(screen.getByText(ORCH.btnResendNotification));

      await waitFor(() => {
        expect(orchestrationApi.resendNotification).toHaveBeenCalledWith('JOB-SRIMAN-001', 'RPT-TNT-101-v1');
      });
      expect(await screen.findByText('Resent')).toBeInTheDocument();
    });

    it('shows the server message and a descriptive message when a notification cannot be resent', async () => {
      vi.spyOn(orchestrationApi, 'getJobDetails').mockResolvedValue(buildDetails({
        reports: [{ ...mockReport, status: 'SUBMITTED' }]
      }));
      vi.spyOn(orchestrationApi, 'resendNotification')
        .mockResolvedValueOnce({ success: false, message: 'Customer mailbox is unavailable' })
        .mockRejectedValueOnce(new Error('SMTP offline'));
      render(<AnalysisControlCenter />);
      await openWorkspaceAndTab(ORCH.tabQualityGate);

      fireEvent.click(screen.getByText(ORCH.btnResendNotification));
      expect(await screen.findByRole('alert')).toHaveTextContent('Customer mailbox is unavailable');

      fireEvent.click(screen.getByText(ORCH.btnResendNotification));
      expect(await screen.findByText(ORCH.errorResendNotification('SMTP offline'))).toBeInTheDocument();
    });

    it('supersedes the active report with the reason entered at the prompt', async () => {
      vi.spyOn(orchestrationApi, 'getJobDetails').mockResolvedValue(buildDetails({
        reports: [{ ...mockReport, status: 'SUBMITTED' }]
      }));
      const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('Wrong currency applied');
      render(<AnalysisControlCenter />);
      await openWorkspaceAndTab(ORCH.tabQualityGate);

      fireEvent.click(screen.getByText(ORCH.btnSupersedeReport));

      await waitFor(() => {
        expect(orchestrationApi.supersedeReport).toHaveBeenCalledWith('JOB-SRIMAN-001', 'RPT-TNT-101-v1', 'Wrong currency applied');
      });
      expect(promptSpy).toHaveBeenCalledWith(ORCH.supersedePromptReason);
      expect(await screen.findByText('Superseded')).toBeInTheDocument();
    });

    it('does not supersede the report when the prompt is cancelled or left empty', async () => {
      vi.spyOn(orchestrationApi, 'getJobDetails').mockResolvedValue(buildDetails({
        reports: [{ ...mockReport, status: 'SUBMITTED' }]
      }));
      const promptSpy = vi.spyOn(window, 'prompt').mockReturnValueOnce(null).mockReturnValueOnce('');
      render(<AnalysisControlCenter />);
      await openWorkspaceAndTab(ORCH.tabQualityGate);

      fireEvent.click(screen.getByText(ORCH.btnSupersedeReport));
      fireEvent.click(screen.getByText(ORCH.btnSupersedeReport));

      expect(promptSpy).toHaveBeenCalledTimes(2);
      expect(orchestrationApi.supersedeReport).not.toHaveBeenCalled();
    });

    it('shows the server message and a descriptive message when supersede fails', async () => {
      vi.spyOn(orchestrationApi, 'getJobDetails').mockResolvedValue(buildDetails({
        reports: [{ ...mockReport, status: 'SUBMITTED' }]
      }));
      vi.spyOn(window, 'prompt').mockReturnValue('Reason');
      vi.spyOn(orchestrationApi, 'supersedeReport')
        .mockResolvedValueOnce({ success: false, message: 'Report is locked' })
        .mockRejectedValueOnce(new Error('Database locked'));
      render(<AnalysisControlCenter />);
      await openWorkspaceAndTab(ORCH.tabQualityGate);

      fireEvent.click(screen.getByText(ORCH.btnSupersedeReport));
      expect(await screen.findByRole('alert')).toHaveTextContent('Report is locked');

      fireEvent.click(screen.getByText(ORCH.btnSupersedeReport));
      expect(await screen.findByText(ORCH.errorSupersedeReport('Database locked'))).toBeInTheDocument();
    });

    it('hides approval controls when every report has been superseded', async () => {
      vi.spyOn(orchestrationApi, 'getJobDetails').mockResolvedValue(buildDetails({
        reports: [{ ...mockReport, status: 'SUPERSEDED' }]
      }));
      render(<AnalysisControlCenter />);
      await openWorkspaceAndTab(ORCH.tabQualityGate);

      expect(screen.queryByRole('button', { name: ORCH.btnApproveAndSubmit })).toBeNull();
      expect(screen.queryByRole('button', { name: ORCH.btnResendNotification })).toBeNull();
    });

    it('hides approval controls when the job has no report yet', async () => {
      vi.spyOn(orchestrationApi, 'getJobDetails').mockResolvedValue(buildDetails({ reports: [] }));
      render(<AnalysisControlCenter />);
      await openWorkspaceAndTab(ORCH.tabQualityGate);

      expect(screen.queryByRole('button', { name: ORCH.btnApproveAndSubmit })).toBeNull();
    });
  });

  describe('audit trail', () => {
    it('lists every audit event that the job has reached', async () => {
      vi.spyOn(orchestrationApi, 'getJobDetails').mockResolvedValue(buildDetails({
        job: {
          ...mockJob,
          reportVersionId: 'RPT-TNT-101-v1',
          reportGeneratedAt: '2026-10-04T11:00:00.000Z',
          approvedAt: '2026-10-04T12:30:00.000Z',
          acknowledgedAt: '2026-10-04T14:00:00.000Z'
        }
      }));
      render(<AnalysisControlCenter />);
      await openWorkspaceAndTab(ORCH.tabAuditTrail);

      expect(screen.getByText(ORCH.auditTrailTitle)).toBeInTheDocument();
      expect(screen.getByText(ORCH.auditDataUploaded('TNT-101', 'v1'))).toBeInTheDocument();
      expect(screen.getByText(ORCH.auditModule1Completed('428.50'))).toBeInTheDocument();
      expect(screen.getByText(ORCH.auditAnalysisQueued('PCBI_REVIEW_REQUIRED'))).toBeInTheDocument();
      expect(screen.getByText(ORCH.auditReportGenerated('RPT-TNT-101-v1'))).toBeInTheDocument();
      expect(screen.getByText(ORCH.auditReportSubmitted('srini@sriman.com'))).toBeInTheDocument();
      expect(screen.getByText(ORCH.auditReportAcknowledged('2026-10-04T14:00:00.000Z'))).toBeInTheDocument();
    });

    it('omits the report, approval, and acknowledgement events the job has not reached', async () => {
      render(<AnalysisControlCenter />);
      await openWorkspaceAndTab(ORCH.tabAuditTrail);

      expect(screen.getByText(ORCH.auditDataUploaded('TNT-101', 'v1'))).toBeInTheDocument();
      expect(screen.queryByText(/REPORT_GENERATED/)).toBeNull();
      expect(screen.queryByText(/REPORT_APPROVED/)).toBeNull();
      expect(screen.queryByText(/REPORT_ACKNOWLEDGED/)).toBeNull();
    });
  });
});
