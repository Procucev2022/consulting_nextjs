import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ReportAcknowledgementSection } from '../../../src/components/orchestration/ReportAcknowledgementSection';
import { orchestrationApi } from '../../../src/utils/orchestrationApi';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import type { CustomerReportAcknowledgement } from '../../../src/types/analysisOrchestration';

const orchestration = UI_STRINGS.orchestration;
const JOB_ID = 'job-coverage-42';
const REPORT_VERSION_ID = 'RPT-42-v3';
const CORRECTION_CLOSE_DELAY_MS = 2000;

const buildAcknowledgement = (
  overrides: Partial<CustomerReportAcknowledgement> = {}
): CustomerReportAcknowledgement => ({
  acknowledgementId: 'ack-42',
  reportVersionId: REPORT_VERSION_ID,
  tenantId: 'TNT-42',
  userId: 'usr-42',
  userName: 'Sriman Coverage',
  acknowledgedAt: '2026-10-04T12:00:00.000Z',
  status: 'ACKNOWLEDGED',
  ...overrides
});

const pendingForever = <T,>(): Promise<T> => new Promise<T>(() => undefined);

// The header close control and the correction form's icon-only controls have no text content.
const iconOnlyButtons = (): HTMLElement[] =>
  screen.getAllByRole('button').filter((button) => button.textContent?.trim() === '');

const buttonWithText = (text: string): HTMLElement => {
  const button = screen.getByText(text).closest('button');
  if (!button) {
    throw new Error(`No button wraps the text "${text}"`);
  }
  return button;
};

const openCorrectionModal = (): void => {
  fireEvent.click(screen.getByText(orchestration.btnRequestCorrection));
};

const correctionTextboxes = (): { description: HTMLElement; supportingFile: HTMLElement } => {
  const [description, supportingFile] = screen.getAllByRole('textbox');
  if (!description || !supportingFile) {
    throw new Error('Correction form textboxes were not rendered');
  }
  return { description, supportingFile };
};

describe('ReportAcknowledgementSection coverage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('records the acknowledgement, shows the acknowledger, and reports success to the caller', async () => {
    const acknowledgement = buildAcknowledgement();
    const acknowledgeSpy = vi.spyOn(orchestrationApi, 'acknowledgeReport').mockResolvedValue({
      success: true,
      acknowledgement
    });
    const onAcknowledgementSuccess = vi.fn();

    render(
      <ReportAcknowledgementSection
        jobId={JOB_ID}
        reportVersionId={REPORT_VERSION_ID}
        onAcknowledgementSuccess={onAcknowledgementSuccess}
      />
    );

    fireEvent.click(screen.getByText(orchestration.btnAcknowledgeReport));

    expect(await screen.findByText(orchestration.acknowledgementSuccess)).toBeInTheDocument();
    expect(screen.getByText(acknowledgement.userName)).toBeInTheDocument();
    expect(screen.queryByText(orchestration.btnAcknowledgeReport)).not.toBeInTheDocument();
    expect(acknowledgeSpy).toHaveBeenCalledWith(JOB_ID, REPORT_VERSION_ID);
    expect(onAcknowledgementSuccess).toHaveBeenCalledWith(acknowledgement);
  });

  it('acknowledges without a success callback when none is supplied', async () => {
    vi.spyOn(orchestrationApi, 'acknowledgeReport').mockResolvedValue({
      success: true,
      acknowledgement: buildAcknowledgement()
    });

    render(<ReportAcknowledgementSection jobId={JOB_ID} reportVersionId={REPORT_VERSION_ID} />);

    fireEvent.click(screen.getByText(orchestration.btnAcknowledgeReport));

    expect(await screen.findByText(orchestration.acknowledgementSuccess)).toBeInTheDocument();
  });

  it('shows an existing acknowledgement without calling the API', () => {
    const acknowledgeSpy = vi.spyOn(orchestrationApi, 'acknowledgeReport');

    render(
      <ReportAcknowledgementSection
        jobId={JOB_ID}
        reportVersionId={REPORT_VERSION_ID}
        initialAcknowledgement={buildAcknowledgement({ userName: 'Earlier Approver' })}
      />
    );

    expect(screen.getByText(orchestration.acknowledgementSuccess)).toBeInTheDocument();
    expect(screen.getByText('Earlier Approver')).toBeInTheDocument();
    expect(screen.queryByText(orchestration.btnAcknowledgeReport)).not.toBeInTheDocument();
    expect(acknowledgeSpy).not.toHaveBeenCalled();
  });

  it('shows the server message when an acknowledgement is rejected and keeps the action available', async () => {
    vi.spyOn(orchestrationApi, 'acknowledgeReport').mockResolvedValue({
      success: false,
      message: 'Report version RPT-42-v3 is locked for review'
    });

    render(<ReportAcknowledgementSection jobId={JOB_ID} reportVersionId={REPORT_VERSION_ID} />);

    fireEvent.click(screen.getByText(orchestration.btnAcknowledgeReport));

    expect(await screen.findByText('Report version RPT-42-v3 is locked for review')).toBeInTheDocument();
    expect(screen.getByText(orchestration.btnAcknowledgeReport)).toBeInTheDocument();
    expect(screen.queryByText(orchestration.acknowledgementSuccess)).not.toBeInTheDocument();
  });

  it('shows a fallback message when a rejected acknowledgement carries no server message', async () => {
    vi.spyOn(orchestrationApi, 'acknowledgeReport').mockResolvedValue({ success: false });

    render(<ReportAcknowledgementSection jobId={JOB_ID} reportVersionId={REPORT_VERSION_ID} />);

    fireEvent.click(screen.getByText(orchestration.btnAcknowledgeReport));

    expect(await screen.findByText(/Failed to record acknowledgement/)).toBeInTheDocument();
  });

  it('shows the error message from a thrown Error during acknowledgement', async () => {
    vi.spyOn(orchestrationApi, 'acknowledgeReport').mockRejectedValue(
      new Error('Gateway timeout while recording acknowledgement')
    );

    render(<ReportAcknowledgementSection jobId={JOB_ID} reportVersionId={REPORT_VERSION_ID} />);

    fireEvent.click(screen.getByText(orchestration.btnAcknowledgeReport));

    expect(await screen.findByText('Gateway timeout while recording acknowledgement')).toBeInTheDocument();
  });

  it('shows a fallback message when acknowledgement rejects with a non-Error value', async () => {
    vi.spyOn(orchestrationApi, 'acknowledgeReport').mockRejectedValue('connection reset');

    render(<ReportAcknowledgementSection jobId={JOB_ID} reportVersionId={REPORT_VERSION_ID} />);

    fireEvent.click(screen.getByText(orchestration.btnAcknowledgeReport));

    expect(await screen.findByText(/Error acknowledging report/)).toBeInTheDocument();
  });

  it('disables the acknowledgement action while the request is pending', () => {
    vi.spyOn(orchestrationApi, 'acknowledgeReport').mockReturnValue(
      pendingForever<Awaited<ReturnType<typeof orchestrationApi.acknowledgeReport>>>()
    );

    render(<ReportAcknowledgementSection jobId={JOB_ID} reportVersionId={REPORT_VERSION_ID} />);

    const acknowledgeButton = buttonWithText(orchestration.btnAcknowledgeReport);
    fireEvent.click(acknowledgeButton);

    expect(acknowledgeButton).toBeDisabled();
  });

  it('does not submit a correction without a description and keeps the dialog open', () => {
    const requestSpy = vi.spyOn(orchestrationApi, 'requestCorrection');

    render(<ReportAcknowledgementSection jobId={JOB_ID} reportVersionId={REPORT_VERSION_ID} />);

    openCorrectionModal();
    fireEvent.click(screen.getByText(orchestration.btnSubmitCorrection));

    expect(requestSpy).not.toHaveBeenCalled();
    expect(screen.getByText(orchestration.correctionModalTitle)).toBeInTheDocument();
    expect(screen.getByText(/Please provide specific observations/)).toBeInTheDocument();
  });

  it('submits the selected category, description, and supporting file name, then closes after the confirmation delay', async () => {
    const requestSpy = vi.spyOn(orchestrationApi, 'requestCorrection').mockResolvedValue({
      success: true,
      request: {
        requestId: 'req-42',
        analysisJobId: JOB_ID,
        tenantId: 'TNT-42',
        userId: 'usr-42',
        category: 'Supplier Mapping',
        description: 'Vendor ABC was merged into Vendor XYZ in Q2',
        status: 'OPEN',
        createdAt: '2026-10-04T12:00:00.000Z'
      }
    });

    render(<ReportAcknowledgementSection jobId={JOB_ID} reportVersionId={REPORT_VERSION_ID} />);

    openCorrectionModal();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Supplier Mapping' } });
    const { description, supportingFile } = correctionTextboxes();
    fireEvent.change(description, { target: { value: 'Vendor ABC was merged into Vendor XYZ in Q2' } });
    fireEvent.change(supportingFile, { target: { value: 'Revised_Master_Data.xlsx' } });
    fireEvent.click(screen.getByText(orchestration.btnSubmitCorrection));

    expect(await screen.findByText(/Your correction request has been transmitted/)).toBeInTheDocument();
    expect(requestSpy).toHaveBeenCalledWith(JOB_ID, {
      category: 'Supplier Mapping',
      description: 'Vendor ABC was merged into Vendor XYZ in Q2',
      supportingFileName: 'Revised_Master_Data.xlsx'
    });

    await waitFor(
      () => {
        expect(screen.queryByText(orchestration.correctionModalTitle)).not.toBeInTheDocument();
      },
      { timeout: CORRECTION_CLOSE_DELAY_MS + 1000 }
    );
  });

  it('omits the supporting file name when the field is left blank', async () => {
    const requestSpy = vi.spyOn(orchestrationApi, 'requestCorrection').mockResolvedValue({
      success: true
    });

    render(<ReportAcknowledgementSection jobId={JOB_ID} reportVersionId={REPORT_VERSION_ID} />);

    openCorrectionModal();
    fireEvent.change(correctionTextboxes().description, { target: { value: 'Quantity normalisation looks wrong' } });
    fireEvent.click(screen.getByText(orchestration.btnSubmitCorrection));

    expect(await screen.findByText(/Your correction request has been transmitted/)).toBeInTheDocument();
    expect(requestSpy).toHaveBeenCalledWith(JOB_ID, {
      category: 'Data Classification',
      description: 'Quantity normalisation looks wrong',
      supportingFileName: undefined
    });

    await waitFor(
      () => {
        expect(screen.queryByText(orchestration.correctionModalTitle)).not.toBeInTheDocument();
      },
      { timeout: CORRECTION_CLOSE_DELAY_MS + 1000 }
    );
  });

  it('keeps the correction dialog open and shows the server message when the request is rejected', async () => {
    vi.spyOn(orchestrationApi, 'requestCorrection').mockResolvedValue({
      success: false,
      message: 'Correction window closed for this report version'
    });

    render(<ReportAcknowledgementSection jobId={JOB_ID} reportVersionId={REPORT_VERSION_ID} />);

    openCorrectionModal();
    fireEvent.change(correctionTextboxes().description, { target: { value: 'Late correction request' } });
    fireEvent.click(screen.getByText(orchestration.btnSubmitCorrection));

    expect(await screen.findByText('Correction window closed for this report version')).toBeInTheDocument();
    expect(screen.getByText(orchestration.correctionModalTitle)).toBeInTheDocument();
  });

  it('shows the thrown Error message for a failed correction and a fallback for non-Error rejections', async () => {
    vi.spyOn(orchestrationApi, 'requestCorrection').mockRejectedValueOnce(
      new Error('Upstream 503 from the correction service')
    );

    const { unmount } = render(<ReportAcknowledgementSection jobId={JOB_ID} reportVersionId={REPORT_VERSION_ID} />);
    openCorrectionModal();
    fireEvent.change(correctionTextboxes().description, { target: { value: 'Outage check' } });
    fireEvent.click(screen.getByText(orchestration.btnSubmitCorrection));
    expect(await screen.findByText('Upstream 503 from the correction service')).toBeInTheDocument();
    unmount();

    vi.spyOn(orchestrationApi, 'requestCorrection').mockRejectedValueOnce('socket hang up');
    render(<ReportAcknowledgementSection jobId={JOB_ID} reportVersionId={REPORT_VERSION_ID} />);
    openCorrectionModal();
    fireEvent.change(correctionTextboxes().description, { target: { value: 'Outage check' } });
    fireEvent.click(screen.getByText(orchestration.btnSubmitCorrection));
    expect(await screen.findByText(/Error submitting correction/)).toBeInTheDocument();
  });

  it('disables the correction submit action while the request is pending', () => {
    vi.spyOn(orchestrationApi, 'requestCorrection').mockReturnValue(
      pendingForever<Awaited<ReturnType<typeof orchestrationApi.requestCorrection>>>()
    );

    render(<ReportAcknowledgementSection jobId={JOB_ID} reportVersionId={REPORT_VERSION_ID} />);

    openCorrectionModal();
    fireEvent.change(correctionTextboxes().description, { target: { value: 'Pending check' } });
    const submitButton = buttonWithText(orchestration.btnSubmitCorrection);
    fireEvent.click(submitButton);

    expect(submitButton).toBeDisabled();
  });

  it('closes the correction dialog from its header control and from the cancel button', () => {
    render(<ReportAcknowledgementSection jobId={JOB_ID} reportVersionId={REPORT_VERSION_ID} />);

    openCorrectionModal();
    const [headerCloseControl] = iconOnlyButtons();
    if (!headerCloseControl) {
      throw new Error('Correction dialog header control was not rendered');
    }
    fireEvent.click(headerCloseControl);
    expect(screen.queryByText(orchestration.correctionModalTitle)).not.toBeInTheDocument();

    openCorrectionModal();
    fireEvent.click(screen.getByText(orchestration.btnCancel));
    expect(screen.queryByText(orchestration.correctionModalTitle)).not.toBeInTheDocument();
  });
});
