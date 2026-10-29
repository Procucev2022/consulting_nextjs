/**
 * Module 2 coverage: CategorySpecialisationOverlapTab lever tags, status colours, positive-benefit filter,
 * and excluded-amount fallback.
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CategorySpecialisationOverlapTab } from '../../../src/components/module2/CategorySpecialisationOverlapTab';
import type { CrossLeverOverlapItem } from '../../../src/types/module2CategorySpecialisation';
import { buildCrossLeverOverlapItem } from '../../fixtures/module2CoverageFixtures';

// Flagged for review under Lever 1 with the full benefit excluded from the net total.
const flaggedItem = buildCrossLeverOverlapItem();

// Clean item with no related lever, no overlap, and a positive net benefit.
const cleanItem = buildCrossLeverOverlapItem({
  headKey: 'HEAD-C',
  headTitle: 'Purchasing Consolidation',
  relatedLever: undefined,
  overlapStatus: 'NO_OVERLAP',
  grossPotentialBenefitInr: 12000000,
  grossPotentialBenefitCr: 1.2,
  netIndicativeBenefitInr: 11000000,
  netIndicativeBenefitCr: 1.1,
  amountExcludedInr: 0,
  amountExcludedCr: 0
});

// Older record without amountExcludedCr. The type marks the field required, so this simulates an incomplete payload.
const legacyItem = buildCrossLeverOverlapItem({
  headKey: 'HEAD-H',
  headTitle: 'Specification Optimisation',
  relatedLever: 'LEVER_8',
  overlapStatus: 'OVERLAP_DEDUPLICATED',
  grossPotentialBenefitInr: 8000000,
  grossPotentialBenefitCr: 0.8,
  netIndicativeBenefitInr: 0,
  netIndicativeBenefitCr: 0,
  amountExcludedCr: undefined
});

// Zero gross benefit: the register must not list this item.
const zeroBenefitItem = buildCrossLeverOverlapItem({
  headKey: 'HEAD-E',
  headTitle: 'Contract Coverage Improvement',
  grossPotentialBenefitInr: 0,
  grossPotentialBenefitCr: 0
});

const register: CrossLeverOverlapItem[] = [flaggedItem, cleanItem, legacyItem, zeroBenefitItem];

describe('CategorySpecialisationOverlapTab coverage', () => {
  it('lists only overlap items with a positive gross benefit', () => {
    render(<CategorySpecialisationOverlapTab overlapItems={register} />);

    expect(screen.getByText(flaggedItem.headTitle)).toBeInTheDocument();
    expect(screen.getByText(cleanItem.headTitle)).toBeInTheDocument();
    expect(screen.getByText(legacyItem.headTitle)).toBeInTheDocument();
    expect(screen.queryByText(zeroBenefitItem.headTitle)).not.toBeInTheDocument();
  });

  it('tags linked levers and shows the overlap status of each item', () => {
    render(<CategorySpecialisationOverlapTab overlapItems={register} />);

    expect(screen.getByText('LEVER 1', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByText('LEVER 8', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByText('OVERLAP REVIEW REQUIRED', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByText('NO OVERLAP', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByText('OVERLAP DEDUPLICATED', { selector: 'span' })).toBeInTheDocument();
  });

  it('shows the gross, net, and excluded amounts, treating a missing excluded amount as zero', () => {
    render(<CategorySpecialisationOverlapTab overlapItems={register} />);

    // The flagged item's gross benefit and excluded amount are both 3.50 Cr.
    expect(screen.getAllByText('₹3.50 Cr')).toHaveLength(2);
    expect(screen.getByText('₹1.10 Cr')).toBeInTheDocument();
    expect(screen.getByText('₹0.80 Cr')).toBeInTheDocument();
    expect(screen.getAllByText('₹0.00 Cr').length).toBeGreaterThanOrEqual(2);
  });
});
