import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import * as XLSX from 'xlsx';
import { PCBIAdminMasterView } from '../../../../src/components/admin/pcbi/PCBIAdminMasterView';
import { UI_STRINGS } from '../../../../src/constants';
import { PCBI_TARGET_FIELDS } from '../../../../src/constants/pcbiAdmin';
import { pcbiAdminApi } from '../../../../src/utils/pcbiAdminApi';
import { pcbiCommodityDataLabApi } from '../../../../src/utils/pcbiCommodityDataLabApi';
import { validatePCBIUpload } from '../../../../src/utils/pcbiValidator';
import frontendLogger from '../../../../src/utils/logger';
import type {
  PCBIImportResult,
  PCBIValidationSummary,
  PCBIVersionMetrics,
  PCBIVersionRecord
} from '../../../../src/types/pcbiAdmin';

vi.mock('../../../../src/utils/pcbiValidator', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../src/utils/pcbiValidator')>();
  return { ...actual, validatePCBIUpload: vi.fn(actual.validatePCBIUpload) };
});

const ADMIN_NAME = 'Sriman Admin';
const WORKBOOK_FILE_NAME = 'PCBI_TEST.xlsx';
const WORKBOOK_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const MASTER_SHEET_NAME = 'PCBI_Master';
const MASTER_ROWS: unknown[][] = [
  ['PCBI ID', 'Benchmark Name', 'Benchmark Type', 'Category', 'Quality', 'Bench %'],
  ['PCBI-TEST-001', 'Cement Standard', 'DIRECT', 'Cement', 'A', 85]
];
const SOURCE_SHEET_NAME = 'Source Register';
const SOURCE_ROWS: unknown[][] = [
  ['Source Name', 'Source Type'],
  ['Index Desk', 'Publisher']
];
const PROCEED_TO_VALIDATE_LABEL = `${UI_STRINGS.common.proceed} to ${UI_STRINGS.pcbiAdmin.tabValidate}`;

const METRICS: PCBIVersionMetrics = {
  benchmark_count: 120,
  weekly_records_count: 5400,
  constituent_count: 960,
  unspsc_mappings_count: 300,
  a_quality_count: 80,
  b_quality_count: 30,
  c_quality_count: 10,
  total_benchmarkable_pct: 92.5,
  date_start: '2020-01-01',
  date_end: '2026-01-01',
  warnings_count: 2,
  errors_count: 0
};

const PUBLISHED_VERSION: PCBIVersionRecord = {
  id: 'ver-1',
  version: 'V1.0',
  upload_id: 'up-1',
  file_name: 'PCBI_BASE.xlsx',
  file_size_mb: 1.2,
  upload_date: '2026-01-10T00:00:00.000Z',
  uploaded_by: ADMIN_NAME,
  effective_date: '2026-01-10',
  status: 'PUBLISHED',
  metrics: METRICS,
  published_at: '2026-01-11T00:00:00.000Z',
  published_by: ADMIN_NAME
};

const DRAFT_VERSION: PCBIVersionRecord = {
  ...PUBLISHED_VERSION,
  id: 'ver-2',
  version: 'V2.0',
  upload_id: 'up-2',
  file_name: 'PCBI_DRAFT.xlsx',
  status: 'VALIDATED',
  published_at: null,
  published_by: null
};

const IMPORT_RESULT: PCBIImportResult = {
  success: true,
  version: 'V3.0',
  upload_id: 'up-3',
  status: 'VALIDATED',
  import_date: '2026-09-27T07:00:00.000Z',
  successful_records: 1,
  warning_records: 0,
  error_records: 0,
  records_excluded: 0,
  pcbi_records: 1,
  weekly_index_records: 0,
  constituent_records: 0,
  source_records: 0,
  unspsc_mapping_records: 0
};

const VALID_SUMMARY: PCBIValidationSummary = {
  totalRecords: 1,
  validRecords: 1,
  warningRecords: 0,
  errorRecords: 0,
  blockingErrorCount: 0,
  warningCount: 0,
  informationCount: 0,
  aQualityCount: 1,
  bQualityCount: 0,
  cQualityCount: 0,
  avgBenchmarkability: 100,
  dateStart: null,
  dateEnd: null,
  issues: []
};

const buildVersionsResponse = (versions: PCBIVersionRecord[]) => ({
  success: true,
  total: versions.length,
  active_version: versions[0]?.version ?? null,
  versions
});

const buildWorkbookBytes = (sheets: Array<{ name: string; rows: unknown[][] }>): Uint8Array => {
  const workbook = XLSX.utils.book_new();
  sheets.forEach((sheet) => {
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(sheet.rows), sheet.name);
  });
  return new Uint8Array(XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }));
};

const buildUploadFile = (bytes: Uint8Array): File => {
  const file = new File([new Uint8Array(bytes).buffer as ArrayBuffer], WORKBOOK_FILE_NAME, { type: WORKBOOK_MIME_TYPE });
  file.arrayBuffer = vi.fn(() => Promise.resolve(new Uint8Array(bytes).buffer as ArrayBuffer));
  return file;
};

const getFileInput = (container: HTMLElement): HTMLInputElement =>
  container.querySelector('#pcbi-master-file-input') as HTMLInputElement;

const navigateTo = (label: string): void => {
  fireEvent.click(screen.getByRole('button', { name: label }));
};

const stageWorkbook = async (
  container: HTMLElement,
  sheets: Array<{ name: string; rows: unknown[][] }>
): Promise<void> => {
  const validationCallsBefore = vi.mocked(validatePCBIUpload).mock.calls.length;
  navigateTo(UI_STRINGS.pcbiAdmin.tabUpload);
  fireEvent.change(getFileInput(container), { target: { files: [buildUploadFile(buildWorkbookBytes(sheets))] } });
  await waitFor(() => expect(vi.mocked(validatePCBIUpload).mock.calls.length).toBe(validationCallsBefore + 1));
  await screen.findByRole('button', { name: PROCEED_TO_VALIDATE_LABEL });
};

const runImport = async (): Promise<void> => {
  navigateTo(UI_STRINGS.pcbiAdmin.tabImport);
  fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.pcbiAdmin.importButton }));
  await screen.findByRole('heading', { name: new RegExp(UI_STRINGS.pcbiAdmin.importSummaryTitle) });
};

const openPublishModalFromImport = (): void => {
  fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.pcbiAdmin.publishVersionButton(IMPORT_RESULT.version) }));
};

describe('PCBIAdminMasterView coverage', () => {
  beforeEach(() => {
    vi.spyOn(pcbiCommodityDataLabApi, 'detectUploadDomain').mockResolvedValue({
      success: true,
      detection: {
        detectedDomain: 'PCBI_MASTER_SYSTEM_DATA',
        isAllowedInTarget: true,
        targetArea: 'PCBI_MASTER',
        matchedSignatures: []
      }
    });
    vi.spyOn(pcbiAdminApi, 'getVersions').mockResolvedValue(buildVersionsResponse([PUBLISHED_VERSION, DRAFT_VERSION]));
    vi.spyOn(pcbiAdminApi, 'importMaster').mockResolvedValue(IMPORT_RESULT);
    vi.spyOn(pcbiAdminApi, 'publishVersion').mockResolvedValue({
      success: true,
      activeVersion: IMPORT_RESULT.version,
      metrics: METRICS
    });
    vi.mocked(validatePCBIUpload).mockReturnValue(VALID_SUMMARY);
    vi.spyOn(frontendLogger, 'info').mockImplementation(() => ({}) as never);
    vi.spyOn(frontendLogger, 'warn').mockImplementation(() => ({}) as never);
    vi.spyOn(frontendLogger, 'error').mockImplementation(() => ({}) as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('opens the upload tab from the dashboard action', async () => {
    render(<PCBIAdminMasterView />);
    await screen.findByText(`(${PUBLISHED_VERSION.file_name})`);

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.pcbiAdmin.uploadButton }));

    expect(screen.getByText(UI_STRINGS.pcbiAdmin.uploadScreenTitle)).toBeInTheDocument();
  });

  it('opens the upload tab from the page header button', async () => {
    render(<PCBIAdminMasterView />);
    await screen.findByText(`(${PUBLISHED_VERSION.file_name})`);
    const titleBlock = screen.getByRole('heading', { name: UI_STRINGS.pcbiAdmin.title }).parentElement;
    const header = titleBlock?.parentElement as HTMLElement;

    fireEvent.click(within(header).getByRole('button'));

    expect(screen.getByText(UI_STRINGS.pcbiAdmin.uploadScreenTitle)).toBeInTheDocument();
  });

  it('opens version history from the dashboard action', async () => {
    render(<PCBIAdminMasterView />);
    await screen.findByText(`(${PUBLISHED_VERSION.file_name})`);

    // The first match is the sub-tab navigation; the second is the dashboard action.
    fireEvent.click(screen.getAllByRole('button', { name: UI_STRINGS.pcbiAdmin.tabVersionHistory })[1]);

    expect(screen.getByRole('heading', { name: UI_STRINGS.pcbiAdmin.versionHistoryTitle })).toBeInTheDocument();
  });

  it('publishes a draft version from version history and reloads the version list', async () => {
    render(<PCBIAdminMasterView />);
    fireEvent.click(screen.getAllByRole('button', { name: UI_STRINGS.pcbiAdmin.tabVersionHistory })[0]);

    const draftRow = await screen.findByRole('row', { name: (name) => name.includes(DRAFT_VERSION.version) });
    fireEvent.click(within(draftRow).getByRole('button'));

    await waitFor(() => {
      expect(pcbiAdminApi.publishVersion).toHaveBeenCalledWith(DRAFT_VERSION.version, ADMIN_NAME);
    });
    await waitFor(() => expect(pcbiAdminApi.getVersions).toHaveBeenCalledTimes(2));
  });

  it('imports a staged workbook as the next major version and opens the imported master view', async () => {
    const { container } = render(<PCBIAdminMasterView />);
    await stageWorkbook(container, [{ name: MASTER_SHEET_NAME, rows: MASTER_ROWS }]);

    await runImport();

    expect(pcbiAdminApi.importMaster).toHaveBeenCalledWith(
      expect.objectContaining({ version: IMPORT_RESULT.version, file_name: WORKBOOK_FILE_NAME })
    );
    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.pcbiAdmin.viewImportedMaster }));
    expect(screen.getByRole('button', { name: UI_STRINGS.pcbiAdmin.uploadButton })).toBeInTheDocument();
  });

  it('starts at V1.0 and reports an empty active version when no versions exist', async () => {
    vi.mocked(pcbiAdminApi.getVersions).mockResolvedValue(buildVersionsResponse([]));
    const { container } = render(<PCBIAdminMasterView />);
    await stageWorkbook(container, [{ name: MASTER_SHEET_NAME, rows: MASTER_ROWS }]);

    await runImport();

    expect(pcbiAdminApi.importMaster).toHaveBeenCalledWith(expect.objectContaining({ version: 'V1.0' }));
  });

  it('submits an empty benchmark dataset when the workbook has no benchmark master sheet', async () => {
    const { container } = render(<PCBIAdminMasterView />);
    await stageWorkbook(container, [{ name: SOURCE_SHEET_NAME, rows: SOURCE_ROWS }]);

    await runImport();

    expect(pcbiAdminApi.importMaster).toHaveBeenCalledWith(expect.objectContaining({ benchmarks: [] }));
  });

  it('opens the publish modal after import and closes it with cancel', async () => {
    const { container } = render(<PCBIAdminMasterView />);
    await stageWorkbook(container, [{ name: MASTER_SHEET_NAME, rows: MASTER_ROWS }]);
    await runImport();

    openPublishModalFromImport();
    expect(screen.getByRole('heading', { name: UI_STRINGS.pcbiAdmin.publishModalTitle })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.pcbiAdmin.cancel }));

    expect(screen.queryByRole('heading', { name: UI_STRINGS.pcbiAdmin.publishModalTitle })).not.toBeInTheDocument();
  });

  it('publishes the imported version, reloads versions, and switches to the published tab', async () => {
    const { container } = render(<PCBIAdminMasterView />);
    await stageWorkbook(container, [{ name: MASTER_SHEET_NAME, rows: MASTER_ROWS }]);
    await runImport();
    openPublishModalFromImport();

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.pcbiAdmin.confirmPublish }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: UI_STRINGS.pcbiAdmin.publishedVersionsTitle })).toBeInTheDocument();
    });
    expect(pcbiAdminApi.publishVersion).toHaveBeenCalledWith(IMPORT_RESULT.version, ADMIN_NAME);
    // Versions load on mount, again after the import, and again after the publish.
    expect(pcbiAdminApi.getVersions).toHaveBeenCalledTimes(3);
    expect(screen.queryByRole('heading', { name: UI_STRINGS.pcbiAdmin.publishModalTitle })).not.toBeInTheDocument();
  });

  it('publishes the active version when a new upload has cleared the import result', async () => {
    const { container } = render(<PCBIAdminMasterView />);
    await stageWorkbook(container, [{ name: MASTER_SHEET_NAME, rows: MASTER_ROWS }]);
    await runImport();
    openPublishModalFromImport();

    await stageWorkbook(container, [{ name: MASTER_SHEET_NAME, rows: MASTER_ROWS }]);
    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.pcbiAdmin.confirmPublish }));

    await waitFor(() => {
      expect(pcbiAdminApi.publishVersion).toHaveBeenCalledWith(PUBLISHED_VERSION.version, ADMIN_NAME);
    });
  });

  it('does not publish when neither an import result nor an active version exists', async () => {
    vi.mocked(pcbiAdminApi.getVersions).mockResolvedValue(buildVersionsResponse([]));
    const { container } = render(<PCBIAdminMasterView />);
    await stageWorkbook(container, [{ name: MASTER_SHEET_NAME, rows: MASTER_ROWS }]);
    await runImport();
    openPublishModalFromImport();

    await stageWorkbook(container, [{ name: MASTER_SHEET_NAME, rows: MASTER_ROWS }]);
    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.pcbiAdmin.confirmPublish }));

    expect(pcbiAdminApi.publishVersion).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: UI_STRINGS.pcbiAdmin.publishModalTitle })).toBeInTheDocument();
  });

  it('logs an import failure with its message and keeps the import action available', async () => {
    vi.mocked(pcbiAdminApi.importMaster).mockRejectedValueOnce(new Error('Import rejected by server'));
    const { container } = render(<PCBIAdminMasterView />);
    await stageWorkbook(container, [{ name: MASTER_SHEET_NAME, rows: MASTER_ROWS }]);
    navigateTo(UI_STRINGS.pcbiAdmin.tabImport);

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.pcbiAdmin.importButton }));

    await waitFor(() => {
      expect(frontendLogger.error).toHaveBeenCalledWith(expect.any(String), { error: 'Import rejected by server' });
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: UI_STRINGS.pcbiAdmin.importButton })).not.toBeDisabled();
    });
  });

  it('logs a non-Error import failure as text', async () => {
    vi.mocked(pcbiAdminApi.importMaster).mockRejectedValueOnce('import timed out');
    const { container } = render(<PCBIAdminMasterView />);
    await stageWorkbook(container, [{ name: MASTER_SHEET_NAME, rows: MASTER_ROWS }]);
    navigateTo(UI_STRINGS.pcbiAdmin.tabImport);

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.pcbiAdmin.importButton }));

    await waitFor(() => {
      expect(frontendLogger.error).toHaveBeenCalledWith(expect.any(String), { error: 'import timed out' });
    });
  });

  it('logs a publish failure with its message and keeps the publish modal open', async () => {
    vi.mocked(pcbiAdminApi.publishVersion).mockRejectedValueOnce(new Error('Publish blocked'));
    const { container } = render(<PCBIAdminMasterView />);
    await stageWorkbook(container, [{ name: MASTER_SHEET_NAME, rows: MASTER_ROWS }]);
    await runImport();
    openPublishModalFromImport();

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.pcbiAdmin.confirmPublish }));

    await waitFor(() => {
      expect(frontendLogger.error).toHaveBeenCalledWith(expect.any(String), { error: 'Publish blocked' });
    });
    expect(screen.getByRole('heading', { name: UI_STRINGS.pcbiAdmin.publishModalTitle })).toBeInTheDocument();
  });

  it('logs a non-Error publish failure as text', async () => {
    vi.mocked(pcbiAdminApi.publishVersion).mockRejectedValueOnce('publish gateway down');
    const { container } = render(<PCBIAdminMasterView />);
    await stageWorkbook(container, [{ name: MASTER_SHEET_NAME, rows: MASTER_ROWS }]);
    await runImport();
    openPublishModalFromImport();

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.pcbiAdmin.confirmPublish }));

    await waitFor(() => {
      expect(frontendLogger.error).toHaveBeenCalledWith(expect.any(String), { error: 'publish gateway down' });
    });
  });

  it('logs a version-list failure with its message', async () => {
    vi.mocked(pcbiAdminApi.getVersions).mockRejectedValueOnce(new Error('Versions unreachable'));

    render(<PCBIAdminMasterView />);

    await waitFor(() => {
      expect(frontendLogger.error).toHaveBeenCalledWith(expect.any(String), { error: 'Versions unreachable' });
    });
    expect(screen.getByRole('alert')).toHaveTextContent(UI_STRINGS.pcbiAdmin.versionsLoadFailed('Versions unreachable'));
  });

  it('shows an actionable unavailable-route error and reloads database versions when retried', async () => {
    vi.mocked(pcbiAdminApi.getVersions)
      .mockRejectedValueOnce(new Error('HTTP 501'))
      .mockResolvedValueOnce(buildVersionsResponse([PUBLISHED_VERSION]));
    render(<PCBIAdminMasterView />);

    expect(await screen.findByRole('alert')).toHaveTextContent(UI_STRINGS.pcbiAdmin.versionsLoadFailed('HTTP 501'));
    expect(screen.getByText(UI_STRINGS.pcbiAdmin.noPublishedBaseline)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.pcbiAdmin.versionsRetry }));

    await screen.findByText(`(${PUBLISHED_VERSION.file_name})`);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(pcbiAdminApi.getVersions).toHaveBeenCalledTimes(2);
  });

  it('logs a non-Error version-list failure as text', async () => {
    vi.mocked(pcbiAdminApi.getVersions).mockRejectedValueOnce('versions service offline');

    render(<PCBIAdminMasterView />);

    await waitFor(() => {
      expect(frontendLogger.error).toHaveBeenCalledWith(expect.any(String), { error: 'versions service offline' });
    });
  });

  it('ignores an unsuccessful version-list response without logging an error', async () => {
    vi.mocked(pcbiAdminApi.getVersions).mockResolvedValueOnce({
      success: false,
      total: 0,
      active_version: null,
      versions: []
    });

    render(<PCBIAdminMasterView />);

    await waitFor(() => expect(pcbiAdminApi.getVersions).toHaveBeenCalled());
    expect(frontendLogger.error).not.toHaveBeenCalled();
  });

  it('uses the first version as active when no version is published', async () => {
    vi.mocked(pcbiAdminApi.getVersions).mockResolvedValue(buildVersionsResponse([DRAFT_VERSION]));

    render(<PCBIAdminMasterView />);

    await screen.findByText(`(${DRAFT_VERSION.file_name})`);
    expect(screen.getByRole('button', { name: UI_STRINGS.pcbiAdmin.uploadButton })).toBeInTheDocument();
    expect(frontendLogger.error).not.toHaveBeenCalled();
  });

  it('overrides only the selected worksheet when several worksheets were detected', async () => {
    const { container } = render(<PCBIAdminMasterView />);
    await stageWorkbook(container, [
      { name: MASTER_SHEET_NAME, rows: MASTER_ROWS },
      { name: SOURCE_SHEET_NAME, rows: SOURCE_ROWS }
    ]);

    const [firstWorksheetSelect] = screen.getAllByRole('combobox');
    fireEvent.change(firstWorksheetSelect, { target: { value: 'WEEKLY_INDEX' } });

    expect(screen.getAllByRole('combobox')[0]).toHaveValue('WEEKLY_INDEX');
  });

  it('walks from upload through validation and preview to the import tab', async () => {
    const { container } = render(<PCBIAdminMasterView />);
    await stageWorkbook(container, [{ name: MASTER_SHEET_NAME, rows: MASTER_ROWS }]);

    fireEvent.click(screen.getByRole('button', { name: PROCEED_TO_VALIDATE_LABEL }));
    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.pcbiAdmin.proceedToPreview }));
    expect(screen.getByText(UI_STRINGS.pcbiAdmin.previewTitle)).toBeInTheDocument();
    // The preview tab's proceed control is labelled with the import action text.
    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.pcbiAdmin.importButton }));

    expect(screen.getByRole('button', { name: UI_STRINGS.pcbiAdmin.importButton })).toBeInTheDocument();
  });

  it('keeps the import action disabled when the import tab opens before any file is staged', async () => {
    render(<PCBIAdminMasterView />);
    await screen.findByText(`(${PUBLISHED_VERSION.file_name})`);

    navigateTo(UI_STRINGS.pcbiAdmin.tabImport);

    expect(screen.getByRole('button', { name: UI_STRINGS.pcbiAdmin.importButton })).toBeDisabled();
  });

  it('maps a column to a target field and shows the new mapping', async () => {
    const { container } = render(<PCBIAdminMasterView />);
    await stageWorkbook(container, [{ name: MASTER_SHEET_NAME, rows: MASTER_ROWS }]);
    const categoryRow = screen.getByRole('row', { name: (name) => name.startsWith('Category') });
    const mappingSelect = within(categoryRow).getByRole('combobox');
    const targetField = PCBI_TARGET_FIELDS.PCBI_MASTER[1].field;

    fireEvent.change(mappingSelect, { target: { value: targetField } });

    expect(mappingSelect).toHaveValue(targetField);
  });

  it('clears a column mapping to unmapped and keeps the mapping row', async () => {
    const { container } = render(<PCBIAdminMasterView />);
    await stageWorkbook(container, [{ name: MASTER_SHEET_NAME, rows: MASTER_ROWS }]);

    // Mapping rows start with their Excel column name; select options also add text to the row name.
    const pcbiIdRow = screen.getByRole('row', { name: (name) => name.startsWith(MASTER_ROWS[0][0] as string) });
    const mappingSelect = within(pcbiIdRow).getByRole('combobox');
    fireEvent.change(mappingSelect, { target: { value: '' } });

    expect(mappingSelect).toHaveValue('');
  });
});
