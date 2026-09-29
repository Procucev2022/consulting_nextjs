/**
 * Module 2 — Supplier Fragmentation & HHI Helpers
 * Version: MODULE_2_SOURCING_LOGIC_V2.0
 */

import type {
  CategorySupplierStructureItem,
  SupplierFragmentationLevel
} from '../types/module2StrategicSourcing';
import { FRAGMENTATION_THRESHOLDS } from '../constants/module2StrategicSourcing';

export class Module2FragmentationHelper {
  public static getFragmentationDetails(
    topShare: number,
    supplierCount: number,
    hhiScore: number
  ): { level: SupplierFragmentationLevel; rationale: string } {
    if (topShare >= FRAGMENTATION_THRESHOLDS.DOMINANT_SUPPLIER_SHARE * 100 || supplierCount === 1) {
      return {
        level: 'LOW_FRAGMENTATION',
        rationale: `Dominant supplier holds ${topShare.toFixed(1)}% of spend. Low operational fragmentation despite vendor count.`
      };
    }
    if (hhiScore < FRAGMENTATION_THRESHOLDS.HHI_HIGH_FRAGMENTATION && supplierCount >= 5) {
      return {
        level: 'EXTREME_FRAGMENTATION',
        rationale: `HHI ${hhiScore} indicates severe fragmentation across ${supplierCount} suppliers.`
      };
    }
    if (hhiScore < FRAGMENTATION_THRESHOLDS.HHI_MODERATE_FRAGMENTATION || supplierCount >= 4) {
      return {
        level: 'HIGH_FRAGMENTATION',
        rationale: `HHI ${hhiScore} indicates high fragmentation. Multiple vendors hold modest spend shares.`
      };
    }
    if (hhiScore <= FRAGMENTATION_THRESHOLDS.HHI_LOW_FRAGMENTATION) {
      return {
        level: 'MODERATE_FRAGMENTATION',
        rationale: `HHI ${hhiScore} indicates moderate concentration. Core vendors lead volume allocation.`
      };
    }
    return {
      level: 'LOW_FRAGMENTATION',
      rationale: `HHI ${hhiScore} indicates concentrated supplier portfolio.`
    };
  }

  public static getHhiInterpretation(hhiScore: number): string {
    if (hhiScore > 2500) return `Highly concentrated market (HHI: ${hhiScore})`;
    if (hhiScore >= 1500) return `Moderately concentrated market (HHI: ${hhiScore})`;
    return `Unconcentrated / fragmented market (HHI: ${hhiScore})`;
  }

  public static calculateHHIAndFragmentation(
    suppliers: CategorySupplierStructureItem[],
    totalSpend: number
  ): {
    hhiScore: number;
    hhiInterpretation: string;
    fragmentationLevel: SupplierFragmentationLevel;
    fragmentationRationale: string;
  } {
    if (suppliers.length === 0 || totalSpend <= 0) {
      return {
        hhiScore: 10000,
        hhiInterpretation: 'Sole supplier configuration.',
        fragmentationLevel: 'LOW_FRAGMENTATION',
        fragmentationRationale: 'Single vendor monopoly.'
      };
    }

    let hhiSum = 0;
    for (const s of suppliers) {
      const share = (s.totalSpendInr / totalSpend) * 100;
      hhiSum += share * share;
    }
    const hhiScore = Math.min(10000, Math.round(hhiSum));
    const hhiInterpretation = this.getHhiInterpretation(hhiScore);
    const topShare = suppliers[0]?.spendSharePct || 0;
    const { level, rationale } = this.getFragmentationDetails(topShare, suppliers.length, hhiScore);

    return {
      hhiScore,
      hhiInterpretation,
      fragmentationLevel: level,
      fragmentationRationale: rationale
    };
  }
}
