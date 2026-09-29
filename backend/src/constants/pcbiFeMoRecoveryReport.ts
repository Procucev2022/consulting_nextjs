/**
 * PCBI Ferro Molybdenum 65% Research Candidate — Targeted Recovery Tracks & Report
 */

export const FEMO_TARGETED_RECOVERY_TRACKS = [
  {
    trackId: 'TRK-01-MMR',
    trackName: 'Minerals & Metals Review (MMR) Historical Audit',
    sourcesInvestigated: [
      'MMR Weekly issues archive',
      'Scribd indexed trade logs (2020-2025)',
      'Indian Minerals Yearbook references to MMR price tables'
    ],
    findings: 'No continuous weekly or monthly PDF repository exists in the free public domain for April–December 2020 or full calendar year 2022. The 17 discrete weekly observations already captured in the research pack represent the totality of verified free public MMR Indian domestic observations.',
    recoveredObservationsCount: 17,
    recoveredContinuousSeries: false,
    status: 'DISCRETE_OBSERVATIONS_ONLY' as const,
    limitations: [
      'All 17 domestic observations represent FeMo 60% (IS 1469), not FeMo 65%',
      '39 weeks missing in 2020 (April to December 2020)',
      '52 weeks missing in 2022 (entire year missing)'
    ]
  },
  {
    trackId: 'TRK-02-BIGMINT',
    trackName: 'BigMint / SteelMint Historical Price Discovery Audit',
    sourcesInvestigated: [
      'BigMint Ferro Alloy Portal (bigmint.co/ferroalloy)',
      'SteelMint historical event publications and pricing notices',
      'Public pricing methodology guidelines'
    ],
    findings: 'BigMint assesses domestic FeMo exclusively on an ex-works India FeMo 60% basis (sizing 10-150mm). Complete historical daily/weekly databases are paywalled behind commercial enterprise subscriptions. Free search-indexed content confirms the single 2026-07-22 observation (₹4,260/kg).',
    recoveredObservationsCount: 1,
    recoveredContinuousSeries: false,
    status: 'COMMERCIAL_PAYWALL' as const,
    limitations: [
      'Zero commercial subscriptions allowed under zero-cost governance mandate',
      'Assessed specification is FeMo 60%, not the required FeMo 65%'
    ]
  },
  {
    trackId: 'TRK-03-AIFAA-PRODUCERS',
    trackName: 'AIFAA & Indian Ferro-Alloy Smelter Publications',
    sourcesInvestigated: [
      'All India Ferro Alloys Association (AIFAA) circulars',
      'Indian Smelters: Jayesh Group, Moly Metal, Nortech, Kushal Ferro, Vidushi Metals',
      'B2B merchant portals (TradeIndia, IndiaMART)'
    ],
    findings: 'Indian noble ferroalloy producers smelt imported technical MoO3 concentrate via aluminothermic reduction. Merchant sales are quoted on a bespoke RFQ basis per kg of contained/commercial FeMo 60%. Producers do not publish an open historical weekly time series.',
    recoveredObservationsCount: 0,
    recoveredContinuousSeries: false,
    status: 'NO_CONTINUOUS_PUBLIC_DATA' as const,
    limitations: [
      'Spot quotations are bilateral and point-in-time, lacking historical archive transparency'
    ]
  },
  {
    trackId: 'TRK-04-PSU-PROCUREMENT',
    trackName: 'Indian PSU / Government Procurement Evidence',
    sourcesInvestigated: [
      'BHEL Haridwar / Trichy Plant Purchase Specification FF 05009',
      'SAIL Alloy Steels Plant (ASP) Durgapur / Bhilai tenders',
      'MIDHANI specialty defense tenders',
      'Central Public Procurement Portal (CPPP) & GeM'
    ],
    findings: 'PSU tenders confirm IS 1469 FeMo 60-65% is standard for alloy steelmaking. However, contracts are awarded as fixed-price annual rate contracts (often with Price Variation Clauses indexed to Argus) or lump-sum purchase orders (e.g. ₹10-18 Cr). They do not provide a weekly/monthly spot market price series.',
    recoveredObservationsCount: 0,
    recoveredContinuousSeries: false,
    status: 'DISCRETE_OBSERVATIONS_ONLY' as const,
    limitations: [
      'Procurement contracts reflect long-term firm prices rather than public weekly market price indices',
      'Specific awarded unit rates are often confidential commercial terms'
    ]
  },
  {
    trackId: 'TRK-05-INTL-REFERENCES',
    trackName: 'International 65–70% Benchmarks (Argus / Fastmarkets / Rotterdam)',
    sourcesInvestigated: [
      'Argus Metals International public sample reports',
      'Fastmarkets historical market overviews',
      'MMR International price tables'
    ],
    findings: 'International markets actively trade FeMo 65-70% in USD/kg contained Mo (Rotterdam warehouse duty-paid). The research pack contains 2 public sample dates ($16.50/kg Mo in Mar 2020 and $44.30/kg Mo in Nov 2021). Commercial subscriptions are required for continuous history.',
    recoveredObservationsCount: 2,
    recoveredContinuousSeries: false,
    status: 'COMMERCIAL_PAYWALL' as const,
    limitations: [
      'Delivery basis is Western Europe, excluding Indian basic customs duties (BCD/IGST), ocean freight, and domestic clearing'
    ]
  },
  {
    trackId: 'TRK-06-EMPIRICAL-RELATIONSHIP',
    trackName: 'Empirical Relationship Audit: FeMo 60% vs FeMo 65%',
    sourcesInvestigated: [
      'IS 1469:1993 metallurgical specifications',
      'Global ferroalloy trading literature (CME Group, Asian Metal)',
      'Dual-grade producer price schedules'
    ],
    findings: 'No authoritative source or publisher establishes an empirical mathematical conversion factor between FeMo 60% and FeMo 65%. The spread between the two grades fluctuates dynamically with the market price of roasted MoO3 concentrate and the premium demanded for low-impurity chemistry. Naive linear conversion (65/60 = 1.0833) is invalid.',
    recoveredObservationsCount: 0,
    recoveredContinuousSeries: false,
    status: 'NO_CONTINUOUS_PUBLIC_DATA' as const,
    limitations: [
      'Treating FeMo 60% directly as FeMo 65% price or applying a static multiplier manufactures unverified synthetic prices'
    ]
  }
];

export const FEMO_TARGETED_RECOVERY_REPORT = {
  passTimestamp: '2026-09-28T23:00:00.000Z',
  pcbiId: 'PCBI-FEMO-65-001',
  lifecycleState: 'UNDER_REVIEW' as const,
  assignedStatus: 'PARTIAL_HISTORY' as const,
  decisionLogicOutcome: 'DECISION_B_RETAIN_PARTIAL_HISTORY_METHODOLOGY_PENDING' as const,
  syntheticDataPermitted: false as const,
  interpolationPermitted: false as const,
  commercialSubscriptionsCount: 0 as const,
  remainingGapsCount: 4,
  customerSpendProtectedInr: 12500000,
  customerSpendProtectedCr: '₹1.25 Cr'
};
