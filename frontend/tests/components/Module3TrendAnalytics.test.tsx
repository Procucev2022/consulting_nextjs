import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Module3TrendAnalytics } from '../../src/components/Module3TrendAnalytics';
import { UI_STRINGS } from '../../src/constants/uiStrings';

const sampleVendorPriceRanks = [
  {
    vendor_id: 'VND-001',
    vendor_name: 'Acme Chemicals LLC',
    category: 'Direct Materials',
    total_spend_inr_cr: 25.5,
    price_creep_pct: 12.4,
    benchmark_index: 'ICIS Chemical Benchmark',
    variance_leakage_inr_cr: 2.1,
    variance_leakage_usd: 250000,
    risk_level: 'High' as const,
    audit_flag: 'Price Creep Anomaly'
  },
  {
    vendor_id: 'VND-002',
    vendor_name: 'Amcor Packaging',
    category: 'Packaging Materials',
    total_spend_inr_cr: 14.2,
    price_creep_pct: 1.2,
    benchmark_index: 'PPI Index',
    variance_leakage_inr_cr: 0.1,
    variance_leakage_usd: 12000,
    risk_level: 'Low' as const,
    audit_flag: 'Market Aligned'
  }
];

describe('Module3TrendAnalytics Component', () => {
  it('renders cold zero-data state when vendorRankings is empty', () => {
    render(
      <Module3TrendAnalytics
        vendorRankings={[]}
        onProceedToSavings={vi.fn()}
      />
    );
    expect(screen.getByText('Awaiting dataset ingestion. Upload a multi-currency procurement dataset in Module 1 to evaluate supplier price volatility.')).toBeInTheDocument();
  });

  it('renders correctly with light and dark themes', () => {
    const { rerender } = render(
      <Module3TrendAnalytics
        vendorRankings={sampleVendorPriceRanks}
        onProceedToSavings={vi.fn()}
        theme="light"
      />
    );

    expect(screen.getByText(UI_STRINGS.module3.heading)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.module3.leakageBoxTitle)).toBeInTheDocument();

    rerender(
      <Module3TrendAnalytics
        vendorRankings={sampleVendorPriceRanks}
        onProceedToSavings={vi.fn()}
        theme="dark"
      />
    );
    expect(screen.getByText(UI_STRINGS.module3.heading)).toBeInTheDocument();
  });

  it('handles changing commodity benchmark', () => {
    render(
      <Module3TrendAnalytics
        vendorRankings={sampleVendorPriceRanks}
        onProceedToSavings={vi.fn()}
      />
    );

    const selects = screen.getAllByRole('combobox');
    const benchmarkSelect = selects[0];

    fireEvent.change(benchmarkSelect, { target: { value: UI_STRINGS.module3.commodities.lme } });
    fireEvent.change(benchmarkSelect, { target: { value: UI_STRINGS.module3.commodities.cass } });
    fireEvent.change(benchmarkSelect, { target: { value: UI_STRINGS.module3.commodities.fastmarkets } });
    fireEvent.change(benchmarkSelect, { target: { value: UI_STRINGS.module3.commodities.icis } });
  });

  it('handles risk filtering', () => {
    render(
      <Module3TrendAnalytics
        vendorRankings={sampleVendorPriceRanks}
        onProceedToSavings={vi.fn()}
      />
    );

    const creepBtn = screen.getByRole('button', { name: UI_STRINGS.module3.filterCreepAnomaly });
    fireEvent.click(creepBtn);

    const alignedBtn = screen.getByRole('button', { name: UI_STRINGS.module3.filterAligned });
    fireEvent.click(alignedBtn);

    const allBtn = screen.getByRole('button', { name: UI_STRINGS.module3.filterAllVendors(sampleVendorPriceRanks.length) });
    fireEvent.click(allBtn);
  });

  it('handles fallback spend calculations and triggers onProceedToSavings', () => {
    const customRankings = [
      {
        ...sampleVendorPriceRanks[0],
        total_spend_inr_cr: undefined as any,
        variance_leakage_inr_cr: undefined as any,
        variance_leakage_usd: 0,
        price_creep_pct: 2
      },
      {
        ...sampleVendorPriceRanks[1],
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

    expect(screen.getByText(UI_STRINGS.module3.alignedLeakageVal)).toBeInTheDocument();

    const ctaBtn = screen.getByRole('button', { name: UI_STRINGS.module3.ctaProceedButton });
    fireEvent.click(ctaBtn);
    expect(onProceed).toHaveBeenCalled();
  });

  it('renders masked overlay for Bronze customer and handles upgrade to silver', () => {
    const onUpgrade = vi.fn();
    render(
      <Module3TrendAnalytics
        vendorRankings={sampleVendorPriceRanks}
        onProceedToSavings={vi.fn()}
        currentTier="BRONZE"
        onUpgrade={onUpgrade}
      />
    );

    const upgradeBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.subscription.upgradeToSilver, 'i') });
    expect(upgradeBtn).toBeInTheDocument();
    fireEvent.click(upgradeBtn);
    expect(onUpgrade).toHaveBeenCalledWith('SILVER');
  });

  it('renders macro trend chart for Silver customer and masks rankings table with Gold upgrade trigger', () => {
    const onUpgrade = vi.fn();
    render(
      <Module3TrendAnalytics
        vendorRankings={sampleVendorPriceRanks}
        onProceedToSavings={vi.fn()}
        currentTier="SILVER"
        onUpgrade={onUpgrade}
      />
    );

    expect(screen.getByText(UI_STRINGS.module3.heading)).toBeInTheDocument();
    const upgradeBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.subscription.upgradeToGold, 'i') });
    expect(upgradeBtn).toBeInTheDocument();
    fireEvent.click(upgradeBtn);
    expect(onUpgrade).toHaveBeenCalledWith('GOLD');
  });
});


