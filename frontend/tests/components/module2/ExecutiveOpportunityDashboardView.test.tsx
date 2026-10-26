import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExecutiveOpportunityDashboardView } from '../../../src/components/module2/ExecutiveOpportunityDashboardView';
import { Module2OpportunityRegisterApi } from '../../../src/utils/module2OpportunityRegisterApi';
import type { OpportunityRegisterSummary } from '../../../src/types/module2OpportunityRegister';

const mockSummary: OpportunityRegisterSummary = {
  authoritativeBaselineSpendCr: 556.5346,
  authoritativeBaselineTransactions: 27777,
  directPriceEligibleSpendCr: 29.3322,
  directPriceEligibleTransactions: 25,
  supplierConsolidationEligibleSpendCr: 41.8,
  volumeConsolidationCandidateSpendCr: 58.117,
  spendRequiringReviewCr: 101.5189,
  totalOpportunitiesCount: 4,
  byType: {
    DIRECT_PRICE_IMPROVEMENT: { count: 1, spendCr: 29.3322, defensibleValueCr: 17.7647, materialsCount: 1 },
    SUPPLIER_CONSOLIDATION: { count: 1, spendCr: 41.8, defensibleValueCr: 0, materialsCount: 1 },
    VOLUME_DEMAND_CONSOLIDATION: { count: 1, spendCr: 58.117, defensibleValueCr: 0, materialsCount: 1 },
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
  overlapDeductionNotice: 'Opportunity values are mutually qualifying candidates and MUST NOT be added together across levers.',
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

    expect(screen.getByText('Loading Executive Sourcing Intelligence...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Borosil Ltd — Strategic Sourcing Decision Dashboard/)).toBeInTheDocument();
    });

    expect(screen.getByText('₹556.5346 Cr')).toBeInTheDocument();
    expect(screen.getByText('27,777 Included Transactions')).toBeInTheDocument();
    expect(screen.getByText('₹29.3322 Cr')).toBeInTheDocument();
    expect(screen.getByText('₹41.8000 Cr')).toBeInTheDocument();
    expect(screen.getByText('₹58.1170 Cr')).toBeInTheDocument();
    expect(screen.getByText('₹101.5189 Cr')).toBeInTheDocument();
    expect(screen.getByText(/Defensible Opp: ₹17.76 Cr/)).toBeInTheDocument();
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
      expect(screen.getByText('View Material Register')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('View Material Register'));
    expect(handleNavigate).toHaveBeenCalledTimes(1);
  });

  it('handles error gracefully when API call fails', async () => {
    vi.spyOn(Module2OpportunityRegisterApi, 'getExecutiveDashboard').mockRejectedValue(
      new Error('API failure')
    );

    render(<ExecutiveOpportunityDashboardView assessmentId="AIC-2026-0002" />);

    await waitFor(() => {
      expect(screen.queryByText('Loading Executive Sourcing Intelligence...')).not.toBeInTheDocument();
    });
  });
});
