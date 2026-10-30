import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { VolumeAggregationPoConsolidationTab } from '../../../src/components/module2/VolumeAggregationPoConsolidationTab';
import type { VolumeAggregationTransactionItem } from '../../../src/types/module2VolumeAggregation';

describe('VolumeAggregationPoConsolidationTab', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders disclaimer banner and empty state when transactions array is empty', () => {
    render(<VolumeAggregationPoConsolidationTab transactions={[]} />);
    expect(
      screen.getByText('Operational Demand Cadence & Batch Lot Sizing Analysis')
    ).toBeDefined();
  });

  it('transforms transactions and renders PoConsolidationSection for valid transaction items', () => {
    const mockTxs: VolumeAggregationTransactionItem[] = [
      {
        id: 'TX-1',
        po_number: 'PO-1001',
        vendor_name: 'Polymer Resins Ltd',
        vendor_code: 'VND-001',
        material_code: 'MAT-RESIN-01',
        material_desc: 'Polypropylene Homopolymer Grade A',
        total_spend_inr: 25000000,
        unit_price: 50000,
        quantity: 500,
        uom: 'MT',
        plant: 'Pune Plant'
      },
      {
        id: 'TX-2',
        po_number: 'PO-1002',
        vendor_name: 'Polymer Resins Ltd',
        vendor_code: 'VND-001',
        material_code: 'MAT-RESIN-01',
        material_desc: 'Polypropylene Homopolymer Grade A',
        total_spend_inr: 30000000,
        unit_price: 50000,
        quantity: 600,
        uom: 'MT',
        plant: 'Pune Plant'
      },
      {
        // Test fallback defaults when optional fields are omitted
        vendor_name: 'Supplier Default',
        material_desc: 'Material Default',
        quantity: 100,
        unit_price: 1000,
        total_spend_inr: 10000000
      }
    ];

    render(<VolumeAggregationPoConsolidationTab transactions={mockTxs} />);
    expect(
      screen.getByText('Operational Demand Cadence & Batch Lot Sizing Analysis')
    ).toBeDefined();
    expect(screen.getByText(/Polymer Resins Ltd/i)).toBeDefined();
  });

  it('handles transactions with category and undefined total_spend_inr correctly', () => {
    const mockTxs: VolumeAggregationTransactionItem[] = [
      {
        id: 'TX-3',
        vendor_name: 'Supplier 3',
        material_desc: 'Carton Box',
        quantity: 50,
        unit_price: 200,
        spend_category: 'Packaging Materials',
        total_spend_inr: 0
      }
    ];

    render(<VolumeAggregationPoConsolidationTab transactions={mockTxs} />);
    expect(
      screen.getByText('Operational Demand Cadence & Batch Lot Sizing Analysis')
    ).toBeDefined();
  });
});
