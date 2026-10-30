import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { ReassignModal } from '../../../src/components/modals/ReassignModal';
import { UI_STRINGS, TAXONOMY_MODAL_RESULT_LIMIT } from '../../../src/constants';
import { unspscOfficialDictionary } from '../../../src/data/unspscTaxonomy';
import { useUNSPSCTaxonomy } from '../../../src/hooks/useUNSPSCTaxonomy';
import type { LineItemMapping } from '../../../src/types';
import { taxonomyRecords } from '../../fixtures/taxonomy';

vi.mock('../../../src/hooks/useUNSPSCTaxonomy', () => ({
  useUNSPSCTaxonomy: vi.fn()
}));

const modalStrings = UI_STRINGS.modals.reassign;
const mockedTaxonomyHook = vi.mocked(useUNSPSCTaxonomy);

const sampleItem: LineItemMapping = {
  mapping_id: 'MAP-1',
  line_item_id: 'LINE-1',
  raw_desc: 'Packaging Cartons corrugated',
  vendor_identified: 'Amcor Packaging',
  unspsc_code: '14111500',
  unspsc_category_name: 'Corrugated Paper/Cartons',
  core_bucket: 'Packaging Materials',
  ai_confidence: 95,
  status: 'Pending Review',
  unit_price: 54,
  qty: 1000,
  total_spend: 54000,
  invoice_date: '2024-05-10',
  po_number: 'PO-991'
};

const giftRecord = taxonomyRecords.find((record) => record.commodityCode === '14111601');
const bleachedRecord = taxonomyRecords.find((record) => record.commodityCode === '14121501');
const boardRecord = taxonomyRecords.find((record) => record.commodityCode === '14121502');

const renderModal = (props: Partial<React.ComponentProps<typeof ReassignModal>> = {}) => {
  const onClose = vi.fn();
  const onSave = vi.fn();
  const view = render(
    <ReassignModal
      item={sampleItem}
      isOpen
      onClose={onClose}
      onSave={onSave}
      {...props}
    />
  );
  return { ...view, onClose, onSave };
};

const applyButton = (): HTMLElement => screen.getByRole('button', { name: modalStrings.saveMapping });

describe('ReassignModal coverage', () => {
  beforeAll(() => {
    // Replace the catalog seeded by tests/setup.ts so each fixture record appears exactly once.
    unspscOfficialDictionary.splice(0, unspscOfficialDictionary.length, ...taxonomyRecords);
  });

  beforeEach(() => {
    mockedTaxonomyHook.mockReset();
    mockedTaxonomyHook.mockReturnValue({ isLoading: false, error: null });
  });

  it('renders nothing when the modal is open without a line item and does not request the catalog', () => {
    const { container } = renderModal({ item: null });

    expect(container.firstChild).toBeNull();
    expect(mockedTaxonomyHook).toHaveBeenLastCalledWith(false);
  });

  it('requests the catalog while the modal is open for a line item', () => {
    renderModal();
    expect(mockedTaxonomyHook).toHaveBeenLastCalledWith(true);
  });

  it('shows the catalog loading status while the taxonomy loads', () => {
    mockedTaxonomyHook.mockReturnValue({ isLoading: true, error: null });
    renderModal();

    expect(screen.getByRole('status')).toHaveTextContent(UI_STRINGS.taxonomyData.loading);
  });

  it('shows the catalog load error as an alert', () => {
    const message = UI_STRINGS.taxonomyData.loadFailed(UI_STRINGS.taxonomyData.httpFailure(503), 'request-1');
    mockedTaxonomyHook.mockReturnValue({ isLoading: false, error: message });
    renderModal();

    expect(screen.getByRole('alert')).toHaveTextContent(message);
  });

  it('shows the vendor and spend labels for the line item', () => {
    renderModal();

    expect(screen.getByText(modalStrings.vendorLabel('Amcor Packaging'))).toBeInTheDocument();
    expect(screen.getByText(modalStrings.spendLabel((54000).toLocaleString()))).toBeInTheDocument();
  });

  it('limits the search results to the configured maximum', () => {
    renderModal();

    expect(screen.getAllByText(/ > /)).toHaveLength(TAXONOMY_MODAL_RESULT_LIMIT);
  });

  it('filters the results by core bucket and restores them when the bucket returns to all', () => {
    renderModal();
    const bucketSelect = screen.getByRole('combobox');
    const searchInput = screen.getByPlaceholderText(modalStrings.searchPlaceholder);

    fireEvent.change(searchInput, { target: { value: 'gift' } });
    expect(screen.getByText(giftRecord?.commodityTitle ?? '')).toBeInTheDocument();
    expect(screen.getByText(modalStrings.hierarchyPath(
      giftRecord?.segmentTitle ?? '',
      giftRecord?.familyTitle ?? '',
      giftRecord?.classTitle ?? ''
    ))).toBeInTheDocument();

    fireEvent.change(bucketSelect, { target: { value: 'Direct Materials' } });
    expect(screen.queryByText(giftRecord?.commodityTitle ?? '')).not.toBeInTheDocument();

    fireEvent.change(bucketSelect, { target: { value: 'ALL' } });
    expect(screen.getByText(giftRecord?.commodityTitle ?? '')).toBeInTheDocument();
  });

  it('keeps Apply disabled until a record is selected, then saves the selected mapping', () => {
    const { onSave, onClose } = renderModal();
    fireEvent.change(screen.getByPlaceholderText(modalStrings.searchPlaceholder), { target: { value: 'gift' } });

    expect(applyButton()).toBeDisabled();
    fireEvent.click(screen.getByText(giftRecord?.commodityTitle ?? ''));
    expect(applyButton()).toBeEnabled();

    fireEvent.click(applyButton());
    expect(onSave).toHaveBeenCalledWith(
      'MAP-1',
      giftRecord?.commodityCode,
      `${giftRecord?.coreBucket} (${giftRecord?.commodityTitle})`,
      giftRecord?.coreBucket
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('replaces the selection when another record is clicked', () => {
    const { onSave } = renderModal();
    fireEvent.change(screen.getByPlaceholderText(modalStrings.searchPlaceholder), { target: { value: 'paperboard' } });

    fireEvent.click(screen.getByText(bleachedRecord?.commodityTitle ?? ''));
    fireEvent.click(screen.getByText(boardRecord?.commodityTitle ?? ''));
    fireEvent.click(applyButton());

    expect(onSave).toHaveBeenCalledWith('MAP-1', boardRecord?.commodityCode, expect.any(String), boardRecord?.coreBucket);
  });

  it('closes from the header close button and from the cancel button', () => {
    const { onClose } = renderModal();

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.common.close }));
    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.common.cancel }));

    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('does not save or close when the mapping id fails validation', () => {
    const { onSave, onClose } = renderModal({ item: { ...sampleItem, mapping_id: '' } });
    fireEvent.change(screen.getByPlaceholderText(modalStrings.searchPlaceholder), { target: { value: 'gift' } });
    fireEvent.click(screen.getByText(giftRecord?.commodityTitle ?? ''));
    fireEvent.click(applyButton());

    expect(onSave).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
