import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExecutiveOpportunityDashboardView } from '../../../src/components/module2/ExecutiveOpportunityDashboardView';
import { Module2OpportunityRegisterApi } from '../../../src/utils/module2OpportunityRegisterApi';
import { UI_STRINGS } from '../../../src/constants';
import type { OpportunityRegisterSummary } from '../../../src/types/module2OpportunityRegister';

const strings = UI_STRINGS.module2ExecutiveDashboard;

const mockSummary: OpportunityRegisterSummary = {
  authoritativeBaselineSpendCr: 556.5346,
  authoritativeBaselineTransactions: 27777,
  directPriceEligibleSpendCr: 455.8894,
  directPriceEligibleTransactions: 20648,
  supplierConsolidationEligibleSpendCr: 258.231,
  volumeConsolidationCandidateSpendCr: 511.0045,
  spendRequiringReviewCr: 100.6453,
  totalOpportunitiesCount: 4,
  byType: {
    DIRECT_PRICE_IMPROVEMENT: { count: 1, spendCr: 455.8894, defensibleValueCr: 53.4422, materialsCount: 1 },
    SUPPLIER_CONSOLIDATION: { count: 1, spendCr: 258.231, defensibleValueCr: 0, materialsCount: 1 },
    VOLUME_DEMAND_CONSOLIDATION: { count: 1, spendCr: 511.0045, defensibleValueCr: 0, materialsCount: 1 },
    SPECIFICATION_PROCESS_REVIEW: { count: 1, spendCr: 0.22, defensibleValueCr: 0, materialsCount: 1 }
  },
  byStatus: {
    IDENTIFIED: 3,
    UNDER_REVIEW: 1,
    VALIDATED: 0,
    NEGOTIATION: 0,
    AWARDED: 0,
    REJECTED: 0
  },
  byConfidence: {
    HIGH: 3,
    MEDIUM: 0,
    LOW: 1
  },
  certifiedSavingsCr: 0.0,
  realizedSavingsCr: 0.0,
  overlapDeductionNotice: strings.warningMessage,
  dataLimitations: [
    'Zero external benchmarks applied: All price dispersion is derived strictly from internal transactional variance.'
  ],
  validationRequirements: [
    'Direct Price: Supplier verification of grade, technical specification sheet, and delivery lot size.'
  ]
};

describe('ExecutiveOpportunityDashboardView', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading state and then populates dashboard metrics', async () => {
    vi.spyOn(Module2OpportunityRegisterApi, 'getExecutiveDashboard').mockResolvedValue({
      summary: mockSummary,
      customerName: 'Borosil Ltd'
    });

    render(<ExecutiveOpportunityDashboardView assessmentId="AIC-2026-0002" />);

    expect(screen.getByText(strings.loadingText)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(strings.title('Borosil Ltd'))).toBeInTheDocument();
    });

    expect(screen.getByText(strings.description)).toBeInTheDocument();
    expect(screen.getByText(strings.warningHeading)).toBeInTheDocument();
    expect(screen.getByText(strings.warningMessage)).toBeInTheDocument();

    // KPI Cards
    expect(screen.getByText('₹556.5346 Cr')).toBeInTheDocument();
    expect(screen.getByText(strings.baselineDesc)).toBeInTheDocument();

    expect(screen.getByText('₹455.8894 Cr')).toBeInTheDocument();
    expect(screen.getByText(strings.directPriceDesc)).toBeInTheDocument();
    expect(screen.getByText(strings.grossModelledPriceOppLabel(53.4422))).toBeInTheDocument();
    expect(screen.getByText(strings.grossModelledPriceOppDisclaimer)).toBeInTheDocument();

    expect(screen.getByText(strings.supplierConsolidationTitle)).toBeInTheDocument();
    expect(screen.getByText('₹258.2310 Cr')).toBeInTheDocument();
    expect(screen.getByText(strings.supplierConsolidationDesc)).toBeInTheDocument();

    expect(screen.getByText(strings.volumeAggregationTitle)).toBeInTheDocument();
    expect(screen.getByText('₹511.0045 Cr')).toBeInTheDocument();
    expect(screen.getByText(strings.volumeAggregationDesc)).toBeInTheDocument();

    expect(screen.getByText(strings.reviewRequiredTitle)).toBeInTheDocument();
    expect(screen.getByText('₹100.6453 Cr')).toBeInTheDocument();
    expect(screen.getByText(strings.reviewRequiredDesc)).toBeInTheDocument();
    expect(screen.getByText(strings.reviewRequiredTxs)).toBeInTheDocument();
    expect(screen.getByText(strings.reviewRequiredIndicator)).toBeInTheDocument();
  });

  it('calls onNavigateToRegister when button is clicked', async () => {
    const handleNavigate = vi.fn();
    vi.spyOn(Module2OpportunityRegisterApi, 'getExecutiveDashboard').mockResolvedValue({
      summary: mockSummary,
      customerName: 'Borosil Ltd'
    });

    render(
      <ExecutiveOpportunityDashboardView
        assessmentId="AIC-2026-0002"
        onNavigateToRegister={handleNavigate}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(strings.viewRegisterButton)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(strings.viewRegisterButton));
    expect(handleNavigate).toHaveBeenCalledTimes(1);
  });

  it('handles error gracefully when API call fails', async () => {
    vi.spyOn(Module2OpportunityRegisterApi, 'getExecutiveDashboard').mockRejectedValue(
      new Error('API failure')
    );

    render(<ExecutiveOpportunityDashboardView assessmentId="AIC-2026-0002" />);

    await waitFor(() => {
      expect(screen.queryByText(strings.loadingText)).not.toBeInTheDocument();
    });
  });
});

