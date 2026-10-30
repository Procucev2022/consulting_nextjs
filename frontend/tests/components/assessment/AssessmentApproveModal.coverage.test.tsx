import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AssessmentApproveModal } from '../../../src/components/assessment/AssessmentApproveModal';
import { UI_STRINGS } from '../../../src/constants/uiStrings';

type ApproveModalProps = React.ComponentProps<typeof AssessmentApproveModal>;

describe('AssessmentApproveModal', () => {
  const onClose = vi.fn();
  const onConfirm = vi.fn();

  const renderModal = (overrides: Partial<ApproveModalProps> = {}): void => {
    render(
      <AssessmentApproveModal
        isOpen
        isProcessing={false}
        onClose={onClose}
        onConfirm={onConfirm}
        {...overrides}
      />
    );
  };

  const confirmButton = (): HTMLElement =>
    screen.getByRole('button', { name: UI_STRINGS.ASSESSMENT.modalApprove.btnConfirmApprove });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing while closed', () => {
    const { container } = render(
      <AssessmentApproveModal isOpen={false} isProcessing={false} onClose={onClose} onConfirm={onConfirm} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('shows the approval heading, subtitle, and field labels', () => {
    renderModal();

    expect(screen.getByRole('heading', { name: UI_STRINGS.ASSESSMENT.modalApprove.title })).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.ASSESSMENT.modalApprove.subtitle)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.ASSESSMENT.modalApprove.fieldAnalystEmail)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.ASSESSMENT.modalApprove.fieldComment)).toBeInTheDocument();
  });

  it('sends the analyst email and comment after they are edited', () => {
    renderModal();
    const [emailInput, commentInput] = screen.getAllByRole('textbox');

    fireEvent.change(emailInput, { target: { value: 'approver@example.com' } });
    fireEvent.change(commentInput, { target: { value: 'Gates reviewed with the client.' } });
    fireEvent.click(confirmButton());

    expect(onConfirm).toHaveBeenCalledWith('approver@example.com', 'Gates reviewed with the client.');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('sends the prefilled values when neither field is edited', () => {
    renderModal();
    const [emailInput, commentInput] = screen.getAllByRole('textbox');
    const prefilledEmail = (emailInput as HTMLInputElement).value;
    const prefilledComment = (commentInput as HTMLTextAreaElement).value;

    fireEvent.click(confirmButton());

    expect(prefilledEmail).not.toBe('');
    expect(onConfirm).toHaveBeenCalledWith(prefilledEmail, prefilledComment);
  });

  it('does not confirm when the analyst email is not a valid address', () => {
    renderModal();
    const [emailInput] = screen.getAllByRole('textbox');

    fireEvent.change(emailInput, { target: { value: 'not-an-email' } });
    fireEvent.click(confirmButton());

    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('closes without confirming when cancel is clicked', () => {
    renderModal();

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.ASSESSMENT.modalApprove.btnCancel }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('disables confirmation while a request is in progress', () => {
    renderModal({ isProcessing: true });

    expect(confirmButton()).toBeDisabled();
  });
});
