/**
 * Coverage tests for OpportunityExclusionLedgerView: summary totals, reason filter, and the empty state.
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OpportunityExclusionLedgerView } from '../../../src/components/module2/OpportunityExclusionLedgerView';
import type { OpportunityExclusionLedgerEntry } from '../../../src/types/module2EvidenceChain';

const LEDGER: OpportunityExclusionLedgerEntry[] = [
  {
    transactionId: 'TX-EX-1',
    poNumber: 'PO-STL-0999',
    supplierName: 'Local Fabricator Co',
    itemDescription: 'IS 2062 E250 BR Plate 6mm offcut',
    spendInr: 2000000,
    quantity: 80,
    unitPrice: 25000,
    uom: 'MT',
    exclusionCode: 'EXCLUDED_LOW_VOLUME',
    exclusionDetail: 'Order volume below 1% threshold'
  },
  {
    transactionId: 'TX-EX-2',
    poNumber: 'PO-STL-1010',
    supplierName: 'Regional Mill Pvt Ltd',
    itemDescription: 'IS 2062 E250 BR Plate 16mm',
    spendInr: 3000000,
    quantity: 48,
    unitPrice: 62500,
    uom: 'MT',
    exclusionCode: 'EXCLUDED_CONTRACT_LOCK',
    exclusionDetail: 'Covered by an active supply contract until March'
  },
  {
    transactionId: 'TX-EX-3',
    poNumber: 'PO-STL-1011',
    supplierName: 'Regional Mill Pvt Ltd',
    itemDescription: 'IS 2062 E250 BR Plate 20mm',
    spendInr: 5000000,
    quantity: 80,
    unitPrice: 62500,
    uom: 'MT',
    exclusionCode: 'EXCLUDED_CONTRACT_LOCK',
    exclusionDetail: 'Covered by an active supply contract until March'
  }
];

describe('OpportunityExclusionLedgerView coverage', () => {
  it('renders an empty state without a table or filter when there are no exclusions', () => {
    render(<OpportunityExclusionLedgerView />);

    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('treats an explicit empty ledger the same as a missing one', () => {
    render(<OpportunityExclusionLedgerView ledger={[]} />);

    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('shows total excluded spend in crores and one row per transaction', () => {
    render(<OpportunityExclusionLedgerView ledger={LEDGER} />);

    expect(screen.getByText(/₹1\.00 Cr/)).toBeInTheDocument();
    // One header row plus one row for each excluded transaction.
    expect(screen.getAllByRole('row')).toHaveLength(LEDGER.length + 1);
    expect(screen.getByText('PO-STL-0999')).toBeInTheDocument();
    expect(screen.getAllByText('₹62500.00/MT')).toHaveLength(2);
  });

  it('filters rows by exclusion reason and restores every row for the all option', () => {
    render(<OpportunityExclusionLedgerView ledger={LEDGER} />);
    const reasonFilter = screen.getByRole('combobox');

    fireEvent.change(reasonFilter, { target: { value: 'EXCLUDED_CONTRACT_LOCK' } });

    expect(screen.queryByText('PO-STL-0999')).not.toBeInTheDocument();
    expect(screen.getByText('PO-STL-1010')).toBeInTheDocument();
    expect(screen.getByText('PO-STL-1011')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(3);

    fireEvent.change(reasonFilter, { target: { value: 'ALL' } });

    expect(screen.getByText('PO-STL-0999')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(LEDGER.length + 1);
  });

  it('lists each reason in the filter with the number of matching transactions', () => {
    render(<OpportunityExclusionLedgerView ledger={LEDGER} />);

    expect(screen.getByRole('option', { name: /EXCLUDED_LOW_VOLUME \(1\)/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /EXCLUDED_CONTRACT_LOCK \(2\)/ })).toBeInTheDocument();
  });
});
