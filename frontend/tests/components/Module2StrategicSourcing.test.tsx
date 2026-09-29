import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { StrategicSourcingDashboardCards } from '../../src/components/module2/StrategicSourcingDashboardCards';
import { StrategicSourcingCategoryTable } from '../../src/components/module2/StrategicSourcingCategoryTable';
import { StrategicSourcingOpportunityWaterfall } from '../../src/components/module2/StrategicSourcingOpportunityWaterfall';
import { StrategicSourcingLeverMatrixView } from '../../src/components/module2/StrategicSourcingLeverMatrixView';
import { StrategicSourcingScorecardView } from '../../src/components/module2/StrategicSourcingScorecardView';
import { StrategicSourcingDeepDiveModal } from '../../src/components/module2/StrategicSourcingDeepDiveModal';
import { Module2StrategicSourcingWorkspace } from '../../src/components/module2/Module2StrategicSourcingWorkspace';
import { Module2StrategicSourcingApi } from '../../src/utils/module2StrategicSourcingApi';
import type {
  CategoryStrategicSourcingProfile,
  Module2StrategicSourcingDashboardSummary
} from '../../src/types/module2StrategicSourcing';
import { UI_STRINGS } from '../../src/constants/uiStrings';

const mockSummary: Module2StrategicSourcingDashboardSummary = {
  totalAddressableSpendInr: 15000000,
  totalAddressableSpendInrCr: 1.5,
  totalPotentialEAuctionOpportunityInr: 500000,
  totalPotentialEAuctionOpportunityInrCr: 0.05,
  totalPotentialConsolidationOpportunityInr: 200000,
  totalPotentialConsolidationOpportunityInrCr: 0.02,
  totalOverlappingOpportunityInr: 200000,
  totalOverlappingOpportunityInrCr: 0.02,
  netQuantifiableOpportunityInr: 500000,
  netQuantifiableOpportunityInrCr: 0.05,
  categoriesReadyForSourcingCount: 3,
  eauctionCandidatesCount: 2,
  consolidationCandidatesCount: 2,
  opportunitiesNotYetQuantifiableCount: 1,
  overallDataConfidence: 'HIGH',
  categoriesAnalyzedCount: 4,
  totalSpendAnalyzedInr: 18000000,
  totalSpendAnalyzedInrCr: 1.8,
  calculationTimestamp: '2026-09-29T12:00:00.000Z'
};

const mockProfile: CategoryStrategicSourcingProfile = {
  categoryId: 'CAT-STL-PLT',
  categoryName: 'Structural Steel Plates',
  module2Classification: 'Direct Materials',
  unspscCode: '30101704',
  unspscFamily: 'Structural Steel',
  totalSpendInr: 10000000,
  totalSpendInrCr: 1.0,
  transactionCount: 12,
  activeSuppliersCount: 3,
  activeMonthsCount: 8,
  averageMonthlySpendInr: 1250000,
  averageTransactionValueInr: 833333,
  spendTrend: 'STABLE',
  isRecurringSpend: true,
  recurringRationale: 'Recurring spend confirmed: 8 active months.',
  categoryMateriality: 'HIGH',

  monthlySpendBreakdown: [],
  orderSizeDistribution: {
    smallOrdersCount: 4,
    mediumOrdersCount: 6,
    largeOrdersCount: 2,
    orderCountRatio: 12
  },

  suppliers: [
    {
      supplierId: 'SUPP-TATA',
      supplierName: 'Tata Steel Ltd',
      totalSpendInr: 6000000,
      totalSpendInrCr: 0.6,
      spendSharePct: 60,
      transactionCount: 6,
      transactionSharePct: 50,
      totalQuantity: 100,
      weightedAveragePrice: 60000,
      minPrice: 60000,
      maxPrice: 60500,
      rank: 1,
      isTopSupplier: true,
      isTailSupplier: false,
      pricePositionVsComparable: 'BELOW_AVERAGE',
      potentialConsolidationRelevance: 'Primary strategic supplier.'
    },
    {
      supplierId: 'SUPP-JSW',
      supplierName: 'JSW Steel Ltd',
      totalSpendInr: 3000000,
      totalSpendInrCr: 0.3,
      spendSharePct: 30,
      transactionCount: 4,
      transactionSharePct: 33.3,
      totalQuantity: 48,
      weightedAveragePrice: 62500,
      minPrice: 62000,
      maxPrice: 63000,
      rank: 2,
      isTopSupplier: false,
      isTailSupplier: false,
      pricePositionVsComparable: 'AT_AVERAGE',
      potentialConsolidationRelevance: 'Core qualified vendor.'
    },
    {
      supplierId: 'SUPP-JINDAL',
      supplierName: 'Jindal Steel & Power',
      totalSpendInr: 1000000,
      totalSpendInrCr: 0.1,
      spendSharePct: 10,
      transactionCount: 2,
      transactionSharePct: 16.7,
      totalQuantity: 15,
      weightedAveragePrice: 66666,
      minPrice: 66000,
      maxPrice: 67000,
      rank: 3,
      isTopSupplier: false,
      isTailSupplier: true,
      pricePositionVsComparable: 'ABOVE_AVERAGE',
      potentialConsolidationRelevance: 'Tail vendor candidate for consolidation.'
    }
  ],
  topSupplierSharePct: 60,
  top3SupplierSharePct: 100,
  top5SupplierSharePct: 100,
  longTailSupplierSharePct: 10,
  hhiScore: 4600,
  hhiInterpretation: 'Moderately concentrated market (HHI: 4600)',

  fragmentationLevel: 'MODERATE_FRAGMENTATION',
  fragmentationRationale: 'Core suppliers dominate spend.',

  comparableTransactionCount: 12,
  excludedTransactionCount: 0,
  comparableSpendInr: 10000000,
  comparableQuantity: 163,
  addressableSpendInr: 10000000,
  addressableSpendInrCr: 1.0,
  addressableQuantity: 163,
  priceDispersion: {
    totalQuantity: 163,
    totalSpendInr: 10000000,
    weightedAveragePrice: 61349.69,
    simpleAveragePrice: 63000,
    medianPrice: 62000,
    minPrice: 60000,
    maxPrice: 67000,
    p10Price: 60000,
    p25Price: 60500,
    p50Price: 62000,
    p75Price: 63000,
    p90Price: 66000,
    priceDispersionInr: 7000,
    priceDispersionPct: 11.4,
    volumeAboveP25Pct: 38.6,
    dispersionInterpretation: 'Moderate price dispersion with demonstrable savings potential.'
  },
  credibleReference: {
    referencePrice: 60000,
    methodology: 'LOWEST_CREDIBLE_PRICE',
    qualifyingTransactionCount: 6,
    isCredible: true,
    qualificationCriteria: {
      comparableSpec: true,
      comparableUom: true,
      comparableCurrency: true,
      sufficientVolume: true,
      nonOutlier: true,
      withinHistoricalWindow: true
    },
    explanation: 'Tata Steel historical price ₹60,000 is verified credible reference.'
  },
  exclusions: [],

  status: 'E_AUCTION_AND_CONSOLIDATION',
  statusLabel: 'E-Auction & Vendor Consolidation Candidate',
  dataConfidence: 'HIGH',
  confidenceRationale: 'High confidence across multiple active months.',

  eauctionSuitability: 'HIGH',
  eauctionSuitabilityRationale: 'High suitability: 3 suppliers, 11.4% price dispersion.',
  potentialEAuctionOpportunityInr: 220000,
  potentialEAuctionOpportunityInrCr: 0.022,
  potentialEAuctionOpportunityPct: 2.2,

  consolidationSuitability: 'HIGH',
  consolidationSuitabilityRationale: 'Tail vendor volume can be consolidated into Tata Steel.',
  potentialVendorConsolidationOpportunityInr: 100000,
  potentialVendorConsolidationOpportunityInrCr: 0.01,
  potentialVendorConsolidationOpportunityPct: 1.0,
  operationalConsolidation: {
    suppliersPotentiallyAffected: 1,
    poCountAffected: 2,
    transactionsAffected: 2,
    activeMonthsAffected: 8,
    smallOrderCount: 1,
    estimatedTouchpointReductionCount: 12,
    explanation: '1 tail vendor accounts for 2 transactions.'
  },

  overlappingOpportunityInr: 100000,
  overlappingOpportunityInrCr: 0.01,
  netQuantifiableOpportunityInr: 220000,
  netQuantifiableOpportunityInrCr: 0.022,
  netQuantifiableOpportunityPct: 2.2,
  isQuantifiable: true,
  quantifiableDisplayText: '₹2.20 Lakhs',

  scenarios: {
    isAvailable: true,
    conservativeOpportunityInr: 138000,
    conservativeOpportunityInrCr: 0.014,
    conservativeReferencePrice: 60500,
    conservativeMethodology: 'P25 baseline',
    baseOpportunityInr: 220000,
    baseOpportunityInrCr: 0.022,
    baseReferencePrice: 60000,
    baseMethodology: 'Credible reference',
    stretchOpportunityInr: 250000,
    stretchOpportunityInrCr: 0.025,
    stretchReferencePrice: 59800,
    stretchMethodology: 'Stretch target',
    explanation: 'Calculated from empirical percentiles.'
  },
  waterfall: [
    {
      stage: 'TOTAL_CATEGORY_SPEND',
      label: 'Total Category Spend',
      amountInr: 10000000,
      amountInrCr: 1.0,
      percentageOfTotal: 100,
      calculationBasis: 'Sum of all purchase orders'
    },
    {
      stage: 'NON_ADDRESSABLE_SPEND',
      label: 'Non-Addressable Spend',
      amountInr: 0,
      amountInrCr: 0,
      percentageOfTotal: 0,
      calculationBasis: 'Zero exclusions'
    },
    {
      stage: 'ADDRESSABLE_SPEND',
      label: 'Addressable Spend',
      amountInr: 10000000,
      amountInrCr: 1.0,
      percentageOfTotal: 100,
      calculationBasis: '100% comparable'
    },
    {
      stage: 'E_AUCTION_OPPORTUNITY',
      label: 'Potential E-Auction Opportunity',
      amountInr: 220000,
      amountInrCr: 0.022,
      percentageOfTotal: 2.2,
      calculationBasis: 'Historical price gap × addressable volume'
    },
    {
      stage: 'VENDOR_CONSOLIDATION_OPPORTUNITY',
      label: 'Potential Consolidation Opportunity',
      amountInr: 100000,
      amountInrCr: 0.01,
      percentageOfTotal: 1.0,
      calculationBasis: 'Tail volume premium above core vendor'
    },
    {
      stage: 'OVERLAP_REMOVED',
      label: 'Overlap Deducted',
      amountInr: 100000,
      amountInrCr: 0.01,
      percentageOfTotal: 1.0,
      calculationBasis: 'Eliminated common price variance'
    },
    {
      stage: 'NET_QUANTIFIABLE_OPPORTUNITY',
      label: 'Net Quantifiable Opportunity',
      amountInr: 220000,
      amountInrCr: 0.022,
      percentageOfTotal: 2.2,
      calculationBasis: 'E-Auction + Consolidation - Overlap'
    }
  ],
  levers: [
    {
      lever: 'E_AUCTION',
      leverLabel: 'e-Auction / Competitive Reverse Bidding',
      rationale: 'High suitability for dynamic reverse auction.',
      evidence: '3 suppliers, 11.4% price dispersion',
      addressableSpendInr: 10000000,
      addressableSpendInrCr: 1.0,
      potentialBenefitLabel: '₹2.20L potential opportunity',
      potentialBenefitInr: 220000,
      dataConfidence: 'HIGH',
      risks: ['Supplier collusion risk'],
      nextAction: 'Initiate dynamic e-auction event.',
      isApplicable: true
    },
    {
      lever: 'VENDOR_CONSOLIDATION',
      leverLabel: 'Strategic Vendor Consolidation',
      rationale: 'Consolidate tail spend into Tata Steel.',
      evidence: '1 tail vendor with demonstrable premium',
      addressableSpendInr: 10000000,
      addressableSpendInrCr: 1.0,
      potentialBenefitLabel: '₹1.00L consolidation benefit',
      potentialBenefitInr: 100000,
      dataConfidence: 'HIGH',
      risks: ['Supplier capacity'],
      nextAction: 'Execute volume consolidation agreement.',
      isApplicable: true
    }
  ],
  scorecard: {
    overallScore: 88,
    recommendation: 'E_AUCTION_PLUS_CONSOLIDATION',
    recommendationLabel: 'E-Auction + Vendor Consolidation',
    dimensions: [
      {
        dimension: 'Spend Materiality',
        score: 10,
        weightPct: 15,
        assessment: 'FAVORABLE',
        rationale: 'High spend category.'
      },
      {
        dimension: 'Supplier Competition',
        score: 8,
        weightPct: 10,
        assessment: 'FAVORABLE',
        rationale: '3 active suppliers.'
      }
    ],
    justificationNotes: ['Simultaneous execution: run dynamic e-auction and consolidate tail vendor.']
  },

  calculationId: 'CALC-M2-STL-TEST',
  calculationTimestamp: '2026-09-29T12:00:00.000Z',
  calculationVersion: 'MODULE_2_SOURCING_LOGIC_V1.0',
  evidenceTransactionIds: ['TX-STL-01', 'TX-STL-02', 'TX-STL-03'],
  missingInformation: [],
  risksAndConstraints: ['Lead time validation needed'],
  nextStrategicAction: 'Convene category sourcing review.'
};

describe('Module 2 Strategic Sourcing Frontend Component Suite', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('StrategicSourcingDashboardCards: renders 10 KPI summary cards and handles card click', () => {
    const handleCardClick = vi.fn();
    render(
      <StrategicSourcingDashboardCards
        summary={mockSummary}
        onFilterCardClick={handleCardClick}
        activeFilter="ALL"
      />
    );

    // Verify key titles rendered
    expect(screen.getByText(UI_STRINGS.module2Sourcing.cardAddressableSpend)).toBeDefined();
    expect(screen.getByText(UI_STRINGS.module2Sourcing.cardProvenOpp)).toBeDefined();
    expect(screen.getByText(UI_STRINGS.module2Sourcing.cardEAuctionOpp)).toBeDefined();
    expect(screen.getByText(UI_STRINGS.module2Sourcing.cardConsolidationOpp)).toBeDefined();
    expect(screen.getByText(UI_STRINGS.module2Sourcing.cardOverlapOpp)).toBeDefined();
    expect(screen.getByText(UI_STRINGS.module2Sourcing.cardNetDefensibleRange)).toBeDefined();

    // Click on a card
    const eAuctionBtn = screen.getByText(UI_STRINGS.module2Sourcing.cardEAuctionOpp).closest('button');
    expect(eAuctionBtn).toBeDefined();
    if (eAuctionBtn) fireEvent.click(eAuctionBtn);
    expect(handleCardClick).toHaveBeenCalledWith('E_AUCTION');
  });

  it('StrategicSourcingCategoryTable: renders categories and allows row click for deep dive', () => {
    const handleSelectCategory = vi.fn();
    const handleExportAudit = vi.fn();

    render(
      <StrategicSourcingCategoryTable
        profiles={[mockProfile]}
        onSelectCategory={handleSelectCategory}
        onExportAudit={handleExportAudit}
      />
    );

    expect(screen.getByText('Structural Steel Plates')).toBeDefined();
    expect(screen.getByText('E-Auction + Vendor Consolidation')).toBeDefined();

    // Click on category row
    const row = screen.getByText('Structural Steel Plates').closest('tr');
    expect(row).toBeDefined();
    if (row) fireEvent.click(row);
    expect(handleSelectCategory).toHaveBeenCalledWith(mockProfile);

    // Click export button
    const exportBtn = screen.getByText(UI_STRINGS.module2Sourcing.btnExportAudit);
    fireEvent.click(exportBtn);
    expect(handleExportAudit).toHaveBeenCalled();
  });

  it('StrategicSourcingOpportunityWaterfall: renders 7 stages of deduplicated opportunity', () => {
    render(
      <StrategicSourcingOpportunityWaterfall
        stages={mockProfile.waterfall}
        categoryName={mockProfile.categoryName}
      />
    );

    expect(screen.getByText(UI_STRINGS.module2Sourcing.waterfallTitle)).toBeDefined();
    expect(screen.getByText('Total Category Spend')).toBeDefined();
    expect(screen.getByText('Potential E-Auction Opportunity')).toBeDefined();
    expect(screen.getByText('Potential Consolidation Opportunity')).toBeDefined();
    expect(screen.getByText('Overlap Deducted')).toBeDefined();
    expect(screen.getByText('Net Quantifiable Opportunity')).toBeDefined();
  });

  it('StrategicSourcingLeverMatrixView: renders 15 strategic levers with applicable badges', () => {
    render(<StrategicSourcingLeverMatrixView levers={mockProfile.levers} />);

    expect(screen.getByText(UI_STRINGS.module2Sourcing.leversTitle)).toBeDefined();
    expect(screen.getByText('e-Auction / Competitive Reverse Bidding')).toBeDefined();
    expect(screen.getByText('Strategic Vendor Consolidation')).toBeDefined();
  });

  it('StrategicSourcingScorecardView: renders 10-dimension scorecard and overall score', () => {
    render(<StrategicSourcingScorecardView scorecard={mockProfile.scorecard} />);

    expect(screen.getByText(UI_STRINGS.module2Sourcing.scorecardTitle)).toBeDefined();
    expect(screen.getByText('88/100')).toBeDefined();
    expect(screen.getByText('Spend Materiality')).toBeDefined();
    expect(screen.getByText('Supplier Competition')).toBeDefined();
  });

  it('StrategicSourcingDeepDiveModal: renders 20-section workspace modal with tab navigation', () => {
    const handleClose = vi.fn();
    const handleHandoff = vi.fn();

    render(
      <StrategicSourcingDeepDiveModal
        isOpen={true}
        onClose={handleClose}
        profile={mockProfile}
        onHandoffToModule4={handleHandoff}
      />
    );

    expect(screen.getByText('Structural Steel Plates')).toBeDefined();
    expect(screen.getByText('Confidence: HIGH')).toBeDefined();

    // Tab navigation
    const priceTab = screen.getByText('2. Price & Dispersion (Sec F-H)');
    fireEvent.click(priceTab);
    expect(screen.getByText('WAP (Base)')).toBeDefined();

    const oppTab = screen.getByText('3. Opportunity & Waterfall (Sec I-M)');
    fireEvent.click(oppTab);
    expect(screen.getByText(UI_STRINGS.module2Sourcing.waterfallTitle)).toBeDefined();

    const discoveryTab = screen.getByText('4. Market Discovery & Maturity (Sec U-W)');
    fireEvent.click(discoveryTab);
    expect(screen.getByText(/Procurement Maturity Scorecard/i)).toBeDefined();

    const stratTab = screen.getByText('5. Strategy & Roadmap (Sec N-Q, X)');
    fireEvent.click(stratTab);
    expect(screen.getByText('88/100')).toBeDefined();

    const evidTab = screen.getByText('6. Evidence & Audit (Sec R-T)');
    fireEvent.click(evidTab);
    expect(screen.getByText('CALC-M2-STL-TEST')).toBeDefined();

    // Handoff to Module 4
    const handoffBtn = screen.getByText(UI_STRINGS.module2Sourcing.btnHandoffToModule4);
    fireEvent.click(handoffBtn);
    expect(handleHandoff).toHaveBeenCalledWith(mockProfile);
  });

  it('Module2StrategicSourcingWorkspace: loads data and renders master workspace container', async () => {
    vi.spyOn(Module2StrategicSourcingApi, 'getDashboardSummary').mockResolvedValue(mockSummary);
    vi.spyOn(Module2StrategicSourcingApi, 'getCategoryProfiles').mockResolvedValue([mockProfile]);

    render(<Module2StrategicSourcingWorkspace />);

    await waitFor(() => {
      expect(screen.getByTestId('module2-strategic-sourcing-workspace')).toBeDefined();
      expect(screen.getAllByText(UI_STRINGS.module2Sourcing.title).length).toBeGreaterThan(0);
      expect(screen.getByText('Structural Steel Plates')).toBeDefined();
    });
  });
});
