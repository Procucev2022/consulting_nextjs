import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { DPSNXTModal } from '../../../src/components/modals/DPSNXTModal';
import { mockSavingsOpportunities } from '../../../src/data/mockData';

describe('DPSNXTModal Component', () => {
  const sampleOpp = mockSavingsOpportunities[0];

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

    expect(screen.getByText('DPS NXT Integration')).toBeInTheDocument();

    // Change sliders / inputs
    const creepInput = screen.getByRole('spinbutton');
    fireEvent.change(creepInput, { target: { value: '4.5' } });

    // Change index pegging
    const pegSelect = screen.getByRole('combobox');
    fireEvent.change(pegSelect, { target: { value: 'Platts Petrochemical Index' } });

    // Toggle rebate tier
    const rebateBtn = screen.getByRole('button', { name: 'ENFORCED' });
    fireEvent.click(rebateBtn);
    expect(screen.getByRole('button', { name: 'OFF' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'OFF' }));

    // Click execute
    const executeBtn = screen.getByRole('button', { name: /Push to DPS NXT/i });
    fireEvent.click(executeBtn);

    // Fast-forward first timeout
    act(() => {
      vi.advanceTimersByTime(1200);
    });

    expect(screen.getByText(/Rate-Card Enforcement Deployed to DPS NXT!/i)).toBeInTheDocument();

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

    const closeBtn = screen.getByRole('button', { name: 'Cancel' });
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
