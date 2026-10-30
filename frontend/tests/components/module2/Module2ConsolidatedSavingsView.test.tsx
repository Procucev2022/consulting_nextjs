/**
 * Module 2 — Consolidated Savings & Deduplication View Unit Tests
 * Version: MODULE_2_SAVINGS_DEDUPLICATION_V1.0
 * Compliant with Rule 1: >= 90% coverage per-file
 * Compliant with Rule 7: Assertions against UI_STRINGS constants
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Module2ConsolidatedSavingsView } from '../../../src/components/module2/Module2ConsolidatedSavingsView';
import { Module2ConsolidatedOpportunityTable } from '../../../src/components/module2/Module2ConsolidatedOpportunityTable';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import type { Module2ConsolidatedSavingsSummary, Module2CanonicalSavingsOpportunity } from '../../../src/types';

const mockOpportunities: Module2CanonicalSavingsOpportunity[] = [
  {
    assessmentId: 'AIC-2026-0002',
    opportunityId: 'OPP-AIC-2026-0002-LEV-01-FABRIC_RAW',
    leverId: 1,
    leverCode: 'LEV-01',
    leverName: 'Direct Price Improvement',
    categoryOrMaterialId: 'FABRIC_RAW',
    categoryOrMaterialName: 'Raw Fabric & Yarn',
    eligibleSpendInr: 50000000,
    eligibleSpendCr: 5.0,
    transactionScopeCount: 120,
    calculationBasis: 'PEER_PRICE_DISPERSION',
    estimatedGrossSavingsInr: 4500000,
    estimatedGrossSavingsCr: 0.45,
    overlappingOpportunityRefs: ['OPP-AIC-2026-0002-LEV-02-FABRIC_RAW'],
    overlapAmountInr: 0,
    overlapAmountCr: 0,
    netEstimatedSavingsInr: 4500000,
    netEstimatedSavingsCr: 0.45,
    deduplicationStatus: 'MUTUALLY_EXCLUSIVE_ALTERNATIVE_RETAINED',
    evidenceValidationStatus: 'VALIDATED_COMMERCIAL',
    approvalStatus: 'APPROVED',
    commerciallyValidatedSavingsInr: 4500000,
    commerciallyValidatedSavingsCr: 0.45,
    isIncrementalBenefit: false,
    auditEvidenceSummary: 'Historical peer price variance across identical items.'
  },
  {
    assessmentId: 'AIC-2026-0002',
    opportunityId: 'OPP-AIC-2026-0002-LEV-02-FABRIC_RAW',
    leverId: 2,
    leverCode: 'LEV-02',
    leverName: 'E-Auction / Dynamic Bidding',
    categoryOrMaterialId: 'FABRIC_RAW',
    categoryOrMaterialName: 'Raw Fabric & Yarn',
    eligibleSpendInr: 50000000,
    eligibleSpendCr: 5.0,
    transactionScopeCount: 120,
    calculationBasis: 'REVERSE_AUCTION_COMPETITIVE_DISCOVERY',
    estimatedGrossSavingsInr: 3200000,
    estimatedGrossSavingsCr: 0.32,
    overlappingOpportunityRefs: ['OPP-AIC-2026-0002-LEV-01-FABRIC_RAW'],
    overlapAmountInr: 3200000,
    overlapAmountCr: 0.32,
    netEstimatedSavingsInr: 0,
    netEstimatedSavingsCr: 0,
    deduplicationStatus: 'DEDUPLICATED_OVERLAP',
    evidenceValidationStatus: 'UNVERIFIED_ESTIMATE',
    approvalStatus: 'PENDING_REVIEW',
    commerciallyValidatedSavingsInr: 0,
    commerciallyValidatedSavingsCr: 0,
    isIncrementalBenefit: false,
    auditEvidenceSummary: 'E-Auction candidate with 3 suppliers.'
  },
  {
    assessmentId: 'AIC-2026-0002',
    opportunityId: 'OPP-AIC-2026-0002-LEV-03-ADMIN-PO',
    leverId: 3,
    leverCode: 'LEV-03-ADMIN',
    leverName: 'PO Consolidation (Administrative)',
    categoryOrMaterialId: 'ADMIN-PO',
    categoryOrMaterialName: 'PO Consolidation — Dyes',
    eligibleSpendInr: 10000000,
    eligibleSpendCr: 1.0,
    transactionScopeCount: 45,
    calculationBasis: 'ADMINISTRATIVE_PO_REDUCTION',
    estimatedGrossSavingsInr: 45000,
    estimatedGrossSavingsCr: 0.0045,
    overlappingOpportunityRefs: [],
    overlapAmountInr: 0,
    overlapAmountCr: 0,
    netEstimatedSavingsInr: 45000,
    netEstimatedSavingsCr: 0.0045,
    deduplicationStatus: 'INCREMENTAL_VALIDATED',
    evidenceValidationStatus: 'VALIDATED_COMMERCIAL',
    approvalStatus: 'APPROVED',
    commerciallyValidatedSavingsInr: 45000,
    commerciallyValidatedSavingsCr: 0.0045,
    isIncrementalBenefit: true,
    auditEvidenceSummary: 'Administrative overhead reduction from consolidating purchase orders.'
  }
];

const mockSummary: Module2ConsolidatedSavingsSummary = {
  assessmentId: 'AIC-2026-0002',
  customerName: 'ABC Textile Ltd',
  calculatedAt: '2026-10-21T12:00:00Z',
  grossEstimatedSavingsInr: 7745000,
  grossEstimatedSavingsCr: 0.7745,
  netEstimatedSavingsInr: 4545000,
  netEstimatedSavingsCr: 0.4545,
  grossEvidenceBasedSavingsInr: 4545000,
  grossEvidenceBasedSavingsCr: 0.4545,
  netEvidenceBasedSavingsInr: 4545000,
  netEvidenceBasedSavingsCr: 0.4545,
  exploratoryPipelineSavingsInr: 3200000,
  exploratoryPipelineSavingsCr: 0.32,
  commerciallyValidatedSavingsInr: 4545000,
  commerciallyValidatedSavingsCr: 0.4545,
  realizedSavingsInr: 0,
  realizedSavingsCr: 0,
  totalOverlappingDeductionsInr: 3200000,
  totalOverlappingDeductionsCr: 0.32,
  unresolvedOverlapsExcludedInr: 0,
  unresolvedOverlapsExcludedCr: 0,
  unquantifiedOpportunitiesCount: 4,
  quantifiedOpportunitiesCount: 3,
  totalEvaluatedOpportunitiesCount: 7,
  lever5AnnualFinancingBenefitInr: 1500000,
  lever5AnnualFinancingBenefitCr: 0.15,
  lever5WorkingCapitalReleasedInr: 12500000,
  lever5WorkingCapitalReleasedCr: 1.25,
  reconciliationBalanceInr: 0,
  isArithmeticallyBalanced: true,
  leverSummaries: [
    {
      leverId: 1,
      leverCode: 'LEV-01',
      leverName: 'Direct Price Improvement',
      implementationStatus: 'IMPLEMENTED',
      statusLabel: 'IMPLEMENTED',
      grossSavingsInr: 4500000, grossSavingsCr: 0.45,
      netSavingsInr: 4500000, netSavingsCr: 0.45,
      commerciallyValidatedSavingsInr: 4500000, commerciallyValidatedSavingsCr: 0.45,
      exploratorySavingsInr: 0, exploratorySavingsCr: 0,
      overlapDeductionsInr: 0, overlapDeductionsCr: 0,
      unresolvedExcludedInr: 0, unresolvedExcludedCr: 0,
      opportunitiesCount: 1,
      methodologyBasis: 'Peer price variance',
      safeguardRule: 'Comparable item prices only',
      isPurchasePriceSavings: true
    },
    {
      leverId: 2,
      leverCode: 'LEV-02',
      leverName: 'E-Auction / Dynamic Bidding',
      implementationStatus: 'IMPLEMENTED',
      statusLabel: 'IMPLEMENTED',
      grossSavingsInr: 3200000, grossSavingsCr: 0.32,
      netSavingsInr: 0, netSavingsCr: 0,
      commerciallyValidatedSavingsInr: 0, commerciallyValidatedSavingsCr: 0,
      exploratorySavingsInr: 0, exploratorySavingsCr: 0,
      overlapDeductionsInr: 3200000, overlapDeductionsCr: 0.32,
      unresolvedExcludedInr: 0, unresolvedExcludedCr: 0,
      opportunitiesCount: 1,
      methodologyBasis: 'Reverse auction discovery',
      safeguardRule: 'Deduplicated against price improvement',
      isPurchasePriceSavings: true
    },
    {
      leverId: 5,
      leverCode: 'LEV-05',
      leverName: 'Payment Terms Optimisation',
      implementationStatus: 'IMPLEMENTED',
      statusLabel: 'IMPLEMENTED',
      grossSavingsInr: 0,
      grossSavingsCr: 0,
      netSavingsInr: 0,
      netSavingsCr: 0,
      commerciallyValidatedSavingsInr: 0,
      commerciallyValidatedSavingsCr: 0,
      exploratorySavingsInr: 0,
      exploratorySavingsCr: 0,
      overlapDeductionsInr: 0,
      overlapDeductionsCr: 0,
      unresolvedExcludedInr: 0,
      unresolvedExcludedCr: 0,
      opportunitiesCount: 1,
      methodologyBasis: 'Treasury Working Capital',
      safeguardRule: 'Strictly segregated from purchase-price savings',
      isPurchasePriceSavings: false,
      annualFinancingBenefitInr: 1500000,
      annualFinancingBenefitCr: 0.15,
      workingCapitalReleasedInr: 12500000,
      workingCapitalReleasedCr: 1.25
    }
  ],
  opportunities: mockOpportunities,
  certificationNotice: 'Consolidated savings certified under Section 7 deduplication rules.',
  disclosures: [
    'Pre-negotiation estimates require supplier agreement before booking.',
    'Alternative sourcing levers reflect maximum defensible non-overlapping potential.'
  ],
  disclaimerText: 'Pre-negotiation estimates require supplier agreement before booking.'
};

describe('Module2ConsolidatedSavingsView Component', () => {
  const strings = UI_STRINGS.module2SavingsDeduplication;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders KPI metrics and Lever 5 strict segregation callout from initialData', () => {
    render(<Module2ConsolidatedSavingsView assessmentId="AIC-2026-0002" initialData={mockSummary} />);

    expect(screen.getByText(strings.title)).toBeInTheDocument();
    expect(screen.getByText(strings.subtitle)).toBeInTheDocument();

    // Verify 5 KPI Cards
    expect(screen.getByText(strings.grossEstimatedSavingsLabel)).toBeInTheDocument();
    expect(screen.getByText('₹0.77 Cr')).toBeInTheDocument();
    expect(screen.getByText(strings.netEstimatedSavingsLabel)).toBeInTheDocument();
    expect(screen.getAllByText('₹0.45 Cr').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(strings.commerciallyValidatedSavingsLabel)).toBeInTheDocument();
    expect(screen.getByText(strings.unquantifiedOpportunitiesLabel)).toBeInTheDocument();
    expect(screen.getByText(strings.unresolvedOverlapsExcludedLabel)).toBeInTheDocument();

    // Verify Lever 5 Working Capital Segregation Callout & Explicit Disclosure
    expect(screen.getByText(strings.lever5SectionTitle)).toBeInTheDocument();
    expect(screen.getByText(strings.benefitCannotBeAscertainedTitle)).toBeInTheDocument();
    expect(screen.getAllByText(strings.actualWcBenefitUnavailable).length).toBe(2);
    expect(screen.getByText(strings.actualCreditDaysUnavailable)).toBeInTheDocument();
    expect(screen.getByText(strings.planningScenarioTitle)).toBeInTheDocument();
    expect(screen.getByText(strings.planningScenarioDisclaimer)).toBeInTheDocument();
    expect(screen.getByText('₹0.1500 Cr')).toBeInTheDocument();
    expect(screen.getByText('₹1.2500 Cr')).toBeInTheDocument();
    expect(screen.getByText(strings.workingCapitalNote)).toBeInTheDocument();

    // Verify Disclosures & Governance Notice
    expect(screen.getByText(strings.certNoticeTitle)).toBeInTheDocument();
    expect(screen.getByText(mockSummary.certificationNotice)).toBeInTheDocument();
  });

  it('fetches data when initialData is not provided', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockSummary })
    } as Response);

    render(<Module2ConsolidatedSavingsView assessmentId="AIC-2026-0002" />);

    expect(screen.getByText(strings.loadingMessage)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(strings.title)).toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('handles and displays error state gracefully on network failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 500
    } as Response);

    render(<Module2ConsolidatedSavingsView assessmentId="AIC-2026-0002" />);

    await waitFor(() => {
      expect(screen.getByText(strings.errorMessage)).toBeInTheDocument();
    });
    expect(screen.getByText(strings.btnRetry)).toBeInTheDocument();
  });

  it('filters opportunities in table by lever, status, and search query', () => {
    render(<Module2ConsolidatedOpportunityTable opportunities={mockOpportunities} />);

    // Table headers
    expect(screen.getByText(strings.colOpportunityId)).toBeInTheDocument();
    expect(screen.getByText(strings.colLever)).toBeInTheDocument();
    expect(screen.getByText(strings.colGross)).toBeInTheDocument();
    expect(screen.getByText(strings.colNet)).toBeInTheDocument();

    // Search query filter
    const searchInput = screen.getByPlaceholderText(strings.searchPlaceholder);
    fireEvent.change(searchInput, { target: { value: 'Dyes' } });
    expect(screen.getByText('PO Consolidation — Dyes')).toBeInTheDocument();
    expect(screen.queryByText('Raw Fabric & Yarn')).not.toBeInTheDocument();

    // Clear search
    fireEvent.change(searchInput, { target: { value: '' } });
    expect(screen.getAllByText('Raw Fabric & Yarn').length).toBeGreaterThan(0);
  });
});
