import * as XLSX from 'xlsx';
import { MODULE2_D1_CATEGORY_SPECIALISATION as CONFIG } from '../constants/module2CategorySpecialisationD1';
import type { CategorySpecialisationResult } from '../types/module2CategorySpecialisation';

export const buildCategorySpecialisationWorkbook = (result: CategorySpecialisationResult): Uint8Array => {
  const workbook = XLSX.utils.book_new();
  const summary = Object.entries(result.summary).map(([metric, value]) => ({ metric, value }));
  const categories = result.categories.map((category) => ({
    categoryName: category.categoryName,
    priority: category.priority,
    priorityRationale: category.priorityRationale,
    recommendedApproach: category.recommendedApproach,
    historicalSpendInr: category.annualSpendInr,
    historicalSpendCr: category.annualSpendCr,
    spendSharePct: category.spendSharePct,
    transactionCount: category.transactionCount,
    supplierCount: category.distinctSuppliersCount,
    materialCount: category.distinctMaterialsCount,
    plantCount: category.distinctPlantsCount,
    topSupplierConcentrationPct: category.topSupplierConcentrationPct,
    herfindahlIndex: category.herfindahlIndex,
    contractCoverageAvailable: false,
    dataLimitations: category.dataLimitations
  }));
  const methodology = result.methodologyDisclosures.map((disclosure) => ({ disclosure }));
  [
    XLSX.utils.json_to_sheet(summary, { header: ['metric', 'value'] }),
    XLSX.utils.json_to_sheet(categories),
    XLSX.utils.json_to_sheet(methodology, { header: ['disclosure'] })
  ].forEach((sheet, index) => XLSX.utils.book_append_sheet(workbook, sheet, CONFIG.EXPORT.SHEETS[index]));
  return new Uint8Array(XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer);
};
