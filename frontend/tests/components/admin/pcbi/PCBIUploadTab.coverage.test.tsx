import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import * as XLSX from 'xlsx';
import { PCBIUploadTab } from '../../../../src/components/admin/pcbi/PCBIUploadTab';
import { UI_STRINGS } from '../../../../src/constants';
import { pcbiCommodityDataLabApi } from '../../../../src/utils/pcbiCommodityDataLabApi';
import { detectWorksheets } from '../../../../src/utils/pcbiParser';
import frontendLogger from '../../../../src/utils/logger';
import type { PCBIColumnMapping, PCBIWorksheetDetection } from '../../../../src/types/pcbiAdmin';
import type { PCBIDomainValidationResult } from '../../../../src/types/pcbiCommodityDataLab';

vi.mock('../../../../src/utils/pcbiParser', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../src/utils/pcbiParser')>();
  return { ...actual, detectWorksheets: vi.fn(actual.detectWorksheets) };
});

const WORKBOOK_FILE_NAME = 'PCBI_TEST.xlsx';
const WORKBOOK_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const MASTER_SHEET_NAME = 'PCBI_Master';
const MASTER_ROWS: unknown[][] = [
  ['PCBI ID', 'Benchmark Name', 'Benchmark Type', 'Category', 'Quality', 'Bench %'],
  ['PCBI-TEST-001', 'Cement Standard', 'DIRECT', 'Cement', 'A', 85]
];
const INJECTED_DOMAIN_TITLE = 'Injected domain title';
const INJECTED_DOMAIN_GUIDANCE = 'Injected domain guidance';

const ALLOWED_DOMAIN_RESULT: { success: boolean; detection: PCBIDomainValidationResult } = {
  success: true,
  detection: {
    detectedDomain: 'PCBI_MASTER_SYSTEM_DATA',
    isAllowedInTarget: true,
    targetArea: 'PCBI_MASTER',
    matchedSignatures: []
  }
};

const buildBlockedDomainResult = (
  detectedDomain: PCBIDomainValidationResult['detectedDomain'],
  texts: { errorMessage?: string; guidanceMessage?: string } = {}
): { success: boolean; detection: PCBIDomainValidationResult } => ({
  success: true,
  detection: {
    detectedDomain,
    isAllowedInTarget: false,
    targetArea: 'PCBI_MASTER',
    matchedSignatures: ['signature'],
    ...texts
  }
});

const buildWorkbookBytes = (sheetName: string, rows: unknown[][]): Uint8Array => {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), sheetName);
  return new Uint8Array(XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }));
};

const toArrayBuffer = (bytes: Uint8Array): ArrayBuffer => new Uint8Array(bytes).buffer as ArrayBuffer;

const buildUploadFile = (bytes: Uint8Array, name = WORKBOOK_FILE_NAME): File => {
  const file = new File([toArrayBuffer(bytes)], name, { type: WORKBOOK_MIME_TYPE });
  file.arrayBuffer = vi.fn(() => Promise.resolve(toArrayBuffer(bytes)));
  return file;
};

const buildFailingFile = (reason: unknown): File => {
  const file = new File(['unreadable'], 'broken.xlsx', { type: WORKBOOK_MIME_TYPE });
  file.arrayBuffer = vi.fn(() => Promise.reject(reason));
  return file;
};

const buildMasterWorksheet = (overrides: Partial<PCBIWorksheetDetection> = {}): PCBIWorksheetDetection => ({
  sheetName: MASTER_SHEET_NAME,
  detectedType: 'PCBI_MASTER',
  purposeLabel: 'Benchmark Master',
  rowCount: 1,
  columnCount: 6,
  headers: MASTER_ROWS[0] as string[],
  confidence: 95,
  ...overrides
});

const renderUploadTab = (overrides: Partial<Parameters<typeof PCBIUploadTab>[0]> = {}) => {
  const onUpload = vi.fn();
  const onProceed = vi.fn();
  const { container } = render(
    <PCBIUploadTab
      uploadedFile={null}
      fileMetadata={null}
      worksheets={[]}
      mappings={{}}
      onFileUpload={onUpload}
      onOverrideWorksheet={vi.fn()}
      onOverrideColumnMapping={vi.fn()}
      onProceedToValidate={onProceed}
      {...overrides}
    />
  );
  return { onUpload, onProceed, container };
};

const getFileInput = (container: HTMLElement): HTMLInputElement =>
  container.querySelector('#pcbi-master-file-input') as HTMLInputElement;

describe('PCBIUploadTab coverage', () => {
  beforeEach(() => {
    vi.spyOn(pcbiCommodityDataLabApi, 'detectUploadDomain').mockResolvedValue(ALLOWED_DOMAIN_RESULT);
    vi.spyOn(frontendLogger, 'info').mockImplementation(() => ({}) as never);
    vi.spyOn(frontendLogger, 'warn').mockImplementation(() => ({}) as never);
    vi.spyOn(frontendLogger, 'error').mockImplementation(() => ({}) as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('opens the hidden file picker when the dropzone is clicked', () => {
    const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => undefined);
    renderUploadTab();

    fireEvent.click(screen.getByText(UI_STRINGS.pcbiAdmin.uploadScreenTitle));

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it('ignores a file dialog that closes without a selection', () => {
    const { onUpload, container } = renderUploadTab();

    fireEvent.change(getFileInput(container), { target: { files: [] } });

    expect(pcbiCommodityDataLabApi.detectUploadDomain).not.toHaveBeenCalled();
    expect(onUpload).not.toHaveBeenCalled();
  });

  it('rejects a wrong-domain file and shows the title and guidance returned by the API', async () => {
    vi.mocked(pcbiCommodityDataLabApi.detectUploadDomain).mockResolvedValueOnce(
      buildBlockedDomainResult('COMMODITY_RESEARCH_EVIDENCE', {
        errorMessage: INJECTED_DOMAIN_TITLE,
        guidanceMessage: INJECTED_DOMAIN_GUIDANCE
      })
    );
    const { onUpload, container } = renderUploadTab();
    const file = buildUploadFile(buildWorkbookBytes(MASTER_SHEET_NAME, MASTER_ROWS), 'FerroMoly_Research_Pack.xlsx');

    fireEvent.change(getFileInput(container), { target: { files: [file] } });

    expect(await screen.findByText(INJECTED_DOMAIN_TITLE)).toBeInTheDocument();
    expect(screen.getByText(INJECTED_DOMAIN_GUIDANCE)).toBeInTheDocument();
    expect(onUpload).not.toHaveBeenCalled();
    expect(frontendLogger.warn).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ detectedDomain: 'COMMODITY_RESEARCH_EVIDENCE' })
    );
  });

  it('uses the fallback rejection copy for purchase history files when the API sends no text', async () => {
    vi.mocked(pcbiCommodityDataLabApi.detectUploadDomain).mockResolvedValueOnce(
      buildBlockedDomainResult('CUSTOMER_PURCHASE_HISTORY')
    );
    const { onUpload, container } = renderUploadTab();
    const file = buildUploadFile(buildWorkbookBytes(MASTER_SHEET_NAME, MASTER_ROWS), 'Customer_PO_History_2025.xlsx');

    fireEvent.change(getFileInput(container), { target: { files: [file] } });

    await waitFor(() => {
      expect(frontendLogger.warn).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ detectedDomain: 'CUSTOMER_PURCHASE_HISTORY' })
      );
    });
    expect(onUpload).not.toHaveBeenCalled();
  });

  it('uses the fallback rejection copy for research files when the API sends no text', async () => {
    vi.mocked(pcbiCommodityDataLabApi.detectUploadDomain).mockResolvedValueOnce(
      buildBlockedDomainResult('COMMODITY_RESEARCH_EVIDENCE')
    );
    const { onUpload, container } = renderUploadTab();
    const file = buildUploadFile(buildWorkbookBytes(MASTER_SHEET_NAME, MASTER_ROWS), 'Research_Pack.xlsx');

    fireEvent.change(getFileInput(container), { target: { files: [file] } });

    await waitFor(() => {
      expect(frontendLogger.warn).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ detectedDomain: 'COMMODITY_RESEARCH_EVIDENCE' })
      );
    });
    expect(onUpload).not.toHaveBeenCalled();
  });

  it('keeps parsing when the domain check rejects with an Error', async () => {
    vi.mocked(pcbiCommodityDataLabApi.detectUploadDomain).mockRejectedValueOnce(
      new Error('Domain service unavailable')
    );
    const { onUpload, container } = renderUploadTab();

    fireEvent.change(getFileInput(container), {
      target: { files: [buildUploadFile(buildWorkbookBytes(MASTER_SHEET_NAME, MASTER_ROWS))] }
    });

    await waitFor(() => expect(onUpload).toHaveBeenCalledTimes(1));
    expect(frontendLogger.warn).toHaveBeenCalledWith(expect.any(String), {
      error: 'Domain service unavailable'
    });
  });

  it('keeps parsing when the domain check rejects with a non-Error value', async () => {
    vi.mocked(pcbiCommodityDataLabApi.detectUploadDomain).mockRejectedValueOnce('gateway offline');
    const { onUpload, container } = renderUploadTab();

    fireEvent.change(getFileInput(container), {
      target: { files: [buildUploadFile(buildWorkbookBytes(MASTER_SHEET_NAME, MASTER_ROWS))] }
    });

    await waitFor(() => expect(onUpload).toHaveBeenCalledTimes(1));
    expect(frontendLogger.warn).toHaveBeenCalledWith(expect.any(String), { error: 'gateway offline' });
  });

  it('parses a workbook and reports the detected worksheets, datasets, and mappings', async () => {
    const { onUpload, container } = renderUploadTab();
    const file = buildUploadFile(buildWorkbookBytes(MASTER_SHEET_NAME, MASTER_ROWS));

    fireEvent.change(getFileInput(container), { target: { files: [file] } });

    await waitFor(() => expect(onUpload).toHaveBeenCalledTimes(1));
    expect(onUpload).toHaveBeenCalledWith(
      file,
      expect.arrayContaining([expect.objectContaining({ sheetName: MASTER_SHEET_NAME })]),
      expect.objectContaining({ PCBI_MASTER: expect.any(Array) }),
      expect.objectContaining({ PCBI_MASTER: expect.any(Array) })
    );
  });

  it('disables the upload control while a workbook is being parsed and re-enables it afterwards', async () => {
    let resolveBuffer: (value: ArrayBuffer) => void = () => undefined;
    const pendingFile = new File(['pending'], WORKBOOK_FILE_NAME, { type: WORKBOOK_MIME_TYPE });
    pendingFile.arrayBuffer = vi.fn(
      () => new Promise<ArrayBuffer>((resolve) => { resolveBuffer = resolve; })
    );
    const { onUpload, container } = renderUploadTab();

    fireEvent.change(getFileInput(container), { target: { files: [pendingFile] } });

    await waitFor(() => expect(screen.getByRole('button')).toBeDisabled());

    resolveBuffer(toArrayBuffer(buildWorkbookBytes(MASTER_SHEET_NAME, MASTER_ROWS)));

    await waitFor(() => expect(onUpload).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  it('logs the parse failure and reports nothing when the workbook read rejects with an Error', async () => {
    const { onUpload, container } = renderUploadTab();

    fireEvent.change(getFileInput(container), {
      target: { files: [buildFailingFile(new Error('Corrupt workbook'))] }
    });

    await waitFor(() => {
      expect(frontendLogger.error).toHaveBeenCalledWith(expect.any(String), { error: 'Corrupt workbook' });
    });
    expect(onUpload).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByRole('button')).not.toBeDisabled());
  });

  it('logs the parse failure with a stringified value when the workbook read rejects with a non-Error', async () => {
    const { onUpload, container } = renderUploadTab();

    fireEvent.change(getFileInput(container), { target: { files: [buildFailingFile('unreadable bytes')] } });

    await waitFor(() => {
      expect(frontendLogger.error).toHaveBeenCalledWith(expect.any(String), { error: 'unreadable bytes' });
    });
    expect(onUpload).not.toHaveBeenCalled();
  });

  it('reports an empty worksheet list when no non-ignored worksheet is detected', async () => {
    vi.mocked(detectWorksheets).mockReturnValueOnce([]);
    const { onUpload, container } = renderUploadTab();

    fireEvent.change(getFileInput(container), {
      target: { files: [buildUploadFile(buildWorkbookBytes(MASTER_SHEET_NAME, MASTER_ROWS))] }
    });

    await waitFor(() => expect(onUpload).toHaveBeenCalledWith(expect.anything(), [], {}, {}));
  });

  it('maps a detected worksheet that has no headers and no sheet rows as an empty dataset', async () => {
    const ghostWorksheet = buildMasterWorksheet({
      sheetName: 'Ghost Sheet',
      headers: undefined,
      rowCount: 0,
      columnCount: 0
    });
    vi.mocked(detectWorksheets).mockReturnValueOnce([ghostWorksheet]);
    const { onUpload, container } = renderUploadTab();

    fireEvent.change(getFileInput(container), {
      target: { files: [buildUploadFile(buildWorkbookBytes(MASTER_SHEET_NAME, MASTER_ROWS))] }
    });

    await waitFor(() => expect(onUpload).toHaveBeenCalledTimes(1));
    expect(onUpload).toHaveBeenCalledWith(
      expect.anything(),
      [ghostWorksheet],
      { PCBI_MASTER: [] },
      { PCBI_MASTER: [] }
    );
  });

  it('treats a sheet that yields no parsed rows as an empty dataset', async () => {
    vi.spyOn(XLSX.utils, 'sheet_to_json').mockReturnValueOnce(undefined as never);
    const { onUpload, container } = renderUploadTab();

    fireEvent.change(getFileInput(container), {
      target: { files: [buildUploadFile(buildWorkbookBytes(MASTER_SHEET_NAME, MASTER_ROWS))] }
    });

    await waitFor(() => expect(onUpload).toHaveBeenCalledTimes(1));
    expect(onUpload).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(Array),
      { PCBI_MASTER: [] },
      expect.any(Object)
    );
  });

  it('shows the staged file metadata, column mapping, and proceeds to validation', () => {
    const mapping: PCBIColumnMapping = {
      excelColumn: 'PCBI ID',
      mappedField: 'pcbi_id',
      fieldLabel: 'PCBI ID',
      isRequired: true,
      confidence: 95,
      status: 'MAPPED',
      sampleValues: ['PCBI-TEST-001']
    };
    const { onProceed } = renderUploadTab({
      uploadedFile: new File(['staged'], WORKBOOK_FILE_NAME),
      fileMetadata: {
        name: WORKBOOK_FILE_NAME,
        sizeMb: 0.5,
        uploadDate: '2026-01-01T00:00:00.000Z',
        uploadedBy: 'Admin',
        worksheetCount: 1,
        totalRecords: 1
      },
      worksheets: [buildMasterWorksheet()],
      mappings: { [MASTER_SHEET_NAME]: [mapping], PCBI_MASTER: [mapping] }
    });

    expect(screen.getByText(WORKBOOK_FILE_NAME)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.pcbiAdmin.columnMappingTitle)).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: `${UI_STRINGS.common.proceed} to ${UI_STRINGS.pcbiAdmin.tabValidate}` })
    );
    expect(onProceed).toHaveBeenCalledTimes(1);
  });
});
