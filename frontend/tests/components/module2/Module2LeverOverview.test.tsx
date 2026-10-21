import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Module2LeverOverview } from '../../../src/components/module2/Module2LeverOverview';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import { TEN_LEVERS_OVERVIEW_CONFIG } from '../../../src/constants/module2LeversOverview';

describe('Module2LeverOverview Component', () => {
  it('renders header, governance notice, and all 10 numbered levers', () => {
    const handleSelectLever = vi.fn();
    render(
      <Module2LeverOverview
        assessmentId="AIC-2026-0002"
        onSelectLever={handleSelectLever}
        directPriceOppCr={17.1155}
      />
    );

    // Title and governance
    expect(screen.getByText(UI_STRINGS.module2LeversOverview.pageTitle)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.module2LeversOverview.governanceDisclaimer)).toBeInTheDocument();

    // Verify all 10 levers are listed
    for (const lever of TEN_LEVERS_OVERVIEW_CONFIG) {
      expect(screen.getByText(lever.code)).toBeInTheDocument();
      expect(screen.getByText(lever.name)).toBeInTheDocument();
    }

    // Levers 1-6, 8, 9: Implemented
    const implementedBadges = screen.getAllByText(UI_STRINGS.module2LeversOverview.statusImplemented);
    expect(implementedBadges).toHaveLength(8);
    expect(screen.getByText('₹17.12 Cr')).toBeInTheDocument();

    const openBtns = screen.getAllByText(UI_STRINGS.module2LeversOverview.btnOpenAnalysis);
    expect(openBtns).toHaveLength(8);

    // Open Lever 1
    fireEvent.click(openBtns[0]);
    expect(handleSelectLever).toHaveBeenCalledWith('directPrice');

    // Open Lever 2
    fireEvent.click(openBtns[1]);
    expect(handleSelectLever).toHaveBeenCalledWith('eAuction');

    // Open Lever 3
    fireEvent.click(openBtns[2]);
    expect(handleSelectLever).toHaveBeenCalledWith('vendorConsolidation');

    // Open Lever 4
    fireEvent.click(openBtns[3]);
    expect(handleSelectLever).toHaveBeenCalledWith('volumeAggregation');

    // Open Lever 5
    fireEvent.click(openBtns[4]);
    expect(handleSelectLever).toHaveBeenCalledWith('paymentTerms');

    // Open Lever 6
    fireEvent.click(openBtns[5]);
    expect(handleSelectLever).toHaveBeenCalledWith('categorySpecialisation');

    // Open Lever 8
    fireEvent.click(openBtns[6]);
    expect(handleSelectLever).toHaveBeenCalledWith('specificationRationalisation');

    // Open Lever 9
    fireEvent.click(openBtns[7]);
    expect(handleSelectLever).toHaveBeenCalledWith('procurementCompliance');

    // Lever 7: Coming Soon
    expect(screen.getByText('Logistics & Packaging Specifications')).toBeInTheDocument();
    const comingSoonBadges = screen.getAllByText(UI_STRINGS.module2LeversOverview.statusComingSoon);
    expect(comingSoonBadges.length).toBeGreaterThanOrEqual(1);

    const comingSoonBtn = screen.getByTestId('lever-coming-soon-btn-7');
    expect(comingSoonBtn).toBeInTheDocument();
    expect(comingSoonBtn).toBeDisabled();

    // Lever 10: Planned / Not Implemented with ₹0.00 unquantified
    const plannedBadges = screen.getAllByText(UI_STRINGS.module2LeversOverview.statusPlanned);
    expect(plannedBadges).toHaveLength(2);

    const pendingButtons = screen.getAllByText(UI_STRINGS.module2LeversOverview.btnPending);
    expect(pendingButtons).toHaveLength(1);
  });

  it('toggles collapsible technical diagnostics and methodology', () => {
    render(
      <Module2LeverOverview
        assessmentId="AIC-2026-0003"
        onSelectLever={vi.fn()}
        directPriceOppCr={8.8873}
      />
    );

    // By default, detailed methodology is collapsed
    expect(screen.queryByText(/Annual lowest comparable historical unit price methodology/)).not.toBeInTheDocument();

    // Click toggle on Lever 1
    const toggles = screen.getAllByText(UI_STRINGS.module2LeversOverview.collapsibleToggle);
    fireEvent.click(toggles[0]);

    // Now methodology and required fields are visible
    expect(screen.getByText(/Annual lowest comparable historical unit price methodology/)).toBeInTheDocument();
    expect(screen.getAllByText(UI_STRINGS.module2LeversOverview.requiredFieldsTitle).length).toBeGreaterThan(0);
    expect(screen.getAllByText(UI_STRINGS.module2LeversOverview.preconditionsTitle).length).toBeGreaterThan(0);

    // Click again to collapse
    fireEvent.click(toggles[0]);
    expect(screen.queryByText(/Annual lowest comparable historical unit price methodology/)).not.toBeInTheDocument();
  });

  it('uses default fallback opportunities when directPriceOppCr prop is not provided', () => {
    const { rerender } = render(
      <Module2LeverOverview assessmentId="AIC-2026-0002" onSelectLever={vi.fn()} />
    );
    expect(screen.getByText('₹17.12 Cr')).toBeInTheDocument();

    rerender(
      <Module2LeverOverview assessmentId="AIC-2026-0003" onSelectLever={vi.fn()} />
    );
    expect(screen.getByText('₹8.89 Cr')).toBeInTheDocument();
  });
});
