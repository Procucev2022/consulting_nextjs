import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ReportAcknowledgementSection } from '../../../src/components/orchestration/ReportAcknowledgementSection';
import { orchestrationApi } from '../../../src/utils/orchestrationApi';
import { UI_STRINGS } from '../../../src/constants';

describe('ReportAcknowledgementSection Component Tests', () => {
  const jobId = 'job-101';
  const reportVersionId = 'RPT-101-v1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders acknowledgement prompt when not acknowledged', () => {
    render(<ReportAcknowledgementSection jobId={jobId} reportVersionId={reportVersionId} />);

    expect(screen.getByTestId('report-acknowledgement-section')).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.orchestration.acknowledgementTitle)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.orchestration.btnAcknowledgeReport)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.orchestration.btnRequestCorrection)).toBeInTheDocument();
  });

  it('handles report acknowledgement button click and displays success banner', async () => {
    vi.spyOn(orchestrationApi, 'acknowledgeReport').mockResolvedValue({
      success: true,
      acknowledgement: {
        acknowledgementId: 'ack-1',
        reportVersionId,
        tenantId: 'TNT-1',
        userId: 'usr-1',
        userName: 'Sriman VP',
        acknowledgedAt: '2026-10-04T12:00:00.000Z',
        status: 'ACKNOWLEDGED'
      }
    });

    const handleSuccess = vi.fn();
    render(
      <ReportAcknowledgementSection
        jobId={jobId}
        reportVersionId={reportVersionId}
        onAcknowledgementSuccess={handleSuccess}
      />
    );

    const ackButton = screen.getByText(UI_STRINGS.orchestration.btnAcknowledgeReport);
    fireEvent.click(ackButton);

    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.orchestration.acknowledgementSuccess)).toBeInTheDocument();
    });

    expect(handleSuccess).toHaveBeenCalledTimes(1);
  });

  it('opens correction modal and submits correction request', async () => {
    vi.spyOn(orchestrationApi, 'requestCorrection').mockResolvedValue({
      success: true,
      request: {
        requestId: 'req-1',
        analysisJobId: jobId,
        tenantId: 'TNT-1',
        userId: 'usr-1',
        category: 'Supplier Mapping',
        description: 'Vendor ABC was merged into Vendor XYZ in Q2',
        status: 'OPEN',
        createdAt: '2026-10-04T12:00:00.000Z'
      }
    });

    render(<ReportAcknowledgementSection jobId={jobId} reportVersionId={reportVersionId} />);

    const requestCorrectionBtn = screen.getByText(UI_STRINGS.orchestration.btnRequestCorrection);
    fireEvent.click(requestCorrectionBtn);

    expect(screen.getByText(UI_STRINGS.orchestration.correctionModalTitle)).toBeInTheDocument();

    const textareas = screen.getAllByRole('textbox');
    const descTextarea = textareas[0];
    fireEvent.change(descTextarea, { target: { value: 'Vendor ABC was merged into Vendor XYZ in Q2' } });

    const submitBtn = screen.getByText(UI_STRINGS.orchestration.btnSubmitCorrection);
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Your correction request has been transmitted to Procucev Operations.')).toBeInTheDocument();
    });
  });
});
