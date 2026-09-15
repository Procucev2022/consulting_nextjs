import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LoginBenefitsShowcase } from '../../src/components/LoginBenefitsShowcase';
import { UI_STRINGS } from '../../src/constants';

describe('LoginBenefitsShowcase Component', () => {
  it('should render the prominent aiCEV logo and brand elements', () => {
    render(<LoginBenefitsShowcase />);

    const logo = screen.getByAltText(UI_STRINGS.header.logoAlt);
    expect(logo).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.auth.benefitsBadge)).toBeInTheDocument();
  });

  it('should render the central profit multiplier headline and subtext', () => {
    render(<LoginBenefitsShowcase />);

    expect(screen.getByText(UI_STRINGS.auth.profitHeadline)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.auth.profitMultiplierBadge)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.auth.profitSubtext)).toBeInTheDocument();
  });

  it('should render all 3 core technology advantage pillars', () => {
    render(<LoginBenefitsShowcase />);

    // Pillar 1: Cost Savings
    expect(screen.getByText(UI_STRINGS.auth.benefitCostSavingsTitle)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.auth.benefitCostSavingsDesc)).toBeInTheDocument();

    // Pillar 2: Strategic Sourcing
    expect(screen.getByText(UI_STRINGS.auth.benefitStrategicSourcingTitle)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.auth.benefitStrategicSourcingDesc)).toBeInTheDocument();

    // Pillar 3: Roadmap
    expect(screen.getByText(UI_STRINGS.auth.benefitRoadmapTitle)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.auth.benefitRoadmapDesc)).toBeInTheDocument();
  });

  it('should render quantified ROI metrics ribbon when showMetrics is true', () => {
    render(<LoginBenefitsShowcase showMetrics={true} />);

    expect(screen.getByText(UI_STRINGS.auth.statDirectEbitda)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.auth.statDirectEbitdaLabel)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.auth.statSavingsUnlocked)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.auth.statAccuracyRate)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.auth.statTypicalRoi)).toBeInTheDocument();
  });

  it('should hide metrics ribbon when showMetrics is false and apply custom className', () => {
    const { container } = render(
      <LoginBenefitsShowcase showMetrics={false} className="custom-test-class" />
    );

    expect(screen.queryByText(UI_STRINGS.auth.statDirectEbitdaLabel)).not.toBeInTheDocument();
    expect(container.firstChild).toHaveClass('custom-test-class');
  });

  it('should render security badge and engine version in footer', () => {
    render(<LoginBenefitsShowcase />);

    expect(screen.getByText(UI_STRINGS.header.securityBadge)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.header.engineVersion)).toBeInTheDocument();
  });
});
