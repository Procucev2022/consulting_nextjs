import { moduleCertificationEngine } from '../src/services/certificationEngine';
import fs from 'fs';
import path from 'path';

const datasetPath = path.resolve(__dirname, '../../frontend/sample_datasets/Purchase_History_Multi_Currency_Sample.xlsx');
const results = moduleCertificationEngine.validateRealDataset(datasetPath, 'Purchase_History_Multi_Currency_Sample.xlsx');

fs.writeFileSync(
  path.resolve(__dirname, '../real_data_validation_results.json'),
  JSON.stringify(results, null, 2)
);

console.log('REAL DATA VALIDATION COMPLETE');
console.log('Record Count:', results.records.length);
console.log('Module 1 Certified:', results.module1Certified);
console.log('Module 2 Certified:', results.module2Certified);
console.log('Module 1 Gates Passed:', results.module1Gates.filter((g) => g.passed).length, '/', results.module1Gates.length);
console.log('Module 2 Gates Passed:', results.module2Gates.filter((g) => g.passed).length, '/', results.module2Gates.length);
