/**
 * Module 2 — Lever 5: Payment Terms KPI Header & Explicit Disclosure Unit Tests
 * Version: MODULE_2_PAYMENT_TERMS_V1.0
 * Compliant with Rule 1: >= 90% coverage per-file
 * Compliant with Rule 7: Assertions against UI constants
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PaymentTermsKpiHeader } from '../../../src/components/module2/PaymentTermsKpiHeader';
import { PAYMENT_TERMS_UI_STRINGS } from '../../../src/constants/module2PaymentTerms';
import type { PaymentTermsCoverageSummary } from '../../../src/types/module2PaymentTerms';

const mockUnavailableCoverage: PaymentTermsCoverageSummary = {
  assessmentId: 'AIC-2026-0001',
  totalSpendAnalysedInr: 40738306838.02,
  totalSpendAnalysedCr: 4073.8307,
  verifiedSpendInr: 0,
  verifiedSpendCr: 0,
  missingSpendInr: 40738306838.02,
  missingSpendCr: 4073.8307,
  verifiedSpendPct: 0.0,
  missingSpendPct: 100.0,
  totalRecordsCount: 20241,
  completeRecordsCount: 0,
  partialRecordsCount: 0,
  missingRecordsCount: 20241,
  recordsRequiringValidationCount: 20241,
  gapReasonCounts: { FIELD_NOT_IN_SOURCE_ERP: 20241 },
  overallDataAvailabilityStatus: 'DATA_UNAVAILABLE',
  overallStatusDisplayText: 'Data Unavailable — Payment Terms Not Found in Source Data',
  reconciliationDeltaInr: 0,
  procucevModellingRatePctPer30Days: 1.5,
  totalWorkingCapitalReleasedCr: 0.0,
  totalFinancingBenefitCr: 0.0,
  totalEarlyPaymentDiscountsCr: 0.0
};

const mockAvailableCoverage: PaymentTermsCoverageSummary = {
  ...mockUnavailableCoverage,
  verifiedSpendCr: 200.0,
  overallDataAvailabilityStatus: 'OPPORTUNITY_IDENTIFIED',
  totalWorkingCapitalReleasedCr: 16.4384,
  totalFinancingBenefitCr: 3.0
};

describe('PaymentTermsKpiHeader Component', () => {
  it('renders explicit business disclosure banner when payment terms data is unavailable', () => {
    render(<PaymentTermsKpiHeader coverageSummary={mockUnavailableCoverage} />);

    expect(
      screen.getByText(PAYMENT_TERMS_UI_STRINGS.BENEFIT_CANNOT_BE_ASCERTAINED_TITLE)
    ).toBeInTheDocument();
    expect(
      screen.getByText(PAYMENT_TERMS_UI_STRINGS.BENEFIT_CANNOT_BE_ASCERTAINED_MESSAGE)
    ).toBeInTheDocument();

    // Actual Working Capital Benefit & Financing Benefit
    expect(screen.getByText('Actual Working Capital Benefit')).toBeInTheDocument();
    expect(screen.getByText('Actual Annual Financing Benefit')).toBeInTheDocument();
    expect(
      screen.getAllByText(PAYMENT_TERMS_UI_STRINGS.ACTUAL_WC_BENEFIT_UNAVAILABLE).length
    ).toBe(2);

    // Subtitle notes
    expect(screen.getByText('Commercially validated: ₹0')).toBeInTheDocument();
    expect(screen.getByText('Additional credit days: DATA UNAVAILABLE')).toBeInTheDocument();

    // Illustrative Planning Scenario Callout & Disclaimer
    expect(
      screen.getByText(PAYMENT_TERMS_UI_STRINGS.PLANNING_SCENARIO_TITLE)
    ).toBeInTheDocument();
    expect(
      screen.getByText(PAYMENT_TERMS_UI_STRINGS.PLANNING_SCENARIO_DISCLAIMER)
    ).toBeInTheDocument();
  });

  it('renders normal KPI cards when payment terms data is available', () => {
    render(<PaymentTermsKpiHeader coverageSummary={mockAvailableCoverage} />);

    expect(
      screen.queryByText(PAYMENT_TERMS_UI_STRINGS.BENEFIT_CANNOT_BE_ASCERTAINED_TITLE)
    ).not.toBeInTheDocument();
    expect(screen.getByText(PAYMENT_TERMS_UI_STRINGS.KPI_WORKING_CAPITAL_RELEASED)).toBeInTheDocument();
    expect(screen.getByText(PAYMENT_TERMS_UI_STRINGS.KPI_FINANCING_BENEFIT)).toBeInTheDocument();
    expect(screen.getByText('₹16.4384 Cr')).toBeInTheDocument();
    expect(screen.getByText('₹3.0000 Cr')).toBeInTheDocument();
  });
});
