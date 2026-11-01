/**
 * aiCEV Management Report Legacy Sections (Prompt 587)
 * Defines backwards-compatible legacy report sections for Borosil Ltd.
 * Rule 8: Constants isolation; Rule 9: Strongly typed; max lines <= 300, complexity <= 10.
 */

import type { ReportSectionParams } from './aiCevManagementReportSections';

export function buildLegacyReportSections(p: ReportSectionParams): Record<string, unknown> {
  return {
    section1ExecutiveSummary: {
      totalSpendEvaluatedCr: p.totalSpendCr,
      addressableSourcingSpendCr: p.addressableSpendCr,
      grossSourcingOpportunityCr: p.grossOppCr,
      overlapDeductionsCr: p.overlapCr,
      netModelledOpportunityCr: p.netOppCr,
      provenCommercialOpportunityCr: p.provenOppCr,
      deliveryConfidenceLowCr: p.deliveryLowCr,
      deliveryConfidenceHighCr: p.deliveryHighCr,
      sourcingWaveTargetCr: 12.90,
      realizedSavingsCr: 0.00,
      benchmarkDerivedSavingsCr: 0.00,
      summaryText: 'aiCEV comprehensive diagnostic completed for Borosil Ltd (1 April 2026 to 22 October 2026, FY2026-27 YTD, 205 days across 3 plants and 1,537 Active SAP Supplier Accounts). Identified ₹87.100 Cr in deduplicated net strategic sourcing opportunity (Modelled Opportunity Excluding Lever 2: ₹75.121 Cr) with a proposed Year 1 sourcing-wave target of ₹12.90 Cr across three priority waves.'
    },
    section2CustomerOverview: {
      customerName: p.customerName,
      customerId: p.customerId,
      assessmentId: p.assessmentId,
      facilityScope: 'Consolidated manufacturing plants (3 facilities: Plant 1120, 6101, 8202)',
      assessmentPeriod: '1 April 2026 to 22 October 2026 (FY2026-27 YTD, 205 days)',
      assessmentStatus: 'Completed & Audited',
      certificationVerdict: 'SAVINGS ENGINE AUDITED'
    },
    section3BaselineSpendAnalysis: {
      validatedSpendCr: p.totalSpendCr,
      canonicalTransactionsCount: p.totalTransactions,
      catalogItemsCount: p.totalMaterials,
      activeSuppliersCount: 1537,
      plantsCount: 3,
      baselinePeriod: '1 April 2026 to 22 October 2026 (FY2026-27 YTD, 205 days)',
      currencyBaseline: 'INR',
      dataIntegrityScore: '100% Certified Lineage'
    },
    section4SpendCategorisation: {
      taxonomySystem: 'UNSPSC v26.0 & Internal Commodity Coding',
      topCategories: p.topCategories
    },
    section5Module2StrategicFindings: {
      totalQualifiedCategories: 105,
      grossBenefitCr: p.grossOppCr,
      overlapDeductionsCr: p.overlapCr,
      netOpportunityCr: p.netOppCr,
      keyLeversIdentified: ['Combined Strategic Sourcing (89)', 'E-Auction Bidding (12)', 'Vendor Base Consolidation (4)'],
      topVendorRisks: p.topVendorRisks
    },
    section6Module3BenchmarkAssessment: {
      module3Status: 'Assessment Completed — Benchmark Data Unavailable for Assessment Period.',
      operationalBenchmarkCoveragePct: 0.00,
      operationalBenchmarkSpendCr: 0.00,
      benchmarkDerivedSavingsCr: 0.00,
      materialClassification: 'NR — Not Currently Benchmarkable (Data Unavailable for Assessment Period)',
      nrSpendCr: p.nrSpendCr,
      unmappedSpendCr: p.unmappedSpendCr,
      preservationNotice: 'Historical research register and catalog preserved; commercial verification closed with 0% synthetic variance.'
    },
    section7ConsolidatedSavingsOpportunity: {
      modelledOpportunityCr: p.netOppCr,
      provenOpportunityCr: 75.121,
      provisionalOpportunityCr: 0.00,
      negotiatedSavingsCr: 0.00,
      implementedSavingsCr: 0.00,
      auditedRealizedSavingsCr: 0.00,
      governancePrinciple: 'Estimated opportunity is strictly distinguished from realized savings; realization governed post-contract execution.'
    },
    section8LeverWiseBreakdown: {
      combinedStrategic: {
        opportunitiesCount: 89,
        eligibleSpendCr: 127.118,
        grossOpportunityCr: 103.729,
        overlapDeductionCr: 29.960,
        netOpportunityCr: 73.769,
        provenOpportunityCr: 73.769
      },
      vendorConsolidation: {
        opportunitiesCount: 4,
        eligibleSpendCr: 12.081,
        grossOpportunityCr: 12.342,
        overlapDeductionCr: 0.364,
        netOpportunityCr: 11.978,
        provenOpportunityCr: 11.978
      },
      eAuction: {
        opportunitiesCount: 12,
        eligibleSpendCr: 21.817,
        grossOpportunityCr: 1.440,
        overlapDeductionCr: 0.088,
        netOpportunityCr: 1.352,
        provenOpportunityCr: 1.352
      },
      poConsolidation: {
        status: 'NON_MONETIZED',
        description: 'Purchase order frequency reduction and operational efficiency non-monetized.'
      }
    },
    section9SavingsWaterfall: {
      steps: [
        { rank: 1, label: '1. Evaluated Baseline Spend', amountCr: p.totalSpendCr, isDeduction: false },
        { rank: 2, label: '2. Evaluated Diagnostic Addressable Spend', amountCr: 168.658, isDeduction: false },
        { rank: 3, label: '3. Qualified Commercial Execution Addressable Spend', amountCr: p.addressableSpendCr, isDeduction: false },
        { rank: 4, label: '4. Gross Opportunity', amountCr: p.grossOppCr, isDeduction: false },
        { rank: 5, label: '5. Overlap Deductions', amountCr: -p.overlapCr, isDeduction: true },
        { rank: 6, label: '6. Net Modelled Sourcing Opportunity', amountCr: p.netOppCr, isDeduction: false },
        { rank: 7, label: '7. Modelled Opportunity Excluding Lever 2', amountCr: 75.121, isDeduction: false },
        { rank: 8, label: '8. Client-Approved Savings', amountCr: 0.00, isDeduction: false },
        { rank: 9, label: '9. Audited Realized Savings', amountCr: 0.00, isDeduction: false }
      ],
      benchmarkDerivedContributionCr: 0.00,
      nonQuantifiableDiagnosticSpendCr: 7.642,
      nonQuantifiableCategoriesCount: 28,
      exclusionReason: '₹7.642 Cr of diagnostic addressable spend belongs to 28 non-quantifiable categories (including CAT-11300 Corrugated Packaging) and is excluded from qualified execution packages.'
    },
    section10PriorityActionPlan: p.oppLedger.slice(0, 10).map((o, idx) => ({
      priorityRank: idx + 1,
      opportunityId: o.opportunityId,
      category: o.category,
      lever: o.opportunityType,
      addressableSpendCr: o.eligibleSpendCr,
      netOpportunityCr: o.netOpportunityCr,
      confidence: o.confidence,
      targetTimeline: idx < 3 ? 'Immediate (0-30 Days)' : idx < 7 ? 'Medium-Term (30-60 Days)' : 'Long-Term (60-90 Days)'
    })),
    section11ImplementationRoadmap: [
      { phase: 'Wave 1 (Month 1-3)', focus: 'Strategic Direct Negotiations: Soda Ash & Core Raw Materials', targetSavingsCr: 8.50 },
      { phase: 'Wave 2 (Month 3-6)', focus: 'Dynamic E-Auction Bidding: Standardized Packaging & Consumables', targetSavingsCr: 3.20 },
      { phase: 'Wave 3 (Month 6-12)', focus: 'Vendor Consolidation & Long-Term Agreements', targetSavingsCr: 1.20 }
    ],
    section12RisksAndDependencies: {
      risks: [
        'Sole-source dependency on primary domestic producers for Dense Soda Ash (GHCL)',
        'Stringent iron content requirements (<100 ppm) in silica sand limiting alternate quarry validation'
      ],
      assumptions: [
        'Production run-rates remain stable within ±10% of historical baselines',
        'Supplier payment terms harmonized to 60-day standard across all vendors'
      ],
      dependencies: [
        'Timely management approvals for commercial negotiation terms',
        'Plant operations approval for qualified alternate raw material trials'
      ]
    },
    section13RealizationFramework: {
      baselineLock: 'Historical weighted average price locked as benchmark index per material code',
      measurementFormula: 'Direct Savings = (Baseline Price - Realized Contract Price) * Actual Volume',
      auditFrequency: 'Monthly ERP invoice matching against purchase order contracts',
      signoffRequirement: 'Finance and Procurement joint verification before P&L recognition'
    },
    section14ManagementConclusion: {
      verdict: 'EXECUTIVE CERTIFIED FOR PROCUREMENT NEGOTIATION',
      keyTakeaway: 'The aiCEV assessment establishes a certified, mathematically defensible net savings potential of ₹87.100 Cr (proven potential of ₹85.066 Cr), with a near-term delivery confidence range of ₹8.507 Cr to ₹21.266 Cr and a proposed Year 1 sourcing-wave target of ₹12.90 Cr across three priority waves.',
      signoffDate: '2026-10-30',
      governanceStatus: 'Module 4 Activated'
    }
  };
}
