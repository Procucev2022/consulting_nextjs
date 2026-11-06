import React from 'react';
import { act, render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import type { Mock } from 'vitest';
import { SpecificationRationalisationView } from '../../../src/components/module2/SpecificationRationalisationView';
import {
  SPECIFICATION_UI_STRINGS,
  SPECIFICATION_FINANCIAL_DISCLOSURES,
  SPECIFICATION_STATUS_LABELS
} from '../../../src/constants/module2SpecificationRationalisation';
import type {
  SpecificationCandidateItem,
  SpecificationRationalisationResult,
  SpecificationRationalisationSummary
} from '../../../src/types/module2SpecificationRationalisation';

const ASSESSMENT_ID = 'AIC-2026-0002';
const LOAD_URL = `/api/module2/sourcing/specification-rationalisation?assessmentId=${ASSESSMENT_ID}`;
const REVIEW_URL = '/api/module2/sourcing/specification-rationalisation/review';
const FIRST_CANDIDATE_ID = 'SPEC-RAT-RAW-001';
const VERIFIED_CANDIDATE_ID = 'SPEC-RAT-RAW-002';
const REJECTED_CANDIDATE_ID = 'SPEC-RAT-RAW-003';
const POTENTIAL_CANDIDATE_ID = 'SPEC-RAT-RAW-004';

const buildSummary = (
  overrides: Partial<SpecificationRationalisationSummary> = {}
): SpecificationRationalisationSummary => ({
  tenantId: ASSESSMENT_ID,
  customerName: 'ABC Textile Ltd',
  totalMaterialsAssessedCount: 150,
  totalCandidatesIdentifiedCount: 4,
  awaitingTechnicalReviewCount: 1,
  technicallyVerifiedCount: 1,
  rejectedCount: 1,
  potentialMatchCount: 1,
  candidatesWithMissingTechnicalDataCount: 2,
  totalExpenditureUnderReviewInr: 12500000,
  totalExpenditureUnderReviewCr: 1.25,
  financialBenefitStatus: SPECIFICATION_FINANCIAL_DISCLOSURES.PHASE_1_STATUS,
  commercialSavingsQuantifiedInr: 0,
  commercialSavingsQuantifiedCr: 0,
  ...overrides
});

const buildCandidate = (overrides: Partial<SpecificationCandidateItem> = {}): SpecificationCandidateItem => ({
  candidateId: FIRST_CANDIDATE_ID,
  identificationType: 'DUPLICATE_CODE',
  identificationRationale: 'Identical material code is used with differing text descriptions.',
  spendCategory: 'Raw Materials',
  primaryItem: {
    code: 'MAT-101',
    description: 'Cotton Yarn 30s Combed Compact',
    normalizedDescription: 'cotton yarn 30s combed compact',
    plant: 'Plant 1',
    totalSpendInr: 5000000,
    totalQuantity: 20000,
    uom: 'kg',
    transactionCount: 10,
    suppliersCount: 2
  },
  comparisonItem: {
    code: '',
    description: 'Cotton Yarn 30s Carded',
    normalizedDescription: 'cotton yarn 30s carded',
    plant: 'Plant 2',
    totalSpendInr: 3500000,
    totalQuantity: 15000,
    uom: 'kg',
    transactionCount: 7,
    suppliersCount: 1
  },
  similarityScore: 0.75,
  technicalAttributes: [
    { attributeName: 'Count (Ne)', sourceValue: '30s', candidateValue: '30s', matchStatus: 'MATCH', isCritical: true }
  ],
  differencesIdentified: [],
  missingAttributesDisclosed: ['Dimensions / Sizing missing from both items.'],
  hasMissingTechnicalData: true,
  expenditureUnderReviewInr: 8500000,
  expenditureUnderReviewCr: 0.85,
  quantityUnderReview: 35000,
  reviewStatus: 'AWAITING_TECHNICAL_REVIEW',
  reviewHistory: [],
  financialBenefitStatus: SPECIFICATION_FINANCIAL_DISCLOSURES.PHASE_1_STATUS,
  potentialRelatedLevers: ['LEVER_1'],
  nextRequiredAction: 'Route the candidate to the plant technical reviewer.',
  ...overrides
});

const candidateFixtures: SpecificationCandidateItem[] = [
  buildCandidate({}),
  buildCandidate({
    candidateId: VERIFIED_CANDIDATE_ID,
    identificationType: 'EQUIVALENT_SPECIFICATION',
    reviewStatus: 'TECHNICALLY_VERIFIED',
    hasMissingTechnicalData: false,
    missingAttributesDisclosed: []
  }),
  buildCandidate({
    candidateId: REJECTED_CANDIDATE_ID,
    identificationType: 'OVER_SPECIFICATION',
    reviewStatus: 'REJECTED',
    hasMissingTechnicalData: true
  }),
  buildCandidate({
    candidateId: POTENTIAL_CANDIDATE_ID,
    identificationType: 'SIMILAR_DESCRIPTION',
    reviewStatus: 'POTENTIAL_MATCH',
    hasMissingTechnicalData: false,
    missingAttributesDisclosed: [],
    primaryItem: { ...buildCandidate().primaryItem, code: '' }
  })
];

const buildResult = (overrides: Partial<SpecificationRationalisationResult> = {}): SpecificationRationalisationResult => ({
  assessmentId: ASSESSMENT_ID,
  customerName: 'ABC Textile Ltd',
  calculatedAt: '2026-10-19T12:00:00.000Z',
  summary: buildSummary(),
  candidates: candidateFixtures,
  methodologyDisclosures: ['Phase 1 claims zero financial savings.'],
  financialDisclaimer: SPECIFICATION_FINANCIAL_DISCLOSURES.PHASE_1_STATUS,
  ...overrides
});

const loadResponse = (body: unknown): Promise<{ ok: boolean; json: () => Promise<unknown> }> =>
  Promise.resolve({ ok: true, json: async () => body });

function stubFetch(handler: (url: string, init?: RequestInit) => Promise<unknown>): Mock {
  const fetchMock = vi.fn(handler);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function stubLoadedResult(result: SpecificationRationalisationResult = buildResult()): Mock {
  return stubFetch(() => loadResponse({ success: true, data: result }));
}

async function settle(): Promise<void> {
  await act(async () => {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });
  });
}

describe('SpecificationRationalisationView coverage paths', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('sends no request and shows no rationalisation view when no assessment is selected', async () => {
    const fetchMock = stubFetch(() => loadResponse({}));

    render(<SpecificationRationalisationView />);
    await settle();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByText(SPECIFICATION_UI_STRINGS.TITLE)).not.toBeInTheDocument();
  });

  it('shows the message returned by the API when the response reports failure', async () => {
    stubFetch(() =>
      loadResponse({ success: false, message: 'Assessment AIC-2026-0009 has no rationalisation run yet.' })
    );

    render(<SpecificationRationalisationView assessmentId="AIC-2026-0009" />);

    expect(await screen.findByText('Assessment AIC-2026-0009 has no rationalisation run yet.')).toBeInTheDocument();
    expect(screen.queryByText(SPECIFICATION_UI_STRINGS.TITLE)).not.toBeInTheDocument();
  });

  it('shows no rationalisation data when the response reports failure without a message', async () => {
    stubFetch(() => loadResponse({ success: false }));

    render(<SpecificationRationalisationView assessmentId={ASSESSMENT_ID} />);
    await settle();

    expect(screen.queryByText(SPECIFICATION_UI_STRINGS.TITLE)).not.toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('shows the raw value when the request rejects with a non-Error reason', async () => {
    stubFetch(() => Promise.reject('Connection reset by peer'));

    render(<SpecificationRationalisationView assessmentId={ASSESSMENT_ID} />);

    expect(await screen.findByText('Connection reset by peer')).toBeInTheDocument();
  });

  it('shows the HTTP status when the load request is rejected by the server', async () => {
    stubFetch(() => Promise.resolve({ ok: false, status: 503 }));

    render(<SpecificationRationalisationView assessmentId={ASSESSMENT_ID} />);

    expect(await screen.findByText(/HTTP 503/)).toBeInTheDocument();
  });

  it('renders KPI cards, status badges with their colours, and the back navigation', async () => {
    const onNavigateBack = vi.fn();
    const fetchMock = stubLoadedResult();

    render(<SpecificationRationalisationView assessmentId={ASSESSMENT_ID} onNavigateBack={onNavigateBack} />);
    await screen.findByText(SPECIFICATION_UI_STRINGS.TITLE);

    expect(fetchMock.mock.calls[0]?.[0]).toBe(LOAD_URL);

    expect(screen.getByText(SPECIFICATION_UI_STRINGS.KPI_ASSESSED_MATERIALS)).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText(SPECIFICATION_STATUS_LABELS.AWAITING_TECHNICAL_REVIEW, { selector: 'span.bg-amber-100' })).toBeInTheDocument();
    expect(screen.getByText(SPECIFICATION_STATUS_LABELS.TECHNICALLY_VERIFIED, { selector: 'span.bg-emerald-100' })).toBeInTheDocument();
    expect(screen.getByText(SPECIFICATION_STATUS_LABELS.REJECTED, { selector: 'span.bg-rose-100' })).toBeInTheDocument();
    expect(screen.getByText(SPECIFICATION_STATUS_LABELS.POTENTIAL_MATCH, { selector: 'span.bg-blue-100' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: SPECIFICATION_UI_STRINGS.BTN_BACK_TO_OVERVIEW }));
    expect(onNavigateBack).toHaveBeenCalledTimes(1);
  });

  it('discloses when D1 candidate results are read-only and hides review controls', async () => {
    stubLoadedResult(buildResult({ reviewWorkflowAvailable: false, candidates: [candidateFixtures[0]] }));

    render(<SpecificationRationalisationView assessmentId={ASSESSMENT_ID} />);
    await screen.findByText(FIRST_CANDIDATE_ID);

    expect(screen.getByText(SPECIFICATION_UI_STRINGS.REVIEW_WORKFLOW_UNAVAILABLE)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: SPECIFICATION_UI_STRINGS.BTN_REVIEW_SPEC })).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('restores every candidate when the all-candidates filter is selected after narrowing', async () => {
    stubLoadedResult();

    render(<SpecificationRationalisationView assessmentId={ASSESSMENT_ID} />);
    await screen.findByText(FIRST_CANDIDATE_ID);

    fireEvent.click(screen.getByRole('button', { name: `${SPECIFICATION_UI_STRINGS.TAB_VERIFIED} (1)` }));
    expect(screen.queryByText(FIRST_CANDIDATE_ID)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: `${SPECIFICATION_UI_STRINGS.TAB_ALL_CANDIDATES} (4)` }));
    expect(screen.getByText(FIRST_CANDIDATE_ID)).toBeInTheDocument();
    expect(screen.getByText(VERIFIED_CANDIDATE_ID)).toBeInTheDocument();
  });

  it('shows only candidates awaiting review and highlights the active filter', async () => {
    stubLoadedResult();

    render(<SpecificationRationalisationView assessmentId={ASSESSMENT_ID} />);
    await screen.findByText(FIRST_CANDIDATE_ID);

    const awaitingButton = screen.getByRole('button', {
      name: `${SPECIFICATION_UI_STRINGS.TAB_AWAITING_REVIEW} (1)`
    });
    fireEvent.click(awaitingButton);

    expect(screen.getByText(FIRST_CANDIDATE_ID)).toBeInTheDocument();
    expect(screen.queryByText(VERIFIED_CANDIDATE_ID)).not.toBeInTheDocument();
    expect(awaitingButton).toHaveClass('bg-amber-600');
  });

  it('shows only candidates with missing technical data when the data gaps filter is selected', async () => {
    stubLoadedResult();

    render(<SpecificationRationalisationView assessmentId={ASSESSMENT_ID} />);
    await screen.findByText(FIRST_CANDIDATE_ID);

    const dataGapsButton = screen.getByRole('button', { name: `${SPECIFICATION_UI_STRINGS.TAB_DATA_GAPS} (2)` });
    fireEvent.click(dataGapsButton);

    expect(screen.getByText(FIRST_CANDIDATE_ID)).toBeInTheDocument();
    expect(screen.getByText(REJECTED_CANDIDATE_ID)).toBeInTheDocument();
    expect(screen.queryByText(VERIFIED_CANDIDATE_ID)).not.toBeInTheDocument();
    expect(screen.queryByText(POTENTIAL_CANDIDATE_ID)).not.toBeInTheDocument();
    expect(dataGapsButton).toHaveClass('bg-rose-600');
  });

  it('shows the empty-state row when the selected filter matches no candidates', async () => {
    stubLoadedResult(
      buildResult({
        candidates: [candidateFixtures[1]],
        summary: buildSummary({ awaitingTechnicalReviewCount: 0, candidatesWithMissingTechnicalDataCount: 0 })
      })
    );

    render(<SpecificationRationalisationView assessmentId={ASSESSMENT_ID} />);
    await screen.findByText(VERIFIED_CANDIDATE_ID);

    fireEvent.click(screen.getByRole('button', { name: `${SPECIFICATION_UI_STRINGS.TAB_AWAITING_REVIEW} (0)` }));

    expect(screen.getByText(SPECIFICATION_UI_STRINGS.NO_CANDIDATES_FOUND)).toBeInTheDocument();
    expect(screen.queryByText(VERIFIED_CANDIDATE_ID)).not.toBeInTheDocument();
  });

  it('opens the technical review for a candidate and closes it from cancel', async () => {
    stubLoadedResult();

    render(<SpecificationRationalisationView assessmentId={ASSESSMENT_ID} />);
    const reviewButtons = await screen.findAllByRole('button', { name: SPECIFICATION_UI_STRINGS.BTN_REVIEW_SPEC });
    expect(reviewButtons).toHaveLength(candidateFixtures.length);

    fireEvent.click(reviewButtons[0]);
    expect(screen.getByText(SPECIFICATION_UI_STRINGS.MODAL_TITLE)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: SPECIFICATION_UI_STRINGS.BTN_CANCEL }));
    expect(screen.queryByText(SPECIFICATION_UI_STRINGS.MODAL_TITLE)).not.toBeInTheDocument();
  });

  it('records a technical decision, refreshes the summary from the response, and closes the review', async () => {
    const updatedResult = buildResult({
      summary: buildSummary({ technicallyVerifiedCount: 2, awaitingTechnicalReviewCount: 0 })
    });
    const fetchMock = stubFetch((url: string, init?: RequestInit) => {
      if (init?.method === 'POST') {
        return loadResponse({ success: true, data: updatedResult });
      }
      return loadResponse({ success: true, data: buildResult() });
    });

    render(<SpecificationRationalisationView assessmentId={ASSESSMENT_ID} />);
    const reviewButtons = await screen.findAllByRole('button', { name: SPECIFICATION_UI_STRINGS.BTN_REVIEW_SPEC });
    fireEvent.click(reviewButtons[0]);

    fireEvent.change(screen.getByPlaceholderText(/Dr. A. Sharma/), { target: { value: 'Dr. A. Iyer' } });
    fireEvent.change(screen.getByPlaceholderText(/State engineering basis/), {
      target: { value: 'Equivalence confirmed by plant trials.' }
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: SPECIFICATION_UI_STRINGS.BTN_SUBMIT_REVIEW }));
    });

    await waitFor(() => expect(screen.queryByText(SPECIFICATION_UI_STRINGS.MODAL_TITLE)).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: `${SPECIFICATION_UI_STRINGS.TAB_VERIFIED} (2)` })).toBeInTheDocument();

    const postCall = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST');
    expect(postCall?.[0]).toBe(REVIEW_URL);
    expect(JSON.parse(String(postCall?.[1]?.body))).toMatchObject({
      candidateId: FIRST_CANDIDATE_ID,
      reviewerName: 'Dr. A. Iyer'
    });
  });

  it('keeps the review open when the decision response is not successful', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined);
    const fetchMock = stubFetch((url: string, init?: RequestInit) => {
      if (init?.method === 'POST') {
        return loadResponse({ success: false });
      }
      return loadResponse({ success: true, data: buildResult() });
    });

    render(<SpecificationRationalisationView assessmentId={ASSESSMENT_ID} />);
    const reviewButtons = await screen.findAllByRole('button', { name: SPECIFICATION_UI_STRINGS.BTN_REVIEW_SPEC });
    fireEvent.click(reviewButtons[0]);
    fireEvent.change(screen.getByPlaceholderText(/Dr. A. Sharma/), { target: { value: 'Dr. A. Iyer' } });
    fireEvent.change(screen.getByPlaceholderText(/State engineering basis/), {
      target: { value: 'Equivalence confirmed by plant trials.' }
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: SPECIFICATION_UI_STRINGS.BTN_SUBMIT_REVIEW }));
    });

    await waitFor(() => expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(true));
    await settle();

    expect(screen.getByText(SPECIFICATION_UI_STRINGS.MODAL_TITLE)).toBeInTheDocument();
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('alerts with the HTTP status when the decision request is rejected by the server', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined);
    stubFetch((url: string, init?: RequestInit) => {
      if (init?.method === 'POST') {
        return Promise.resolve({ ok: false, status: 500 });
      }
      return loadResponse({ success: true, data: buildResult() });
    });

    render(<SpecificationRationalisationView assessmentId={ASSESSMENT_ID} />);
    const reviewButtons = await screen.findAllByRole('button', { name: SPECIFICATION_UI_STRINGS.BTN_REVIEW_SPEC });
    fireEvent.click(reviewButtons[0]);
    fireEvent.change(screen.getByPlaceholderText(/Dr. A. Sharma/), { target: { value: 'Dr. A. Iyer' } });
    fireEvent.change(screen.getByPlaceholderText(/State engineering basis/), {
      target: { value: 'Equivalence confirmed by plant trials.' }
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: SPECIFICATION_UI_STRINGS.BTN_SUBMIT_REVIEW }));
    });

    await waitFor(() => expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('500')));
    expect(screen.getByText(SPECIFICATION_UI_STRINGS.MODAL_TITLE)).toBeInTheDocument();
  });

  it('alerts a fallback message when the decision request rejects with a non-Error reason', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined);
    stubFetch((url: string, init?: RequestInit) => {
      if (init?.method === 'POST') {
        return Promise.reject('network down');
      }
      return loadResponse({ success: true, data: buildResult() });
    });

    render(<SpecificationRationalisationView assessmentId={ASSESSMENT_ID} />);
    const reviewButtons = await screen.findAllByRole('button', { name: SPECIFICATION_UI_STRINGS.BTN_REVIEW_SPEC });
    fireEvent.click(reviewButtons[0]);
    fireEvent.change(screen.getByPlaceholderText(/Dr. A. Sharma/), { target: { value: 'Dr. A. Iyer' } });
    fireEvent.change(screen.getByPlaceholderText(/State engineering basis/), {
      target: { value: 'Equivalence confirmed by plant trials.' }
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: SPECIFICATION_UI_STRINGS.BTN_SUBMIT_REVIEW }));
    });

    await waitFor(() => expect(alertSpy).toHaveBeenCalledTimes(1));
    expect(alertSpy).toHaveBeenCalledWith(expect.any(String));
  });

  it('shows raw values for identification types and review statuses without a label', async () => {
    const legacyPayload = {
      ...buildResult(),
      candidates: [
        { ...buildCandidate(), identificationType: 'LEGACY_PATTERN' },
        { ...buildCandidate({ candidateId: VERIFIED_CANDIDATE_ID }), reviewStatus: 'SUPERSEDED' }
      ]
    };
    stubFetch(() => loadResponse({ success: true, data: legacyPayload }));

    render(<SpecificationRationalisationView assessmentId={ASSESSMENT_ID} />);

    expect(await screen.findByText('LEGACY_PATTERN')).toBeInTheDocument();
    expect(screen.getByText('SUPERSEDED')).toBeInTheDocument();
  });
});
