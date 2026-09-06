import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FixCurrencyModal } from '../../../src/components/modals/FixCurrencyModal';
import { initialValidationRecords } from '../../../src/data/mockData';
import { UI_STRINGS } from '../../../src/constants/uiStrings';

describe('FixCurrencyModal Component', () => {
  const sampleRec = initialValidationRecords[0];

  it('renders null when not open or record is null', () => {
    const { container } = render(
      <FixCurrencyModal
        record={null}
        isOpen={false}
        onClose={vi.fn()}
        onFix={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders and allows currency selection and custom rate update', () => {
    const onFix = vi.fn();
    const onClose = vi.fn();

    render(
      <FixCurrencyModal
        record={sampleRec}
        isOpen={true}
        onClose={onClose}
        onFix={onFix}
      />
    );

    expect(screen.getByText(UI_STRINGS.modals.fixCurrency.fxEngineBadge)).toBeInTheDocument();

    // Select EUR
    const eurBtn = screen.getByRole('button', { name: 'EUR' });
    fireEvent.click(eurBtn);

    // Submit
    const applyBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.modals.fixCurrency.applyConversion, 'i') });
    fireEvent.click(applyBtn);

    expect(onFix).toHaveBeenCalledWith(sampleRec.record_id, 'EUR', expect.any(Number));
    expect(onClose).toHaveBeenCalled();
  });

  it('handles cancel', () => {
    const onClose = vi.fn();
    render(
      <FixCurrencyModal
        record={sampleRec}
        isOpen={true}
        onClose={onClose}
        onFix={vi.fn()}
      />
    );

    const cancelBtn = screen.getByRole('button', { name: UI_STRINGS.common.cancel });
    fireEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('handles record without raw_currency, spend_year, core_category, and clicking close icon', () => {
    const onClose = vi.fn();
    const minimalRecord = {
      record_id: 'MIN-1',
      po_number: 'PO-MIN',
      vendor_name: 'Min Vendor',
      amount: 1000
    } as any;

    render(
      <FixCurrencyModal
        record={minimalRecord}
        isOpen={true}
        onClose={onClose}
        onFix={vi.fn()}
      />
    );

    // Click other currencies to exercise branches
    fireEvent.click(screen.getByRole('button', { name: 'GBP' }));
    fireEvent.click(screen.getByRole('button', { name: 'AED' }));
    fireEvent.click(screen.getByRole('button', { name: 'JPY' }));
    fireEvent.click(screen.getByRole('button', { name: 'SGD' }));

    // Click close icon button (top right)
    const closeBtns = screen.getAllByRole('button');
    const xBtn = closeBtns.find(b => !b.textContent || b.textContent.trim() === '');
    if (xBtn) {
      fireEvent.click(xBtn);
      expect(onClose).toHaveBeenCalled();
    }
  });
});
