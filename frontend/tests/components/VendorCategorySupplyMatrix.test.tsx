import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VendorCategorySupplyMatrix } from '../../src/components/VendorCategorySupplyMatrix';
import { mockTop50VendorsSupply } from '../../src/data/mockVendorSupply';
import { UI_STRINGS } from '../../src/constants/uiStrings';
import type { VendorSupplyRecord } from '../../src/types/vendorSupply';

describe('VendorCategorySupplyMatrix Component', () => {
  const strings = UI_STRINGS.module2.vendorSupply;

  it('renders zero state cleanly by default with empty vendors array', () => {
    render(<VendorCategorySupplyMatrix />);
    expect(screen.getByText(strings.kpiTotalSpend)).toBeInTheDocument();
    expect(screen.getByText('₹0.00 Cr')).toBeInTheDocument();
  });

  it('renders top 50 vendors table and executive alarm banner with vendor data', () => {
    render(<VendorCategorySupplyMatrix vendors={mockTop50VendorsSupply} />);

    // Alarm banner
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(screen.getByText(strings.alarmBadge)).toBeInTheDocument();
    expect(screen.getByText(strings.alarmTitle)).toBeInTheDocument();

    // Summary KPIs
    expect(screen.getByText(strings.kpiTotalSpend)).toBeInTheDocument();
    expect(screen.getByText(strings.kpiMultiVendors)).toBeInTheDocument();
    expect(screen.getByText(strings.kpiSingleVendors)).toBeInTheDocument();
    expect(screen.getByText(strings.kpiAlarmStatus)).toBeInTheDocument();

    // Spend Tier Trend
    expect(screen.getByText(strings.spendTierTrendTitle)).toBeInTheDocument();

    // Consolidated YoY Table Headers
    expect(screen.getByText(strings.tableHeaders.rank)).toBeInTheDocument();
    expect(screen.getByText(strings.tableHeaders.vendor)).toBeInTheDocument();
    expect(screen.getByText(strings.tableHeaders.supplyType)).toBeInTheDocument();
    expect(screen.getByText(strings.tableHeaders.totalSpend)).toBeInTheDocument();
    expect(screen.getByText(strings.tableHeaders.spendYoY)).toBeInTheDocument();
    expect(screen.getByText(strings.tableHeaders.quantityYoY)).toBeInTheDocument();
    expect(screen.getByText(strings.tableHeaders.priceYoY)).toBeInTheDocument();
    expect(screen.getByText(strings.tableHeaders.yoyObservationRemark)).toBeInTheDocument();

    // Separate FY24/25/26 spend headers are replaced
    expect(screen.queryByText(strings.tableHeaders.spendFy24)).not.toBeInTheDocument();
    expect(screen.queryByText(strings.tableHeaders.spendFy25)).not.toBeInTheDocument();
    expect(screen.queryByText(strings.tableHeaders.spendFy26)).not.toBeInTheDocument();

    // Top vendors present
    expect(screen.getByText('Acme Chemical Global LLC')).toBeInTheDocument();
    expect(screen.getByText('VND-ACM-101')).toBeInTheDocument();
  });

  it('displays YoY increases in green with red observation and decreases in amber with blue remark', () => {
    render(<VendorCategorySupplyMatrix vendors={mockTop50VendorsSupply} />);

    // Legend entries
    expect(screen.getByText(strings.yoyLegendIncrease)).toBeInTheDocument();
    expect(screen.getByText(strings.yoyLegendObservation)).toBeInTheDocument();
    expect(screen.getByText(strings.yoyLegendDecrease)).toBeInTheDocument();
    expect(screen.getByText(strings.yoyLegendRemark)).toBeInTheDocument();

    // Red observation tags (Obs) and blue remark tags (Rem) present in table
    const observationTags = screen.getAllByText(strings.observationBadgeTag);
    expect(observationTags.length).toBeGreaterThan(0);

    const remarkTags = screen.getAllByText(strings.remarkBadgeTag);
    expect(remarkTags.length).toBeGreaterThan(0);
  });

  it('opens vendor line items modal on clicking View Items button and closes it', () => {
    render(<VendorCategorySupplyMatrix vendors={mockTop50VendorsSupply} />);

    const viewButtons = screen.getAllByRole('button', { name: new RegExp(strings.btnViewItems, 'i') });
    expect(viewButtons.length).toBeGreaterThan(0);

    // Click the first vendor's view items button
    fireEvent.click(viewButtons[0]);

    // Modal dialog rendered
    const modal = screen.getByRole('dialog');
    expect(modal).toBeInTheDocument();
    expect(screen.getByText(strings.itemsModalTitle('Acme Chemical Global LLC'))).toBeInTheDocument();
    expect(screen.getByText(strings.itemHeaders.materialCode)).toBeInTheDocument();
    expect(screen.getByText(strings.itemHeaders.materialDescription)).toBeInTheDocument();
    expect(screen.getByText(strings.itemHeaders.poNumber)).toBeInTheDocument();
    expect(screen.getByText(strings.itemHeaders.unspsc)).toBeInTheDocument();

    // Close modal via close button
    const closeButtons = screen.getAllByRole('button', { name: strings.modalCloseBtn });
    expect(closeButtons.length).toBeGreaterThan(0);
    fireEvent.click(closeButtons[0]);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('filters vendors by search query matching vendor name, master ID, or supplied category', () => {
    render(<VendorCategorySupplyMatrix vendors={mockTop50VendorsSupply} />);

    const searchInput = screen.getByPlaceholderText(strings.tableSearchPlaceholder);

    // Search by name
    fireEvent.change(searchInput, { target: { value: 'Acme' } });
    expect(screen.getByText('Acme Chemical Global LLC')).toBeInTheDocument();
    expect(screen.queryByText('DHL Global Freight Solutions')).not.toBeInTheDocument();

    // Search by master vendor id
    fireEvent.change(searchInput, { target: { value: 'VND-DHL-404' } });
    expect(screen.getByText('DHL Global Freight Solutions')).toBeInTheDocument();
    expect(screen.queryByText('Acme Chemical Global LLC')).not.toBeInTheDocument();

    // Search by category
    fireEvent.change(searchInput, { target: { value: 'Packaging' } });
    expect(screen.queryAllByText(/Packaging/i).length).toBeGreaterThan(0);

    // Search non-existent
    fireEvent.change(searchInput, { target: { value: 'NON_EXISTENT_VENDOR_XYZ' } });
    expect(screen.getByText(strings.noVendorsFound)).toBeInTheDocument();

    // Reset filters button
    const resetButtons = screen.getAllByRole('button', { name: strings.resetFilters });
    expect(resetButtons.length).toBeGreaterThan(0);
    fireEvent.click(resetButtons[0]);
    expect(screen.getByText('Acme Chemical Global LLC')).toBeInTheDocument();
  });

  it('filters by category type (Multi-Category vs Single-Category)', () => {
    render(<VendorCategorySupplyMatrix vendors={mockTop50VendorsSupply} />);

    // Multi-Category Only
    const multiBtn = screen.getByRole('button', { name: strings.filterMultiOnly });
    fireEvent.click(multiBtn);
    expect(screen.getByText('Acme Chemical Global LLC')).toBeInTheDocument(); // multi
    expect(screen.queryByText('DHL Global Freight Solutions')).not.toBeInTheDocument(); // single

    // Single-Category Only
    const singleBtn = screen.getByRole('button', { name: strings.filterSingleOnly });
    fireEvent.click(singleBtn);
    expect(screen.getByText('DHL Global Freight Solutions')).toBeInTheDocument(); // single
    expect(screen.queryByText('Acme Chemical Global LLC')).not.toBeInTheDocument(); // multi

    // All Vendors
    const allBtn = screen.getByRole('button', { name: strings.filterAll });
    fireEvent.click(allBtn);
    expect(screen.getByText('Acme Chemical Global LLC')).toBeInTheDocument();
    expect(screen.getByText('DHL Global Freight Solutions')).toBeInTheDocument();
  });

  it('filters by High Spend (> ₹15 Cr) and Risk Flagged only', () => {
    render(<VendorCategorySupplyMatrix vendors={mockTop50VendorsSupply} />);

    const highSpendBtn = screen.getByRole('button', { name: strings.filterHighSpendOnly });
    fireEvent.click(highSpendBtn);

    // Acme is #1 (> ₹15 Cr), should be present
    expect(screen.getByText('Acme Chemical Global LLC')).toBeInTheDocument();
    // Allied Industrial Direct Source is #50 (₹1.85 Cr), should not be present
    expect(screen.queryByText('Allied Industrial Direct Source')).not.toBeInTheDocument();

    // Toggle off high spend
    fireEvent.click(highSpendBtn);
    expect(screen.getByText('Allied Industrial Direct Source')).toBeInTheDocument();

    // Risk only filter
    const riskBtn = screen.getByRole('button', { name: strings.filterAlarmOnly });
    fireEvent.click(riskBtn);

    // High risk vendor should be present
    expect(screen.getByText('Acme Chemical Global LLC')).toBeInTheDocument();
    // Optimal vendor (DHL) should not be present
    expect(screen.queryByText('DHL Global Freight Solutions')).not.toBeInTheDocument();
  });

  it('invokes onSelectVendor callback when a table row is clicked and opens modal', () => {
    const handleSelect = vi.fn();
    render(<VendorCategorySupplyMatrix vendors={mockTop50VendorsSupply} onSelectVendor={handleSelect} />);

    const vendorRow = screen.getByText('Acme Chemical Global LLC').closest('tr');
    expect(vendorRow).not.toBeNull();
    fireEvent.click(vendorRow!);

    expect(handleSelect).toHaveBeenCalledTimes(1);
    expect(handleSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        vendor_name: 'Acme Chemical Global LLC',
        master_vendor_id: 'VND-ACM-101'
      })
    );

    // Modal opens as well
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not render alarm banner when vendors have no multi-category dominance in high spend', () => {
    const customSingleVendors: VendorSupplyRecord[] = [
      {
        rank: 1,
        vendor_name: 'Sole Direct Producer',
        master_vendor_id: 'VND-SDP-001',
        total_spend_inr_cr: 25.0,
        spend_fy24_cr: 8.0,
        spend_fy25_cr: 8.5,
        spend_fy26_cr: 8.5,
        yoy_growth_pct: 3.0,
        spend_yoy_pct: 3.0,
        qty_yoy_pct: 2.0,
        price_yoy_pct: 1.0,
        yoy_observation_mark: 'Observation: Minor rate inflation',
        yoy_remark: 'Remark: Controlled direct producer contract',
        category_type: 'SINGLE_CATEGORY',
        category_count: 1,
        primary_category: 'Direct Chemicals',
        supplied_categories: ['Direct Chemicals'],
        irrelevant_categories: [],
        line_items_count: 300,
        risk_level: 'OPTIMAL',
        observation_note: 'Pure-play supplier.',
        spend_share_pct: 100.0,
        top_items: []
      }
    ];

    render(<VendorCategorySupplyMatrix vendors={customSingleVendors} />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText(strings.kpiAlarmStatusNormal)).toBeInTheDocument();
  });
});
