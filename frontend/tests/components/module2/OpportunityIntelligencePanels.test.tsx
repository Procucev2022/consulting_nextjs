import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MarketDiscoveryPanel } from '../../../src/components/module2/MarketDiscoveryPanel';
import { CommercialExcellencePanel } from '../../../src/components/module2/CommercialExcellencePanel';
import { ProcurementMaturityScorecardView } from '../../../src/components/module2/ProcurementMaturityScorecardView';
import { ActionRecommendationPanel } from '../../../src/components/module2/ActionRecommendationPanel';
import { CategorySupplierProfileTab } from '../../../src/components/module2/CategorySupplierProfileTab';
import { CategoryPriceDispersionTab } from '../../../src/components/module2/CategoryPriceDispersionTab';
import type { CategoryStrategicSourcingProfile } from '../../../src/types';

describe('Opportunity Intelligence V2.0 Frontend Panels', () => {
  const mockMarketDiscovery = {
    isMarketDiscoveryRequired: true,
    discoveryStatus: 'MARKET_DISCOVERY_REQUIRED' as const,
    discoveryStatusLabel: 'Market Discovery Required',
    triggers: [
      {
        triggerKey: 'SINGLE_SUPPLIER_LOCK_IN',
        triggerLabel: 'Single Supplier Monopoly / Lock-In',
        observedCondition: '1 supplier controls 100% of category volume and historical spend.',
        structuralImpact: 'Zero internal competitive price tension exists.',
        severity: 'HIGH' as const
      }
    ],
    diagnosticRationale: 'Competitive sourcing is required to discover market price.',
    marketTestingRecommendation: 'Execute a structured market discovery RFQ.',
    recommendedSourcingVehicle: 'RUN_COMPETITIVE_RFQ' as const,
    confidence: 'HIGH' as const
  };

  const mockCommercialExcellence = {
    overallStatus: 'OPPORTUNITY_IDENTIFIED' as const,
    overallStatusLabel: 'Commercial Opportunities Identified',
    dimensions: [
      {
        dimensionKey: 'PAYMENT_TERMS' as const,
        dimensionLabel: 'Payment Terms & Working Capital',
        status: 'OPPORTUNITY_IDENTIFIED' as const,
        statusLabel: 'Opportunity Identified',
        currentCondition: 'Standard 30-day payment cycle active.',
        observedEvidence: 'Net 30 days without discount.',
        potentialImplication: 'Working capital drag.',
        recommendedAction: 'Standardize to Net 60 days.',
        isQuantifiable: false,
        estimatedBenefitInr: null,
        confidence: 'HIGH' as const
      }
    ],
    optimizedCount: 0,
    partiallyOptimizedCount: 0,
    opportunityIdentifiedCount: 1,
    insufficientDataCount: 0,
    keyFindings: ['Payment terms offer structural improvement.'],
    strategicActionSummary: 'Initiate a commercial contract harmonization round.'
  };

  const mockMaturity = {
    overallScore: 68,
    overallMaturityLevel: 'DEVELOPING' as const,
    dimensions: [
      {
        dimensionKey: 'PRICE_MANAGEMENT' as const,
        dimensionLabel: 'Price Management & Dispersion Control',
        score: 7,
        maturityLevel: 'MANAGED' as const,
        observedCondition: 'Controlled unit price variation.',
        evidence: 'Historical variance within threshold.',
        potentialImplication: 'Paying fair rates.',
        recommendedAction: 'Establish firm benchmark ceilings.',
        quantifiability: 'QUANTIFIABLE' as const
      }
    ],
    topWeaknesses: [
      {
        dimensionKey: 'PRICE_MANAGEMENT' as const,
        dimensionLabel: 'Price Management & Dispersion Control',
        score: 7,
        maturityLevel: 'MANAGED' as const,
        observedCondition: 'Controlled unit price variation.',
        evidence: 'Historical variance within threshold.',
        potentialImplication: 'Paying fair rates.',
        recommendedAction: 'Establish firm benchmark ceilings.',
        quantifiability: 'QUANTIFIABLE' as const
      }
    ],
    topStrengths: [
      {
        dimensionKey: 'PRICE_MANAGEMENT' as const,
        dimensionLabel: 'Price Management & Dispersion Control',
        score: 7,
        maturityLevel: 'MANAGED' as const,
        observedCondition: 'Controlled unit price variation.',
        evidence: 'Historical variance within threshold.',
        potentialImplication: 'Paying fair rates.',
        recommendedAction: 'Establish firm benchmark ceilings.',
        quantifiability: 'QUANTIFIABLE' as const
      }
    ],
    diagnosticSummary: 'Overall Procurement Maturity assessed at 68/100 (DEVELOPING).'
  };

  const mockActionRec = {
    whatWeFound: 'Spend of ₹1.20 Cr across 3 active supplier(s).',
    whyItMatters: 'Internal price variance indicates price gap.',
    whatWeCanQuantify: 'Proven historical price opportunity of ₹4.50 L.',
    whatWeCannotYetQuantify: 'Commercial terms value not yet quantifiable.',
    whatShouldBeTested: 'Test supplier willingness for volume discount.',
    whatProcurementShouldDoNext: ['RUN_E_AUCTION' as const, 'CONSOLIDATE_VOLUME' as const],
    priorityLevel: 'HIGH' as const
  };

  const mockProfile: CategoryStrategicSourcingProfile = {
    categoryId: 'CAT-FASTENERS',
    categoryName: 'Industrial Fasteners',
    module2Classification: 'Direct Materials',
    unspscCode: '31160000',
    unspscFamily: 'Hardware',
    totalSpendInr: 12000000,
    totalSpendInrCr: 1.2,
    transactionCount: 45,
    activeSuppliersCount: 3,
    activeMonthsCount: 12,
    averageMonthlySpendInr: 1000000,
    averageTransactionValueInr: 266666,
    spendTrend: 'STABLE',
    isRecurringSpend: true,
    recurringRationale: 'Recurring monthly spend',
    categoryMateriality: 'HIGH',
    monthlySpendBreakdown: [],
    orderSizeDistribution: {
      smallOrdersCount: 5,
      mediumOrdersCount: 20,
      largeOrdersCount: 20,
      orderCountRatio: 1.0
    },
    suppliers: [
      {
        supplierId: 'SUPP-1',
        supplierName: 'Fastener Corp',
        totalSpendInr: 8000000,
        totalSpendInrCr: 0.8,
        spendSharePct: 66.7,
        transactionCount: 30,
        transactionSharePct: 66.7,
        totalQuantity: 10000,
        weightedAveragePrice: 800,
        minPrice: 750,
        maxPrice: 850,
        rank: 1,
        isTopSupplier: true,
        isTailSupplier: false,
        pricePositionVsComparable: 'BELOW_AVERAGE',
        potentialConsolidationRelevance: 'Core'
      }
    ],
    topSupplierSharePct: 66.7,
    top3SupplierSharePct: 100,
    top5SupplierSharePct: 100,
    longTailSupplierSharePct: 0,
    hhiScore: 5000,
    hhiInterpretation: 'Concentrated',
    fragmentationLevel: 'LOW_FRAGMENTATION',
    fragmentationRationale: 'Few suppliers',
    comparableTransactionCount: 45,
    excludedTransactionCount: 0,
    comparableSpendInr: 12000000,
    comparableQuantity: 15000,
    addressableSpendInr: 12000000,
    addressableSpendInrCr: 1.2,
    addressableQuantity: 15000,
    priceDispersion: {
      totalQuantity: 15000,
      totalSpendInr: 12000000,
      weightedAveragePrice: 800,
      simpleAveragePrice: 800,
      medianPrice: 800,
      minPrice: 750,
      maxPrice: 850,
      p10Price: 760,
      p25Price: 775,
      p50Price: 800,
      p75Price: 825,
      p90Price: 840,
      priceDispersionInr: 100,
      priceDispersionPct: 12.5,
      volumeAboveP25Pct: 50,
      dispersionInterpretation: 'Normal'
    },
    credibleReference: {
      referencePrice: 775,
      methodology: 'P25_COMPARABLE_PRICE',
      qualifyingTransactionCount: 15,
      isCredible: true,
      qualificationCriteria: {
        comparableSpec: true,
        comparableUom: true,
        comparableCurrency: true,
        sufficientVolume: true,
        nonOutlier: true,
        withinHistoricalWindow: true
      },
      explanation: 'P25 reference'
    },
    exclusions: [],
    status: 'QUANTIFIABLE',
    statusLabel: 'Quantifiable',
    dataConfidence: 'HIGH',
    confidenceRationale: 'Dense data',
    eauctionSuitability: 'HIGH',
    eauctionSuitabilityRationale: 'Multi vendor',
    potentialEAuctionOpportunityInr: 375000,
    potentialEAuctionOpportunityInrCr: 0.0375,
    potentialEAuctionOpportunityPct: 3.1,
    consolidationSuitability: 'MEDIUM',
    consolidationSuitabilityRationale: 'Tail present',
    potentialVendorConsolidationOpportunityInr: 200000,
    potentialVendorConsolidationOpportunityInrCr: 0.02,
    potentialVendorConsolidationOpportunityPct: 1.6,
    operationalConsolidation: {
      suppliersPotentiallyAffected: 1,
      poCountAffected: 5,
      transactionsAffected: 5,
      activeMonthsAffected: 3,
      smallOrderCount: 2,
      estimatedTouchpointReductionCount: 3,
      explanation: 'Tail touchpoints'
    },
    overlappingOpportunityInr: 100000,
    overlappingOpportunityInrCr: 0.01,
    netQuantifiableOpportunityInr: 475000,
    netQuantifiableOpportunityInrCr: 0.0475,
    netQuantifiableOpportunityPct: 3.96,
    isQuantifiable: true,
    quantifiableDisplayText: '₹4.75 L',
    scenarios: {
      isAvailable: true,
      conservativeOpportunityInr: 300000,
      conservativeOpportunityInrCr: 0.03,
      conservativeReferencePrice: 790,
      conservativeMethodology: 'Median',
      baseOpportunityInr: 475000,
      baseOpportunityInrCr: 0.0475,
      baseReferencePrice: 775,
      baseMethodology: 'P25',
      stretchOpportunityInr: 600000,
      stretchOpportunityInrCr: 0.06,
      stretchReferencePrice: 760,
      stretchMethodology: 'P10',
      explanation: 'Scenarios'
    },
    waterfall: [],
    levers: [],
    scorecard: {
      overallScore: 75,
      recommendation: 'E_AUCTION_RECOMMENDED',
      recommendationLabel: 'E-Auction Recommended',
      dimensions: [],
      justificationNotes: []
    },
    calculationId: 'CALC-1',
    calculationTimestamp: '2026-09-30T00:00:00Z',
    calculationVersion: 'MODULE_2_OPPORTUNITY_INTELLIGENCE_V2.0',
    evidenceTransactionIds: ['TX-1'],
    missingInformation: [],
    risksAndConstraints: [],
    nextStrategicAction: 'Run E-Auction'
  };

  it('renders MarketDiscoveryPanel with triggers and recommendations', () => {
    render(<MarketDiscoveryPanel marketDiscovery={mockMarketDiscovery} />);
    expect(screen.getByText('Market Discovery Required')).toBeDefined();
    expect(screen.getByText('Single Supplier Monopoly / Lock-In')).toBeDefined();
    expect(screen.getByText('RUN COMPETITIVE RFQ')).toBeDefined();
  });

  it('renders CommercialExcellencePanel with 12 dimensions and safeguard note', () => {
    render(<CommercialExcellencePanel commercialExcellence={mockCommercialExcellence} />);
    expect(screen.getByText('Commercial Terms & Contract Excellence Profile')).toBeDefined();
    expect(screen.getByText('Payment Terms & Working Capital')).toBeDefined();
    expect(screen.getByText(/Commercial and contract terms provide operational efficiency/i)).toBeDefined();
  });

  it('renders ProcurementMaturityScorecardView with score and weaknesses', () => {
    render(<ProcurementMaturityScorecardView procurementMaturity={mockMaturity} />);
    expect(screen.getByText('10-Dimension Procurement Maturity Diagnostic Scorecard')).toBeDefined();
    expect(screen.getByText('68')).toBeDefined();
    expect(screen.getByText('Priority Improvement Areas (Weaknesses)')).toBeDefined();
  });

  it('renders ActionRecommendationPanel with 5 pillars and immediate actions', () => {
    render(<ActionRecommendationPanel actionRecommendation={mockActionRec} />);
    expect(screen.getByText('Action-Oriented Category Sourcing Roadmap')).toBeDefined();
    expect(screen.getByText('1. Run Dynamic Reverse E-Auction')).toBeDefined();
    expect(screen.getByText('HIGH')).toBeDefined();
  });

  it('renders CategorySupplierProfileTab with overview metrics', () => {
    render(<CategorySupplierProfileTab profile={mockProfile} />);
    expect(screen.getByText('Supplier Structure & Concentration Matrix')).toBeDefined();
    expect(screen.getByText('Fastener Corp')).toBeDefined();
  });

  it('renders CategoryPriceDispersionTab with price percentile grid', () => {
    render(<CategoryPriceDispersionTab profile={mockProfile} />);
    expect(screen.getByText('Price Dispersion & Non-Parametric Percentile Analysis')).toBeDefined();
    expect(screen.getByText('₹775.00')).toBeDefined();
  });
});
