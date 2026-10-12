import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AssessmentChecklistTab } from '../../../src/components/assessment/AssessmentChecklistTab';
import type { AssessmentRecord } from '../../../src/types';

describe('AssessmentChecklistTab', () => {
  it('renders all 4 modules and 26 gates in pending state before analysis run', () => {
    const mockAssessment: AssessmentRecord = {
      assessmentId: 'AIC-2026-0001',
      customerName: 'Varroc Polymers (VGT)',
      industry: 'Automotive',
      assessmentPeriodStart: '2023-06-01',
      assessmentPeriodEnd: '2024-03-31',
      assignedAnalyst: 'analyst@procucev.com',
      ndaStatus: 'SIGNED',
      dataStatus: 'VALIDATED',
      status: 'IN_PROGRESS',
      createdAt: '2026-10-09T10:00:00.000Z',
      updatedAt: '2026-10-09T10:00:00.000Z'
    };

    render(<AssessmentChecklistTab assessment={mockAssessment} />);

    expect(screen.getByText('Analyst Review Checklist — 26 Mandatory Gates')).toBeInTheDocument();
    expect(screen.getByText('0 / 26 PENDING')).toBeInTheDocument();
    expect(screen.getByText('Module 1')).toBeInTheDocument();
    expect(screen.getByText('Module 2')).toBeInTheDocument();
    expect(screen.getByText('Module 3')).toBeInTheDocument();
    expect(screen.getByText('Module 4')).toBeInTheDocument();
    expect(screen.getByText('Input row reconciliation')).toBeInTheDocument();
    expect(screen.getByText('Evidence completeness')).toBeInTheDocument();
  });

  it('renders passed verified values and certified badge when approved', () => {
    const mockAssessment: AssessmentRecord = {
      assessmentId: 'AIC-2026-0001',
      customerName: 'Varroc Polymers (VGT)',
      industry: 'Automotive',
      assessmentPeriodStart: '2023-06-01',
      assessmentPeriodEnd: '2024-03-31',
      assignedAnalyst: 'analyst@procucev.com',
      ndaStatus: 'SIGNED',
      dataStatus: 'VALIDATED',
      status: 'APPROVED',
      activeAnalysisRunId: 'RUN-001',
      createdAt: '2026-10-09T10:00:00.000Z',
      updatedAt: '2026-10-09T10:00:00.000Z'
    };

    render(<AssessmentChecklistTab assessment={mockAssessment} />);

    expect(screen.getByText('26 / 26 PASS')).toBeInTheDocument();
    expect(screen.getByText('CERTIFIED & APPROVED')).toBeInTheDocument();
    expect(screen.getByText('20,241 rows')).toBeInTheDocument();
    expect(screen.getByText('20,241 / 20,241 (100%)')).toBeInTheDocument();
  });
});
