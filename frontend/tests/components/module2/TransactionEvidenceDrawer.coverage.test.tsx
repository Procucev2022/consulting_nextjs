import { render, screen, fireEvent, within, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { TransactionEvidenceDrawer } from '../../../src/components/module2/TransactionEvidenceDrawer';
import type { TransactionEvidenceRecord } from '../../../src/types/module2EvidenceChain';
import { buildTransactionEvidenceRecords } from '../../fixtures/module2CoverageFixtures';

const CATEGORY_NAME = 'Structural Steel Plates';
const SELECTED_CLASS = 'bg-cyan-50/70';

const excludedRecord: TransactionEvidenceRecord = {
  transactionId: 'TX-STL-004',
  poNumber: 'PO-STL-1004',
  poDate: '2026-02-18',
  supplierId: 'SUP-LFC-004',
  supplierName: 'Local Fabricator Co',
  category: 'Structural Steel Plates',
  subCategory: 'Hot Rolled Plates',
  itemId: 'ITEM-IS2062-06',
  itemDescription: 'IS 2062 E250 BR Plate 6mm offcut',
  specification: 'IS 2062 E250 BR',
  grade: 'E250 BR',
  uom: 'MT',
  quantity: 1.5,
  unitPrice: 25000,
  currency: 'INR',
  totalValue: 37500,
  deliveryLocation: 'Plant Pune',
  contractStatus: 'NO_CONTRACT',
  contractReference: 'NONE',
  paymentTerms: 'Net 30 Days',
  incoterm: 'EXW Plant Gate',
  sourceDocument: 'ERP_PURCHASE_ORDER',
  sourceRow: 4,
  dataQualityStatus: 'SUSPECT',
  comparabilityStatus: 'EXCLUDED',
  isEligible: false,
  exclusionReason: 'EXCLUDED_SPEC_MISMATCH',
  exclusionExplanation: 'Offcut thickness differs from the 10 mm specification.'
};

const records: TransactionEvidenceRecord[] = [...buildTransactionEvidenceRecords(), excludedRecord];

const rowFor = (poNumber: string): HTMLElement => {
  const row = screen.getByText(poNumber).closest('tr');
  if (!row) {
    throw new Error(`No transaction row contains "${poNumber}"`);
  }
  return row;
};

const iconOnlyButtons = (): HTMLElement[] =>
  screen.getAllByRole('button').filter((button) => (button.textContent ?? '').trim() === '');

describe('TransactionEvidenceDrawer coverage paths', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders nothing while the drawer is closed', () => {
    render(<TransactionEvidenceDrawer isOpen={false} onClose={vi.fn()} categoryName={CATEGORY_NAME} records={records} />);

    expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument();
  });

  it('lists every transaction under the category heading before any row is selected', () => {
    render(<TransactionEvidenceDrawer isOpen onClose={vi.fn()} categoryName={CATEGORY_NAME} records={records} />);

    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(CATEGORY_NAME);
    expect(screen.getAllByRole('row')).toHaveLength(records.length + 1);
    records.forEach((record) => expect(screen.getByText(record.poNumber)).toBeInTheDocument());
    expect(screen.queryByText('TX-STL-001')).not.toBeInTheDocument();
  });

  it('filters the rows by the chosen supplier', () => {
    render(<TransactionEvidenceDrawer isOpen onClose={vi.fn()} categoryName={CATEGORY_NAME} records={records} />);
    const supplierPicker = screen.getByRole('combobox');

    fireEvent.change(supplierPicker, { target: { value: 'JSW Steel Ltd' } });
    expect(screen.getAllByRole('row')).toHaveLength(2);
    expect(screen.getByText('PO-STL-1002')).toBeInTheDocument();

    fireEvent.change(supplierPicker, { target: { value: 'ALL' } });
    expect(screen.getAllByRole('row')).toHaveLength(records.length + 1);
  });

  it('lists each supplier once in the picker with its transaction count', () => {
    render(<TransactionEvidenceDrawer isOpen onClose={vi.fn()} categoryName={CATEGORY_NAME} records={records} />);
    const supplierPicker = screen.getByRole('combobox');

    expect(within(supplierPicker).getByRole('option', { name: 'JSW Steel Ltd (1)' })).toBeInTheDocument();
    expect(within(supplierPicker).getByRole('option', { name: 'Local Fabricator Co (1)' })).toBeInTheDocument();
  });

  it('searches across PO number, item description, and supplier name regardless of case', () => {
    render(<TransactionEvidenceDrawer isOpen onClose={vi.fn()} categoryName={CATEGORY_NAME} records={records} />);
    const searchBox = screen.getByRole('textbox');

    fireEvent.change(searchBox, { target: { value: 'po-stl-1003' } });
    expect(screen.getAllByRole('row')).toHaveLength(2);
    expect(screen.getByText('PO-STL-1003')).toBeInTheDocument();

    fireEvent.change(searchBox, { target: { value: 'offcut' } });
    expect(screen.getAllByRole('row')).toHaveLength(2);
    expect(screen.getByText('PO-STL-1004')).toBeInTheDocument();

    fireEvent.change(searchBox, { target: { value: 'JINDAL' } });
    expect(screen.getAllByRole('row')).toHaveLength(2);
    expect(screen.getByText('PO-STL-1003')).toBeInTheDocument();

    fireEvent.change(searchBox, { target: { value: 'no matching record' } });
    expect(screen.getAllByRole('row')).toHaveLength(1);
  });

  it('shows the source trace for a selected transaction and highlights its row', () => {
    render(<TransactionEvidenceDrawer isOpen onClose={vi.fn()} categoryName={CATEGORY_NAME} records={records} />);

    fireEvent.click(screen.getByText('PO-STL-1001'));

    expect(screen.getByText('TX-STL-001')).toBeInTheDocument();
    expect(screen.getByText(/ERP_PURCHASE_ORDER/)).toBeInTheDocument();
    expect(rowFor('PO-STL-1001')).toHaveClass(SELECTED_CLASS);
    expect(rowFor('PO-STL-1002')).not.toHaveClass(SELECTED_CLASS);
  });

  it('shows the exclusion reason when an ineligible transaction is selected', () => {
    render(<TransactionEvidenceDrawer isOpen onClose={vi.fn()} categoryName={CATEGORY_NAME} records={records} />);

    fireEvent.click(screen.getByText('PO-STL-1004'));

    expect(screen.getByText(/EXCLUDED_SPEC_MISMATCH/)).toBeInTheDocument();
    expect(screen.getByText('TX-STL-004')).toBeInTheDocument();
  });

  it('shows the empty population when no records are supplied', () => {
    render(<TransactionEvidenceDrawer isOpen onClose={vi.fn()} categoryName={CATEGORY_NAME} />);

    expect(screen.getAllByRole('row')).toHaveLength(1);
    expect(screen.getByRole('combobox')).toHaveValue('ALL');
  });

  it('closes from the header control and the footer button', () => {
    const onClose = vi.fn();
    render(<TransactionEvidenceDrawer isOpen onClose={onClose} categoryName={CATEGORY_NAME} records={records} />);

    const [headerCloseButton] = iconOnlyButtons();
    fireEvent.click(headerCloseButton);
    fireEvent.click(screen.getByRole('button', { name: /close drawer/i }));

    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
