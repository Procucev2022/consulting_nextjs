/**
 * Module 2 — Lever 6: Category Specialisation Frontend Component Tests
 * Strict >= 90% per-file code coverage, max 300 lines, complexity <= 10
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CategorySpecialisationView } from '../../../src/components/module2/CategorySpecialisationView';
import { CategorySpecialisationOverviewTab } from '../../../src/components/module2/CategorySpecialisationOverviewTab';
import { CategorySpecialisationCategoriesTab } from '../../../src/components/module2/CategorySpecialisationCategoriesTab';
import { CategorySpecialisationOpportunitiesTab } from '../../../src/components/module2/CategorySpecialisationOpportunitiesTab';
import { CategorySpecialisationOverlapTab } from '../../../src/components/module2/CategorySpecialisationOverlapTab';
import { CATEGORY_SPECIALISATION_UI_STRINGS } from '../../../src/constants/module2CategorySpecialisation';
import type {
  CategorySpecialisationResult,
  CategorySpecialisationSummary,
  CategorySpecialisationProfile,
  CrossLeverOverlapItem
} from '../../../src/types/module2CategorySpecialisation';

const mockSummary: CategorySpecialisationSummary = {
  tenantId: 'AIC-2026-0002',
  totalProcurementSpendInr: 6138805185.51,
  totalProcurementSpendCr: 613.88,
  categoriesAssessedCount: 3,
  priorityACount: 1,
  priorityBCount: 1,
  priorityCCount: 1,
  grossTentativeOpportunityLowInr: 10000000,
  grossTentativeOpportunityLowCr: 1.0,
  grossTentativeOpportunityBaseInr: 25000000,
  grossTentativeOpportunityBaseCr: 2.5,
  grossTentativeOpportunityHighInr: 45000000,
  grossTentativeOpportunityHighCr: 4.5,
  netIndicativeOpportunityLowInr: 5000000,
  netIndicativeOpportunityLowCr: 0.5,
  netIndicativeOpportunityBaseInr: 12000000,
  netIndicativeOpportunityBaseCr: 1.2,
  netIndicativeOpportunityHighInr: 22000000,
  netIndicativeOpportunityHighCr: 2.2,
  opportunitiesRequiringOverlapReviewCount: 1,
  overlapReviewAmountInr: 13000000,
  overlapReviewAmountCr: 1.3,
  categoriesRequiringSpecialisedInterventionCount: 2,
  dedicatedManagerCount: 1,
  sharedManagerCount: 1,
  centralisedManagementCount: 0,
  automatedProcurementCount: 1,
  unquantifiedOpportunitiesCount: 2
};

const mockProfile: CategorySpecialisationProfile = {
  categoryName: 'Dyes & Chemicals',
  priority: 'PRIORITY_A',
  priorityRationale: 'High spend share and supplier complexity.',
  recommendedApproach: 'DEDICATED_CATEGORY_MANAGER',
  approachRationale: 'Critical multi-plant operations.',
  annualSpendInr: 3000000000,
  annualSpendCr: 300.0,
  spendSharePct: 48.87,
  transactionCount: 4500,
  distinctSuppliersCount: 15,
  distinctMaterialsCount: 20,
  distinctPlantsCount: 3,
  topSupplierConcentrationPct: 35.0,
  herfindahlIndex: 2100,
  priceVariationCoefficient: 0.12,
  contractCoveragePct: 0,
  dataLimitations: 'Contract coverage unavailable.',
  validationStatus: 'TENTATIVE — PENDING VALIDATION',
  requiresSpecialisedManagement: true,
  opportunities: [
    {
      headKey: 'HEAD-A',
      headCode: 'HEAD-A',
      headTitle: 'Strategic Category Management',
      categoryName: 'Dyes & Chemicals',
      eligibleAnnualSpendInr: 3000000000,
      eligibleAnnualSpendCr: 300.0,
      isEligibleEstablished: true,
      lowAssumptionPct: 1.0,
      baseAssumptionPct: 2.0,
      highAssumptionPct: 3.0,
      lowEstimateInr: 30000000,
      lowEstimateCr: 3.0,
      baseEstimateInr: 60000000,
      baseEstimateCr: 6.0,
      highEstimateInr: 90000000,
      highEstimateCr: 9.0,
      calculationRationale: 'Applied to strategic spend',
      dataAndEvidenceStatus: 'TENTATIVE_PENDING',
      validationRequirements: 'Charter validation required',
      disclaimer: 'Planning estimate',
      appliesToOperatingCost: false,
      commercialMechanism: 'Governance structure',
      eligibilityRule: 'Category priority rule',
      opportunityStatus: 'TENTATIVE — PENDING VALIDATION'
    }
  ]
};

const mockOverlapItem: CrossLeverOverlapItem = {
  headKey: 'HEAD-D',
  headTitle: 'Price Variation Reduction',
  categoryName: 'Dyes & Chemicals',
  eligibleSpendInr: 1000000000,
  eligibleSpendCr: 100.0,
  grossPotentialBenefitInr: 35000000,
  grossPotentialBenefitCr: 3.5,
  relatedLever: 'LEVER_1',
  overlapStatus: 'OVERLAP_REVIEW_REQUIRED',
  deduplicationTreatment: 'Excluded from net indicative opportunity pending review.',
  evidenceAndApprovalStatus: 'TENTATIVE_PENDING',
  netIndicativeBenefitInr: 0,
  netIndicativeBenefitCr: 0,
  amountExcludedInr: 35000000,
  amountExcludedCr: 3.5,
  exclusionReason: 'Potential overlap with Lever 1'
};

const mockResult: CategorySpecialisationResult = {
  assessmentId: 'AIC-2026-0002',
  customerName: 'ABC Textile Ltd',
  calculatedAt: '2026-10-19T18:00:00.000Z',
  summary: mockSummary,
  categories: [mockProfile],
  overlapItems: [mockOverlapItem],
  opportunityHeadAssumptions: [
    {
      key: 'HEAD-A',
      code: 'HEAD-A',
      title: 'Strategic Category Management',
      lowPct: 1.0,
      basePct: 2.0,
      highPct: 3.0,
      description: 'Strategic category governance'
    }
  ],
  methodologyDisclosures: ['Midpoint base assumption rule', 'Mandatory overlap controls'],
  generalDisclaimer: 'TENTATIVE — ILLUSTRATIVE PLANNING ESTIMATE — PENDING VALIDATION'
};

describe('CategorySpecialisationComponents', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: mockResult })
    } as Response);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders CategorySpecialisationView with 5 KPI cards and disclaimer banner', async () => {
    const onBack = vi.fn();
    render(<CategorySpecialisationView assessmentId="AIC-2026-0002" onBackToOverview={onBack} />);

    await waitFor(() => {
      expect(screen.getByText(CATEGORY_SPECIALISATION_UI_STRINGS.TITLE)).toBeInTheDocument();
    });

    expect(screen.getByText('₹613.88 Cr')).toBeInTheDocument();
    expect(screen.getByText('3 Categories')).toBeInTheDocument();
    expect(screen.getAllByText('₹2.50 Cr')[0]).toBeInTheDocument();
    expect(screen.getAllByText('₹1.20 Cr')[0]).toBeInTheDocument();
    expect(screen.getAllByText('₹1.30 Cr')[0]).toBeInTheDocument();

    const backBtn = screen.getByText('← Back to Levers Overview');
    fireEvent.click(backBtn);
    expect(onBack).toHaveBeenCalled();
  });

  it('handles tab transitions across all 4 sub-tabs', async () => {
    render(<CategorySpecialisationView assessmentId="AIC-2026-0002" />);
    await waitFor(() => {
      expect(screen.getByTestId('category-specialisation-tab-overview')).toBeInTheDocument();
    });

    // Switch to Categories Tab
    fireEvent.click(screen.getByTestId('category-specialisation-tab-categories'));
    expect(screen.getByText(CATEGORY_SPECIALISATION_UI_STRINGS.CATEGORIES_TABLE_TITLE)).toBeInTheDocument();

    // Switch to Opportunities Tab
    fireEvent.click(screen.getByTestId('category-specialisation-tab-opportunities'));
    expect(screen.getByText(CATEGORY_SPECIALISATION_UI_STRINGS.OPPORTUNITIES_TABLE_TITLE)).toBeInTheDocument();

    // Switch to Overlaps Tab
    fireEvent.click(screen.getByTestId('category-specialisation-tab-overlaps'));
    expect(screen.getByText(CATEGORY_SPECIALISATION_UI_STRINGS.OVERLAP_TABLE_TITLE)).toBeInTheDocument();
  });

  it('handles category selection drill-down in Categories tab', () => {
    render(<CategorySpecialisationCategoriesTab categories={[mockProfile]} />);
    expect(screen.getByText('Dyes & Chemicals')).toBeInTheDocument();

    // Click Details button to expand
    const detailsBtn = screen.getByText('Details');
    fireEvent.click(detailsBtn);
    expect(screen.getByText(/High spend share and supplier complexity/)).toBeInTheDocument();
    expect(screen.getByText('HEAD-A: Strategic Category Management')).toBeInTheDocument();

    // Click again to collapse
    fireEvent.click(screen.getByText('Hide'));
    expect(screen.queryByText(/High spend share and supplier complexity/)).not.toBeInTheDocument();
  });

  it('renders Overview tab and handles onSelectCategory callback', () => {
    const onSelect = vi.fn();
    render(<CategorySpecialisationOverviewTab data={mockResult} onSelectCategory={onSelect} />);

    expect(screen.getByText('Dyes & Chemicals')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Dyes & Chemicals'));
    expect(onSelect).toHaveBeenCalledWith('Dyes & Chemicals');
  });

  it('renders Opportunities tab with head breakdown and special callouts', () => {
    render(<CategorySpecialisationOpportunitiesTab data={mockResult} />);
    expect(screen.getByText('HEAD-A')).toBeInTheDocument();
    expect(screen.getByText('Head J: Process & Transaction Efficiency')).toBeInTheDocument();
  });

  it('renders Overlap tab with related lever and deduplication treatment', () => {
    render(<CategorySpecialisationOverlapTab overlapItems={[mockOverlapItem]} />);
    expect(screen.getByText('LEVER 1')).toBeInTheDocument();
    expect(screen.getByText(/Excluded from net indicative opportunity pending review/)).toBeInTheDocument();
  });

  it('handles fetch error gracefully in CategorySpecialisationView', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'));
    render(<CategorySpecialisationView assessmentId="AIC-2026-0002" />);

    await waitFor(() => {
      expect(screen.getByText('Unable to load Category Specialisation analysis')).toBeInTheDocument();
    });

    expect(screen.getByText('Network error')).toBeInTheDocument();
    expect(screen.getByText('Retry Analysis')).toBeInTheDocument();
  });
});
