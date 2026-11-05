/**
 * Coverage tests for Module2ConsolidatedSavingsView: data loading, request and payload failure paths,
 * retry and refresh controls, and the balanced-reconciliation badge.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Module2ConsolidatedSavingsView } from '../../../src/components/module2/Module2ConsolidatedSavingsView';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import frontendLogger from '../../../src/utils/logger';
import type { Module2ConsolidatedSavingsSummary } from '../../../src/types';

const strings = UI_STRINGS.module2SavingsDeduplication;
const ASSESSMENT_ID = 'AIC-2026-0002';
const API_URL = `/api/module2/sourcing/consolidated-savings?assessmentId=${ASSESSMENT_ID}`;

function buildSummary(overrides: Partial<Module2ConsolidatedSavingsSummary>): Module2ConsolidatedSavingsSummary {
  const base: Module2ConsolidatedSavingsSummary = {
    assessmentId: ASSESSMENT_ID,
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
        grossSavingsInr: 4500000,
        grossSavingsCr: 0.45,
        netSavingsInr: 4500000,
        netSavingsCr: 0.45,
        commerciallyValidatedSavingsInr: 4500000,
        commerciallyValidatedSavingsCr: 0.45,
        exploratorySavingsInr: 0,
        exploratorySavingsCr: 0,
        overlapDeductionsInr: 0,
        overlapDeductionsCr: 0,
        unresolvedExcludedInr: 0,
        unresolvedExcludedCr: 0,
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
        grossSavingsInr: 3200000,
        grossSavingsCr: 0.32,
        netSavingsInr: 0,
        netSavingsCr: 0,
        commerciallyValidatedSavingsInr: 0,
        commerciallyValidatedSavingsCr: 0,
        exploratorySavingsInr: 0,
        exploratorySavingsCr: 0,
        overlapDeductionsInr: 3200000,
        overlapDeductionsCr: 0.32,
        unresolvedExcludedInr: 0,
        unresolvedExcludedCr: 0,
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
    opportunities: [],
    certificationNotice: 'Consolidated savings certified under Section 7 deduplication rules.',
    disclosures: ['Pre-negotiation estimates require supplier agreement before booking.'],
    disclaimerText: 'Pre-negotiation estimates require supplier agreement before booking.'
  };
  return { ...base, ...overrides };
}

const SUMMARY = buildSummary({});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('Module2ConsolidatedSavingsView coverage', () => {
  beforeEach(() => {
    // Failure paths log through the centralized logger; keep test output quiet and assert on the call instead.
    vi.spyOn(frontendLogger, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads the summary and renders the lever breakdown rows', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(jsonResponse({ success: true, data: SUMMARY }));

    render(<Module2ConsolidatedSavingsView assessmentId={ASSESSMENT_ID} />);

    expect(await screen.findByText(strings.title)).toBeInTheDocument();
    expect(fetchSpy.mock.calls[0]?.[0]).toBe(API_URL);
    expect(screen.getByText(strings.leverBreakdownTitle)).toBeInTheDocument();
    expect(screen.getAllByText('₹0.4500 Cr').length).toBeGreaterThan(0);
  });

  it('shows the loading message while the summary request is in flight', () => {
    vi.spyOn(globalThis, 'fetch').mockReturnValueOnce(new Promise<Response>(() => undefined));

    render(<Module2ConsolidatedSavingsView assessmentId={ASSESSMENT_ID} />);

    expect(screen.getByText(strings.loadingMessage)).toBeInTheDocument();
  });

  it('shows the balanced badge only when the reconciliation balances', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      jsonResponse({ success: true, data: buildSummary({ isArithmeticallyBalanced: false }) })
    );

    render(<Module2ConsolidatedSavingsView assessmentId={ASSESSMENT_ID} />);
    expect(await screen.findByText(strings.title)).toBeInTheDocument();

    expect(screen.queryByText(strings.arithmeticBalancedBadge)).not.toBeInTheDocument();
  });

  it('does not call the API and shows the error panel when no assessment id is given', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    render(<Module2ConsolidatedSavingsView />);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(screen.getByText(strings.errorMessage)).toBeInTheDocument();
    expect(screen.getByText(strings.btnRetry)).toBeInTheDocument();
  });

  it('does not refetch when initial data is supplied', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    render(<Module2ConsolidatedSavingsView assessmentId={ASSESSMENT_ID} initialData={SUMMARY} />);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(screen.getByText(strings.title)).toBeInTheDocument();
  });

  it('shows the message from a payload that reports failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      jsonResponse({ success: false, message: 'Consolidation engine is warming up' })
    );

    render(<Module2ConsolidatedSavingsView assessmentId={ASSESSMENT_ID} />);

    expect(await screen.findByText('Consolidation engine is warming up')).toBeInTheDocument();
    expect(screen.getByText(strings.errorMessage)).toBeInTheDocument();
  });

  it('shows the error panel when a successful payload carries no data', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(jsonResponse({ success: true, data: null }));

    render(<Module2ConsolidatedSavingsView assessmentId={ASSESSMENT_ID} />);

    expect(await screen.findByText(strings.errorMessage)).toBeInTheDocument();
    expect(screen.getByText(strings.btnRetry)).toBeInTheDocument();
  });

  it('shows the HTTP status when the request is rejected by the server', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(jsonResponse({}, 503));

    render(<Module2ConsolidatedSavingsView assessmentId={ASSESSMENT_ID} />);

    expect(await screen.findByText(/503/)).toBeInTheDocument();
    expect(frontendLogger.error).toHaveBeenCalledWith(
      expect.any(String),
      { assessmentId: ASSESSMENT_ID },
      expect.any(Error)
    );
  });

  it('shows the message of a thrown network error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Connection reset by peer'));

    render(<Module2ConsolidatedSavingsView assessmentId={ASSESSMENT_ID} />);

    expect(await screen.findByText('Connection reset by peer')).toBeInTheDocument();
  });

  it('shows a non-Error rejection as text', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce('gateway closed');

    render(<Module2ConsolidatedSavingsView assessmentId={ASSESSMENT_ID} />);

    expect(await screen.findByText('gateway closed')).toBeInTheDocument();
  });

  it('retries the request from the error panel and then shows the loaded summary', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new Error('Temporary outage'))
      .mockResolvedValueOnce(jsonResponse({ success: true, data: SUMMARY }));

    render(<Module2ConsolidatedSavingsView assessmentId={ASSESSMENT_ID} />);
    fireEvent.click(await screen.findByText(strings.btnRetry));

    expect(await screen.findByText(strings.title)).toBeInTheDocument();
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('refreshes the summary from the header control', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse({ success: true, data: SUMMARY }))
      .mockResolvedValueOnce(jsonResponse({ success: true, data: SUMMARY }));

    render(<Module2ConsolidatedSavingsView assessmentId={ASSESSMENT_ID} initialData={null} />);
    expect(await screen.findByText(strings.title)).toBeInTheDocument();

    fireEvent.click(screen.getByText(strings.btnRefresh));

    expect(await screen.findByText(strings.title)).toBeInTheDocument();
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
