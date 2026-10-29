import React from 'react';
import { createHash } from 'crypto';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import AssessmentUploadTab from '../../../src/components/assessment/AssessmentUploadTab';
import {
  UI_STRINGS,
  ASSESSMENT_UPLOAD_MAX_MB,
  ASSESSMENT_CHECKSUM_FALLBACK_HEX,
  DATA_STATUSES
} from '../../../src/constants';
import { assessmentApiClient } from '../../../src/utils/assessmentApi';
import frontendLogger from '../../../src/utils/logger';
import type { AssessmentRecord } from '../../../src/types';

vi.mock('../../../src/utils/assessmentApi', () => ({
  assessmentApiClient: {
    uploadDataVersion: vi.fn(),
    validateDataset: vi.fn(),
    runModule1: vi.fn()
  }
}));

vi.mock('../../../src/utils/logger', () => ({
  default: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
}));

const screenStrings = UI_STRINGS.ASSESSMENT.uploadScreen;
const pipelineStrings = UI_STRINGS.ASSESSMENT.uploadPipeline;
const CSV_CONTENT = 'Vendor,Amount\nABC,500';

const baseAssessment: AssessmentRecord = {
  assessmentId: 'AIC-2026-0003',
  customerName: 'Integration Test Textiles Ltd',
  industry: 'Textiles & Apparel',
  assessmentPeriodStart: '2024-01-01',
  assessmentPeriodEnd: '2024-12-31',
  ndaStatus: 'SIGNED',
  dataStatus: 'AWAITING_DATA',
  assignedAnalyst: 'analyst@procucev.com',
  status: 'IN_PROGRESS',
  createdAt: '2026-10-11T10:00:00.000Z',
  updatedAt: '2026-10-11T10:00:00.000Z'
};

const buildAssessment = (overrides: Partial<AssessmentRecord> = {}): AssessmentRecord => ({
  ...baseAssessment,
  ...overrides
});

const renderTab = (assessment: AssessmentRecord) =>
  render(<AssessmentUploadTab assessment={assessment} onUploadSuccess={vi.fn()} />);

const bufferOf = (content: string): ArrayBuffer => new TextEncoder().encode(content).buffer as ArrayBuffer;

const sha256Hex = (content: string): string => createHash('sha256').update(content).digest('hex');

const makeFile = (content: string, name: string, size?: number): File => {
  const file = new File([content], name, { type: 'text/csv' });
  Object.defineProperty(file, 'size', { value: size ?? new TextEncoder().encode(content).byteLength });
  return file;
};

const withArrayBuffer = (file: File, content: string): File => {
  Object.defineProperty(file, 'arrayBuffer', { value: vi.fn().mockResolvedValue(bufferOf(content)) });
  return file;
};

const selectFile = (file: File): void => {
  fireEvent.change(screen.getByTestId('assessment-file-input'), { target: { files: [file] } });
};

const waitForChecksum = async (content: string): Promise<void> => {
  await waitFor(() => expect(screen.getByText(sha256Hex(content))).toBeInTheDocument());
};

const uploadSelectedFile = async (file: File): Promise<void> => {
  selectFile(file);
  await waitFor(() => expect(screen.getByRole('button', { name: screenStrings.btnUploadFile })).toBeEnabled());
  fireEvent.click(screen.getByRole('button', { name: screenStrings.btnUploadFile }));
};

const validateButton = (): HTMLElement => screen.getByRole('button', { name: pipelineStrings.controls.btnValidate });
const module1Button = (): HTMLElement => screen.getByRole('button', { name: pipelineStrings.controls.btnStartModule1 });

function createDeferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  let reject: (reason: unknown) => void = () => undefined;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return {
    promise,
    resolve: (value: T): void => resolve(value),
    reject: (reason: unknown): void => reject(reason)
  };
}

type FileReaderOutcome = { kind: 'result'; value: ArrayBuffer | string } | { kind: 'error' };

const stubFileReader = (outcome: FileReaderOutcome): void => {
  class StubFileReader {
    result: ArrayBuffer | string | null = null;
    onload: (() => void) | null = null;
    onerror: ((event: unknown) => void) | null = null;

    readAsArrayBuffer(): void {
      this.settle();
    }

    readAsDataURL(): void {
      this.settle();
    }

    private settle(): void {
      queueMicrotask(() => {
        if (outcome.kind === 'error') {
          this.onerror?.(new Event('error'));
          return;
        }
        this.result = outcome.value;
        this.onload?.();
      });
    }
  }
  vi.stubGlobal('FileReader', StubFileReader);
};

describe('AssessmentUploadTab workflow coverage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('initial workflow state and derived metadata', () => {
    it('shows the active data version from the assessment and falls back to NONE without one', () => {
      const { unmount } = renderTab(buildAssessment({ activeDataVersionId: 'DV-ACTIVE-1' }));
      expect(screen.getByText('DV-ACTIVE-1')).toBeInTheDocument();
      unmount();

      renderTab(buildAssessment());
      expect(screen.getByText(screenStrings.noDataVersion)).toBeInTheDocument();
    });

    it('starts in MODULE_1_COMPLETED when canonical Module 1 output exists and shows its results', () => {
      renderTab(buildAssessment({
        canonicalModule1: { sourceRowCount: 1200, materialGroups: 14, uniqueVendors: 38 } as AssessmentRecord['canonicalModule1']
      }));
      expect(screen.getByText(pipelineStrings.states.module1Completed)).toBeInTheDocument();
      expect(screen.getByText(screenStrings.module1ResultsTitle)).toBeInTheDocument();
      expect(screen.getByText((1200).toLocaleString())).toBeInTheDocument();
      expect(screen.getByText(screenStrings.emptyValue, { selector: 'span.font-bold' })).toBeInTheDocument();
    });

    it('starts in MODULE_1_COMPLETED for a positive validated spend and reads the spend value', () => {
      renderTab(buildAssessment({ validatedSpendCr: 12.5 }));
      expect(screen.getByText(pipelineStrings.states.module1Completed)).toBeInTheDocument();
      expect(screen.getByText(screenStrings.validatedSpendValue((12.5).toFixed(4)))).toBeInTheDocument();
    });

    it('treats zero validated spend as not completed and moves VALIDATED datasets to VALIDATION_PASSED', () => {
      renderTab(buildAssessment({ validatedSpendCr: 0, dataStatus: 'VALIDATED' }));
      expect(screen.getByText(pipelineStrings.states.validated)).toBeInTheDocument();
      expect(screen.queryByText(screenStrings.module1ResultsTitle)).not.toBeInTheDocument();
    });

    it('starts in FILE_UPLOADED for a current data version or a RECEIVED dataset', () => {
      const { unmount } = renderTab(buildAssessment({ currentDataVersionId: 'DV-9' }));
      expect(screen.getByText(pipelineStrings.states.uploaded)).toBeInTheDocument();
      unmount();

      renderTab(buildAssessment({ dataStatus: 'RECEIVED' }));
      expect(screen.getByText(pipelineStrings.states.uploaded)).toBeInTheDocument();
    });

    it('starts in NO_FILE_UPLOADED when no dataset has been received', () => {
      renderTab(buildAssessment());
      expect(screen.getByText(pipelineStrings.states.notUploaded)).toBeInTheDocument();
    });

    it('re-derives the workflow state when the parent passes a new assessment', async () => {
      const { rerender } = renderTab(buildAssessment());
      expect(screen.getByText(pipelineStrings.states.notUploaded)).toBeInTheDocument();

      rerender(<AssessmentUploadTab assessment={buildAssessment({ currentDataVersionId: 'DV-R-1' })} onUploadSuccess={vi.fn()} />);
      await waitFor(() => expect(screen.getByText(pipelineStrings.states.uploaded)).toBeInTheDocument());

      rerender(<AssessmentUploadTab assessment={buildAssessment({ canonicalModule1: {} as AssessmentRecord['canonicalModule1'] })} onUploadSuccess={vi.fn()} />);
      await waitFor(() => expect(screen.getByText(pipelineStrings.states.module1Completed)).toBeInTheDocument());

      rerender(<AssessmentUploadTab assessment={buildAssessment({ dataStatus: 'VALIDATED', canonicalModule1: undefined })} onUploadSuccess={vi.fn()} />);
      await waitFor(() => expect(screen.getByText(pipelineStrings.states.validated)).toBeInTheDocument());

      rerender(<AssessmentUploadTab assessment={buildAssessment()} onUploadSuccess={vi.fn()} />);
      expect(screen.getByText(pipelineStrings.states.validated)).toBeInTheDocument();
    });

    it('shows the raw status when no badge is configured for it', () => {
      renderTab(buildAssessment({ status: 'UNMAPPED_STATUS' as AssessmentRecord['status'] }));
      expect(screen.getByText('UNMAPPED_STATUS')).toBeInTheDocument();
    });

    it('shows placeholders for missing metadata and coverage defaults', () => {
      renderTab(buildAssessment({
        industry: undefined,
        assessmentPeriodStart: undefined,
        assessmentPeriodEnd: undefined,
        actualDataCoverageStart: undefined,
        actualDataCoverageEnd: undefined,
        dataStatus: '' as AssessmentRecord['dataStatus']
      }));
      expect(screen.queryByText('Textiles & Apparel')).not.toBeInTheDocument();
      expect(screen.getByText(screenStrings.dateRange(screenStrings.emptyValue, screenStrings.emptyValue))).toBeInTheDocument();
      expect(screen.getByText(screenStrings.dateRange(screenStrings.defaultCoverageStart, screenStrings.defaultCoverageEnd))).toBeInTheDocument();
      expect(screen.getByText(DATA_STATUSES.AWAITING_DATA)).toBeInTheDocument();
    });

    it('shows the actual coverage dates when the assessment provides them', () => {
      renderTab(buildAssessment({ actualDataCoverageStart: '2026-04-01', actualDataCoverageEnd: '2026-10-22' }));
      expect(screen.getByText(screenStrings.dateRange('2026-04-01', '2026-10-22'))).toBeInTheDocument();
    });
  });

  describe('file selection and client-side checksum', () => {
    it('rejects a file with an unsupported extension', () => {
      renderTab(buildAssessment());
      selectFile(makeFile(CSV_CONTENT, 'report.pdf'));
      expect(screen.getByText(screenStrings.invalidFileFormat)).toBeInTheDocument();
      expect(screen.queryByText(screenStrings.selectedFileLabel)).not.toBeInTheDocument();
    });

    it('rejects a file above the size limit and an empty file', () => {
      renderTab(buildAssessment());
      selectFile(makeFile(CSV_CONTENT, 'big.csv', ASSESSMENT_UPLOAD_MAX_MB * 1024 * 1024 + 1));
      expect(screen.getByText(screenStrings.fileTooLarge(ASSESSMENT_UPLOAD_MAX_MB))).toBeInTheDocument();

      selectFile(makeFile('', 'empty.csv', 0));
      expect(screen.getByText(screenStrings.emptyFile)).toBeInTheDocument();
    });

    it('shows the selected file details and its SHA-256 checksum', async () => {
      renderTab(buildAssessment());
      const file = withArrayBuffer(makeFile(CSV_CONTENT, 'spend.csv'), CSV_CONTENT);
      selectFile(file);

      expect(screen.getAllByText('spend.csv').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(screenStrings.fileSizeBytes(new TextEncoder().encode(CSV_CONTENT).byteLength))).toBeInTheDocument();
      await waitForChecksum(CSV_CONTENT);
    });

    it('shows the hashing state and disables upload until the digest completes', async () => {
      renderTab(buildAssessment());
      const pending = createDeferred<ArrayBuffer>();
      const file = makeFile(CSV_CONTENT, 'spend.csv');
      Object.defineProperty(file, 'arrayBuffer', { value: vi.fn().mockReturnValue(pending.promise) });
      selectFile(file);

      expect(screen.getByText(screenStrings.computingHash)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: screenStrings.btnUploadFile })).toBeDisabled();

      pending.resolve(bufferOf(CSV_CONTENT));
      await waitForChecksum(CSV_CONTENT);
      expect(screen.getByRole('button', { name: screenStrings.btnUploadFile })).toBeEnabled();
    });

    it('formats kilobyte and megabyte file sizes', () => {
      const { unmount } = renderTab(buildAssessment());
      selectFile(makeFile(CSV_CONTENT, 'kb.csv', 2048));
      expect(screen.getByText(screenStrings.fileSizeKilobytes('2.0'))).toBeInTheDocument();
      unmount();

      renderTab(buildAssessment());
      selectFile(makeFile(CSV_CONTENT, 'mb.csv', 2 * 1024 * 1024));
      expect(screen.getByText(screenStrings.fileSizeMegabytes('2.00'))).toBeInTheDocument();
    });

    it('digests a typed-array buffer returned by Blob.arrayBuffer', async () => {
      renderTab(buildAssessment());
      const file = makeFile(CSV_CONTENT, 'typed.csv');
      Object.defineProperty(file, 'arrayBuffer', { value: vi.fn().mockResolvedValue(new Uint8Array(bufferOf(CSV_CONTENT))) });
      selectFile(file);
      await waitForChecksum(CSV_CONTENT);
    });

    it('reads the file through FileReader when Blob.arrayBuffer is unavailable', async () => {
      renderTab(buildAssessment());
      const file = makeFile(CSV_CONTENT, 'legacy.csv');
      Object.defineProperty(file, 'arrayBuffer', { value: undefined });
      selectFile(file);
      await waitForChecksum(CSV_CONTENT);
    });

    it('falls back to the empty-input digest when FileReader fails', async () => {
      stubFileReader({ kind: 'error' });
      renderTab(buildAssessment());
      const file = makeFile(CSV_CONTENT, 'legacy.csv');
      Object.defineProperty(file, 'arrayBuffer', { value: undefined });
      selectFile(file);

      await waitFor(() => expect(screen.getByText(ASSESSMENT_CHECKSUM_FALLBACK_HEX)).toBeInTheDocument());
      expect(frontendLogger.error).toHaveBeenCalledWith('Failed to compute client SHA-256', expect.anything());
    });

    it('falls back to the empty-input digest when the Web Crypto API is unavailable', async () => {
      vi.stubGlobal('crypto', undefined);
      renderTab(buildAssessment());
      selectFile(withArrayBuffer(makeFile(CSV_CONTENT, 'spend.csv'), CSV_CONTENT));

      await waitFor(() => expect(screen.getByText(ASSESSMENT_CHECKSUM_FALLBACK_HEX)).toBeInTheDocument());
    });

    it('falls back to the empty-input digest when crypto.subtle is missing', async () => {
      vi.stubGlobal('crypto', {});
      renderTab(buildAssessment());
      selectFile(withArrayBuffer(makeFile(CSV_CONTENT, 'spend.csv'), CSV_CONTENT));

      await waitFor(() => expect(screen.getByText(ASSESSMENT_CHECKSUM_FALLBACK_HEX)).toBeInTheDocument());
    });

    it('logs and falls back to the empty-input digest when digest rejects', async () => {
      vi.spyOn(crypto.subtle, 'digest').mockRejectedValueOnce(new Error('digest failed'));
      renderTab(buildAssessment());
      selectFile(withArrayBuffer(makeFile(CSV_CONTENT, 'spend.csv'), CSV_CONTENT));

      await waitFor(() => expect(screen.getByText(ASSESSMENT_CHECKSUM_FALLBACK_HEX)).toBeInTheDocument());
      expect(frontendLogger.error).toHaveBeenCalledWith('Failed to compute client SHA-256', { error: expect.any(Error) });
    });
  });

  describe('drag, drop, and picker interactions', () => {
    it('highlights the dropzone while a file is dragged over it and clears the highlight on leave', () => {
      renderTab(buildAssessment());
      const dropzone = screen.getByTestId('assessment-file-dropzone');
      expect(dropzone).not.toHaveClass('border-cyan-400');

      fireEvent.dragOver(dropzone);
      expect(dropzone).toHaveClass('border-cyan-400');

      fireEvent.dragLeave(dropzone);
      expect(dropzone).not.toHaveClass('border-cyan-400');
    });

    it('accepts a dropped file and ignores drops that carry no file', async () => {
      renderTab(buildAssessment());
      const dropzone = screen.getByTestId('assessment-file-dropzone');
      const file = withArrayBuffer(makeFile(CSV_CONTENT, 'dropped.csv'), CSV_CONTENT);

      fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });
      expect(screen.getAllByText('dropped.csv').length).toBeGreaterThanOrEqual(1);
      await waitForChecksum(CSV_CONTENT);

      fireEvent.drop(dropzone, { dataTransfer: { files: [] } });
      expect(screen.getAllByText('dropped.csv').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(screenStrings.selectedFileLabel)).toBeInTheDocument();
    });

    it('ignores change events that carry no file', () => {
      renderTab(buildAssessment());
      fireEvent.change(screen.getByTestId('assessment-file-input'), { target: { files: [] } });
      expect(screen.queryByText(screenStrings.selectedFileLabel)).not.toBeInTheDocument();
      expect(screen.queryByText(screenStrings.invalidFileFormat)).not.toBeInTheDocument();
    });

    it('opens the file picker from the dropzone and from the select button', () => {
      renderTab(buildAssessment());
      const input = screen.getByTestId('assessment-file-input');
      const clickSpy = vi.spyOn(input, 'click').mockImplementation(() => undefined);

      fireEvent.click(screen.getByTestId('assessment-file-dropzone'));
      fireEvent.click(screen.getByRole('button', { name: pipelineStrings.controls.btnSelectFile }));
      expect(clickSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('dataset upload', () => {
    it('uploads the file with its checksum and adopts the returned data version', async () => {
      vi.mocked(assessmentApiClient.uploadDataVersion).mockResolvedValue({
        assessment: buildAssessment({ currentDataVersionId: 'DV-NEW-1' }),
        dataVersion: { dataVersionId: 'DV-NEW-1' } as never
      });
      renderTab(buildAssessment());
      await uploadSelectedFile(withArrayBuffer(makeFile(CSV_CONTENT, 'spend.csv'), CSV_CONTENT));

      await waitFor(() => expect(screen.getByText('DV-NEW-1')).toBeInTheDocument());
      expect(screen.getByText(pipelineStrings.states.uploaded)).toBeInTheDocument();
      expect(assessmentApiClient.uploadDataVersion).toHaveBeenCalledWith(
        'AIC-2026-0003',
        expect.objectContaining({
          fileName: 'spend.csv',
          checksum: sha256Hex(CSV_CONTENT),
          fileBase64: Buffer.from(CSV_CONTENT).toString('base64'),
          runAnalysisImmediately: false
        })
      );
    });

    it('adopts the active data version from the response assessment when no dataVersion is returned', async () => {
      vi.mocked(assessmentApiClient.uploadDataVersion).mockResolvedValue({
        assessment: buildAssessment({ activeDataVersionId: 'DV-ACT-2' })
      } as never);
      renderTab(buildAssessment());
      await uploadSelectedFile(withArrayBuffer(makeFile(CSV_CONTENT, 'spend.csv'), CSV_CONTENT));

      await waitFor(() => expect(screen.getByText('DV-ACT-2')).toBeInTheDocument());
    });

    it('adopts the current data version from the response assessment when only that field is returned', async () => {
      vi.mocked(assessmentApiClient.uploadDataVersion).mockResolvedValue({
        assessment: buildAssessment({ currentDataVersionId: 'DV-CUR-3' })
      } as never);
      renderTab(buildAssessment());
      await uploadSelectedFile(withArrayBuffer(makeFile(CSV_CONTENT, 'spend.csv'), CSV_CONTENT));

      await waitFor(() => expect(screen.getByText('DV-CUR-3')).toBeInTheDocument());
    });

    it('keeps the data version unchanged when the response carries no identifier', async () => {
      vi.mocked(assessmentApiClient.uploadDataVersion).mockResolvedValue({ assessment: buildAssessment() } as never);
      renderTab(buildAssessment());
      await uploadSelectedFile(withArrayBuffer(makeFile(CSV_CONTENT, 'spend.csv'), CSV_CONTENT));

      await waitFor(() => expect(screen.getByText(pipelineStrings.states.uploaded)).toBeInTheDocument());
      expect(screen.getByText(screenStrings.noDataVersion)).toBeInTheDocument();
    });

    it('shows the upload error reason and logs the error when the request fails', async () => {
      const failure = new Error('Storage quota exceeded');
      vi.mocked(assessmentApiClient.uploadDataVersion).mockRejectedValue(failure);
      renderTab(buildAssessment());
      await uploadSelectedFile(withArrayBuffer(makeFile(CSV_CONTENT, 'spend.csv'), CSV_CONTENT));

      await waitFor(() => expect(screen.getByText(screenStrings.uploadFailed('Storage quota exceeded'))).toBeInTheDocument());
      expect(frontendLogger.error).toHaveBeenCalledWith(
        'Dataset upload failed',
        expect.objectContaining({ assessmentId: 'AIC-2026-0003' }),
        failure
      );
    });

    it('shows the fallback upload reason when the failure is not an Error', async () => {
      vi.mocked(assessmentApiClient.uploadDataVersion).mockRejectedValue('network down');
      renderTab(buildAssessment());
      await uploadSelectedFile(withArrayBuffer(makeFile(CSV_CONTENT, 'spend.csv'), CSV_CONTENT));

      await waitFor(() => expect(screen.getByText(screenStrings.uploadFailed(screenStrings.noErrorDetails))).toBeInTheDocument());
    });

    it('shows the uploading label while the request is in flight', async () => {
      const pending = createDeferred<Awaited<ReturnType<typeof assessmentApiClient.uploadDataVersion>>>();
      vi.mocked(assessmentApiClient.uploadDataVersion).mockReturnValue(pending.promise);
      renderTab(buildAssessment());
      await uploadSelectedFile(withArrayBuffer(makeFile(CSV_CONTENT, 'spend.csv'), CSV_CONTENT));

      const uploadingButton = await screen.findByRole('button', { name: screenStrings.btnUploadingDataset });
      expect(uploadingButton).toBeDisabled();

      pending.resolve({ assessment: buildAssessment({ currentDataVersionId: 'DV-F-1' }) } as never);
      await waitFor(() => expect(screen.getByText('DV-F-1')).toBeInTheDocument());
    });

    it('encodes payloads larger than one chunk as standard base64', async () => {
      vi.mocked(assessmentApiClient.uploadDataVersion).mockResolvedValue({ assessment: buildAssessment() } as never);
      const largeContent = `Vendor,Amount\n${'ABC,500\n'.repeat(6000)}`;
      renderTab(buildAssessment());
      await uploadSelectedFile(withArrayBuffer(makeFile(largeContent, 'large.csv'), largeContent));

      await waitFor(() => expect(assessmentApiClient.uploadDataVersion).toHaveBeenCalled());
      expect(assessmentApiClient.uploadDataVersion).toHaveBeenCalledWith(
        'AIC-2026-0003',
        expect.objectContaining({ fileBase64: Buffer.from(largeContent).toString('base64') })
      );
    });

    it('uploads through FileReader for both checksum and payload when Blob.arrayBuffer is unavailable', async () => {
      vi.mocked(assessmentApiClient.uploadDataVersion).mockResolvedValue({ assessment: buildAssessment() } as never);
      renderTab(buildAssessment());
      const file = makeFile(CSV_CONTENT, 'legacy.csv');
      Object.defineProperty(file, 'arrayBuffer', { value: undefined });
      await uploadSelectedFile(file);

      await waitFor(() => expect(assessmentApiClient.uploadDataVersion).toHaveBeenCalled());
      expect(assessmentApiClient.uploadDataVersion).toHaveBeenCalledWith(
        'AIC-2026-0003',
        expect.objectContaining({
          checksum: sha256Hex(CSV_CONTENT),
          fileBase64: Buffer.from(CSV_CONTENT).toString('base64')
        })
      );
    });

    it('reads the payload through FileReader when Blob.arrayBuffer rejects during encoding', async () => {
      vi.mocked(assessmentApiClient.uploadDataVersion).mockResolvedValue({ assessment: buildAssessment() } as never);
      renderTab(buildAssessment());
      const file = makeFile(CSV_CONTENT, 'spend.csv');
      Object.defineProperty(file, 'arrayBuffer', {
        value: vi.fn().mockResolvedValueOnce(bufferOf(CSV_CONTENT)).mockRejectedValueOnce(new Error('read failed'))
      });
      await uploadSelectedFile(file);

      await waitFor(() => expect(assessmentApiClient.uploadDataVersion).toHaveBeenCalled());
      expect(assessmentApiClient.uploadDataVersion).toHaveBeenCalledWith(
        'AIC-2026-0003',
        expect.objectContaining({ fileBase64: Buffer.from(CSV_CONTENT).toString('base64') })
      );
    });

    it('uses the raw FileReader result when the data URL has no comma separator', async () => {
      vi.mocked(assessmentApiClient.uploadDataVersion).mockResolvedValue({ assessment: buildAssessment() } as never);
      stubFileReader({ kind: 'result', value: 'RAW-BASE64' });
      renderTab(buildAssessment());
      const file = makeFile(CSV_CONTENT, 'spend.csv');
      Object.defineProperty(file, 'arrayBuffer', {
        value: vi.fn().mockResolvedValueOnce(bufferOf(CSV_CONTENT)).mockRejectedValueOnce(new Error('read failed'))
      });
      await uploadSelectedFile(file);

      await waitFor(() => expect(assessmentApiClient.uploadDataVersion).toHaveBeenCalled());
      expect(assessmentApiClient.uploadDataVersion).toHaveBeenCalledWith(
        'AIC-2026-0003',
        expect.objectContaining({ fileBase64: 'RAW-BASE64' })
      );
    });

    it('reports a FileReader failure during encoding as an upload error', async () => {
      stubFileReader({ kind: 'error' });
      renderTab(buildAssessment());
      const file = makeFile(CSV_CONTENT, 'spend.csv');
      Object.defineProperty(file, 'arrayBuffer', {
        value: vi.fn().mockResolvedValueOnce(bufferOf(CSV_CONTENT)).mockRejectedValueOnce(new Error('read failed'))
      });
      await uploadSelectedFile(file);

      await waitFor(() => expect(screen.getByText(screenStrings.uploadFailed(screenStrings.noErrorDetails))).toBeInTheDocument());
      expect(assessmentApiClient.uploadDataVersion).not.toHaveBeenCalled();
    });
  });

  describe('dataset validation', () => {
    it('reports row counts for a passed validation and shows the completion title', async () => {
      vi.mocked(assessmentApiClient.validateDataset).mockResolvedValue({
        validationSummary: { sourceRowCount: 1000, validRowCount: 980, excludedRowCount: 15, anomalyRowCount: 5, cleanSpendYieldPct: 98 }
      } as never);
      renderTab(buildAssessment({ currentDataVersionId: 'DV-V-1', dataStatus: 'RECEIVED' }));
      fireEvent.click(validateButton());

      await waitFor(() => expect(screen.getByText(screenStrings.validationCompletedTitle)).toBeInTheDocument());
      expect(screen.getByText(screenStrings.validationPassed((980).toLocaleString(), '15', '5'))).toBeInTheDocument();
      expect(screen.getByText(pipelineStrings.states.validated)).toBeInTheDocument();
      expect(assessmentApiClient.validateDataset).toHaveBeenCalledWith('AIC-2026-0003', 'DV-V-1');
    });

    it('defaults missing row counts to zero', async () => {
      vi.mocked(assessmentApiClient.validateDataset).mockResolvedValue({ validationSummary: {} } as never);
      renderTab(buildAssessment({ currentDataVersionId: 'DV-V-2', dataStatus: 'RECEIVED' }));
      fireEvent.click(validateButton());

      await waitFor(() => expect(screen.getByText(screenStrings.validationPassed('0', '0', '0'))).toBeInTheDocument());
    });

    it('surfaces the server message when validation returns no summary', async () => {
      vi.mocked(assessmentApiClient.validateDataset).mockResolvedValue({ message: 'Header row missing' } as never);
      renderTab(buildAssessment({ currentDataVersionId: 'DV-V-3', dataStatus: 'RECEIVED' }));
      fireEvent.click(validateButton());

      await waitFor(() => expect(screen.getByText(screenStrings.validationFailed('Header row missing'))).toBeInTheDocument());
      expect(screen.getByText(pipelineStrings.states.validationFailed)).toBeInTheDocument();
    });

    it.each([
      { label: 'no message', response: {} },
      { label: 'a non-string message', response: { message: 42 } },
      { label: 'an undefined response', response: undefined },
      { label: 'a null response', response: null }
    ])('uses the missing-summary detail when the validation response carries $label', async ({ response }) => {
      vi.mocked(assessmentApiClient.validateDataset).mockResolvedValue(response as never);
      renderTab(buildAssessment({ currentDataVersionId: 'DV-V-4', dataStatus: 'RECEIVED' }));
      fireEvent.click(validateButton());

      await waitFor(() => expect(screen.getByText(screenStrings.validationFailed(screenStrings.validationNoDetails))).toBeInTheDocument());
    });

    it('shows the thrown error and logs it when validation rejects', async () => {
      const failure = new Error('Validation service unavailable');
      vi.mocked(assessmentApiClient.validateDataset).mockRejectedValue(failure);
      renderTab(buildAssessment({ currentDataVersionId: 'DV-V-5', dataStatus: 'RECEIVED' }));
      fireEvent.click(validateButton());

      await waitFor(() => expect(screen.getByText(screenStrings.validationFailed('Validation service unavailable'))).toBeInTheDocument());
      expect(frontendLogger.error).toHaveBeenCalledWith(
        'Dataset validation failed',
        expect.objectContaining({ assessmentId: 'AIC-2026-0003' }),
        failure
      );
    });

    it('shows the fallback reason when validation rejects with a non-Error', async () => {
      vi.mocked(assessmentApiClient.validateDataset).mockRejectedValue('offline');
      renderTab(buildAssessment({ currentDataVersionId: 'DV-V-6', dataStatus: 'RECEIVED' }));
      fireEvent.click(validateButton());

      await waitFor(() => expect(screen.getByText(screenStrings.validationFailed(screenStrings.noErrorDetails))).toBeInTheDocument());
    });

    it('shows the validating label while validation is in flight', async () => {
      const pending = createDeferred<Awaited<ReturnType<typeof assessmentApiClient.validateDataset>>>();
      vi.mocked(assessmentApiClient.validateDataset).mockReturnValue(pending.promise);
      renderTab(buildAssessment({ currentDataVersionId: 'DV-V-7', dataStatus: 'RECEIVED' }));
      fireEvent.click(validateButton());

      const validatingButton = await screen.findByRole('button', { name: screenStrings.btnValidating });
      expect(validatingButton).toBeDisabled();

      pending.resolve({ validationSummary: { validRowCount: 1, excludedRowCount: 0, anomalyRowCount: 0 } } as never);
      await waitFor(() => expect(screen.getByText(pipelineStrings.states.validated)).toBeInTheDocument());
    });

    it('validates against the parent assessment data version when no upload has set one locally', async () => {
      vi.mocked(assessmentApiClient.validateDataset).mockResolvedValue({
        validationSummary: { validRowCount: 3, excludedRowCount: 0, anomalyRowCount: 0 }
      } as never);
      const { rerender } = renderTab(buildAssessment());
      expect(validateButton()).toBeDisabled();

      rerender(<AssessmentUploadTab assessment={buildAssessment({ currentDataVersionId: 'DV-LATE-1' })} onUploadSuccess={vi.fn()} />);
      await waitFor(() => expect(validateButton()).toBeEnabled());
      fireEvent.click(validateButton());

      await waitFor(() => expect(assessmentApiClient.validateDataset).toHaveBeenCalledWith('AIC-2026-0003', 'DV-LATE-1'));
    });
  });

  describe('Module 1 analysis', () => {
    it('shows the reported Module 1 values and passes the assessment to the parent', async () => {
      const onUploadSuccess = vi.fn();
      const completed = buildAssessment({
        validatedSpendCr: 12.34567,
        canonicalModule1: { sourceRowCount: 2500, materialGroups: 9, uniqueVendors: 31 } as AssessmentRecord['canonicalModule1']
      });
      vi.mocked(assessmentApiClient.runModule1).mockResolvedValue({ assessment: completed } as never);
      render(
        <AssessmentUploadTab
          assessment={buildAssessment({ currentDataVersionId: 'DV-M-1', dataStatus: 'VALIDATED' })}
          onUploadSuccess={onUploadSuccess}
        />
      );
      fireEvent.click(module1Button());

      await waitFor(() => expect(onUploadSuccess).toHaveBeenCalledWith(completed));
      expect(screen.getByText(screenStrings.validatedSpendValue((12.34567).toFixed(4)))).toBeInTheDocument();
      expect(screen.getByText((2500).toLocaleString())).toBeInTheDocument();
      expect(screen.getByText(pipelineStrings.states.module1Completed)).toBeInTheDocument();
    });

    it('shows the placeholder for every Module 1 value the response leaves out', async () => {
      vi.mocked(assessmentApiClient.runModule1).mockResolvedValue({ assessment: buildAssessment() } as never);
      renderTab(buildAssessment({ currentDataVersionId: 'DV-M-2', dataStatus: 'VALIDATED' }));
      fireEvent.click(module1Button());

      await waitFor(() => expect(screen.getByText(screenStrings.module1ResultsTitle)).toBeInTheDocument());
      expect(screen.getAllByText(screenStrings.emptyValue).length).toBeGreaterThanOrEqual(4);
    });

    it('treats a Module 1 response without an assessment as a failure', async () => {
      vi.mocked(assessmentApiClient.runModule1).mockResolvedValue({} as never);
      renderTab(buildAssessment({ currentDataVersionId: 'DV-M-3', dataStatus: 'VALIDATED' }));
      fireEvent.click(module1Button());

      await waitFor(() => expect(screen.getByText(screenStrings.module1Failed(screenStrings.module1NoDetails))).toBeInTheDocument());
      expect(screen.getByText(pipelineStrings.states.module1Failed)).toBeInTheDocument();
    });

    it('shows the Module 1 error reason and logs it when the run rejects', async () => {
      const failure = new Error('Engine offline');
      vi.mocked(assessmentApiClient.runModule1).mockRejectedValue(failure);
      renderTab(buildAssessment({ currentDataVersionId: 'DV-M-4', dataStatus: 'VALIDATED' }));
      fireEvent.click(module1Button());

      await waitFor(() => expect(screen.getByText(screenStrings.module1Failed('Engine offline'))).toBeInTheDocument());
      expect(frontendLogger.error).toHaveBeenCalledWith(
        'Module 1 execution failed',
        expect.objectContaining({ assessmentId: 'AIC-2026-0003', targetDvId: 'DV-M-4' }),
        failure
      );
    });

    it('shows the fallback Module 1 reason when the run rejects with a non-Error', async () => {
      vi.mocked(assessmentApiClient.runModule1).mockRejectedValue('timeout');
      renderTab(buildAssessment({ currentDataVersionId: 'DV-M-5', dataStatus: 'VALIDATED' }));
      fireEvent.click(module1Button());

      await waitFor(() => expect(screen.getByText(screenStrings.module1Failed(screenStrings.noErrorDetails))).toBeInTheDocument());
    });

    it('reports a missing data version when Module 1 starts without one', async () => {
      renderTab(buildAssessment({ dataStatus: 'VALIDATED' }));
      expect(module1Button()).toBeEnabled();
      fireEvent.click(module1Button());

      await waitFor(() => expect(screen.getByText(screenStrings.noValidatedDataVersion)).toBeInTheDocument());
      expect(assessmentApiClient.runModule1).not.toHaveBeenCalled();
    });

    it('shows the executing label while Module 1 runs', async () => {
      const pending = createDeferred<Awaited<ReturnType<typeof assessmentApiClient.runModule1>>>();
      vi.mocked(assessmentApiClient.runModule1).mockReturnValue(pending.promise);
      renderTab(buildAssessment({ currentDataVersionId: 'DV-M-6', dataStatus: 'VALIDATED' }));
      fireEvent.click(module1Button());

      const executingButton = await screen.findByRole('button', { name: screenStrings.btnExecutingModule1 });
      expect(executingButton).toBeDisabled();
      expect(screen.getByText(pipelineStrings.states.module1Running)).toBeInTheDocument();

      pending.resolve({ assessment: buildAssessment({ validatedSpendCr: 1 }) } as never);
      await waitFor(() => expect(screen.getByText(pipelineStrings.states.module1Completed)).toBeInTheDocument());
    });
  });
});
