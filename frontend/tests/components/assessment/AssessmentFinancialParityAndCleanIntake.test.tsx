import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AssessmentPipelineTab } from '../../../src/components/assessment/AssessmentPipelineTab';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import type { AssessmentRecord, AssessmentAnalysisRun } from '../../../src/types/assessment';

const mockVgtAssessment: AssessmentRecord = {
  assessmentId: 'AIC-2026-0001',
  customerName: '[TEST DATA] Varroc Polymers (VGT Regression Baseline)',
  industry: 'Automotive & Polymers',
  assessmentPeriodStart: 'April 2021',
  assessmentPeriodEnd: 'January 2022',
  ndaStatus: 'SIGNED',
  dataStatus: 'VALIDATED',
  assignedAnalyst: 'analyst@procucev.com',
  status: 'APPROVED',
  isTestData: true,
  activeAnalysisRunId: 'RUN-001',
  validatedSpendCr: 4073.8307,
  addressableSpendCr: 443.621,
  grossOpportunityCr: 441.833,
  overlapDeductionsCr: 104.067,
  netDefensibleOpportunityCr: 337.766,
  provenOpportunityCr: 319.439,
  deliveryRangeMinCr: 31.944,
  deliveryRangeMaxCr: 79.860,
  pcbiAnalyticalSignalCr: 31.6921,
  createdAt: '2026-04-01T09:00:00.000Z',
  updatedAt: '2026-04-01T10:00:00.000Z'
};

const mockVgtRun: AssessmentAnalysisRun = {
  analysisRunId: 'RUN-001',
  assessmentId: 'AIC-2026-0001',
  dataVersionId: 'DV-001',
  status: 'COMPLETED',
  totalSpendCr: 4073.8307,
  validatedSpendCr: 4073.8307,
  addressableSpendCr: 443.621,
  grossOpportunityCr: 441.833,
  overlapDeductionsCr: 104.067,
  netDefensibleOpportunityCr: 337.766,
  provenOpportunityCr: 319.439,
  deliveryRangeMinCr: 31.944,
  deliveryRangeMaxCr: 79.860,
  pcbiAnalyticalSignalCr: 31.6921,
  potentialSavingsCr: 337.766,
  savingsPct: 8.29,
  reviewGates: [],
  allGatesPassed: true,
  isApproved: true,
  isSuperseded: false,
  createdAt: '2026-04-01T10:00:00.000Z'
};

const mockCleanCustomerAssessment: AssessmentRecord = {
  assessmentId: 'AIC-2026-0002',
  customerName: 'UltraTech Cement Limited',
  industry: 'Building Materials',
  assessmentPeriodStart: 'April 2023',
  assessmentPeriodEnd: 'March 2024',
  ndaStatus: 'SIGNED',
  dataStatus: 'AWAITING_DATA',
  assignedAnalyst: 'analyst@procucev.com',
  status: 'DRAFT',
  isTestData: false,
  createdAt: '2026-10-09T10:00:00.000Z',
  updatedAt: '2026-10-09T10:00:00.000Z'
};

describe('AssessmentPipelineTab Financial Parity & Clean Intake UI', () => {
  it('renders all 8 certified VGT opportunity metrics with TEST DATA badge and PCBI segregation notice', () => {
    render(
      <AssessmentPipelineTab
        assessment={mockVgtAssessment}
        activeRun={mockVgtRun}
        isProcessing={false}
        onNdaChange={vi.fn()}
        onDataStatusChange={vi.fn()}
        onRunAnalysis={vi.fn()}
      />
    );

    // 1. Validated Spend
    expect(screen.getByText('₹4073.8307 Cr')).toBeInTheDocument();
    // 2. Addressable Sourcing Spend
    expect(screen.getByText('₹443.621 Cr')).toBeInTheDocument();
    // 3. Gross Multi-Lever Opportunity Pool
    expect(screen.getByText('₹441.833 Cr')).toBeInTheDocument();
    // 4. Overlap Deductions
    expect(screen.getByText('₹104.067 Cr')).toBeInTheDocument();
    // 5. Net Defensible Opportunity
    expect(screen.getByText('₹337.766 Cr')).toBeInTheDocument();
    // 6. Proven Opportunity
    expect(screen.getByText('₹319.439 Cr')).toBeInTheDocument();
    // 7. Delivery Range
    expect(screen.getByText('₹31.944–₹79.860 Cr')).toBeInTheDocument();
    // 8. PCBI Benchmark Price-Gap Signal
    expect(screen.getByText('₹31.6921 Cr')).toBeInTheDocument();

    // Test Data badge
    expect(screen.getByText(UI_STRINGS.ASSESSMENT.financial.testDataBadge)).toBeInTheDocument();

    // PCBI segregation notice
    expect(screen.getByText(UI_STRINGS.ASSESSMENT.financial.pcbiSignalNotice)).toBeInTheDocument();

    // Reconciled variance formula bar
    expect(
      screen.getByText('Gross (₹441.833 Cr) − Overlap (₹104.067 Cr) = Net (₹337.766 Cr)')
    ).toBeInTheDocument();
  });

  it('renders clean pending state with em dashes and NO inherited numbers for fresh assessment', () => {
    render(
      <AssessmentPipelineTab
        assessment={mockCleanCustomerAssessment}
        activeRun={null}
        isProcessing={false}
        onNdaChange={vi.fn()}
        onDataStatusChange={vi.fn()}
        onRunAnalysis={vi.fn()}
      />
    );

    // Pending banner
    expect(screen.getByText(UI_STRINGS.ASSESSMENT.financial.pendingTitle)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.ASSESSMENT.financial.pendingSubtitle)).toBeInTheDocument();

    // Empty state dashes rendered across all 8 metric cards
    const emptyElements = screen.getAllByText(UI_STRINGS.ASSESSMENT.financial.emptyValue);
    expect(emptyElements.length).toBeGreaterThanOrEqual(8);

    // No VGT numbers should be present
    expect(screen.queryByText('₹4073.8307 Cr')).not.toBeInTheDocument();
    expect(screen.queryByText('₹378.40 Cr')).not.toBeInTheDocument();
    expect(screen.queryByText('₹337.766 Cr')).not.toBeInTheDocument();
  });
});
