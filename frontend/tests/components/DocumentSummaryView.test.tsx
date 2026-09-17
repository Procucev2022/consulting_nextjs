import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DocumentSummaryView } from '../../src/components/DocumentSummaryView';
import { mockTenant, initialIngestionQueue } from '../../src/data/mockData';
import { UI_STRINGS } from '../../src/constants/uiStrings';
import type { MonthWiseSummary } from '../../src/types';

const mockIngestionItem = {
  doc_id: 'DOC-9041',
  tenant_id: 'TNT-GLOBAL-8902',
  file_name: 'Purchase_History_Sample.xlsx',
  file_type: 'XLSX' as const,
  file_size_mb: 9.55,
  ocr_status: 'Completed' as const,
  progress: 100,
  uploaded_at: '2026-08-24 09:14:22',
  records_count: 42765,
  detected_currencies: ['INR'],
  converted_inr_crores: 8066.86,
  unique_items_count: 7357,
  unique_vendors_count: 1073,
  material_groups_count: 274,
  plants_count: 24
};

const mockMaterialGroupsFixture = [
  {
    group_code: 'FERRO',
    group_name: 'Ferro Alloys & Noble Metals (FERRO)',
    primary_segment: '11101501',
    records_count: 5200,
    unique_items_count: 850,
    unique_vendors_count: 42,
    spend_inr_cr: 2540.5,
    spend_usd_m: 303.16,
    share_pct: 31.5,
    sample_item: 'FERRO NICKEL 10-14'
  },
  {
    group_code: 'SCRAP',
    group_name: 'Stainless Steel & Melting Scrap (SCRAP)',
    primary_segment: '11101502',
    records_count: 4100,
    unique_items_count: 620,
    unique_vendors_count: 35,
    spend_inr_cr: 1890.2,
    spend_usd_m: 225.56,
    share_pct: 23.4,
    sample_item: 'SS 304 MELTING SCRAP'
  }
];

const mockPlantsFixture = [
  {
    plant_code: '1000',
    plant_name: 'Main Smelter & Steel Plant 1000',
    location: 'Khopoli, Maharashtra',
    region: 'West Region',
    records_count: 14500,
    unique_items_count: 2400,
    unique_vendors_count: 380,
    spend_inr_cr: 3450.8,
    spend_usd_m: 411.79,
    share_pct: 42.8,
    active_vendors_count: 380,
    primary_material_group: 'FERRO'
  },
  {
    plant_code: '2000',
    plant_name: 'Secondary Finishing Plant 2000',
    location: 'Jamshedpur, Jharkhand',
    region: 'East Region',
    records_count: 9800,
    unique_items_count: 1650,
    unique_vendors_count: 210,
    spend_inr_cr: 1796.56,
    spend_usd_m: 214.39,
    share_pct: 22.3,
    active_vendors_count: 210,
    primary_material_group: 'SCRAP'
  }
];

const mockMonthsFixture = [
  {
    month_key: '2023-04',
    month_label: 'Apr 2023',
    fiscal_year: 'FY24',
    spend_inr_cr: 220.5,
    spend_usd_m: 26.31,
    mom_change_pct: 4.2,
    records_count: 1200,
    po_count: 310,
    unique_items_count: 450,
    unique_vendors_count: 95,
    top_material_group: 'FERRO',
    top_plant: '1000'
  }
];

describe('DocumentSummaryView Component', () => {
  const defaultProps = {
    tenant: mockTenant,
    ingestionQueue: [mockIngestionItem],
    materialGroupSummaries: mockMaterialGroupsFixture,
    plantSummaries: mockPlantsFixture,
    monthWiseSummaries: mockMonthsFixture,
    onNavigateToCategorization: vi.fn()
  };

  it('renders Material Groups view by default in INR currency with Unique Items & Unique Vendors', () => {
    render(<DocumentSummaryView {...defaultProps} />);

    expect(screen.getByText(UI_STRINGS.documentSummary.badge)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.documentSummary.heading)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.documentSummary.dimensionTabs.materialGroup)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.documentSummary.dimensionTabs.plant)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.documentSummary.dimensionTabs.month)).toBeInTheDocument();

    // Key metrics cards: Unique Items & Unique Vendors
    expect(screen.getAllByText(UI_STRINGS.documentSummary.uniqueItems).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(UI_STRINGS.documentSummary.uniqueVendors).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('7,357').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('1,073').length).toBeGreaterThanOrEqual(1);

    // Check material group headers and first group
    expect(screen.getByText(UI_STRINGS.documentSummary.materialGroup.headers.name)).toBeInTheDocument();
    expect(screen.getByText('Ferro Alloys & Noble Metals (FERRO)')).toBeInTheDocument();
    expect(screen.getByText('FERRO')).toBeInTheDocument();
  });

  it('toggles currency between INR and USD across views', () => {
    render(<DocumentSummaryView {...defaultProps} />);

    // Default INR active
    const inrBtn = screen.getByRole('button', { name: UI_STRINGS.documentSummary.currencies.inr });
    expect(inrBtn).toBeInTheDocument();

    // Switch to USD
    const usdBtn = screen.getByRole('button', { name: UI_STRINGS.documentSummary.currencies.usd });
    fireEvent.click(usdBtn);

    // Verify USD is reflected
    expect(screen.getByText('$962.63 M')).toBeInTheDocument();

    // Switch back to INR
    fireEvent.click(inrBtn);
    expect(screen.getAllByText('₹8066.86 Cr').length).toBeGreaterThanOrEqual(1);
  });

  it('switches to Plant Wise Summary view and displays plant details with unique items and vendors', () => {
    render(<DocumentSummaryView {...defaultProps} />);

    const plantTab = screen.getByRole('button', { name: UI_STRINGS.documentSummary.dimensionTabs.plant });
    fireEvent.click(plantTab);

    expect(screen.getByText(UI_STRINGS.documentSummary.plant.headers.name)).toBeInTheDocument();
    expect(screen.getByText('Main Smelter & Steel Plant 1000')).toBeInTheDocument();
    expect(screen.getByText('1000')).toBeInTheDocument();
    expect(screen.getByText('Khopoli, Maharashtra')).toBeInTheDocument();

    // Switch back to Material Group tab to exercise line 247-249
    const mgTab = screen.getByRole('button', { name: UI_STRINGS.documentSummary.dimensionTabs.materialGroup });
    fireEvent.click(mgTab);
    expect(screen.getByText('Ferro Alloys & Noble Metals (FERRO)')).toBeInTheDocument();
  });

  it('switches to Month Wise Summary view, displays monthly run rates, handles view mode toggles and filters', () => {
    render(<DocumentSummaryView {...defaultProps} />);

    const monthTab = screen.getByRole('button', { name: UI_STRINGS.documentSummary.dimensionTabs.month });
    fireEvent.click(monthTab);

    // Verify Month-Wise Trend Chart and table are both rendered in default CHART_AND_TABLE view
    expect(screen.getByText(UI_STRINGS.documentSummary.month.graph.lineGraphTitle)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.documentSummary.month.headers.month)).toBeInTheDocument();
    expect(screen.getAllByText('Apr 2023').length).toBeGreaterThan(0);
    expect(screen.getAllByText('FY24').length).toBeGreaterThan(0);

    // Switch view mode to CHART_ONLY -> table is hidden
    fireEvent.click(screen.getByText(UI_STRINGS.documentSummary.month.graph.viewMode.chartOnly));
    expect(screen.queryByText(UI_STRINGS.documentSummary.month.headers.month)).not.toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.documentSummary.month.graph.lineGraphTitle)).toBeInTheDocument();

    // Switch view mode to TABLE_ONLY -> chart KPIs are hidden, table is visible
    fireEvent.click(screen.getByText(UI_STRINGS.documentSummary.month.graph.viewMode.tableOnly));
    expect(screen.getByText(UI_STRINGS.documentSummary.month.headers.month)).toBeInTheDocument();
    expect(screen.queryByText(UI_STRINGS.documentSummary.month.graph.kpis.peakMonth)).not.toBeInTheDocument();

    // Switch back to CHART_AND_TABLE
    fireEvent.click(screen.getByText(UI_STRINGS.documentSummary.month.graph.viewMode.chartAndTable));
    expect(screen.getByText(UI_STRINGS.documentSummary.month.headers.month)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.documentSummary.month.graph.kpis.peakMonth)).toBeInTheDocument();

    // Click FY filters in month view
    fireEvent.click(screen.getByRole('button', { name: 'FY24' }));
    fireEvent.click(screen.getByRole('button', { name: 'FY25' }));
    fireEvent.click(screen.getByRole('button', { name: 'FY26' }));
    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.documentSummary.month.filterAll }));
  });

  it('filters rows based on search input and shows empty state when no match is found', () => {
    render(<DocumentSummaryView {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(UI_STRINGS.documentSummary.materialGroup.searchPlaceholder);
    fireEvent.change(searchInput, { target: { value: 'SCRAP' } });

    // Matching group should be visible
    expect(screen.getByText('Stainless Steel & Melting Scrap (SCRAP)')).toBeInTheDocument();
    // Non-matching group should not be in document
    expect(screen.queryByText('Ferro Alloys & Noble Metals (FERRO)')).not.toBeInTheDocument();

    // Type query with 0 matches
    fireEvent.change(searchInput, { target: { value: 'NON_EXISTENT_QUERY_XYZ' } });
    expect(screen.getByText(UI_STRINGS.documentSummary.emptyFilter)).toBeInTheDocument();

    // Clear search
    fireEvent.change(searchInput, { target: { value: '' } });
    expect(screen.getByText('Ferro Alloys & Noble Metals (FERRO)')).toBeInTheDocument();
  });

  it('does not render View Category & Vendor Spend Analysis button (hidden as requested)', () => {
    const onNavigate = vi.fn();
    render(<DocumentSummaryView {...defaultProps} onNavigateToCategorization={onNavigate} />);

    expect(screen.queryByRole('button', { name: new RegExp(UI_STRINGS.documentSummary.viewAnalysisInAiCat, 'i') })).not.toBeInTheDocument();
  });

  it('renders with custom dynamic summaries passed via props', () => {
    render(
      <DocumentSummaryView
        {...defaultProps}
        uniqueItemsCount={9999}
        uniqueVendorsCount={888}
        materialGroupSummaries={[
          {
            group_code: 'TEST-MG',
            group_name: 'Custom Dynamic Group',
            records_count: 500,
            po_count: 40,
            spend_inr_cr: 120.5,
            spend_usd_m: 14.4,
            share_pct: 100,
            primary_segment: 'Custom Segment',
            sample_item: 'Custom SKU',
            unique_items_count: 120,
            unique_vendors_count: 35,
            fy24_spend_inr_cr: 40,
            fy25_spend_inr_cr: 40,
            fy26_spend_inr_cr: 40.5,
            color: '#0284c7'
          },
          {
            group_code: 'TEST-MG-2',
            group_name: 'Custom Fallback Group',
            records_count: 300,
            po_count: 20,
            spend_inr_cr: 50.0,
            spend_usd_m: 6.0,
            share_pct: 50,
            primary_segment: 'Segment Without Sample SKU',
            sample_item: '',
            fy24_spend_inr_cr: 15,
            fy25_spend_inr_cr: 15,
            fy26_spend_inr_cr: 20,
            color: '#10b981'
          }
        ]}
        plantSummaries={[
          {
            plant_code: 'PLANT-99',
            plant_name: 'Dynamic Plant 99',
            region: 'South',
            location: 'Bengaluru, Karnataka',
            po_count: 10,
            records_count: 50,
            spend_inr_cr: 25.0,
            spend_usd_m: 2.98,
            share_pct: 100,
            active_vendors_count: 12,
            primary_material_group: 'DIRECT'
          },
          {
            plant: 'PLANT-FB',
            totalSpendINR: 50000000,
            totalSpendCr: 5,
            count: 20
          } as any
        ]}
        monthWiseSummaries={[
          {
            month_key: '2024-01',
            month_label: 'Jan 2024',
            fiscal_year: 'FY24',
            spend_inr_cr: 10.0,
            spend_usd_m: 1.19,
            records_count: 20,
            po_count: 5,
            top_material_group: 'TEST-MG',
            top_plant: 'PLANT-99',
            mom_change_pct: -5.0
          }
        ]}
      />
    );

    expect(screen.getAllByText('9,999').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('888').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Custom Dynamic Group')).toBeInTheDocument();
    expect(screen.getByText('TEST-MG')).toBeInTheDocument();

    // Switch to Plant tab with fallback counts
    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.documentSummary.dimensionTabs.plant }));
    expect(screen.getByText('Dynamic Plant 99')).toBeInTheDocument();
    expect(screen.getByText('PLANT-FB')).toBeInTheDocument();

    // Switch to Month tab with negative MoM change and fallback counts
    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.documentSummary.dimensionTabs.month }));
    expect(screen.getAllByText('Jan 2024').length).toBeGreaterThan(0);
    expect(screen.getByText('-5.0%')).toBeInTheDocument();
  });

  it('renders USD currency with fallback conversion when tenant is not provided', () => {
    render(<DocumentSummaryView tenant={undefined} />);
    const usdBtn = screen.getByRole('button', { name: UI_STRINGS.documentSummary.currencies.usd });
    fireEvent.click(usdBtn);
    expect(screen.getAllByText('$0.00 M').length).toBeGreaterThanOrEqual(1);
  });

  it('filters and displays USD currency in Plant view and handles empty plant search', () => {
    render(<DocumentSummaryView {...defaultProps} />);

    // Switch to Plant tab
    const plantTab = screen.getByRole('button', { name: UI_STRINGS.documentSummary.dimensionTabs.plant });
    fireEvent.click(plantTab);

    // Switch to USD
    const usdBtn = screen.getByRole('button', { name: UI_STRINGS.documentSummary.currencies.usd });
    fireEvent.click(usdBtn);
    expect(screen.getAllByText(/\$214\.39\s*M/).length).toBeGreaterThanOrEqual(1);

    // Search plant by location / region
    const searchInput = screen.getByPlaceholderText(UI_STRINGS.documentSummary.plant.searchPlaceholder);
    fireEvent.change(searchInput, { target: { value: 'Khopoli' } });
    expect(screen.getByText('Main Smelter & Steel Plant 1000')).toBeInTheDocument();

    // Search with non-matching string in Plant view
    fireEvent.change(searchInput, { target: { value: 'NON_EXISTENT_PLANT_QUERY' } });
    expect(screen.getByText(UI_STRINGS.documentSummary.emptyFilter)).toBeInTheDocument();
  });

  it('filters and displays USD currency in Month view, handles empty search, and verifies MoM color states', () => {
    render(<DocumentSummaryView {...defaultProps} />);

    // Switch to Month tab
    const monthTab = screen.getByRole('button', { name: UI_STRINGS.documentSummary.dimensionTabs.month });
    fireEvent.click(monthTab);

    // Switch to USD
    const usdBtn = screen.getByRole('button', { name: UI_STRINGS.documentSummary.currencies.usd });
    fireEvent.click(usdBtn);

    // Check USD month values rendered for Apr 2023
    expect(screen.getAllByText(/\$26\.31\s*M/).length).toBeGreaterThan(0);

    // Search month
    const searchInput = screen.getByPlaceholderText(UI_STRINGS.documentSummary.month.searchPlaceholder);
    fireEvent.change(searchInput, { target: { value: 'Apr 2023' } });
    expect(screen.getAllByText('Apr 2023').length).toBeGreaterThan(0);

    // Search non-existent month
    fireEvent.change(searchInput, { target: { value: 'NON_EXISTENT_MONTH' } });
    expect(screen.getByText(UI_STRINGS.documentSummary.emptyFilter)).toBeInTheDocument();
  });

  it('filters Material Groups by sample_item and primary_segment', () => {
    render(<DocumentSummaryView {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(UI_STRINGS.documentSummary.materialGroup.searchPlaceholder);
    // Search by sample_item
    fireEvent.change(searchInput, { target: { value: 'FERRO NICKEL' } });
    expect(screen.getByText('Ferro Alloys & Noble Metals (FERRO)')).toBeInTheDocument();

    // Search by primary_segment
    fireEvent.change(searchInput, { target: { value: '11101501' } });
    expect(screen.getByText('Ferro Alloys & Noble Metals (FERRO)')).toBeInTheDocument();
  });

  it('renders gracefully without optional tenant or queue props', () => {
    render(<DocumentSummaryView />);

    expect(screen.getByText(UI_STRINGS.documentSummary.heading)).toBeInTheDocument();
  });

  it('renders revised numbers badge when isDataRefreshed is true', () => {
    render(<DocumentSummaryView {...defaultProps} isDataRefreshed={true} />);

    expect(screen.getByText(UI_STRINGS.documentSummary.revisedNumbersBadge)).toBeInTheDocument();
  });

  it('renders month-wise table with various MoM states and fallback keys', () => {
    const customMonths: MonthWiseSummary[] = [
      {
        month_key: 'M-1',
        month_label: 'Zero Month',
        fiscal_year: 'FY24',
        spend_inr_cr: 10,
        spend_usd_m: 1.2,
        mom_change_pct: 0,
        records_count: 10,
        po_count: 5,
        unique_items_count: 5,
        unique_vendors_count: 2,
        top_material_group: 'Direct',
        top_plant: 'P1'
      },
      {
        month_key: 'M-2',
        month_label: 'Negative Month',
        fiscal_year: 'FY24',
        spend_inr_cr: 8,
        spend_usd_m: 0.95,
        mom_change_pct: -20,
        records_count: 8,
        po_count: 4,
        unique_items_count: 4,
        unique_vendors_count: 2,
        top_material_group: 'Indirect',
        top_plant: 'P2'
      },
      {
        month_key: 'M-3',
        month_label: 'Positive Month',
        spend_inr_cr: 5,
        spend_usd_m: 0.6,
        mom_change_pct: 12.5,
        records_count: 6,
        po_count: 3,
        top_material_group: 'Packaging',
        top_plant: 'P3',
        fiscal_year: 'FY25'
      },
      {
        month_key: 'M-4',
        month_label: 'Flat Month',
        spend_inr_cr: 10,
        spend_usd_m: 1.1,
        mom_change_pct: 0,
        records_count: 12,
        po_count: 6,
        top_material_group: 'Logistics',
        top_plant: 'P4',
        fiscal_year: 'FY26'
      }
    ];

    render(<DocumentSummaryView {...defaultProps} monthWiseSummaries={customMonths} />);

    // Switch to Month view
    const monthTab = screen.getByRole('button', { name: UI_STRINGS.documentSummary.dimensionTabs.month });
    fireEvent.click(monthTab);

    expect(screen.getAllByText('Zero Month').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Negative Month').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Positive Month').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Flat Month').length).toBeGreaterThan(0);
  });

  it('renders reconciliation scope banners, toggles between Top 10 and All for Plant and Material Group', () => {
    const testMgs = Array.from({ length: 15 }, (_, i) => ({
      group_code: `MG${i + 1}`,
      group_name: `Material Group ${i + 1}`,
      primary_segment: `SEG${i + 1}`,
      records_count: 100,
      unique_items_count: 20,
      unique_vendors_count: 5,
      spend_inr_cr: 100,
      spend_usd_m: 12,
      share_pct: 6.6,
      sample_item: `Item ${i + 1}`
    }));

    const testPlants = Array.from({ length: 24 }, (_, i) => ({
      plant_code: `P${i + 1}`,
      plant_name: `Plant Facility ${i + 1}`,
      location: `City ${i + 1}`,
      region: 'North',
      records_count: 100,
      unique_items_count: 20,
      unique_vendors_count: 5,
      spend_inr_cr: 100,
      spend_usd_m: 12,
      share_pct: 4.1,
      active_vendors_count: 5,
      primary_material_group: 'MG1'
    }));

    render(
      <DocumentSummaryView
        {...defaultProps}
        materialGroupSummaries={testMgs}
        plantSummaries={testPlants}
      />
    );

    // Material Group scope banner is rendered
    expect(screen.getByText(UI_STRINGS.documentSummary.reconciliation.mgScopeHeading)).toBeInTheDocument();
    expect(screen.getAllByText(UI_STRINGS.documentSummary.reconciliation.zeroDeviationBadge).length).toBeGreaterThanOrEqual(1);

    // Toggle Material Group to All
    const allMgBtn = screen.getByRole('button', { name: UI_STRINGS.documentSummary.reconciliation.allScope(15) });
    fireEvent.click(allMgBtn);
    expect(allMgBtn).toHaveClass('bg-slate-900');

    // Toggle back to Top 10
    const top10MgBtn = screen.getByRole('button', { name: UI_STRINGS.documentSummary.reconciliation.top10Scope });
    fireEvent.click(top10MgBtn);
    expect(top10MgBtn).toHaveClass('bg-slate-900');

    // Switch to Plant tab
    const plantTab = screen.getByRole('button', { name: UI_STRINGS.documentSummary.dimensionTabs.plant });
    fireEvent.click(plantTab);

    // Plant reconciliation banner is rendered
    expect(screen.getByText(UI_STRINGS.documentSummary.reconciliation.plantScopeHeading)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.documentSummary.reconciliation.balanceRowLabel(14))).toBeInTheDocument();

    // Toggle Plant to All (24 Facilities)
    const allPlantsBtn = screen.getByRole('button', { name: UI_STRINGS.documentSummary.reconciliation.allScope(24) });
    fireEvent.click(allPlantsBtn);
    expect(allPlantsBtn).toHaveClass('bg-slate-900');

    // Toggle Plant back to Top 10 Only
    const top10PlantsBtn = screen.getByRole('button', { name: UI_STRINGS.documentSummary.reconciliation.top10Scope });
    fireEvent.click(top10PlantsBtn);
    expect(top10PlantsBtn).toHaveClass('bg-slate-900');

    // Switch to USD currency and test reconciliation notes in USD
    const usdBtn = screen.getByRole('button', { name: UI_STRINGS.documentSummary.currencies.usd });
    fireEvent.click(usdBtn);

    // Toggle Plant to All in USD
    fireEvent.click(allPlantsBtn);
    expect(allPlantsBtn).toHaveClass('bg-slate-900');

    // Toggle Material Group tab in USD and toggle All
    const mgTab = screen.getByRole('button', { name: UI_STRINGS.documentSummary.dimensionTabs.materialGroup });
    fireEvent.click(mgTab);
    const reselectedAllMgBtn = screen.getByRole('button', { name: UI_STRINGS.documentSummary.reconciliation.allScope(15) });
    fireEvent.click(reselectedAllMgBtn);
    expect(reselectedAllMgBtn).toHaveClass('bg-slate-900');
  });
});

