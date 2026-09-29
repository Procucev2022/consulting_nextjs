/**
 * Module 2 — Opportunity Intelligence Integration Helper
 * Version: MODULE_2_OPPORTUNITY_INTELLIGENCE_V2.0
 */

import type {
  ActionRecommendationOutput,
  CategoryCommercialExcellenceProfile,
  MarketDiscoveryAssessment,
  OpportunityEvidenceState,
  OpportunityWaterfallV2Stage,
  ProcurementMaturityScorecardResult,
  TwoDimensionalOpportunityAssessment
} from '../types/module2OpportunityIntelligence';
import type {
  CategorySupplierStructureItem,
  PriceDispersionMetrics,
  SourcingDataConfidence,
  SupplierFragmentationLevel
} from '../types/module2StrategicSourcing';
import { OPPORTUNITY_EVIDENCE_STATE_LABELS } from '../constants/module2OpportunityIntelligence';
import { Module2MarketDiscoveryEngine } from './module2MarketDiscoveryEngine';
import { Module2CommercialExcellenceEngine } from './module2CommercialExcellenceEngine';
import { Module2ProcurementMaturityEngine } from './module2ProcurementMaturityEngine';
import { Module2OpportunityEvidenceEngine } from './module2OpportunityEvidenceEngine';
import { Module2ActionRecommendationEngine } from './module2ActionRecommendationEngine';
import { Module2WaterfallBuilder } from './module2WaterfallBuilder';

export interface OpportunityIntelligenceIntegrationInput {
  categoryName: string;
  totalSpendInr: number;
  addressableSpendInr: number;
  comparableSpendInr: number;
  addressableQuantity: number;
  suppliers: CategorySupplierStructureItem[];
  fragmentationLevel: SupplierFragmentationLevel;
  priceDispersion: PriceDispersionMetrics | null;
  isRecurring: boolean;
  activeMonthsCount: number;
  comparableTxCount: number;
  totalTxCount: number;
  confidence: SourcingDataConfidence;
  eauctionOppInr: number | null;
  consolidationOppInr: number | null;
  volumeBundlingOppInr: number;
  specialistOppInr: number;
  overlapOppInr: number;
  netOppInr: number | null;
}

export interface OpportunityIntelligenceIntegrationResult {
  evidenceState: OpportunityEvidenceState;
  evidenceStateLabel: string;
  twoDimensionalAssessments: TwoDimensionalOpportunityAssessment[];
  marketDiscovery: MarketDiscoveryAssessment;
  commercialExcellence: CategoryCommercialExcellenceProfile;
  procurementMaturity: ProcurementMaturityScorecardResult;
  actionRecommendation: ActionRecommendationOutput;
  opportunityRangeMinInr: number | null;
  opportunityRangeMaxInr: number | null;
  opportunityRangeMethodology: string;
  waterfallV2: OpportunityWaterfallV2Stage[];
}

export class Module2OpportunityIntelligenceHelper {
  public static buildIntelligence(
    input: OpportunityIntelligenceIntegrationInput
  ): OpportunityIntelligenceIntegrationResult {
    // 1. Market Discovery Assessment
    const marketDiscovery = Module2MarketDiscoveryEngine.evaluateMarketDiscovery({
      suppliers: input.suppliers,
      totalSpendInr: input.totalSpendInr,
      isRecurring: input.isRecurring,
      activeMonthsCount: input.activeMonthsCount,
      priceDispersion: input.priceDispersion,
      confidence: input.confidence
    });

    // 2. Commercial Excellence Analysis
    const commercialExcellence = Module2CommercialExcellenceEngine.analyzeCategory({
      totalSpendInr: input.totalSpendInr,
      supplierCount: input.suppliers.length,
      activeMonthsCount: input.activeMonthsCount,
      isRecurring: input.isRecurring,
      confidence: input.confidence
    });

    // 3. Procurement Maturity Scorecard (10 dimensions)
    const procurementMaturity = Module2ProcurementMaturityEngine.evaluateMaturity({
      totalSpendInr: input.totalSpendInr,
      supplierCount: input.suppliers.length,
      suppliers: input.suppliers,
      fragmentationLevel: input.fragmentationLevel,
      priceDispersion: input.priceDispersion,
      isRecurring: input.isRecurring,
      activeMonthsCount: input.activeMonthsCount,
      comparableTxCount: input.comparableTxCount,
      totalTxCount: input.totalTxCount,
      confidence: input.confidence
    });

    // 4. Evidence State & Range
    const evidenceState = Module2OpportunityEvidenceEngine.resolveEvidenceState({
      provenPriceOppInr: input.eauctionOppInr,
      volumeBundlingOppInr: input.volumeBundlingOppInr,
      eauctionOppInr: input.eauctionOppInr,
      consolidationOppInr: input.consolidationOppInr,
      specialistOppInr: input.specialistOppInr,
      netOppInr: input.netOppInr,
      isMarketDiscoveryRequired: marketDiscovery.isMarketDiscoveryRequired,
      suppliers: input.suppliers,
      dispersion: input.priceDispersion,
      confidence: input.confidence,
      comparableTxCount: input.comparableTxCount
    });

    const range = Module2OpportunityEvidenceEngine.calculateOpportunityRange(
      input.addressableQuantity,
      input.priceDispersion
    );

    // 5. Two-Dimensional Opportunity Model
    const twoDimensionalAssessments = Module2OpportunityEvidenceEngine.buildTwoDimensionalAssessments(
      {
        provenPriceOppInr: input.eauctionOppInr,
        volumeBundlingOppInr: input.volumeBundlingOppInr,
        eauctionOppInr: input.eauctionOppInr,
        consolidationOppInr: input.consolidationOppInr,
        specialistOppInr: input.specialistOppInr,
        netOppInr: input.netOppInr,
        isMarketDiscoveryRequired: marketDiscovery.isMarketDiscoveryRequired,
        suppliers: input.suppliers,
        dispersion: input.priceDispersion,
        confidence: input.confidence,
        comparableTxCount: input.comparableTxCount
      },
      evidenceState
    );

    // 6. Action Recommendation Output
    const actionRecommendation = Module2ActionRecommendationEngine.generateRecommendation({
      categoryName: input.categoryName,
      totalSpendInr: input.totalSpendInr,
      activeSuppliersCount: input.suppliers.length,
      suppliers: input.suppliers,
      fragmentationLevel: input.fragmentationLevel,
      priceDispersion: input.priceDispersion,
      provenOpportunityInr: input.netOppInr,
      rangeMinInr: range.rangeMinInr,
      rangeMaxInr: range.rangeMaxInr,
      marketDiscovery,
      evidenceState,
      confidence: input.confidence
    });

    // 7. Opportunity Waterfall V2
    const waterfallV2 = Module2WaterfallBuilder.buildWaterfallV2({
      totalSpendInr: input.totalSpendInr,
      addressableSpendInr: input.addressableSpendInr,
      comparableSpendInr: input.comparableSpendInr,
      priceOpp: input.eauctionOppInr ?? 0,
      volumeBundlingOpp: input.volumeBundlingOppInr,
      eauctionOpp: input.eauctionOppInr ?? 0,
      consolOpp: input.consolidationOppInr ?? 0,
      specialistOpp: input.specialistOppInr,
      commercialOpp: 0,
      processOpp: 0,
      marketDiscoveryOpp: 0,
      overlapOpp: input.overlapOppInr,
      netOpp: input.netOppInr ?? 0,
      evidenceState,
      confidence: input.confidence
    });

    return {
      evidenceState,
      evidenceStateLabel: OPPORTUNITY_EVIDENCE_STATE_LABELS[evidenceState],
      twoDimensionalAssessments,
      marketDiscovery,
      commercialExcellence,
      procurementMaturity,
      actionRecommendation,
      opportunityRangeMinInr: range.rangeMinInr,
      opportunityRangeMaxInr: range.rangeMaxInr,
      opportunityRangeMethodology: range.rangeMethodology,
      waterfallV2
    };
  }
}
