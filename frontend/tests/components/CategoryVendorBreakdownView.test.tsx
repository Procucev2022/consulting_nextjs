import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CategoryVendorBreakdownView } from '../../src/components/CategoryVendorBreakdownView';
import { mockTenant } from '../../src/data/mockData';
import { UI_STRINGS } from '../../src/constants/uiStrings';

describe('CategoryVendorBreakdownView Component', () => {
  it('renders category spend breakdown and switches fiscal years', () => {
    render(<CategoryVendorBreakdownView tenant={mockTenant} />);

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
    render(<CategoryVendorBreakdownView />);
    expect(screen.getByText('Apex Industrial Dynamics (Fortune 500)')).toBeInTheDocument();
  });

  it('handles category card click to open and close CategoryTopItemsModal', () => {
    render(<CategoryVendorBreakdownView tenant={mockTenant} />);

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
    render(<CategoryVendorBreakdownView tenant={mockTenant} />);

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
    render(<CategoryVendorBreakdownView tenant={mockTenant} />);

    // Switch to By Vendors
    const vendorTab = screen.getByRole('button', { name: new RegExp(UI_STRINGS.module1.byVendors, 'i') });
    fireEvent.click(vendorTab);

    expect(screen.getByText(UI_STRINGS.module2.breakdown.vendorSpendBreakdown)).toBeInTheDocument();

    // Switch Fiscal Years in vendor mode
    fireEvent.click(screen.getByRole('button', { name: 'FY24' }));
    fireEvent.click(screen.getByRole('button', { name: 'FY25' }));
    fireEvent.click(screen.getByRole('button', { name: 'FY26' }));
    fireEvent.click(screen.getByRole('button', { name: new RegExp(UI_STRINGS.module1.allFy, 'i') }));

    // Click a vendor card to open modal
    const buttons = screen.getAllByRole('button');
    const vndCard = buttons.find((b) => b.textContent && b.textContent.includes('Rank #1'));
    if (vndCard) {
      fireEvent.click(vndCard);
      const closeBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.module1.closePopup, 'i') });
      expect(closeBtn).toBeInTheDocument();
      fireEvent.click(closeBtn);
    }

    // Toggle vendor balance expander
    const viewVendorBal = screen.getByRole('button', {
      name: new RegExp(UI_STRINGS.module1.viewBalanceSuppliers(7), 'i')
    });
    fireEvent.click(viewVendorBal);

    expect(
      screen.getByRole('button', { name: new RegExp(UI_STRINGS.module1.hideBalanceSuppliers(7), 'i') })
    ).toBeInTheDocument();
    expect(screen.getByText('Tail Vendor / Supplier Name')).toBeInTheDocument();

    // Switch years while vendor balance is open
    fireEvent.click(screen.getByRole('button', { name: 'FY24' }));
    fireEvent.click(screen.getByRole('button', { name: 'FY25' }));
    fireEvent.click(screen.getByRole('button', { name: 'FY26' }));
    fireEvent.click(screen.getByRole('button', { name: new RegExp(UI_STRINGS.module1.allFy, 'i') }));

    // Collapse vendor balance
    const hideVendorBal = screen.getByRole('button', {
      name: new RegExp(UI_STRINGS.module1.hideBalanceSuppliers(7), 'i')
    });
    fireEvent.click(hideVendorBal);

    // Switch back to Categories
    const catTab = screen.getByRole('button', { name: new RegExp(UI_STRINGS.module1.byCategories, 'i') });
    fireEvent.click(catTab);
    expect(screen.getByText(UI_STRINGS.module2.breakdown.categorySpendBreakdown)).toBeInTheDocument();
  }, 20000);

  it('renders UNSPSC taxonomy badges and switches hierarchy filter levels (Auto, Commodity, Class)', () => {
    render(<CategoryVendorBreakdownView tenant={mockTenant} />);

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
    render(<CategoryVendorBreakdownView tenant={mockTenant} />);

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
