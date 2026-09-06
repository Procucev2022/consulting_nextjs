import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReassignModal } from '../../../src/components/modals/ReassignModal';

describe('ReassignModal Component', () => {
  const sampleItem = {
    mapping_id: 'MAP-1',
    line_item_id: 'LINE-1',
    raw_desc: 'Packaging Cartons corrugated',
    vendor_identified: 'Amcor Packaging',
    total_spend: 54000,
    unspsc_code: '14111500',
    unspsc_category_name: 'Corrugated Paper/Cartons',
    core_bucket: 'Packaging Materials' as const,
    ai_confidence: 95,
    status: 'Pending Review' as const,
    unit_price: 54,
    qty: 1000,
    invoice_date: '2024-05-10',
    po_number: 'PO-991'
  };


  it('renders null when not open or item is null', () => {
    const { container } = render(
      <ReassignModal
        item={null}
        isOpen={false}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders and allows searching taxonomy, changing bucket filter, selecting record, and saving', () => {
    const onSave = vi.fn();
    const onClose = vi.fn();

    render(
      <ReassignModal
        item={sampleItem}
        isOpen={true}
        onClose={onClose}
        onSave={onSave}
      />
    );

    expect(screen.getByText('Modify Column L Commodity Code')).toBeInTheDocument();
    expect(screen.getByText(sampleItem.raw_desc)).toBeInTheDocument();

    // Filter bucket
    const bucketSelect = screen.getByRole('combobox');
    fireEvent.change(bucketSelect, { target: { value: 'ALL' } });

    // Search query
    const searchInput = screen.getByPlaceholderText(/Search Column L code/i);
    fireEvent.change(searchInput, { target: { value: 'boxwood' } });

    // Select first commodity result
    const firstResult = screen.getByText(/boxwood/i);
    fireEvent.click(firstResult);

    // Apply mapping
    const applyBtn = screen.getByRole('button', { name: /Apply Column L Mapping/i });
    fireEvent.click(applyBtn);

    expect(onSave).toHaveBeenCalledWith(
      sampleItem.mapping_id,
      expect.any(String),
      expect.any(String),
      expect.any(String)
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('handles cancel button', () => {
    const onClose = vi.fn();
    render(
      <ReassignModal
        item={sampleItem}
        isOpen={true}
        onClose={onClose}
        onSave={vi.fn()}
      />
    );

    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalled();
  });
});
