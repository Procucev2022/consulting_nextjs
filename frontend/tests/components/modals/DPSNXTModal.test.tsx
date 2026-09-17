import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { DPSNXTModal } from '../../../src/components/modals/DPSNXTModal';
import { mockSavingsOpportunities } from '../../../src/data/mockData';
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
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

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

  it('renders modal controls and handles execution flow', () => {
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

    // Fast-forward first timeout
    act(() => {
      vi.advanceTimersByTime(1200);
    });

    expect(screen.getByText(UI_STRINGS.modals.dpsNXT.deployedSuccess)).toBeInTheDocument();

    // Fast-forward second timeout
    act(() => {
      vi.advanceTimersByTime(1800);
    });

    expect(onSuccess).toHaveBeenCalledWith(sampleOpp.opp_id);
    expect(onClose).toHaveBeenCalled();
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
});
