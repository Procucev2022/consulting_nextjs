import React from 'react';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { act, render, screen, fireEvent } from '@testing-library/react';
import confetti from 'canvas-confetti';
import { Module5ConversionMatrix } from '../../src/components/Module5ConversionMatrix';
import { mockTenant, mockConversionFunnel } from '../fixtures/mockData';
import { UI_STRINGS } from '../../src/constants/uiStrings';
import { authApiClient } from '../../src/utils/authApi';

vi.mock('../../src/utils/apiBase', () => ({ getApiBaseUrl: () => 'https://backend.example.test' }));

describe('Module5ConversionMatrix Component', () => {
  beforeEach(() => {
    vi.spyOn(authApiClient, 'getStoredToken').mockReturnValue('test-user-token');
  });
  afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });
  it('renders all funnel stages and conversion matrix cards', () => {
    const onOpenReport = vi.fn();
    render(
      <Module5ConversionMatrix
        tenant={mockTenant}
        funnelStages={mockConversionFunnel}
        onOpenReport={onOpenReport}
      />
    );

    expect(screen.getByText(UI_STRINGS.module5.badge)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.module5.calculatorTitle)).toBeInTheDocument();
  });

  it('updates sliders and triggers simulate lock-in confetti', async () => {
    const sendEmail = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, messageId: 'EMAIL-COMMERCIAL-1' })
    } as Response);
    render(
      <Module5ConversionMatrix
        tenant={mockTenant}
        funnelStages={mockConversionFunnel}
        onOpenReport={vi.fn()}
      />
    );

    const sliders = screen.getAllByRole('slider');
    expect(sliders.length).toBe(3);

    // Change annual spend slider
    fireEvent.change(sliders[0], { target: { value: '1000' } });

    // Change savings rate slider
    fireEvent.change(sliders[1], { target: { value: '20' } });

    // Change fee rate slider
    fireEvent.change(sliders[2], { target: { value: '1.2' } });

    // Click lock in button
    const lockInBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.module5.lockInButton, 'i') });
    await act(async () => { fireEvent.click(lockInBtn); });
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(confetti).toHaveBeenCalled();

    // Test zero fee rate to exercise || 1 fallback
    fireEvent.change(sliders[2], { target: { value: '0' } });
    await act(async () => { fireEvent.click(lockInBtn); });

    // Test non-positive annual spend to exercise validation return early
    fireEvent.change(sliders[0], { target: { value: '0' } });
    await act(async () => { fireEvent.click(lockInBtn); });
  });


  it('triggers onOpenReport when clicking Generate Executive Brief button', () => {
    const onOpenReport = vi.fn();
    render(
      <Module5ConversionMatrix
        tenant={mockTenant}
        funnelStages={mockConversionFunnel}
        onOpenReport={onOpenReport}
      />
    );

    const openReportBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.module5.generateBrief, 'i') });
    fireEvent.click(openReportBtn);
    expect(onOpenReport).toHaveBeenCalled();
  });

  it('renders masked overlay for Bronze customer and handles upgrade to silver', () => {
    const onUpgrade = vi.fn();
    render(
      <Module5ConversionMatrix
        tenant={mockTenant}
        funnelStages={mockConversionFunnel}
        onOpenReport={vi.fn()}
        currentTier="BRONZE"
        onUpgrade={onUpgrade}
      />
    );

    const upgradeBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.subscription.upgradeToSilver, 'i') });
    expect(upgradeBtn).toBeInTheDocument();
    fireEvent.click(upgradeBtn);
    expect(onUpgrade).toHaveBeenCalledWith('SILVER');
  });
});

