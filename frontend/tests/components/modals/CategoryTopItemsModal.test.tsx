import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CategoryTopItemsModal } from '../../../src/components/modals/CategoryTopItemsModal';
import { mockCategoryYearDetails } from '../../../src/data/mockData';

describe('CategoryTopItemsModal Component', () => {
  const sampleCategory = mockCategoryYearDetails[0];

  it('renders null when not open or category is null', () => {
    const { container } = render(
      <CategoryTopItemsModal
        category={null}
        isOpen={false}
        onClose={vi.fn()}
        totalEvaluatedSpendInrCr={732.41}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal details when open', () => {
    render(
      <CategoryTopItemsModal
        category={sampleCategory}
        isOpen={true}
        onClose={vi.fn()}
        totalEvaluatedSpendInrCr={732.41}
      />
    );

    expect(screen.getAllByText(new RegExp(sampleCategory.category, 'i')).length).toBeGreaterThan(0);
    expect(screen.getByText('Price Creep Risk Items')).toBeInTheDocument();
  });

  it('handles search input and trend filtering', () => {
    render(
      <CategoryTopItemsModal
        category={sampleCategory}
        isOpen={true}
        onClose={vi.fn()}
        totalEvaluatedSpendInrCr={732.41}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Search items/i);
    fireEvent.change(searchInput, { target: { value: 'Polymer' } });

    const highCreepBtn = screen.getByRole('button', { name: /High Creep/i });
    fireEvent.click(highCreepBtn);

    const steadyBtn = screen.getByRole('button', { name: /Steady/i });
    fireEvent.click(steadyBtn);

    const allBtn = screen.getByRole('button', { name: /All Top 10/i });
    fireEvent.click(allBtn);
  });

  it('handles CSV export and close buttons', () => {
    const onClose = vi.fn();
    render(
      <CategoryTopItemsModal
        category={sampleCategory}
        isOpen={true}
        onClose={onClose}
        totalEvaluatedSpendInrCr={732.41}
      />
    );

    const exportBtn = screen.getByRole('button', { name: /Export CSV/i });
    fireEvent.click(exportBtn);

    const closePopUpBtn = screen.getByRole('button', { name: /Close Pop-up/i });
    fireEvent.click(closePopUpBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('handles negative/zero price change, standard opportunity, empty top_items, and search match branches', () => {
    const customCategory: any = {
      ...sampleCategory,
      top_items: [
        {
          item_id: 'ITEM-STEADY-1',
          item_desc: 'Steady Corrugated Box',
          column_l_code: '14121506',
          vendor_name: 'Box Vendor',
          po_number: 'PO-STEADY-1',
          order_qty_annual: 1000,
          unit_of_measure: 'EA',
          raw_currency: 'USD',
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
      <CategoryTopItemsModal
        category={customCategory}
        isOpen={true}
        onClose={vi.fn()}
        totalEvaluatedSpendInrCr={732.41}
      />
    );

    expect(screen.getByText('Standard')).toBeInTheDocument();
    expect(screen.getByText('+-10%')).toBeInTheDocument();

    // Search by PO number and column L
    const searchInput = screen.getByPlaceholderText(/Search items/i);
    fireEvent.change(searchInput, { target: { value: 'PO-STEADY' } });
    expect(screen.getByText('Steady Corrugated Box')).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: '14121506' } });
    expect(screen.getByText('Steady Corrugated Box')).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: 'ITEM-STEADY' } });
    expect(screen.getByText('Steady Corrugated Box')).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: 'NON_EXISTENT' } });
    expect(screen.getByText(/No line items match the filter criteria/i)).toBeInTheDocument();

    // Export CSV on customCategory (exercises opportunity_potential_inr_lakhs || 0 branch)
    const exportBtn = screen.getByRole('button', { name: /Export CSV/i });
    fireEvent.click(exportBtn);

    // Close via X button
    const allBtns = screen.getAllByRole('button');
    const xBtn = allBtns.find(b => !b.textContent || b.textContent.trim() === '');
    if (xBtn) {
      fireEvent.click(xBtn);
    }

    // Render with null top_items, null rank, and 0 spend
    rerender(
      <CategoryTopItemsModal
        category={{ ...sampleCategory, rank: undefined, top_items: undefined as any, total_3yr_spend_inr_cr: 0 }}
        isOpen={true}
        onClose={vi.fn()}
        totalEvaluatedSpendInrCr={732.41}
      />
    );
  });
});
