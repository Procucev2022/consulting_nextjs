import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DetailedAnalysisModal } from '../../../src/components/modals/DetailedAnalysisModal';
import { UI_STRINGS } from '../../../src/constants';

describe('DetailedAnalysisModal Component Unit Tests (Prompt 313)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing (null) when isOpen is false', () => {
    const { container } = render(
      <DetailedAnalysisModal
        isOpen={false}
        onClose={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal dialog with 24-48 hour message and badges when isOpen is true', () => {
    const handleClose = vi.fn();
    const handleContinue = vi.fn();

    render(
      <DetailedAnalysisModal
        isOpen={true}
        onClose={handleClose}
        onContinueToModule1={handleContinue}
        job={{
          analysisJobId: 'job-modal-1',
          tenantId: 'TNT-1',
          customerName: 'Acme Corp',
          uploadedBy: 'srini@procucev.com',
          originalUploadId: 'upl-1',
          currentDataVersionId: 'v1',
          module1VersionId: 'm1-v1',
          status: 'MODULE_1_READY',
          createdAt: '2026-10-05T10:00:00.000Z',
          lastUpdatedAt: '2026-10-05T10:00:00.000Z',
          totalSpendCr: 450.0,
          totalTransactions: 1200,
          analysisPeriod: 'FY 2024 - FY 2026',
          slaHoursTarget: 48
        }}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.orchestration.detailedAnalysisInProgressTitle)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.orchestration.statusModule1Ready)).toBeInTheDocument();
    expect(screen.getByText(/Spend Summary Available/i)).toBeInTheDocument();
    expect(screen.getByText(/FY 2024 - FY 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/24 – 48 Hours/i)).toBeInTheDocument();

    const continueBtn = screen.getByText(UI_STRINGS.orchestration.btnContinueToModule1);
    expect(continueBtn).toBeInTheDocument();
    fireEvent.click(continueBtn);
    expect(handleContinue).toHaveBeenCalledTimes(1);
  });

  it('falls back to onViewSpendSummary or onClose when onContinueToModule1 is not provided', () => {
    const handleClose = vi.fn();
    const handleSpend = vi.fn();

    const { rerender } = render(
      <DetailedAnalysisModal
        isOpen={true}
        onClose={handleClose}
        onViewSpendSummary={handleSpend}
      />
    );

    const continueBtn = screen.getByText(UI_STRINGS.orchestration.btnContinueToModule1);
    fireEvent.click(continueBtn);
    expect(handleSpend).toHaveBeenCalledTimes(1);

    // Fallback to onClose if onViewSpendSummary also omitted
    rerender(
      <DetailedAnalysisModal
        isOpen={true}
        onClose={handleClose}
      />
    );
    fireEvent.click(screen.getByText(UI_STRINGS.orchestration.btnContinueToModule1));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('handles close button click', () => {
    const handleClose = vi.fn();

    render(
      <DetailedAnalysisModal
        isOpen={true}
        onClose={handleClose}
      />
    );

    const closeBtn = screen.getByLabelText('Close dialog');
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('handles backdrop click and stops propagation on modal content', () => {
    const handleClose = vi.fn();

    render(
      <DetailedAnalysisModal
        isOpen={true}
        onClose={handleClose}
      />
    );

    const dialog = screen.getByRole('dialog');
    fireEvent.click(dialog);
    expect(handleClose).toHaveBeenCalledTimes(1);

    // Clicking inside content does not close
    const title = screen.getByText(UI_STRINGS.orchestration.detailedAnalysisInProgressTitle);
    fireEvent.click(title);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('handles Escape key to close modal', () => {
    const handleClose = vi.fn();

    render(
      <DetailedAnalysisModal
        isOpen={true}
        onClose={handleClose}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);

    // Non-Escape keys do nothing
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
