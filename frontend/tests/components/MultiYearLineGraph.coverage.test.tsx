import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MultiYearLineGraph } from '../../src/components/MultiYearLineGraph';
import { UI_STRINGS } from '../../src/constants/uiStrings';
import type { MonthWiseSummary } from '../../src/types';

const FISCAL_YEARS = ['FY24', 'FY25', 'FY26'];
const MONTH_KEYS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
const VISIBLE_YEARS = { FY24: true, FY25: true, FY26: true };

// Three fiscal years of twelve months each. USD values are optional, so they can be left out.
const buildThreeYearMonths = (includeUsd: boolean): MonthWiseSummary[] =>
  FISCAL_YEARS.flatMap((fiscalYear, fyIndex) =>
    MONTH_KEYS.map((monthKey, monthIndex) => ({
      month_key: `${fiscalYear}-${monthKey}`,
      month_label: `${monthKey} ${2023 + fyIndex}`,
      fiscal_year: fiscalYear,
      spend_inr_cr: 100 + fyIndex * 10 + monthIndex,
      ...(includeUsd ? { spend_usd_m: 12 + monthIndex } : {}),
      po_count: 10 + monthIndex,
      top_material_group: 'FERRO',
      top_plant: '1000'
    }))
  );

const buildSingleYearMonths = (): MonthWiseSummary[] =>
  MONTH_KEYS.map((monthKey, monthIndex) => ({
    month_key: monthKey,
    month_label: monthKey,
    fiscal_year: 'FY24',
    spend_inr_cr: 50 + monthIndex,
    po_count: 5,
    top_material_group: 'FERRO',
    top_plant: '1000'
  }));

const hitRects = (container: HTMLElement): NodeListOf<Element> =>
  container.querySelectorAll('rect[class*="cursor-pointer"]');

describe('MultiYearLineGraph coverage', () => {
  it('treats missing USD spend as zero in the multi-year series and the selected-month summary', () => {
    render(
      <MultiYearLineGraph
        months={buildThreeYearMonths(false)}
        spendCurrency="USD"
        visibleYears={VISIBLE_YEARS}
        onToggleYear={vi.fn()}
        selectedMonthIndex={6}
        onSelectMonthIndex={vi.fn()}
      />
    );

    expect(screen.getAllByText(/\$0\.00/).length).toBeGreaterThan(0);
    expect(screen.getByText(UI_STRINGS.documentSummary.month.graph.legends.fy24)).toBeInTheDocument();
  });

  it('selects a month from its hit area in USD mode when USD values are present', () => {
    const onSelectMonthIndex = vi.fn();
    const { container } = render(
      <MultiYearLineGraph
        months={buildThreeYearMonths(true)}
        spendCurrency="USD"
        visibleYears={VISIBLE_YEARS}
        onToggleYear={vi.fn()}
        selectedMonthIndex={0}
        onSelectMonthIndex={onSelectMonthIndex}
      />
    );

    const rects = hitRects(container);
    const target = rects[3];
    if (!target) {
      throw new Error('Expected month hit areas to be rendered');
    }
    fireEvent.click(target);

    expect(onSelectMonthIndex).toHaveBeenCalledWith(3);
  });

  it('falls back to the fiscal year when a single-year month label has no year part', () => {
    render(
      <MultiYearLineGraph
        months={buildSingleYearMonths()}
        spendCurrency="INR"
        visibleYears={VISIBLE_YEARS}
        onToggleYear={vi.fn()}
        selectedMonthIndex={2}
        onSelectMonthIndex={vi.fn()}
      />
    );

    expect(screen.getAllByText(/FY24/).length).toBeGreaterThan(0);
  });

  it('falls back to the purchase-order count when a selected month has no record count', () => {
    render(
      <MultiYearLineGraph
        months={buildSingleYearMonths()}
        spendCurrency="INR"
        visibleYears={VISIBLE_YEARS}
        onToggleYear={vi.fn()}
        selectedMonthIndex={2}
        onSelectMonthIndex={vi.fn()}
      />
    );

    // Every single-year month has po_count 5 and no records_count, so the summary shows 5.
    expect(screen.getAllByText(/^5$/).length).toBeGreaterThan(0);
  });
});
