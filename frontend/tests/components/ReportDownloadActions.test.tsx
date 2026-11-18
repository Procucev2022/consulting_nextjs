import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReportDownloadActions } from '../../src/components/presentation/ReportDownloadActions';
import { UI_STRINGS } from '../../src/constants/uiStrings';

describe('ReportDownloadActions', () => {
  it('renders nothing when neither PDF nor PPTX download callback is supplied', () => {
    const { container } = render(<ReportDownloadActions testIdPrefix="empty-actions" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders both PDF and PPTX download buttons and invokes callbacks on click', () => {
    const onDownloadPdf = vi.fn();
    const onDownloadPptx = vi.fn();

    render(
      <ReportDownloadActions
        testIdPrefix="brief-actions"
        onDownloadPdf={onDownloadPdf}
        onDownloadPptx={onDownloadPptx}
        compact
      />
    );

    const pdfBtn = screen.getByTestId('brief-actions-pdf-btn');
    const pptxBtn = screen.getByTestId('brief-actions-pptx-btn');
    expect(pdfBtn).toHaveTextContent(UI_STRINGS.opportunityBrief.downloadReportPdf);
    expect(pptxBtn).toHaveTextContent(UI_STRINGS.opportunityBrief.downloadReportPptx);

    fireEvent.click(pdfBtn);
    fireEvent.click(pptxBtn);
    expect(onDownloadPdf).toHaveBeenCalledTimes(1);
    expect(onDownloadPptx).toHaveBeenCalledTimes(1);
  });

  it('shows active downloading state and disables both buttons while a format is in flight', () => {
    const { rerender } = render(
      <ReportDownloadActions
        testIdPrefix="loading-actions"
        onDownloadPdf={vi.fn()}
        onDownloadPptx={vi.fn()}
        downloadingFormat="pdf"
      />
    );

    const pdfBtn = screen.getByTestId('loading-actions-pdf-btn');
    const pptxBtn = screen.getByTestId('loading-actions-pptx-btn');
    expect(pdfBtn).toBeDisabled();
    expect(pptxBtn).toBeDisabled();
    expect(pdfBtn).toHaveTextContent(UI_STRINGS.opportunityBrief.downloadingReport('PDF'));

    rerender(
      <ReportDownloadActions
        testIdPrefix="loading-actions"
        onDownloadPdf={vi.fn()}
        onDownloadPptx={vi.fn()}
        downloadingFormat="pptx"
      />
    );
    expect(screen.getByTestId('loading-actions-pptx-btn')).toHaveTextContent(
      UI_STRINGS.opportunityBrief.downloadingReport('PPTX')
    );
  });
});
