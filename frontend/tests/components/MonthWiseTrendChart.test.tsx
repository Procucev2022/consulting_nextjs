import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MonthWiseTrendChart } from '../../src/components/MonthWiseTrendChart';
import { UI_STRINGS } from '../../src/constants/uiStrings';
import type { MonthWiseSummary } from '../../src/types';

const createMultiYearMonths = (): MonthWiseSummary[] => {
  const fnames = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
  const years = ['FY24', 'FY25', 'FY26'];
  const result: MonthWiseSummary[] = [];
  years.forEach((fy) => {
    fnames.forEach((fn, idx) => {
      result.push({
        month_key: `${fy}-${idx}`,
        month_label: `${fn} 2024`,
        fiscal_year: fy,
        records_count: 100,
        po_count: 10,
        spend_inr_cr: 150 + idx * 10,
        spend_usd_m: 20 + idx,
        top_material_group: 'RAW',
        top_plant: '1000',
        mom_change_pct: idx === 0 ? 0 : 5.0
      });
    });
  });
  return result;
};

const createVgt10Months = (): MonthWiseSummary[] => {
  const keys = ['2021-04', '2021-05', '2021-06', '2021-07', '2021-08', '2021-09', '2021-10', '2021-11', '2021-12', '2022-01'];
  const labels = ['Apr 2021', 'May 2021', 'Jun 2021', 'Jul 2021', 'Aug 2021', 'Sep 2021', 'Oct 2021', 'Nov 2021', 'Dec 2021', 'Jan 2022'];
  const spends = [254.68, 137.94, 84.62, 201.18, 509.81, 508.46, 1654.76, 235.50, 262.78, 224.09];
  return keys.map((mk, i) => ({
    month_key: mk,
    month_label: labels[i],
    fiscal_year: 'FY22',
    records_count: 1000,
    po_count: 50,
    spend_inr_cr: spends[i],
    spend_usd_m: spends[i] / 80,
    top_material_group: 'DIRECT_MATERIALS',
    top_plant: 'PLANT_A',
    mom_change_pct: i === 0 ? 0 : 5.0
  }));
};

describe('MonthWiseTrendChart Component', () => {
  const multiYearMonths = createMultiYearMonths();
  const defaultProps = {
    months: multiYearMonths,
    spendCurrency: 'INR' as const,
    selectedFy: 'ALL' as const,
    onSelectFy: vi.fn(),
    viewMode: 'CHART_AND_TABLE' as const,
    onChangeViewMode: vi.fn(),
    searchQuery: ''
  };

  describe('Multi-Year Comparison Mode (3 FYs Present)', () => {
    it('renders Multi-Year Line Graph by default with KPI insight cards', () => {
      render(<MonthWiseTrendChart {...defaultProps} />);

      // Line graph title & subtitle for multi-year
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

    it('toggles between Line Graph and Timeline Bars view', () => {
      render(<MonthWiseTrendChart {...defaultProps} />);

      // Switch to Bar Timeline
      const barBtn = screen.getByText(UI_STRINGS.documentSummary.month.graph.chartTypes.bar);
      fireEvent.click(barBtn);

      expect(screen.getByText(UI_STRINGS.documentSummary.month.graph.title)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.documentSummary.month.graph.subtitle)).toBeInTheDocument();

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
  });

  describe('Single-Year Actual Spend Trend Mode (VGT 10-Month Dataset)', () => {
    it('renders Actual Month-Wise Spend Trend with honest coverage disclosures and suppresses YoY card', () => {
      const vgtMonths = createVgt10Months();
      const periodMeta = {
        minTransactionDate: 'April 2021',
        maxTransactionDate: 'January 2022',
        actualBillingMonths: 10,
        actualFiscalYears: ['FY22'],
        actualMonthKeys: vgtMonths.map(m => m.month_key),
        fiscalMonthCoverage: 'FY22 | 10 of 12 months available',
        availableMonthsByFiscalYear: { FY22: 10 },
        missingMonthsByFiscalYear: { FY22: ['February 2022', 'March 2022'] },
        hasMultiYearComparison: false,
        has36MonthCoverage: false
      };

      render(
        <MonthWiseTrendChart
          {...defaultProps}
          months={vgtMonths}
          periodMetadata={periodMeta}
        />
      );

      // Honest Single-Year Title and Subtitle
      expect(screen.getByText(UI_STRINGS.documentSummary.month.actualTrendTitle)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.documentSummary.month.actualTrendSubtitle(10))).toBeInTheDocument();

      // 4th KPI Card is Actual Coverage instead of Trajectory
      expect(screen.getByText(UI_STRINGS.documentSummary.month.actualCoverageTitle)).toBeInTheDocument();
      expect(screen.getByText('10 Months')).toBeInTheDocument();

      // Coverage disclosure banner
      expect(
        screen.getByText(
          UI_STRINGS.documentSummary.month.coverageDisclosure(10, 'Apr 2021 – Jan 2022', 2, 'FY22')
        )
      ).toBeInTheDocument();

      // Suppresses YoY card and multi-year titles
      expect(screen.queryByText(UI_STRINGS.documentSummary.month.graph.lineGraphTitle)).toBeNull();
      expect(screen.queryByText(UI_STRINGS.documentSummary.month.graph.yoyComparisonTitle('April'))).toBeNull();
    });
  });

  describe('View Mode Switching & Search', () => {
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

    it('filters data by search queries', () => {
      render(
        <MonthWiseTrendChart {...defaultProps} searchQuery="Apr" />
      );
      expect(screen.getByText(UI_STRINGS.documentSummary.month.graph.lineGraphTitle)).toBeInTheDocument();
    });

    it('renders correctly in USD currency', () => {
      render(<MonthWiseTrendChart {...defaultProps} spendCurrency="USD" />);
      expect(screen.getAllByText(/\$|\$/).length).toBeGreaterThan(0);
    });

    it('handles empty months list without throwing', () => {
      render(<MonthWiseTrendChart {...defaultProps} months={[]} />);
      expect(screen.getByText(UI_STRINGS.documentSummary.month.graph.noData)).toBeInTheDocument();
    });
  });
});
