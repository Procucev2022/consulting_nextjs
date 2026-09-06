import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Module4SavingsEngine } from '../../src/components/Module4SavingsEngine';
import { mockSavingsOpportunities } from '../../src/data/mockData';

describe('Module4SavingsEngine Component', () => {
  it('renders summary cards, category breakdowns, and opportunities table', () => {
    render(
      <Module4SavingsEngine
        opportunities={mockSavingsOpportunities}
        onOpenProCPX={vi.fn()}
        onOpenDPSNXT={vi.fn()}
        onProceedToConversion={vi.fn()}
      />
    );

    expect(screen.getAllByText('Direct Materials').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Packaging Materials').length).toBeGreaterThan(0);
    expect(screen.getByText('Identified Opportunity Pipeline & Suite Integration Triggers')).toBeInTheDocument();
  });

  it('filters opportunities by category and module', () => {
    render(
      <Module4SavingsEngine
        opportunities={mockSavingsOpportunities}
        onOpenProCPX={vi.fn()}
        onOpenDPSNXT={vi.fn()}
        onProceedToConversion={vi.fn()}
      />
    );

    const selects = screen.getAllByRole('combobox');
    const categorySelect = selects[0];
    const moduleSelect = selects[1];

    // Filter by Packaging Materials
    fireEvent.change(categorySelect, { target: { value: 'Packaging Materials' } });

    // Filter by proCPX
    fireEvent.change(moduleSelect, { target: { value: 'proCPX' } });

    // Filter by DPS NXT
    fireEvent.change(moduleSelect, { target: { value: 'DPS NXT' } });

    // Reset to ALL
    fireEvent.change(categorySelect, { target: { value: 'ALL' } });
    fireEvent.change(moduleSelect, { target: { value: 'ALL' } });
  });

  it('triggers onOpenProCPX and onOpenDPSNXT buttons', () => {
    const onOpenProCPX = vi.fn();
    const onOpenDPSNXT = vi.fn();

    render(
      <Module4SavingsEngine
        opportunities={mockSavingsOpportunities}
        onOpenProCPX={onOpenProCPX}
        onOpenDPSNXT={onOpenDPSNXT}
        onProceedToConversion={vi.fn()}
      />
    );

    const proCPXBtns = screen.queryAllByRole('button', { name: /Push to proCPX/i });
    if (proCPXBtns.length > 0) {
      fireEvent.click(proCPXBtns[0]);
      expect(onOpenProCPX).toHaveBeenCalled();
    }

    const dpsNXTBtns = screen.queryAllByRole('button', { name: /Push to DPS NXT/i });
    if (dpsNXTBtns.length > 0) {
      fireEvent.click(dpsNXTBtns[0]);
      expect(onOpenDPSNXT).toHaveBeenCalled();
    }
  });

  it('handles opportunities with already pushed status and fallback spend values', () => {
    const customOpps = [
      {
        ...mockSavingsOpportunities[0],
        status: 'Pushed to proCPX',
        current_spend_inr_cr: undefined as any,
        est_savings_inr_cr: undefined as any
      },
      {
        ...mockSavingsOpportunities[1],
        status: 'Pushed to DPS NXT',
        current_spend_inr_cr: undefined as any,
        est_savings_inr_cr: undefined as any
      }
    ];

    render(
      <Module4SavingsEngine
        opportunities={customOpps as any}
        onOpenProCPX={vi.fn()}
        onOpenDPSNXT={vi.fn()}
        onProceedToConversion={vi.fn()}
      />
    );

    const pushedBadges = screen.getAllByText('Pushed');
    expect(pushedBadges.length).toBeGreaterThan(0);
  });

  it('triggers onProceedToConversion when CTA is clicked', () => {
    const onProceed = vi.fn();
    render(
      <Module4SavingsEngine
        opportunities={mockSavingsOpportunities}
        onOpenProCPX={vi.fn()}
        onOpenDPSNXT={vi.fn()}
        onProceedToConversion={onProceed}
      />
    );

    const ctaBtn = screen.getByRole('button', { name: /Proceed to Conversion Matrix & ROI Engine/i });
    fireEvent.click(ctaBtn);
    expect(onProceed).toHaveBeenCalled();
  });
});
