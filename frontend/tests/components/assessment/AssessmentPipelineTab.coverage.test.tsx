import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AssessmentPipelineTab } from '../../../src/components/assessment/AssessmentPipelineTab';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import type { AssessmentAnalysisRun, AssessmentRecord, AssessmentPipelineTabProps } from '../../../src/types';

const financial = UI_STRINGS.ASSESSMENT.financial;

const baseAssessment: AssessmentRecord = {
  assessmentId: 'AIC-2026-0007',
  customerName: 'Varroc Polymers (VGT)',
  industry: 'Automotive & Polymers',
  assessmentPeriodStart: 'April 2021',
  assessmentPeriodEnd: 'January 2022',
  ndaStatus: 'SIGNED',
  dataStatus: 'VALIDATED',
  assignedAnalyst: 'analyst@procucev.com',
  status: 'AWAITING_REVIEW',
  createdAt: '2026-04-01T09:00:00.000Z',
  updatedAt: '2026-04-01T10:00:00.000Z'
};

const completedRun: AssessmentAnalysisRun = {
  analysisRunId: 'RUN-7',
  assessmentId: 'AIC-2026-0007',
  dataVersionId: 'DV-7',
  status: 'COMPLETED',
  totalSpendCr: 4073.8307,
  validatedSpendCr: 4073.8307,
  addressableSpendCr: 3100.25,
  grossOpportunityCr: 441.833,
  overlapDeductionsCr: 104.067,
  netDefensibleOpportunityCr: 337.766,
  provenOpportunityCr: 210.5,
  deliveryRangeMinCr: 150.2,
  deliveryRangeMaxCr: 190.9,
  pcbiAnalyticalSignalCr: 12.3456,
  potentialSavingsCr: 337.766,
  savingsPct: 8.29,
  reviewGates: [],
  allGatesPassed: true,
  isApproved: false,
  isSuperseded: false,
  createdAt: '2026-04-02T09:00:00.000Z'
};

describe('AssessmentPipelineTab', () => {
  const onNdaChange = vi.fn();
  const onDataStatusChange = vi.fn();
  const onRunAnalysis = vi.fn();

  const renderTab = (overrides: Partial<AssessmentPipelineTabProps> = {}): void => {
    render(
      <AssessmentPipelineTab
        assessment={baseAssessment}
        activeRun={null}
        isProcessing={false}
        onNdaChange={onNdaChange}
        onDataStatusChange={onDataStatusChange}
        onRunAnalysis={onRunAnalysis}
        {...overrides}
      />
    );
  };

  // The control buttons carry hardcoded labels, so they are addressed in DOM order:
  // NDA signed, NDA sent, data received, data validated, run analysis.
  const controlButtons = (): HTMLElement[] => screen.getAllByRole('button');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the pending state and placeholder values when no run exists', () => {
    renderTab();

    expect(screen.getByText(financial.pendingTitle)).toBeInTheDocument();
    expect(screen.getByText(financial.pendingSubtitle)).toBeInTheDocument();
    expect(screen.getAllByText(financial.emptyValue)).toHaveLength(8);
  });

  it('shows the certified metrics for a completed run and hides the pending state', () => {
    renderTab({ activeRun: completedRun });

    expect(screen.queryByText(financial.pendingTitle)).not.toBeInTheDocument();
    expect(screen.getByText('₹4073.8307 Cr')).toBeInTheDocument();
    expect(screen.getByText('₹3100.250 Cr')).toBeInTheDocument();
    expect(screen.getByText('₹441.833 Cr')).toBeInTheDocument();
    expect(screen.getByText('₹104.067 Cr')).toBeInTheDocument();
    expect(screen.getByText('₹337.766 Cr')).toBeInTheDocument();
    expect(screen.getByText('₹210.500 Cr')).toBeInTheDocument();
    expect(screen.getByText('₹12.3456 Cr')).toBeInTheDocument();
  });

  it('falls back to assessment-level figures when the run omits them', () => {
    renderTab({
      activeRun: { ...completedRun, addressableSpendCr: undefined, grossOpportunityCr: undefined },
      assessment: { ...baseAssessment, grossOpportunityCr: 500, addressableSpendCr: 2750.5 }
    });

    expect(screen.getByText('₹500.000 Cr')).toBeInTheDocument();
    expect(screen.getByText('₹2750.500 Cr')).toBeInTheDocument();
  });

  it('shows the delivery band only when both bounds are positive', () => {
    const { rerender } = render(
      <AssessmentPipelineTab
        assessment={baseAssessment}
        activeRun={completedRun}
        isProcessing={false}
        onNdaChange={onNdaChange}
        onDataStatusChange={onDataStatusChange}
        onRunAnalysis={onRunAnalysis}
      />
    );
    expect(screen.getByText('₹150.200–₹190.900 Cr')).toBeInTheDocument();

    rerender(
      <AssessmentPipelineTab
        assessment={baseAssessment}
        activeRun={{ ...completedRun, deliveryRangeMinCr: 0 }}
        isProcessing={false}
        onNdaChange={onNdaChange}
        onDataStatusChange={onDataStatusChange}
        onRunAnalysis={onRunAnalysis}
      />
    );
    expect(screen.getByText(financial.deliveryRangeUnquantified)).toBeInTheDocument();

    rerender(
      <AssessmentPipelineTab
        assessment={baseAssessment}
        activeRun={{ ...completedRun, deliveryRangeMinCr: undefined, deliveryRangeMaxCr: undefined }}
        isProcessing={false}
        onNdaChange={onNdaChange}
        onDataStatusChange={onDataStatusChange}
        onRunAnalysis={onRunAnalysis}
      />
    );
    expect(screen.getByText(financial.deliveryRangeUnquantified)).toBeInTheDocument();
  });

  it('keeps the metric cards visible when the reconciliation inputs are incomplete', () => {
    renderTab({
      activeRun: { ...completedRun, netDefensibleOpportunityCr: undefined }
    });

    expect(screen.getByText('₹441.833 Cr')).toBeInTheDocument();
    expect(screen.getByText('₹104.067 Cr')).toBeInTheDocument();
  });

  it('treats a run identified only by the assessment active run id as completed', () => {
    renderTab({
      assessment: { ...baseAssessment, activeAnalysisRunId: 'RUN-7', grossOpportunityCr: 441.833 }
    });

    expect(screen.queryByText(financial.pendingTitle)).not.toBeInTheDocument();
    expect(screen.getByText('₹441.833 Cr')).toBeInTheDocument();
  });

  it('highlights the NDA and data status that are currently set', () => {
    const { unmount } = render(
      <AssessmentPipelineTab
        assessment={{ ...baseAssessment, ndaStatus: 'SIGNED', dataStatus: 'VALIDATED' }}
        activeRun={null}
        isProcessing={false}
        onNdaChange={onNdaChange}
        onDataStatusChange={onDataStatusChange}
        onRunAnalysis={onRunAnalysis}
      />
    );
    expect(controlButtons()[0]).toHaveClass('bg-emerald-600');
    expect(controlButtons()[3]).toHaveClass('bg-emerald-600');
    unmount();

    const { unmount: unmountSent } = render(
      <AssessmentPipelineTab
        assessment={{ ...baseAssessment, ndaStatus: 'SENT', dataStatus: 'RECEIVED' }}
        activeRun={null}
        isProcessing={false}
        onNdaChange={onNdaChange}
        onDataStatusChange={onDataStatusChange}
        onRunAnalysis={onRunAnalysis}
      />
    );
    expect(controlButtons()[1]).toHaveClass('bg-amber-600');
    expect(controlButtons()[2]).toHaveClass('bg-blue-600');
    unmountSent();

    render(
      <AssessmentPipelineTab
        assessment={{ ...baseAssessment, ndaStatus: 'NOT_REQUESTED', dataStatus: 'AWAITING_DATA' }}
        activeRun={null}
        isProcessing={false}
        onNdaChange={onNdaChange}
        onDataStatusChange={onDataStatusChange}
        onRunAnalysis={onRunAnalysis}
      />
    );
    controlButtons()
      .slice(0, 4)
      .forEach((button) => {
        expect(button).toHaveClass('bg-slate-700');
      });
  });

  it('sends each NDA and data status choice to its handler', () => {
    renderTab();

    fireEvent.click(controlButtons()[0]);
    fireEvent.click(controlButtons()[1]);
    fireEvent.click(controlButtons()[2]);
    fireEvent.click(controlButtons()[3]);

    expect(onNdaChange).toHaveBeenNthCalledWith(1, 'SIGNED');
    expect(onNdaChange).toHaveBeenNthCalledWith(2, 'SENT');
    expect(onDataStatusChange).toHaveBeenNthCalledWith(1, 'RECEIVED');
    expect(onDataStatusChange).toHaveBeenNthCalledWith(2, 'VALIDATED');
  });

  it('runs the analysis from the execution control', () => {
    renderTab();

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.ASSESSMENT.detail.btnRunAnalysis }));

    expect(onRunAnalysis).toHaveBeenCalledTimes(1);
  });

  it('disables the analysis control while processing and leaves status controls enabled', () => {
    renderTab({ isProcessing: true });

    expect(screen.getByRole('button', { name: UI_STRINGS.ASSESSMENT.detail.btnRunAnalysis })).toBeDisabled();
    expect(controlButtons()[0]).toBeEnabled();
  });

  it('shows the test data badge only for test assessments', () => {
    const { unmount } = render(
      <AssessmentPipelineTab
        assessment={{ ...baseAssessment, isTestData: true }}
        activeRun={null}
        isProcessing={false}
        onNdaChange={onNdaChange}
        onDataStatusChange={onDataStatusChange}
        onRunAnalysis={onRunAnalysis}
      />
    );
    expect(screen.getByText(financial.testDataBadge)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.ASSESSMENT.table.badgeTestData)).toBeInTheDocument();
    unmount();

    renderTab({ assessment: { ...baseAssessment, isTestData: false } });
    expect(screen.queryByText(financial.testDataBadge)).not.toBeInTheDocument();
  });
});
