import React from 'react';
import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest';
import { render, screen, fireEvent, act, waitFor, cleanup, within } from '@testing-library/react';
import { Module2Categorization } from '../../src/components/Module2Categorization';
import { mockTenant } from '../fixtures/mockData';
import { UI_STRINGS } from '../../src/constants/uiStrings';
import { unspscOfficialDictionary } from '../../src/data/unspscTaxonomy';
import { taxonomyRecords } from '../fixtures/taxonomy';

vi.mock('../../src/utils/industryApi', () => ({
  loadIndustryCatalog: vi.fn().mockResolvedValue({
    success: true,
    profiles: [{
      majorSector: 'Chemical & Petrochemicals', minorSector: 'Specialty Chemicals', sectorCode: 'CHEM-SPEC',
      tagline: 'D1 chemical profile', description: 'Test fixture', typicalDirectMaterials: ['Catalyst'],
      typicalPackagingMaterials: ['Drum'], typicalLogisticsCategories: ['Freight'], typicalMroCategories: ['Pump'],
      characteristicUNSPSCPrefixes: ['12', '14'],
      benchmarkSpendSplit: { directPct: 56, packagingPct: 18, logisticsPct: 14, mroPct: 12 },
      categorizationGuidance: 'Test guidance', keyKeywords: ['catalyst']
    }],
    presets: []
  })
}));

// tests/setup.ts seeds the shared catalog. Replace it so every fixture record appears exactly once.
beforeAll(() => { unspscOfficialDictionary.splice(0, unspscOfficialDictionary.length, ...taxonomyRecords); });

// UNSPSCDetailModal is loaded through next/dynamic, so it mounts after an async module import.
// A cold import (slower under coverage instrumentation) can exceed findByRole's 1s default.
const LAZY_MODAL_TIMEOUT_MS = 5000;

const renderAndSettleIndustryCatalog = async (element: React.ReactElement) => {
  const view = render(element);
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
  return view;
};

const sampleSpendCategories = [
  {
    id: 'CAT-1',
    category: 'Direct Materials',
    total_3yr_spend_inr_cr: 120.5,
    spend_fy24_cr: 38.0,
    spend_fy25_cr: 40.5,
    spend_fy26_cr: 42.0,
    three_year_cagr: 5.1,
    supplier_count: 14,
    major_suppliers: ['Acme Chemical', 'BASF India'],
    sample_column_l_code: '12352100',
    sample_column_l_title: 'Chemicals (Solvents)',
    top_items: [
      { item_name: 'Solvents', vendor_name: 'Acme Chemical', spend_inr_cr: 25.0, total_spend_inr_cr: 25.0, share_pct: 20.7 }
    ]
  },
  {
    id: 'CAT-2',
    category: 'Packaging Materials',
    total_3yr_spend_inr_cr: 45.2,
    spend_fy24_cr: 14.2,
    spend_fy25_cr: 15.0,
    spend_fy26_cr: 16.0,
    three_year_cagr: 6.2,
    supplier_count: 8,
    major_suppliers: ['Amcor Packaging'],
    sample_column_l_code: '14111500',
    sample_column_l_title: 'Packaging (Cartons)',
    top_items: [
      { item_name: 'Cartons', vendor_name: 'Amcor Packaging', spend_inr_cr: 12.0, total_spend_inr_cr: 12.0, share_pct: 26.5 }
    ]
  }
];

describe('Module2Categorization Component', () => {
  afterEach(() => {
    cleanup();
  });
  const sampleLineItems = [
    {
      mapping_id: 'MAP-1',
      line_item_id: 'LINE-1',
      raw_desc: 'Packaging Corrugated Carton Boxes',
      vendor_identified: 'Amcor Packaging',
      unspsc_code: '14111500',
      unspsc_category_name: 'Packaging (Cartons)',
      core_bucket: 'Packaging Materials' as const,
      ai_confidence: 95,
      total_spend: 50000,
      inr_crores: 0.42,
      amount_inr: 4190000,
      spend_year: 2024,
      status: 'Pending'
    },
    {
      mapping_id: 'MAP-2',
      line_item_id: 'LINE-2',
      raw_desc: 'Direct Chemical Solvents Drums',
      vendor_identified: 'Acme Chemical',
      unspsc_code: '12352100',
      unspsc_category_name: 'Chemicals (Solvents)',
      core_bucket: 'Direct Materials' as const,
      ai_confidence: 85,
      total_spend: 120000,
      inr_crores: 1.05,
      amount_inr: 10050000,
      spend_year: 2025,
      status: 'Confirmed'
    },
    {
      mapping_id: 'MAP-3',
      line_item_id: 'LINE-3',
      raw_desc: 'Freight Ocean Container Logistics',
      vendor_identified: 'DHL Global Logistics',
      unspsc_code: '78101800',
      unspsc_category_name: 'Freight (Maritime)',
      core_bucket: 'Logistics & Freight' as const,
      ai_confidence: 72,
      total_spend: 85000,
      inr_crores: undefined as any,
      amount_inr: undefined as any,
      spend_year: 2026,
      status: 'Pending'
    },
    {
      mapping_id: 'MAP-4',
      line_item_id: 'LINE-4',
      raw_desc: 'Industrial MRO Valves and Pipes',
      vendor_identified: 'Ferguson MRO',
      unspsc_code: '40141600',
      unspsc_category_name: 'Piping Valves',
      core_bucket: 'Indirect & MRO' as const,
      ai_confidence: 92,
      total_spend: 25000,
      inr_crores: 0.21,
      amount_inr: 2100000,
      spend_year: 2024,
      status: 'Pending'
    },
    {
      mapping_id: 'MAP-5',
      line_item_id: 'LINE-5',
      raw_desc: 'Office Executive Ergonomic Mesh Chair',
      vendor_identified: 'Steelcase Office Solutions',
      unspsc_code: '56112102',
      unspsc_category_name: 'Workstation Seating',
      core_bucket: 'Indirect & MRO' as const,
      ai_confidence: 60,
      total_spend: 15000,
      inr_crores: 0.12,
      amount_inr: 1200000,
      spend_year: 2024,
      status: 'Pending'
    }
  ];

  it('renders correctly and switches AI models', async () => {
    await renderAndSettleIndustryCatalog(
      <Module2Categorization
        categories={sampleSpendCategories}
        lineItems={sampleLineItems as any}
        onConfirmMapping={vi.fn()}
        onReassignMapping={vi.fn()}
        onProceedToTrend={vi.fn()}
      />
    );

    expect(screen.getByText(UI_STRINGS.module2.matrixTitle)).toBeInTheDocument();

    const startAiBtn = screen.getByRole('button', { name: UI_STRINGS.module2.startAiCategorization });
    expect(startAiBtn).toBeInTheDocument();
    fireEvent.click(startAiBtn);

    // Verifies AnalyzingLoader is mounted in overlay mode
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();
    const cancelLoaderBtn = screen.getByRole('button', { name: UI_STRINGS.analyzingLoader.cancelButton });
    fireEvent.click(cancelLoaderBtn);
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  it('filters line items by bucket, year, confidence, and search query', async () => {
    await renderAndSettleIndustryCatalog(
      <Module2Categorization
        categories={sampleSpendCategories}
        lineItems={sampleLineItems as any}
        onConfirmMapping={vi.fn()}
        onReassignMapping={vi.fn()}
        onProceedToTrend={vi.fn()}
      />
    );

    const tableSearch = screen.getByPlaceholderText(UI_STRINGS.module2.searchPlaceholder);
    fireEvent.change(tableSearch, { target: { value: 'Carton' } });
    fireEvent.change(tableSearch, { target: { value: 'Acme Chemical' } });
    fireEvent.change(tableSearch, { target: { value: '78101800' } });
    fireEvent.change(tableSearch, { target: { value: 'Piping Valves' } });
    fireEvent.change(tableSearch, { target: { value: '' } });

    const selects = screen.getAllByRole('combobox');
    const yearSelect = selects[3];
    const bucketSelect = selects[4];

    fireEvent.change(bucketSelect, { target: { value: 'Direct Materials' } });
    fireEvent.change(yearSelect, { target: { value: '2025' } });

    fireEvent.change(bucketSelect, { target: { value: 'ALL' } });
    fireEvent.change(yearSelect, { target: { value: 'ALL' } });
  });

  it('allows live explorer search and bucket filtering', async () => {
    await renderAndSettleIndustryCatalog(
      <Module2Categorization
        categories={sampleSpendCategories}
        lineItems={sampleLineItems as any}
        onConfirmMapping={vi.fn()}
        onReassignMapping={vi.fn()}
        onProceedToTrend={vi.fn()}
      />
    );

    const explorerSearch = screen.getByPlaceholderText(UI_STRINGS.module2.catalogSearchPlaceholder);
    fireEvent.change(explorerSearch, { target: { value: 'boxwood' } });

    const selects = screen.getAllByRole('combobox');
    const explorerBucketSelect = selects[2];
    fireEvent.change(explorerBucketSelect, { target: { value: 'Direct Materials' } });
  });

  it('triggers onConfirmMapping and onReassignMapping and onProceedToTrend', async () => {
    const onConfirmMapping = vi.fn();
    const onReassignMapping = vi.fn();
    const onProceedToTrend = vi.fn();

    await renderAndSettleIndustryCatalog(
      <Module2Categorization
        categories={sampleSpendCategories}
        lineItems={sampleLineItems as any}
        onConfirmMapping={onConfirmMapping}
        onReassignMapping={onReassignMapping}
        onProceedToTrend={onProceedToTrend}
      />
    );

    const confirmBtns = screen.getAllByRole('button', { name: new RegExp(`^${UI_STRINGS.module2.btnConfirm}$`, 'i') });
    fireEvent.click(confirmBtns[0]);
    expect(onConfirmMapping).toHaveBeenCalledWith(sampleLineItems[0].mapping_id);

    const reassignBtns = screen.getAllByRole('button', { name: UI_STRINGS.module2.btnReassign });
    fireEvent.click(reassignBtns[0]);
    expect(onReassignMapping).toHaveBeenCalledWith(sampleLineItems[0]);

    const proceedBtn = screen.getByRole('button', { name: UI_STRINGS.module2.btnProceedToTrend });
    fireEvent.click(proceedBtn);
    expect(onProceedToTrend).toHaveBeenCalled();
  });

  it('handles AI model toggle, year filters 2023/2024/2026, confirmed item status, and unranked categories', async () => {
    const unrankedCategories = [
      {
        category_id: 'CAT-UNRANKED-1',
        category: 'Unranked Category A',
        core_category: 'Direct Materials',
        sample_column_l_code: '12345678',
        rank: undefined,
        spend_inr_2023_cr: 10,
        spend_inr_2024_cr: 12,
        spend_inr_2025_26_cr: 15,
        total_3yr_spend_inr_cr: 37,
        yoy_growth_pct: 5,
        savings_opportunity_inr_cr: 2
      },
      {
        category_id: 'CAT-RANK4',
        category: 'Rank 4 Category',
        core_category: 'Packaging Materials',
        sample_column_l_code: '87654321',
        rank: 4,
        spend_inr_2023_cr: 5,
        spend_inr_2024_cr: 6,
        spend_inr_2025_26_cr: 7,
        total_3yr_spend_inr_cr: 18,
        yoy_growth_pct: 2,
        savings_opportunity_inr_cr: 1
      }
    ];

    const mixedLineItems = [
      {
        mapping_id: 'MAP-CONFIRMED',
        line_item_id: 'LINE-CONFIRMED',
        spend_year: undefined,
        po_number: 'PO-CONF',
        raw_desc: 'Confirmed Line Item',
        vendor_identified: 'Confirmed Vendor',
        column_l_commodity: 'Commodity Confirmed',
        core_category: 'Direct Materials',
        confidence_pct: 95,
        status: 'Confirmed'
      }
    ];

    await renderAndSettleIndustryCatalog(
      <Module2Categorization
        categories={unrankedCategories as any}
        lineItems={mixedLineItems as any}
        onConfirmMapping={vi.fn()}
        onReassignMapping={vi.fn()}
        onProceedToTrend={vi.fn()}
      />
    );

    // Start AI Categorization button
    const startAiBtn = screen.getByRole('button', { name: UI_STRINGS.module2.startAiCategorization });
    fireEvent.click(startAiBtn);

    // Year filters
    const selects = screen.getAllByRole('combobox');
    const yearSelect = selects[1];
    fireEvent.change(yearSelect, { target: { value: '2023' } });
    fireEvent.change(yearSelect, { target: { value: '2024' } });
    fireEvent.change(yearSelect, { target: { value: '2026' } });
    fireEvent.change(yearSelect, { target: { value: 'ALL' } });

    // Verify confirmed badge rendered
    expect(screen.getByText(UI_STRINGS.module2.statusConfirmed)).toBeInTheDocument();
    // Verify default spend_year 2024 rendered
    expect(screen.getByText('2024')).toBeInTheDocument();
  });

  it('renders CategoryVendorBreakdownView with tenant prop inside categorization module', async () => {
    await renderAndSettleIndustryCatalog(
      <Module2Categorization
        categories={sampleSpendCategories}
        lineItems={sampleLineItems as any}
        onConfirmMapping={vi.fn()}
        onReassignMapping={vi.fn()}
        onProceedToTrend={vi.fn()}
        tenant={mockTenant}
      />
    );

    expect(screen.getAllByText(UI_STRINGS.module2.breakdown.inrValuation)[0]).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.module2.breakdown.categorySpendBreakdown)).toBeInTheDocument();
    expect(screen.getAllByText(mockTenant.enterprise_name)[0]).toBeInTheDocument();
  });

  it('triggers onStartAICategorization and transitions to completed state after timer', async () => {
    vi.useFakeTimers();
    const handleStartMock = vi.fn();
    await renderAndSettleIndustryCatalog(
      <Module2Categorization
        categories={sampleSpendCategories}
        lineItems={sampleLineItems as any}
        onConfirmMapping={vi.fn()}
        onReassignMapping={vi.fn()}
        onProceedToTrend={vi.fn()}
        onStartAICategorization={handleStartMock}
        speedMultiplier={100}
      />
    );

    const startBtn = screen.getByRole('button', { name: UI_STRINGS.module2.startAiCategorization });
    fireEvent.click(startBtn);
    expect(handleStartMock).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.getByRole('button', { name: UI_STRINGS.module2.aiCategorizationCompleted })).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('renders Year-Wise Category Spend Valuation Matrix with multi-year comparisons and drilldowns', async () => {
    await renderAndSettleIndustryCatalog(
      <Module2Categorization
        categories={sampleSpendCategories}
        lineItems={sampleLineItems as any}
        onConfirmMapping={vi.fn()}
        onReassignMapping={vi.fn()}
        onProceedToTrend={vi.fn()}
      />
    );

    // Verify Year-Wise Category Spend Matrix is rendered directly in Area A
    expect(screen.getByText(UI_STRINGS.module2.matrixTitle)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.module2.matrixDesc)).toBeInTheDocument();

    // Verify Category Spend Matrix table headers are shown
    expect(screen.getByText(UI_STRINGS.module2.matrixHeaders.category)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.module2.matrixHeaders.colLRange)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.module2.matrixHeaders.total)).toBeInTheDocument();
    const matrix = within(screen.getByTestId('client-spend-intelligence-area'));
    expect(matrix.getByRole('columnheader', { name: UI_STRINGS.module2.matrixHeaders.fy24 })).toHaveAttribute(
      'title',
      UI_STRINGS.common.fiscalYearRanges.fy24
    );
    expect(matrix.getByRole('columnheader', { name: UI_STRINGS.module2.matrixHeaders.fy25 })).toHaveAttribute(
      'title',
      UI_STRINGS.common.fiscalYearRanges.fy25
    );
    expect(matrix.getByRole('columnheader', { name: UI_STRINGS.module2.matrixHeaders.fy26 })).toHaveAttribute(
      'title',
      UI_STRINGS.common.fiscalYearRanges.fy26
    );
  }, 15000);

  it('renders centralized fiscal-year guidance when uploaded categories lack FY25 and FY26 spend', async () => {
    const categoriesWithoutRecentSpend = sampleSpendCategories.map((category) => ({
      ...category,
      spend_fy25_cr: 0,
      spend_fy26_cr: 0
    }));
    await renderAndSettleIndustryCatalog(
      <Module2Categorization
        categories={categoriesWithoutRecentSpend}
        lineItems={[]}
        onConfirmMapping={vi.fn()}
        onReassignMapping={vi.fn()}
        onProceedToTrend={vi.fn()}
      />
    );

    const matrix = within(screen.getByTestId('client-spend-intelligence-area'));
    expect(matrix.getByText(UI_STRINGS.module2.matrixHeaders.fy25).closest('th')).toHaveAttribute(
      'title',
      UI_STRINGS.module2.matrixNoTransactionsInUpload('FY25')
    );
    expect(matrix.getByText(UI_STRINGS.module2.matrixHeaders.fy26).closest('th')).toHaveAttribute(
      'title',
      UI_STRINGS.module2.matrixNoTransactionsInUpload('FY26')
    );
    expect(matrix.getAllByTitle(UI_STRINGS.module2.matrixNoTransactionsForYear('FY25'))).toHaveLength(2);
    expect(matrix.getAllByTitle(UI_STRINGS.module2.matrixNoTransactionsForYear('FY26'))).toHaveLength(2);
    expect(matrix.getAllByText(UI_STRINGS.module2.matrixUnavailableHeader)).toHaveLength(2);
    expect(matrix.getAllByText(UI_STRINGS.module2.matrixUnavailableTotal)).toHaveLength(2);
    expect(matrix.getAllByText(UI_STRINGS.module2.matrixSinglePeriod)).toHaveLength(2);
  });

  it('renders the centralized empty state when there are no category records', async () => {
    await renderAndSettleIndustryCatalog(
      <Module2Categorization
        categories={[]}
        lineItems={[]}
        onConfirmMapping={vi.fn()}
        onReassignMapping={vi.fn()}
        onProceedToTrend={vi.fn()}
      />
    );

    expect(
      within(screen.getByTestId('client-spend-intelligence-area')).getAllByText(UI_STRINGS.module2.categoryBreakdownEmptyState)
    ).toHaveLength(2);
  });

  it('renders data-backed Material DNA profile summary and filters by sector relevance', async () => {
    await renderAndSettleIndustryCatalog(
      <Module2Categorization
        categories={sampleSpendCategories}
        lineItems={sampleLineItems as any}
        onConfirmMapping={vi.fn()}
        onReassignMapping={vi.fn()}
        onProceedToTrend={vi.fn()}
        tenant={{
          ...mockTenant,
          major_sector: 'Automotive & Transportation',
          minor_sector: 'Precision Auto Components'
        }}
      />
    );

    // Verify Sector Badge and Material DNA profile are rendered
    expect(screen.getAllByText(UI_STRINGS.module2.industryContext.badge).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Automotive & Transportation › Precision Auto Components/i)[0]).toBeInTheDocument();

    // Filter by Sector Relevance in workbench
    const sectorRelevanceFilter = screen.getByLabelText(UI_STRINGS.module2.industryContext.badge);
    fireEvent.change(sectorRelevanceFilter, { target: { value: 'CORE_DIRECT' } });
    fireEvent.change(sectorRelevanceFilter, { target: { value: 'CRITICAL_PACKAGING' } });
    fireEvent.change(sectorRelevanceFilter, { target: { value: 'SECTOR_LOGISTICS' } });
    fireEvent.change(sectorRelevanceFilter, { target: { value: 'GENERAL_MRO' } });
    fireEvent.change(sectorRelevanceFilter, { target: { value: 'CROSS_DOMAIN' } });
    fireEvent.change(sectorRelevanceFilter, { target: { value: 'ALL' } });
  });

  it('renders Material code, description, PO number, vendor entity, and UNSPSC commodity/class titles in table', async () => {
    const detailedLineItems = [
      {
        mapping_id: 'MAP-DET-1',
        line_item_id: 'LINE-DET-1',
        material_code: 'MAT-9901-BOX',
        material_desc: 'Heavy Duty Packaging Box 50x50',
        raw_desc: 'Heavy Duty Packaging Box 50x50',
        vendor_identified: 'Global Box Co.',
        master_supplier_id: 'SUP-GBOX-100',
        unspsc_code: '14121506',
        unspsc_category_name: 'Packaging (Boxes)',
        unspsc_commodity_title: 'Corrugated fiberboard boxes',
        unspsc_class_title: 'Paperboard and packaging papers',
        core_bucket: 'Packaging Materials' as const,
        ai_confidence: 96,
        total_spend: 60000,
        inr_crores: 0.50,
        amount_inr: 5000000,
        spend_year: 2024,
        po_number: 'PO-2024-998877',
        status: 'Confirmed'
      }
    ];

    await renderAndSettleIndustryCatalog(
      <Module2Categorization
        categories={sampleSpendCategories}
        lineItems={detailedLineItems as any}
        onConfirmMapping={vi.fn()}
        onReassignMapping={vi.fn()}
        onProceedToTrend={vi.fn()}
      />
    );

    // Verify Column Headers
    expect(screen.getByText(UI_STRINGS.module2.workbenchTitle)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.module2.workbenchDescHighlight)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.module2.taxonomyVerifiedFooter)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.module2.lineItemHeaders.poNumber)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.module2.lineItemHeaders.materialCodeDesc)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.module2.lineItemHeaders.unspscColLCommodityClass)).toBeInTheDocument();

    // Verify Item Cells
    expect(screen.getByText(UI_STRINGS.module2.unspscCodeBadge('14121506'))).toBeInTheDocument();
    expect(screen.getAllByText('MAT-9901-BOX').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Heavy Duty Packaging Box 50x50').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('PO-2024-998877').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Global Box Co.').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('SUP-GBOX-100').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Corrugated fiberboard boxes').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Paperboard and packaging papers').length).toBeGreaterThan(0);
    expect(screen.getAllByText(UI_STRINGS.module2.commodityLabel).length).toBeGreaterThan(0);
    expect(screen.getAllByText(UI_STRINGS.module2.classLabel).length).toBeGreaterThan(0);

    // Verify Search by material code and PO number
    const tableSearch = screen.getByPlaceholderText(UI_STRINGS.module2.searchPlaceholder);
    fireEvent.change(tableSearch, { target: { value: 'MAT-9901-BOX' } });
    expect(screen.getAllByText('MAT-9901-BOX').length).toBeGreaterThanOrEqual(1);

    fireEvent.change(tableSearch, { target: { value: 'PO-2024-998877' } });
    expect(screen.getAllByText('PO-2024-998877').length).toBeGreaterThanOrEqual(1);

    fireEvent.change(tableSearch, { target: { value: 'Corrugated fiberboard' } });
    expect(screen.getAllByText('Corrugated fiberboard boxes').length).toBeGreaterThanOrEqual(1);
  });

  it('displays Commodity Title and Class Title on catalog cards and opens UNSPSCDetailModal pop-up on click', async () => {
    await renderAndSettleIndustryCatalog(
      <Module2Categorization
        categories={sampleSpendCategories}
        lineItems={sampleLineItems as any}
        onConfirmMapping={vi.fn()}
        onReassignMapping={vi.fn()}
        onProceedToTrend={vi.fn()}
      />
    );

    // Verify catalog title and labels
    expect(screen.getByText(UI_STRINGS.module2.catalogTitle)).toBeInTheDocument();
    expect(screen.getAllByText(UI_STRINGS.module2.commodityTitleLabel).length).toBeGreaterThan(0);
    expect(screen.getAllByText(UI_STRINGS.module2.classTitleLabel).length).toBeGreaterThan(0);

    // Click "More Details" button on the first card
    const moreDetailsButtons = screen.getAllByText(UI_STRINGS.module2.moreDetailsBtn);
    expect(moreDetailsButtons.length).toBeGreaterThan(0);
    fireEvent.click(moreDetailsButtons[0]);

    // Verify UNSPSCDetailModal opens
    expect(await screen.findByRole('dialog', {}, { timeout: LAZY_MODAL_TIMEOUT_MS })).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.modals.unspscDetail.title)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.modals.unspscDetail.taxonomyTreeTitle)).toBeInTheDocument();

    // Close the modal via first close button
    const closeButtons = screen.getAllByRole('button', { name: UI_STRINGS.modals.unspscDetail.closeBtn });
    fireEvent.click(closeButtons[0]);
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  it('opens UNSPSCDetailModal pop-up via keyboard Enter or Space key on catalog card', async () => {
    await renderAndSettleIndustryCatalog(
      <Module2Categorization
        categories={sampleSpendCategories}
        lineItems={sampleLineItems as any}
        onConfirmMapping={vi.fn()}
        onReassignMapping={vi.fn()}
        onProceedToTrend={vi.fn()}
      />
    );

    const catalogCards = screen.getAllByTestId(/^unspsc-card-/);
    expect(catalogCards.length).toBeGreaterThan(0);
    const catalogCard = catalogCards[0];

    // Enter key
    fireEvent.keyDown(catalogCard, { key: 'Enter' });
    expect(await screen.findByRole('dialog', {}, { timeout: LAZY_MODAL_TIMEOUT_MS })).toBeInTheDocument();
    const closeBtns = screen.getAllByRole('button', { name: UI_STRINGS.modals.unspscDetail.closeBtn });
    fireEvent.click(closeBtns[0]);
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    // Space key
    fireEvent.keyDown(catalogCard, { key: ' ' });
    expect(await screen.findByRole('dialog', {}, { timeout: LAZY_MODAL_TIMEOUT_MS })).toBeInTheDocument();
    const closeBtns2 = screen.getAllByRole('button', { name: UI_STRINGS.modals.unspscDetail.closeBtn });
    fireEvent.click(closeBtns2[0]);
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  it('renders Vendor Rankings by default and toggles between Strategic Risk and UNSPSC Catalog tabs', async () => {
    await renderAndSettleIndustryCatalog(
      <Module2Categorization
        categories={sampleSpendCategories}
        lineItems={sampleLineItems as any}
        onConfirmMapping={vi.fn()}
        onReassignMapping={vi.fn()}
        onProceedToTrend={vi.fn()}
      />
    );

    // Verify Vendor Rankings is displayed by default
    expect(screen.getByTestId('vendor-rankings-container')).toBeInTheDocument();

    // Click tab to switch to Strategic Risk tab
    const strategicTab = screen.getByTestId('tab-strategic-vendor-risk');
    fireEvent.click(strategicTab);
    expect(screen.getByTestId('strategic-vendor-risk-container')).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.module2.strategicVendorRisk.kpis.totalAtRiskSpend)).toBeInTheDocument();

    // Click tab to switch to UNSPSC Catalog
    const catalogTab = screen.getByTestId('tab-unspsc-catalog');
    fireEvent.click(catalogTab);

    // Verify catalog search is visible
    expect(screen.getByPlaceholderText(UI_STRINGS.module2.catalogSearchPlaceholder)).toBeInTheDocument();

    // Switch back to Strategic Risk tab
    fireEvent.click(strategicTab);
    expect(screen.getByTestId('strategic-vendor-risk-container')).toBeInTheDocument();
  });

  it('renders consolidated Vendor Intelligence area with Vendor Rankings, Concentration Risk, and Catalog tabs', async () => {
    await renderAndSettleIndustryCatalog(
      <Module2Categorization
        categories={sampleSpendCategories}
        lineItems={sampleLineItems as any}
        onConfirmMapping={vi.fn()}
        onReassignMapping={vi.fn()}
        onProceedToTrend={vi.fn()}
      />
    );

    expect(screen.getByTestId('vendor-intelligence-area')).toBeInTheDocument();
    expect(screen.getByTestId('tab-vendor-rankings')).toBeInTheDocument();
    expect(screen.getByTestId('tab-strategic-vendor-risk')).toBeInTheDocument();
    expect(screen.getByTestId('tab-unspsc-catalog')).toBeInTheDocument();
  });

  it('renders authoritative Strategic Sourcing workspace in Area C without standalone duplicate engines', async () => {
    await renderAndSettleIndustryCatalog(
      <Module2Categorization
        categories={sampleSpendCategories}
        lineItems={sampleLineItems as any}
        onConfirmMapping={vi.fn()}
        onReassignMapping={vi.fn()}
        onProceedToTrend={vi.fn()}
      />
    );

    expect(screen.getByTestId('strategic-sourcing-area')).toBeInTheDocument();
    expect(screen.getByTestId('module2-strategic-sourcing-workspace-container')).toBeInTheDocument();
    expect(screen.queryByTestId('po-consolidation-section-container')).not.toBeInTheDocument();
  });

  it('renders masked overlay for Bronze customer and handles upgrade trigger', async () => {
    const onUpgrade = vi.fn();
    await renderAndSettleIndustryCatalog(
      <Module2Categorization
        categories={sampleSpendCategories}
        lineItems={sampleLineItems as any}
        onConfirmMapping={vi.fn()}
        onReassignMapping={vi.fn()}
        onProceedToTrend={vi.fn()}
        currentTier="BRONZE"
        onUpgrade={onUpgrade}
      />
    );

    const upgradeBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.subscription.upgradeToSilver, 'i') });
    expect(upgradeBtn).toBeInTheDocument();
    fireEvent.click(upgradeBtn);
    expect(onUpgrade).toHaveBeenCalledWith('SILVER');
  });

  it('renders summary breakdown for Silver customer and masks line items with Gold upgrade trigger', async () => {
    const onUpgrade = vi.fn();
    await renderAndSettleIndustryCatalog(
      <Module2Categorization
        categories={sampleSpendCategories}
        lineItems={sampleLineItems as any}
        onConfirmMapping={vi.fn()}
        onReassignMapping={vi.fn()}
        onProceedToTrend={vi.fn()}
        currentTier="SILVER"
        onUpgrade={onUpgrade}
      />
    );

    const upgradeBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.subscription.upgradeToGold, 'i') });
    expect(upgradeBtn).toBeInTheDocument();
    fireEvent.click(upgradeBtn);
    expect(onUpgrade).toHaveBeenCalledWith('GOLD');
  });

  it('handles targetSection navigation to vendor-consolidation, po-consolidation, strategic-risk, and vendor-supply', async () => {
    const scrollIntoViewMock = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

    const { rerender } = await renderAndSettleIndustryCatalog(
      <Module2Categorization
        categories={sampleSpendCategories}
        lineItems={sampleLineItems as any}
        onConfirmMapping={vi.fn()}
        onReassignMapping={vi.fn()}
        onProceedToTrend={vi.fn()}
        targetSection="vendor-consolidation-section"
      />
    );

    expect(scrollIntoViewMock).toHaveBeenCalled();
    expect(screen.getByTestId('vendor-rankings-container')).toBeInTheDocument();

    // Rerender with po-consolidation-section activates Strategic Sourcing area
    rerender(
      <Module2Categorization
        categories={sampleSpendCategories}
        lineItems={sampleLineItems as any}
        onConfirmMapping={vi.fn()}
        onReassignMapping={vi.fn()}
        onProceedToTrend={vi.fn()}
        targetSection="po-consolidation-section"
      />
    );
    expect(screen.getByTestId('strategic-sourcing-area')).not.toHaveClass('hidden');

    // Rerender with strategic-risk-section
    rerender(
      <Module2Categorization
        categories={sampleSpendCategories}
        lineItems={sampleLineItems as any}
        onConfirmMapping={vi.fn()}
        onReassignMapping={vi.fn()}
        onProceedToTrend={vi.fn()}
        targetSection="strategic-risk-section"
      />
    );
    expect(screen.getByTestId('strategic-vendor-risk-container')).toBeInTheDocument();

    // Rerender with vendor-category-supply-section
    rerender(
      <Module2Categorization
        categories={sampleSpendCategories}
        lineItems={sampleLineItems as any}
        onConfirmMapping={vi.fn()}
        onReassignMapping={vi.fn()}
        onProceedToTrend={vi.fn()}
        targetSection="vendor-category-supply-section"
      />
    );
    expect(screen.getByTestId('vendor-rankings-container')).toBeInTheDocument();
  });

  it('navigates across the 4 consolidated areas via primary navigation tabs', async () => {
    await renderAndSettleIndustryCatalog(
      <Module2Categorization
        categories={sampleSpendCategories}
        lineItems={sampleLineItems as any}
        onConfirmMapping={vi.fn()}
        onReassignMapping={vi.fn()}
        onProceedToTrend={vi.fn()}
      />
    );

    // Verify all 4 area containers are rendered in the DOM
    expect(screen.getByTestId('client-spend-intelligence-area')).toBeInTheDocument();
    expect(screen.getByTestId('ai-categorization-review-area')).toBeInTheDocument();
    expect(screen.getByTestId('strategic-sourcing-area')).toBeInTheDocument();
    expect(screen.getByTestId('vendor-intelligence-area')).toBeInTheDocument();

    // Click Spend Intelligence Tab
    const spendTab = screen.getByTestId('tab-area-spend-intelligence');
    fireEvent.click(spendTab);
    expect(screen.getByTestId('client-spend-intelligence-area')).not.toHaveClass('hidden');

    // Click AI Review Tab
    const aiReviewTab = screen.getByTestId('tab-area-ai-review');
    fireEvent.click(aiReviewTab);
    expect(screen.getByTestId('ai-categorization-review-area')).not.toHaveClass('hidden');

    // Click Strategic Sourcing Tab
    const sourcingTab = screen.getByTestId('tab-area-strategic-sourcing');
    fireEvent.click(sourcingTab);
    expect(screen.getByTestId('strategic-sourcing-area')).not.toHaveClass('hidden');

    // Click Vendor Intelligence Tab
    const vendorTab = screen.getByTestId('tab-area-vendor-intelligence');
    fireEvent.click(vendorTab);
    expect(screen.getByTestId('vendor-intelligence-area')).not.toHaveClass('hidden');

    // Return to Consolidated Overview Tab
    const allTab = screen.getByTestId('tab-area-all');
    fireEvent.click(allTab);
    expect(screen.getByTestId('client-spend-intelligence-area')).not.toHaveClass('hidden');
    expect(screen.getByTestId('strategic-sourcing-area')).not.toHaveClass('hidden');
  });

  it('filters line items by review status in AI Review workbench and displays distinct status chips', async () => {
    await renderAndSettleIndustryCatalog(
      <Module2Categorization
        categories={sampleSpendCategories}
        lineItems={sampleLineItems as any}
        onConfirmMapping={vi.fn()}
        onReassignMapping={vi.fn()}
        onProceedToTrend={vi.fn()}
      />
    );

    const statusFilter = screen.getByLabelText(UI_STRINGS.module2.areaTabs.statusFilterAll);
    expect(statusFilter).toBeInTheDocument();

    // Filter to TAXONOMY_VERIFIED
    fireEvent.change(statusFilter, { target: { value: 'TAXONOMY_VERIFIED' } });
    expect(screen.getByText('LINE-1')).toBeInTheDocument();

    // Filter to CLIENT_APPROVED
    fireEvent.change(statusFilter, { target: { value: 'CLIENT_APPROVED' } });
    expect(screen.getByText('LINE-2')).toBeInTheDocument();

    // Filter to AWAITING_REVIEW
    fireEvent.change(statusFilter, { target: { value: 'AWAITING_REVIEW' } });
    expect(screen.getByText('LINE-3')).toBeInTheDocument();

    // Reset to ALL
    fireEvent.change(statusFilter, { target: { value: 'ALL' } });
    expect(screen.getByText('LINE-1')).toBeInTheDocument();
    expect(screen.getByText('LINE-2')).toBeInTheDocument();
  });
});



