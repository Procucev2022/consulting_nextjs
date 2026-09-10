import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MultiYearComparisonCard } from '../../src/components/MultiYearComparisonCard';
import { mockMonthWiseSummaries } from '../../src/data/mockData';
import { UI_STRINGS } from '../../src/constants/uiStrings';

describe('MultiYearComparisonCard Component', () => {
  const monthDef = { key: 'Oct', label: 'Oct', fullName: 'October', index: 6 };
  const fy24Oct = mockMonthWiseSummaries.find((m) => m.fiscal_year === 'FY24' && m.month_label.startsWith('Oct')) || null;
  const fy25Oct = mockMonthWiseSummaries.find((m) => m.fiscal_year === 'FY25' && m.month_label.startsWith('Oct')) || null;
  const fy26Oct = mockMonthWiseSummaries.find((m) => m.fiscal_year === 'FY26' && m.month_label.startsWith('Oct')) || null;

  it('renders all three fiscal years with YoY growth badges in INR', () => {
    render(
      <MultiYearComparisonCard
        selectedMonthDef={monthDef}
        selectedFy24={fy24Oct}
        selectedFy25={fy25Oct}
        selectedFy26={fy26Oct}
        fy25YoY={18.5}
        fy26YoY={-7.2}
        spendCurrency="INR"
      />
    );

    expect(screen.getByText(UI_STRINGS.documentSummary.month.graph.yoyComparisonTitle('October'))).toBeInTheDocument();
    expect(screen.getByText('FY24')).toBeInTheDocument();
    expect(screen.getByText('FY25')).toBeInTheDocument();
    expect(screen.getByText('FY26')).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.documentSummary.month.graph.yoyGrowth(18.5))).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.documentSummary.month.graph.yoyGrowth(-7.2))).toBeInTheDocument();
  });

  it('renders correctly in USD with null records gracefully', () => {
    render(
      <MultiYearComparisonCard
        selectedMonthDef={monthDef}
        selectedFy24={null}
        selectedFy25={null}
        selectedFy26={null}
        fy25YoY={null}
        fy26YoY={null}
        spendCurrency="USD"
      />
    );

    expect(screen.getByText(UI_STRINGS.documentSummary.month.graph.yoyComparisonTitle('October'))).toBeInTheDocument();
    const naElements = screen.getAllByText('N/A');
    expect(naElements.length).toBe(3);
  });

  it('covers fallback branches when unique_items_count and unique_vendors_count are undefined', () => {
    const customFy24 = {
      ...mockMonthWiseSummaries[0],
      month_label: 'Oct 2023',
      fiscal_year: 'FY24' as const,
      spend_inr_cr: 150.0,
      spend_usd_m: 18.0,
      percentage_of_total: 2.5,
      records_count: 550,
      unique_items_count: undefined,
      unique_vendors_count: undefined
    };
    const customFy25 = {
      ...mockMonthWiseSummaries[0],
      month_label: 'Oct 2024',
      fiscal_year: 'FY25' as const,
      spend_inr_cr: 140.0,
      spend_usd_m: 16.8,
      percentage_of_total: 2.3,
      records_count: 480,
      unique_items_count: undefined,
      unique_vendors_count: undefined
    };
    const customFy26 = {
      ...mockMonthWiseSummaries[0],
      month_label: 'Oct 2025',
      fiscal_year: 'FY26' as const,
      spend_inr_cr: 165.0,
      spend_usd_m: 19.8,
      percentage_of_total: 2.7,
      records_count: 620,
      unique_items_count: undefined,
      unique_vendors_count: undefined
    };

    render(
      <MultiYearComparisonCard
        selectedMonthDef={monthDef}
        selectedFy24={customFy24}
        selectedFy25={customFy25}
        selectedFy26={customFy26}
        fy25YoY={-6.6}
        fy26YoY={17.8}
        spendCurrency="INR"
      />
    );

    expect(screen.getByText('550 items')).toBeInTheDocument();
    expect(screen.getByText('480 items')).toBeInTheDocument();
    expect(screen.getByText('620 items')).toBeInTheDocument();
    expect(screen.getAllByText('100 vendors').length).toBe(3);
  });
});
