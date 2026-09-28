import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PCBIValidationSummaryCards } from '../../../src/components/admin/pcbi/PCBIValidationSummaryCards';
import { UI_STRINGS } from '../../../src/constants';
import type { PCBIValidationSummary } from '../../../src/types/pcbiAdmin';

describe('PCBIValidationSummaryCards Unit Tests', () => {
  const mockSummary: PCBIValidationSummary = {
    totalRecords: 96357,
    validRecords: 96357,
    warningRecords: 290,
    errorRecords: 0,
    blockingErrorCount: 0,
    warningCount: 290,
    informationCount: 100,
    masterRecordsCount: 290,
    weeklyRecordsCount: 95700,
    constituentRecordsCount: 290,
    sourceRecordsCount: 4,
    unspscRecordsCount: 73,
    uniquePcbiIdsCount: 290,
    duplicateTechnicalIdsCount: 0,
    missingQualityCount: 0,
    missingBenchmarkabilityCount: 0,
    missingSourceCount: 0,
    missingUnspscCount: 0,
    invalidIndexValuesCount: 0,
    duplicateWeeklyRecordsCount: 0,
    constituentWeightIssuesCount: 0,
    sourcePendingCount: 95700,
    aQualityCount: 20,
    bQualityCount: 100,
    cQualityCount: 170,
    unassignedQualityCount: 0,
    avgBenchmarkability: 72,
    dateStart: '2020-04-06',
    dateEnd: '2026-07-27',
    issues: []
  };

  it('renders all 5 KPI cards with formatted values', () => {
    render(<PCBIValidationSummaryCards summary={mockSummary} />);

    expect(screen.getByText(UI_STRINGS.pcbiAdmin.totalRecords)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.pcbiAdmin.validRecords)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.pcbiAdmin.blockingErrors)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.pcbiAdmin.warnings)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.pcbiAdmin.information)).toBeInTheDocument();

    expect(screen.getAllByText('96,357').length).toBe(2);
    expect(screen.getAllByText('290').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('renders dataset breakdown counts accurately', () => {
    render(<PCBIValidationSummaryCards summary={mockSummary} />);

    expect(screen.getByText(UI_STRINGS.pcbiAdmin.datasetBreakdownTitle)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.pcbiAdmin.pcbiMasterRecords)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.pcbiAdmin.weeklyIndexRecords)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.pcbiAdmin.constituentRecords)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.pcbiAdmin.sourceRecords)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.pcbiAdmin.unspscMappingRecords)).toBeInTheDocument();

    expect(screen.getByText('95,700')).toBeInTheDocument();
    expect(screen.getByText('73')).toBeInTheDocument();
  });

  it('renders audit indicators and highlights active warning/error thresholds', () => {
    const summaryWithAuditIssues: PCBIValidationSummary = {
      ...mockSummary,
      duplicateTechnicalIdsCount: 2,
      missingQualityCount: 15,
      missingBenchmarkabilityCount: 10,
      invalidIndexValuesCount: 3,
      duplicateWeeklyRecordsCount: 4,
      constituentWeightIssuesCount: 5
    };

    render(<PCBIValidationSummaryCards summary={summaryWithAuditIssues} />);

    expect(screen.getByText(UI_STRINGS.pcbiAdmin.auditBreakdownTitle)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.pcbiAdmin.uniquePcbiIds)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.pcbiAdmin.duplicateTechnicalIds)).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getAllByText('4').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('handles empty or partial summary cleanly with defaults', () => {
    const minimalSummary = {} as unknown as PCBIValidationSummary;
    render(<PCBIValidationSummaryCards summary={minimalSummary} />);

    expect(screen.getByText(UI_STRINGS.pcbiAdmin.totalRecords)).toBeInTheDocument();
    expect(screen.getAllByText('0').length).toBeGreaterThan(5);
  });
});
