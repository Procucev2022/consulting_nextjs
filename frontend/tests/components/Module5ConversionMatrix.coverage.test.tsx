import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import confetti from 'canvas-confetti';
import { Module5ConversionMatrix } from '../../src/components/Module5ConversionMatrix';
import { EXECUTIVE_OPPORTUNITY_BRIEF_EMAIL_ENDPOINT, UI_STRINGS } from '../../src/constants';
import { mockTenant } from '../fixtures/mockData';
import { authApiClient } from '../../src/utils/authApi';
import type {
  ConversionFunnelPhase,
  SavingsOpportunity,
  SpendCategorySummary,
  TenantMaster,
  UserProfile
} from '../../src/types';

vi.mock('../../src/utils/apiBase', () => ({ getApiBaseUrl: () => 'https://backend.example.test' }));

const module5 = UI_STRINGS.module5;
const EMAIL_ROUTE = `https://backend.example.test${EXECUTIVE_OPPORTUNITY_BRIEF_EMAIL_ENDPOINT}`;

type DispatchResponse = { ok: boolean; json: () => Promise<unknown> };

const buildUser = (overrides: Partial<UserProfile> = {}): UserProfile => ({
  id: 'usr-m5-1',
  name: 'Buyer Coverage',
  email: 'buyer@example.com',
  role: 'USER',
  status: 'ACTIVE',
  ...overrides
});

const buildPhase = (phaseNum: number, metric: string): ConversionFunnelPhase => ({
  phase_num: phaseNum,
  phase_name: `Phase ${phaseNum}`,
  platform_actionable_focus: 'Coverage focus',
  value_outcome_delivered: 'Coverage outcome',
  commercial_lock_in_metric: metric,
  completion_pct: 100,
  status: 'Completed'
});

const funnelStages = [
  buildPhase(1, 'Fallback metric one'),
  buildPhase(2, 'Fallback metric two'),
  buildPhase(3, 'Fallback metric three'),
  buildPhase(4, 'Fallback metric four')
];

const buildCategory = (overrides: Partial<SpendCategorySummary> = {}): SpendCategorySummary => ({
  id: 'cat-m5',
  name: 'Solvents',
  spend_inr_crores: 40,
  lineItemsCount: 120,
  ...overrides
});

const buildOpportunity = (overrides: Partial<SavingsOpportunity> = {}): SavingsOpportunity => ({
  opp_id: 'opp-m5',
  category: 'Packaging',
  current_spend_inr_cr: 20,
  est_savings_inr_cr: 2,
  target_savings_pct: 10,
  estimated_savings_inr_cr: 2,
  ...overrides
});

const dispatchResponse = (body: unknown, ok = true): Promise<DispatchResponse> =>
  Promise.resolve({ ok, json: () => Promise.resolve(body) });

// Records each request so the payload sent to the executive brief endpoint can be inspected.
const recordingFetch = (body: unknown, ok = true) =>
  vi.fn((_input: string, _init?: RequestInit) => dispatchResponse(body, ok));

const sentPayload = (fetchMock: ReturnType<typeof recordingFetch>): Record<string, unknown> => {
  const init = fetchMock.mock.calls[0]?.[1];
  return JSON.parse(String(init?.body)) as Record<string, unknown>;
};

const lockInButton = (): HTMLElement =>
  screen.getByRole('button', { name: new RegExp(module5.lockInButton, 'i') });

// Lock-in requires a positive annual spend, so the default tenant carries evaluated spend.
const SPEND_TENANT: TenantMaster = { ...mockTenant, total_spend_evaluated_inr: 100 };

const renderMatrix = (overrides: Partial<React.ComponentProps<typeof Module5ConversionMatrix>> = {}): void => {
  render(
    <Module5ConversionMatrix
      tenant={SPEND_TENANT}
      funnelStages={funnelStages}
      onOpenReport={vi.fn()}
      {...overrides}
    />
  );
};

describe('Module5ConversionMatrix coverage', () => {
  beforeEach(() => {
    vi.mocked(confetti).mockClear();
    vi.spyOn(authApiClient, 'getStoredToken').mockReturnValue('user-token');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('dispatches the executive brief for the stored user and confirms it with the gateway message id', async () => {
    vi.spyOn(authApiClient, 'getStoredUser').mockReturnValue(buildUser());
    const fetchMock = recordingFetch({ success: true, messageId: 'msg-m5-42' });
    vi.stubGlobal('fetch', fetchMock);

    renderMatrix();
    fireEvent.click(lockInButton());

    expect(await screen.findByText(module5.emailSent('buyer@example.com'))).toBeInTheDocument();
    expect(screen.getAllByText(/buyer@example\.com/).length).toBeGreaterThan(0);
    expect(screen.getByText(/msg-m5-42/)).toBeInTheDocument();
    expect(confetti).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(EMAIL_ROUTE, expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer user-token' }
    }));
    expect(sentPayload(fetchMock)).toMatchObject({ buyerEmail: 'buyer@example.com' });
  });

  it('confirms a successful dispatch without showing a message id when none is returned', async () => {
    vi.spyOn(authApiClient, 'getStoredUser').mockReturnValue(buildUser());
    vi.stubGlobal('fetch', recordingFetch({ success: true }));

    renderMatrix();
    fireEvent.click(lockInButton());

    expect(await screen.findByText(module5.emailSent('buyer@example.com'))).toBeInTheDocument();
    expect(screen.queryByText(/Gateway Message ID/)).not.toBeInTheDocument();
  });

  it('shows the server message when the dispatch is rejected', async () => {
    vi.spyOn(authApiClient, 'getStoredUser').mockReturnValue(buildUser());
    vi.stubGlobal('fetch', recordingFetch({ success: false, message: 'SMTP relay refused the message' }, false));

    renderMatrix();
    fireEvent.click(lockInButton());

    expect(await screen.findByText('SMTP relay refused the message')).toBeInTheDocument();
    expect(screen.queryByText(/Multi-Year Terms Locked In/)).not.toBeInTheDocument();
  });

  it('shows a fallback message when a rejected dispatch carries no server message', async () => {
    vi.spyOn(authApiClient, 'getStoredUser').mockReturnValue(buildUser());
    vi.stubGlobal('fetch', recordingFetch({ success: false }));

    renderMatrix();
    fireEvent.click(lockInButton());

    expect(await screen.findByText(module5.emailError)).toBeInTheDocument();
  });

  it('shows the error message when the dispatch request throws an Error', async () => {
    vi.spyOn(authApiClient, 'getStoredUser').mockReturnValue(buildUser());
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('Connection reset while dispatching'))));

    renderMatrix();
    fireEvent.click(lockInButton());

    expect(await screen.findByText('Connection reset while dispatching')).toBeInTheDocument();
  });

  it('shows a fallback network message when the dispatch rejects without an error message', async () => {
    vi.spyOn(authApiClient, 'getStoredUser').mockReturnValue(buildUser());
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject({})));

    renderMatrix();
    fireEvent.click(lockInButton());

    expect(await screen.findByText(module5.emailNetworkError)).toBeInTheDocument();
  });

  it('requires a signed-in token before dispatching the report', async () => {
    vi.spyOn(authApiClient, 'getStoredUser').mockReturnValue(null);
    vi.spyOn(authApiClient, 'getStoredToken').mockReturnValue(null);
    const fetchMock = recordingFetch({ success: true, messageId: 'msg-m5-0' });
    vi.stubGlobal('fetch', fetchMock);

    renderMatrix();
    fireEvent.click(lockInButton());

    expect(await screen.findByText(UI_STRINGS.errors.auth.sessionExpired)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('keeps the email payload limited to a validated recipient and leaves report data to D1', async () => {
    vi.spyOn(authApiClient, 'getStoredUser').mockReturnValue(buildUser());
    const fetchMock = recordingFetch({ success: true });
    vi.stubGlobal('fetch', fetchMock);

    renderMatrix({
      categories: [buildCategory({ name: 'Packaging', spend_inr_crores: undefined, spend: 18 })],
      opportunities: [buildOpportunity()],
      cleanRecordsCount: 1200
    });
    fireEvent.click(lockInButton());

    expect(await screen.findByText(module5.emailSent('buyer@example.com'))).toBeInTheDocument();
    expect(sentPayload(fetchMock)).toEqual({ buyerEmail: 'buyer@example.com' });
  });

  it('derives the savings rate from D1 opportunities without applying a benchmark floor', () => {
    const tenant = { ...mockTenant, total_spend_evaluated_inr: 100 };
    const { unmount } = render(
      <Module5ConversionMatrix
        tenant={tenant}
        funnelStages={funnelStages}
        onOpenReport={vi.fn()}
        opportunities={[buildOpportunity({ estimated_savings_inr_cr: 5 })]}
      />
    );
    expect(screen.getAllByRole('slider')[1]).toHaveValue('5');
    unmount();

    const { unmount: unmountHigh } = render(
      <Module5ConversionMatrix
        tenant={tenant}
        funnelStages={funnelStages}
        onOpenReport={vi.fn()}
        opportunities={[buildOpportunity({ estimated_savings_inr_cr: 50 })]}
      />
    );
    expect(screen.getAllByRole('slider')[1]).toHaveValue('50');
    unmountHigh();

    render(
      <Module5ConversionMatrix
        tenant={tenant}
        funnelStages={funnelStages}
        onOpenReport={vi.fn()}
        opportunities={[buildOpportunity({ estimated_savings_inr_cr: 0 })]}
      />
    );
    expect(screen.getAllByRole('slider')[1]).toHaveValue('0');
  });

  it('shows the phase metrics from live spend, categories, and clean record counts', () => {
    renderMatrix({
      tenant: { ...mockTenant, total_spend_evaluated_inr: 100 },
      categories: [buildCategory(), buildCategory({ id: 'cat-m5-2', name: 'Packaging' })],
      cleanRecordsCount: 1200
    });

    expect(screen.getAllByText(/1,200 Clean Items Verified/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/2 Categories Mapped/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/100\.00 Cr Evaluated Spend/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Target/).length).toBeGreaterThan(0);
  });

  it('keeps the stage fallback metrics when no live figures are available', () => {
    renderMatrix({ tenant: { ...mockTenant, total_spend_evaluated_inr: 0 }, cleanRecordsCount: 0 });

    expect(screen.getByText('Fallback metric one')).toBeInTheDocument();
    expect(screen.getByText('Fallback metric two')).toBeInTheDocument();
    expect(screen.getByText('Fallback metric three')).toBeInTheDocument();
    expect(screen.getByText('Fallback metric four')).toBeInTheDocument();
  });

  it('disables the lock-in control while the dispatch is pending and confirms it once the response arrives', async () => {
    vi.spyOn(authApiClient, 'getStoredUser').mockReturnValue(buildUser());
    let resolveDispatch: (value: DispatchResponse) => void = () => undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise<DispatchResponse>((resolve) => {
            resolveDispatch = resolve;
          })
      )
    );

    renderMatrix();
    const button = lockInButton();
    fireEvent.click(button);
    expect(button).toBeDisabled();

    resolveDispatch({ ok: true, json: () => Promise.resolve({ success: true }) });
    await waitFor(() => {
      expect(screen.getByText(module5.emailSent('buyer@example.com'))).toBeInTheDocument();
    });
  });
});
