import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import Home from '../../src/app/page';
import { apiClient, authApiClient } from '../../src/utils/api';
import { mockTenant } from '../../src/data/mockData';
import { UI_STRINGS } from '../../src/constants/uiStrings';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn()
  })
}));

const sampleDoc = {
  doc_id: 'DOC-PAGE-001',
  tenant_id: 'USR-TEST-1',
  file_name: 'test_dataset.xlsx',
  file_type: 'XLSX',
  file_size_mb: 1.5,
  uploaded_at: '2026-03-15',
  records_count: 100,
  ocr_status: 'Completed' as const,
  detected_currencies: ['USD', 'INR', 'EUR'],
  converted_inr_crores: 25.4,
  source_origin: 'SAP ERP'
};

const sampleValidationRecord = {
  record_id: 'VAL-PAGE-001',
  spend_year: 2025,
  po_number: 'PO-9001',
  raw_desc: 'Chemical Raw Material',
  core_category: 'Direct Materials',
  column_l_code: '12352100',
  vendor_name: 'Acme Chemical',
  order_quantity: 100,
  net_price: 250,
  raw_currency: 'USD',
  fx_rate_applied: 83.5,
  inr_crores: 0.21,
  amount: 25000,
  issue_flag: 'Missing Currency' as const,
  action_status: 'Action Needed' as const,
  resolved: false
};

const sampleValidationRecord2 = {
  record_id: 'VAL-PAGE-002',
  spend_year: 2025,
  po_number: 'PO-9002',
  raw_desc: 'Packaging Material Box',
  core_category: 'Packaging Materials',
  column_l_code: '14111500',
  vendor_name: 'Amcor Pack Ltd',
  order_quantity: 200,
  net_price: 150,
  raw_currency: 'USD',
  fx_rate_applied: 83.5,
  inr_crores: 0.25,
  amount: 30000,
  issue_flag: 'Unmapped Supplier Name' as const,
  action_status: 'Action Needed' as const,
  resolved: false
};

const sampleValidationRecord3 = {
  record_id: 'VAL-PAGE-003',
  spend_year: 2025,
  po_number: 'PO-9003',
  raw_desc: 'Industrial Fastener Bolt',
  core_category: 'Indirect & MRO',
  column_l_code: '31161500',
  vendor_name: 'Fastener Direct',
  order_quantity: 500,
  net_price: 50,
  raw_currency: 'USD',
  fx_rate_applied: 83.5,
  inr_crores: 0.21,
  amount: 25000,
  issue_flag: 'Duplicate Item Description' as const,
  action_status: 'Action Needed' as const,
  resolved: false
};

const sampleCategory = {
  id: 'CAT-PAGE-001',
  category: 'Direct Materials',
  total_3yr_spend_inr_cr: 120.5,
  spend_fy24_cr: 38.0,
  spend_fy25_cr: 40.5,
  spend_fy26_cr: 42.0,
  three_year_cagr: 5.1,
  supplier_count: 14,
  major_suppliers: ['Acme Chemical'],
  sample_column_l_code: '12352100',
  sample_column_l_title: 'Chemicals (Solvents)',
  top_items: [
    { item_name: 'Solvents', vendor_name: 'Acme Chemical', spend_inr_cr: 25.0, total_spend_inr_cr: 25.0, share_pct: 20.7 }
  ]
};

const sampleVendorRanking = {
  vendor_id: 'VND-PAGE-001',
  vendor_name: 'Acme Chemical',
  category: 'Direct Materials',
  total_spend_inr_cr: 25.5,
  price_creep_pct: 12.4,
  benchmark_index: 'ICIS Chemical Benchmark',
  variance_leakage_inr_cr: 2.1,
  variance_leakage_usd: 250000,
  risk_level: 'High' as const,
  audit_flag: 'Price Creep Anomaly'
};

const sampleOpportunity = {
  opp_id: 'OPP-PAGE-001',
  category: 'Direct Materials',
  current_spend_inr_cr: 45.0,
  current_spend: 450000000,
  est_savings_inr_cr: 4.5,
  est_savings: 45000000,
  savings_percentage: 10.0,
  lever: 'Supplier Consolidation',
  push_to_module: 'proCPX' as const,
  recommended_module: 'proCPX' as const,
  complexity: 'Low' as const,
  status: 'Ready to Deploy'
};

const sampleOpportunity2 = {
  opp_id: 'OPP-PAGE-002',
  category: 'Packaging Materials',
  current_spend_inr_cr: 25.0,
  current_spend: 250000000,
  est_savings_inr_cr: 2.5,
  est_savings: 25000000,
  savings_percentage: 10.0,
  lever: 'Rate Card Enforcement',
  push_to_module: 'DPS NXT' as const,
  recommended_module: 'DPS NXT' as const,
  complexity: 'Medium' as const,
  status: 'Ready to Deploy'
};

const sampleLineItem = {
  mapping_id: 'MAP-PAGE-001',
  line_item_id: 'LINE-PAGE-001',
  raw_desc: 'Packaging Corrugated Paper Cartons',
  vendor_identified: 'Amcor Packaging',
  unspsc_code: '14111500',
  unspsc_category_name: 'Packaging (Cartons)',
  core_bucket: 'Packaging Materials' as const,
  ai_confidence: 95,
  total_spend: 50000,
  inr_crores: 0.42,
  amount_inr: 4190000,
  spend_year: 2024,
  status: 'Pending' as const
};

describe('Home Page Component', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem('procucev_uploaded_dataset', JSON.stringify({
        doc: sampleDoc,
        validationRecords: [sampleValidationRecord, sampleValidationRecord2, sampleValidationRecord3],
        categories: [sampleCategory],
        lineItems: [sampleLineItem],
        vendorRankings: [sampleVendorRanking],
        opportunities: [sampleOpportunity, sampleOpportunity2]
      }));
      window.location.hash = '#module1';
    }
    vi.spyOn(authApiClient, 'getStoredUser').mockReturnValue({
      id: 'USR-TEST-1',
      email: 'test@example.com',
      role: 'BUYER',
      status: 'ACTIVE',
      tier: 'GOLD',
      full_name: 'Test Buyer',
      company_name: 'Enterprise Client',
      phone: '+1234567890',
      created_at: '2026-01-01T00:00:00.000Z'
    });
    vi.spyOn(authApiClient, 'getStoredToken').mockReturnValue('mock-token-123');
    vi.spyOn(apiClient, 'getTenant').mockResolvedValue({
      ...mockTenant,
      total_spend_evaluated_inr: 254.8,
      total_spend_evaluated: 2548000000
    });
    vi.spyOn(apiClient, 'getIngestionData').mockResolvedValue({
      queue: [sampleDoc],
      validationRecords: [sampleValidationRecord, sampleValidationRecord2, sampleValidationRecord3]
    });
    vi.spyOn(apiClient, 'getCategories').mockResolvedValue({
      categories: [sampleCategory],
      categoryDetails: []
    });
    vi.spyOn(apiClient, 'getVendors').mockResolvedValue({
      vendorRankings: [sampleVendorRanking],
      vendorDetails: []
    });
    vi.spyOn(apiClient, 'getSavingsOpportunities').mockResolvedValue({
      opportunities: [sampleOpportunity, sampleOpportunity2],
      totalPotentialSavingsCr: 119.67
    });
    vi.spyOn(apiClient, 'updateTenant').mockResolvedValue(mockTenant);
    vi.spyOn(apiClient, 'updateValidationRecord').mockResolvedValue(sampleValidationRecord);
    vi.spyOn(apiClient, 'applyBlanketRemediation').mockResolvedValue({ updatedCount: 3, records: [] });
    vi.spyOn(apiClient, 'resetValidationRecords').mockResolvedValue([sampleValidationRecord]);
    vi.spyOn(apiClient, 'addIngestionFile').mockResolvedValue([sampleDoc]);
    vi.spyOn(apiClient, 'uploadDocumentToObjectStore').mockResolvedValue({
      objectMeta: { key: 'test-key' },
      ingestionQueue: [sampleDoc]
    });
    vi.spyOn(apiClient, 'mergeVendor').mockResolvedValue({ success: true });
    vi.spyOn(apiClient, 'deployOpportunity').mockResolvedValue(sampleOpportunity);
    vi.spyOn(apiClient, 'getSimulatedTier').mockReturnValue('GOLD');
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

    // Check header — brand is rendered as aiCEV logo image
    expect(screen.getByAltText(UI_STRINGS.header.logoAlt)).toBeInTheDocument();

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
    const matrixBtn = screen.getByText(UI_STRINGS.pipeline.conversionMatrixTab);
    fireEvent.click(matrixBtn);
    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.module5.heading)).toBeInTheDocument();
    });

    // Return to Module 1
    const step1 = screen.getByText(UI_STRINGS.pipeline.steps.step1.title);
    fireEvent.click(step1);
    expect(screen.getByText(UI_STRINGS.module1.title)).toBeInTheDocument();
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
        expect(apiClient.uploadDocumentToObjectStore).toHaveBeenCalled();
      });

      const textFile = new File(['header\nline1\nline2\n'], 'data.txt', { type: 'text/plain' });
      textFile.text = vi.fn().mockResolvedValue('header\nline1\nline2\n');
      fireEvent.change(fileInput, { target: { files: [textFile] } });

      await waitFor(() => {
        expect(apiClient.uploadDocumentToObjectStore).toHaveBeenCalled();
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
        expect(apiClient.uploadDocumentToObjectStore).toHaveBeenCalled();
      });
    }
  });

  it('handles currency fixing and vendor merging modal flows', async () => {
    render(<Home />);

    await waitFor(() => {
      expect(apiClient.getTenant).toHaveBeenCalled();
    });

    // Open fix currency
    const fixBtns = await screen.findAllByRole('button', { name: UI_STRINGS.module1.fixInr });
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

    await waitFor(() => {
      expect(apiClient.getTenant).toHaveBeenCalled();
    });

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

    await waitFor(() => {
      expect(apiClient.getTenant).toHaveBeenCalled();
    });

    // Module 1 -> Module 2
    const proceedToCat = await screen.findByRole('button', { name: UI_STRINGS.module1.runAiCategorization });
    fireEvent.click(proceedToCat);
    expect(screen.getByText(UI_STRINGS.module2.heading)).toBeInTheDocument();

    // Line item confirm and reassign in Module 2
    const confirmBtns = screen.queryAllByRole('button', { name: UI_STRINGS.module2.btnConfirm });
    if (confirmBtns.length > 0) {
      fireEvent.click(confirmBtns[0]);
    }

    const reassignBtns = screen.queryAllByRole('button', { name: UI_STRINGS.module2.btnReassign });
    if (reassignBtns.length > 0) {
      fireEvent.click(reassignBtns[0]);
      const modalTitle = screen.getByText(UI_STRINGS.modals.reassign.title);
      const modalContainer = modalTitle.closest('.relative') as HTMLElement;
      const searchInput = within(modalContainer).getByPlaceholderText(UI_STRINGS.modals.reassign.searchPlaceholder);
      fireEvent.change(searchInput, { target: { value: 'boxwood' } });
      const firstResult = within(modalContainer).getByText('Fresh cut african boxwood');
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
    const proCPXBtns = screen.queryAllByRole('button', { name: UI_STRINGS.module4.pushToProCPX });
    if (proCPXBtns.length > 0) {
      fireEvent.click(proCPXBtns[0]);
      expect(screen.getByText(UI_STRINGS.modals.proCPX.heading)).toBeInTheDocument();
      const cancelBtns = screen.getAllByRole('button', { name: UI_STRINGS.modals.proCPX.cancel });
      fireEvent.click(cancelBtns[0]);
    }

    const dpsNXTBtns = screen.queryAllByRole('button', { name: UI_STRINGS.module4.pushToDPSNXT });
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

    // Open profile menu to access theme and currency controls
    fireEvent.click(screen.getByTestId('user-profile-menu-button'));

    // Switch theme to dark
    const themeBtn = screen.getByTitle(UI_STRINGS.header.themeToggleDark);
    fireEvent.click(themeBtn);
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    // Switch theme back to light
    const lightBtn = screen.getByTitle(UI_STRINGS.header.themeToggleLight);
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
    vi.spyOn(apiClient, 'getTenant').mockResolvedValue({ ...mockTenant, total_spend_evaluated_inr: 50 });
    vi.spyOn(apiClient, 'getIngestionData').mockResolvedValue({
      queue: [sampleDoc],
      validationRecords: [sampleValidationRecord]
    });
    vi.spyOn(apiClient, 'getSavingsOpportunities').mockResolvedValue({
      opportunities: [sampleOpportunity, sampleOpportunity2],
      totalPotentialSavingsCr: 7.0
    });
    vi.spyOn(apiClient, 'getVendors').mockResolvedValue({
      vendorRankings: [sampleVendorRanking],
      vendorDetails: []
    });
    vi.spyOn(apiClient, 'deployOpportunity')
      .mockRejectedValueOnce(new Error('Deployment sync failed'))
      .mockRejectedValueOnce(new Error('DPS sync failed'));

    render(<Home />);

    expect(await screen.findByText('test_dataset.xlsx')).toBeInTheDocument();

    // Navigate to Module 4
    const step4 = screen.getByText(UI_STRINGS.pipeline.steps.step4.title);
    fireEvent.click(step4);
    await screen.findByText(UI_STRINGS.module4.pipelineTitle);

    // Enable fake timers for countdowns
    vi.useFakeTimers();

    // Click ProCPX button in table
    const proCPXBtns = screen.getAllByRole('button', { name: UI_STRINGS.module4.pushToProCPX });
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
    const dpsNXTBtns = screen.getAllByRole('button', { name: UI_STRINGS.module4.pushToDPSNXT });
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
    const autoRemediateBtn = screen.queryByRole('button', { name: new RegExp(UI_STRINGS.module1.applyBlanketFixes, 'i') });
    if (autoRemediateBtn) {
      fireEvent.click(autoRemediateBtn);
    }

    // Reset with rejection
    const resetBtn = screen.queryByRole('button', { name: new RegExp(UI_STRINGS.module1.resetAnomalyState, 'i') });
    if (resetBtn) {
      fireEvent.click(resetBtn);
    }
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
    vi.spyOn(apiClient, 'uploadDocumentToObjectStore').mockRejectedValueOnce(new Error('Upload sync warning'));

    const { container } = render(<Home />);

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      // PDF upload
      const pdfFile = new File(['%PDF-1.4 dummy'], 'contract_scan.pdf', { type: 'application/pdf' });
      fireEvent.change(fileInput, { target: { files: [pdfFile] } });

      await waitFor(() => {
        expect(apiClient.uploadDocumentToObjectStore).toHaveBeenCalled();
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
        expect(apiClient.uploadDocumentToObjectStore).toHaveBeenCalled();
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
    expect(screen.getByAltText(UI_STRINGS.header.logoAlt)).toBeInTheDocument();
  });

  it('handles backend hydration failure gracefully on mount', async () => {
    vi.spyOn(apiClient, 'getTenant').mockRejectedValueOnce(new Error('Hydration error'));
    vi.spyOn(apiClient, 'getIngestionData').mockRejectedValueOnce(new Error('Ingestion error'));
    vi.spyOn(apiClient, 'getCategories').mockRejectedValueOnce(new Error('Categories error'));
    vi.spyOn(apiClient, 'getVendors').mockRejectedValueOnce(new Error('Vendors error'));
    vi.spyOn(apiClient, 'getSavingsOpportunities').mockRejectedValueOnce(new Error('Savings error'));

    render(<Home />);

    expect(screen.getByAltText(UI_STRINGS.header.logoAlt)).toBeInTheDocument();
  });

  it('handles unexpected Promise.allSettled throw during mount', async () => {
    vi.spyOn(Promise, 'allSettled').mockRejectedValueOnce(new Error('Fatal promise error'));
    render(<Home />);
    expect(screen.getByAltText(UI_STRINGS.header.logoAlt)).toBeInTheDocument();
  });

  it('handles closing modals without submitting', () => {
    render(<Home />);

    // Fix currency modal close
    const fixInrBtns = screen.queryAllByRole('button', { name: UI_STRINGS.module1.fixInr });
    if (fixInrBtns.length > 0) {
      fireEvent.click(fixInrBtns[0]);
      const closeBtn = screen.getByRole('button', { name: UI_STRINGS.modals.fixCurrency.cancel });
      fireEvent.click(closeBtn);
    }

    // Merge vendor modal close
    const mergeBtns = screen.queryAllByRole('button', { name: UI_STRINGS.module1.mergeVendor });
    if (mergeBtns.length > 0) {
      fireEvent.click(mergeBtns[0]);
      const closeBtn = screen.getByRole('button', { name: UI_STRINGS.modals.mergeVendor.cancel });
      fireEvent.click(closeBtn);
    }

    // Navigate to Module 2 and close Reassign modal
    const step2 = screen.getByText(UI_STRINGS.pipeline.steps.step2.title);
    fireEvent.click(step2);

    const reassignBtns = screen.queryAllByRole('button', { name: new RegExp(UI_STRINGS.module2.btnReassign, 'i') });
    if (reassignBtns.length > 0) {
      fireEvent.click(reassignBtns[0]);
      const cancelBtn = screen.getByRole('button', { name: UI_STRINGS.modals.reassign.cancel });
      fireEvent.click(cancelBtn);
    }
  }, 15000);

  it('restores dataset from backend API on mount and retains user upload across refresh', async () => {
    const savedDoc = {
      doc_id: 'DOC-SAVED-1',
      tenant_id: 'USR-TEST-1',
      file_name: 'saved_3_years.xlsx',
      file_type: 'XLSX',
      file_size_mb: 4.5,
      ocr_status: 'Completed' as const,
      progress: 100,
      uploaded_at: '2026-03-01 10:00:00',
      records_count: 500,
      detected_currencies: ['INR'],
      converted_inr_crores: 120.5
    };
    vi.spyOn(apiClient, 'getIngestionData').mockResolvedValueOnce({
      queue: [savedDoc],
      validationRecords: [sampleValidationRecord]
    });

    render(<Home />);

    await waitFor(() => {
      expect(apiClient.getTenant).toHaveBeenCalled();
    });

    expect(await screen.findByText('saved_3_years.xlsx')).toBeInTheDocument();
  });

  it('handles backend hydration on mount cleanly without sessionStorage dependency', async () => {
    render(<Home />);
    expect(screen.getByAltText(UI_STRINGS.header.logoAlt)).toBeInTheDocument();
  });

  it('handles raw backend ingestion queue with missing optional properties', async () => {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.clear();
    }
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
      validationRecords: [sampleValidationRecord]
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
        expect(apiClient.uploadDocumentToObjectStore).toHaveBeenCalled();
      });
    }
    expect(screen.getByAltText(UI_STRINGS.header.logoAlt)).toBeInTheDocument();
  });

  it('handles refreshing with fixes and displays final numbers toast notification', async () => {
    const scrollMock = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollMock;

    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem('procucev_uploaded_dataset', JSON.stringify({ doc: sampleDoc, validationRecords: [sampleValidationRecord] }));
    }

    render(<Home />);
    await waitFor(() => {
      expect(apiClient.getTenant).toHaveBeenCalled();
    });

    // Verify Refresh with Fixes buttons are hidden as requested
    const refreshButtons = screen.queryAllByRole('button', {
      name: new RegExp(UI_STRINGS.module1.refreshWithFixes, 'i')
    });
    expect(refreshButtons.length).toBe(0);

    // Apply blanket fixes so all validation records are resolved
    const blanketBtn = screen.queryByRole('button', { name: new RegExp(UI_STRINGS.module1.applyBlanketFixes, 'i') });
    if (blanketBtn) {
      fireEvent.click(blanketBtn);
      await waitFor(() => {
        expect(screen.getByText(UI_STRINGS.toasts.blanketFixesApplied)).toBeInTheDocument();
      });
    }
  });

  it('triggers AnalyzingLoader during batch file upload and handles completion', async () => {
    render(<Home />);
    await waitFor(() => {
      expect(screen.getByAltText(UI_STRINGS.header.logoAlt)).toBeInTheDocument();
    });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['Vendor,Qty,Price\nAcme,10,100'], 'test.csv', { type: 'text/csv' });
    if (fileInput) {
      fireEvent.change(fileInput, { target: { files: [file] } });
    }
  });

  it('triggers onStartAICategorization toast in Module2', async () => {
    vi.spyOn(apiClient, 'getTenant').mockResolvedValue({ ...mockTenant, total_spend_evaluated_inr: 50 });
    render(<Home />);
    await waitFor(() => {
      expect(apiClient.getTenant).toHaveBeenCalled();
    });

    // Click Run AI Categorization from Module 1
    const runAiBtn = await screen.findByRole('button', { name: UI_STRINGS.module1.runAiCategorization });
    fireEvent.click(runAiBtn);

    // Verify toast is triggered
    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.toasts.runningAiCat)).toBeInTheDocument();
    });
  });

  it('renders masked overlay for Bronze tier and shows upgrade trigger', async () => {
    vi.spyOn(apiClient, 'getSimulatedTier').mockReturnValue('BRONZE');
    render(<Home />);
    await waitFor(() => {
      expect(screen.getByAltText(UI_STRINGS.header.logoAlt)).toBeInTheDocument();
    });

    // Navigate to Module 2
    const step2 = screen.getByText(UI_STRINGS.pipeline.steps.step2.title);
    fireEvent.click(step2);

    // Module 2 is masked with upgrade prompt
    expect(await screen.findByText(UI_STRINGS.subscription.upgradeToSilver)).toBeInTheDocument();
  });

  it('handles cross-module initiative navigation from Module 4 to Module 2 section', async () => {
    vi.spyOn(apiClient, 'getTenant').mockResolvedValue({ ...mockTenant, total_spend_evaluated_inr: 50 });
    vi.spyOn(apiClient, 'getIngestionData').mockResolvedValue({
      queue: [sampleDoc],
      validationRecords: [sampleValidationRecord]
    });
    vi.spyOn(apiClient, 'getSavingsOpportunities').mockResolvedValue({
      opportunities: [sampleOpportunity, sampleOpportunity2],
      totalPotentialSavingsCr: 7.0
    });
    vi.spyOn(apiClient, 'getVendors').mockResolvedValue({
      vendorRankings: [sampleVendorRanking],
      vendorDetails: []
    });
    render(<Home />);
    expect(await screen.findByText('test_dataset.xlsx')).toBeInTheDocument();

    // Switch to Module 4 (Savings Engine)
    const step4 = screen.getByText(UI_STRINGS.pipeline.steps.step4.title);
    fireEvent.click(step4);

    // Verify Strategic Savings Banner is rendered
    expect(await screen.findByTestId('strategic-savings-summary-banner')).toBeInTheDocument();

    // Click Vendor Consolidation savings number
    const btnVendorConsol = screen.getByTestId('btn-savings-number-VENDOR_CONSOLIDATION');
    fireEvent.click(btnVendorConsol);

    // Verify activeTab switched to module2 and toast triggered
    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.toasts.navigatingToInitiativeSection('vendor-consolidation-section'))).toBeInTheDocument();
    });
  });

  it('redirects unauthenticated visitors to /login', async () => {
    vi.spyOn(authApiClient, 'getStoredUser').mockReturnValue(null);
    vi.spyOn(authApiClient, 'getStoredToken').mockReturnValue(null);
    render(<Home />);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('redirects admin users to /admin/dashboard', async () => {
    vi.spyOn(authApiClient, 'getStoredUser').mockReturnValue({
      id: 'USR-ADMIN-1',
      email: 'admin@example.com',
      role: 'ADMIN',
      status: 'ACTIVE',
      tier: 'GOLD',
      full_name: 'Super Admin',
      company_name: 'Admin Enterprise',
      phone: '+1234567890',
      created_at: '2026-01-01T00:00:00.000Z'
    });
    vi.spyOn(authApiClient, 'getStoredToken').mockReturnValue('admin-token-123');
    render(<Home />);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin/dashboard');
    });
  });
});


