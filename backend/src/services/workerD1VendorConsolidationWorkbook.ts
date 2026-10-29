import * as XLSX from 'xlsx';
import { MODULE2_D1_VENDOR_CONSOLIDATION } from '../constants/module2VendorConsolidationD1';
import type { VendorConsolidationResult } from '../types/module2VendorConsolidation';

const summaryRows = (result: VendorConsolidationResult): Array<{ metric: string; value: unknown }> => [
  { metric: 'assessmentId', value: result.assessmentId },
  { metric: 'customerName', value: result.customerName || '' },
  { metric: 'totalAssessmentSpendInr', value: result.totalAssessmentSpendInr },
  { metric: 'sameMaterialMultiSourcingSpendInr', value: result.sameMaterialMultiSourcingSpendInr },
  { metric: 'addressableSpendInr', value: result.addressableSpendInr },
  { metric: 'categoriesAnalysedCount', value: result.categoriesAnalysedCount },
  { metric: 'distinctSuppliersCount', value: result.distinctSuppliersCount },
  { metric: 'sameMaterialOpportunityCount', value: result.sameMaterialOpportunities.length },
  { metric: 'excludedTransactionCount', value: result.dataQualityExclusions.reduce(
    (total, exclusion) => total + exclusion.affectedCount, 0
  ) },
  { metric: 'excludedSpendInr', value: result.dataQualityExclusions.reduce(
    (total, exclusion) => total + exclusion.affectedSpendInr, 0
  ) },
  { metric: 'estimatedSavingsInr', value: result.estimatedSavingsInr ?? result.savingsStatus },
  { metric: 'actualSavingsCr', value: result.actualSavingsCr },
  { metric: 'savingsDisclosure', value: result.savingsDisclosure }
];

const supplierRows = (
  result: VendorConsolidationResult
): Array<Record<string, unknown>> => result.categories.flatMap((category) =>
  category.suppliers.map((supplier) => ({
    category: category.spendCategory,
    vendorCode: supplier.vendorCode,
    vendorName: supplier.vendorName,
    spendInr: supplier.spendInr,
    spendSharePct: supplier.spendSharePct,
    materialsCount: supplier.distinctMaterialsCount,
    plantsCount: supplier.distinctPlantsCount,
    purchaseOrderCount: supplier.poCount,
    tailSupplier: supplier.isTailSupplier
  }))
);

const sameMaterialRows = (
  result: VendorConsolidationResult
): Array<Record<string, unknown>> => result.sameMaterialOpportunities.map((item) => ({
  materialCode: item.materialCode,
  materialDescription: item.materialDesc,
  category: item.spendCategory,
  unspscCode: item.unspscCode,
  uom: item.uom,
  historicalSpendInr: item.totalSpendInr,
  quantity: item.totalQuantity,
  suppliers: item.suppliers.map((supplier) => supplier.vendorName).join(', '),
  lowestHistoricalInrPerUnit: item.lowestUnitPrice,
  highestHistoricalInrPerUnit: item.highestUnitPrice,
  historicalPriceVariationPct: item.priceDispersionPct,
  suitability: item.status,
  validationAction: item.nextRecommendedAction
}));

const comparableRows = (result: VendorConsolidationResult): Array<Record<string, unknown>> =>
  result.comparableMaterialOpportunities.flatMap((opportunity) => opportunity.materials.map((material) => ({
    groupId: opportunity.groupId,
    taxonomyCategory: opportunity.categoryName,
    materialCode: material.materialCode,
    materialDescription: material.materialDesc,
    historicalSpendInr: material.spendInr,
    supplierCount: material.vendorCount,
    relationshipLabel: opportunity.relationshipLabel,
    validationBasis: opportunity.similarityBasis
  })));

const transactionRows = (
  result: VendorConsolidationResult
): Array<Record<string, unknown>> => result.transactionsSample.map((row) => ({
  transactionId: row.id || '',
  purchaseOrder: row.po_number || '',
  purchaseOrderLine: row.po_line || '',
  purchaseDate: row.po_date || '',
  supplierCode: row.vendor_code || '',
  supplierName: row.vendor_name,
  materialCode: row.material_code || '',
  materialDescription: row.material_desc,
  quantity: row.quantity,
  uom: row.uom || '',
  normalizedHistoricalSpendInr: row.total_spend_inr,
  sourceCategory: row.spend_category || '',
  unspscCode: row.unspsc_code || ''
}));

const workbookSheets = (result: VendorConsolidationResult): XLSX.WorkSheet[] => [
  XLSX.utils.json_to_sheet(summaryRows(result), { header: ['metric', 'value'] }),
  XLSX.utils.json_to_sheet(result.categories.map((category) => ({
    spendCategory: category.spendCategory,
    unspscCode: category.unspscCode,
    unspscCategory: category.unspscCategory,
    classificationType: category.classificationType,
    totalSpendInr: category.totalSpendInr,
    sameMaterialMultiSourcingSpendInr: category.sameMaterialMultiSourcingSpendInr,
    supplierCount: category.distinctSuppliersCount,
    materialCount: category.distinctMaterialsCount,
    plantCount: category.distinctPlantsCount,
    topSupplierSharePct: category.top1SharePct,
    hhiIndex: category.hhiIndex,
    fragmentationLevel: category.fragmentationLevel,
    opportunityStatus: category.categoryOpportunityStatus,
    estimatedSavingsInr: category.estimatedSavingsInr
  })), { header: ['spendCategory', 'unspscCode', 'unspscCategory', 'classificationType', 'totalSpendInr',
    'sameMaterialMultiSourcingSpendInr', 'supplierCount', 'materialCount', 'plantCount',
    'topSupplierSharePct', 'hhiIndex', 'fragmentationLevel', 'opportunityStatus', 'estimatedSavingsInr'] }),
  XLSX.utils.json_to_sheet(supplierRows(result), { header: ['category', 'vendorCode', 'vendorName', 'spendInr',
    'spendSharePct', 'materialsCount', 'plantsCount', 'purchaseOrderCount', 'tailSupplier'] }),
  XLSX.utils.json_to_sheet(sameMaterialRows(result), { header: ['materialCode', 'materialDescription', 'category',
    'unspscCode', 'uom', 'historicalSpendInr', 'quantity', 'suppliers', 'lowestHistoricalInrPerUnit',
    'highestHistoricalInrPerUnit', 'historicalPriceVariationPct', 'suitability', 'validationAction'] }),
  XLSX.utils.json_to_sheet(comparableRows(result), { header: ['groupId', 'taxonomyCategory', 'materialCode',
    'materialDescription', 'historicalSpendInr', 'supplierCount', 'relationshipLabel', 'validationBasis'] }),
  XLSX.utils.json_to_sheet(result.crossPlantOpportunities, { header: ['code', 'description', 'level',
    'spendCategory', 'distinctPlantsCount', 'plants', 'distinctSuppliersCount', 'suppliers',
    'totalSpendInr', 'status', 'coordinationPotential', 'governanceDisclosure'] }),
  XLSX.utils.json_to_sheet(result.mappingExceptions || [], { header: ['sourceMaterialId', 'sourceDescription',
    'sourceCategory', 'assignedUnspscCode', 'assignedUnspscTitle', 'reviewStatus', 'reviewReason',
    'totalSpendInr', 'transactionCount'] }),
  XLSX.utils.json_to_sheet(transactionRows(result), { header: ['transactionId', 'purchaseOrder', 'purchaseOrderLine',
    'purchaseDate', 'supplierCode', 'supplierName', 'materialCode', 'materialDescription', 'quantity',
    'uom', 'normalizedHistoricalSpendInr', 'sourceCategory', 'unspscCode'] })
];

export const buildVendorConsolidationWorkbook = (result: VendorConsolidationResult): Uint8Array => {
  const workbook = XLSX.utils.book_new();
  workbookSheets(result).forEach((sheet, index) => XLSX.utils.book_append_sheet(
    workbook, sheet, MODULE2_D1_VENDOR_CONSOLIDATION.EXPORT.SHEETS[index]
  ));
  return new Uint8Array(XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer);
};
