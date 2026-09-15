import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TierMaskOverlay } from '../../src/components/TierMaskOverlay';
import { UI_STRINGS } from '../../src/constants';

describe('TierMaskOverlay Component (components/TierMaskOverlay.tsx)', () => {
  it('should render Gold tier badge, title, and description', () => {
    render(
      <TierMaskOverlay
        requiredTier="GOLD"
        title="Opportunity Levers Locked"
        description="Specific savings generation actions require Gold Customer tier."
      />
    );

    expect(screen.getByTestId('tier-mask-overlay')).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.subscription.tierGoldBadge)).toBeInTheDocument();
    expect(screen.getByText('Opportunity Levers Locked')).toBeInTheDocument();
    expect(
      screen.getByText('Specific savings generation actions require Gold Customer tier.')
    ).toBeInTheDocument();
  });

  it('should render Silver tier badge and trigger upgrade callback', () => {
    const handleUpgrade = vi.fn();
    render(
      <TierMaskOverlay
        requiredTier="SILVER"
        title="Module 2 Locked"
        description="Please upgrade to Silver to view categorization summary."
        onUpgrade={handleUpgrade}
      />
    );

    expect(screen.getByText(UI_STRINGS.subscription.tierSilverBadge)).toBeInTheDocument();
    const btn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.subscription.upgradeToSilver, 'i') });
    expect(btn).toBeInTheDocument();

    fireEvent.click(btn);
    expect(handleUpgrade).toHaveBeenCalledTimes(1);
  });

  it('should render custom ctaText when provided', () => {
    const handleUpgrade = vi.fn();
    render(
      <TierMaskOverlay
        requiredTier="GOLD"
        title="Locked Stage"
        description="Locked stage text"
        onUpgrade={handleUpgrade}
        ctaText="Unlock Now"
      />
    );

    expect(screen.getByRole('button', { name: /unlock now/i })).toBeInTheDocument();
  });

  it('should render summary visibility badge when isSummaryVisible is true', () => {
    render(
      <TierMaskOverlay
        requiredTier="GOLD"
        title="Deep Line Items"
        description="Summary is available above"
        isSummaryVisible={true}
      />
    );

    expect(screen.getByText(UI_STRINGS.subscription.savingsAvailableSummaryOnly)).toBeInTheDocument();
  });

  it('should not render upgrade button if onUpgrade is not provided', () => {
    render(
      <TierMaskOverlay
        requiredTier="GOLD"
        title="Informational Lock"
        description="No self-serve upgrade"
      />
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
