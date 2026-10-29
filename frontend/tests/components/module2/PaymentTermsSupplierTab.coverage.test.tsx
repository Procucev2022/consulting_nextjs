/**
 * Coverage tests for PaymentTermsSupplierTab: supplier profile rows and availability badges, the transaction
 * register with its coverage badges and gap labels, search on each field, and the top-100 cap.
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { PaymentTermsSupplierTab } from '../../../src/components/module2/PaymentTermsSupplierTab';
import type {
  PaymentTermsRecordCoverage,
  SupplierPaymentTermsProfile
} from '../../../src/types/module2PaymentTerms';

const SUPPLIERS: SupplierPaymentTermsProfile[] = [
  {
    supplierCode: 'V-2041',
    supplierName: 'Acme Fibers Ltd',
    spendCategory: 'RAW-FIBER',
    totalSpendInr: 500000000,
    totalSpendCr: 50,
    transactionCount: 120,
    observedPaymentTerms: ['Net 30', 'Net 45'],
    primaryPaymentTerms: 'Net 30',
    weightedAvgCreditDays: 38,
    dataAvailability: 'OPPORTUNITY_IDENTIFIED',
    indicativeWorkingCapitalReleasedCr: 2,
    indicativeFinancingBenefitCr: 0.15,
    earlyPaymentDiscountOpportunityCr: 0,
    requiresValidation: false
  },
  {
    supplierCode: 'V-3317',
    supplierName: 'Bharat Packaging Co',
    spendCategory: 'PACK-MAT',
    totalSpendInr: 120000000,
    totalSpendCr: 12,
    transactionCount: 45,
    observedPaymentTerms: [],
    primaryPaymentTerms: 'Not Found in Source Data',
    weightedAvgCreditDays: 0,
    dataAvailability: 'DATA_UNAVAILABLE',
    indicativeWorkingCapitalReleasedCr: 0,
    indicativeFinancingBenefitCr: 0,
    earlyPaymentDiscountOpportunityCr: 0,
    requiresValidation: true
  },
  {
    supplierCode: 'V-5520',
    supplierName: 'Coastal Logistics Pvt Ltd',
    spendCategory: 'FREIGHT-SVC',
    totalSpendInr: 30000000,
    totalSpendCr: 3,
    transactionCount: 18,
    observedPaymentTerms: ['Net 60'],
    primaryPaymentTerms: 'Net 60',
    weightedAvgCreditDays: 45,
    dataAvailability: 'DATA_PARTIALLY_AVAILABLE',
    indicativeWorkingCapitalReleasedCr: 0.1,
    indicativeFinancingBenefitCr: 0.01,
    earlyPaymentDiscountOpportunityCr: 0,
    requiresValidation: false
  }
];

function buildRecord(overrides: Partial<PaymentTermsRecordCoverage>): PaymentTermsRecordCoverage {
  const base: PaymentTermsRecordCoverage = {
    recordId: 'TX-1',
    vendorCode: 'V-2041',
    vendorName: 'Acme Fibers Ltd',
    poNumber: 'PO-1001',
    poDate: '2024-01-15',
    spendInr: 500000,
    rawPaymentTerms: 'Net 30',
    parsedCreditDays: 30,
    hasDiscountTerms: false,
    coverageStatus: 'COMPLETE',
    requiresValidation: false
  };
  return { ...base, ...overrides };
}

const RECORDS: PaymentTermsRecordCoverage[] = [
  buildRecord({}),
  buildRecord({
    recordId: 'TX-2',
    vendorCode: 'V-3317',
    vendorName: 'Bharat Packaging Co',
    poNumber: 'PO-1002',
    rawPaymentTerms: undefined,
    parsedCreditDays: undefined,
    coverageStatus: 'PARTIAL',
    gapReason: 'INCONSISTENT_HEADER_AND_LINE_TERMS',
    requiresValidation: true
  }),
  buildRecord({
    recordId: 'TX-3',
    vendorCode: 'V-5520',
    vendorName: 'Coastal Logistics Pvt Ltd',
    poNumber: 'PO-1003',
    rawPaymentTerms: undefined,
    parsedCreditDays: undefined,
    coverageStatus: 'MISSING',
    gapReason: 'FIELD_NOT_IN_SOURCE_ERP'
  })
];

function getRow(text: string): HTMLElement {
  return screen.getAllByRole('row').find((row) => row.textContent?.includes(text));
}

function openTransactionRegister(): void {
  // The tab has exactly two toggle buttons: supplier profiles first, transaction register second.
  fireEvent.click(screen.getAllByRole('button')[1]);
}

describe('PaymentTermsSupplierTab coverage', () => {
  it('lists supplier profiles with observed terms, credit days, and availability', () => {
    render(<PaymentTermsSupplierTab supplierProfiles={SUPPLIERS} coverageRecords={RECORDS} />);

    expect(screen.getAllByRole('row')).toHaveLength(SUPPLIERS.length + 1);
    expect(within(getRow('Acme Fibers Ltd')).getByText('Net 30, Net 45')).toBeInTheDocument();
    expect(within(getRow('Acme Fibers Ltd')).getByText('38d')).toBeInTheDocument();
    expect(within(getRow('Acme Fibers Ltd')).getByText('OPPORTUNITY_IDENTIFIED')).toBeInTheDocument();
    expect(within(getRow('Coastal Logistics Pvt Ltd')).getByText('DATA_PARTIALLY_AVAILABLE')).toBeInTheDocument();
    expect(within(getRow('Bharat Packaging Co')).getByText('DATA_UNAVAILABLE')).toBeInTheDocument();
  });

  it('shows placeholders for a supplier with no observed terms and no credit days', () => {
    render(<PaymentTermsSupplierTab supplierProfiles={SUPPLIERS} coverageRecords={RECORDS} />);

    const row = getRow('Bharat Packaging Co');
    expect(within(row).getByText('Not Found in Source Data')).toBeInTheDocument();
    expect(within(row).getByText('—')).toBeInTheDocument();
  });

  it('filters suppliers by name, supplier code, or spend category', () => {
    render(<PaymentTermsSupplierTab supplierProfiles={SUPPLIERS} coverageRecords={RECORDS} />);
    const search = screen.getByRole('textbox');

    fireEvent.change(search, { target: { value: 'coastal' } });
    expect(screen.getAllByRole('row')).toHaveLength(2);

    fireEvent.change(search, { target: { value: 'V-2041' } });
    expect(getRow('Acme Fibers Ltd')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(2);

    fireEvent.change(search, { target: { value: 'pack-mat' } });
    expect(getRow('Bharat Packaging Co')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(2);

    fireEvent.change(search, { target: { value: 'no-such-supplier' } });
    expect(screen.getAllByRole('row')).toHaveLength(1);
  });

  it('switches to the transaction register and shows coverage status and gap labels', () => {
    render(<PaymentTermsSupplierTab supplierProfiles={SUPPLIERS} coverageRecords={RECORDS} />);

    openTransactionRegister();

    expect(screen.getAllByRole('row')).toHaveLength(RECORDS.length + 1);
    expect(within(getRow('PO-1001')).getByText('COMPLETE')).toBeInTheDocument();
    expect(within(getRow('PO-1002')).getByText('PARTIAL')).toBeInTheDocument();
    expect(within(getRow('PO-1003')).getByText('MISSING')).toBeInTheDocument();
    expect(within(getRow('PO-1002')).getByText('INCONSISTENT_HEADER_AND_LINE_TERMS')).toBeInTheDocument();
    expect(within(getRow('PO-1003')).getByText('FIELD_NOT_IN_SOURCE_ERP')).toBeInTheDocument();
    expect(within(getRow('PO-1002')).getByText('MISSING IN ERP')).toBeInTheDocument();
    expect(within(getRow('PO-1001')).getByText('None (Verified)')).toBeInTheDocument();
  });

  it('filters the transaction register by PO number or vendor name', () => {
    render(<PaymentTermsSupplierTab supplierProfiles={SUPPLIERS} coverageRecords={RECORDS} />);
    openTransactionRegister();
    const search = screen.getByRole('textbox');

    fireEvent.change(search, { target: { value: 'PO-1002' } });
    expect(screen.getAllByRole('row')).toHaveLength(2);
    expect(getRow('PO-1002')).toBeInTheDocument();

    fireEvent.change(search, { target: { value: 'coastal' } });
    expect(screen.getAllByRole('row')).toHaveLength(2);
    expect(getRow('PO-1003')).toBeInTheDocument();
  });

  it('returns from the transaction register to the supplier profiles', () => {
    render(<PaymentTermsSupplierTab supplierProfiles={SUPPLIERS} coverageRecords={RECORDS} />);
    openTransactionRegister();

    fireEvent.click(screen.getAllByRole('button')[0]);

    expect(getRow('Acme Fibers Ltd')).toBeInTheDocument();
    expect(screen.queryByText('PO-1001')).not.toBeInTheDocument();
  });

  it('caps the transaction register at the first 100 records', () => {
    const many = Array.from({ length: 120 }, (_, index) =>
      buildRecord({ recordId: `TX-${index}`, poNumber: `PO-${index}` })
    );
    render(<PaymentTermsSupplierTab supplierProfiles={SUPPLIERS} coverageRecords={many} />);

    openTransactionRegister();

    expect(screen.getAllByRole('row')).toHaveLength(101);
  });
});
