/**
 * Module 2 coverage: CategoryPriceDispersionTab percentile grid and interpretation fallbacks.
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CategoryPriceDispersionTab } from '../../../src/components/module2/CategoryPriceDispersionTab';
import {
  buildPriceDispersionMetrics,
  buildSteelPlateCategoryProfile
} from '../../fixtures/module2CoverageFixtures';

describe('CategoryPriceDispersionTab coverage', () => {
  it('renders every percentile of the dispersion metrics with two decimals', () => {
    const dispersion = buildPriceDispersionMetrics();
    render(<CategoryPriceDispersionTab profile={buildSteelPlateCategoryProfile()} />);

    expect(screen.getByText(`₹${dispersion.minPrice.toFixed(2)}`)).toBeInTheDocument();
    expect(screen.getByText(`₹${dispersion.p25Price.toFixed(2)}`)).toBeInTheDocument();
    expect(screen.getByText(`₹${dispersion.medianPrice.toFixed(2)}`)).toBeInTheDocument();
    expect(screen.getByText(`₹${dispersion.weightedAveragePrice.toFixed(2)}`)).toBeInTheDocument();
    expect(screen.getByText(`₹${dispersion.p75Price.toFixed(2)}`)).toBeInTheDocument();
    expect(screen.getByText(`₹${dispersion.maxPrice.toFixed(2)}`)).toBeInTheDocument();
    expect(screen.getByText(dispersion.dispersionInterpretation)).toBeInTheDocument();
  });

  it('shows placeholders instead of prices and the credible reference explanation when dispersion data is missing', () => {
    const profile = buildSteelPlateCategoryProfile({ priceDispersion: null });
    render(<CategoryPriceDispersionTab profile={profile} />);

    expect(screen.queryAllByText(/₹\d/)).toHaveLength(0);
    expect(screen.getByText(profile.credibleReference.explanation)).toBeInTheDocument();
  });

  it('uses the credible reference explanation when the dispersion interpretation is blank', () => {
    const profile = buildSteelPlateCategoryProfile({
      priceDispersion: { ...buildPriceDispersionMetrics(), dispersionInterpretation: '' }
    });
    render(<CategoryPriceDispersionTab profile={profile} />);

    expect(screen.getByText(profile.credibleReference.explanation)).toBeInTheDocument();
  });
});
