import * as XLSX from 'xlsx';
import { MODULE2_D1_VOLUME_EXPORT } from '../constants/module2D1Scoped';
import type { VolumeAggregationResult } from '../types/module2VolumeAggregation';

export const buildVolumeAggregationWorkbook = (result: VolumeAggregationResult): Uint8Array => {
  const workbook = XLSX.utils.book_new();
  const coverageRows = Object.entries(result.coverageSummary).map(([metric, value]) => [metric, value]);
  const opportunities = result.tier1Opportunities.map((item) => ({
    opportunityId: item.opportunityId,
    materialCode: item.materialCode,
    materialDescription: item.materialDesc,
    category: item.category,
    baseUom: item.baseUom,
    plants: item.plants.join(', '),
    supplierCount: item.supplierCount,
    transactionCount: item.transactionCount,
    historicalSpendInr: item.totalHistoricalSpendInr,
    historicalSpendCr: item.totalHistoricalSpendCr,
    aggregatableQuantity: item.aggregatableQuantity,
    status: item.opportunityStatus,
    nextAction: item.nextRecommendedAction
  }));
  const plants = result.plantProfiles.map((item) => ({
    plantCode: item.plantCode,
    historicalSpendInr: item.totalSpendInr,
    historicalSpendCr: item.totalSpendCr,
    transactionCount: item.transactionCount,
    distinctMaterialsCount: item.distinctMaterialsCount,
    supplierCount: item.supplierCount,
    spendSharePct: item.volumeSharePct
  }));
  const materials = result.materialProfiles.map((item) => ({
    materialCode: item.materialCode,
    materialDescription: item.materialDesc,
    category: item.category,
    uom: item.baseUom,
    historicalSpendInr: item.totalSpendInr,
    quantity: item.totalQuantity,
    plantCount: item.plantCount,
    supplierCount: item.supplierCount,
    demandClassification: item.demandClassification,
    uomDataMissing: item.hasIncompatibleUom
  }));
  const sheets = [
    XLSX.utils.aoa_to_sheet([['Metric', 'Value'], ...coverageRows]),
    XLSX.utils.json_to_sheet(opportunities),
    XLSX.utils.json_to_sheet(plants),
    XLSX.utils.json_to_sheet(materials)
  ];
  sheets.forEach((sheet, index) => XLSX.utils.book_append_sheet(
    workbook,
    sheet,
    MODULE2_D1_VOLUME_EXPORT.SHEETS[index]
  ));
  const output = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
  return new Uint8Array(output);
};
