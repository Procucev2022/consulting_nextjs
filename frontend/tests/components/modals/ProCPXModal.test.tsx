import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ProCPXModal } from '../../../src/components/modals/ProCPXModal';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import { apiClient } from '../../../src/utils/api';

const sampleOpp: any = {
  opp_id: 'OPP-CPX-TEST-001',
  title: 'Global Freight Sourcing & Reverse Auction',
  category: 'Logistics & Freight',
  current_spend_inr_cr: 5,
  baseline_spend_inr_cr: 5,
  est_savings: 180000,
  est_savings_inr_cr: 1.8,
  confidence_score: 91,
  implementation_time_months: 2,
  recommended_action: 'Multi-round reverse auction',
  contract_leak_type: 'Rate creep and unhedged fuel surcharge',
  impact_level: 'MEDIUM'
};

describe('ProCPXModal Component', () => {
  beforeEach(() => {
    vi.spyOn(apiClient, 'getVendors').mockResolvedValue({
      vendorRankings: [{ vendor_id: 'VENDOR-TEST', vendor_name: 'Test Supplier', category: 'Logistics & Freight' }],
      vendorDetails: []
    });
  });

  afterEach(() => {
  vi.restoreAllMocks();
  });

  it('renders null when not open or opportunity is null', () => {
    const { container } = render(
      <ProCPXModal
        opportunity={null}
        isOpen={false}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal controls and handles launch flow', async () => {
    const onClose = vi.fn();
    const onSuccess = vi.fn();

    render(
      <ProCPXModal
        opportunity={sampleOpp}
        isOpen={true}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByText(UI_STRINGS.modals.proCPX.heading)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.modals.proCPX.title)).toBeInTheDocument();

    // Change event type
    const eventSelect = screen.getByRole('combobox');
    fireEvent.change(eventSelect, { target: { value: 'Reverse Auction' } });

    // Change target baseline
    const baselineInput = screen.getByRole('spinbutton');
    fireEvent.change(baselineInput, { target: { value: '2000000' } });

    // Click launch
    const launchBtn = screen.getByRole('button', { name: UI_STRINGS.modals.proCPX.pushButton });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Test Supplier' }));
    fireEvent.click(launchBtn);

    expect(await screen.findByText(UI_STRINGS.modals.proCPX.deployedSuccess)).toBeInTheDocument();
    expect(onSuccess).toHaveBeenCalledWith(sampleOpp.opp_id);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('handles close button', async () => {
    const onClose = vi.fn();
    render(
      <ProCPXModal
        opportunity={sampleOpp}
        isOpen={true}
        onClose={onClose}
        onSuccess={vi.fn()}
      />
    );

    await screen.findByRole('checkbox', { name: 'Test Supplier' });
    const cancelBtn = screen.getByRole('button', { name: UI_STRINGS.modals.proCPX.cancel });
    fireEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalled();
  });
});
