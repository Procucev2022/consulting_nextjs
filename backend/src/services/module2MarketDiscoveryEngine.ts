/**
 * Module 2 — Market Discovery Engine
 * Version: MODULE_2_OPPORTUNITY_INTELLIGENCE_V2.0
 */

import type {
  MarketDiscoveryAssessment,
  MarketDiscoveryTrigger
} from '../types/module2OpportunityIntelligence';
import type {
  CategorySupplierStructureItem,
  PriceDispersionMetrics,
  SourcingDataConfidence
} from '../types/module2StrategicSourcing';
import {
  MARKET_DISCOVERY_THRESHOLDS,
  PROCUREMENT_SAFEGUARD_MESSAGES
} from '../constants/module2OpportunityIntelligence';

export interface MarketDiscoveryInput {
  suppliers: CategorySupplierStructureItem[];
  totalSpendInr: number;
  isRecurring: boolean;
  activeMonthsCount: number;
  priceDispersion: PriceDispersionMetrics | null;
  confidence: SourcingDataConfidence;
}

export class Module2MarketDiscoveryEngine {
  private static evaluateSingleOrLowCompetition(
    suppliers: CategorySupplierStructureItem[],
    triggers: MarketDiscoveryTrigger[]
  ): void {
    const supplierCount = suppliers.length;
    if (supplierCount <= MARKET_DISCOVERY_THRESHOLDS.SINGLE_SUPPLIER_COUNT) {
      triggers.push({
        triggerKey: 'SINGLE_SUPPLIER_LOCK_IN',
        triggerLabel: 'Single Supplier Monopoly / Lock-In',
        observedCondition: '1 supplier controls 100% of category volume and historical spend.',
        structuralImpact: 'Zero internal competitive price tension exists. Historical price reflects incumbent pricing power.',
        severity: 'HIGH'
      });
    } else if (supplierCount <= MARKET_DISCOVERY_THRESHOLDS.LOW_COMPETITION_MAX_SUPPLIERS) {
      triggers.push({
        triggerKey: 'DUOPOLY_LIMITED_COMPETITION',
        triggerLabel: 'Duopoly / Highly Concentrated Supply',
        observedCondition: `Only ${supplierCount} suppliers active. Insufficient competitive tension for market benchmarking.`,
        structuralImpact: 'Limited alternative supply options; pricing may be co-dependent or uncompetitive.',
        severity: 'MEDIUM'
      });
    }
  }

  private static evaluateDependencyAndMateriality(
    input: MarketDiscoveryInput,
    triggers: MarketDiscoveryTrigger[]
  ): void {
    const topSupplier = input.suppliers[0];
    if (topSupplier && topSupplier.spendSharePct >= MARKET_DISCOVERY_THRESHOLDS.HIGH_DEPENDENCY_SHARE_PCT) {
      triggers.push({
        triggerKey: 'HIGH_SUPPLIER_DEPENDENCY',
        triggerLabel: 'High Incumbent Dependency',
        observedCondition: `Top supplier (${topSupplier.supplierName}) accounts for ${topSupplier.spendSharePct.toFixed(1)}% of total category spend.`,
        structuralImpact: 'Procurement leverage is constrained by excessive reliance on a single dominant incumbent.',
        severity: 'HIGH'
      });
    }

    if (input.totalSpendInr >= MARKET_DISCOVERY_THRESHOLDS.MATERIAL_CATEGORY_SPEND_INR && input.isRecurring) {
      triggers.push({
        triggerKey: 'HIGH_RECURRING_MATERIALITY',
        triggerLabel: 'High Materiality Recurring Spend',
        observedCondition: `Category represents significant recurring annual volume (₹${(input.totalSpendInr / 100000).toFixed(1)} L across ${input.activeMonthsCount} active months).`,
        structuralImpact: 'Contract scale justifies dedicated external market testing and competitive RFQ discovery.',
        severity: 'MEDIUM'
      });
    }
  }

  private static evaluatePriceTransparency(
    dispersion: PriceDispersionMetrics | null,
    triggers: MarketDiscoveryTrigger[]
  ): void {
    if (!dispersion || dispersion.priceDispersionPct < 5) {
      triggers.push({
        triggerKey: 'LACK_OF_INTERNAL_PRICE_TRANSPARENCY',
        triggerLabel: 'Absence of Internal Price Dispersion',
        observedCondition: 'Near-zero internal price variance observed in historical transactions.',
        structuralImpact: 'Historical records cannot establish market-clearing rate; external price discovery is mandatory.',
        severity: 'MEDIUM'
      });
    }
  }

  public static evaluateMarketDiscovery(input: MarketDiscoveryInput): MarketDiscoveryAssessment {
    const triggers: MarketDiscoveryTrigger[] = [];

    this.evaluateSingleOrLowCompetition(input.suppliers, triggers);
    this.evaluateDependencyAndMateriality(input, triggers);
    this.evaluatePriceTransparency(input.priceDispersion, triggers);

    const highSeverityCount = triggers.filter(t => t.severity === 'HIGH').length;
    const isRequired = triggers.length > 0 && (highSeverityCount > 0 || triggers.length >= 2);

    let discoveryStatus: 'MARKET_DISCOVERY_REQUIRED' | 'MARKET_VALIDATION_RECOMMENDED' | 'SUFFICIENT_INTERNAL_EVIDENCE';
    let discoveryStatusLabel: string;
    let recommendedSourcingVehicle: 'RUN_COMPETITIVE_RFQ' | 'RUN_E_AUCTION' | 'RUN_MARKET_BENCHMARK' | 'SOURCING_STUDY';

    if (highSeverityCount > 0) {
      discoveryStatus = 'MARKET_DISCOVERY_REQUIRED';
      discoveryStatusLabel = 'Market Discovery Required';
      recommendedSourcingVehicle = 'RUN_COMPETITIVE_RFQ';
    } else if (triggers.length > 0) {
      discoveryStatus = 'MARKET_VALIDATION_RECOMMENDED';
      discoveryStatusLabel = 'Market Validation Recommended';
      recommendedSourcingVehicle = 'RUN_MARKET_BENCHMARK';
    } else {
      discoveryStatus = 'SUFFICIENT_INTERNAL_EVIDENCE';
      discoveryStatusLabel = 'Sufficient Internal Sourcing Evidence';
      recommendedSourcingVehicle = 'RUN_E_AUCTION';
    }

    const diagnosticRationale = isRequired
      ? PROCUREMENT_SAFEGUARD_MESSAGES.MARKET_DISCOVERY_REQUIRED
      : 'Internal historical transaction density provides sufficient competitive comparators for baseline analysis.';

    const marketTestingRecommendation = isRequired
      ? `Execute a structured market discovery RFQ with qualified alternative suppliers to establish true market-clearing prices for ${input.suppliers.length} incumbent supplier(s).`
      : 'Maintain active monitoring of supplier performance and conduct periodic market rate validation.';

    return {
      isMarketDiscoveryRequired: isRequired,
      discoveryStatus,
      discoveryStatusLabel,
      triggers,
      diagnosticRationale,
      marketTestingRecommendation,
      recommendedSourcingVehicle,
      confidence: input.confidence
    };
  }
}
