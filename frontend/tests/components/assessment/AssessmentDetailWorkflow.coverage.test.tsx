import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { AssessmentDetailWorkflow } from '../../../src/components/assessment/AssessmentDetailWorkflow';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import { MODULE_GATES_LIST } from '../../../src/constants/assessment';
import { assessmentApiClient } from '../../../src/utils/assessmentApi';
import frontendLogger from '../../../src/utils/logger';
import type { FrontendLogEntry, LogLevel } from '../../../src/types/logger';
import type {
  AssessmentAnalysisRun,
  AssessmentAuditLog,
  AssessmentPipelineTabProps,
  AssessmentRecord,
  AssessmentUploadTabProps,
  DeliveryPackageResult
} from '../../../src/types';

vi.mock('../../../src/utils/assessmentApi', () => ({
  assessmentApiClient: {
    getAssessmentById: vi.fn(),
    getAuditLogs: vi.fn(),
    updateNdaStatus: vi.fn(),
    updateDataStatus: vi.fn(),
    runAnalysis: vi.fn(),
    approveAssessment: vi.fn(),
    generateDeliveryPackage: vi.fn(),
    getReviewGates: vi.fn(),
    saveReviewGate: vi.fn()
  }
}));

// The pipeline and upload tabs have their own test files. These stubs expose their callbacks so this
// file can verify how the workflow wires them.
vi.mock('../../../src/components/assessment/AssessmentPipelineTab', async () => {
  const { createElement } = await import('react');
  return {
    AssessmentPipelineTab: (props: AssessmentPipelineTabProps) =>
      createElement(
        'section',
        { 'data-testid': 'pipeline-tab' },
        createElement('span', { 'data-testid': 'pipeline-run' }, props.activeRun?.analysisRunId ?? 'no-run'),
        createElement('span', { 'data-testid': 'pipeline-processing' }, String(props.isProcessing)),
        createElement('button', { type: 'button', onClick: () => props.onNdaChange('SIGNED') }, 'stub nda'),
        createElement('button', { type: 'button', onClick: () => props.onDataStatusChange('VALIDATED') }, 'stub data'),
        createElement('button', { type: 'button', onClick: () => props.onRunAnalysis() }, 'stub run')
      )
  };
});

vi.mock('../../../src/components/assessment/AssessmentUploadTab', async () => {
  const { createElement } = await import('react');
  return {
    AssessmentUploadTab: (props: AssessmentUploadTabProps) =>
      createElement(
        'section',
        { 'data-testid': 'upload-tab' },
        createElement(
          'button',
          {
            type: 'button',
            onClick: () => void props.onUploadSuccess({ ...props.assessment, dataStatus: 'RECEIVED', activeDataVersionId: 'DV-2' })
          },
          'stub upload'
        ),
        createElement('button', { type: 'button', onClick: () => props.onCancel?.() }, 'stub upload cancel')
      )
  };
});

const ASSESSMENT_ID = 'AIC-2026-0001';

const baseAssessment: AssessmentRecord = {
  assessmentId: ASSESSMENT_ID,
  customerName: 'Varroc Polymers (VGT)',
  industry: 'Automotive & Polymers',
  assessmentPeriodStart: 'April 2021',
  assessmentPeriodEnd: 'January 2022',
  ndaStatus: 'SIGNED',
  dataStatus: 'VALIDATED',
  assignedAnalyst: 'analyst@procucev.com',
  status: 'AWAITING_REVIEW',
  activeDataVersionId: 'DV-1',
  activeAnalysisRunId: 'RUN-1',
  createdAt: '2026-04-01T09:00:00.000Z',
  updatedAt: '2026-04-01T10:00:00.000Z'
};

function makeRun(overrides: Partial<AssessmentAnalysisRun> = {}): AssessmentAnalysisRun {
  return {
    analysisRunId: 'RUN-1',
    assessmentId: ASSESSMENT_ID,
    dataVersionId: 'DV-1',
    status: 'COMPLETED',
    totalSpendCr: 100,
    validatedSpendCr: 95,
    potentialSavingsCr: 10,
    savingsPct: 10,
    reviewGates: [],
    allGatesPassed: true,
    isApproved: false,
    isSuperseded: false,
    createdAt: '2026-04-01T09:00:00.000Z',
    ...overrides
  };
}

function makeAuditLog(id: string): AssessmentAuditLog {
  return {
    id,
    assessmentId: ASSESSMENT_ID,
    actorEmail: 'admin@procucev.com',
    actorRole: 'INTERNAL_ADMIN',
    action: 'ASSESSMENT_CREATED',
    timestamp: '2026-04-01T09:00:00.000Z'
  };
}

const deliveryPackage: DeliveryPackageResult = {
  assessmentId: ASSESSMENT_ID,
  analysisRunId: 'RUN-1',
  dataVersionId: 'DV-1',
  customerName: 'Varroc Polymers (VGT)',
  packageTitle: 'Certified Delivery Package',
  generatedAt: '2026-04-02T09:00:00.000Z',
  approvedBy: 'analyst@procucev.com',
  approvedAt: '2026-04-02T08:00:00.000Z',
  items: []
};

function createDeferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
} {
  let resolve: (value: T) => void = () => undefined;
  let reject: (reason: unknown) => void = () => undefined;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function logEntry(level: LogLevel, message: string): FrontendLogEntry {
  return { timestamp: '2026-10-11T12:00:00.000Z', level, service: 'consulting-frontend', message };
}

// Keeps logger output out of test runs while leaving the spies available for assertions.
function silenceLogger(): void {
  vi.spyOn(frontendLogger, 'debug').mockImplementation((message) => logEntry('debug', message));
  vi.spyOn(frontendLogger, 'info').mockImplementation((message) => logEntry('info', message));
  vi.spyOn(frontendLogger, 'warn').mockImplementation((message) => logEntry('warn', message));
  vi.spyOn(frontendLogger, 'error').mockImplementation((message) => logEntry('error', message));
}

describe('AssessmentDetailWorkflow', () => {
  const onBack = vi.fn();
  const onUpdate = vi.fn();
  const getAssessmentById = vi.mocked(assessmentApiClient.getAssessmentById);
  const getAuditLogs = vi.mocked(assessmentApiClient.getAuditLogs);
  const saveReviewGate = vi.mocked(assessmentApiClient.saveReviewGate);

  const renderWorkflow = (): ReturnType<typeof render> =>
    render(<AssessmentDetailWorkflow assessmentId={ASSESSMENT_ID} onBack={onBack} onUpdate={onUpdate} />);

  const heading = (): Promise<HTMLElement> =>
    screen.findByRole('heading', { level: 1, name: baseAssessment.customerName });

  const tabButton = (label: string): HTMLElement =>
    screen.getByRole('button', { name: (name) => name.startsWith(label) });

  const pipelineTab = (): HTMLElement | null => screen.queryByTestId('pipeline-tab');
  const uploadTab = (): HTMLElement | null => screen.queryByTestId('upload-tab');

  beforeEach(() => {
    vi.clearAllMocks();
    silenceLogger();
    getAssessmentById.mockResolvedValue(baseAssessment);
    getAuditLogs.mockResolvedValue([makeAuditLog('log-1')]);
    vi.mocked(assessmentApiClient.getReviewGates).mockResolvedValue([]);
    saveReviewGate.mockResolvedValue([]);
  });

  describe('loading and data normalization', () => {
    it('shows the loading message until the assessment resolves', async () => {
      const pending = createDeferred<AssessmentRecord>();
      getAssessmentById.mockReturnValue(pending.promise);
      renderWorkflow();

      expect(screen.getByText(UI_STRINGS.common.loading)).toBeInTheDocument();

      await act(async () => {
        pending.resolve(baseAssessment);
      });
      expect(await heading()).toBeInTheDocument();
    });

    it('keeps the loading message when the response contains no assessment', async () => {
      getAssessmentById.mockResolvedValue(null);
      renderWorkflow();

      await waitFor(() => expect(getAuditLogs).toHaveBeenCalledWith(ASSESSMENT_ID));
      expect(screen.getByText(UI_STRINGS.common.loading)).toBeInTheDocument();
    });

    it('unwraps a wrapped response and uses its runs and embedded audit logs', async () => {
      getAssessmentById.mockResolvedValue({
        assessment: baseAssessment,
        runs: [makeRun()],
        auditLogs: [makeAuditLog('log-1'), makeAuditLog('log-2')]
      } as unknown as AssessmentRecord);
      renderWorkflow();

      expect(await heading()).toBeInTheDocument();
      expect(screen.getByTestId('pipeline-run')).toHaveTextContent('RUN-1');
      expect(getAuditLogs).not.toHaveBeenCalled();
      expect(
        screen.getByRole('button', { name: `${UI_STRINGS.ASSESSMENT.detail.tabs.auditTrail} (2)` })
      ).toBeInTheDocument();
    });

    it('fetches audit logs separately when the response does not include them', async () => {
      renderWorkflow();

      expect(await heading()).toBeInTheDocument();
      expect(getAuditLogs).toHaveBeenCalledWith(ASSESSMENT_ID);
      expect(screen.getByTestId('pipeline-run')).toHaveTextContent('no-run');
    });

    it('opens the upload tab when no data version is active', async () => {
      getAssessmentById.mockResolvedValue({ ...baseAssessment, activeDataVersionId: undefined });
      renderWorkflow();

      expect(await screen.findByTestId('upload-tab')).toBeInTheDocument();
      expect(pipelineTab()).not.toBeInTheDocument();
    });

    it('opens the upload tab while the data is still awaited', async () => {
      getAssessmentById.mockResolvedValue({ ...baseAssessment, dataStatus: 'AWAITING_DATA' });
      renderWorkflow();

      expect(await screen.findByTestId('upload-tab')).toBeInTheDocument();
    });

    it('opens the pipeline tab for an assessment that already has data', async () => {
      renderWorkflow();

      expect(await screen.findByTestId('pipeline-tab')).toBeInTheDocument();
      expect(uploadTab()).not.toBeInTheDocument();
    });

    it('loads the delivery package when the assessment is already approved', async () => {
      getAssessmentById.mockResolvedValue({ ...baseAssessment, status: 'APPROVED' });
      vi.mocked(assessmentApiClient.generateDeliveryPackage).mockResolvedValue(deliveryPackage);
      renderWorkflow();

      expect(await heading()).toBeInTheDocument();
      await waitFor(() => expect(assessmentApiClient.generateDeliveryPackage).toHaveBeenCalledWith(ASSESSMENT_ID));
    });

    it('does not generate a delivery package for an assessment that is not approved', async () => {
      renderWorkflow();

      expect(await heading()).toBeInTheDocument();
      expect(assessmentApiClient.generateDeliveryPackage).not.toHaveBeenCalled();
    });

    it('logs a failed load and keeps showing the loading message', async () => {
      getAssessmentById.mockRejectedValue(new Error('Assessment service unavailable'));
      renderWorkflow();

      await waitFor(() =>
        expect(frontendLogger.error).toHaveBeenCalledWith(expect.any(String), {
          error: expect.any(Error),
          assessmentId: ASSESSMENT_ID
        })
      );
      expect(screen.getByText(UI_STRINGS.common.loading)).toBeInTheDocument();
    });

    it('does not update state after unmount but still finishes the delivery package request', async () => {
      const pending = createDeferred<AssessmentRecord>();
      getAssessmentById.mockReturnValue(pending.promise);
      vi.mocked(assessmentApiClient.generateDeliveryPackage).mockResolvedValue(deliveryPackage);
      const { unmount } = renderWorkflow();

      unmount();
      await act(async () => {
        pending.resolve({ ...baseAssessment, status: 'APPROVED' });
      });

      await waitFor(() => expect(assessmentApiClient.generateDeliveryPackage).toHaveBeenCalledWith(ASSESSMENT_ID));
    });
  });

  describe('tabs and navigation', () => {
    it('switches between every tab and shows its content', async () => {
      renderWorkflow();
      await heading();

      fireEvent.click(tabButton(UI_STRINGS.ASSESSMENT.detail.tabs.reviewChecklist));
      expect(pipelineTab()).not.toBeInTheDocument();

      fireEvent.click(tabButton(UI_STRINGS.ASSESSMENT.detail.tabs.deliveryPackage));
      expect(screen.getByText(UI_STRINGS.ASSESSMENT.delivery.packageTitle)).toBeInTheDocument();

      fireEvent.click(tabButton(UI_STRINGS.ASSESSMENT.detail.tabs.auditTrail));
      expect(screen.getByText('ASSESSMENT_CREATED')).toBeInTheDocument();

      fireEvent.click(tabButton(UI_STRINGS.ASSESSMENT.detail.tabs.upload));
      expect(uploadTab()).toBeInTheDocument();

      fireEvent.click(tabButton(UI_STRINGS.ASSESSMENT.detail.tabs.workflow));
      expect(pipelineTab()).toBeInTheDocument();
    });

    it('returns to the assessment list from the back link and from the upload cancel control', async () => {
      renderWorkflow();
      await heading();

      fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.ASSESSMENT.btnBack }));
      expect(onBack).toHaveBeenCalledTimes(1);

      fireEvent.click(tabButton(UI_STRINGS.ASSESSMENT.detail.tabs.upload));
      fireEvent.click(screen.getByRole('button', { name: 'stub upload cancel' }));
      expect(onBack).toHaveBeenCalledTimes(2);
    });

    it('persists checklist evidence and surfaces D1 review errors', async () => {
      renderWorkflow();
      await heading();
      fireEvent.click(tabButton(UI_STRINGS.ASSESSMENT.detail.tabs.reviewChecklist));
      fireEvent.change(screen.getByLabelText(`${MODULE_GATES_LIST[0].name}: ${UI_STRINGS.assessmentChecklist.evidenceReferenceLabel}`), {
        target: { value: 'D1:AssessmentDataVersion/DV-1' }
      });
      fireEvent.click(screen.getAllByRole('button', { name: UI_STRINGS.assessmentChecklist.markPassed })[0]);
      await waitFor(() => expect(saveReviewGate).toHaveBeenCalledWith(ASSESSMENT_ID, expect.objectContaining({
        gateKey: MODULE_GATES_LIST[0].key, status: 'PASSED', evidenceReference: 'D1:AssessmentDataVersion/DV-1'
      })));

      saveReviewGate.mockRejectedValueOnce(new Error('D1 review write failed'));
      fireEvent.change(screen.getByLabelText(`${MODULE_GATES_LIST[1].name}: ${UI_STRINGS.assessmentChecklist.reviewNoteLabel}`), {
        target: { value: 'Awaiting source evidence' }
      });
      fireEvent.click(screen.getAllByRole('button', { name: UI_STRINGS.assessmentChecklist.markBlocked })[1]);
      expect(await screen.findByText('D1 review write failed')).toBeInTheDocument();
    });

    it('refreshes runs and audit logs after an upload and moves to the pipeline', async () => {
      renderWorkflow();
      await heading();
      fireEvent.click(tabButton(UI_STRINGS.ASSESSMENT.detail.tabs.upload));

      fireEvent.click(screen.getByRole('button', { name: 'stub upload' }));

      expect(await screen.findByTestId('pipeline-tab')).toBeInTheDocument();
      expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ dataStatus: 'RECEIVED' }));
      expect(getAssessmentById).toHaveBeenCalledTimes(2);
      expect(getAuditLogs).toHaveBeenCalledTimes(2);
    });

    it('still moves to the pipeline and logs when the post-upload refresh fails', async () => {
      getAssessmentById.mockResolvedValueOnce(baseAssessment).mockRejectedValueOnce(new Error('Refresh failed'));
      renderWorkflow();
      await heading();
      fireEvent.click(tabButton(UI_STRINGS.ASSESSMENT.detail.tabs.upload));

      fireEvent.click(screen.getByRole('button', { name: 'stub upload' }));

      expect(await screen.findByTestId('pipeline-tab')).toBeInTheDocument();
      expect(frontendLogger.error).toHaveBeenCalledWith(expect.any(String), { err: expect.any(Error) });
    });
  });

  describe('NDA, data status, and analysis actions', () => {
    it('updates the NDA status and reports the change to the parent', async () => {
      vi.mocked(assessmentApiClient.updateNdaStatus).mockResolvedValue({ ...baseAssessment, ndaStatus: 'SIGNED' });
      renderWorkflow();
      await heading();

      fireEvent.click(screen.getByRole('button', { name: 'stub nda' }));

      await waitFor(() => expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ ndaStatus: 'SIGNED' })));
      expect(assessmentApiClient.updateNdaStatus).toHaveBeenCalledWith(ASSESSMENT_ID, 'SIGNED');
      expect(getAuditLogs).toHaveBeenCalledTimes(2);
    });

    it('shows the error message when the NDA update fails', async () => {
      vi.mocked(assessmentApiClient.updateNdaStatus).mockRejectedValue(new Error('NDA service unavailable'));
      renderWorkflow();
      await heading();

      fireEvent.click(screen.getByRole('button', { name: 'stub nda' }));

      expect(await screen.findByText('NDA service unavailable')).toBeInTheDocument();
      expect(onUpdate).not.toHaveBeenCalled();
      expect(getAuditLogs).toHaveBeenCalledTimes(1);
    });

    it('handles an NDA failure that is not an Error and clears the processing flag', async () => {
      vi.mocked(assessmentApiClient.updateNdaStatus).mockRejectedValue('timeout');
      renderWorkflow();
      await heading();

      fireEvent.click(screen.getByRole('button', { name: 'stub nda' }));

      await waitFor(() => expect(screen.getByTestId('pipeline-processing')).toHaveTextContent('false'));
      expect(getAuditLogs).toHaveBeenCalledTimes(1);
      expect(onUpdate).not.toHaveBeenCalled();
    });

    it('updates the data status and reports the change to the parent', async () => {
      vi.mocked(assessmentApiClient.updateDataStatus).mockResolvedValue({ ...baseAssessment, dataStatus: 'VALIDATED' });
      renderWorkflow();
      await heading();

      fireEvent.click(screen.getByRole('button', { name: 'stub data' }));

      await waitFor(() => expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ dataStatus: 'VALIDATED' })));
      expect(assessmentApiClient.updateDataStatus).toHaveBeenCalledWith(ASSESSMENT_ID, 'VALIDATED');
    });

    it('shows the error message when the data status update fails', async () => {
      vi.mocked(assessmentApiClient.updateDataStatus).mockRejectedValue(new Error('Data service unavailable'));
      renderWorkflow();
      await heading();

      fireEvent.click(screen.getByRole('button', { name: 'stub data' }));

      expect(await screen.findByText('Data service unavailable')).toBeInTheDocument();
    });

    it('handles a data status failure that is not an Error', async () => {
      vi.mocked(assessmentApiClient.updateDataStatus).mockRejectedValue(404);
      renderWorkflow();
      await heading();

      fireEvent.click(screen.getByRole('button', { name: 'stub data' }));

      await waitFor(() => expect(screen.getByTestId('pipeline-processing')).toHaveTextContent('false'));
      expect(onUpdate).not.toHaveBeenCalled();
    });

    it('runs the analysis and shows the new active run', async () => {
      getAssessmentById
        .mockResolvedValueOnce(baseAssessment)
        .mockResolvedValueOnce({
          assessment: { ...baseAssessment, activeAnalysisRunId: 'RUN-2' },
          runs: [makeRun({ analysisRunId: 'RUN-2' })]
        } as unknown as AssessmentRecord);
      vi.mocked(assessmentApiClient.runAnalysis).mockResolvedValue(makeRun({ analysisRunId: 'RUN-2' }));
      renderWorkflow();
      await heading();

      fireEvent.click(screen.getByRole('button', { name: 'stub run' }));

      await waitFor(() => expect(screen.getByTestId('pipeline-run')).toHaveTextContent('RUN-2'));
      expect(assessmentApiClient.runAnalysis).toHaveBeenCalledWith(ASSESSMENT_ID);
      expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ activeAnalysisRunId: 'RUN-2' }));
    });

    it('ignores superseded runs when choosing the active run', async () => {
      getAssessmentById.mockResolvedValue({
        assessment: baseAssessment,
        runs: [makeRun({ isSuperseded: true })]
      } as unknown as AssessmentRecord);
      renderWorkflow();

      expect(await screen.findByTestId('pipeline-run')).toHaveTextContent('no-run');
    });

    it('shows the error message when the analysis run fails', async () => {
      vi.mocked(assessmentApiClient.runAnalysis).mockRejectedValue(new Error('Engine offline'));
      renderWorkflow();
      await heading();

      fireEvent.click(screen.getByRole('button', { name: 'stub run' }));

      expect(await screen.findByText('Engine offline')).toBeInTheDocument();
      expect(getAssessmentById).toHaveBeenCalledTimes(1);
    });

    it('handles an analysis failure that is not an Error', async () => {
      vi.mocked(assessmentApiClient.runAnalysis).mockRejectedValue(undefined);
      renderWorkflow();
      await heading();

      fireEvent.click(screen.getByRole('button', { name: 'stub run' }));

      await waitFor(() => expect(screen.getByTestId('pipeline-processing')).toHaveTextContent('false'));
      expect(onUpdate).not.toHaveBeenCalled();
    });
  });

  describe('approval', () => {
    it('opens the approval dialog for an assessment awaiting review', async () => {
      renderWorkflow();
      await heading();

      fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.ASSESSMENT.detail.btnApprove }));

      expect(screen.getByRole('heading', { name: UI_STRINGS.ASSESSMENT.modalApprove.title })).toBeInTheDocument();
    });

    it('approves with the entered analyst details, then shows the delivery package', async () => {
      vi.mocked(assessmentApiClient.approveAssessment).mockResolvedValue({ ...baseAssessment, status: 'APPROVED' });
      vi.mocked(assessmentApiClient.generateDeliveryPackage).mockResolvedValue(deliveryPackage);
      renderWorkflow();
      await heading();

      fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.ASSESSMENT.detail.btnApprove }));
      const [emailInput, commentInput] = screen.getAllByRole('textbox');
      fireEvent.change(emailInput, { target: { value: 'approver@procucev.com' } });
      fireEvent.change(commentInput, { target: { value: 'All gates reviewed.' } });
      fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.ASSESSMENT.modalApprove.btnConfirmApprove }));

      expect(await screen.findByText(UI_STRINGS.ASSESSMENT.delivery.packageTitle)).toBeInTheDocument();
      expect(assessmentApiClient.approveAssessment).toHaveBeenCalledWith(ASSESSMENT_ID, {
        approvedBy: 'approver@procucev.com',
        approvalComment: 'All gates reviewed.'
      });
      expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'APPROVED' }));
      expect(
        screen.queryByRole('heading', { name: UI_STRINGS.ASSESSMENT.modalApprove.title })
      ).not.toBeInTheDocument();
    });

    it('keeps the approval dialog open and shows the error when approval fails', async () => {
      vi.mocked(assessmentApiClient.approveAssessment).mockRejectedValue(new Error('Approval rejected by gate'));
      renderWorkflow();
      await heading();

      fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.ASSESSMENT.detail.btnApprove }));
      fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.ASSESSMENT.modalApprove.btnConfirmApprove }));

      expect(await screen.findByText('Approval rejected by gate')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: UI_STRINGS.ASSESSMENT.modalApprove.title })).toBeInTheDocument();
      expect(onUpdate).not.toHaveBeenCalled();
    });

    it('handles an approval failure that is not an Error', async () => {
      vi.mocked(assessmentApiClient.approveAssessment).mockRejectedValue('denied');
      renderWorkflow();
      await heading();

      fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.ASSESSMENT.detail.btnApprove }));
      fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.ASSESSMENT.modalApprove.btnConfirmApprove }));

      await waitFor(() =>
        expect(screen.getByRole('button', { name: UI_STRINGS.ASSESSMENT.modalApprove.btnConfirmApprove })).toBeEnabled()
      );
      expect(onUpdate).not.toHaveBeenCalled();
    });

    it('closes the approval dialog with cancel', async () => {
      renderWorkflow();
      await heading();

      fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.ASSESSMENT.detail.btnApprove }));
      fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.ASSESSMENT.modalApprove.btnCancel }));

      expect(
        screen.queryByRole('heading', { name: UI_STRINGS.ASSESSMENT.modalApprove.title })
      ).not.toBeInTheDocument();
      expect(assessmentApiClient.approveAssessment).not.toHaveBeenCalled();
    });

    it('offers package generation instead of approval once the assessment is approved', async () => {
      getAssessmentById.mockResolvedValue({ ...baseAssessment, status: 'APPROVED' });
      vi.mocked(assessmentApiClient.generateDeliveryPackage).mockResolvedValue(deliveryPackage);
      renderWorkflow();
      await heading();

      expect(screen.queryByRole('button', { name: UI_STRINGS.ASSESSMENT.detail.btnApprove })).not.toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: UI_STRINGS.ASSESSMENT.detail.btnGeneratePackage })
      ).toBeInTheDocument();
    });
  });

  describe('delivery package generation', () => {
    it('generates the package from an approved assessment and shows the delivery tab', async () => {
      getAssessmentById.mockResolvedValue({ ...baseAssessment, status: 'DELIVERED' });
      vi.mocked(assessmentApiClient.generateDeliveryPackage).mockResolvedValue(deliveryPackage);
      renderWorkflow();
      await heading();

      fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.ASSESSMENT.detail.btnGeneratePackage }));

      expect(await screen.findByText(UI_STRINGS.ASSESSMENT.delivery.packageTitle)).toBeInTheDocument();
      expect(assessmentApiClient.generateDeliveryPackage).toHaveBeenCalledTimes(2);
    });

    it('shows the error message when package generation fails', async () => {
      getAssessmentById.mockResolvedValue({ ...baseAssessment, status: 'APPROVED' });
      vi.mocked(assessmentApiClient.generateDeliveryPackage)
        .mockResolvedValueOnce(deliveryPackage)
        .mockRejectedValueOnce(new Error('Package storage full'));
      renderWorkflow();
      await heading();

      fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.ASSESSMENT.detail.btnGeneratePackage }));

      expect(await screen.findByText('Package storage full')).toBeInTheDocument();
    });

    it('handles a package failure that is not an Error', async () => {
      getAssessmentById.mockResolvedValue({ ...baseAssessment, status: 'APPROVED' });
      vi.mocked(assessmentApiClient.generateDeliveryPackage)
        .mockResolvedValueOnce(deliveryPackage)
        .mockRejectedValueOnce('gateway');
      renderWorkflow();
      await heading();

      fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.ASSESSMENT.detail.btnGeneratePackage }));

      await waitFor(() =>
        expect(screen.getByRole('button', { name: UI_STRINGS.ASSESSMENT.detail.btnGeneratePackage })).toBeEnabled()
      );
      expect(screen.queryByText(UI_STRINGS.ASSESSMENT.delivery.packageTitle)).not.toBeInTheDocument();
    });
  });
});
