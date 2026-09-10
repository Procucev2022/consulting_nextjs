import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MultiYearLineGraph } from '../../src/components/MultiYearLineGraph';
import { mockMonthWiseSummaries } from '../../src/data/mockData';
import { UI_STRINGS } from '../../src/constants/uiStrings';

describe('MultiYearLineGraph Component', () => {
  const defaultProps = {
    months: mockMonthWiseSummaries,
    spendCurrency: 'INR' as const,
    visibleYears: { FY24: true, FY25: true, FY26: true },
    onToggleYear: vi.fn(),
    selectedMonthIndex: 0,
    onSelectMonthIndex: vi.fn()
  };

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

  it('handles empty months list without throwing', () => {
    render(<MultiYearLineGraph {...defaultProps} months={[]} />);

    expect(screen.getByText(UI_STRINGS.documentSummary.month.graph.yoyComparisonTitle('April'))).toBeInTheDocument();
    expect(screen.getAllByText('N/A').length).toBeGreaterThan(0);
  });
});
