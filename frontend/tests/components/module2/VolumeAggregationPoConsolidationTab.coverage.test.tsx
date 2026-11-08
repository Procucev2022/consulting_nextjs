import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { VolumeAggregationPoConsolidationTab } from '../../../src/components/module2/VolumeAggregationPoConsolidationTab';
import { calculatePoConsolidation } from '../../../src/utils/step2Calculators';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import type { VolumeAggregationTransactionItem } from '../../../src/types/module2VolumeAggregation';
import type { LineItemMapping } from '../../../src/types';

vi.mock('../../../src/utils/step2Calculators', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/utils/step2Calculators')>();
  return {
    ...actual,
    calculatePoConsolidation: vi.fn(actual.calculatePoConsolidation)
  };
});

const populatedTransaction: VolumeAggregationTransactionItem = {
  id: 'TX-9',
  po_number: 'PO-9001',
  po_line: '10',
  po_date: '2026-03-04',
  vendor_code: 'VND-001',
  vendor_name: 'Polymer Resins Ltd',
  material_code: 'MAT-RESIN-01',
  material_desc: 'Polypropylene Homopolymer Grade A',
  quantity: 500,
  uom: 'MT',
  unit_price: 50000,
  total_spend_inr: 25000000,
  spend_category: 'Polymers',
  unspsc_code: '20101701'
};

const sparseTransaction: VolumeAggregationTransactionItem = {
  vendor_name: undefined,
  material_desc: undefined,
  quantity: undefined,
  unit_price: undefined,
  total_spend_inr: undefined
};

const mappedLineItems = (): LineItemMapping[] => {
  const [items] = vi.mocked(calculatePoConsolidation).mock.calls[0];
  return items;
};

describe('VolumeAggregationPoConsolidationTab coverage paths', () => {
  beforeEach(() => {
    vi.mocked(calculatePoConsolidation).mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it('shows the cadence note and skips the calculation when there are no transactions', () => {
    render(<VolumeAggregationPoConsolidationTab transactions={[]} />);

    expect(screen.getByText(UI_STRINGS.module2.volumeAggregation.poConsolidationSignalNote)).toBeInTheDocument();
    expect(calculatePoConsolidation).not.toHaveBeenCalled();
  });

  it('maps a populated transaction onto a consolidation line item using its own values', () => {
    render(<VolumeAggregationPoConsolidationTab transactions={[populatedTransaction]} />);

    expect(calculatePoConsolidation).toHaveBeenCalledTimes(1);
    expect(mappedLineItems()[0]).toMatchObject({
      line_item_id: 'TX-9',
      po_number: 'PO-9001',
      material_code: 'MAT-RESIN-01',
      material_desc: 'Polypropylene Homopolymer Grade A',
      master_supplier_id: 'VND-001',
      unspsc_code: '20101701',
      unspsc_category_name: 'Polymers',
      invoice_date: '2026-03-04',
      qty: 500,
      unit_price: 50000,
      total_spend: 25000000,
      inr_crores: 2.5
    });
  });

  it('fills in safe defaults for a transaction that omits descriptive and numeric fields', () => {
    render(<VolumeAggregationPoConsolidationTab transactions={[sparseTransaction]} />);

    const [lineItem] = mappedLineItems();
    expect(lineItem).toMatchObject({
      line_item_id: 'TX-1',
      material_code: 'MAT-1',
      po_number: 'PO-1',
      qty: 1,
      unit_price: 0,
      total_spend: 0,
      amount_inr: 0
    });
    expect(lineItem.material_desc).toBeTruthy();
    expect(lineItem.raw_desc).toBeTruthy();
    expect(lineItem.vendor_identified).toBeTruthy();
    expect(lineItem.master_supplier_id).toBeTruthy();
    expect(lineItem.unspsc_code).toBeTruthy();
    expect(lineItem.unspsc_category_name).toBeTruthy();
    expect(lineItem.invoice_date).toBeTruthy();
  });

  it('keeps the cadence note on screen alongside the consolidation section for populated input', () => {
    render(<VolumeAggregationPoConsolidationTab transactions={[populatedTransaction, sparseTransaction]} />);

    expect(screen.getByText(UI_STRINGS.module2.volumeAggregation.poConsolidationSignalNote)).toBeInTheDocument();
    expect(mappedLineItems()).toHaveLength(2);
  });
});
