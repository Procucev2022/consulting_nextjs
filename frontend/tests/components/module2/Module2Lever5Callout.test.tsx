/**
 * Module 2 — Lever 5 Callout Unit Tests
 * Version: MODULE_2_SAVINGS_DEDUPLICATION_V1.0
 * Compliant with Rule 1: >= 90% coverage per-file
 * Compliant with Rule 7: Assertions against UI_STRINGS constants
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Module2Lever5Callout } from '../../../src/components/module2/Module2Lever5Callout';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import type { Module2ConsolidatedSavingsSummary } from '../../../src/types';

const mockSummaryData: Module2ConsolidatedSavingsSummary = {
  assessmentId: 'AIC-2026-0001',
  customerName: 'Enterprise Client',
  calculatedAt: '2026-10-21T12:00:00Z',
  grossEstimatedSavingsInr: 72785760000,
  grossEstimatedSavingsCr: 727.8576,
  netEstimatedSavingsInr: 39674100000,
  netEstimatedSavingsCr: 396.741,
  grossEvidenceBasedSavingsInr: 18837060000,
  grossEvidenceBasedSavingsCr: 188.3706,
  netEvidenceBasedSavingsInr: 18837060000,
  netEvidenceBasedSavingsCr: 188.3706,
  exploratoryPipelineSavingsInr: 53948690000,
  exploratoryPipelineSavingsCr: 539.4869,
  commerciallyValidatedSavingsInr: 0,
  commerciallyValidatedSavingsCr: 0,
  realizedSavingsInr: 0,
  realizedSavingsCr: 0,
  totalOverlappingDeductionsInr: 9549390000,
  totalOverlappingDeductionsCr: 95.4939,
  unresolvedOverlapsExcludedInr: 23562260000,
  unresolvedOverlapsExcludedCr: 235.6226,
  unquantifiedOpportunitiesCount: 5,
  quantifiedOpportunitiesCount: 42,
  totalEvaluatedOpportunitiesCount: 47,
  lever5AnnualFinancingBenefitInr: 6110750000,
  lever5AnnualFinancingBenefitCr: 61.1075,
  lever5WorkingCapitalReleasedInr: 33483540000,
  lever5WorkingCapitalReleasedCr: 334.8354,
  reconciliationBalanceInr: 0,
  isArithmeticallyBalanced: true,
  leverSummaries: [],
  opportunities: [],
  certificationNotice: '',
  disclosures: [],
  disclaimerText: ''
};

describe('Module2Lever5Callout Component', () => {
  const strings = UI_STRINGS.module2SavingsDeduplication;

  it('renders prominent business disclosure when payment terms data is unavailable', () => {
    render(<Module2Lever5Callout data={mockSummaryData} />);

    expect(screen.getByTestId('lever5-callout-container')).toBeInTheDocument();
    expect(screen.getByTestId('payment-terms-unavailable-banner')).toBeInTheDocument();
    expect(screen.getByText(strings.benefitCannotBeAscertainedTitle)).toBeInTheDocument();
    expect(screen.getByText(strings.benefitCannotBeAscertainedMessage)).toBeInTheDocument();
  });

  it('renders non-ascertainable actual metrics and segregation safeguard tag', () => {
    render(<Module2Lever5Callout data={mockSummaryData} />);

    expect(screen.getByText(strings.lever5SectionTitle)).toBeInTheDocument();
    expect(screen.getByText(strings.workingCapitalNote)).toBeInTheDocument();
    expect(screen.getByText('NEVER ADDED TO PROCUREMENT SAVINGS')).toBeInTheDocument();

    expect(screen.getByText('Actual Working Capital Benefit')).toBeInTheDocument();
    expect(screen.getByText('Actual Annual Financing Benefit')).toBeInTheDocument();
    expect(screen.getAllByText(strings.actualWcBenefitUnavailable).length).toBe(2);

    expect(screen.getByText('Additional Credit Days')).toBeInTheDocument();
    expect(screen.getByText(strings.actualCreditDaysUnavailable)).toBeInTheDocument();
  });

  it('renders illustrative planning scenario with mandatory disclaimer and indicative values', () => {
    render(<Module2Lever5Callout data={mockSummaryData} />);

    expect(screen.getByText(strings.planningScenarioTitle)).toBeInTheDocument();
    expect(screen.getByText('₹334.8354 Cr')).toBeInTheDocument();
    expect(screen.getByText('₹61.1075 Cr')).toBeInTheDocument();
    expect(screen.getByText(strings.planningScenarioDisclaimer)).toBeInTheDocument();
  });
});
