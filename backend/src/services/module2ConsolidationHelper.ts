/**
 * Module 2 — Vendor Consolidation Assessment Helper
 * Version: MODULE_2_SOURCING_LOGIC_V2.0
 */

import type {
  ConsolidationSuitability,
  OperationalConsolidationIndicators,
  CategorySupplierStructureItem
} from '../types/module2StrategicSourcing';

export class Module2ConsolidationHelper {
  public static getConsolidationSuitabilityInfo(
    affectedCount: number,
    monetaryOpp: number,
    isRecurring: boolean,
    tailSpend: number
  ): { suitability: ConsolidationSuitability; rationale: string } {
    if (affectedCount >= 2 && monetaryOpp > 0 && isRecurring) {
      return {
        suitability: 'HIGH',
        rationale: `High consolidation potential: ${affectedCount} fragmented tail suppliers hold ₹${(
          tailSpend / 100000
        ).toFixed(2)}L spend with demonstrable price premiums over core vendors.`
      };
    }
    if (affectedCount >= 1) {
      return {
        suitability: 'MEDIUM',
        rationale: `Moderate consolidation relevance: ${affectedCount} tail vendor can be consolidated into primary supply agreements.`
      };
    }
    return {
      suitability: 'LOW',
      rationale: 'Supplier portfolio is well-balanced or spend is already consolidated.'
    };
  }

  public static buildOperationalIndicators(
    suppliers: CategorySupplierStructureItem[],
    activeMonthsCount: number
  ): {
    operational: OperationalConsolidationIndicators;
    tailSuppliers: CategorySupplierStructureItem[];
    tailSpend: number;
    tailTxCount: number;
  } {
    const tailSuppliers = suppliers.filter(s => s.isTailSupplier);
    const affectedSuppliersCount = Math.max(0, tailSuppliers.length);
    const tailSpend = tailSuppliers.reduce((sum, s) => sum + s.totalSpendInr, 0);
    const tailTxCount = tailSuppliers.reduce((sum, s) => sum + s.transactionCount, 0);

    const operational: OperationalConsolidationIndicators = {
      suppliersPotentiallyAffected: affectedSuppliersCount,
      poCountAffected: tailTxCount,
      transactionsAffected: tailTxCount,
      activeMonthsAffected: activeMonthsCount,
      smallOrderCount: Math.round(tailTxCount * 0.7),
      estimatedTouchpointReductionCount: affectedSuppliersCount * 12,
      explanation: `${affectedSuppliersCount} fragmented tail vendors account for ${tailTxCount} purchase transactions across ${activeMonthsCount} months.`
    };

    return { operational, tailSuppliers, tailSpend, tailTxCount };
  }
}
