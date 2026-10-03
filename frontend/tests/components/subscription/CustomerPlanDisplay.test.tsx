import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CustomerPlanDisplay } from '@/components/subscription/CustomerPlanDisplay';
import { UI_STRINGS, TIER_DISPLAY_CONFIG } from '@/constants';

describe('CustomerPlanDisplay Component', () => {
  it('renders correctly for BRONZE tier with upgrade CTA to Silver', () => {
    const handleUpgrade = vi.fn();
    render(
      <CustomerPlanDisplay
        currentTier="BRONZE"
        onRequestUpgrade={handleUpgrade}
      />
    );

    expect(screen.getByTestId('customer-plan-display')).toBeInTheDocument();
    expect(screen.getByText(TIER_DISPLAY_CONFIG.BRONZE.name)).toBeInTheDocument();
    expect(screen.getByText(TIER_DISPLAY_CONFIG.BRONZE.edition)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.subscription.freePlan)).toBeInTheDocument();

    const upgradeBtn = screen.getByTestId('upgrade-to-silver-btn');
    expect(upgradeBtn).toBeInTheDocument();
    expect(upgradeBtn).toHaveTextContent(UI_STRINGS.subscription.exploreSilver);

    fireEvent.click(upgradeBtn);
    expect(handleUpgrade).toHaveBeenCalledWith('SILVER');
  });

  it('renders correctly for SILVER tier with upgrade CTA to Gold', () => {
    const handleUpgrade = vi.fn();
    render(
      <CustomerPlanDisplay
        currentTier="SILVER"
        onRequestUpgrade={handleUpgrade}
      />
    );

    expect(screen.getByText(TIER_DISPLAY_CONFIG.SILVER.name)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.subscription.activePlan)).toBeInTheDocument();

    const upgradeBtn = screen.getByTestId('upgrade-to-gold-btn');
    expect(upgradeBtn).toBeInTheDocument();
    expect(upgradeBtn).toHaveTextContent(UI_STRINGS.subscription.exploreGold);

    fireEvent.click(upgradeBtn);
    expect(handleUpgrade).toHaveBeenCalledWith('GOLD');
  });

  it('renders correctly for GOLD tier with full access indicator and no upgrade CTA', () => {
    render(
      <CustomerPlanDisplay
        currentTier="GOLD"
      />
    );

    expect(screen.getByText(TIER_DISPLAY_CONFIG.GOLD.name)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.subscription.activePlan)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.subscription.currentAccess)).toBeInTheDocument();
    expect(screen.queryByTestId('upgrade-to-silver-btn')).not.toBeInTheDocument();
    expect(screen.queryByTestId('upgrade-to-gold-btn')).not.toBeInTheDocument();
  });

  it('displays activation required badge when planInfo indicates pending activation', () => {
    render(
      <CustomerPlanDisplay
        currentTier="SILVER"
        planInfo={{
          tier: 'SILVER',
          status: 'PENDING_ACTIVATION',
          commercial_status: 'PAYMENT_RECEIVED',
          is_active: false,
          is_pending_activation: true,
          start_date: '2026-01-01',
          end_date: '2027-01-01',
          entitled_features: []
        }}
      />
    );

    expect(screen.getByText(UI_STRINGS.subscription.activationRequired)).toBeInTheDocument();
  });
});
