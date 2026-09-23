import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PoConsolidationModal } from '../../../src/components/poConsolidation/PoConsolidationModal';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import type { MultiplePoItem } from '../../../src/types/poConsolidation';

const item: MultiplePoItem = {
  id: 'PO-01',
  vendor_id: 'VND-01',
  vendor_name: 'TRAFIGURA INDIA PRIVATE LIMITED',
  item_description: 'Refined Nickel Cathodes',
  material_code: 'MAT-NKL-01',
  category: 'Direct Materials',
  annual_po_count: 36,
  total_annual_spend_cr: 1215.81,
  avg_pos_per_month: 3,
  avg_po_value_lakhs: 337.7,
  primary_plant: 'Plant 1000',
  monthly_distribution: [{ month: 'Apr', po_count: 3, spend_inr_lakhs: 100 }],
  cadence_options: {
    MONTHLY: {
      cadence: 'MONTHLY',
      label: 'Monthly Single PO',
      target_pos_per_year: 12,
      po_reduction_pct: 50,
      scale_discount_pct: 4,
      scale_savings_cr: 0.4,
      admin_savings_lakhs: 5,
      total_benefit_cr: 0.45
    },
    QUARTERLY: {
      cadence: 'QUARTERLY',
      label: 'Quarterly Batching',
      target_pos_per_year: 4,
      po_reduction_pct: 80,
      scale_discount_pct: 8,
      scale_savings_cr: 0.8,
      admin_savings_lakhs: 8,
      total_benefit_cr: 0.88
    },
    HALF_YEARLY: {
      cadence: 'HALF_YEARLY',
      label: '6-Month / Semi-Annual',
      target_pos_per_year: 2,
      po_reduction_pct: 90,
      scale_discount_pct: 11,
      scale_savings_cr: 1.1,
      admin_savings_lakhs: 10,
      total_benefit_cr: 1.2
    },
    ANNUAL: {
      cadence: 'ANNUAL',
      label: 'Annual Blanket PO',
      target_pos_per_year: 1,
      po_reduction_pct: 95,
      scale_discount_pct: 14,
      scale_savings_cr: 1.4,
      admin_savings_lakhs: 12,
      total_benefit_cr: 1.52
    }
  },
  recommended_cadence: 'QUARTERLY',
  best_practice_recommendation: 'Transition to quarterly releases',
  blanket_po_strategy: 'Execute annual frame agreement'
};

describe('PoConsolidationModal Component', () => {

  it('renders nothing when isOpen is false or item is null', () => {
    const { container } = render(
      <PoConsolidationModal
        item={item}
        isOpen={false}
        onClose={vi.fn()}
        activeCadence="QUARTERLY"
        onCadenceChange={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal details, handles cadence change, draft generation with timer, and close actions', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    const onCadenceChange = vi.fn();

    render(
      <PoConsolidationModal
        item={item}
        isOpen={true}
        onClose={onClose}
        activeCadence="QUARTERLY"
        onCadenceChange={onCadenceChange}
      />
    );

    expect(screen.getByText(UI_STRINGS.poConsolidation.modalBadge)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.poConsolidation.modalTitle(item.vendor_name))).toBeInTheDocument();

    // Click Annual cadence button in modal
    const annualCadenceBtn = screen.getByRole('button', { name: /^Annual Blanket PO/i });
    fireEvent.click(annualCadenceBtn);
    expect(onCadenceChange).toHaveBeenCalledWith('ANNUAL');

    // Click Monthly cadence button in modal
    const monthlyCadenceBtn = screen.getByRole('button', { name: /Monthly/i });
    fireEvent.click(monthlyCadenceBtn);
    expect(onCadenceChange).toHaveBeenCalledWith('MONTHLY');

    // Click Apply / Generate draft
    const draftBtn = screen.getByRole('button', { name: UI_STRINGS.poConsolidation.applyConsolidationBtn });
    fireEvent.click(draftBtn);
    expect(screen.getByText(UI_STRINGS.poConsolidation.consolidationDraftSuccess)).toBeInTheDocument();

    // Fast-forward timer to clear draft message
    act(() => {
      vi.advanceTimersByTime(4500);
    });
    expect(screen.queryByText(UI_STRINGS.poConsolidation.consolidationDraftSuccess)).not.toBeInTheDocument();

    // Click footer close button
    const closeBtn = screen.getByRole('button', { name: UI_STRINGS.poConsolidation.closeModalBtn });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();

    vi.useRealTimers();
  });
});
