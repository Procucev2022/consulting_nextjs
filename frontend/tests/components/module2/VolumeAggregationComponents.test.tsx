/**
 * @vitest-environment jsdom
 * Module 2 — Lever 4: Volume Aggregation Frontend Components Unit Tests
 * Strict >= 90% per-file code coverage, max 300 lines, complexity <= 10
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VolumeAggregationOverviewTab } from '../../../src/components/module2/VolumeAggregationOverviewTab';
import { VolumeAggregationPlantTab } from '../../../src/components/module2/VolumeAggregationPlantTab';
import { VolumeAggregationMaterialTab } from '../../../src/components/module2/VolumeAggregationMaterialTab';
import { VolumeAggregationTransactionTab } from '../../../src/components/module2/VolumeAggregationTransactionTab';
import { VolumeAggregationView } from '../../../src/components/module2/VolumeAggregationView';
import { VOLUME_AGGREGATION_UI_STRINGS } from '../../../src/constants/module2VolumeAggregation';
import type {
  VolumeAggregationOpportunity,
  PlantVolumeBreakdown,
  MaterialVolumeProfile,
  VolumeAggregationTransactionItem,
  VolumeAggregationResult
} from '../../../src/types/module2VolumeAggregation';

const mockTier1: VolumeAggregationOpportunity = {
  opportunityId: 'L4-T1-MAT_01',
  tier: 'TIER_1_IDENTICAL',
  tierLabel: 'Tier 1 — Identical Materials',
  materialCode: 'MAT-01',
  materialDesc: 'Bearing 6204',
  category: 'Mechanical Spares',
  unspscCode: '31171504',
  baseUom: 'EA',
  totalHistoricalSpendInr: 100000,
  totalHistoricalSpendCr: 0.01,
  potentiallyAggregatableSpendInr: 100000,
  potentiallyAggregatableSpendCr: 0.01,
  aggregatableQuantity: 500,
  excludedQuantity: 0,
  unmatchedAdjustmentsInr: 0,
  transactionCount: 5,
  plantCount: 2,
  plants: ['1000', '2200'],
  supplierCount: 2,
  primarySupplier: 'SKF India',
  suppliers: ['SKF India', 'FAG Bearings'],
  demandClassification: 'RECURRING',
  demandClassificationLabel: 'RECURRING',
  opportunityStatus: 'Candidate Identified',
  statusReason: 'Multi-facility demand across 2 plants.',
  nextRecommendedAction: 'Harmonize into institutional tender.',
  technicalValidationRequired: false,
  wavgUnitPriceInr: 200,
  eligibilityType: 'MULTI_FACILITY_POOLING',
  isGenuineOpportunity: true,
  densityConversion: {
    applied: true,
    densityFactor: 0.84,
    sourceUom: 'LTR',
    targetUom: 'MT',
    standardSource: 'IS 1460:2005',
    effectiveDate: '2026-04-01',
    formula: 'MT = LTR * 0.000840'
  }
};

const mockTier2: VolumeAggregationOpportunity = {
  opportunityId: 'L4-T2-31171504',
  tier: 'TIER_2_COMPARABLE',
  tierLabel: 'Tier 2 — Technically Comparable Materials',
  materialCode: 'UNSPSC-31171504',
  materialDesc: 'Bearings (3 internal codes)',
  category: 'Mechanical Spares',
  unspscCode: '31171504',
  baseUom: 'EA',
  totalHistoricalSpendInr: 200000,
  totalHistoricalSpendCr: 0.02,
  potentiallyAggregatableSpendInr: 200000,
  potentiallyAggregatableSpendCr: 0.02,
  aggregatableQuantity: 0,
  excludedQuantity: 1000,
  unmatchedAdjustmentsInr: 0,
  transactionCount: 8,
  plantCount: 2,
  plants: ['1000', '2200'],
  supplierCount: 3,
  primarySupplier: 'SKF India',
  suppliers: ['SKF India', 'FAG Bearings', 'NTN'],
  demandClassification: 'RECURRING',
  demandClassificationLabel: 'RECURRING',
  opportunityStatus: 'Technical Validation Required',
  statusReason: 'Shared UNSPSC 31171504 across 3 codes.',
  nextRecommendedAction: 'Conduct engineering technical validation.',
  technicalValidationRequired: true,
  wavgUnitPriceInr: 0,
  eligibilityType: 'MULTI_FACILITY_POOLING',
  isGenuineOpportunity: true
};

const mockTier3: VolumeAggregationOpportunity = {
  opportunityId: 'L4-T3-Mechanical_Spares',
  tier: 'TIER_3_CATEGORY',
  tierLabel: 'Tier 3 — Category-Level Sourcing',
  materialCode: 'CAT-Mechanical',
  materialDesc: 'Category Sourcing Umbrella: Mechanical Spares',
  category: 'Mechanical Spares',
  unspscCode: 'CATEGORY_VARIOUS',
  baseUom: 'N/A (Diverse Geometries)',
  totalHistoricalSpendInr: 500000,
  totalHistoricalSpendCr: 0.05,
  potentiallyAggregatableSpendInr: 500000,
  potentiallyAggregatableSpendCr: 0.05,
  aggregatableQuantity: 0,
  excludedQuantity: 0,
  unmatchedAdjustmentsInr: 0,
  transactionCount: 20,
  plantCount: 2,
  plants: ['1000', '2200'],
  supplierCount: 5,
  primarySupplier: 'SKF India',
  suppliers: ['SKF India', 'FAG Bearings', 'NTN', 'Timken', 'NSK'],
  demandClassification: 'RECURRING',
  demandClassificationLabel: 'RECURRING',
  opportunityStatus: 'Ready for Sourcing Review',
  statusReason: 'Category umbrella expenditure.',
  nextRecommendedAction: 'Initiate corporate umbrella RFP.',
  technicalValidationRequired: false,
  wavgUnitPriceInr: 0,
  eligibilityType: 'MULTI_FACILITY_POOLING',
  isGenuineOpportunity: true
};

const mockPlant: PlantVolumeBreakdown = {
  plantCode: '1000',
  plantName: 'Central Spinning Mill',
  region: 'North',
  state: 'Punjab',
  hubDistanceKm: 0,
  totalSpendInr: 300000,
  totalSpendCr: 0.03,
  transactionCount: 15,
  distinctMaterialsCount: 5,
  supplierCount: 4,
  volumeSharePct: 60.0
};

const mockPlant2: PlantVolumeBreakdown = {
  plantCode: '2200',
  plantName: 'Southern Weaving Unit',
  region: 'South',
  state: 'Tamil Nadu',
  hubDistanceKm: 450,
  totalSpendInr: 200000,
  totalSpendCr: 0.02,
  transactionCount: 10,
  distinctMaterialsCount: 3,
  supplierCount: 2,
  volumeSharePct: 40.0
};

const mockMaterial: MaterialVolumeProfile = {
  materialId: 'MAT-01',
  materialCode: 'MAT-01',
  materialDesc: 'Bearing 6204',
  category: 'Mechanical Spares',
  unspscCode: '31171504',
  baseUom: 'EA',
  totalQuantity: 500,
  totalSpendInr: 100000,
  totalSpendCr: 0.01,
  wavgPriceInr: 200,
  demandClassification: 'RECURRING',
  orderCount: 5,
  plantCount: 2,
  supplierCount: 2,
  plantVolumeDispersionIndex: 0.4,
  hasIncompatibleUom: false,
  excludedQuantity: 0
};

const mockTx: VolumeAggregationTransactionItem = {
  id: 'TX-01',
  po_number: 'PO-9001',
  po_line: '1',
  po_date: '2024-03-15',
  vendor_name: 'SKF India',
  material_code: 'MAT-01',
  material_desc: 'Bearing 6204',
  quantity: 100,
  uom: 'EA',
  unit_price: 200,
  total_spend_inr: 20000,
  plant: '1000'
};

const mockResult: VolumeAggregationResult = {
  assessmentId: 'AIC-2026-0002',
  coverageSummary: {
    assessmentId: 'AIC-2026-0002',
    totalTransactionsCount: 1,
    totalMaterialRecordsCount: 1,
    genuineTier1OpportunitiesCount: 1,
    singleIsolatedPurchaseCount: 0,
    singleIsolatedPurchaseSpendCr: 0,
    uomIncompatibleCount: 0,
    uomIncompatibleSpendCr: 0,
    totalIncurredSpendInr: 100000,
    totalIncurredSpendCr: 0.01,
    potentiallyAggregatableSpendInr: 100000,
    potentiallyAggregatableSpendCr: 0.01,
    tier1IdenticalCount: 1,
    tier1SpendCr: 0.01,
    tier2ComparableCount: 1,
    tier2SpendCr: 0.02,
    tier3CategoryCount: 1,
    tier3SpendCr: 0.05,
    unmatchedAdjustmentsCount: 0,
    unmatchedAdjustmentsSpendInr: 0,
    reconciliationDeltaInr: 0
  },
  tier1Opportunities: [mockTier1],
  tier2Opportunities: [mockTier2],
  tier3Opportunities: [mockTier3],
  plantProfiles: [mockPlant],
  materialProfiles: [mockMaterial],
  unmatchedAdjustments: [],
  methodologyDisclosures: ['Zero Arbitrary Savings', 'Option A density provenance'],
  transactions: [mockTx]
};

describe('VolumeAggregationOverviewTab', () => {
  it('renders opportunities and filters by tier', () => {
    render(
      <VolumeAggregationOverviewTab
        tier1={[mockTier1]}
        tier2={[mockTier2]}
        tier3={[mockTier3]}
      />
    );

    expect(screen.getByText('L4-T1-MAT_01')).toBeDefined();
    expect(screen.getByText('L4-T2-31171504')).toBeDefined();

    // Click Tier 1 filter button
    const t1Btn = screen.getByText(/Tier 1: Identical/i);
    fireEvent.click(t1Btn);

    expect(screen.getByText('L4-T1-MAT_01')).toBeDefined();
    expect(screen.queryByText('L4-T2-31171504')).toBeNull();

    // Search filter
    const searchInput = screen.getByPlaceholderText(/Filter by material code/i);
    fireEvent.change(searchInput, { target: { value: 'NONEXISTENT_ITEM' } });
    expect(screen.getByText(/No volume aggregation opportunities match/i)).toBeDefined();
  });

  it('renders badges for unverified density, limited history, and incompatible UOM', () => {
    const oppWithDensityWarning: VolumeAggregationOpportunity = {
      ...mockTier1,
      opportunityId: 'L4-T1-DENSITY_WARN',
      plantCount: 1,
      densityConversion: {
        applied: false,
        densityFactor: 0.84,
        sourceUom: 'KL',
        targetUom: 'MT',
        standardSource: 'IS 1460',
        effectiveDate: '2024-01-01',
        formula: 'Mass = Vol * 0.84'
      },
      eligibilityType: 'LIMITED_HISTORY_NO_HISTORICAL_PATTERN'
    };

    const oppSinglePurchase: VolumeAggregationOpportunity = {
      ...mockTier1,
      opportunityId: 'L4-T1-SINGLE',
      eligibilityType: 'SINGLE_PURCHASE_NON_AGGREGATABLE'
    };

    const oppIncompatible: VolumeAggregationOpportunity = {
      ...mockTier1,
      opportunityId: 'L4-T1-INCOMPAT',
      eligibilityType: 'INCOMPATIBLE_UOM'
    };

    render(
      <VolumeAggregationOverviewTab
        tier1={[oppWithDensityWarning, oppSinglePurchase, oppIncompatible]}
        tier2={[]}
        tier3={[]}
      />
    );

    expect(screen.getByText(/⚠️ Density Audit: Native volume preserved in KL/i)).toBeDefined();
    expect(screen.getAllByText(/\[Limited History — Review Required\]/i).length).toBe(2);
    expect(screen.getByText(/\[Incompatible \/ Unverified UOM\]/i)).toBeDefined();
  });
});

describe('VolumeAggregationPlantTab & MaterialTab', () => {
  it('renders plant profiles and informational notice', () => {
    render(<VolumeAggregationPlantTab plantProfiles={[mockPlant, mockPlant2]} />);
    expect(screen.getByText('Central Spinning Mill')).toBeDefined();
    expect(screen.getByText('Southern Weaving Unit')).toBeDefined();
    expect(screen.getByText('450 km')).toBeDefined();
    expect(screen.getByText(/Informational Logistics Notice/i)).toBeDefined();
    expect(screen.getByText('60%')).toBeDefined();
  });

  it('renders material volume profiles with dispersion index and handles search filtering', () => {
    render(<VolumeAggregationMaterialTab materialProfiles={[mockMaterial]} />);
    expect(screen.getByText('Bearing 6204')).toBeDefined();
    expect(screen.getByText('0.40')).toBeDefined();

    const searchInput = screen.getByPlaceholderText(/Filter materials by code/i);
    fireEvent.change(searchInput, { target: { value: 'bearing' } });
    expect(screen.getByText('Bearing 6204')).toBeDefined();

    fireEvent.change(searchInput, { target: { value: 'NONEXISTENT' } });
    expect(screen.getByText(/Showing 0 of 1 materials/i)).toBeDefined();
  });
});

describe('VolumeAggregationTransactionTab', () => {
  it('renders transactions, handles search filtering, and supports pagination', () => {
    const multiTxs = Array.from({ length: 60 }, (_, i) => ({
      ...mockTx,
      id: `TX-${i + 1}`,
      po_number: `PO-${9000 + i}`,
      vendor_name: i % 2 === 0 ? 'SKF India' : 'FAG Bearings',
      material_code: `MAT-${i}`,
      plant: `PLANT-${1000 + i}`
    }));

    render(<VolumeAggregationTransactionTab transactions={multiTxs} />);
    expect(screen.getByText('PO-9000-1')).toBeDefined();

    // Next page button
    const nextBtn = screen.getByText('Next');
    fireEvent.click(nextBtn);
    expect(screen.getByText('PO-9050-1')).toBeDefined();

    // Previous page button
    const prevBtn = screen.getByText('Previous');
    fireEvent.click(prevBtn);
    expect(screen.getByText('PO-9000-1')).toBeDefined();

    // Search filter across fields
    const searchInput = screen.getByPlaceholderText(/Search PO, vendor/i);
    fireEvent.change(searchInput, { target: { value: 'FAG' } });
    expect(screen.getAllByText('FAG Bearings').length).toBeGreaterThan(0);

    fireEvent.change(searchInput, { target: { value: 'PLANT-1001' } });
    expect(screen.getByText('PLANT-1001')).toBeDefined();
  });

  it('handles empty transactions list and transactions with missing optional fields', () => {
    render(<VolumeAggregationTransactionTab transactions={[]} />);
    expect(screen.getByText(/Showing 1–0 of 0 transactions/i)).toBeDefined();

    const fallbackTx: VolumeAggregationTransactionItem = {
      id: '',
      po_number: '',
      po_line: '',
      po_date: '',
      vendor_name: 'Fallback Vendor',
      material_code: '',
      material_desc: 'Fallback Material',
      quantity: 10,
      uom: 'EA',
      unit_price: 50,
      total_spend_inr: 500,
      plant: ''
    };

    render(<VolumeAggregationTransactionTab transactions={[fallbackTx]} />);
    expect(screen.getAllByText('N/A-1').length).toBeGreaterThan(0);
    expect(screen.getAllByText('UNCODED').length).toBeGreaterThan(0);
  });
});

describe('VolumeAggregationView', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('loads analysis from API, renders 5 KPI cards, supports back button, and switches all tabs', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockResult })
    } as unknown as Response);

    const onBack = vi.fn();
    render(<VolumeAggregationView assessmentId="AIC-2026-0002" onBackToOverview={onBack} />);

    await waitFor(() => {
      expect(screen.getByText(/Lever 4: Volume Aggregation/i)).toBeDefined();
    });

    // 5 KPI cards
    expect(screen.getByText('NOT YET QUANTIFIABLE')).toBeDefined();
    expect(screen.getByText(/Download 8-Sheet Auditable Excel Report/i)).toBeDefined();

    // Back to overview button
    const backBtn = screen.getByText(/Back to Levers Overview/i);
    fireEvent.click(backBtn);
    expect(onBack).toHaveBeenCalled();

    // Switch to Plants Tab
    fireEvent.click(screen.getByText(VOLUME_AGGREGATION_UI_STRINGS.TAB_PLANTS));
    expect(screen.getByText('Central Spinning Mill')).toBeDefined();

    // Switch to Materials Tab
    fireEvent.click(screen.getByText(VOLUME_AGGREGATION_UI_STRINGS.TAB_MATERIALS));
    expect(screen.getByText('Bearing 6204')).toBeDefined();

    // Switch to Transactions Tab
    fireEvent.click(screen.getByText(VOLUME_AGGREGATION_UI_STRINGS.TAB_TRANSACTIONS));
    expect(screen.getByText('PO-9001-1')).toBeDefined();

    // Switch back to Overview Tab
    fireEvent.click(screen.getByText(VOLUME_AGGREGATION_UI_STRINGS.TAB_OVERVIEW));
    expect(screen.getByText('L4-T1-MAT_01')).toBeDefined();
  });

  it('renders error state and retry button on fetch failure and invalid server response', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    } as unknown as Response);

    render(<VolumeAggregationView assessmentId="AIC-2026-0002" />);

    await waitFor(() => {
      expect(screen.getByText('Analysis Load Failed')).toBeDefined();
      expect(screen.getByText('Retry Analysis')).toBeDefined();
    });

    // Retry with invalid json structure
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: false, message: 'Invalid token' })
    } as unknown as Response);

    fireEvent.click(screen.getByText('Retry Analysis'));

    await waitFor(() => {
      expect(screen.getByText('Invalid token')).toBeDefined();
    });
  });

  it('handles non-Error rejection, missing json message, and zero count KPI fallbacks', async () => {
    global.fetch = vi.fn().mockRejectedValueOnce('Raw string network failure');
    render(<VolumeAggregationView assessmentId="AIC-2026-0002" />);

    await waitFor(() => {
      expect(screen.getByText('Raw string network failure')).toBeDefined();
    });

    // Server response with success=false and no message
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: false })
    } as unknown as Response);

    fireEvent.click(screen.getByText('Retry Analysis'));

    await waitFor(() => {
      expect(screen.getByText('Invalid server response structure')).toBeDefined();
    });

    // Zero counts to exercise KPI fallbacks
    const zeroCountsResult = {
      ...mockResult,
      coverageSummary: {
        ...mockResult.coverageSummary,
        genuineTier1OpportunitiesCount: 0,
        totalMaterialRecordsCount: 0,
        tier1IdenticalCount: 5
      }
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: zeroCountsResult })
    } as unknown as Response);

    fireEvent.click(screen.getByText('Retry Analysis'));

    await waitFor(() => {
      expect(screen.getByText(/5 genuine multi-plant opportunities/i)).toBeDefined();
      expect(screen.getByText(VOLUME_AGGREGATION_UI_STRINGS.KPI_UOM_COMPATIBLE)).toBeDefined();
    });
  });
});
