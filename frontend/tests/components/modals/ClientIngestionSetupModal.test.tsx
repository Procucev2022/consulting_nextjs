import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ClientIngestionSetupModal } from '../../../src/components/modals/ClientIngestionSetupModal';
import { mockTenant } from '../../../src/data/mockData';
import { UI_STRINGS } from '../../../src/constants/uiStrings';

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
    expect(screen.getByText(UI_STRINGS.modals.clientSetup.title)).toBeInTheDocument();

    // Select different dataset type
    const invoiceBtn = screen.getByText(UI_STRINGS.modals.clientSetup.datasetOptions.invoiceData.title);
    fireEvent.click(invoiceBtn);

    const trialBtn = screen.getByText(UI_STRINGS.modals.clientSetup.datasetOptions.trialBalance.title);
    fireEvent.click(trialBtn);

    // Change client name
    const nameInput = screen.getByDisplayValue(mockTenant.enterprise_name);
    fireEvent.change(nameInput, { target: { value: 'New Test Enterprise' } });

    // Change currency
    const usdBtn = screen.getByRole('button', { name: 'USD' });
    fireEvent.click(usdBtn);

    // Change region
    const regionSelect = screen.getByDisplayValue(UI_STRINGS.modals.clientSetup.regions.global);
    fireEvent.change(regionSelect, { target: { value: 'EU' } });

    // Change spend
    const spendInput = screen.getByDisplayValue(String(mockTenant.total_spend_evaluated_inr));
    fireEvent.change(spendInput, { target: { value: '800' } });

    // Submit form
    const submitBtn = screen.getByRole('button', { name: UI_STRINGS.modals.clientSetup.submitBtn });
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

    const cancelBtn = screen.getByRole('button', { name: UI_STRINGS.modals.clientSetup.cancel });
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
    const submitBtn = screen.getByRole('button', { name: UI_STRINGS.modals.clientSetup.submitBtn });
    fireEvent.click(submitBtn);
    expect(onConfirmAndUpload).not.toHaveBeenCalled();

    // Click preset name button
    const presetPill = screen.getByText('Apex Industrial Dynamics');
    fireEvent.click(presetPill);

    // Select EUR and GBP
    fireEvent.click(screen.getByRole('button', { name: 'EUR' }));
    fireEvent.click(screen.getByRole('button', { name: 'GBP' }));
    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.modals.clientSetup.inrButtonLabel }));

    // Change spend period
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: UI_STRINGS.modals.clientSetup.spendPeriods.months24 } });

    // Close via X button
    const allBtns = screen.getAllByRole('button');
    const xBtn = allBtns.find(b => !b.textContent || b.textContent.trim() === '');
    if (xBtn) {
      fireEvent.click(xBtn);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it('handles Industry Major and Minor sector selection and preset synchronization', () => {
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

    // Verify Industry Sector section is rendered
    expect(screen.getByText(UI_STRINGS.modals.clientSetup.industrySector.title)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.modals.clientSetup.industrySector.badge)).toBeInTheDocument();

    // Select Major Sector
    const majorSelect = screen.getByLabelText(UI_STRINGS.modals.clientSetup.industrySector.majorSectorLabel);
    fireEvent.change(majorSelect, { target: { value: 'Manufacturing & Industrial' } });

    // Select Minor Sector
    const minorSelect = screen.getByLabelText(UI_STRINGS.modals.clientSetup.industrySector.minorSectorLabel);
    fireEvent.change(minorSelect, { target: { value: 'Precision Engineering & Tooling' } });

    // Click enterprise preset (Vanguard Eurocorp AG -> Automotive & Transportation)
    const vanguardBtn = screen.getByText('Vanguard Eurocorp AG');
    fireEvent.click(vanguardBtn);

    // Submit form and ensure majorSector and minorSector are delivered
    const submitBtn = screen.getByRole('button', { name: UI_STRINGS.modals.clientSetup.submitBtn });
    fireEvent.click(submitBtn);

    expect(onConfirmAndUpload).toHaveBeenCalledWith(
      expect.objectContaining({
        clientName: 'Vanguard Eurocorp AG',
        majorSector: 'Automotive & Transportation',
        minorSector: 'Auto Components & Tier-1 Assemblies'
      })
    );
  });
});

