import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PoConsolidationModal } from '../../../src/components/poConsolidation/PoConsolidationModal';
import { MOCK_MULTIPLE_PO_ITEMS } from '../../../src/data/mockPoConsolidation';
import { UI_STRINGS } from '../../../src/constants/uiStrings';

describe('PoConsolidationModal Component', () => {
  const item = MOCK_MULTIPLE_PO_ITEMS[0];

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
    const annualCadenceBtn = screen.getByRole('button', { name: /Annual/i });
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
