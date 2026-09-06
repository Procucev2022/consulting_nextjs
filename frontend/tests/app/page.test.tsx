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
    expect(screen.getByText(UI_STRINGS.module3.heading)).toBeInTheDocument();

    // Navigate to Module 4
    const step4 = screen.getByText(UI_STRINGS.pipeline.steps.step4.title);
    fireEvent.click(step4);
    expect(screen.getByText(UI_STRINGS.module4.pipelineTitle)).toBeInTheDocument();

    // Navigate to Module 5
    const matrixBtn = screen.getByRole('button', { name: UI_STRINGS.pipeline.conversionMatrixTab });
    fireEvent.click(matrixBtn);
    expect(screen.getByText(UI_STRINGS.module5.heading)).toBeInTheDocument();

    // Navigate to Schema
    const schemaBtn = screen.getByRole('button', { name: UI_STRINGS.pipeline.dataArchitectureTab });
    fireEvent.click(schemaBtn);
    expect(screen.getByText(UI_STRINGS.schema.bannerTitle)).toBeInTheDocument();

    // Return to Module 1
    const step1 = screen.getByText(UI_STRINGS.pipeline.steps.step1.title);
    fireEvent.click(step1);
    expect(screen.getByText(UI_STRINGS.module1.uploadedFileDetails)).toBeInTheDocument();
  });

  it('handles batch file upload with CSV and XLSX formats', async () => {
    const { container } = render(<Home />);

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      const csvFile = new File(
        ['po_number,vendor,item,qty,price,curr,year\nPO-1,VendorA,ItemA,100,50,USD,2024\n'],
        'sample_batch.csv',
        { type: 'text/csv' }
      );
      fireEvent.change(fileInput, { target: { files: [csvFile] } });

      await waitFor(() => {
        expect(apiClient.addIngestionFile).toHaveBeenCalled();
      });

      const textFile = new File(['header\nline1\nline2\n'], 'data.txt', { type: 'text/plain' });
      fireEvent.change(fileInput, { target: { files: [textFile] } });
    }
  });

  it('handles currency fixing and vendor merging modal flows', async () => {
    render(<Home />);

    // Open fix currency
    const fixBtns = screen.queryAllByRole('button', { name: new RegExp(UI_STRINGS.module1.actions.fixCurrency, 'i') });
    if (fixBtns.length > 0) {
      fireEvent.click(fixBtns[0]);
      const applyFxBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.modals.fixCurrency.applyConversion, 'i') });
      fireEvent.click(applyFxBtn);
      await waitFor(() => {
        expect(apiClient.updateValidationRecord).toHaveBeenCalled();
      });
    }

    // Open merge vendor
    const mergeBtns = screen.queryAllByRole('button', { name: new RegExp(UI_STRINGS.module1.actions.mergeVendor, 'i') });
    if (mergeBtns.length > 0) {
      fireEvent.click(mergeBtns[0]);
      const mapBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.modals.mergeVendor.confirmMerge, 'i') });
      fireEvent.click(mapBtn);
      await waitFor(() => {
        expect(apiClient.mergeVendor).toHaveBeenCalled();
      });
    }
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
      const applyColL = screen.getByRole('button', { name: UI_STRINGS.modals.reassign.saveMapping });
      fireEvent.click(applyColL);
    }

    // Module 2 -> Module 3
    const proceedToTrend = screen.getByRole('button', { name: UI_STRINGS.module2.btnProceedToTrend });
    fireEvent.click(proceedToTrend);
    expect(screen.getByText(UI_STRINGS.module3.heading)).toBeInTheDocument();

    // Module 3 -> Module 4
    const proceedToSavings = screen.getByRole('button', { name: UI_STRINGS.module3.ctaProceedButton });
    fireEvent.click(proceedToSavings);
    expect(screen.getByText(UI_STRINGS.module4.pipelineTitle)).toBeInTheDocument();

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
    expect(screen.getAllByText(UI_STRINGS.module5.heading)[0]).toBeInTheDocument();

    // Open Executive Report Modal
    const reportBtn = screen.getByRole('button', { name: UI_STRINGS.module5.generateExecutiveReport });
    fireEvent.click(reportBtn);
    expect(screen.getByText(UI_STRINGS.modals.report.title)).toBeInTheDocument();
    const printBtn = screen.getByRole('button', { name: UI_STRINGS.modals.report.printPdf });
    const closeReportBtn = printBtn.nextElementSibling as HTMLButtonElement;
    fireEvent.click(closeReportBtn);
  });

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
    expect(screen.getByText(UI_STRINGS.modals.report.title)).toBeInTheDocument();
    const printBtn2 = screen.getByRole('button', { name: UI_STRINGS.modals.report.printPdf });
    const closeReportBtn2 = printBtn2.nextElementSibling as HTMLButtonElement;
    fireEvent.click(closeReportBtn2);
    // Trigger onSelectTenant via tenant badge
    const tenantBadge = screen.getByTestId('tenant-badge');
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
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3500);
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
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3500);
    });

    expect(apiClient.deployOpportunity).toHaveBeenCalledWith(expect.any(String), 'DPS NXT');

    // Fast-forward toast timer (4000ms)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(4000);
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
    const fixInrBtns = screen.getAllByRole('button', { name: UI_STRINGS.module1.fixInr });
    if (fixInrBtns.length > 0) {
      fireEvent.click(fixInrBtns[0]);
      const applyFxBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.modals.fixCurrency.applyConversion, 'i') });
      fireEvent.click(applyFxBtn);
    }

    // Merge vendor with rejection
    const mergeBtns = screen.getAllByRole('button', { name: UI_STRINGS.module1.mergeVendor });
    if (mergeBtns.length > 0) {
      fireEvent.click(mergeBtns[0]);
      const mapBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.modals.mergeVendor.confirmMerge, 'i') });
      fireEvent.click(mapBtn);
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
});

