import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { PCBIHistoricalObservationsPanel } from '../../../../src/components/admin/pcbi/PCBIHistoricalObservationsPanel';
import { PCBI_HISTORICAL_DISPLAY_DECIMAL_PLACES, PCBI_HISTORICAL_DISPLAY_LOCALE } from '../../../../src/constants/pcbiHistorical';
import { UI_STRINGS } from '../../../../src/constants/uiStrings';
import { pcbiApiClient } from '../../../../src/utils/pcbiApi';
import frontendLogger from '../../../../src/utils/logger';
import type { PcbiHistoricalObservationsResponse } from '../../../../src/types/validation';

const observation = {
  pcbi_id: 'PCBI-IND-COP-ROD-001',
  observation_date: '2021-04-01',
  value_inr: 695420,
  original_value: 9320,
  original_currency: 'USD',
  fx_rate: 74.6159,
  unit: 'INR/MT',
  source: 'LME/JPC',
  status: 'VALIDATED',
  observation_frequency: 'MONTHLY' as const
};

const historicalResponse = (observations = [observation]): PcbiHistoricalObservationsResponse => ({
  success: true,
  data: { archiveOnly: true, frequency: 'MONTHLY', count: observations.length, observations }
});

describe('PCBIHistoricalObservationsPanel', () => {
  afterEach(() => vi.restoreAllMocks());

  it('shows the archive disclaimer, original values, FX rate, source, and status', async () => {
    vi.spyOn(pcbiApiClient, 'getPCBIHistoricalObservations').mockResolvedValue(historicalResponse());
    vi.spyOn(frontendLogger, 'error').mockImplementation(() => ({}) as never);

    render(<PCBIHistoricalObservationsPanel />);

    expect(await screen.findByRole('heading', { name: UI_STRINGS.pcbiAdmin.historicalObservationsTitle })).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.pcbiAdmin.historicalObservationsDescription)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.pcbiAdmin.historicalArchiveBadge)).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: UI_STRINGS.pcbiAdmin.historicalColCurrency })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: UI_STRINGS.pcbiAdmin.historicalColFxRate })).toBeInTheDocument();
    expect(screen.getByText(observation.pcbi_id)).toBeInTheDocument();
    expect(screen.getByText(observation.observation_date)).toBeInTheDocument();
    expect(screen.getByText(observation.original_currency)).toBeInTheDocument();
    expect(screen.getByText(observation.source)).toBeInTheDocument();
    expect(screen.getByText(observation.status)).toBeInTheDocument();
    expect(screen.getByText(new Intl.NumberFormat(PCBI_HISTORICAL_DISPLAY_LOCALE, {
      maximumFractionDigits: PCBI_HISTORICAL_DISPLAY_DECIMAL_PLACES
    }).format(observation.value_inr))).toBeInTheDocument();
  });

  it('shows a loading status while the history request is pending', async () => {
    let resolveRequest: ((response: PcbiHistoricalObservationsResponse) => void) | undefined;
    vi.spyOn(pcbiApiClient, 'getPCBIHistoricalObservations').mockImplementation(() => new Promise((resolve) => {
      resolveRequest = resolve;
    }));
    vi.spyOn(frontendLogger, 'error').mockImplementation(() => ({}) as never);

    render(<PCBIHistoricalObservationsPanel />);

    expect(screen.getByRole('status')).toHaveTextContent(UI_STRINGS.pcbiAdmin.historicalObservationsLoading);
    await act(async () => resolveRequest?.(historicalResponse([])));
    await waitFor(() => expect(screen.getByText(UI_STRINGS.pcbiAdmin.historicalObservationsEmpty)).toBeInTheDocument());
  });

  it('ignores a history response after the panel unmounts', async () => {
    let resolveRequest: ((response: PcbiHistoricalObservationsResponse) => void) | undefined;
    vi.spyOn(pcbiApiClient, 'getPCBIHistoricalObservations').mockImplementation(() => new Promise((resolve) => {
      resolveRequest = resolve;
    }));
    vi.spyOn(frontendLogger, 'error').mockImplementation(() => ({}) as never);
    const { unmount } = render(<PCBIHistoricalObservationsPanel />);

    unmount();
    await act(async () => resolveRequest?.(historicalResponse([])));

    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('shows an empty state for an archive with no observations', async () => {
    vi.spyOn(pcbiApiClient, 'getPCBIHistoricalObservations').mockResolvedValue(historicalResponse([]));
    vi.spyOn(frontendLogger, 'error').mockImplementation(() => ({}) as never);

    render(<PCBIHistoricalObservationsPanel />);

    expect(await screen.findByText(UI_STRINGS.pcbiAdmin.historicalObservationsEmpty)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.pcbiAdmin.historicalObservationsCount(0))).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('shows a descriptive error and retries the request', async () => {
    const api = vi.spyOn(pcbiApiClient, 'getPCBIHistoricalObservations')
      .mockRejectedValueOnce(new Error('Worker unavailable'))
      .mockResolvedValueOnce(historicalResponse([]));
    vi.spyOn(frontendLogger, 'error').mockImplementation(() => ({}) as never);

    render(<PCBIHistoricalObservationsPanel />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      UI_STRINGS.pcbiAdmin.historicalObservationsLoadFailed('Worker unavailable')
    );
    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.pcbiAdmin.historicalObservationsRetry }));

    await waitFor(() => expect(api).toHaveBeenCalledTimes(2));
    expect(await screen.findByText(UI_STRINGS.pcbiAdmin.historicalObservationsEmpty)).toBeInTheDocument();
  });
});
