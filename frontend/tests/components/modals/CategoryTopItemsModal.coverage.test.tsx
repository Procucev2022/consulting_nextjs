import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CategoryTopItemsModal } from '../../../src/components/modals/CategoryTopItemsModal';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import type { CategoryTopItem, CategoryYearDetail } from '../../../src/types';

const topItems = UI_STRINGS.modals.topItems;
const TOTAL_EVALUATED_SPEND_CR = 732.41;
const CATEGORY_SPEND_CR = 120.5;

const highCreepItem: CategoryTopItem = {
  item_id: 'ITEM-1',
  item_desc: 'Polymer Additive X-50',
  column_l_code: 'C1-POLY',
  vendor_name: 'Acme Chemical Global LLC',
  po_number: 'PO-99901',
  order_qty_annual: 500,
  unit_of_measure: 'KG',
  raw_currency: 'USD',
  price_fy24: 100,
  price_fy25: 110,
  price_fy26: 125,
  price_change_pct: 25,
  total_spend_inr_cr: 10.5,
  opportunity_potential_inr_lakhs: 25,
  leakage_flag: 'High Creep'
};

const steadyItem: CategoryTopItem = {
  item_id: 'ITEM-2',
  item_desc: 'Steady Corrugated Box',
  column_l_code: 'C2-BOX',
  vendor_name: 'Box Vendor',
  po_number: 'PO-STEADY-2',
  order_qty_annual: 1000,
  unit_of_measure: 'EA',
  raw_currency: 'USD',
  price_fy24: 10,
  price_fy25: 10,
  price_fy26: 9,
  price_change_pct: -10,
  total_spend_inr_cr: 0.5,
  opportunity_potential_inr_lakhs: 0
};

const category: CategoryYearDetail = {
  id: 'CAT-1',
  rank: 1,
  category: 'Direct Chemicals',
  sample_column_l_code: '12345678',
  total_3yr_spend_inr_cr: CATEGORY_SPEND_CR,
  line_items_count: 50,
  top_items: [highCreepItem, steadyItem]
};

describe('CategoryTopItemsModal', () => {
  const onClose = vi.fn();

  const renderModal = (overrides: Partial<React.ComponentProps<typeof CategoryTopItemsModal>> = {}): void => {
    render(
      <CategoryTopItemsModal
        category={category}
        isOpen
        onClose={onClose}
        totalEvaluatedSpendInrCr={TOTAL_EVALUATED_SPEND_CR}
        {...overrides}
      />
    );
  };

  const dataRows = (): HTMLElement[] => screen.getAllByRole('row').slice(1);
  const searchInput = (): HTMLElement => screen.getByPlaceholderText(topItems.searchPlaceholderCategory);

  // The close icon is the only header button without visible text.
  const iconCloseButton = (): HTMLElement => {
    const button = screen.getAllByRole('button').find((element) => element.textContent?.trim() === '');
    if (!button) {
      throw new Error('Close icon button was not rendered');
    }
    return button;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders nothing while closed or without a category', () => {
    const { container: closedContainer } = render(
      <CategoryTopItemsModal category={category} isOpen={false} onClose={onClose} totalEvaluatedSpendInrCr={1} />
    );
    expect(closedContainer.firstChild).toBeNull();

    const { container: emptyContainer } = render(
      <CategoryTopItemsModal category={null} isOpen onClose={onClose} totalEvaluatedSpendInrCr={1} />
    );
    expect(emptyContainer.firstChild).toBeNull();
  });

  it('shows the rank, commodity, spend share, and KPI totals for the category', () => {
    renderModal();
    const sharePct = ((CATEGORY_SPEND_CR / TOTAL_EVALUATED_SPEND_CR) * 100).toFixed(1);

    expect(screen.getByRole('heading', { name: topItems.categoryTitle('Direct Chemicals') })).toBeInTheDocument();
    expect(screen.getByText(topItems.categoryRank(1))).toBeInTheDocument();
    expect(screen.getByText(topItems.unspscCommodity('12345678'))).toBeInTheDocument();
    expect(screen.getByText(topItems.spendShare(sharePct))).toBeInTheDocument();
    expect(screen.getByText(topItems.activeItemsCount(50))).toBeInTheDocument();
    expect(screen.getByText(topItems.itemsCount(1))).toBeInTheDocument();
    expect(screen.getByText('₹120.50 Cr')).toBeInTheDocument();
    expect(screen.getByText(topItems.lakhsVal(25))).toBeInTheDocument();
    expect(screen.getByText(topItems.showingCategoryItems(2, 2, 'Direct Chemicals'))).toBeInTheDocument();
  });

  it('shows a zero spend share when no evaluated spend is available', () => {
    renderModal({ totalEvaluatedSpendInrCr: 0 });

    expect(screen.getByText(topItems.spendShare((0).toFixed(1)))).toBeInTheDocument();
  });

  it('filters rows by each searchable column', () => {
    renderModal();

    fireEvent.change(searchInput(), { target: { value: 'Acme' } });
    expect(dataRows()).toHaveLength(1);
    expect(screen.getByText(highCreepItem.item_desc)).toBeInTheDocument();

    fireEvent.change(searchInput(), { target: { value: 'c2-box' } });
    expect(screen.getByText(steadyItem.item_desc)).toBeInTheDocument();

    fireEvent.change(searchInput(), { target: { value: 'item-2' } });
    expect(screen.getByText(steadyItem.item_desc)).toBeInTheDocument();

    fireEvent.change(searchInput(), { target: { value: 'po-steady' } });
    expect(screen.getByText(steadyItem.item_desc)).toBeInTheDocument();

    fireEvent.change(searchInput(), { target: { value: 'no such item' } });
    expect(screen.getByText(topItems.noItemsMatch)).toBeInTheDocument();
  });

  it('filters rows by price trend and resets to all items', () => {
    renderModal();

    fireEvent.click(screen.getByRole('button', { name: topItems.filterHighCreep }));
    expect(dataRows()).toHaveLength(1);
    expect(screen.getByText(highCreepItem.item_desc)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: topItems.filterSteady }));
    expect(dataRows()).toHaveLength(1);
    expect(screen.getByText(steadyItem.item_desc)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: topItems.filterAllTop10 }));
    expect(dataRows()).toHaveLength(2);
  });

  it('shows fallbacks for sparse top items and keeps every row', () => {
    renderModal({
      category: {
        ...category,
        top_items: [
          {
            item_name: 'Named Only Item',
            column_l_code: undefined,
            volume: 300,
            unit: 'M',
            raw_currency: undefined,
            price_fy25: 10,
            price_fy26: 12,
            price_change_pct: 15,
            spend_inr_cr: 2.5,
            opportunity_potential_inr_lakhs: 40,
            leakage_flag: undefined
          },
          {
            price_change_pct: 5,
            total_spend_inr_cr: undefined,
            spend_inr_cr: undefined,
            opportunity_potential_inr_lakhs: 0,
            column_l_code: ''
          },
          {
            item_id: 'ITEM-LAST',
            item_desc: 'Unrated Item',
            price_fy24: null,
            order_qty_annual: null,
            volume: null,
            unit_of_measure: '',
            unit: null,
            price_change_pct: undefined,
            opportunity_potential_inr_lakhs: undefined
          }
        ]
      }
    });

    expect(dataRows()).toHaveLength(3);
    expect(screen.getByText('+15%')).toBeInTheDocument();
    expect(screen.getByText('+5%')).toBeInTheDocument();
    expect(screen.getByText('+0%')).toBeInTheDocument();
    expect(screen.getByText(topItems.lakhsVal(40))).toBeInTheDocument();
    expect(screen.getAllByText(topItems.standardOpportunity)).toHaveLength(2);
    expect(screen.getByText('Named Only Item')).toBeInTheDocument();
  });

  it('falls back to rank 1, the item count, and an empty table when fields are missing', () => {
    renderModal({
      category: {
        ...category,
        rank: undefined,
        line_items_count: undefined,
        item_count: 7,
        total_3yr_spend_inr_cr: undefined,
        top_items: undefined
      }
    });

    expect(screen.getByText(topItems.categoryRank(1))).toBeInTheDocument();
    expect(screen.getByText(topItems.activeItemsCount(7))).toBeInTheDocument();
    expect(screen.getByText(topItems.noItemsMatch)).toBeInTheDocument();
  });

  it('counts the top items when neither line item count field is set', () => {
    renderModal({ category: { ...category, line_items_count: undefined, item_count: undefined } });

    expect(screen.getByText(topItems.activeItemsCount(2))).toBeInTheDocument();
  });

  it('downloads only the filtered rows as a CSV file named after the category', () => {
    const downloads: Array<{ href: string; filename: string | null }> = [];
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(function (this: HTMLAnchorElement): void {
        downloads.push({ href: decodeURI(this.href), filename: this.getAttribute('download') });
      });
    renderModal();

    fireEvent.change(searchInput(), { target: { value: 'Polymer' } });
    fireEvent.click(screen.getByRole('button', { name: topItems.exportCSV }));

    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(downloads[0].filename).toBe('Direct_Chemicals_Top_10_Items_Price_Trend.csv');
    expect(downloads[0].href).toContain('Polymer Additive X-50');
    expect(downloads[0].href).not.toContain('Steady Corrugated Box');
  });

  it('closes from the footer button and from the header close icon', () => {
    renderModal();

    fireEvent.click(screen.getByRole('button', { name: topItems.closePopUp }));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(iconCloseButton());
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
