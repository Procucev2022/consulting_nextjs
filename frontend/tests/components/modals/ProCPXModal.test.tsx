import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ProCPXModal } from '../../../src/components/modals/ProCPXModal';
import { mockSavingsOpportunities } from '../../../src/data/mockData';

describe('ProCPXModal Component', () => {
  const sampleOpp = mockSavingsOpportunities[0];

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

    expect(screen.getByText('Launch Sourcing Event')).toBeInTheDocument();

    // Change event type
    const eventSelect = screen.getByRole('combobox');
    fireEvent.change(eventSelect, { target: { value: 'Reverse Auction' } });

    // Change target baseline
    const baselineInput = screen.getByRole('spinbutton');
    fireEvent.change(baselineInput, { target: { value: '2000000' } });

    // Click launch
    const launchBtn = screen.getByRole('button', { name: /Push to proCPX/i });
    fireEvent.click(launchBtn);

    // Fast-forward first timer
    act(() => {
      vi.advanceTimersByTime(1200);
    });

    expect(screen.getByText(/e-Sourcing Event Launched to proCPX/i)).toBeInTheDocument();

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

    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalled();
  });
});
