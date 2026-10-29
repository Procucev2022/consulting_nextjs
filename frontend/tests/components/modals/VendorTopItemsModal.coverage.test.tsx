import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VendorTopItemsModal } from '../../../src/components/modals/VendorTopItemsModal';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import type { CategoryTopItem, VendorYearDetail } from '../../../src/types';

const topItems = UI_STRINGS.modals.topItems;
const TOTAL_EVALUATED_SPEND_CR = 732.41;
const VENDOR_SPEND_CR = 120.5;

const highCreepItem: CategoryTopItem = {
  item_id: 'V-ITEM-1',
  item_desc: 'Industrial Packaging Films',
  column_l_code: '14121506',
  po_number: 'PO-ACM-001',
  order_qty_annual: 1000,
  unit_of_measure: 'KG',
  raw_currency: 'USD',
  price_fy24: 10,
  price_fy25: 11,
  price_fy26: 12.5,
  price_change_pct: 25,
  total_spend_inr_cr: 5.5,
  opportunity_potential_inr_lakhs: 15,
  leakage_flag: 'High Creep'
};

const steadyItem: CategoryTopItem = {
  item_id: 'V-ITEM-2',
  item_desc: 'Steady Corrugated Box',
  column_l_code: '14121507',
  po_number: 'PO-ACM-002',
  order_qty_annual: 300,
  unit_of_measure: 'EA',
  raw_currency: 'USD',
  price_fy24: 10,
  price_fy25: 10,
  price_fy26: 9,
  price_change_pct: -10,
  total_spend_inr_cr: 0.5,
  opportunity_potential_inr_lakhs: 0
};

const vendor: VendorYearDetail = {
  id: 'VND-ACM-101',
  rank: 1,
  vendor_name: 'Acme Chemical Global LLC',
  master_vendor_id: 'VND-ACM-101',
  primary_category: 'Direct Chemicals',
  sample_column_l_code: '12345678',
  spend_fy24_cr: 40,
  spend_fy25_cr: 45,
  spend_fy26_cr: 35.5,
  total_3yr_spend_inr_cr: VENDOR_SPEND_CR,
  line_items_count: 50,
  top_items: [highCreepItem, steadyItem]
};

describe('VendorTopItemsModal', () => {
  const onClose = vi.fn();

  const renderModal = (overrides: Partial<React.ComponentProps<typeof VendorTopItemsModal>> = {}): void => {
    render(
      <VendorTopItemsModal
        vendor={vendor}
        isOpen
        onClose={onClose}
        totalEvaluatedSpendInrCr={TOTAL_EVALUATED_SPEND_CR}
        {...overrides}
      />
    );
  };

  const dataRows = (): HTMLElement[] => screen.getAllByRole('row').slice(1);
  const searchInput = (): HTMLElement => screen.getByPlaceholderText(topItems.searchPlaceholderVendor);

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

  it('renders nothing while closed or without a vendor', () => {
    const { container: closedContainer } = render(
      <VendorTopItemsModal vendor={vendor} isOpen={false} onClose={onClose} totalEvaluatedSpendInrCr={1} />
    );
    expect(closedContainer.firstChild).toBeNull();

    const { container: emptyContainer } = render(
      <VendorTopItemsModal vendor={null} isOpen onClose={onClose} totalEvaluatedSpendInrCr={1} />
    );
    expect(emptyContainer.firstChild).toBeNull();
  });

  it('shows the rank, master id, spend share, and vendor totals', () => {
    renderModal();
    const sharePct = ((VENDOR_SPEND_CR / TOTAL_EVALUATED_SPEND_CR) * 100).toFixed(1);

    expect(screen.getByText(topItems.vendorRank(1))).toBeInTheDocument();
    expect(screen.getByText(topItems.masterVendorId('VND-ACM-101'))).toBeInTheDocument();
    expect(screen.getByText(topItems.spendShareVendor(sharePct))).toBeInTheDocument();
    expect(screen.getByText(topItems.vendorTitle('Acme Chemical Global LLC'))).toBeInTheDocument();
    expect(screen.getByText(topItems.vendorFiscalYearNote('Direct Chemicals', '12345678'))).toBeInTheDocument();
    expect(screen.getByText(topItems.lineItemsCount(50))).toBeInTheDocument();
    expect(screen.getByText(topItems.itemsCount(1))).toBeInTheDocument();
    expect(screen.getByText('₹120.50 Cr')).toBeInTheDocument();
    expect(screen.getByText(topItems.showingVendorItems(2, 2, 'Acme Chemical Global LLC'))).toBeInTheDocument();
  });

  it('shows a zero spend share when no evaluated spend is available', () => {
    renderModal({ totalEvaluatedSpendInrCr: 0 });

    expect(screen.getByText(topItems.spendShareVendor((0).toFixed(1)))).toBeInTheDocument();
  });

  it('renders items whose numeric fields are missing without throwing', () => {
    renderModal({
      vendor: {
        ...vendor,
        top_items: [
          { item_desc: 'Item without quantity', price_change_pct: 3 },
          { item_desc: 'Item without prices', order_qty_annual: 10, price_change_pct: 0 }
        ]
      }
    });

    expect(dataRows()).toHaveLength(2);
    expect(screen.getByText('Item without quantity')).toBeInTheDocument();
    expect(screen.getByText('Item without prices')).toBeInTheDocument();
  });

  it('filters rows by search text and price trend', () => {
    renderModal();

    fireEvent.change(searchInput(), { target: { value: 'PO-ACM-002' } });
    expect(screen.getByText(steadyItem.item_desc)).toBeInTheDocument();
    expect(dataRows()).toHaveLength(1);

    fireEvent.change(searchInput(), { target: { value: '14121506' } });
    expect(screen.getByText(highCreepItem.item_desc)).toBeInTheDocument();

    fireEvent.change(searchInput(), { target: { value: 'v-item' } });
    expect(dataRows()).toHaveLength(2);

    fireEvent.change(searchInput(), { target: { value: 'nothing matches' } });
    expect(screen.getByText(topItems.noItemsMatch)).toBeInTheDocument();

    fireEvent.change(searchInput(), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: topItems.filterHighCreep }));
    expect(dataRows()).toHaveLength(1);
    expect(screen.getByText(highCreepItem.item_desc)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: topItems.filterSteady }));
    expect(screen.getByText(steadyItem.item_desc)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: topItems.filterAllItems }));
    expect(dataRows()).toHaveLength(2);
  });

  it('shows fallbacks for items with sparse optional fields', () => {
    renderModal({
      vendor: {
        ...vendor,
        rank: undefined,
        line_items_count: undefined,
        item_count: 9,
        total_3yr_spend_inr_cr: undefined,
        top_items: [
          {
            item_desc: 'Sparse Item',
            order_qty_annual: 10,
            price_fy24: 1,
            price_fy25: 2,
            price_fy26: 3,
            price_change_pct: 0,
            total_spend_inr_cr: 0.25,
            leakage_flag: undefined,
            raw_currency: undefined
          }
        ]
      }
    });

    expect(screen.getByText(topItems.vendorRank(1))).toBeInTheDocument();
    expect(screen.getByText(topItems.lineItemsCount(9))).toBeInTheDocument();
    expect(screen.getByText(topItems.standardOpportunity)).toBeInTheDocument();
    expect(screen.getByText('+0%')).toBeInTheDocument();
    expect(screen.getByText('₹0.25 Cr')).toBeInTheDocument();
  });

  it('counts the top items when neither line item count field is set', () => {
    renderModal({ vendor: { ...vendor, line_items_count: undefined, item_count: undefined } });

    expect(screen.getByText(topItems.lineItemsCount(2))).toBeInTheDocument();
  });

  it('shows an empty table when the vendor has no top items', () => {
    renderModal({ vendor: { ...vendor, top_items: undefined } });

    expect(screen.getByText(topItems.noItemsMatch)).toBeInTheDocument();
  });

  it('exports every item for the vendor as a CSV file', () => {
    const downloads: Array<{ href: string; filename: string | null }> = [];
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(function (this: HTMLAnchorElement): void {
        downloads.push({ href: decodeURI(this.href), filename: this.getAttribute('download') });
      });
    renderModal();

    fireEvent.click(screen.getByRole('button', { name: topItems.exportCSV }));

    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(downloads[0].filename).toBe('Acme_Chemical_Global_LLC_Top_Items_3Yr_Price_Trend.csv');
    expect(downloads[0].href).toContain('Industrial Packaging Films');
    expect(downloads[0].href).toContain('Steady Corrugated Box');
  });

  it('closes from the footer button and from the header close icon', () => {
    renderModal();

    fireEvent.click(screen.getByRole('button', { name: topItems.closePopUp }));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(iconCloseButton());
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
