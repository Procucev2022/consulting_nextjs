import * as XLSX from 'xlsx';
import { MODULE2_D1_EAUCTION } from '../constants/module2D1Scoped';
import type { EAuctionResult } from '../types/module2EAuction';

export const buildEAuctionWorkbook = (result: EAuctionResult): Uint8Array => {
  const workbook = XLSX.utils.book_new();
  const materials = result.categories.flatMap((category) => category.materials.map((material) => ({
    category: category.spendCategory,
    materialCode: material.materialCode,
    materialDescription: material.materialDesc,
    uom: material.uom,
    financialYear: material.financialYear,
    historicalSpendInr: material.totalSpendInr,
    addressableSpendInr: material.addressableSpendInr,
    purchaseOrderCount: material.poCount,
    supplierCount: material.supplierCount,
    plantCount: material.plantCount,
    suitability: material.suitability,
    evidence: material.evidenceRationale
  })));
  const limitations = result.importantLimitations.map((limitation) => ({ limitation }));
  const summaryRows = [
    { metric: 'assessmentId', value: result.assessmentId },
    { metric: 'selectedFinancialYear', value: result.selectedFinancialYear },
    { metric: 'transactionSpendReviewedInr', value: result.totalSpendReviewedInr },
    { metric: 'candidateAddressableSpendInr', value: result.totalAddressableSpendInr },
    { metric: 'candidateCategories', value: result.candidateCategoriesCount },
    { metric: 'candidateMaterials', value: result.candidateMaterialsCount },
    { metric: 'commerciallyValidatedSavingsInr', value: result.commerciallyValidatedSavingsInr },
    { metric: 'certificationNotice', value: result.certificationNotice }
  ];
  const sheets = [
    XLSX.utils.json_to_sheet(summaryRows, { header: ['metric', 'value'] }),
    XLSX.utils.json_to_sheet(result.categories, {
      header: ['spendCategory', 'totalSpendInr', 'addressableSpendInr', 'distinctMaterialCount', 'poCount',
        'supplierCount', 'plantCount', 'auctionSuitability', 'evidenceBasedRationale', 'dataLimitations']
    }),
    XLSX.utils.json_to_sheet(materials, {
      header: ['category', 'materialCode', 'materialDescription', 'uom', 'financialYear', 'historicalSpendInr',
        'addressableSpendInr', 'purchaseOrderCount', 'supplierCount', 'plantCount', 'suitability', 'evidence']
    }),
    XLSX.utils.json_to_sheet(limitations, { header: ['limitation'] })
  ];
  sheets.forEach((sheet, index) => XLSX.utils.book_append_sheet(
    workbook,
    sheet,
    MODULE2_D1_EAUCTION.EXPORT.SHEETS[index]
  ));
  return new Uint8Array(XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer);
};
