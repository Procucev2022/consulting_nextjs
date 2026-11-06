/**
 * Module 2 coverage: CategorySpecialisationView loading, overview-to-register navigation, and error branches.
 */

import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import type { Mock } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CategorySpecialisationView } from '../../../src/components/module2/CategorySpecialisationView';
import { CATEGORY_SPECIALISATION_UI_STRINGS } from '../../../src/constants/module2CategorySpecialisation';
import {
  buildCategorySpecialisationResult,
  buildSpecialisationCategories
} from '../../fixtures/module2CoverageFixtures';

const ASSESSMENT_ID = 'AIC-2026-0002';
const ANALYSIS_URL = `/api/module2/sourcing/category-specialisation?assessmentId=${ASSESSMENT_ID}`;
const OVERVIEW_TAB_TEST_ID = 'category-specialisation-tab-overview';

interface MockFetchResponse {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}

const successResponse = (): MockFetchResponse => ({
  ok: true,
  status: 200,
  json: async () => ({ success: true, data: buildCategorySpecialisationResult() })
});

const jsonResponse = (body: unknown): MockFetchResponse => ({
  ok: true,
  status: 200,
  json: async () => body
});

const httpErrorResponse = (status: number): MockFetchResponse => ({
  ok: false,
  status,
  json: async () => ({})
});

// Queued responses are used once each; later requests receive the successful analysis payload.
const stubFetch = (...queuedResponses: MockFetchResponse[]): Mock => {
  const fetchMock = vi.fn().mockResolvedValue(successResponse());
  queuedResponses.forEach((response) => {
    fetchMock.mockResolvedValueOnce(response);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

describe('CategorySpecialisationView coverage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows a loading state until the analysis resolves and requests the assessment analysis', async () => {
    const fetchMock = stubFetch();
    render(<CategorySpecialisationView assessmentId={ASSESSMENT_ID} />);

    expect(screen.queryByTestId(OVERVIEW_TAB_TEST_ID)).not.toBeInTheDocument();
    expect(await screen.findByTestId(OVERVIEW_TAB_TEST_ID)).toBeInTheDocument();
    expect(fetchMock.mock.calls[0]?.[0]).toBe(ANALYSIS_URL);
  });

  it('opens the category register with the selected category expanded when an overview row is chosen', async () => {
    const categories = buildSpecialisationCategories();
    stubFetch();
    render(<CategorySpecialisationView assessmentId={ASSESSMENT_ID} />);
    await screen.findByTestId(OVERVIEW_TAB_TEST_ID);

    fireEvent.click(screen.getByText(categories[0].categoryName));

    expect(await screen.findByText(CATEGORY_SPECIALISATION_UI_STRINGS.CATEGORIES_TABLE_TITLE)).toBeInTheDocument();
    expect(screen.getByText(categories[0].priorityRationale)).toBeInTheDocument();
  });

  it('shows the HTTP status of a failed request and retries on demand', async () => {
    const fetchMock = stubFetch(httpErrorResponse(500));
    render(<CategorySpecialisationView assessmentId={ASSESSMENT_ID} />);

    expect(await screen.findByText(/HTTP 500/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button'));

    expect(await screen.findByTestId(OVERVIEW_TAB_TEST_ID)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('shows the server message when the payload reports failure', async () => {
    stubFetch(jsonResponse({ success: false, message: 'No Lever 6 run found for AIC-2026-0002' }));
    render(<CategorySpecialisationView assessmentId={ASSESSMENT_ID} />);

    expect(await screen.findByText('No Lever 6 run found for AIC-2026-0002')).toBeInTheDocument();
  });

  it('shows the retry panel when the failed payload carries no message', async () => {
    stubFetch(jsonResponse({ success: false }));
    render(<CategorySpecialisationView assessmentId={ASSESSMENT_ID} />);

    expect(await screen.findByRole('button')).toBeInTheDocument();
  });

  it('shows the thrown text when the rejection is not an Error instance', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce('gateway timeout'));
    render(<CategorySpecialisationView assessmentId={ASSESSMENT_ID} />);

    expect(await screen.findByText('gateway timeout')).toBeInTheDocument();
  });

  it('shows the retry panel when the thrown error has an empty message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('')));
    render(<CategorySpecialisationView assessmentId={ASSESSMENT_ID} />);

    expect(await screen.findByRole('button')).toBeInTheDocument();
  });

  it('switches to the opportunity and overlap tabs', async () => {
    stubFetch();
    render(<CategorySpecialisationView assessmentId={ASSESSMENT_ID} />);
    await screen.findByTestId(OVERVIEW_TAB_TEST_ID);

    fireEvent.click(screen.getByTestId('category-specialisation-tab-opportunities'));
    expect(screen.getByText(CATEGORY_SPECIALISATION_UI_STRINGS.OPPORTUNITIES_TABLE_TITLE)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('category-specialisation-tab-overlaps'));
    expect(screen.getByText(CATEGORY_SPECIALISATION_UI_STRINGS.OVERLAP_TABLE_TITLE)).toBeInTheDocument();
  });

  it('renders the back control when a handler is supplied and reports clicks to it', async () => {
    const onBackToOverview = vi.fn();
    stubFetch();
    render(<CategorySpecialisationView assessmentId={ASSESSMENT_ID} onBackToOverview={onBackToOverview} />);
    await screen.findByTestId(OVERVIEW_TAB_TEST_ID);

    // The back control is the first button in the header, ahead of the tab bar.
    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(onBackToOverview).toHaveBeenCalledTimes(1);
  });
});
