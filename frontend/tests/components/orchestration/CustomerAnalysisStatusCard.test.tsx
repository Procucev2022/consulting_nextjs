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

  it('renders nothing (null) when no analysis job exists (Brand New Customer)', async () => {
    vi.spyOn(orchestrationApi, 'getJobs').mockResolvedValue([]);

    const { container } = render(<CustomerAnalysisStatusCard />);

    await waitFor(() => {
      expect(screen.queryByTestId('customer-analysis-status-card')).not.toBeInTheDocument();
    });

    expect(container.firstChild).toBeNull();
  });

  it('renders nothing (null) when hasValidDataVersion is explicitly false', async () => {
    vi.spyOn(orchestrationApi, 'getJobs').mockResolvedValue([
      {
        analysisJobId: 'job-orphan-1',
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

    const { container } = render(<CustomerAnalysisStatusCard hasValidDataVersion={false} />);

    await waitFor(() => {
      expect(screen.queryByTestId('customer-analysis-status-card')).not.toBeInTheDocument();
    });

    expect(container.firstChild).toBeNull();
  });

  it('renders default in-progress state and typical turnaround message when real job exists', async () => {
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

  it('renders compact persistent status bar when compact=true', async () => {
    const activeJob = {
      analysisJobId: 'job-compact-1',
      tenantId: 'TNT-1',
      customerName: 'Acme Corp',
      uploadedBy: 'user@acme.com',
      originalUploadId: 'upl-1',
      currentDataVersionId: 'v1',
      module1VersionId: 'm1-v1',
      status: 'MODULE_1_READY' as const,
      createdAt: '2026-10-04T10:00:00.000Z',
      lastUpdatedAt: '2026-10-04T10:00:00.000Z',
      totalSpendCr: 450.0,
      totalTransactions: 1200,
      analysisPeriod: 'FY 2024-25',
      slaHoursTarget: 48
    };

    const handleViewSpend = vi.fn();

    render(
      <CustomerAnalysisStatusCard
        activeJob={activeJob}
        compact={true}
        onViewSpendSummary={handleViewSpend}
      />
    );

    expect(screen.getByTestId('customer-analysis-status-card')).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.orchestration.compactBadgeDetailedAnalysisInProgress)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.orchestration.statusModule1Ready)).toBeInTheDocument();

    const viewSpendBtn = screen.getByText(UI_STRINGS.orchestration.btnViewSpendSummary);
    fireEvent.click(viewSpendBtn);
    expect(handleViewSpend).toHaveBeenCalledTimes(1);
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

  it('renders compact mode with report available, view report click, and refresh button click', async () => {
    const handleViewReport = vi.fn();
    const loadSpy = vi.spyOn(orchestrationApi, 'getJobs').mockResolvedValue([]);

    const activeJob = {
      analysisJobId: 'job-compact-report',
      tenantId: 'TNT-1',
      customerName: 'Acme Corp',
      uploadedBy: 'user@acme.com',
      originalUploadId: 'upl-cr',
      currentDataVersionId: 'v1',
      module1VersionId: 'm1-v1',
      status: 'SUBMITTED_TO_CUSTOMER' as const,
      createdAt: '2026-10-04T10:00:00.000Z',
      lastUpdatedAt: '2026-10-04T10:00:00.000Z',
      totalSpendCr: 450.0,
      totalTransactions: 1200,
      analysisPeriod: 'FY 2024-25',
      slaHoursTarget: 48
    };

    render(
      <CustomerAnalysisStatusCard
        activeJob={activeJob}
        compact={true}
        onViewReport={handleViewReport}
      />
    );

    const viewReportBtn = screen.getByText(UI_STRINGS.orchestration.btnViewApprovedReport);
    fireEvent.click(viewReportBtn);
    expect(handleViewReport).toHaveBeenCalledTimes(1);

    const refreshBtn = screen.getByRole('button', { name: /refresh status/i });
    fireEvent.click(refreshBtn);
    expect(loadSpy).toHaveBeenCalled();
  });

  it('renders different status badges correctly for REPORT_GENERATED and CUSTOMER_ACKNOWLEDGED', async () => {
    vi.spyOn(orchestrationApi, 'getJobs').mockResolvedValue([
      {
        analysisJobId: 'job-rep-1',
        tenantId: 'TNT-1',
        customerName: 'Acme Corp',
        uploadedBy: 'user@acme.com',
        originalUploadId: 'upl-rep',
        currentDataVersionId: 'v1',
        module1VersionId: 'm1-v1',
        status: 'REPORT_GENERATED',
        createdAt: '2026-10-04T10:00:00.000Z',
        lastUpdatedAt: '2026-10-04T10:00:00.000Z',
        totalSpendCr: 450.0,
        totalTransactions: 1200,
        analysisPeriod: 'FY 2024-25',
        slaHoursTarget: 48
      }
    ]);

    const { rerender } = render(<CustomerAnalysisStatusCard />);

    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.orchestration.statusReportUnderReview)).toBeInTheDocument();
    });

    vi.spyOn(orchestrationApi, 'getJobs').mockResolvedValue([
      {
        analysisJobId: 'job-ack-1',
        tenantId: 'TNT-1',
        customerName: 'Acme Corp',
        uploadedBy: 'user@acme.com',
        originalUploadId: 'upl-ack',
        currentDataVersionId: 'v1',
        module1VersionId: 'm1-v1',
        status: 'CUSTOMER_ACKNOWLEDGED',
        createdAt: '2026-10-04T10:00:00.000Z',
        lastUpdatedAt: '2026-10-04T10:00:00.000Z',
        totalSpendCr: 450.0,
        totalTransactions: 1200,
        analysisPeriod: 'FY 2024-25',
        slaHoursTarget: 48
      }
    ]);

    rerender(<CustomerAnalysisStatusCard key="acknowledged" />);

    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.orchestration.statusReportAcknowledged)).toBeInTheDocument();
    });
  });

  it('handles loadJob error gracefully and renders nothing', async () => {
    vi.spyOn(orchestrationApi, 'getJobs').mockRejectedValue(new Error('Network failure'));

    const { container } = render(<CustomerAnalysisStatusCard />);

    await waitFor(() => {
      expect(screen.queryByTestId('customer-analysis-status-card')).not.toBeInTheDocument();
    });
    expect(container.firstChild).toBeNull();
  });

  it('renders properly when createdAt or lastUpdatedAt are missing', async () => {
    const activeJob = {
      analysisJobId: 'job-no-dates',
      tenantId: 'TNT-1',
      customerName: 'Acme Corp',
      uploadedBy: 'user@acme.com',
      originalUploadId: 'upl-nd',
      currentDataVersionId: 'v1',
      module1VersionId: 'm1-v1',
      status: 'MODULE_1_READY' as const,
      totalSpendCr: 450.0,
      totalTransactions: 1200,
      analysisPeriod: 'FY 2024-25',
      slaHoursTarget: 48
    };

    render(<CustomerAnalysisStatusCard activeJob={activeJob as any} />);

    expect(screen.getByTestId('customer-analysis-status-card')).toBeInTheDocument();
  });
});



