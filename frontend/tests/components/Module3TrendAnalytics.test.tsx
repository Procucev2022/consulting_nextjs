import React from 'react';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Module3TrendAnalytics } from '../../src/components/Module3TrendAnalytics';
import { UI_STRINGS } from '../../src/constants/uiStrings';
import { MODULE3_PCBI_INDEX_HISTORY_LIMIT } from '../../src/constants/module3';
import { apiClient } from '../../src/utils/api';
import frontendLogger from '../../src/utils/logger';
import type { ReactElement } from 'react';

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

const renderAndFlushD1 = async (element: ReactElement) => {
  const result = render(element);
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
  return result;
};

describe('Module3TrendAnalytics Component', () => {
  beforeEach(() => {
    vi.spyOn(apiClient, 'getPCBIMasterBenchmarks').mockResolvedValue({
      data: [{ pcbi_id: 'PCBI-TEST', benchmark_name: 'Persisted benchmark', benchmark_unit: 'MT', currency: 'INR' }]
    });
    vi.spyOn(apiClient, 'getPCBIWeeklyIndices').mockResolvedValue({
      data: [
        { pcbi_id: 'PCBI-TEST', week_start: '2026-02-02', index_value: 110, unit: 'MT', currency: 'INR' },
        { pcbi_id: 'PCBI-TEST', week_start: '2026-01-05', index_value: 100, unit: 'MT', currency: 'INR' }
      ]
    });
    vi.spyOn(frontendLogger, 'error').mockImplementation(vi.fn());
  });

  afterEach(async () => {
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });
    vi.restoreAllMocks();
  });

  it('renders cold zero-data state when vendorRankings is empty', async () => {
    await renderAndFlushD1(
      <Module3TrendAnalytics
        vendorRankings={[]}
        onProceedToSavings={vi.fn()}
      />
    );
    expect(screen.getAllByText(UI_STRINGS.module3.noVendorRankings).length).toBeGreaterThan(0);
  });

  it('renders correctly with light and dark themes', async () => {
    const { rerender } = await renderAndFlushD1(
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

  it('loads benchmark options and weekly history from the D1 API', async () => {
    await renderAndFlushD1(
      <Module3TrendAnalytics
        vendorRankings={sampleVendorPriceRanks}
        onProceedToSavings={vi.fn()}
      />
    );

    await waitFor(() => expect(screen.getByRole('option', { name: 'Persisted benchmark' })).toBeInTheDocument());
    await waitFor(() => expect(screen.getByTestId('mock-line-chart')).toBeInTheDocument());
    expect(apiClient.getPCBIWeeklyIndices).toHaveBeenCalledWith('PCBI-TEST', MODULE3_PCBI_INDEX_HISTORY_LIMIT);
    expect(screen.getByText(UI_STRINGS.module3.indexChangeLabel('+10.0%'))).toBeInTheDocument();
  });

  it('fetches a new persisted series when the selected benchmark changes', async () => {
    vi.spyOn(apiClient, 'getPCBIMasterBenchmarks').mockResolvedValue({
      data: [
        { pcbi_id: 'PCBI-TEST', benchmark_name: 'First benchmark', benchmark_unit: 'MT', currency: 'INR' },
        { pcbi_id: 'PCBI-OTHER', benchmark_name: 'Second benchmark', benchmark_unit: 'KG', currency: 'INR' }
      ]
    });
    vi.spyOn(apiClient, 'getPCBIWeeklyIndices').mockImplementation(async (pcbiId) => ({
      data: [{ pcbi_id: pcbiId, week_start: '2026-01-05', index_value: 100, unit: 'KG', currency: 'INR' }]
    }));
    await renderAndFlushD1(<Module3TrendAnalytics vendorRankings={[]} onProceedToSavings={vi.fn()} />);

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'PCBI-OTHER' } });
    await waitFor(() => expect(apiClient.getPCBIWeeklyIndices).toHaveBeenCalledWith('PCBI-OTHER', MODULE3_PCBI_INDEX_HISTORY_LIMIT));
    expect(await screen.findByTestId('mock-line-chart')).toBeInTheDocument();
  });

  it('shows the empty state when D1 has no reference benchmarks', async () => {
    vi.spyOn(apiClient, 'getPCBIMasterBenchmarks').mockResolvedValue({ data: [] });
    await renderAndFlushD1(<Module3TrendAnalytics vendorRankings={[]} onProceedToSavings={vi.fn()} />);
    expect(await screen.findByRole('option', { name: UI_STRINGS.module3.noBenchmarks })).toBeInTheDocument();
  });

  it('shows a database error state when weekly history cannot be fetched', async () => {
    vi.spyOn(apiClient, 'getPCBIWeeklyIndices').mockRejectedValue(new Error('D1 unavailable'));
    await renderAndFlushD1(<Module3TrendAnalytics vendorRankings={[]} onProceedToSavings={vi.fn()} />);
    expect(await screen.findByText(UI_STRINGS.module3.indexLoadFailed)).toBeInTheDocument();
  });

  it('reports a benchmark load failure without substituting sample chart data', async () => {
    vi.spyOn(apiClient, 'getPCBIMasterBenchmarks').mockRejectedValue(new Error('D1 unavailable'));
    await renderAndFlushD1(<Module3TrendAnalytics vendorRankings={[]} onProceedToSavings={vi.fn()} />);
    expect(await screen.findByRole('option', { name: UI_STRINGS.module3.benchmarkLoadFailed })).toBeInTheDocument();
    expect(screen.queryByTestId('mock-line-chart')).not.toBeInTheDocument();
  });

  it('handles risk filtering', async () => {
    await renderAndFlushD1(
      <Module3TrendAnalytics
        vendorRankings={sampleVendorPriceRanks}
        onProceedToSavings={vi.fn()}
      />
    );

    const creepBtn = screen.getByRole('button', { name: UI_STRINGS.module3.filterCreepAnomaly(1) });
    fireEvent.click(creepBtn);

    const alignedBtn = screen.getByRole('button', { name: UI_STRINGS.module3.filterAligned(0) });
    fireEvent.click(alignedBtn);

    const allBtn = screen.getByRole('button', { name: UI_STRINGS.module3.filterAllVendors(sampleVendorPriceRanks.length) });
    fireEvent.click(allBtn);
  });

  it('renders missing INR fields and persisted review/aligned risk statuses', async () => {
    const rankings = [
      { ...sampleVendorPriceRanks[0], price_creep_pct: undefined, variance_leakage_inr_cr: 0, risk_status: 'REVIEW' },
      { ...sampleVendorPriceRanks[1], price_creep_pct: -1, variance_leakage_inr_cr: 0, risk_status: 'ALIGNED' },
      { ...sampleVendorPriceRanks[0], vendor_name: 'High risk persisted vendor', risk_status: 'HIGH CREEP' }
    ];
    await renderAndFlushD1(
      <Module3TrendAnalytics vendorRankings={rankings as any} onProceedToSavings={vi.fn()} />
    );

    expect(screen.getByText('Acme Chemicals LLC')).toBeInTheDocument();
    expect(screen.getByText('Amcor Packaging')).toBeInTheDocument();
    expect(screen.getByText('High risk persisted vendor')).toBeInTheDocument();
    expect(screen.getAllByText(UI_STRINGS.module3.unavailableMetric).length).toBeGreaterThan(0);
    expect(screen.getAllByText(UI_STRINGS.module3.alignedLeakageVal).length).toBeGreaterThan(0);
    expect(screen.getByText('REVIEW')).toBeInTheDocument();
    expect(screen.getByText('ALIGNED')).toBeInTheDocument();
  });

  it('handles missing D1-sourced INR spend and triggers onProceedToSavings', async () => {
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
    await renderAndFlushD1(
      <Module3TrendAnalytics
        vendorRankings={customRankings as any}
        onProceedToSavings={onProceed}
      />
    );

    expect(screen.getAllByText(UI_STRINGS.module3.unavailableMetric).length).toBeGreaterThan(0);

    const ctaBtn = screen.getByRole('button', { name: UI_STRINGS.module3.ctaProceedButton });
    fireEvent.click(ctaBtn);
    expect(onProceed).toHaveBeenCalled();
  });

  it('renders masked overlay for Bronze customer and handles upgrade to silver', async () => {
    const onUpgrade = vi.fn();
    await renderAndFlushD1(
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

  it('renders macro trend chart for Silver customer and masks rankings table with Gold upgrade trigger', async () => {
    const onUpgrade = vi.fn();
    await renderAndFlushD1(
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


