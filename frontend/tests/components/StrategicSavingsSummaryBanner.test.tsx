import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StrategicSavingsSummaryBanner } from '../../src/components/savings/StrategicSavingsSummaryBanner';
import { UI_STRINGS } from '../../src/constants';
import { buildStrategicSavingsSummary } from '../../src/utils/strategicSavingsCalculator';

describe('StrategicSavingsSummaryBanner Component', () => {
  it('renders all default initiatives, hero card, and comparison table', () => {
    render(<StrategicSavingsSummaryBanner />);

    // Check Header Strings
    expect(screen.getByText(UI_STRINGS.savingsInitiativesSummary.badge)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.savingsInitiativesSummary.heading)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.savingsInitiativesSummary.grandTotalTitle)).toBeInTheDocument();

    // Check Grand Total Savings Number
    const grandTotalEl = screen.getByTestId('grand-total-savings-number');
    expect(grandTotalEl).toBeInTheDocument();
    expect(grandTotalEl.textContent).toContain('₹217.93 Cr');

    // Check all 5 initiative cards exist
    expect(screen.getByTestId('initiative-card-VENDOR_CONSOLIDATION')).toBeInTheDocument();
    expect(screen.getByTestId('initiative-card-PO_CONSOLIDATION')).toBeInTheDocument();
    expect(screen.getByTestId('initiative-card-STRATEGIC_SINGLE_VENDOR')).toBeInTheDocument();
    expect(screen.getByTestId('initiative-card-VENDOR_SUPPLY_RATIONALIZATION')).toBeInTheDocument();
    expect(screen.getByTestId('initiative-card-CATEGORY_SAVINGS_PIPELINE')).toBeInTheDocument();

    // Check table title
    expect(screen.getByText(UI_STRINGS.savingsInitiativesSummary.tableTitle)).toBeInTheDocument();
  });

  it('triggers onNavigateToSection when clicking Module 2 and Module 4 subtotal buttons', () => {
    const handleNavigate = vi.fn();
    render(<StrategicSavingsSummaryBanner onNavigateToSection={handleNavigate} />);

    // Click Module 2 Subtotal Button
    const btnMod2 = screen.getByTestId('btn-subtotal-module2');
    fireEvent.click(btnMod2);
    expect(handleNavigate).toHaveBeenCalledWith('module2', 'vendor-consolidation-section');

    // Click Module 4 Subtotal Button
    const btnMod4 = screen.getByTestId('btn-subtotal-module4');
    fireEvent.click(btnMod4);
    expect(handleNavigate).toHaveBeenCalledWith('module4', 'savings-pipeline-table-section');
  });

  it('triggers onNavigateToSection when clicking initiative savings numbers', () => {
    const handleNavigate = vi.fn();
    render(<StrategicSavingsSummaryBanner onNavigateToSection={handleNavigate} />);

    // Vendor Consolidation
    fireEvent.click(screen.getByTestId('btn-savings-number-VENDOR_CONSOLIDATION'));
    expect(handleNavigate).toHaveBeenCalledWith('module2', 'vendor-consolidation-section');

    // PO Consolidation
    fireEvent.click(screen.getByTestId('btn-savings-number-PO_CONSOLIDATION'));
    expect(handleNavigate).toHaveBeenCalledWith('module2', 'po-consolidation-section');

    // Strategic Single Vendor
    fireEvent.click(screen.getByTestId('btn-savings-number-STRATEGIC_SINGLE_VENDOR'));
    expect(handleNavigate).toHaveBeenCalledWith('module2', 'strategic-risk-section');

    // Vendor Supply Rationalization
    fireEvent.click(screen.getByTestId('btn-savings-number-VENDOR_SUPPLY_RATIONALIZATION'));
    expect(handleNavigate).toHaveBeenCalledWith('module2', 'vendor-category-supply-section');

    // Category Savings Pipeline
    fireEvent.click(screen.getByTestId('btn-savings-number-CATEGORY_SAVINGS_PIPELINE'));
    expect(handleNavigate).toHaveBeenCalledWith('module4', 'savings-pipeline-table-section');
  });

  it('triggers onNavigateToSection when clicking table action button and table savings metric', () => {
    const handleNavigate = vi.fn();
    render(<StrategicSavingsSummaryBanner onNavigateToSection={handleNavigate} />);

    // Click action button in table
    const actionBtn = screen.getByTestId('btn-table-action-VENDOR_CONSOLIDATION');
    fireEvent.click(actionBtn);
    expect(handleNavigate).toHaveBeenCalledWith('module2', 'vendor-consolidation-section');

    // Click table savings text
    const tableSavingsBtn = screen.getByTestId('btn-table-savings-PO_CONSOLIDATION');
    fireEvent.click(tableSavingsBtn);
    expect(handleNavigate).toHaveBeenCalledWith('module2', 'po-consolidation-section');
  });

  it('renders custom summaryMetrics correctly when provided', () => {
    const customMetrics = buildStrategicSavingsSummary();
    customMetrics.grandTotalSavingsInrCr = 350.0;

    render(<StrategicSavingsSummaryBanner summaryMetrics={customMetrics} />);

    const grandTotalEl = screen.getByTestId('grand-total-savings-number');
    expect(grandTotalEl.textContent).toContain('₹350.00 Cr');
  });

  it('does not throw when clicking buttons without onNavigateToSection callback', () => {
    render(<StrategicSavingsSummaryBanner />);

    const btn = screen.getByTestId('btn-savings-number-VENDOR_CONSOLIDATION');
    expect(() => fireEvent.click(btn)).not.toThrow();

    const subtotalBtn = screen.getByTestId('btn-subtotal-module2');
    expect(() => fireEvent.click(subtotalBtn)).not.toThrow();
  });
});
