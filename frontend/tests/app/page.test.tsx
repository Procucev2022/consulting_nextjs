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
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders initial state, loads backend data, and navigates through all module tabs', async () => {
    render(<Home />);

    // Check header
    expect(screen.getByText('PROCUCEV')).toBeInTheDocument();

    await waitFor(() => {
      expect(apiClient.getTenant).toHaveBeenCalled();
    });

    // Navigate to Module 2
    const step2 = screen.getByText('AI Categorization');
    fireEvent.click(step2);
    expect(screen.getByText(/AI Taxonomy Classification/i)).toBeInTheDocument();

    // Navigate to Module 3
    const step3 = screen.getByText('Trend Analysis');
    fireEvent.click(step3);
    expect(screen.getByText(/Historical Spend & Commodity Volatility/i)).toBeInTheDocument();

    // Navigate to Module 4
    const step4 = screen.getByText('Savings Engine');
    fireEvent.click(step4);
    expect(screen.getByText(/Opportunity Pipeline & Suite Integration/i)).toBeInTheDocument();

    // Navigate to Module 5
    const matrixBtn = screen.getByRole('button', { name: /5\. Conversion Matrix/i });
    fireEvent.click(matrixBtn);
    expect(screen.getByText(/Executive ROI & SaaS Payback Calculator/i)).toBeInTheDocument();

    // Navigate to Schema
    const schemaBtn = screen.getByRole('button', { name: /Data Architecture/i });
    fireEvent.click(schemaBtn);
    expect(screen.getByText(/Data Architecture & Security SLA/i)).toBeInTheDocument();

    // Return to Module 1
    const step1 = screen.getByText('3-Year Upload');
    fireEvent.click(step1);
    expect(screen.getByText('Uploaded Procurement File Details')).toBeInTheDocument();
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
    const fixBtns = screen.queryAllByRole('button', { name: /Fix Currency/i });
    if (fixBtns.length > 0) {
      fireEvent.click(fixBtns[0]);
      const applyFxBtn = screen.getByRole('button', { name: /Apply FX Conversion to INR/i });
      fireEvent.click(applyFxBtn);
      await waitFor(() => {
        expect(apiClient.updateValidationRecord).toHaveBeenCalled();
      });
    }

    // Open merge vendor
    const mergeBtns = screen.queryAllByRole('button', { name: /Merge Vendor/i });
    if (mergeBtns.length > 0) {
      fireEvent.click(mergeBtns[0]);
      const mapBtn = screen.getByRole('button', { name: /Map to Master Supplier/i });
      fireEvent.click(mapBtn);
      await waitFor(() => {
        expect(apiClient.mergeVendor).toHaveBeenCalled();
      });
    }
  });

  it('handles blanket fixes and reset validation records', async () => {
    render(<Home />);

    const blanketBtn = screen.queryByRole('button', { name: /Auto-Remediate All/i });
    if (blanketBtn) {
      fireEvent.click(blanketBtn);
      await waitFor(() => {
        expect(apiClient.applyBlanketRemediation).toHaveBeenCalled();
      });
    }

    const resetBtn = screen.queryByRole('button', { name: /Reset Validation Records/i });
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
    const proceedToCat = screen.getByRole('button', { name: /Run AI Categorization Engine/i });
    fireEvent.click(proceedToCat);
    expect(screen.getByText(/AI Taxonomy Classification/i)).toBeInTheDocument();

    // Line item confirm and reassign in Module 2
    const confirmBtns = screen.getAllByRole('button', { name: /^Confirm$/i });
    if (confirmBtns.length > 0) {
      fireEvent.click(confirmBtns[0]);
    }

    const reassignBtns = screen.getAllByRole('button', { name: /Re-Assign/i });
    if (reassignBtns.length > 0) {
      fireEvent.click(reassignBtns[0]);
      const applyColL = screen.getByRole('button', { name: /Apply Column L Mapping/i });
      fireEvent.click(applyColL);
    }

    // Module 2 -> Module 3
    const proceedToTrend = screen.getByRole('button', { name: /Proceed to 36-Month Volatility Analytics/i });
    fireEvent.click(proceedToTrend);
    expect(screen.getByText(/Historical Spend & Commodity Volatility/i)).toBeInTheDocument();

    // Module 3 -> Module 4
    const proceedToSavings = screen.getByRole('button', { name: /Proceed to Real-Time Savings Engine/i });
    fireEvent.click(proceedToSavings);
    expect(screen.getByText(/Opportunity Pipeline & Suite Integration/i)).toBeInTheDocument();

    // Module 4 suite dispatch
    const proCPXBtns = screen.queryAllByRole('button', { name: /Push to proCPX/i });
    if (proCPXBtns.length > 0) {
      fireEvent.click(proCPXBtns[0]);
      expect(screen.getByText('Launch Sourcing Event')).toBeInTheDocument();
      const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
      fireEvent.click(cancelBtn);
    }

    const dpsNXTBtns = screen.queryAllByRole('button', { name: /Push to DPS NXT/i });
    if (dpsNXTBtns.length > 0) {
      fireEvent.click(dpsNXTBtns[0]);
      expect(screen.getByText('Automate Rate Card & Contract Rules')).toBeInTheDocument();
      const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
      fireEvent.click(cancelBtn);
    }

    // Module 4 -> Module 5
    const proceedToConversion = screen.getByRole('button', { name: /Proceed to Conversion Matrix & ROI Engine/i });
    fireEvent.click(proceedToConversion);
    expect(screen.getAllByText(/Commercial Realization & SaaS Lock-In Portal/i)[0]).toBeInTheDocument();

    // Open Executive Report Modal
    const reportBtn = screen.getByRole('button', { name: /Generate Executive Brief/i });
    fireEvent.click(reportBtn);
    expect(screen.getByText(/Executive Advisory Diagnostic & ROI Blueprint/i)).toBeInTheDocument();
    const printBtn = screen.getByRole('button', { name: /Print \/ PDF/i });
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
    const themeBtn = screen.getByTitle(/Switch to Dark Mode/i);
    fireEvent.click(themeBtn);
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    // Switch theme back to light
    const lightBtn = screen.getByTitle(/Switch to Light Mode/i);
    fireEvent.click(lightBtn);
    expect(document.documentElement.classList.contains('light')).toBe(true);

    // Switch currency via header buttons
    const eurBtn = screen.getByRole('button', { name: 'EUR' });
    fireEvent.click(eurBtn);

    const gbpBtn = screen.getByRole('button', { name: 'GBP' });
    fireEvent.click(gbpBtn);

    const inrBtn = screen.getByRole('button', { name: /₹ INR/i });
    fireEvent.click(inrBtn);

    // Open Executive Report from Header button
    const headerReportBtn = screen.getByRole('button', { name: /Executive Brief/i });
    fireEvent.click(headerReportBtn);
    expect(screen.getByText(/Executive Advisory Diagnostic & ROI Blueprint/i)).toBeInTheDocument();
    const printBtn2 = screen.getByRole('button', { name: /Print \/ PDF/i });
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
    const step4 = screen.getByText('Savings Engine');
    fireEvent.click(step4);
    await screen.findByText(/Opportunity Pipeline & Suite Integration/i);

    // Enable fake timers for countdowns
    vi.useFakeTimers();

    // Click ProCPX button in table
    const proCPXBtns = screen.getAllByRole('button', { name: /Push to proCPX/i });
    fireEvent.click(proCPXBtns[0]);

    // Find modal heading and submit button inside the modal
    const modalHeading = screen.getByRole('heading', { name: /Launch Sourcing Event/i });
    const modal = modalHeading.closest('div.relative');
    const modalLaunchBtn = within(modal as HTMLElement).getByRole('button', { name: /Push to proCPX/i });
    fireEvent.click(modalLaunchBtn);

    // Fast-forward countdown and completion timers (1200ms + 1800ms = 3000ms)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3500);
    });

    // ProCPX deploy API was called and handled rejection
    expect(apiClient.deployOpportunity).toHaveBeenCalledWith(expect.any(String), 'proCPX');

    // Click DPS NXT button in table
    const dpsNXTBtns = screen.getAllByRole('button', { name: /Push to DPS NXT/i });
    fireEvent.click(dpsNXTBtns[0]);

    // Find DPS modal heading and submit button
    const dpsHeading = screen.getByRole('heading', { name: /Automate Rate Card & Contract Rules/i });
    const dpsModal = dpsHeading.closest('div.relative');
    const modalDpsBtn = within(dpsModal as HTMLElement).getByRole('button', { name: /Push to DPS NXT/i });
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
    const fixInrBtns = screen.getAllByRole('button', { name: /Fix \(INR\)/i });
    if (fixInrBtns.length > 0) {
      fireEvent.click(fixInrBtns[0]);
      const applyFxBtn = screen.getByRole('button', { name: /Apply FX Conversion to INR/i });
      fireEvent.click(applyFxBtn);
    }

    // Merge vendor with rejection
    const mergeBtns = screen.getAllByRole('button', { name: /Merge Vendor/i });
    if (mergeBtns.length > 0) {
      fireEvent.click(mergeBtns[0]);
      const mapBtn = screen.getByRole('button', { name: /Map to Master Supplier/i });
      fireEvent.click(mapBtn);
    }

    // Blanket remediation with rejection
    const autoRemediateBtn = screen.getByRole('button', { name: /Apply Blanket AI Fixes/i });
    fireEvent.click(autoRemediateBtn);

    // Reset with rejection - wait for button to be available
    const resetBtn = await screen.findByRole('button', { name: /Reset Anomaly State/i });
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
    expect(screen.getByText('PROCUCEV')).toBeInTheDocument();
  });

  it('handles backend hydration failure gracefully on mount', async () => {
    vi.spyOn(apiClient, 'getTenant').mockRejectedValueOnce(new Error('Hydration error'));
    vi.spyOn(apiClient, 'getIngestionData').mockRejectedValueOnce(new Error('Ingestion error'));
    vi.spyOn(apiClient, 'getCategories').mockRejectedValueOnce(new Error('Categories error'));
    vi.spyOn(apiClient, 'getVendors').mockRejectedValueOnce(new Error('Vendors error'));
    vi.spyOn(apiClient, 'getSavingsOpportunities').mockRejectedValueOnce(new Error('Savings error'));

    render(<Home />);

    expect(screen.getByText('PROCUCEV')).toBeInTheDocument();
  });

  it('handles closing modals without submitting', () => {
    render(<Home />);

    // Fix currency modal close
    const fixInrBtns = screen.getAllByRole('button', { name: /Fix \(INR\)/i });
    if (fixInrBtns.length > 0) {
      fireEvent.click(fixInrBtns[0]);
      const closeBtn = screen.getByRole('button', { name: 'Cancel' });
      fireEvent.click(closeBtn);
    }

    // Merge vendor modal close
    const mergeBtns = screen.getAllByRole('button', { name: /Merge Vendor/i });
    if (mergeBtns.length > 0) {
      fireEvent.click(mergeBtns[0]);
      const closeBtn = screen.getByRole('button', { name: 'Cancel' });
      fireEvent.click(closeBtn);
    }

    // Navigate to Module 2 and close Reassign modal
    const step2 = screen.getByText('AI Categorization');
    fireEvent.click(step2);

    const reassignBtns = screen.getAllByRole('button', { name: /Re-Assign/i });
    if (reassignBtns.length > 0) {
      fireEvent.click(reassignBtns[0]);
      const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
      fireEvent.click(cancelBtn);
    }
  });
});

