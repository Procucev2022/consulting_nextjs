import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Module1Ingestion } from '../../src/components/Module1Ingestion';
import { mockTenant, initialIngestionQueue, initialValidationRecords } from '../../src/data/mockData';

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

    expect(screen.getByText(/Module 1: Document Ingestion & Multi-Currency ETL/i)).toBeInTheDocument();
    expect(screen.getByText('Uploaded Procurement File Details')).toBeInTheDocument();
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

  it('handles year filters and breakdown mode switching', () => {
    render(<Module1Ingestion {...defaultProps} />);

    // Switch breakdown mode to VENDOR
    const vendorTab = screen.getByRole('button', { name: /By Vendors/i });
    fireEvent.click(vendorTab);

    // Switch back to Category
    const catTab = screen.getByRole('button', { name: /By Categories/i });
    fireEvent.click(catTab);
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

    const fixInrBtn = screen.getByRole('button', { name: /Fix \(INR\)/i });
    fireEvent.click(fixInrBtn);
    expect(onFixCurrency).toHaveBeenCalled();

    const recalcBtn = screen.getByRole('button', { name: /Recalc FX/i });
    fireEvent.click(recalcBtn);
    expect(onFixCurrency).toHaveBeenCalledTimes(2);

    const mergeBtn = screen.getByRole('button', { name: /Merge Vendor/i });
    fireEvent.click(mergeBtn);
    expect(onMergeVendor).toHaveBeenCalled();
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

    const autoRemediateBtn = screen.getByRole('button', { name: /Apply Blanket AI Fixes/i });
    fireEvent.click(autoRemediateBtn);
    expect(onApplyBlanketFixes).toHaveBeenCalled();

    const proceedBtn = screen.getByRole('button', { name: /Run AI Categorization Engine/i });
    fireEvent.click(proceedBtn);
    expect(onRunAICategorization).toHaveBeenCalled();
  });

  it('handles year filter pills, category selection, and category balance expansion and popup', () => {
    render(<Module1Ingestion {...defaultProps} />);

    // Click year filter buttons
    fireEvent.click(screen.getByRole('button', { name: 'FY24' }));
    fireEvent.click(screen.getByRole('button', { name: 'FY25' }));
    fireEvent.click(screen.getByRole('button', { name: 'FY26' }));
    fireEvent.click(screen.getByRole('button', { name: /All FY/i }));

    // Click a category card to open CategoryTopItemsModal
    const categoryButtons = screen.getAllByRole('button');
    const catCard = categoryButtons.find(b => b.textContent && b.textContent.includes('Col L:'));
    if (catCard) {
      fireEvent.click(catCard);
      // Close modal
      const closeCatModal = screen.getByRole('button', { name: /Close Pop-up/i });
      fireEvent.click(closeCatModal);
    }

    // Toggle balance categories
    const viewBalBtn = screen.getByRole('button', { name: /View 7 Balance Categories/i });
    fireEvent.click(viewBalBtn);
    expect(screen.getByRole('button', { name: /Hide 7 Balance Categories/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Hide 7 Balance Categories/i }));

    // Click Pop-up button for balance category
    const catPopupBtn = screen.getByTitle('Open Top Balance Line Items in Pop-up');
    fireEvent.click(catPopupBtn);
    const closeCatModal2 = screen.getByRole('button', { name: /Close Pop-up/i });
    fireEvent.click(closeCatModal2);
  });

  it('handles vendor breakdown view, vendor balance expansion, vendor card selection, and popup', () => {
    render(<Module1Ingestion {...defaultProps} />);

    // Switch to By Vendors
    fireEvent.click(screen.getByRole('button', { name: /By Vendors/i }));

    // Click year filters in vendor view
    fireEvent.click(screen.getByRole('button', { name: 'FY24' }));
    fireEvent.click(screen.getByRole('button', { name: 'FY25' }));
    fireEvent.click(screen.getByRole('button', { name: 'FY26' }));
    fireEvent.click(screen.getByRole('button', { name: /All FY/i }));

    // Click a vendor card
    const vendorButtons = screen.getAllByRole('button');
    const vndCard = vendorButtons.find(b => b.textContent && b.textContent.includes('Rank #1 Vendor'));
    if (vndCard) {
      fireEvent.click(vndCard);
      const closeVndModal = screen.getByRole('button', { name: /Close Pop-up/i });
      fireEvent.click(closeVndModal);
    }

    // Toggle vendor balance
    const viewVendorBal = screen.getByRole('button', { name: /View 7 Balance Suppliers/i });
    fireEvent.click(viewVendorBal);
    expect(screen.getByRole('button', { name: /Hide 7 Balance Suppliers/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Hide 7 Balance Suppliers/i }));

    // Click Pop-up for vendor
    const vndPopupBtn = screen.getByTitle('Open Top Balance Vendor Items in Pop-up');
    fireEvent.click(vndPopupBtn);
    const closeVndModal2 = screen.getByRole('button', { name: /Close Pop-up/i });
    fireEvent.click(closeVndModal2);
  });

  it('handles client setup modal opening and confirmation', () => {
    const onUpdateTenant = vi.fn();
    render(<Module1Ingestion {...defaultProps} onUpdateTenant={onUpdateTenant} />);

    // Open setup modal
    const setupBtn = screen.getByRole('button', { name: /Configure Client & Dataset/i });
    fireEvent.click(setupBtn);

    expect(screen.getByText('Client & Dataset Ingestion Setup')).toBeInTheDocument();

    // Confirm setup
    const confirmBtn = screen.getByRole('button', { name: /Confirm & Proceed to Upload Data/i });
    fireEvent.click(confirmBtn);

    expect(onUpdateTenant).toHaveBeenCalled();
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
    const needsActionBtn = screen.getByRole('button', { name: /Needs Action/i });
    fireEvent.click(needsActionBtn);

    const readyClearedBtn = screen.getByRole('button', { name: /Ready & Cleared/i });
    fireEvent.click(readyClearedBtn);

    const allRecordsBtn = screen.getByRole('button', { name: /All Records/i });
    fireEvent.click(allRecordsBtn);

    // Click blanket fix button
    const blanketBtn = screen.getByRole('button', { name: /Apply Blanket AI Fixes/i });
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

    const resetAnomalyBtn = screen.getByRole('button', { name: /Reset Anomaly State/i });
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

    expect(screen.getByText(/No file uploaded yet/i)).toBeInTheDocument();
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

    expect(screen.getByText(/45% Processing/i)).toBeInTheDocument();
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
    const setupDetailsBtn = screen.getByRole('button', { name: 'Setup Details' });
    fireEvent.click(setupDetailsBtn);
    expect(screen.getByText('Client & Dataset Ingestion Setup')).toBeInTheDocument();

    // Change dataset to Invoice Data in setup modal by clicking option card
    const invoiceDataCard = screen.getByText('AP Invoices & Scans');
    fireEvent.click(invoiceDataCard);

    const confirmBtn = screen.getByRole('button', { name: /Confirm & Proceed to Upload Data/i });
    fireEvent.click(confirmBtn);

    // Fast-forward the 250ms timer in handleConfirmSetup
    vi.advanceTimersByTime(300);
    expect(onUpdateTenant).toHaveBeenCalled();

    // Click Select File button
    const selectFileBtn = screen.getByRole('button', { name: 'Select File' });
    fireEvent.click(selectFileBtn);

    // Click Change Details button
    const changeDetailsBtn = screen.getByRole('button', { name: 'Change Details' });
    fireEvent.click(changeDetailsBtn);

    // Change dataset to Trial Balance
    const trialBalanceCard = screen.getByText('GL & Cost Centers');
    fireEvent.click(trialBalanceCard);
    const confirmBtn2 = screen.getByRole('button', { name: /Confirm & Proceed to Upload Data/i });
    fireEvent.click(confirmBtn2);
    vi.advanceTimersByTime(300);

    vi.useRealTimers();
  });

  it('handles clicking vendor card and switching selected vendor', () => {
    render(<Module1Ingestion {...defaultProps} />);

    // Switch to By Vendors mode
    fireEvent.click(screen.getByRole('button', { name: /By Vendors/i }));

    // Find vendor card with Rank #1
    const vendorButtons = screen.getAllByRole('button');
    const rank1Btn = vendorButtons.find(b => b.textContent && b.textContent.includes('Rank #1'));
    expect(rank1Btn).toBeDefined();
    if (rank1Btn) {
      fireEvent.click(rank1Btn);
      // VendorTopItemsModal should open
      expect(screen.getByText(/Top Line Items & 3-Year Price Trends/i)).toBeInTheDocument();
      // Close modal
      const closeBtn = screen.getByRole('button', { name: /Close Pop-up/i });
      fireEvent.click(closeBtn);
    }

    // Click Rank #2 vendor card
    const rank2Btn = screen.getAllByRole('button').find(b => b.textContent && b.textContent.includes('Rank #2'));
    if (rank2Btn) {
      fireEvent.click(rank2Btn);
      const closeBtn = screen.getByRole('button', { name: /Close Pop-up/i });
      fireEvent.click(closeBtn);
    }
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

    expect(screen.getByText(/Module 1: Document Ingestion/i)).toBeInTheDocument();
  });
});
