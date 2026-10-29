import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { ProcurementMaturityScorecardView } from '../../../src/components/module2/ProcurementMaturityScorecardView';
import type {
  ProcurementMaturityDimensionAssessment,
  ProcurementMaturityScorecardResult
} from '../../../src/types/module2OpportunityIntelligence';

const buildDimension = (
  overrides: Partial<ProcurementMaturityDimensionAssessment>
): ProcurementMaturityDimensionAssessment => ({
  dimensionKey: 'PRICE_MANAGEMENT',
  dimensionLabel: 'Price Management',
  score: 3,
  maturityLevel: 'BASIC',
  observedCondition: 'Identical IS 2062 plate grades settle 9.9% apart across the three plants.',
  evidence: 'P10 to P90 spread on 6,500 MT of plate purchases.',
  potentialImplication: 'Plant buyers pay different rates for the same plate grade.',
  recommendedAction: 'Set one benchmark price band for IS 2062 plate across all plants.',
  quantifiability: 'QUANTIFIABLE',
  ...overrides
});

const dimensionFixtures: ProcurementMaturityDimensionAssessment[] = [
  buildDimension({}),
  buildDimension({
    dimensionKey: 'VOLUME_MANAGEMENT',
    dimensionLabel: 'Volume Management',
    score: 9,
    maturityLevel: 'OPTIMIZED',
    observedCondition: 'Plate volumes are pooled across plants under one blanket order.',
    recommendedAction: 'Keep the blanket order cadence and extend it to angles and sections.'
  }),
  buildDimension({
    dimensionKey: 'SUPPLIER_MANAGEMENT',
    dimensionLabel: 'Supplier Management',
    score: 7,
    maturityLevel: 'MANAGED',
    observedCondition: 'Three qualified mills supply 92% of plate spend.',
    recommendedAction: 'Scorecard the mills quarterly on delivery and price index.'
  }),
  buildDimension({
    dimensionKey: 'CATEGORY_STRATEGY',
    dimensionLabel: 'Category Strategy',
    score: 5,
    maturityLevel: 'DEVELOPING',
    observedCondition: 'A category plan exists for plates but not for fabrication consumables.',
    recommendedAction: 'Extend the category strategy to welding consumables in the next review cycle.'
  }),
  buildDimension({
    dimensionKey: 'SPECIFICATION_MANAGEMENT',
    dimensionLabel: 'Specification Management',
    score: 2,
    maturityLevel: 'FRAGMENTED',
    observedCondition: 'Plant engineers describe the same 10 mm plate with three different codes.',
    recommendedAction: 'Consolidate plate master data to one standard specification per grade.'
  })
];

const buildMaturityResult = (
  overrides: Partial<ProcurementMaturityScorecardResult> = {}
): ProcurementMaturityScorecardResult => ({
  overallScore: 58,
  overallMaturityLevel: 'DEVELOPING',
  dimensions: dimensionFixtures,
  topWeaknesses: [dimensionFixtures[0], dimensionFixtures[4]],
  topStrengths: [dimensionFixtures[1], dimensionFixtures[2]],
  diagnosticSummary: 'Volume leverage is strong; price and specification control lag behind.',
  ...overrides
});

const expectEveryBadgeToHaveClass = (text: string, colourClass: string): void => {
  const badges = screen.getAllByText(text);
  expect(badges.length).toBeGreaterThan(0);
  badges.forEach((badge) => expect(badge).toHaveClass(colourClass));
};

describe('ProcurementMaturityScorecardView coverage paths', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the unavailable notice without a maturity score when no result is supplied', () => {
    render(<ProcurementMaturityScorecardView />);

    expect(screen.queryByText('/100')).not.toBeInTheDocument();
    expect(screen.queryByText('58')).not.toBeInTheDocument();
  });

  it('shows the overall score and colours each maturity level by its band', () => {
    render(<ProcurementMaturityScorecardView procurementMaturity={buildMaturityResult()} />);

    expect(screen.getByText('58')).toBeInTheDocument();
    expectEveryBadgeToHaveClass('DEVELOPING', 'text-blue-600');
    expectEveryBadgeToHaveClass('OPTIMIZED', 'text-emerald-600');
    expectEveryBadgeToHaveClass('MANAGED', 'text-cyan-600');
    expectEveryBadgeToHaveClass('BASIC', 'text-amber-600');
    expectEveryBadgeToHaveClass('FRAGMENTED', 'text-rose-600');
  });

  it('lists priority weaknesses and core strengths with their dimension scores', () => {
    render(<ProcurementMaturityScorecardView procurementMaturity={buildMaturityResult()} />);

    expect(screen.getAllByText('Price Management').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Specification Management').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Volume Management').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Supplier Management').length).toBeGreaterThan(0);
    expect(screen.getAllByText('3/10').length).toBeGreaterThan(0);
    expect(screen.getAllByText('2/10').length).toBeGreaterThan(0);
    expect(screen.getAllByText('9/10').length).toBeGreaterThan(0);
    expect(screen.getAllByText('7/10').length).toBeGreaterThan(0);
  });

  it('shows the observed condition and recommended action for each dimension', () => {
    render(<ProcurementMaturityScorecardView procurementMaturity={buildMaturityResult()} />);

    dimensionFixtures.forEach((dimension) => {
      expect(screen.getByText(dimension.observedCondition)).toBeInTheDocument();
      expect(screen.getByText(dimension.recommendedAction)).toBeInTheDocument();
    });
  });
});
