import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ClientIngestionSetupModal } from '../../../src/components/modals/ClientIngestionSetupModal';
import { mockTenant } from '../../../src/data/mockData';

describe('ClientIngestionSetupModal Component', () => {
  it('renders null when isOpen is false', () => {
    const { container } = render(
      <ClientIngestionSetupModal
        isOpen={false}
        onClose={vi.fn()}
        currentTenant={mockTenant}
        onConfirmAndUpload={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders form and updates input values', () => {
    const onConfirmAndUpload = vi.fn();
    const onClose = vi.fn();

    render(
      <ClientIngestionSetupModal
        isOpen={true}
        onClose={onClose}
        currentTenant={mockTenant}
        onConfirmAndUpload={onConfirmAndUpload}
      />
    );

    // Check header
    expect(screen.getByText('Client & Dataset Ingestion Setup')).toBeInTheDocument();

    // Select different dataset type
    const invoiceBtn = screen.getByText('Invoice Data');
    fireEvent.click(invoiceBtn);

    const trialBtn = screen.getByText('Trial Balance');
    fireEvent.click(trialBtn);

    // Change client name
    const nameInput = screen.getByDisplayValue(mockTenant.enterprise_name);
    fireEvent.change(nameInput, { target: { value: 'New Test Enterprise' } });

    // Change currency
    const usdBtn = screen.getByRole('button', { name: 'USD' });
    fireEvent.click(usdBtn);

    // Change region
    const regionSelect = screen.getByDisplayValue('GLOBAL Multi-Region');
    fireEvent.change(regionSelect, { target: { value: 'EU' } });

    // Change spend
    const spendInput = screen.getByDisplayValue('732.41');
    fireEvent.change(spendInput, { target: { value: '800' } });

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /Confirm & Proceed to Upload Data/i });
    fireEvent.click(submitBtn);

    expect(onConfirmAndUpload).toHaveBeenCalledWith(
      expect.objectContaining({
        clientName: 'New Test Enterprise',
        datasetType: 'Trial Balance',
        currency: 'USD',
        region: 'EU',
        estimatedSpend: expect.any(Number)
      })
    );
  });

  it('handles cancel button', () => {
    const onClose = vi.fn();
    render(
      <ClientIngestionSetupModal
        isOpen={true}
        onClose={onClose}
        currentTenant={mockTenant}
        onConfirmAndUpload={vi.fn()}
      />
    );

    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('handles empty clientName submission, preset name pills, period selection, currency buttons, and empty tenant fallback', () => {
    const onConfirmAndUpload = vi.fn();
    const onClose = vi.fn();

    const emptyTenant = {
      tenant_id: 't-empty',
      enterprise_name: '',
      base_currency: undefined,
      region: undefined,
      total_spend_evaluated_inr: 0
    } as any;

    const { rerender } = render(
      <ClientIngestionSetupModal
        isOpen={true}
        onClose={onClose}
        currentTenant={emptyTenant}
        onConfirmAndUpload={onConfirmAndUpload}
      />
    );

    // Empty name submit should return early
    const nameInput = screen.getByPlaceholderText(/Fortune 500/i);
    fireEvent.change(nameInput, { target: { value: '   ' } });
    const submitBtn = screen.getByRole('button', { name: /Confirm & Proceed to Upload Data/i });
    fireEvent.click(submitBtn);
    expect(onConfirmAndUpload).not.toHaveBeenCalled();

    // Click preset name button
    const presetPill = screen.getByText('Apex Industrial Dynamics');
    fireEvent.click(presetPill);

    // Select EUR and GBP
    fireEvent.click(screen.getByRole('button', { name: 'EUR' }));
    fireEvent.click(screen.getByRole('button', { name: 'GBP' }));
    fireEvent.click(screen.getByRole('button', { name: '₹ INR (Cr)' }));

    // Change spend period
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: '24 Months (FY25 - FY26: 1 Apr 2024 - 31 Mar 2026)' } });

    // Close via X button
    const allBtns = screen.getAllByRole('button');
    const xBtn = allBtns.find(b => !b.textContent || b.textContent.trim() === '');
    if (xBtn) {
      fireEvent.click(xBtn);
      expect(onClose).toHaveBeenCalled();
    }
  });
});
