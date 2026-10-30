import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { VendorConsolidationSupplierTable } from '../../../src/components/module2/VendorConsolidationSupplierTable';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import { VENDOR_CONSOLIDATION_CONFIG } from '../../../src/constants/module2VendorConsolidation';
import { buildCategoryProfile } from '../../fixtures/vendorConsolidation';

const strings = UI_STRINGS.module2VendorConsolidation;

afterEach(() => {
  vi.restoreAllMocks();
});

describe('VendorConsolidationSupplierTable coverage', () => {
  it('passes the clicked supplier to onSelectSupplierMaterials from each row', () => {
    const onSelectMaterials = vi.fn();
    render(
      <VendorConsolidationSupplierTable
        category={buildCategoryProfile()}
        onBackToCategories={vi.fn()}
        onSelectSupplierMaterials={onSelectMaterials}
      />
    );

    const rowButtons = screen.getAllByRole('button', { name: strings.btnDrillDownMaterials });
    expect(rowButtons).toHaveLength(2);

    fireEvent.click(rowButtons[1]);
    expect(onSelectMaterials).toHaveBeenCalledWith(
      expect.objectContaining({ vendorCode: 'V003', vendorName: 'Gamma Containers' })
    );
  });

  it('calls onSelectSupplierMaterials without a supplier from the category-level materials control', () => {
    const onSelectMaterials = vi.fn();
    render(
      <VendorConsolidationSupplierTable
        category={buildCategoryProfile()}
        onBackToCategories={vi.fn()}
        onSelectSupplierMaterials={onSelectMaterials}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: strings.btnViewCategoryMaterials }));
    expect(onSelectMaterials).toHaveBeenCalledTimes(1);
    expect(onSelectMaterials).toHaveBeenLastCalledWith();
  });

  it('labels core and tail suppliers with their respective badges', () => {
    render(
      <VendorConsolidationSupplierTable
        category={buildCategoryProfile()}
        onBackToCategories={vi.fn()}
        onSelectSupplierMaterials={vi.fn()}
      />
    );

    expect(screen.getByText(strings.coreSupplierBadge)).toBeDefined();
    expect(
      screen.getByText(strings.tailSupplierBadge(VENDOR_CONSOLIDATION_CONFIG.TAIL_SUPPLIER_SHARE_THRESHOLD_PCT))
    ).toBeDefined();
  });

  it('renders the category concentration summary with formatted values', () => {
    render(
      <VendorConsolidationSupplierTable
        category={buildCategoryProfile()}
        onBackToCategories={vi.fn()}
        onSelectSupplierMaterials={vi.fn()}
      />
    );

    expect(screen.getByText(strings.summaryCategorySpend.trim())).toBeDefined();
    expect(screen.getByText(strings.formatCrore('0.0095'))).toBeDefined();
    expect(screen.getByText(strings.summarySuppliers.trim())).toBeDefined();
    expect(screen.getByText(strings.summaryTop1Share.trim())).toBeDefined();
    // 47.4% is both the category top-1 share and Beta Packaging's spend share, so two cells match.
    expect(screen.getAllByText(strings.formatPercent('47.4')).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(strings.summaryCr3Concentration.trim())).toBeDefined();
    expect(screen.getByText(strings.formatPercent('100.0'))).toBeDefined();
    expect(screen.getByText(strings.summaryHhi.trim())).toBeDefined();
    expect(screen.getByText('3632')).toBeDefined();
    expect(screen.getByText(strings.summaryFragmentation.trim())).toBeDefined();
    expect(screen.getByText('MEDIUM')).toBeDefined();
  });

  it('calls onBackToCategories from the back control', () => {
    const onBack = vi.fn();
    render(
      <VendorConsolidationSupplierTable
        category={buildCategoryProfile()}
        onBackToCategories={onBack}
        onSelectSupplierMaterials={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: strings.ariaBackToCategories }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
