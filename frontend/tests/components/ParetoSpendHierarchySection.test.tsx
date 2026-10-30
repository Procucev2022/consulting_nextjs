import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ParetoSpendHierarchySection } from '@/components/ParetoSpendHierarchySection';
import { UI_STRINGS } from '@/constants';
import type { ParetoHierarchyParent } from '@/types';

describe('ParetoSpendHierarchySection Component', () => {
  const strings = UI_STRINGS.module1.paretoHierarchy;

  it('renders with default seed data and displays default Vendor tab', () => {
    render(<ParetoSpendHierarchySection />);

    // Titles and badges
    expect(screen.getByText(strings.sectionTitle)).toBeInTheDocument();
    expect(screen.getByText(strings.badge)).toBeInTheDocument();
    expect(screen.getByText(strings.excelViewBadge)).toBeInTheDocument();

    // Column headers for Vendor-first tab
    expect(screen.getByText(strings.vendorColumn)).toBeInTheDocument();
    expect(screen.getByText(strings.itemColumn)).toBeInTheDocument();
    expect(screen.getByText(strings.spendColumn)).toBeInTheDocument();

    // Default top vendors should be present (e.g. JINDAL STAINLESS, TRAFIGURA)
    expect(screen.getByText('TRAFIGURA INDIA PRIVATE LIMITED')).toBeInTheDocument();
  });

  it('toggles expansion of a parent row on click to show/hide collapsible children', () => {
    render(<ParetoSpendHierarchySection />);

    const trafiguraRow = screen.getByText('TRAFIGURA INDIA PRIVATE LIMITED');
    expect(trafiguraRow).toBeInTheDocument();

    // Initially collapsed: child items are not visible
    expect(screen.queryByText('FERRO NICKEL - NI% 10 - 14')).not.toBeInTheDocument();

    // Click parent row to expand
    fireEvent.click(trafiguraRow);

    // Now child items should be visible
    expect(screen.getByText('FERRO NICKEL - NI% 10 - 14')).toBeInTheDocument();
    expect(screen.getByText('FERRO NICKEL')).toBeInTheDocument();

    // Click again to collapse
    fireEvent.click(trafiguraRow);
    expect(screen.queryByText('FERRO NICKEL - NI% 10 - 14')).not.toBeInTheDocument();
  });

  it('expands and collapses all rows with toolbar action buttons', () => {
    render(<ParetoSpendHierarchySection />);

    const expandAllBtn = screen.getByText(strings.expandAll);
    const collapseAllBtn = screen.getByText(strings.collapseAll);

    // Expand All
    fireEvent.click(expandAllBtn);
    expect(screen.getByText('FERRO NICKEL - NI% 10 - 14')).toBeInTheDocument();

    // Collapse All
    fireEvent.click(collapseAllBtn);
    expect(screen.queryByText('FERRO NICKEL - NI% 10 - 14')).not.toBeInTheDocument();
  });

  it('switches to Item tab (Item → Vendor) and updates column hierarchy', () => {
    render(<ParetoSpendHierarchySection />);

    const itemTabBtn = screen.getByText(strings.tabItemFirst);
    fireEvent.click(itemTabBtn);

    // Top item in seed data should be NICKEL
    const nickelItem = screen.getByText('NICKEL');
    expect(nickelItem).toBeInTheDocument();

    // Expand NICKEL row to see supplying vendors
    fireEvent.click(nickelItem);
    // TRAFIGURA supplies nickel
    const vendorsUnderNickel = screen.getAllByText('TRAFIGURA INDIA PRIVATE LIMITED');
    expect(vendorsUnderNickel.length).toBeGreaterThan(0);

    // Switch back to Vendor tab
    const vendorTabBtn = screen.getByText(strings.tabVendorFirst);
    fireEvent.click(vendorTabBtn);
    expect(screen.getByText(strings.tabVendorFirst)).toBeInTheDocument();
  });

  it('filters rows based on search input query', () => {
    render(<ParetoSpendHierarchySection />);

    const searchInput = screen.getByPlaceholderText(strings.searchPlaceholder);

    // Search for Trafigura
    fireEvent.change(searchInput, { target: { value: 'TRAFIGURA' } });
    expect(screen.getByText('TRAFIGURA INDIA PRIVATE LIMITED')).toBeInTheDocument();
    expect(screen.queryByText('TATA STEEL LIMITED')).not.toBeInTheDocument();

    // Search for non-existent text
    fireEvent.change(searchInput, { target: { value: 'NONEXISTENT_XYZ' } });
    expect(screen.getByText(strings.noRecords)).toBeInTheDocument();

    // Clear search
    fireEvent.change(searchInput, { target: { value: '' } });
    expect(screen.getByText('TRAFIGURA INDIA PRIVATE LIMITED')).toBeInTheDocument();
  });

  it('renders custom hierarchy and currency props properly', () => {
    const customVendorHierarchy: ParetoHierarchyParent[] = [
      {
        id: 'v-1',
        name: 'CUSTOM SUPPLIER CORP',
        totalSpendCr: 150.75,
        sharePct: 100,
        cumulativeSpendCr: 150.75,
        cumulativePct: 100,
        children: [
          { name: 'CUSTOM RAW MATERIAL', spendCr: 150.75, percentage: 100 }
        ]
      }
    ];

    render(
      <ParetoSpendHierarchySection
        vendorHierarchy={customVendorHierarchy}
        totalSpendCr={150.75}
        currency="$"
      />
    );

    expect(screen.getByText('CUSTOM SUPPLIER CORP')).toBeInTheDocument();
    expect(screen.getByText('$ 150.75')).toBeInTheDocument();

    // Expand
    fireEvent.click(screen.getByText('CUSTOM SUPPLIER CORP'));
    expect(screen.getByText('CUSTOM RAW MATERIAL')).toBeInTheDocument();
  });

  it('resets search query and expanded items when switching between vendor and item tabs', () => {
    render(<ParetoSpendHierarchySection />);

    const searchInput = screen.getByPlaceholderText(strings.searchPlaceholder);

    // Search on Vendor tab
    fireEvent.change(searchInput, { target: { value: 'TRAFIGURA' } });
    expect(screen.getByText('TRAFIGURA INDIA PRIVATE LIMITED')).toBeInTheDocument();

    // Switch to Item tab
    const itemTabBtn = screen.getByText(strings.tabItemFirst);
    fireEvent.click(itemTabBtn);

    // Search query should be cleared, not showing "No records matching search filter"
    expect(screen.queryByText(strings.noRecords)).not.toBeInTheDocument();
    expect(screen.getByText('NICKEL')).toBeInTheDocument();

    // Switch back to Vendor tab
    const vendorTabBtn = screen.getByText(strings.tabVendorFirst);
    fireEvent.click(vendorTabBtn);
    expect(screen.getByText('TRAFIGURA INDIA PRIVATE LIMITED')).toBeInTheDocument();
  });

  it('clears search input via the Clear Search button (X icon)', () => {
    render(<ParetoSpendHierarchySection />);

    const searchInput = screen.getByPlaceholderText(strings.searchPlaceholder);
    fireEvent.change(searchInput, { target: { value: 'TRAFIGURA' } });
    expect(screen.queryByText('JINDAL STAINLESS LIMITED')).not.toBeInTheDocument();

    const clearBtn = screen.getByTitle(strings.clearSearch);
    fireEvent.click(clearBtn);

    // All entities should be restored
    expect(screen.getByText('JINDAL STAINLESS LIMITED')).toBeInTheDocument();
  });

  it('displays Short Text unavailable when a parent genuinely has zero children', () => {
    const parentWithoutChildren: ParetoHierarchyParent[] = [
      {
        id: 'v-empty',
        name: 'SUPPLIER WITH NO ITEMS',
        totalSpendCr: 10.0,
        sharePct: 100,
        cumulativeSpendCr: 10.0,
        cumulativePct: 100,
        children: []
      }
    ];

    render(
      <ParetoSpendHierarchySection
        vendorHierarchy={parentWithoutChildren}
        totalSpendCr={10.0}
      />
    );

    expect(screen.getByText('SUPPLIER WITH NO ITEMS')).toBeInTheDocument();
    expect(screen.getByText(strings.unavailableShortText)).toBeInTheDocument();
    expect(screen.queryByText('0 items')).not.toBeInTheDocument();
  });
});
