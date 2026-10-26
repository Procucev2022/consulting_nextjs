import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AssessmentDetailWorkflow from '../../../src/components/assessment/AssessmentDetailWorkflow';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import { assessmentApiClient } from '../../../src/utils/assessmentApi';

vi.mock('../../../src/utils/assessmentApi', () => ({
  assessmentApiClient: {
    getAssessmentById: vi.fn(),
    getAuditLogs: vi.fn(),
    updateNdaStatus: vi.fn(),
    updateDataStatus: vi.fn(),
    runAnalysis: vi.fn(),
    approveAssessment: vi.fn(),
    generateDeliveryPackage: vi.fn()
  }
}));

const mockAssessment = {
  assessmentId: 'AIC-2026-0001',
  customerName: 'Varroc Polymers (VGT)',
  industry: 'Automotive & Polymers',
  assessmentPeriodStart: 'April 2021',
  assessmentPeriodEnd: 'January 2022',
  ndaStatus: 'SIGNED',
  dataStatus: 'VALIDATED',
  assignedAnalyst: 'analyst@procucev.com',
  status: 'AWAITING_REVIEW',
  activeDataVersionId: 'v1',
  activeAnalysisRunId: 'run-001',
  totalSpendCr: 4073.8307,
  validatedSpendCr: 4073.8307,
  potentialSavingsCr: 378.4,
  savingsPct: 9.29,
  createdAt: '2026-04-01T09:00:00.000Z',
  updatedAt: '2026-04-01T10:00:00.000Z'
};

const mockAuditLogs = [
  {
    id: 'log-1',
    assessmentId: 'AIC-2026-0001',
    actorEmail: 'admin@procucev.com',
    actorRole: 'INTERNAL_ADMIN',
    action: 'ASSESSMENT_CREATED',
    timestamp: '2026-04-01T09:00:00.000Z'
  }
];

describe('AssessmentDetailWorkflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (assessmentApiClient.getAssessmentById as ReturnType<typeof vi.fn>).mockResolvedValue(mockAssessment);
    (assessmentApiClient.getAuditLogs as ReturnType<typeof vi.fn>).mockResolvedValue(mockAuditLogs);
  });

  it('renders assessment details and tabs', async () => {
    render(<AssessmentDetailWorkflow assessmentId="AIC-2026-0001" onBack={vi.fn()} onUpdate={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Varroc Polymers (VGT)')).toBeInTheDocument();
      expect(screen.getByText('AIC-2026-0001')).toBeInTheDocument();
    });

    expect(screen.getByText(UI_STRINGS.ASSESSMENT.detail.tabs.workflow)).toBeInTheDocument();
  });

  it('navigates to review checklist tab and displays 8 gates', async () => {
    render(<AssessmentDetailWorkflow assessmentId="AIC-2026-0001" onBack={vi.fn()} onUpdate={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Varroc Polymers (VGT)')).toBeInTheDocument();
    });

    const checklistTab = screen.getByText(`${UI_STRINGS.ASSESSMENT.detail.tabs.reviewChecklist} (26 Gates)`);
    fireEvent.click(checklistTab);

    expect(screen.getByText('Input row reconciliation')).toBeInTheDocument();
    expect(screen.getByText('Module 1')).toBeInTheDocument();
    expect(screen.getByText('Module 4')).toBeInTheDocument();
  });

  it('navigates to audit trail tab', async () => {
    render(<AssessmentDetailWorkflow assessmentId="AIC-2026-0001" onBack={vi.fn()} onUpdate={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Varroc Polymers (VGT)')).toBeInTheDocument();
    });

    const auditTab = screen.getByText(`${UI_STRINGS.ASSESSMENT.detail.tabs.auditTrail} (1)`);
    fireEvent.click(auditTab);

    expect(screen.getByText('ASSESSMENT_CREATED')).toBeInTheDocument();
    expect(screen.getByText(/admin@procucev.com/)).toBeInTheDocument();
  });

  it('navigates to module 1 upload tab when tab button clicked', async () => {
    render(<AssessmentDetailWorkflow assessmentId="AIC-2026-0001" onBack={vi.fn()} onUpdate={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Varroc Polymers (VGT)')).toBeInTheDocument();
    });

    const uploadTab = screen.getByText(UI_STRINGS.ASSESSMENT.detail.tabs.upload);
    fireEvent.click(uploadTab);

    expect(screen.getByText(UI_STRINGS.ASSESSMENT.uploadPipeline.title)).toBeInTheDocument();
  });

  it('defaults to upload tab when assessment has no active data version', async () => {
    (assessmentApiClient.getAssessmentById as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...mockAssessment,
      activeDataVersionId: undefined,
      dataStatus: 'AWAITING_DATA'
    });

    render(<AssessmentDetailWorkflow assessmentId="AIC-2026-0001" onBack={vi.fn()} onUpdate={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.ASSESSMENT.uploadPipeline.title)).toBeInTheDocument();
    });
  });
});
