import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import confetti from 'canvas-confetti';
import { ProCPXModal } from '../../../src/components/modals/ProCPXModal';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import frontendLogger from '../../../src/utils/logger';
import type { FrontendLogEntry, LogLevel } from '../../../src/types/logger';
import type { SavingsOpportunity } from '../../../src/types';

// Lets individual tests replace the default baseline and supplier roster that the component reads.
const constantOverrides = vi.hoisted(() => ({
  baseline: undefined as number | undefined,
  suppliers: undefined as readonly string[] | undefined
}));

vi.mock('../../../src/constants', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/constants')>();
  const mocked: Record<string, unknown> = { ...actual };
  Object.defineProperty(mocked, 'DEFAULT_PROCPX_BASELINE', {
    enumerable: true,
    get: () => constantOverrides.baseline ?? actual.DEFAULT_PROCPX_BASELINE
  });
  Object.defineProperty(mocked, 'DEFAULT_INVITED_SUPPLIERS', {
    enumerable: true,
    get: () => constantOverrides.suppliers ?? actual.DEFAULT_INVITED_SUPPLIERS
  });
  return mocked;
});

const proCPX = UI_STRINGS.modals.proCPX;
const LAUNCH_DELAY_MS = 1200;
const CLOSE_DELAY_MS = 1800;

const sampleOpportunity: SavingsOpportunity = {
  opp_id: 'OPP-CPX-001',
  category: 'Logistics & Freight',
  title: 'Global Freight Sourcing & Reverse Auction',
  current_spend: 5000000,
  target_savings_pct: 12,
  est_savings: 180000,
  est_savings_inr_cr: 1.8,
  contract_leak_type: 'Rate creep and unhedged fuel surcharge'
};

function logEntry(level: LogLevel, message: string): FrontendLogEntry {
  return { timestamp: '2026-10-11T12:00:00.000Z', level, service: 'consulting-frontend', message };
}

// Keeps logger output out of test runs while leaving the spies available for assertions.
function silenceLogger(): void {
  vi.spyOn(frontendLogger, 'debug').mockImplementation((message) => logEntry('debug', message));
  vi.spyOn(frontendLogger, 'info').mockImplementation((message) => logEntry('info', message));
  vi.spyOn(frontendLogger, 'warn').mockImplementation((message) => logEntry('warn', message));
  vi.spyOn(frontendLogger, 'error').mockImplementation((message) => logEntry('error', message));
}

describe('ProCPXModal', () => {
  const onClose = vi.fn();
  const onSuccess = vi.fn();

  const renderModal = (opportunity: SavingsOpportunity | null = sampleOpportunity, isOpen = true): void => {
    render(<ProCPXModal opportunity={opportunity} isOpen={isOpen} onClose={onClose} onSuccess={onSuccess} />);
  };

  const launchButton = (): HTMLElement => screen.getByRole('button', { name: proCPX.pushButton });
  const baselineInput = (): HTMLElement => screen.getByRole('spinbutton');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    silenceLogger();
    constantOverrides.baseline = undefined;
    constantOverrides.suppliers = undefined;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders nothing while closed or without an opportunity', () => {
    const { container: closedContainer } = render(
      <ProCPXModal opportunity={sampleOpportunity} isOpen={false} onClose={onClose} onSuccess={onSuccess} />
    );
    expect(closedContainer.firstChild).toBeNull();

    renderModal(null);
    expect(screen.queryByText(proCPX.heading)).not.toBeInTheDocument();
  });

  it('shows the opportunity summary and the supplier cohort for its category', () => {
    renderModal();

    expect(screen.getByText(proCPX.heading)).toBeInTheDocument();
    expect(screen.getByText(proCPX.title)).toBeInTheDocument();
    expect(screen.getByText(sampleOpportunity.category)).toBeInTheDocument();
    expect(screen.getByText(sampleOpportunity.title)).toBeInTheDocument();
    expect(screen.getByText(`$${(180000).toLocaleString()}`)).toBeInTheDocument();
    expect(screen.getByText(sampleOpportunity.contract_leak_type)).toBeInTheDocument();
    expect(screen.getByText(proCPX.supplierCohortLabel(1), { exact: false })).toBeInTheDocument();
    expect(screen.getByText(`${sampleOpportunity.category} Qualified Suppliers`)).toBeInTheDocument();
  });

  it('changes the sourcing mechanism and the target baseline', () => {
    renderModal();

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Reverse Auction' } });
    fireEvent.change(baselineInput(), { target: { value: '2000000' } });

    expect(screen.getByRole('combobox')).toHaveValue('Reverse Auction');
    expect(baselineInput()).toHaveValue(2000000);
  });

  it('shows progress after launch and reports success once the event is deployed', () => {
    renderModal();

    fireEvent.click(launchButton());
    expect(screen.getByRole('button', { name: proCPX.deploying })).toBeDisabled();

    act(() => {
      vi.advanceTimersByTime(LAUNCH_DELAY_MS);
    });
    expect(screen.getByText(proCPX.deployedSuccess)).toBeInTheDocument();
    expect(
      screen.getByText(proCPX.deployedDesc(sampleOpportunity.opp_id, 1, `$${(180000).toLocaleString()}`))
    ).toBeInTheDocument();
    expect(confetti).toHaveBeenCalledWith(expect.objectContaining({ particleCount: 80 }));
    expect(onSuccess).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(CLOSE_DELAY_MS);
    });
    expect(onSuccess).toHaveBeenCalledWith(sampleOpportunity.opp_id);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not launch when the baseline is not a positive number', () => {
    renderModal();

    fireEvent.change(baselineInput(), { target: { value: '' } });
    fireEvent.click(launchButton());

    expect(screen.queryByText(proCPX.deploying)).not.toBeInTheDocument();
    expect(vi.getTimerCount()).toBe(0);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('does not launch when the target savings percentage is above 100', () => {
    renderModal({ ...sampleOpportunity, target_savings_pct: 150 });

    fireEvent.click(launchButton());

    expect(vi.getTimerCount()).toBe(0);
    expect(screen.queryByText(proCPX.deployedSuccess)).not.toBeInTheDocument();
  });

  it('uses the current spend as the baseline when estimated savings are missing', () => {
    renderModal({ ...sampleOpportunity, est_savings: 0 });

    expect(baselineInput()).toHaveValue(5000000);
  });

  it('uses the standard baseline when neither estimated savings nor current spend are available', () => {
    renderModal({ ...sampleOpportunity, est_savings: 0, current_spend: undefined });

    expect(baselineInput()).toHaveValue(1850000);
  });

  it('uses the configured default baseline when one is set', () => {
    constantOverrides.baseline = 750000;
    renderModal({ ...sampleOpportunity, est_savings: 0 });

    expect(baselineInput()).toHaveValue(750000);
  });

  it('uses the configured supplier roster when the opportunity has no category', () => {
    constantOverrides.suppliers = ['Vendor One', 'Vendor Two'];
    renderModal({ ...sampleOpportunity, category: '' });

    expect(screen.getByText(proCPX.supplierCohortLabel(2), { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Vendor One')).toBeInTheDocument();
    expect(screen.getByText('Vendor Two')).toBeInTheDocument();
  });

  it('derives the savings value from INR crores and still reports success when est_savings is absent', () => {
    renderModal({ ...sampleOpportunity, est_savings: undefined, target_savings_pct: undefined });
    const derivedSavings = `$${((1.8 * 10000000) / 83.8).toLocaleString()}`;

    expect(screen.getByText(derivedSavings)).toBeInTheDocument();

    fireEvent.click(launchButton());
    act(() => {
      vi.advanceTimersByTime(LAUNCH_DELAY_MS);
    });

    expect(screen.getByText(proCPX.deployedSuccess)).toBeInTheDocument();
    expect(screen.getByText(proCPX.deployedDesc(sampleOpportunity.opp_id, 1, derivedSavings))).toBeInTheDocument();
  });

  it('shows zero when neither savings figure is available', () => {
    renderModal({ ...sampleOpportunity, est_savings: undefined, est_savings_inr_cr: undefined });

    expect(screen.getByText('$0')).toBeInTheDocument();
  });

  it('cancels without launching the event', () => {
    renderModal();

    fireEvent.click(screen.getByRole('button', { name: proCPX.cancel }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('closes from the header icon', () => {
    renderModal();

    fireEvent.click(screen.getAllByRole('button')[0]);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
