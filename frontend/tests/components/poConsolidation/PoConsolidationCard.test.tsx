import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PoConsolidationCard } from '../../../src/components/poConsolidation/PoConsolidationCard';
import { MOCK_MULTIPLE_PO_ITEMS } from '../../../src/data/mockPoConsolidation';
import { UI_STRINGS } from '../../../src/constants/uiStrings';

describe('PoConsolidationCard Component', () => {
  const item = MOCK_MULTIPLE_PO_ITEMS[0];

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
