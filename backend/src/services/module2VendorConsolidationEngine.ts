/**
 * Module 2 — Vendor Consolidation & Demand Pooling Engine
 * Version: MODULE_2_SOURCING_LOGIC_V2.0
 * 
 * Implements:
 * - Commercial Benefit A: Empirical price differential shifting tail spend to core reference
 * - Administrative Benefit B: Transaction cost savings if cost-per-PO provided, else NOT_QUANTIFIABLE
 * - Evidence-based Target Range (e.g. 2-3 suppliers)
 * - Consolidation Feasibility: HIGH | MEDIUM | LOW | NOT_QUANTIFIABLE
 */

import type {
  PriceDispersionMetrics,
  ConsolidationSuitability,
  OperationalConsolidationIndicators,
  CategorySupplierStructureItem,
  SourcingOpportunityStatus
} from '../types/module2StrategicSourcing';
import { Module2ConsolidationHelper } from './module2ConsolidationHelper';

export interface VendorConsolidationBenefitEvaluation {
  suitability: ConsolidationSuitability;
  rationale: string;
  commercialPriceOpportunityInr: number | null;
  commercialPriceOpportunityInrCr: number | null;
  administrativeOpportunityInr: number | null;
  administrativeOpportunityInrCr: number | null;
  administrativeStatus: 'QUANTIFIABLE' | 'NOT_QUANTIFIABLE';
  totalConsolidationBenefitInr: number | null;
  totalConsolidationBenefitInrCr: number | null;
  opportunityPct: number | null;
  isQuantifiable: boolean;
  status: SourcingOpportunityStatus;
  evidencePath: 'PATH_A' | 'PATH_B' | 'PATH_C' | 'PATH_D';
  proposedTargetSupplierRange: string;
  consolidationFeasibility: 'HIGH' | 'MEDIUM' | 'LOW' | 'NOT_QUANTIFIABLE';
  operational: OperationalConsolidationIndicators;
  consolidatableQuantity: number;
  baselineWeightedPrice: number;
  targetCredibleUnitPrice: number;
}

export class Module2VendorConsolidationEngine {
  private static toCr(inr: number | null): number | null {
    if (inr === null) return null;
    return Math.round((inr / 10000000) * 1000) / 1000;
  }

  private static deriveTargetRange(supplierCount: number, isRecurring: boolean): string {
    if (supplierCount <= 1) return 'Maintain sole supplier: no consolidation applicable';
    if (supplierCount <= 3) return 'Maintain current structure: no consolidation recommended';
    if (supplierCount <= 5) return '2 suppliers';
    if (supplierCount <= 8) return '2–3 suppliers';
    return isRecurring ? '3–4 qualified suppliers' : '2–3 suppliers';
  }

  private static evaluateFeasibility(
    supplierCount: number,
    isRecurring: boolean,
    commercialOpp: number
  ): 'HIGH' | 'MEDIUM' | 'LOW' | 'NOT_QUANTIFIABLE' {
    if (supplierCount <= 1) return 'NOT_QUANTIFIABLE';
    if (commercialOpp > 500000 && isRecurring) return 'HIGH';
    if (supplierCount >= 3) return 'MEDIUM';
    return 'LOW';
  }

  private static calculateTailCommercialOpportunity(
    tailSuppliers: CategorySupplierStructureItem[],
    bestCorePrice: number
  ): { commercialPriceOpportunityInr: number; consolidatableQuantity: number } {
    let commercialPriceOpportunityInr = 0;
    let consolidatableQuantity = 0;

    for (const tail of tailSuppliers) {
      if (tail.weightedAveragePrice > bestCorePrice) {
        const priceGap = tail.weightedAveragePrice - bestCorePrice;
        commercialPriceOpportunityInr += priceGap * tail.totalQuantity;
        consolidatableQuantity += tail.totalQuantity;
      }
    }
    return {
      commercialPriceOpportunityInr: Math.round(commercialPriceOpportunityInr),
      consolidatableQuantity
    };
  }

  private static calculateAdminBenefit(
    customerCostPerPoInr: number | null,
    poCountAffected: number
  ): { adminOppInr: number | null; adminStatus: 'QUANTIFIABLE' | 'NOT_QUANTIFIABLE' } {
    if (customerCostPerPoInr !== null && customerCostPerPoInr > 0 && poCountAffected > 0) {
      return {
        adminOppInr: Math.round(poCountAffected * customerCostPerPoInr),
        adminStatus: 'QUANTIFIABLE'
      };
    }
    return { adminOppInr: null, adminStatus: 'NOT_QUANTIFIABLE' };
  }

  private static buildIneligibleResult(
    suitability: ConsolidationSuitability,
    rationale: string,
    status: SourcingOpportunityStatus,
    proposedTargetSupplierRange: string,
    operational: OperationalConsolidationIndicators
  ): VendorConsolidationBenefitEvaluation {
    return {
      suitability,
      rationale,
      commercialPriceOpportunityInr: status === 'NOT_ELIGIBLE' ? 0 : null,
      commercialPriceOpportunityInrCr: status === 'NOT_ELIGIBLE' ? 0 : null,
      administrativeOpportunityInr: null,
      administrativeOpportunityInrCr: null,
      administrativeStatus: 'NOT_QUANTIFIABLE',
      totalConsolidationBenefitInr: status === 'NOT_ELIGIBLE' ? 0 : null,
      totalConsolidationBenefitInrCr: status === 'NOT_ELIGIBLE' ? 0 : null,
      opportunityPct: status === 'NOT_ELIGIBLE' ? 0 : null,
      isQuantifiable: false,
      status,
      evidencePath: 'PATH_D',
      proposedTargetSupplierRange,
      consolidationFeasibility: 'NOT_QUANTIFIABLE',
      operational,
      consolidatableQuantity: 0,
      baselineWeightedPrice: 0,
      targetCredibleUnitPrice: 0
    };
  }

  public static evaluate(
    isRecurring: boolean,
    suppliers: CategorySupplierStructureItem[],
    addressableQuantity: number,
    dispersion: PriceDispersionMetrics | null,
    activeMonthsCount: number,
    customerCostPerPoInr: number | null = null
  ): VendorConsolidationBenefitEvaluation {
    const { operational, tailSuppliers, tailSpend } = Module2ConsolidationHelper.buildOperationalIndicators(
      suppliers,
      activeMonthsCount
    );

    const proposedTargetSupplierRange = this.deriveTargetRange(suppliers.length, isRecurring);

    if (suppliers.length <= 1) {
      return this.buildIneligibleResult(
        'NOT_SUITABLE',
        'Sole supplier configuration. Vendor consolidation not applicable.',
        'NOT_ELIGIBLE',
        proposedTargetSupplierRange,
        operational
      );
    }

    if (!dispersion || addressableQuantity <= 0) {
      return this.buildIneligibleResult(
        'INSUFFICIENT_DATA',
        'Insufficient comparable data to determine consolidation benefit.',
        'IDENTIFIED_NOT_QUANTIFIABLE',
        proposedTargetSupplierRange,
        operational
      );
    }

    const coreSuppliers = suppliers.filter(s => !s.isTailSupplier && s.weightedAveragePrice > 0);
    const bestCorePrice = coreSuppliers.length > 0
      ? Math.min(...coreSuppliers.map(s => s.weightedAveragePrice))
      : dispersion.weightedAveragePrice;

    const { commercialPriceOpportunityInr, consolidatableQuantity } =
      this.calculateTailCommercialOpportunity(tailSuppliers, bestCorePrice);

    const { adminOppInr, adminStatus } =
      this.calculateAdminBenefit(customerCostPerPoInr, operational.poCountAffected);

    const totalBenefitInr = commercialPriceOpportunityInr + (adminOppInr ?? 0);
    const { suitability, rationale } = Module2ConsolidationHelper.getConsolidationSuitabilityInfo(
      tailSuppliers.length,
      commercialPriceOpportunityInr,
      isRecurring,
      tailSpend
    );

    const baselinePrice = dispersion.weightedAveragePrice;
    const oppPct = baselinePrice > 0 && addressableQuantity > 0
      ? (commercialPriceOpportunityInr / (baselinePrice * addressableQuantity)) * 100
      : 0;

    const isQuantifiable = commercialPriceOpportunityInr > 0;
    const feasibility = this.evaluateFeasibility(suppliers.length, isRecurring, commercialPriceOpportunityInr);

    return {
      suitability,
      rationale,
      commercialPriceOpportunityInr: isQuantifiable ? commercialPriceOpportunityInr : null,
      commercialPriceOpportunityInrCr: this.toCr(commercialPriceOpportunityInr),
      administrativeOpportunityInr: adminOppInr,
      administrativeOpportunityInrCr: this.toCr(adminOppInr),
      administrativeStatus: adminStatus,
      totalConsolidationBenefitInr: totalBenefitInr > 0 ? totalBenefitInr : null,
      totalConsolidationBenefitInrCr: this.toCr(totalBenefitInr),
      opportunityPct: Math.round(oppPct * 10) / 10,
      isQuantifiable,
      status: isQuantifiable ? 'CONSOLIDATION_CANDIDATE' : 'IDENTIFIED_NOT_QUANTIFIABLE',
      evidencePath: isQuantifiable ? 'PATH_B' : 'PATH_D',
      proposedTargetSupplierRange,
      consolidationFeasibility: feasibility,
      operational,
      consolidatableQuantity,
      baselineWeightedPrice: baselinePrice,
      targetCredibleUnitPrice: bestCorePrice
    };
  }
}
