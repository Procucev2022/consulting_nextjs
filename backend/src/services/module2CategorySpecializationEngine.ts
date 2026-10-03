/**
 * Module 2 — Category Specialization & Multi-Category Sourcing Engine
 * Version: MODULE_2_SOURCING_LOGIC_V2.0
 * 
 * Direction A: Generalist -> Specialist.
 * Generates Category Dependency Map for multi-category vendors and quantifies
 * re-sourcing benefit only when verified specialist price baseline is lower.
 */

import type { StrategicInputTransaction } from '../types/strategicSourcing';
import type {
  MultiCategoryVendorAnalysisItem,
  MultiCategoryVendorCategoryItem
} from '../types/module2ItemAnalysis';

export interface CategoryDependencyRecord {
  categoryName: string;
  spendInr: number;
  spendInrCr: number;
  currentSupplier: string;
  otherSuppliersCount: number;
  priceDispersionPct: number;
  specialistAvailable: boolean;
  opportunityClassification: 'QUANTIFIABLE' | 'NOT_QUANTIFIABLE';
  demonstratedSpecialistBenefitInr: number;
  recommendedAction: string;
}

export class Module2CategorySpecializationEngine {
  private static toCr(inr: number): number {
    return Math.round((inr / 10000000) * 1000) / 1000;
  }

  private static buildCategorySuppliersMap(allTransactions: StrategicInputTransaction[]): Map<string, Set<string>> {
    const catSuppliersMap = new Map<string, Set<string>>();
    for (const t of allTransactions) {
      const c = (t.spend_category || 'General').trim();
      const s = (t.vendor_name || 'Vendor').trim();
      const set = catSuppliersMap.get(c) || new Set();
      set.add(s);
      catSuppliersMap.set(c, set);
    }
    return catSuppliersMap;
  }

  private static buildSingleDependencyRecord(
    cat: MultiCategoryVendorCategoryItem,
    vendorName: string,
    allCatSuppliers: Set<string>
  ): CategoryDependencyRecord {
    const otherCount = Math.max(0, allCatSuppliers.size - (allCatSuppliers.has(vendorName) ? 1 : 0));
    const hasSpecialist = cat.hasSpecialistAlternative && otherCount > 0;
    const isQuantifiable = hasSpecialist && cat.specialistDemonstratedSavingsInr > 0;

    let action = 'Maintain dedicated relationship';
    if (isQuantifiable) {
      action = 'Initiate competitive re-sourcing event with verified category specialists';
    } else if (hasSpecialist) {
      action = 'Strategic Sourcing Opportunity — Commercial Benefit Not Yet Quantifiable';
    }

    return {
      categoryName: cat.categoryName,
      spendInr: cat.spendInr,
      spendInrCr: this.toCr(cat.spendInr),
      currentSupplier: vendorName,
      otherSuppliersCount: otherCount,
      priceDispersionPct: cat.pricePosition === 'ABOVE_AVERAGE' ? 12.5 : 4.0,
      specialistAvailable: hasSpecialist,
      opportunityClassification: isQuantifiable ? 'QUANTIFIABLE' : 'NOT_QUANTIFIABLE',
      demonstratedSpecialistBenefitInr: cat.specialistDemonstratedSavingsInr,
      recommendedAction: action
    };
  }

  public static buildCategoryDependencyMap(
    vendorName: string,
    categories: MultiCategoryVendorCategoryItem[],
    allTransactions: StrategicInputTransaction[]
  ): CategoryDependencyRecord[] {
    const catSuppliersMap = this.buildCategorySuppliersMap(allTransactions);

    const dependencyRecords: CategoryDependencyRecord[] = categories.map((cat) => {
      const allCatSuppliers = catSuppliersMap.get(cat.categoryName) || new Set();
      return this.buildSingleDependencyRecord(cat, vendorName, allCatSuppliers);
    });

    return dependencyRecords.sort((a, b) => b.spendInr - a.spendInr);
  }

  public static evaluateSpecialistReSourcing(
    vendors: MultiCategoryVendorAnalysisItem[],
    allTransactions: StrategicInputTransaction[]
  ): {
    totalMultiCategorySpendInr: number;
    totalMultiCategorySpendInrCr: number;
    quantifiableSpecialistBenefitInr: number;
    quantifiableSpecialistBenefitInrCr: number;
    dependencyMaps: Map<string, CategoryDependencyRecord[]>;
  } {
    let totalMultiSpend = 0;
    let totalBenefit = 0;
    const dependencyMaps = new Map<string, CategoryDependencyRecord[]>();

    for (const v of vendors) {
      if (v.classification === 'MULTI_CATEGORY_SUPPLIER' || v.classification === 'DOMINANT_MULTI_CATEGORY_SUPPLIER') {
        totalMultiSpend += v.total3YearSpendInr;
        const depMap = this.buildCategoryDependencyMap(v.vendorName, v.categories, allTransactions);
        dependencyMaps.set(v.vendorName, depMap);

        for (const dep of depMap) {
          totalBenefit += dep.demonstratedSpecialistBenefitInr;
        }
      }
    }

    return {
      totalMultiCategorySpendInr: totalMultiSpend,
      totalMultiCategorySpendInrCr: this.toCr(totalMultiSpend),
      quantifiableSpecialistBenefitInr: totalBenefit,
      quantifiableSpecialistBenefitInrCr: this.toCr(totalBenefit),
      dependencyMaps
    };
  }
}
