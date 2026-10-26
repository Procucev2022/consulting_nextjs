import { AssessmentDatasetParser } from './backend/src/services/assessmentDatasetParser';

const filePath = 'data/dev/assessments/AIC-2026-0002/uploads/Borosil_PO_Consol_Excluding_BSL_Pune.xlsx';

console.log('Parsing Borosil dataset with updated AssessmentDatasetParser...');
const startTime = Date.now();
const result = AssessmentDatasetParser.parseDataset(filePath, {
  assessmentId: 'AIC-2026-0002',
  dataVersionId: 'DV-001',
  fileName: 'Borosil_PO_Consol_Excluding_BSL_Pune.xlsx',
  baseCurrency: 'INR'
});

console.log(`Parsed in ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
console.log('--- DATASET METRICS ---');
console.log('Source rows:', result.data.sourceRowCount);
console.log('Valid rows:', result.data.validRowCount);
console.log('Excluded rows:', result.data.excludedRowCount);
console.log('Anomaly rows:', result.data.anomalyRowCount);
console.log('Duplicate row count:', result.data.duplicateRowCount);

console.log('--- SPEND METRICS ---');
console.log('Total Converted INR Spend (Cr):', result.module1.totalConvertedInrSpendCr);
console.log('Customer Profile Spend (Cr):', result.module1.customerProfileSpendCr);

console.log('--- CURRENCY STATS ---');
console.log('Currencies detected:', result.currency.currenciesDetected);
console.log('Transaction counts by currency:', result.currency.transactionCountByCurrency);
console.log('Original spend by currency:', result.currency.originalSpendByCurrency);
console.log('Converted INR spend by currency:', result.currency.convertedSpendInrByCurrency);

// Check classification counts on validRows
const classCounts: Record<string, number> = {};
const classSpendCr: Record<string, number> = {};
for (const r of result.validRows) {
  const c = r.transactionClassification || 'UNCLASSIFIED';
  classCounts[c] = (classCounts[c] || 0) + 1;
  classSpendCr[c] = (classSpendCr[c] || 0) + r.lineSpendCr;
}
console.log('--- TRANSACTION CLASSIFICATIONS ---');
console.log('Counts:', classCounts);
console.log('Spend Cr:', classSpendCr);

