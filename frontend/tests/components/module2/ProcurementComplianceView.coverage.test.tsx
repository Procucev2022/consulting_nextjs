import { act, render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import type { Mock } from 'vitest';
import { ProcurementComplianceView } from '../../../src/components/module2/ProcurementComplianceView';
import {
  COMPLIANCE_UI_STRINGS,
  COMPLIANCE_DISCLOSURES,
  COMPLIANCE_FINANCIAL_LABELS
} from '../../../src/constants/module2ProcurementCompliance';
import type {
  ProcurementComplianceExceptionItem,
  ProcurementComplianceResult,
  ProcurementComplianceSummary
} from '../../../src/types/module2ProcurementCompliance';
import { authApiClient } from '../../../src/utils/authApi';
import { logger } from '../../../src/utils/logger';

const ASSESSMENT_ID = 'AIC-2026-0003';
const SESSION_TOKEN = 'session-token-123';
const LOAD_URL = `/api/module2/sourcing/procurement-compliance?assessmentId=${ASSESSMENT_ID}`;
const REVIEW_URL = '/api/module2/sourcing/procurement-compliance/review';
const EXPORT_URL_PART = 'procurement-compliance/export-excel';
const BLOB_URL = 'blob:procurement-compliance-export';
const AWAITING_ID = 'EXC-AIC-2026-0003-0001';
const VERIFIED_ID = 'EXC-AIC-2026-0003-0002';
const DISMISSED_ID = 'EXC-AIC-2026-0003-0003';

const originalCreateObjectUrl = window.URL.createObjectURL;
const originalRevokeObjectUrl = window.URL.revokeObjectURL;

const formatCrore = (value: number): string => `₹${value.toFixed(2)} Cr`;

const jsonResponse = (body: unknown): Promise<{ ok: boolean; json: () => Promise<unknown> }> =>
  Promise.resolve({ ok: true, json: async () => body });

const buildSummary = (overrides: Partial<ProcurementComplianceSummary> = {}): ProcurementComplianceSummary => ({
  tenantId: ASSESSMENT_ID,
  customerName: 'Bharat Fabrication Works Pvt Ltd',
  totalTransactionsReviewedCount: 1240,
  totalExceptionsIdentifiedCount: 3,
  awaitingReviewCount: 1,
  verifiedExceptionsCount: 1,
  dismissedCount: 1,
  potentialExceptionsCount: 0,
  dataInsufficientCount: 0,
  totalExpenditureUnderReviewInr: 98500000,
  totalExpenditureUnderReviewCr: 9.85,
  totalPotentialFinancialExposureInr: 1250000,
  totalPotentialFinancialExposureCr: 0.125,
  uniqueExpenditureUnderReviewInr: 84000000,
  uniqueExpenditureUnderReviewCr: 8.4,
  priceVarianceInvestigationInr: 1250000,
  priceVarianceInvestigationCr: 0.125,
  samePoScheduleDuplicateInr: 0,
  samePoScheduleDuplicateCr: 0,
  crossPoDuplicateInr: 0,
  crossPoDuplicateCr: 0,
  totalAwaitingApVerificationInr: 4200000,
  totalAwaitingApVerificationCr: 0.42,
  otherGovernanceExceptionsCount: 0,
  quantifiedDefensibleExposureInr: 0,
  quantifiedDefensibleExposureCr: 0,
  verifiedFinancialImpactInr: 0,
  verifiedFinancialImpactCr: 0,
  crossCheckOverlapAmountInr: 0,
  crossCheckOverlapAmountCr: 0,
  nonQuantifiableExceptionsCount: 1,
  totalDisclosedDataGapsCount: 1,
  contractComplianceStatus: COMPLIANCE_DISCLOSURES.CONTRACT_COMPLIANCE_NOTICE,
  financialDisclaimer: COMPLIANCE_DISCLOSURES.FINANCIAL_EXPOSURE_NOTICE,
  ...overrides
});

const awaitingException: ProcurementComplianceExceptionItem = {
  exceptionId: AWAITING_ID,
  checkType: 'PRICE_INCONSISTENCY',
  checkTitle: 'Price Inconsistency Across Comparable Transactions',
  spendCategory: 'Structural Steel Plates',
  vendorName: 'Tata Steel Ltd',
  vendorCode: 'SUP-TATA-001',
  materialCode: 'ITEM-IS2062-10',
  materialDesc: 'IS 2062 E250 BR Plate 10mm',
  plant: 'Plant Jamshedpur',
  supportingTransactionsCount: 2,
  expenditureUnderReviewInr: 24500000,
  expenditureUnderReviewCr: 2.45,
  potentialFinancialExposureInr: 1250000,
  potentialFinancialExposureCr: 0.125,
  financialExposureStatus: 'POTENTIAL_EXPOSURE_REQUIRES_VALIDATION',
  financialExposureStatusLabel: COMPLIANCE_FINANCIAL_LABELS.POTENTIAL_EXPOSURE_REQUIRES_VALIDATION,
  methodologyDescription: 'Unit price variance against the lowest clean purchase price on identical UOM and currency.',
  evidenceDetails: ['Two identical plate purchases priced 2.04% apart.'],
  dataGapsDisclosed: [],
  reviewStatus: 'AWAITING_REVIEW',
  reviewHistory: [],
  potentialRelatedLevers: ['LEVER_1'],
  nextActionRequired: 'Audit the price gap with the plate category lead.',
  supportingTransactions: []
};

const verifiedException: ProcurementComplianceExceptionItem = {
  ...awaitingException,
  exceptionId: VERIFIED_ID,
  checkType: 'PO_TRANSACTION_EXCEPTION',
  checkTitle: 'PO & Transaction Control Exceptions',
  vendorName: 'Global Logistics Corp',
  materialDesc: 'Freight & Haulage Services',
  expenditureUnderReviewInr: 3000000,
  expenditureUnderReviewCr: 0.3,
  potentialFinancialExposureInr: 0,
  potentialFinancialExposureCr: 0,
  financialExposureStatus: 'VERIFIED_EXCEPTION_IMPACT_NOT_YET_ESTABLISHED',
  financialExposureStatusLabel: COMPLIANCE_FINANCIAL_LABELS.VERIFIED_EXCEPTION_IMPACT_NOT_YET_ESTABLISHED,
  dataGapsDisclosed: ['PO reference missing from the source extract.'],
  reviewStatus: 'VERIFIED_EXCEPTION',
  nextActionRequired: 'Backfill the PO reference in ERP.'
};

const dismissedException: ProcurementComplianceExceptionItem = {
  ...awaitingException,
  exceptionId: DISMISSED_ID,
  checkType: 'PURCHASE_PATTERN_EXCEPTION',
  checkTitle: 'Supplier & Purchase Pattern Exception',
  vendorName: 'Apex Packaging',
  materialDesc: 'Corrugated Shipping Cartons',
  expenditureUnderReviewInr: 1000000,
  expenditureUnderReviewCr: 0.1,
  potentialFinancialExposureInr: 0,
  potentialFinancialExposureCr: 0,
  financialExposureStatus: 'NOT_YET_QUANTIFIABLE_ADDITIONAL_DATA_REQUIRED',
  financialExposureStatusLabel: COMPLIANCE_FINANCIAL_LABELS.NOT_YET_QUANTIFIABLE_ADDITIONAL_DATA_REQUIRED,
  reviewStatus: 'NOT_AN_EXCEPTION',
  nextActionRequired: 'No further action.'
};

const buildResult = (overrides: Partial<ProcurementComplianceResult> = {}): ProcurementComplianceResult => ({
  assessmentId: ASSESSMENT_ID,
  customerName: 'Bharat Fabrication Works Pvt Ltd',
  calculatedAt: '2026-10-19T12:00:00.000Z',
  summary: buildSummary(),
  controlChecks: [
    {
      checkType: 'PRICE_INCONSISTENCY',
      checkTitle: 'Price Inconsistency Across Comparable Transactions',
      eligibleTransactionsCount: 390,
      exceptionsIdentifiedCount: 1,
      expenditureUnderReviewInr: 24500000,
      expenditureUnderReviewCr: 2.45,
      potentialFinancialExposureInr: 1250000,
      potentialFinancialExposureCr: 0.125,
      dataCoveragePct: 97.5
    }
  ],
  exceptions: [awaitingException, verifiedException, dismissedException],
  methodologySafeguards: ['Potential exposure is never reported as realised savings.'],
  financialDisclaimer: COMPLIANCE_DISCLOSURES.FINANCIAL_EXPOSURE_NOTICE,
  contractComplianceNotice: COMPLIANCE_DISCLOSURES.CONTRACT_COMPLIANCE_NOTICE,
  ...overrides
});

function stubBlobUrlApi(): { createUrlMock: Mock; revokeUrlMock: Mock } {
  const createUrlMock = vi.fn((_source: Blob | MediaSource): string => BLOB_URL);
  const revokeUrlMock = vi.fn();
  window.URL.createObjectURL = createUrlMock;
  window.URL.revokeObjectURL = revokeUrlMock;
  return { createUrlMock, revokeUrlMock };
}

function stubLoadOnlyFetch(result: ProcurementComplianceResult = buildResult()): Mock {
  const fetchMock = vi.fn(() => jsonResponse({ success: true, data: result }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

async function openReviewModalAndSubmit(exceptionId: string, justification: string): Promise<void> {
  fireEvent.click(screen.getByTestId(`compliance-review-btn-${exceptionId}`));
  fireEvent.change(screen.getByTestId('compliance-input-reviewer-name'), { target: { value: 'Officer Jane' } });
  fireEvent.change(screen.getByTestId('compliance-input-justification'), { target: { value: justification } });
  await act(async () => {
    fireEvent.click(screen.getByTestId('compliance-submit-review-btn'));
  });
}

describe('ProcurementComplianceView coverage paths', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    window.URL.createObjectURL = originalCreateObjectUrl;
    window.URL.revokeObjectURL = originalRevokeObjectUrl;
  });

  it('skips the request and offers retry when no assessment is selected', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    render(<ProcurementComplianceView />);

    expect(fetchMock).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText(COMPLIANCE_UI_STRINGS.BTN_RETRY));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByText(COMPLIANCE_UI_STRINGS.BTN_RETRY)).toBeInTheDocument();
  });

  it('sends the stored session token with load, review, and export requests', async () => {
    vi.spyOn(authApiClient, 'getStoredToken').mockReturnValue(SESSION_TOKEN);
    const { createUrlMock, revokeUrlMock } = stubBlobUrlApi();
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    const fetchMock = vi.fn((url: string) => {
      if (url.includes(EXPORT_URL_PART)) {
        return Promise.resolve({ ok: true, blob: async () => new Blob(['xlsx-bytes']) });
      }
      if (url === REVIEW_URL) {
        return jsonResponse({ success: true });
      }
      return jsonResponse({ success: true, data: buildResult() });
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<ProcurementComplianceView assessmentId={ASSESSMENT_ID} />);
    await waitFor(() => expect(screen.getByText(COMPLIANCE_UI_STRINGS.TITLE)).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith(LOAD_URL, { headers: { Authorization: `Bearer ${SESSION_TOKEN}` } });

    await openReviewModalAndSubmit(AWAITING_ID, 'Price gap confirmed against PO history');

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(REVIEW_URL, expect.objectContaining({ method: 'POST' })));
    expect(fetchMock).toHaveBeenCalledWith(
      REVIEW_URL,
      expect.objectContaining({
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SESSION_TOKEN}` }
      })
    );
    await waitFor(() => {
      const loadCalls = fetchMock.mock.calls.filter(([url]) => url === LOAD_URL);
      expect(loadCalls).toHaveLength(2);
    });
    await waitFor(() => expect(screen.getByTestId('compliance-export-excel-btn')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('compliance-export-excel-btn'));

    await waitFor(() => expect(clickSpy).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining(EXPORT_URL_PART), {
      headers: { Authorization: `Bearer ${SESSION_TOKEN}` }
    });
    expect(createUrlMock).toHaveBeenCalledTimes(1);
    expect(revokeUrlMock).toHaveBeenCalledWith(BLOB_URL);
  });

  it('reports a failed workbook export through the logger and the error state', async () => {
    const loggerSpy = vi.spyOn(logger, 'error').mockImplementation(() => undefined);
    stubBlobUrlApi();
    const fetchMock = vi.fn((url: string) => {
      if (url.includes(EXPORT_URL_PART)) {
        return Promise.resolve({ ok: false, status: 503 });
      }
      return jsonResponse({ success: true, data: buildResult() });
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<ProcurementComplianceView assessmentId={ASSESSMENT_ID} />);
    await waitFor(() => expect(screen.getByTestId('compliance-export-excel-btn')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('compliance-export-excel-btn'));

    await waitFor(() =>
      expect(loggerSpy).toHaveBeenCalledWith(expect.any(String), { assessmentId: ASSESSMENT_ID }, expect.any(Error))
    );
    expect(screen.getByText(COMPLIANCE_UI_STRINGS.BTN_RETRY)).toBeInTheDocument();
  });

  it('logs the server message when a review submission is rejected with a JSON body', async () => {
    const loggerSpy = vi.spyOn(logger, 'error').mockImplementation(() => undefined);
    const fetchMock = vi.fn((url: string) => {
      if (url === REVIEW_URL) {
        return Promise.resolve({
          ok: false,
          status: 409,
          json: async () => ({ message: 'Review lock held by another reviewer' })
        });
      }
      return jsonResponse({ success: true, data: buildResult() });
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<ProcurementComplianceView assessmentId={ASSESSMENT_ID} />);
    await waitFor(() => expect(screen.getByTestId(`compliance-review-btn-${AWAITING_ID}`)).toBeInTheDocument());

    await openReviewModalAndSubmit(AWAITING_ID, 'Pricing deviation verified');

    await waitFor(() =>
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ payload: expect.any(Object) }),
        expect.objectContaining({ message: 'Review lock held by another reviewer' })
      )
    );
    expect(screen.getByText(COMPLIANCE_UI_STRINGS.BTN_RETRY)).toBeInTheDocument();
  });

  it('falls back to the HTTP status when a rejected review response has no readable body', async () => {
    const loggerSpy = vi.spyOn(logger, 'error').mockImplementation(() => undefined);
    const fetchMock = vi.fn((url: string) => {
      if (url === REVIEW_URL) {
        return Promise.resolve({
          ok: false,
          status: 502,
          json: () => Promise.reject(new SyntaxError('Unexpected end of JSON input'))
        });
      }
      return jsonResponse({ success: true, data: buildResult() });
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<ProcurementComplianceView assessmentId={ASSESSMENT_ID} />);
    await waitFor(() => expect(screen.getByTestId(`compliance-review-btn-${AWAITING_ID}`)).toBeInTheDocument());

    await openReviewModalAndSubmit(AWAITING_ID, 'Pricing deviation verified');

    await waitFor(() =>
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({ message: 'HTTP error 502' })
      )
    );
  });

  it('falls back to the total expenditure and zero values when optional KPI totals are missing', async () => {
    const partialResult = buildResult({
      summary: buildSummary({
        totalExpenditureUnderReviewCr: 9.85,
        uniqueExpenditureUnderReviewCr: undefined,
        priceVarianceInvestigationCr: undefined,
        totalAwaitingApVerificationCr: undefined,
        verifiedFinancialImpactCr: undefined
      })
    });
    stubLoadOnlyFetch(partialResult);

    render(<ProcurementComplianceView assessmentId={ASSESSMENT_ID} />);

    await waitFor(() => expect(screen.getByText(COMPLIANCE_UI_STRINGS.KPI_UNIQUE_EXPENDITURE)).toBeInTheDocument());
    expect(screen.getByText(formatCrore(9.85))).toBeInTheDocument();
    expect(screen.getAllByText(formatCrore(0))).toHaveLength(3);
  });

  it('renders a payload that is the bare result without a data envelope', async () => {
    const fetchMock = vi.fn(() => jsonResponse(buildResult()));
    vi.stubGlobal('fetch', fetchMock);

    render(<ProcurementComplianceView assessmentId={ASSESSMENT_ID} />);

    await waitFor(() => expect(screen.getByText(COMPLIANCE_UI_STRINGS.TITLE)).toBeInTheDocument());
    expect(screen.getByTestId(`compliance-review-btn-${AWAITING_ID}`)).toBeInTheDocument();
  });

  it('shows only verified exceptions on the VERIFIED tab', async () => {
    stubLoadOnlyFetch();

    render(<ProcurementComplianceView assessmentId={ASSESSMENT_ID} />);
    await waitFor(() => expect(screen.getByText(AWAITING_ID)).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('compliance-tab-verified'));

    expect(screen.getByText(VERIFIED_ID)).toBeInTheDocument();
    expect(screen.queryByText(AWAITING_ID)).not.toBeInTheDocument();
    expect(screen.queryByText(DISMISSED_ID)).not.toBeInTheDocument();
  });

  it('tolerates the download link unmounting before the export file is offered', async () => {
    const { revokeUrlMock } = stubBlobUrlApi();
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    const fetchMock = vi.fn((url: string) => {
      if (url.includes(EXPORT_URL_PART)) {
        return Promise.resolve({ ok: true, blob: async () => new Blob(['xlsx-bytes']) });
      }
      return jsonResponse({ success: true, data: buildResult() });
    });
    vi.stubGlobal('fetch', fetchMock);

    const { unmount } = render(<ProcurementComplianceView assessmentId={ASSESSMENT_ID} />);
    await waitFor(() => expect(screen.getByTestId('compliance-export-excel-btn')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('compliance-export-excel-btn'));
    unmount();

    await waitFor(() => expect(revokeUrlMock).toHaveBeenCalledWith(BLOB_URL));
    expect(clickSpy).not.toHaveBeenCalled();
  });
});
