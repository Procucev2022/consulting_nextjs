import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IngestionUploadSection } from '../../src/components/IngestionUploadSection';
import { mockTenant } from '../fixtures/mockData';
import { UI_STRINGS } from '../../src/constants/uiStrings';
import type { RawDocumentIngestion } from '../../src/types';

const module1 = UI_STRINGS.module1;

const buildDocument = (overrides: Partial<RawDocumentIngestion> = {}): RawDocumentIngestion => ({
  doc_id: 'DOC-COVERAGE-7',
  tenant_id: 'TNT-GLOBAL-8902',
  file_name: 'Coverage_Purchase_History.xlsx',
  file_type: 'XLSX',
  file_size_mb: 4.25,
  ocr_status: 'Completed',
  progress: 100,
  uploaded_at: '2026-08-24 09:14:22',
  records_count: 1200,
  detected_currencies: ['INR'],
  converted_inr_crores: 12.5,
  ...overrides
});

const buildProps = (
  overrides: Partial<React.ComponentProps<typeof IngestionUploadSection>> = {}
): React.ComponentProps<typeof IngestionUploadSection> => ({
  tenant: mockTenant,
  activeDatasetType: 'Purchase History',
  ingestionQueue: [buildDocument()],
  dragActive: false,
  onDrag: vi.fn(),
  onDrop: vi.fn(),
  onFileChange: vi.fn(),
  fileInputRef: { current: null },
  totalEvaluatedSpendInrCr: 12.5,
  onOpenSetupModal: vi.fn(),
  ...overrides
});

describe('IngestionUploadSection coverage', () => {
  it('shows unavailable metadata when D1 omits its format, size, and upload time', () => {
    render(
      <IngestionUploadSection
        {...buildProps({
          ingestionQueue: [buildDocument({
            file_type: '', file_size_mb: 0, uploaded_at: '', doc_id: '', records_count: undefined,
            converted_inr_crores: undefined, detected_currencies: undefined
          })]
        })}
      />
    );

    expect(screen.getByText(module1.uploadMetadata(
      module1.fileTypeUnavailable, module1.fileSizeUnavailable, module1.uploadTimeUnavailable
    ))).toBeInTheDocument();
    expect(screen.getByText(module1.recordCountUnavailable)).toBeInTheDocument();
    expect(screen.getByText(module1.evaluatedSpendUnavailable)).toBeInTheDocument();
    expect(screen.getByText(module1.detectedCurrenciesUnavailable)).toBeInTheDocument();
    expect(screen.getByText(/ID:\s*Unavailable/)).toBeInTheDocument();
  });

  it('shows the processing percentage for a document that is still being parsed', () => {
    render(
      <IngestionUploadSection
        {...buildProps({
          ingestionQueue: [buildDocument({ ocr_status: 'Parsing OCR', progress: 45 })]
        })}
      />
    );

    expect(screen.getByText(module1.uploadProgress(45, 'Parsing OCR'))).toBeInTheDocument();
  });

  it('does not invent a completed progress value when D1 omits progress', () => {
    const { unmount } = render(
      <IngestionUploadSection
        {...buildProps({
          ingestionQueue: [buildDocument({ progress: undefined })]
        })}
      />
    );
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.queryByText(/100%/)).not.toBeInTheDocument();
    unmount();

    render(
      <IngestionUploadSection
        {...buildProps({
          ingestionQueue: [buildDocument({ ocr_status: 'Parsing OCR', progress: undefined })]
        })}
      />
    );
    expect(screen.getByText('Parsing OCR')).toBeInTheDocument();
    expect(screen.queryByText(/100%/)).not.toBeInTheDocument();
  });

  it('deletes the queued document through the delete control when a handler is supplied', () => {
    const onDeleteDocument = vi.fn();
    render(<IngestionUploadSection {...buildProps({ onDeleteDocument })} />);

    fireEvent.click(screen.getByTestId('delete-uploaded-dataset-btn'));

    expect(onDeleteDocument).toHaveBeenCalledTimes(1);
    expect(onDeleteDocument).toHaveBeenCalledWith('DOC-COVERAGE-7');
  });

  it('hides the delete control when no delete handler is supplied', () => {
    render(<IngestionUploadSection {...buildProps()} />);

    expect(screen.queryByTestId('delete-uploaded-dataset-btn')).not.toBeInTheDocument();
  });

  it('shows the identifier as unavailable when D1 has no document identifier', () => {
    render(<IngestionUploadSection {...buildProps({ ingestionQueue: [buildDocument({ doc_id: '' })] })} />);

    expect(screen.getByText(/ID:\s*Unavailable/)).toBeInTheDocument();
  });

  it('shows detected currencies as unavailable when D1 reports none', () => {
    render(
      <IngestionUploadSection
        {...buildProps({ ingestionQueue: [buildDocument({ detected_currencies: undefined })] })}
      />
    );

    expect(screen.getByText(module1.detectedCurrenciesUnavailable)).toBeInTheDocument();
    expect(screen.queryByText('EUR')).not.toBeInTheDocument();
    expect(screen.queryByText('USD')).not.toBeInTheDocument();
  });
});
