import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UploadPrivacyConfirmationBox } from '../../src/components/UploadPrivacyConfirmationBox';
import { UI_STRINGS } from '../../src/constants/uiStrings';

describe('UploadPrivacyConfirmationBox Component (Prompt 254)', () => {
  it('renders default state without expanded details and unchecked checkbox', () => {
    const handleToggle = vi.fn();
    render(<UploadPrivacyConfirmationBox isChecked={false} onToggle={handleToggle} />);

    expect(screen.getByText(UI_STRINGS.enterprisePrivacy.uploadModalTitle)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.enterprisePrivacy.uploadModalBody)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.enterprisePrivacy.viewDetailsLink)).toBeInTheDocument();

    const checkbox = screen.getByRole('checkbox', {
      name: UI_STRINGS.enterprisePrivacy.uploadCheckboxLabel
    });
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    expect(handleToggle).toHaveBeenCalledWith(true);
  });

  it('toggles data protection details panel on button click', () => {
    const handleToggle = vi.fn();
    render(<UploadPrivacyConfirmationBox isChecked={true} onToggle={handleToggle} />);

    const detailsButton = screen.getByRole('button', {
      name: UI_STRINGS.enterprisePrivacy.viewDetailsLink
    });
    fireEvent.click(detailsButton);

    expect(screen.getByText(UI_STRINGS.enterprisePrivacy.hideDetailsLink)).toBeInTheDocument();
    expect(screen.getByText(`• ${UI_STRINGS.enterprisePrivacy.uploadNotice}`)).toBeInTheDocument();
    expect(screen.getByText(`• ${UI_STRINGS.enterprisePrivacy.nonEnrichmentNotice}`)).toBeInTheDocument();
    expect(screen.getByText(`• ${UI_STRINGS.enterprisePrivacy.encryptionNotice}`)).toBeInTheDocument();
    expect(screen.getByText(`• ${UI_STRINGS.enterprisePrivacy.pcbiSeparationNotice}`)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.enterprisePrivacy.hideDetailsLink }));
    expect(screen.queryByText(`• ${UI_STRINGS.enterprisePrivacy.uploadNotice}`)).not.toBeInTheDocument();
  });
});
