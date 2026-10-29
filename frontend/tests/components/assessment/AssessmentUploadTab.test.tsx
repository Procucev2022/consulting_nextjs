import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AssessmentUploadTab from '../../../src/components/assessment/AssessmentUploadTab';
import { UI_STRINGS, ASSESSMENT_UPLOAD_MAX_MB } from '../../../src/constants';
import { assessmentApiClient } from '../../../src/utils/assessmentApi';
import type { AssessmentRecord } from '../../../src/types';

vi.mock('../../../src/utils/assessmentApi', () => ({
  assessmentApiClient: {
    uploadDataVersion: vi.fn(),
    validateDataset: vi.fn(),
    runModule1: vi.fn()
  }
}));

const mockAssessmentUnsigned: AssessmentRecord = {
  assessmentId: 'AIC-2026-0002',
  customerName: 'Integration Test Textiles Ltd',
  industry: 'Textiles & Apparel',
  assessmentPeriodStart: '2024-01-01',
  assessmentPeriodEnd: '2024-12-31',
  ndaStatus: 'SENT',
  dataStatus: 'AWAITING_DATA',
  assignedAnalyst: 'analyst@procucev.com',
  status: 'DRAFT',
  createdAt: '2026-10-11T10:00:00.000Z',
  updatedAt: '2026-10-11T10:00:00.000Z'
};

const mockAssessmentSigned: AssessmentRecord = {
  ...mockAssessmentUnsigned,
  assessmentId: 'AIC-2026-0003',
  ndaStatus: 'SIGNED',
  dataStatus: 'AWAITING_DATA',
  status: 'IN_PROGRESS'
};

describe('AssessmentUploadTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders customer details, metadata strip, and NDA warning when unsigned', () => {
    render(
      <AssessmentUploadTab
        assessment={mockAssessmentUnsigned}
        onUploadSuccess={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText(UI_STRINGS.ASSESSMENT.uploadPipeline.title)).toBeInTheDocument();
    expect(screen.getByText('Integration Test Textiles Ltd')).toBeInTheDocument();
    expect(screen.getByText('AIC-2026-0002')).toBeInTheDocument();
    expect(screen.getByText('Textiles & Apparel')).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.ASSESSMENT.uploadScreen.ndaWarning)).toBeInTheDocument();
  });

  it('renders without NDA warning when NDA is SIGNED', () => {
    render(
      <AssessmentUploadTab
        assessment={mockAssessmentSigned}
        onUploadSuccess={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.queryByText(UI_STRINGS.ASSESSMENT.uploadScreen.ndaWarning)).not.toBeInTheDocument();
  });

  it('rejects unsupported file format (.pdf)', () => {
    render(
      <AssessmentUploadTab
        assessment={mockAssessmentSigned}
        onUploadSuccess={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    const input = screen.getByTestId('assessment-file-input');
    const invalidFile = new File(['dummy content'], 'report.pdf', { type: 'application/pdf' });
    Object.defineProperty(invalidFile, 'size', { value: 1024 });

    fireEvent.change(input, { target: { files: [invalidFile] } });

    expect(screen.getByText(UI_STRINGS.ASSESSMENT.uploadScreen.invalidFileFormat)).toBeInTheDocument();
  });

  it('rejects oversized file (> 100 MB)', () => {
    render(
      <AssessmentUploadTab
        assessment={mockAssessmentSigned}
        onUploadSuccess={vi.fn()}
      />
    );

    const input = screen.getByTestId('assessment-file-input');
    const largeFile = new File(['huge'], 'huge_spend.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    Object.defineProperty(largeFile, 'size', { value: 105 * 1024 * 1024 });

    fireEvent.change(input, { target: { files: [largeFile] } });

    expect(screen.getByText(UI_STRINGS.ASSESSMENT.uploadScreen.fileTooLarge(ASSESSMENT_UPLOAD_MAX_MB))).toBeInTheDocument();
  });

  it('rejects empty file (0 bytes)', () => {
    render(
      <AssessmentUploadTab
        assessment={mockAssessmentSigned}
        onUploadSuccess={vi.fn()}
      />
    );

    const input = screen.getByTestId('assessment-file-input');
    const emptyFile = new File([], 'empty.csv', { type: 'text/csv' });
    Object.defineProperty(emptyFile, 'size', { value: 0 });

    fireEvent.change(input, { target: { files: [emptyFile] } });

    expect(screen.getByText(UI_STRINGS.ASSESSMENT.uploadScreen.emptyFile)).toBeInTheDocument();
  });

  it('handles file selection, upload, validation, and explicit Module 1 execution cleanly', async () => {
    const onUploadSuccessMock = vi.fn();

    (assessmentApiClient.uploadDataVersion as ReturnType<typeof vi.fn>).mockResolvedValue({
      dataVersionId: 'DV-TEST-001',
      assessment: {
        ...mockAssessmentSigned,
        currentDataVersionId: 'DV-TEST-001',
        dataStatus: 'RECEIVED'
      }
    });

    (assessmentApiClient.validateDataset as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      validationSummary: {
        sourceRowCount: 1000,
        validRowCount: 1000,
        excludedRowCount: 5,
        anomalyRowCount: 2,
        cleanSpendYieldPct: 99.5
      }
    });

    const completedAssessment: AssessmentRecord = {
      ...mockAssessmentSigned,
      currentDataVersionId: 'DV-TEST-001',
      dataStatus: 'VALIDATED',
      validatedSpendCr: 55.4,
      canonicalModule1: {
        sourceRowCount: 1000,
        materialGroups: 15,
        uniqueVendors: 40,
        validFxNormalizedSpendCr: 55.4
      } as any
    };

    (assessmentApiClient.runModule1 as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      assessment: completedAssessment
    });

    render(
      <AssessmentUploadTab
        assessment={mockAssessmentSigned}
        onUploadSuccess={onUploadSuccessMock}
        onCancel={vi.fn()}
      />
    );

    // Initial state: Start Module 1 Analysis is disabled
    const startM1Btn = screen.getByRole('button', { name: UI_STRINGS.ASSESSMENT.uploadPipeline.controls.btnStartModule1 });
    expect(startM1Btn).toBeDisabled();

    // Select file
    const input = screen.getByTestId('assessment-file-input');
    const validFile = new File(['Vendor,Amount\nABC,500'], 'spend.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    Object.defineProperty(validFile, 'size', { value: 500 });
    validFile.arrayBuffer = vi.fn().mockResolvedValue(new TextEncoder().encode('Vendor,Amount\nABC,500').buffer);

    fireEvent.change(input, { target: { files: [validFile] } });

    await waitFor(() => {
      expect(screen.getAllByText('spend.xlsx').length).toBeGreaterThanOrEqual(1);
      // Upload stays disabled until the SHA-256 checksum has been computed.
      expect(screen.getByRole('button', { name: UI_STRINGS.ASSESSMENT.uploadScreen.btnUploadFile })).toBeEnabled();
    });

    // Upload file
    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.ASSESSMENT.uploadScreen.btnUploadFile }));

    await waitFor(() => {
      expect(assessmentApiClient.uploadDataVersion).toHaveBeenCalledWith(
        'AIC-2026-0003',
        expect.objectContaining({
          fileName: 'spend.xlsx',
          fileSize: 500,
          runAnalysisImmediately: false
        })
      );
    });

    // Validate dataset
    const validateBtn = screen.getByRole('button', { name: UI_STRINGS.ASSESSMENT.uploadPipeline.controls.btnValidate });
    await waitFor(() => expect(validateBtn).not.toBeDisabled());
    fireEvent.click(validateBtn);

    await waitFor(() => {
      expect(assessmentApiClient.validateDataset).toHaveBeenCalledWith('AIC-2026-0003', 'DV-TEST-001');
      expect(screen.getByText(UI_STRINGS.ASSESSMENT.uploadScreen.validationPassed((1000).toLocaleString(), '5', '2'))).toBeInTheDocument();
      // Start Module 1 is now enabled
      expect(startM1Btn).not.toBeDisabled();
    });

    // Start Module 1
    fireEvent.click(startM1Btn);

    await waitFor(() => {
      expect(assessmentApiClient.runModule1).toHaveBeenCalledWith('AIC-2026-0003', 'DV-TEST-001');
      expect(onUploadSuccessMock).toHaveBeenCalledWith(completedAssessment);
      expect(screen.getByText(UI_STRINGS.ASSESSMENT.uploadScreen.module1ResultsTitle)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.ASSESSMENT.uploadScreen.validatedSpendValue((55.4).toFixed(4)))).toBeInTheDocument();
    });
  });

  it('displays error and transitions to VALIDATION_FAILED when validation fails', async () => {
    (assessmentApiClient.validateDataset as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: false,
      message: 'Missing mandatory column PO_NUMBER'
    });

    const assessmentWithDv: AssessmentRecord = {
      ...mockAssessmentSigned,
      currentDataVersionId: 'DV-TEST-002',
      dataStatus: 'RECEIVED'
    };

    render(
      <AssessmentUploadTab
        assessment={assessmentWithDv}
        onUploadSuccess={vi.fn()}
      />
    );

    const validateBtn = screen.getByRole('button', { name: UI_STRINGS.ASSESSMENT.uploadPipeline.controls.btnValidate });
    fireEvent.click(validateBtn);

    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.ASSESSMENT.uploadScreen.validationFailed('Missing mandatory column PO_NUMBER'))).toBeInTheDocument();
      expect(screen.getByRole('button', { name: UI_STRINGS.ASSESSMENT.uploadPipeline.controls.btnStartModule1 })).toBeDisabled();
    });
  });

  it('displays error when Module 1 run fails', async () => {
    (assessmentApiClient.runModule1 as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Engine calculation timeout')
    );

    const validatedAssessment: AssessmentRecord = {
      ...mockAssessmentSigned,
      currentDataVersionId: 'DV-TEST-003',
      dataStatus: 'VALIDATED'
    };

    render(
      <AssessmentUploadTab
        assessment={validatedAssessment}
        onUploadSuccess={vi.fn()}
      />
    );

    const startM1Btn = screen.getByRole('button', { name: UI_STRINGS.ASSESSMENT.uploadPipeline.controls.btnStartModule1 });
    expect(startM1Btn).not.toBeDisabled();
    fireEvent.click(startM1Btn);

    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.ASSESSMENT.uploadScreen.module1Failed('Engine calculation timeout'))).toBeInTheDocument();
    });
  });
});
