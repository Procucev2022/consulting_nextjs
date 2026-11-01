const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../backend/src/types/module2StrategicSourcing.ts');
let content = fs.readFileSync(filePath, 'utf8');

const target = `export type {
  PrimarySourcingLever,
  ItemSupplierPosition,
  ItemLevelSourcingAnalysis,
  MultiCategoryVendorCategoryItem,
  MultiCategoryVendorAnalysisItem,
  CategoryFiscalYearSpendDenominator
} from './module2ItemAnalysis';`;

const replacement = `import type {
  PrimarySourcingLever,
  ItemSupplierPosition,
  ItemLevelSourcingAnalysis,
  MultiCategoryVendorCategoryItem,
  MultiCategoryVendorAnalysisItem,
  CategoryFiscalYearSpendDenominator
} from './module2ItemAnalysis';

export type {
  PrimarySourcingLever,
  ItemSupplierPosition,
  ItemLevelSourcingAnalysis,
  MultiCategoryVendorCategoryItem,
  MultiCategoryVendorAnalysisItem,
  CategoryFiscalYearSpendDenominator
};`;

if (content.includes(target)) {
  fs.writeFileSync(filePath, content.replace(target, replacement), 'utf8');
  console.log('Successfully updated type import with LF');
} else {
  const targetCRLF = target.replace(/\n/g, '\r\n');
  const replacementCRLF = replacement.replace(/\n/g, '\r\n');
  if (content.includes(targetCRLF)) {
    fs.writeFileSync(filePath, content.replace(targetCRLF, replacementCRLF), 'utf8');
    console.log('Successfully updated type import with CRLF');
  } else {
    console.error('Target not found in file');
  }
}
