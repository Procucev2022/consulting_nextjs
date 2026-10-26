import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ReportingPeriodBar } from '../../src/components/reportingPeriod/ReportingPeriodBar';
import type { ReportingPeriodCoverage } from '../../src/types/reportingPeriod';

const mockCoverageComplete: ReportingPeriodCoverage = {
  selection: { mode: 'ALL_AVAILABLE' },
  earliestValidDate: '2023-01-02',
  latestValidDate: '2023-12-30',
  totalValidTransactions: 23570,
  actualDurationMonths: 12,
  availableFiscalYears: ['FY23', 'FY24'],
  missingFiscalYears: ['FY25', 'FY26'],
  availableMonthsCount: 12,
  effectiveStartDate: '2023-01-02',
  effectiveEndDate: '2023-12-30',
  selectedDurationMonths: 12,
  isFullyCovered: true,
  selectedPeriodLabel: 'Reporting Period: 02 Jan 2023 – 30 Dec 2023',
  actualCoverageLabel: '12 months',
  isInsufficientHistory: false
};

const mockCoverageInsufficient: ReportingPeriodCoverage = {
  ...mockCoverageComplete,
  selection: { mode: 'LAST_36_MONTHS' },
  selectedDurationMonths: 36,
  isFullyCovered: false,
  isInsufficientHistory: true,
  coverageDisclosure: 'Selected period: Last 36 Months. Available history: approximately 12 months. Missing 24 months of historical coverage.'
};

describe('ReportingPeriodBar Component', () => {
  it('renders prominent reporting period and actual data coverage', () => {
    const onSelectionChange = vi.fn();
    render(<ReportingPeriodBar coverage={mockCoverageComplete} onSelectionChange={onSelectionChange} />);

    expect(screen.getByTestId('standardised-reporting-period-bar')).toBeInTheDocument();
    expect(screen.getByTestId('reporting-period-display')).toHaveTextContent('02 Jan 2023 – 30 Dec 2023');
    expect(screen.getByTestId('data-coverage-display')).toHaveTextContent('12 months (02 Jan 2023 – 30 Dec 2023)');
  });

  it('triggers mode changes on pill buttons click', () => {
    const onSelectionChange = vi.fn();
    render(<ReportingPeriodBar coverage={mockCoverageComplete} onSelectionChange={onSelectionChange} />);

    fireEvent.click(screen.getByTestId('period-btn-12m'));
    expect(onSelectionChange).toHaveBeenCalledWith({ mode: 'LAST_12_MONTHS' });

    fireEvent.click(screen.getByTestId('period-btn-24m'));
    expect(onSelectionChange).toHaveBeenCalledWith({ mode: 'LAST_24_MONTHS' });

    fireEvent.click(screen.getByTestId('period-btn-36m'));
    expect(onSelectionChange).toHaveBeenCalledWith({ mode: 'LAST_36_MONTHS' });

    fireEvent.click(screen.getByTestId('period-btn-all'));
    expect(onSelectionChange).toHaveBeenCalledWith({ mode: 'ALL_AVAILABLE' });

    fireEvent.click(screen.getByTestId('period-btn-fy'));
    expect(onSelectionChange).toHaveBeenCalledWith({
      mode: 'FINANCIAL_YEAR',
      selectedFiscalYear: 'FY23'
    });

    fireEvent.click(screen.getByTestId('period-btn-custom'));
    expect(onSelectionChange).toHaveBeenCalledWith({
      mode: 'CUSTOM',
      customStartDate: '2023-01-02',
      customEndDate: '2023-12-30'
    });
  });

  it('renders disclosure banner when coverage disclosure is present', () => {
    render(<ReportingPeriodBar coverage={mockCoverageInsufficient} onSelectionChange={vi.fn()} />);

    const banner = screen.getByTestId('reporting-period-disclosure-banner');
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveTextContent('Missing 24 months of historical coverage');
  });

  it('renders financial year selector row and handles FY switch when in FY mode', () => {
    const onSelectionChange = vi.fn();
    const fyCoverage: ReportingPeriodCoverage = {
      ...mockCoverageComplete,
      selection: { mode: 'FINANCIAL_YEAR', selectedFiscalYear: 'FY24' }
    };
    render(<ReportingPeriodBar coverage={fyCoverage} onSelectionChange={onSelectionChange} />);

    expect(screen.getByTestId('financial-year-selector-row')).toBeInTheDocument();
    fireEvent.click(screen.getByText('FY23'));
    expect(onSelectionChange).toHaveBeenCalledWith({
      mode: 'FINANCIAL_YEAR',
      selectedFiscalYear: 'FY23'
    });
  });

  it('handles custom date range submission', () => {
    const onSelectionChange = vi.fn();
    const customCoverage: ReportingPeriodCoverage = {
      ...mockCoverageComplete,
      selection: { mode: 'CUSTOM', customStartDate: '2023-04-01', customEndDate: '2023-09-30' }
    };
    render(<ReportingPeriodBar coverage={customCoverage} onSelectionChange={onSelectionChange} />);

    const startInput = screen.getByLabelText('Start Date:');
    const endInput = screen.getByLabelText('End Date:');
    fireEvent.change(startInput, { target: { value: '2023-05-01' } });
    fireEvent.change(endInput, { target: { value: '2023-10-31' } });

    fireEvent.submit(screen.getByTestId('custom-date-form'));
    expect(onSelectionChange).toHaveBeenCalledWith({
      mode: 'CUSTOM',
      customStartDate: '2023-05-01',
      customEndDate: '2023-10-31'
    });
  });

  it('handles empty fallback date display', () => {
    const emptyCoverage: ReportingPeriodCoverage = {
      ...mockCoverageComplete,
      effectiveStartDate: 'N/A',
      effectiveEndDate: 'N/A',
      selectedPeriodLabel: 'No Data Available'
    };
    render(<ReportingPeriodBar coverage={emptyCoverage} onSelectionChange={vi.fn()} />);
    expect(screen.getByTestId('reporting-period-display')).toHaveTextContent('No Data Available');
  });

  it('renders active pill styles for LAST_12_MONTHS and LAST_24_MONTHS', () => {
    const coverage12m: ReportingPeriodCoverage = {
      ...mockCoverageComplete,
      selection: { mode: 'LAST_12_MONTHS' }
    };
    const { unmount } = render(<ReportingPeriodBar coverage={coverage12m} onSelectionChange={vi.fn()} />);
    expect(screen.getByTestId('period-btn-12m')).toHaveClass('bg-slate-900');
    unmount();

    const coverage24m: ReportingPeriodCoverage = {
      ...mockCoverageComplete,
      selection: { mode: 'LAST_24_MONTHS' }
    };
    render(<ReportingPeriodBar coverage={coverage24m} onSelectionChange={vi.fn()} />);
    expect(screen.getByTestId('period-btn-24m')).toHaveClass('bg-slate-900');
  });

  it('renders in compact mode and handles empty FY fallback', () => {
    const onSelectionChange = vi.fn();
    const emptyFyCoverage: ReportingPeriodCoverage = {
      ...mockCoverageComplete,
      availableFiscalYears: [],
      selection: { mode: 'ALL_AVAILABLE' }
    };
    render(
      <ReportingPeriodBar
        coverage={emptyFyCoverage}
        onSelectionChange={onSelectionChange}
        compact
      />
    );
    expect(screen.getByTestId('standardised-reporting-period-bar')).toHaveClass('p-3');

    fireEvent.click(screen.getByTestId('period-btn-fy'));
    expect(onSelectionChange).toHaveBeenCalledWith({
      mode: 'FINANCIAL_YEAR',
      selectedFiscalYear: 'FY24'
    });
  });

  it('prevents custom date range submission when end date is earlier than start date', () => {
    const onSelectionChange = vi.fn();
    const customCoverage: ReportingPeriodCoverage = {
      ...mockCoverageComplete,
      selection: { mode: 'CUSTOM', customStartDate: '2023-08-01', customEndDate: '2023-04-01' }
    };
    render(<ReportingPeriodBar coverage={customCoverage} onSelectionChange={onSelectionChange} />);
    fireEvent.submit(screen.getByTestId('custom-date-form'));
    expect(onSelectionChange).not.toHaveBeenCalled();
  });
});
