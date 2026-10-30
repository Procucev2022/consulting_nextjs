import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MultiYearComparisonCard } from '../../src/components/MultiYearComparisonCard';
import { UI_STRINGS } from '../../src/constants/uiStrings';
import type { MonthWiseSummary } from '../../src/types';

const monthDef = { key: 'Oct', label: 'Oct', fullName: 'October', index: 6 };

const buildMonth = (overrides: Partial<MonthWiseSummary> = {}): MonthWiseSummary => ({
  month_key: '2023-10',
  month_label: 'Oct 2023',
  fiscal_year: 'FY24',
  spend_inr_cr: 42.5,
  spend_usd_m: 5.1,
  po_count: 30,
  top_material_group: 'FERRO',
  top_plant: '1000',
  ...overrides
});

describe('MultiYearComparisonCard coverage', () => {
  it('falls back through record and line-item counts when unique item counts are absent', () => {
    render(
      <MultiYearComparisonCard
        selectedMonthDef={monthDef}
        selectedFy24={buildMonth({ fiscal_year: 'FY24', records_count: 120 })}
        selectedFy25={buildMonth({ fiscal_year: 'FY25', line_items_count: 45 })}
        selectedFy26={buildMonth({ fiscal_year: 'FY26' })}
        fy25YoY={null}
        fy26YoY={null}
        spendCurrency="INR"
      />
    );

    expect(screen.getByText(/^120/)).toBeInTheDocument();
    expect(screen.getByText(/^45/)).toBeInTheDocument();
    expect(screen.getByText(/^0/)).toBeInTheDocument();
  });

  it('shows zero USD spend for years with no USD value instead of failing to render', () => {
    render(
      <MultiYearComparisonCard
        selectedMonthDef={monthDef}
        selectedFy24={buildMonth({ fiscal_year: 'FY24', spend_usd_m: undefined })}
        selectedFy25={buildMonth({ fiscal_year: 'FY25', spend_usd_m: undefined })}
        selectedFy26={buildMonth({ fiscal_year: 'FY26', spend_usd_m: undefined })}
        fy25YoY={null}
        fy26YoY={null}
        spendCurrency="USD"
      />
    );

    expect(screen.getAllByText(/^\$0\.00/)).toHaveLength(3);
  });

  it('shows the spend in USD with the fiscal-year month label when the currency is USD', () => {
    render(
      <MultiYearComparisonCard
        selectedMonthDef={monthDef}
        selectedFy24={buildMonth({ fiscal_year: 'FY24', spend_usd_m: 5.1 })}
        selectedFy25={null}
        selectedFy26={null}
        fy25YoY={null}
        fy26YoY={null}
        spendCurrency="USD"
      />
    );

    expect(screen.getByText(/^\$5\.10/)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.documentSummary.month.graph.yoyComparisonTitle('October'))).toBeInTheDocument();
  });
});
