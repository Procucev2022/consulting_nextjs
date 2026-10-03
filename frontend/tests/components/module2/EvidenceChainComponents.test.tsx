/**
 * Module 2 — Evidence Chain & Traceability UI Components Test Suite
 * Version: MODULE_2_EVIDENCE_LOGIC_V1.0
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  TransactionEvidenceDrawer,
  EvidenceCalculationTraceModal,
  OpportunityExclusionLedgerView,
  PairwisePriceComparisonView,
  CategoryEvidenceAuditTab
} from '../../../src/components/module2';
import type {
  TransactionEvidenceRecord,
  OpportunityExclusionLedgerEntry,
  SupplierPairPriceComparisonProof,
  CategoryStrategicSourcingProfile
} from '../../../src/types';

const mockRecords: TransactionEvidenceRecord[] = [
  {
    transactionId: 'TX-001',
    poNumber: 'PO-1001',
    poDate: '2026-01-10',
    supplierId: 'SUPP-TATA',
    supplierName: 'Tata Steel Ltd',
    category: 'Structural Steel',
    subCategory: 'Plates',
    itemId: 'ITEM-101',
    itemDescription: 'Steel Plate 10mm',
    specification: 'ASTM A36',
    grade: 'Grade A',
    uom: 'MT',
    quantity: 100,
    unitPrice: 65000,
    currency: 'INR',
    totalValue: 6500000,
    deliveryLocation: 'Plant Jamshedpur',
    contractStatus: 'ACTIVE_CONTRACT',
    contractReference: 'MSA-2025',
    paymentTerms: 'Net 45 Days',
    incoterm: 'FOR Destination',
    sourceDocument: 'ERP_PURCHASE_ORDER',
    sourceRow: 1,
    dataQualityStatus: 'VERIFIED',
    comparabilityStatus: 'COMPARABLE',
    isEligible: true
  },
  {
    transactionId: 'TX-002',
    poNumber: 'PO-1002',
    poDate: '2026-01-12',
    supplierId: 'SUPP-JSW',
    supplierName: 'JSW Steel Ltd',
    category: 'Structural Steel',
    subCategory: 'Plates',
    itemId: 'ITEM-101',
    itemDescription: 'Steel Plate 10mm',
    specification: 'ASTM A36',
    grade: 'Grade A',
    uom: 'MT',
    quantity: 80,
    unitPrice: 60000,
    currency: 'INR',
    totalValue: 4800000,
    deliveryLocation: 'Plant Vijayanagar',
    contractStatus: 'ACTIVE_CONTRACT',
    contractReference: 'MSA-2025',
    paymentTerms: 'Net 45 Days',
    incoterm: 'FOR Destination',
    sourceDocument: 'ERP_PURCHASE_ORDER',
    sourceRow: 2,
    dataQualityStatus: 'VERIFIED',
    comparabilityStatus: 'COMPARABLE',
    isEligible: true
  }
];

const mockExclusions: OpportunityExclusionLedgerEntry[] = [
  {
    transactionId: 'TX-EX-1',
    poNumber: 'PO-999',
    supplierName: 'Small Hardware Supplier',
    itemDescription: 'Specialty Bracket',
    spendInr: 25000,
    quantity: 1,
    unitPrice: 25000,
    uom: 'EA',
    exclusionCode: 'EXCLUDED_LOW_VOLUME',
    exclusionDetail: 'Order volume below 1% threshold'
  }
];

const mockProofs: SupplierPairPriceComparisonProof[] = [
  {
    supplierA: {
      supplierId: 'SUPP-TATA',
      supplierName: 'Tata Steel Ltd',
      quantity: 100,
      uom: 'MT',
      unitPrice: 65000,
      date: '2026-01-10',
      specification: 'ASTM A36',
      transactionIds: ['TX-001'],
      totalSpendInr: 6500000
    },
    supplierB: {
      supplierId: 'SUPP-JSW',
      supplierName: 'JSW Steel Ltd',
      quantity: 80,
      uom: 'MT',
      unitPrice: 60000,
      date: '2026-01-12',
      specification: 'ASTM A36',
      transactionIds: ['TX-002'],
      totalSpendInr: 4800000
    },
    priceDifference: 5000,
    priceDifferencePct: 8.33,
    comparabilityChecklist: {
      specificationMatch: true,
      uomMatch: true,
      currencyMatch: true,
      geographyMatch: true,
      timeWindowMatch: true,
      isValidComparison: true
    }
  }
];

const mockProfile: CategoryStrategicSourcingProfile = {
  categoryId: 'CAT-STL',
  categoryName: 'Structural Steel',
  module2Classification: 'Direct Materials',
  unspscCode: '30101704',
  unspscFamily: 'Steel Plates',
  totalSpendInr: 11300000,
  totalSpendInrCr: 1.13,
  transactionCount: 2,
  activeSuppliersCount: 2,
  activeMonthsCount: 6,
  averageMonthlySpendInr: 1883333,
  averageTransactionValueInr: 5650000,
  spendTrend: 'STABLE',
  isRecurringSpend: true,
  recurringRationale: 'Recurring spend pattern',
  categoryMateriality: 'HIGH',
  monthlySpendBreakdown: [],
  orderSizeDistribution: { smallOrdersCount: 0, mediumOrdersCount: 1, largeOrdersCount: 1, orderCountRatio: 2 },
  suppliers: [],
  topSupplierSharePct: 57.5,
  top3SupplierSharePct: 100,
  top5SupplierSharePct: 100,
  longTailSupplierSharePct: 0,
  hhiScore: 5000,
  hhiInterpretation: 'Concentrated',
  fragmentationLevel: 'LOW_FRAGMENTATION',
  fragmentationRationale: '2 suppliers',
  comparableTransactionCount: 2,
  excludedTransactionCount: 1,
  comparableSpendInr: 11300000,
  comparableQuantity: 180,
  addressableSpendInr: 11300000,
  addressableSpendInrCr: 1.13,
  addressableQuantity: 180,
  priceDispersion: null,
  credibleReference: {
    referencePrice: 60000,
    methodology: 'LOWEST_CREDIBLE_PRICE',
    qualifyingTransactionCount: 1,
    isCredible: true,
    qualificationCriteria: {
      comparableSpec: true,
      comparableUom: true,
      comparableCurrency: true,
      sufficientVolume: true,
      nonOutlier: true,
      withinHistoricalWindow: true
    },
    explanation: 'Valid credible reference'
  },
  exclusions: [],
  status: 'QUANTIFIABLE',
  statusLabel: 'Opportunity Quantified',
  dataConfidence: 'HIGH',
  confidenceRationale: 'High confidence',
  eauctionSuitability: 'HIGH',
  eauctionSuitabilityRationale: 'High liquidity',
  potentialEAuctionOpportunityInr: 500000,
  potentialEAuctionOpportunityInrCr: 0.05,
  potentialEAuctionOpportunityPct: 4.4,
  consolidationSuitability: 'MEDIUM',
  consolidationSuitabilityRationale: 'Moderate',
  potentialVendorConsolidationOpportunityInr: 200000,
  potentialVendorConsolidationOpportunityInrCr: 0.02,
  potentialVendorConsolidationOpportunityPct: 1.8,
  operationalConsolidation: {
    suppliersPotentiallyAffected: 1,
    poCountAffected: 1,
    transactionsAffected: 1,
    activeMonthsAffected: 1,
    smallOrderCount: 0,
    estimatedTouchpointReductionCount: 1,
    explanation: 'Tail reduction'
  },
  overlappingOpportunityInr: 200000,
  overlappingOpportunityInrCr: 0.02,
  netQuantifiableOpportunityInr: 500000,
  netQuantifiableOpportunityInrCr: 0.05,
  netQuantifiableOpportunityPct: 4.4,
  isQuantifiable: true,
  quantifiableDisplayText: '₹0.05 Cr',
  scenarios: {
    isAvailable: true,
    conservativeOpportunityInr: 400000,
    conservativeOpportunityInrCr: 0.04,
    conservativeReferencePrice: 61000,
    conservativeMethodology: 'P25',
    baseOpportunityInr: 500000,
    baseOpportunityInrCr: 0.05,
    baseReferencePrice: 60000,
    baseMethodology: 'Lowest Credible',
    stretchOpportunityInr: 700000,
    stretchOpportunityInrCr: 0.07,
    stretchReferencePrice: 58000,
    stretchMethodology: 'Min',
    explanation: 'Quartiles'
  },
  waterfall: [],
  levers: [],
  scorecard: {
    overallScore: 85,
    recommendation: 'E_AUCTION_RECOMMENDED',
    recommendationLabel: 'E-Auction',
    dimensions: [],
    justificationNotes: ['Run reverse auction']
  },
  calculationId: 'CALC-TEST-101',
  calculationTimestamp: '2026-01-20T10:00:00.000Z',
  calculationVersion: 'MODULE_2_SOURCING_LOGIC_V2.0',
  evidenceTransactionIds: ['TX-001', 'TX-002'],
  missingInformation: [],
  risksAndConstraints: [],
  nextStrategicAction: 'Run reverse auction',

  transactionEvidenceRecords: mockRecords,
  exclusionLedger: mockExclusions,
  pairwisePriceProofs: mockProofs,
  completeCalculationTrace: {
    traceId: 'TRACE-101',
    categoryName: 'Structural Steel',
    questionPrompt: 'Why ₹5.0 Lakhs (₹0.05 Cr)?',
    opportunityAmountInr: 500000,
    totalTransactionsInput: 2,
    totalSpendInputInr: 11300000,
    filtersApplied: ['SPEC_MATCH', 'UOM_MATCH'],
    eligibleTransactionsCount: 2,
    excludedTransactionsCount: 1,
    excludedSpendInr: 25000,
    referencePriceSelected: 60000,
    referenceMethod: 'LOWEST_CREDIBLE_PRICE',
    referencePriceRationale: 'Credible price with repeat supplier',
    addressableVolume: 180,
    priceDifferential: 2777.78,
    grossOpportunityInr: 500000,
    constraintsDeductedInr: 0,
    analyticalRangeMinInr: 400000,
    analyticalRangeMaxInr: 700000,
    confidence: 'HIGH',
    recommendedAction: 'Run e-auction'
  },
  evidenceChain: {
    chainId: 'CHAIN-101',
    categoryId: 'CAT-STL',
    categoryName: 'Structural Steel',
    addressability: {
      totalHistoricalSpendInr: 11300000,
      comparableSpendInr: 11300000,
      priceAddressableSpendInr: 11300000,
      contractuallyAddressableSpendInr: 9600000,
      executableSpendInr: 8500000,
      realizableSavingsInr: null,
      disclaimer: 'Module 4 realizable'
    },
    comparableTransactionSet: {
      totalTransactions: 2,
      eligibleTransactions: 2,
      excludedTransactions: 1,
      supplierCount: 2,
      totalQuantity: 180,
      excludedSpendInr: 25000
    },
    referencePriceAudit: {
      lowestObservedPrice: 60000,
      lowestCrediblePrice: 60000,
      p25Price: 61250,
      medianPrice: 62500,
      weightedAveragePrice: 62777.78,
      currentRecentPrice: 60000,
      selectedReferencePrice: 60000,
      selectedMethodology: 'LOWEST_CREDIBLE_PRICE',
      selectionRationale: 'Credible price selected',
      supportingTransactionIds: ['TX-002']
    },
    priceDifference: 2777.78,
    addressableVolume: 180,
    grossOpportunityInr: 500000,
    addressabilityConstraints: {
      contractLockedSpendInr: 1000000,
      unharmonizedSpecSpendInr: 500000,
      nonRecurringSpendInr: 25000,
      operationalConstraintSpendInr: 100000
    },
    realisticOpportunityRange: {
      conservativeOpportunityInr: 400000,
      conservativeRefPrice: 61250,
      baseOpportunityInr: 500000,
      baseRefPrice: 60000,
      upsideOpportunityInr: 700000,
      upsideRefPrice: 58000,
      label: 'ANALYTICAL PROCUREMENT OPPORTUNITY — NOT REALIZED SAVINGS'
    },
    executionMechanisms: [
      { mechanism: 'E_AUCTION', sharePct: 60, amountInr: 300000, traceabilityNote: 'Price spread' }
    ],
    evidenceConfidence: 'HIGH',
    evidenceConfidenceReasons: ['Multi-supplier dispersion present'],
    evidenceStatus: 'PROVEN_OPPORTUNITY'
  }
};

describe('Module 2 — Evidence Chain & Traceability UI Components', () => {
  it('PairwisePriceComparisonView: renders supplier comparisons and comparability checklist', () => {
    render(<PairwisePriceComparisonView proofs={mockProofs} />);
    expect(screen.getAllByText('Tata Steel Ltd').length).toBeGreaterThan(0);
    expect(screen.getAllByText('JSW Steel Ltd').length).toBeGreaterThan(0);
    expect(screen.getByText(/Comparability Checklist/i)).toBeDefined();
    expect(screen.getByText(/Spec: MATCH/i)).toBeDefined();
  });

  it('OpportunityExclusionLedgerView: renders exclusion entries and filter options', () => {
    render(<OpportunityExclusionLedgerView ledger={mockExclusions} />);
    expect(screen.getByText(/OPPORTUNITY EXCLUSION LEDGER/i)).toBeDefined();
    expect(screen.getByText('Small Hardware Supplier')).toBeDefined();
    expect(screen.getByText('EXCLUDED_LOW_VOLUME')).toBeDefined();
  });

  it('TransactionEvidenceDrawer: renders 24-point transaction inspector', () => {
    const handleClose = vi.fn();
    render(
      <TransactionEvidenceDrawer
        isOpen={true}
        onClose={handleClose}
        categoryName="Structural Steel"
        records={mockRecords}
      />
    );
    expect(screen.getByText(/LINE-ITEM TRANSACTION AUDIT DRAWER/i)).toBeDefined();
    expect(screen.getByText('PO-1001')).toBeDefined();

    // Click row to view inspector
    const row = screen.getByText('PO-1001');
    fireEvent.click(row);
    expect(screen.getByText(/Source Record Traceability Proof/i)).toBeDefined();
    expect(screen.getByText('TX-001')).toBeDefined();
    expect(screen.getByText(/ERP_PURCHASE_ORDER/i)).toBeDefined();
  });

  it('EvidenceCalculationTraceModal: renders derivation trace and exports evidence pack', () => {
    const handleClose = vi.fn();
    render(
      <EvidenceCalculationTraceModal
        isOpen={true}
        onClose={handleClose}
        profile={mockProfile}
      />
    );
    expect(screen.getByText('Why ₹5.0 Lakhs (₹0.05 Cr)?')).toBeDefined();
    expect(screen.getByText(/CONSERVATIVE \(P25\)/i)).toBeDefined();
    expect(screen.getByText(/BASE \(CREDIBLE\)/i)).toBeDefined();
    expect(screen.getByText(/Export Evidence Pack \(JSON\)/i)).toBeDefined();
  });

  it('CategoryEvidenceAuditTab: renders Tab 6 and opens trace and drawer modals', () => {
    render(<CategoryEvidenceAuditTab profile={mockProfile} />);
    expect(screen.getByText('CALC-TEST-101')).toBeDefined();

    // Open Trace Modal
    const traceBtn = screen.getByText(/Why ₹0.05 Cr\? \(Trace\)/i);
    fireEvent.click(traceBtn);
    expect(screen.getByText('Why ₹5.0 Lakhs (₹0.05 Cr)?')).toBeDefined();

    // Open Drawer
    const drawerBtn = screen.getByText(/View All 2 Transactions/i);
    fireEvent.click(drawerBtn);
    expect(screen.getByText(/LINE-ITEM TRANSACTION AUDIT DRAWER/i)).toBeDefined();
  });
});
