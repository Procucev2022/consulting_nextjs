/**
 * Module 2 — Lever 4: Volume Aggregation Plant & Material Profiles Helper
 * Compliant with Rule 8, 9, max 300 lines, cyclomatic complexity <= 10
 */

import { INFORMATIONAL_PLANT_GEOGRAPHY } from '../constants/module2VolumeAggregation';
import { Module2VolumeAggregationCalculators } from './module2VolumeAggregationCalculators';
import type { PlantVolumeBreakdown, MaterialVolumeProfile } from '../types/module2VolumeAggregation';
import type { StrategicInputTransaction } from '../types/strategicSourcing';

export class Module2VolumeAggregationPlantHelper {
  /**
   * Aggregates plant-level spend, counts, and informational geographic attributes.
   */
  public static buildPlantProfiles(
    transactions: StrategicInputTransaction[],
    totalSpendInr: number
  ): PlantVolumeBreakdown[] {
    const plantMap = new Map<
      string,
      { spend: number; txCount: number; materials: Set<string>; suppliers: Set<string> }
    >();

    for (const t of transactions) {
      const plant = t.plant || 'UNKNOWN_PLANT';
      let entry = plantMap.get(plant);
      if (!entry) {
        entry = { spend: 0, txCount: 0, materials: new Set(), suppliers: new Set() };
        plantMap.set(plant, entry);
      }
      entry.spend += t.total_spend_inr ?? 0;
      entry.txCount += 1;
      if (t.material_code) entry.materials.add(t.material_code);
      if (t.vendor_name) entry.suppliers.add(t.vendor_name);
    }

    const profiles: PlantVolumeBreakdown[] = [];

    for (const [plantCode, data] of plantMap.entries()) {
      const geo = INFORMATIONAL_PLANT_GEOGRAPHY[plantCode] || {
        plantCode,
        plantName: `Facility ${plantCode}`,
        region: 'Regional Hub',
        state: 'N/A',
        hubDistanceKm: 0
      };

      const sharePct = totalSpendInr > 0 ? Number(((data.spend / totalSpendInr) * 100).toFixed(2)) : 0;
      const spendCr = Number((data.spend / 10000000).toFixed(4));

      profiles.push({
        plantCode,
        plantName: geo.plantName,
        region: geo.region,
        state: geo.state,
        hubDistanceKm: geo.hubDistanceKm,
        totalSpendInr: data.spend,
        totalSpendCr: spendCr,
        transactionCount: data.txCount,
        distinctMaterialsCount: data.materials.size,
        supplierCount: data.suppliers.size,
        volumeSharePct: sharePct
      });
    }

    return profiles.sort((a, b) => b.totalSpendInr - a.totalSpendInr);
  }

  private static accumulateMaterialTx(
    t: StrategicInputTransaction,
    plantVolumes: Map<string, number>,
    suppliersSet: Set<string>,
    primaryBaseUom: string
  ): { spend: number; qty: number; excludedQty: number; incompatible: boolean } {
    const spend = t.total_spend_inr ?? 0;
    const rawQty = t.quantity ?? 0;
    if (t.vendor_name) suppliersSet.add(t.vendor_name);

    const conv = Module2VolumeAggregationCalculators.convertUom(
      rawQty,
      t.uom || 'EA',
      t.material_desc || '',
      t.spend_category
    );
    if (conv.isCompatible && conv.baseUom === primaryBaseUom) {
      const plant = t.plant || 'UNKNOWN';
      plantVolumes.set(plant, (plantVolumes.get(plant) || 0) + conv.convertedQuantity);
      return { spend, qty: conv.convertedQuantity, excludedQty: 0, incompatible: false };
    }
    return { spend, qty: 0, excludedQty: rawQty, incompatible: true };
  }

  private static buildSingleMaterialProfile(
    matKey: string,
    txs: StrategicInputTransaction[]
  ): MaterialVolumeProfile {
    const first = txs[0];
    const matCode = first.material_code || matKey;
    const matDesc = first.material_desc || matKey;
    const category = first.spend_category || 'General Procurement';
    const unspsc = first.unspsc_code || '00000000';

    let totalSpendInr = 0;
    let totalQty = 0;
    let excludedQty = 0;
    let hasIncompatible = false;

    const firstConv = Module2VolumeAggregationCalculators.convertUom(
      first.quantity ?? 0,
      first.uom || 'EA',
      matDesc,
      category
    );
    const primaryBaseUom = firstConv.baseUom;

    const plantVolumes = new Map<string, number>();
    const suppliersSet = new Set<string>();

    for (const t of txs) {
      const acc = this.accumulateMaterialTx(t, plantVolumes, suppliersSet, primaryBaseUom);
      totalSpendInr += acc.spend;
      totalQty += acc.qty;
      excludedQty += acc.excludedQty;
      if (acc.incompatible) hasIncompatible = true;
    }

    const dispersionIndex = Module2VolumeAggregationCalculators.computePlantVolumeDispersionIndex(
      plantVolumes,
      totalQty
    );
    const demandRes = Module2VolumeAggregationCalculators.classifyDemandRecurrence(txs);
    const wavgPrice = totalQty > 0 ? totalSpendInr / totalQty : 0;
    const spendCr = Number((totalSpendInr / 10000000).toFixed(4));

    return {
      materialId: matKey,
      materialCode: matCode,
      materialDesc: matDesc,
      category,
      unspscCode: unspsc,
      baseUom: primaryBaseUom,
      totalQuantity: Number(totalQty.toFixed(2)),
      totalSpendInr,
      totalSpendCr: spendCr,
      wavgPriceInr: Number(wavgPrice.toFixed(2)),
      demandClassification: demandRes.classification,
      demandClassificationEvidence: demandRes.evidence,
      sourceTransactionDates: demandRes.sourceTransactionDates,
      orderCount: txs.length,
      plantCount: plantVolumes.size,
      supplierCount: suppliersSet.size,
      plantVolumeDispersionIndex: dispersionIndex,
      hasIncompatibleUom: hasIncompatible,
      excludedQuantity: Number(excludedQty.toFixed(2))
    };
  }

  /**
   * Aggregates granular material-level volume profiles with descriptive plant dispersion.
   */
  public static buildMaterialProfiles(
    materialGroups: Map<string, StrategicInputTransaction[]>
  ): MaterialVolumeProfile[] {
    const profiles: MaterialVolumeProfile[] = [];

    for (const [matKey, txs] of materialGroups.entries()) {
      if (txs.length === 0) continue;
      profiles.push(this.buildSingleMaterialProfile(matKey, txs));
    }

    return profiles.sort((a, b) => b.totalSpendInr - a.totalSpendInr);
  }
}
