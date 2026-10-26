/**
 * Module 2 — Lever 3: Vendor Base Consolidation Helpers
 * Compliant with Rule 8, 9, max 300 lines, cyclomatic complexity <= 10, line <= 120
 */

import type { StrategicInputTransaction } from '../types/strategicSourcing';
import type {
  SupplierSpendProfile, SupplierMaterialParticipation, SameMaterialOpportunity,
  SpendFragmentationLevel, ConsolidationOpportunityStatus, DataQualityExclusionSummary
} from '../types/module2VendorConsolidation';
import type { MaterialMappingEntry } from '../types/module2MaterialMapping';
import { VENDOR_CONSOLIDATION_CONFIG, CONSOLIDATION_STATUS_LABELS } from '../constants/module2VendorConsolidation';
import { evaluateActionableStatus } from './module2ActionableOpportunityHelper';

interface SupplierAggregationEntry {
  vendorCode: string;
  vendorName: string;
  spendInr: number;
  materials: Set<string>;
  plants: Set<string>;
  poCount: number;
}

function buildSupplierAggregationMap(txs: StrategicInputTransaction[]): Map<string, SupplierAggregationEntry> {
  const map = new Map<string, SupplierAggregationEntry>();
  for (const t of txs) {
    const vCode = (t.vendor_code ?? 'UNKNOWN_VEND').trim();
    const vName = (t.vendor_name ?? vCode).trim();
    let entry = map.get(vCode);
    if (!entry) {
      entry = {
        vendorCode: vCode,
        vendorName: vName,
        spendInr: 0,
        materials: new Set(),
        plants: new Set(),
        poCount: 0
      };
      map.set(vCode, entry);
    }

    entry.spendInr += t.total_spend_inr ?? 0;
    if (t.material_code) entry.materials.add(t.material_code.trim());
    if (t.plant && t.plant.trim() !== '') entry.plants.add(t.plant.trim());
    entry.poCount += 1;
  }
  return map;
}

function deriveFragmentation(suppliersCount: number, top1Share: number): SpendFragmentationLevel {
  if (suppliersCount >= VENDOR_CONSOLIDATION_CONFIG.HIGH_FRAGMENTATION_SUPPLIER_COUNT && top1Share < 50) {
    return 'HIGH';
  }
  if (suppliersCount >= VENDOR_CONSOLIDATION_CONFIG.MEDIUM_FRAGMENTATION_SUPPLIER_COUNT) {
    return 'MEDIUM';
  }
  return 'LOW';
}

export function calculateSupplierProfiles(
  txs: StrategicInputTransaction[],
  totalCategorySpendInr: number
): {
  suppliers: SupplierSpendProfile[];
  top1SharePct: number;
  top3SharePct: number;
  hhiIndex: number;
  fragmentation: SpendFragmentationLevel;
} {
  const supplierMap = buildSupplierAggregationMap(txs);

  const suppliers: SupplierSpendProfile[] = Array.from(supplierMap.values()).map(e => {
    const spendInr = Math.round(e.spendInr * 100) / 100;
    const spendCr = Math.round((spendInr / 10000000) * 10000) / 10000;
    const share = totalCategorySpendInr > 0 ? (spendInr / totalCategorySpendInr) * 100 : 0;
    const spendSharePct = Math.round(share * 10) / 10;
    return {
      vendorCode: e.vendorCode,
      vendorName: e.vendorName,
      spendInr,
      spendCr,
      spendSharePct,
      distinctMaterialsCount: e.materials.size,
      materialsSupplied: Array.from(e.materials),
      distinctPlantsCount: e.plants.size,
      plantsServed: Array.from(e.plants),
      poCount: e.poCount,
      isTailSupplier: spendSharePct < VENDOR_CONSOLIDATION_CONFIG.TAIL_SUPPLIER_SHARE_THRESHOLD_PCT
    };
  }).sort((a, b) => b.spendInr - a.spendInr);

  const top1SharePct = suppliers.length > 0 ? suppliers[0].spendSharePct : 0;
  const top3SharePct = Math.round(suppliers.slice(0, 3).reduce((sum, s) => sum + s.spendSharePct, 0) * 10) / 10;
  const hhiIndex = Math.round(suppliers.reduce((sum, s) => sum + Math.pow(s.spendSharePct, 2), 0));
  const fragmentation = deriveFragmentation(suppliers.length, top1SharePct);

  return { suppliers, top1SharePct, top3SharePct, hhiIndex, fragmentation };
}

function computePriceDispersion(
  mtxs: StrategicInputTransaction[],
  totalSpendInr: number,
  totalQuantity: number,
  isComparable: boolean
): { lowest: number; highest: number; weightedAvg: number; dispersionPct: number } {
  const validPrices = isComparable
    ? mtxs.map(t => t.unit_price).filter(p => typeof p === 'number' && p > 0)
    : [];
  const lowest = validPrices.length > 0 ? Math.min(...validPrices) : 0;
  const highest = validPrices.length > 0 ? Math.max(...validPrices) : 0;
  const weightedAvg = totalQuantity > 0 ? Math.round((totalSpendInr / totalQuantity) * 100) / 100 : 0;
  const dispersionPct = weightedAvg > 0
    ? Math.round(((highest - lowest) / weightedAvg) * 1000) / 10
    : 0;
  return { lowest, highest, weightedAvg, dispersionPct };
}

function buildSingleSameMaterialOpportunity(
  matCode: string,
  mtxs: StrategicInputTransaction[],
  categoryMeta: { spendCategory: string; unspscCode: string; unspscCategory: string },
  mapping?: MaterialMappingEntry
): SameMaterialOpportunity {
  const totalSpendInr = Math.round(mtxs.reduce((sum, t) => sum + (t.total_spend_inr ?? 0), 0) * 100) / 100;
  const totalSpendCr = Math.round((totalSpendInr / 10000000) * 10000) / 10000;
  const totalQuantity = Math.round(mtxs.reduce((sum, t) => sum + (t.quantity ?? 0), 0) * 1000) / 1000;
  const uom = (mtxs[0].uom ?? 'EA').trim().toUpperCase();
  const currency = (mtxs[0].currency ?? 'INR').trim().toUpperCase();
  const isComparable = mtxs.every(
    t => (t.uom ?? 'EA').trim().toUpperCase() === uom && (t.currency ?? 'INR').trim().toUpperCase() === currency
  );

  const vendors = new Set(mtxs.map(t => (t.vendor_code ?? t.vendor_name).trim()));
  const plantSet = new Set(mtxs.map(t => (t.plant ?? '').trim()).filter(p => p !== ''));
  const vendorBreakdown = buildSupplierParticipation(mtxs);

  const { lowest, highest, weightedAvg, dispersionPct } =
    computePriceDispersion(mtxs, totalSpendInr, totalQuantity, isComparable);

  const status: ConsolidationOpportunityStatus = dispersionPct > 10
    ? CONSOLIDATION_STATUS_LABELS.OPPORTUNITY_IDENTIFIED
    : CONSOLIDATION_STATUS_LABELS.POTENTIAL_OPPORTUNITY;

  const reason = dispersionPct > 10
    ? `Multi-sourced material with ${dispersionPct}% price dispersion across ${vendors.size} vendors.`
    : `Multi-sourced material (${vendors.size} suppliers). Volume reallocation review recommended.`;

  const assignedCode = mapping?.assignedUnspscCode || categoryMeta.unspscCode;
  const assignedCat = mapping
    ? `${mapping.assignedUnspscTitle} (${mapping.assignedUnspscCode})`
    : categoryMeta.unspscCategory;
  const reviewStatus = mapping?.reviewStatus;

  const { actionableStatus, qualificationCriteria, nextRecommendedAction } =
    evaluateActionableStatus(dispersionPct, vendors.size, plantSet.size, isComparable, reviewStatus);

  return {
    materialCode: matCode,
    materialDesc: (mtxs[0].material_desc ?? matCode).trim(),
    spendCategory: categoryMeta.spendCategory,
    unspscCode: assignedCode,
    unspscCategory: assignedCat,
    uom,
    currency,
    totalSpendInr,
    totalSpendCr,
    totalQuantity,
    supplierCount: vendors.size,
    plantCount: plantSet.size,
    suppliers: vendorBreakdown,
    lowestUnitPrice: lowest,
    highestUnitPrice: highest,
    weightedAvgPrice: weightedAvg,
    priceDispersionPct: dispersionPct,
    isComparableUomAndCurrency: isComparable,
    status,
    opportunityReason: reason,
    actionableStatus,
    qualificationCriteria,
    nextRecommendedAction,
    classificationReviewStatus: reviewStatus,
    addressableSpendInr: totalSpendInr,
    addressableSpendCr: totalSpendCr,
    transactions: mtxs
  };
}

export function evaluateSameMaterialOpportunities(
  txs: StrategicInputTransaction[],
  spendCategory: string,
  unspscCode: string,
  unspscCategory: string,
  materialMappingMap?: Map<string, MaterialMappingEntry>
): SameMaterialOpportunity[] {
  const itemMap = new Map<string, StrategicInputTransaction[]>();
  for (const t of txs) {
    const mat = (t.material_code ?? 'UNKNOWN_MAT').trim();
    if (mat === 'UNKNOWN_MAT') continue;
    let list = itemMap.get(mat);
    if (!list) {
      list = [];
      itemMap.set(mat, list);
    }
    list.push(t);
  }

  const results: SameMaterialOpportunity[] = [];
  const meta = { spendCategory, unspscCode, unspscCategory };
  for (const [matCode, mtxs] of itemMap.entries()) {
    const vendors = new Set(mtxs.map(t => (t.vendor_code ?? t.vendor_name).trim()));
    if (vendors.size >= VENDOR_CONSOLIDATION_CONFIG.MIN_SUPPLIERS_FOR_MULTI_SOURCING) {
      const mapping = materialMappingMap?.get(matCode);
      results.push(buildSingleSameMaterialOpportunity(matCode, mtxs, meta, mapping));
    }
  }

  return results.sort((a, b) => b.totalSpendInr - a.totalSpendInr);
}

function buildSupplierParticipation(txs: StrategicInputTransaction[]): SupplierMaterialParticipation[] {
  const map = new Map<string, {
    code: string; name: string; qty: number; spend: number; poCount: number; plants: Set<string>;
  }>();

  for (const t of txs) {
    const code = (t.vendor_code ?? 'UNKNOWN').trim();
    const name = (t.vendor_name ?? code).trim();
    let item = map.get(code);
    if (!item) {
      item = { code, name, qty: 0, spend: 0, poCount: 0, plants: new Set() };
      map.set(code, item);
    }
    item.qty += t.quantity ?? 0;
    item.spend += t.total_spend_inr ?? 0;
    item.poCount += 1;
    if (t.plant && t.plant.trim() !== '') item.plants.add(t.plant.trim());
  }

  return Array.from(map.values()).map(e => ({
    vendorCode: e.code,
    vendorName: e.name,
    quantity: Math.round(e.qty * 1000) / 1000,
    spendInr: Math.round(e.spend * 100) / 100,
    spendCr: Math.round((e.spend / 10000000) * 10000) / 10000,
    weightedAvgPrice: e.qty > 0 ? Math.round((e.spend / e.qty) * 100) / 100 : 0,
    poCount: e.poCount,
    plants: Array.from(e.plants)
  })).sort((a, b) => b.spendInr - a.spendInr);
}

export function buildVendorConsolidationDataQualityExclusions(
  txs: StrategicInputTransaction[]
): DataQualityExclusionSummary[] {
  const missingMat = txs.filter(t => !t.material_code || t.material_code.trim() === '');
  const missingMatSpend = missingMat.reduce((s, t) => s + (t.total_spend_inr ?? 0), 0);
  const missingVend = txs.filter(t => !t.vendor_code && !t.vendor_name);
  const missingVendSpend = missingVend.reduce((s, t) => s + (t.total_spend_inr ?? 0), 0);
  const missingPlant = txs.filter(t => !t.plant || t.plant.trim() === '');
  const missingPlantSpend = missingPlant.reduce((s, t) => s + (t.total_spend_inr ?? 0), 0);

  return [
    {
      rule: 'Verified UNSPSC Taxonomy',
      affectedCount: txs.length,
      affectedSpendInr: txs.reduce((s, t) => s + (t.total_spend_inr ?? 0), 0),
      actionTaken: 'Mapped to primary ERP Spend Category; official 8-digit UNSPSC codes tagged unmapped'
    },
    {
      rule: 'Supplier Identification Validation',
      affectedCount: missingVend.length,
      affectedSpendInr: Math.round(missingVendSpend * 100) / 100,
      actionTaken: missingVend.length > 0 ? 'Excluded from supplier-level consolidation analysis' : '100% Validated'
    },
    {
      rule: 'Material Identification Validation',
      affectedCount: missingMat.length,
      affectedSpendInr: Math.round(missingMatSpend * 100) / 100,
      actionTaken: missingMat.length > 0 ? 'Excluded from same-material comparison' : '100% Validated'
    },
    {
      rule: 'Plant Coverage Availability',
      affectedCount: missingPlant.length,
      affectedSpendInr: Math.round(missingPlantSpend * 100) / 100,
      actionTaken: missingPlant.length > 0 ? 'Excluded from cross-plant evaluation' : '100% Plants Identified'
    }
  ];
}

export {
  evaluateComparableMaterialOpportunities,
  evaluateCrossPlantOpportunities
} from './module2VendorConsolidationOpportunitiesHelper';

