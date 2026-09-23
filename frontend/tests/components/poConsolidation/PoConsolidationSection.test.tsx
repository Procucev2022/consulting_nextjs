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
import type { MultiplePoItem } from '../../../src/types/poConsolidation';

function buildTestCadence(annualPos: number, spendCr: number) {
  return {
    MONTHLY: {
      cadence: 'MONTHLY' as const,
      label: 'Monthly Single PO',
      target_pos_per_year: 12,
      po_reduction_pct: 50,
      scale_discount_pct: 4,
      scale_savings_cr: 0.4,
      admin_savings_lakhs: 5,
      total_benefit_cr: 0.45
    },
    QUARTERLY: {
      cadence: 'QUARTERLY' as const,
      label: 'Quarterly Batching',
      target_pos_per_year: 4,
      po_reduction_pct: 80,
      scale_discount_pct: 8,
      scale_savings_cr: 0.8,
      admin_savings_lakhs: 8,
      total_benefit_cr: 0.88
    },
    HALF_YEARLY: {
      cadence: 'HALF_YEARLY' as const,
      label: '6-Month / Semi-Annual',
      target_pos_per_year: 2,
      po_reduction_pct: 90,
      scale_discount_pct: 11,
      scale_savings_cr: 1.1,
      admin_savings_lakhs: 10,
      total_benefit_cr: 1.2
    },
    ANNUAL: {
      cadence: 'ANNUAL' as const,
      label: 'Annual Blanket PO',
      target_pos_per_year: 1,
      po_reduction_pct: 95,
      scale_discount_pct: 14,
      scale_savings_cr: 1.4,
      admin_savings_lakhs: 12,
      total_benefit_cr: 1.52
    }
  };
}

const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
const testMonthlyDistribution = months.map((m) => ({
  month: m,
  po_count: 3,
  spend_inr_lakhs: 100
}));

const TEST_PO_ITEMS: MultiplePoItem[] = [
  {
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
    monthly_distribution: testMonthlyDistribution,
    cadence_options: buildTestCadence(36, 1215.81),
    recommended_cadence: 'QUARTERLY',
    best_practice_recommendation: 'Transition to quarterly releases',
    blanket_po_strategy: 'Execute annual frame agreement'
  },
  {
    id: 'PO-02',
    vendor_id: 'VND-02',
    vendor_name: 'JINDAL STAINLESS LIMITED',
    item_description: 'Stainless Steel Melting Scrap',
    material_code: 'MAT-SS-01',
    category: 'Direct Materials',
    annual_po_count: 42,
    total_annual_spend_cr: 1450.2,
    avg_pos_per_month: 3.5,
    avg_po_value_lakhs: 345.3,
    primary_plant: 'Plant 1000',
    monthly_distribution: testMonthlyDistribution,
    cadence_options: buildTestCadence(42, 1450.2),
    recommended_cadence: 'QUARTERLY',
    best_practice_recommendation: 'Transition to quarterly releases',
    blanket_po_strategy: 'Execute annual frame agreement'
  },
  {
    id: 'PO-03',
    vendor_id: 'VND-03',
    vendor_name: 'SIGNODE INDIA LIMITED',
    item_description: 'Packaging Strapping and Stretch Wrap',
    material_code: 'MAT-PKG-01',
    category: 'Packaging Materials',
    annual_po_count: 54,
    total_annual_spend_cr: 85.0,
    avg_pos_per_month: 4.5,
    avg_po_value_lakhs: 15.7,
    primary_plant: 'Plant 2000',
    monthly_distribution: testMonthlyDistribution,
    cadence_options: buildTestCadence(54, 85.0),
    recommended_cadence: 'QUARTERLY',
    best_practice_recommendation: 'Transition to quarterly releases',
    blanket_po_strategy: 'Execute annual frame agreement'
  },
  {
    id: 'PO-04',
    vendor_id: 'VND-04',
    vendor_name: 'TCI FREIGHT LOGISTICS',
    item_description: 'Primary FTL Transportation',
    material_code: 'MAT-FRT-01',
    category: 'Logistics & Freight',
    annual_po_count: 68,
    total_annual_spend_cr: 54.3,
    avg_pos_per_month: 5.6,
    avg_po_value_lakhs: 8.0,
    primary_plant: 'Plant 1000',
    monthly_distribution: testMonthlyDistribution,
    cadence_options: buildTestCadence(68, 54.3),
    recommended_cadence: 'QUARTERLY',
    best_practice_recommendation: 'Transition to quarterly releases',
    blanket_po_strategy: 'Execute annual frame agreement'
  },
  {
    id: 'PO-05',
    vendor_id: 'VND-05',
    vendor_name: 'SKF BEARING TECHNOLOGIES',
    item_description: 'Deep Groove Ball Bearings',
    material_code: 'MAT-BRG-01',
    category: 'Indirect & MRO',
    annual_po_count: 28,
    total_annual_spend_cr: 22.1,
    avg_pos_per_month: 2.3,
    avg_po_value_lakhs: 7.9,
    primary_plant: 'Plant 3000',
    monthly_distribution: testMonthlyDistribution,
    cadence_options: buildTestCadence(28, 22.1),
    recommended_cadence: 'QUARTERLY',
    best_practice_recommendation: 'Transition to quarterly releases',
    blanket_po_strategy: 'Execute annual frame agreement'
  },
  {
    id: 'PO-06',
    vendor_id: 'VND-06',
    vendor_name: 'HONEYWELL INDUSTRIAL AUTOMATION',
    item_description: 'DCS System Sensors and Transmitters',
    material_code: 'MAT-AUT-01',
    category: 'Indirect & MRO',
    annual_po_count: 32,
    total_annual_spend_cr: 35.4,
    avg_pos_per_month: 2.6,
    avg_po_value_lakhs: 11.0,
    primary_plant: 'Plant 1000',
    monthly_distribution: testMonthlyDistribution,
    cadence_options: buildTestCadence(32, 35.4),
    recommended_cadence: 'QUARTERLY',
    best_practice_recommendation: 'Transition to quarterly releases',
    blanket_po_strategy: 'Execute annual frame agreement'
  }
];

describe('PoConsolidationSection Component', () => {
  it('should render section header, badge, subtitle, and KPI summary banner', () => {
    render(<PoConsolidationSection items={TEST_PO_ITEMS} />);

    expect(screen.getByText(UI_STRINGS.poConsolidation.badge)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.poConsolidation.title)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.poConsolidation.kpiTotalSpendLabel)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.poConsolidation.kpiTotalCurrentPosLabel)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.poConsolidation.kpiTargetPosLabel)).toBeInTheDocument();
    expect(screen.getAllByText(UI_STRINGS.poConsolidation.kpiEconomiesOfScaleLabel).length).toBeGreaterThan(0);
  });

  it('should switch global cadence simulator and update target KPIs', () => {
    render(<PoConsolidationSection items={TEST_PO_ITEMS} />);

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
    render(<PoConsolidationSection items={TEST_PO_ITEMS} />);

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
    render(<PoConsolidationSection items={TEST_PO_ITEMS} />);

    const searchInput = screen.getByPlaceholderText(UI_STRINGS.poConsolidation.searchPlaceholder);
    fireEvent.change(searchInput, { target: { value: 'Trafigura' } });

    expect(screen.getByText('TRAFIGURA INDIA PRIVATE LIMITED')).toBeInTheDocument();
    expect(screen.queryByText('SIGNODE INDIA LIMITED')).not.toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: 'NonexistentSearchTermXYZ' } });
    expect(screen.getByText(UI_STRINGS.poConsolidation.noResultsFound)).toBeInTheDocument();
  });

  it('should toggle between card view and matrix table view', () => {
    render(<PoConsolidationSection items={TEST_PO_ITEMS} />);

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
    render(<PoConsolidationSection items={TEST_PO_ITEMS} />);

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
    render(<PoConsolidationSection items={TEST_PO_ITEMS} />);

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
    render(<PoConsolidationSection items={TEST_PO_ITEMS} />);

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

  it('renders clean empty state when empty items prop is passed', () => {
    render(<PoConsolidationSection items={[]} />);
    expect(screen.getByText(UI_STRINGS.poConsolidation.title)).toBeInTheDocument();
  });
});
