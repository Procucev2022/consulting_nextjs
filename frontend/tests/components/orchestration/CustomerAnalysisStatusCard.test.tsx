import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { CustomerAnalysisStatusCard } from '../../../src/components/orchestration/CustomerAnalysisStatusCard';
import { orchestrationApi } from '../../../src/utils/orchestrationApi';
import { UI_STRINGS } from '../../../src/constants';

describe('CustomerAnalysisStatusCard Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders default in-progress state and typical turnaround message', async () => {
    vi.spyOn(orchestrationApi, 'getJobs').mockResolvedValue([
      {
        analysisJobId: 'job-1',
        tenantId: 'TNT-1',
        customerName: 'Acme Corp',
        uploadedBy: 'user@acme.com',
        originalUploadId: 'upl-1',
        currentDataVersionId: 'v1',
        module1VersionId: 'm1-v1',
        status: 'PCBI_REVIEW_REQUIRED',
        createdAt: '2026-10-04T10:00:00.000Z',
        lastUpdatedAt: '2026-10-04T10:00:00.000Z',
        totalSpendCr: 450.0,
        totalTransactions: 1200,
        analysisPeriod: 'FY 2024-25',
        slaHoursTarget: 48
      }
    ]);

    render(<CustomerAnalysisStatusCard />);

    await waitFor(() => {
      expect(screen.getByTestId('customer-analysis-status-card')).toBeInTheDocument();
    });

    expect(screen.getByText(UI_STRINGS.orchestration.customerStatusCardTitle)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.orchestration.detailedAnalysisInProgressTitle)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.orchestration.typicalAnalysisTime)).toBeInTheDocument();
  });

  it('renders report ready badge and triggers onViewReport callback', async () => {
    vi.spyOn(orchestrationApi, 'getJobs').mockResolvedValue([
      {
        analysisJobId: 'job-2',
        tenantId: 'TNT-1',
        customerName: 'Acme Corp',
        uploadedBy: 'user@acme.com',
        originalUploadId: 'upl-2',
        currentDataVersionId: 'v1',
        module1VersionId: 'm1-v1',
        status: 'SUBMITTED_TO_CUSTOMER',
        createdAt: '2026-10-04T10:00:00.000Z',
        lastUpdatedAt: '2026-10-04T10:00:00.000Z',
        totalSpendCr: 450.0,
        totalTransactions: 1200,
        analysisPeriod: 'FY 2024-25',
        slaHoursTarget: 48
      }
    ]);

    const handleViewReport = vi.fn();
    const handleViewSpend = vi.fn();

    render(
      <CustomerAnalysisStatusCard
        onViewReport={handleViewReport}
        onViewSpendSummary={handleViewSpend}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.orchestration.statusReportReady)).toBeInTheDocument();
    });

    const viewReportBtn = screen.getByText(UI_STRINGS.orchestration.btnViewApprovedReport);
    fireEvent.click(viewReportBtn);
    expect(handleViewReport).toHaveBeenCalledTimes(1);

    const viewSpendBtn = screen.getByText(UI_STRINGS.orchestration.btnViewSpendSummary);
    fireEvent.click(viewSpendBtn);
    expect(handleViewSpend).toHaveBeenCalledTimes(1);
  });

  it('handles blocked status with safe error message', async () => {
    vi.spyOn(orchestrationApi, 'getJobs').mockResolvedValue([
      {
        analysisJobId: 'job-3',
        tenantId: 'TNT-1',
        customerName: 'Acme Corp',
        uploadedBy: 'user@acme.com',
        originalUploadId: 'upl-3',
        currentDataVersionId: 'v1',
        module1VersionId: 'm1-v1',
        status: 'ANALYSIS_BLOCKED',
        createdAt: '2026-10-04T10:00:00.000Z',
        lastUpdatedAt: '2026-10-04T10:00:00.000Z',
        totalSpendCr: 450.0,
        totalTransactions: 1200,
        analysisPeriod: 'FY 2024-25',
        slaHoursTarget: 48
      }
    ]);

    render(<CustomerAnalysisStatusCard />);

    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.orchestration.statusAnalysisBlocked)).toBeInTheDocument();
    });
  });
});
