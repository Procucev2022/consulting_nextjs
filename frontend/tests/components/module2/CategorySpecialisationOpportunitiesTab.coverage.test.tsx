/**
 * Module 2 coverage: CategorySpecialisationOpportunitiesTab head aggregation, planning bands, and unestablished heads.
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CategorySpecialisationOpportunitiesTab } from '../../../src/components/module2/CategorySpecialisationOpportunitiesTab';
import { CATEGORY_SPECIALISATION_UI_STRINGS } from '../../../src/constants/module2CategorySpecialisation';
import {
  buildCategorySpecialisationResult,
  buildOpportunityHeadAssumptions
} from '../../fixtures/module2CoverageFixtures';

describe('CategorySpecialisationOpportunitiesTab coverage', () => {
  it('sums established head estimates across categories into Cr totals', () => {
    render(<CategorySpecialisationOpportunitiesTab data={buildCategorySpecialisationResult()} />);

    // HEAD-B is established in two categories: plate (250.00 Cr) and welding (16.00 Cr).
    expect(screen.getByText('₹266.00 Cr')).toBeInTheDocument();
    expect(screen.getByText('₹2.66')).toBeInTheDocument();
    expect(screen.getByText('₹5.32')).toBeInTheDocument();
    expect(screen.getByText('₹7.98')).toBeInTheDocument();
  });

  it('shows the planning assumption band and the related lever when a head defines one', () => {
    render(<CategorySpecialisationOpportunitiesTab data={buildCategorySpecialisationResult()} />);

    expect(screen.getByText('5% - 10% - 15%')).toBeInTheDocument();
    expect(screen.getByText('LEVER 3')).toBeInTheDocument();
  });

  it('discloses when the D1 assessment has no configured planning assumptions', () => {
    const data = buildCategorySpecialisationResult({ opportunityHeadAssumptions: [] });
    render(<CategorySpecialisationOpportunitiesTab data={data} />);
    expect(screen.getByText(CATEGORY_SPECIALISATION_UI_STRINGS.NO_D1_PLANNING_ASSUMPTIONS)).toBeInTheDocument();
  });

  it('lists every planning head, including heads with no established spend', () => {
    render(<CategorySpecialisationOpportunitiesTab data={buildCategorySpecialisationResult()} />);

    buildOpportunityHeadAssumptions().forEach((head) => {
      expect(screen.getByText(head.title)).toBeInTheDocument();
    });
  });
});
