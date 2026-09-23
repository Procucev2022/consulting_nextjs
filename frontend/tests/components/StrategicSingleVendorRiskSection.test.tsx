import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StrategicSingleVendorRiskSection } from '../../src/components/strategicRisk/StrategicSingleVendorRiskSection';
import type { StrategicSingleVendorItem } from '../../src/types';
import { UI_STRINGS } from '../../src/constants';

const mockStrategicSingleVendorItems: StrategicSingleVendorItem[] = [
  {
    material_code: 'MAT-NKL-9980',
    material_desc: 'Refined Nickel Cathodes & Briquettes (Electrolytic 99.8%)',
    total_spend_inr_cr: 1215.81,
    core_bucket: 'Direct Materials',
    unspsc_code: '11101701',
    unspsc_commodity_title: 'Nickel and nickel alloys',
    unspsc_class_title: 'Non ferrous metals and alloys',
    unspsc_class_code: '11101700',
    unspsc_family_title: 'Minerals and ores and metals',
    segment_code: '11000000',
    primary_vendor: {
      vendor_name: 'TRAFIGURA INDIA PRIVATE LIMITED',
      spend_inr_cr: 1215.81,
      share_percentage: 100.0,
      is_primary: true,
      is_secondary_single_digit: false
    },
    risk_level: 'SOLE_SOURCE_CRITICAL',
    risk_score: 99,
    annual_quantity: 4800,
    unit_of_measure: 'MT',
    po_count: 36,
    mitigation_urgency: 'IMMEDIATE_ACTION',
    actionable_mitigation: 'Critical Sole-Source Exposure: 100% dependency on single supplier.',
    suggested_action_plan: ['Execute multi-sourcing tender', 'Buffer inventory']
  },
  {
    material_code: 'MAT-PKG-001',
    material_desc: 'Heavy-Duty Corrugated Master Shipping Boxes',
    total_spend_inr_cr: 450.2,
    core_bucket: 'Packaging Materials',
    unspsc_code: '24111500',
    unspsc_commodity_title: 'Corrugated boxes',
    unspsc_class_title: 'Packaging materials',
    unspsc_class_code: '24111500',
    unspsc_family_title: 'Packaging boxes and bags',
    segment_code: '24000000',
    primary_vendor: {
      vendor_name: 'AMCOR PACKAGING INDIA',
      spend_inr_cr: 420.0,
      share_percentage: 93.3,
      is_primary: true,
      is_secondary_single_digit: true
    },
    risk_level: 'DOMINANT_SUPPLIER_SINGLE_DIGIT_SECONDARY',
    risk_score: 85,
    annual_quantity: 120000,
    unit_of_measure: 'BOX',
    po_count: 48,
    secondary_vendor: {
      vendor_name: 'TCPL PACKAGING',
      spend_inr_cr: 30.2,
      share_percentage: 6.7,
      is_primary: false,
      is_secondary_single_digit: true
    },
    mitigation_urgency: 'SCHEDULED_REVIEW',
    actionable_mitigation: 'Dominant Supplier Risk: Secondary supplier holds less than 7% share.',
    suggested_action_plan: ['Increase secondary allocation', 'Renegotiate tiered pricing']
  }
];

describe('StrategicSingleVendorRiskSection Component', () => {
  const strings = UI_STRINGS.module2.strategicVendorRisk;

  it('renders summary KPI banner with total spend and strategic item counts', () => {
    render(<StrategicSingleVendorRiskSection items={mockStrategicSingleVendorItems} />);

    expect(screen.getByText(strings.kpis.totalAtRiskSpend)).toBeInTheDocument();
    expect(screen.getByText(strings.kpis.soleSourceCount)).toBeInTheDocument();
    expect(screen.getByText(strings.kpis.singleDigitSecondaryCount)).toBeInTheDocument();
    expect(screen.getByText(strings.kpis.avgPrimaryShare)).toBeInTheDocument();
  });

  it('renders all strategic item cards by default in grid view', () => {
    render(<StrategicSingleVendorRiskSection items={mockStrategicSingleVendorItems} />);

    const card = screen.getByTestId(`strategic-card-${mockStrategicSingleVendorItems[0].material_code}`);
    expect(card).toBeInTheDocument();
    expect(screen.getByText(mockStrategicSingleVendorItems[0].material_desc)).toBeInTheDocument();
  });

  it('filters items by risk type: Sole Source vs Single-Digit Secondary', () => {
    render(<StrategicSingleVendorRiskSection items={mockStrategicSingleVendorItems} />);

    // Click Sole Source Only filter
    const soleSourceBtn = screen.getByTestId('filter-sole-source');
    fireEvent.click(soleSourceBtn);

    // Verify sole source items are rendered, dominant items are filtered out
    const soleSourceItem = mockStrategicSingleVendorItems.find(
      (item) => item.risk_level === 'SOLE_SOURCE_CRITICAL'
    );
    const dominantItem = mockStrategicSingleVendorItems.find(
      (item) => item.risk_level === 'DOMINANT_SUPPLIER_SINGLE_DIGIT_SECONDARY'
    );

    if (soleSourceItem) {
      expect(screen.getByTestId(`strategic-card-${soleSourceItem.material_code}`)).toBeInTheDocument();
    }
    if (dominantItem) {
      expect(screen.queryByTestId(`strategic-card-${dominantItem.material_code}`)).toBeNull();
    }

    // Click Single-Digit Secondary Only filter
    const singleDigitBtn = screen.getByTestId('filter-single-digit');
    fireEvent.click(singleDigitBtn);

    if (dominantItem) {
      expect(screen.getByTestId(`strategic-card-${dominantItem.material_code}`)).toBeInTheDocument();
    }
    if (soleSourceItem) {
      expect(screen.queryByTestId(`strategic-card-${soleSourceItem.material_code}`)).toBeNull();
    }

    // Reset to All
    const allBtn = screen.getByTestId('filter-all');
    fireEvent.click(allBtn);
    if (soleSourceItem) {
      expect(screen.getByTestId(`strategic-card-${soleSourceItem.material_code}`)).toBeInTheDocument();
    }
  });

  it('filters items by category dropdown and search query', () => {
    render(<StrategicSingleVendorRiskSection items={mockStrategicSingleVendorItems} />);

    // Category filter
    const categorySelect = screen.getByRole('combobox');
    fireEvent.change(categorySelect, { target: { value: 'Packaging Materials' } });

    const packagingItem = mockStrategicSingleVendorItems.find(
      (item) => item.core_bucket === 'Packaging Materials'
    );
    const directItem = mockStrategicSingleVendorItems.find(
      (item) => item.core_bucket === 'Direct Materials'
    );

    if (packagingItem) {
      expect(screen.getByTestId(`strategic-card-${packagingItem.material_code}`)).toBeInTheDocument();
    }
    if (directItem) {
      expect(screen.queryByTestId(`strategic-card-${directItem.material_code}`)).toBeNull();
    }

    // Reset category to ALL
    fireEvent.change(categorySelect, { target: { value: 'ALL' } });

    // Search query
    const searchInput = screen.getByPlaceholderText(strings.filters.searchPlaceholder);
    fireEvent.change(searchInput, { target: { value: 'Nickel' } });

    expect(screen.getAllByText(/Nickel/i).length).toBeGreaterThan(0);

    // Search for non-existent query to trigger empty message
    fireEvent.change(searchInput, { target: { value: 'XYZNONEXISTENTQUERY999' } });
    expect(screen.getByText(strings.emptyMessage)).toBeInTheDocument();
  });

  it('toggles between Card Grid View and Matrix Table View', () => {
    render(<StrategicSingleVendorRiskSection items={mockStrategicSingleVendorItems} />);

    // Switch to table view
    const tableViewBtn = screen.getByTitle(strings.views.tableView);
    fireEvent.click(tableViewBtn);

    expect(screen.getByText(strings.table.materialCode)).toBeInTheDocument();
    expect(screen.getByText(strings.table.primaryVendor)).toBeInTheDocument();
    expect(screen.getByText(strings.table.secondaryVendor)).toBeInTheDocument();

    // Switch back to grid view
    const gridViewBtn = screen.getByTitle(strings.views.cardView);
    fireEvent.click(gridViewBtn);

    expect(screen.getByTestId(`strategic-card-${mockStrategicSingleVendorItems[0].material_code}`)).toBeInTheDocument();
  });

  it('opens StrategicRiskMitigationModal on card click and closes via close button, escape key, and backdrop click', async () => {
    render(<StrategicSingleVendorRiskSection items={mockStrategicSingleVendorItems} />);

    const firstCard = screen.getByTestId(`strategic-card-${mockStrategicSingleVendorItems[0].material_code}`);
    fireEvent.click(firstCard);

    // Modal dialog should be open
    const modal = await screen.findByRole('dialog');
    expect(modal).toBeInTheDocument();
    expect(screen.getByText(strings.modal.vendorBreakdownTitle)).toBeInTheDocument();
    expect(screen.getByText(strings.modal.mitigationRoadmapTitle)).toBeInTheDocument();

    // Close via close button
    const closeBtn = screen.getByRole('button', { name: strings.modal.closeBtn });
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    // Re-open via keyboard Enter on card
    fireEvent.keyDown(firstCard, { key: 'Enter' });
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    // Close via Escape key
    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    // Re-open via keyboard Space on card
    fireEvent.keyDown(firstCard, { key: ' ' });
    const dialog = await screen.findByRole('dialog');

    // Close via backdrop click
    fireEvent.click(dialog);
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  it('opens modal from Table View action button', async () => {
    render(<StrategicSingleVendorRiskSection items={mockStrategicSingleVendorItems} />);

    // Switch to table view
    const tableViewBtn = screen.getByTitle(strings.views.tableView);
    fireEvent.click(tableViewBtn);

    const actionBtns = screen.getAllByTitle(strings.card.actionBtn);
    expect(actionBtns.length).toBeGreaterThan(0);
    fireEvent.click(actionBtns[0]);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  it('renders modal with Dominant Supplier having single-digit secondary vendor details', async () => {
    const dominantItem = mockStrategicSingleVendorItems.find(
      (item) => item.risk_level === 'DOMINANT_SUPPLIER_SINGLE_DIGIT_SECONDARY'
    );
    expect(dominantItem).toBeDefined();

    render(<StrategicSingleVendorRiskSection items={[dominantItem!]} />);

    const card = screen.getByTestId(`strategic-card-${dominantItem!.material_code}`);
    fireEvent.click(card);

    const modal = await screen.findByRole('dialog');
    expect(modal).toBeInTheDocument();
    expect(screen.getByText('DOMINANT VENDOR: SECONDARY < 10%')).toBeInTheDocument();
    expect(screen.getByText(strings.modal.secondarySingleDigitRole)).toBeInTheDocument();
    expect(screen.getAllByText(dominantItem!.secondary_vendor!.vendor_name).length).toBeGreaterThanOrEqual(1);
  });

  it('exports all subcomponents from strategicRisk index barrel', async () => {
    const barrel = await import('../../src/components/strategicRisk');
    expect(barrel.StrategicRiskSummaryBanner).toBeDefined();
    expect(barrel.StrategicSingleVendorCard).toBeDefined();
    expect(barrel.StrategicRiskMitigationModal).toBeDefined();
    expect(barrel.StrategicSingleVendorRiskSection).toBeDefined();
  });
});
