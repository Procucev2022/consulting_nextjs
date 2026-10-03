/**
 * Module 2 — Procurement Maturity Scorecard Engine
 * Version: MODULE_2_OPPORTUNITY_INTELLIGENCE_V2.0
 */

import type {
  ProcurementMaturityDimensionAssessment,
  ProcurementMaturityDimensionKey,
  ProcurementMaturityLevel,
  ProcurementMaturityScorecardResult
} from '../types/module2OpportunityIntelligence';
import type {
  CategorySupplierStructureItem,
  PriceDispersionMetrics,
  SourcingDataConfidence,
  SupplierFragmentationLevel
} from '../types/module2StrategicSourcing';
import { PROCUREMENT_MATURITY_DIMENSION_LABELS } from '../constants/module2OpportunityIntelligence';

export interface MaturityEvaluationInput {
  totalSpendInr: number;
  supplierCount: number;
  suppliers: CategorySupplierStructureItem[];
  fragmentationLevel: SupplierFragmentationLevel;
  priceDispersion: PriceDispersionMetrics | null;
  isRecurring: boolean;
  activeMonthsCount: number;
  comparableTxCount: number;
  totalTxCount: number;
  confidence: SourcingDataConfidence;
}

export class Module2ProcurementMaturityEngine {
  private static resolveLevel(score: number): ProcurementMaturityLevel {
    if (score >= 9) return 'OPTIMIZED';
    if (score >= 7) return 'MANAGED';
    if (score >= 5) return 'DEVELOPING';
    if (score >= 3) return 'BASIC';
    return 'FRAGMENTED';
  }

  private static buildDimension(
    key: ProcurementMaturityDimensionKey,
    score: number,
    observedCondition: string,
    evidence: string,
    potentialImplication: string,
    recommendedAction: string,
    quantifiability: 'QUANTIFIABLE' | 'NOT_QUANTIFIABLE' | 'MARKET_DISCOVERY' = 'NOT_QUANTIFIABLE'
  ): ProcurementMaturityDimensionAssessment {
    return {
      dimensionKey: key,
      dimensionLabel: PROCUREMENT_MATURITY_DIMENSION_LABELS[key],
      score: Math.max(0, Math.min(10, Math.round(score))),
      maturityLevel: this.resolveLevel(score),
      observedCondition,
      evidence,
      potentialImplication,
      recommendedAction,
      quantifiability
    };
  }

  private static appendPricingAndVolume(
    input: MaturityEvaluationInput,
    dims: ProcurementMaturityDimensionAssessment[]
  ): void {
    const dispPct = input.priceDispersion?.priceDispersionPct ?? 0;
    const priceScore = dispPct > 25 ? 3 : dispPct > 15 ? 5 : dispPct > 8 ? 7 : 9;
    dims.push(
      this.buildDimension(
        'PRICE_MANAGEMENT',
        priceScore,
        dispPct > 15
          ? `High price dispersion of ${dispPct.toFixed(1)}% observed across identical material specifications.`
          : 'Controlled unit price variation with consistent baseline pricing.',
        `Historical variance between min price (₹${input.priceDispersion?.minPrice ?? 0}) and max price (₹${input.priceDispersion?.maxPrice ?? 0}).`,
        'Paying premium rates to non-competitive suppliers for identical specifications.',
        'Establish firm should-cost benchmark ceilings and enforce price discipline on repeat orders.',
        'QUANTIFIABLE'
      )
    );

    const volScore = input.supplierCount > 5 ? 4 : input.isRecurring ? 7 : 6;
    dims.push(
      this.buildDimension(
        'VOLUME_MANAGEMENT',
        volScore,
        input.supplierCount > 5
          ? 'Spend is split across multiple small suppliers rather than bundled for scale leverage.'
          : 'Volume consolidated across core suppliers with stable ordering tranches.',
        `${input.supplierCount} suppliers active for total category spend of ₹${(input.totalSpendInr / 100000).toFixed(1)} L.`,
        'Diluted purchasing power and forfeiture of tiered volume rebates.',
        'Consolidate order demand into pooled annual allocations to maximize volume tier pricing.',
        'QUANTIFIABLE'
      )
    );
  }

  private static appendSupplierAndCategory(
    input: MaturityEvaluationInput,
    dims: ProcurementMaturityDimensionAssessment[]
  ): void {
    const suppScore = input.fragmentationLevel === 'HIGH_FRAGMENTATION' ? 4 : input.supplierCount === 1 ? 3 : 7;
    dims.push(
      this.buildDimension(
        'SUPPLIER_MANAGEMENT',
        suppScore,
        input.supplierCount === 1
          ? 'Single supplier lock-in with zero redundancy.'
          : input.fragmentationLevel === 'HIGH_FRAGMENTATION'
          ? 'Tail supplier proliferation with unmanaged vendor sprawl.'
          : 'Balanced supplier allocation across vetted core partners.',
        `Category supplier fragmentation classified as ${input.fragmentationLevel}.`,
        'High administrative friction, inconsistent quality compliance, and elevated supply chain vulnerability.',
        'Implement formal supplier tiering (Core, Growth, Exit) with active performance scorecards.',
        'NOT_QUANTIFIABLE'
      )
    );

    const catScore = input.isRecurring && input.activeMonthsCount >= 6 ? 7 : 5;
    dims.push(
      this.buildDimension(
        'CATEGORY_STRATEGY',
        catScore,
        'Tactical requisition fulfillment dominating over proactive category management.',
        `Active purchasing across ${input.activeMonthsCount} months with recurring material requisitions.`,
        'Missed opportunities for strategic supplier partnerships and long-term clean-sheet collaboration.',
        'Formulate a 3-year category sourcing roadmap with clear milestone gates.',
        'NOT_QUANTIFIABLE'
      )
    );
  }

  private static appendSpecAndCompetitive(
    input: MaturityEvaluationInput,
    dims: ProcurementMaturityDimensionAssessment[]
  ): void {
    const specScore = input.comparableTxCount / Math.max(1, input.totalTxCount) > 0.8 ? 8 : 4;
    dims.push(
      this.buildDimension(
        'SPECIFICATION_MANAGEMENT',
        specScore,
        specScore < 6
          ? 'Fragmented material descriptions and custom tolerances restricting interchangeability.'
          : 'High specification standardization across historical transactions.',
        `${input.comparableTxCount} of ${input.totalTxCount} transactions share standardized specifications.`,
        'Custom specifications create vendor lock-in and prevent reverse e-auction competition.',
        'Conduct cross-functional value engineering to harmonize custom specs to industry standards.',
        'NOT_QUANTIFIABLE'
      )
    );

    const compScore = input.supplierCount >= 3 ? 7 : 3;
    dims.push(
      this.buildDimension(
        'COMPETITIVE_SOURCING',
        compScore,
        input.supplierCount < 3
          ? 'Minimal competitive tension; lack of periodic market testing.'
          : 'Multi-vendor pool available for competitive sourcing.',
        `${input.supplierCount} active suppliers in historical transactions.`,
        'Incumbent complacency and gradual price creep over time.',
        'Schedule formal market discovery RFQs or multi-stage reverse e-auctions every 18-24 months.',
        'MARKET_DISCOVERY'
      )
    );
  }

  private static appendContractAndCommercial(
    input: MaturityEvaluationInput,
    dims: ProcurementMaturityDimensionAssessment[]
  ): void {
    const contScore = input.isRecurring ? 5 : 6;
    dims.push(
      this.buildDimension(
        'CONTRACT_MANAGEMENT',
        contScore,
        'High proportion of spot purchase orders without overarching Master Service Agreements.',
        'Transactional volume transacted through discrete purchase orders.',
        'Legal liability exposure, missing SLA protections, and price instability.',
        'Migrate ad-hoc spot spend into structured Annual Rate Contracts with clear SLAs.',
        'NOT_QUANTIFIABLE'
      )
    );

    dims.push(
      this.buildDimension(
        'COMMERCIAL_TERMS',
        5,
        'Unstandardized payment and delivery terms across suppliers.',
        'Incoterms and credit terms vary across vendor transactions.',
        'Working capital drag and uncoordinated logistics expenditures.',
        'Enforce company-wide standard commercial terms (Net 60 days, FOR Destination) across all RFQs.',
        'NOT_QUANTIFIABLE'
      )
    );
  }

  private static appendDemandAndData(
    input: MaturityEvaluationInput,
    dims: ProcurementMaturityDimensionAssessment[]
  ): void {
    const demandScore = input.totalTxCount > 50 ? 5 : 7;
    dims.push(
      this.buildDimension(
        'DEMAND_MANAGEMENT',
        demandScore,
        input.totalTxCount > 50
          ? 'High PO transaction frequency indicates fragmented, uncoordinated user requisitions.'
          : 'Controlled order placement cadence with planned requisitioning.',
        `${input.totalTxCount} purchase orders placed across ${input.activeMonthsCount} months.`,
        'Excess procurement processing costs and missed batch lot sizing efficiencies.',
        'Implement monthly or bi-weekly requisition consolidation cutoffs.',
        'NOT_QUANTIFIABLE'
      )
    );

    const dataScore = input.confidence === 'HIGH' ? 9 : input.confidence === 'MEDIUM' ? 7 : 4;
    dims.push(
      this.buildDimension(
        'DATA_QUALITY',
        dataScore,
        `Data confidence rated ${input.confidence}. Historical attributes support analytical modeling.`,
        `${input.totalTxCount} transactions with verified material descriptions and pricing fields.`,
        'Analytical confidence depends on complete UOM and item specification cleanliness.',
        'Enforce mandatory item master standardization at requisition entry point.',
        'NOT_QUANTIFIABLE'
      )
    );
  }

  public static evaluateMaturity(input: MaturityEvaluationInput): ProcurementMaturityScorecardResult {
    const dimensions: ProcurementMaturityDimensionAssessment[] = [];

    this.appendPricingAndVolume(input, dimensions);
    this.appendSupplierAndCategory(input, dimensions);
    this.appendSpecAndCompetitive(input, dimensions);
    this.appendContractAndCommercial(input, dimensions);
    this.appendDemandAndData(input, dimensions);

    const totalScore = Math.round(dimensions.reduce((sum, d) => sum + d.score, 0));
    const overallScore = Math.round((totalScore / (dimensions.length * 10)) * 100);
    const overallMaturityLevel = this.resolveLevel(totalScore / dimensions.length);

    const sorted = [...dimensions].sort((a, b) => a.score - b.score);
    const topWeaknesses = sorted.slice(0, 3);
    const topStrengths = [...dimensions].sort((a, b) => b.score - a.score).slice(0, 3);

    const diagnosticSummary =
      `Overall Procurement Maturity assessed at ${overallScore}/100 (${overallMaturityLevel}). ` +
      `Primary improvement opportunities lie in ${topWeaknesses.map(w => w.dimensionLabel).join(', ')}. ` +
      'Diagnostic scores represent structural capabilities and are NOT converted into monetary savings.';

    return {
      overallScore,
      overallMaturityLevel,
      dimensions,
      topWeaknesses,
      topStrengths,
      diagnosticSummary
    };
  }
}
