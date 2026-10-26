import type { LineItemMapping, CategoryTopItem } from '../types';

export function addSpendToFiscalYear(
  target: { spendFY24: number; spendFY25: number; spendFY26: number; spendFY27?: number },
  spendCr: number,
  spendYear?: number
): void {
  const year = Number(spendYear);
  if (!year || isNaN(year)) return;
  if (year <= 2023) {
    target.spendFY24 += spendCr;
  } else if (year === 2024) {
    target.spendFY25 += spendCr;
  } else if (year === 2025) {
    target.spendFY26 += spendCr;
  } else if (year === 2026) {
    if (target.spendFY27 !== undefined) {
      target.spendFY27 += spendCr;
    } else {
      target.spendFY26 += spendCr;
    }
  }
}

export function getItemSpendCr(item: LineItemMapping): number {
  if (item.inr_crores != null) return item.inr_crores;
  if (item.total_spend) return item.total_spend / 10000000;
  return 0;
}

export interface UnitPricesResult {
  qty: number;
  priceFy24: number;
  priceFy25: number;
  priceFy26: number;
}

export function computeUnitPrices(item: LineItemMapping, spendCr: number): UnitPricesResult {
  const qty = item.qty || 0;
  const unitPrice = item.unit_price || (qty > 0 ? Number(((spendCr * 10000000) / qty).toFixed(2)) : 0);
  const basePrice = Number(unitPrice.toFixed(2));
  return {
    qty,
    priceFy24: basePrice,
    priceFy25: item.unit_price_fy25 ? Number(item.unit_price_fy25.toFixed(2)) : basePrice,
    priceFy26: item.unit_price_fy26 ? Number(item.unit_price_fy26.toFixed(2)) : basePrice
  };
}

export function updateExistingItem(
  existing: CategoryTopItem,
  spendCr: number,
  qty: number,
  optLakhs: number
): void {
  existing.total_spend_inr_cr = Number(((existing.total_spend_inr_cr || 0) + spendCr).toFixed(2));
  existing.order_qty_annual = (existing.order_qty_annual || 0) + qty;
  const currOpt = existing.opportunity_potential_inr_lakhs || 0;
  existing.opportunity_potential_inr_lakhs = Number((currOpt + optLakhs).toFixed(2));
}

export function computePriceChangePct(p24: number, p25: number, p26: number): number {
  if (p24 === p25 && p25 === p26) return 0.0;
  if (p24 > 0 && p26 > 0 && p26 !== p24) {
    return Number((((p26 - p24) / p24) * 100).toFixed(1));
  }
  if (p24 > 0 && p25 > 0 && p25 !== p24) {
    return Number((((p25 - p24) / p24) * 100).toFixed(1));
  }
  return 0.0;
}

export function createNewTopItem(
  item: LineItemMapping,
  rawDesc: string,
  vendor: string,
  spendCr: number,
  code: string,
  qty: number,
  prices: { priceFy24: number; priceFy25: number; priceFy26: number },
  optLakhs: number
): CategoryTopItem {
  const priceChangePct = computePriceChangePct(prices.priceFy24, prices.priceFy25, prices.priceFy26);
  return {
    item_id: item.material_code || item.line_item_id || `ITM-${Math.floor(1000 + Math.random() * 9000)}`,
    item_name: rawDesc,
    item_desc: rawDesc,
    description: rawDesc,
    vendor_name: vendor,
    column_l_code: code,
    po_number: item.po_number || 'PO-2024-SYS',
    unit_of_measure: 'Units',
    unit: 'Units',
    raw_currency: item.raw_currency || 'INR',
    order_qty_annual: qty,
    volume: qty,
    price_fy24: prices.priceFy24,
    price_fy25: prices.priceFy25,
    price_fy26: prices.priceFy26,
    price_change_pct: priceChangePct,
    total_spend_inr_cr: Number(spendCr.toFixed(2)),
    share_pct: 0,
    opportunity_potential_inr_lakhs: optLakhs,
    leakage_flag: priceChangePct >= 15 ? 'High Creep' : undefined
  };
}

export function upsertTopItem(
  itemsMap: Map<string, CategoryTopItem>,
  item: LineItemMapping,
  rawDesc: string,
  vendor: string,
  spendCr: number,
  code: string
): void {
  const existing = itemsMap.get(rawDesc);
  const { qty, ...prices } = computeUnitPrices(item, spendCr);
  const priceChangePct = computePriceChangePct(prices.priceFy24, prices.priceFy25, prices.priceFy26);
  const optLakhs = priceChangePct > 0 ? Number(((spendCr * 100 * (priceChangePct / 100)).toFixed(2))) : 0;

  if (existing) {
    updateExistingItem(existing, spendCr, qty, optLakhs);
  } else {
    itemsMap.set(rawDesc, createNewTopItem(item, rawDesc, vendor, spendCr, code, qty, prices, optLakhs));
  }
}
