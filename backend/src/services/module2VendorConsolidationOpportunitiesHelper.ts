/**
 * Module 2 — Lever 3: Vendor Base Consolidation Opportunities Helper
 * Handles Comparable and Cross-Plant opportunities
 * Compliant with Rule 8, 9, max 300 lines, cyclomatic complexity <= 10, line <= 120
 */

import type { StrategicInputTransaction } from '../types/strategicSourcing';
import type {
  ComparableMaterialOpportunity,
  CrossPlantOpportunity
} from '../types/module2VendorConsolidation';
import {
  VENDOR_CONSOLIDATION_CONFIG,
  CONSOLIDATION_STATUS_LABELS,
  VENDOR_CONSOLIDATION_DISCLOSURES
} from '../constants/module2VendorConsolidation';

const COMPARABLE_KEYWORDS = [
  'BOX', 'TUBE', 'BAG', 'OIL', 'VALVE', 'BEARING', 'FILTER', 'BELT', 'CHEMICAL', 'PIPE', 'WIRE', 'CABLE'
];

const EXCLUDED_ACCESSORY_PATTERNS = /\b(CUTTER|STAND|SWITCH)\b/i;

interface ComparableItemInfo {
  desc: string;
  spend: number;
  vendors: Set<string>;
}

function buildComparableKeywordMap(
  items: Map<string, ComparableItemInfo>
): Map<string, { code: string; desc: string; spend: number; vendors: string[] }[]> {
  const map = new Map<string, { code: string; desc: string; spend: number; vendors: string[] }[]>();
  for (const [code, info] of items.entries()) {
    const upper = info.desc.toUpperCase();
    if (EXCLUDED_ACCESSORY_PATTERNS.test(upper)) {
      continue;
    }
    const matched = COMPARABLE_KEYWORDS.find(kw => new RegExp(`\\b${kw}\\b`, 'i').test(upper));
    if (matched) {
      let group = map.get(matched);
      if (!group) {
        group = [];
        map.set(matched, group);
      }
      group.push({
        code,
        desc: info.desc,
        spend: Math.round(info.spend * 100) / 100,
        vendors: Array.from(info.vendors)
      });
    }
  }
  return map;
}

export function evaluateComparableMaterialOpportunities(
  txs: StrategicInputTransaction[],
  spendCategory: string
): ComparableMaterialOpportunity[] {
  const items = new Map<string, ComparableItemInfo>();
  for (const t of txs) {
    const mat = (t.material_code ?? '').trim();
    if (!mat) continue;
    let entry = items.get(mat);
    if (!entry) {
      entry = { desc: (t.material_desc ?? mat).trim(), spend: 0, vendors: new Set() };
      items.set(mat, entry);
    }
    entry.spend += t.total_spend_inr ?? 0;
    if (t.vendor_name) entry.vendors.add(t.vendor_name.trim());
  }

  const keywordMap = buildComparableKeywordMap(items);
  const results: ComparableMaterialOpportunity[] = [];

  for (const [kw, group] of keywordMap.entries()) {
    if (group.length >= 2) {
      const spendInr = Math.round(group.reduce((sum, g) => sum + g.spend, 0) * 100) / 100;
      results.push({
        groupId: `GRP-${spendCategory}-${kw}`,
        categoryCode: spendCategory,
        categoryName: spendCategory,
        materials: group.map(g => ({
          materialCode: g.code,
          materialDesc: g.desc,
          spendInr: g.spend,
          spendCr: Math.round((g.spend / 10000000) * 10000) / 10000,
          vendorCount: g.vendors.length,
          vendors: g.vendors
        })),
        relationshipLabel: 'Potential Comparable — Validation Required',
        similarityBasis: `Shared keyword '${kw}' within procurement category '${spendCategory}'`,
        status: CONSOLIDATION_STATUS_LABELS.POTENTIAL_OPPORTUNITY,
        opportunityReason: `Potential specification review across ${group.length} items. Validation required.`,
        addressableSpendInr: spendInr,
        addressableSpendCr: Math.round((spendInr / 10000000) * 10000) / 10000
      });
    }
  }

  return results;
}

function buildPlantMap(
  txs: StrategicInputTransaction[]
): Map<string, { plants: Set<string>; vendors: Set<string>; spend: number; desc: string }> {
  const map = new Map<string, { plants: Set<string>; vendors: Set<string>; spend: number; desc: string }>();
  for (const t of txs) {
    const plant = (t.plant ?? '').trim();
    const mat = (t.material_code ?? '').trim();
    if (!plant || !mat) continue;

    let entry = map.get(mat);
    if (!entry) {
      entry = { plants: new Set(), vendors: new Set(), spend: 0, desc: t.material_desc ?? mat };
      map.set(mat, entry);
    }
    entry.plants.add(plant);
    if (t.vendor_name) entry.vendors.add(t.vendor_name.trim());
    entry.spend += t.total_spend_inr ?? 0;
  }
  return map;
}

export function evaluateCrossPlantOpportunities(
  txs: StrategicInputTransaction[],
  spendCategory: string
): CrossPlantOpportunity[] {
  const plantMap = buildPlantMap(txs);
  const results: CrossPlantOpportunity[] = [];

  for (const [code, info] of plantMap.entries()) {
    const minPlants = VENDOR_CONSOLIDATION_CONFIG.MIN_PLANTS_FOR_CROSS_PLANT;
    if (info.plants.size >= minPlants && info.vendors.size >= 2) {
      const spendInr = Math.round(info.spend * 100) / 100;
      results.push({
        code,
        description: info.desc,
        level: 'MATERIAL',
        spendCategory,
        distinctPlantsCount: info.plants.size,
        plants: Array.from(info.plants),
        distinctSuppliersCount: info.vendors.size,
        suppliers: Array.from(info.vendors),
        totalSpendInr: spendInr,
        totalSpendCr: Math.round((spendInr / 10000000) * 10000) / 10000,
        status: CONSOLIDATION_STATUS_LABELS.POTENTIAL_OPPORTUNITY,
        coordinationPotential: `Procured across ${info.plants.size} plants from ${info.vendors.size} vendors.`,
        governanceDisclosure: VENDOR_CONSOLIDATION_DISCLOSURES.CROSS_PLANT_CAVEAT
      });
    }
  }

  return results.sort((a, b) => b.totalSpendInr - a.totalSpendInr);
}
