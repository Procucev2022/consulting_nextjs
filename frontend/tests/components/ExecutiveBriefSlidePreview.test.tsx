import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ExecutiveBriefSlidePreview } from '../../src/components/executiveBrief/ExecutiveBriefSlidePreview';
import { EXECUTIVE_BRIEF_EXPORT_STRINGS } from '../../src/constants/executiveBriefExportStrings';

describe('ExecutiveBriefSlidePreview', () => {
  const defaultProps = {
    selectedSlideIndex: 0,
    onSelectSlideIndex: vi.fn(),
    onOpenFullReport: vi.fn(),
    onDownloadPdf: vi.fn()
  };

  it('renders slide preview tabs and viewport', () => {
    render(<ExecutiveBriefSlidePreview {...defaultProps} />);

    expect(screen.getByText(EXECUTIVE_BRIEF_EXPORT_STRINGS.preview.sectionTitle)).toBeInTheDocument();
    expect(screen.getByTestId('slide-tab-0')).toBeInTheDocument();
    expect(screen.getByTestId('slide-tab-1')).toBeInTheDocument();
  });

  it('handles slide tab selection', () => {
    const onSelectSlideIndex = vi.fn();
    render(<ExecutiveBriefSlidePreview {...defaultProps} onSelectSlideIndex={onSelectSlideIndex} />);

    fireEvent.click(screen.getByTestId('slide-tab-2'));
    expect(onSelectSlideIndex).toHaveBeenCalledWith(2);
  });

  it('handles next and prev navigation controls', () => {
    const onSelectSlideIndex = vi.fn();
    render(
      <ExecutiveBriefSlidePreview
        {...defaultProps}
        selectedSlideIndex={1}
        onSelectSlideIndex={onSelectSlideIndex}
      />
    );

    fireEvent.click(screen.getByTestId('preview-prev-btn'));
    expect(onSelectSlideIndex).toHaveBeenCalledWith(0);

    fireEvent.click(screen.getByTestId('preview-next-btn'));
    expect(onSelectSlideIndex).toHaveBeenCalledWith(2);
  });

  it('handles boundary wrapping for prev and next controls', () => {
    const onSelectSlideIndex = vi.fn();
    const slidesLen = EXECUTIVE_BRIEF_EXPORT_STRINGS.preview.slides.length;

    const { rerender } = render(
      <ExecutiveBriefSlidePreview
        {...defaultProps}
        selectedSlideIndex={0}
        onSelectSlideIndex={onSelectSlideIndex}
      />
    );

    fireEvent.click(screen.getByTestId('preview-prev-btn'));
    expect(onSelectSlideIndex).toHaveBeenCalledWith(slidesLen - 1);

    rerender(
      <ExecutiveBriefSlidePreview
        {...defaultProps}
        selectedSlideIndex={slidesLen - 1}
        onSelectSlideIndex={onSelectSlideIndex}
      />
    );

    fireEvent.click(screen.getByTestId('preview-next-btn'));
    expect(onSelectSlideIndex).toHaveBeenCalledWith(0);
  });

  it('handles out of range selectedSlideIndex fallback', () => {
    render(<ExecutiveBriefSlidePreview {...defaultProps} selectedSlideIndex={999} />);
    expect(screen.getByTestId('slide-tab-0')).toHaveTextContent(
      EXECUTIVE_BRIEF_EXPORT_STRINGS.preview.slides[0].title
    );
  });

  it('triggers onOpenFullReport and onDownloadPdf when buttons clicked', () => {
    const onOpenFullReport = vi.fn();
    const onDownloadPdf = vi.fn();
    render(
      <ExecutiveBriefSlidePreview
        {...defaultProps}
        onOpenFullReport={onOpenFullReport}
        onDownloadPdf={onDownloadPdf}
      />
    );

    fireEvent.click(screen.getByTestId('preview-open-full-btn'));
    expect(onOpenFullReport).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('preview-download-pdf-btn'));
    expect(onDownloadPdf).toHaveBeenCalledTimes(1);
  });
});
