import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ExecutiveBriefRegenerateConfirmModal } from '../../src/components/executiveBrief/ExecutiveBriefRegenerateConfirmModal';
import { EXECUTIVE_BRIEF_EXPORT_STRINGS } from '../../src/constants/executiveBriefExportStrings';

describe('ExecutiveBriefRegenerateConfirmModal', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <ExecutiveBriefRegenerateConfirmModal
        isOpen={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        isRegenerating={false}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders confirmation question and triggers onConfirm', () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    render(
      <ExecutiveBriefRegenerateConfirmModal
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        isRegenerating={false}
      />
    );

    expect(screen.getByText(EXECUTIVE_BRIEF_EXPORT_STRINGS.regenerationModal.title)).toBeInTheDocument();
    expect(screen.getByText(EXECUTIVE_BRIEF_EXPORT_STRINGS.regenerationModal.question)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('confirm-regenerate-btn'));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('cancel-regenerate-btn'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
