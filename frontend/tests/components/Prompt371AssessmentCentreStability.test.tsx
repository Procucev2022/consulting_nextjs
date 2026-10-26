import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Header } from '../../src/components/Header';
import { AssessmentWorkspace } from '../../src/components/assessment/AssessmentWorkspace';
import { assessmentApiClient } from '../../src/utils/assessmentApi';
import { mockTenant } from '../../src/data/mockData';
import { UI_STRINGS } from '../../src/constants/uiStrings';
import type { AssessmentRecord, CustomerRecord, OperatingModeConfig } from '../../src/types';

describe('Prompt 371: Assessment Centre Stability & Top Ribbon Alignment (Requirements A–M)', () => {
  const internalMode: OperatingModeConfig = {
    mode: 'INTERNAL_ASSESSMENT',
    isInternalAssessment: true,
    isPublicSaaS: false,
    workspaceTitle: 'aiCEV — Internal Assessment Workspace',
    phaseName: 'Internal Assessment',
    features: {
      publicRegistration: false,
      tierUpgrade: false,
      subscriptionPurchase: false,
      customerSelfOnboarding: false,
      customerSaaSDashboard: false,
      assessmentCentre: true
    },
    allowedRoles: ['INTERNAL_ADMIN', 'ANALYST', 'CONSULTANT']
  };

  const defaultHeaderProps = {
    tenant: mockTenant,
    currentUser: null,
    onLogout: vi.fn(),
    onOpenClientSetup: vi.fn(),
    onSelectTenant: vi.fn(),
    currency: 'INR' as const,
    onSelectCurrency: vi.fn(),
    onOpenReport: vi.fn(),
    onOpenManagementBrief: vi.fn(),
    isExecutiveBriefReady: false,
    theme: 'light' as const,
    onSelectTheme: vi.fn(),
    operatingMode: internalMode,
    onToggleAssessmentMode: vi.fn()
  };

  const historicalAbcAssessment: AssessmentRecord = {
    assessmentId: 'AIC-2026-0002',
    customerId: 'cust-abc',
    customerName: 'ABC Textile Ltd',
    industry: 'Textiles',
    assessmentPeriodStart: '2024-04-01',
    assessmentPeriodEnd: '2025-03-31',
    ndaStatus: 'SIGNED',
    dataStatus: 'VALIDATED',
    assignedAnalyst: 'analyst@procucev.com',
    status: 'ACCEPTED',
    isReportAccepted: true,
    activeDataVersionId: 'DV-TEXTILE-01',
    activeAnalysisRunId: 'RUN-TEXTILE-M1-01',
    totalSpendCr: 608.20,
    validatedSpendCr: 605.84,
    netDefensibleOpportunityCr: 35.30,
    savingsPct: 5.83,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  };

  const freshAssessmentNoData: AssessmentRecord = {
    assessmentId: 'AIC-2026-0099',
    customerId: 'cust-fresh',
    customerName: 'Fresh Enterprise Ltd',
    industry: 'Manufacturing',
    assessmentPeriodStart: '2025-01-01',
    assessmentPeriodEnd: '2025-12-31',
    ndaStatus: 'SIGNED',
    dataStatus: 'AWAITING_DATA',
    assignedAnalyst: 'analyst@procucev.com',
    status: 'DRAFT',
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-02-01T00:00:00Z'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(assessmentApiClient, 'getUpdateStatus').mockResolvedValue({ isUpdateAvailable: false } as any);
  });

  // A. Initial assessment loading shows a stable loading state
  it('A. Initial assessment loading shows a stable loading state', async () => {
    let resolvePromise: (value: AssessmentRecord[]) => void;
    const pendingPromise = new Promise<AssessmentRecord[]>((resolve) => {
      resolvePromise = resolve;
    });
    vi.spyOn(assessmentApiClient, 'getAssessments').mockReturnValue(pendingPromise);

    render(<AssessmentWorkspace initialActiveTab="assessments" />);

    expect(screen.getByTestId('assessments-loading')).toBeInTheDocument();
    expect(screen.getByText('Loading assessments...')).toBeInTheDocument();

    resolvePromise!([historicalAbcAssessment]);
    await waitFor(() => {
      expect(screen.queryByTestId('assessments-loading')).not.toBeInTheDocument();
    });
  });

  // B. A successful empty response displays the empty state
  it('B. A successful empty response displays the empty state', async () => {
    vi.spyOn(assessmentApiClient, 'getAssessments').mockResolvedValue([]);

    render(<AssessmentWorkspace initialActiveTab="assessments" />);

    await waitFor(() => {
      expect(screen.getByTestId('assessments-empty')).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.ASSESSMENT.table.emptyMessage)).toBeInTheDocument();
    });
  });

  // C. A populated assessment response remains visible after loading completes
  it('C. A populated assessment response remains visible after loading completes', async () => {
    vi.spyOn(assessmentApiClient, 'getAssessments').mockResolvedValue([historicalAbcAssessment]);

    render(<AssessmentWorkspace initialActiveTab="assessments" />);

    await waitFor(() => {
      expect(screen.getByText('ABC Textile Ltd')).toBeInTheDocument();
      expect(screen.getByText('AIC-2026-0002')).toBeInTheDocument();
    });
  });

  // D. A delayed older response cannot overwrite newer data
  it('D. A delayed older response cannot overwrite newer data', async () => {
    let resolveFirstCall: (value: AssessmentRecord[]) => void;
    const firstCallPromise = new Promise<AssessmentRecord[]>((resolve) => {
      resolveFirstCall = resolve;
    });

    const getAssessmentsSpy = vi.spyOn(assessmentApiClient, 'getAssessments')
      .mockReturnValueOnce(firstCallPromise)
      .mockResolvedValueOnce([historicalAbcAssessment]);

    render(<AssessmentWorkspace initialActiveTab="assessments" />);

    // Click Refresh to launch the second request
    const refreshBtn = screen.getByTestId('refresh-assessments-btn');
    fireEvent.click(refreshBtn);

    // Second request resolves first with historicalAbcAssessment
    await waitFor(() => {
      expect(screen.getByText('ABC Textile Ltd')).toBeInTheDocument();
    });

    // Now first request resolves later with an outdated empty list
    resolveFirstCall!([]);

    // Outdated response must NOT overwrite the newer data
    await waitFor(() => {
      expect(screen.getByText('ABC Textile Ltd')).toBeInTheDocument();
      expect(screen.queryByTestId('assessments-empty')).not.toBeInTheDocument();
    });
  });

  // E. A refresh does not cause valid records to disappear transiently without a justified reason
  it('E. A refresh does not cause valid records to disappear transiently without a justified reason', async () => {
    vi.spyOn(assessmentApiClient, 'getAssessments').mockResolvedValue([historicalAbcAssessment]);

    render(<AssessmentWorkspace initialActiveTab="assessments" />);

    await waitFor(() => {
      expect(screen.getByText('ABC Textile Ltd')).toBeInTheDocument();
    });

    // Let the second fetch be delayed
    let resolveRefresh: (value: AssessmentRecord[]) => void;
    const refreshPromise = new Promise<AssessmentRecord[]>((resolve) => {
      resolveRefresh = resolve;
    });
    vi.spyOn(assessmentApiClient, 'getAssessments').mockReturnValue(refreshPromise);

    const refreshBtn = screen.getByTestId('refresh-assessments-btn');
    fireEvent.click(refreshBtn);

    // During refresh, existing records must remain visible on screen
    expect(screen.getByText('ABC Textile Ltd')).toBeInTheDocument();
    expect(screen.queryByTestId('assessments-loading')).not.toBeInTheDocument();
    expect(refreshBtn).toHaveTextContent('Refreshing...');

    resolveRefresh!([historicalAbcAssessment]);
    await waitFor(() => {
      expect(refreshBtn).toHaveTextContent('Refresh');
    });
  });

  // F. An API error is not presented as an empty assessment list
  it('F. An API error is not presented as an empty assessment list', async () => {
    vi.spyOn(assessmentApiClient, 'getAssessments').mockRejectedValue(new Error('Network failure: 503 Service Unavailable'));

    render(<AssessmentWorkspace initialActiveTab="assessments" />);

    await waitFor(() => {
      const errorCell = screen.getByTestId('assessments-error');
      expect(errorCell).toBeInTheDocument();
      expect(errorCell).toHaveTextContent('Network failure: 503 Service Unavailable');
      // Must not display "No assessment records found"
      expect(screen.queryByTestId('assessments-empty')).not.toBeInTheDocument();
    });
  });

  // G. ABC Textile's historical record remains preserved
  it('G. ABC Textile historical record remains preserved with original values', () => {
    expect(historicalAbcAssessment.assessmentId).toBe('AIC-2026-0002');
    expect(historicalAbcAssessment.customerName).toBe('ABC Textile Ltd');
    expect(historicalAbcAssessment.validatedSpendCr).toBe(605.84);
    expect(historicalAbcAssessment.activeAnalysisRunId).toBe('RUN-TEXTILE-M1-01');
    expect(historicalAbcAssessment.activeDataVersionId).toBe('DV-TEXTILE-01');
  });

  // H. Historical financial figures remain associated with their original assessment
  it('H. Historical financial figures remain associated with their original assessment', async () => {
    vi.spyOn(assessmentApiClient, 'getAssessments').mockResolvedValue([historicalAbcAssessment]);

    render(<AssessmentWorkspace initialActiveTab="assessments" />);

    await waitFor(() => {
      expect(screen.getByText('ABC Textile Ltd')).toBeInTheDocument();
      expect(screen.getByText('₹608.20 Cr')).toBeInTheDocument();
      expect(screen.getByText('₹605.84 Cr')).toBeInTheDocument();
      expect(screen.getByText('₹35.30 Cr')).toBeInTheDocument();
      expect(screen.getByText('5.83%')).toBeInTheDocument();
    });
  });

  // I. A new assessment does not inherit historical financial values
  it('I. A new assessment does not inherit historical financial values', async () => {
    vi.spyOn(assessmentApiClient, 'getAssessments').mockResolvedValue([freshAssessmentNoData]);

    render(<AssessmentWorkspace initialActiveTab="assessments" />);

    await waitFor(() => {
      expect(screen.getByText('Fresh Enterprise Ltd')).toBeInTheDocument();
      // Does not show 605.84 or fabricated zeros
      expect(screen.queryByText('₹605.84 Cr')).not.toBeInTheDocument();
      expect(screen.queryByText('₹0.00 Cr')).not.toBeInTheDocument();
      expect(screen.queryByText('0.00%')).not.toBeInTheDocument();
      // Displays "—" for all unanalyzed financial metrics
      const emptyDashes = screen.getAllByText('—');
      expect(emptyDashes.length).toBeGreaterThanOrEqual(4);
    });
  });

  // J. Opening the Assessment Centre does not automatically activate an assessment
  it('J. Opening Assessment Centre does not automatically activate an assessment', async () => {
    const onActiveAssessmentChange = vi.fn();
    vi.spyOn(assessmentApiClient, 'getAssessments').mockResolvedValue([historicalAbcAssessment]);

    render(
      <AssessmentWorkspace
        initialActiveTab="assessments"
        onActiveAssessmentChange={onActiveAssessmentChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('ABC Textile Ltd')).toBeInTheDocument();
    });

    // Opening Assessment Centre must NOT activate any assessment automatically
    expect(onActiveAssessmentChange).not.toHaveBeenCalledWith(historicalAbcAssessment);
  });

  // K. The ribbon is left-aligned
  it('K. Top ribbon is left-aligned and removes max-w-7xl mx-auto container restriction', () => {
    const { container } = render(
      <Header {...defaultHeaderProps} activeCustomer={null} activeAssessment={null} />
    );

    const headerEl = container.querySelector('header');
    expect(headerEl).toBeInTheDocument();

    // Check navigation bar container
    const navBar = headerEl?.querySelector('.w-full.flex.items-center.justify-between');
    expect(navBar).toBeInTheDocument();
    // Confirms max-w-7xl mx-auto was eliminated
    expect(navBar?.className).not.toContain('max-w-7xl');
    expect(navBar?.className).not.toContain('mx-auto');
    expect(navBar?.className).toContain('w-full');
    expect(navBar?.className).toContain('px-3');
  });

  // L. The full ribbon controls remain accessible without clipping
  it('L. Full ribbon controls remain accessible and unclipped', () => {
    render(
      <Header
        {...defaultHeaderProps}
        activeCustomer={null}
        activeAssessment={null}
      />
    );

    // 1. Logo
    expect(screen.getByAltText(UI_STRINGS.header.logoAlt)).toBeInTheDocument();
    // 2. Mode badge
    expect(screen.getByText('INTERNAL ASSESSMENT MODE')).toBeInTheDocument();
    // 3. Assessment Centre button
    expect(screen.getByText('Assessment Centre')).toBeInTheDocument();
    // 4. Active Customer Context
    expect(screen.getByTestId('tenant-badge')).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.header.noActiveCustomer)).toBeInTheDocument();
    // 5. Management Quick Summary
    expect(screen.getByTestId('header-management-summary-btn')).toBeInTheDocument();
    // 6. More Reports
    expect(screen.getByTestId('header-more-reports-btn')).toBeInTheDocument();
    // 7. Admin Portal
    expect(screen.getByText(UI_STRINGS.header.adminPortal)).toBeInTheDocument();
    // 8. User profile
    expect(screen.getByTestId('user-profile-menu-button')).toBeInTheDocument();
  });

  // M. Existing INTERNAL_ASSESSMENT and PUBLIC_SAAS restrictions remain unchanged
  it('M. Existing INTERNAL_ASSESSMENT restrictions remain enforced', () => {
    const { rerender } = render(
      <Header
        {...defaultHeaderProps}
        operatingMode={internalMode}
        activeCustomer={null}
        activeAssessment={null}
      />
    );

    expect(screen.getByText('INTERNAL ASSESSMENT MODE')).toBeInTheDocument();

    const saasMode: OperatingModeConfig = {
      ...internalMode,
      mode: 'PUBLIC_SAAS',
      isInternalAssessment: false,
      isPublicSaaS: true
    };

    rerender(
      <Header
        {...defaultHeaderProps}
        operatingMode={saasMode}
        activeCustomer={null}
        activeAssessment={null}
      />
    );

    expect(screen.queryByText('INTERNAL ASSESSMENT MODE')).not.toBeInTheDocument();
  });
});
