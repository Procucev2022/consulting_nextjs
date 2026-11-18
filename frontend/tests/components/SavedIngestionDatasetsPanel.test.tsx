import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { SavedIngestionDatasetsPanel } from '../../src/components/SavedIngestionDatasetsPanel';
import { UI_STRINGS } from '../../src/constants';
import type { AssessmentDataVersion, RawDocumentIngestion } from '../../src/types';

const sampleDoc = (overrides: Partial<RawDocumentIngestion> = {}): RawDocumentIngestion => ({
  doc_id: 'DOC-INGEST-1',
  tenant_id: 'TNT-1',
  file_name: 'Enterprise_Procurement_Dataset_3Year.xlsx',
  file_type: 'XLSX',
  file_size_mb: 0.33,
  ocr_status: 'Completed',
  progress: 100,
  uploaded_at: '2026-11-18T05:01:34Z',
  records_count: 450,
  detected_currencies: ['EUR', 'INR', 'USD'],
  converted_inr_crores: 3485.87,
  ...overrides
});

const sampleVersion = (overrides: Partial<AssessmentDataVersion> = {}): AssessmentDataVersion => ({
  dataVersionId: 'DV-001',
  assessmentId: 'ASM-1',
  versionNumber: 1,
  fileName: 'Cement2.xlsx',
  fileSize: 2240000,
  checksum: 'abc',
  filePath: '/assessments/ASM-1/DV-001/Cement2.xlsx',
  uploadedBy: 'analyst@procucev.com',
  uploadedAt: '2026-11-18 06:49:30',
  recordCount: 19670,
  isSuperseded: false,
  ...overrides
});

describe('SavedIngestionDatasetsPanel Component', () => {
  it('renders nothing when neither saved documents nor data versions exist', () => {
    const { container } = render(
      <SavedIngestionDatasetsPanel savedDocuments={[]} savedDataVersions={[]} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('omits the duplicate panel when the sole saved document is already active and no data versions exist', () => {
    const { container } = render(
      <SavedIngestionDatasetsPanel
        savedDocuments={[sampleDoc({ doc_id: 'DOC-ONLY' })]}
        activeDocumentId="DOC-ONLY"
        savedDataVersions={[]}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('lists all previously uploaded saved documents, highlights active one, and invokes callbacks', () => {
    const onSelect = vi.fn();
    const onDelete = vi.fn();
    const docs = [
      sampleDoc({ doc_id: 'DOC-ACTIVE' }),
      sampleDoc({ doc_id: 'DOC-OLD', file_name: 'Legacy_Spend.xlsx', records_count: 30740, converted_inr_crores: 556.53 })
    ];

    render(
      <SavedIngestionDatasetsPanel
        savedDocuments={docs}
        activeDocumentId="DOC-ACTIVE"
        onSelectSavedDocument={onSelect}
        onDeleteDocument={onDelete}
      />
    );

    expect(screen.getByText(UI_STRINGS.module1.savedDatasetsHeading)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.module1.savedDatasetsCount(2))).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.module1.activeDatasetBadge)).toBeInTheDocument();
    expect(screen.getByText('Legacy_Spend.xlsx')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.module1.loadSavedDataset }));
    expect(onSelect).toHaveBeenCalledWith(docs[1]);

    const deleteButtons = screen.getAllByRole('button', { name: UI_STRINGS.profile.deleteDocument });
    fireEvent.click(deleteButtons[1]);
    expect(onDelete).toHaveBeenCalledWith('DOC-OLD');
  });

  it('renders fallback labels for sparse document metadata, loading state, and assessment data versions', () => {
    const sparseDoc = sampleDoc({
      doc_id: 'DOC-SPARSE',
      file_name: '',
      file_type: '',
      file_size_mb: undefined,
      ocr_status: '',
      uploaded_at: '',
      records_count: undefined,
      converted_inr_crores: undefined,
      detected_currencies: undefined
    });
    const versions = [
      sampleVersion({ dataVersionId: 'DV-001', versionNumber: 1, isSuperseded: true, uploadedAt: undefined }),
      sampleVersion({ dataVersionId: 'DV-002', versionNumber: 2, fileName: 'Cement_v2.xlsx', isSuperseded: false })
    ];

    render(
      <SavedIngestionDatasetsPanel
        savedDocuments={[sparseDoc]}
        savedDataVersions={versions}
        activeDocumentId="DV-002"
        onSelectSavedDocument={vi.fn()}
        isLoadingSavedDocument
      />
    );

    expect(screen.getByText(UI_STRINGS.module1.fileNameUnavailable)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.module1.recordCountUnavailable)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.module1.evaluatedSpendUnavailable)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: UI_STRINGS.module1.loadingSavedDataset })).toBeDisabled();
    expect(screen.getByText(UI_STRINGS.module1.savedDataVersionsHeading)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.module1.assessmentVersionActiveBadge)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.module1.assessmentVersionSupersededBadge)).toBeInTheDocument();
  });
});
