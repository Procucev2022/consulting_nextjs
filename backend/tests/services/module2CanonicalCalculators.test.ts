import { describe, expect, it } from 'vitest';
import { Module2CanonicalCalculators } from '../../src/services/module2CanonicalCalculators';
import type {
  CategoryStrategicSourcingProfile,
  CategorySupplierStructureItem,
  Module2CanonicalInput,
  Module2StrategicSourcingDashboardSummary,
  Module2SupplierRiskItem,
  OpportunityLeverType,
  SourcingDataConfidence,
  SourcingScorecardDimension,
  SourcingStrategyRecommendation,
  StrategicInputTransaction
} from '../../src/types';

type LedgerConfidence = 'HIGH' | 'MEDIUM' | 'LOW';
type RiskClassification = Module2SupplierRiskItem['riskClassification'];

const makeScorecard = (
  recommendation: SourcingStrategyRecommendation
): CategoryStrategicSourcingProfile['scorecard'] => ({
  overallScore: 60,
  recommendation,
  recommendationLabel: '',
  dimensions: [],
  justificationNotes: []
});

const makeTransaction = (overrides: Partial<StrategicInputTransaction> = {}): StrategicInputTransaction => ({
  id: 'TX-1',
  po_number: 'PO-1',
  vendor_code: 'VND-ACME',
  vendor_name: 'Acme Steel',
  material_desc: 'Angle 50x50',
  quantity: 10,
  unit_price: 100,
  total_spend_inr: 1000,
  spend_category: 'Structural Steel',
  ...overrides
});

const makeSupplier = (
  supplierName: string,
  spendSharePct: number,
  overrides: Partial<CategorySupplierStructureItem> = {}
): CategorySupplierStructureItem => ({
  supplierId: `SUPP-${supplierName.replace(/\s+/g, '').toUpperCase()}`,
  supplierName,
  totalSpendInr: 0,
  totalSpendInrCr: 0,
  spendSharePct,
  transactionCount: 0,
  transactionSharePct: 0,
  totalQuantity: 0,
  weightedAveragePrice: 0,
  minPrice: 0,
  maxPrice: 0,
  rank: 0,
  isTopSupplier: false,
  isTailSupplier: false,
  pricePositionVsComparable: 'NON_COMPARABLE',
  potentialConsolidationRelevance: '',
  ...overrides
});

const makeProfile = (overrides: Partial<CategoryStrategicSourcingProfile> = {}): CategoryStrategicSourcingProfile => ({
  categoryId: 'CAT-STEEL',
  categoryName: 'Structural Steel',
  module2Classification: 'DIRECT_MATERIAL',
  unspscCode: '30101500',
  unspscFamily: 'Structural shapes',
  totalSpendInr: 50000000,
  totalSpendInrCr: 5,
  transactionCount: 12,
  activeSuppliersCount: 3,
  activeMonthsCount: 6,
  averageMonthlySpendInr: 8333333,
  averageTransactionValueInr: 4166667,
  spendTrend: 'STABLE',
  isRecurringSpend: true,
  recurringRationale: 'Purchased in six billing months',
  categoryMateriality: 'HIGH',
  monthlySpendBreakdown: [],
  orderSizeDistribution: { smallOrdersCount: 0, mediumOrdersCount: 0, largeOrdersCount: 0, orderCountRatio: 0 },
  suppliers: [],
  topSupplierSharePct: 0,
  top3SupplierSharePct: 0,
  top5SupplierSharePct: 0,
  longTailSupplierSharePct: 0,
  hhiScore: 3400,
  hhiInterpretation: 'Moderately concentrated market',
  fragmentationLevel: 'MODERATE_FRAGMENTATION',
  fragmentationRationale: '',
  comparableTransactionCount: 0,
  excludedTransactionCount: 0,
  comparableSpendInr: 0,
  comparableQuantity: 0,
  addressableSpendInr: 40000000,
  addressableSpendInrCr: 4,
  addressableQuantity: 0,
  priceDispersion: null,
  credibleReference: {
    referencePrice: null,
    methodology: 'NO_VALID_REFERENCE',
    qualifyingTransactionCount: 0,
    isCredible: false,
    qualificationCriteria: {
      comparableSpec: false,
      comparableUom: false,
      comparableCurrency: false,
      sufficientVolume: false,
      nonOutlier: false,
      withinHistoricalWindow: false
    },
    explanation: ''
  },
  exclusions: [],
  status: 'QUANTIFIABLE',
  statusLabel: 'Quantifiable',
  dataConfidence: 'HIGH',
  confidenceRationale: '',
  eauctionSuitability: 'MEDIUM',
  eauctionSuitabilityRationale: '',
  potentialEAuctionOpportunityInr: null,
  potentialEAuctionOpportunityInrCr: null,
  potentialEAuctionOpportunityPct: null,
  consolidationSuitability: 'MEDIUM',
  consolidationSuitabilityRationale: '',
  potentialVendorConsolidationOpportunityInr: null,
  potentialVendorConsolidationOpportunityInrCr: null,
  potentialVendorConsolidationOpportunityPct: null,
  operationalConsolidation: {
    suppliersPotentiallyAffected: 0,
    poCountAffected: 0,
    transactionsAffected: 0,
    activeMonthsAffected: 0,
    smallOrderCount: 0,
    estimatedTouchpointReductionCount: 0,
    explanation: ''
  },
  overlappingOpportunityInr: 0,
  overlappingOpportunityInrCr: 0,
  netQuantifiableOpportunityInr: null,
  netQuantifiableOpportunityInrCr: null,
  netQuantifiableOpportunityPct: null,
  isQuantifiable: true,
  quantifiableDisplayText: '',
  scenarios: {
    isAvailable: false,
    conservativeOpportunityInr: null,
    conservativeOpportunityInrCr: null,
    conservativeReferencePrice: null,
    conservativeMethodology: '',
    baseOpportunityInr: null,
    baseOpportunityInrCr: null,
    baseReferencePrice: null,
    baseMethodology: '',
    stretchOpportunityInr: null,
    stretchOpportunityInrCr: null,
    stretchReferencePrice: null,
    stretchMethodology: '',
    explanation: ''
  },
  waterfall: [],
  levers: [],
  scorecard: makeScorecard('NO_IMMEDIATE_SOURCING_ACTION'),
  calculationId: 'CALC-CAT-STEEL',
  calculationTimestamp: '2026-01-31T00:00:00.000Z',
  calculationVersion: 'MODULE_2_SOURCING_LOGIC_V1.0',
  evidenceTransactionIds: [],
  missingInformation: [],
  risksAndConstraints: [],
  nextStrategicAction: '',
  ...overrides
});

// A profile with a proven e-auction opportunity: gross 5.0M, net 4.0M, overlap 1.0M.
const makeSteelProfile = (overrides: Partial<CategoryStrategicSourcingProfile> = {}): CategoryStrategicSourcingProfile =>
  makeProfile({
    suppliers: [makeSupplier('Acme Steel', 60), makeSupplier('Beta Metals', 40)],
    grossQuantifiableBenefitInr: 5000000,
    grossQuantifiableBenefitInrCr: 0.5,
    netQuantifiableOpportunityInr: 4000000,
    netQuantifiableOpportunityInrCr: 0.4,
    overlappingOpportunityInr: 1000000,
    overlappingOpportunityInrCr: 0.1,
    evidenceState: 'PROVEN_OPPORTUNITY',
    dataConfidence: 'HIGH',
    scorecard: makeScorecard('E_AUCTION_RECOMMENDED'),
    ...overrides
  });

const makeCanonicalInput = (overrides: Partial<Module2CanonicalInput> = {}): Module2CanonicalInput => ({
  datasetId: 'DS-2026',
  dataVersionId: 'DV-2026-1',
  sourceFileName: 'procurement-2026.xlsx',
  sourceRowCount: 1200,
  validRowCount: 1150,
  excludedRowCount: 40,
  anomalyRowCount: 10,
  totalValidatedSpendInr: 500000000,
  totalValidatedSpendCr: 50,
  transactions: [],
  suppliersCount: 30,
  materialGroupsCount: 12,
  plantsCount: 3,
  billingMonthsCount: 10,
  period: {
    startDate: '2025-04-01',
    endDate: '2026-01-31',
    actualBillingMonths: 10,
    fiscalYear: 'FY2025-26',
    fiscalMonthCoverage: '10 of 12',
    isFullFiscalYear: false,
    missingMonthsNotice: 'February and March 2026 are not yet billed'
  },
  currencyCoverage: { currenciesDetected: ['INR', 'USD'], normalizedSpendInr: 500000000 },
  fxNormalization: { masterVersion: 'FX-2026.01', checksum: 'checksum-value' },
  ...overrides
});

const makeDashboardSummary = (
  overrides: Partial<Module2StrategicSourcingDashboardSummary> = {}
): Module2StrategicSourcingDashboardSummary => ({
  totalAddressableSpendInr: 400000000,
  totalAddressableSpendInrCr: 40,
  totalPotentialEAuctionOpportunityInr: 20000000,
  totalPotentialEAuctionOpportunityInrCr: 2,
  totalPotentialConsolidationOpportunityInr: 10000000,
  totalPotentialConsolidationOpportunityInrCr: 1,
  totalOverlappingOpportunityInr: 3000000,
  totalOverlappingOpportunityInrCr: 0.3,
  netQuantifiableOpportunityInr: 27000000,
  netQuantifiableOpportunityInrCr: 2.7,
  overallDataConfidence: 'MEDIUM',
  categoriesReadyForSourcingCount: 4,
  eauctionCandidatesCount: 3,
  consolidationCandidatesCount: 2,
  opportunitiesNotYetQuantifiableCount: 5,
  categoriesAnalyzedCount: 12,
  totalSpendAnalyzedInr: 500000000,
  totalSpendAnalyzedInrCr: 50,
  calculationTimestamp: '2026-01-31T00:00:00.000Z',
  ...overrides
});

const STRATEGY_CASES: Array<[SourcingStrategyRecommendation, OpportunityLeverType, string, string]> = [
  ['E_AUCTION_RECOMMENDED', 'E_AUCTION', 'e-auction', 'DATA-DERIVED'],
  ['VENDOR_CONSOLIDATION_REVIEW', 'VENDOR_CONSOLIDATION', 'Supplier tier consolidation', 'MODELLING ASSUMPTION'],
  ['COMPETITIVE_RFQ_RECOMMENDED', 'COMBINED_STRATEGIC', 'multi-lever', 'DATA-DERIVED'],
  ['NO_IMMEDIATE_SOURCING_ACTION', 'COMBINED_STRATEGIC', 'multi-lever', 'DATA-DERIVED']
];

const CONFIDENCE_CASES: Array<[SourcingDataConfidence, LedgerConfidence]> = [
  ['HIGH', 'HIGH'],
  ['MEDIUM', 'MEDIUM'],
  ['LOW', 'LOW'],
  ['INSUFFICIENT', 'LOW']
];

const RISK_CASES: Array<[number, RiskClassification]> = [
  [70, 'SINGLE_SOURCE_DOMINANT'],
  [69.99, 'MODERATE_CONCENTRATION'],
  [40, 'MODERATE_CONCENTRATION'],
  [39.99, 'FRAGMENTED_COMPETITIVE']
];

const purchaseLines = (
  vendorName: string,
  materialDesc: string,
  poPrefix: string,
  count: number,
  spendInr = 1000
): StrategicInputTransaction[] =>
  Array.from({ length: count }, (_, index) =>
    makeTransaction({
      id: `${poPrefix}-L${index + 1}`,
      po_number: `${poPrefix}-${index + 1}`,
      vendor_name: vendorName,
      material_desc: materialDesc,
      spend_category: 'Fasteners',
      total_spend_inr: spendInr
    })
  );

describe('Module2CanonicalCalculators.buildOpportunityLedger', () => {
  it('returns an empty ledger when no profiles are provided', () => {
    expect(Module2CanonicalCalculators.buildOpportunityLedger([], [makeTransaction()])).toEqual([]);
  });

  it('maps a proven e-auction profile onto a ledger item with its spend, benefit and overlap', () => {
    const txs = [
      makeTransaction({ id: 'TX-1' }),
      makeTransaction({ id: 'TX-2' }),
      makeTransaction({ id: 'TX-3', spend_category: 'Fasteners' })
    ];

    const ledger = Module2CanonicalCalculators.buildOpportunityLedger(
      [makeSteelProfile({ addressableSpendInr: 40000000, addressableSpendInrCr: 4 })],
      txs
    );

    expect(ledger).toHaveLength(1);
    expect(ledger[0]).toMatchObject({
      opportunityId: 'OPP-M2-CAT-STEEL',
      sourceTransactionIds: ['TX-1', 'TX-2'],
      category: 'Structural Steel',
      supplierIds: ['Acme Steel', 'Beta Metals'],
      materialIds: ['CAT-STEEL'],
      opportunityType: 'E_AUCTION',
      eligibleSpendInr: 40000000,
      eligibleSpendCr: 4,
      grossOpportunityInr: 5000000,
      grossOpportunityCr: 0.5,
      overlapGroup: 'OG-CAT-CAT-STEEL',
      overlapAmountInr: 1000000,
      overlapAmountCr: 0.1,
      netOpportunityInr: 4000000,
      netOpportunityCr: 0.4,
      confidence: 'HIGH',
      status: 'PROVEN'
    });
  });

  it.each(STRATEGY_CASES)(
    'maps the %s recommendation to the %s lever',
    (recommendation, opportunityType, methodologyFragment, assumptionFragment) => {
      const [item] = Module2CanonicalCalculators.buildOpportunityLedger(
        [makeSteelProfile({ scorecard: makeScorecard(recommendation) })],
        []
      );

      expect(item.opportunityType).toBe(opportunityType);
      expect(item.methodology).toContain(methodologyFragment);
      expect(item.assumption).toContain(assumptionFragment);
    }
  );

  it.each(CONFIDENCE_CASES)('maps data confidence %s to ledger confidence %s', (dataConfidence, expected) => {
    const [item] = Module2CanonicalCalculators.buildOpportunityLedger(
      [makeSteelProfile({ dataConfidence })],
      []
    );

    expect(item.confidence).toBe(expected);
  });

  it('marks a profile as qualified when its evidence is not proven', () => {
    const [item] = Module2CanonicalCalculators.buildOpportunityLedger(
      [makeSteelProfile({ evidenceState: 'QUANTIFIABLE_OPPORTUNITY_RANGE' })],
      []
    );

    expect(item.status).toBe('QUALIFIED');
  });

  it('skips profiles whose gross and net opportunities are zero, negative or missing', () => {
    const ledger = Module2CanonicalCalculators.buildOpportunityLedger(
      [
        makeSteelProfile({ categoryId: 'CAT-ZERO', grossQuantifiableBenefitInr: 0, netQuantifiableOpportunityInr: 0 }),
        makeSteelProfile({
          categoryId: 'CAT-NEGATIVE',
          grossQuantifiableBenefitInr: undefined,
          netQuantifiableOpportunityInr: -250
        }),
        makeSteelProfile({
          categoryId: 'CAT-EMPTY',
          grossQuantifiableBenefitInr: undefined,
          netQuantifiableOpportunityInr: null
        })
      ],
      []
    );

    expect(ledger).toEqual([]);
  });

  it('keeps a profile when either the gross or the net opportunity is positive', () => {
    const ledger = Module2CanonicalCalculators.buildOpportunityLedger(
      [
        makeSteelProfile({ categoryId: 'CAT-NET-ONLY', grossQuantifiableBenefitInr: 0, netQuantifiableOpportunityInr: 150000 }),
        makeSteelProfile({ categoryId: 'CAT-GROSS-ONLY', grossQuantifiableBenefitInr: 900000, netQuantifiableOpportunityInr: -100000 })
      ],
      []
    );

    expect(ledger.map((item) => item.opportunityId)).toEqual(['OPP-M2-CAT-NET-ONLY', 'OPP-M2-CAT-GROSS-ONLY']);
  });

  it('defaults missing crore and net values to zero when the profile lacks them', () => {
    const [item] = Module2CanonicalCalculators.buildOpportunityLedger(
      [
        makeSteelProfile({
          categoryId: 'CAT-PARTIAL',
          grossQuantifiableBenefitInr: 250000,
          grossQuantifiableBenefitInrCr: undefined,
          netQuantifiableOpportunityInr: null,
          netQuantifiableOpportunityInrCr: null,
          evidenceState: undefined
        })
      ],
      []
    );

    expect(item).toMatchObject({
      grossOpportunityInr: 250000,
      grossOpportunityCr: 0,
      netOpportunityInr: 0,
      netOpportunityCr: 0,
      overlapAmountInr: 1000000,
      status: 'QUALIFIED'
    });
  });

  it('keeps at most the first ten matching transactions and drops sampled rows without an id', () => {
    const txs = [
      makeTransaction({ id: undefined, po_number: 'PO-NO-ID' }),
      ...Array.from({ length: 11 }, (_, index) => makeTransaction({ id: `TX-${String(index + 1).padStart(2, '0')}` })),
      makeTransaction({ id: 'TX-OTHER', spend_category: 'Fasteners' })
    ];

    const [item] = Module2CanonicalCalculators.buildOpportunityLedger([makeSteelProfile()], txs);

    expect(item.sourceTransactionIds).toEqual(Array.from({ length: 9 }, (_, index) => `TX-${String(index + 1).padStart(2, '0')}`));
  });

  it('lists at most five supplier names and skips unnamed suppliers', () => {
    const [item] = Module2CanonicalCalculators.buildOpportunityLedger(
      [
        makeSteelProfile({
          suppliers: [
            makeSupplier('Acme Steel', 30),
            makeSupplier('', 20),
            makeSupplier('Beta Metals', 15),
            makeSupplier('Gamma Alloys', 15),
            makeSupplier('Delta Forge', 10),
            makeSupplier('Epsilon Works', 10)
          ]
        })
      ],
      []
    );

    expect(item.supplierIds).toEqual(['Acme Steel', 'Beta Metals', 'Gamma Alloys', 'Delta Forge']);
  });

  it('returns no transaction or supplier ids when the profile has none', () => {
    const [item] = Module2CanonicalCalculators.buildOpportunityLedger([makeSteelProfile({ suppliers: [] })], []);

    expect(item.sourceTransactionIds).toEqual([]);
    expect(item.supplierIds).toEqual([]);
  });

  it('returns one ledger item per qualifying profile in input order', () => {
    const ledger = Module2CanonicalCalculators.buildOpportunityLedger(
      [makeSteelProfile({ categoryId: 'CAT-A' }), makeSteelProfile({ categoryId: 'CAT-B', categoryName: 'Fasteners' })],
      []
    );

    expect(ledger.map((item) => [item.opportunityId, item.category])).toEqual([
      ['OPP-M2-CAT-A', 'Structural Steel'],
      ['OPP-M2-CAT-B', 'Fasteners']
    ]);
  });
});

describe('Module2CanonicalCalculators.buildTop50Vendors', () => {
  it('returns an empty list when there are no transactions', () => {
    expect(Module2CanonicalCalculators.buildTop50Vendors([])).toEqual([]);
  });

  it('ranks vendors by spend with shares, cumulative shares, Pareto classes and crore values', () => {
    const txs = [
      makeTransaction({ id: 'T1', vendor_name: 'Acme Steel', vendor_code: 'VND-ACME', spend_category: 'Steel', total_spend_inr: 400000 }),
      makeTransaction({ id: 'T2', vendor_name: 'Beta Metals', vendor_code: 'VND-BETA', spend_category: 'Steel', total_spend_inr: 300000 }),
      makeTransaction({ id: 'T3', vendor_name: 'Acme Steel', vendor_code: 'VND-ACME', spend_category: 'Fasteners', total_spend_inr: 200000 }),
      makeTransaction({ id: 'T4', vendor_name: 'Gamma Packs', vendor_code: undefined, spend_category: 'Packing', total_spend_inr: 100000 })
    ];

    expect(Module2CanonicalCalculators.buildTop50Vendors(txs)).toEqual([
      {
        rank: 1,
        vendorCode: 'VND-ACME',
        vendorName: 'Acme Steel',
        totalSpendInr: 600000,
        totalSpendCr: 0.06,
        spendSharePct: 60,
        cumulativeSharePct: 60,
        paretoClass: 'A',
        categoriesSuppliedCount: 2,
        categoriesList: ['Steel', 'Fasteners'],
        transactionCount: 2,
        vendorType: 'MULTI_CATEGORY_PARTNER'
      },
      {
        rank: 2,
        vendorCode: 'VND-BETA',
        vendorName: 'Beta Metals',
        totalSpendInr: 300000,
        totalSpendCr: 0.03,
        spendSharePct: 30,
        cumulativeSharePct: 90,
        paretoClass: 'B',
        categoriesSuppliedCount: 1,
        categoriesList: ['Steel'],
        transactionCount: 1,
        vendorType: 'SINGLE_CATEGORY_SPECIALIST'
      },
      {
        rank: 3,
        vendorCode: 'VND-UNKNOWN',
        vendorName: 'Gamma Packs',
        totalSpendInr: 100000,
        totalSpendCr: 0.01,
        spendSharePct: 10,
        cumulativeSharePct: 100,
        paretoClass: 'C',
        categoriesSuppliedCount: 1,
        categoriesList: ['Packing'],
        transactionCount: 1,
        vendorType: 'SINGLE_CATEGORY_SPECIALIST'
      }
    ]);
  });

  it('uses the first vendor code that appears on any of a vendor rows', () => {
    const txs = [
      makeTransaction({ id: 'T1', vendor_name: 'Delta Forge', vendor_code: undefined, total_spend_inr: 100 }),
      makeTransaction({ id: 'T2', vendor_name: 'Delta Forge', vendor_code: 'VND-DELTA', total_spend_inr: 100 }),
      makeTransaction({ id: 'T3', vendor_name: 'Delta Forge', vendor_code: 'VND-OTHER', total_spend_inr: 100 }),
      makeTransaction({ id: 'T4', vendor_name: 'Epsilon Works', vendor_code: '', total_spend_inr: 50 })
    ];

    const top50 = Module2CanonicalCalculators.buildTop50Vendors(txs);

    expect(top50.map((vendor) => [vendor.vendorName, vendor.vendorCode])).toEqual([
      ['Delta Forge', 'VND-DELTA'],
      ['Epsilon Works', 'VND-UNKNOWN']
    ]);
  });

  it('assigns Pareto classes at the 80% and 95% cumulative boundaries', () => {
    const txs = [
      makeTransaction({ id: 'T1', vendor_name: 'Vendor Alpha', total_spend_inr: 800 }),
      makeTransaction({ id: 'T2', vendor_name: 'Vendor Beta', total_spend_inr: 150 }),
      makeTransaction({ id: 'T3', vendor_name: 'Vendor Gamma', total_spend_inr: 50 })
    ];

    const top50 = Module2CanonicalCalculators.buildTop50Vendors(txs);

    expect(top50.map((vendor) => vendor.paretoClass)).toEqual(['A', 'B', 'C']);
    expect(top50.map((vendor) => vendor.cumulativeSharePct)).toEqual([80, 95, 100]);
  });

  it('reports zero shares and class A when the total spend is zero', () => {
    const txs = [
      makeTransaction({ id: 'T1', vendor_name: 'Zero Alpha', total_spend_inr: 0 }),
      makeTransaction({ id: 'T2', vendor_name: 'Zero Beta', total_spend_inr: 0 })
    ];

    const top50 = Module2CanonicalCalculators.buildTop50Vendors(txs);

    expect(top50).toMatchObject([
      { spendSharePct: 0, cumulativeSharePct: 0, paretoClass: 'A', totalSpendCr: 0 },
      { spendSharePct: 0, cumulativeSharePct: 0, paretoClass: 'A', totalSpendCr: 0 }
    ]);
  });

  it('keeps only the top 50 vendors while shares use the full spend total', () => {
    const txs = Array.from({ length: 55 }, (_, index) => {
      const vendorNumber = index + 1;
      return makeTransaction({
        id: `T-${vendorNumber}`,
        vendor_name: `Vendor ${String(vendorNumber).padStart(2, '0')}`,
        vendor_code: `VND-${vendorNumber}`,
        total_spend_inr: (56 - vendorNumber) * 1000
      });
    });

    const top50 = Module2CanonicalCalculators.buildTop50Vendors(txs);

    expect(top50).toHaveLength(50);
    expect(top50.map((vendor) => vendor.rank)).toEqual(Array.from({ length: 50 }, (_, index) => index + 1));
    expect(top50[0]).toMatchObject({ vendorName: 'Vendor 01', spendSharePct: 3.57, cumulativeSharePct: 3.57 });
    expect(top50[49]).toMatchObject({ vendorName: 'Vendor 50', totalSpendInr: 6000 });
  });

  it('counts a vendor with no category as supplying no categories', () => {
    const [vendor] = Module2CanonicalCalculators.buildTop50Vendors([
      makeTransaction({ vendor_name: 'Solo Supply', spend_category: undefined })
    ]);

    expect(vendor).toMatchObject({
      categoriesSuppliedCount: 0,
      categoriesList: [],
      vendorType: 'SINGLE_CATEGORY_SPECIALIST'
    });
  });
});

describe('Module2CanonicalCalculators.buildSupplierRisk', () => {
  it('flags single-source dominance and carries the profile figures into the risk item', () => {
    const risks = Module2CanonicalCalculators.buildSupplierRisk([
      makeProfile({
        activeSuppliersCount: 2,
        hhiScore: 3400,
        suppliers: [makeSupplier('Acme Steel', 75, { totalSpendInrCr: 3.75 }), makeSupplier('Beta Metals', 25, { totalSpendInrCr: 1.25 })]
      })
    ]);

    expect(risks).toEqual([
      {
        materialGroup: 'Structural Steel',
        totalSpendInr: 50000000,
        totalSpendCr: 5,
        totalSuppliersCount: 2,
        primarySupplierName: 'Acme Steel',
        primarySupplierSpendCr: 3.75,
        primarySupplierSharePct: 75,
        riskClassification: 'SINGLE_SOURCE_DOMINANT',
        hhiScore: 3400
      }
    ]);
  });

  it.each(RISK_CASES)('classifies a primary supplier share of %s', (share, expected) => {
    const [risk] = Module2CanonicalCalculators.buildSupplierRisk([
      makeProfile({
        suppliers: [makeSupplier('Acme Steel', share), makeSupplier('Beta Metals', 10), makeSupplier('Gamma Alloys', 10)]
      })
    ]);

    expect(risk.riskClassification).toBe(expected);
  });

  it('treats a single supplier as single-source even below the 70% threshold', () => {
    const [risk] = Module2CanonicalCalculators.buildSupplierRisk([
      makeProfile({ suppliers: [makeSupplier('Acme Steel', 50)] })
    ]);

    expect(risk.riskClassification).toBe('SINGLE_SOURCE_DOMINANT');
  });

  it('reports N/A and zero shares when a category has no suppliers', () => {
    const [risk] = Module2CanonicalCalculators.buildSupplierRisk([makeProfile({ suppliers: [] })]);

    expect(risk).toMatchObject({
      primarySupplierName: 'N/A',
      primarySupplierSharePct: 0,
      primarySupplierSpendCr: 0,
      riskClassification: 'FRAGMENTED_COMPETITIVE'
    });
  });

  it('reports the profile HHI rather than a scorecard dimension lookup', () => {
    const dimensions: SourcingScorecardDimension[] = [
      { dimension: 'SUPPLIER_STRUCTURE', score: 9, weightPct: 10, assessment: 'FAVORABLE', rationale: '' }
    ];

    const [risk] = Module2CanonicalCalculators.buildSupplierRisk([
      makeProfile({
        hhiScore: 2600,
        suppliers: [makeSupplier('Acme Steel', 50)],
        scorecard: { ...makeScorecard('NO_IMMEDIATE_SOURCING_ACTION'), dimensions }
      })
    ]);

    expect(risk.hhiScore).toBe(2600);
  });
});

describe('Module2CanonicalCalculators.buildPoConsolidation', () => {
  it('ignores transactions without a purchase order number', () => {
    expect(
      Module2CanonicalCalculators.buildPoConsolidation([makeTransaction({ po_number: undefined })])
    ).toEqual([]);
  });

  it('keeps vendor and material pairs with five or more distinct POs and sums their spend', () => {
    const angleLines = [
      ...['PO-1', 'PO-2', 'PO-3', 'PO-4', 'PO-5', 'PO-1'].map((poNumber) =>
        makeTransaction({ po_number: poNumber, total_spend_inr: 1000, spend_category: 'Structural Steel' })
      )
    ];
    const plateLines = purchaseLines('Beta Metals', 'Plate 10mm', 'PB', 4);

    const items = Module2CanonicalCalculators.buildPoConsolidation([...angleLines, ...plateLines]);

    expect(items).toEqual([
      {
        pairId: 'POC-1001',
        vendorName: 'Acme Steel',
        materialDesc: 'Angle 50x50',
        category: 'Structural Steel',
        poCount: 5,
        totalSpendInr: 6000,
        totalSpendCr: 0.0006,
        avgPoValueInr: 1200,
        frequency: '5 POs across 10 billing months',
        consolidationSuitability: 'MEDIUM'
      }
    ]);
  });

  it('sorts candidates by PO count and rates more than twenty POs as HIGH suitability', () => {
    const txs = [
      ...purchaseLines('Delta Fasteners', 'Hex Bolt', 'DX', 6),
      ...purchaseLines('Gamma Nuts', 'Hex Nut', 'GY', 21),
      ...purchaseLines('Epsilon Washers', 'Washer', 'EZ', 20)
    ];

    const items = Module2CanonicalCalculators.buildPoConsolidation(txs);

    expect(items.map((item) => [item.pairId, item.poCount, item.consolidationSuitability])).toEqual([
      ['POC-1002', 21, 'HIGH'],
      ['POC-1003', 20, 'MEDIUM'],
      ['POC-1001', 6, 'MEDIUM']
    ]);
  });

  it('uses placeholder labels when the vendor, material or category is blank', () => {
    const txs = Array.from({ length: 5 }, (_, index) =>
      makeTransaction({
        po_number: `PB-${index + 1}`,
        vendor_name: '',
        material_desc: '',
        spend_category: undefined,
        total_spend_inr: 500
      })
    );

    expect(Module2CanonicalCalculators.buildPoConsolidation(txs)).toMatchObject([
      { vendorName: 'UNKNOWN', materialDesc: 'UNKNOWN', category: 'Direct Materials', poCount: 5, totalSpendInr: 2500 }
    ]);
  });
});

describe('Module2CanonicalCalculators.buildRecurringSpend', () => {
  it('describes recurring and ad-hoc categories using their active billing months', () => {
    const items = Module2CanonicalCalculators.buildRecurringSpend([
      makeProfile({ categoryName: 'Structural Steel', activeMonthsCount: 6, isRecurringSpend: true }),
      makeProfile({
        categoryName: 'Fasteners',
        activeMonthsCount: 2,
        isRecurringSpend: false,
        totalSpendInr: 1200000,
        totalSpendInrCr: 0.12,
        transactionCount: 4,
        activeSuppliersCount: 1
      })
    ]);

    expect(items).toEqual([
      {
        category: 'Structural Steel',
        activeMonthsCount: 6,
        totalSpendInr: 50000000,
        totalSpendCr: 5,
        transactionCount: 12,
        supplierCount: 3,
        isRecurring: true,
        classification: 'Recurring across 6 of 10 billing months'
      },
      {
        category: 'Fasteners',
        activeMonthsCount: 2,
        totalSpendInr: 1200000,
        totalSpendCr: 0.12,
        transactionCount: 4,
        supplierCount: 1,
        isRecurring: false,
        classification: 'Ad-hoc / Non-recurring (2 active months)'
      }
    ]);
  });

  it('returns an empty list when there are no profiles', () => {
    expect(Module2CanonicalCalculators.buildRecurringSpend([])).toEqual([]);
  });
});

describe('Module2CanonicalCalculators.buildBridge', () => {
  it('maps validated spend, dashboard totals and counts into the bridge', () => {
    const bridge = Module2CanonicalCalculators.buildBridge(
      makeCanonicalInput(),
      makeDashboardSummary({
        grossQuantifiableBenefitInr: 30000000,
        grossQuantifiableBenefitInrCr: 3,
        provenOpportunityInr: 25000000,
        provenOpportunityInrCr: 2.5,
        quantifiableRangeMinInr: 20000000,
        quantifiableRangeMinInrCr: 2,
        quantifiableRangeMaxInr: 30000000,
        quantifiableRangeMaxInrCr: 3
      })
    );

    expect(bridge).toEqual({
      totalValidatedSpendInr: 500000000,
      totalValidatedSpendCr: 50,
      module2AnalyzedSpendInr: 500000000,
      module2AnalyzedSpendCr: 50,
      addressableSpendInr: 400000000,
      addressableSpendCr: 40,
      grossOpportunityInr: 30000000,
      grossOpportunityCr: 3,
      overlapDeductionsInr: 3000000,
      overlapDeductionsCr: 0.3,
      netDefensibleOpportunityInr: 27000000,
      netDefensibleOpportunityCr: 2.7,
      provenOpportunityInr: 25000000,
      provenOpportunityCr: 2.5,
      quantifiableRangeMinInr: 20000000,
      quantifiableRangeMinCr: 2,
      quantifiableRangeMaxInr: 30000000,
      quantifiableRangeMaxCr: 3,
      categoriesReadyCount: 4,
      eauctionCandidatesCount: 3,
      consolidationCandidatesCount: 2,
      categoriesAnalyzedCount: 12
    });
  });

  it('reports zero for optional amounts that the summary omits', () => {
    const bridge = Module2CanonicalCalculators.buildBridge(makeCanonicalInput(), makeDashboardSummary());

    expect(bridge).toMatchObject({
      grossOpportunityInr: 0,
      grossOpportunityCr: 0,
      provenOpportunityInr: 0,
      provenOpportunityCr: 0,
      quantifiableRangeMinInr: 0,
      quantifiableRangeMinCr: 0,
      quantifiableRangeMaxInr: 0,
      quantifiableRangeMaxCr: 0,
      overlapDeductionsInr: 3000000,
      netDefensibleOpportunityInr: 27000000
    });
  });
});
