import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IngestionUploadSection } from '../../src/components/IngestionUploadSection';
import { mockTenant, initialIngestionQueue } from '../../src/data/mockData';
import { UI_STRINGS } from '../../src/constants';

const mockIngestionItem = {
  doc_id: 'DOC-9041',
  tenant_id: 'TNT-GLOBAL-8902',
  file_name: 'Purchase_History_Sample.xlsx',
  file_type: 'XLSX' as const,
  file_size_mb: 9.55,
  ocr_status: 'Completed' as const,
  progress: 100,
  uploaded_at: '2026-08-24 09:14:22',
  records_count: 42765,
  detected_currencies: ['INR'],
  converted_inr_crores: 8066.86
};

describe('IngestionUploadSection Component', () => {
  const defaultProps = {
    tenant: mockTenant,
    activeDatasetType: 'Purchase History' as const,
    ingestionQueue: [mockIngestionItem],
    dragActive: false,
    onDrag: vi.fn(),
    onDrop: vi.fn(),
    onFileChange: vi.fn(),
    fileInputRef: { current: null },
    totalEvaluatedSpendInrCr: 8066.86,
    onOpenSetupModal: vi.fn()
  };

  it('renders upload zone and active document queue details', () => {
    render(<IngestionUploadSection {...defaultProps} />);

    expect(screen.getByText(UI_STRINGS.module1.uploadedFileDetails)).toBeInTheDocument();
    expect(screen.getByText(mockIngestionItem.file_name)).toBeInTheDocument();
    expect(screen.getAllByText(/Excluding Header Row/i)[0]).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.module1.setupDetails)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.module1.selectFile)).toBeInTheDocument();
  });

  it('handles drag, drop, and file input events', () => {
    const onDrag = vi.fn();
    const onDrop = vi.fn();
    const onFileChange = vi.fn();
    const onOpenSetupModal = vi.fn();
    const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});

    const { container } = render(
      <IngestionUploadSection
        {...defaultProps}
        onDrag={onDrag}
        onDrop={onDrop}
        onFileChange={onFileChange}
        onOpenSetupModal={onOpenSetupModal}
      />
    );

    const dropZone = container.querySelector('div[class*="border-dashed"]');
    if (dropZone) {
      fireEvent.dragEnter(dropZone);
      expect(onDrag).toHaveBeenCalled();

      fireEvent.drop(dropZone);
      expect(onDrop).toHaveBeenCalled();

      fireEvent.click(dropZone);
      expect(clickSpy).toHaveBeenCalled();
    }

    const setupBtn = screen.getByText(UI_STRINGS.module1.setupDetails);
    fireEvent.click(setupBtn);
    expect(onOpenSetupModal).toHaveBeenCalled();

    const selectFileBtn = screen.getByText(UI_STRINGS.module1.selectFile);
    fireEvent.click(selectFileBtn);
    expect(clickSpy).toHaveBeenCalled();

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fireEvent.change(fileInput);
      expect(onFileChange).toHaveBeenCalled();
    }

    clickSpy.mockRestore();
  });

  it('renders empty queue fallback when ingestionQueue is empty', () => {
    render(<IngestionUploadSection {...defaultProps} ingestionQueue={[]} />);
    expect(screen.getByText(new RegExp(UI_STRINGS.module1.noFileUploaded, 'i'))).toBeInTheDocument();
  });

  it('renders active progress when doc status is Parsing OCR', () => {
    const processingDoc = [
      {
        ...mockIngestionItem,
        ocr_status: 'Parsing OCR' as const,
        progress: 45,
        detected_currencies: undefined
      }
    ];

    render(<IngestionUploadSection {...defaultProps} ingestionQueue={processingDoc} />);
    expect(screen.getByText(new RegExp(UI_STRINGS.module1.processingStatus(45), 'i'))).toBeInTheDocument();
  });

  it('renders document with fallback values when optional fields are omitted or null', () => {
    const fallbackDoc = [
      {
        file_name: 'raw_procurement_data.csv',
        file_type: 'CSV' as const,
        file_size_mb: 2.5,
        doc_id: undefined,
        ocr_status: undefined,
        progress: undefined,
        converted_inr_crores: undefined,
        records_count: undefined,
        detected_currencies: undefined
      }
    ];

    render(<IngestionUploadSection {...defaultProps} ingestionQueue={fallbackDoc as any} />);
    expect(screen.getByText('raw_procurement_data.csv')).toBeInTheDocument();
    expect(screen.getByText(/DOC-INGEST-1/i)).toBeInTheDocument();
    expect(screen.getByText('USD')).toBeInTheDocument();
    expect(screen.getByText('EUR')).toBeInTheDocument();
    expect(screen.getByText('INR')).toBeInTheDocument();
  });

  it('renders styled dropzone when dragActive is true', () => {
    const { container } = render(<IngestionUploadSection {...defaultProps} dragActive={true} />);
    const activeDropZone = container.querySelector('.scale-\\[1\\.01\\]');
    expect(activeDropZone).toBeInTheDocument();
  });

  it('renders strictly only the single active document card even if multiple items exist in ingestionQueue', () => {
    const multipleDocs = [
      {
        ...mockIngestionItem,
        doc_id: 'DOC-ACTIVE-1',
        file_name: 'active_dataset.xlsx'
      },
      {
        ...mockIngestionItem,
        doc_id: 'DOC-OLD-2',
        file_name: 'previous_dataset.xlsx'
      }
    ];

    render(<IngestionUploadSection {...defaultProps} ingestionQueue={multipleDocs} />);
    expect(screen.getByText('active_dataset.xlsx')).toBeInTheDocument();
    expect(screen.queryByText('previous_dataset.xlsx')).not.toBeInTheDocument();
  });
});
