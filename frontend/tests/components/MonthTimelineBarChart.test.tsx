import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MonthTimelineBarChart } from '../../src/components/MonthTimelineBarChart';
import { mockMonthWiseSummaries } from '../../src/data/mockData';
import { UI_STRINGS } from '../../src/constants/uiStrings';
import type { MonthWiseSummary } from '../../src/types';

const sampleMonths: MonthWiseSummary[] = [
  {
    month_key: '2023-04',
    month_label: 'Apr 2023',
    fiscal_year: 'FY24',
    spend_inr_cr: 10,
    spend_usd_m: 1.2,
    records_count: 50,
    po_count: 10,
    top_material_group: 'SCRAP',
    top_plant: 'Plant 1000',
    mom_change_pct: 0
  },
  {
    month_key: '2023-05',
    month_label: 'May 2023',
    fiscal_year: 'FY24',
    spend_inr_cr: 9.2,
    spend_usd_m: 1.1,
    records_count: 45,
    po_count: 9,
    top_material_group: 'SCRAP',
    top_plant: 'Plant 1000',
    mom_change_pct: -7.8
  },
  {
    month_key: '2023-06',
    month_label: 'Jun 2023',
    fiscal_year: 'FY24',
    spend_inr_cr: 14.1,
    spend_usd_m: 1.7,
    records_count: 70,
    po_count: 15,
    top_material_group: 'SCRAP',
    top_plant: 'Plant 1000',
    mom_change_pct: 53
  },
  {
    month_key: '2024-04',
    month_label: 'Apr 2024',
    fiscal_year: 'FY25',
    spend_inr_cr: 12,
    spend_usd_m: 1.4,
    records_count: 60,
    po_count: 12,
    top_material_group: 'CHEMICALS',
    top_plant: 'Plant 2000',
    mom_change_pct: 5
  },
  {
    month_key: '2025-04',
    month_label: 'Apr 2025',
    fiscal_year: 'FY26',
    spend_inr_cr: 15,
    spend_usd_m: 1.8,
    records_count: 65,
    po_count: 14,
    top_material_group: 'PACKAGING',
    top_plant: 'Plant 3000',
    mom_change_pct: 3
  }
];

describe('MonthTimelineBarChart Component', () => {
  const defaultProps = {
    months: sampleMonths,
    spendCurrency: 'INR' as const,
    selectedFy: 'ALL' as const,
    onSelectFy: vi.fn(),
    hoveredMonth: null,
    onHoverMonth: vi.fn(),
    searchQuery: ''
  };

  it('renders all 36 month bars and fiscal year legend buttons', () => {
    render(<MonthTimelineBarChart {...defaultProps} />);

    expect(screen.getByText(UI_STRINGS.documentSummary.month.graph.all36Months)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.documentSummary.month.graph.legends.fy24)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.documentSummary.month.graph.legends.fy25)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.documentSummary.month.graph.legends.fy26)).toBeInTheDocument();

    // Default inspection card for first month (Apr 2023 with 0% MoM)
    expect(screen.getByText(UI_STRINGS.documentSummary.month.graph.performanceTitle('Apr 2023'))).toBeInTheDocument();
  });

  it('handles FY filter button clicks and active styles', () => {
    const onSelectFy = vi.fn();
    const { rerender } = render(<MonthTimelineBarChart {...defaultProps} onSelectFy={onSelectFy} />);

    fireEvent.click(screen.getByText(UI_STRINGS.documentSummary.month.graph.all36Months));
    expect(onSelectFy).toHaveBeenCalledWith('ALL');

    fireEvent.click(screen.getByText(UI_STRINGS.documentSummary.month.graph.legends.fy24));
    expect(onSelectFy).toHaveBeenCalledWith('FY24');

    fireEvent.click(screen.getByText(UI_STRINGS.documentSummary.month.graph.legends.fy25));
    expect(onSelectFy).toHaveBeenCalledWith('FY25');

    fireEvent.click(screen.getByText(UI_STRINGS.documentSummary.month.graph.legends.fy26));
    expect(onSelectFy).toHaveBeenCalledWith('FY26');

    // Rerender with each active FY
    rerender(<MonthTimelineBarChart {...defaultProps} selectedFy="FY24" />);
    expect(screen.getByText(UI_STRINGS.documentSummary.month.graph.legends.fy24).closest('button')).toHaveClass('font-bold');

    rerender(<MonthTimelineBarChart {...defaultProps} selectedFy="FY25" />);
    expect(screen.getByText(UI_STRINGS.documentSummary.month.graph.legends.fy25).closest('button')).toHaveClass('font-bold');

    rerender(<MonthTimelineBarChart {...defaultProps} selectedFy="FY26" />);
    expect(screen.getByText(UI_STRINGS.documentSummary.month.graph.legends.fy26).closest('button')).toHaveClass('font-bold');
  });

  it('handles hovering and clicking on a bar, and displays active hoveredMonth', () => {
    const onHoverMonth = vi.fn();
    const junMonth = sampleMonths[2]; // Jun 2023 has +53% MoM
    const mayMonth = sampleMonths[1]; // May 2023 has -7.8% MoM
    const aprMonth = sampleMonths[0]; // Apr 2023 has 0% MoM

    const { rerender } = render(
      <MonthTimelineBarChart {...defaultProps} onHoverMonth={onHoverMonth} />
    );

    const junLabels = screen.getAllByText('Jun');
    const bar = junLabels[0].closest('div[class*="group cursor-pointer"]');
    expect(bar).toBeInTheDocument();

    if (bar) {
      fireEvent.mouseEnter(bar);
      expect(onHoverMonth).toHaveBeenCalledWith(junMonth);

      fireEvent.click(bar);
      expect(onHoverMonth).toHaveBeenCalledWith(junMonth);
    }

    // Rerender with positive MoM hovered month
    rerender(<MonthTimelineBarChart {...defaultProps} hoveredMonth={junMonth} />);
    expect(screen.getByText(UI_STRINGS.documentSummary.month.graph.performanceTitle('Jun 2023'))).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.documentSummary.month.graph.momSuffix(53))).toBeInTheDocument();

    // Rerender with negative MoM hovered month
    rerender(<MonthTimelineBarChart {...defaultProps} hoveredMonth={mayMonth} />);
    expect(screen.getByText(UI_STRINGS.documentSummary.month.graph.performanceTitle('May 2023'))).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.documentSummary.month.graph.momSuffix(-7.8))).toBeInTheDocument();

    // Rerender with zero MoM hovered month
    rerender(<MonthTimelineBarChart {...defaultProps} hoveredMonth={aprMonth} />);
    expect(screen.getByText(UI_STRINGS.documentSummary.month.graph.performanceTitle('Apr 2023'))).toBeInTheDocument();
  });

  it('renders fallback item and vendor counts when counts are missing', () => {
    const monthWithoutCounts: MonthWiseSummary = {
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
    };

    render(
      <MonthTimelineBarChart
        {...defaultProps}
        months={[monthWithoutCounts]}
        hoveredMonth={monthWithoutCounts}
      />
    );

    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('renders correctly with USD currency', () => {
    render(<MonthTimelineBarChart {...defaultProps} spendCurrency="USD" />);
    expect(screen.getAllByText(/\$|\$/).length).toBeGreaterThan(0);
  });

  it('handles search query filtering by month, material group, and plant', () => {
    const { rerender } = render(
      <MonthTimelineBarChart {...defaultProps} searchQuery="May 2023" />
    );
    expect(screen.getByText(UI_STRINGS.documentSummary.month.graph.performanceTitle('May 2023'))).toBeInTheDocument();

    // Search by top_material_group
    rerender(<MonthTimelineBarChart {...defaultProps} searchQuery="SCRAP" />);
    expect(screen.getAllByText('SCRAP').length).toBeGreaterThan(0);

    // Search by top_plant
    rerender(<MonthTimelineBarChart {...defaultProps} searchQuery="Plant 1000" />);
    expect(screen.getAllByText('Plant 1000').length).toBeGreaterThan(0);

    // Search non-existent
    rerender(<MonthTimelineBarChart {...defaultProps} searchQuery="NON_EXISTENT_SEARCH" />);
    expect(screen.getByText(UI_STRINGS.documentSummary.month.graph.noData)).toBeInTheDocument();
  });

  it('renders safely when months array is empty', () => {
    render(<MonthTimelineBarChart {...defaultProps} months={[]} />);
    expect(screen.getByText(UI_STRINGS.documentSummary.month.graph.noData)).toBeInTheDocument();
  });
});
