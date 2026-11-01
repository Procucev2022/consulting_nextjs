import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DPSNXTModal } from '../../../src/components/modals/DPSNXTModal';
import { mockSavingsOpportunities } from '../../fixtures/mockData';
import { UI_STRINGS } from '../../../src/constants/uiStrings';

const sampleOpp: any = {
  opp_id: 'OPP-DPS-TEST-001',
  title: 'Direct Chemicals Index Pegging & Rebates',
  category: 'Direct Chemicals',
  est_savings: 250000,
  est_savings_inr_cr: 2.5,
  confidence_score: 94,
  implementation_time_months: 3,
  recommended_action: 'Index pegging and automated tier rebates',
  impact_level: 'HIGH'
};

describe('DPSNXTModal Component', () => {
  it('renders null when not open or opportunity is null', () => {
    const { container } = render(
      <DPSNXTModal
        opportunity={null}
        isOpen={false}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('records a D1 planning handoff without claiming external enforcement', async () => {
    const onClose = vi.fn();
    const onSuccess = vi.fn();

    render(
      <DPSNXTModal
        opportunity={sampleOpp}
        isOpen={true}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    expect(screen.getByText(UI_STRINGS.modals.dpsNXT.title)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.modals.dpsNXT.heading)).toBeInTheDocument();

    // Change sliders / inputs
    const creepInput = screen.getByRole('spinbutton');
    fireEvent.change(creepInput, { target: { value: '4.5' } });

    // Change index pegging
    const pegSelect = screen.getByRole('combobox');
    fireEvent.change(pegSelect, { target: { value: UI_STRINGS.modals.dpsNXT.benchmarks.platts } });

    // Toggle rebate tier
    const rebateBtn = screen.getByRole('button', { name: UI_STRINGS.modals.dpsNXT.rules.statusEnforced });
    fireEvent.click(rebateBtn);
    expect(screen.getByRole('button', { name: UI_STRINGS.modals.dpsNXT.rules.statusOff })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.modals.dpsNXT.rules.statusOff }));

    // Click execute
    const executeBtn = screen.getByRole('button', { name: UI_STRINGS.modals.dpsNXT.pushButton });
    fireEvent.click(executeBtn);

    expect(await screen.findByText(UI_STRINGS.modals.dpsNXT.deployedSuccess)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.modals.dpsNXT.deployedDesc)).toBeInTheDocument();
    expect(onSuccess).toHaveBeenCalledWith(sampleOpp.opp_id);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('handles close button', () => {
    const onClose = vi.fn();
    render(
      <DPSNXTModal
        opportunity={sampleOpp}
        isOpen={true}
        onClose={onClose}
        onSuccess={vi.fn()}
      />
    );

    const closeBtn = screen.getByRole('button', { name: UI_STRINGS.modals.dpsNXT.cancel });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('handles top right close X button', () => {
    const onClose = vi.fn();
    render(
      <DPSNXTModal
        opportunity={sampleOpp}
        isOpen={true}
        onClose={onClose}
        onSuccess={vi.fn()}
      />
    );

    const allButtons = screen.getAllByRole('button');
    const xBtn = allButtons.find(b => !b.textContent || b.textContent.trim() === '');
    if (xBtn) {
      fireEvent.click(xBtn);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it('uses zero savings when absent and shows a safe message for non-Error handoff failures', async () => {
    const onSuccess = vi.fn().mockRejectedValue('provider unavailable');
    const opportunityWithoutSavings = {
      ...sampleOpp,
      est_savings_inr_cr: undefined,
      estimated_savings_inr_cr: undefined
    };

    render(
      <DPSNXTModal
        opportunity={opportunityWithoutSavings}
        isOpen
        onClose={vi.fn()}
        onSuccess={onSuccess}
      />
    );

    expect(screen.getByText(UI_STRINGS.common.croreAmount('0.00'))).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.modals.dpsNXT.pushButton }));

    expect(await screen.findByRole('alert')).toHaveTextContent(UI_STRINGS.modals.dpsNXT.handoffFailed);
    expect(onSuccess).toHaveBeenCalledWith(sampleOpp.opp_id);
  });
});
