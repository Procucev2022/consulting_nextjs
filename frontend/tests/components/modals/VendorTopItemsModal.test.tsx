import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VendorTopItemsModal } from '../../../src/components/modals/VendorTopItemsModal';
import { mockVendorYearDetails } from '../../../src/data/mockData';

describe('VendorTopItemsModal Component', () => {
  const sampleVendor = mockVendorYearDetails[0];

  it('renders null when not open or vendor is null', () => {
    const { container } = render(
      <VendorTopItemsModal
        vendor={null}
        isOpen={false}
        onClose={vi.fn()}
        totalEvaluatedSpendInrCr={732.41}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal details and handles search, trend filters, export, and close', () => {
    const onClose = vi.fn();

    render(
      <VendorTopItemsModal
        vendor={sampleVendor}
        isOpen={true}
        onClose={onClose}
        totalEvaluatedSpendInrCr={732.41}
      />
    );

    expect(screen.getAllByText(new RegExp(sampleVendor.vendor_name, 'i')).length).toBeGreaterThan(0);
    expect(screen.getByText('Price Creep Risk Items')).toBeInTheDocument();

    // Search
    const searchInput = screen.getByPlaceholderText(/Search items/i);
    fireEvent.change(searchInput, { target: { value: 'Packaging' } });

    // Filter
    const highCreepBtn = screen.getByRole('button', { name: /High Creep/i });
    fireEvent.click(highCreepBtn);

    const steadyBtn = screen.getByRole('button', { name: /Steady/i });
    fireEvent.click(steadyBtn);

    fireEvent.change(searchInput, { target: { value: '' } });
    const allBtn = screen.getByRole('button', { name: /All Items/i });
    fireEvent.click(allBtn);

    // Export CSV
    const exportBtn = screen.getByRole('button', { name: /Export CSV/i });
    fireEvent.click(exportBtn);

    const closeBtn = screen.getByRole('button', { name: /Close Pop-up/i });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('handles negative/zero price change, standard opportunity, empty top_items, and search match branches', () => {
    const customVendor: any = {
      ...sampleVendor,
      rank: undefined,
      top_items: [
        {
          item_id: 'V-ITEM-STEADY-1',
          item_desc: 'Steady Corrugated Box',
          column_l_code: '14121506',
          vendor_name: 'Box Vendor',
          po_number: 'PO-STEADY-V',
          order_qty_annual: 1000,
          unit_of_measure: 'EA',
          raw_currency: undefined,
          price_fy24: 10,
          price_fy25: 10,
          price_fy26: 9,
          price_change_pct: -10,
          total_spend_inr_cr: 0.5,
          opportunity_potential_inr_lakhs: undefined,
          leakage_flag: undefined
        }
      ]
    };

    const { rerender } = render(
      <VendorTopItemsModal
        vendor={customVendor}
        isOpen={true}
        onClose={vi.fn()}
        totalEvaluatedSpendInrCr={732.41}
      />
    );

    expect(screen.getByText('Standard')).toBeInTheDocument();
    expect(screen.getByText('+-10%')).toBeInTheDocument();

    // Search by PO number and column L
    const searchInput = screen.getByPlaceholderText(/Search items/i);
    fireEvent.change(searchInput, { target: { value: 'PO-STEADY-V' } });
    expect(screen.getByText('Steady Corrugated Box')).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: '14121506' } });
    expect(screen.getByText('Steady Corrugated Box')).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: 'V-ITEM-STEADY' } });
    expect(screen.getByText('Steady Corrugated Box')).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: 'NON_EXISTENT' } });
    expect(screen.getByText(/No line items match the filter criteria/i)).toBeInTheDocument();

    // Export CSV on customVendor (exercises opportunity_potential_inr_lakhs || 0 branch)
    const exportBtn = screen.getByRole('button', { name: /Export CSV/i });
    fireEvent.click(exportBtn);

    // Close via X button
    const allBtns = screen.getAllByRole('button');
    const xBtn = allBtns.find(b => !b.textContent || b.textContent.trim() === '');
    if (xBtn) {
      fireEvent.click(xBtn);
    }

    // Render with null top_items and 0 spend
    rerender(
      <VendorTopItemsModal
        vendor={{ ...sampleVendor, rank: undefined, top_items: undefined as any, total_3yr_spend_inr_cr: 0 }}
        isOpen={true}
        onClose={vi.fn()}
        totalEvaluatedSpendInrCr={732.41}
      />
    );
  });
});
