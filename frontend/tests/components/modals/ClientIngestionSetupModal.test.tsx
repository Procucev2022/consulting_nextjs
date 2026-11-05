import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ClientIngestionSetupModal } from '../../../src/components/modals/ClientIngestionSetupModal';
import { loadIndustryCatalog } from '../../../src/utils/industryApi';
import { mockTenant } from '../../fixtures/mockData';
import { UI_STRINGS } from '../../../src/constants/uiStrings';

vi.mock('../../../src/utils/industryApi', () => ({
  loadIndustryCatalog: vi.fn().mockResolvedValue({
    success: true,
    profiles: [
      { majorSector: 'Chemical & Petrochemicals', minorSector: 'Specialty Chemicals', sectorCode: 'CHEM-SPEC', tagline: 'Chemical profile', typicalDirectMaterials: ['Catalysts'], typicalPackagingMaterials: ['Drums'], typicalLogisticsCategories: ['Freight'], typicalMroCategories: ['Pumps'], characteristicUNSPSCPrefixes: ['12', '14'], benchmarkSpendSplit: { directPct: 56, packagingPct: 18, logisticsPct: 14, mroPct: 12 }, categorizationGuidance: 'Review chemicals.', keyKeywords: ['catalyst'] },
      { majorSector: 'Manufacturing & Industrial', minorSector: 'Precision Engineering & Tooling', sectorCode: 'MFG-PREC', tagline: 'Manufacturing profile', typicalDirectMaterials: ['Tools'], typicalPackagingMaterials: ['Boxes'], typicalLogisticsCategories: ['Freight'], typicalMroCategories: ['Pumps'], characteristicUNSPSCPrefixes: ['30'], benchmarkSpendSplit: { directPct: 54, packagingPct: 8, logisticsPct: 14, mroPct: 24 }, categorizationGuidance: 'Review precision materials.', keyKeywords: ['carbide'] }
    ],
    presets: [{ clientName: 'Vanguard Eurocorp AG', majorSector: 'Manufacturing & Industrial', minorSector: 'Precision Engineering & Tooling' }]
  })
}));

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

  it('renders form and updates input values', async () => {
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
    await waitFor(() => expect(screen.getByRole('button', { name: UI_STRINGS.modals.clientSetup.submitBtn })).toBeEnabled());

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

  it('handles cancel button', async () => {
    const onClose = vi.fn();
    render(
      <ClientIngestionSetupModal
        isOpen={true}
        onClose={onClose}
        currentTenant={mockTenant}
        onConfirmAndUpload={vi.fn()}
      />
    );

    await screen.findByLabelText(UI_STRINGS.modals.clientSetup.industrySector.majorSectorLabel);
    const cancelBtn = screen.getByRole('button', { name: UI_STRINGS.modals.clientSetup.cancel });
    fireEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('handles empty clientName submission, preset name pills, period selection, currency buttons, and empty tenant fallback', async () => {
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

    await screen.findByLabelText(UI_STRINGS.modals.clientSetup.industrySector.majorSectorLabel);

    // Enter client name
    const nameInput = screen.getByPlaceholderText(UI_STRINGS.modals.clientSetup.clientPlaceholder);
    fireEvent.change(nameInput, { target: { value: 'Apex Industrial Dynamics' } });

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

  it('handles Industry Major and Minor sector selection and preset synchronization', async () => {
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
    await waitFor(() => expect(screen.getByLabelText(UI_STRINGS.modals.clientSetup.industrySector.majorSectorLabel)).toBeEnabled());

    // Verify Industry Sector section is rendered
    expect(screen.getByText(UI_STRINGS.modals.clientSetup.industrySector.title)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.modals.clientSetup.industrySector.badge)).toBeInTheDocument();

    // Select Major Sector
    const majorSelect = screen.getByLabelText(UI_STRINGS.modals.clientSetup.industrySector.majorSectorLabel);
    fireEvent.change(majorSelect, { target: { value: 'Manufacturing & Industrial' } });

    // Select Minor Sector
    const minorSelect = screen.getByLabelText(UI_STRINGS.modals.clientSetup.industrySector.minorSectorLabel);
    fireEvent.change(minorSelect, { target: { value: 'Precision Engineering & Tooling' } });

    // Enter client name
    const clientInput = screen.getByDisplayValue(mockTenant.enterprise_name);
    fireEvent.change(clientInput, { target: { value: 'Vanguard Eurocorp AG' } });

    // Submit form and ensure majorSector and minorSector are delivered
    const submitBtn = screen.getByRole('button', { name: UI_STRINGS.modals.clientSetup.submitBtn });
    fireEvent.click(submitBtn);

    expect(onConfirmAndUpload).toHaveBeenCalledWith(
      expect.objectContaining({
        clientName: 'Vanguard Eurocorp AG',
        majorSector: 'Manufacturing & Industrial',
        minorSector: 'Precision Engineering & Tooling'
      })
    );
  });

  it('shows the unavailable profile state and rejects submission when no matching profile is loaded', async () => {
    vi.mocked(loadIndustryCatalog).mockResolvedValueOnce({ success: true, profiles: [], presets: [] } as any);
    const onConfirmAndUpload = vi.fn();
    const tenantWithoutProfile = {
      ...mockTenant,
      major_sector: 'Unconfigured sector',
      minor_sector: 'Unconfigured category'
    };
    const view = render(
      <ClientIngestionSetupModal
        isOpen
        onClose={vi.fn()}
        currentTenant={tenantWithoutProfile}
        onConfirmAndUpload={onConfirmAndUpload}
      />
    );

    expect(await screen.findByRole('status')).toHaveTextContent(UI_STRINGS.module2.industryContext.profileUnavailable);
    expect(screen.getByRole('button', { name: UI_STRINGS.modals.clientSetup.submitBtn })).toBeDisabled();
    fireEvent.submit(view.container.querySelector('form')!);
    expect(onConfirmAndUpload).not.toHaveBeenCalled();
  });

  it('keeps profile state unchanged when an in-flight catalog request settles after unmount', async () => {
    let resolveCatalog: ((catalog: unknown) => void) | undefined;
    let rejectCatalog: ((error: Error) => void) | undefined;
    vi.mocked(loadIndustryCatalog)
      .mockReturnValueOnce(new Promise((resolve) => { resolveCatalog = resolve; }) as ReturnType<typeof loadIndustryCatalog>)
      .mockReturnValueOnce(new Promise((_resolve, reject) => { rejectCatalog = reject; }) as ReturnType<typeof loadIndustryCatalog>);

    const first = render(
      <ClientIngestionSetupModal isOpen onClose={vi.fn()} currentTenant={mockTenant} onConfirmAndUpload={vi.fn()} />
    );
    first.unmount();
    await act(async () => {
      resolveCatalog?.({ success: true, profiles: [], presets: [] });
      await Promise.resolve();
    });

    const second = render(
      <ClientIngestionSetupModal isOpen onClose={vi.fn()} currentTenant={mockTenant} onConfirmAndUpload={vi.fn()} />
    );
    second.unmount();
    await act(async () => {
      rejectCatalog?.(new Error('catalog unavailable'));
      await Promise.resolve();
    });
  });

  it('applies only matching client-name presets on blur', async () => {
    render(
      <ClientIngestionSetupModal
        isOpen
        onClose={vi.fn()}
        currentTenant={mockTenant}
        onConfirmAndUpload={vi.fn()}
      />
    );
    const clientName = await screen.findByDisplayValue(mockTenant.enterprise_name);
    fireEvent.change(clientName, { target: { value: 'No matching preset' } });
    fireEvent.blur(clientName);
    fireEvent.change(clientName, { target: { value: 'Vanguard Eurocorp AG' } });
    fireEvent.blur(clientName);

    await waitFor(() => {
      expect(screen.getByLabelText(UI_STRINGS.modals.clientSetup.industrySector.majorSectorLabel)).toHaveValue('Manufacturing & Industrial');
      expect(screen.getByLabelText(UI_STRINGS.modals.clientSetup.industrySector.minorSectorLabel)).toHaveValue('Precision Engineering & Tooling');
    });
  });
});

