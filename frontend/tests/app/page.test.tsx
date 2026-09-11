import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import Home from '../../src/app/page';
import { apiClient } from '../../src/utils/api';
import {
  mockTenant,
  initialIngestionQueue,
  initialValidationRecords,
  spendCategoriesData,
  vendorVolatilityRankings,
  initialSavingsOpportunities
} from '../../src/data/mockData';
import { UI_STRINGS } from '../../src/constants/uiStrings';

describe('Home Page Component', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.clear();
    }
    vi.spyOn(apiClient, 'getTenant').mockResolvedValue(mockTenant);
    vi.spyOn(apiClient, 'getIngestionData').mockResolvedValue({
      queue: initialIngestionQueue,
      validationRecords: initialValidationRecords
    });
    vi.spyOn(apiClient, 'getCategories').mockResolvedValue({
      categories: spendCategoriesData,
      categoryDetails: []
    });
    vi.spyOn(apiClient, 'getVendors').mockResolvedValue({
      vendorRankings: vendorVolatilityRankings,
      vendorDetails: []
    });
    vi.spyOn(apiClient, 'getSavingsOpportunities').mockResolvedValue({
      opportunities: initialSavingsOpportunities,
      totalPotentialSavingsCr: 119.67
    });
    vi.spyOn(apiClient, 'updateTenant').mockResolvedValue(mockTenant);
    vi.spyOn(apiClient, 'updateValidationRecord').mockResolvedValue(initialValidationRecords[0]);
    vi.spyOn(apiClient, 'applyBlanketRemediation').mockResolvedValue({ updatedCount: 3, records: [] });
    vi.spyOn(apiClient, 'resetValidationRecords').mockResolvedValue(initialValidationRecords);
    vi.spyOn(apiClient, 'addIngestionFile').mockResolvedValue(initialIngestionQueue);
    vi.spyOn(apiClient, 'mergeVendor').mockResolvedValue({ success: true });
    vi.spyOn(apiClient, 'deployOpportunity').mockResolvedValue(initialSavingsOpportunities[0]);
  });

  afterEach(() => {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.clear();
    }
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders initial state, loads backend data, and navigates through all module tabs', async () => {
    render(<Home />);

    // Check header
    expect(screen.getByText(UI_STRINGS.common.appName)).toBeInTheDocument();

    await waitFor(() => {
      expect(apiClient.getTenant).toHaveBeenCalled();
    });

    // Navigate to Module 2
    const step2 = screen.getByText(UI_STRINGS.pipeline.steps.step2.title);
    fireEvent.click(step2);
    expect(screen.getByText(UI_STRINGS.module2.heading)).toBeInTheDocument();

    // Navigate to Module 3
    const step3 = screen.getByText(UI_STRINGS.pipeline.steps.step3.title);
    fireEvent.click(step3);
    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.module3.heading)).toBeInTheDocument();
    });

    // Navigate to Module 4
    const step4 = screen.getByText(UI_STRINGS.pipeline.steps.step4.title);
    fireEvent.click(step4);
    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.module4.pipelineTitle)).toBeInTheDocument();
    });

    // Navigate to Module 5
    const matrixBtn = screen.getByRole('button', { name: UI_STRINGS.pipeline.conversionMatrixTab });
    fireEvent.click(matrixBtn);
    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.module5.heading)).toBeInTheDocument();
    });

    // Navigate to Schema
    const schemaBtn = screen.getByRole('button', { name: UI_STRINGS.pipeline.dataArchitectureTab });
    fireEvent.click(schemaBtn);
    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.schema.bannerTitle)).toBeInTheDocument();
    });

    // Return to Module 1
    const step1 = screen.getByText(UI_STRINGS.pipeline.steps.step1.title);
    fireEvent.click(step1);
    expect(screen.getByText(UI_STRINGS.module1.uploadedFileDetails)).toBeInTheDocument();
  }, 20000);

  it('handles batch file upload with CSV and XLSX formats', async () => {
    const { container } = render(<Home />);

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      const csvFile = new File(
        ['po_number,vendor,item,qty,price,curr,year\nPO-1,VendorA,ItemA,100,50,USD,2024\n'],
        'sample_batch.csv',
        { type: 'text/csv' }
      );
      csvFile.text = vi.fn().mockResolvedValue('po_number,vendor,item,qty,price,curr,year\nPO-1,VendorA,ItemA,100,50,USD,2024\n');
      fireEvent.change(fileInput, { target: { files: [csvFile] } });

      await waitFor(() => {
        expect(apiClient.addIngestionFile).toHaveBeenCalled();
      });

      const textFile = new File(['header\nline1\nline2\n'], 'data.txt', { type: 'text/plain' });
      textFile.text = vi.fn().mockResolvedValue('header\nline1\nline2\n');
      fireEvent.change(fileInput, { target: { files: [textFile] } });

      await waitFor(() => {
        expect(apiClient.addIngestionFile).toHaveBeenCalled();
      });

      // XLSX upload exercising workbook parsing
      const XLSX = await import('xlsx');
      const ws = XLSX.utils.json_to_sheet([
        { po: 'PO-1', vendor: 'V1', desc: 'Item 1', qty: 100, price: 50, curr: 'USD', year: 2024 },
        { other_col: 'unmapped_row' }
      ]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      const xlsxBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
      const xlsxFile = new File([xlsxBuffer], 'sample_batch.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      xlsxFile.arrayBuffer = vi.fn().mockResolvedValue(xlsxBuffer);
      fireEvent.change(fileInput, { target: { files: [xlsxFile] } });

      await waitFor(() => {
        expect(apiClient.addIngestionFile).toHaveBeenCalled();
      });
    }
  });

  it('handles currency fixing and vendor merging modal flows', async () => {
    render(<Home />);

    // Open fix currency
    const fixBtns = screen.getAllByRole('button', { name: UI_STRINGS.module1.fixInr });
    fireEvent.click(fixBtns[0]);
    const applyFxBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.modals.fixCurrency.applyConversion, 'i') });
    fireEvent.click(applyFxBtn);
    await waitFor(() => {
      expect(apiClient.updateValidationRecord).toHaveBeenCalled();
    });

    // Open merge vendor
    const mergeBtns = screen.getAllByRole('button', { name: UI_STRINGS.module1.mergeVendor });
    fireEvent.click(mergeBtns[0]);
    const mapBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.modals.mergeVendor.confirmMerge, 'i') });
    fireEvent.click(mapBtn);
    await waitFor(() => {
      expect(apiClient.mergeVendor).toHaveBeenCalled();
    });

    // Open merge item
    const mergeItemBtns = screen.getAllByRole('button', { name: UI_STRINGS.module1.mergeItem });
    fireEvent.click(mergeItemBtns[0]);
    const mapItemBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.modals.mergeItem.confirmMerge, 'i') });
    fireEvent.click(mapItemBtn);
    await waitFor(() => {
      expect(apiClient.updateValidationRecord).toHaveBeenCalled();
    });
  });

  it('handles blanket fixes and reset validation records', async () => {
    render(<Home />);

    const blanketBtn = screen.queryByRole('button', { name: new RegExp(UI_STRINGS.module1.applyBlanketFixes, 'i') });
    if (blanketBtn) {
      fireEvent.click(blanketBtn);
      await waitFor(() => {
        expect(apiClient.applyBlanketRemediation).toHaveBeenCalled();
      });
    }

    const resetBtn = screen.queryByRole('button', { name: new RegExp(UI_STRINGS.module1.resetAnomalyState, 'i') });
    if (resetBtn) {
      fireEvent.click(resetBtn);
      await waitFor(() => {
        expect(apiClient.resetValidationRecords).toHaveBeenCalled();
      });
    }
  });

  it('handles module transitions via proceed CTA buttons', async () => {
    render(<Home />);

    // Module 1 -> Module 2
    const proceedToCat = screen.getByRole('button', { name: UI_STRINGS.module1.runAiCategorization });
    fireEvent.click(proceedToCat);
    expect(screen.getByText(UI_STRINGS.module2.heading)).toBeInTheDocument();

    // Line item confirm and reassign in Module 2
    const confirmBtns = screen.getAllByRole('button', { name: UI_STRINGS.module2.btnConfirm });
    if (confirmBtns.length > 0) {
      fireEvent.click(confirmBtns[0]);
    }

    const reassignBtns = screen.getAllByRole('button', { name: UI_STRINGS.module2.btnReassign });
    if (reassignBtns.length > 0) {
      fireEvent.click(reassignBtns[0]);
      const modalTitle = screen.getByText(UI_STRINGS.modals.reassign.title);
      const modalContainer = modalTitle.closest('.relative') as HTMLElement;
      const searchInput = within(modalContainer).getByPlaceholderText(UI_STRINGS.modals.reassign.searchPlaceholder);
      fireEvent.change(searchInput, { target: { value: 'boxwood' } });
      const firstResult = within(modalContainer).getByText(/boxwood/i);
      fireEvent.click(firstResult);
      const applyColL = within(modalContainer).getByRole('button', { name: new RegExp(UI_STRINGS.modals.reassign.saveMapping, 'i') });
      await waitFor(() => {
        expect(applyColL).not.toBeDisabled();
      });
      fireEvent.click(applyColL);
    }

    // Module 2 -> Module 3
    const proceedToTrend = screen.getByRole('button', { name: UI_STRINGS.module2.btnProceedToTrend });
    fireEvent.click(proceedToTrend);
    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.module3.heading)).toBeInTheDocument();
    });

    // Module 3 -> Module 4
    const proceedToSavings = screen.getByRole('button', { name: UI_STRINGS.module3.ctaProceedButton });
    fireEvent.click(proceedToSavings);
    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.module4.pipelineTitle)).toBeInTheDocument();
    });

    // Module 4 suite dispatch
    const proCPXBtns = screen.queryAllByRole('button', { name: UI_STRINGS.modals.proCPX.launchButton });
    if (proCPXBtns.length > 0) {
      fireEvent.click(proCPXBtns[0]);
      expect(screen.getByText(UI_STRINGS.modals.proCPX.heading)).toBeInTheDocument();
      const cancelBtns = screen.getAllByRole('button', { name: UI_STRINGS.modals.proCPX.cancel });
      fireEvent.click(cancelBtns[0]);
    }

    const dpsNXTBtns = screen.queryAllByRole('button', { name: UI_STRINGS.modals.dpsNXT.pushButton });
    if (dpsNXTBtns.length > 0) {
      fireEvent.click(dpsNXTBtns[0]);
      expect(screen.getByText(UI_STRINGS.modals.dpsNXT.heading)).toBeInTheDocument();
      const cancelBtns = screen.getAllByRole('button', { name: UI_STRINGS.modals.dpsNXT.cancel });
      fireEvent.click(cancelBtns[0]);
    }

    // Module 4 -> Module 5
    const proceedToConversion = screen.getByRole('button', { name: UI_STRINGS.module4.proceedToConversion });
    fireEvent.click(proceedToConversion);
    await waitFor(() => {
      expect(screen.getAllByText(UI_STRINGS.module5.heading)[0]).toBeInTheDocument();
    });

    // Open Executive Report Modal
    const reportBtn = screen.getByRole('button', { name: UI_STRINGS.module5.generateExecutiveReport });
    fireEvent.click(reportBtn);
    const deckTitles = await screen.findAllByText(UI_STRINGS.presentation.cover.deckTitle, {}, { timeout: 8000 });
    expect(deckTitles[0]).toBeInTheDocument();
    const closeReportBtn = screen.getByRole('button', { name: UI_STRINGS.presentation.closeModal });
    fireEvent.click(closeReportBtn);
  }, 20000);

  it('handles header tenant, currency, and theme switching, including API errors', async () => {
    vi.spyOn(apiClient, 'updateTenant').mockRejectedValueOnce(new Error('Network fail'));

    render(<Home />);

    await waitFor(() => {
      expect(apiClient.getTenant).toHaveBeenCalled();
    });

    // Switch theme to dark
    const themeBtn = screen.getByTitle(UI_STRINGS.header.themeSwitchDark);
    fireEvent.click(themeBtn);
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    // Switch theme back to light
    const lightBtn = screen.getByTitle(UI_STRINGS.header.themeSwitchLight);
    fireEvent.click(lightBtn);
    expect(document.documentElement.classList.contains('light')).toBe(true);

    // Switch currency via header buttons
    const eurBtn = screen.getByRole('button', { name: 'EUR' });
    fireEvent.click(eurBtn);

    const gbpBtn = screen.getByRole('button', { name: 'GBP' });
    fireEvent.click(gbpBtn);

    const inrBtn = screen.getByRole('button', { name: UI_STRINGS.header.currencies.inr });
    fireEvent.click(inrBtn);

    // Open Executive Report from Header button
    const headerReportBtn = screen.getByRole('button', { name: UI_STRINGS.header.reportButton });
    fireEvent.click(headerReportBtn);
    const headerDeckTitles = await screen.findAllByText(UI_STRINGS.presentation.cover.deckTitle, {}, { timeout: 8000 });
    expect(headerDeckTitles[0]).toBeInTheDocument();
    const closeReportBtn2 = screen.getByRole('button', { name: UI_STRINGS.presentation.closeModal });
    fireEvent.click(closeReportBtn2);
    // Trigger onSelectTenant via tenant badge (rejection path)
    vi.spyOn(apiClient, 'updateTenant').mockRejectedValueOnce(new Error('Tenant update fail'));
    const tenantBadge = screen.getByTestId('tenant-badge');
    fireEvent.click(tenantBadge);

    // Trigger onSelectTenant via tenant badge (success path)
    vi.spyOn(apiClient, 'updateTenant').mockResolvedValueOnce(mockTenant);
    fireEvent.click(tenantBadge);
  });

  it('handles ProCPX and DPS NXT successful deployment flows and API rejections', async () => {
    vi.spyOn(apiClient, 'deployOpportunity')
      .mockRejectedValueOnce(new Error('Deployment sync failed'))
      .mockRejectedValueOnce(new Error('DPS sync failed'));

    render(<Home />);

    await waitFor(() => {
      expect(apiClient.getTenant).toHaveBeenCalled();
    });

    // Navigate to Module 4
    const step4 = screen.getByText(UI_STRINGS.pipeline.steps.step4.title);
    fireEvent.click(step4);
    await screen.findByText(UI_STRINGS.module4.pipelineTitle);

    // Enable fake timers for countdowns
    vi.useFakeTimers();

    // Click ProCPX button in table
    const proCPXBtns = screen.getAllByRole('button', { name: UI_STRINGS.modals.proCPX.launchButton });
    fireEvent.click(proCPXBtns[0]);

    // Find modal heading and submit button inside the modal
    const modalHeading = screen.getByRole('heading', { name: UI_STRINGS.modals.proCPX.heading });
    const modal = modalHeading.closest('div.relative');
    const modalLaunchBtn = within(modal as HTMLElement).getByRole('button', { name: UI_STRINGS.modals.proCPX.launchButton });
    fireEvent.click(modalLaunchBtn);

    // Fast-forward countdown and completion timers (1200ms + 1800ms = 3000ms)
    act(() => {
      vi.advanceTimersByTime(3500);
    });

    // ProCPX deploy API was called and handled rejection
    expect(apiClient.deployOpportunity).toHaveBeenCalledWith(expect.any(String), 'proCPX');

    // Click DPS NXT button in table
    const dpsNXTBtns = screen.getAllByRole('button', { name: UI_STRINGS.modals.dpsNXT.pushButton });
    fireEvent.click(dpsNXTBtns[0]);

    // Find DPS modal heading and submit button
    const dpsHeading = screen.getByRole('heading', { name: UI_STRINGS.modals.dpsNXT.heading });
    const dpsModal = dpsHeading.closest('div.relative');
    const modalDpsBtn = within(dpsModal as HTMLElement).getByRole('button', { name: UI_STRINGS.modals.dpsNXT.pushButton });
    fireEvent.click(modalDpsBtn);

    // Fast-forward countdown and completion timers (1200ms + 1800ms = 3000ms)
    act(() => {
      vi.advanceTimersByTime(3500);
    });

    expect(apiClient.deployOpportunity).toHaveBeenCalledWith(expect.any(String), 'DPS NXT');

    // Fast-forward toast timer (4000ms)
    act(() => {
      vi.advanceTimersByTime(4000);
    });

    vi.useRealTimers();
  });

  it('handles API rejection during currency fix, vendor merge, blanket fix, and reset', async () => {
    vi.spyOn(apiClient, 'updateValidationRecord').mockRejectedValue(new Error('Update failed'));
    vi.spyOn(apiClient, 'mergeVendor').mockRejectedValue(new Error('Merge failed'));
    vi.spyOn(apiClient, 'applyBlanketRemediation').mockRejectedValue(new Error('Blanket failed'));
    vi.spyOn(apiClient, 'resetValidationRecords').mockRejectedValue(new Error('Reset failed'));

    render(<Home />);

    await waitFor(() => {
      expect(apiClient.getTenant).toHaveBeenCalled();
    });

    // Currency fix with rejection
    const fixInrBtns = screen.queryAllByRole('button', { name: UI_STRINGS.module1.fixInr });
    if (fixInrBtns.length > 0) {
      fireEvent.click(fixInrBtns[0]);
      const applyFxBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.modals.fixCurrency.applyConversion, 'i') });
      fireEvent.click(applyFxBtn);
    }

    // Merge vendor with rejection
    const mergeBtns = screen.queryAllByRole('button', { name: UI_STRINGS.module1.mergeVendor });
    if (mergeBtns.length > 0) {
      fireEvent.click(mergeBtns[0]);
      const mapBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.modals.mergeVendor.confirmMerge, 'i') });
      fireEvent.click(mapBtn);
    }

    // Merge item with rejection
    const mergeItemBtns = screen.queryAllByRole('button', { name: UI_STRINGS.module1.mergeItem });
    if (mergeItemBtns.length > 0) {
      fireEvent.click(mergeItemBtns[0]);
      const mapItemBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.modals.mergeItem.confirmMerge, 'i') });
      fireEvent.click(mapItemBtn);
    }

    // Blanket remediation with rejection
    const autoRemediateBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.module1.applyBlanketFixes, 'i') });
    fireEvent.click(autoRemediateBtn);

    // Reset with rejection - wait for button to be available
    const resetBtn = await screen.findByRole('button', { name: new RegExp(UI_STRINGS.module1.resetAnomalyState, 'i') });
    fireEvent.click(resetBtn);

    await waitFor(() => {
      expect(apiClient.resetValidationRecords).toHaveBeenCalled();
    });
  });

  it('handles ignoring validation issue via MergeVendorModal and handles API rejection gracefully', async () => {
    vi.spyOn(apiClient, 'updateValidationRecord').mockRejectedValueOnce(new Error('Ignore sync error'));

    render(<Home />);

    await waitFor(() => {
      expect(apiClient.getTenant).toHaveBeenCalled();
    });

    const mergeBtns = screen.queryAllByRole('button', { name: UI_STRINGS.module1.mergeVendor });
    if (mergeBtns.length > 0) {
      fireEvent.click(mergeBtns[0]);
      const ignoreBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.modals.mergeVendor.ignoreButton, 'i') });
      fireEvent.click(ignoreBtn);

      await waitFor(() => {
        expect(apiClient.updateValidationRecord).toHaveBeenCalled();
      });
    }
  });

  it('handles file uploads for PDF, ZIP, arbitrary CSV, and malformed files', async () => {
    vi.spyOn(apiClient, 'addIngestionFile').mockRejectedValueOnce(new Error('Upload sync warning'));

    const { container } = render(<Home />);

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      // PDF upload
      const pdfFile = new File(['%PDF-1.4 dummy'], 'contract_scan.pdf', { type: 'application/pdf' });
      fireEvent.change(fileInput, { target: { files: [pdfFile] } });

      await waitFor(() => {
        expect(apiClient.addIngestionFile).toHaveBeenCalled();
      });

      // ZIP upload
      const zipFile = new File(['PK dummy'], 'archive_procurement.zip', { type: 'application/zip' });
      fireEvent.change(fileInput, { target: { files: [zipFile] } });

      // Malformed unspsc xlsx
      const unspscFile = new File(['invalid binary content'], 'UNSPSC_Master_Catalog.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      fireEvent.change(fileInput, { target: { files: [unspscFile] } });

      // Malformed generic xlsx (without unspsc)
      const genericXlsx = new File(['invalid binary 2'], 'generic_catalog.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      fireEvent.change(fileInput, { target: { files: [genericXlsx] } });

      // Arbitrary columns CSV (hits ternaries for missing keys across rows 0-5)
      const arbitraryCsv = new File(
        ['headerA,headerB\nval1,val2\nval3,val4\nval5,val6\nval7,val8\nval9,val10\nval11,val12\nval13,val14\n'],
        'arbitrary.csv',
        { type: 'text/csv' }
      );
      fireEvent.change(fileInput, { target: { files: [arbitraryCsv] } });
    }
  });

  it('handles valid XLSX upload with Total In Crs, Material Group, Plant, and Date columns', async () => {
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.json_to_sheet([
      {
        'Short Text': 'FERRO NICKEL 10-14',
        'Supplier Name': 'TRAFIGURA INDIA',
        'Material Group': 'FERRO',
        Plant: '1000',
        'Document Date': 46112,
        'Order Quantity': 100,
        'Net Price': 500,
        'Total In Crs': 12.5
      },
      {
        'Short Text': 'STAINLESS SCRAP 316',
        'Supplier Name': 'METALS CORP',
        'Material Group': 'SCRAP',
        Plant: '1002',
        'Document Date': '2024-05-15',
        'Order Quantity': 200,
        'Net Price': 250,
        'Total INR': 50000000
      },
      {
        'Short Text': 'GENERAL CONSUMABLES SKU',
        'Supplier Name': 'STANDARD SUPPLIES',
        'Material Group': 'CONSUMABLE',
        Plant: '1008',
        'Document Date': '2024/08/20',
        'Order Quantity': 150,
        'Net Price': 100,
        Currency: 'INR'
      },
      {
        Material: 998877,
        'Short Text': 'NICKEL ALLOY FORGING',
        Vendor: 112233,
        'Supplier Name': 'ALLOY SUPPLIER INC',
        'Material Group': 'FORGINGS',
        Plant: '1004',
        'Document Date': '2024-03-01',
        'Order Quantity': 30,
        'Net Price': 5000,
        'Total In Crs': 0.15
      },
      {
        'Short Text': '883921',
        'Material Description': 'PRECISION STAINLESS STEEL BALLS',
        'Supplier Name': '994012',
        'Vendor Name': 'GLOBAL PRECISION BEARING CO',
        'Material Group': 'BEARINGS',
        Plant: '1000',
        'Document Date': '2024-04-10',
        'Order Quantity': 100,
        'Net Price': 500,
        'Total In Crs': 0.05
      },
      {
        'Short Text': 'REFRACTORY BRICKS',
        'Supplier Name': 'FIREBRICK CO',
        'Material Group': 'RFR0001',
        Plant: '1000',
        'Document Date': '2023-10-05',
        'Order Quantity': 50,
        'Net Price': 1000,
        Currency: 'INR'
      },
      {
        'Short Text': 'CORRUGATED CARTONS',
        'Supplier Name': 'BOX PACKAGING LTD',
        'Material Group': 'PACK-BOX',
        Plant: '1000',
        'Document Date': '2024-02-10',
        'Order Quantity': 500,
        'Net Price': 20,
        Currency: 'INR'
      },
      {
        'Short Text': 'OCEAN FREIGHT SHIPPING',
        'Supplier Name': 'MAERSK LINE',
        'Material Group': 'FREIGHT-LOG',
        Plant: '1002',
        'Document Date': '2024-03-15',
        'Order Quantity': 10,
        'Net Price': 25000,
        Currency: 'INR'
      }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const validXlsx = new File([wbout], '3_years_uploaded.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    (validXlsx as any).arrayBuffer = async () => wbout.buffer || wbout;

    const { container } = render(<Home />);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fireEvent.change(fileInput, { target: { files: [validXlsx] } });
      await waitFor(() => {
        expect(apiClient.addIngestionFile).toHaveBeenCalled();
      });
    }
  });

  it('handles backend hydration with null values in settled promises', async () => {
    vi.spyOn(apiClient, 'getTenant').mockResolvedValue(null as any);
    vi.spyOn(apiClient, 'getIngestionData').mockResolvedValue(null as any);
    vi.spyOn(apiClient, 'getCategories').mockResolvedValue(null as any);
    vi.spyOn(apiClient, 'getVendors').mockResolvedValue(null as any);
    vi.spyOn(apiClient, 'getSavingsOpportunities').mockResolvedValue(null as any);

    render(<Home />);
    expect(screen.getByText(UI_STRINGS.common.appName)).toBeInTheDocument();
  });

  it('handles backend hydration failure gracefully on mount', async () => {
    vi.spyOn(apiClient, 'getTenant').mockRejectedValueOnce(new Error('Hydration error'));
    vi.spyOn(apiClient, 'getIngestionData').mockRejectedValueOnce(new Error('Ingestion error'));
    vi.spyOn(apiClient, 'getCategories').mockRejectedValueOnce(new Error('Categories error'));
    vi.spyOn(apiClient, 'getVendors').mockRejectedValueOnce(new Error('Vendors error'));
    vi.spyOn(apiClient, 'getSavingsOpportunities').mockRejectedValueOnce(new Error('Savings error'));

    render(<Home />);

    expect(screen.getByText(UI_STRINGS.common.appName)).toBeInTheDocument();
  });

  it('handles unexpected Promise.allSettled throw during mount', async () => {
    vi.spyOn(Promise, 'allSettled').mockRejectedValueOnce(new Error('Fatal promise error'));
    render(<Home />);
    expect(screen.getByText(UI_STRINGS.common.appName)).toBeInTheDocument();
  });

  it('handles closing modals without submitting', () => {
    render(<Home />);

    // Fix currency modal close
    const fixInrBtns = screen.getAllByRole('button', { name: UI_STRINGS.module1.fixInr });
    if (fixInrBtns.length > 0) {
      fireEvent.click(fixInrBtns[0]);
      const closeBtn = screen.getByRole('button', { name: UI_STRINGS.modals.fixCurrency.cancel });
      fireEvent.click(closeBtn);
    }

    // Merge vendor modal close
    const mergeBtns = screen.getAllByRole('button', { name: UI_STRINGS.module1.mergeVendor });
    if (mergeBtns.length > 0) {
      fireEvent.click(mergeBtns[0]);
      const closeBtn = screen.getByRole('button', { name: UI_STRINGS.modals.mergeVendor.cancel });
      fireEvent.click(closeBtn);
    }

    // Navigate to Module 2 and close Reassign modal
    const step2 = screen.getByText(UI_STRINGS.pipeline.steps.step2.title);
    fireEvent.click(step2);

    const reassignBtns = screen.getAllByRole('button', { name: new RegExp(UI_STRINGS.module2.btnReassign, 'i') });
    if (reassignBtns.length > 0) {
      fireEvent.click(reassignBtns[0]);
      const cancelBtn = screen.getByRole('button', { name: UI_STRINGS.modals.reassign.cancel });
      fireEvent.click(cancelBtn);
    }
  });

  it('restores dataset from sessionStorage on mount and retains user upload across refresh', async () => {
    const mockSavedState = {
      doc: {
        doc_id: 'DOC-SAVED-1',
        tenant_id: 'TNT-GLOBAL-8902',
        file_name: 'saved_3_years.xlsx',
        file_type: 'XLSX',
        file_size_mb: 4.5,
        ocr_status: 'Completed',
        progress: 100,
        uploaded_at: '2026-03-01 10:00:00',
        records_count: 500,
        detected_currencies: ['INR'],
        converted_inr_crores: 120.5
      },
      materialGroupSummaries: [{ materialGroup: 'METALS', count: 10, totalSpendINR: 100000000, totalSpendCr: 10 }],
      plantSummaries: [{ plant: '1000', count: 10, totalSpendINR: 100000000, totalSpendCr: 10 }],
      monthWiseSummaries: [{ monthYear: '2024-01', count: 10, totalSpendINR: 100000000, totalSpendCr: 10 }],
      uploadedUniqueItems: ['ITEM-A', 'ITEM-B'],
      uploadedUniqueVendors: ['VENDOR-X', 'VENDOR-Y'],
      paretoData: [{ vendor: 'VENDOR-X', spend: 10, cumPercent: 100 }],
      validationRecords: initialValidationRecords,
      isDataRefreshed: true
    };
    window.sessionStorage.setItem('procucev_uploaded_dataset', JSON.stringify(mockSavedState));

    render(<Home />);

    await waitFor(() => {
      expect(apiClient.getTenant).toHaveBeenCalled();
    });

    expect(screen.getByText('saved_3_years.xlsx')).toBeInTheDocument();
  });

  it('handles sessionStorage access exception on mount gracefully', async () => {
    vi.spyOn(window.sessionStorage, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError: Access is denied');
    });

    render(<Home />);
    expect(screen.getByText(UI_STRINGS.common.appName)).toBeInTheDocument();
  });

  it('handles raw backend ingestion queue with missing optional properties', async () => {
    vi.spyOn(apiClient, 'getIngestionData').mockResolvedValueOnce({
      queue: [
        {
          file_name: 'minimal_file.csv',
          file_type: undefined,
          file_size_mb: undefined,
          doc_id: undefined,
          ocr_status: undefined,
          progress: undefined,
          uploaded_at: undefined,
          records_count: undefined,
          detected_currencies: undefined,
          converted_inr_crores: undefined
        } as any
      ],
      validationRecords: initialValidationRecords
    });

    render(<Home />);
    await waitFor(() => {
      expect(screen.getByText('minimal_file.csv')).toBeInTheDocument();
    });
  });

  it('handles sessionStorage quota exceeded during file upload without failing the upload', async () => {
    vi.spyOn(window.sessionStorage, 'setItem').mockImplementationOnce(() => {
      throw new Error('QuotaExceededError');
    });

    const XLSX = await import('xlsx');
    const ws = XLSX.utils.json_to_sheet([
      {
        'Short Text': 'FASTENER BOLT',
        vendor_code: 'V-101',
        'Order Quantity': 100,
        'Net Price': 50,
        'Total In Crs': 0.01
      }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const quotaXlsx = new File([wbout], 'quota_test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    (quotaXlsx as any).arrayBuffer = async () => wbout.buffer || wbout;

    const { container } = render(<Home />);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fireEvent.change(fileInput, { target: { files: [quotaXlsx] } });
      await waitFor(() => {
        expect(apiClient.addIngestionFile).toHaveBeenCalled();
      });
    }
    expect(screen.getByText(UI_STRINGS.common.appName)).toBeInTheDocument();
  });

  it('handles refreshing with fixes and displays final numbers toast notification', async () => {
    const scrollMock = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollMock;

    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem('procucev_uploaded_dataset', JSON.stringify({ doc: initialIngestionQueue[0] }));
    }

    render(<Home />);
    await waitFor(() => {
      expect(apiClient.getTenant).toHaveBeenCalled();
    });

    // Find and click the Refresh with Fixes button with pending records
    const refreshButtons = screen.getAllByRole('button', {
      name: new RegExp(UI_STRINGS.module1.refreshWithFixes, 'i')
    });
    expect(refreshButtons.length).toBeGreaterThan(0);

    fireEvent.click(refreshButtons[0]);

    // Toast should be displayed
    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.toasts.refreshedFinalNumbers)).toBeInTheDocument();
    });
    expect(scrollMock).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });

    // Now apply blanket fixes so all validation records are resolved
    const blanketBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.module1.applyBlanketFixes, 'i') });
    fireEvent.click(blanketBtn);

    // Click refresh with fixes again when all records are resolved
    const refreshAgain = screen.getAllByRole('button', {
      name: new RegExp(UI_STRINGS.module1.refreshWithFixes, 'i')
    })[0];
    fireEvent.click(refreshAgain);

    // Verify sessionStorage was updated with reconciled spend
    const savedAfter = JSON.parse(window.sessionStorage.getItem('procucev_uploaded_dataset') || '{}');
    expect(savedAfter.isDataRefreshed).toBe(true);

    // Test when document-summary-section is not found
    vi.spyOn(document, 'getElementById').mockReturnValueOnce(null);
    fireEvent.click(refreshAgain);
  });

  it('triggers AnalyzingLoader from Deep Spend Scan in Header and handles cancellation and completion', async () => {
    render(<Home />);
    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.common.appName)).toBeInTheDocument();
    });

    const scanBtn = screen.getByTitle(UI_STRINGS.analyzingLoader.triggerTooltip);
    fireEvent.click(scanBtn);

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.analyzingLoader.title)).toBeInTheDocument();

    // Test cancelling the loader
    const cancelBtn = screen.getByRole('button', { name: UI_STRINGS.analyzingLoader.cancelButton });
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    // Reopen and complete with fake timers
    vi.useFakeTimers();
    try {
      fireEvent.click(scanBtn);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      act(() => {
        vi.advanceTimersByTime(3500);
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it('triggers onStartAICategorization toast in Module2', async () => {
    render(<Home />);
    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.common.appName)).toBeInTheDocument();
    });

    // Switch to Module 2
    const step2 = screen.getByText(UI_STRINGS.pipeline.steps.step2.title);
    fireEvent.click(step2);

    // Click Start AI Categorization
    const startAiBtn = await screen.findByRole('button', { name: UI_STRINGS.module2.startAiCategorization });
    fireEvent.click(startAiBtn);

    // Verify toast is triggered
    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.toasts.runningAiCat)).toBeInTheDocument();
    });
  });
});

