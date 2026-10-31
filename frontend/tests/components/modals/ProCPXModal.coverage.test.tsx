import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ProCPXModal } from '../../../src/components/modals/ProCPXModal';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import frontendLogger from '../../../src/utils/logger';
import { apiClient } from '../../../src/utils/api';
import type { FrontendLogEntry, LogLevel } from '../../../src/types/logger';
import type { SavingsOpportunity, VendorPriceRank } from '../../../src/types';

const proCPX = UI_STRINGS.modals.proCPX;
const supplier: VendorPriceRank = {
  vendor_id: 'VENDOR-001',
  vendor_name: 'Database Supplier',
  category: 'Logistics & Freight'
};
const sampleOpportunity: SavingsOpportunity = {
  opp_id: 'OPP-CPX-001',
  category: 'Logistics & Freight',
  title: 'Global Freight Sourcing & Reverse Auction',
  current_spend_inr_cr: 5,
  target_savings_pct: 12,
  est_savings_inr_cr: 1.8,
  contract_leak_type: 'Rate creep and unhedged fuel surcharge'
};

function logEntry(level: LogLevel, message: string): FrontendLogEntry {
  return { timestamp: '2026-10-11T12:00:00.000Z', level, service: 'consulting-frontend', message };
}

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

  const flushSupplierLoad = async (): Promise<void> => {
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
  };

  const selectSupplier = async (): Promise<void> => {
    await flushSupplierLoad();
    fireEvent.click(screen.getByRole('checkbox', { name: supplier.vendor_name }));
  };

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.clearAllMocks();
    silenceLogger();
    vi.spyOn(apiClient, 'getVendors').mockResolvedValue({ vendorRankings: [supplier], vendorDetails: [] });
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

  it('loads supplier candidates from D1 and lets the user select them', async () => {
    vi.spyOn(apiClient, 'getVendors').mockResolvedValue({
      vendorRankings: [supplier, { ...supplier, vendor_id: 'VENDOR-DUPLICATE' }],
      vendorDetails: []
    });
    renderModal();
    await flushSupplierLoad();

    expect(screen.getByText(proCPX.heading)).toBeInTheDocument();
    expect(screen.getByText(proCPX.title)).toBeInTheDocument();
    expect(screen.getAllByText(sampleOpportunity.category)).toHaveLength(2);
    expect(screen.getByText(sampleOpportunity.title)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.common.croreAmount('1.80'))).toBeInTheDocument();
    expect(screen.getByText(sampleOpportunity.contract_leak_type)).toBeInTheDocument();
    expect(screen.getAllByRole('checkbox', { name: supplier.vendor_name })).toHaveLength(1);
    expect(launchButton()).toBeDisabled();

    fireEvent.click(screen.getByRole('checkbox', { name: supplier.vendor_name }));
    expect(screen.getByText(proCPX.supplierCohortLabel(1))).toBeInTheDocument();
    expect(launchButton()).toBeEnabled();
    fireEvent.click(screen.getByRole('checkbox', { name: supplier.vendor_name }));
    expect(launchButton()).toBeDisabled();
  });

  it('changes the sourcing mechanism and the target baseline', () => {
    renderModal();

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Reverse Auction' } });
    fireEvent.change(baselineInput(), { target: { value: '20' } });

    expect(screen.getByRole('combobox')).toHaveValue('Reverse Auction');
    expect(baselineInput()).toHaveValue(20);
  });

  it('records the D1 handoff after selecting a supplier without claiming external dispatch', async () => {
    renderModal();
    await selectSupplier();

    fireEvent.click(launchButton());
    expect(screen.getByRole('button', { name: proCPX.deploying })).toBeDisabled();

    expect(await screen.findByText(proCPX.deployedSuccess)).toBeInTheDocument();
    expect(screen.getByText(proCPX.deployedDesc)).toBeInTheDocument();
    expect(onSuccess).toHaveBeenCalledWith(sampleOpportunity.opp_id);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('does not launch when the baseline is not positive', async () => {
    renderModal();
    await selectSupplier();

    fireEvent.change(baselineInput(), { target: { value: '' } });
    expect(launchButton()).toBeDisabled();
    fireEvent.click(launchButton());

    expect(screen.queryByText(proCPX.deploying)).not.toBeInTheDocument();
    expect(vi.getTimerCount()).toBe(0);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('does not launch when the target savings percentage exceeds its validation limit', async () => {
    renderModal({ ...sampleOpportunity, target_savings_pct: 150 });
    await selectSupplier();

    fireEvent.click(launchButton());

    expect(vi.getTimerCount()).toBe(0);
    expect(screen.queryByText(proCPX.deployedSuccess)).not.toBeInTheDocument();
  });

  it('uses the D1 opportunity current spend and displays zero when savings are absent', () => {
    renderModal({ ...sampleOpportunity, est_savings_inr_cr: undefined, est_savings: undefined });

    expect(baselineInput()).toHaveValue(5);
    expect(screen.getByText(UI_STRINGS.common.croreAmount('0.00'))).toBeInTheDocument();
  });

  it('does not invent a baseline or supplier when the D1 records are missing', async () => {
    vi.spyOn(apiClient, 'getVendors').mockResolvedValue({ vendorRankings: [], vendorDetails: [] });
    renderModal({ ...sampleOpportunity, current_spend_inr_cr: undefined });
    await flushSupplierLoad();

    expect(baselineInput()).toHaveValue(0);
    expect(screen.getByText(proCPX.noSuppliersAvailable)).toBeInTheDocument();
    expect(launchButton()).toBeDisabled();
  });

  it('shows a database-specific message when supplier records fail to load', async () => {
    vi.spyOn(apiClient, 'getVendors').mockRejectedValue(new Error('D1 unavailable'));
    renderModal();
    await flushSupplierLoad();

    expect(screen.getByRole('alert')).toHaveTextContent(proCPX.supplierLoadFailed);
    expect(launchButton()).toBeDisabled();
    expect(frontendLogger.warn).toHaveBeenCalled();
  });

  it('closes without launching', () => {
    renderModal();

    fireEvent.click(screen.getByRole('button', { name: proCPX.cancel }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
