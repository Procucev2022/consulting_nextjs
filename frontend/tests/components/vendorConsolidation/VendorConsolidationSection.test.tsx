import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  VendorConsolidationSection,
  VendorConsolidationSummaryBanner,
  VendorConsolidationCard,
  VendorConsolidationModal,
  getCategoryBadgeClass,
  getSupplierTierBadgeClass
} from '../../../src/components/vendorConsolidation';
import { calculateVendorConsolidationSummary } from '../../../src/utils/step2Consolidation';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import type { RecurringConsolidationItem } from '../../../src/types/vendorConsolidation';

const mockRecurringConsolidationItems: RecurringConsolidationItem[] = [
  {
    id: 'VC-PKG-01',
    category: 'Packaging Materials',
    item_group_title: 'Corrugated Packaging & Heavy-Duty Shipper Cartons',
    item_group_code: 'PKG-BOX-CORR',
    unspsc_family: 'Packaging Materials',
    unspsc_code: '24121500',
    total_spend_inr_cr: 18.4,
    vendor_count: 5,
    recurring_monthly: true,
    procurement_cadence: 'Monthly Reorder',
    monthly_po_avg: 14,
    annual_units: 1250000,
    unit_of_measure: 'Boxes',
    price_variance_pct: 22.4,
    target_consolidated_vendors: 2,
    est_volume_savings_pct: 12.5,
    est_volume_savings_cr: 2.3,
    recommended_auction_type: 'Rank-Based Reverse Auction',
    auction_platform: 'Procucev e-Sourcing Suite',
    suppliers: [
      {
        vendor_id: 'VND-PKG-01',
        vendor_name: 'Apex Corrugated Packaging Ltd',
        annual_spend_inr_cr: 8.2,
        spend_share_pct: 44.5,
        unit_rate_index: 100,
        monthly_po_count: 6,
        status: 'Primary'
      },
      {
        vendor_id: 'VND-PKG-02',
        vendor_name: 'Metro Box & Containers Inc',
        annual_spend_inr_cr: 5.4,
        spend_share_pct: 29.3,
        unit_rate_index: 114,
        monthly_po_count: 4,
        status: 'Incumbent'
      },
      {
        vendor_id: 'VND-PKG-03',
        vendor_name: 'QuickPack Logistics & Supplies',
        annual_spend_inr_cr: 4.8,
        spend_share_pct: 26.2,
        unit_rate_index: 122,
        monthly_po_count: 4,
        status: 'Spot / Peripheral'
      }
    ],
    consolidation_roadmap: [
      'Standardize box specs',
      'Conduct multi-round reverse auction',
      'Allocate 70/30 volume split'
    ]
  },
  {
    id: 'VC-DIR-02',
    category: 'Direct Materials',
    item_group_title: 'Industrial Process Solvents & Specialty Cleaning Chemicals',
    item_group_code: 'DIR-SOLV-PROC',
    unspsc_family: 'Solvents',
    unspsc_code: '12142100',
    total_spend_inr_cr: 24.6,
    vendor_count: 4,
    recurring_monthly: true,
    procurement_cadence: 'Monthly Reorder',
    monthly_po_avg: 18,
    annual_units: 450000,
    unit_of_measure: 'Liters',
    price_variance_pct: 18.5,
    target_consolidated_vendors: 2,
    est_volume_savings_pct: 10.0,
    est_volume_savings_cr: 2.46,
    recommended_auction_type: 'Dynamic English Reverse Auction',
    auction_platform: 'Procucev e-Sourcing Suite',
    suppliers: [
      {
        vendor_id: 'VND-CHM-01',
        vendor_name: 'Reliance Petrochem Supply',
        annual_spend_inr_cr: 12.0,
        spend_share_pct: 48.8,
        unit_rate_index: 100,
        monthly_po_count: 8,
        status: 'Primary'
      }
    ],
    consolidation_roadmap: [
      'Standardize solvent purity specifications',
      'Execute 2-year framework contract'
    ]
  }
];

describe('Vendor Consolidation Components Suite', () => {
  const sampleItem = mockRecurringConsolidationItems[0];
  const summary = calculateVendorConsolidationSummary(mockRecurringConsolidationItems);

  describe('Badge Class Helpers', () => {
    it('returns expected category badge classes for all categories and fallback', () => {
      expect(getCategoryBadgeClass('Packaging Materials')).toContain('bg-blue-100');
      expect(getCategoryBadgeClass('Indirect & MRO')).toContain('bg-purple-100');
      expect(getCategoryBadgeClass('Logistics & Freight')).toContain('bg-emerald-100');
      expect(getCategoryBadgeClass('Direct Materials')).toContain('bg-cyan-100');
      expect(getCategoryBadgeClass('Unknown Category')).toContain('bg-cyan-100');
    });

    it('returns expected supplier tier badge classes for all tiers', () => {
      expect(getSupplierTierBadgeClass('Primary')).toContain('bg-cyan-100');
      expect(getSupplierTierBadgeClass('Incumbent')).toContain('bg-blue-100');
      expect(getSupplierTierBadgeClass('Spot / Peripheral')).toContain('bg-slate-100');
    });
  });

  describe('VendorConsolidationSummaryBanner', () => {
    it('renders all 4 executive summary KPI metrics', () => {
      render(<VendorConsolidationSummaryBanner summary={summary} />);

      expect(screen.getByText(UI_STRINGS.vendorConsolidation.kpiTotalSpendLabel)).toBeInTheDocument();
      expect(screen.getByText(`₹${summary.totalFragmentedSpendCr.toFixed(2)} Cr`)).toBeInTheDocument();

      expect(screen.getByText(UI_STRINGS.vendorConsolidation.kpiCategoriesCountLabel)).toBeInTheDocument();
      expect(screen.getByText(summary.categoriesCount.toString())).toBeInTheDocument();

      expect(screen.getByText(UI_STRINGS.vendorConsolidation.kpiActiveVendorsLabel)).toBeInTheDocument();
      expect(screen.getByText(`${summary.totalActiveVendors} Suppliers`)).toBeInTheDocument();

      expect(screen.getByText(UI_STRINGS.vendorConsolidation.kpiVolumeSavingsLabel)).toBeInTheDocument();
      expect(screen.getByText(`₹${summary.potentialVolumeSavingsCr.toFixed(2)} Cr`)).toBeInTheDocument();
    });
  });

  describe('VendorConsolidationCard', () => {
    it('renders card details and handles initiate consolidation callback', () => {
      const onInitiate = vi.fn();
      render(<VendorConsolidationCard item={sampleItem} onInitiateConsolidation={onInitiate} />);

      expect(screen.getByText(sampleItem.item_group_title)).toBeInTheDocument();
      expect(screen.getByText(`₹${sampleItem.total_spend_inr_cr.toFixed(2)} Cr`)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.vendorConsolidation.recurringCadenceBadge)).toBeInTheDocument();
      expect(
        screen.getByText(UI_STRINGS.vendorConsolidation.vendorCountBadge(sampleItem.vendor_count))
      ).toBeInTheDocument();
      expect(
        screen.getByText(UI_STRINGS.vendorConsolidation.priceVarianceValue(sampleItem.price_variance_pct))
      ).toBeInTheDocument();

      const btn = screen.getByRole('button', {
        name: new RegExp(UI_STRINGS.vendorConsolidation.initiateConsolidationBtn, 'i')
      });
      fireEvent.click(btn);
      expect(onInitiate).toHaveBeenCalledWith(sampleItem);
    });

    it('renders card with Direct Materials category correctly', () => {
      const directItem = mockRecurringConsolidationItems[1];
      render(<VendorConsolidationCard item={directItem} onInitiateConsolidation={vi.fn()} />);
      expect(screen.getByText(directItem.item_group_title)).toBeInTheDocument();
    });
  });

  describe('VendorConsolidationModal', () => {
    it('renders null when not open or item is null', () => {
      const { container: c1 } = render(
        <VendorConsolidationModal item={sampleItem} isOpen={false} onClose={vi.fn()} />
      );
      expect(c1.firstChild).toBeNull();

      const { container: c2 } = render(
        <VendorConsolidationModal item={null} isOpen={true} onClose={vi.fn()} />
      );
      expect(c2.firstChild).toBeNull();
    });

    it('renders modal details, supplier breakdown table, and handles launch auction and close', () => {
      const onClose = vi.fn();
      render(<VendorConsolidationModal item={sampleItem} isOpen={true} onClose={onClose} />);

      // Title & badge
      expect(
        screen.getByText(UI_STRINGS.vendorConsolidation.modalTitle(sampleItem.item_group_title))
      ).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.vendorConsolidation.modalBadge)).toBeInTheDocument();

      // Suppliers in table
      sampleItem.suppliers.forEach((sup) => {
        expect(screen.getByText(sup.vendor_name)).toBeInTheDocument();
      });

      // Target allocations & parameters
      expect(screen.getByText(UI_STRINGS.vendorConsolidation.targetAllocationPrimary)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.vendorConsolidation.targetAllocationSecondary)).toBeInTheDocument();
      expect(screen.getByText(sampleItem.recommended_auction_type)).toBeInTheDocument();

      // Launch Auction button click
      const launchBtns = screen.getAllByRole('button', {
        name: new RegExp(UI_STRINGS.vendorConsolidation.launchAuctionBtn, 'i')
      });
      fireEvent.click(launchBtns[0]);
      expect(screen.getByText(UI_STRINGS.vendorConsolidation.auctionSuccessMessage)).toBeInTheDocument();

      // Close button
      const closeBtns = screen.getAllByRole('button', {
        name: new RegExp(UI_STRINGS.vendorConsolidation.closeModalBtn, 'i')
      });
      fireEvent.click(closeBtns[0]);
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('VendorConsolidationSection', () => {
    it('renders section and handles category filtering, search, sorting, and view toggle', () => {
      render(<VendorConsolidationSection items={mockRecurringConsolidationItems} />);

      // Section title & badge
      expect(screen.getByText(UI_STRINGS.vendorConsolidation.title)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.vendorConsolidation.badge)).toBeInTheDocument();

      // Filter by category: Direct Materials
      const directTab = screen.getByRole('button', { name: 'Direct Materials' });
      fireEvent.click(directTab);
      expect(screen.getByText('Industrial Process Solvents & Specialty Cleaning Chemicals')).toBeInTheDocument();

      // Filter back to ALL
      const allTab = screen.getByRole('button', { name: UI_STRINGS.vendorConsolidation.filterAll });
      fireEvent.click(allTab);

      // Search input
      const searchInput = screen.getByPlaceholderText(UI_STRINGS.vendorConsolidation.searchPlaceholder);
      fireEvent.change(searchInput, { target: { value: 'Packaging' } });
      expect(screen.getByText('Corrugated Packaging & Heavy-Duty Shipper Cartons')).toBeInTheDocument();

      // Search non-existent query
      fireEvent.change(searchInput, { target: { value: 'NonExistentProductZ999' } });
      expect(screen.getByText(UI_STRINGS.vendorConsolidation.noResultsFound)).toBeInTheDocument();

      // Clear search
      fireEvent.change(searchInput, { target: { value: '' } });

      // Sort by Vendor Count
      const sortSelect = screen.getByRole('combobox', { name: new RegExp(UI_STRINGS.vendorConsolidation.sortByLabel, 'i') });
      fireEvent.change(sortSelect, { target: { value: 'VENDORS_DESC' } });
      fireEvent.change(sortSelect, { target: { value: 'SAVINGS_DESC' } });
      fireEvent.change(sortSelect, { target: { value: 'SPEND_DESC' } });

      // View toggle to Matrix Table
      const tableViewBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.vendorConsolidation.viewTable, 'i') });
      fireEvent.click(tableViewBtn);
      expect(screen.getByText(UI_STRINGS.vendorConsolidation.matrixColItemGroup)).toBeInTheDocument();

      // Open modal from table row
      const consolidateBtns = screen.getAllByRole('button', { name: 'Consolidate' });
      fireEvent.click(consolidateBtns[0]);
      expect(screen.getByText(UI_STRINGS.vendorConsolidation.modalBadge)).toBeInTheDocument();

      // Close modal
      const modalCloseBtns = screen.getAllByRole('button', {
        name: new RegExp(UI_STRINGS.vendorConsolidation.closeModalBtn, 'i')
      });
      fireEvent.click(modalCloseBtns[1]);

      // View toggle back to Card Grid
      const gridViewBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.vendorConsolidation.viewGrid, 'i') });
      fireEvent.click(gridViewBtn);
    });

    it('renders with default items when no items prop is passed', () => {
      render(<VendorConsolidationSection />);
      expect(screen.getByText(UI_STRINGS.vendorConsolidation.title)).toBeInTheDocument();
    });
  });
});
