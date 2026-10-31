import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FixCurrencyModal } from '../../../src/components/modals/FixCurrencyModal';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import { apiClient } from '../../../src/utils/api';

vi.mock('../../../src/utils/api', () => ({
  apiClient: { getCurrencyRates: vi.fn(), getCurrencyConversion: vi.fn() }
}));

vi.mock('../../../src/utils/logger', () => ({
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() }
}));

const sampleRec = {
  record_id: 'REC-TEST-001', transaction_date: '2025-01-15', po_number: 'PO-TEST-1001',
  vendor_name: 'Acme Chemical Global LLC', amount: 50000, raw_currency: 'USD', spend_year: 2025,
  core_category: 'Direct Chemicals'
} as never;

const currencyCatalog = {
  AED: { currencyCode: 'AED', name: 'UAE Dirham', currentRate: 23, lastUpdated: '2026-10-30' },
  EUR: { currencyCode: 'EUR', name: 'Euro', currentRate: 90, lastUpdated: '2026-10-30' },
  GBP: { currencyCode: 'GBP', name: 'British Pound', currentRate: 106, lastUpdated: '2026-10-30' },
  INR: { currencyCode: 'INR', name: 'Indian Rupee', currentRate: 1, lastUpdated: null },
  JPY: { currencyCode: 'JPY', name: 'Japanese Yen', currentRate: 0.58, lastUpdated: '2026-10-30' },
  SGD: { currencyCode: 'SGD', name: 'Singapore Dollar', currentRate: 64, lastUpdated: '2026-10-30' },
  USD: { currencyCode: 'USD', name: 'US Dollar', currentRate: 84, lastUpdated: '2026-10-30' }
};

const conversionFor = (fromCurrency: string, amount: number) => ({
  amount, fromCurrency, amountINR: amount * 84, exchangeRate: 84, rateDate: '2025-01-15'
});

describe('FixCurrencyModal Component', () => {
  beforeEach(() => {
    vi.mocked(apiClient.getCurrencyRates).mockResolvedValue(currencyCatalog);
    vi.mocked(apiClient.getCurrencyConversion).mockImplementation(async (currency, amount) => conversionFor(currency, amount));
  });

  it('renders null when the modal is closed or has no record', () => {
    const { container } = render(<FixCurrencyModal record={null} isOpen={false} onClose={vi.fn()} onFix={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('loads available currencies and transaction-date conversions from D1 before applying a correction', async () => {
    const onFix = vi.fn();
    const onClose = vi.fn();
    render(<FixCurrencyModal record={sampleRec} isOpen onClose={onClose} onFix={onFix} />);

    expect(await screen.findByRole('button', { name: 'EUR' })).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.modals.fixCurrency.fxEngineBadge)).toBeInTheDocument();
    expect(screen.getByText('2025-01-15')).toBeInTheDocument();
    expect(await screen.findByText(UI_STRINGS.modals.fixCurrency.asOnDateFromD1('2025-01-15'))).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'EUR' }));
    await waitFor(() => expect(apiClient.getCurrencyConversion).toHaveBeenLastCalledWith('EUR', 50000, '2025-01-15'));
    await waitFor(() => expect(screen.getByRole('button', { name: UI_STRINGS.modals.fixCurrency.applyConversion })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.modals.fixCurrency.applyConversion }));

    expect(onFix).toHaveBeenCalledWith('REC-TEST-001', 'EUR', 4_200_000);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('shows actionable D1 errors and prevents applying an unpriced currency', async () => {
    vi.mocked(apiClient.getCurrencyRates).mockRejectedValueOnce(new Error(UI_STRINGS.module1.fxReferenceUnavailable));
    render(<FixCurrencyModal record={sampleRec} isOpen onClose={vi.fn()} onFix={vi.fn()} />);
    expect(await screen.findByRole('alert')).toHaveTextContent(UI_STRINGS.module1.fxReferenceUnavailable);
    expect(screen.getByRole('button', { name: UI_STRINGS.modals.fixCurrency.applyConversion })).toBeDisabled();
  });

  it('uses the D1 base currency for records without a currency code and handles close/cancel', async () => {
    const onClose = vi.fn();
    const minimalRecord = { record_id: 'MIN-1', po_number: 'PO-MIN', vendor_name: 'Min Vendor', amount: 1000 } as never;
    render(<FixCurrencyModal record={minimalRecord} isOpen onClose={onClose} onFix={vi.fn()} />);
    expect(await screen.findByRole('button', { name: 'INR' })).toBeInTheDocument();
    expect(apiClient.getCurrencyConversion).toHaveBeenCalledWith('INR', 1000, undefined);
    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.common.cancel }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('uses the actionable fallback when the D1 catalog rejects with a non-Error value', async () => {
    vi.mocked(apiClient.getCurrencyRates).mockRejectedValueOnce('catalog unavailable');
    render(<FixCurrencyModal record={sampleRec} isOpen onClose={vi.fn()} onFix={vi.fn()} />);

    expect(await screen.findByRole('alert')).toHaveTextContent(UI_STRINGS.module1.fxReferenceUnavailable);
    expect(screen.getByRole('button', { name: UI_STRINGS.modals.fixCurrency.applyConversion })).toBeDisabled();
  });
});
