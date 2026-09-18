import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ValidationPreCheckSection } from '../../src/components/ValidationPreCheckSection';
import { initialValidationRecords } from '../../src/data/mockData';
import { UI_STRINGS } from '../../src/constants';

const sampleRecords: any[] = [
  {
    record_id: 'REC-8841',
    spend_year: 2025,
    po_number: 'PO-8841',
    raw_desc: 'Caustic Soda Flakes',
    core_category: 'Direct Materials',
    column_l_code: '12345678',
    vendor_name: 'Acme Chemicals LLC',
    order_quantity: 100,
    net_price: 500,
    raw_currency: 'USD',
    fx_rate_applied: 83.5,
    inr_crores: 0.42,
    amount: 50000,
    issue_flag: 'Missing Currency Code',
    issue_category: 'CONVERSION',
    action_status: 'Fix (INR)',
    resolved: false
  },
  {
    record_id: 'REC-8842',
    spend_year: 2025,
    po_number: 'PO-8842',
    raw_desc: 'Hydrochloric Acid',
    core_category: 'Direct Materials',
    column_l_code: '12345679',
    vendor_name: 'Acme Chemical Global LLC',
    order_quantity: 200,
    net_price: 250,
    raw_currency: 'INR',
    fx_rate_applied: 1.0,
    inr_crores: 0.50,
    amount: 50000,
    issue_flag: 'Unmapped Supplier Name',
    issue_category: 'VENDOR_DUPLICATION',
    action_status: 'Merge Vendor',
    resolved: false
  },
  {
    record_id: 'REC-8847',
    spend_year: 2025,
    po_number: 'PO-8847',
    raw_desc: 'Packaging Corrugated Carton',
    core_category: 'Packaging Materials',
    column_l_code: '14121506',
    vendor_name: 'Box Corp',
    order_quantity: 5000,
    net_price: 1.5,
    raw_currency: 'INR',
    fx_rate_applied: 1.0,
    inr_crores: 0.08,
    amount: 7500,
    issue_flag: 'Duplicate Item Description',
    issue_category: 'ITEM_DUPLICATION',
    action_status: 'Merge Item',
    resolved: false
  },
  {
    record_id: 'REC-8843',
    spend_year: 2025,
    po_number: 'PO-8843',
    raw_desc: 'Safety Gloves Nitrile',
    core_category: 'Indirect & MRO',
    column_l_code: '46181504',
    vendor_name: 'Safety Direct',
    order_quantity: 1000,
    net_price: 2.0,
    raw_currency: 'INR',
    fx_rate_applied: 1.0,
    inr_crores: 0.02,
    amount: 2000,
    issue_flag: 'Passed Clean',
    action_status: 'Ready',
    resolved: true
  }
];

describe('ValidationPreCheckSection Component', () => {
  const defaultProps = {
    validationRecords: sampleRecords,
    onFixCurrency: vi.fn(),
    onMergeVendor: vi.fn(),
    onMergeItem: vi.fn(),
    onApplyBlanketFixes: vi.fn(),
    onResetValidationRecords: vi.fn(),
    onRunAICategorization: vi.fn()
  };

  it('renders all 6 filter tabs and default KPI metrics', () => {
    render(<ValidationPreCheckSection {...defaultProps} />);

    expect(screen.getByText(UI_STRINGS.module1.validationSectionTitle)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /All Records/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Needs Action/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Conversion/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Duplicate Vendors/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Duplicate Items/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ready & Cleared/i })).toBeInTheDocument();

    // Check KPI cards
    expect(screen.getByText(UI_STRINGS.module1.kpis.totalFileSpend)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.module1.kpis.validatedSpend)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.module1.kpis.pendingIssues)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.module1.kpis.qualityIndex)).toBeInTheDocument();
  });

  it('filters records when clicking on Conversion Issues tab', () => {
    render(<ValidationPreCheckSection {...defaultProps} />);

    const convTab = screen.getByRole('button', { name: /Conversion/i });
    fireEvent.click(convTab);

    // Should only show conversion issue records
    expect(screen.getByText('REC-8841')).toBeInTheDocument();
  });

  it('filters records when clicking on Duplicate Vendors tab', () => {
    render(<ValidationPreCheckSection {...defaultProps} />);

    const vendorTab = screen.getByRole('button', { name: /Duplicate Vendors/i });
    fireEvent.click(vendorTab);

    expect(screen.getByText('REC-8842')).toBeInTheDocument();
  });

  it('filters records when clicking on Duplicate Items tab', () => {
    render(<ValidationPreCheckSection {...defaultProps} />);

    const itemTab = screen.getByRole('button', { name: /Duplicate Items/i });
    fireEvent.click(itemTab);

    expect(screen.getByText('REC-8847')).toBeInTheDocument();
  });

  it('filters records when clicking on Ready & Cleared tab', () => {
    render(<ValidationPreCheckSection {...defaultProps} />);

    const readyTab = screen.getByRole('button', { name: /Ready & Cleared/i });
    fireEvent.click(readyTab);

    expect(screen.getByText('REC-8843')).toBeInTheDocument();
  });

  it('filters records when clicking on Needs Action tab', () => {
    render(<ValidationPreCheckSection {...defaultProps} />);

    const needsActionTab = screen.getByRole('button', { name: /Needs Action/i });
    fireEvent.click(needsActionTab);

    expect(screen.getByText('REC-8841')).toBeInTheDocument();
    expect(screen.getByText('REC-8842')).toBeInTheDocument();
  });

  it('handles clicking Fix (INR) button', () => {
    const onFixCurrency = vi.fn();
    render(<ValidationPreCheckSection {...defaultProps} onFixCurrency={onFixCurrency} />);

    const fixBtn = screen.getAllByRole('button', { name: UI_STRINGS.module1.fixInr })[0];
    fireEvent.click(fixBtn);

    expect(onFixCurrency).toHaveBeenCalled();
  });

  it('handles clicking Merge Vendor button', () => {
    const onMergeVendor = vi.fn();
    render(<ValidationPreCheckSection {...defaultProps} onMergeVendor={onMergeVendor} />);

    const mergeVendorBtn = screen.getAllByRole('button', { name: new RegExp(UI_STRINGS.module1.mergeVendor, 'i') })[0];
    fireEvent.click(mergeVendorBtn);

    expect(onMergeVendor).toHaveBeenCalled();
  });

  it('handles clicking Merge Item button', () => {
    const onMergeItem = vi.fn();
    render(<ValidationPreCheckSection {...defaultProps} onMergeItem={onMergeItem} />);

    const mergeItemBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.module1.mergeItem, 'i') });
    fireEvent.click(mergeItemBtn);

    expect(onMergeItem).toHaveBeenCalled();
  });

  it('handles blanket AI fixes and reset actions', () => {
    const onApplyBlanketFixes = vi.fn();
    const onResetValidationRecords = vi.fn();

    // Render with all resolved records to test reset button
    const resolvedRecords = sampleRecords.map((r) => ({ ...r, resolved: true, issue_flag: 'Passed Clean' as const, action_status: 'Ready' as const }));
    const { rerender } = render(
      <ValidationPreCheckSection
        {...defaultProps}
        onApplyBlanketFixes={onApplyBlanketFixes}
        onResetValidationRecords={onResetValidationRecords}
      />
    );

    const blanketBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.module1.applyBlanketFixes, 'i') });
    fireEvent.click(blanketBtn);
    expect(onApplyBlanketFixes).toHaveBeenCalled();

    rerender(
      <ValidationPreCheckSection
        {...defaultProps}
        validationRecords={resolvedRecords}
        onResetValidationRecords={onResetValidationRecords}
      />
    );

    const resetBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.module1.resetAnomalyState, 'i') });
    fireEvent.click(resetBtn);
    expect(onResetValidationRecords).toHaveBeenCalled();
  });

  it('renders refreshed numbers badge when isDataRefreshed is true', () => {
    render(<ValidationPreCheckSection {...defaultProps} isDataRefreshed={true} />);
    expect(screen.getByText(UI_STRINGS.module1.revisedBadge)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.module1.dataRefreshedBanner)).toBeInTheDocument();
  });

  it('does not render Refresh with Fixes buttons (hidden as requested)', () => {
    const onRefreshWithFixes = vi.fn();
    render(<ValidationPreCheckSection {...defaultProps} onRefreshWithFixes={onRefreshWithFixes} />);

    expect(screen.queryByRole('button', { name: new RegExp(UI_STRINGS.module1.refreshWithFixes, 'i') })).not.toBeInTheDocument();
  });
});
