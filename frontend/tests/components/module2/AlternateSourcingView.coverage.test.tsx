/**
 * Module 2 coverage: AlternateSourcingView filter refetches, state-to-city fallbacks, token header, and error paths.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Mock } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { AlternateSourcingView } from '../../../src/components/module2/AlternateSourcingView';
import {
  ALTERNATE_SOURCING_UI_STRINGS,
  GEOGRAPHIC_PREFERENCE_OPTIONS
} from '../../../src/constants/module2AlternateSourcing';
import { authApiClient } from '../../../src/utils/api';
import logger from '../../../src/utils/logger';
import type { FrontendLogEntry } from '../../../src/types/logger';
import { buildAlternateSourcingResult } from '../../fixtures/module2CoverageFixtures';

const ASSESSMENT_ID = 'AIC-2026-0001';
const FIRST_OPPORTUNITY_TEST_ID = 'opportunity-card-OPP-ALT-STL-001';

interface MockFetchResponse {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}

const successResponse = (data = buildAlternateSourcingResult()): MockFetchResponse => ({
  ok: true,
  status: 200,
  json: async () => ({ success: true, data })
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

// Queued responses are used once each; later requests receive the successful discovery payload.
const stubFetch = (...queuedResponses: MockFetchResponse[]): Mock => {
  const fetchMock = vi.fn().mockResolvedValue(successResponse());
  queuedResponses.forEach((response) => {
    fetchMock.mockResolvedValueOnce(response);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

const lastRequestUrl = (fetchMock: Mock): string => String(fetchMock.mock.lastCall?.[0]);

// Order of the native selects: geographic preference, state, city, match type.
const getFilterSelects = (): HTMLElement[] => screen.getAllByRole('combobox');

const renderLoadedView = async (): Promise<void> => {
  render(<AlternateSourcingView assessmentId={ASSESSMENT_ID} />);
  await screen.findByTestId(FIRST_OPPORTUNITY_TEST_ID);
};

describe('AlternateSourcingView coverage', () => {
  beforeEach(() => {
    vi.spyOn(logger, 'error').mockImplementation(
      (message: string, context?: Record<string, unknown>): FrontendLogEntry => ({
        timestamp: '2026-01-20T10:00:00.000Z',
        level: 'error',
        service: 'consulting-frontend',
        message,
        context
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('requests the default filters without an auth header and renders the returned cards', async () => {
    const fetchMock = stubFetch();
    await renderLoadedView();

    const requestedUrl = lastRequestUrl(fetchMock);
    expect(requestedUrl).toContain(`assessmentId=${ASSESSMENT_ID}`);
    expect(requestedUrl).toContain('geographicPreference=ALL_LOCATIONS');
    expect(requestedUrl).not.toContain('preferredState=');
    expect(requestedUrl).not.toContain('preferredCity=');
    expect(requestedUrl).not.toContain('matchType=');
    expect(fetchMock).toHaveBeenCalledWith(expect.any(String), { headers: {} });
    expect(screen.getByTestId('opportunity-card-OPP-ALT-STL-002')).toBeInTheDocument();
  });

  it('sends the stored session token as a bearer header', async () => {
    vi.spyOn(authApiClient, 'getStoredToken').mockReturnValue('steel-session-token');
    const fetchMock = stubFetch();
    await renderLoadedView();

    expect(fetchMock).toHaveBeenCalledWith(expect.any(String), {
      headers: { Authorization: 'Bearer steel-session-token' }
    });
  });

  it('refetches with the chosen geographic preference and match type, then clears the match type', async () => {
    const fetchMock = stubFetch();
    await renderLoadedView();
    const [geographicSelect, , , matchTypeSelect] = getFilterSelects();

    fireEvent.change(geographicSelect, { target: { value: GEOGRAPHIC_PREFERENCE_OPTIONS[1].value } });
    await waitFor(() => {
      expect(lastRequestUrl(fetchMock)).toContain(`geographicPreference=${GEOGRAPHIC_PREFERENCE_OPTIONS[1].value}`);
    });

    fireEvent.change(matchTypeSelect, { target: { value: 'EXACT' } });
    await waitFor(() => {
      expect(lastRequestUrl(fetchMock)).toContain('matchType=EXACT');
    });

    fireEvent.change(matchTypeSelect, { target: { value: 'ALL' } });
    await waitFor(() => {
      expect(lastRequestUrl(fetchMock)).not.toContain('matchType=');
    });
  });

  it('refetches when the refresh control is pressed', async () => {
    const fetchMock = stubFetch();
    await renderLoadedView();

    fireEvent.click(screen.getByRole('button', { name: ALTERNATE_SOURCING_UI_STRINGS.BTN_REFRESH }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(lastRequestUrl(fetchMock)).toContain('refresh=true');
    });
  });

  it('shows D1-provided locations without inferring a state-to-city relationship', async () => {
    const fetchMock = stubFetch();
    await renderLoadedView();

    fireEvent.change(getFilterSelects()[1], { target: { value: 'GUJARAT' } });

    await waitFor(() => {
      expect(lastRequestUrl(fetchMock)).toContain('preferredState=GUJARAT');
    });
    const citySelect = getFilterSelects()[2];
    expect(within(citySelect).getByRole('option', { name: 'AHMEDABAD' })).toBeInTheDocument();
    expect(citySelect).toHaveValue('');
  });

  it('does not invent states or cities when they are absent from the D1 response', async () => {
    const fetchMock = stubFetch(successResponse(buildAlternateSourcingResult({
      availableStates: ['MAHARASHTRA'], availableCities: ['MUMBAI']
    })));
    await renderLoadedView();

    expect(within(getFilterSelects()[1]).queryByRole('option', { name: 'KERALA' })).not.toBeInTheDocument();
    expect(within(getFilterSelects()[2]).queryByRole('option', { name: 'KOCHI' })).not.toBeInTheDocument();
    expect(lastRequestUrl(fetchMock)).not.toContain('preferredState=');
  });

  it('shows empty location placeholders when the assessment has no mapped locations', async () => {
    stubFetch(successResponse(buildAlternateSourcingResult({ availableStates: [], availableCities: [] })));
    await renderLoadedView();

    expect(within(getFilterSelects()[1]).getAllByRole('option')).toHaveLength(1);
    expect(within(getFilterSelects()[2]).getAllByRole('option')).toHaveLength(1);
  });

  it('shows the HTTP status of a failed load, logs it, and recovers on retry', async () => {
    const fetchMock = stubFetch(httpErrorResponse(503));
    render(<AlternateSourcingView assessmentId={ASSESSMENT_ID} />);

    expect(await screen.findByText(/HTTP 503/)).toBeInTheDocument();
    expect(logger.error).toHaveBeenCalledWith('Alternate Sourcing fetch failure', {
      assessmentId: ASSESSMENT_ID,
      error: expect.stringContaining('HTTP 503')
    });

    fireEvent.click(screen.getByRole('button', { name: ALTERNATE_SOURCING_UI_STRINGS.ERROR_RETRY }));

    expect(await screen.findByTestId(FIRST_OPPORTUNITY_TEST_ID)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('surfaces the server message when the payload reports failure', async () => {
    stubFetch(jsonResponse({ success: false, message: 'Discovery index is rebuilding for AIC-2026-0001' }));
    render(<AlternateSourcingView assessmentId={ASSESSMENT_ID} />);

    expect(await screen.findByText('Discovery index is rebuilding for AIC-2026-0001')).toBeInTheDocument();
  });

  it('falls back to a generic error when the failed payload has no message', async () => {
    stubFetch(jsonResponse({ success: false }));
    render(<AlternateSourcingView assessmentId={ASSESSMENT_ID} />);

    expect(await screen.findByRole('button', { name: ALTERNATE_SOURCING_UI_STRINGS.ERROR_RETRY })).toBeInTheDocument();
    expect(logger.error).toHaveBeenCalledWith('Alternate Sourcing fetch failure', {
      assessmentId: ASSESSMENT_ID,
      error: expect.any(String)
    });
  });

  it('falls back to a generic error when the rejected value is not an Error instance', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce('socket hang up'));
    render(<AlternateSourcingView assessmentId={ASSESSMENT_ID} />);

    expect(await screen.findByRole('button', { name: ALTERNATE_SOURCING_UI_STRINGS.ERROR_RETRY })).toBeInTheDocument();
    expect(logger.error).toHaveBeenCalledWith('Alternate Sourcing fetch failure', {
      assessmentId: ASSESSMENT_ID,
      error: expect.any(String)
    });
  });

  it('renders the empty-state message and no cards when a failed load leaves no opportunities', async () => {
    stubFetch(httpErrorResponse(500));
    render(<AlternateSourcingView assessmentId={ASSESSMENT_ID} />);

    await screen.findByRole('button', { name: ALTERNATE_SOURCING_UI_STRINGS.ERROR_RETRY });
    expect(screen.queryAllByTestId(/^opportunity-card-/)).toHaveLength(0);
  });

  it('requests the cities the user picks in the city filter', async () => {
    const fetchMock = stubFetch();
    await renderLoadedView();

    fireEvent.change(getFilterSelects()[2], { target: { value: 'PUNE' } });

    await waitFor(() => {
      expect(lastRequestUrl(fetchMock)).toContain('preferredCity=PUNE');
    });
  });

  it('requires a selected assessment and makes no request when none is provided', async () => {
    const fetchMock = stubFetch();
    render(<AlternateSourcingView />);

    expect(await screen.findByText(ALTERNATE_SOURCING_UI_STRINGS.ASSESSMENT_REQUIRED)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('moves between the all, single-source, and disclosure tabs', async () => {
    stubFetch();
    await renderLoadedView();

    fireEvent.click(screen.getByRole('button', { name: ALTERNATE_SOURCING_UI_STRINGS.TAB_SINGLE_SOURCE }));
    expect(screen.queryByTestId(FIRST_OPPORTUNITY_TEST_ID)).not.toBeInTheDocument();
    expect(screen.getByTestId('opportunity-card-OPP-ALT-STL-002')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: ALTERNATE_SOURCING_UI_STRINGS.TAB_DISCLOSURES }));
    expect(screen.queryAllByTestId(/^opportunity-card-/)).toHaveLength(0);
    expect(screen.getByText(ALTERNATE_SOURCING_UI_STRINGS.NOTICE_SAVINGS_SAFEGUARD)).toBeInTheDocument();
    expect(screen.getByText(ALTERNATE_SOURCING_UI_STRINGS.NOTICE_PRIVACY_PROTECTION)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: ALTERNATE_SOURCING_UI_STRINGS.TAB_ALL_MATERIALS }));
    expect(screen.getByTestId(FIRST_OPPORTUNITY_TEST_ID)).toBeInTheDocument();
    expect(screen.getByTestId('opportunity-card-OPP-ALT-STL-002')).toBeInTheDocument();
  });
});
