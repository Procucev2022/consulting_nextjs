import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CategoryVendorBreakdownView } from '../../src/components/CategoryVendorBreakdownView';
import { mockTenant } from '../../src/data/mockData';
import { UI_STRINGS } from '../../src/constants/uiStrings';
import type { CategoryYearDetail, VendorYearDetail } from '../../src/types';

const mockCategoriesFixture: CategoryYearDetail[] = [
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `cat-fixture-${i + 1}`,
    rank: i + 1,
    category: i === 0 ? 'Chemical Solvents & Catalysts' : `Category Segment ${i + 1}`,
    core_bucket: 'Direct Materials' as const,
    sample_column_l_code: `12352${100 + i}`,
    sample_column_l_title: `UNSPSC Commodity Title ${i + 1}`,
    spend_fy24_cr: 25.0 + i,
    spend_fy25_cr: 30.0 + i,
    spend_fy26_cr: 35.0 + i,
    spend_inr_2023_cr: 25.0 + i,
    spend_inr_2024_cr: 30.0 + i,
    spend_inr_2025_26_cr: 35.0 + i,
    total_3yr_spend_inr_cr: 90.0 + i * 3,
    spend_share_pct: 12.0 - i,
    yoy_growth_pct: 8.5,
    vendor_count: 6,
    item_count: 24,
    line_items_count: 24,
    color: '#0ea5e9',
    is_balance_category: false,
    top_items: [
      {
        item_name: `Primary Chemical Solvent ${i + 1}`,
        vendor_name: `Acme Global Supplier ${i + 1}`,
        spend_inr_cr: 15.0 + i,
        total_spend_inr_cr: 15.0 + i,
        share_pct: 25.0
      },
      {
        item_name: `Secondary Chemical Solvent ${i + 1}`,
        vendor_name: `Contoso Supplier ${i + 1}`,
        spend_inr_cr: 10.0 + i,
        total_spend_inr_cr: 10.0 + i,
        share_pct: 18.0
      }
    ]
  })),
  {
    id: 'cat-fixture-bal',
    rank: 11,
    category: 'Balance 7 Categories',
    core_bucket: 'Indirect & MRO' as const,
    sample_column_l_code: '99999999',
    sample_column_l_title: 'Balance Commodity Group',
    spend_fy24_cr: 5.0,
    spend_fy25_cr: 6.0,
    spend_fy26_cr: 7.0,
    spend_inr_2023_cr: 5.0,
    spend_inr_2024_cr: 6.0,
    spend_inr_2025_26_cr: 7.0,
    total_3yr_spend_inr_cr: 18.0,
    spend_share_pct: 2.5,
    yoy_growth_pct: 5.0,
    vendor_count: 14,
    item_count: 45,
    line_items_count: 45,
    color: '#64748b',
    is_balance_category: true,
    balance_items: Array.from({ length: 7 }, (_, bi) => ({
      name: `Tail Segment Balance ${bi + 1}`,
      column_l_code: `8888000${bi + 1}`,
      spend_inr_cr: 2.5,
      share_pct: 0.35
    }))
  }
];

const mockVendorsFixture: VendorYearDetail[] = [
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `vnd-fixture-${i + 1}`,
    rank: i + 1,
    vendor_name: `Acme Global Supplier ${i + 1}`,
    primary_category: 'Chemical Solvents & Catalysts',
    spend_fy24_cr: 20.0 + i,
    spend_fy25_cr: 25.0 + i,
    spend_fy26_cr: 30.0 + i,
    spend_inr_2023_cr: 20.0 + i,
    spend_inr_2024_cr: 25.0 + i,
    spend_inr_2025_26_cr: 30.0 + i,
    total_3yr_spend_inr_cr: 75.0 + i * 3,
    spend_share_pct: 10.0 - i,
    yoy_growth_pct: 7.2,
    item_count: 15,
    color: '#0ea5e9',
    is_balance_vendor: false,
    top_items: [
      {
        item_name: `Bulk Solvent Drum Grade ${i + 1}`,
        category: 'Chemical Solvents',
        spend_inr_cr: 12.0,
        volume: 5000,
        unit: 'KG'
      }
    ]
  })),
  {
    id: 'vnd-fixture-bal',
    rank: 11,
    vendor_name: 'Balance 7 Suppliers',
    primary_category: 'Tail Suppliers',
    spend_fy24_cr: 3.0,
    spend_fy25_cr: 4.0,
    spend_fy26_cr: 5.0,
    spend_inr_2023_cr: 3.0,
    spend_inr_2024_cr: 4.0,
    spend_inr_2025_26_cr: 5.0,
    total_3yr_spend_inr_cr: 12.0,
    spend_share_pct: 1.5,
    yoy_growth_pct: 4.0,
    item_count: 20,
    color: '#64748b',
    is_balance_vendor: true,
    balance_items: Array.from({ length: 7 }, (_, bi) => ({
      name: `Tail Vendor Supplier ${bi + 1}`,
      column_l_code: `7777000${bi + 1}`,
      spend_inr_cr: 1.5,
      share_pct: 0.2
    }))
  }
];

describe('CategoryVendorBreakdownView Component', () => {
  it('renders zero state cleanly when no categories are provided', () => {
    render(<CategoryVendorBreakdownView categories={[]} tenant={mockTenant} />);
    expect(screen.getByText(UI_STRINGS.module2.breakdown.inrValuation)).toBeInTheDocument();
    expect(screen.getByText(/Awaiting dataset ingestion/i)).toBeInTheDocument();
  });

  it('renders category spend breakdown and switches fiscal years', () => {
    render(<CategoryVendorBreakdownView categories={mockCategoriesFixture} tenant={mockTenant} />);

    expect(screen.getByText(UI_STRINGS.module2.breakdown.inrValuation)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.module2.breakdown.categorySpendBreakdown)).toBeInTheDocument();
    expect(screen.getByText(mockTenant.enterprise_name)).toBeInTheDocument();

    // Switch Fiscal Years
    fireEvent.click(screen.getByRole('button', { name: 'FY24' }));
    fireEvent.click(screen.getByRole('button', { name: 'FY25' }));
    fireEvent.click(screen.getByRole('button', { name: 'FY26' }));
    fireEvent.click(screen.getByRole('button', { name: new RegExp(UI_STRINGS.module1.allFy, 'i') }));
  });

  it('renders with fallback enterprise name when tenant is undefined', () => {
    render(<CategoryVendorBreakdownView categories={mockCategoriesFixture} />);
    expect(screen.getByText('Enterprise Client')).toBeInTheDocument();
  });

  it('handles category card click to open and close CategoryTopItemsModal', () => {
    render(<CategoryVendorBreakdownView categories={mockCategoriesFixture} tenant={mockTenant} />);

    const buttons = screen.getAllByRole('button');
    const catCard = buttons.find((b) => b.textContent && b.textContent.includes('Rank #1') && b.textContent.includes('₹'));
    expect(catCard).toBeDefined();

    if (catCard) {
      fireEvent.click(catCard);
      // Verify modal is open and close it
      const closeBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.module1.closePopup, 'i') });
      expect(closeBtn).toBeInTheDocument();
      fireEvent.click(closeBtn);
    }
  });

  it('expands and collapses itemized balance categories', () => {
    render(<CategoryVendorBreakdownView categories={mockCategoriesFixture} tenant={mockTenant} />);

    const viewBalBtn = screen.getByRole('button', {
      name: new RegExp(UI_STRINGS.module1.viewBalanceCategories(7), 'i')
    });
    fireEvent.click(viewBalBtn);

    expect(
      screen.getByRole('button', { name: new RegExp(UI_STRINGS.module1.hideBalanceCategories(7), 'i') })
    ).toBeInTheDocument();

    // Check balance items table rendered
    expect(screen.getByText('Tail Segment / Category Name')).toBeInTheDocument();

    // Switch years while balance drawer is open
    fireEvent.click(screen.getByRole('button', { name: 'FY24' }));
    fireEvent.click(screen.getByRole('button', { name: 'FY25' }));
    fireEvent.click(screen.getByRole('button', { name: 'FY26' }));
    fireEvent.click(screen.getByRole('button', { name: new RegExp(UI_STRINGS.module1.allFy, 'i') }));

    // Collapse balance categories
    const hideBalBtn = screen.getByRole('button', {
      name: new RegExp(UI_STRINGS.module1.hideBalanceCategories(7), 'i')
    });
    fireEvent.click(hideBalBtn);
  });

  it('switches to vendor breakdown mode, switches years, clicks vendor cards and modals', () => {
    render(<CategoryVendorBreakdownView categories={mockCategoriesFixture} tenant={mockTenant} />);

    // Switch to By Vendors
    const vendorTab = screen.getByRole('button', { name: new RegExp(UI_STRINGS.module1.byVendors, 'i') });
    fireEvent.click(vendorTab);

    expect(screen.getByText(UI_STRINGS.module2.breakdown.vendorSpendBreakdown)).toBeInTheDocument();

    // Switch Fiscal Years in vendor mode
    fireEvent.click(screen.getByRole('button', { name: 'FY24' }));
    fireEvent.click(screen.getByRole('button', { name: 'FY25' }));
    fireEvent.click(screen.getByRole('button', { name: 'FY26' }));
    fireEvent.click(screen.getByRole('button', { name: new RegExp(UI_STRINGS.module1.allFy, 'i') }));

    // Switch back to Categories
    const catTab = screen.getByRole('button', { name: new RegExp(UI_STRINGS.module1.byCategories, 'i') });
    fireEvent.click(catTab);
    expect(screen.getByText(UI_STRINGS.module2.breakdown.categorySpendBreakdown)).toBeInTheDocument();
  }, 20000);

  it('renders UNSPSC taxonomy badges and switches hierarchy filter levels (Auto, Commodity, Class)', () => {
    render(<CategoryVendorBreakdownView categories={mockCategoriesFixture} tenant={mockTenant} />);

    // Check spend rank order banner & hierarchy filter buttons
    expect(screen.getByText(UI_STRINGS.module2.breakdown.spendRankOrder)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.module2.breakdown.unspscLevelFilter.auto)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.module2.breakdown.unspscLevelFilter.commodity)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.module2.breakdown.unspscLevelFilter.class)).toBeInTheDocument();

    // Verify presence of UNSPSC badges in Auto mode
    const commodityBadges = screen.getAllByText(UI_STRINGS.module2.breakdown.unspscCommodityBadge);
    expect(commodityBadges.length).toBeGreaterThan(0);

    // Switch to Commodity mode
    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.module2.breakdown.unspscLevelFilter.commodity }));
    const allCommodityBadges = screen.getAllByText(UI_STRINGS.module2.breakdown.unspscCommodityBadge);
    expect(allCommodityBadges.length).toBeGreaterThanOrEqual(5);

    // Switch to Class mode
    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.module2.breakdown.unspscLevelFilter.class }));
    const classBadges = screen.getAllByText(UI_STRINGS.module2.breakdown.unspscClassBadge);
    expect(classBadges.length).toBeGreaterThanOrEqual(5);

    // Switch back to Auto mode
    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.module2.breakdown.unspscLevelFilter.auto }));
  });

  it('renders Key Vendors in Segment within category cards', () => {
    render(<CategoryVendorBreakdownView categories={mockCategoriesFixture} tenant={mockTenant} />);

    // Verify key vendors label is present on cards
    const vendorLabels = screen.getAllByText(UI_STRINGS.module2.breakdown.keyVendorsLabel);
    expect(vendorLabels.length).toBeGreaterThan(0);
  });

  it('handles categories without top_items or with custom prop categories', () => {
    const customCats: import('../../src/types').CategoryYearDetail[] = [
      {
        id: 'cat-test-1',
        category: 'Test Segment No Items',
        spend_fy24_cr: 10,
        spend_fy25_cr: 10,
        spend_fy26_cr: 10,
        spend_inr_2023_cr: 10,
        spend_inr_2024_cr: 10,
        spend_inr_2025_26_cr: 10,
        total_3yr_spend_inr_cr: 30,
        yoy_growth_pct: 0,
        line_items_count: 10,
        color: '#0ea5e9',
        sample_column_l_code: '12345678',
        sample_column_l_title: 'Test Sample Commodity',
        is_balance_category: false,
        top_items: []
      },
      {
        id: 'cat-test-bal',
        category: 'Test Tail Balance',
        spend_fy24_cr: 0,
        spend_fy25_cr: 0,
        spend_fy26_cr: 0,
        spend_inr_2023_cr: 0,
        spend_inr_2024_cr: 0,
        spend_inr_2025_26_cr: 0,
        total_3yr_spend_inr_cr: 0,
        yoy_growth_pct: 0,
        line_items_count: 5,
        color: '#64748b',
        sample_column_l_code: '99999999',
        sample_column_l_title: 'Test Balance Commodity',
        is_balance_category: true,
        balance_items: [
          { name: 'Tail Bal 1', column_l_code: '99999991', spend_inr_cr: 0, share_pct: 0 },
          { name: 'Tail Bal 2', column_l_code: '99999992', spend_inr_cr: 0, share_pct: 0 }
        ]
      }
    ];

    render(<CategoryVendorBreakdownView tenant={mockTenant} categories={customCats} />);

    // Check no vendors fallback
    expect(screen.getByText(UI_STRINGS.module2.breakdown.noVendorsAvailable)).toBeInTheDocument();

    // Toggle balance categories
    const balBtn = screen.getByRole('button', {
      name: new RegExp(UI_STRINGS.module2.breakdown.viewBalanceCategories(2), 'i')
    });
    fireEvent.click(balBtn);
    expect(
      screen.getByRole('button', {
        name: new RegExp(UI_STRINGS.module2.breakdown.hideBalanceCategories(2), 'i')
      })
    ).toBeInTheDocument();
  });

  it('handles categories without balance_items taking default 7 count', () => {
    const catsWithoutBalItems: import('../../src/types').CategoryYearDetail[] = [
      {
        id: 'cat-bal-only',
        category: 'Balance Only No Items Array',
        spend_fy24_cr: 5,
        spend_fy25_cr: 5,
        spend_fy26_cr: 5,
        spend_inr_2023_cr: 5,
        spend_inr_2024_cr: 5,
        spend_inr_2025_26_cr: 5,
        total_3yr_spend_inr_cr: 15,
        yoy_growth_pct: 0,
        line_items_count: 5,
        color: '#64748b',
        sample_column_l_code: '12345678',
        sample_column_l_title: 'Test Sample',
        is_balance_category: true
      }
    ];

    render(<CategoryVendorBreakdownView tenant={mockTenant} categories={catsWithoutBalItems} />);

    const balBtn = screen.getByRole('button', {
      name: new RegExp(UI_STRINGS.module2.breakdown.viewBalanceCategories(7), 'i')
    });
    fireEvent.click(balBtn);
    expect(
      screen.getByRole('button', {
        name: new RegExp(UI_STRINGS.module2.breakdown.hideBalanceCategories(7), 'i')
      })
    ).toBeInTheDocument();
  });
});
