import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ExecutiveBriefFormatCards } from '../../src/components/executiveBrief/ExecutiveBriefFormatCards';
import { EXECUTIVE_BRIEF_EXPORT_STRINGS } from '../../src/constants/executiveBriefExportStrings';

describe('ExecutiveBriefFormatCards', () => {
  const defaultProps = {
    clientName: 'UltraTech Cement Limited',
    pdfAvailable: true,
    pptxAvailable: true,
    isGenerating: false,
    onDownload: vi.fn(),
    onOpenRegenerateModal: vi.fn()
  };

  it('renders PDF and PPTX format cards with actions', () => {
    render(<ExecutiveBriefFormatCards {...defaultProps} />);

    expect(
      screen.getByRole('heading', { name: new RegExp(EXECUTIVE_BRIEF_EXPORT_STRINGS.formats.pdfTitle, 'i') })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: new RegExp(EXECUTIVE_BRIEF_EXPORT_STRINGS.formats.pptxTitle, 'i') })
    ).toBeInTheDocument();
    expect(screen.getByTestId('download-pdf-btn')).toBeInTheDocument();
    expect(screen.getByTestId('download-pptx-btn')).toBeInTheDocument();
  });

  it('triggers onDownload when clicking PDF download button', () => {
    const onDownload = vi.fn();
    render(<ExecutiveBriefFormatCards {...defaultProps} onDownload={onDownload} />);

    fireEvent.click(screen.getByTestId('download-pdf-btn'));
    expect(onDownload).toHaveBeenCalledWith('pdf');
  });

  it('triggers onDownload when clicking PPTX download button', () => {
    const onDownload = vi.fn();
    render(<ExecutiveBriefFormatCards {...defaultProps} onDownload={onDownload} />);

    fireEvent.click(screen.getByTestId('download-pptx-btn'));
    expect(onDownload).toHaveBeenCalledWith('pptx');
  });

  it('triggers onOpenRegenerateModal when clicking regenerate button', () => {
    const onOpenRegenerateModal = vi.fn();
    render(<ExecutiveBriefFormatCards {...defaultProps} onOpenRegenerateModal={onOpenRegenerateModal} />);

    fireEvent.click(screen.getByTestId('admin-regenerate-brief-btn'));
    expect(onOpenRegenerateModal).toHaveBeenCalledTimes(1);
  });

  it('displays generate action text when pptxAvailable is false', () => {
    render(<ExecutiveBriefFormatCards {...defaultProps} pptxAvailable={false} />);
    expect(
      screen.getByText(EXECUTIVE_BRIEF_EXPORT_STRINGS.formats.pptxGenerateAction)
    ).toBeInTheDocument();
  });
});
