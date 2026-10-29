import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { VendorConsolidationMaterialTable } from '../../../src/components/module2/VendorConsolidationMaterialTable';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import {
  buildComparableOpportunity,
  buildCrossPlantOpportunity,
  buildSameMaterialOpportunity
} from '../../fixtures/vendorConsolidation';

const strings = UI_STRINGS.module2VendorConsolidation;

const renderMaterialTable = (
  sameMaterialOpportunities = [buildSameMaterialOpportunity()],
  comparableOpportunities = [buildComparableOpportunity()],
  crossPlantOpportunities = [buildCrossPlantOpportunity()],
  handlers: { onBackToSuppliers?: () => void; onSelectMaterialTransactions?: () => void } = {}
): void => {
  render(
    <VendorConsolidationMaterialTable
      categoryName="Packaging"
      sameMaterialOpportunities={sameMaterialOpportunities}
      comparableOpportunities={comparableOpportunities}
      crossPlantOpportunities={crossPlantOpportunities}
      onBackToSuppliers={handlers.onBackToSuppliers ?? vi.fn()}
      onSelectMaterialTransactions={handlers.onSelectMaterialTransactions ?? vi.fn()}
    />
  );
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('VendorConsolidationMaterialTable review status display', () => {
  it('labels each classification review status and falls back to awaiting review when none is set', () => {
    renderMaterialTable([
      buildSameMaterialOpportunity({ materialCode: 'MAT-TV', classificationReviewStatus: 'TAXONOMY_VERIFIED' }),
      buildSameMaterialOpportunity({ materialCode: 'MAT-AP', classificationReviewStatus: 'APPROVED' }),
      buildSameMaterialOpportunity({ materialCode: 'MAT-CA', classificationReviewStatus: 'CLIENT_APPROVED' }),
      buildSameMaterialOpportunity({ materialCode: 'MAT-PR', classificationReviewStatus: 'PROVISIONAL' }),
      buildSameMaterialOpportunity({ materialCode: 'MAT-AR', classificationReviewStatus: 'AWAITING_REVIEW' }),
      buildSameMaterialOpportunity({ materialCode: 'MAT-NA', classificationReviewStatus: undefined })
    ]);

    expect(screen.getAllByText(strings.reviewStatusTaxonomyVerified)).toHaveLength(2);
    expect(screen.getByText(strings.reviewStatusClientApproved)).toBeDefined();
    expect(screen.getByText(strings.reviewStatusProvisional)).toBeDefined();
    expect(screen.getAllByText(strings.reviewStatusAwaitingReview)).toHaveLength(2);
    expect(screen.getByText('MAT-CA')).toBeDefined();
    expect(screen.getByText('MAT-NA')).toBeDefined();
  });
});

describe('VendorConsolidationMaterialTable actionable status and next steps', () => {
  it('shows the actionable status when present and the opportunity status otherwise', () => {
    renderMaterialTable([
      buildSameMaterialOpportunity({
        materialCode: 'MAT-ACT',
        actionableStatus: 'Technical Validation Required'
      }),
      buildSameMaterialOpportunity({
        materialCode: 'MAT-PLAIN',
        status: 'Insufficient Data'
      })
    ]);

    expect(screen.getByText('Technical Validation Required')).toBeDefined();
    expect(screen.getByText('Insufficient Data')).toBeDefined();
  });

  it('shows the recommended next action only when one is provided', () => {
    renderMaterialTable([
      buildSameMaterialOpportunity({
        materialCode: 'MAT-NEXT',
        nextRecommendedAction: 'Obtain the supplier technical datasheet'
      }),
      buildSameMaterialOpportunity({ materialCode: 'MAT-NONE' })
    ]);

    expect(screen.getByText('Obtain the supplier technical datasheet')).toBeDefined();
    expect(screen.getAllByRole('button', { name: strings.btnDrillDownTxs })).toHaveLength(2);
  });

  it('shows the not-available placeholder for a blank material code and keys rows by description', () => {
    renderMaterialTable([buildSameMaterialOpportunity({ materialCode: '', materialDesc: 'Unnamed box' })]);

    expect(screen.getByText(UI_STRINGS.common.notAvailable)).toBeDefined();
    expect(screen.getByText('Unnamed box')).toBeDefined();
  });
});

describe('VendorConsolidationMaterialTable sub-tabs and navigation', () => {
  it('shows the empty state for comparable groups when none exist', () => {
    renderMaterialTable([buildSameMaterialOpportunity()], [], []);

    fireEvent.click(screen.getByRole('button', { name: strings.subTabComparable(0) }));
    expect(screen.getByText(strings.noComparableGroups)).toBeDefined();
  });

  it('shows the empty state for cross-plant opportunities when none exist', () => {
    renderMaterialTable([buildSameMaterialOpportunity()], [], []);

    fireEvent.click(screen.getByRole('button', { name: strings.subTabCrossPlant(0) }));
    expect(screen.getByText(strings.noCrossPlantOpportunities)).toBeDefined();
  });

  it('renders the breadcrumb, sub-tab counts, and the comparable heading with its spend', () => {
    renderMaterialTable();

    expect(
      screen.getByText(strings.breadcrumbTrail(strings.breadcrumbSupplier('Packaging'), strings.tabMaterialAnalysis))
    ).toBeDefined();
    expect(screen.getByRole('button', { name: strings.subTabSameMaterial(1) })).toBeDefined();
    expect(screen.getByRole('button', { name: strings.subTabComparable(1) })).toBeDefined();
    expect(screen.getByRole('button', { name: strings.subTabCrossPlant(1) })).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: strings.subTabComparable(1) }));
    expect(screen.getByText(strings.formatCrore('0.0095'))).toBeDefined();
    expect(screen.getByText('Shared keyword \'BOX\' within procurement category \'Packaging\'')).toBeDefined();
  });

  it('returns to the same-material sub-tab from another sub-tab', () => {
    renderMaterialTable();

    fireEvent.click(screen.getByRole('button', { name: strings.subTabComparable(1) }));
    fireEvent.click(screen.getByRole('button', { name: strings.subTabSameMaterial(1) }));

    expect(screen.getByText('MAT-BOX-01')).toBeDefined();
  });

  it('styles every actionable status variant', () => {
    renderMaterialTable([
      buildSameMaterialOpportunity({ materialCode: 'MAT-V1', actionableStatus: 'Validated for Sourcing Action' }),
      buildSameMaterialOpportunity({ materialCode: 'MAT-V2', actionableStatus: 'Technical Validation Required' }),
      buildSameMaterialOpportunity({
        materialCode: 'MAT-V3',
        actionableStatus: 'Supplier/Commercial Validation Required'
      }),
      buildSameMaterialOpportunity({ materialCode: 'MAT-V4', actionableStatus: 'Further Data Required' }),
      buildSameMaterialOpportunity({ materialCode: 'MAT-V5', actionableStatus: 'Candidate for Review' })
    ]);

    expect(screen.getByText('Validated for Sourcing Action')).toBeDefined();
    expect(screen.getByText('Technical Validation Required')).toBeDefined();
    expect(screen.getByText('Supplier/Commercial Validation Required')).toBeDefined();
    expect(screen.getByText('Further Data Required')).toBeDefined();
    expect(screen.getByText('Candidate for Review')).toBeDefined();
  });

  it('calls onBackToSuppliers from the header control', () => {
    const onBack = vi.fn();
    renderMaterialTable(undefined, undefined, undefined, { onBackToSuppliers: onBack });

    fireEvent.click(screen.getByRole('button', { name: strings.ariaBackToSuppliers }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('shows the cross-plant empty state when the subtab is opened without opportunities', () => {
    renderMaterialTable(undefined, undefined, []);

    fireEvent.click(screen.getByRole('button', { name: strings.subTabCrossPlant(0) }));
    expect(screen.getByText(strings.noCrossPlantOpportunities)).toBeDefined();
  });
});
