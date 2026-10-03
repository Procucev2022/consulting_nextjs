/**
 * Module 2 — Action Recommendation Engine
 * Version: MODULE_2_OPPORTUNITY_INTELLIGENCE_V2.0
 */

import type {
  ActionRecommendationOutput,
  MarketDiscoveryAssessment,
  OpportunityEvidenceState,
  SourcingNextAction
} from '../types/module2OpportunityIntelligence';
import type {
  CategorySupplierStructureItem,
  PriceDispersionMetrics,
  SourcingDataConfidence,
  SupplierFragmentationLevel
} from '../types/module2StrategicSourcing';

export interface ActionRecommendationInput {
  categoryName: string;
  totalSpendInr: number;
  activeSuppliersCount: number;
  suppliers: CategorySupplierStructureItem[];
  fragmentationLevel: SupplierFragmentationLevel;
  priceDispersion: PriceDispersionMetrics | null;
  provenOpportunityInr: number | null;
  rangeMinInr: number | null;
  rangeMaxInr: number | null;
  marketDiscovery: MarketDiscoveryAssessment;
  evidenceState: OpportunityEvidenceState;
  confidence: SourcingDataConfidence;
}

export class Module2ActionRecommendationEngine {
  private static determineActions(
    input: ActionRecommendationInput,
    actions: SourcingNextAction[]
  ): void {
    if (input.marketDiscovery.isMarketDiscoveryRequired) {
      actions.push('PERFORM_MARKET_DISCOVERY');
      const vehicle = input.marketDiscovery.recommendedSourcingVehicle;
      actions.push(vehicle === 'RUN_COMPETITIVE_RFQ' ? 'RUN_RFQ' : 'RUN_E_AUCTION');
    }

    if (input.activeSuppliersCount > 3) {
      actions.push('CONSOLIDATE_SUPPLIERS');
      actions.push('CONSOLIDATE_VOLUME');
    }

    if (input.priceDispersion && input.priceDispersion.priceDispersionPct > 15) {
      actions.push('HARMONIZE_SPECIFICATIONS');
    }

    actions.push('NEGOTIATE_COMMERCIAL_TERMS');
    actions.push('REVIEW_CONTRACT');

    if (input.confidence === 'LOW' || input.confidence === 'INSUFFICIENT') {
      actions.push('COLLECT_MISSING_DATA');
    }
  }

  private static buildFindings(input: ActionRecommendationInput): { whatWeFound: string; whyItMatters: string } {
    const spendCr = (input.totalSpendInr / 10000000).toFixed(2);
    const suppCount = input.activeSuppliersCount;
    const topSupplier = input.suppliers[0];
    const topShare = topSupplier ? topSupplier.spendSharePct.toFixed(1) : '0';
    const dispText = input.priceDispersion
      ? `${input.priceDispersion.priceDispersionPct.toFixed(1)}% price dispersion`
      : 'limited internal price variance';

    const whatWeFound =
      `Spend of ₹${spendCr} Cr across ${suppCount} active supplier(s) in ${input.categoryName}. Top supplier controls ${topShare}% share. ` +
      `Category exhibits ${input.fragmentationLevel.toLowerCase().replace(/_/g, ' ')} with ${dispText}.`;

    const whyItMatters = input.marketDiscovery.isMarketDiscoveryRequired
      ? 'Structural supply concentration indicates that current prices reflect incumbent pricing power rather than market competition.'
      : 'Internal price variance across comparable transactions proves that procurement is paying inconsistent unit rates for equivalent specifications.';

    return { whatWeFound, whyItMatters };
  }

  private static buildQuantifiability(input: ActionRecommendationInput): string {
    if (input.provenOpportunityInr && input.provenOpportunityInr > 0) {
      return `Proven historical price opportunity of ₹${(input.provenOpportunityInr / 100000).toFixed(2)} L directly verified from customer unit price differentials.`;
    }
    if (input.rangeMinInr !== null && input.rangeMaxInr !== null) {
      return `Statistically governed opportunity range of ₹${(input.rangeMinInr / 100000).toFixed(2)} L – ₹${(input.rangeMaxInr / 100000).toFixed(2)} L based on empirical transaction quartiles.`;
    }
    return 'None demonstrated by current internal records.';
  }

  private static resolvePriority(input: ActionRecommendationInput): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'MONITORING' {
    if (input.totalSpendInr > 10000000 && input.marketDiscovery.isMarketDiscoveryRequired) return 'CRITICAL';
    if ((input.provenOpportunityInr || 0) > 1000000) return 'HIGH';
    if (input.evidenceState === 'LOW_EVIDENCED_OPPORTUNITY') return 'MONITORING';
    return 'MEDIUM';
  }

  public static generateRecommendation(input: ActionRecommendationInput): ActionRecommendationOutput {
    const actions: SourcingNextAction[] = [];
    this.determineActions(input, actions);

    const { whatWeFound, whyItMatters } = this.buildFindings(input);
    const whatWeCanQuantify = this.buildQuantifiability(input);
    const whatWeCannotYetQuantify =
      'Commercial terms value, specification harmonization gains, and external market discount potential cannot be quantified until competitive market testing is conducted.';

    const whatShouldBeTested = input.marketDiscovery.isMarketDiscoveryRequired
      ? 'Test supplier willingness to offer volume tiered pricing through a structured competitive RFQ and benchmark against specialist market participants.'
      : 'Validate supplier capacity for volume consolidation and test reverse e-auction dynamics under standardized specifications.';

    return {
      whatWeFound,
      whyItMatters,
      whatWeCanQuantify,
      whatWeCannotYetQuantify,
      whatShouldBeTested,
      whatProcurementShouldDoNext: actions,
      priorityLevel: this.resolvePriority(input)
    };
  }
}
