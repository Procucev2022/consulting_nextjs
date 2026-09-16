import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ValidationPreCheckSection } from '../../src/components/ValidationPreCheckSection';
import { initialValidationRecords } from '../../src/data/mockData';
import { UI_STRINGS } from '../../src/constants';

describe('ValidationPreCheckSection Component', () => {
  const defaultProps = {
    validationRecords: initialValidationRecords,
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
    const resolvedRecords = initialValidationRecords.map((r) => ({ ...r, resolved: true, action_status: 'Ready' as const }));
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
