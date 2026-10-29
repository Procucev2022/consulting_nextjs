/**
 * Module 2 coverage: ActionRecommendationPanel fallback, priority badge colours, and every sourcing action label.
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActionRecommendationPanel } from '../../../src/components/module2/ActionRecommendationPanel';
import type {
  ActionRecommendationOutput,
  SourcingNextAction
} from '../../../src/types/module2OpportunityIntelligence';
import { buildActionRecommendation } from '../../fixtures/module2CoverageFixtures';

const ALL_SOURCING_ACTIONS: SourcingNextAction[] = [
  'RUN_E_AUCTION',
  'RUN_RFQ',
  'CONSOLIDATE_VOLUME',
  'CONSOLIDATE_SUPPLIERS',
  'HARMONIZE_SPECIFICATIONS',
  'SEPARATE_CATEGORY_SOURCING',
  'NEGOTIATE_COMMERCIAL_TERMS',
  'REVIEW_CONTRACT',
  'PERFORM_MARKET_DISCOVERY',
  'COLLECT_MISSING_DATA',
  'MONITOR'
];

describe('ActionRecommendationPanel coverage', () => {
  it('omits the roadmap content when no recommendation is supplied', () => {
    const recommendation = buildActionRecommendation();
    render(<ActionRecommendationPanel />);

    expect(screen.queryByText(recommendation.whatWeFound)).not.toBeInTheDocument();
    expect(screen.queryByText(/^\d+\. /)).not.toBeInTheDocument();
  });

  it('renders the analysis pillars from the recommendation', () => {
    const recommendation = buildActionRecommendation();
    render(<ActionRecommendationPanel actionRecommendation={recommendation} />);

    expect(screen.getByText(recommendation.whatWeFound)).toBeInTheDocument();
    expect(screen.getByText(recommendation.whyItMatters)).toBeInTheDocument();
    expect(screen.getByText(recommendation.whatWeCanQuantify)).toBeInTheDocument();
    expect(screen.getByText(recommendation.whatShouldBeTested)).toBeInTheDocument();
  });

  it.each<[ActionRecommendationOutput['priorityLevel'], string]>([
    ['CRITICAL', 'bg-rose-100'],
    ['HIGH', 'bg-amber-100'],
    ['MEDIUM', 'bg-blue-100'],
    ['MONITORING', 'bg-slate-100']
  ])('styles the %s priority badge with its colour token', (priorityLevel, colourClass) => {
    render(
      <ActionRecommendationPanel
        actionRecommendation={buildActionRecommendation({ priorityLevel })}
      />
    );

    expect(screen.getByText(priorityLevel)).toHaveClass(colourClass);
  });

  it('numbers every sourcing action in roadmap order', () => {
    render(
      <ActionRecommendationPanel
        actionRecommendation={buildActionRecommendation({ whatProcurementShouldDoNext: ALL_SOURCING_ACTIONS })}
      />
    );

    // The four analysis pillars are numbered too, so only the trailing entries belong to the action checklist.
    const actionNumbers = screen
      .getAllByText(/^\d+\. /)
      .map((element) => Number(element.textContent?.split('.')[0]))
      .slice(-ALL_SOURCING_ACTIONS.length);

    expect(actionNumbers).toEqual(ALL_SOURCING_ACTIONS.map((_action, index) => index + 1));
  });

  it('passes an unrecognised action code through unchanged', () => {
    const actions: SourcingNextAction[] = ['MONITOR'];
    // A newer backend can emit an action code this build does not know. Simulate that at runtime.
    Reflect.set(actions, 0, 'LEGACY_UNMAPPED_ACTION');

    render(
      <ActionRecommendationPanel
        actionRecommendation={buildActionRecommendation({ whatProcurementShouldDoNext: actions })}
      />
    );

    expect(screen.getByText('LEGACY_UNMAPPED_ACTION')).toBeInTheDocument();
  });
});
