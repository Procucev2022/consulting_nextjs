import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PCBIValidationIssuesTable } from '../../../src/components/admin/pcbi/PCBIValidationIssuesTable';
import { UI_STRINGS } from '../../../src/constants';
import type { PCBIValidationIssue } from '../../../src/types/pcbiAdmin';

describe('PCBIValidationIssuesTable Unit Tests', () => {
  const mockIssues: PCBIValidationIssue[] = [
    {
      id: 'issue-1',
      sheetName: 'PCBI_MASTER',
      rowNumber: 2,
      column: 'PCBI ID',
      rawValue: '',
      severity: 'BLOCKING_ERROR',
      rule: 'REQUIRED_FIELD_MISSING',
      message: 'PCBI ID is missing',
      resolution: 'Provide technical PCBI ID'
    },
    {
      id: 'issue-2',
      sheetName: 'PCBI_MASTER',
      rowNumber: 3,
      column: 'Quality Rating',
      rawValue: '',
      severity: 'WARNING',
      rule: 'MISSING_DATA',
      message: 'Quality rating missing',
      resolution: 'Assign A, B, or C during review'
    },
    {
      id: 'issue-3',
      sheetName: 'WEEKLY_INDEX',
      rowNumber: 15,
      column: 'Index Value',
      rawValue: '',
      severity: 'INFORMATION',
      rule: 'SOURCE_PENDING_INDEX',
      message: 'Index marked as SOURCE_PENDING',
      resolution: 'Provide market index when published'
    }
  ];

  it('renders issues table headers, filter buttons, and rows', () => {
    render(
      <PCBIValidationIssuesTable
        issues={mockIssues}
        blockingErrorCount={1}
        warningCount={1}
        informationCount={1}
      />
    );

    expect(screen.getByText(UI_STRINGS.pcbiAdmin.validationTitle)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.pcbiAdmin.colDataset)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.pcbiAdmin.colRow)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.pcbiAdmin.colColumn)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.pcbiAdmin.colOriginalValue)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.pcbiAdmin.colRule)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.pcbiAdmin.colResolution)).toBeInTheDocument();

    expect(screen.getByText('PCBI ID is missing')).toBeInTheDocument();
    expect(screen.getByText('Quality rating missing')).toBeInTheDocument();
    expect(screen.getByText('Index marked as SOURCE_PENDING')).toBeInTheDocument();
  });

  it('filters issues across ALL, ERRORS, WARNINGS, and INFORMATION', () => {
    render(
      <PCBIValidationIssuesTable
        issues={mockIssues}
        blockingErrorCount={1}
        warningCount={1}
        informationCount={1}
      />
    );

    // Filter by ERRORS
    const errorBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.pcbiAdmin.filterErrors, 'i') });
    fireEvent.click(errorBtn);
    expect(screen.getByText('PCBI ID is missing')).toBeInTheDocument();
    expect(screen.queryByText('Quality rating missing')).not.toBeInTheDocument();
    expect(screen.queryByText('Index marked as SOURCE_PENDING')).not.toBeInTheDocument();

    // Filter by WARNINGS
    const warnBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.pcbiAdmin.filterWarnings, 'i') });
    fireEvent.click(warnBtn);
    expect(screen.getByText('Quality rating missing')).toBeInTheDocument();
    expect(screen.queryByText('PCBI ID is missing')).not.toBeInTheDocument();

    // Filter by INFORMATION
    const infoBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.pcbiAdmin.filterInfo, 'i') });
    fireEvent.click(infoBtn);
    expect(screen.getByText('Index marked as SOURCE_PENDING')).toBeInTheDocument();
    expect(screen.queryByText('PCBI ID is missing')).not.toBeInTheDocument();

    // Back to ALL
    const allBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.pcbiAdmin.filterAll, 'i') });
    fireEvent.click(allBtn);
    expect(screen.getByText('PCBI ID is missing')).toBeInTheDocument();
    expect(screen.getByText('Quality rating missing')).toBeInTheDocument();
    expect(screen.getByText('Index marked as SOURCE_PENDING')).toBeInTheDocument();
  });

  it('renders zero issues state when list is empty', () => {
    render(
      <PCBIValidationIssuesTable
        issues={[]}
        blockingErrorCount={0}
        warningCount={0}
        informationCount={0}
      />
    );

    expect(screen.getByText(/Zero issues detected for the selected filter!/i)).toBeInTheDocument();
  });
});
