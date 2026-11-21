import {
  D1_INGESTION_ANALYTICS_LIMITS,
  D1_INGESTION_MONTH_NAMES
} from '../constants/d1IngestionAnalytics';
import type { D1Record } from '../types/d1';
import type {
  D1DocumentMaterialGroupSummary,
  D1DocumentMonthSummary,
  D1DocumentPlantSummary
} from '../types/d1IngestionAnalytics';
import { resolveHumanReadableCategory } from '../utils/procurementCategoryResolver';

export const toCrores = (value: unknown): number => Number(Number(value).toFixed(2));

export const toUsdMillions = (spendCr: number): number => {
  const inrTotal = spendCr * D1_INGESTION_ANALYTICS_LIMITS.inrPerCrore;
  const usdTotal = inrTotal / D1_INGESTION_ANALYTICS_LIMITS.usdFallbackRate;
  return Number((usdTotal / 1_000_000).toFixed(2));
};

export const toSharePct = (partCr: number, totalCr: number): number =>
  totalCr > 0 ? Number(((partCr / totalCr) * 100).toFixed(1)) : 0;

export const formatMonthLabel = (monthKey: string): string => {
  const [yearPart, monthPart] = monthKey.split('-');
  const label = D1_INGESTION_MONTH_NAMES[Number(monthPart) - 1];
  return label ? `${label} ${yearPart}` : monthKey;
};

export const formatFiscalYear = (monthKey: string): string => {
  const [yearText, monthText] = monthKey.split('-');
  const yearNum = Number(yearText);
  const monthNum = Number(monthText);
  const fyYear = monthNum >= D1_INGESTION_ANALYTICS_LIMITS.fiscalYearStartMonth ? yearNum + 1 : yearNum;
  return `FY${String(fyYear).slice(-2)}`;
};

export const buildMaterialGroups = (
  rows: D1Record[],
  totalSpendCr: number
): D1DocumentMaterialGroupSummary[] =>
  rows.map((row) => {
    const groupCode = String(row.group_code);
    const spendCr = toCrores(row.spend_inr_cr);
    const resolvedName = resolveHumanReadableCategory(null, groupCode);
    const groupName = resolvedName !== 'Unmapped Category'
      ? `${resolvedName} (${groupCode})`
      : groupCode === D1_INGESTION_ANALYTICS_LIMITS.unspecifiedGroupCode
        ? D1_INGESTION_ANALYTICS_LIMITS.unspecifiedGroupLabel
        : groupCode;
    const itemCount = Number(row.unique_items_count);
    const vendorsCount = Number(row.unique_vendors_count);
    return {
      group_code: groupCode,
      group_name: groupName,
      primary_segment: D1_INGESTION_ANALYTICS_LIMITS.defaultMaterialSegment,
      spend_inr_cr: spendCr,
      spend_usd_m: toUsdMillions(spendCr),
      share_pct: toSharePct(spendCr, totalSpendCr),
      records_count: Number(row.records_count),
      po_count: Number(row.po_count),
      unique_items_count: itemCount,
      unique_vendors_count: vendorsCount,
      item_count: itemCount,
      active_vendors_count: vendorsCount,
      sample_item: row.sample_item ? String(row.sample_item) : undefined,
      top_supplier: row.top_supplier ? String(row.top_supplier) : undefined,
      total_spend_inr_cr: spendCr
    };
  });

export const buildPlantSummaries = (rows: D1Record[], totalSpendCr: number): D1DocumentPlantSummary[] =>
  rows.map((row) => {
    const plantCode = String(row.plant_code);
    const spendCr = toCrores(row.spend_inr_cr);
    const poCount = Number(row.po_count);
    const vendorsCount = Number(row.unique_vendors_count);
    return {
      plant_code: plantCode,
      plant_name: plantCode === D1_INGESTION_ANALYTICS_LIMITS.unspecifiedPlantCode
        ? D1_INGESTION_ANALYTICS_LIMITS.unspecifiedPlantLabel
        : plantCode,
      region: D1_INGESTION_ANALYTICS_LIMITS.defaultPlantRegion,
      location: D1_INGESTION_ANALYTICS_LIMITS.defaultPlantLocation,
      records_count: Number(row.records_count),
      po_count: poCount,
      total_po_count: poCount,
      spend_inr_cr: spendCr,
      spend_usd_m: toUsdMillions(spendCr),
      share_pct: toSharePct(spendCr, totalSpendCr),
      unique_items_count: Number(row.unique_items_count),
      unique_vendors_count: vendorsCount,
      active_vendors_count: vendorsCount,
      top_material_group: row.top_material_group
        ? String(row.top_material_group)
        : D1_INGESTION_ANALYTICS_LIMITS.defaultMaterialSegment
    };
  });

export const buildMonthSummaries = (rows: D1Record[]): D1DocumentMonthSummary[] =>
  rows.map((row) => {
    const monthKey = String(row.month_key);
    const spendCr = toCrores(row.spend_inr_cr);
    const recordsCount = Number(row.records_count);
    const vendorsCount = Number(row.unique_vendors_count);
    return {
      month_key: monthKey,
      month_label: formatMonthLabel(monthKey),
      fiscal_year: formatFiscalYear(monthKey),
      spend_inr_cr: spendCr,
      spend_usd_m: toUsdMillions(spendCr),
      records_count: recordsCount,
      po_count: Number(row.po_count),
      line_items_count: recordsCount,
      vendors_count: vendorsCount,
      unique_items_count: Number(row.unique_items_count),
      unique_vendors_count: vendorsCount,
      top_material_group: row.top_material_group
        ? String(row.top_material_group)
        : D1_INGESTION_ANALYTICS_LIMITS.defaultMaterialSegment,
      top_plant: row.top_plant
        ? String(row.top_plant)
        : D1_INGESTION_ANALYTICS_LIMITS.unspecifiedPlantCode
    };
  });
