/**
 * Module 2 coverage: CategorySpecialisationCategoriesTab priority colours, drill-down toggles, and head values.
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CategorySpecialisationCategoriesTab } from '../../../src/components/module2/CategorySpecialisationCategoriesTab';
import { CATEGORY_SPECIALISATION_UI_STRINGS } from '../../../src/constants/module2CategorySpecialisation';
import { buildSpecialisationCategories } from '../../fixtures/module2CoverageFixtures';

describe('CategorySpecialisationCategoriesTab coverage', () => {
  it('colours each priority badge by its priority band', () => {
    render(<CategorySpecialisationCategoriesTab categories={buildSpecialisationCategories()} />);

    expect(screen.getByText('PRIORITY A')).toHaveStyle({ backgroundColor: '#fef2f2' });
    expect(screen.getByText('PRIORITY B')).toHaveStyle({ backgroundColor: '#fefce8' });
    expect(screen.getByText('PRIORITY C')).toHaveStyle({ backgroundColor: '#f0fdf4' });
  });

  it('expands a category when its row is clicked and collapses it on a second click', () => {
    const categories = buildSpecialisationCategories();
    render(<CategorySpecialisationCategoriesTab categories={categories} />);
    const [plate] = categories;

    fireEvent.click(screen.getByText(plate.categoryName));
    expect(screen.getByText(plate.priorityRationale)).toBeInTheDocument();

    fireEvent.click(screen.getByText(plate.categoryName));
    expect(screen.queryByText(plate.priorityRationale)).not.toBeInTheDocument();
  });

  it('toggles the drill-down through the Details control of a single category', () => {
    const categories = buildSpecialisationCategories();
    render(<CategorySpecialisationCategoriesTab categories={categories} />);
    const [, welding] = categories;

    // Each category row has exactly one control button, in row order.
    fireEvent.click(screen.getAllByRole('button')[1]);
    expect(screen.getByText(welding.priorityRationale)).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button')[1]);
    expect(screen.queryByText(welding.priorityRationale)).not.toBeInTheDocument();
  });

  it('opens the initially selected category on first render', () => {
    const categories = buildSpecialisationCategories();
    render(
      <CategorySpecialisationCategoriesTab
        categories={categories}
        initialSelectedCategory={categories[1].categoryName}
      />
    );

    expect(screen.getByText(categories[1].priorityRationale)).toBeInTheDocument();
  });

  it('shows eligible spend and base benefit for established heads and lists unestablished heads', () => {
    const categories = buildSpecialisationCategories();
    render(
      <CategorySpecialisationCategoriesTab
        categories={categories}
        initialSelectedCategory={categories[0].categoryName}
      />
    );

    expect(screen.getByText('₹250.00 Cr')).toBeInTheDocument();
    expect(screen.getByText('₹5.00 Cr')).toBeInTheDocument();
    expect(screen.getByText('HEAD-A: Strategic Category Management')).toBeInTheDocument();
  });

  it('discloses that category opportunities are withheld when planning assumptions are missing', () => {
    const [category] = buildSpecialisationCategories();
    render(
      <CategorySpecialisationCategoriesTab
        categories={[{ ...category, opportunities: [] }]}
        initialSelectedCategory={category.categoryName}
      />
    );
    expect(screen.getByText(CATEGORY_SPECIALISATION_UI_STRINGS.NO_D1_PLANNING_ASSUMPTIONS)).toBeInTheDocument();
  });
});
