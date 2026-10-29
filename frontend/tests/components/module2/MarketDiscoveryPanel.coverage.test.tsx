/**
 * Module 2 — Market Discovery Panel coverage tests.
 * Covers the unavailable fallback, the required (amber) and sufficient-evidence (emerald) banners,
 * severity-tagged structural triggers, and the empty trigger state.
 * Fixtures model a steel-plate procurement category (IS 2062 E250 hot-rolled plate).
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MarketDiscoveryPanel } from '../../../src/components/module2/MarketDiscoveryPanel';
import type { MarketDiscoveryAssessment } from '../../../src/types/module2OpportunityIntelligence';

const requiredMarketDiscovery: MarketDiscoveryAssessment = {
  isMarketDiscoveryRequired: true,
  discoveryStatus: 'MARKET_DISCOVERY_REQUIRED',
  discoveryStatusLabel: 'Market Discovery Required',
  triggers: [
    {
      triggerKey: 'SINGLE_MILL_DEPENDENCE',
      triggerLabel: 'Single Mill Dependence',
      observedCondition: 'One integrated mill supplies 91% of IS 2062 E250 plate volume across 38 POs.',
      structuralImpact: 'No internal price tension exists to test mill quotations against.',
      severity: 'HIGH'
    },
    {
      triggerKey: 'STALE_PRICE_BENCHMARK',
      triggerLabel: 'Stale Price Benchmark',
      observedCondition: 'The latest external plate benchmark is 14 months old against the HRC index.',
      structuralImpact: 'Benchmark drift may understate the landed price gap on imported coils.',
      severity: 'MEDIUM'
    }
  ],
  diagnosticRationale: 'Internal plate purchases show no competing supplier price points in the last 12 months.',
  marketTestingRecommendation:
    'Issue a competitive RFQ to at least five plate mills using the standard IS 2062 E250 specification.',
  recommendedSourcingVehicle: 'RUN_COMPETITIVE_RFQ',
  confidence: 'MEDIUM'
};

const sufficientEvidenceMarketDiscovery: MarketDiscoveryAssessment = {
  isMarketDiscoveryRequired: false,
  discoveryStatus: 'SUFFICIENT_INTERNAL_EVIDENCE',
  discoveryStatusLabel: 'Sufficient Internal Evidence',
  triggers: [],
  diagnosticRationale: 'Three qualified mills quote plate prices within a 4% band across the assessment window.',
  marketTestingRecommendation: 'Maintain quarterly benchmark checks against the HRC index.',
  recommendedSourcingVehicle: 'SOURCING_STUDY',
  confidence: 'HIGH'
};

describe('MarketDiscoveryPanel coverage', () => {
  it('renders only the unavailable placeholder when no assessment is supplied', () => {
    const { container } = render(<MarketDiscoveryPanel />);

    expect(container).not.toBeEmptyDOMElement();
    expect(screen.queryByText(requiredMarketDiscovery.discoveryStatusLabel)).not.toBeInTheDocument();
    expect(screen.queryByText(requiredMarketDiscovery.triggers[0].triggerLabel)).not.toBeInTheDocument();
  });

  it('renders the amber required banner with severity-tagged triggers and the sourcing vehicle', () => {
    render(<MarketDiscoveryPanel marketDiscovery={requiredMarketDiscovery} />);

    expect(screen.getByText(requiredMarketDiscovery.discoveryStatusLabel).closest('.rounded-xl')).toHaveClass(
      'bg-amber-50'
    );
    expect(screen.getByText(requiredMarketDiscovery.diagnosticRationale)).toBeInTheDocument();
    expect(
      screen.getByText(requiredMarketDiscovery.recommendedSourcingVehicle.replace(/_/g, ' '))
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 4 })).toHaveTextContent(
      `(${requiredMarketDiscovery.triggers.length})`
    );

    const [highTrigger, mediumTrigger] = requiredMarketDiscovery.triggers;
    expect(screen.getByText(highTrigger.triggerLabel)).toBeInTheDocument();
    expect(screen.getByText(highTrigger.observedCondition)).toBeInTheDocument();
    expect(screen.getByText(highTrigger.structuralImpact)).toBeInTheDocument();
    expect(screen.getByText(highTrigger.severity)).toHaveClass('bg-rose-100');
    expect(screen.getByText(mediumTrigger.triggerLabel)).toBeInTheDocument();
    expect(screen.getByText(mediumTrigger.severity)).toHaveClass('bg-amber-100');
    expect(screen.getByText(requiredMarketDiscovery.marketTestingRecommendation)).toBeInTheDocument();
  });

  it('renders the emerald banner and no trigger cards when no structural triggers exist', () => {
    render(<MarketDiscoveryPanel marketDiscovery={sufficientEvidenceMarketDiscovery} />);

    expect(screen.getByText(sufficientEvidenceMarketDiscovery.discoveryStatusLabel).closest('.rounded-xl')).toHaveClass(
      'bg-emerald-50'
    );
    expect(screen.getByRole('heading', { level: 4 })).toHaveTextContent('(0)');
    expect(screen.queryByText(requiredMarketDiscovery.triggers[0].triggerLabel)).not.toBeInTheDocument();
    expect(screen.getByText(sufficientEvidenceMarketDiscovery.diagnosticRationale)).toBeInTheDocument();
    expect(screen.getByText(sufficientEvidenceMarketDiscovery.marketTestingRecommendation)).toBeInTheDocument();
  });
});
