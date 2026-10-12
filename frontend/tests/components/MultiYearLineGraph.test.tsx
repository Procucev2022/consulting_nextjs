import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MultiYearLineGraph } from '../../src/components/MultiYearLineGraph';
import type { MonthWiseSummary } from '../../src/types';
import { UI_STRINGS } from '../../src/constants/uiStrings';

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
        top_plant: '1000'
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

describe('MultiYearLineGraph Component', () => {
  const multiYearMonths = createMultiYearMonths();
  const defaultProps = {
    months: multiYearMonths,
    spendCurrency: 'INR' as const,
    visibleYears: { FY24: true, FY25: true, FY26: true },
    onToggleYear: vi.fn(),
    selectedMonthIndex: 0,
    onSelectMonthIndex: vi.fn()
  };

  describe('Multi-Year Comparison Mode (3 FYs Present)', () => {
    it('renders X-axis months, Y-axis amount labels, and fiscal year legends', () => {
      render(<MultiYearLineGraph {...defaultProps} />);

      // Fiscal year toggle buttons in legend
      expect(screen.getByText(UI_STRINGS.documentSummary.month.graph.legends.fy24)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.documentSummary.month.graph.legends.fy25)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.documentSummary.month.graph.legends.fy26)).toBeInTheDocument();

      // X-axis month ticks: Apr, May, Jun, etc.
      expect(screen.getAllByText('Apr').length).toBeGreaterThan(0);
      expect(screen.getAllByText('May').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Jun').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Mar').length).toBeGreaterThan(0);

      // Initial inspection card comparison for April
      expect(screen.getByText(UI_STRINGS.documentSummary.month.graph.yoyComparisonTitle('April'))).toBeInTheDocument();
    });

    it('handles toggling year visibility', () => {
      const onToggleYear = vi.fn();
      render(<MultiYearLineGraph {...defaultProps} onToggleYear={onToggleYear} />);

      fireEvent.click(screen.getByText(UI_STRINGS.documentSummary.month.graph.legends.fy24));
      expect(onToggleYear).toHaveBeenCalledWith('FY24');

      fireEvent.click(screen.getByText(UI_STRINGS.documentSummary.month.graph.legends.fy25));
      expect(onToggleYear).toHaveBeenCalledWith('FY25');

      fireEvent.click(screen.getByText(UI_STRINGS.documentSummary.month.graph.legends.fy26));
      expect(onToggleYear).toHaveBeenCalledWith('FY26');
    });

    it('handles selecting month on X-axis via click or hover', () => {
      const onSelectMonthIndex = vi.fn();
      const { container } = render(
        <MultiYearLineGraph {...defaultProps} onSelectMonthIndex={onSelectMonthIndex} />
      );

      // Find interactive overlay rects
      const hitRects = container.querySelectorAll('rect[class*="cursor-pointer"]');
      expect(hitRects.length).toBe(12);

      // Click on month index 6 (October)
      fireEvent.click(hitRects[6]);
      expect(onSelectMonthIndex).toHaveBeenCalledWith(6);

      // Hover over month index 3 (July)
      fireEvent.mouseEnter(hitRects[3]);
      expect(onSelectMonthIndex).toHaveBeenCalledWith(3);
    });

    it('renders correctly in USD currency with YoY growth percentages', () => {
      render(<MultiYearLineGraph {...defaultProps} spendCurrency="USD" selectedMonthIndex={6} />);

      // October comparison should show USD amounts
      expect(screen.getByText(UI_STRINGS.documentSummary.month.graph.yoyComparisonTitle('October'))).toBeInTheDocument();
      expect(screen.getAllByText(/\$|\$/).length).toBeGreaterThan(0);
    });

    it('renders with hidden years when visibleYears flags are false', () => {
      render(
        <MultiYearLineGraph
          {...defaultProps}
          visibleYears={{ FY24: false, FY25: false, FY26: false }}
        />
      );

      // Legend buttons should reflect inactive opacity
      const fy24Btn = screen.getByText(UI_STRINGS.documentSummary.month.graph.legends.fy24).closest('button');
      expect(fy24Btn).toHaveClass('opacity-60');
    });
  });

  describe('Single-Year Actual Spend Trend Mode (VGT 10-Month Dataset)', () => {
    it('renders actual 10 data points without FY24/25/26 legends or YoY comparison card', () => {
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

      const { container } = render(
        <MultiYearLineGraph
          months={vgtMonths}
          spendCurrency="INR"
          periodMetadata={periodMeta}
          selectedMonthIndex={0}
          onSelectMonthIndex={vi.fn()}
        />
      );

      // Must NOT render multi-year FY24/FY25/FY26 legends
      expect(screen.queryByText(UI_STRINGS.documentSummary.month.graph.legends.fy24)).toBeNull();
      expect(screen.queryByText(UI_STRINGS.documentSummary.month.graph.legends.fy25)).toBeNull();
      expect(screen.queryByText(UI_STRINGS.documentSummary.month.graph.legends.fy26)).toBeNull();

      // Must NOT render YoY comparison card title
      expect(screen.queryByText(UI_STRINGS.documentSummary.month.graph.yoyComparisonTitle('April'))).toBeNull();

      // Renders actual month ticks and selected month card
      expect(screen.getAllByText('Apr').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Jan').length).toBeGreaterThan(0);
      expect(screen.getByText('Apr 2021')).toBeInTheDocument();

      // Renders points for each of the 10 months
      const hitRects = container.querySelectorAll('rect[class*="cursor-pointer"]');
      expect(hitRects.length).toBe(10);
    });

    it('allows selecting months in single-year mode via hover or click', () => {
      const vgtMonths = createVgt10Months();
      const onSelectMonthIndex = vi.fn();
      const { container } = render(
        <MultiYearLineGraph
          months={vgtMonths}
          spendCurrency="INR"
          selectedMonthIndex={0}
          onSelectMonthIndex={onSelectMonthIndex}
        />
      );

      const hitRects = container.querySelectorAll('rect[class*="cursor-pointer"]');
      fireEvent.click(hitRects[6]);
      expect(onSelectMonthIndex).toHaveBeenCalledWith(6);

      fireEvent.mouseEnter(hitRects[4]);
      expect(onSelectMonthIndex).toHaveBeenCalledWith(4);
    });
  });

  describe('Empty State', () => {
    it('handles empty months list gracefully with explicit empty state message', () => {
      render(<MultiYearLineGraph {...defaultProps} months={[]} />);
      expect(screen.getByText(UI_STRINGS.documentSummary.month.graph.noData)).toBeInTheDocument();
    });
  });
});
