import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  PoConsolidationSection,
  PoConsolidationSummaryBanner,
  PoConsolidationCard,
  PoConsolidationModal
} from '../../../src/components/poConsolidation';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import { MOCK_MULTIPLE_PO_ITEMS } from '../../../src/data/mockPoConsolidation';

describe('PoConsolidationSection Component', () => {
  it('should render section header, badge, subtitle, and KPI summary banner', () => {
    render(<PoConsolidationSection />);

    expect(screen.getByText(UI_STRINGS.poConsolidation.badge)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.poConsolidation.title)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.poConsolidation.kpiTotalSpendLabel)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.poConsolidation.kpiTotalCurrentPosLabel)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.poConsolidation.kpiTargetPosLabel)).toBeInTheDocument();
    expect(screen.getAllByText(UI_STRINGS.poConsolidation.kpiEconomiesOfScaleLabel).length).toBeGreaterThan(0);
  });

  it('should switch global cadence simulator and update target KPIs', () => {
    render(<PoConsolidationSection />);

    // Click Annual in global simulation bar
    const annualBtn = screen.getByRole('button', { name: UI_STRINGS.poConsolidation.cadenceShortLabels.annual });
    fireEvent.click(annualBtn);

    // Target POs should be 6 POs/Yr (1 per supplier)
    expect(screen.getByText(/6 POs\/Yr/)).toBeInTheDocument();

    // Click Monthly in simulation bar
    const monthlyBtn = screen.getByRole('button', { name: UI_STRINGS.poConsolidation.cadenceShortLabels.monthly });
    fireEvent.click(monthlyBtn);

    // Target POs should be 72 POs/Yr (12 per supplier)
    expect(screen.getByText(/72 POs\/Yr/)).toBeInTheDocument();
  });

  it('should filter items by category tabs', () => {
    render(<PoConsolidationSection />);

    const packagingTab = screen.getByRole('button', { name: 'Packaging Materials' });
    fireEvent.click(packagingTab);

    expect(screen.getByText('SIGNODE INDIA LIMITED')).toBeInTheDocument();
    expect(screen.queryByText('JINDAL STAINLESS LIMITED')).not.toBeInTheDocument();

    // Back to All
    const allTab = screen.getByRole('button', { name: UI_STRINGS.poConsolidation.filterAll });
    fireEvent.click(allTab);
    expect(screen.getByText('JINDAL STAINLESS LIMITED')).toBeInTheDocument();
  });

  it('should filter items by live search query and display empty state when not found', () => {
    render(<PoConsolidationSection />);

    const searchInput = screen.getByPlaceholderText(UI_STRINGS.poConsolidation.searchPlaceholder);
    fireEvent.change(searchInput, { target: { value: 'Trafigura' } });

    expect(screen.getByText('TRAFIGURA INDIA PRIVATE LIMITED')).toBeInTheDocument();
    expect(screen.queryByText('SIGNODE INDIA LIMITED')).not.toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: 'NonexistentSearchTermXYZ' } });
    expect(screen.getByText(UI_STRINGS.poConsolidation.noResultsFound)).toBeInTheDocument();
  });

  it('should toggle between card view and matrix table view', () => {
    render(<PoConsolidationSection />);

    // Click Table View
    const tableBtn = screen.getByRole('button', { name: UI_STRINGS.poConsolidation.viewTable });
    fireEvent.click(tableBtn);

    expect(screen.getByText(UI_STRINGS.poConsolidation.matrixColSupplier)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.poConsolidation.matrixColSpend)).toBeInTheDocument();

    // Click Grid View
    const gridBtn = screen.getByRole('button', { name: UI_STRINGS.poConsolidation.viewGrid });
    fireEvent.click(gridBtn);

    expect(screen.getAllByText(UI_STRINGS.poConsolidation.exploreConsolidationBtn).length).toBeGreaterThan(0);
  });

  it('should open modal when clicking explore CTA, change cadence inside modal, and generate draft', () => {
    render(<PoConsolidationSection />);

    const exploreBtns = screen.getAllByRole('button', { name: UI_STRINGS.poConsolidation.exploreConsolidationBtn });
    fireEvent.click(exploreBtns[0]);

    // Modal is open
    expect(screen.getByText(UI_STRINGS.poConsolidation.modalBadge)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.poConsolidation.scaleTierLadderTitle)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.poConsolidation.strategyTitle)).toBeInTheDocument();

    // Change cadence inside modal
    const modalMonthlyBtn = screen.getByRole('button', { name: /Monthly Single PO/i });
    fireEvent.click(modalMonthlyBtn);

    // Click Generate Master Blanket PO Draft
    const generateBtn = screen.getByRole('button', { name: UI_STRINGS.poConsolidation.applyConsolidationBtn });
    fireEvent.click(generateBtn);

    expect(screen.getByText(UI_STRINGS.poConsolidation.consolidationDraftSuccess)).toBeInTheDocument();

    // Close modal via close button
    const closeBtns = screen.getAllByRole('button', { name: UI_STRINGS.poConsolidation.closeModalBtn });
    fireEvent.click(closeBtns[0]);

    expect(screen.queryByText(UI_STRINGS.poConsolidation.modalBadge)).not.toBeInTheDocument();
  });

  it('should open modal from table view consolidate button and close with X icon', () => {
    render(<PoConsolidationSection />);

    const tableBtn = screen.getByRole('button', { name: UI_STRINGS.poConsolidation.viewTable });
    fireEvent.click(tableBtn);

    const consolidateBtns = screen.getAllByRole('button', { name: 'Consolidate' });
    fireEvent.click(consolidateBtns[0]);

    expect(screen.getByText(UI_STRINGS.poConsolidation.modalBadge)).toBeInTheDocument();

    // Close with X button
    const closeX = screen.getByRole('button', { name: 'Close' });
    fireEvent.click(closeX);

    expect(screen.queryByText(UI_STRINGS.poConsolidation.modalBadge)).not.toBeInTheDocument();
  });

  it('should change cadence directly on an individual card and sort items', () => {
    render(<PoConsolidationSection />);

    // Click individual card cadence button
    const cardCadenceBtns = screen.getAllByRole('button', { name: /6-Month/i });
    fireEvent.click(cardCadenceBtns[0]);

    // Change sort
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'SPEND_DESC' } });
    expect(select).toHaveValue('SPEND_DESC');

    fireEvent.change(select, { target: { value: 'SAVINGS_DESC' } });
    expect(select).toHaveValue('SAVINGS_DESC');
  });
});
