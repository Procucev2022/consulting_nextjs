import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DirectPriceCategoryTable } from '@/components/module2/DirectPriceCategoryTable';
import type { DirectPriceCategorySummary } from '@/types/module2DirectPriceImprovement';
import { UI_STRINGS } from '@/constants/uiStrings';
import { resolveHumanReadableCategory } from '@/utils/procurementCategoryResolver';

const strings = UI_STRINGS.module2DirectPrice;

const createCategory = (overrides: Partial<DirectPriceCategorySummary> = {}): DirectPriceCategorySummary => ({
  unspscCode: '11151600',
  unspscCategory: 'Natural fibers',
  spendCategory: 'Yarn & Raw Cotton',
  distinctMaterialCount: 5,
  eligibleTransactionCount: 4500,
  eligibleQuantity: 145000,
  uom: 'KGS',
  eligibleSpendInr: 300000000,
  eligibleSpendCr: 30,
  actualPurchaseCostInr: 100000000,
  actualPurchaseCostCr: 10,
  benchmarkCostInr: 90000000,
  benchmarkCostCr: 9,
  historicalLostOpportunityInr: 3000000,
  historicalLostOpportunityCr: 0.3,
  opportunityPct: 1,
  dataQualityStatus: 'Qualified',
  materials: [],
  ...overrides
});

// Each sort metric orders these three rows differently, so every sort key is observable.
const CATEGORY_A = createCategory();
const CATEGORY_B = createCategory({
  unspscCode: '24111500',
  unspscCategory: 'Plastic films',
  spendCategory: 'Packaging Films',
  distinctMaterialCount: 50,
  eligibleTransactionCount: 300,
  eligibleSpendInr: 100000000,
  eligibleSpendCr: 10,
  actualPurchaseCostInr: 300000000,
  actualPurchaseCostCr: 30,
  historicalLostOpportunityInr: 1000000,
  historicalLostOpportunityCr: 0.1,
  opportunityPct: 9,
  dataQualityStatus: 'Requires Data Review'
});
const CATEGORY_C = createCategory({
  unspscCode: '12141500',
  unspscCategory: 'Industrial gases',
  spendCategory: 'Industrial Gases',
  distinctMaterialCount: 20,
  eligibleTransactionCount: 120,
  eligibleSpendInr: 200000000,
  eligibleSpendCr: 20,
  actualPurchaseCostInr: 200000000,
  actualPurchaseCostCr: 20,
  historicalLostOpportunityInr: 2000000,
  historicalLostOpportunityCr: 0.2,
  opportunityPct: 4
});

const buildCategories = (count: number): DirectPriceCategorySummary[] =>
  Array.from({ length: count }, (_, index) =>
    createCategory({
      unspscCode: `CODE-${index + 1}`,
      unspscCategory: `Title ${index + 1}`,
      spendCategory: `Category ${index + 1}`,
      eligibleSpendInr: 1000 - index
    })
  );

const getDataRows = (): HTMLElement[] =>
  screen.getAllByRole('row').filter((row) => within(row).queryAllByRole('cell').length > 0);

const getRowCodes = (): string[] =>
  getDataRows().map((row) => within(row).getAllByRole('cell')[0].textContent ?? '');

const getCellTexts = (row: HTMLElement): string[] =>
  within(row).getAllByRole('cell').map((cell) => cell.textContent ?? '');

describe('DirectPriceCategoryTable', () => {
  it('renders one row per category with formatted spend, opportunity and status values', () => {
    render(<DirectPriceCategoryTable categories={[CATEGORY_A]} onSelectCategory={vi.fn()} />);

    const [row] = getDataRows();
    expect(getCellTexts(row)).toEqual([
      '11151600',
      resolveHumanReadableCategory('Natural fibers'),
      '5',
      CATEGORY_A.eligibleTransactionCount.toLocaleString(),
      '₹30.0000 Cr',
      '₹10.0000 Cr',
      '₹9.0000 Cr',
      '₹0.3000 Cr',
      '1.0%',
      'Qualified',
      strings.btnViewMaterials
    ]);
  });

  it('shows the spend category when the UNSPSC title is empty', () => {
    render(
      <DirectPriceCategoryTable
        categories={[createCategory({ unspscCategory: '' })]}
        onSelectCategory={vi.fn()}
      />
    );

    const [row] = getDataRows();
    expect(getCellTexts(row)[1]).toBe(resolveHumanReadableCategory('Yarn & Raw Cotton'));
  });

  it('shows a zero opportunity value without a crore figure when nothing is lost', () => {
    render(
      <DirectPriceCategoryTable
        categories={[createCategory({ historicalLostOpportunityCr: 0 })]}
        onSelectCategory={vi.fn()}
      />
    );

    const [row] = getDataRows();
    expect(getCellTexts(row)[7]).toBe('₹0.00');
  });

  it('shows the review and qualified status text exactly as the data provides it', () => {
    render(<DirectPriceCategoryTable categories={[CATEGORY_A, CATEGORY_B]} onSelectCategory={vi.fn()} />);

    const [qualifiedRow, reviewRow] = getDataRows();
    expect(getCellTexts(qualifiedRow)[9]).toBe('Qualified');
    expect(getCellTexts(reviewRow)[9]).toBe('Requires Data Review');
  });

  it('sorts by eligible spend descending by default and toggles direction from the column header', () => {
    render(
      <DirectPriceCategoryTable categories={[CATEGORY_B, CATEGORY_A, CATEGORY_C]} onSelectCategory={vi.fn()} />
    );
    expect(getRowCodes()).toEqual([CATEGORY_A.unspscCode, CATEGORY_C.unspscCode, CATEGORY_B.unspscCode]);

    const spendHeader = screen.getByRole('columnheader', { name: new RegExp(strings.colEligibleSpend) });
    fireEvent.click(spendHeader);
    expect(getRowCodes()).toEqual([CATEGORY_B.unspscCode, CATEGORY_C.unspscCode, CATEGORY_A.unspscCode]);

    fireEvent.click(spendHeader);
    expect(getRowCodes()).toEqual([CATEGORY_A.unspscCode, CATEGORY_C.unspscCode, CATEGORY_B.unspscCode]);
  });

  it('sorts by distinct materials, eligible transactions and lost opportunity from their headers', () => {
    render(
      <DirectPriceCategoryTable categories={[CATEGORY_A, CATEGORY_B, CATEGORY_C]} onSelectCategory={vi.fn()} />
    );

    const materialsHeader = screen.getByRole('columnheader', { name: new RegExp(strings.colDistinctMaterials) });
    fireEvent.click(materialsHeader);
    expect(getRowCodes()).toEqual([CATEGORY_B.unspscCode, CATEGORY_C.unspscCode, CATEGORY_A.unspscCode]);
    fireEvent.click(materialsHeader);
    expect(getRowCodes()).toEqual([CATEGORY_A.unspscCode, CATEGORY_C.unspscCode, CATEGORY_B.unspscCode]);

    fireEvent.click(screen.getByRole('columnheader', { name: new RegExp(strings.colEligibleTransactions) }));
    expect(getRowCodes()).toEqual([CATEGORY_A.unspscCode, CATEGORY_B.unspscCode, CATEGORY_C.unspscCode]);

    fireEvent.click(screen.getByRole('columnheader', { name: new RegExp(strings.colOpportunity) }));
    expect(getRowCodes()).toEqual([CATEGORY_A.unspscCode, CATEGORY_C.unspscCode, CATEGORY_B.unspscCode]);
  });

  it('filters by code, title or spend category ignoring case and shows an empty state', () => {
    render(
      <DirectPriceCategoryTable categories={[CATEGORY_A, CATEGORY_B, CATEGORY_C]} onSelectCategory={vi.fn()} />
    );
    const searchInput = screen.getByRole('textbox');

    fireEvent.change(searchInput, { target: { value: 'PACKAGING' } });
    expect(getRowCodes()).toEqual([CATEGORY_B.unspscCode]);

    fireEvent.change(searchInput, { target: { value: '1214' } });
    expect(getRowCodes()).toEqual([CATEGORY_C.unspscCode]);

    fireEvent.change(searchInput, { target: { value: 'PLASTIC' } });
    expect(getRowCodes()).toEqual([CATEGORY_B.unspscCode]);

    fireEvent.change(searchInput, { target: { value: 'no such category' } });
    expect(screen.getByText(strings.noCategoriesMatch)).toBeInTheDocument();
    expect(screen.getByText(strings.showingCategories(0, 0))).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: '' } });
    expect(getRowCodes()).toHaveLength(3);
  });

  it('filters rows by data quality status', () => {
    render(
      <DirectPriceCategoryTable categories={[CATEGORY_A, CATEGORY_B, CATEGORY_C]} onSelectCategory={vi.fn()} />
    );
    const statusSelect = screen.getByDisplayValue(strings.allStatuses);

    fireEvent.change(statusSelect, { target: { value: 'Requires Data Review' } });
    expect(getRowCodes()).toEqual([CATEGORY_B.unspscCode]);

    fireEvent.change(statusSelect, { target: { value: 'Qualified' } });
    expect(getRowCodes()).toEqual([CATEGORY_A.unspscCode, CATEGORY_C.unspscCode]);

    fireEvent.change(statusSelect, { target: { value: 'ALL' } });
    expect(getRowCodes()).toHaveLength(3);
  });

  it('shows not available instead of Infinity or NaN for the opportunity percentage', () => {
    const categories = [
      createCategory({ unspscCode: 'INF-1', spendCategory: 'Infinite ratio', opportunityPct: Infinity }),
      createCategory({ unspscCode: 'NAN-1', spendCategory: 'Undefined ratio', opportunityPct: Number.NaN }),
      createCategory({ unspscCode: 'NUL-1', spendCategory: 'Missing ratio', opportunityPct: null })
    ];
    render(<DirectPriceCategoryTable categories={categories} onSelectCategory={vi.fn()} />);

    const rows = getDataRows();
    expect(rows).toHaveLength(3);
    for (const row of rows) {
      expect(getCellTexts(row)[8]).toBe(UI_STRINGS.common.notAvailable);
    }
    expect(screen.queryByText(/Infinity|NaN/)).not.toBeInTheDocument();
  });

  it('pages through results with the page size selector and previous and next controls', () => {
    render(<DirectPriceCategoryTable categories={buildCategories(12)} onSelectCategory={vi.fn()} />);

    expect(getRowCodes()).toEqual([
      'CODE-1', 'CODE-2', 'CODE-3', 'CODE-4', 'CODE-5', 'CODE-6', 'CODE-7', 'CODE-8', 'CODE-9', 'CODE-10'
    ]);
    expect(screen.getByText(strings.showingCategories(10, 12))).toBeInTheDocument();
    expect(screen.getByText(strings.pageOfTotal(1, 2))).toBeInTheDocument();

    const previousButton = screen.getByRole('button', { name: strings.previousPageLabel });
    const nextButton = screen.getByRole('button', { name: strings.nextPageLabel });
    expect(previousButton).toBeDisabled();
    expect(nextButton).toBeEnabled();

    fireEvent.click(nextButton);
    expect(getRowCodes()).toEqual(['CODE-11', 'CODE-12']);
    expect(screen.getByText(strings.pageOfTotal(2, 2))).toBeInTheDocument();
    expect(nextButton).toBeDisabled();
    expect(previousButton).toBeEnabled();

    fireEvent.click(previousButton);
    expect(getRowCodes()).toHaveLength(10);

    const [, pageSizeSelect] = screen.getAllByRole('combobox');
    fireEvent.change(pageSizeSelect, { target: { value: '25' } });
    expect(getRowCodes()).toHaveLength(12);
    expect(screen.getByText(strings.pageOfTotal(1, 1))).toBeInTheDocument();
    expect(previousButton).toBeDisabled();
    expect(nextButton).toBeDisabled();
  });

  it('keeps the page within range when the category list becomes shorter', () => {
    const categories = buildCategories(12);
    const { rerender } = render(<DirectPriceCategoryTable categories={categories} onSelectCategory={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: strings.nextPageLabel }));
    expect(screen.getByText(strings.pageOfTotal(2, 2))).toBeInTheDocument();

    rerender(<DirectPriceCategoryTable categories={categories.slice(0, 3)} onSelectCategory={vi.fn()} />);

    expect(screen.getByText(strings.pageOfTotal(1, 1))).toBeInTheDocument();
    expect(screen.getByText(strings.showingCategories(3, 3))).toBeInTheDocument();
    expect(getRowCodes()).toEqual(['CODE-1', 'CODE-2', 'CODE-3']);
  });

  it('selects a category once per click from its row or from the drill-down button', () => {
    const onSelectCategory = vi.fn();
    render(<DirectPriceCategoryTable categories={[CATEGORY_A, CATEGORY_B]} onSelectCategory={onSelectCategory} />);

    const [firstRow] = getDataRows();
    fireEvent.click(within(firstRow).getAllByRole('cell')[0]);
    expect(onSelectCategory).toHaveBeenCalledTimes(1);
    expect(onSelectCategory).toHaveBeenLastCalledWith(CATEGORY_A);

    fireEvent.click(within(firstRow).getByRole('button', { name: strings.btnViewMaterials }));
    expect(onSelectCategory).toHaveBeenCalledTimes(2);
    expect(onSelectCategory).toHaveBeenLastCalledWith(CATEGORY_A);
  });

  it('highlights the row whose spend category matches the selected category name', () => {
    render(
      <DirectPriceCategoryTable
        categories={[CATEGORY_A, CATEGORY_B]}
        onSelectCategory={vi.fn()}
        selectedCategoryName={CATEGORY_B.spendCategory}
      />
    );

    const [firstRow, secondRow] = getDataRows();
    expect(firstRow).not.toHaveClass('font-medium');
    expect(secondRow).toHaveClass('font-medium');
  });

  it('shows the empty message and zero counts when there are no categories', () => {
    render(<DirectPriceCategoryTable categories={[]} onSelectCategory={vi.fn()} />);

    expect(screen.getByText(strings.noCategoriesMatch)).toBeInTheDocument();
    expect(screen.getByText(strings.showingCategories(0, 0))).toBeInTheDocument();
    expect(screen.getByText(strings.pageOfTotal(1, 1))).toBeInTheDocument();
  });
});
