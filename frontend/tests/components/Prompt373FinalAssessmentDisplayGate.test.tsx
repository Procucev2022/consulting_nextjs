import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AssessmentWorkspace } from '../../src/components/assessment/AssessmentWorkspace';
import { Header } from '../../src/components/Header';
import {
  isAssessmentFinancialDisplayEligible,
  sanitizeAssessmentForFinancialDisplay
} from '../../src/utils/assessmentFinancialDisplayGate';
import { assessmentApiClient } from '../../src/utils/assessmentApi';
import type { AssessmentRecord, CustomerRecord, TenantMaster, OperatingModeConfig } from '../../src/types';

vi.mock('../../src/utils/assessmentApi', () => ({
  assessmentApiClient: {
    getAssessments: vi.fn(),
    getCustomers: vi.fn(),
    getAssessmentById: vi.fn(),
    getOperatingMode: vi.fn(),
    getSystemInfo: vi.fn(),
    getDesktopUpdateStatus: vi.fn().mockResolvedValue({ isUpdateAvailable: false })
  }
}));

describe('Prompt 373: Final Assessment Financial Display Gate', () => {
  const mockCustomer: CustomerRecord = {
    id: 'CUST-2026-0002',
    customerId: 'CUST-2026-0002',
    customerName: 'ABC Textile Ltd',
    industry: 'Textile',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  };

  const draftAssessment: AssessmentRecord = {
    assessmentId: 'AIC-2026-0002',
    customerName: 'ABC Textile Ltd',
    industry: 'Textile',
    assessmentPeriodStart: 'Jan 2023',
    assessmentPeriodEnd: 'Dec 2023',
    ndaStatus: 'SIGNED',
    dataStatus: 'VALIDATED',
    assignedAnalyst: 'analyst@procucev.com',
    status: 'DRAFT',
    totalSpendCr: 605.84,
    validatedSpendCr: 605.84,
    netDefensibleOpportunityCr: 74.16,
    potentialSavingsCr: 74.16,
    savingsPct: 12.24,
    activeDataVersionId: 'DV-001',
    activeAnalysisRunId: 'RUN-001',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  };

  const module1ReadyAssessment: AssessmentRecord = {
    ...draftAssessment,
    status: 'MODULE_1_READY'
  };

  const approvedAssessment: AssessmentRecord = {
    ...draftAssessment,
    status: 'APPROVED',
    approvedBy: 'admin@procucev.com',
    approvedAt: '2026-04-01T10:00:00.000Z'
  };

  const deliveredAssessment: AssessmentRecord = {
    ...draftAssessment,
    status: 'DELIVERED',
    deliveredBy: 'admin@procucev.com',
    deliveredAt: '2026-04-01T11:00:00.000Z'
  };

  const acceptedAssessment: AssessmentRecord = {
    ...draftAssessment,
    assessmentId: 'AIC-2026-0001',
    customerName: 'Certified Enterprises Ltd',
    status: 'ACCEPTED',
    acceptedBy: 'customer@procucev.com',
    acceptedAt: '2026-04-02T12:00:00.000Z',
    isReportAccepted: true
  };

  const mockTenant: TenantMaster = {
    tenant_id: 'default',
    enterprise_name: 'aiCEV Consulting',
    region: 'GLOBAL',
    base_currency: 'INR',
    status: 'ACTIVE',
    total_spend_evaluated: 0,
    total_spend_evaluated_inr: 0
  };

  const mockOperatingMode: OperatingModeConfig = {
    mode: 'INTERNAL_ASSESSMENT',
    isInternalAssessment: true,
    isPublicSaaS: false,
    workspaceTitle: 'Assessment Workspace',
    phaseName: 'INTERNAL_ASSESSMENT',
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

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(assessmentApiClient.getCustomers).mockResolvedValue([mockCustomer]);
  });

  it('1. Draft assessment with populated financial fields displays no financial results (shows "—")', async () => {
    expect(isAssessmentFinancialDisplayEligible(draftAssessment)).toBe(false);
    vi.mocked(assessmentApiClient.getAssessments).mockResolvedValue([draftAssessment]);

    render(
      <AssessmentWorkspace
        onSelectAssessment={vi.fn()}
        onActiveAssessmentChange={vi.fn()}
        initialActiveTab="assessments"
      />
    );

    const row = await screen.findByText('AIC-2026-0002');
    expect(row).toBeInTheDocument();
    expect(screen.getByText('ABC Textile Ltd')).toBeInTheDocument();

    // Financial values must NOT be rendered
    expect(screen.queryByText('₹605.84 Cr')).not.toBeInTheDocument();
    expect(screen.queryByText('₹74.16 Cr')).not.toBeInTheDocument();
    expect(screen.queryByText('12.24%')).not.toBeInTheDocument();
  });

  it('2. Module 1 completion alone displays no financial results (shows "—")', async () => {
    expect(isAssessmentFinancialDisplayEligible(module1ReadyAssessment)).toBe(false);
    vi.mocked(assessmentApiClient.getAssessments).mockResolvedValue([module1ReadyAssessment]);

    render(
      <AssessmentWorkspace
        onSelectAssessment={vi.fn()}
        onActiveAssessmentChange={vi.fn()}
        initialActiveTab="assessments"
      />
    );

    await screen.findByText('AIC-2026-0002');
    expect(screen.queryByText('₹605.84 Cr')).not.toBeInTheDocument();
    expect(screen.queryByText('₹74.16 Cr')).not.toBeInTheDocument();
  });

  it('3. Module 4 completion without formal report acceptance (APPROVED) displays no financial results', async () => {
    expect(isAssessmentFinancialDisplayEligible(approvedAssessment)).toBe(false);
    vi.mocked(assessmentApiClient.getAssessments).mockResolvedValue([approvedAssessment]);

    render(
      <AssessmentWorkspace
        onSelectAssessment={vi.fn()}
        onActiveAssessmentChange={vi.fn()}
        initialActiveTab="assessments"
      />
    );

    await screen.findByText('AIC-2026-0002');
    expect(screen.queryByText('₹605.84 Cr')).not.toBeInTheDocument();
    expect(screen.queryByText('₹74.16 Cr')).not.toBeInTheDocument();
  });

  it('4. Report delivery without acceptance (DELIVERED) displays no financial results', async () => {
    expect(isAssessmentFinancialDisplayEligible(deliveredAssessment)).toBe(false);
    vi.mocked(assessmentApiClient.getAssessments).mockResolvedValue([deliveredAssessment]);

    render(
      <AssessmentWorkspace
        onSelectAssessment={vi.fn()}
        onActiveAssessmentChange={vi.fn()}
        initialActiveTab="assessments"
      />
    );

    await screen.findByText('AIC-2026-0002');
    expect(screen.queryByText('₹605.84 Cr')).not.toBeInTheDocument();
    expect(screen.queryByText('₹74.16 Cr')).not.toBeInTheDocument();
  });

  it('5. A fully completed and formally ACCEPTED assessment displays its own persisted consolidated results', async () => {
    expect(isAssessmentFinancialDisplayEligible(acceptedAssessment)).toBe(true);
    vi.mocked(assessmentApiClient.getAssessments).mockResolvedValue([acceptedAssessment]);

    render(
      <AssessmentWorkspace
        onSelectAssessment={vi.fn()}
        onActiveAssessmentChange={vi.fn()}
        initialActiveTab="assessments"
      />
    );

    await screen.findByText('AIC-2026-0001');
    expect(screen.getByText('Certified Enterprises Ltd')).toBeInTheDocument();

    // Financial values must be displayed for ACCEPTED
    const spendMatches = screen.getAllByText('₹605.84 Cr');
    expect(spendMatches.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('₹74.16 Cr')).toBeInTheDocument();
    expect(screen.getByText('12.24%')).toBeInTheDocument();
  });

  it('6. An accepted assessment cannot expose its results in another unaccepted assessment row', async () => {
    // Two assessments in table: one ACCEPTED, one ANALYST_REVIEW
    const unacceptedAssessment: AssessmentRecord = {
      ...draftAssessment,
      assessmentId: 'AIC-2026-0002',
      customerName: 'ABC Textile Ltd',
      status: 'AWAITING_REVIEW'
    };

    vi.mocked(assessmentApiClient.getAssessments).mockResolvedValue([
      acceptedAssessment,
      unacceptedAssessment
    ]);

    render(
      <AssessmentWorkspace
        onSelectAssessment={vi.fn()}
        onActiveAssessmentChange={vi.fn()}
        initialActiveTab="assessments"
      />
    );

    await screen.findByText('AIC-2026-0001');
    await screen.findByText('AIC-2026-0002');

    // Only one row should display ₹74.16 Cr, not both rows
    const opportunityElements = screen.getAllByText('₹74.16 Cr');
    expect(opportunityElements.length).toBe(1);

    const savingsPctElements = screen.getAllByText('12.24%');
    expect(savingsPctElements.length).toBe(1);
  });

  it('7. The customer ribbon follows the same display rule (suppresses spend when unaccepted)', () => {
    // Header rendered with active unaccepted assessment
    render(
      <Header
        tenant={mockTenant}
        onSelectTenant={vi.fn()}
        currency="INR"
        onSelectCurrency={vi.fn()}
        onOpenReport={vi.fn()}
        theme="light"
        onSelectTheme={vi.fn()}
        activeCustomer={mockCustomer}
        activeAssessment={draftAssessment}
        operatingMode={mockOperatingMode}
      />
    );

    expect(screen.getByText('ABC Textile Ltd')).toBeInTheDocument();
    // Spend badge must NOT be rendered in ribbon
    expect(screen.queryByTestId('assessment-spend-badge')).not.toBeInTheDocument();
  });

  it('8. The customer ribbon displays spend when assessment is formally ACCEPTED', () => {
    render(
      <Header
        tenant={mockTenant}
        onSelectTenant={vi.fn()}
        currency="INR"
        onSelectCurrency={vi.fn()}
        onOpenReport={vi.fn()}
        theme="light"
        onSelectTheme={vi.fn()}
        activeCustomer={{ ...mockCustomer, customerName: 'Certified Enterprises Ltd' }}
        activeAssessment={acceptedAssessment}
        operatingMode={mockOperatingMode}
      />
    );

    expect(screen.getByText('Certified Enterprises Ltd')).toBeInTheDocument();
    // Spend badge MUST be rendered in ribbon
    const badge = screen.getByTestId('assessment-spend-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('₹605.84 Cr');
  });

  it('9. Historical records remain intact in the sanitized data representation', () => {
    const sanitized = sanitizeAssessmentForFinancialDisplay(draftAssessment);
    expect(sanitized.assessmentId).toBe('AIC-2026-0002');
    expect(sanitized.customerName).toBe('ABC Textile Ltd');
    expect(sanitized.industry).toBe('Textile');
    expect(sanitized.assessmentPeriodStart).toBe('Jan 2023');
    expect(sanitized.status).toBe('DRAFT');

    // Suppressed financial fields
    expect(sanitized.validatedSpendCr).toBeUndefined();
    expect(sanitized.potentialSavingsCr).toBeUndefined();
  });

  it('10. returns false for null, undefined, or missing IDs in eligibility predicate', () => {
    expect(isAssessmentFinancialDisplayEligible(null)).toBe(false);
    expect(isAssessmentFinancialDisplayEligible(undefined)).toBe(false);
    expect(isAssessmentFinancialDisplayEligible({})).toBe(false);

    expect(
      isAssessmentFinancialDisplayEligible({
        ...acceptedAssessment,
        activeDataVersionId: undefined
      })
    ).toBe(false);

    expect(
      isAssessmentFinancialDisplayEligible({
        ...acceptedAssessment,
        activeAnalysisRunId: undefined
      })
    ).toBe(false);
  });

  it('11. returns false when consolidated savings figures are missing or zero', () => {
    expect(
      isAssessmentFinancialDisplayEligible({
        ...acceptedAssessment,
        netDefensibleOpportunityCr: 0,
        potentialSavingsCr: 0
      })
    ).toBe(false);
  });

  it('12. verifies analysis run matching when runs array is provided', () => {
    const runs = [
      {
        analysisRunId: 'RUN-001',
        dataVersionId: 'DV-001',
        status: 'COMPLETED'
      }
    ];
    expect(isAssessmentFinancialDisplayEligible(acceptedAssessment, runs)).toBe(true);

    const failedRuns = [
      {
        analysisRunId: 'RUN-001',
        dataVersionId: 'DV-001',
        status: 'FAILED'
      }
    ];
    expect(isAssessmentFinancialDisplayEligible(acceptedAssessment, failedRuns)).toBe(false);

    const mismatchedRuns = [
      {
        analysisRunId: 'RUN-999',
        dataVersionId: 'DV-001',
        status: 'COMPLETED'
      }
    ];
    expect(isAssessmentFinancialDisplayEligible(acceptedAssessment, mismatchedRuns)).toBe(false);
  });

  it('13. sanitizeAssessmentForFinancialDisplay preserves fields when eligible', () => {
    const sanitized = sanitizeAssessmentForFinancialDisplay(acceptedAssessment);
    expect(sanitized.totalSpendCr).toBe(605.84);
    expect(sanitized.validatedSpendCr).toBe(605.84);
    expect(sanitized.netDefensibleOpportunityCr).toBe(74.16);
    expect(sanitized.savingsPct).toBe(12.24);
  });
});
