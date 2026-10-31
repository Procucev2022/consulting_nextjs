import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VendorSupplyYoYBadge } from '../../src/components/vendorSupply/VendorSupplyYoYBadge';
import { VendorSupplyAlarmBanner } from '../../src/components/vendorSupply/VendorSupplyAlarmBanner';
import { VendorSupplyMetricsCards } from '../../src/components/vendorSupply/VendorSupplyMetricsCards';
import { VendorSupplyTierDistribution } from '../../src/components/vendorSupply/VendorSupplyTierDistribution';
import { VendorSupplyItemDetailsModal } from '../../src/components/vendorSupply/VendorSupplyItemDetailsModal';
import { VendorSupplyFilterBar } from '../../src/components/vendorSupply/VendorSupplyFilterBar';
import { VendorSupplyTable } from '../../src/components/vendorSupply/VendorSupplyTable';
import { computeVendorSupplyOverview } from '../../src/utils/vendorSupplyCalculator';
import { UI_STRINGS } from '../../src/constants/uiStrings';
import type { VendorSupplyRecord } from '../../src/types/vendorSupply';

const mockTop50VendorsSupply: VendorSupplyRecord[] = [
  {
    rank: 1,
    vendor_name: 'Acme Chemical Global LLC',
    master_vendor_id: 'VND-ACM-101',
    total_spend_inr_cr: 25.5,
    spend_fy24_cr: 7.0,
    spend_fy25_cr: 8.5,
    spend_fy26_cr: 10.0,
    yoy_growth_pct: 17.6,
    category_type: 'MULTI_CATEGORY',
    category_count: 3,
    primary_category: 'Chemicals & Solvents',
    supplied_categories: ['Chemicals & Solvents', 'Packaging Materials', 'Industrial Gases'],
    irrelevant_categories: ['Packaging Materials'],
    line_items_count: 42,
    risk_level: 'HIGH_RISK',
    observation_note: 'Multi-category spend detected with packaging crossover',
    spend_share_pct: 12.5,
    spend_yoy_pct: 8.5,
    qty_yoy_pct: 3.2,
    price_yoy_pct: 5.1,
    yoy_observation_mark: 'Inflation observed',
    yoy_remark: 'Price revised',
    top_items: [
      {
        material_code: 'MAT-CHEM-01',
        material_description: 'Industrial Methanol 99%',
        po_number: 'PO-2026-901',
        unspsc_code: '12142104',
        unspsc_title: 'Methanol',
        spend_yoy_pct: 9.2,
        qty_yoy_pct: 3.5,
        price_yoy_pct: 5.5,
        observation_mark: 'Global price index hike',
        remark: 'Annual supply agreement'
      }
    ]
  },
  {
    rank: 2,
    vendor_name: 'Apex Industrial Solutions',
    master_vendor_id: 'VND-APX-202',
    total_spend_inr_cr: 20.0,
    spend_fy24_cr: 6.0,
    spend_fy25_cr: 6.8,
    spend_fy26_cr: 7.2,
    yoy_growth_pct: 5.8,
    category_type: 'MULTI_CATEGORY',
    category_count: 2,
    primary_category: 'Industrial Supplies',
    supplied_categories: ['Industrial Supplies', 'Packaging Materials'],
    irrelevant_categories: [],
    line_items_count: 28,
    risk_level: 'HIGH_RISK',
    observation_note: 'Multi-category spend',
    spend_share_pct: 9.8,
    spend_yoy_pct: 5.8,
    qty_yoy_pct: 2.1,
    price_yoy_pct: 3.7,
    yoy_observation_mark: '',
    yoy_remark: ''
  },
  {
    rank: 3,
    vendor_name: 'DHL Global Freight Solutions',
    master_vendor_id: 'VND-DHL-404',
    total_spend_inr_cr: 18.2,
    spend_fy24_cr: 5.5,
    spend_fy25_cr: 6.2,
    spend_fy26_cr: 6.5,
    yoy_growth_pct: 4.8,
    category_type: 'SINGLE_CATEGORY',
    category_count: 1,
    primary_category: 'Logistics & Freight Services',
    supplied_categories: ['Logistics & Freight Services'],
    irrelevant_categories: [],
    line_items_count: 15,
    risk_level: 'OPTIMAL',
    observation_note: 'Specialized logistics freight provider',
    spend_share_pct: 8.9,
    spend_yoy_pct: -2.1,
    qty_yoy_pct: 1.0,
    price_yoy_pct: -3.1,
    yoy_observation_mark: '',
    yoy_remark: 'Volume discount applied'
  },
  {
    rank: 50,
    vendor_name: 'Allied Industrial Direct Source',
    master_vendor_id: 'VND-ALL-050',
    total_spend_inr_cr: 1.85,
    spend_fy24_cr: 0.6,
    spend_fy25_cr: 0.6,
    spend_fy26_cr: 0.65,
    yoy_growth_pct: 8.3,
    category_type: 'SINGLE_CATEGORY',
    category_count: 1,
    primary_category: 'MRO & Tools',
    supplied_categories: ['MRO & Tools'],
    irrelevant_categories: [],
    line_items_count: 8,
    risk_level: 'OPTIMAL',
    observation_note: 'Tail spend supplier',
    spend_share_pct: 0.9,
    spend_yoy_pct: 1.2,
    qty_yoy_pct: 1.0,
    price_yoy_pct: 0.2,
    yoy_observation_mark: '',
    yoy_remark: 'Stable spend'
  }
];

describe('Vendor Supply Sub-Components', () => {
  const strings = UI_STRINGS.module2.vendorSupply;
  const overview = computeVendorSupplyOverview(mockTop50VendorsSupply);

  describe('VendorSupplyYoYBadge', () => {
    it('renders positive YoY in green with red observation mark', () => {
      render(
        <VendorSupplyYoYBadge
          pct={8.5}
          label="Spend"
          observationMark="Observation: Inflation detected"
        />
      );

      expect(screen.getByText('Spend:')).toBeInTheDocument();
      const value = screen.getByText('+8.5%');
      expect(value).toBeInTheDocument();
      expect(value).toHaveClass('text-emerald-600');
      expect(screen.getByText(strings.observationBadgeTag)).toBeInTheDocument();
      expect(screen.getByText('Observation: Inflation detected')).toBeInTheDocument();
    });

    it('renders negative YoY in amber with blue remark', () => {
      render(
        <VendorSupplyYoYBadge
          pct={-4.2}
          remark="Remark: Volume softened"
        />
      );

      const value = screen.getByText('-4.2%');
      expect(value).toBeInTheDocument();
      expect(value).toHaveClass('text-amber-600');
      expect(screen.getByText(strings.remarkBadgeTag)).toBeInTheDocument();
      expect(screen.getByText('Remark: Volume softened')).toBeInTheDocument();
    });

    it('renders neutral zero YoY cleanly', () => {
      render(<VendorSupplyYoYBadge pct={0} compact />);
      expect(screen.getByText('0.0%')).toBeInTheDocument();
    });
  });

  describe('VendorSupplyAlarmBanner', () => {
    it('renders alarm details, title, and recommendation', () => {
      render(<VendorSupplyAlarmBanner alarmDetails={overview.alarm_details} />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(strings.alarmBadge)).toBeInTheDocument();
      expect(screen.getByText(overview.alarm_details.title)).toBeInTheDocument();
      expect(screen.getByText(overview.alarm_details.observation)).toBeInTheDocument();
    });
  });

  describe('VendorSupplyMetricsCards', () => {
    it('renders all 4 executive KPI cards', () => {
      render(<VendorSupplyMetricsCards overview={overview} />);

      expect(screen.getByText(strings.kpiTotalSpend)).toBeInTheDocument();
      expect(screen.getByText(strings.kpiMultiVendors)).toBeInTheDocument();
      expect(screen.getByText(strings.kpiSingleVendors)).toBeInTheDocument();
      expect(screen.getByText(strings.kpiAlarmStatus)).toBeInTheDocument();
    });
  });

  describe('VendorSupplyTierDistribution', () => {
    it('renders tier titles and progress bars', () => {
      render(<VendorSupplyTierDistribution tiers={overview.tiers} />);

      expect(screen.getByText(strings.spendTierTrendTitle)).toBeInTheDocument();
      expect(screen.getByText(overview.tiers[0].tier_name)).toBeInTheDocument();
    });
  });

  describe('VendorSupplyItemDetailsModal', () => {
    it('renders nothing when isOpen is false', () => {
      const { container } = render(
        <VendorSupplyItemDetailsModal
          vendor={mockTop50VendorsSupply[0]}
          isOpen={false}
          onClose={() => {}}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders modal with items when open for both multi and single category vendors', () => {
      // Multi-category vendor
      const { unmount } = render(
        <VendorSupplyItemDetailsModal
          vendor={mockTop50VendorsSupply[0]}
          isOpen={true}
          onClose={() => {}}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(strings.itemsModalTitle(mockTop50VendorsSupply[0].vendor_name))).toBeInTheDocument();
      expect(screen.getByText(mockTop50VendorsSupply[0].top_items![0].material_code)).toBeInTheDocument();
      unmount();

      // Single-category vendor
      render(
        <VendorSupplyItemDetailsModal
          vendor={mockTop50VendorsSupply[2]} // DHL is Single Category
          isOpen={true}
          onClose={() => {}}
        />
      );
      expect(screen.getByText(strings.badgeSingleCategory)).toBeInTheDocument();
    });
  });

  describe('VendorSupplyFilterBar', () => {
    it('handles search, category filters, high spend toggle, risk toggle and reset', () => {
      const onSearch = vi.fn();
      const onCategory = vi.fn();
      const onHighSpend = vi.fn();
      const onRisk = vi.fn();
      const onReset = vi.fn();

      render(
        <VendorSupplyFilterBar
          searchQuery="test"
          categoryFilter="MULTI_CATEGORY"
          highSpendOnly={true}
          riskOnly={true}
          totalCount={50}
          filteredCount={10}
          onSearchChange={onSearch}
          onCategoryFilterChange={onCategory}
          onHighSpendToggle={onHighSpend}
          onRiskToggle={onRisk}
          onResetFilters={onReset}
        />
      );

      // Category buttons
      fireEvent.click(screen.getByRole('button', { name: strings.filterAll }));
      expect(onCategory).toHaveBeenCalledWith('ALL');

      fireEvent.click(screen.getByRole('button', { name: strings.filterSingleOnly }));
      expect(onCategory).toHaveBeenCalledWith('SINGLE_CATEGORY');

      // Toggles
      fireEvent.click(screen.getByRole('button', { name: strings.filterHighSpendOnly }));
      expect(onHighSpend).toHaveBeenCalled();

      fireEvent.click(screen.getByRole('button', { name: strings.filterAlarmOnly }));
      expect(onRisk).toHaveBeenCalled();

      // Reset
      fireEvent.click(screen.getByRole('button', { name: strings.resetFilters }));
      expect(onReset).toHaveBeenCalled();
    });
  });

  describe('VendorSupplyTable', () => {
    it('renders empty message and handles reset when vendors array is empty', () => {
      const onReset = vi.fn();
      render(
        <VendorSupplyTable
          vendors={[]}
          onSelectVendor={() => {}}
          onViewItems={() => {}}
          onResetFilters={onReset}
        />
      );

      expect(screen.getByText(strings.noVendorsFound)).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: strings.resetFilters }));
      expect(onReset).toHaveBeenCalled();
    });

    it('renders vendors and triggers onSelectVendor and onViewItems', () => {
      const onSelect = vi.fn();
      const onView = vi.fn();

      render(
        <VendorSupplyTable
          vendors={mockTop50VendorsSupply.slice(0, 10)}
          onSelectVendor={onSelect}
          onViewItems={onView}
          onResetFilters={() => {}}
        />
      );

      const row = screen.getByText(mockTop50VendorsSupply[0].vendor_name).closest('tr');
      fireEvent.click(row!);
      expect(onSelect).toHaveBeenCalledWith(mockTop50VendorsSupply[0]);

      const viewBtn = screen.getAllByRole('button', { name: new RegExp(strings.btnViewItems, 'i') })[0];
      fireEvent.click(viewBtn);
      expect(onView).toHaveBeenCalledWith(mockTop50VendorsSupply[0]);
    });
  });
});

