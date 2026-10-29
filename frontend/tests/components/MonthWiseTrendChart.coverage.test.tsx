import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MonthWiseTrendChart } from '../../src/components/MonthWiseTrendChart';
import { UI_STRINGS } from '../../src/constants/uiStrings';
import type { MonthWiseSummary, VgtPeriodMetadata } from '../../src/types';

const disclosure = UI_STRINGS.documentSummary.month;

const buildMonth = (overrides: Partial<MonthWiseSummary> = {}): MonthWiseSummary => ({
  month_key: '2023-04',
  month_label: 'Apr 2023',
  fiscal_year: 'FY24',
  spend_inr_cr: 220.5,
  spend_usd_m: 26.3,
  po_count: 310,
  top_material_group: 'FERRO',
  top_plant: '1000',
  mom_change_pct: 4.2,
  ...overrides
});

const buildPeriod = (overrides: Partial<VgtPeriodMetadata> = {}): VgtPeriodMetadata => ({
  minTransactionDate: 'Apr 2023',
  maxTransactionDate: 'Mar 2024',
  actualBillingMonths: 12,
  actualFiscalYears: ['FY24'],
  actualMonthKeys: ['2023-04'],
  fiscalMonthCoverage: '12 of 12',
  availableMonthsByFiscalYear: { FY24: 12 },
  missingMonthsByFiscalYear: {},
  hasMultiYearComparison: false,
  has36MonthCoverage: false,
  ...overrides
});

const renderChart = (
  overrides: Partial<React.ComponentProps<typeof MonthWiseTrendChart>> = {}
): ReturnType<typeof render> =>
  render(
    <MonthWiseTrendChart
      months={[buildMonth()]}
      spendCurrency="INR"
      selectedFy="ALL"
      onSelectFy={vi.fn()}
      viewMode="CHART_AND_TABLE"
      onChangeViewMode={vi.fn()}
      {...overrides}
    />
  );

describe('MonthWiseTrendChart coverage', () => {
  it('shows the peak of the selected fiscal year in the KPIs', () => {
    renderChart({
      months: [
        buildMonth({ month_key: '2023-04', month_label: 'Apr 2023', fiscal_year: 'FY24', spend_inr_cr: 220.5 }),
        buildMonth({ month_key: '2024-04', month_label: 'Apr 2024', fiscal_year: 'FY25', spend_inr_cr: 310.4 })
      ],
      selectedFy: 'FY25'
    });

    expect(screen.getAllByText(/310\.40/).length).toBeGreaterThan(0);
  });

  it('treats a missing USD value as zero and reports no change when the first month is zero', () => {
    renderChart({
      spendCurrency: 'USD',
      months: [
        buildMonth({ month_key: '2023-04', month_label: 'Apr 2023', fiscal_year: 'FY24', spend_usd_m: undefined }),
        buildMonth({ month_key: '2024-05', month_label: 'May 2024', fiscal_year: 'FY25', spend_usd_m: 12.5 })
      ]
    });

    expect(screen.getAllByText(/12\.50/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\+0\.0%/).length).toBeGreaterThan(0);
  });

  it('shows a negative net change with the reduction colour when the last month is below the first', () => {
    renderChart({
      months: [
        buildMonth({ month_key: '2023-04', month_label: 'Apr 2023', fiscal_year: 'FY24', spend_inr_cr: 300 }),
        buildMonth({ month_key: '2024-04', month_label: 'Apr 2024', fiscal_year: 'FY25', spend_inr_cr: 150 })
      ]
    });

    // The same figure appears in more than one card, so pick the net trajectory value by its reduction colour.
    const reduction = screen
      .getAllByText(/-50\.0%/)
      .find((element) => element.classList.contains('text-emerald-600'));
    expect(reduction).toBeDefined();
  });

  it('shows empty-state KPIs when no month matches the selected fiscal year', () => {
    renderChart({
      months: [buildMonth({ fiscal_year: 'FY24' })],
      selectedFy: 'FY26'
    });

    expect(screen.getByText(UI_STRINGS.documentSummary.month.graph.acrossMonths(0))).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.documentSummary.month.datasetCoverageValue(0))).toBeInTheDocument();
  });

  it('uses the default fiscal year and a missing-month count of two when period metadata has neither', () => {
    renderChart({
      periodMetadata: buildPeriod({ actualFiscalYears: [], missingMonthsByFiscalYear: {} })
    });

    expect(
      screen.getByText(disclosure.coverageDisclosure(12, 'Apr 2023 – Mar 2024', 2, 'FY22'))
    ).toBeInTheDocument();
  });

  it('reports the missing month count recorded for the first fiscal year', () => {
    renderChart({
      periodMetadata: buildPeriod({
        actualFiscalYears: ['FY24'],
        missingMonthsByFiscalYear: { FY24: ['2023-05', '2023-06', '2023-07'] }
      })
    });

    expect(
      screen.getByText(disclosure.coverageDisclosure(12, 'Apr 2023 – Mar 2024', 3, 'FY24'))
    ).toBeInTheDocument();
  });
});
