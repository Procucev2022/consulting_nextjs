/**
 * Pareto 80/20 Spend Hierarchy Calculation Engine
 */

import type {
  ParetoHierarchyChild,
  ParetoHierarchyParent,
  ParetoRawRecord,
  ParetoSpendData
} from '../types';

export const DEFAULT_PARETO_CUTOFF_PCT = 80;

interface ParentEntity {
  name: string;
  totalSpendCr: number;
  childrenMap: Map<string, number>;
}

function extractNames(rec: ParetoRawRecord, isVendorPrimary: boolean): { parentName: string; childName: string } {
  const p = isVendorPrimary ? rec.vendorName : rec.shortText;
  const c = isVendorPrimary ? rec.shortText : rec.vendorName;
  const fallbackP = isVendorPrimary ? 'UNKNOWN VENDOR' : 'UNKNOWN ITEM';
  const fallbackC = isVendorPrimary ? 'UNKNOWN ITEM' : 'UNKNOWN VENDOR';
  return {
    parentName: (p || fallbackP).trim(),
    childName: (c || fallbackC).trim()
  };
}

function groupRecords(
  records: ParetoRawRecord[],
  primaryKey: 'vendor' | 'item'
): { entityMap: Map<string, Map<string, number>>; totalSpendCr: number } {
  const entityMap = new Map<string, Map<string, number>>();
  let totalSpendCr = 0;
  const isVendorPrimary = primaryKey === 'vendor';

  for (const rec of records) {
    const { parentName, childName } = extractNames(rec, isVendorPrimary);
    const spend = Math.max(0, rec.spendCr || 0);

    totalSpendCr += spend;
    let childMap = entityMap.get(parentName);
    if (!childMap) {
      childMap = new Map<string, number>();
      entityMap.set(parentName, childMap);
    }
    childMap.set(childName, (childMap.get(childName) || 0) + spend);
  }

  return { entityMap, totalSpendCr: Number(totalSpendCr.toFixed(2)) };
}

function aggregateAndSortParents(entityMap: Map<string, Map<string, number>>): ParentEntity[] {
  const list: ParentEntity[] = [];
  for (const [name, childMap] of entityMap.entries()) {
    let parentTotal = 0;
    for (const val of childMap.values()) {
      parentTotal += val;
    }
    list.push({
      name,
      totalSpendCr: Number(parentTotal.toFixed(2)),
      childrenMap: childMap
    });
  }
  return list.sort((a, b) => b.totalSpendCr - a.totalSpendCr);
}

function formatChildren(childMap: Map<string, number>, parentTotal: number): ParetoHierarchyChild[] {
  return Array.from(childMap.entries())
    .map(([name, spend]) => ({
      name,
      spendCr: Number(spend.toFixed(2)),
      percentage: parentTotal > 0 ? Number(((spend / parentTotal) * 100).toFixed(1)) : 0
    }))
    .sort((a, b) => b.spendCr - a.spendCr);
}

function buildHierarchyWithCutoff(
  parentList: ParentEntity[],
  totalSpendCr: number,
  cutoffPct: number,
  idPrefix: string
): { parents: ParetoHierarchyParent[]; paretoSpendCr: number } {
  let cumulative = 0;
  let paretoSpend = 0;
  let boundaryMarked = false;
  const parents: ParetoHierarchyParent[] = [];

  for (let idx = 0; idx < parentList.length; idx++) {
    const parent = parentList[idx];
    cumulative += parent.totalSpendCr;
    const sharePct = totalSpendCr > 0 ? Number(((parent.totalSpendCr / totalSpendCr) * 100).toFixed(2)) : 0;
    const cumulativePct = totalSpendCr > 0 ? Number(((cumulative / totalSpendCr) * 100).toFixed(2)) : 0;

    const children = formatChildren(parent.childrenMap, parent.totalSpendCr);
    const isCutoff = !boundaryMarked && cumulativePct >= cutoffPct;
    if (isCutoff) {
      boundaryMarked = true;
    }

    parents.push({
      id: `${idPrefix}-${idx}-${parent.name.replace(/\s+/g, '-').toLowerCase()}`,
      name: parent.name,
      totalSpendCr: parent.totalSpendCr,
      sharePct,
      cumulativeSpendCr: Number(cumulative.toFixed(2)),
      cumulativePct,
      children,
      isCutoffBoundary: isCutoff
    });

    paretoSpend += parent.totalSpendCr;
    if (cumulativePct >= cutoffPct) {
      break;
    }
  }

  return { parents, paretoSpendCr: Number(paretoSpend.toFixed(2)) };
}

/**
 * Builds the Vendor-first Pareto Hierarchy:
 * Column 1: Supplier Name (Parent)
 * Column 2: Short Text (Child)
 * Column 3: Spend in INR Cr
 */
export function buildVendorParetoHierarchy(
  records: ParetoRawRecord[],
  cutoffPct: number = DEFAULT_PARETO_CUTOFF_PCT
): { parents: ParetoHierarchyParent[]; totalSpendCr: number; paretoSpendCr: number; paretoPct: number } {
  if (!records || records.length === 0) {
    return { parents: [], totalSpendCr: 0, paretoSpendCr: 0, paretoPct: 0 };
  }

  const { entityMap, totalSpendCr } = groupRecords(records, 'vendor');
  const parentList = aggregateAndSortParents(entityMap);
  const { parents, paretoSpendCr } = buildHierarchyWithCutoff(parentList, totalSpendCr, cutoffPct, 'vendor');
  const paretoPct = totalSpendCr > 0 ? Number(((paretoSpendCr / totalSpendCr) * 100).toFixed(1)) : 0;

  return { parents, totalSpendCr, paretoSpendCr, paretoPct };
}

/**
 * Builds the Item-first Pareto Hierarchy:
 * Column 1: Short Text (Parent)
 * Column 2: Supplier Name (Child)
 * Column 3: Spend in INR Cr
 */
export function buildItemParetoHierarchy(
  records: ParetoRawRecord[],
  cutoffPct: number = DEFAULT_PARETO_CUTOFF_PCT
): { parents: ParetoHierarchyParent[]; totalSpendCr: number; paretoSpendCr: number; paretoPct: number } {
  if (!records || records.length === 0) {
    return { parents: [], totalSpendCr: 0, paretoSpendCr: 0, paretoPct: 0 };
  }

  const { entityMap, totalSpendCr } = groupRecords(records, 'item');
  const parentList = aggregateAndSortParents(entityMap);
  const { parents, paretoSpendCr } = buildHierarchyWithCutoff(parentList, totalSpendCr, cutoffPct, 'item');
  const paretoPct = totalSpendCr > 0 ? Number(((paretoSpendCr / totalSpendCr) * 100).toFixed(1)) : 0;

  return { parents, totalSpendCr, paretoSpendCr, paretoPct };
}

/**
 * Seed data matching the user's Excel Pivot Table screenshot + realistic enterprise direct spend.
 */
export const SEED_PARETO_RAW_RECORDS: ParetoRawRecord[] = [
  // TRAFIGURA INDIA PRIVATE LIMITED (Exact from screenshot)
  { vendorName: 'TRAFIGURA INDIA PRIVATE LIMITED', shortText: 'NICKEL', spendCr: 1215.81 },
  { vendorName: 'TRAFIGURA INDIA PRIVATE LIMITED', shortText: 'FERRO NICKEL - NI% 10 - 14', spendCr: 40.04 },
  { vendorName: 'TRAFIGURA INDIA PRIVATE LIMITED', shortText: 'FERRO NICKEL', spendCr: 3.34 },

  // JINDAL STAINLESS LIMITED
  { vendorName: 'JINDAL STAINLESS LIMITED', shortText: 'STAINLESS STEEL MELTING SCRAP 316', spendCr: 1450.20 },
  { vendorName: 'JINDAL STAINLESS LIMITED', shortText: 'HOT ROLLED STAINLESS STEEL COIL', spendCr: 620.50 },
  { vendorName: 'JINDAL STAINLESS LIMITED', shortText: 'COLD ROLLED COIL 304', spendCr: 380.10 },

  // VALE INTERNATIONAL SA
  { vendorName: 'VALE INTERNATIONAL SA', shortText: 'NICKEL', spendCr: 1120.40 },
  { vendorName: 'VALE INTERNATIONAL SA', shortText: 'NICKEL PELLETS GRADE 1', spendCr: 410.25 },

  // GLENCORE INTERNATIONAL AG
  { vendorName: 'GLENCORE INTERNATIONAL AG', shortText: 'FERRO CHROME HIGH CARBON', spendCr: 720.15 },
  { vendorName: 'GLENCORE INTERNATIONAL AG', shortText: 'FERRO MOLYBDENUM 60%', spendCr: 325.80 },
  { vendorName: 'GLENCORE INTERNATIONAL AG', shortText: 'NICKEL', spendCr: 180.50 },

  // TATA STEEL LIMITED
  { vendorName: 'TATA STEEL LIMITED', shortText: 'DIRECT REDUCED IRON (DRI)', spendCr: 450.20 },
  { vendorName: 'TATA STEEL LIMITED', shortText: 'HIGH GRADE IRON ORE PELLETS', spendCr: 280.40 },

  // OUTOKUMPU DISTRIBUTION
  { vendorName: 'OUTOKUMPU DISTRIBUTION', shortText: 'FERRO NICKEL - NI% 10 - 14', spendCr: 310.50 },
  { vendorName: 'OUTOKUMPU DISTRIBUTION', shortText: 'STAINLESS SLABS 316L', spendCr: 190.20 },

  // BFN FORGINGS PRIVATE LIMITED (Exact from screenshot)
  { vendorName: 'BFN FORGINGS PRIVATE LIMITED', shortText: '304L 16 SORF 150# . PU FRG', spendCr: 0.12 },
  { vendorName: 'BFN FORGINGS PRIVATE LIMITED', shortText: '304L 400 2632C PN10 . PU FRG', spendCr: 0.10 },
  { vendorName: 'BFN FORGINGS PRIVATE LIMITED', shortText: '304L 14 SORF 150# . PU FRG', spendCr: 0.08 },
  { vendorName: 'BFN FORGINGS PRIVATE LIMITED', shortText: '304L 400 2633C PN16 . PU FRG', spendCr: 0.05 },
  { vendorName: 'BFN FORGINGS PRIVATE LIMITED', shortText: '304L 450 2576B PN16 PU . FRG', spendCr: 0.05 },
  { vendorName: 'BFN FORGINGS PRIVATE LIMITED', shortText: '304L 400 2576B PN10 . PU FRG', spendCr: 0.04 },
  { vendorName: 'BFN FORGINGS PRIVATE LIMITED', shortText: '304L 400 2576B PN16 . PU FRG', spendCr: 0.04 },
  { vendorName: 'BFN FORGINGS PRIVATE LIMITED', shortText: '304L 18 SORF 150# . PU FRG', spendCr: 0.03 },
  { vendorName: 'BFN FORGINGS PRIVATE LIMITED', shortText: '304L 18 WNRF 150# S40S PU FRG', spendCr: 0.03 },
  { vendorName: 'BFN FORGINGS PRIVATE LIMITED', shortText: '304L 24 SORF 150# . PU FRG', spendCr: 0.03 },
  { vendorName: 'BFN FORGINGS PRIVATE LIMITED', shortText: '304L 350 2576B PN16 . PU FRG', spendCr: 0.03 },
  { vendorName: 'BFN FORGINGS PRIVATE LIMITED', shortText: '304L 350 2632C PN10 . PU FRG', spendCr: 0.02 },
  { vendorName: 'BFN FORGINGS PRIVATE LIMITED', shortText: '304L 14 WNRF 150# S40S PU FRG', spendCr: 0.01 },
  { vendorName: 'BFN FORGINGS PRIVATE LIMITED', shortText: '304L 20 SORF 150# . PU FRG', spendCr: 0.01 },
  { vendorName: 'BFN FORGINGS PRIVATE LIMITED', shortText: '304L 350 2576B PN10 . PU FRG', spendCr: 0.01 },

  // Long tail suppliers (outside top 80%)
  { vendorName: 'INDUSTRIAL VALVES & FITTINGS CO', shortText: 'GATE VALVES DN50 PN40', spendCr: 12.40 },
  { vendorName: 'ALPHA CHEMICALS CORP', shortText: 'HYDROCHLORIC ACID 33%', spendCr: 9.80 },
  { vendorName: 'DELTA REFRACTORIES LTD', shortText: 'DOLORAM I RAMMING MASS', spendCr: 8.50 },
  { vendorName: 'PRECISION GASKETS INC', shortText: 'SPIRAL WOUND GASKETS 316SS', spendCr: 4.20 },
  { vendorName: 'UNITED INDUSTRIAL GASES', shortText: 'LIQUID ARGON 99.99%', spendCr: 3.10 }
];

/**
 * Returns default precomputed Pareto spend data.
 */
export function getDefaultParetoData(cutoffPct: number = DEFAULT_PARETO_CUTOFF_PCT): ParetoSpendData {
  const vendorResult = buildVendorParetoHierarchy(SEED_PARETO_RAW_RECORDS, cutoffPct);
  const itemResult = buildItemParetoHierarchy(SEED_PARETO_RAW_RECORDS, cutoffPct);

  return {
    vendorHierarchy: vendorResult.parents,
    itemHierarchy: itemResult.parents,
    totalSpendCr: vendorResult.totalSpendCr,
    paretoSpendCr: vendorResult.paretoSpendCr,
    paretoPct: vendorResult.paretoPct
  };
}
