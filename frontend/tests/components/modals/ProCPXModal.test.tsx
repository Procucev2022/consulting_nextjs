import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ProCPXModal } from '../../../src/components/modals/ProCPXModal';
import { mockSavingsOpportunities } from '../../../src/data/mockData';
import { UI_STRINGS } from '../../../src/constants/uiStrings';

const sampleOpp: any = {
  opp_id: 'OPP-CPX-TEST-001',
  title: 'Global Freight Sourcing & Reverse Auction',
  category: 'Logistics & Freight',
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
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
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

  it('renders modal controls and handles launch flow', () => {
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
    fireEvent.click(launchBtn);

    // Fast-forward first timer
    act(() => {
      vi.advanceTimersByTime(1200);
    });

    expect(screen.getByText(UI_STRINGS.modals.proCPX.deployedSuccess)).toBeInTheDocument();

    // Fast-forward second timer
    act(() => {
      vi.advanceTimersByTime(1800);
    });

    expect(onSuccess).toHaveBeenCalledWith(sampleOpp.opp_id);
    expect(onClose).toHaveBeenCalled();
  });

  it('handles close button', () => {
    const onClose = vi.fn();
    render(
      <ProCPXModal
        opportunity={sampleOpp}
        isOpen={true}
        onClose={onClose}
        onSuccess={vi.fn()}
      />
    );

    const cancelBtn = screen.getByRole('button', { name: UI_STRINGS.modals.proCPX.cancel });
    fireEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalled();
  });
});
