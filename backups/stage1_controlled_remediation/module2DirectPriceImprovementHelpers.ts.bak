/**
 * Module 2 — Lever 1: Direct Price Improvement Helper Functions
 * Compliant with Rule 8, 9, max 300 lines, cyclomatic complexity <= 10
 */

import type { StrategicInputTransaction } from '../types/strategicSourcing';
import type {
  ItemQualificationStatus,
  SupplierPriceComparison,
  PlantPriceComparison,
  DirectPriceTransactionRecord
} from '../types/module2DirectPriceImprovement';
import {
  DIRECT_PRICE_CONFIG,
  DIRECT_PRICE_WARNINGS
} from '../constants/module2DirectPriceImprovement';

export function parseIndianFinancialYear(dateStr?: string): string {
  if (!dateStr || typeof dateStr !== 'string') return 'UNKNOWN_FY';
  const trimmed = dateStr.trim();
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return 'UNKNOWN_FY';
  const month = d.getMonth() + 1; // 1-12
  const year = d.getFullYear();
  if (month >= 4) {
    const nextYearShort = (year + 1).toString().slice(-2);
    return `FY${year}-${nextYearShort}`;
  }
  const currentYearShort = year.toString().slice(-2);
  return `FY${year - 1}-${currentYearShort}`;
}

function checkCoalCommodity(
  desc: string,
  cat: string,
  unit: string
): { status: ItemQualificationStatus; warnings: string[] } | null {
  if (!desc.includes('COAL') && !cat.includes('COAL')) return null;
  if (unit === 'EA' || unit === 'NO' || unit === 'PCS') {
    return { status: 'VOLATILE_COMMODITY', warnings: [DIRECT_PRICE_WARNINGS.VOLATILE_COMMODITY_UOM] };
  }
  return { status: 'VOLATILE_COMMODITY', warnings: [DIRECT_PRICE_WARNINGS.VOLATILE_COMMODITY_GRADE] };
}

function checkSpecMismatch(
  desc: string,
  lowestPrice: number,
  highestPrice: number
): { status: ItemQualificationStatus; warnings: string[] } | null {
  const isComplex = desc.includes('SCRAPPER') || desc.includes('ADAPTER') || desc.includes('VALVE');
  if (!isComplex || lowestPrice <= 0) return null;
  const ratio = highestPrice / lowestPrice;
  if (ratio > DIRECT_PRICE_CONFIG.SPEC_MISMATCH_PRICE_RATIO_THRESHOLD) {
    return { status: 'SPEC_MISMATCH', warnings: [DIRECT_PRICE_WARNINGS.SPEC_MISMATCH] };
  }
  return null;
}

export function classifyItemQualification(
  materialDesc: string,
  spendCategory: string,
  uom: string,
  lowestPrice: number,
  highestPrice: number,
  supplierCount: number,
  distinctPrices: number
): { status: ItemQualificationStatus; warnings: string[] } {
  const desc = (materialDesc || '').toUpperCase();
  const cat = (spendCategory || '').toUpperCase();
  const unit = (uom || '').toUpperCase();

  const coalCheck = checkCoalCommodity(desc, cat, unit);
  if (coalCheck) return coalCheck;

  const specCheck = checkSpecMismatch(desc, lowestPrice, highestPrice);
  if (specCheck) return specCheck;

  if (supplierCount <= 1) {
    return { status: 'SINGLE_SUPPLIER', warnings: [DIRECT_PRICE_WARNINGS.SINGLE_SUPPLIER] };
  }
  if (distinctPrices <= 1 || lowestPrice === highestPrice) {
    return { status: 'UNIFORM_PRICING', warnings: [DIRECT_PRICE_WARNINGS.UNIFORM_PRICING] };
  }
  return { status: 'QUALIFIED', warnings: [] };
}

export function buildSupplierComparisons(
  txs: StrategicInputTransaction[],
  lowestPrice: number
): SupplierPriceComparison[] {
  const map = new Map<string, {
    name: string;
    count: number;
    qty: number;
    spend: number;
    prices: number[];
  }>();

  for (const t of txs) {
    const code = (t.vendor_code || t.vendor_name || 'UNKNOWN').trim();
    const name = (t.vendor_name || t.vendor_code || 'Unknown Supplier').trim();
    let entry = map.get(code);
    if (!entry) {
      entry = { name, count: 0, qty: 0, spend: 0, prices: [] };
      map.set(code, entry);
    }
    const qty = t.quantity || 0;
    const price = t.unit_price || 0;
    const spend = qty * price;
    entry.count++;
    entry.qty += qty;
    entry.spend += spend;
    entry.prices.push(price);
  }

  return Array.from(map.entries()).map(([code, e]) => {
    const minP = Math.min(...e.prices);
    const maxP = Math.max(...e.prices);
    const weightedAvg = e.qty > 0 ? e.spend / e.qty : minP;
    const benchSpend = e.qty * lowestPrice;
    const lostOpp = Math.max(0, e.spend - benchSpend);

    return {
      supplierCode: code,
      supplierName: e.name,
      transactionCount: e.count,
      totalQuantity: Math.round(e.qty * 1000) / 1000,
      totalSpendInr: Math.round(e.spend * 100) / 100,
      weightedAveragePrice: Math.round(weightedAvg * 100) / 100,
      lowestUnitPrice: Math.round(minP * 100) / 100,
      highestUnitPrice: Math.round(maxP * 100) / 100,
      historicalLostOpportunityInr: Math.round(lostOpp * 100) / 100,
      isLowestPriceSupplier: minP === lowestPrice
    };
  }).sort((a, b) => b.totalSpendInr - a.totalSpendInr);
}

export function buildPlantComparisons(
  txs: StrategicInputTransaction[],
  lowestPrice: number
): PlantPriceComparison[] {
  const map = new Map<string, {
    count: number;
    qty: number;
    spend: number;
    prices: number[];
  }>();

  for (const t of txs) {
    const plant = (t.plant || 'DEFAULT_PLANT').trim();
    let entry = map.get(plant);
    if (!entry) {
      entry = { count: 0, qty: 0, spend: 0, prices: [] };
      map.set(plant, entry);
    }
    const qty = t.quantity || 0;
    const price = t.unit_price || 0;
    const spend = qty * price;
    entry.count++;
    entry.qty += qty;
    entry.spend += spend;
    entry.prices.push(price);
  }

  return Array.from(map.entries()).map(([plant, e]) => {
    const minP = Math.min(...e.prices);
    const weightedAvg = e.qty > 0 ? e.spend / e.qty : minP;
    const benchSpend = e.qty * lowestPrice;
    const lostOpp = Math.max(0, e.spend - benchSpend);

    return {
      plantCode: plant,
      transactionCount: e.count,
      totalQuantity: Math.round(e.qty * 1000) / 1000,
      totalSpendInr: Math.round(e.spend * 100) / 100,
      weightedAveragePrice: Math.round(weightedAvg * 100) / 100,
      lowestUnitPrice: Math.round(minP * 100) / 100,
      historicalLostOpportunityInr: Math.round(lostOpp * 100) / 100
    };
  }).sort((a, b) => b.totalSpendInr - a.totalSpendInr);
}

export function computeGroupTotals(txs: StrategicInputTransaction[]): {
  suppliersSet: Set<string>;
  plantsSet: Set<string>;
  totalQty: number;
  actualCost: number;
} {
  const suppliersSet = new Set<string>();
  const plantsSet = new Set<string>();
  let totalQty = 0;
  let actualCost = 0;

  for (const t of txs) {
    suppliersSet.add((t.vendor_code || t.vendor_name || 'UNKNOWN').trim());
    plantsSet.add((t.plant || 'DEFAULT_PLANT').trim());
    const q = t.quantity || 0;
    const p = t.unit_price || 0;
    totalQty += q;
    actualCost += (q * p);
  }

  return { suppliersSet, plantsSet, totalQty, actualCost };
}

export function mapDirectPriceTransactionRecords(
  txs: StrategicInputTransaction[],
  fy: string,
  lowestPrice: number,
  qualification: { status: ItemQualificationStatus; warnings: string[] }
): DirectPriceTransactionRecord[] {
  return txs.map((t, idx) => {
    const q = t.quantity || 0;
    const p = t.unit_price || 0;
    const spend = t.total_spend_inr || (q * p);
    const bCost = q * lowestPrice;
    const opp = Math.max(0, (p - lowestPrice) * q);
    return {
      id: t.id || `TX-${fy}-${idx + 1}`,
      poNumber: t.po_number || 'N/A',
      poDate: t.po_date || 'N/A',
      financialYear: fy,
      supplierName: t.vendor_name || 'Unknown Supplier',
      supplierCode: t.vendor_code || 'UNKNOWN',
      plantCode: t.plant || 'DEFAULT_PLANT',
      quantity: Math.round(q * 1000) / 1000,
      unitPrice: Math.round(p * 100) / 100,
      totalSpendInr: Math.round(spend * 100) / 100,
      benchmarkUnitPrice: Math.round(lowestPrice * 100) / 100,
      benchmarkCostInr: Math.round(bCost * 100) / 100,
      historicalLostOpportunityInr: Math.round(opp * 100) / 100,
      isBenchmarkTransaction: p === lowestPrice,
      qualificationStatus: qualification.status,
      warning: qualification.warnings[0]
    };
  }).sort((a, b) => b.historicalLostOpportunityInr - a.historicalLostOpportunityInr);
}
