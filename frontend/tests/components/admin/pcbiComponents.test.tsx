import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PCBIDashboardTab } from '../../../src/components/admin/pcbi/PCBIDashboardTab';
import { PCBIUploadTab } from '../../../src/components/admin/pcbi/PCBIUploadTab';
import { PCBIValidateTab } from '../../../src/components/admin/pcbi/PCBIValidateTab';
import { PCBIPreviewTab } from '../../../src/components/admin/pcbi/PCBIPreviewTab';
import { PCBIImportTab } from '../../../src/components/admin/pcbi/PCBIImportTab';
import { PCBIVersionsTab } from '../../../src/components/admin/pcbi/PCBIVersionsTab';
import { PCBIPublishModal } from '../../../src/components/admin/pcbi/PCBIPublishModal';
import { PCBIAdminMasterView } from '../../../src/components/admin/pcbi/PCBIAdminMasterView';
import { pcbiAdminApi } from '../../../src/utils/pcbiAdminApi';
import { UI_STRINGS } from '../../../src/constants';
import type {
  PCBIVersionRecord,
  PCBIValidationSummary,
  PCBIWorksheetDetection,
  PCBIColumnMapping,
  PCBIImportResult
} from '../../../src/types/pcbiAdmin';

const mockVersion: PCBIVersionRecord = {
  id: 'ver-1',
  version: 'V1.0',
  upload_id: 'up-1',
  file_name: 'PCBI_GLOBAL_MASTER_V1_2020_2026.xlsx',
  file_size_mb: 3.54,
  upload_date: '2026-01-01T00:00:00.000Z',
  uploaded_by: 'Sriman Admin',
  effective_date: '2020-04-01T00:00:00.000Z',
  status: 'PUBLISHED',
  metrics: {
    benchmark_count: 290,
    weekly_records_count: 95700,
    constituent_count: 290,
    unspsc_mappings_count: 73,
    a_quality_count: 240,
    b_quality_count: 45,
    c_quality_count: 5,
    total_benchmarkable_pct: 75.8,
    date_start: '2020-04-01',
    date_end: '2026-07-31',
    warnings_count: 0,
    errors_count: 0
  }
};

describe('PCBI Admin UI Components Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('PCBIDashboardTab renders metrics and navigation buttons', () => {
    const onUpload = vi.fn();
    const onVersions = vi.fn();

    render(
      <PCBIDashboardTab
        activeVersion={mockVersion}
        onNavigateToUpload={onUpload}
        onNavigateToVersions={onVersions}
      />
    );

    expect(screen.getByText('V1.0')).toBeInTheDocument();
    expect(screen.getAllByText('290')).toHaveLength(2);
    expect(screen.getByText('95,700')).toBeInTheDocument();

    // PCBI V1.3.1 Independent Dimensions & Critical Materiality Rule Assertions
    expect(screen.getByText(UI_STRINGS.pcbiAdmin.definitionStatusTitle)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.pcbiAdmin.dataStatusTitle)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.pcbiAdmin.criticalMaterialityRuleNotice)).toBeInTheDocument();

    const uploadBtn = screen.getByText('+ Upload PCBI Master');
    fireEvent.click(uploadBtn);
    expect(onUpload).toHaveBeenCalled();

    const versionsBtn = screen.getByText('Version History');
    fireEvent.click(versionsBtn);
    expect(onVersions).toHaveBeenCalled();
  });


  it('PCBIUploadTab renders dropzone and handles file selection', () => {
    const onUpload = vi.fn();
    const onOverrideWs = vi.fn();
    const onOverrideCol = vi.fn();
    const onProceed = vi.fn();

    const mockWs: PCBIWorksheetDetection[] = [
      {
        sheetName: 'PCBI_Benchmark_Master',
        detectedType: 'PCBI_MASTER',
        purposeLabel: 'Benchmark Master',
        rowCount: 290,
        columnCount: 10,
        headers: ['PCBI ID', 'Category'],
        confidence: 95
      }
    ];

    const mockMaps: Record<string, PCBIColumnMapping[]> = {
      PCBI_MASTER: [
        {
          excelColumn: 'PCBI ID',
          mappedField: 'pcbi_id',
          fieldLabel: 'PCBI ID',
          isRequired: true,
          confidence: 100,
          status: 'MAPPED',
          sampleValues: ['PCBI-001']
        }
      ]
    };

    render(
      <PCBIUploadTab
        uploadedFile={new File(['test'], 'test.xlsx')}
        fileMetadata={{
          name: 'test.xlsx',
          sizeMb: 1.0,
          uploadDate: '2026-01-01',
          uploadedBy: 'Admin',
          worksheetCount: 1,
          totalRecords: 290
        }}
        worksheets={mockWs}
        mappings={mockMaps}
        onFileUpload={onUpload}
        onOverrideWorksheet={onOverrideWs}
        onOverrideColumnMapping={onOverrideCol}
        onProceedToValidate={onProceed}
      />
    );

    expect(screen.getByText('test.xlsx')).toBeInTheDocument();
    expect(screen.getByText('PCBI_Benchmark_Master')).toBeInTheDocument();

    const proceedBtn = screen.getByText(/Proceed to Validate/i);
    fireEvent.click(proceedBtn);
    expect(onProceed).toHaveBeenCalled();
  });

  it('PCBIValidateTab renders validation summary, filters issues and proceeds', () => {
    const onProceed = vi.fn();
    const mockSummary: PCBIValidationSummary = {
      totalRecords: 100,
      validRecords: 98,
      warningRecords: 1,
      errorRecords: 1,
      blockingErrorCount: 1,
      warningCount: 1,
      aQualityCount: 80,
      bQualityCount: 18,
      cQualityCount: 2,
      avgBenchmarkability: 75,
      dateStart: '2020-04-01',
      dateEnd: '2026-07-31',
      issues: [
        {
          id: 'err-1',
          sheetName: 'PCBI_MASTER',
          rowNumber: 2,
          column: 'PCBI ID',
          rawValue: '',
          severity: 'BLOCKING_ERROR',
          rule: 'REQUIRED_FIELD_MISSING',
          message: 'Missing ID',
          resolution: 'Add ID'
        },
        {
          id: 'warn-1',
          sheetName: 'WEEKLY_INDEX',
          rowNumber: 5,
          column: 'Source',
          rawValue: '',
          severity: 'WARNING',
          rule: 'SOURCE_PENDING',
          message: 'Source pending',
          resolution: 'Fill source'
        }
      ]
    };

    render(
      <PCBIValidateTab validationSummary={mockSummary} onProceedToPreview={onProceed} />
    );

    expect(screen.getByText('Missing ID')).toBeInTheDocument();
    expect(screen.getByText('Source pending')).toBeInTheDocument();

    const proceedBtn = screen.getByText(/Proceed to Preview/i);
    fireEvent.click(proceedBtn);
    expect(onProceed).toHaveBeenCalled();
  });

  it('PCBIPreviewTab renders 50-record previews and controls import action', () => {
    const onImport = vi.fn();
    const mockSummary: PCBIValidationSummary = {
      totalRecords: 1,
      validRecords: 1,
      warningRecords: 0,
      errorRecords: 0,
      blockingErrorCount: 0,
      warningCount: 0,
      aQualityCount: 1,
      bQualityCount: 0,
      cQualityCount: 0,
      avgBenchmarkability: 80,
      dateStart: '2020-04-01',
      dateEnd: '2026-07-31',
      issues: []
    };

    const datasets = {
      PCBI_MASTER: [{ 'PCBI ID': 'PCBI-0001', Category: 'Steel' }],
      WEEKLY_INDEX: [],
      CONSTITUENTS: [],
      SOURCES: [],
      UNSPSC_MAPPING: []
    };

    render(
      <PCBIPreviewTab
        validationSummary={mockSummary}
        datasets={datasets}
        onProceedToImport={onImport}
      />
    );

    expect(screen.getByText('PCBI-0001')).toBeInTheDocument();

    // PCBI V1.3.1 Preview Safety Badges Assertions
    expect(screen.getByText(UI_STRINGS.pcbiAdmin.previewSimulationBadge)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.pcbiAdmin.previewNotProductionBadge)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.pcbiAdmin.previewNotApprovedBadge)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.pcbiAdmin.previewSandboxNotice)).toBeInTheDocument();

    const importBtn = screen.getByText('Import PCBI Master');
    expect(importBtn).not.toBeDisabled();
    fireEvent.click(importBtn);
    expect(onImport).toHaveBeenCalled();
  });

  it('PCBIImportTab renders post-import summary and triggers report downloads', () => {
    const onExecute = vi.fn();
    const onPublish = vi.fn();
    const onViewMaster = vi.fn();

    const importResult: PCBIImportResult = {
      success: true,
      version: 'V2.0',
      upload_id: 'up-2',
      status: 'VALIDATED',
      import_date: '2026-09-27T07:00:00.000Z',
      successful_records: 290,
      warning_records: 5,
      error_records: 0,
      records_excluded: 0,
      pcbi_records: 290,
      weekly_index_records: 95700,
      constituent_records: 290,
      source_records: 5,
      unspsc_mapping_records: 73
    };

    const summary: PCBIValidationSummary = {
      totalRecords: 290,
      validRecords: 290,
      warningRecords: 5,
      errorRecords: 0,
      blockingErrorCount: 0,
      warningCount: 5,
      aQualityCount: 240,
      bQualityCount: 45,
      cQualityCount: 5,
      avgBenchmarkability: 75,
      dateStart: '2020-04-01',
      dateEnd: '2026-07-31',
      issues: []
    };

    render(
      <PCBIImportTab
        importResult={importResult}
        validationSummary={summary}
        fileName="test.xlsx"
        isImporting={false}
        onExecuteImport={onExecute}
        onOpenPublishModal={onPublish}
        onViewImportedMaster={onViewMaster}
      />
    );

    expect(screen.getByText(new RegExp(`${UI_STRINGS.pcbiAdmin.importSummaryTitle}.*V2.0`, 'i'))).toBeInTheDocument();
    expect(screen.getByText('PCBI MASTER')).toBeInTheDocument();
    expect(screen.getByText('WEEKLY INDEX')).toBeInTheDocument();

    const publishBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.pcbiAdmin.publishVersionButton('V2.0'), 'i') });
    fireEvent.click(publishBtn);
    expect(onPublish).toHaveBeenCalled();

    const viewBtn = screen.getByText('View Imported PCBI Master');
    fireEvent.click(viewBtn);
    expect(onViewMaster).toHaveBeenCalled();
  });

  it('PCBIVersionsTab renders version list and publish trigger', () => {
    const onPublish = vi.fn();

    render(
      <PCBIVersionsTab versions={[mockVersion]} onPublishVersion={onPublish} />
    );

    expect(screen.getByText('V1.0')).toBeInTheDocument();
    expect(screen.getByText('PCBI_GLOBAL_MASTER_V1_2020_2026.xlsx')).toBeInTheDocument();
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
  });

  it('PCBIPublishModal renders confirmation summary and confirms', () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    render(
      <PCBIPublishModal
        isOpen={true}
        version="V2.0"
        metrics={mockVersion.metrics}
        isPublishing={false}
        onConfirmPublish={onConfirm}
        onClose={onClose}
      />
    );

    expect(screen.getByText(/Publish PCBI Version to Production/i)).toBeInTheDocument();
    expect(screen.getByText(/Target Version: V2.0/i)).toBeInTheDocument();

    const confirmBtn = screen.getByText('Confirm & Publish Version');
    fireEvent.click(confirmBtn);
    expect(onConfirm).toHaveBeenCalled();

    const cancelBtn = screen.getByText('Cancel');
    fireEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('PCBIAdminMasterView mounts and loads versions from API', async () => {
    vi.spyOn(pcbiAdminApi, 'getVersions').mockResolvedValueOnce({
      success: true,
      total: 1,
      active_version: 'V1.0',
      versions: [mockVersion]
    });

    render(<PCBIAdminMasterView />);

    await waitFor(() => {
      expect(screen.getByText('PCBI Master Administration')).toBeInTheDocument();
    });

    expect(screen.getAllByText('+ Upload PCBI Master').length).toBeGreaterThanOrEqual(1);

    // Switch to Upload tab using sub-tab button
    const uploadSubTabBtn = screen.getAllByRole('button', { name: /Upload PCBI Master/i }).find(
      (b) => b.textContent?.trim() === 'Upload PCBI Master'
    );
    if (uploadSubTabBtn) fireEvent.click(uploadSubTabBtn);
    expect(screen.getByText('PCBI Master Upload')).toBeInTheDocument();

    // Switch to Validate tab
    fireEvent.click(screen.getByRole('button', { name: /Validate/i }));
    expect(screen.getByText(/No Validation Data Available/i)).toBeInTheDocument();    // Switch to Preview tab
    fireEvent.click(screen.getByRole('button', { name: /Preview/i }));
    expect(screen.getByText('Preview Datasets')).toBeInTheDocument();

    // Switch to Import tab
    fireEvent.click(screen.getByRole('button', { name: /^Import$/i }));
    expect(screen.getByText(UI_STRINGS.pcbiAdmin.importConfirmTitle)).toBeInTheDocument();

    // Switch to Version History tab
    fireEvent.click(screen.getByRole('button', { name: /Version History/i }));
    expect(screen.getByText('PCBI Version History')).toBeInTheDocument();

    // Switch to Published Versions tab
    fireEvent.click(screen.getByRole('button', { name: /Published Versions/i }));
    expect(screen.getAllByText('Published Versions').length).toBeGreaterThanOrEqual(1);
  });


  it('PCBIUploadTab handles file drag drop, worksheet override, and column override', () => {
    const onUpload = vi.fn();
    const onOverrideWs = vi.fn();
    const onOverrideCol = vi.fn();
    const onProceed = vi.fn();

    const mockWs: PCBIWorksheetDetection[] = [
      {
        sheetName: 'Weekly_Series',
        detectedType: 'WEEKLY_INDEX',
        purposeLabel: 'Weekly Index',
        rowCount: 100,
        columnCount: 4,
        headers: ['PCBI ID', 'Week Start', 'Index Value', 'Note'],
        confidence: 90
      }
    ];

    const mockMaps: Record<string, PCBIColumnMapping[]> = {
      WEEKLY_INDEX: [
        {
          excelColumn: 'PCBI ID',
          mappedField: 'pcbi_id',
          fieldLabel: 'PCBI ID',
          isRequired: true,
          confidence: 100,
          status: 'MAPPED',
          sampleValues: ['PCBI-001']
        }
      ]
    };

    render(
      <PCBIUploadTab
        uploadedFile={new File(['test'], 'test.xlsx')}
        fileMetadata={{
          name: 'test.xlsx',
          sizeMb: 1.0,
          uploadDate: '2026-01-01',
          uploadedBy: 'Admin',
          worksheetCount: 1,
          totalRecords: 100
        }}
        worksheets={mockWs}
        mappings={mockMaps}
        onFileUpload={onUpload}
        onOverrideWorksheet={onOverrideWs}
        onOverrideColumnMapping={onOverrideCol}
        onProceedToValidate={onProceed}
      />
    );

    // Test worksheet override select
    const wsSelect = screen.getByLabelText('Override purpose for Weekly_Series');
    fireEvent.change(wsSelect, { target: { value: 'PCBI_MASTER' } });
    expect(onOverrideWs).toHaveBeenCalledWith('Weekly_Series', 'PCBI_MASTER');

    // Test column mapping override select
    const colSelect = screen.getByLabelText('Select dataset for column mapping');
    fireEvent.change(colSelect, { target: { value: 'PCBI_MASTER' } });
  });


  it('PCBIValidateTab filters issues by severity and search term, and handles empty issues', () => {
    const onProceed = vi.fn();
    const mockSummary: PCBIValidationSummary = {
      totalRecords: 10,
      validRecords: 8,
      warningRecords: 1,
      errorRecords: 1,
      blockingErrorCount: 1,
      warningCount: 1,
      aQualityCount: 5,
      bQualityCount: 5,
      cQualityCount: 0,
      avgBenchmarkability: 70,
      dateStart: '2020-04-01',
      dateEnd: '2026-07-31',
      issues: [
        {
          id: 'err-1',
          sheetName: 'PCBI_MASTER',
          rowNumber: 2,
          column: 'Category',
          rawValue: '',
          severity: 'BLOCKING_ERROR',
          rule: 'REQUIRED_FIELD_MISSING',
          message: 'Category is missing',
          resolution: 'Assign Category'
        },
        {
          id: 'warn-1',
          sheetName: 'WEEKLY_INDEX',
          rowNumber: 10,
          column: 'Note',
          rawValue: '',
          severity: 'WARNING',
          rule: 'SOURCE_PENDING',
          message: 'Note is pending',
          resolution: 'Verify note'
        }
      ]
    };

    const { rerender } = render(
      <PCBIValidateTab validationSummary={mockSummary} onProceedToPreview={onProceed} />
    );

    expect(screen.getByText('Category is missing')).toBeInTheDocument();
    expect(screen.getByText('Note is pending')).toBeInTheDocument();

    // Filter by WARNING
    const warningFilterBtn = screen.getByRole('button', { name: /Warnings/i });
    fireEvent.click(warningFilterBtn);
    expect(screen.getByText('Note is pending')).toBeInTheDocument();
    expect(screen.queryByText('Category is missing')).not.toBeInTheDocument();

    // Filter by BLOCKING_ERROR (Errors)
    const errorFilterBtn = screen.getByRole('button', { name: /Errors/i });
    fireEvent.click(errorFilterBtn);
    expect(screen.getByText('Category is missing')).toBeInTheDocument();
    expect(screen.queryByText('Note is pending')).not.toBeInTheDocument();

    // Back to All
    const allFilterBtn = screen.getByRole('button', { name: /^All/i });
    fireEvent.click(allFilterBtn);
    expect(screen.getByText('Category is missing')).toBeInTheDocument();
    expect(screen.getByText('Note is pending')).toBeInTheDocument();

    // Rerender with 0 issues
    rerender(
      <PCBIValidateTab
        validationSummary={{ ...mockSummary, issues: [], blockingErrorCount: 0, warningCount: 0 }}
        onProceedToPreview={onProceed}
      />
    );
    expect(screen.getByText(/Zero issues detected for the selected filter!/i)).toBeInTheDocument();
  });



  it('PCBIPreviewTab switches dataset tabs and disables import on blocking errors', () => {
    const onImport = vi.fn();
    const mockSummaryWithErrors: PCBIValidationSummary = {
      totalRecords: 1,
      validRecords: 0,
      warningRecords: 0,
      errorRecords: 1,
      blockingErrorCount: 1,
      warningCount: 0,
      aQualityCount: 0,
      bQualityCount: 0,
      cQualityCount: 0,
      avgBenchmarkability: 70,
      dateStart: null,
      dateEnd: null,
      issues: []
    };

    const datasets = {
      PCBI_MASTER: [{ 'PCBI ID': 'PCBI-0001', Category: 'Steel' }],
      WEEKLY_INDEX: [{ 'PCBI ID': 'PCBI-0001', 'Week Start': '2020-04-01' }],
      CONSTITUENTS: [{ 'PCBI ID': 'PCBI-0001', 'Cost Driver': 'Iron Ore' }],
      SOURCES: [{ 'Source Name': 'Platts' }],
      UNSPSC_MAPPING: [{ 'UNSPSC Code': '30101700' }]
    };

    render(
      <PCBIPreviewTab
        validationSummary={mockSummaryWithErrors}
        datasets={datasets}
        onProceedToImport={onImport}
      />
    );

    // Verify import button is disabled when blockingErrorCount > 0
    const importBtn = screen.getByRole('button', { name: /Import PCBI Master/i });
    expect(importBtn).toBeDisabled();

    // Switch dataset preview tabs
    fireEvent.click(screen.getByRole('button', { name: /Weekly Index/i }));
    expect(screen.getByText('2020-04-01')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Constituents/i }));
    expect(screen.getByText('Iron Ore')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Sources/i }));
    expect(screen.getByText('Platts')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /UNSPSC Mapping/i }));
    expect(screen.getByText('30101700')).toBeInTheDocument();
  });

  it('PCBIVersionsTab handles filters and publishing non-published versions', async () => {
    const onPublish = vi.fn();
    const versions: PCBIVersionRecord[] = [
      mockVersion,
      {
        ...mockVersion,
        id: 'ver-2',
        version: 'V2.0',
        status: 'VALIDATED'
      },
      {
        ...mockVersion,
        id: 'ver-3',
        version: 'V3.0',
        status: 'DRAFT'
      }
    ];

    const { rerender } = render(
      <PCBIVersionsTab versions={versions} onPublishVersion={onPublish} />
    );

    expect(screen.getByText('V1.0')).toBeInTheDocument();
    expect(screen.getByText('V2.0')).toBeInTheDocument();
    expect(screen.getByText('V3.0')).toBeInTheDocument();

    // Click Publish button for V2.0 (non-published)
    const publishBtns = screen.getAllByRole('button', { name: /Publish/i });
    expect(publishBtns.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(publishBtns[0]);
    expect(onPublish).toHaveBeenCalled();

    // Rerender with showOnlyPublished
    rerender(
      <PCBIVersionsTab versions={versions} onPublishVersion={onPublish} showOnlyPublished={true} />
    );
    expect(screen.getByText('V1.0')).toBeInTheDocument();
    expect(screen.queryByText('V2.0')).not.toBeInTheDocument();
    expect(screen.queryByText('V3.0')).not.toBeInTheDocument();
  });


  it('PCBIImportTab pre-import state triggers import and downloads report/error CSV', () => {
    const onExecute = vi.fn();
    const onPublish = vi.fn();
    const onViewMaster = vi.fn();

    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');

    const summary: PCBIValidationSummary = {
      totalRecords: 10,
      validRecords: 10,
      warningRecords: 0,
      errorRecords: 0,
      blockingErrorCount: 0,
      warningCount: 0,
      aQualityCount: 10,
      bQualityCount: 0,
      cQualityCount: 0,
      avgBenchmarkability: 80,
      dateStart: '2020-04-01',
      dateEnd: '2026-07-31',
      issues: [
        {
          id: 'err-1',
          sheetName: 'PCBI_MASTER',
          rowNumber: 2,
          column: 'Category',
          rawValue: '',
          severity: 'BLOCKING_ERROR',
          rule: 'REQUIRED_FIELD_MISSING',
          message: 'Missing category',
          resolution: 'Add category'
        }
      ]
    };

    const { rerender } = render(
      <PCBIImportTab
        importResult={null}
        validationSummary={summary}
        fileName="test.xlsx"
        isImporting={false}
        onExecuteImport={onExecute}
        onOpenPublishModal={onPublish}
        onViewImportedMaster={onViewMaster}
      />
    );

    // Pre-import trigger
    const executeBtn = screen.getByRole('button', { name: /Import PCBI Master/i });
    fireEvent.click(executeBtn);
    expect(onExecute).toHaveBeenCalled();

    // Post-import state with download triggers
    const importResult: PCBIImportResult = {
      success: true,
      version: 'V2.0',
      upload_id: 'up-2',
      status: 'VALIDATED',
      import_date: '2026-09-27T07:00:00.000Z',
      successful_records: 10,
      warning_records: 0,
      error_records: 0,
      records_excluded: 0,
      pcbi_records: 10,
      weekly_index_records: 100,
      constituent_records: 10,
      source_records: 2,
      unspsc_mapping_records: 5
    };

    rerender(
      <PCBIImportTab
        importResult={importResult}
        validationSummary={summary}
        fileName="test.xlsx"
        isImporting={false}
        onExecuteImport={onExecute}
        onOpenPublishModal={onPublish}
        onViewImportedMaster={onViewMaster}
      />
    );

    const reportBtn = screen.getByRole('button', { name: /Download Validation Report/i });
    fireEvent.click(reportBtn);
    expect(window.URL.createObjectURL).toHaveBeenCalled();

    const errorBtn = screen.getByRole('button', { name: /Download Error Records/i });
    fireEvent.click(errorBtn);
    expect(window.URL.createObjectURL).toHaveBeenCalled();
  });

  it('PCBIImportTab handles disabled import, active importing state, invalid dates, and missing summary downloads', () => {
    const errorSummary: PCBIValidationSummary = {
      totalRecords: 10,
      validRecords: 5,
      warningRecords: 0,
      errorRecords: 5,
      blockingErrorCount: 5,
      warningCount: 0,
      aQualityCount: 0,
      bQualityCount: 0,
      cQualityCount: 0,
      avgBenchmarkability: 0,
      dateStart: '',
      dateEnd: '',
      issues: []
    };

    const { rerender } = render(
      <PCBIImportTab
        importResult={null}
        validationSummary={errorSummary}
        fileName="invalid.xlsx"
        isImporting={false}
        onExecuteImport={vi.fn()}
        onOpenPublishModal={vi.fn()}
        onViewImportedMaster={vi.fn()}
      />
    );

    expect(screen.getByText(UI_STRINGS.pcbiAdmin.importDisabledTooltip)).toBeInTheDocument();
    const disabledBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.pcbiAdmin.importButton, 'i') });
    expect(disabledBtn).toBeDisabled();

    // Re-render in importing state
    rerender(
      <PCBIImportTab
        importResult={null}
        validationSummary={null}
        fileName="invalid.xlsx"
        isImporting={true}
        onExecuteImport={vi.fn()}
        onOpenPublishModal={vi.fn()}
        onViewImportedMaster={vi.fn()}
      />
    );
    expect(screen.getByText(UI_STRINGS.pcbiAdmin.importingState)).toBeInTheDocument();

    // Re-render post-import with invalid date and missing summary
    const invalidDateResult: PCBIImportResult = {
      success: true,
      version: 'V1.0',
      upload_id: 'up-err',
      status: 'VALIDATED',
      import_date: 'not-a-valid-date',
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

    rerender(
      <PCBIImportTab
        importResult={invalidDateResult}
        validationSummary={null}
        fileName="invalid.xlsx"
        isImporting={false}
        onExecuteImport={vi.fn()}
        onOpenPublishModal={vi.fn()}
        onViewImportedMaster={vi.fn()}
      />
    );

    // Downloads with null validationSummary should safely return without error
    const reportBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.pcbiAdmin.downloadValidationReport, 'i') });
    fireEvent.click(reportBtn);

    const errorBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.pcbiAdmin.downloadErrorRecords, 'i') });
    fireEvent.click(errorBtn);

    expect(screen.getByText('not-a-valid-date')).toBeInTheDocument();
  });

  it('PCBIPublishModal handles isOpen false, publishing state, and empty metrics', () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    const { rerender } = render(
      <PCBIPublishModal
        isOpen={false}
        version="V1.0"
        metrics={null}
        isPublishing={false}
        onConfirmPublish={onConfirm}
        onClose={onClose}
      />
    );

    expect(screen.queryByText(/Publish PCBI Version to Production/i)).not.toBeInTheDocument();

    rerender(
      <PCBIPublishModal
        isOpen={true}
        version="V1.0"
        metrics={null}
        isPublishing={true}
        onConfirmPublish={onConfirm}
        onClose={onClose}
      />
    );

    expect(screen.getByText('Publishing...')).toBeInTheDocument();
  });

  it('PCBIUploadTab handles file input change and column optional status', async () => {
    const onUpload = vi.fn();
    const onOverrideWs = vi.fn();
    const onOverrideCol = vi.fn();
    const onProceed = vi.fn();

    const mockMaps: Record<string, PCBIColumnMapping[]> = {
      PCBI_MASTER: [
        {
          excelColumn: 'Notes',
          mappedField: '',
          fieldLabel: 'Notes',
          isRequired: false,
          confidence: 50,
          status: 'OPTIONAL',
          sampleValues: []
        }
      ]
    };

    const { container } = render(
      <PCBIUploadTab
        uploadedFile={new File(['test'], 'test.xlsx')}
        fileMetadata={{
          name: 'test.xlsx',
          sizeMb: 1.0,
          uploadDate: '2026-01-01',
          uploadedBy: 'Admin',
          worksheetCount: 1,
          totalRecords: 10
        }}
        worksheets={[
          {
            sheetName: 'Sheet1',
            detectedType: 'PCBI_MASTER',
            purposeLabel: 'Benchmark Master',
            rowCount: 10,
            columnCount: 1,
            headers: ['Notes'],
            confidence: 90
          }
        ]}
        mappings={mockMaps}
        onFileUpload={onUpload}
        onOverrideWorksheet={onOverrideWs}
        onOverrideColumnMapping={onOverrideCol}
        onProceedToValidate={onProceed}
      />
    );

    // Verify OPTIONAL badge
    expect(screen.getByText('OPTIONAL')).toBeInTheDocument();

    // Fire column override to map it
    const colSelect = screen.getByLabelText('Map column Notes');
    fireEvent.change(colSelect, { target: { value: 'pcbi_id' } });
    expect(onOverrideCol).toHaveBeenCalledWith('PCBI_MASTER', 'Notes', 'pcbi_id');

    // Fire file input change with empty files
    const fileInput = container.querySelector('#pcbi-master-file-input');
    if (fileInput) {
      fireEvent.change(fileInput, { target: { files: [] } });
    }
  });

  it('PCBIAdminMasterView executes complete import and publish lifecycle with real file upload', async () => {
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ['PCBI ID', 'Benchmark Name', 'Benchmark Type', 'Category', 'Quality', 'Bench %'],
      ['PCBI-TEST-001', 'Cement Standard', 'DIRECT', 'Cement', 'A', 85]
    ]);
    XLSX.utils.book_append_sheet(wb, ws, 'PCBI_Master');
    const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const mockFile = new File([wbout], 'PCBI_TEST.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    mockFile.arrayBuffer = vi.fn().mockResolvedValue(new Uint8Array(wbout).buffer);

    vi.spyOn(pcbiAdminApi, 'getVersions').mockResolvedValue({
      success: true,
      total: 1,
      active_version: 'V1.0',
      versions: [mockVersion]
    });

    vi.spyOn(pcbiAdminApi, 'importMaster').mockResolvedValue({
      success: true,
      version: 'V2.0',
      upload_id: 'up-2',
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
    });

    vi.spyOn(pcbiAdminApi, 'publishVersion').mockResolvedValue({
      success: true,
      activeVersion: 'V2.0',
      metrics: mockVersion.metrics
    });

    const { container } = render(<PCBIAdminMasterView />);

    await waitFor(() => {
      expect(screen.getByText('PCBI Master Administration')).toBeInTheDocument();
    });

    // Navigate to Upload tab
    const uploadSubTab = screen.getAllByRole('button', { name: /Upload PCBI Master/i }).find(
      (b) => b.textContent?.trim() === 'Upload PCBI Master'
    );
    if (uploadSubTab) fireEvent.click(uploadSubTab);

    // Fire file input change with the generated real workbook
    const fileInput = container.querySelector('#pcbi-master-file-input');
    expect(fileInput).toBeInTheDocument();
    if (fileInput) {
      await fireEvent.change(fileInput, { target: { files: [mockFile] } });
    }

    // Wait for parse & worksheet detection
    await waitFor(() => {
      expect(screen.getByText('PCBI_TEST.xlsx')).toBeInTheDocument();
    });

    // Test worksheet override within master view
    const wsOverrideSelect = screen.getByLabelText(/Override purpose for PCBI_Master/i);
    fireEvent.change(wsOverrideSelect, { target: { value: 'PCBI_MASTER' } });

    // Test column mapping override within master view
    const colOverrideSelect = screen.getByLabelText(/Map column Category/i);
    fireEvent.change(colOverrideSelect, { target: { value: 'category' } });

    // Proceed to Validate
    fireEvent.click(screen.getByRole('button', { name: /Proceed to Validate/i }));
    expect(screen.getByText(UI_STRINGS.pcbiAdmin.totalRecords)).toBeInTheDocument();

    // Proceed to Preview
    fireEvent.click(screen.getByRole('button', { name: /Proceed to Preview/i }));
    expect(screen.getByText('Preview Datasets')).toBeInTheDocument();

    // Proceed to Import
    fireEvent.click(screen.getByRole('button', { name: /Import PCBI Master/i }));
    expect(screen.getByText(UI_STRINGS.pcbiAdmin.importConfirmTitle)).toBeInTheDocument();

    // Execute Import
    const executeImportBtn = screen.getByRole('button', { name: /Import PCBI Master/i });
    fireEvent.click(executeImportBtn);

    // Wait for post-import summary
    await waitFor(() => {
      expect(screen.getByText(new RegExp(`${UI_STRINGS.pcbiAdmin.importSummaryTitle}.*V2.0`, 'i'))).toBeInTheDocument();
    });

    // Open Publish Modal
    const openPublishBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.pcbiAdmin.publishVersionButton('V2.0'), 'i') });
    fireEvent.click(openPublishBtn);
    expect(screen.getByText(/Publish PCBI Version to Production/i)).toBeInTheDocument();

    // Confirm Publish
    const confirmPublishBtn = screen.getByRole('button', { name: /Confirm & Publish Version/i });
    fireEvent.click(confirmPublishBtn);

    // Should transition to PUBLISHED tab
    await waitFor(() => {
      expect(screen.getByText(/Currently active baseline dataset powering customer opportunity calculations/i)).toBeInTheDocument();
    });
  });
});


