/**
 * Module 2 — Vendor Consolidation Strategy Benefit Helper
 * Compliant with Rule 8, 9, max 300 lines, cyclomatic complexity <= 10, line <= 120
 */

import type {
  PriceDispersionMetrics,
  ConsolidationSuitability,
  OperationalConsolidationIndicators,
  CategorySupplierStructureItem,
  SourcingOpportunityStatus
} from '../types/module2StrategicSourcing';
import type { VendorConsolidationBenefitEvaluation } from '../types/module2VendorConsolidation';
import { Module2ConsolidationHelper } from './module2ConsolidationHelper';

function toCr(n: number | null): number | null {
  return n === null ? null : Math.round((n / 10000000) * 1000) / 1000;
}

export class Module2VendorConsolidationStrategyHelper {
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

    const targetRange = this.deriveTargetRange(suppliers.length, isRecurring);

    if (suppliers.length <= 1) {
      return this.buildIneligibleResult(
        'NOT_SUITABLE',
        'Sole supplier configuration. Vendor consolidation not applicable.',
        'NOT_ELIGIBLE',
        targetRange,
        operational
      );
    }

    if (!dispersion || addressableQuantity <= 0) {
      return this.buildIneligibleResult(
        'INSUFFICIENT_DATA',
        'Insufficient comparable data to determine consolidation benefit.',
        'IDENTIFIED_NOT_QUANTIFIABLE',
        targetRange,
        operational
      );
    }

    return this.calculateEligibleResult(
      suppliers,
      tailSuppliers,
      tailSpend,
      addressableQuantity,
      dispersion,
      isRecurring,
      operational,
      targetRange,
      customerCostPerPoInr
    );
  }

  private static deriveTargetRange(count: number, isRecurring: boolean): string {
    if (count <= 1) return 'Maintain sole supplier: no consolidation applicable';
    if (count <= 3) return 'Maintain current structure: no consolidation recommended';
    if (count <= 5) return '2 suppliers';
    if (count <= 8) return '2–3 suppliers';
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

  private static calculateCommercialPriceOpp(
    tailSuppliers: CategorySupplierStructureItem[],
    bestCorePrice: number
  ): { oppInr: number; qty: number } {
    let oppInr = 0;
    let qty = 0;
    for (const tail of tailSuppliers) {
      if (tail.weightedAveragePrice > bestCorePrice) {
        oppInr += (tail.weightedAveragePrice - bestCorePrice) * tail.totalQuantity;
        qty += tail.totalQuantity;
      }
    }
    return { oppInr: Math.round(oppInr), qty };
  }

  private static calculateAdminOpp(
    costPerPo: number | null,
    poCount: number
  ): { adminOppInr: number | null; adminStatus: 'QUANTIFIABLE' | 'NOT_QUANTIFIABLE' } {
    if (costPerPo && costPerPo > 0 && poCount > 0) {
      return { adminOppInr: Math.round(poCount * costPerPo), adminStatus: 'QUANTIFIABLE' };
    }
    return { adminOppInr: null, adminStatus: 'NOT_QUANTIFIABLE' };
  }

  private static calculateEligibleResult(
    suppliers: CategorySupplierStructureItem[],
    tailSuppliers: CategorySupplierStructureItem[],
    tailSpend: number,
    addressableQuantity: number,
    dispersion: PriceDispersionMetrics,
    isRecurring: boolean,
    operational: OperationalConsolidationIndicators,
    targetRange: string,
    customerCostPerPoInr: number | null
  ): VendorConsolidationBenefitEvaluation {
    const coreSuppliers = suppliers.filter(s => !s.isTailSupplier && s.weightedAveragePrice > 0);
    const bestCorePrice = coreSuppliers.length > 0
      ? Math.min(...coreSuppliers.map(s => s.weightedAveragePrice))
      : dispersion.weightedAveragePrice;

    const { oppInr, qty } = this.calculateCommercialPriceOpp(tailSuppliers, bestCorePrice);
    const { adminOppInr, adminStatus } = this.calculateAdminOpp(customerCostPerPoInr, operational.poCountAffected);
    const totalBenefitInr = oppInr + (adminOppInr ?? 0);

    const { suitability, rationale } = Module2ConsolidationHelper.getConsolidationSuitabilityInfo(
      tailSuppliers.length,
      oppInr,
      isRecurring,
      tailSpend
    );

    const baselinePrice = dispersion.weightedAveragePrice;
    const oppPct = baselinePrice > 0 && addressableQuantity > 0
      ? (oppInr / (baselinePrice * addressableQuantity)) * 100
      : 0;


    const isQuantifiable = oppInr > 0;
    const feasibility = this.evaluateFeasibility(suppliers.length, isRecurring, oppInr);

    return {
      suitability,
      rationale,
      commercialPriceOpportunityInr: isQuantifiable ? oppInr : null,
      commercialPriceOpportunityInrCr: toCr(isQuantifiable ? oppInr : null),
      administrativeOpportunityInr: adminOppInr,
      administrativeOpportunityInrCr: toCr(adminOppInr),
      administrativeStatus: adminStatus,
      totalConsolidationBenefitInr: totalBenefitInr > 0 ? totalBenefitInr : null,
      totalConsolidationBenefitInrCr: toCr(totalBenefitInr),
      opportunityPct: Math.round(oppPct * 10) / 10,
      isQuantifiable,
      status: isQuantifiable ? 'CONSOLIDATION_CANDIDATE' : 'IDENTIFIED_NOT_QUANTIFIABLE',
      evidencePath: isQuantifiable ? 'PATH_B' : 'PATH_D',
      proposedTargetSupplierRange: targetRange,
      consolidationFeasibility: feasibility,
      operational,
      consolidatableQuantity: qty,
      baselineWeightedPrice: baselinePrice,
      targetCredibleUnitPrice: bestCorePrice
    };
  }

  private static buildIneligibleResult(
    suitability: ConsolidationSuitability,
    rationale: string,
    status: SourcingOpportunityStatus,
    targetRange: string,
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
      proposedTargetSupplierRange: targetRange,
      consolidationFeasibility: 'NOT_QUANTIFIABLE',
      operational,
      consolidatableQuantity: 0,
      baselineWeightedPrice: 0,
      targetCredibleUnitPrice: 0
    };
  }
}
