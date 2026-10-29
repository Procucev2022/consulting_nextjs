import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CategoryVendorBreakdownView } from '../../src/components/CategoryVendorBreakdownView';
import { mockTenant } from '../fixtures/mockData';
import { UI_STRINGS } from '../../src/constants/uiStrings';
import { resolveHumanReadableCategory } from '../../src/utils/procurementCategoryResolver';
import type {
  BalanceCategoryItem,
  BalanceVendorItem,
  CategoryYearDetail,
  LineItemMapping,
  TenantMaster,
  VendorYearDetail
} from '../../src/types';

const breakdown = UI_STRINGS.module2.breakdown;
const topItemsModal = UI_STRINGS.modals.topItems;
const SPEND_TENANT: TenantMaster = { ...mockTenant, total_spend_evaluated_inr: 50 };
const ZERO_SPEND_TENANT: TenantMaster = { ...mockTenant, total_spend_evaluated_inr: 0 };

type LegacyRow = Record<string, unknown>;

// Older payloads omit fields the typed models mark as required and use alternate spend keys.
// Casting these rows keeps the component's fallback branches under test without changing typed fixtures.
const asLegacyCategories = (rows: LegacyRow[]): CategoryYearDetail[] => rows as unknown as CategoryYearDetail[];
const asLegacyVendors = (rows: LegacyRow[]): VendorYearDetail[] => rows as unknown as VendorYearDetail[];

const buildCategory = (
  overrides: Partial<CategoryYearDetail> & Pick<CategoryYearDetail, 'id' | 'category'>
): CategoryYearDetail => ({
  core_bucket: 'Direct Materials',
  sample_column_l_code: '12352100',
  sample_column_l_title: 'Industrial Solvents',
  spend_fy24_cr: 10,
  spend_fy25_cr: 12,
  spend_fy26_cr: 14,
  total_3yr_spend_inr_cr: 36,
  spend_share_pct: 10,
  yoy_growth_pct: 16.7,
  vendor_count: 3,
  item_count: 5,
  top_items: [],
  is_balance_category: false,
  ...overrides
});

const buildVendor = (
  overrides: Partial<VendorYearDetail> & Pick<VendorYearDetail, 'id' | 'vendor_name'>
): VendorYearDetail => ({
  primary_category: 'Industrial Solvents',
  spend_fy24_cr: 8,
  spend_fy25_cr: 9,
  spend_fy26_cr: 11,
  total_3yr_spend_inr_cr: 28,
  spend_share_pct: 6,
  yoy_growth_pct: 22.2,
  item_count: 4,
  is_balance_vendor: false,
  top_items: [],
  ...overrides
});

const buildBalanceVendorRows = (count: number): BalanceVendorItem[] =>
  Array.from({ length: count }, (_, index) => ({
    vendor_name: `Tail Supplier ${index + 1}`,
    category: 'Packaging',
    column_l_code: `7777000${index + 1}`,
    spend_inr_cr: 1.5,
    share_pct: 0.2,
    line_items_count: 2
  }));

const buildBalanceCategoryRows = (count: number): BalanceCategoryItem[] =>
  Array.from({ length: count }, (_, index) => ({
    name: `Tail Segment ${index + 1}`,
    column_l_code: `8888000${index + 1}`,
    spend_inr_cr: 2.5,
    share_pct: 0.35
  }));

const buildLineItem = (
  overrides: Partial<LineItemMapping> & Pick<LineItemMapping, 'line_item_id' | 'vendor_identified'>
): LineItemMapping => ({
  mapping_id: `MAP-${overrides.line_item_id}`,
  raw_desc: 'Industrial Solvent',
  unspsc_code: '12352100',
  unspsc_category_name: 'Solvents',
  core_bucket: 'Direct Materials',
  ai_confidence: 95,
  status: 'Confirmed',
  unit_price: 1000,
  qty: 100,
  total_spend: 10000000,
  inr_crores: 1,
  invoice_date: '2024-05-10',
  po_number: `PO-${overrides.line_item_id}`,
  ...overrides
});

const displayedCategoryName = (rawName: string, code: string): string =>
  resolveHumanReadableCategory(resolveHumanReadableCategory(rawName), code);

// The balance drawer repeats the last sorted row when nothing is flagged as balance, so a name can
// appear twice. The first match is always the card, because the card grid precedes the drawer.
const cardFor = (headingName: string): HTMLElement => {
  const [heading] = screen.getAllByRole('heading', { name: headingName });
  const button = heading?.closest('button');
  if (!button) {
    throw new Error(`No clickable card wraps the heading "${headingName}"`);
  }
  return button;
};

const expectHeadingNamed = (headingName: string): void => {
  expect(screen.getAllByRole('heading', { name: headingName }).length).toBeGreaterThan(0);
};

const headingNames = (): string[] =>
  screen.getAllByRole('heading', { level: 4 }).map((heading) => heading.textContent ?? '');

describe('CategoryVendorBreakdownView coverage', () => {
  it('derives category values from legacy payload fields when typed totals are absent', () => {
    const categories = asLegacyCategories([
      {
        category: 'Legacy Alpha',
        spend_inr_crores: 12.5,
        spend_inr_2023_cr: 4,
        spend_inr_2024_cr: 5,
        spend_inr_2025_26_cr: 3.5,
        unspsc_code: '44121700',
        sample_column_l_title: undefined
      },
      {
        name: 'Legacy Beta',
        id: 'legacy-beta',
        spend_fy25_cr: 6,
        spend_fy26_cr: 9,
        sample_column_l_code: '44121701',
        sample_column_l_title: 'Beta Commodity',
        core_bucket: 'Packaging Materials'
      },
      { category: 'Legacy Gamma', spend_fy24_cr: 8, spend_fy25_cr: 0, spend_fy26_cr: 0, yoy_growth_pct: undefined },
      {},
      { category: 'Legacy Delta', spend_fy24_cr: 4, spend_fy25_cr: 6, spend_fy26_cr: 0 },
      { category: 'Legacy Echo', id: 'legacy-echo', spend_fy24_cr: 1, spend_fy25_cr: 2, spend_fy26_cr: 3, total_3yr_spend_inr_cr: 6, yoy_growth_pct: 9.5 }
    ]);

    render(<CategoryVendorBreakdownView categories={categories} tenant={mockTenant} />);

    expect(screen.getAllByText(breakdown.evaluatedSpendLabel)).toHaveLength(6);
    expect(screen.getByText(/12\.50/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: breakdown.viewBalanceCategories(7) })).toBeInTheDocument();
  });

  it('sorts balance rows last even when they arrive first in the payload', () => {
    const categories = [
      buildCategory({
        id: 'bal-first',
        category: 'Tail Balance Group',
        sample_column_l_code: '99999999',
        is_balance_category: true,
        total_3yr_spend_inr_cr: 5,
        balance_items: buildBalanceCategoryRows(7)
      }),
      buildCategory({
        id: 'alpha',
        category: 'Alpha Chemicals',
        sample_column_l_code: '12352100',
        total_3yr_spend_inr_cr: 30
      }),
      buildCategory({
        id: 'beta',
        category: 'Beta Packaging',
        sample_column_l_code: '24111500',
        total_3yr_spend_inr_cr: 60
      })
    ];
    const vendors = [
      buildVendor({
        id: 'vb',
        vendor_name: 'Tail Vendor Group',
        is_balance_vendor: true,
        total_3yr_spend_inr_cr: 4,
        balance_vendors: buildBalanceVendorRows(7)
      }),
      buildVendor({ id: 'va', vendor_name: 'Vendor Alpha', total_3yr_spend_inr_cr: 20 }),
      buildVendor({ id: 'vc', vendor_name: 'Vendor Charlie', total_3yr_spend_inr_cr: 50 })
    ];

    render(<CategoryVendorBreakdownView categories={categories} vendors={vendors} tenant={mockTenant} />);

    expect(headingNames()).toEqual([
      displayedCategoryName('Beta Packaging', '24111500'),
      displayedCategoryName('Alpha Chemicals', '12352100'),
      displayedCategoryName('Tail Balance Group', '99999999')
    ]);

    fireEvent.click(screen.getByRole('button', { name: breakdown.byVendors }));

    expect(headingNames()).toEqual(['Vendor Charlie', 'Vendor Alpha', 'Tail Vendor Group']);
  });

  it('renders vendor cards from supplied vendors and opens and closes the vendor modal', () => {
    const categories = [buildCategory({ id: 'multi', category: 'Alpha Chemicals' })];
    const vendors = [
      buildVendor({ id: 'vendor-alpha', vendor_name: 'Vendor Alpha', total_3yr_spend_inr_cr: 20 }),
      buildVendor({
        id: '',
        vendor_name: 'Vendor Beta',
        spend_fy24_cr: 0,
        spend_fy25_cr: 0,
        spend_fy26_cr: 0,
        total_3yr_spend_inr_cr: 0
      }),
      buildVendor({ id: 'vendor-gamma', vendor_name: 'Vendor Gamma', total_3yr_spend_inr_cr: 35 })
    ];

    render(
      <CategoryVendorBreakdownView
        categories={categories}
        vendors={vendors}
        tenant={mockTenant}
        initialMode="VENDOR"
      />
    );

    // The first three headings are the vendor cards; the last one is the balance drawer fallback.
    expect(headingNames().slice(0, 3)).toEqual(['Vendor Gamma', 'Vendor Alpha', 'Vendor Beta']);
    expect(screen.getAllByText(breakdown.popupReady)).toHaveLength(1);

    fireEvent.click(cardFor('Vendor Beta'));
    expect(screen.getAllByText(breakdown.popupReady)).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: topItemsModal.closePopUp }));
    expect(screen.queryByRole('button', { name: topItemsModal.closePopUp })).not.toBeInTheDocument();
  });

  it('expands the vendor balance drawer, shows its supplier rows after a year switch, then collapses it', () => {
    const categories = [buildCategory({ id: 'c1', category: 'Alpha Chemicals' })];
    const vendors = [
      buildVendor({
        id: 'vb',
        vendor_name: 'Tail Vendor Group',
        is_balance_vendor: true,
        total_3yr_spend_inr_cr: 4,
        balance_vendors: buildBalanceVendorRows(7)
      }),
      buildVendor({ id: 'va', vendor_name: 'Vendor Alpha', total_3yr_spend_inr_cr: 20 })
    ];

    render(
      <CategoryVendorBreakdownView categories={categories} vendors={vendors} tenant={mockTenant} initialMode="VENDOR" />
    );

    fireEvent.click(screen.getByRole('button', { name: breakdown.fy25 }));
    fireEvent.click(screen.getByRole('button', { name: breakdown.viewBalanceSuppliers(7) }));

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader')).toHaveLength(5);
    expect(screen.getAllByRole('row')).toHaveLength(8);
    expect(screen.getByRole('cell', { name: 'Tail Supplier 1' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: breakdown.hideBalanceSuppliers(7) }));
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('shows the vendor balance drawer without a table when its row has no supplier list', () => {
    const vendors = [
      buildVendor({
        id: 'vb',
        vendor_name: 'Tail Vendor Group',
        is_balance_vendor: true,
        total_3yr_spend_inr_cr: 0,
        spend_fy24_cr: 0,
        spend_fy25_cr: 0,
        spend_fy26_cr: 0
      }),
      buildVendor({
        id: 'va',
        vendor_name: 'Vendor Alpha',
        total_3yr_spend_inr_cr: 0,
        spend_fy24_cr: 0,
        spend_fy25_cr: 0,
        spend_fy26_cr: 0
      })
    ];

    render(<CategoryVendorBreakdownView vendors={vendors} tenant={ZERO_SPEND_TENANT} initialMode="VENDOR" />);

    fireEvent.click(screen.getByRole('button', { name: breakdown.viewBalanceSuppliers(7) }));
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('falls back to the last sorted vendor for the balance drawer when no vendor is flagged', () => {
    const vendors = [
      buildVendor({ id: 'va', vendor_name: 'Vendor Alpha', total_3yr_spend_inr_cr: 20 }),
      buildVendor({ id: 'vb', vendor_name: 'Vendor Beta', total_3yr_spend_inr_cr: 3 })
    ];

    render(<CategoryVendorBreakdownView vendors={vendors} tenant={mockTenant} initialMode="VENDOR" />);

    expect(screen.getAllByRole('heading', { name: 'Vendor Beta' })).toHaveLength(2);
    expect(screen.getByRole('button', { name: breakdown.viewBalanceSuppliers(7) })).toBeInTheDocument();
  });

  it('uses tenant spend when it is positive and keeps zero totals free of NaN values', () => {
    const { unmount } = render(
      <CategoryVendorBreakdownView
        categories={[buildCategory({ id: 'c1', category: 'Alpha Chemicals', total_3yr_spend_inr_cr: 30 })]}
        tenant={SPEND_TENANT}
      />
    );
    expect(screen.getByText(/50\.00/)).toBeInTheDocument();
    unmount();

    const zeroCategories = [
      buildCategory({
        id: 'zero-alpha',
        category: 'Zero Alpha',
        spend_fy24_cr: 0,
        spend_fy25_cr: 5,
        spend_fy26_cr: 0,
        total_3yr_spend_inr_cr: 0
      }),
      buildCategory({
        id: 'zero-tail',
        category: 'Zero Tail',
        is_balance_category: true,
        spend_fy24_cr: 0,
        spend_fy25_cr: 0,
        spend_fy26_cr: 0,
        total_3yr_spend_inr_cr: 0
      })
    ];
    render(<CategoryVendorBreakdownView categories={zeroCategories} tenant={ZERO_SPEND_TENANT} />);

    fireEvent.click(screen.getByRole('button', { name: breakdown.fy24 }));

    expect(screen.queryByText(/NaN|Infinity/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: breakdown.viewBalanceCategories(7) })).toBeInTheDocument();
  });

  it('honours lock mode and initial mode, and shows the tenant sector badge', () => {
    const categories = [buildCategory({ id: 'c1', category: 'Alpha Chemicals' })];
    const vendors = [buildVendor({ id: 'va', vendor_name: 'Vendor Alpha' })];

    const { unmount } = render(
      <CategoryVendorBreakdownView categories={categories} vendors={vendors} tenant={mockTenant} lockMode="VENDOR" />
    );
    expect(screen.getByText(breakdown.vendorSpendBreakdown)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: breakdown.byCategories })).not.toBeInTheDocument();
    unmount();

    const { unmount: unmountInitial } = render(
      <CategoryVendorBreakdownView categories={categories} vendors={vendors} tenant={mockTenant} initialMode="VENDOR" />
    );
    expect(screen.getByText(breakdown.vendorSpendBreakdown)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: breakdown.byCategories })).toBeInTheDocument();
    unmountInitial();

    render(<CategoryVendorBreakdownView categories={categories} tenant={mockTenant} />);
    expect(screen.getByText(breakdown.categorySpendBreakdown)).toBeInTheDocument();
    expect(screen.getByText(/Direct & Indirect Procurement/)).toBeInTheDocument();
  });

  it('cycles the UNSPSC level filter in category mode and hides it in vendor mode', () => {
    const categories = [buildCategory({ id: 'c1', category: 'Alpha Chemicals' })];
    const vendors = [buildVendor({ id: 'va', vendor_name: 'Vendor Alpha' })];

    render(<CategoryVendorBreakdownView categories={categories} vendors={vendors} tenant={mockTenant} />);

    fireEvent.click(screen.getByRole('button', { name: breakdown.unspscLevelFilter.class }));
    expect(screen.getAllByText(breakdown.unspscClassBadge).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: breakdown.unspscLevelFilter.commodity }));
    expect(screen.getAllByText(breakdown.unspscCommodityBadge).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: breakdown.unspscLevelFilter.auto }));

    fireEvent.click(screen.getByRole('button', { name: breakdown.byVendors }));
    expect(screen.queryByRole('button', { name: breakdown.unspscLevelFilter.class })).not.toBeInTheDocument();
  });

  it('renders no cards or balance drawers when no categories or vendors are supplied', () => {
    const { unmount } = render(<CategoryVendorBreakdownView tenant={mockTenant} />);
    expect(screen.queryAllByRole('heading', { level: 4 })).toHaveLength(0);
    expect(screen.queryByRole('button', { name: breakdown.viewBalanceCategories(7) })).not.toBeInTheDocument();
    unmount();

    render(<CategoryVendorBreakdownView tenant={mockTenant} initialMode="VENDOR" />);
    expect(screen.queryAllByRole('heading', { level: 4 })).toHaveLength(0);
    expect(screen.queryByRole('button', { name: breakdown.viewBalanceSuppliers(7) })).not.toBeInTheDocument();
  });

  it('builds category and vendor cards from line items when no summary payload is provided', () => {
    const lineItems = [
      buildLineItem({ line_item_id: 'LI-1', vendor_identified: 'Acme Chemicals', spend_year: 2023, inr_crores: 4 }),
      buildLineItem({
        line_item_id: 'LI-2',
        vendor_identified: 'Beta Supplies',
        spend_year: 2024,
        inr_crores: 5,
        unspsc_code: '24111500',
        unspsc_category_name: 'Packaging',
        core_bucket: 'Packaging Materials'
      }),
      buildLineItem({ line_item_id: 'LI-3', vendor_identified: 'Acme Chemicals', spend_year: 2025, inr_crores: 6 })
    ];

    render(<CategoryVendorBreakdownView lineItems={lineItems} tenant={SPEND_TENANT} />);

    expect(screen.getAllByText(breakdown.evaluatedSpendLabel).length).toBeGreaterThan(0);
    expect(screen.getByText(/50\.00/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: breakdown.byVendors }));
    expectHeadingNamed('Acme Chemicals');
    expectHeadingNamed('Beta Supplies');
  });

  it('reads legacy vendor spend fields as zero when typed values are absent', () => {
    const categories = [buildCategory({ id: 'c1', category: 'Alpha Chemicals' })];
    const vendors = asLegacyVendors([
      { id: 'legacy-vendor-1', vendor_name: 'Legacy Vendor One', primary_category: 'Solvents', total_3yr_spend_inr_cr: 12 },
      { id: 'legacy-vendor-2', vendor_name: 'Legacy Vendor Two', spend_fy24_cr: 3, spend_fy25_cr: 4, spend_fy26_cr: 5 }
    ]);

    render(
      <CategoryVendorBreakdownView categories={categories} vendors={vendors} tenant={mockTenant} initialMode="VENDOR" />
    );

    fireEvent.click(screen.getByRole('button', { name: breakdown.fy24 }));
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
    expectHeadingNamed('Legacy Vendor One');

    fireEvent.click(screen.getByRole('button', { name: breakdown.allFy }));
    expectHeadingNamed('Legacy Vendor Two');
  });

  it('opens the category top-items modal from a card and closes it', () => {
    const categories = [
      buildCategory({ id: 'c1', category: 'Alpha Chemicals', total_3yr_spend_inr_cr: 30 }),
      buildCategory({
        id: 'c2',
        category: 'Beta Packaging',
        sample_column_l_code: '24111500',
        total_3yr_spend_inr_cr: 60
      })
    ];

    render(<CategoryVendorBreakdownView categories={categories} tenant={mockTenant} />);

    fireEvent.click(cardFor(displayedCategoryName('Beta Packaging', '24111500')));
    fireEvent.click(screen.getByRole('button', { name: topItemsModal.closePopUp }));

    expect(screen.queryByRole('button', { name: topItemsModal.closePopUp })).not.toBeInTheDocument();
  });

  it('expands the category balance drawer and shows its itemised segment table', () => {
    const categories = [
      buildCategory({
        id: 'bal',
        category: 'Tail Balance Group',
        sample_column_l_code: '99999999',
        is_balance_category: true,
        total_3yr_spend_inr_cr: 18,
        balance_items: buildBalanceCategoryRows(7)
      }),
      buildCategory({ id: 'c1', category: 'Alpha Chemicals' })
    ];

    render(<CategoryVendorBreakdownView categories={categories} tenant={mockTenant} />);

    fireEvent.click(screen.getByRole('button', { name: breakdown.viewBalanceCategories(7) }));

    expect(screen.getByRole('columnheader', { name: breakdown.balanceTableHeaders.category })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: breakdown.balanceTableHeaders.unspscColL })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: breakdown.balanceTableHeaders.share })).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(8);

    fireEvent.click(screen.getByRole('button', { name: breakdown.hideBalanceCategories(7) }));
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('hides year pills when no multi-year spend exists', () => {
    const categories = [
      buildCategory({ id: 'single', category: 'Alpha Chemicals', spend_fy24_cr: 10, spend_fy25_cr: 0, spend_fy26_cr: 0 })
    ];
    const vendors = [
      buildVendor({ id: 'va', vendor_name: 'Vendor Alpha', spend_fy24_cr: 5, spend_fy25_cr: 0, spend_fy26_cr: 0 })
    ];

    render(<CategoryVendorBreakdownView categories={categories} vendors={vendors} tenant={mockTenant} />);

    expect(screen.getByRole('button', { name: breakdown.allFy })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: breakdown.fy24 })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: breakdown.fy25 })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: breakdown.fy26 })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: breakdown.byVendors }));
    expectHeadingNamed('Vendor Alpha');
    expect(screen.queryByRole('button', { name: breakdown.fy25 })).not.toBeInTheDocument();
  });

  it('shows each fiscal year value on category cards when a year pill is selected', () => {
    const categories = [
      buildCategory({
        id: 'fy-alpha',
        category: 'Alpha Chemicals',
        spend_fy24_cr: 10,
        spend_fy25_cr: 12,
        spend_fy26_cr: 14,
        total_3yr_spend_inr_cr: 36
      })
    ];

    render(<CategoryVendorBreakdownView categories={categories} tenant={ZERO_SPEND_TENANT} />);

    fireEvent.click(screen.getByRole('button', { name: breakdown.fy26 }));
    expect(screen.getAllByText(/14\.00/).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: breakdown.fy24 }));
    expect(screen.getAllByText(/10\.00/).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: breakdown.fy25 }));
    expect(screen.getAllByText(/12\.00/).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: breakdown.allFy }));
    expect(screen.getAllByText(/36\.00/).length).toBeGreaterThan(0);
  });
});
