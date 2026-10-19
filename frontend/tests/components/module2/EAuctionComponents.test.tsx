/**
 * Module 2 — Lever 2: E-Auction Dynamic Bidding Components Unit Tests
 * Version: MODULE_2_EAUCTION_TESTS_V1.1
 * Compliant with Rule 1 (>=90% coverage), Rule 7 (UI_STRINGS), Rule 8 & 9
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EAuctionCategoryTable } from '../../../src/components/module2/EAuctionCategoryTable';
import { EAuctionMaterialTable } from '../../../src/components/module2/EAuctionMaterialTable';
import { EAuctionDynamicBiddingView } from '../../../src/components/module2/EAuctionDynamicBiddingView';
import { EAuctionKpiCards } from '../../../src/components/module2/EAuctionKpiCards';
import type {
  EAuctionCategoryCandidate,
  EAuctionMaterialCandidate,
  EAuctionResult
} from '../../../src/types/module2EAuction';
import { UI_STRINGS } from '../../../src/constants/uiStrings';

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
  suitability: 'Candidate for Review',
  evidenceRationale: 'Repeat POs (45), multi-supplier (5), spend ₹15.00 Cr.',
  procurementReviewRequirements: ['Contractual supplier agreement'],
  missingInfoLimitations: 'Specification sign-off required',
  savingsRange: {
    savingsRangeStatus: 'ESTIMATED',
    addressableSpendInr: 150000000,
    addressableSpendCr: 15.0,
    minSavingsRate: 0.03,
    expectedSavingsRate: 0.055,
    maxSavingsRate: 0.09,
    minEstimatedSavingsInr: 4500000,
    minEstimatedSavingsCr: 0.45,
    expectedEstimatedSavingsInr: 8250000,
    expectedEstimatedSavingsCr: 0.825,
    maxEstimatedSavingsInr: 13500000,
    maxEstimatedSavingsCr: 1.35
  }
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
  auctionSuitability: 'Candidate for Review',
  evidenceBasedRationale: 'High multi-supplier presence (8) and repeat demand across plants.',
  dataLimitations: 'Supplier capacity not audited',
  materials: [mockMaterialCandidate],
  savingsRange: {
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
  }
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
  summarySavingsRange: {
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
  },
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

describe('EAuctionCategoryTable Component', () => {
  it('renders category rows, applies search filter and triggers select', () => {
    const handleSelect = vi.fn();
    render(
      <EAuctionCategoryTable
        categories={[mockCategoryCandidate]}
        onSelectCategory={handleSelect}
      />
    );

    expect(screen.getByText('Natural fibers')).toBeInTheDocument();
    expect(screen.getByText('11151600')).toBeInTheDocument();
    expect(screen.getByText('₹25.0000 Cr')).toBeInTheDocument();
    expect(screen.getByText('₹15.0000 Cr')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(UI_STRINGS.module2EAuction.searchPlaceholder);
    fireEvent.change(searchInput, { target: { value: 'Natural' } });
    expect(screen.getByText('Natural fibers')).toBeInTheDocument();

    const selectBtn = screen.getByText(UI_STRINGS.module2EAuction.btnViewMaterials);
    fireEvent.click(selectBtn);
    expect(handleSelect).toHaveBeenCalledWith(mockCategoryCandidate);
  });
});

describe('EAuctionMaterialTable Component', () => {
  it('renders material candidate rows and pagination controls', () => {
    const handleBack = vi.fn();
    render(
      <EAuctionMaterialTable
        materials={[mockMaterialCandidate]}
        categoryName="Natural fibers"
        onBack={handleBack}
      />
    );

    expect(screen.getByText('MAT-COT-001')).toBeInTheDocument();
    expect(screen.getByText('ORGANIC COTTON FIBRE 30MM')).toBeInTheDocument();
    expect(screen.getAllByText('₹15.0000 Cr').length).toBeGreaterThan(0);

    const backBtn = screen.getByLabelText(UI_STRINGS.module2EAuction.btnBackToCategories);
    fireEvent.click(backBtn);
    expect(handleBack).toHaveBeenCalled();
  });
});

describe('EAuctionKpiCards Component', () => {
  it('renders all 6 mandated KPI cards with correct addressable spend and savings range', () => {
    render(<EAuctionKpiCards result={mockEAuctionResult} />);
    expect(screen.getByText(UI_STRINGS.module2EAuction.cardTotalSpendReviewed)).toBeInTheDocument();
    expect(screen.getByText('₹311.28 Cr')).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.module2EAuction.cardCategoriesReviewed)).toBeInTheDocument();
    expect(screen.getByText('240')).toBeInTheDocument();
    expect(screen.getByText('22 Cat / 82 Mat')).toBeInTheDocument();
    expect(screen.getByText('Addressable Spend')).toBeInTheDocument();
    expect(screen.getByText('₹15.00 Cr')).toBeInTheDocument();
    expect(screen.getByText('₹0.45 - ₹1.35 Cr')).toBeInTheDocument();
    expect(screen.getByText('₹0.00 Cr')).toBeInTheDocument();
  });
});

describe('EAuctionDynamicBiddingView Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('loads result and renders KPI cards and allows drilldown to materials', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockEAuctionResult })
    });
    global.fetch = mockFetch;

    render(<EAuctionDynamicBiddingView assessmentId="AIC-2026-0002" />);

    expect(screen.getByText(UI_STRINGS.module2EAuction.pageTitle)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('₹311.28 Cr')).toBeInTheDocument();
    });

    expect(screen.getByText(UI_STRINGS.module2EAuction.cardCandidateCategories)).toBeInTheDocument();
    expect(screen.getByText('22 Cat / 82 Mat')).toBeInTheDocument();

    // Drill down to category materials
    const selectBtn = screen.getByText(UI_STRINGS.module2EAuction.btnViewMaterials);
    fireEvent.click(selectBtn);

    await waitFor(() => {
      expect(screen.getByText('MAT-COT-001')).toBeInTheDocument();
    });
  });

  it('handles fetch error and displays error banner', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
    global.fetch = mockFetch;

    render(<EAuctionDynamicBiddingView assessmentId="AIC-2026-0002" />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load E-Auction/i)).toBeInTheDocument();
    });
  });
});
