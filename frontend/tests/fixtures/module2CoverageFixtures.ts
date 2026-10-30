/**
 * Module 2 coverage fixtures based on structural steel plate (IS 2062 E250 BR) procurement data.
 * Each builder returns a fully typed object. Overrides are merged last so a test can vary one field.
 * Passing `undefined` through an override simulates a payload that omits a field.
 */

import type {
  AlternateSourcingResult,
  AlternateSourcingSummary,
  AlternateVendorDiscoveryOpportunity
} from '../../src/types/module2AlternateSourcing';
import type {
  CategoryOpportunityBenefit,
  CategorySpecialisationProfile,
  CategorySpecialisationResult,
  CategorySpecialisationSummary,
  CrossLeverOverlapItem,
  OpportunityHeadAssumption
} from '../../src/types/module2CategorySpecialisation';
import type { ActionRecommendationOutput } from '../../src/types/module2OpportunityIntelligence';
import type { CategoryStrategicSourcingProfile } from '../../src/types/module2StrategicSourcingProfiles';
import type { PriceDispersionMetrics } from '../../src/types/module2StrategicSourcing';
import type {
  CompleteCalculationTrace,
  OpportunityEvidenceChain,
  OpportunityExclusionLedgerEntry,
  SupplierPairPriceComparisonProof,
  TransactionEvidenceRecord
} from '../../src/types/module2EvidenceChain';

export const buildActionRecommendation = (
  overrides: Partial<ActionRecommendationOutput> = {}
): ActionRecommendationOutput => ({
  whatWeFound: 'Spend of ₹41.24 Cr across 3 active suppliers for IS 2062 E250 BR plates.',
  whyItMatters: 'Unit prices spread 9.9% between P10 and P90, so price control is weak across plants.',
  whatWeCanQuantify: 'Proven historical price opportunity of ₹8.40 L on comparable plate transactions.',
  whatWeCannotYetQuantify: 'Volume rebate value depends on supplier confirmation.',
  whatShouldBeTested: 'Test supplier willingness for volume-based price tiers on 10mm plates.',
  whatProcurementShouldDoNext: ['RUN_E_AUCTION', 'CONSOLIDATE_VOLUME'],
  priorityLevel: 'HIGH',
  ...overrides
});

export const buildPriceDispersionMetrics = (): PriceDispersionMetrics => ({
  totalQuantity: 6500,
  totalSpendInr: 412360000,
  weightedAveragePrice: 63440,
  simpleAveragePrice: 62650,
  medianPrice: 62500,
  minPrice: 58500,
  maxPrice: 67800,
  p10Price: 59200,
  p25Price: 61250,
  p50Price: 62500,
  p75Price: 64100,
  p90Price: 65400,
  priceDispersionInr: 6200,
  priceDispersionPct: 9.9,
  volumeAboveP25Pct: 58,
  dispersionInterpretation: 'Moderate spread: P10 to P90 band of 9.9% across three plants.'
});

export const buildTransactionEvidenceRecords = (): TransactionEvidenceRecord[] => [
  {
    transactionId: 'TX-STL-001',
    poNumber: 'PO-STL-1001',
    poDate: '2026-01-10',
    supplierId: 'SUP-TATA-001',
    supplierName: 'Tata Steel Ltd',
    category: 'Structural Steel Plates',
    subCategory: 'Hot Rolled Plates',
    itemId: 'ITEM-IS2062-10',
    itemDescription: 'IS 2062 E250 BR Plate 10mm',
    specification: 'IS 2062 E250 BR',
    grade: 'E250 BR',
    uom: 'MT',
    quantity: 40,
    unitPrice: 61250,
    currency: 'INR',
    totalValue: 2450000,
    deliveryLocation: 'Plant Jamshedpur',
    contractStatus: 'ACTIVE_CONTRACT',
    contractReference: 'MSA-TSL-2025-07',
    paymentTerms: 'Net 45 Days',
    incoterm: 'FOR Destination',
    sourceDocument: 'ERP_PURCHASE_ORDER',
    sourceRow: 1,
    dataQualityStatus: 'VERIFIED',
    comparabilityStatus: 'COMPARABLE',
    isEligible: true
  },
  {
    transactionId: 'TX-STL-002',
    poNumber: 'PO-STL-1002',
    poDate: '2026-01-12',
    supplierId: 'SUP-JSW-002',
    supplierName: 'JSW Steel Ltd',
    category: 'Structural Steel Plates',
    subCategory: 'Hot Rolled Plates',
    itemId: 'ITEM-IS2062-10',
    itemDescription: 'IS 2062 E250 BR Plate 10mm',
    specification: 'IS 2062 E250 BR',
    grade: 'E250 BR',
    uom: 'MT',
    quantity: 35,
    unitPrice: 60000,
    currency: 'INR',
    totalValue: 2100000,
    deliveryLocation: 'Plant Vijayanagar',
    contractStatus: 'ACTIVE_CONTRACT',
    contractReference: 'MSA-JSW-2025-03',
    paymentTerms: 'Net 45 Days',
    incoterm: 'FOR Destination',
    sourceDocument: 'ERP_PURCHASE_ORDER',
    sourceRow: 2,
    dataQualityStatus: 'VERIFIED',
    comparabilityStatus: 'COMPARABLE',
    isEligible: true
  },
  {
    transactionId: 'TX-STL-003',
    poNumber: 'PO-STL-1003',
    poDate: '2026-02-03',
    supplierId: 'SUP-JSPL-003',
    supplierName: 'Jindal Steel & Power Ltd',
    category: 'Structural Steel Plates',
    subCategory: 'Hot Rolled Plates',
    itemId: 'ITEM-IS2062-12',
    itemDescription: 'IS 2062 E250 BR Plate 12mm',
    specification: 'IS 2062 E250 BR',
    grade: 'E250 BR',
    uom: 'MT',
    quantity: 22,
    unitPrice: 62500,
    currency: 'INR',
    totalValue: 1375000,
    deliveryLocation: 'Plant Pune',
    contractStatus: 'SPOT_PURCHASE',
    contractReference: 'NONE',
    paymentTerms: 'Net 30 Days',
    incoterm: 'EXW Plant Gate',
    sourceDocument: 'ERP_PURCHASE_ORDER',
    sourceRow: 3,
    dataQualityStatus: 'VERIFIED',
    comparabilityStatus: 'COMPARABLE',
    isEligible: true
  }
];

export const buildOpportunityExclusionLedger = (): OpportunityExclusionLedgerEntry[] => [
  {
    transactionId: 'TX-EX-1',
    poNumber: 'PO-STL-0999',
    supplierName: 'Local Fabricator Co',
    itemDescription: 'IS 2062 E250 BR Plate 6mm offcut',
    spendInr: 25000,
    quantity: 1,
    unitPrice: 25000,
    uom: 'MT',
    exclusionCode: 'EXCLUDED_LOW_VOLUME',
    exclusionDetail: 'Order volume below 1% threshold'
  }
];

export const buildPairwisePriceProofs = (): SupplierPairPriceComparisonProof[] => [
  {
    supplierA: {
      supplierId: 'SUP-TATA-001',
      supplierName: 'Tata Steel Ltd',
      quantity: 40,
      uom: 'MT',
      unitPrice: 61250,
      date: '2026-01-10',
      specification: 'IS 2062 E250 BR',
      transactionIds: ['TX-STL-001'],
      totalSpendInr: 2450000
    },
    supplierB: {
      supplierId: 'SUP-JSW-002',
      supplierName: 'JSW Steel Ltd',
      quantity: 35,
      uom: 'MT',
      unitPrice: 60000,
      date: '2026-01-12',
      specification: 'IS 2062 E250 BR',
      transactionIds: ['TX-STL-002'],
      totalSpendInr: 2100000
    },
    priceDifference: 1250,
    priceDifferencePct: 2.04,
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

export const buildCalculationTrace = (): CompleteCalculationTrace => ({
  traceId: 'TRACE-STL-PLATE-0101',
  categoryName: 'Structural Steel Plates',
  questionPrompt: 'Why ₹0.84 Cr opportunity on IS 2062 E250 BR plates?',
  opportunityAmountInr: 8400000,
  totalTransactionsInput: 3,
  totalSpendInputInr: 412360000,
  filtersApplied: ['SPEC_MATCH', 'UOM_MATCH'],
  eligibleTransactionsCount: 3,
  excludedTransactionsCount: 1,
  excludedSpendInr: 25000,
  referencePriceSelected: 60000,
  referenceMethod: 'LOWEST_CREDIBLE_PRICE',
  referencePriceRationale: 'Credible price with repeat supplier',
  addressableVolume: 6500,
  priceDifferential: 1250,
  grossOpportunityInr: 8400000,
  constraintsDeductedInr: 0,
  analyticalRangeMinInr: 6500000,
  analyticalRangeMaxInr: 9800000,
  confidence: 'HIGH',
  recommendedAction: 'Run reverse e-auction on 10mm plates'
});

export const buildEvidenceChain = (): OpportunityEvidenceChain => ({
  chainId: 'CHAIN-STL-PLATE-0101',
  categoryId: 'CAT-STL-PLATE-IS2062',
  categoryName: 'Structural Steel Plates',
  addressability: {
    totalHistoricalSpendInr: 412360000,
    comparableSpendInr: 412360000,
    priceAddressableSpendInr: 412360000,
    contractuallyAddressableSpendInr: 380000000,
    executableSpendInr: 350000000,
    realizableSavingsInr: null,
    disclaimer: 'Module 4 realizable'
  },
  comparableTransactionSet: {
    totalTransactions: 3,
    eligibleTransactions: 3,
    excludedTransactions: 1,
    supplierCount: 3,
    totalQuantity: 6500,
    excludedSpendInr: 25000
  },
  referencePriceAudit: {
    lowestObservedPrice: 58500,
    lowestCrediblePrice: 60000,
    p25Price: 61250,
    medianPrice: 62500,
    weightedAveragePrice: 63440,
    currentRecentPrice: 60000,
    selectedReferencePrice: 60000,
    selectedMethodology: 'LOWEST_CREDIBLE_PRICE',
    selectionRationale: 'Credible price selected',
    supportingTransactionIds: ['TX-STL-002']
  },
  priceDifference: 3440,
  addressableVolume: 6500,
  grossOpportunityInr: 8400000,
  addressabilityConstraints: {
    contractLockedSpendInr: 30000000,
    unharmonizedSpecSpendInr: 5000000,
    nonRecurringSpendInr: 25000,
    operationalConstraintSpendInr: 1000000
  },
  realisticOpportunityRange: {
    conservativeOpportunityInr: 6500000,
    conservativeRefPrice: 61250,
    baseOpportunityInr: 8400000,
    baseRefPrice: 60000,
    upsideOpportunityInr: 9800000,
    upsideRefPrice: 58500,
    label: 'ANALYTICAL PROCUREMENT OPPORTUNITY — NOT REALIZED SAVINGS'
  },
  executionMechanisms: [
    { mechanism: 'E_AUCTION', sharePct: 60, amountInr: 5040000, traceabilityNote: 'Price spread across mills' }
  ],
  evidenceConfidence: 'HIGH',
  evidenceConfidenceReasons: ['Three suppliers with comparable IS 2062 E250 BR dispersion'],
  evidenceStatus: 'PROVEN_OPPORTUNITY'
});

export const buildSteelPlateCategoryProfile = (
  overrides: Partial<CategoryStrategicSourcingProfile> = {}
): CategoryStrategicSourcingProfile => ({
  categoryId: 'CAT-STL-PLATE-IS2062',
  categoryName: 'Structural Steel Plates',
  module2Classification: 'Direct Materials',
  unspscCode: '30101704',
  unspscFamily: 'Steel Plates',
  totalSpendInr: 412360000,
  totalSpendInrCr: 41.24,
  transactionCount: 3,
  activeSuppliersCount: 3,
  activeMonthsCount: 6,
  averageMonthlySpendInr: 68726667,
  averageTransactionValueInr: 137453333,
  spendTrend: 'STABLE',
  isRecurringSpend: true,
  recurringRationale: 'Plate purchases recur every month across three plants.',
  categoryMateriality: 'HIGH',
  monthlySpendBreakdown: [],
  orderSizeDistribution: { smallOrdersCount: 0, mediumOrdersCount: 1, largeOrdersCount: 2, orderCountRatio: 2 },
  suppliers: [],
  topSupplierSharePct: 45.2,
  top3SupplierSharePct: 100,
  top5SupplierSharePct: 100,
  longTailSupplierSharePct: 0,
  hhiScore: 3400,
  hhiInterpretation: 'Concentrated',
  fragmentationLevel: 'LOW_FRAGMENTATION',
  fragmentationRationale: 'Three active plate suppliers',
  comparableTransactionCount: 3,
  excludedTransactionCount: 1,
  comparableSpendInr: 412360000,
  comparableQuantity: 6500,
  addressableSpendInr: 412360000,
  addressableSpendInrCr: 41.24,
  addressableQuantity: 6500,
  priceDispersion: buildPriceDispersionMetrics(),
  credibleReference: {
    referencePrice: 60000,
    methodology: 'LOWEST_CREDIBLE_PRICE',
    qualifyingTransactionCount: 3,
    isCredible: true,
    qualificationCriteria: {
      comparableSpec: true,
      comparableUom: true,
      comparableCurrency: true,
      sufficientVolume: true,
      nonOutlier: true,
      withinHistoricalWindow: true
    },
    explanation: 'Lowest credible IS 2062 E250 BR price with repeat supplier support.'
  },
  exclusions: [],
  status: 'QUANTIFIABLE',
  statusLabel: 'Opportunity Quantified',
  dataConfidence: 'HIGH',
  confidenceRationale: 'Three comparable plate transactions across plants.',
  eauctionSuitability: 'HIGH',
  eauctionSuitabilityRationale: 'Multiple qualified mills supply 10mm plates.',
  potentialEAuctionOpportunityInr: 6185400,
  potentialEAuctionOpportunityInrCr: 0.62,
  potentialEAuctionOpportunityPct: 1.5,
  consolidationSuitability: 'MEDIUM',
  consolidationSuitabilityRationale: 'Moderate tail of offcut suppliers.',
  potentialVendorConsolidationOpportunityInr: 2000000,
  potentialVendorConsolidationOpportunityInrCr: 0.2,
  potentialVendorConsolidationOpportunityPct: 0.5,
  operationalConsolidation: {
    suppliersPotentiallyAffected: 1,
    poCountAffected: 4,
    transactionsAffected: 4,
    activeMonthsAffected: 3,
    smallOrderCount: 0,
    estimatedTouchpointReductionCount: 2,
    explanation: 'Tail touchpoints for offcut suppliers'
  },
  overlappingOpportunityInr: 1000000,
  overlappingOpportunityInrCr: 0.1,
  netQuantifiableOpportunityInr: 8400000,
  netQuantifiableOpportunityInrCr: 0.84,
  netQuantifiableOpportunityPct: 2,
  isQuantifiable: true,
  quantifiableDisplayText: '₹0.84 Cr',
  scenarios: {
    isAvailable: true,
    conservativeOpportunityInr: 6500000,
    conservativeOpportunityInrCr: 0.65,
    conservativeReferencePrice: 61250,
    conservativeMethodology: 'P25',
    baseOpportunityInr: 8400000,
    baseOpportunityInrCr: 0.84,
    baseReferencePrice: 60000,
    baseMethodology: 'Lowest Credible',
    stretchOpportunityInr: 9800000,
    stretchOpportunityInrCr: 0.98,
    stretchReferencePrice: 58500,
    stretchMethodology: 'Min',
    explanation: 'Quartile-based scenario range'
  },
  waterfall: [],
  levers: [],
  scorecard: {
    overallScore: 85,
    recommendation: 'E_AUCTION_RECOMMENDED',
    recommendationLabel: 'E-Auction',
    dimensions: [],
    justificationNotes: ['Run reverse auction across three qualified mills.']
  },
  calculationId: 'CALC-STL-PLATE-0101',
  calculationTimestamp: '2026-01-20T10:00:00.000Z',
  calculationVersion: 'MODULE_2_SOURCING_LOGIC_V2.0',
  evidenceTransactionIds: ['TX-STL-001', 'TX-STL-002', 'TX-STL-003'],
  missingInformation: [],
  risksAndConstraints: [],
  nextStrategicAction: 'Run reverse e-auction for IS 2062 E250 BR plates',
  transactionEvidenceRecords: buildTransactionEvidenceRecords(),
  exclusionLedger: buildOpportunityExclusionLedger(),
  pairwisePriceProofs: buildPairwisePriceProofs(),
  completeCalculationTrace: buildCalculationTrace(),
  evidenceChain: buildEvidenceChain(),
  ...overrides
});

export const buildAlternateSourcingSummary = (
  overrides: Partial<AlternateSourcingSummary> = {}
): AlternateSourcingSummary => ({
  totalEligibleMaterials: 3887,
  singleSourceMaterialsCount: 13,
  totalPotentialVendorsAllLocations: 25001,
  totalPotentialVendorsPreferredRegion: 3620,
  deduplicatedDistinctVendorsAllLocations: 21103,
  deduplicatedDistinctVendorsPreferredRegion: 3159,
  cumulativeOpportunityVendorMatches: 25695,
  totalCurrentSuppliersIdentified: 4,
  totalCurrentSuppliersMatchedInMaster: 3,
  totalCurrentSuppliersExcluded: 2,
  overallDistinctVendorPoolEstimate: 614864,
  potentialFinancialSavingsInr: 0,
  potentialFinancialSavingsCr: 0,
  isDiscoveryOnly: true,
  ...overrides
});

export const buildAlternateSourcingOpportunity = (
  overrides: Partial<AlternateVendorDiscoveryOpportunity> = {}
): AlternateVendorDiscoveryOpportunity => ({
  opportunityId: 'OPP-ALT-STL-001',
  materialCode: '1100528',
  materialDescription: 'IS 2062 E250 BR STEEL PLATE 10MM',
  spendCategory: 'Structural Steel Plates',
  subCategory: 'Hot Rolled Plates',
  specification: null,
  customerPlant: 'Plant Jamshedpur',
  customerPreferredState: 'MAHARASHTRA',
  customerPreferredCity: 'MUMBAI',
  relevantSpendInr: 652140211.5,
  relevantSpendCr: 65.21,
  currentSupplierCount: 2,
  currentSuppliers: ['TATA STEEL LIMITED', 'JSW STEEL LIMITED'],
  exclusionLimitationNotice: undefined,
  matchedVendorCategory: 'Structural Steel Plates',
  matchType: 'EXACT',
  matchTypeRationale: 'Hot rolled plate listings map directly to the structural steel plate category.',
  potentialVendorsAllLocations: 258,
  potentialVendorsPreferredRegion: 17,
  exactMatchesCount: 258,
  hierarchyMatchesCount: 0,
  synonymMatchesCount: 0,
  relatedMatchesCount: 1407,
  qualifiedAlternativesCount: 'DATA_UNAVAILABLE',
  qualificationStatus: 'UNQUALIFIED',
  excludedCurrentSuppliersCount: 1,
  excludedSupplierNames: ['TATA STEEL LIMITED'],
  geographicBreakdown: {
    sameCityCount: 0,
    sameStateCount: 17,
    otherStatesCount: 241,
    allLocationsCount: 258,
    preferredRegionCount: 17,
    topStates: [{ state: 'MAHARASHTRA', count: 17 }],
    topCities: [{ city: 'MUMBAI', count: 0 }]
  },
  contactCompleteness: {
    hasWebsiteCount: 78,
    hasEmailCount: 0,
    hasPhoneCount: 258,
    missingContactCount: 180,
    hasWebsiteRatioPct: 30.2,
    hasEmailRatioPct: 0
  },
  disclosures: [],
  ...overrides
});

export const buildAlternateSourcingResult = (
  overrides: Partial<AlternateSourcingResult> = {}
): AlternateSourcingResult => ({
  assessmentId: 'AIC-2026-0001',
  summary: buildAlternateSourcingSummary(),
  opportunities: [
    buildAlternateSourcingOpportunity(),
    buildAlternateSourcingOpportunity({
      opportunityId: 'OPP-ALT-STL-002',
      materialDescription: 'HOT ROLLED ANGLE 50X50X6 MS',
      subCategory: 'Angles & Sections',
      matchType: 'HIERARCHY',
      matchTypeRationale: 'Angle sections map through the structural steel hierarchy.',
      currentSupplierCount: 1,
      currentSuppliers: ['JINDAL STAINLESS LIMITED'],
      excludedCurrentSuppliersCount: 0,
      excludedSupplierNames: [],
      exclusionLimitationNotice: 'Supplier record for Jindal Stainless is missing category tags.',
      relatedMatchesCount: 1407,
      matchedVendorCategory: 'Structural Steel Sections'
    }),
    buildAlternateSourcingOpportunity({
      opportunityId: 'OPP-ALT-STL-003',
      materialDescription: 'MS FLAT 40X6 IS 2062',
      subCategory: 'Flats',
      matchType: 'UNMATCHED',
      matchTypeRationale: 'No verified category match for this flat section.',
      currentSupplierCount: 0,
      currentSuppliers: [],
      excludedCurrentSuppliersCount: 0,
      excludedSupplierNames: [],
      exclusionLimitationNotice: undefined,
      relatedMatchesCount: 0,
      matchedVendorCategory: 'Unmatched'
    })
  ],
  availableStates: ['MAHARASHTRA', 'GUJARAT'],
  availableCities: ['AHMEDABAD', 'MUMBAI', 'PUNE'],
  disclosures: [],
  ...overrides
});

export const buildOpportunityHeadAssumptions = (): OpportunityHeadAssumption[] => [
  {
    key: 'HEAD-A',
    code: 'HEAD-A',
    title: 'Strategic Category Management',
    lowPct: 1,
    basePct: 2,
    highPct: 3,
    description: 'End-to-end plate category strategy and cross-plant governance.'
  },
  {
    key: 'HEAD-B',
    code: 'HEAD-B',
    title: 'Supplier Base Rationalisation',
    lowPct: 1,
    basePct: 2,
    highPct: 3,
    description: 'Consolidation of the offcut supplier tail into primary mills.',
    relatedLever: 'LEVER_3'
  },
  {
    key: 'HEAD-G',
    code: 'HEAD-G',
    title: 'Alternative Supplier Development',
    lowPct: 1,
    basePct: 2.5,
    highPct: 4,
    description: 'Qualifying secondary mills to reduce single-source plate pricing.'
  },
  {
    key: 'HEAD-I',
    code: 'HEAD-I',
    title: 'Category Expertise Deployment',
    lowPct: 0.5,
    basePct: 1.25,
    highPct: 2,
    description: 'Metallurgy specialist support for plate specification sourcing.'
  },
  {
    key: 'HEAD-J',
    code: 'HEAD-J',
    title: 'Process & Transaction Efficiency',
    lowPct: 5,
    basePct: 10,
    highPct: 15,
    description: 'Streamlining plate purchase order processing and invoice matching.',
    appliesToOperatingCost: true
  }
];

export const buildCategoryOpportunityBenefit = (
  overrides: Partial<CategoryOpportunityBenefit> = {}
): CategoryOpportunityBenefit => ({
  headKey: 'HEAD-B',
  headCode: 'HEAD-B',
  headTitle: 'Supplier Base Rationalisation',
  categoryName: 'Structural Steel Plates',
  eligibleAnnualSpendInr: 2500000000,
  eligibleAnnualSpendCr: 250,
  isEligibleEstablished: true,
  lowAssumptionPct: 1,
  baseAssumptionPct: 2,
  highAssumptionPct: 3,
  lowEstimateInr: 25000000,
  lowEstimateCr: 2.5,
  baseEstimateInr: 50000000,
  baseEstimateCr: 5,
  highEstimateInr: 75000000,
  highEstimateCr: 7.5,
  calculationRationale: 'Applied to eligible IS 2062 plate spend across three plants.',
  dataAndEvidenceStatus: 'TENTATIVE_PENDING',
  validationRequirements: 'Supplier consolidation charter validation required.',
  disclaimer: 'Planning estimate',
  commercialMechanism: 'Supplier tail consolidation',
  eligibilityRule: 'Category priority rule',
  opportunityStatus: 'TENTATIVE — PENDING VALIDATION',
  ...overrides
});

export const buildCategorySpecialisationProfile = (
  overrides: Partial<CategorySpecialisationProfile> = {}
): CategorySpecialisationProfile => ({
  categoryName: 'Structural Steel Plates',
  priority: 'PRIORITY_A',
  priorityRationale: 'Largest spend share across three plants with concentrated mill supply.',
  recommendedApproach: 'DEDICATED_CATEGORY_MANAGER',
  approachRationale: 'Critical multi-plant plate sourcing needs a dedicated category manager.',
  annualSpendInr: 2600000000,
  annualSpendCr: 260,
  spendSharePct: 48.87,
  transactionCount: 4500,
  distinctSuppliersCount: 15,
  distinctMaterialsCount: 20,
  distinctPlantsCount: 3,
  topSupplierConcentrationPct: 35,
  herfindahlIndex: 2100,
  priceVariationCoefficient: 0.12,
  contractCoveragePct: 0,
  dataLimitations: 'Contract coverage unavailable for IS 2062 plates.',
  validationStatus: 'TENTATIVE — PENDING VALIDATION',
  requiresSpecialisedManagement: true,
  opportunities: [
    buildCategoryOpportunityBenefit({
      headKey: 'HEAD-A',
      headCode: 'HEAD-A',
      headTitle: 'Strategic Category Management',
      eligibleAnnualSpendInr: 0,
      eligibleAnnualSpendCr: 0,
      isEligibleEstablished: false,
      lowEstimateInr: 0,
      lowEstimateCr: 0,
      baseEstimateInr: 0,
      baseEstimateCr: 0,
      highEstimateInr: 0,
      highEstimateCr: 0,
      lowAssumptionPct: 1,
      baseAssumptionPct: 2,
      highAssumptionPct: 3
    }),
    buildCategoryOpportunityBenefit()
  ],
  ...overrides
});

export const buildSpecialisationCategories = (): CategorySpecialisationProfile[] => [
  buildCategorySpecialisationProfile(),
  buildCategorySpecialisationProfile({
    categoryName: 'Welding Consumables',
    priority: 'PRIORITY_B',
    priorityRationale: 'Moderate spend with two dominant electrode brands.',
    recommendedApproach: 'SHARED_CATEGORY_MANAGER',
    approachRationale: 'Shared manager across plate fabrication lines.',
    annualSpendInr: 160000000,
    annualSpendCr: 16,
    spendSharePct: 4.1,
    transactionCount: 920,
    distinctSuppliersCount: 6,
    distinctMaterialsCount: 9,
    distinctPlantsCount: 2,
    topSupplierConcentrationPct: 62.5,
    herfindahlIndex: 3900,
    priceVariationCoefficient: 0.08,
    contractCoveragePct: 35,
    dataLimitations: 'Price history covers 18 months only.',
    validationStatus: 'DATA PARTIALLY AVAILABLE',
    requiresSpecialisedManagement: false,
    opportunities: [
      buildCategoryOpportunityBenefit({
        categoryName: 'Welding Consumables',
        eligibleAnnualSpendInr: 160000000,
        eligibleAnnualSpendCr: 16,
        lowEstimateInr: 1600000,
        lowEstimateCr: 0.16,
        baseEstimateInr: 3200000,
        baseEstimateCr: 0.32,
        highEstimateInr: 4800000,
        highEstimateCr: 0.48
      }),
      buildCategoryOpportunityBenefit({
        headKey: 'HEAD-G',
        headCode: 'HEAD-G',
        headTitle: 'Alternative Supplier Development',
        categoryName: 'Welding Consumables',
        isEligibleEstablished: false,
        eligibleAnnualSpendInr: 0,
        eligibleAnnualSpendCr: 0,
        lowEstimateInr: 0,
        lowEstimateCr: 0,
        baseEstimateInr: 0,
        baseEstimateCr: 0,
        highEstimateInr: 0,
        highEstimateCr: 0
      })
    ]
  }),
  buildCategorySpecialisationProfile({
    categoryName: 'Industrial Fasteners',
    priority: 'PRIORITY_C',
    priorityRationale: 'Routine catalogue purchases with low spend concentration.',
    recommendedApproach: 'STANDARD_AUTOMATED',
    approachRationale: 'Catalogue buying with automated replenishment.',
    annualSpendInr: 25000000,
    annualSpendCr: 2.5,
    spendSharePct: 0.9,
    transactionCount: 310,
    distinctSuppliersCount: 4,
    distinctMaterialsCount: 12,
    distinctPlantsCount: 3,
    topSupplierConcentrationPct: 48,
    herfindahlIndex: 2600,
    priceVariationCoefficient: 0.05,
    contractCoveragePct: 60,
    dataLimitations: 'No material master gaps detected.',
    validationStatus: 'AWAITING VALIDATION',
    requiresSpecialisedManagement: false,
    opportunities: []
  })
];

export const buildCrossLeverOverlapItem = (
  overrides: Partial<CrossLeverOverlapItem> = {}
): CrossLeverOverlapItem => ({
  headKey: 'HEAD-D',
  headTitle: 'Price Variation Reduction',
  categoryName: 'Structural Steel Plates',
  eligibleSpendInr: 1000000000,
  eligibleSpendCr: 100,
  grossPotentialBenefitInr: 35000000,
  grossPotentialBenefitCr: 3.5,
  relatedLever: 'LEVER_1',
  overlapStatus: 'OVERLAP_REVIEW_REQUIRED',
  deduplicationTreatment: 'Excluded from net indicative opportunity pending commercial review.',
  evidenceAndApprovalStatus: 'TENTATIVE_PENDING',
  netIndicativeBenefitInr: 0,
  netIndicativeBenefitCr: 0,
  amountExcludedInr: 35000000,
  amountExcludedCr: 3.5,
  exclusionReason: 'Potential overlap with Lever 1 price variation',
  ...overrides
});

export const buildCategorySpecialisationSummary = (
  overrides: Partial<CategorySpecialisationSummary> = {}
): CategorySpecialisationSummary => ({
  tenantId: 'AIC-2026-0002',
  totalProcurementSpendInr: 6138805185.51,
  totalProcurementSpendCr: 613.88,
  categoriesAssessedCount: 3,
  priorityACount: 1,
  priorityBCount: 1,
  priorityCCount: 1,
  grossTentativeOpportunityLowInr: 10000000,
  grossTentativeOpportunityLowCr: 1,
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
  unquantifiedOpportunitiesCount: 2,
  categoriesRequiringSpecialisedInterventionCount: 2,
  dedicatedManagerCount: 1,
  sharedManagerCount: 1,
  centralisedManagementCount: 0,
  automatedProcurementCount: 1,
  ...overrides
});

export const buildCategorySpecialisationResult = (
  overrides: Partial<CategorySpecialisationResult> = {}
): CategorySpecialisationResult => ({
  assessmentId: 'AIC-2026-0002',
  customerName: 'Bharat Fabrication Works Pvt Ltd',
  calculatedAt: '2026-10-19T18:00:00.000Z',
  summary: buildCategorySpecialisationSummary(),
  categories: buildSpecialisationCategories(),
  overlapItems: [buildCrossLeverOverlapItem()],
  opportunityHeadAssumptions: buildOpportunityHeadAssumptions(),
  methodologyDisclosures: [
    'Midpoint base assumption rule applied to eligible plate spend.',
    'Cross-lever overlap controls prevent double counting of mill rebates.'
  ],
  generalDisclaimer: 'TENTATIVE — ILLUSTRATIVE PLANNING ESTIMATE — PENDING VALIDATION',
  ...overrides
});
