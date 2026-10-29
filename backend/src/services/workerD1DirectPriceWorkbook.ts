import * as XLSX from 'xlsx';
import { MODULE2_D1_DIRECT_PRICE } from '../constants/module2D1Scoped';
import type { DirectPriceImprovementResult } from '../types/module2DirectPriceImprovement';

export const buildDirectPriceWorkbook = (result: DirectPriceImprovementResult): Uint8Array => {
  const workbook = XLSX.utils.book_new();
  const summary = [
    { metric: 'assessmentId', value: result.assessmentId },
    { metric: 'selectedFinancialYear', value: result.selectedFinancialYear },
    { metric: 'actualHistoricalSpendInr', value: result.actualSpendInr },
    { metric: 'comparableHistoricalSpendInr', value: result.totalEligibleSpendInr },
    { metric: 'historicalPriceDifferenceInr', value: result.historicalLostOpportunityInr },
    { metric: 'commerciallyValidatedSavingsInr', value: result.commerciallyValidatedSavingsInr },
    { metric: 'certificationNotice', value: result.certificationNotice },
    { metric: 'eligibleTransactions', value: result.totalEligibleTransactions },
    { metric: 'transactionsRequiringReview', value: result.totalIneligibleTransactions }
  ];
  const materials = result.items.map((item) => ({
    materialCode: item.materialCode,
    materialDescription: item.materialDesc,
    category: item.spendCategory,
    uom: item.uom,
    financialYear: item.financialYear,
    transactionCount: item.transactionCount,
    supplierCount: item.supplierCount,
    actualPurchaseCostInr: item.actualPurchaseCostInr,
    lowestObservedInrPerUnit: item.lowestUnitPrice,
    weightedAverageInrPerUnit: item.weightedAveragePrice,
    highestObservedInrPerUnit: item.highestUnitPrice,
    historicalPriceDifferenceInr: item.historicalLostOpportunityInr,
    qualificationStatus: item.qualificationStatus,
    warnings: item.warnings.join(' ')
  }));
  const transactions = result.items.flatMap((item) => item.transactions.map((row) => ({
    ...row,
    materialCode: item.materialCode,
    materialDescription: item.materialDesc,
    category: item.spendCategory,
    uom: item.uom
  })));
  const sheets = [
    XLSX.utils.json_to_sheet(summary, { header: ['metric', 'value'] }),
    XLSX.utils.json_to_sheet(result.categorySummaries, {
      header: ['spendCategory', 'distinctMaterialCount', 'eligibleTransactionCount', 'eligibleSpendInr',
        'actualPurchaseCostInr', 'benchmarkCostInr', 'historicalLostOpportunityInr', 'dataQualityStatus']
    }),
    XLSX.utils.json_to_sheet(materials, {
      header: ['materialCode', 'materialDescription', 'category', 'uom', 'financialYear', 'transactionCount',
        'supplierCount', 'actualPurchaseCostInr', 'lowestObservedInrPerUnit', 'weightedAverageInrPerUnit',
        'highestObservedInrPerUnit', 'historicalPriceDifferenceInr', 'qualificationStatus', 'warnings']
    }),
    XLSX.utils.json_to_sheet(transactions, {
      header: ['id', 'poNumber', 'poDate', 'financialYear', 'supplierName', 'supplierCode', 'plantCode', 'quantity',
        'unitPrice', 'totalSpendInr', 'benchmarkUnitPrice', 'benchmarkCostInr', 'historicalLostOpportunityInr',
        'qualificationStatus', 'warning', 'materialCode', 'materialDescription', 'category', 'uom']
    })
  ];
  sheets.forEach((sheet, index) => XLSX.utils.book_append_sheet(
    workbook, sheet, MODULE2_D1_DIRECT_PRICE.EXPORT.SHEETS[index]
  ));
  return new Uint8Array(XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer);
};
