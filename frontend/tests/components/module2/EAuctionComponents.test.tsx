/**
 * Module 2 — Lever 2: E-Auction Dynamic Bidding Components Unit Tests
 * Version: MODULE_2_EAUCTION_TESTS_V1.2
 * Compliant with Rule 1 (>=90% coverage), Rule 7 (UI_STRINGS), Rule 8 & 9
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EAuctionCategoryTable } from '@/components/module2/EAuctionCategoryTable';
import { EAuctionMaterialTable } from '@/components/module2/EAuctionMaterialTable';
import { EAuctionDynamicBiddingView } from '@/components/module2/EAuctionDynamicBiddingView';
import { EAuctionKpiCards } from '@/components/module2/EAuctionKpiCards';
import { AUCTION_SUITABILITY_LABELS } from '@/constants/module2EAuction';
import { UI_STRINGS } from '@/constants/uiStrings';
import { Module2StrategicSourcingApi } from '@/utils/module2StrategicSourcingApi';
import { logger } from '@/utils/logger';
import { resolveHumanReadableCategory } from '@/utils/procurementCategoryResolver';
import { assessmentApiClient } from '@/utils/assessmentApi';
import type { AssessmentRecord } from '@/types/assessment';
import type { FrontendLogEntry } from '@/types/logger';
import type {
  EAuctionCategoryCandidate,
  EAuctionMaterialCandidate,
  EAuctionResult,
  EAuctionSavingsRange
} from '@/types/module2EAuction';

const strings = UI_STRINGS.module2EAuction;
const EXPORT_URL = 'https://sourcing.example.test/api/module2/sourcing/e-auction/export-excel';
const SILENT_LOG_ENTRY: FrontendLogEntry = {
  timestamp: '2026-01-01T00:00:00.000Z',
  level: 'error',
  service: 'consulting-frontend',
  message: 'Log output silenced for unit test'
};

const estimatedRange: EAuctionSavingsRange = {
  savingsRangeStatus: 'ESTIMATED',
  addressableSpendInr: 150000000,
  addressableSpendCr: 15.0,
  minSavingsRate: 0.03,
  expectedSavingsRate: 0.055,
  maxSavingsRate: 0.09,
  minEstimatedSavingsInr: 4500000,
  minEstimatedSavingsCr: 0.45,
  expectedEstimatedSavingsInr: 8250000,
  expectedEstimatedSavingsCr: 0.83,
  maxEstimatedSavingsInr: 13500000,
  maxEstimatedSavingsCr: 1.35
};

const notQuantifiedRange: EAuctionSavingsRange = {
  savingsRangeStatus: 'NOT_YET_QUANTIFIABLE',
  addressableSpendInr: 40000000,
  addressableSpendCr: 4.0
};

const mockMaterialCandidate: EAuctionMaterialCandidate = {
  materialCode: 'MAT-COT-001',
  materialDesc: 'ORGANIC COTTON FIBRE 30MM',
  spendCategory: 'Yarn & Raw Cotton',
  unspscCode: '11151600',
  unspscCategory: 'Natural fibers',
  financialYear: 'ALL',
  totalSpendInr: 150000000,
  totalSpendCr: 15.0,
  addressableSpendInr: 150000000,
  addressableSpendCr: 15.0,
  totalQuantity: 500000,
  uom: 'KGS',
  poCount: 45,
  supplierCount: 5,
  plantCount: 3,
  lowestUnitPrice: 280,
  highestUnitPrice: 340,
  priceRangeStr: '₹280.00 – ₹340.00',
  priceDispersionPct: 21.4,
  weightedAveragePrice: 300,
  suitability: AUCTION_SUITABILITY_LABELS.CANDIDATE,
  evidenceRationale: 'Repeat POs (45), multi-supplier (5), spend ₹15.00 Cr.',
  procurementReviewRequirements: ['Contractual supplier agreement'],
  missingInfoLimitations: 'Specification sign-off required',
  savingsRange: estimatedRange
};

const mockCategoryCandidate: EAuctionCategoryCandidate = {
  unspscCode: '11151600',
  unspscCategory: 'Natural fibers',
  spendCategory: 'Yarn & Raw Cotton',
  totalSpendInr: 250000000,
  totalSpendCr: 25.0,
  addressableSpendInr: 150000000,
  addressableSpendCr: 15.0,
  purchaseQuantity: 800000,
  uom: 'KGS',
  distinctMaterialCount: 12,
  poCount: 120,
  supplierCount: 8,
  plantCount: 4,
  priceVariationIndicator: 'Price Dispersion Observed (Max: 1.35x)',
  auctionSuitability: AUCTION_SUITABILITY_LABELS.CANDIDATE,
  evidenceBasedRationale: 'High multi-supplier presence (8) and repeat demand across plants.',
  dataLimitations: 'Supplier capacity not audited',
  materials: [mockMaterialCandidate],
  savingsRange: estimatedRange
};

const mockEAuctionResult: EAuctionResult = {
  assessmentId: 'AIC-2026-0002',
  customerName: 'ABC Textile Ltd',
  availableFinancialYears: ['ALL', 'FY2022-23', 'FY2023-24'],
  selectedFinancialYear: 'ALL',
  totalSpendReviewedInr: 3112831200,
  totalSpendReviewedCr: 311.2831,
  totalAddressableSpendInr: 150000000,
  totalAddressableSpendCr: 15.0,
  categoriesReviewedCount: 240,
  candidateCategoriesCount: 22,
  candidateMaterialsCount: 82,
  recordsRequiringDataReviewCount: 15,
  commerciallyValidatedSavingsInr: 0,
  commerciallyValidatedSavingsCr: 0,
  summarySavingsRange: estimatedRange,
  certificationNotice: 'NOT YET CERTIFIED — Subject to dynamic auction discovery.',
  importantLimitations: [
    'Supplier capacity not verified in SAP PO history',
    'Price dispersion does not guarantee lower bid rates',
    'Specifications require technical QA sign-off'
  ],
  fySummaries: [],
  planningAssumptions: [],
  categories: [mockCategoryCandidate]
};

function buildCategory(overrides: Partial<EAuctionCategoryCandidate>): EAuctionCategoryCandidate {
  return { ...mockCategoryCandidate, ...overrides };
}

function buildMaterial(index: number, overrides: Partial<EAuctionMaterialCandidate> = {}): EAuctionMaterialCandidate {
  return {
    ...mockMaterialCandidate,
    materialCode: `MAT-BULK-${String(index).padStart(3, '0')}`,
    materialDesc: `BULK MATERIAL ${index}`,
    ...overrides
  };
}

function buildBulkCategories(count: number): EAuctionCategoryCandidate[] {
  return Array.from({ length: count }, (_value, index) =>
    buildCategory({
      unspscCode: `2000${String(index).padStart(4, '0')}`,
      unspscCategory: `Bulk Category ${index + 1}`,
      spendCategory: `Bulk Spend ${index + 1}`,
      totalSpendInr: (count - index) * 1000000,
      totalSpendCr: count - index,
      materials: []
    })
  );
}

// Four categories with distinct spend, materials, POs, suppliers and suitability so that every sort key
// produces a different order.
const categoryAlpha = mockCategoryCandidate;
const categoryBeta = buildCategory({
  unspscCode: '11101700',
  unspscCategory: 'Synthetic fibers',
  spendCategory: 'Polymer Blends',
  totalSpendInr: 100000000,
  totalSpendCr: 10.0,
  addressableSpendInr: 40000000,
  addressableSpendCr: 4.0,
  purchaseQuantity: 120000,
  distinctMaterialCount: 30,
  poCount: 60,
  supplierCount: 3,
  auctionSuitability: AUCTION_SUITABILITY_LABELS.FURTHER_DATA,
  evidenceBasedRationale: 'Single plant evidence only.',
  dataLimitations: 'Specifications pending',
  savingsRange: notQuantifiedRange,
  materials: []
});
const categoryGamma = buildCategory({
  unspscCode: '11131900',
  unspscCategory: 'Packaging Films',
  spendCategory: 'Packaging',
  totalSpendInr: 5000000,
  totalSpendCr: 0.5,
  addressableSpendInr: 1000000,
  addressableSpendCr: 0.1,
  purchaseQuantity: 2000,
  uom: 'NOS',
  distinctMaterialCount: 2,
  poCount: 4,
  supplierCount: 1,
  auctionSuitability: AUCTION_SUITABILITY_LABELS.NOT_SUITABLE,
  savingsRange: undefined,
  materials: []
});
const categoryDelta = buildCategory({
  unspscCode: '11140000',
  unspscCategory: 'Lubricant Blends',
  spendCategory: 'Lubricants',
  totalSpendInr: 2000000,
  totalSpendCr: 0.2,
  addressableSpendInr: 500000,
  addressableSpendCr: 0.05,
  purchaseQuantity: 300,
  uom: 'LTR',
  distinctMaterialCount: 1,
  poCount: 2,
  supplierCount: 2,
  auctionSuitability: AUCTION_SUITABILITY_LABELS.NOT_ASSESSED,
  savingsRange: { ...estimatedRange, expectedSavingsRate: undefined },
  materials: []
});

const dyeMaterial = buildMaterial(2, {
  materialCode: 'MAT-CHM-002',
  materialDesc: 'INDUSTRIAL DYE BLUE',
  financialYear: 'FY2023-24',
  suitability: AUCTION_SUITABILITY_LABELS.FURTHER_DATA,
  procurementReviewRequirements: [],
  savingsRange: notQuantifiedRange
});

const dataRows = (): HTMLElement[] => screen.getAllByRole('row').slice(1);
const rowCodes = (): string[] =>
  dataRows().map((row) => within(row).getAllByRole('cell')[0].textContent ?? '');
const columnHeader = (label: string): HTMLElement => screen.getByRole('columnheader', { name: new RegExp(label) });
const searchInput = (): HTMLElement => screen.getByPlaceholderText(strings.searchPlaceholder);
const suitabilityFilter = (): HTMLElement => screen.getByRole('combobox', { name: strings.filterSuitability });
const rowsPerPageSelect = (): HTMLElement => screen.getByRole('combobox', { name: strings.rowsPerPageLabel });
const nextPageButton = (): HTMLElement => screen.getByRole('button', { name: strings.btnNextPage });
const previousPageButton = (): HTMLElement => screen.getByRole('button', { name: strings.btnPreviousPage });
const customerSelect = (): HTMLElement => screen.getByRole('combobox', { name: strings.customerFilterLabel });
const fySelect = (): HTMLElement => screen.getByRole('combobox', { name: strings.financialYearFilterLabel });
const refreshButton = (): HTMLElement => screen.getByRole('button', { name: strings.btnRefresh });

function createDeferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
} {
  let resolve: (value: T) => void = (): void => undefined;
  let reject: (reason: unknown) => void = (): void => undefined;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const flushPromises = (): Promise<void> => new Promise<void>((resolve) => setTimeout(resolve, 0));

describe('EAuctionKpiCards Component', () => {
  it('renders the supplied totals, counts and estimated savings range', () => {
    render(<EAuctionKpiCards result={mockEAuctionResult} />);
    expect(screen.getByText(strings.cardTotalSpendReviewed)).toBeInTheDocument();
    expect(screen.getByText('₹311.28 Cr')).toBeInTheDocument();
    expect(screen.getByText(strings.cardCategoriesReviewed)).toBeInTheDocument();
    expect(screen.getByText('240')).toBeInTheDocument();
    expect(screen.getByText(strings.cardCandidateCategories)).toBeInTheDocument();
    expect(screen.getByText(strings.kpiCandidateCountSummary(22, 82))).toBeInTheDocument();
    expect(screen.getByText(strings.colAddressableSpend)).toBeInTheDocument();
    expect(screen.getByText('₹15.00 Cr')).toBeInTheDocument();
    expect(screen.getByText(strings.kpiEstimatedSavingsLabel)).toBeInTheDocument();
    expect(screen.getByText('₹0.45 - ₹1.35 Cr')).toBeInTheDocument();
    expect(screen.getByText(strings.expectedSavingsDetail('0.83', '5.5'))).toBeInTheDocument();
    expect(screen.getByText(strings.provisionalEditableNotice)).toBeInTheDocument();
    expect(screen.getByText(strings.cardValidatedSavings)).toBeInTheDocument();
  });

  it('shows the commercially validated savings from the result instead of a fixed amount', () => {
    render(<EAuctionKpiCards result={{ ...mockEAuctionResult, commerciallyValidatedSavingsCr: 2.5 }} />);
    expect(screen.getByText('₹2.50 Cr')).toBeInTheDocument();
    expect(screen.queryByText('₹0.00 Cr')).not.toBeInTheDocument();
  });

  it('shows the not-yet-quantifiable state and the data review count when savings are not estimated', () => {
    render(<EAuctionKpiCards result={{ ...mockEAuctionResult, summarySavingsRange: notQuantifiedRange }} />);
    expect(screen.getByText(strings.statusNotYetQuantifiable)).toBeInTheDocument();
    expect(screen.getByText(strings.kpiRecordsNeedDataReview(15))).toBeInTheDocument();
    expect(screen.queryByText(strings.provisionalEditableNotice)).not.toBeInTheDocument();
  });

  it('falls back to the not-yet-quantifiable state when no summary range is supplied', () => {
    render(<EAuctionKpiCards result={{ ...mockEAuctionResult, summarySavingsRange: undefined }} />);
    expect(screen.getByText(strings.statusNotYetQuantifiable)).toBeInTheDocument();
    expect(screen.getByText(strings.kpiRecordsNeedDataReview(15))).toBeInTheDocument();
  });

  it('treats a missing addressable total as zero and a missing expected rate as 0.0%', () => {
    render(
      <EAuctionKpiCards
        result={{
          ...mockEAuctionResult,
          totalAddressableSpendCr: undefined,
          commerciallyValidatedSavingsCr: 2.5,
          summarySavingsRange: { ...estimatedRange, expectedSavingsRate: undefined }
        }}
      />
    );
    expect(screen.getByText('₹0.00 Cr')).toBeInTheDocument();
    expect(screen.getByText(strings.expectedSavingsDetail('0.83', '0.0'))).toBeInTheDocument();
  });

  it('shows zero validated savings when the result does not supply the field', () => {
    render(
      <EAuctionKpiCards result={{ ...mockEAuctionResult, commerciallyValidatedSavingsCr: undefined }} />
    );
    expect(screen.getByText('₹0.00 Cr')).toBeInTheDocument();
    expect(screen.getByText(strings.cardValidatedSavings)).toBeInTheDocument();
  });

  it('does not print undefined when the expected savings amount is missing', () => {
    render(
      <EAuctionKpiCards
        result={{
          ...mockEAuctionResult,
          summarySavingsRange: { ...estimatedRange, expectedEstimatedSavingsCr: undefined }
        }}
      />
    );
    expect(screen.getByText(strings.expectedSavingsDetail('', '5.5'))).toBeInTheDocument();
    expect(screen.queryByText(/undefined/)).not.toBeInTheDocument();
  });
});

describe('EAuctionCategoryTable Component', () => {
  it('renders category rows with supplied totals, quantities, savings and evidence', () => {
    render(<EAuctionCategoryTable categories={[categoryAlpha]} onSelectCategory={vi.fn()} />);
    const [row] = dataRows();
    expect(within(row).getByText('11151600')).toBeInTheDocument();
    expect(within(row).getByText('Natural fibers')).toBeInTheDocument();
    expect(within(row).getByText('₹25.0000 Cr')).toBeInTheDocument();
    expect(within(row).getByText('₹15.0000 Cr')).toBeInTheDocument();
    expect(within(row).getByText(`${(800000).toLocaleString()} KGS`)).toBeInTheDocument();
    expect(within(row).getByText('₹0.45 - ₹1.35 Cr')).toBeInTheDocument();
    expect(within(row).getByText(strings.expectedSavingsDetail('0.83', '5.5'))).toBeInTheDocument();
    expect(within(row).getByText(strings.planningAssumptionBadge)).toBeInTheDocument();
    expect(within(row).getByText(strings.suitabilityCandidateForReview)).toBeInTheDocument();
    expect(within(row).getByText(categoryAlpha.evidenceBasedRationale)).toBeInTheDocument();
    expect(within(row).getByText(categoryAlpha.dataLimitations)).toBeInTheDocument();
  });

  it('filters rows by UNSPSC code, category title and spend category', () => {
    render(
      <EAuctionCategoryTable
        categories={[categoryAlpha, categoryBeta, categoryGamma, categoryDelta]}
        onSelectCategory={vi.fn()}
      />
    );
    fireEvent.change(searchInput(), { target: { value: '11101700' } });
    expect(rowCodes()).toEqual(['11101700']);
    fireEvent.change(searchInput(), { target: { value: 'SYNTHETIC' } });
    expect(rowCodes()).toEqual(['11101700']);
    fireEvent.change(searchInput(), { target: { value: 'lubricants' } });
    expect(rowCodes()).toEqual(['11140000']);
    fireEvent.change(searchInput(), { target: { value: 'no such category' } });
    expect(screen.getByText(strings.noCandidatesFound)).toBeInTheDocument();
    expect(screen.getByText(strings.categoriesShowingSummary(0, 0))).toBeInTheDocument();
  });

  it('filters rows by auction suitability and restores every row for All', () => {
    render(
      <EAuctionCategoryTable
        categories={[categoryAlpha, categoryBeta, categoryGamma, categoryDelta]}
        onSelectCategory={vi.fn()}
      />
    );
    fireEvent.change(suitabilityFilter(), { target: { value: AUCTION_SUITABILITY_LABELS.FURTHER_DATA } });
    expect(rowCodes()).toEqual(['11101700']);
    fireEvent.change(suitabilityFilter(), { target: { value: 'ALL' } });
    expect(rowCodes()).toHaveLength(4);
  });

  it('sorts by each column and reverses the order when the same column is clicked again', () => {
    render(
      <EAuctionCategoryTable
        categories={[categoryAlpha, categoryBeta, categoryGamma, categoryDelta]}
        onSelectCategory={vi.fn()}
      />
    );
    const alpha = '11151600';
    const beta = '11101700';
    const gamma = '11131900';
    const delta = '11140000';
    expect(rowCodes()).toEqual([alpha, beta, gamma, delta]);

    fireEvent.click(columnHeader(strings.colTotalSpend));
    expect(rowCodes()).toEqual([delta, gamma, beta, alpha]);

    fireEvent.click(columnHeader(strings.colDistinctMaterials));
    expect(rowCodes()).toEqual([beta, alpha, gamma, delta]);
    fireEvent.click(columnHeader(strings.colDistinctMaterials));
    expect(rowCodes()).toEqual([delta, gamma, alpha, beta]);

    fireEvent.click(columnHeader(strings.colPoCount));
    expect(rowCodes()).toEqual([alpha, beta, gamma, delta]);
    fireEvent.click(columnHeader(strings.colPoCount));
    expect(rowCodes()).toEqual([delta, gamma, beta, alpha]);

    fireEvent.click(columnHeader(strings.colSupplierCount));
    expect(rowCodes()).toEqual([alpha, beta, delta, gamma]);
    fireEvent.click(columnHeader(strings.colSupplierCount));
    expect(rowCodes()).toEqual([gamma, delta, beta, alpha]);
  });

  it('paginates categories and resets to the first page when the page size changes', () => {
    render(<EAuctionCategoryTable categories={buildBulkCategories(12)} onSelectCategory={vi.fn()} />);
    expect(screen.getByText(strings.paginationStatus(1, 2))).toBeInTheDocument();
    expect(dataRows()).toHaveLength(10);
    expect(previousPageButton()).toBeDisabled();

    fireEvent.click(nextPageButton());
    expect(screen.getByText(strings.paginationStatus(2, 2))).toBeInTheDocument();
    expect(dataRows()).toHaveLength(2);
    expect(nextPageButton()).toBeDisabled();
    expect(previousPageButton()).toBeEnabled();

    fireEvent.click(previousPageButton());
    expect(screen.getByText(strings.paginationStatus(1, 2))).toBeInTheDocument();
    expect(dataRows()).toHaveLength(10);

    fireEvent.click(nextPageButton());
    fireEvent.change(rowsPerPageSelect(), { target: { value: '25' } });
    expect(screen.getByText(strings.paginationStatus(1, 1))).toBeInTheDocument();
    expect(dataRows()).toHaveLength(12);
    expect(screen.getByText(strings.categoriesShowingSummary(12, 12))).toBeInTheDocument();
  });

  it('returns to the first page when the search changes and shows the empty state when nothing matches', () => {
    render(<EAuctionCategoryTable categories={buildBulkCategories(12)} onSelectCategory={vi.fn()} />);
    fireEvent.click(nextPageButton());
    fireEvent.change(searchInput(), { target: { value: 'Bulk Category 1' } });
    expect(screen.getByText(strings.paginationStatus(1, 1))).toBeInTheDocument();
    expect(dataRows()).toHaveLength(4);

    fireEvent.change(searchInput(), { target: { value: 'zzz no match' } });
    expect(screen.getByText(strings.noCandidatesFound)).toBeInTheDocument();
    expect(screen.getByText(strings.categoriesShowingSummary(0, 0))).toBeInTheDocument();
  });

  it('keeps the current page within range when the category list shrinks', () => {
    const { rerender } = render(
      <EAuctionCategoryTable categories={buildBulkCategories(12)} onSelectCategory={vi.fn()} />
    );
    fireEvent.click(nextPageButton());
    expect(screen.getByText(strings.paginationStatus(2, 2))).toBeInTheDocument();

    rerender(<EAuctionCategoryTable categories={buildBulkCategories(3)} onSelectCategory={vi.fn()} />);
    expect(screen.getByText(strings.paginationStatus(1, 1))).toBeInTheDocument();
    expect(dataRows()).toHaveLength(3);
    expect(previousPageButton()).toBeDisabled();
    expect(nextPageButton()).toBeDisabled();
  });

  it('selects a category from the row and from its materials button, each exactly once', () => {
    const onSelect = vi.fn();
    render(<EAuctionCategoryTable categories={[categoryAlpha, categoryBeta]} onSelectCategory={onSelect} />);

    fireEvent.click(within(dataRows()[1]).getByText(categoryBeta.unspscCode));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenLastCalledWith(categoryBeta);

    fireEvent.click(within(dataRows()[0]).getByRole('button', { name: strings.btnViewMaterials }));
    expect(onSelect).toHaveBeenCalledTimes(2);
    expect(onSelect).toHaveBeenLastCalledWith(categoryAlpha);
  });

  it('highlights the row whose spend category matches the selected category name', () => {
    render(
      <EAuctionCategoryTable
        categories={[categoryAlpha, categoryBeta]}
        onSelectCategory={vi.fn()}
        selectedCategoryName={categoryBeta.spendCategory}
      />
    );
    expect(dataRows()[1]).toHaveClass('font-medium');
    expect(dataRows()[0]).not.toHaveClass('font-medium');
  });

  it('renders the suitability badge and the savings state for each category', () => {
    render(
      <EAuctionCategoryTable
        categories={[categoryAlpha, categoryBeta, categoryGamma, categoryDelta]}
        onSelectCategory={vi.fn()}
      />
    );
    const [alphaRow, betaRow, gammaRow, deltaRow] = dataRows();
    expect(within(alphaRow).getByText(strings.suitabilityCandidateForReview)).toBeInTheDocument();
    expect(within(betaRow).getByText(strings.suitabilityFurtherDataRequired)).toBeInTheDocument();
    expect(within(gammaRow).getByText(strings.suitabilityNotCurrentlySuitable)).toBeInTheDocument();
    expect(within(deltaRow).getByText(strings.suitabilityNotAssessed)).toBeInTheDocument();
    expect(within(betaRow).getByText(strings.statusNotYetQuantifiable)).toBeInTheDocument();
    expect(within(gammaRow).getByText(strings.statusNotYetQuantifiable)).toBeInTheDocument();
    expect(within(deltaRow).getByText(strings.expectedSavingsDetail('0.83', '0.0'))).toBeInTheDocument();
  });

  it('falls back to the spend category when the UNSPSC category title is blank', () => {
    const blankTitle = buildCategory({ unspscCategory: '', spendCategory: 'Polymer Blends' });
    render(<EAuctionCategoryTable categories={[blankTitle]} onSelectCategory={vi.fn()} />);
    expect(
      within(dataRows()[0]).getByText(resolveHumanReadableCategory('Polymer Blends'))
    ).toBeInTheDocument();
  });
});

describe('EAuctionMaterialTable Component', () => {
  it('renders material rows with supplied values and returns to the categories on back', () => {
    const handleBack = vi.fn();
    render(
      <EAuctionMaterialTable
        materials={[mockMaterialCandidate]}
        categoryName="Yarn & Raw Cotton"
        onBack={handleBack}
      />
    );
    expect(screen.getByText('MAT-COT-001')).toBeInTheDocument();
    expect(screen.getByText('ORGANIC COTTON FIBRE 30MM')).toBeInTheDocument();
    expect(screen.getByText(strings.colMaterialCode)).toBeInTheDocument();
    expect(screen.getByText(strings.colMaterialDesc)).toBeInTheDocument();
    expect(screen.getByText(strings.categoryDrilldownTitle('Yarn & Raw Cotton'))).toBeInTheDocument();
    expect(screen.getByText(strings.categoryDrilldownSubtitle)).toBeInTheDocument();
    expect(screen.getAllByText('₹15.0000 Cr')).toHaveLength(2);
    expect(screen.getByText(`${(500000).toLocaleString()} KGS`)).toBeInTheDocument();
    expect(screen.getByText('₹300')).toBeInTheDocument();
    expect(screen.getByText(mockMaterialCandidate.priceRangeStr)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: strings.btnBackToCategories }));
    expect(handleBack).toHaveBeenCalledTimes(1);
  });

  it('filters materials by code or description and by suitability', () => {
    render(
      <EAuctionMaterialTable
        materials={[mockMaterialCandidate, dyeMaterial]}
        categoryName="Dyes"
        onBack={vi.fn()}
      />
    );
    fireEvent.change(searchInput(), { target: { value: 'dye' } });
    expect(rowCodes()).toEqual(['MAT-CHM-002']);
    fireEvent.change(searchInput(), { target: { value: 'mat-cot' } });
    expect(rowCodes()).toEqual(['MAT-COT-001']);
    fireEvent.change(searchInput(), { target: { value: 'nothing matches' } });
    expect(screen.getByText(strings.noCandidatesFound)).toBeInTheDocument();
    expect(screen.getByText(strings.materialsShowingSummary(0, 0))).toBeInTheDocument();

    fireEvent.change(searchInput(), { target: { value: '' } });
    fireEvent.change(suitabilityFilter(), { target: { value: AUCTION_SUITABILITY_LABELS.FURTHER_DATA } });
    expect(rowCodes()).toEqual(['MAT-CHM-002']);
    fireEvent.change(suitabilityFilter(), { target: { value: 'ALL' } });
    expect(rowCodes()).toHaveLength(2);
  });

  it('paginates materials, resets to the first page on search and honours the rows-per-page choice', () => {
    const materials = Array.from({ length: 12 }, (_value, index) => buildMaterial(index + 1));
    render(<EAuctionMaterialTable materials={materials} categoryName="Bulk" onBack={vi.fn()} />);
    expect(screen.getByText(strings.paginationStatus(1, 2))).toBeInTheDocument();
    expect(dataRows()).toHaveLength(10);

    fireEvent.click(nextPageButton());
    expect(screen.getByText(strings.paginationStatus(2, 2))).toBeInTheDocument();
    expect(dataRows()).toHaveLength(2);

    fireEvent.click(previousPageButton());
    expect(screen.getByText(strings.paginationStatus(1, 2))).toBeInTheDocument();
    expect(dataRows()).toHaveLength(10);

    fireEvent.change(rowsPerPageSelect(), { target: { value: '25' } });
    expect(screen.getByText(strings.paginationStatus(1, 1))).toBeInTheDocument();
    expect(dataRows()).toHaveLength(12);

    fireEvent.change(searchInput(), { target: { value: 'BULK MATERIAL 1' } });
    expect(screen.getByText(strings.materialsShowingSummary(4, 4))).toBeInTheDocument();
    expect(screen.getByText(strings.paginationStatus(1, 1))).toBeInTheDocument();
  });

  it('shows the savings range or the not-yet-quantifiable state, and the review requirement fallback', () => {
    render(
      <EAuctionMaterialTable
        materials={[mockMaterialCandidate, dyeMaterial]}
        categoryName="Mixed"
        onBack={vi.fn()}
      />
    );
    expect(screen.getByText('₹0.45 - ₹1.35 Cr')).toBeInTheDocument();
    expect(screen.getByText(strings.planningAssumptionBadge)).toBeInTheDocument();
    expect(screen.getByText(strings.statusNotYetQuantifiable)).toBeInTheDocument();
    expect(screen.getByText('Contractual supplier agreement')).toBeInTheDocument();
    expect(screen.getByText(strings.defaultReviewRequirement)).toBeInTheDocument();
  });

  it('renders the suitability badge for every classification and handles a missing savings range', () => {
    const materials = [
      buildMaterial(1, { suitability: AUCTION_SUITABILITY_LABELS.CANDIDATE }),
      buildMaterial(2, { suitability: AUCTION_SUITABILITY_LABELS.FURTHER_DATA }),
      buildMaterial(3, { suitability: AUCTION_SUITABILITY_LABELS.NOT_SUITABLE, savingsRange: undefined }),
      buildMaterial(4, { suitability: AUCTION_SUITABILITY_LABELS.NOT_ASSESSED })
    ];
    render(<EAuctionMaterialTable materials={materials} categoryName="Mixed" onBack={vi.fn()} />);
    const rows = dataRows();
    expect(within(rows[0]).getByText(strings.suitabilityCandidateForReview)).toBeInTheDocument();
    expect(within(rows[1]).getByText(strings.suitabilityFurtherDataRequired)).toBeInTheDocument();
    expect(within(rows[2]).getByText(strings.suitabilityNotCurrentlySuitable)).toBeInTheDocument();
    expect(within(rows[2]).getByText(strings.statusNotYetQuantifiable)).toBeInTheDocument();
    expect(within(rows[3]).getByText(strings.suitabilityNotAssessed)).toBeInTheDocument();
  });

  it('shows zero for a missing addressable spend and 0.0% for a missing expected savings rate', () => {
    const material = buildMaterial(1, {
      addressableSpendCr: undefined,
      savingsRange: { ...estimatedRange, expectedSavingsRate: undefined }
    });
    render(<EAuctionMaterialTable materials={[material]} categoryName="Mixed" onBack={vi.fn()} />);
    expect(screen.getByText('₹0.0000 Cr')).toBeInTheDocument();
    expect(screen.getByText(strings.expectedSavingsDetail('0.83', '0.0'))).toBeInTheDocument();
  });
});

describe('EAuctionDynamicBiddingView Component', () => {
  beforeEach(() => {
    vi.spyOn(assessmentApiClient, 'getAssessments').mockResolvedValue([
      {
        assessmentId: 'AIC-2026-0002', customerName: 'ABC Textile Ltd', industry: 'Textiles',
        assessmentPeriodStart: '2023-04-01', assessmentPeriodEnd: '2024-03-31', ndaStatus: 'SIGNED',
        dataStatus: 'VALIDATED', assignedAnalyst: 'Analyst', status: 'IN_PROGRESS',
        createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z'
      },
      {
        assessmentId: 'AIC-2026-0003', customerName: 'PQR Cement Ltd', industry: 'Cement',
        assessmentPeriodStart: '2023-04-01', assessmentPeriodEnd: '2024-03-31', ndaStatus: 'SIGNED',
        dataStatus: 'VALIDATED', assignedAnalyst: 'Analyst', status: 'IN_PROGRESS',
        createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z'
      }
    ] satisfies AssessmentRecord[]);
    vi.spyOn(Module2StrategicSourcingApi, 'getEAuctionDynamicBidding').mockResolvedValue(mockEAuctionResult);
    vi.spyOn(Module2StrategicSourcingApi, 'getEAuctionExcelDownloadUrl').mockReturnValue(EXPORT_URL);
    vi.spyOn(window, 'open').mockImplementation(() => null);
    vi.spyOn(logger, 'error').mockReturnValue(SILENT_LOG_ENTRY);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads the assessment on mount and renders the KPI cards and category register', async () => {
    render(<EAuctionDynamicBiddingView assessmentId="AIC-2026-0002" />);
    expect(screen.getByText(strings.pageTitle)).toBeInTheDocument();
    expect(await screen.findByText('₹311.28 Cr')).toBeInTheDocument();
    expect(Module2StrategicSourcingApi.getEAuctionDynamicBidding).toHaveBeenCalledWith('AIC-2026-0002', {
      financialYear: undefined
    });
    expect(screen.getByText(strings.cardCandidateCategories)).toBeInTheDocument();
    expect(screen.getByText(strings.kpiCandidateCountSummary(22, 82))).toBeInTheDocument();
    expect(screen.getByText(categoryAlpha.unspscCode)).toBeInTheDocument();
    expect(fySelect()).toHaveValue('ALL');
    expect(screen.getByRole('option', { name: strings.allFinancialYears })).toBeInTheDocument();
  });

  it('requests the chosen financial year and returns to all years', async () => {
    render(<EAuctionDynamicBiddingView assessmentId="AIC-2026-0002" />);
    await screen.findByText('₹311.28 Cr');

    fireEvent.change(fySelect(), { target: { value: 'FY2022-23' } });
    await waitFor(() =>
      expect(Module2StrategicSourcingApi.getEAuctionDynamicBidding).toHaveBeenLastCalledWith('AIC-2026-0002', {
        financialYear: 'FY2022-23'
      })
    );

    fireEvent.change(fySelect(), { target: { value: 'ALL' } });
    await waitFor(() =>
      expect(Module2StrategicSourcingApi.getEAuctionDynamicBidding).toHaveBeenLastCalledWith('AIC-2026-0002', {
        financialYear: undefined
      })
    );
  });

  it('switches the customer locally and keeps the chosen customer selected', async () => {
    render(<EAuctionDynamicBiddingView assessmentId="AIC-2026-0002" />);
    await screen.findByText('₹311.28 Cr');

    fireEvent.change(customerSelect(), { target: { value: 'AIC-2026-0003' } });
    expect(customerSelect()).toHaveValue('AIC-2026-0003');
    await waitFor(() =>
      expect(Module2StrategicSourcingApi.getEAuctionDynamicBidding).toHaveBeenLastCalledWith('AIC-2026-0003', {
        financialYear: undefined
      })
    );
    expect(customerSelect()).toHaveValue('AIC-2026-0003');
  });

  it('notifies the parent of a customer change and loads the assessment the parent passes back', async () => {
    const onCustomerChange = vi.fn();
    const { rerender } = render(
      <EAuctionDynamicBiddingView assessmentId="AIC-2026-0002" onCustomerChange={onCustomerChange} />
    );
    await screen.findByText('₹311.28 Cr');

    fireEvent.change(customerSelect(), { target: { value: 'AIC-2026-0003' } });
    expect(onCustomerChange).toHaveBeenCalledWith('AIC-2026-0003');

    rerender(<EAuctionDynamicBiddingView assessmentId="AIC-2026-0003" onCustomerChange={onCustomerChange} />);
    await waitFor(() =>
      expect(Module2StrategicSourcingApi.getEAuctionDynamicBidding).toHaveBeenLastCalledWith('AIC-2026-0003', {
        financialYear: undefined
      })
    );
    expect(customerSelect()).toHaveValue('AIC-2026-0003');
  });

  it('resets the financial year when the assessment prop changes', async () => {
    const { rerender } = render(<EAuctionDynamicBiddingView assessmentId="AIC-2026-0002" />);
    await screen.findByText('₹311.28 Cr');
    fireEvent.change(fySelect(), { target: { value: 'FY2022-23' } });
    await waitFor(() =>
      expect(Module2StrategicSourcingApi.getEAuctionDynamicBidding).toHaveBeenLastCalledWith('AIC-2026-0002', {
        financialYear: 'FY2022-23'
      })
    );

    rerender(<EAuctionDynamicBiddingView assessmentId="AIC-2026-0003" />);
    await waitFor(() =>
      expect(Module2StrategicSourcingApi.getEAuctionDynamicBidding).toHaveBeenLastCalledWith('AIC-2026-0003', {
        financialYear: undefined
      })
    );
    expect(fySelect()).toHaveValue('ALL');
  });

  it('does not request candidates when no assessment is selected', () => {
    render(<EAuctionDynamicBiddingView assessmentId="" />);
    expect(screen.getByText(strings.pageTitle)).toBeInTheDocument();
    expect(Module2StrategicSourcingApi.getEAuctionDynamicBidding).not.toHaveBeenCalled();
    expect(screen.queryByText(strings.cardTotalSpendReviewed)).not.toBeInTheDocument();
  });

  it('treats an undefined assessment prop as no selection', () => {
    render(<EAuctionDynamicBiddingView assessmentId={undefined} />);
    expect(Module2StrategicSourcingApi.getEAuctionDynamicBidding).not.toHaveBeenCalled();
    expect(screen.queryByText(strings.cardTotalSpendReviewed)).not.toBeInTheDocument();
  });

  it('drills into a category and returns to the category register', async () => {
    render(<EAuctionDynamicBiddingView assessmentId="AIC-2026-0002" />);
    await screen.findByText('₹311.28 Cr');

    fireEvent.click(screen.getByRole('button', { name: strings.btnViewMaterials }));
    expect(screen.getByText(strings.categoryDrilldownTitle('Yarn & Raw Cotton'))).toBeInTheDocument();
    expect(screen.getByText('MAT-COT-001')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: strings.btnBackToCategories }));
    expect(screen.queryByText('MAT-COT-001')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: strings.btnViewMaterials })).toBeInTheDocument();
  });

  it('closes an open drill-down when the financial year or the customer changes', async () => {
    render(<EAuctionDynamicBiddingView assessmentId="AIC-2026-0002" />);
    await screen.findByText('₹311.28 Cr');

    fireEvent.click(screen.getByRole('button', { name: strings.btnViewMaterials }));
    fireEvent.change(fySelect(), { target: { value: 'FY2022-23' } });
    expect(screen.queryByText('MAT-COT-001')).not.toBeInTheDocument();
    await waitFor(() =>
      expect(Module2StrategicSourcingApi.getEAuctionDynamicBidding).toHaveBeenLastCalledWith('AIC-2026-0002', {
        financialYear: 'FY2022-23'
      })
    );

    fireEvent.click(screen.getByRole('button', { name: strings.btnViewMaterials }));
    expect(screen.getByText('MAT-COT-001')).toBeInTheDocument();
    fireEvent.change(customerSelect(), { target: { value: 'AIC-2026-0003' } });
    expect(screen.queryByText('MAT-COT-001')).not.toBeInTheDocument();
    await waitFor(() =>
      expect(Module2StrategicSourcingApi.getEAuctionDynamicBidding).toHaveBeenLastCalledWith('AIC-2026-0003', {
        financialYear: undefined
      })
    );
  });

  it('refreshes the current selection and disables Refresh while the request is in flight', async () => {
    render(<EAuctionDynamicBiddingView assessmentId="AIC-2026-0002" />);
    await screen.findByText('₹311.28 Cr');

    const pending = createDeferred<EAuctionResult | null>();
    vi.mocked(Module2StrategicSourcingApi.getEAuctionDynamicBidding).mockReturnValueOnce(pending.promise);
    fireEvent.click(refreshButton());
    expect(refreshButton()).toBeDisabled();
    expect(Module2StrategicSourcingApi.getEAuctionDynamicBidding).toHaveBeenLastCalledWith('AIC-2026-0002', {
      financialYear: undefined
    });

    await act(async () => {
      pending.resolve(mockEAuctionResult);
      await flushPromises();
    });
    expect(refreshButton()).toBeEnabled();
  });

  it('shows no results while the first request is still pending', async () => {
    const pending = createDeferred<EAuctionResult | null>();
    vi.mocked(Module2StrategicSourcingApi.getEAuctionDynamicBidding).mockReturnValueOnce(pending.promise);
    render(<EAuctionDynamicBiddingView assessmentId="AIC-2026-0002" />);

    expect(refreshButton()).toBeDisabled();
    expect(screen.queryByText(strings.cardTotalSpendReviewed)).not.toBeInTheDocument();

    await act(async () => {
      pending.resolve(mockEAuctionResult);
      await flushPromises();
    });
    expect(await screen.findByText('₹311.28 Cr')).toBeInTheDocument();
  });

  it('opens the Excel export for the current customer and financial year', async () => {
    render(<EAuctionDynamicBiddingView assessmentId="AIC-2026-0002" />);
    await screen.findByText('₹311.28 Cr');

    fireEvent.change(fySelect(), { target: { value: 'FY2022-23' } });
    await waitFor(() =>
      expect(Module2StrategicSourcingApi.getEAuctionDynamicBidding).toHaveBeenLastCalledWith('AIC-2026-0002', {
        financialYear: 'FY2022-23'
      })
    );

    fireEvent.click(screen.getByRole('button', { name: strings.btnDownloadExcel }));
    expect(Module2StrategicSourcingApi.getEAuctionExcelDownloadUrl).toHaveBeenCalledWith(
      'AIC-2026-0002',
      'FY2022-23'
    );
    expect(window.open).toHaveBeenCalledWith(EXPORT_URL, '_blank');
  });

  it('shows the back to overview action only when a handler is supplied', async () => {
    const onBackToOverview = vi.fn();
    const { unmount } = render(
      <EAuctionDynamicBiddingView assessmentId="AIC-2026-0002" onBackToOverview={onBackToOverview} />
    );
    await screen.findByText('₹311.28 Cr');
    fireEvent.click(screen.getByRole('button', { name: strings.btnBackToOverview }));
    expect(onBackToOverview).toHaveBeenCalledTimes(1);
    unmount();

    const second = render(<EAuctionDynamicBiddingView assessmentId="AIC-2026-0002" />);
    await screen.findByText('₹311.28 Cr');
    expect(screen.queryByRole('button', { name: strings.btnBackToOverview })).not.toBeInTheDocument();
    second.unmount();
  });

  it('hides the financial year filter when the result lists no financial years', async () => {
    vi.mocked(Module2StrategicSourcingApi.getEAuctionDynamicBidding).mockResolvedValueOnce({
      ...mockEAuctionResult,
      availableFinancialYears: undefined
    });
    render(<EAuctionDynamicBiddingView assessmentId="AIC-2026-0002" />);
    await screen.findByText('₹311.28 Cr');
    expect(screen.queryByRole('combobox', { name: strings.financialYearFilterLabel })).not.toBeInTheDocument();
  });

  it('shows the load failure banner and logs it when the sourcing engine returns no data', async () => {
    vi.mocked(Module2StrategicSourcingApi.getEAuctionDynamicBidding).mockResolvedValueOnce(null);
    render(<EAuctionDynamicBiddingView assessmentId="AIC-2026-0002" />);

    expect(await screen.findByText(strings.errorLoadFailed)).toBeInTheDocument();
    expect(screen.queryByText('₹311.28 Cr')).not.toBeInTheDocument();
    expect(logger.error).toHaveBeenCalledWith(
      expect.any(String),
      { assessmentId: 'AIC-2026-0002', financialYear: 'ALL' },
      expect.any(Error)
    );
  });

  it('shows the underlying message when the request rejects with an Error', async () => {
    vi.mocked(Module2StrategicSourcingApi.getEAuctionDynamicBidding).mockRejectedValueOnce(
      new Error('Gateway timed out')
    );
    render(<EAuctionDynamicBiddingView assessmentId="AIC-2026-0002" />);
    expect(await screen.findByText('Gateway timed out')).toBeInTheDocument();
  });

  it('shows the generic unknown error message when a non-Error value is thrown', async () => {
    vi.mocked(Module2StrategicSourcingApi.getEAuctionDynamicBidding).mockRejectedValueOnce('boom');
    render(<EAuctionDynamicBiddingView assessmentId="AIC-2026-0002" />);
    expect(await screen.findByText(strings.errorUnknown)).toBeInTheDocument();
  });

  it('ignores a slow success that arrives after a newer request has already completed', async () => {
    const slowRequest = createDeferred<EAuctionResult | null>();
    const staleResult: EAuctionResult = { ...mockEAuctionResult, totalSpendReviewedCr: 99.5 };
    vi.mocked(Module2StrategicSourcingApi.getEAuctionDynamicBidding).mockImplementation((_id, options) =>
      options?.financialYear === 'FY2022-23' ? slowRequest.promise : Promise.resolve(mockEAuctionResult)
    );
    render(<EAuctionDynamicBiddingView assessmentId="AIC-2026-0002" />);
    await screen.findByText('₹311.28 Cr');

    fireEvent.change(fySelect(), { target: { value: 'FY2022-23' } });
    fireEvent.change(fySelect(), { target: { value: 'ALL' } });
    await waitFor(() => expect(refreshButton()).toBeEnabled());

    await act(async () => {
      slowRequest.resolve(staleResult);
      await flushPromises();
    });
    expect(screen.getByText('₹311.28 Cr')).toBeInTheDocument();
    expect(screen.queryByText('₹99.50 Cr')).not.toBeInTheDocument();
  });

  it('ignores a slow failure that arrives after a newer request has already completed', async () => {
    const slowRequest = createDeferred<EAuctionResult | null>();
    vi.mocked(Module2StrategicSourcingApi.getEAuctionDynamicBidding).mockImplementation((_id, options) =>
      options?.financialYear === 'FY2022-23' ? slowRequest.promise : Promise.resolve(mockEAuctionResult)
    );
    render(<EAuctionDynamicBiddingView assessmentId="AIC-2026-0002" />);
    await screen.findByText('₹311.28 Cr');

    fireEvent.change(fySelect(), { target: { value: 'FY2022-23' } });
    fireEvent.change(fySelect(), { target: { value: 'ALL' } });
    await waitFor(() => expect(refreshButton()).toBeEnabled());

    await act(async () => {
      slowRequest.reject(new Error('Slow request timed out'));
      await flushPromises();
    });
    expect(screen.getByText('₹311.28 Cr')).toBeInTheDocument();
    expect(screen.queryByText('Slow request timed out')).not.toBeInTheDocument();
    expect(logger.error).not.toHaveBeenCalled();
  });
});
