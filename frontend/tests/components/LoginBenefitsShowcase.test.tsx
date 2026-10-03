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

  it('should render customer-centric hero headline and supporting lines', () => {
    render(<LoginBenefitsShowcase />);

    expect(screen.getByText(UI_STRINGS.auth.heroHeadline)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.auth.heroSecondLine)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.auth.heroSupportingText)).toBeInTheDocument();
  });

  it('should render the 3 connected product journey stages', () => {
    render(<LoginBenefitsShowcase />);

    expect(screen.getByText(UI_STRINGS.auth.modelTitle)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.auth.stage1Name)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.auth.stage2Name)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.auth.stage3Name)).toBeInTheDocument();

    expect(screen.getByText(UI_STRINGS.auth.stage1Tier)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.auth.stage2Tier)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.auth.stage3Tier)).toBeInTheDocument();
  });

  it('should render all 4 concise procurement benefit cards', () => {
    render(<LoginBenefitsShowcase />);

    expect(screen.getByText(UI_STRINGS.auth.benefitCostSavingsTitle)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.auth.benefitCostSavingsDesc)).toBeInTheDocument();

    expect(screen.getByText(UI_STRINGS.auth.benefitStrategicSourcingTitle)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.auth.benefitStrategicSourcingDesc)).toBeInTheDocument();

    expect(screen.getByText(UI_STRINGS.auth.benefitBenchmarkTitle)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.auth.benefitBenchmarkDesc)).toBeInTheDocument();

    expect(screen.getByText(UI_STRINGS.auth.benefitRoadmapTitle)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.auth.benefitRoadmapDesc)).toBeInTheDocument();
  });

  it('should render factual capability metrics ribbon when showMetrics is true', () => {
    render(<LoginBenefitsShowcase showMetrics={true} />);

    expect(screen.getByText(UI_STRINGS.auth.statDirectEbitda)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.auth.statDirectEbitdaLabel)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.auth.statSavingsUnlocked)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.auth.statSavingsLabel)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.auth.statAccuracyRate)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.auth.statAccuracyLabel)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.auth.statTypicalRoi)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.auth.statTypicalRoiLabel)).toBeInTheDocument();
  });

  it('should hide metrics ribbon when showMetrics is false and apply custom className', () => {
    const { container } = render(
      <LoginBenefitsShowcase showMetrics={false} className="custom-test-class" />
    );

    expect(screen.queryByText(UI_STRINGS.auth.statDirectEbitdaLabel)).not.toBeInTheDocument();
    expect(container.firstChild).toHaveClass('custom-test-class');
  });

  it('should render restrained trust statement and engine footer', () => {
    render(<LoginBenefitsShowcase />);

    expect(screen.getByText(UI_STRINGS.auth.trustTitle)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.auth.trustSubtext)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.header.engineVersion)).toBeInTheDocument();
  });
});
