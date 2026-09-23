import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PoConsolidationCard } from '../../../src/components/poConsolidation/PoConsolidationCard';
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

describe('PoConsolidationCard Component', () => {

  it('renders card with details, metrics, and handles cadence selection and modal open', () => {
    const onSelectCadence = vi.fn();
    const onOpenModal = vi.fn();

    render(
      <PoConsolidationCard
        item={item}
        selectedCadence="QUARTERLY"
        onSelectCadence={onSelectCadence}
        onOpenModal={onOpenModal}
      />
    );

    expect(screen.getByText(item.vendor_name)).toBeInTheDocument();
    expect(screen.getByText(item.category)).toBeInTheDocument();
    expect(screen.getByText(`₹${item.total_annual_spend_cr.toFixed(2)} Cr`)).toBeInTheDocument();

    // Click Annual cadence pill
    const annualPill = screen.getByRole('button', { name: /Annual/i });
    fireEvent.click(annualPill);
    expect(onSelectCadence).toHaveBeenCalledWith(item.id, 'ANNUAL');

    // Click Monthly cadence pill
    const monthlyPill = screen.getByRole('button', { name: /Monthly/i });
    fireEvent.click(monthlyPill);
    expect(onSelectCadence).toHaveBeenCalledWith(item.id, 'MONTHLY');

    // Click 6-Month cadence pill
    const halfYearlyPill = screen.getByRole('button', { name: /6-Month/i });
    fireEvent.click(halfYearlyPill);
    expect(onSelectCadence).toHaveBeenCalledWith(item.id, 'HALF_YEARLY');

    // Click Explore button
    const exploreBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.poConsolidation.exploreConsolidationBtn, 'i') });
    fireEvent.click(exploreBtn);
    expect(onOpenModal).toHaveBeenCalledWith(item);
  });
});
