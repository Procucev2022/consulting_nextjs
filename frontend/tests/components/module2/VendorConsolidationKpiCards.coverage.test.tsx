import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { VendorConsolidationKpiCards } from '../../../src/components/module2/VendorConsolidationKpiCards';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import { buildCoverageSummary, buildVendorConsolidationResult } from '../../fixtures/vendorConsolidation';

const strings = UI_STRINGS.module2VendorConsolidation;

afterEach(() => {
  vi.restoreAllMocks();
});

describe('VendorConsolidationKpiCards coverage', () => {
  it('renders the coverage waterfall with the reported taxonomy, provisional, review and client values', () => {
    const result = buildVendorConsolidationResult({ coverageSummary: buildCoverageSummary() });
    render(<VendorConsolidationKpiCards result={result} />);

    expect(screen.getByText(strings.kpiWaterfallTitle)).toBeDefined();
    expect(screen.getByText(strings.kpiWorkflowCoverageBadge)).toBeDefined();
    expect(screen.getByText(strings.kpiTaxonomyVersion)).toBeDefined();

    expect(screen.getByText(strings.kpiTaxonomyVerified)).toBeDefined();
    expect(screen.getByText(strings.kpiSpendShare(75))).toBeDefined();
    expect(screen.getByText(strings.formatCrore('12.5000'))).toBeDefined();
    expect(screen.getByText(strings.kpiMaterialsOfTotal(150, 75))).toBeDefined();

    expect(screen.getByText(strings.kpiProvisional)).toBeDefined();
    expect(screen.getByText(strings.kpiSpendShare(20))).toBeDefined();
    expect(screen.getByText(strings.formatCrore('3.5000'))).toBeDefined();
    expect(screen.getByText(strings.kpiMaterialsOfTotal(30, 15))).toBeDefined();

    expect(screen.getByText(strings.kpiAwaitingReview)).toBeDefined();
    expect(screen.getByText(strings.formatCrore('0.8000'))).toBeDefined();
    expect(screen.getByText(strings.kpiMaterialsOfTotal(10, 5))).toBeDefined();

    expect(screen.getByText(strings.kpiClientApproved)).toBeDefined();
    expect(screen.getByText(strings.formatCrore('1.0000'))).toBeDefined();
    expect(screen.getByText(strings.kpiMaterialsShare(10, 5))).toBeDefined();
  });

  it('falls back to the approved-* fields when taxonomy and client-approved values are absent', () => {
    const legacyCoverage = {
      ...buildCoverageSummary(),
      taxonomyVerifiedSpendPct: undefined,
      taxonomyVerifiedSpendCr: undefined,
      taxonomyVerifiedCount: undefined,
      taxonomyVerifiedMaterialPct: undefined,
      clientApprovedSpendPct: undefined,
      clientApprovedSpendCr: undefined,
      clientApprovedCount: undefined,
      clientApprovedMaterialPct: undefined
    };
    const result = buildVendorConsolidationResult({ coverageSummary: legacyCoverage });
    render(<VendorConsolidationKpiCards result={result} />);

    expect(screen.getByText(strings.kpiSpendShare(80))).toBeDefined();
    expect(screen.getByText(strings.formatCrore('13.5000'))).toBeDefined();
    expect(screen.getByText(strings.kpiMaterialsOfTotal(160, 80))).toBeDefined();

    expect(screen.getByText(strings.kpiSpendShare(0))).toBeDefined();
    expect(screen.getByText(strings.kpiMaterialsShare(0, 0))).toBeDefined();
    // The client-approved fallback renders 0.0000 Cr, and the validated-savings placeholder renders the same text.
    expect(screen.getAllByText(strings.formatCrore('0.0000'))).toHaveLength(2);
  });

  it('omits the coverage banner when no coverage summary is supplied but still renders the cards', () => {
    render(<VendorConsolidationKpiCards result={buildVendorConsolidationResult()} />);

    expect(screen.queryByText(strings.kpiWaterfallTitle)).toBeNull();
    expect(screen.getByText(strings.formatCrore('0.0095'))).toBeDefined();
    expect(screen.getByText(strings.formatCrore('0.0070'))).toBeDefined();
    expect(screen.getByText(`1 ${strings.cardCategoriesAnalysed.toLowerCase()}`)).toBeDefined();
    expect(screen.getByText(strings.kpiMultiSourcedItems(1))).toBeDefined();
    expect(screen.getByText(strings.kpiMultiVendorCategories(1))).toBeDefined();
    expect(screen.getByText(strings.kpiValidatedSavingsPlaceholder)).toBeDefined();
    expect(screen.getByText(strings.kpiValidatedUponExecution)).toBeDefined();
    expect(screen.getByText(strings.cardSuppliersIdentified)).toBeDefined();
    expect(screen.getByText(strings.cardOperatingPlants)).toBeDefined();
  });
});
