import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MonthWiseTrendChart } from '../../src/components/MonthWiseTrendChart';
import { mockMonthWiseSummaries } from '../../src/data/mockData';
import { UI_STRINGS } from '../../src/constants/uiStrings';
import type { MonthWiseSummary } from '../../src/types';

describe('MonthWiseTrendChart Component', () => {
  const defaultProps = {
    months: mockMonthWiseSummaries,
    spendCurrency: 'INR' as const,
    selectedFy: 'ALL' as const,
    onSelectFy: vi.fn(),
    viewMode: 'CHART_AND_TABLE' as const,
    onChangeViewMode: vi.fn(),
    searchQuery: ''
  };

  it('renders Multi-Year Line Graph by default with KPI insight cards', () => {
    render(<MonthWiseTrendChart {...defaultProps} />);

    // Line graph title & subtitle by default
    expect(screen.getByText(UI_STRINGS.documentSummary.month.graph.lineGraphTitle)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.documentSummary.month.graph.lineGraphSubtitle)).toBeInTheDocument();

    // Chart type toggle buttons
    expect(screen.getByText(UI_STRINGS.documentSummary.month.graph.chartTypes.line)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.documentSummary.month.graph.chartTypes.bar)).toBeInTheDocument();

    // View mode toggle buttons
    expect(screen.getByText(UI_STRINGS.documentSummary.month.graph.viewMode.chartAndTable)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.documentSummary.month.graph.viewMode.chartOnly)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.documentSummary.month.graph.viewMode.tableOnly)).toBeInTheDocument();

    // KPI Cards
    expect(screen.getByText(UI_STRINGS.documentSummary.month.graph.kpis.peakMonth)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.documentSummary.month.graph.kpis.lowestMonth)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.documentSummary.month.graph.kpis.monthlyAvg)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.documentSummary.month.graph.kpis.netTrajectory)).toBeInTheDocument();

    // Line graph comparison card for April by default
    expect(screen.getByText(UI_STRINGS.documentSummary.month.graph.yoyComparisonTitle('April'))).toBeInTheDocument();
  });

  it('toggles between Line Graph and 36-Month Timeline Bars view', () => {
    render(<MonthWiseTrendChart {...defaultProps} />);

    // Switch to Bar Timeline
    const barBtn = screen.getByText(UI_STRINGS.documentSummary.month.graph.chartTypes.bar);
    fireEvent.click(barBtn);

    expect(screen.getByText(UI_STRINGS.documentSummary.month.graph.title)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.documentSummary.month.graph.subtitle)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.documentSummary.month.graph.all36Months)).toBeInTheDocument();

    // Switch back to Line Graph
    const lineBtn = screen.getByText(UI_STRINGS.documentSummary.month.graph.chartTypes.line);
    fireEvent.click(lineBtn);

    expect(screen.getByText(UI_STRINGS.documentSummary.month.graph.lineGraphTitle)).toBeInTheDocument();
  });

  it('handles toggling year visibility in Line Graph', () => {
    render(<MonthWiseTrendChart {...defaultProps} />);

    const fy24Btn = screen.getByText(UI_STRINGS.documentSummary.month.graph.legends.fy24);
    fireEvent.click(fy24Btn);

    const fy25Btn = screen.getByText(UI_STRINGS.documentSummary.month.graph.legends.fy25);
    fireEvent.click(fy25Btn);

    const fy26Btn = screen.getByText(UI_STRINGS.documentSummary.month.graph.legends.fy26);
    fireEvent.click(fy26Btn);
  });

  it('handles view mode switcher buttons and hides chart in TABLE_ONLY mode', () => {
    const onChangeViewMode = vi.fn();
    const { rerender } = render(
      <MonthWiseTrendChart {...defaultProps} onChangeViewMode={onChangeViewMode} />
    );

    fireEvent.click(screen.getByText(UI_STRINGS.documentSummary.month.graph.viewMode.chartOnly));
    expect(onChangeViewMode).toHaveBeenCalledWith('CHART_ONLY');

    fireEvent.click(screen.getByText(UI_STRINGS.documentSummary.month.graph.viewMode.tableOnly));
    expect(onChangeViewMode).toHaveBeenCalledWith('TABLE_ONLY');

    fireEvent.click(screen.getByText(UI_STRINGS.documentSummary.month.graph.viewMode.chartAndTable));
    expect(onChangeViewMode).toHaveBeenCalledWith('CHART_AND_TABLE');

    rerender(
      <MonthWiseTrendChart
        {...defaultProps}
        viewMode="TABLE_ONLY"
        onChangeViewMode={onChangeViewMode}
      />
    );

    // In TABLE_ONLY, KPI cards and chart are hidden
    expect(screen.queryByText(UI_STRINGS.documentSummary.month.graph.kpis.peakMonth)).not.toBeInTheDocument();
  });

  it('filters data by fiscal year and search queries', () => {
    const { rerender } = render(
      <MonthWiseTrendChart {...defaultProps} selectedFy="FY24" searchQuery="SCRAP" />
    );
    expect(screen.getByText(UI_STRINGS.documentSummary.month.graph.lineGraphTitle)).toBeInTheDocument();

    rerender(
      <MonthWiseTrendChart {...defaultProps} selectedFy="FY25" searchQuery="Plant 1000" />
    );
    expect(screen.getByText(UI_STRINGS.documentSummary.month.graph.lineGraphTitle)).toBeInTheDocument();
  });

  it('renders correctly in USD currency and calculates trajectory properly', () => {
    render(<MonthWiseTrendChart {...defaultProps} spendCurrency="USD" />);
    expect(screen.getAllByText(/\$|\$/).length).toBeGreaterThan(0);
  });

  it('handles negative net 3-year trajectory calculation and empty months list', () => {
    const customMonths: MonthWiseSummary[] = [
      {
        month_key: '2023-04',
        month_label: 'Apr 2023',
        fiscal_year: 'FY24',
        spend_inr_cr: 100,
        spend_usd_m: 12,
        records_count: 50,
        po_count: 10,
        top_material_group: 'SCRAP',
        top_plant: 'Plant 1000',
        mom_change_pct: 0
      },
      {
        month_key: '2026-03',
        month_label: 'Mar 2026',
        fiscal_year: 'FY26',
        spend_inr_cr: 40,
        spend_usd_m: 5,
        records_count: 20,
        po_count: 4,
        top_material_group: 'SCRAP',
        top_plant: 'Plant 1000',
        mom_change_pct: -60
      }
    ];

    const { rerender } = render(
      <MonthWiseTrendChart {...defaultProps} months={customMonths} />
    );

    expect(screen.getByText('-60.0%')).toBeInTheDocument();

    // Empty list
    rerender(<MonthWiseTrendChart {...defaultProps} months={[]} />);
    expect(screen.getByText('+0.0%')).toBeInTheDocument();
  });
});
