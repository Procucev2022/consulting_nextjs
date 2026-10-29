/**
 * Module 2 coverage: CategorySpecialisationOverviewTab notices, priority colour bands, and row selection.
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CategorySpecialisationOverviewTab } from '../../../src/components/module2/CategorySpecialisationOverviewTab';
import {
  buildCategorySpecialisationResult,
  buildCategorySpecialisationSummary,
  buildSpecialisationCategories
} from '../../fixtures/module2CoverageFixtures';

describe('CategorySpecialisationOverviewTab coverage', () => {
  it('shows the overlap-review and unquantified notices with their counts and amounts', () => {
    render(<CategorySpecialisationOverviewTab data={buildCategorySpecialisationResult()} />);

    expect(screen.getByText('₹1.30 Cr', { selector: 'strong' })).toBeInTheDocument();
    expect(screen.getByText('2', { selector: 'strong' })).toBeInTheDocument();
  });

  it('hides both notices when no overlap review or unquantified items remain', () => {
    const data = buildCategorySpecialisationResult({
      summary: buildCategorySpecialisationSummary({
        opportunitiesRequiringOverlapReviewCount: 0,
        unquantifiedOpportunitiesCount: 0
      })
    });
    render(<CategorySpecialisationOverviewTab data={data} />);

    expect(screen.queryByText('₹1.30 Cr', { selector: 'strong' })).not.toBeInTheDocument();
    expect(screen.queryByText('2', { selector: 'strong' })).not.toBeInTheDocument();
  });

  it('treats a missing unquantified count as zero and still shows the overlap notice', () => {
    const data = buildCategorySpecialisationResult({
      summary: buildCategorySpecialisationSummary({ unquantifiedOpportunitiesCount: undefined })
    });
    render(<CategorySpecialisationOverviewTab data={data} />);

    expect(screen.getByText('₹1.30 Cr', { selector: 'strong' })).toBeInTheDocument();
    expect(screen.queryByText('2', { selector: 'strong' })).not.toBeInTheDocument();
  });

  it('colours priority badges by band and makes rows selectable when a handler is supplied', () => {
    const onSelectCategory = vi.fn();
    const categories = buildSpecialisationCategories();
    render(
      <CategorySpecialisationOverviewTab
        data={buildCategorySpecialisationResult()}
        onSelectCategory={onSelectCategory}
      />
    );

    expect(screen.getByText('PRIORITY A')).toHaveStyle({ backgroundColor: '#fef2f2' });
    expect(screen.getByText('PRIORITY B')).toHaveStyle({ backgroundColor: '#fefce8' });
    expect(screen.getByText('PRIORITY C')).toHaveStyle({ backgroundColor: '#f0fdf4' });
    expect(screen.getByRole('row', { name: /Welding Consumables/ })).toHaveStyle({ cursor: 'pointer' });

    fireEvent.click(screen.getByText(categories[1].categoryName));
    expect(onSelectCategory).toHaveBeenCalledWith(categories[1].categoryName);
  });

  it('renders rows as static when no selection handler is supplied', () => {
    const categories = buildSpecialisationCategories();
    render(<CategorySpecialisationOverviewTab data={buildCategorySpecialisationResult()} />);

    expect(screen.getByRole('row', { name: /Welding Consumables/ })).toHaveStyle({ cursor: 'default' });
    fireEvent.click(screen.getByText(categories[1].categoryName));
    expect(screen.getByText(categories[1].categoryName)).toBeInTheDocument();
  });
});
