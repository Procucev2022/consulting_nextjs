/**
 * Coverage tests for PaymentTermsOpportunitiesTab: the simulation sandbox, the opportunity table with its search,
 * and the unavailable-data notice.
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { PaymentTermsOpportunitiesTab } from '../../../src/components/module2/PaymentTermsOpportunitiesTab';
import { PAYMENT_TERMS_UI_STRINGS } from '../../../src/constants/module2PaymentTerms';
import type {
  PaymentTermsCoverageSummary,
  PaymentTermsOpportunity
} from '../../../src/types/module2PaymentTerms';

const BASE_OPPORTUNITY: PaymentTermsOpportunity = {
  opportunityId: 'PT-OPP-001',
  supplierCode: 'V-2041',
  supplierName: 'Acme Fibers Ltd',
  spendCategory: 'RAW-FIBER',
  annualSpendInr: 125000000,
  annualSpendCr: 12.5,
  currentPaymentTerms: 'Net 30',
  currentCreditDays: 30,
  targetPaymentTerms: 'Net 60',
  targetCreditDays: 60,
  additionalCreditDays: 30,
  financingRatePer30Days: 0.015,
  indicativeAnnualFinancingBenefitInr: 1875000,
  indicativeAnnualFinancingBenefitCr: 0.1875,
  indicativeWorkingCapitalReleasedInr: 10273972.6,
  indicativeWorkingCapitalReleasedCr: 1.0274,
  availabilityStatus: 'OPPORTUNITY_IDENTIFIED',
  statusLabel: 'Opportunity Identified',
  evidenceSource: 'ERP payment terms extract',
  approvalStatus: 'PENDING_APPROVAL',
  isScenario: false
};

const OPPORTUNITIES: PaymentTermsOpportunity[] = [
  BASE_OPPORTUNITY,
  {
    ...BASE_OPPORTUNITY,
    opportunityId: 'PT-OPP-002',
    supplierCode: 'V-3317',
    supplierName: 'Bharat Packaging Co',
    spendCategory: 'PACK-MAT',
    annualSpendCr: 4.25,
    additionalCreditDays: 15,
    indicativeAnnualFinancingBenefitCr: 0.0319,
    indicativeWorkingCapitalReleasedCr: 0.1747,
    statusLabel: 'Awaiting Validation'
  },
  {
    ...BASE_OPPORTUNITY,
    opportunityId: 'PT-OPP-003',
    supplierCode: 'V-5520',
    supplierName: 'Coastal Logistics Pvt Ltd',
    spendCategory: 'FREIGHT-SVC',
    annualSpendCr: 1.5,
    additionalCreditDays: 45,
    indicativeAnnualFinancingBenefitCr: 0.0101,
    indicativeWorkingCapitalReleasedCr: 0.0616,
    statusLabel: 'Not Yet Quantifiable'
  }
];

const COVERAGE: PaymentTermsCoverageSummary = {
  assessmentId: 'AIC-2026-0002',
  totalSpendAnalysedInr: 1000000000,
  totalSpendAnalysedCr: 100,
  verifiedSpendInr: 400000000,
  verifiedSpendCr: 40,
  missingSpendInr: 600000000,
  missingSpendCr: 60,
  verifiedSpendPct: 40,
  missingSpendPct: 60,
  totalRecordsCount: 240,
  completeRecordsCount: 96,
  partialRecordsCount: 24,
  missingRecordsCount: 120,
  recordsRequiringValidationCount: 30,
  gapReasonCounts: { FIELD_NOT_IN_SOURCE_ERP: 120 },
  overallDataAvailabilityStatus: 'DATA_PARTIALLY_AVAILABLE',
  overallStatusDisplayText: 'Data Partially Available',
  reconciliationDeltaInr: 0,
  procucevModellingRatePctPer30Days: 1.5,
  totalWorkingCapitalReleasedCr: 1.2,
  totalFinancingBenefitCr: 0.15,
  totalEarlyPaymentDiscountsCr: 0
};

function getRow(text: string): HTMLElement {
  return screen.getAllByRole('row').find((row) => row.textContent?.includes(text));
}

describe('PaymentTermsOpportunitiesTab coverage', () => {
  it('lists each verified opportunity with formatted spend, benefit, and working capital values', () => {
    render(<PaymentTermsOpportunitiesTab opportunities={OPPORTUNITIES} coverageSummary={COVERAGE} />);

    expect(screen.getByPlaceholderText(PAYMENT_TERMS_UI_STRINGS.SEARCH_PLACEHOLDER)).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(OPPORTUNITIES.length + 1);
    expect(within(getRow('Acme Fibers Ltd')).getByText('₹12.5000 Cr')).toBeInTheDocument();
    expect(within(getRow('Acme Fibers Ltd')).getByText('₹0.1875 Cr')).toBeInTheDocument();
    expect(within(getRow('Acme Fibers Ltd')).getByText('₹1.0274 Cr')).toBeInTheDocument();
    expect(within(getRow('Bharat Packaging Co')).getByText(/\+15/)).toBeInTheDocument();
    expect(within(getRow('Coastal Logistics Pvt Ltd')).getByText('Not Yet Quantifiable')).toBeInTheDocument();
  });

  it('filters opportunities by supplier name, supplier code, and spend category', () => {
    render(<PaymentTermsOpportunitiesTab opportunities={OPPORTUNITIES} coverageSummary={COVERAGE} />);
    const search = screen.getByPlaceholderText(PAYMENT_TERMS_UI_STRINGS.SEARCH_PLACEHOLDER);

    fireEvent.change(search, { target: { value: 'coastal' } });
    expect(screen.getAllByRole('row')).toHaveLength(2);
    expect(getRow('Coastal Logistics Pvt Ltd')).toBeInTheDocument();

    fireEvent.change(search, { target: { value: 'v-3317' } });
    expect(screen.getAllByRole('row')).toHaveLength(2);
    expect(getRow('Bharat Packaging Co')).toBeInTheDocument();

    fireEvent.change(search, { target: { value: 'raw-fiber' } });
    expect(screen.getAllByRole('row')).toHaveLength(2);
    expect(getRow('Acme Fibers Ltd')).toBeInTheDocument();

    fireEvent.change(search, { target: { value: 'no-match-anywhere' } });
    expect(screen.getAllByRole('row')).toHaveLength(1);
  });

  it('recalculates the financing benefit and working capital when spend or credit days change', () => {
    render(<PaymentTermsOpportunitiesTab opportunities={OPPORTUNITIES} coverageSummary={COVERAGE} />);
    const spendInput = screen.getByRole('spinbutton');
    const daysSelect = screen.getByRole('combobox');

    // Defaults: 120 Cr spend, 30 days -> 1.8 Cr financing benefit and 9.8630 Cr working capital.
    expect(screen.getByText('₹1.8000 Cr')).toBeInTheDocument();
    expect(screen.getByText('₹9.8630 Cr')).toBeInTheDocument();

    fireEvent.change(spendInput, { target: { value: '200' } });
    expect(screen.getByText('₹3.0000 Cr')).toBeInTheDocument();

    fireEvent.change(daysSelect, { target: { value: '90' } });
    expect(screen.getByText('₹9.0000 Cr')).toBeInTheDocument();
    expect(screen.getByText('₹49.3151 Cr')).toBeInTheDocument();
  });

  it('treats an empty spend entry as zero', () => {
    render(<PaymentTermsOpportunitiesTab opportunities={OPPORTUNITIES} coverageSummary={COVERAGE} />);

    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '' } });

    expect(screen.getAllByText('₹0.0000 Cr')).toHaveLength(2);
  });

  it('shows the unavailable notice with coverage status and no search field when there are no opportunities', () => {
    render(<PaymentTermsOpportunitiesTab opportunities={[]} coverageSummary={COVERAGE} />);

    expect(screen.getByText(PAYMENT_TERMS_UI_STRINGS.DATA_UNAVAILABLE_MESSAGE)).toBeInTheDocument();
    expect(screen.getByText(PAYMENT_TERMS_UI_STRINGS.DATA_UNAVAILABLE_SUB)).toBeInTheDocument();
    expect(screen.getByText(/Data Partially Available/)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(PAYMENT_TERMS_UI_STRINGS.SEARCH_PLACEHOLDER)).not.toBeInTheDocument();
  });
});
