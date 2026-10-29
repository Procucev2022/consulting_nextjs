/**
 * Coverage tests for PaymentTermsView: request and payload failure paths, retry, the optional back control,
 * and switching between the three real tab panels.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { PaymentTermsView } from '../../../src/components/module2/PaymentTermsView';
import { PAYMENT_TERMS_UI_STRINGS } from '../../../src/constants/module2PaymentTerms';
import type {
  PaymentTermsCoverageSummary,
  PaymentTermsResult
} from '../../../src/types/module2PaymentTerms';

const ASSESSMENT_ID = 'AIC-2026-0002';
const API_URL = `/api/module2/sourcing/payment-terms?assessmentId=${ASSESSMENT_ID}`;

const COVERAGE: PaymentTermsCoverageSummary = {
  assessmentId: ASSESSMENT_ID,
  totalSpendAnalysedInr: 1000000000,
  totalSpendAnalysedCr: 100,
  verifiedSpendInr: 400000000,
  verifiedSpendCr: 40,
  missingSpendInr: 600000000,
  missingSpendCr: 60,
  verifiedSpendPct: 40,
  missingSpendPct: 60,
  totalRecordsCount: 3,
  completeRecordsCount: 1,
  partialRecordsCount: 1,
  missingRecordsCount: 1,
  recordsRequiringValidationCount: 1,
  gapReasonCounts: { FIELD_NOT_IN_SOURCE_ERP: 1 },
  overallDataAvailabilityStatus: 'DATA_PARTIALLY_AVAILABLE',
  overallStatusDisplayText: 'Data Partially Available',
  reconciliationDeltaInr: 0,
  procucevModellingRatePctPer30Days: 1.5,
  totalWorkingCapitalReleasedCr: 1.2,
  totalFinancingBenefitCr: 0.15,
  totalEarlyPaymentDiscountsCr: 0
};

const RESULT: PaymentTermsResult = {
  assessmentId: ASSESSMENT_ID,
  coverageSummary: COVERAGE,
  opportunities: [
    {
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
    }
  ],
  supplierProfiles: [
    {
      supplierCode: 'V-2041',
      supplierName: 'Acme Fibers Ltd',
      spendCategory: 'RAW-FIBER',
      totalSpendInr: 500000000,
      totalSpendCr: 50,
      transactionCount: 120,
      observedPaymentTerms: ['Net 30'],
      primaryPaymentTerms: 'Net 30',
      weightedAvgCreditDays: 30,
      dataAvailability: 'OPPORTUNITY_IDENTIFIED',
      indicativeWorkingCapitalReleasedCr: 2,
      indicativeFinancingBenefitCr: 0.15,
      earlyPaymentDiscountOpportunityCr: 0,
      requiresValidation: false
    }
  ],
  coverageRecords: [
    {
      recordId: 'TX-1',
      vendorCode: 'V-2041',
      vendorName: 'Acme Fibers Ltd',
      poNumber: 'PO-1001',
      poDate: '2024-01-15',
      spendInr: 500000,
      rawPaymentTerms: 'Net 30',
      parsedCreditDays: 30,
      hasDiscountTerms: false,
      coverageStatus: 'COMPLETE',
      requiresValidation: false
    }
  ],
  methodologyDisclosures: ['Zero Invention of Missing Data']
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function getTitleContainer(): HTMLElement {
  return screen.getByRole('heading', { name: PAYMENT_TERMS_UI_STRINGS.TITLE }).parentElement;
}

describe('PaymentTermsView coverage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads the analysis and switches between the opportunities and supplier panels', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => jsonResponse({ success: true, data: RESULT }));

    render(<PaymentTermsView assessmentId={ASSESSMENT_ID} />);
    expect(await screen.findByRole('heading', { name: PAYMENT_TERMS_UI_STRINGS.TITLE })).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('payment-terms-tab-opportunities'));
    expect(screen.getByPlaceholderText(PAYMENT_TERMS_UI_STRINGS.SEARCH_PLACEHOLDER)).toBeInTheDocument();
    expect(screen.getByText('Acme Fibers Ltd')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('payment-terms-tab-suppliers'));
    expect(screen.queryByPlaceholderText(PAYMENT_TERMS_UI_STRINGS.SEARCH_PLACEHOLDER)).not.toBeInTheDocument();
    expect(screen.getByText('Acme Fibers Ltd')).toBeInTheDocument();
  });

  it('requests the analysis for the given assessment id', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => jsonResponse({ success: true, data: RESULT }));

    render(<PaymentTermsView assessmentId={ASSESSMENT_ID} />);
    await screen.findByRole('heading', { name: PAYMENT_TERMS_UI_STRINGS.TITLE });

    expect(fetchSpy).toHaveBeenCalledWith(API_URL);
  });

  it('shows the back control only when a back handler is provided, and calls it', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => jsonResponse({ success: true, data: RESULT }));
    const onBackToOverview = vi.fn();
    const { unmount } = render(<PaymentTermsView assessmentId={ASSESSMENT_ID} onBackToOverview={onBackToOverview} />);
    await screen.findByRole('heading', { name: PAYMENT_TERMS_UI_STRINGS.TITLE });

    fireEvent.click(within(getTitleContainer()).getByRole('button'));
    expect(onBackToOverview).toHaveBeenCalledTimes(1);
    unmount();

    render(<PaymentTermsView assessmentId={ASSESSMENT_ID} />);
    await screen.findByRole('heading', { name: PAYMENT_TERMS_UI_STRINGS.TITLE });
    expect(within(getTitleContainer()).queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows the status code when the analysis request fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => jsonResponse({}, 503));

    render(<PaymentTermsView assessmentId={ASSESSMENT_ID} />);

    expect(await screen.findByText(/503/)).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('shows the API message when the payload reports failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      jsonResponse({ success: false, message: 'Ledger extract is still processing' })
    );

    render(<PaymentTermsView assessmentId={ASSESSMENT_ID} />);

    expect(await screen.findByText('Ledger extract is still processing')).toBeInTheDocument();
  });

  it('shows an error panel when a successful payload carries no data', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => jsonResponse({ success: true, data: null }));

    render(<PaymentTermsView assessmentId={ASSESSMENT_ID} />);

    expect(await screen.findByRole('button')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: PAYMENT_TERMS_UI_STRINGS.TITLE })).not.toBeInTheDocument();
  });

  it('shows the message of a thrown network error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network offline'));

    render(<PaymentTermsView assessmentId={ASSESSMENT_ID} />);

    expect(await screen.findByText('Network offline')).toBeInTheDocument();
  });

  it('shows a non-Error rejection as text', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue('socket hang up');

    render(<PaymentTermsView assessmentId={ASSESSMENT_ID} />);

    expect(await screen.findByText('socket hang up')).toBeInTheDocument();
  });

  it('shows the error panel when a rejection has an empty message', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error(''));

    render(<PaymentTermsView assessmentId={ASSESSMENT_ID} />);

    expect(await screen.findByRole('button')).toBeInTheDocument();
  });

  it('retries the analysis from the error panel and then shows the loaded view', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new Error('Temporary outage'))
      .mockImplementationOnce(async () => jsonResponse({ success: true, data: RESULT }));

    render(<PaymentTermsView assessmentId={ASSESSMENT_ID} />);
    fireEvent.click(await screen.findByRole('button'));

    expect(await screen.findByRole('heading', { name: PAYMENT_TERMS_UI_STRINGS.TITLE })).toBeInTheDocument();
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('keeps the loading state while the request is pending', () => {
    vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise<Response>(() => undefined));

    render(<PaymentTermsView assessmentId={ASSESSMENT_ID} />);

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
