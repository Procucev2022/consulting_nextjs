import React from 'react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReassignModal } from '../../../src/components/modals/ReassignModal';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import { unspscOfficialDictionary } from '../../../src/data/unspscTaxonomy';
import { taxonomyRecords } from '../../fixtures/taxonomy';

// tests/setup.ts already seeds the shared catalog. Replace it so every fixture record appears exactly once.
beforeAll(() => { unspscOfficialDictionary.splice(0, unspscOfficialDictionary.length, ...taxonomyRecords); });

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
    const target = taxonomyRecords[0];

    render(
      <ReassignModal
        item={sampleItem}
        isOpen
        onClose={onClose}
        onSave={onSave}
      />
    );

    expect(screen.getByText(UI_STRINGS.modals.reassign.title)).toBeInTheDocument();
    expect(screen.getByText(sampleItem.raw_desc)).toBeInTheDocument();

    // Filter bucket
    const bucketSelect = screen.getByRole('combobox');
    fireEvent.change(bucketSelect, { target: { value: 'ALL' } });

    // Search query
    const searchInput = screen.getByPlaceholderText(UI_STRINGS.modals.reassign.searchPlaceholder);
    fireEvent.change(searchInput, { target: { value: 'boxwood' } });

    // Select the single matching commodity result
    const firstResult = screen.getByText(target.commodityTitle);
    fireEvent.click(firstResult);

    // Apply mapping
    const applyBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.modals.reassign.saveMapping, 'i') });
    fireEvent.click(applyBtn);

    expect(onSave).toHaveBeenCalledWith(
      sampleItem.mapping_id,
      target.commodityCode,
      `${target.coreBucket} (${target.commodityTitle})`,
      target.coreBucket
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('handles cancel button', () => {
    const onClose = vi.fn();
    render(
      <ReassignModal
        item={sampleItem}
        isOpen
        onClose={onClose}
        onSave={vi.fn()}
      />
    );

    const cancelBtn = screen.getByRole('button', { name: UI_STRINGS.common.cancel });
    fireEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('handles apply click without selecting a record', () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(
      <ReassignModal
        item={sampleItem}
        isOpen
        onClose={onClose}
        onSave={onSave}
      />
    );

    const applyBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.modals.reassign.saveMapping, 'i') });
    expect(applyBtn).toBeDisabled();
    fireEvent.click(applyBtn);
    expect(onSave).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('returns early when validation fails on empty mapping_id', () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(
      <ReassignModal
        item={{ ...sampleItem, mapping_id: '' }}
        isOpen
        onClose={onClose}
        onSave={onSave}
      />
    );

    const searchInput = screen.getByPlaceholderText(UI_STRINGS.modals.reassign.searchPlaceholder);
    fireEvent.change(searchInput, { target: { value: 'boxwood' } });
    const firstResult = screen.getByText(taxonomyRecords[0].commodityTitle);
    fireEvent.click(firstResult);

    const applyBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.modals.reassign.saveMapping, 'i') });
    fireEvent.click(applyBtn);
    expect(onSave).not.toHaveBeenCalled();
  });
});


