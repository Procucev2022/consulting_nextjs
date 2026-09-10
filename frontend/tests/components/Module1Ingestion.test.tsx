import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Module1Ingestion } from '../../src/components/Module1Ingestion';
import { mockTenant, initialIngestionQueue, initialValidationRecords } from '../../src/data/mockData';
import { UI_STRINGS } from '../../src/constants/uiStrings';

describe('Module1Ingestion Component', () => {
  const defaultProps = {
    tenant: mockTenant,
    onUpdateTenant: vi.fn(),
    ingestionQueue: initialIngestionQueue,
    validationRecords: initialValidationRecords,
    onFixCurrency: vi.fn(),
    onMergeVendor: vi.fn(),
    onApplyBlanketFixes: vi.fn(),
    onResetValidationRecords: vi.fn(),
    onRunAICategorization: vi.fn(),
    onAddBatchUpload: vi.fn()
  };

  it('renders correctly with ingestion queue and validation tables', () => {
    render(<Module1Ingestion {...defaultProps} />);

    expect(screen.getByText(new RegExp(UI_STRINGS.module1.badge, 'i'))).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.module1.uploadedFileDetails)).toBeInTheDocument();
  });

  it('handles drag, drop, and file input changes', () => {
    const onAddBatchUpload = vi.fn();
    const { container } = render(<Module1Ingestion {...defaultProps} onAddBatchUpload={onAddBatchUpload} />);

    const dropZone = container.querySelector('div[class*="border-dashed"]');
    if (dropZone) {
      fireEvent.dragEnter(dropZone);
      fireEvent.dragOver(dropZone);
      fireEvent.dragLeave(dropZone);

      const testFile = new File(['dummy content'], 'test_upload.csv', { type: 'text/csv' });
      fireEvent.drop(dropZone, {
        dataTransfer: { files: [testFile] }
      });
      expect(onAddBatchUpload).toHaveBeenCalledWith(testFile, 'Purchase History');
    }

    // Test file input change
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      const testFile2 = new File(['dummy content 2'], 'test2.xlsx', { type: 'application/vnd.ms-excel' });
      fireEvent.change(fileInput, { target: { files: [testFile2] } });
      expect(onAddBatchUpload).toHaveBeenCalledWith(testFile2, 'Purchase History');
    }
  });

  it('renders document summary view and switches dimensions', () => {
    render(<Module1Ingestion {...defaultProps} />);

    expect(screen.getByText(UI_STRINGS.documentSummary.heading)).toBeInTheDocument();

    // Switch to Plant Wise
    const plantTab = screen.getByRole('button', { name: UI_STRINGS.documentSummary.dimensionTabs.plant });
    fireEvent.click(plantTab);
    expect(screen.getByText(UI_STRINGS.documentSummary.plant.headers.name)).toBeInTheDocument();

    // Switch to Month Wise
    const monthTab = screen.getByRole('button', { name: UI_STRINGS.documentSummary.dimensionTabs.month });
    fireEvent.click(monthTab);
    expect(screen.getByText(UI_STRINGS.documentSummary.month.headers.month)).toBeInTheDocument();

    // Switch back to Material Group
    const matGroupTab = screen.getByRole('button', { name: UI_STRINGS.documentSummary.dimensionTabs.materialGroup });
    fireEvent.click(matGroupTab);
    expect(screen.getByText(UI_STRINGS.documentSummary.materialGroup.headers.name)).toBeInTheDocument();
  });

  it('triggers onFixCurrency and onMergeVendor from validation records table', () => {
    const onFixCurrency = vi.fn();
    const onMergeVendor = vi.fn();

    render(
      <Module1Ingestion
        {...defaultProps}
        onFixCurrency={onFixCurrency}
        onMergeVendor={onMergeVendor}
      />
    );

    const fixInrBtns = screen.getAllByRole('button', { name: UI_STRINGS.module1.fixInr });
    fireEvent.click(fixInrBtns[0]);
    expect(onFixCurrency).toHaveBeenCalled();

    const mergeBtn = screen.getByRole('button', { name: UI_STRINGS.module1.mergeVendor });
    fireEvent.click(mergeBtn);
    expect(onMergeVendor).toHaveBeenCalled();
  });

  it('triggers onMergeItem from validation table', () => {
    const onMergeItem = vi.fn();
    render(
      <Module1Ingestion
        {...defaultProps}
        onMergeItem={onMergeItem}
      />
    );

    const mergeItemBtn = screen.getByRole('button', { name: UI_STRINGS.module1.mergeItem });
    fireEvent.click(mergeItemBtn);
    expect(onMergeItem).toHaveBeenCalled();
  });

  it('triggers blanket fixes, reset, and proceed to categorization', () => {
    const onApplyBlanketFixes = vi.fn();
    const onResetValidationRecords = vi.fn();
    const onRunAICategorization = vi.fn();

    render(
      <Module1Ingestion
        {...defaultProps}
        onApplyBlanketFixes={onApplyBlanketFixes}
        onResetValidationRecords={onResetValidationRecords}
        onRunAICategorization={onRunAICategorization}
      />
    );

    const autoRemediateBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.module1.applyBlanketFixes, 'i') });
    fireEvent.click(autoRemediateBtn);
    expect(onApplyBlanketFixes).toHaveBeenCalled();

    const proceedBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.module1.runAiCategorization, 'i') });
    fireEvent.click(proceedBtn);
    expect(onRunAICategorization).toHaveBeenCalled();
  });

  it('handles currency toggle and search filtering within document summary', () => {
    render(<Module1Ingestion {...defaultProps} />);

    // Switch to USD
    const usdBtn = screen.getByRole('button', { name: UI_STRINGS.documentSummary.currencies.usd });
    fireEvent.click(usdBtn);

    // Filter search
    const searchInput = screen.getByPlaceholderText(UI_STRINGS.documentSummary.materialGroup.searchPlaceholder);
    fireEvent.change(searchInput, { target: { value: 'FERRO' } });
    expect(screen.getByText('Ferro Alloys & Noble Metals (FERRO)')).toBeInTheDocument();

    // Switch back to INR
    const inrBtn = screen.getByRole('button', { name: UI_STRINGS.documentSummary.currencies.inr });
    fireEvent.click(inrBtn);
  });

  it('handles client setup modal opening, closing, and confirmation with timer', () => {
    vi.useFakeTimers();
    const onUpdateTenant = vi.fn();
    render(<Module1Ingestion {...defaultProps} onUpdateTenant={onUpdateTenant} />);

    // Open setup modal
    const setupBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.module1.configureClientDataset, 'i') });
    fireEvent.click(setupBtn);

    expect(screen.getByText(UI_STRINGS.modals.clientSetup.title)).toBeInTheDocument();

    // Close setup modal
    const cancelBtn = screen.getByRole('button', { name: UI_STRINGS.common.cancel });
    fireEvent.click(cancelBtn);

    // Reopen and confirm setup
    fireEvent.click(setupBtn);
    const confirmBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.modals.clientSetup.submitBtn, 'i') });
    fireEvent.click(confirmBtn);

    expect(onUpdateTenant).toHaveBeenCalled();

    // Advance timer for file picker trigger
    vi.advanceTimersByTime(300);
    vi.useRealTimers();
  });

  it('handles validation issue filtering tabs and blanket fixes / reset states', () => {
    const onApplyBlanketFixes = vi.fn();
    const onResetValidationRecords = vi.fn();

    const { rerender } = render(
      <Module1Ingestion
        {...defaultProps}
        onApplyBlanketFixes={onApplyBlanketFixes}
        onResetValidationRecords={onResetValidationRecords}
      />
    );

    // Filter issue tabs
    const needsActionBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.module1.needsAction, 'i') });
    fireEvent.click(needsActionBtn);

    const readyClearedBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.module1.readyAndCleared, 'i') });
    fireEvent.click(readyClearedBtn);

    const allRecordsBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.module1.allRecords, 'i') });
    fireEvent.click(allRecordsBtn);

    // Click blanket fix button
    const blanketBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.module1.applyBlanketFixes, 'i') });
    fireEvent.click(blanketBtn);
    expect(onApplyBlanketFixes).toHaveBeenCalled();

    // Rerender with all resolved records (pendingActionsCount === 0)
    const allResolvedRecords = initialValidationRecords.map(r => ({ ...r, resolved: true, issue_flag: 'Passed Clean' as const }));
    rerender(
      <Module1Ingestion
        {...defaultProps}
        validationRecords={allResolvedRecords}
        onApplyBlanketFixes={onApplyBlanketFixes}
        onResetValidationRecords={onResetValidationRecords}
      />
    );

    const resetAnomalyBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.module1.resetAnomalyState, 'i') });
    fireEvent.click(resetAnomalyBtn);
    expect(onResetValidationRecords).toHaveBeenCalled();

    // Rerender with empty ingestion queue
    rerender(
      <Module1Ingestion
        {...defaultProps}
        ingestionQueue={[]}
        validationRecords={allResolvedRecords}
      />
    );

    expect(screen.getByText(new RegExp(UI_STRINGS.module1.noFileUploaded, 'i'))).toBeInTheDocument();
  });

  it('handles processing doc in ingestion queue with fallbacks', () => {
    const processingDoc = [
      {
        doc_id: 'DOC-PROC-1',
        file_name: 'test_processing.pdf',
        file_type: 'PDF',
        file_size_mb: 2.5,
        uploaded_at: '2024-01-01',
        records_count: 500,
        ocr_status: 'Processing' as const,
        progress: 45,
        converted_inr_crores: undefined as any,
        detected_currencies: undefined as any
      }
    ];

    render(
      <Module1Ingestion
        {...defaultProps}
        ingestionQueue={processingDoc as any}
      />
    );

    expect(screen.getByText(new RegExp(UI_STRINGS.module1.processingStatus(45), 'i'))).toBeInTheDocument();
  });

  it('handles Select File, Setup Details, Change Details, and dataset types with timer', () => {
    vi.useFakeTimers();
    const onUpdateTenant = vi.fn();
    render(
      <Module1Ingestion
        {...defaultProps}
        onUpdateTenant={onUpdateTenant}
      />
    );

    // Click Setup Details button in dropzone
    const setupDetailsBtn = screen.getByRole('button', { name: UI_STRINGS.module1.setupDetails });
    fireEvent.click(setupDetailsBtn);
    expect(screen.getByText(UI_STRINGS.modals.clientSetup.title)).toBeInTheDocument();

    // Change dataset to Invoice Data in setup modal by clicking option card
    const invoiceDataCard = screen.getByText(UI_STRINGS.modals.clientSetup.datasetOptions.invoiceData.badge);
    fireEvent.click(invoiceDataCard);

    const confirmBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.modals.clientSetup.submitBtn, 'i') });
    fireEvent.click(confirmBtn);

    // Fast-forward the 250ms timer in handleConfirmSetup
    vi.advanceTimersByTime(300);
    expect(onUpdateTenant).toHaveBeenCalled();

    // Click Select File button
    const selectFileBtn = screen.getByRole('button', { name: UI_STRINGS.module1.selectFile });
    fireEvent.click(selectFileBtn);

    // Click Change Details button
    const changeDetailsBtn = screen.getByRole('button', { name: UI_STRINGS.module1.changeDetails });
    fireEvent.click(changeDetailsBtn);

    // Change dataset to Trial Balance
    const trialBalanceCard = screen.getByText(UI_STRINGS.modals.clientSetup.datasetOptions.trialBalance.badge);
    fireEvent.click(trialBalanceCard);
    const confirmBtn2 = screen.getByRole('button', { name: new RegExp(UI_STRINGS.modals.clientSetup.submitBtn, 'i') });
    fireEvent.click(confirmBtn2);
    vi.advanceTimersByTime(300);

    vi.useRealTimers();
  });

  it('navigates to categorization from document summary CTA', () => {
    const onRunAICategorization = vi.fn();
    render(<Module1Ingestion {...defaultProps} onRunAICategorization={onRunAICategorization} />);

    const ctaBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.documentSummary.viewAnalysisInAiCat, 'i') });
    fireEvent.click(ctaBtn);
    expect(onRunAICategorization).toHaveBeenCalled();
  });

  it('handles calculations with missing fields and fallback calculations', () => {
    const rawRecords = [
      {
        id: 'VAL-RAW-1',
        file_name: 'test.xlsx',
        row_number: 10,
        vendor_name: 'Vendor A',
        line_item_description: 'Widget',
        raw_currency: 'USD',
        amount: 20000,
        fx_rate_applied: undefined as any,
        inr_crores: undefined as any,
        order_quantity: undefined as any,
        net_price: undefined as any,
        issue_flag: 'Missing Currency Code' as const,
        issue_details: 'Flagged',
        remedy_action: 'Fix',
        confidence_score: 80,
        resolved: false
      },
      {
        id: 'VAL-RAW-2',
        file_name: 'test2.xlsx',
        row_number: 11,
        vendor_name: 'Vendor B',
        line_item_description: 'Gadget',
        raw_currency: 'EUR',
        amount: 500,
        fx_rate_applied: 90,
        inr_crores: undefined as any,
        order_quantity: undefined as any,
        net_price: undefined as any,
        issue_flag: 'Tax Discrepancy' as const,
        issue_details: 'Tax issue',
        remedy_action: 'Fix',
        confidence_score: 75,
        resolved: false
      }
    ];

    render(
      <Module1Ingestion
        {...defaultProps}
        validationRecords={rawRecords as any}
      />
    );

    expect(screen.getByText(new RegExp(UI_STRINGS.module1.badge, 'i'))).toBeInTheDocument();
  });

  it('renders ParetoSpendHierarchySection before validation pre-check', () => {
    render(<Module1Ingestion {...defaultProps} />);

    expect(screen.getByText(UI_STRINGS.module1.paretoHierarchy.sectionTitle)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.module1.paretoHierarchy.badge)).toBeInTheDocument();
  });

  it('passes through onRefreshWithFixes to ValidationPreCheckSection and triggers on click', () => {
    const onRefreshWithFixes = vi.fn();
    render(<Module1Ingestion {...defaultProps} onRefreshWithFixes={onRefreshWithFixes} />);

    const refreshButtons = screen.getAllByRole('button', { name: new RegExp(UI_STRINGS.module1.refreshWithFixes, 'i') });
    expect(refreshButtons.length).toBeGreaterThan(0);
    fireEvent.click(refreshButtons[0]);
    expect(onRefreshWithFixes).toHaveBeenCalled();
  });
});
