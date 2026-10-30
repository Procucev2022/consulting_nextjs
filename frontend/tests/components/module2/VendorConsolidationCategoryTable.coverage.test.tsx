import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { VendorConsolidationCategoryTable } from '../../../src/components/module2/VendorConsolidationCategoryTable';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import { buildCategoryProfile } from '../../fixtures/vendorConsolidation';

const strings = UI_STRINGS.module2VendorConsolidation;

const packagingCategory = buildCategoryProfile();
const chemicalsCategory = buildCategoryProfile({
  spendCategory: 'Chemicals',
  unspscCode: '12131708',
  unspscCategory: 'Industrial Acids',
  classificationType: 'PROVISIONAL_UNSPSC',
  classificationLabel: 'Provisional UNSPSC (v260801.1)',
  categoryOpportunityStatus: 'Potential Opportunity — Further Validation Required',
  fragmentationLevel: 'HIGH'
});

const twoCategories = [packagingCategory, chemicalsCategory];

afterEach(() => {
  vi.restoreAllMocks();
});

describe('VendorConsolidationCategoryTable coverage', () => {
  it('matches the search query against the spend category name', () => {
    render(<VendorConsolidationCategoryTable categories={twoCategories} onSelectCategory={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText(strings.searchPlaceholder), { target: { value: 'PACK' } });

    expect(screen.getByText('Packaging')).toBeDefined();
    expect(screen.queryByText('Chemicals')).toBeNull();
  });

  it('matches the search query against the UNSPSC code', () => {
    render(<VendorConsolidationCategoryTable categories={twoCategories} onSelectCategory={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText(strings.searchPlaceholder), { target: { value: '12131' } });

    expect(screen.getByText('Chemicals')).toBeDefined();
    expect(screen.queryByText('Packaging')).toBeNull();
  });

  it('matches the search query against the UNSPSC category title', () => {
    render(<VendorConsolidationCategoryTable categories={twoCategories} onSelectCategory={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText(strings.searchPlaceholder), { target: { value: 'acids' } });

    expect(screen.getByText('Chemicals')).toBeDefined();
    expect(screen.queryByText('Packaging')).toBeNull();
  });

  it('shows the empty-state row when no category matches the search query', () => {
    render(<VendorConsolidationCategoryTable categories={twoCategories} onSelectCategory={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText(strings.searchPlaceholder), { target: { value: 'zzz-no-match' } });

    expect(screen.getByText(strings.noRecordsFound)).toBeDefined();
    expect(screen.queryByText('Packaging')).toBeNull();
    expect(screen.queryByText('Chemicals')).toBeNull();
  });

  it('shows the empty-state row when the status filter excludes every category', () => {
    render(<VendorConsolidationCategoryTable categories={[packagingCategory]} onSelectCategory={vi.fn()} />);

    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'No Clear Opportunity Identified' }
    });

    expect(screen.getByText(strings.noRecordsFound)).toBeDefined();
  });

  it('renders every status filter option label', () => {
    render(<VendorConsolidationCategoryTable categories={[]} onSelectCategory={vi.fn()} />);

    expect(screen.getByRole('option', { name: strings.allStatuses })).toBeDefined();
    expect(screen.getByRole('option', { name: strings.filterOptionOpportunityIdentified })).toBeDefined();
    expect(screen.getByRole('option', { name: strings.filterOptionPotentialOpportunity })).toBeDefined();
    expect(screen.getByRole('option', { name: strings.filterOptionNoClearOpportunity })).toBeDefined();
  });

  it('renders each classification label for every classification type', () => {
    const classifications = [
      buildCategoryProfile({
        spendCategory: 'Verified Category',
        classificationType: 'VERIFIED_UNSPSC',
        classificationLabel: 'Verified label'
      }),
      buildCategoryProfile({
        spendCategory: 'Provisional Category',
        classificationType: 'PROVISIONAL_UNSPSC',
        classificationLabel: 'Provisional label'
      }),
      buildCategoryProfile({
        spendCategory: 'Source Category',
        classificationType: 'SOURCE_SPEND_CATEGORY',
        classificationLabel: 'Source label'
      }),
      buildCategoryProfile({
        spendCategory: 'Unmapped Category',
        classificationType: 'UNMAPPED',
        classificationLabel: 'Unmapped label'
      })
    ];
    render(<VendorConsolidationCategoryTable categories={classifications} onSelectCategory={vi.fn()} />);

    expect(screen.getByText('Verified label')).toBeDefined();
    expect(screen.getByText('Provisional label')).toBeDefined();
    expect(screen.getByText('Source label')).toBeDefined();
    expect(screen.getByText('Unmapped label')).toBeDefined();
  });

  it('shows the not-applicable marker when no category consolidation candidate exists', () => {
    const notApplicable = buildCategoryProfile({
      spendCategory: 'Hardware',
      categoryConsolidationCandidateStatus: 'NOT_APPLICABLE'
    });
    render(<VendorConsolidationCategoryTable categories={[notApplicable]} onSelectCategory={vi.fn()} />);

    expect(screen.getByText(UI_STRINGS.common.notAvailable)).toBeDefined();
    expect(screen.queryByText(strings.statusNotYetQuantifiable)).toBeNull();
  });

  it('shows the placeholder when a category has no UNSPSC code', () => {
    const uncoded = buildCategoryProfile({ spendCategory: 'Uncoded Category', unspscCode: '' });
    render(<VendorConsolidationCategoryTable categories={[uncoded]} onSelectCategory={vi.fn()} />);

    expect(screen.getByText(strings.emptyCodePlaceholder)).toBeDefined();
  });

  it('uses the UNSPSC category title when the spend category is blank', () => {
    const unnamed = buildCategoryProfile({ spendCategory: '', unspscCategory: 'Corrugated Boxes' });
    render(<VendorConsolidationCategoryTable categories={[unnamed]} onSelectCategory={vi.fn()} />);

    expect(screen.getByText('Corrugated Boxes')).toBeDefined();
  });

  it('passes the clicked row category to onSelectCategory when several rows are present', () => {
    const onSelect = vi.fn();
    render(<VendorConsolidationCategoryTable categories={twoCategories} onSelectCategory={onSelect} />);

    const analyseButtons = screen.getAllByText(strings.btnAnalyse);
    expect(analyseButtons).toHaveLength(2);
    fireEvent.click(analyseButtons[1]);

    expect(onSelect).toHaveBeenCalledWith(chemicalsCategory);
  });
});
