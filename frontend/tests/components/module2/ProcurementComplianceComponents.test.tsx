import { expectApiFetchCall } from '../../utils/apiFetchAssertions';
import React from 'react';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProcurementComplianceView } from '../../../src/components/module2/ProcurementComplianceView';
import { ProcurementComplianceTable } from '../../../src/components/module2/ProcurementComplianceTable';
import {
  COMPLIANCE_UI_STRINGS,
  COMPLIANCE_DISCLOSURES,
  COMPLIANCE_FINANCIAL_LABELS
} from '../../../src/constants/module2ProcurementCompliance';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import { API_REQUEST_ID_HEADER } from '../../../src/constants/app';
import type {
  ProcurementComplianceResult,
  ProcurementComplianceExceptionItem
} from '../../../src/types/module2ProcurementCompliance';

const mockExceptions: ProcurementComplianceExceptionItem[] = [
  {
    exceptionId: 'EXC-AIC-2026-0002-0001',
    checkType: 'PRICE_INCONSISTENCY',
    checkTitle: 'Price Inconsistency Across Comparable Transactions',
    spendCategory: 'Raw Materials',
    vendorName: 'Vardhman Textiles',
    materialDesc: 'Cotton Yarn 30s Combed Compact',
    supportingTransactionsCount: 2,
    expenditureUnderReviewInr: 5000000,
    expenditureUnderReviewCr: 0.5,
    potentialFinancialExposureInr: 250000,
    potentialFinancialExposureCr: 0.025,
    financialExposureStatus: 'POTENTIAL_EXPOSURE_REQUIRES_VALIDATION',
    financialExposureStatusLabel: COMPLIANCE_FINANCIAL_LABELS.POTENTIAL_EXPOSURE_REQUIRES_VALIDATION,
    methodologyDescription: 'Variance vs lowest clean unit price',
    evidenceDetails: ['Variance found'],
    dataGapsDisclosed: [],
    reviewStatus: 'AWAITING_REVIEW',
    reviewHistory: [],
    potentialRelatedLevers: ['LEVER_1'],
    nextActionRequired: 'Audit with category lead',
    supportingTransactions: []
  },
  {
    exceptionId: 'EXC-AIC-2026-0002-0002',
    checkType: 'PO_TRANSACTION_EXCEPTION',
    checkTitle: 'PO & Transaction Control Exceptions',
    spendCategory: 'Logistics',
    vendorName: 'Global Logistics Corp',
    materialDesc: 'Freight & Haulage Services',
    supportingTransactionsCount: 1,
    expenditureUnderReviewInr: 3000000,
    expenditureUnderReviewCr: 0.3,
    potentialFinancialExposureInr: 0,
    potentialFinancialExposureCr: 0,
    financialExposureStatus: 'NOT_YET_QUANTIFIABLE_ADDITIONAL_DATA_REQUIRED',
    financialExposureStatusLabel: COMPLIANCE_FINANCIAL_LABELS.NOT_YET_QUANTIFIABLE_ADDITIONAL_DATA_REQUIRED,
    methodologyDescription: 'Governance gap',
    evidenceDetails: ['Missing PO reference'],
    dataGapsDisclosed: ['PO reference missing from source dataset'],
    reviewStatus: 'VERIFIED_EXCEPTION',
    reviewHistory: [],
    potentialRelatedLevers: [],
    nextActionRequired: 'Audit retroactive PO creation',
    supportingTransactions: []
  },
  {
    exceptionId: 'EXC-AIC-2026-0002-0003',
    checkType: 'PURCHASE_PATTERN_EXCEPTION',
    checkTitle: 'Supplier & Purchase Pattern Exception',
    spendCategory: 'Packaging',
    vendorName: 'Apex Packaging',
    materialDesc: 'Corrugated Shipping Cartons',
    supportingTransactionsCount: 1,
    expenditureUnderReviewInr: 1000000,
    expenditureUnderReviewCr: 0.1,
    potentialFinancialExposureInr: 0,
    potentialFinancialExposureCr: 0,
    financialExposureStatus: 'NOT_YET_QUANTIFIABLE_ADDITIONAL_DATA_REQUIRED',
    financialExposureStatusLabel: COMPLIANCE_FINANCIAL_LABELS.NOT_YET_QUANTIFIABLE_ADDITIONAL_DATA_REQUIRED,
    methodologyDescription: 'Concentration signal',
    evidenceDetails: ['High single supplier spend'],
    dataGapsDisclosed: [],
    reviewStatus: 'NOT_AN_EXCEPTION',
    reviewHistory: [],
    potentialRelatedLevers: [],
    nextActionRequired: 'None',
    supportingTransactions: []
  }
];

const mockResult: ProcurementComplianceResult = {
  assessmentId: 'AIC-2026-0002',
  customerName: 'ABC Textile Ltd',
  calculatedAt: '2026-10-19T12:00:00.000Z',
  summary: {
    tenantId: 'AIC-2026-0002',
    customerName: 'ABC Textile Ltd',
    totalTransactionsReviewedCount: 500,
    totalExceptionsIdentifiedCount: 3,
    awaitingReviewCount: 1,
    verifiedExceptionsCount: 1,
    dismissedCount: 1,
    potentialExceptionsCount: 0,
    dataInsufficientCount: 0,
    totalExpenditureUnderReviewInr: 9000000,
    totalExpenditureUnderReviewCr: 0.9,
    totalPotentialFinancialExposureInr: 250000,
    totalPotentialFinancialExposureCr: 0.025,
    uniqueExpenditureUnderReviewInr: 9000000,
    uniqueExpenditureUnderReviewCr: 0.9,
    priceVarianceInvestigationInr: 250000,
    priceVarianceInvestigationCr: 0.025,
    samePoScheduleDuplicateInr: 0,
    samePoScheduleDuplicateCr: 0,
    crossPoDuplicateInr: 0,
    crossPoDuplicateCr: 0,
    totalAwaitingApVerificationInr: 0,
    totalAwaitingApVerificationCr: 0,
    otherGovernanceExceptionsCount: 0,
    quantifiedDefensibleExposureInr: 0,
    quantifiedDefensibleExposureCr: 0,
    verifiedFinancialImpactInr: 0,
    verifiedFinancialImpactCr: 0,
    crossCheckOverlapAmountInr: 0,
    crossCheckOverlapAmountCr: 0,
    nonQuantifiableExceptionsCount: 2,
    totalDisclosedDataGapsCount: 1,
    contractComplianceStatus: COMPLIANCE_DISCLOSURES.CONTRACT_COMPLIANCE_NOTICE,
    financialDisclaimer: COMPLIANCE_DISCLOSURES.FINANCIAL_EXPOSURE_NOTICE
  },
  controlChecks: [
    {
      checkType: 'PRICE_INCONSISTENCY',
      checkTitle: 'Price Inconsistency Across Comparable Transactions',
      eligibleTransactionsCount: 390,
      exceptionsIdentifiedCount: 1,
      expenditureUnderReviewInr: 5000000,
      expenditureUnderReviewCr: 0.5,
      potentialFinancialExposureInr: 250000,
      potentialFinancialExposureCr: 0.025,
      dataCoveragePct: 97.5
    }
  ],
  exceptions: mockExceptions,
  methodologySafeguards: ['Zero assumed contractual breaches.'],
  financialDisclaimer: COMPLIANCE_DISCLOSURES.FINANCIAL_EXPOSURE_NOTICE,
  contractComplianceNotice: COMPLIANCE_DISCLOSURES.CONTRACT_COMPLIANCE_NOTICE
};

function createDeferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

describe('ProcurementComplianceView Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading state initially', () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})));
    render(<ProcurementComplianceView assessmentId="AIC-2026-0002" />);
    expect(screen.getByText(/Loading Lever 9 Procurement Compliance/)).toBeInTheDocument();
  });

  it('renders error state and retries on button click', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({ ok: false, status: 500 });
    vi.stubGlobal('fetch', fetchMock);

    render(<ProcurementComplianceView assessmentId="AIC-2026-0002" />);
    await waitFor(() => {
      expect(screen.getByText(/Unable to load procurement compliance data/)).toBeInTheDocument();
    });

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockResult })
    });

    fireEvent.click(screen.getByText(COMPLIANCE_UI_STRINGS.BTN_RETRY));
    await waitFor(() => {
      expect(screen.getByText(COMPLIANCE_UI_STRINGS.TITLE)).toBeInTheDocument();
    });
  });

  it('ignores a slow response after the selected assessment changes', async () => {
    const previousResponse = createDeferred<Response>();
    const currentResult: ProcurementComplianceResult = {
      ...mockResult,
      assessmentId: 'AIC-2026-0003',
      exceptions: [{ ...mockExceptions[0], exceptionId: 'CURRENT-ASSESSMENT-EXCEPTION' }]
    };
    const currentResponse: Response = {
      ok: true,
      json: async () => ({ success: true, data: currentResult })
    } as Response;
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) =>
      String(input).includes('AIC-2026-0002') ? previousResponse.promise : Promise.resolve(currentResponse)
    ));
    const view = render(<ProcurementComplianceView assessmentId="AIC-2026-0002" />);

    view.rerender(<ProcurementComplianceView assessmentId="AIC-2026-0003" />);
    expect(await screen.findByText('CURRENT-ASSESSMENT-EXCEPTION')).toBeInTheDocument();

    const staleResult: ProcurementComplianceResult = {
      ...mockResult,
      exceptions: [{ ...mockExceptions[0], exceptionId: 'STALE-ASSESSMENT-EXCEPTION' }]
    };
    await act(async () => {
      previousResponse.resolve({
        ok: true,
        json: async () => ({ success: true, data: staleResult })
      } as Response);
    });

    expect(screen.getByText('CURRENT-ASSESSMENT-EXCEPTION')).toBeInTheDocument();
    expect(screen.queryByText('STALE-ASSESSMENT-EXCEPTION')).not.toBeInTheDocument();
  });

  it('does not reload the previous assessment after an in-flight review completes', async () => {
    const reviewResponse = createDeferred<Response>();
    const previousResult: ProcurementComplianceResult = {
      ...mockResult,
      exceptions: [{ ...mockExceptions[0], exceptionId: 'PREVIOUS-ASSESSMENT-EXCEPTION' }]
    };
    const currentResult: ProcurementComplianceResult = {
      ...mockResult,
      assessmentId: 'AIC-2026-0003',
      exceptions: [{ ...mockExceptions[0], exceptionId: 'CURRENT-ASSESSMENT-EXCEPTION' }]
    };
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/review')) return reviewResponse.promise;
      const data = url.includes('AIC-2026-0003') ? currentResult : previousResult;
      return Promise.resolve({ ok: true, json: async () => ({ success: true, data }) } as Response);
    });
    vi.stubGlobal('fetch', fetchMock);
    const view = render(<ProcurementComplianceView assessmentId="AIC-2026-0002" />);
    expect(await screen.findByText('PREVIOUS-ASSESSMENT-EXCEPTION')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('compliance-review-btn-PREVIOUS-ASSESSMENT-EXCEPTION'));
    fireEvent.change(screen.getByTestId('compliance-input-reviewer-name'), { target: { value: 'Officer Jane' } });
    fireEvent.change(screen.getByTestId('compliance-input-justification'), { target: { value: 'Reviewed record' } });
    fireEvent.click(screen.getByTestId('compliance-submit-review-btn'));
    await waitFor(() => expectApiFetchCall(fetchMock, '/api/module2/sourcing/procurement-compliance/review', expect.any(Object)));

    view.rerender(<ProcurementComplianceView assessmentId="AIC-2026-0003" />);
    expect(await screen.findByText('CURRENT-ASSESSMENT-EXCEPTION')).toBeInTheDocument();
    await act(async () => {
      reviewResponse.resolve({ ok: true } as Response);
    });

    expect(screen.getByText('CURRENT-ASSESSMENT-EXCEPTION')).toBeInTheDocument();
    expect(screen.queryByText('PREVIOUS-ASSESSMENT-EXCEPTION')).not.toBeInTheDocument();
    expect(fetchMock.mock.calls.filter(([input]) => String(input).includes('AIC-2026-0002'))).toHaveLength(1);
  });

  it('renders header, governance banner, KPIs, checks, table, and triggers back and export', async () => {
    const mockBlob = new Blob(['dummy excel data'], { type: 'application/vnd.openxmlformats' });
    const createUrlSpy = vi.fn().mockReturnValue('blob:http://localhost/mock-blob');
    const revokeUrlSpy = vi.fn();
    window.URL.createObjectURL = createUrlSpy;
    window.URL.revokeObjectURL = revokeUrlSpy;

    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (typeof url === 'string' && url.includes('export-excel')) {
        return Promise.resolve({
          ok: true,
          blob: async () => mockBlob
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true, data: mockResult })
      });
    });
    vi.stubGlobal('fetch', mockFetch);

    const onBack = vi.fn();
    render(<ProcurementComplianceView assessmentId="AIC-2026-0002" onNavigateBack={onBack} />);

    await waitFor(() => {
      expect(screen.getByText(COMPLIANCE_UI_STRINGS.TITLE)).toBeInTheDocument();
      expect(screen.getByText(COMPLIANCE_UI_STRINGS.BADGE)).toBeInTheDocument();
    });

    expect(screen.getByText(COMPLIANCE_DISCLOSURES.CONTRACT_COMPLIANCE_NOTICE)).toBeInTheDocument();
    expect(screen.getByText(COMPLIANCE_UI_STRINGS.KPI_UNIQUE_EXPENDITURE)).toBeInTheDocument();
    expect(screen.getByText('EXC-AIC-2026-0002-0001')).toBeInTheDocument();

    fireEvent.click(screen.getByTitle(COMPLIANCE_UI_STRINGS.BTN_BACK_TO_OVERVIEW));
    expect(onBack).toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('compliance-export-excel-btn'));
    await waitFor(() => {
      expectApiFetchCall(mockFetch, expect.stringContaining('/api/module2/sourcing/procurement-compliance/export-excel'), expect.any(Object));
      expect(createUrlSpy).toHaveBeenCalled();
    });
  });

  it('filters table by search text and status tabs', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockResult })
    }));

    render(<ProcurementComplianceView assessmentId="AIC-2026-0002" />);
    await waitFor(() => {
      expect(screen.getByText('EXC-AIC-2026-0002-0001')).toBeInTheDocument();
    });

    const searchInput = screen.getByTestId('compliance-search-input');
    fireEvent.change(searchInput, { target: { value: 'Freight' } });
    expect(screen.getByText('EXC-AIC-2026-0002-0002')).toBeInTheDocument();
    expect(screen.queryByText('EXC-AIC-2026-0002-0001')).not.toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: 'NonExistentString' } });
    expect(screen.queryByText('EXC-AIC-2026-0002-0001')).not.toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: '' } });

    fireEvent.click(screen.getByTestId('compliance-tab-awaiting'));
    expect(screen.getByText('EXC-AIC-2026-0002-0001')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('compliance-tab-dismissed'));
    expect(screen.getByText('EXC-AIC-2026-0002-0003')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('compliance-tab-gaps'));
    expect(screen.getByText('EXC-AIC-2026-0002-0002')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('compliance-tab-all'));
    expect(screen.getByText('EXC-AIC-2026-0002-0001')).toBeInTheDocument();
  });

  it('opens review modal, submits review, handles failure, and tests close', async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/review')) {
        return Promise.resolve({ ok: true, json: async () => ({ success: true }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ success: true, data: mockResult }) });
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<ProcurementComplianceView assessmentId="AIC-2026-0002" />);
    await waitFor(() => {
      expect(screen.getByText('EXC-AIC-2026-0002-0001')).toBeInTheDocument();
    });

    // 1. Open and submit review
    fireEvent.click(screen.getByTestId('compliance-review-btn-EXC-AIC-2026-0002-0001'));
    expect(screen.getByText(UI_STRINGS.module2.procurementComplianceReview.title)).toBeInTheDocument();

    fireEvent.change(screen.getByTestId('compliance-input-reviewer-name'), {
      target: { value: 'Officer Jane' }
    });
    fireEvent.change(screen.getByTestId('compliance-input-justification'), {
      target: { value: 'Pricing deviation verified' }
    });
    fireEvent.click(screen.getByTestId('compliance-submit-review-btn'));

    await waitFor(() => {
      expectApiFetchCall(fetchMock, '/api/module2/sourcing/procurement-compliance/review', expect.any(Object));
    });

    // 2. Open and test review failure
    fireEvent.click(screen.getByTestId('compliance-review-btn-EXC-AIC-2026-0002-0001'));
    fetchMock.mockImplementationOnce((url: string) => {
      if (url.includes('/review')) {
        return Promise.resolve({ ok: false, status: 500, json: async () => ({ message: 'Review service unavailable' }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ success: true, data: mockResult }) });
    });

    fireEvent.change(screen.getByTestId('compliance-input-reviewer-name'), {
      target: { value: 'Officer Jane' }
    });
    fireEvent.change(screen.getByTestId('compliance-input-justification'), {
      target: { value: 'Testing error branch' }
    });
    fireEvent.click(screen.getByTestId('compliance-submit-review-btn'));

    const reviewCalls = fetchMock.mock.calls.filter(([url]) => url.includes('/review'));
    const [, reviewInit] = reviewCalls[reviewCalls.length - 1] as [string, RequestInit];
    const requestId = new Headers(reviewInit.headers).get(API_REQUEST_ID_HEADER);
    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.module2.procurementComplianceReview.submission.failed(
        UI_STRINGS.module2.procurementComplianceReview.submission.httpStatus(500),
        'Review service unavailable',
        requestId ?? ''
      ))).toBeInTheDocument();
    });

    // 3. Retry clears error; modal remains open so we close it via close button
    fireEvent.click(screen.getByText(COMPLIANCE_UI_STRINGS.BTN_RETRY));
    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.module2.procurementComplianceReview.title)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('compliance-modal-close-btn'));
    expect(screen.queryByText(UI_STRINGS.module2.procurementComplianceReview.title)).not.toBeInTheDocument();
  });
});

describe('ProcurementComplianceTable Component', () => {
  it('renders all table rows and badges, and handles selection click', () => {
    const handleSelect = vi.fn();
    render(
      <ProcurementComplianceTable
        exceptions={mockExceptions}
        onSelectException={handleSelect}
      />
    );

    expect(screen.getByText('EXC-AIC-2026-0002-0001')).toBeInTheDocument();
    expect(screen.getByText('EXC-AIC-2026-0002-0002')).toBeInTheDocument();
    expect(screen.getByText('EXC-AIC-2026-0002-0003')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('compliance-review-btn-EXC-AIC-2026-0002-0001'));
    expect(handleSelect).toHaveBeenCalledWith(mockExceptions[0]);
  });

  it('shows the received review status when the status has no configured label', () => {
    const unrecognized = { ...mockExceptions[0], reviewStatus: 'LEGACY_REVIEW_STATE' } as unknown as ProcurementComplianceExceptionItem;
    render(<ProcurementComplianceTable exceptions={[unrecognized]} onSelectException={vi.fn()} />);

    expect(screen.getByText('LEGACY_REVIEW_STATE')).toBeInTheDocument();
  });
});
