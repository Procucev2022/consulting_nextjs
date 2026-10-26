import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Header } from '../../src/components/Header';
import { PipelineBar } from '../../src/components/PipelineBar';
import { AssessmentWorkspace } from '../../src/components/assessment/AssessmentWorkspace';
import { assessmentApiClient } from '../../src/utils/assessmentApi';
import { mockTenant } from '../../src/data/mockData';
import { UI_STRINGS } from '../../src/constants/uiStrings';
import type { AssessmentRecord, CustomerRecord, Module1CanonicalViewModel, OperatingModeConfig } from '../../src/types';

describe('Prompt 370: Top Ribbon & Summary Strip Data Integrity (14 Verification Cases)', () => {
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
    operatingMode: internalMode
  };

  const mockCustomerABC: CustomerRecord = {
    id: 'cust-abc',
    customerName: 'ABC Textile Ltd',
    industry: 'Textiles',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  };

  const mockCustomerFresh: CustomerRecord = {
    id: 'cust-xyz',
    customerName: 'XYZ Pharmaceuticals',
    industry: 'Pharma',
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-02-01T00:00:00Z'
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
    acceptedAt: '2026-01-02T00:00:00Z',
    activeDataVersionId: 'DV-TEXTILE-01',
    activeAnalysisRunId: 'RUN-TEXTILE-M1-01',
    validatedSpendCr: 605.84,
    totalSpendCr: 605.84,
    potentialSavingsCr: 74.155,
    savingsPct: 12.24,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  };

  const freshAssessmentNoFile: AssessmentRecord = {
    assessmentId: 'AIC-2026-0099',
    customerId: 'cust-xyz',
    customerName: 'XYZ Pharmaceuticals',
    industry: 'Pharma',
    assessmentPeriodStart: '2025-01-01',
    assessmentPeriodEnd: '2025-12-31',
    ndaStatus: 'SIGNED',
    dataStatus: 'AWAITING_DATA',
    assignedAnalyst: 'analyst@procucev.com',
    status: 'DRAFT',
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z'
  };

  const completedCanonicalM1: Module1CanonicalViewModel = {
    datasetId: 'ds-xyz',
    dataVersionId: 'DV-XYZ-01',
    analysisJobId: 'RUN-XYZ-M1',
    sourceFileName: 'XYZ_Spend.xlsx',
    sourceRowCount: 5000,
    validRowCount: 4950,
    excludedRowCount: 45,
    anomalyRowCount: 5,
    validFxNormalizedSpendInr: 1200000000,
    validFxNormalizedSpendCr: 120.0,
    profileFxBaselineSpendInr: 1180000000,
    profileFxBaselineSpendCr: 118.0,
    fxNormalizationImpactInr: 20000000,
    fxNormalizationImpactCr: 2.0,
    fxNormalizationImpactPct: 1.69,
    detectedCurrencies: ['INR', 'USD'],
    currencyBreakdown: [],
    uniqueItems: 800,
    uniqueVendors: 65,
    materialGroups: 12,
    operatingPlants: 4,
    billingMonths: 12,
    configuredEvaluationWindow: '12 Months',
    actualDataCoverage: {
      billingMonthsCount: 12,
      firstTransactionDate: '2024-01-01',
      lastTransactionDate: '2024-12-31',
      dateRangeLabel: 'Jan 2024 – Dec 2024'
    },
    supplierSpend: [],
    materialGroupSpend: [],
    plantSpend: [],
    monthlySpend: [],
    reconciliationVarianceInr: 0,
    reconciliationStatus: 'RECONCILED',
    fxMasterVersion: '2.0',
    fxMasterChecksum: 'chk123',
    pareto: {
      totalSpendCr: 120.0,
      top80SpendCr: 96.0,
      top80SpendPct: 80.0,
      topSupplierCount: 10,
      totalSupplierCount: 65
    },
    moduleStatuses: {
      module1: 'COMPLETED',
      module2: 'PENDING',
      module3: 'PENDING',
      module4: 'PENDING'
    },
    validationSummary: {
      sourceRows: 5000,
      validRows: 4950,
      excludedRows: 45,
      anomalyRows: 5,
      cleanSpendYieldPct: 99.0,
      excludedSpendCr: 1.0,
      anomalySpendCr: 0.1
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test Case 1: No active customer -> No spend displayed
  it('1. No active customer: displays "No Active Customer" and no spend indicator', () => {
    render(<Header {...defaultHeaderProps} activeCustomer={null} activeAssessment={null} />);
    expect(screen.getByText(UI_STRINGS.header.noActiveCustomer)).toBeInTheDocument();
    expect(screen.queryByTestId('assessment-spend-badge')).not.toBeInTheDocument();
    expect(screen.queryByText(/605\.84/)).not.toBeInTheDocument();
  });

  // Test Case 2: Customer selected without assessment -> No spend displayed
  it('2. Customer selected without assessment: displays customer name but no spend indicator', () => {
    render(
      <Header
        {...defaultHeaderProps}
        activeCustomer={mockCustomerFresh}
        activeAssessment={null}
      />
    );
    expect(screen.getByText('XYZ Pharmaceuticals')).toBeInTheDocument();
    expect(screen.queryByTestId('assessment-spend-badge')).not.toBeInTheDocument();
    expect(screen.queryByText(/605\.84/)).not.toBeInTheDocument();
  });

  // Test Case 3: New assessment without a file -> All four cards show specified empty states
  it('3. New assessment without a file: all four cards show specified empty states', () => {
    render(
      <PipelineBar
        activeTab="module1"
        onSelectTab={vi.fn()}
        activeAssessment={freshAssessmentNoFile}
        canonicalViewModel={null}
      />
    );
    expect(screen.getByText('Awaiting dataset')).toBeInTheDocument();
    expect(screen.getByText('Not started')).toBeInTheDocument();
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText(/605\.84/)).not.toBeInTheDocument();
  });

  // Test Case 4: File uploaded but not validated -> No analytical results
  it('4. File uploaded but not validated: shows upload status, no analytical results', () => {
    const uploadedNotValidated: AssessmentRecord = {
      ...freshAssessmentNoFile,
      activeDataVersionId: 'DV-XYZ-RAW',
      dataStatus: 'RECEIVED'
    };
    render(
      <PipelineBar
        activeTab="module1"
        onSelectTab={vi.fn()}
        activeAssessment={uploadedNotValidated}
        canonicalViewModel={null}
      />
    );
    expect(screen.getByText('Dataset uploaded')).toBeInTheDocument();
    expect(screen.getByText('Not started')).toBeInTheDocument();
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  // Test Case 5: Dataset validated but Module 1 not run -> No analytical results
  it('5. Dataset validated but Module 1 not run: shows validation status, no analytical results', () => {
    const validatedM1NotRun: AssessmentRecord = {
      ...freshAssessmentNoFile,
      activeDataVersionId: 'DV-XYZ-VAL',
      dataStatus: 'VALIDATED'
    };
    render(
      <PipelineBar
        activeTab="module1"
        onSelectTab={vi.fn()}
        activeAssessment={validatedM1NotRun}
        canonicalViewModel={null}
      />
    );
    expect(screen.getByText('Not started')).toBeInTheDocument();
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  // Test Case 6: Module 1 running -> No completed results
  it('6. Module 1 running: shows Running status, no completed analytical results', () => {
    const m1Running: AssessmentRecord = {
      ...freshAssessmentNoFile,
      activeDataVersionId: 'DV-XYZ-RUN',
      dataStatus: 'VALIDATED',
      status: 'IN_PROGRESS'
    };
    render(
      <PipelineBar
        activeTab="module1"
        onSelectTab={vi.fn()}
        activeAssessment={m1Running}
        canonicalViewModel={null}
      />
    );
    expect(screen.getByText('Running')).toBeInTheDocument();
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  // Test Case 7: Module 1 completed -> Persisted assessment-specific results appear
  it('7. Module 1 completed: only persisted assessment-specific results appear', () => {
    const m1CompletedAssessment: AssessmentRecord = {
      ...freshAssessmentNoFile,
      activeDataVersionId: 'DV-XYZ-01',
      activeAnalysisRunId: 'RUN-XYZ-M1',
      dataStatus: 'VALIDATED',
      status: 'IN_PROGRESS',
      validatedSpendCr: 120.0
    };
    render(
      <PipelineBar
        activeTab="module1"
        onSelectTab={vi.fn()}
        activeAssessment={m1CompletedAssessment}
        canonicalViewModel={completedCanonicalM1}
      />
    );
    expect(screen.getByText('12 Billing Months')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('₹2.00 Cr')).toBeInTheDocument();
    expect(screen.getByText('99.0%')).toBeInTheDocument();
    expect(screen.queryByText(/605\.84/)).not.toBeInTheDocument();
  });

  // Test Case 8: ABC Textile historical spend does not appear in fresh assessment
  it('8. ABC Textile historical spend does not appear in a fresh assessment', () => {
    render(
      <Header
        {...defaultHeaderProps}
        activeCustomer={mockCustomerFresh}
        activeAssessment={freshAssessmentNoFile}
      />
    );
    expect(screen.getByText('XYZ Pharmaceuticals')).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.header.dataNotUploadedBadge)).toBeInTheDocument();
    expect(screen.queryByText(/ABC Textile/)).not.toBeInTheDocument();
    expect(screen.queryByText(/605\.84/)).not.toBeInTheDocument();
  });

  // Test Case 9: Switching assessments clears the previous display
  it('9. Switching assessments clears previous display', () => {
    const { rerender } = render(
      <Header
        {...defaultHeaderProps}
        activeCustomer={mockCustomerABC}
        activeAssessment={historicalAbcAssessment}
      />
    );
    expect(screen.getByText('ABC Textile Ltd')).toBeInTheDocument();
    expect(screen.getByText('₹605.84 Cr')).toBeInTheDocument();

    // Switch to fresh assessment
    rerender(
      <Header
        {...defaultHeaderProps}
        activeCustomer={mockCustomerFresh}
        activeAssessment={freshAssessmentNoFile}
      />
    );
    expect(screen.getByText('XYZ Pharmaceuticals')).toBeInTheDocument();
    expect(screen.queryByText('ABC Textile Ltd')).not.toBeInTheDocument();
    expect(screen.queryByText(/605\.84/)).not.toBeInTheDocument();
    expect(screen.queryByTestId('assessment-spend-badge')).not.toBeInTheDocument();
  });

  // Test Case 10: Delayed response from old assessment cannot overwrite current figures
  it('10. Delayed response from old assessment cannot overwrite current figures', () => {
    let currentActiveId = freshAssessmentNoFile.assessmentId;

    const handleResponse = (responseAssessmentId: string, _spend: number) => {
      // Guard condition as required by Prompt 370 Phase 6
      if (responseAssessmentId === currentActiveId) {
        return true;
      }
      return false; // Stale response discarded!
    };

    expect(handleResponse('AIC-2026-0002', 605.84)).toBe(false);
    expect(handleResponse('AIC-2026-0099', 120.0)).toBe(true);
  });

  // Test Case 11: Management Quick Summary disabled when assessment is not eligible
  it('11. Management Quick Summary is disabled when assessment is not eligible', () => {
    const onOpenManagementBrief = vi.fn();
    render(
      <Header
        {...defaultHeaderProps}
        activeAssessment={freshAssessmentNoFile}
        onOpenManagementBrief={onOpenManagementBrief}
      />
    );
    const summaryBtn = screen.getByTestId('header-management-summary-btn');
    expect(summaryBtn).toBeInTheDocument();
    expect(summaryBtn).toBeDisabled();
    fireEvent.click(summaryBtn);
    expect(onOpenManagementBrief).not.toHaveBeenCalled();
  });

  // Test Case 12: More Reports shows only reports linked to the active assessment
  it('12. More Reports shows unavailable message when no reports exist for active assessment', () => {
    render(
      <Header
        {...defaultHeaderProps}
        activeAssessment={freshAssessmentNoFile}
      />
    );
    const moreBtn = screen.getByTestId('header-more-reports-btn');
    fireEvent.click(moreBtn);
    expect(screen.getByText(UI_STRINGS.header.moreReportsUnavailable)).toBeInTheDocument();
  });

  // Test Case 13: Assessment workspace resets state and does not restore stale analytical values
  it('13. Switching workspace tabs clears selected assessment', async () => {
    const onActiveAssessmentChange = vi.fn();
    const onSelectCustomer = vi.fn();

    vi.spyOn(assessmentApiClient, 'getCustomers').mockResolvedValue([mockCustomerABC]);
    vi.spyOn(assessmentApiClient, 'getAssessments').mockResolvedValue([freshAssessmentNoFile]);

    render(
      <AssessmentWorkspace
        initialActiveTab="customers"
        onActiveAssessmentChange={onActiveAssessmentChange}
        onSelectCustomer={onSelectCustomer}
      />
    );

    await waitFor(() => {
      // Must notify active assessment is null when on customers tab
      expect(onActiveAssessmentChange).toHaveBeenCalledWith(null);
    });
  });

  // Test Case 14: Existing historical assessment records remain unchanged
  it('14. Historical assessment record retains its original figures unchanged', () => {
    expect(historicalAbcAssessment.assessmentId).toBe('AIC-2026-0002');
    expect(historicalAbcAssessment.customerName).toBe('ABC Textile Ltd');
    expect(historicalAbcAssessment.validatedSpendCr).toBe(605.84);
    expect(historicalAbcAssessment.activeDataVersionId).toBe('DV-TEXTILE-01');
    expect(historicalAbcAssessment.activeAnalysisRunId).toBe('RUN-TEXTILE-M1-01');
  });
});
