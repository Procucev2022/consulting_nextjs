/**
 * Module 2 — Commercial Excellence Panel coverage tests.
 * Exercises the unavailable-profile fallback and every commercial dimension status tone
 * using a steel-plate procurement profile (IS 2062 E250 hot-rolled plate supply).
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CommercialExcellencePanel } from '../../../src/components/module2/CommercialExcellencePanel';
import type {
  CategoryCommercialExcellenceProfile,
  CommercialDimensionAssessment,
  CommercialDimensionStatus
} from '../../../src/types/module2OpportunityIntelligence';

const buildDimension = (overrides: Partial<CommercialDimensionAssessment>): CommercialDimensionAssessment => ({
  dimensionKey: 'PAYMENT_TERMS',
  dimensionLabel: 'Payment Terms & Working Capital',
  status: 'OPPORTUNITY_IDENTIFIED',
  statusLabel: 'Opportunity Identified',
  currentCondition: 'Net 30 on HR plate invoices raised by three integrated mills.',
  observedEvidence: 'Average days-to-pay of 30 across 42 plate invoices in the assessment window.',
  potentialImplication: 'Working capital is tied up for 30 days on roughly ₹2.4 Cr of annual plate spend.',
  recommendedAction: 'Negotiate Net 60 aligned with the mill credit cycle.',
  isQuantifiable: false,
  estimatedBenefitInr: null,
  confidence: 'HIGH',
  ...overrides
});

const steelPlateCommercialProfile: CategoryCommercialExcellenceProfile = {
  overallStatus: 'PARTIALLY_OPTIMIZED',
  overallStatusLabel: 'Mixed Maturity Across Plate Terms',
  dimensions: [
    buildDimension({
      dimensionKey: 'PAYMENT_TERMS',
      dimensionLabel: 'Payment Terms & Working Capital',
      status: 'OPPORTUNITY_IDENTIFIED',
      statusLabel: 'Opportunity Identified'
    }),
    buildDimension({
      dimensionKey: 'CONTRACT_COVERAGE',
      dimensionLabel: 'Rate Contract Coverage',
      status: 'OPTIMIZED',
      statusLabel: 'Fully Covered',
      currentCondition: 'Annual rate contracts cover 88% of IS 2062 E250 plate volume.',
      potentialImplication: 'Price exposure is limited to the uncovered 12% of plate volume.',
      recommendedAction: 'Renew the rate contracts 60 days before expiry.',
      confidence: 'HIGH'
    }),
    buildDimension({
      dimensionKey: 'ESCALATION_CLAUSE',
      dimensionLabel: 'Price Escalation Clauses',
      status: 'PARTIALLY_OPTIMIZED',
      statusLabel: 'Partly Indexed',
      currentCondition: 'Only one mill links plate prices to the HRC index.',
      potentialImplication: 'Two mills can reprice plates without a published index reference.',
      recommendedAction: 'Extend index-linked escalation to the remaining two mills.',
      confidence: 'MEDIUM'
    }),
    buildDimension({
      dimensionKey: 'REBATE_STRUCTURE',
      dimensionLabel: 'Volume Rebate Structure',
      status: 'INSUFFICIENT_DATA',
      statusLabel: 'Awaiting Rebate Ledger',
      currentCondition: 'No rebate ledger was present in the uploaded source data.',
      observedEvidence: 'Credit memos for plate supply were not identifiable.',
      potentialImplication: 'Rebate value cannot be quantified until the ledger is supplied.',
      recommendedAction: 'Request mill rebate statements for the last 12 months.',
      confidence: 'INSUFFICIENT'
    })
  ],
  optimizedCount: 1,
  partiallyOptimizedCount: 1,
  opportunityIdentifiedCount: 1,
  insufficientDataCount: 1,
  keyFindings: ['Payment terms offer a 30-day working capital gain on plate supply.'],
  strategicActionSummary: 'Harmonise plate supply terms across three mills into one rate-contract template.'
};

const TONE_CLASS_BY_STATUS: Record<CommercialDimensionStatus, string> = {
  OPTIMIZED: 'bg-emerald-100',
  PARTIALLY_OPTIMIZED: 'bg-blue-100',
  OPPORTUNITY_IDENTIFIED: 'bg-amber-100',
  INSUFFICIENT_DATA: 'bg-slate-100'
};

describe('CommercialExcellencePanel coverage', () => {
  it('renders only the unavailable placeholder when no profile is supplied', () => {
    const { container } = render(<CommercialExcellencePanel />);

    expect(container).not.toBeEmptyDOMElement();
    expect(screen.queryByText(steelPlateCommercialProfile.overallStatusLabel)).not.toBeInTheDocument();
    expect(screen.queryByText(steelPlateCommercialProfile.dimensions[0].dimensionLabel)).not.toBeInTheDocument();
  });

  it('renders the overall status, every dimension, and the strategic roadmap summary', () => {
    render(<CommercialExcellencePanel commercialExcellence={steelPlateCommercialProfile} />);

    expect(screen.getByText(steelPlateCommercialProfile.overallStatusLabel)).toBeInTheDocument();
    steelPlateCommercialProfile.dimensions.forEach((dimension) => {
      expect(screen.getByText(dimension.dimensionLabel)).toBeInTheDocument();
      expect(screen.getByText(dimension.currentCondition)).toBeInTheDocument();
      expect(screen.getByText(dimension.recommendedAction)).toBeInTheDocument();
    });
    expect(screen.getByText(steelPlateCommercialProfile.strategicActionSummary)).toBeInTheDocument();
  });

  it('applies the tone class that matches each dimension status', () => {
    render(<CommercialExcellencePanel commercialExcellence={steelPlateCommercialProfile} />);

    steelPlateCommercialProfile.dimensions.forEach((dimension) => {
      expect(screen.getByText(dimension.statusLabel)).toHaveClass(TONE_CLASS_BY_STATUS[dimension.status]);
    });
  });
});
