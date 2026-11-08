/**
 * Coverage tests for PaymentTermsView: request and payload failure paths, retry, the optional back control,
 * and switching between the three real tab panels.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { PaymentTermsView } from '../../../src/components/module2/PaymentTermsView';
import { API_REQUEST_ID_HEADER, ERROR_CATEGORIES, UI_STRINGS } from '../../../src/constants';
import { logger } from '../../../src/utils/logger';
import type { FrontendLogEntry } from '../../../src/types/logger';
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

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers }
  });
}

function getSentRequestId(): string {
  const fetchMock = vi.mocked(globalThis.fetch);
  const init = fetchMock.mock.calls[0]?.[1];
  return new Headers(init?.headers).get(API_REQUEST_ID_HEADER) ?? '';
}

function buildLogEntry(message: string): FrontendLogEntry {
  return { timestamp: '2026-11-08T00:00:00.000Z', level: 'error', service: 'consulting-frontend', message };
}

function getTitleContainer(): HTMLElement {
  return screen.getByRole('heading', { name: UI_STRINGS.module2.paymentTerms.title }).parentElement;
}

describe('PaymentTermsView coverage', () => {
  beforeEach(() => {
    vi.spyOn(logger, 'error').mockImplementation((message) => buildLogEntry(message));
    vi.spyOn(logger, 'warn').mockImplementation((message) => ({
      ...buildLogEntry(message),
      level: 'warn'
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads the analysis and switches between the opportunities and supplier panels', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => jsonResponse({ success: true, data: RESULT }));

    render(<PaymentTermsView assessmentId={ASSESSMENT_ID} />);
    expect(await screen.findByRole('heading', { name: UI_STRINGS.module2.paymentTerms.title })).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('payment-terms-tab-opportunities'));
    expect(screen.getByPlaceholderText(UI_STRINGS.module2.paymentTerms.searchPlaceholder)).toBeInTheDocument();
    expect(screen.getByText('Acme Fibers Ltd')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('payment-terms-tab-suppliers'));
    expect(screen.queryByPlaceholderText(UI_STRINGS.module2.paymentTerms.searchPlaceholder)).not.toBeInTheDocument();
    expect(screen.getByText('Acme Fibers Ltd')).toBeInTheDocument();
  });

  it('requests the analysis for the given assessment id', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => jsonResponse({ success: true, data: RESULT }));

    render(<PaymentTermsView assessmentId={ASSESSMENT_ID} />);
    await screen.findByRole('heading', { name: UI_STRINGS.module2.paymentTerms.title });

    expect(fetchSpy.mock.calls[0]?.[0]).toBe(API_URL);
  });

  it('shows the back control only when a back handler is provided, and calls it', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => jsonResponse({ success: true, data: RESULT }));
    const onBackToOverview = vi.fn();
    const { unmount } = render(<PaymentTermsView assessmentId={ASSESSMENT_ID} onBackToOverview={onBackToOverview} />);
    await screen.findByRole('heading', { name: UI_STRINGS.module2.paymentTerms.title });

    fireEvent.click(within(getTitleContainer()).getByRole('button'));
    expect(onBackToOverview).toHaveBeenCalledTimes(1);
    unmount();

    render(<PaymentTermsView assessmentId={ASSESSMENT_ID} />);
    await screen.findByRole('heading', { name: UI_STRINGS.module2.paymentTerms.title });
    expect(within(getTitleContainer()).queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows the status code when the analysis request fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => jsonResponse({}, 503));

    render(<PaymentTermsView assessmentId={ASSESSMENT_ID} />);

    expect(await screen.findByText(UI_STRINGS.module2.paymentTerms.httpFailure(503, getSentRequestId())))
      .toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(logger.error).toHaveBeenCalledWith('Payment Terms analysis request failed', expect.objectContaining({
      action: 'module2.payment-terms.load',
      assessmentId: ASSESSMENT_ID,
      statusCode: 503,
      requestId: getSentRequestId(),
      errorCategory: ERROR_CATEGORIES.SERVER_ERROR
    }), expect.any(Error));
  });

  it('uses the server correlation ID when the response supplies one', async () => {
    const responseRequestId = 'worker-payment-terms-503';
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      jsonResponse({}, 503, { [API_REQUEST_ID_HEADER]: responseRequestId })
    );
    render(<PaymentTermsView assessmentId={ASSESSMENT_ID} />);

    expect(await screen.findByText(UI_STRINGS.module2.paymentTerms.httpFailure(503, responseRequestId)))
      .toBeInTheDocument();
    expect(logger.error).toHaveBeenCalledWith('Payment Terms analysis request failed', expect.objectContaining({
      requestId: responseRequestId
    }), expect.any(Error));
  });

  it('shows the API message when the payload reports failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      jsonResponse({ success: false, message: 'Ledger extract is still processing' })
    );

    render(<PaymentTermsView assessmentId={ASSESSMENT_ID} />);

    const detail = 'Ledger extract is still processing';
    expect(await screen.findByText(UI_STRINGS.module2.paymentTerms.responseFailure(detail, getSentRequestId())))
      .toBeInTheDocument();
    expect(logger.error).toHaveBeenCalledWith('Payment Terms analysis request failed', expect.objectContaining({
      requestId: getSentRequestId(), errorCategory: ERROR_CATEGORIES.SERVER_ERROR
    }), expect.any(Error));
  });

  it('shows an error panel when a successful payload carries no data', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => jsonResponse({ success: true, data: null }));

    render(<PaymentTermsView assessmentId={ASSESSMENT_ID} />);

    expect(await screen.findByText(UI_STRINGS.module2.paymentTerms.responseFailure(
      UI_STRINGS.module2.paymentTerms.invalidResponseDetail,
      getSentRequestId()
    ))).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: UI_STRINGS.module2.paymentTerms.title })).not.toBeInTheDocument();
  });

  it('shows the message of a thrown network error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network offline'));

    render(<PaymentTermsView assessmentId={ASSESSMENT_ID} />);

    expect(await screen.findByText(UI_STRINGS.module2.paymentTerms.networkFailure('Network offline', getSentRequestId())))
      .toBeInTheDocument();
    expect(logger.error).toHaveBeenCalledWith('Payment Terms analysis request failed', expect.objectContaining({
      requestId: getSentRequestId(), errorCategory: ERROR_CATEGORIES.NETWORK_ERROR
    }), expect.any(Error));
  });

  it('shows a non-Error rejection as text', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue('socket hang up');

    render(<PaymentTermsView assessmentId={ASSESSMENT_ID} />);

    expect(await screen.findByText(UI_STRINGS.module2.paymentTerms.networkFailure('socket hang up', getSentRequestId())))
      .toBeInTheDocument();
  });

  it('shows the error panel when a rejection has an empty message', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error(''));

    render(<PaymentTermsView assessmentId={ASSESSMENT_ID} />);

    expect(await screen.findByText(UI_STRINGS.module2.paymentTerms.networkFailure('', getSentRequestId())))
      .toBeInTheDocument();
  });

  it('retries the analysis from the error panel and then shows the loaded view', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new Error('Temporary outage'))
      .mockImplementationOnce(async () => jsonResponse({ success: true, data: RESULT }));

    render(<PaymentTermsView assessmentId={ASSESSMENT_ID} />);
    fireEvent.click(await screen.findByRole('button'));

    expect(await screen.findByRole('heading', { name: UI_STRINGS.module2.paymentTerms.title })).toBeInTheDocument();
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('keeps the loading state while the request is pending', () => {
    vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise<Response>(() => undefined));

    render(<PaymentTermsView assessmentId={ASSESSMENT_ID} />);

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it.each([
    [401, ERROR_CATEGORIES.AUTH_ERROR],
    [403, ERROR_CATEGORIES.AUTH_ERROR],
    [404, ERROR_CATEGORIES.NOT_FOUND_ERROR],
    [429, ERROR_CATEGORIES.RATE_LIMIT_ERROR],
    [422, ERROR_CATEGORIES.VALIDATION_ERROR]
  ])('records HTTP %s with the matching categorized failure', async (statusCode, errorCategory) => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => jsonResponse({}, statusCode));
    render(<PaymentTermsView assessmentId={ASSESSMENT_ID} />);

    await screen.findByRole('button', { name: UI_STRINGS.module2.paymentTerms.retry });
    expect(logger.error).toHaveBeenCalledWith('Payment Terms analysis request failed', expect.objectContaining({
      statusCode,
      requestId: getSentRequestId(),
      errorCategory
    }), expect.any(Error));
  });

  it('rejects an invalid assessment reference before sending a request and records the validation detail', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    render(<PaymentTermsView assessmentId=" " />);

    await screen.findByText(UI_STRINGS.module2.paymentTerms.missingAssessment);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith('Payment Terms analysis request rejected before fetch', expect.objectContaining({
      statusCode: 0,
      errorCategory: ERROR_CATEGORIES.VALIDATION_ERROR
    }), expect.any(Error));
  });
});
