import type {
  CategoryOpportunityBenefit
} from '../types/module2CategorySpecialisation';
import {
  LEVER6_OPPORTUNITY_HEAD_ASSUMPTIONS,
  LEVER6_PRIORITIES,
  LEVER6_VALIDATION_STATUSES,
  LEVER6_EVIDENCE_DISCLOSURES
} from '../constants/module2CategorySpecialisation';
import {
  calculateBenefitForHead,
  type CategoryMetrics
} from './module2CategorySpecialisationCalculators';

export class Module2CategorySpecialisationOpportunityHelper {
  private static evaluateCommercialHeads(
    metrics: CategoryMetrics
  ): CategoryOpportunityBenefit[] {
    const benefits: CategoryOpportunityBenefit[] = [];

    // Head B: Supplier Base Rationalisation
    const hasFragSuppliers = metrics.distinctSuppliersCount > 3;
    const rationalisableSpend = hasFragSuppliers
      ? Math.max(0, metrics.totalSpendInr - metrics.topSupplierSpendInr)
      : 0;
    benefits.push(calculateBenefitForHead(
      LEVER6_OPPORTUNITY_HEAD_ASSUMPTIONS['HEAD-B'],
      metrics.categoryName,
      rationalisableSpend,
      hasFragSuppliers,
      hasFragSuppliers
        ? `Applied to addressable tail spend across ${metrics.distinctSuppliersCount - 1} secondary suppliers.`
        : 'Excluded: Supplier count does not exhibit fragmentation requiring rationalisation.',
      hasFragSuppliers ? LEVER6_VALIDATION_STATUSES.TENTATIVE_PENDING : LEVER6_VALIDATION_STATUSES.DATA_UNAVAILABLE,
      'Requires supplier qualification audit and transition feasibility study.',
      'Consolidation of secondary tail suppliers into primary contracted vendors',
      'Applied to addressable tail spend across secondary suppliers when supplier count > 3'
    ));

    // Head C: Purchasing Consolidation
    const canConsolidate = metrics.distinctPlantsCount >= 2 || metrics.transactionCount >= 20;
    const consolidatableSpend = canConsolidate ? metrics.totalSpendInr * 0.75 : 0;
    benefits.push(calculateBenefitForHead(
      LEVER6_OPPORTUNITY_HEAD_ASSUMPTIONS['HEAD-C'],
      metrics.categoryName,
      consolidatableSpend,
      canConsolidate,
      canConsolidate
        ? `Applied to multi-plant common requirement spend across ${metrics.distinctPlantsCount} plants.`
        : 'Excluded: Spend is localized to single plant with low transaction fragmentation.',
      canConsolidate ? LEVER6_VALIDATION_STATUSES.TENTATIVE_PENDING : LEVER6_VALIDATION_STATUSES.DATA_UNAVAILABLE,
      'Requires inter-plant specification harmonization and master service agreement review.',
      'Harmonisation of purchase orders, common shipment schedules, and inter-plant requirement pooling',
      'Applied to multi-plant common requirement spend when plants >= 2 or transactions >= 20'
    ));

    // Head D: Price Variation Reduction
    const hasPriceVar = metrics.priceVariationCoefficient > 0;
    const priceVarSpend = hasPriceVar ? metrics.totalSpendInr * 0.5 : 0;
    benefits.push(calculateBenefitForHead(
      LEVER6_OPPORTUNITY_HEAD_ASSUMPTIONS['HEAD-D'],
      metrics.categoryName,
      priceVarSpend,
      hasPriceVar,
      hasPriceVar
        ? `Applied to items exhibiting price dispersion (dispersion index: ${metrics.priceVariationCoefficient}).`
        : 'Excluded: Defensible price variation across identical items not established.',
      hasPriceVar ? LEVER6_VALIDATION_STATUSES.TENTATIVE_PENDING : LEVER6_VALIDATION_STATUSES.DATA_UNAVAILABLE,
      'Requires unit price normalization across PO lines and freight adjustment verification.',
      'Compression of purchase order line-item unit price dispersion to lowest demonstrated transaction price',
      'Applied to spend exhibiting verified unit price variation (CV > 0)'
    ));

    // Head E: Contract Coverage Improvement
    benefits.push(calculateBenefitForHead(
      LEVER6_OPPORTUNITY_HEAD_ASSUMPTIONS['HEAD-E'],
      metrics.categoryName,
      0,
      false,
      'Eligible Spend Not Yet Established — Further Data or Validation Required.',
      LEVER6_VALIDATION_STATUSES.DATA_UNAVAILABLE,
      LEVER6_EVIDENCE_DISCLOSURES.CONTRACT_DATA_GAP,
      'Transitioning off-contract / spot PO purchases to master rate contracts with negotiated price ceilings',
      'Eligible Spend Not Yet Established — Further Data or Validation Required'
    ));

    return benefits;
  }

  private static evaluateBiddingHead(
    metrics: CategoryMetrics,
    isStrategic: boolean,
    priority: string,
    distinctScopeOverride?: { hasDistinctScope: boolean; evidence: string }
  ): CategoryOpportunityBenefit {
    const canBid = (isStrategic || priority === LEVER6_PRIORITIES.PRIORITY_B) &&
      metrics.distinctSuppliersCount >= 2;
    const biddableSpend = canBid ? metrics.totalSpendInr * 0.6 : 0;
    const hasDistinctScope = distinctScopeOverride?.hasDistinctScope ?? false;
    const distinctScopeEvidence = distinctScopeOverride?.evidence;

    return calculateBenefitForHead(
      LEVER6_OPPORTUNITY_HEAD_ASSUMPTIONS['HEAD-F'],
      metrics.categoryName,
      biddableSpend,
      canBid,
      canBid
        ? `Applied to contestable category spend with ${metrics.distinctSuppliersCount} qualified vendors.`
        : 'Excluded: Market dynamics or sole-source dependency limits contestability.',
      canBid ? LEVER6_VALIDATION_STATUSES.TENTATIVE_PENDING : LEVER6_VALIDATION_STATUSES.DATA_UNAVAILABLE,
      'Requires competitive RFP/e-Auction market testing and bidder interest confirmation.',
      'Structured e-RFI/e-RFP go-to-market competitive bidding events across qualified vendors',
      'Applied to contestable spend with >= 2 qualified vendors in Priority A or B categories',
      hasDistinctScope,
      distinctScopeEvidence
    );
  }

  private static evaluateAlternativeSupplierHead(
    metrics: CategoryMetrics,
    altSupplierOverride?: { hasVerifiedAlternativeSupplier: boolean; evidence: string }
  ): CategoryOpportunityBenefit {
    const isConcentrated = metrics.topSupplierSharePct >= 50 || metrics.herfindahlIndex >= 2500;
    const hasVerifiedAlt = Boolean(altSupplierOverride?.hasVerifiedAlternativeSupplier);
    const altEvidence = altSupplierOverride?.evidence;

    const concentrationMetrics = {
      topSupplierSharePct: metrics.topSupplierSharePct,
      herfindahlIndex: metrics.herfindahlIndex,
      distinctSuppliersCount: metrics.distinctSuppliersCount
    };

    if (hasVerifiedAlt) {
      const altSpend = metrics.topSupplierSpendInr * 0.4;
      return calculateBenefitForHead(
        LEVER6_OPPORTUNITY_HEAD_ASSUMPTIONS['HEAD-G'],
        metrics.categoryName,
        altSpend,
        true,
        `Verified dual-sourcing strategy: ${altEvidence}`,
        LEVER6_VALIDATION_STATUSES.TENTATIVE_PENDING,
        'Requires pilot order qualification and supplier contract execution.',
        'Secondary vendor qualification and technical trial to eliminate single/monopoly source pricing premium',
        'Applied to 40% contestable share of concentrated spend with validated alternative supplier',
        false,
        undefined,
        true,
        altEvidence,
        concentrationMetrics
      );
    }

    const rationale = isConcentrated
      ? 'Opportunity Identified — Monetary Benefit Not Yet Quantifiable.'
      : 'Excluded: Supplier concentration is balanced; dual-sourcing development not required.';

    const status = isConcentrated
      ? LEVER6_VALIDATION_STATUSES.IDENTIFIED_NOT_QUANTIFIED
      : LEVER6_VALIDATION_STATUSES.DATA_UNAVAILABLE;

    const eligibilityRule = isConcentrated
      ? 'Supplier concentration indicates sourcing/resilience risk; monetary benefit requires verified alternative supplier qualification'
      : 'Supplier concentration is balanced across existing vendor base';

    return calculateBenefitForHead(
      LEVER6_OPPORTUNITY_HEAD_ASSUMPTIONS['HEAD-G'],
      metrics.categoryName,
      0,
      false,
      rationale,
      status,
      'Requires identified alternative vendor, technical trial, QA plant validation, and comparative commercial pricing quotes.',
      'Secondary vendor qualification and technical trial to eliminate single/monopoly source pricing premium',
      eligibilityRule,
      false,
      undefined,
      false,
      undefined,
      concentrationMetrics
    );
  }

  private static evaluateSpecificationHead(
    metrics: CategoryMetrics,
    isStrategic: boolean
  ): CategoryOpportunityBenefit {
    const isComplexSpec = metrics.distinctMaterialsCount >= 5 && isStrategic;
    const specSpend = isComplexSpec ? metrics.totalSpendInr * 0.35 : 0;
    return calculateBenefitForHead(
      LEVER6_OPPORTUNITY_HEAD_ASSUMPTIONS['HEAD-H'],
      metrics.categoryName,
      specSpend,
      isComplexSpec,
      isComplexSpec
        ? `Applied to ${metrics.distinctMaterialsCount} diverse material specifications in strategic category.`
        : 'Excluded: Standardized commodity specifications without value-engineering opportunity.',
      isComplexSpec ? LEVER6_VALIDATION_STATUSES.TENTATIVE_PENDING : LEVER6_VALIDATION_STATUSES.DATA_UNAVAILABLE,
      'Requires engineering review, tolerance relaxation analysis, and QA validation.',
      'Value engineering, tolerance relaxation, and SKU rationalisation across complex specifications',
      'Applied to strategic categories with >= 5 distinct material specifications'
    );
  }

  private static evaluateStrategicHeads(
    metrics: CategoryMetrics,
    priority: string,
    distinctScopeOverride?: { hasDistinctScope: boolean; evidence: string },
    altSupplierOverride?: { hasVerifiedAlternativeSupplier: boolean; evidence: string }
  ): CategoryOpportunityBenefit[] {
    const isStrategic = priority === LEVER6_PRIORITIES.PRIORITY_A;
    return [
      this.evaluateBiddingHead(metrics, isStrategic, priority, distinctScopeOverride),
      this.evaluateAlternativeSupplierHead(metrics, altSupplierOverride),
      this.evaluateSpecificationHead(metrics, isStrategic)
    ];
  }

  private static evaluateGovernanceHeads(
    metrics: CategoryMetrics,
    _priority: string
  ): CategoryOpportunityBenefit[] {
    // Head A: Strategic Category Management - Governance intervention; monetary benefit not yet quantifiable
    const headA = calculateBenefitForHead(
      LEVER6_OPPORTUNITY_HEAD_ASSUMPTIONS['HEAD-A'],
      metrics.categoryName,
      0,
      false,
      'Opportunity Identified — Monetary Benefit Not Yet Quantifiable.',
      LEVER6_VALIDATION_STATUSES.IDENTIFIED_NOT_QUANTIFIED,
      LEVER6_EVIDENCE_DISCLOSURES.GOVERNANCE_NOT_QUANTIFIED,
      'Governance & Category Strategy Charter (Commercial savings mechanism pending specific value levers sign-off)',
      'Strategic category management governance priority established; monetary savings require specific commercial mechanism.'
    );

    // Head I: Category Expertise Deployment - Capability intervention; monetary benefit not yet quantifiable
    const headI = calculateBenefitForHead(
      LEVER6_OPPORTUNITY_HEAD_ASSUMPTIONS['HEAD-I'],
      metrics.categoryName,
      0,
      false,
      'Opportunity Identified — Monetary Benefit Not Yet Quantifiable.',
      LEVER6_VALIDATION_STATUSES.IDENTIFIED_NOT_QUANTIFIED,
      LEVER6_EVIDENCE_DISCLOSURES.EXPERTISE_NOT_QUANTIFIED,
      'Technical Domain Category Specialist Deployment (Capability recommendation; specific commercial savings mechanism required)',
      'Multi-plant strategic category warrants specialist domain expertise; monetary savings require specific commercial mechanism.'
    );

    // Head J: Process & Transaction Efficiency
    const headJ = calculateBenefitForHead(
      LEVER6_OPPORTUNITY_HEAD_ASSUMPTIONS['HEAD-J'],
      metrics.categoryName,
      0,
      false,
      'Eligible Spend Not Yet Established — Further Data or Validation Required.',
      LEVER6_VALIDATION_STATUSES.DATA_UNAVAILABLE,
      LEVER6_EVIDENCE_DISCLOSURES.OPERATING_COST_GAP,
      'Procurement departmental operating cost automation and workflow streamlining',
      'Eligible Spend Not Yet Established — Further Data or Validation Required'
    );

    return [headA, headI, headJ];
  }

  public static evaluateOpportunitiesForCategory(
    metrics: CategoryMetrics,
    priority: string,
    distinctScopeOverride?: { hasDistinctScope: boolean; evidence: string },
    altSupplierOverride?: { hasVerifiedAlternativeSupplier: boolean; evidence: string }
  ): CategoryOpportunityBenefit[] {
    const governance = this.evaluateGovernanceHeads(metrics, priority);
    const commercial = this.evaluateCommercialHeads(metrics);
    const strategic = this.evaluateStrategicHeads(metrics, priority, distinctScopeOverride, altSupplierOverride);

    return [
      governance[0], // Head A
      commercial[0], // Head B
      commercial[1], // Head C
      commercial[2], // Head D
      commercial[3], // Head E
      strategic[0],  // Head F
      strategic[1],  // Head G
      strategic[2],  // Head H
      governance[1], // Head I
      governance[2]  // Head J
    ];
  }
}
