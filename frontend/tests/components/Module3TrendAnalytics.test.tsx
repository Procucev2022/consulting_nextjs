import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Module3TrendAnalytics } from '../../src/components/Module3TrendAnalytics';
import { mockVendorPriceRanks } from '../../src/data/mockData';

describe('Module3TrendAnalytics Component', () => {
  it('renders correctly with light and dark themes', () => {
    const { rerender } = render(
      <Module3TrendAnalytics
        vendorRankings={mockVendorPriceRanks}
        onProceedToSavings={vi.fn()}
        theme="light"
      />
    );

    expect(screen.getByText('Historical Spend & Commodity Volatility Analytics')).toBeInTheDocument();
    expect(screen.getByText('Identified Unjustified Price Creep Leakage')).toBeInTheDocument();

    rerender(
      <Module3TrendAnalytics
        vendorRankings={mockVendorPriceRanks}
        onProceedToSavings={vi.fn()}
        theme="dark"
      />
    );
    expect(screen.getByText('Historical Spend & Commodity Volatility Analytics')).toBeInTheDocument();
  });

  it('handles changing commodity benchmark', () => {
    render(
      <Module3TrendAnalytics
        vendorRankings={mockVendorPriceRanks}
        onProceedToSavings={vi.fn()}
      />
    );

    const selects = screen.getAllByRole('combobox');
    const benchmarkSelect = selects[0];

    fireEvent.change(benchmarkSelect, { target: { value: 'LME Industrial Metals' } });
    fireEvent.change(benchmarkSelect, { target: { value: 'Cass Global Freight' } });
    fireEvent.change(benchmarkSelect, { target: { value: 'Fastmarkets Paper & Pulp' } });
    fireEvent.change(benchmarkSelect, { target: { value: 'ICIS Chemicals & Resins' } });
  });

  it('handles risk filtering', () => {
    render(
      <Module3TrendAnalytics
        vendorRankings={mockVendorPriceRanks}
        onProceedToSavings={vi.fn()}
      />
    );

    const creepBtn = screen.getByRole('button', { name: />5% Creep Anomaly/i });
    fireEvent.click(creepBtn);

    const alignedBtn = screen.getByRole('button', { name: /Aligned/i });
    fireEvent.click(alignedBtn);

    const allBtn = screen.getByRole('button', { name: /All Vendors/i });
    fireEvent.click(allBtn);
  });

  it('handles fallback spend calculations and triggers onProceedToSavings', () => {
    const customRankings = [
      {
        ...mockVendorPriceRanks[0],
        total_spend_inr_cr: undefined as any,
        variance_leakage_inr_cr: undefined as any,
        variance_leakage_usd: 0,
        price_creep_pct: 2
      },
      {
        ...mockVendorPriceRanks[1],
        total_spend_inr_cr: undefined as any,
        variance_leakage_inr_cr: undefined as any,
        variance_leakage_usd: 150000,
        price_creep_pct: -1
      }
    ];

    const onProceed = vi.fn();
    render(
      <Module3TrendAnalytics
        vendorRankings={customRankings as any}
        onProceedToSavings={onProceed}
      />
    );

    expect(screen.getByText('₹0 (Aligned)')).toBeInTheDocument();

    const ctaBtn = screen.getByRole('button', { name: /Proceed to Real-Time Savings Engine/i });
    fireEvent.click(ctaBtn);
    expect(onProceed).toHaveBeenCalled();
  });
});
